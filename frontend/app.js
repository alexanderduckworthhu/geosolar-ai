const CLASS_COLORS = ["#e07a3d", "#e2a45a", "#a8b0b8", "#4f8ec9", "#2d6cdf"];
const TAU = Math.PI * 2;

const $ = (id) => document.getElementById(id);
const t = () => I18N[lang];

let lang = localStorage.getItem("geosolar-lang") || "en";
if (!I18N[lang]) lang = "en";

let DATA = null;
let ROOFS = null;
let mode = "mean";
let cityId = "ch";
let floor = 1;
let showBase = localStorage.getItem("geosolar-base") !== "off";
let view = showBase ? "roofs" : "hex";
let pinned = null;
let layer = null;
let hoverId = null;
let visRoofIds = [];
let hitGrid = null;
const HIT_CELL = 24;

let roofCanvas = null;
let roofCtx = null;
let markCanvas = null;
let markCtx = null;

const CH_BOUNDS = [
  [45.82, 5.96],
  [47.81, 10.49],
];

const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
  minZoom: 6,
  maxZoom: 18,
  zoomSnap: 0,
  zoomDelta: 1,
  wheelPxPerZoomLevel: 20,
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false,
  maxBounds: [
    [45.2, 5.2],
    [48.4, 11.3],
  ],
  maxBoundsViscosity: 0.7,
}).setView([46.8, 8.23], 7);

map.createPane("roads");
map.getPane("roads").style.zIndex = 340;
map.getPane("roads").style.pointerEvents = "none";
map.createPane("labels");
map.getPane("labels").style.zIndex = 350;
map.getPane("labels").style.pointerEvents = "none";

const TILE_OPTS = {
  maxZoom: 19,
  maxNativeZoom: 19,
  updateWhenIdle: false,
  updateWhenZooming: true,
  keepBuffer: 6,
};
const imageryLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  TILE_OPTS
);
const roadsLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  { pane: "roads", ...TILE_OPTS }
);
const placesLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  { pane: "labels", ...TILE_OPTS }
);
const BASE_LAYERS = [imageryLayer, roadsLayer, placesLayer];
if (showBase) BASE_LAYERS.forEach((lyr) => lyr.addTo(map));

function lerpColor(a, b, t) {
  const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16));
  const pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function unpackRoofs(raw) {
  const n = raw.n;
  const lat = new Float64Array(n);
  const lon = new Float64Array(n);
  const k = new Uint8Array(n);
  const slope = new Int16Array(n);
  const aspect = new Int16Array(n);
  const area = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = raw.rows[i];
    lat[i] = r[0];
    lon[i] = r[1];
    k[i] = r[2];
    slope[i] = r[3];
    aspect[i] = r[4];
    area[i] = r[5];
  }
  return { n, lat, lon, k, slope, aspect, area };
}

function colorForHex(hex) {
  if (hex.mean_klasse < floor) return "#101a16";
  if (mode === "pct4") {
    const tPct = Math.min(1, hex.pct4 / 55);
    return lerpColor("e07a3d", "2d6cdf", tPct);
  }
  const x = hex.mean_klasse;
  const i = Math.max(0, Math.min(3, Math.floor(x) - 1));
  const u = x - Math.floor(x);
  return lerpColor(CLASS_COLORS[i].slice(1), CLASS_COLORS[i + 1].slice(1), u);
}

function colorForRoof(k) {
  if (k < floor) return "#15211c";
  if (mode === "pct4") return k >= 4 ? "#2d6cdf" : "#e07a3d";
  return CLASS_COLORS[k - 1];
}

function cityById(id) {
  return DATA.cities.find((c) => c.id === id);
}

function inCity(lat, lon, city) {
  if (city.id === "ch") return true;
  const dlat = (lat - city.lat) * 111;
  const dlon = (lon - city.lon) * 111 * Math.cos((city.lat * Math.PI) / 180);
  return Math.hypot(dlat, dlon) <= city.radius_km;
}

function hexInCity(hex, city) {
  return inCity(hex.lat, hex.lon, city);
}

function visibleHexes() {
  const city = cityById(cityId);
  return DATA.hexes.filter((h) => hexInCity(h, city));
}

let allRoofIds = null;

function recomputeRoofIds() {
  const city = cityById(cityId);
  if (city.id === "ch") {
    if (!allRoofIds) {
      allRoofIds = new Array(ROOFS.n);
      for (let i = 0; i < ROOFS.n; i++) allRoofIds[i] = i;
    }
    visRoofIds = allRoofIds;
    return;
  }
  const ids = [];
  for (let i = 0; i < ROOFS.n; i++) {
    if (inCity(ROOFS.lat[i], ROOFS.lon[i], city)) ids.push(i);
  }
  visRoofIds = ids;
}

function aggregate(hexes) {
  if (!hexes.length) return DATA.national;
  const counts = [0, 0, 0, 0, 0];
  let n = 0;
  let slope = 0;
  hexes.forEach((h) => {
    n += h.n;
    slope += h.mean_slope * h.n;
    h.counts.forEach((c, i) => {
      counts[i] += c;
    });
  });
  const mean = counts.reduce((s, c, i) => s + c * (i + 1), 0) / n;
  const pct4 = (100 * (counts[3] + counts[4])) / n;
  const pct5 = (100 * counts[4]) / n;
  return {
    n,
    mean_klasse: mean,
    pct4,
    pct5,
    counts,
    mean_slope: slope / n,
  };
}

function aggregateRoofs(ids) {
  if (!ids.length) return DATA.national;
  const counts = [0, 0, 0, 0, 0];
  let slope = 0;
  ids.forEach((i) => {
    counts[ROOFS.k[i] - 1] += 1;
    slope += ROOFS.slope[i];
  });
  const n = ids.length;
  const mean = counts.reduce((s, c, i) => s + c * (i + 1), 0) / n;
  return {
    n,
    mean_klasse: mean,
    pct4: (100 * (counts[3] + counts[4])) / n,
    pct5: (100 * counts[4]) / n,
    counts,
    mean_slope: slope / n,
  };
}

function roofRecord(i) {
  const k = ROOFS.k[i];
  const counts = [0, 0, 0, 0, 0];
  counts[k - 1] = 1;
  return {
    i,
    lat: ROOFS.lat[i],
    lon: ROOFS.lon[i],
    klasse: k,
    mean_klasse: k,
    pct4: k >= 4 ? 100 : 0,
    pct5: k === 5 ? 100 : 0,
    counts,
    n: 1,
    mean_slope: ROOFS.slope[i],
    mean_aspect: ROOFS.aspect[i],
    mean_area: ROOFS.area[i],
  };
}

function renderBars(counts) {
  const n = counts.reduce((s, c) => s + c, 0) || 1;
  $("bars").innerHTML = counts
    .map(
      (c, i) =>
        `<i style="width:${Math.max(0.6, (100 * c) / n)}%;background:${CLASS_COLORS[i]}" title="${t().classes[i]} ${c}"></i>`
    )
    .join("");
}

function paintFloorLabel() {
  const el = $("floor-label");
  el.textContent = String(floor);
  el.style.color = CLASS_COLORS[floor - 1];
}

function fmt(n) {
  return Math.round(n).toLocaleString(t().locale);
}

function fmt1(x, digits) {
  return Number(x).toLocaleString(t().locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function renderStats(stats, title, kicker, sub, insight) {
  $("place-kicker").textContent = kicker;
  $("place-name").textContent = title;
  $("place-sub").textContent = sub;
  const one = view === "roofs" && stats.n === 1;
  $("m-mean").textContent = fmt1(stats.mean_klasse, one ? 0 : 1);
  $("m-pct4").textContent = fmt1(stats.pct4, stats.n === 1 ? 0 : 1);
  $("insight").innerHTML = insight;
  renderBars(stats.counts);
}

function insightFor(stats, scope) {
  const vs = DATA.national.pct4;
  const delta = stats.pct4 - vs;
  const i = t();
  if (Math.abs(delta) < 0.15) {
    return i.insightSame(fmt1(stats.pct4, 1), fmt1(stats.mean_slope, 0));
  }
  const dir = delta >= 0 ? i.ahead : i.behind;
  return i.insightDelta(scope, fmt1(Math.abs(delta), 1), dir, fmt1(stats.pct4, 1), fmt1(vs, 1), fmt1(stats.mean_slope, 0));
}

function insightRoof(r) {
  const i = t();
  return i.insightRoof(r.klasse, i.classes[r.klasse - 1], r.mean_slope, r.mean_aspect, fmt1(r.mean_area, 1));
}

function showDefault() {
  const i = t();
  const city = cityById(cityId);
  const title = city.id === "ch" ? i.allRoofs : city.name;
  const kicker = city.id === "ch" ? i.switzerland : i.city;
  if (view === "roofs") {
    const stats = aggregateRoofs(visRoofIds);
    renderStats(stats, title, kicker, i.subRoofs(fmt(stats.n)), insightFor(stats, title));
    return;
  }
  const vis = visibleHexes();
  const stats = aggregate(vis);
  renderStats(stats, title, kicker, i.subHex(fmt(stats.n), fmt(vis.length)), insightFor(stats, title));
}

function showHex(hex, pinnedHex) {
  const i = t();
  const kicker = pinnedHex ? i.pinnedHex : i.preview;
  const title = `${hex.lat.toFixed(3)}°N  ${hex.lon.toFixed(3)}°E`;
  renderStats(
    hex,
    title,
    kicker,
    i.subHexPin(fmt(hex.n), hex.mean_slope, hex.mean_aspect),
    insightFor(hex, i.thisCell)
  );
}

function showRoof(r, pinnedRoof) {
  const i = t();
  const kicker = pinnedRoof ? i.pinnedRoof : i.preview;
  const title = `${r.lat.toFixed(6)}°N  ${r.lon.toFixed(6)}°E`;
  renderStats(
    r,
    title,
    kicker,
    i.subRoofPin(fmt1(r.mean_area, 1), r.mean_slope, r.mean_aspect),
    insightRoof(r)
  );
}

function styleHex(hex) {
  const active = pinned && pinned.q === hex.q && pinned.r === hex.r;
  const hovered = hoverId && hoverId.q === hex.q && hoverId.r === hex.r;
  const dim = hex.mean_klasse < floor;
  return {
    color: active ? "#dce8f6" : hovered ? "#4f8ec9" : showBase ? "rgba(243,234,220,0.35)" : "rgba(243,234,220,0.22)",
    weight: active ? 2.2 : hovered ? 1.6 : showBase ? 0.7 : 0.55,
    fillColor: colorForHex(hex),
    fillOpacity: dim
      ? showBase
        ? 0.12
        : 0.22
      : hovered || active
        ? showBase
          ? 0.72
          : 0.95
        : showBase
          ? 0.46
          : 0.88,
  };
}

function paintHexes() {
  if (layer) map.removeLayer(layer);
  const vis = visibleHexes();
  layer = L.geoJSON(
    {
      type: "FeatureCollection",
      features: vis.map((h) => ({
        type: "Feature",
        properties: h,
        geometry: { type: "Polygon", coordinates: [h.ring] },
      })),
    },
    {
      style: (f) => styleHex(f.properties),
      onEachFeature: (f, lyr) => {
        const h = f.properties;
        lyr.on("mouseover", () => {
          hoverId = h;
          if (!pinned) showHex(h, false);
          lyr.setStyle(styleHex(h));
        });
        lyr.on("mouseout", () => {
          hoverId = null;
          if (!pinned) showDefault();
          lyr.setStyle(styleHex(h));
        });
        lyr.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          pinned = h;
          showHex(h, true);
          layer.eachLayer((l) => l.setStyle(styleHex(l.feature.properties)));
        });
      },
    }
  ).addTo(map);
}

function hexBounds(hexes) {
  const bounds = L.latLngBounds([]);
  hexes.forEach((h) => {
    h.ring.forEach(([lon, lat]) => bounds.extend([lat, lon]));
  });
  return bounds;
}

function setupCanvas() {
  map.createPane("roofs");
  const pane = map.getPane("roofs");
  pane.style.zIndex = 450;
  pane.style.pointerEvents = "none";
  roofCanvas = L.DomUtil.create("canvas", "roof-canvas", pane);
  markCanvas = L.DomUtil.create("canvas", "roof-canvas", pane);
  roofCtx = roofCanvas.getContext("2d");
  markCtx = markCanvas.getContext("2d");
  roofCanvas.style.display = "none";
  markCanvas.style.display = "none";
  let drawRaf = 0;
  let drawHits = false;
  const scheduleDraw = (hits) => {
    if (view !== "roofs") return;
    if (hits) drawHits = true;
    if (drawRaf) return;
    drawRaf = requestAnimationFrame(() => {
      drawRaf = 0;
      const hitsNow = drawHits;
      drawHits = false;
      drawRoofs(hitsNow);
    });
  };
  map.on("move zoom", () => scheduleDraw(false));
  map.on("moveend zoomend resize viewreset", () => scheduleDraw(true));
}

function syncCanvas(canvas, ctx) {
  const size = map.getSize();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(size.x * dpr);
  const h = Math.round(size.y * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
  }
  L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.x, size.y);
  return size;
}

function pointRadius() {
  const z = map.getZoom();
  if (z < 8) return 0.85;
  if (z < 10) return 1.35;
  if (z < 12) return 2.1;
  if (z < 14) return 3.2;
  return 4.8;
}

function rebuildHitGrid() {
  hitGrid = new Map();
  const bounds = map.getBounds().pad(0.04);
  visRoofIds.forEach((i) => {
    const lat = ROOFS.lat[i];
    const lon = ROOFS.lon[i];
    if (lat < bounds.getSouth() || lat > bounds.getNorth() || lon < bounds.getWest() || lon > bounds.getEast()) {
      return;
    }
    const p = map.latLngToContainerPoint([lat, lon]);
    const key = `${Math.floor(p.x / HIT_CELL)},${Math.floor(p.y / HIT_CELL)}`;
    const arr = hitGrid.get(key);
    if (arr) arr.push(i);
    else hitGrid.set(key, [i]);
  });
}

function nearestRoof(containerPoint) {
  if (!hitGrid) return -1;
  const gx = Math.floor(containerPoint.x / HIT_CELL);
  const gy = Math.floor(containerPoint.y / HIT_CELL);
  const rHit = Math.max(10, pointRadius() * 2.6);
  let best = -1;
  let bestD = rHit * rHit;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const arr = hitGrid.get(`${gx + dx},${gy + dy}`);
      if (!arr) continue;
      arr.forEach((i) => {
        const q = map.latLngToContainerPoint([ROOFS.lat[i], ROOFS.lon[i]]);
        const d = (q.x - containerPoint.x) ** 2 + (q.y - containerPoint.y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
    }
  }
  return best;
}

function drawRoofs(rebuildHits = true) {
  if (view !== "roofs" || !roofCtx) return;
  syncCanvas(roofCanvas, roofCtx);
  syncCanvas(markCanvas, markCtx);
  const r = pointRadius();
  const bounds = map.getBounds().pad(0.04);
  visRoofIds.forEach((i) => {
    const lat = ROOFS.lat[i];
    const lon = ROOFS.lon[i];
    if (lat < bounds.getSouth() || lat > bounds.getNorth() || lon < bounds.getWest() || lon > bounds.getEast()) {
      return;
    }
    const p = map.latLngToContainerPoint([lat, lon]);
    const k = ROOFS.k[i];
    roofCtx.fillStyle = colorForRoof(k);
    if (r <= 1.2) {
      roofCtx.fillRect(p.x, p.y, 1.4, 1.4);
    } else {
      roofCtx.beginPath();
      roofCtx.arc(p.x, p.y, r, 0, TAU);
      roofCtx.fill();
      roofCtx.lineWidth = 0.8;
      roofCtx.strokeStyle = "rgba(8,17,14,0.7)";
      roofCtx.stroke();
    }
  });
  if (rebuildHits) rebuildHitGrid();
  drawMarks();
}

function drawMarks() {
  if (!markCtx) return;
  const size = map.getSize();
  markCtx.clearRect(0, 0, size.x, size.y);
  const ids = [];
  if (typeof hoverId === "number" && hoverId >= 0) ids.push({ i: hoverId, pin: false });
  if (pinned && typeof pinned.i === "number") ids.push({ i: pinned.i, pin: true });
  ids.forEach(({ i, pin }) => {
    const p = map.latLngToContainerPoint([ROOFS.lat[i], ROOFS.lon[i]]);
    const rad = Math.max(5, pointRadius() + 2);
    markCtx.beginPath();
    markCtx.arc(p.x, p.y, rad + (pin ? 3 : 1.5), 0, TAU);
    markCtx.strokeStyle = pin ? "#f7e6c4" : "#e07a3d";
    markCtx.lineWidth = pin ? 2 : 1.4;
    markCtx.stroke();
  });
}

let hasFitted = false;

function fitView() {
  map.invalidateSize();
  const fly = hasFitted;
  hasFitted = true;
  if (view === "roofs") {
    if (cityId === "ch") {
      const opts = { padding: [28, 28], maxZoom: 7.6 };
      if (fly) map.flyToBounds(CH_BOUNDS, { ...opts, duration: 0.7 });
      else map.fitBounds(CH_BOUNDS, { ...opts, animate: false });
    } else {
      const city = cityById(cityId);
      if (fly) map.flyTo([city.lat, city.lon], 14.6, { duration: 0.7 });
      else map.setView([city.lat, city.lon], 14.6, { animate: false });
    }
  } else if (cityId === "ch") {
    const opts = { padding: [28, 28], maxZoom: 7.6 };
    if (fly) map.flyToBounds(CH_BOUNDS, { ...opts, duration: 0.7 });
    else map.fitBounds(CH_BOUNDS, { ...opts, animate: false });
  } else {
    const vis = visibleHexes();
    if (!vis.length) return;
    const opts = { padding: [52, 52], maxZoom: 11.6 };
    if (fly) map.flyToBounds(hexBounds(vis), { ...opts, duration: 0.7 });
    else map.fitBounds(hexBounds(vis), { ...opts, animate: false });
  }
}

function applyLang() {
  const i = t();
  document.documentElement.lang = lang;
  document.title = i.title;
  $("caption").innerHTML = view === "roofs" ? i.captionRoofs : i.captionHex;
  $("hint").textContent = view === "roofs" ? i.hintRoofs : i.hintHex;
  $("btn-hex").textContent = i.viewHex;
  $("btn-roofs").textContent = i.viewRoofs;
  $("btn-base-on").textContent = i.mapOn;
  $("btn-base-off").textContent = i.mapOff;
  $("lbl-floor").textContent = i.classFloor;
  $("btn-mean").textContent = i.meanClass;
  $("btn-pct4").textContent = i.pct45;
  $("lbl-mean-metric").textContent = i.meanMetric;
  $("lbl-pct-metric").textContent = i.pctMetric;
  $("chart-title").textContent = i.chartTitle;
  $("axis-low").textContent = i.axisLow;
  $("axis-high").textContent = i.axisHigh;
  $("leg-low").textContent = i.legendLow;
  $("leg-good").textContent = i.legendGood;
  $("leg-ex").textContent = i.legendExcellent;
  $("leg-floor").textContent = i.legendFloor;
  document.querySelectorAll("#langs button").forEach((b) => {
    b.classList.toggle("on", b.dataset.lang === lang);
  });
  if (DATA) {
    const n = DATA.national;
    $("baseline").innerHTML = i.baseline(fmt1(n.mean_klasse, 1), fmt1(n.pct4, 1));
    if (pinned && pinned.i != null) showRoof(pinned, true);
    else if (pinned && pinned.q != null) showHex(pinned, true);
    else showDefault();
  }
}

function setBase(on) {
  const next = Boolean(on);
  const turningOn = next && !showBase;
  showBase = next;
  localStorage.setItem("geosolar-base", showBase ? "on" : "off");
  $("map").classList.toggle("no-base", !showBase);
  $("btn-base-on").classList.toggle("on", showBase);
  $("btn-base-off").classList.toggle("on", !showBase);
  BASE_LAYERS.forEach((lyr) => {
    if (showBase) {
      if (!map.hasLayer(lyr)) lyr.addTo(map);
    } else if (map.hasLayer(lyr)) {
      map.removeLayer(lyr);
    }
  });
  const tilePane = map.getPane("tilePane");
  const roadsPane = map.getPane("roads");
  const labelPane = map.getPane("labels");
  if (tilePane) tilePane.style.display = showBase ? "" : "none";
  if (roadsPane) roadsPane.style.display = showBase ? "" : "none";
  if (labelPane) labelPane.style.display = showBase ? "" : "none";
  if (turningOn) {
    setViewMode("roofs");
    return;
  }
  if (layer) layer.eachLayer((l) => l.setStyle(styleHex(l.feature.properties)));
}

function setLang(next) {
  lang = next;
  localStorage.setItem("geosolar-lang", next);
  applyLang();
}

function setViewMode(next) {
  view = next;
  pinned = null;
  hoverId = null;
  document.querySelectorAll("#view-row button").forEach((b) => {
    b.classList.toggle("on", b.dataset.view === next);
  });
  applyLang();
  paint();
  fitView();
  showDefault();
}

function paint() {
  if (view === "roofs") {
    if (layer) {
      map.removeLayer(layer);
      layer = null;
    }
    roofCanvas.style.display = "block";
    markCanvas.style.display = "block";
    recomputeRoofIds();
    drawRoofs();
    return;
  }
  roofCanvas.style.display = "none";
  markCanvas.style.display = "none";
  paintHexes();
}

function goCity(id) {
  cityId = id;
  pinned = null;
  hoverId = null;
  document.querySelectorAll("#city-row button").forEach((b) => {
    b.classList.toggle("on", b.dataset.city === id);
  });
  paint();
  fitView();
  showDefault();
}

function addCityLabels() {
  DATA.cities
    .filter((c) => c.id !== "ch")
    .forEach((c) => {
      L.marker([c.lat, c.lon], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "city-label",
          html: c.name,
          iconSize: [0, 0],
        }),
      }).addTo(map);
    });
}

function unpin() {
  if (!pinned) return;
  pinned = null;
  hoverId = null;
  if (view === "roofs") {
    drawMarks();
    showDefault();
    return;
  }
  if (layer) layer.eachLayer((l) => l.setStyle(styleHex(l.feature.properties)));
  showDefault();
}

async function init() {
  const [hexPayload, roofPayload] = await Promise.all([
    fetch("data/hexes.json?v=2").then((r) => r.json()),
    fetch("data/roofs.json").then((r) => r.json()),
  ]);
  DATA = hexPayload;
  ROOFS = unpackRoofs(roofPayload);
  setupCanvas();
  applyLang();

  const row = $("city-row");
  DATA.cities.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.city = c.id;
    b.textContent = c.id === "ch" ? "CH" : c.name;
    if (c.id === "ch") b.classList.add("on");
    b.addEventListener("click", () => goCity(c.id));
    row.appendChild(b);
  });
  document.querySelectorAll("#view-row button").forEach((b) => {
    b.classList.toggle("on", b.dataset.view === view);
    b.addEventListener("click", () => setViewMode(b.dataset.view));
  });
  document.querySelectorAll("#base-row button").forEach((b) => {
    b.addEventListener("click", () => setBase(b.dataset.base === "on"));
  });
  document.querySelectorAll("#langs button").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });
  document.querySelectorAll("#mode-row button").forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      document.querySelectorAll("#mode-row button").forEach((x) => x.classList.toggle("on", x === b));
      paint();
    });
  });
  $("class-floor").addEventListener("input", (e) => {
    floor = Number(e.target.value);
    paintFloorLabel();
    paint();
  });
  map.on("click", (e) => {
    if (view === "roofs") {
      const i = nearestRoof(e.containerPoint);
      if (i >= 0) {
        pinned = roofRecord(i);
        showRoof(pinned, true);
        drawMarks();
        return;
      }
    }
    unpin();
  });
  map.on("mousemove", (e) => {
    if (view !== "roofs" || pinned) return;
    const i = nearestRoof(e.containerPoint);
    if (i === hoverId) return;
    hoverId = i;
    if (i >= 0) showRoof(roofRecord(i), false);
    else showDefault();
    drawMarks();
  });
  map.on("mouseout", () => {
    if (view !== "roofs" || pinned) return;
    hoverId = null;
    showDefault();
    drawMarks();
  });
  window.addEventListener("resize", () => {
    map.invalidateSize();
    fitView();
  });
  addCityLabels();
  setBase(showBase);
  paintFloorLabel();
  paint();
  showDefault();
  requestAnimationFrame(() => {
    map.invalidateSize();
    fitView();
  });
}

init();

window.GeoSolar = {
  goCity,
  setViewMode,
  setLang,
  map,
  setBase,
  setFloor: (n) => {
    floor = Number(n);
    $("class-floor").value = String(n);
    paintFloorLabel();
    paint();
  },
  setMode: (m) => {
    mode = m;
    document.querySelectorAll("#mode-row button").forEach((x) =>
      x.classList.toggle("on", x.dataset.mode === m)
    );
    paint();
  },
};
