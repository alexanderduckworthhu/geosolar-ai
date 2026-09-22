const API_BASE = "";

const COLORS = {
  1: "#6b7c93",
  2: "#c4b056",
  3: "#e09b2d",
  4: "#e26a21",
  5: "#c81e1e",
};

const ASPECT_WORDS = (deg) => {
  const d = Number(deg);
  if (Math.abs(d) >= 157.5) return `${d}° north`;
  if (d <= -112.5) return `${d}° north-east`;
  if (d <= -67.5) return `${d}° east`;
  if (d <= -22.5) return `${d}° south-east`;
  if (d < 22.5) return `${d}° south`;
  if (d < 67.5) return `${d}° south-west`;
  if (d < 112.5) return `${d}° west`;
  return `${d}° north-west`;
};

const $ = (id) => document.getElementById(id);

const map = L.map("map").setView([46.82, 8.23], 8);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

let marker = null;
let metrics = null;

function setMarker(lat, lon) {
  const latlng = [lat, lon];
  if (marker) marker.setLatLng(latlng);
  else marker = L.marker(latlng).addTo(map);
  $("latitude").value = Number(lat).toFixed(6);
  $("longitude").value = Number(lon).toFixed(6);
}

map.on("click", (e) => setMarker(e.latlng.lat, e.latlng.lng));

$("aspect_deg").addEventListener("input", (e) => {
  $("aspect-value").textContent = ASPECT_WORDS(e.target.value);
});

function applyBounds(ranges) {
  ["latitude", "longitude", "roof_area_m2", "slope_deg"].forEach((id) => {
    const el = $(id);
    el.min = ranges[id].min;
    el.max = ranges[id].max;
  });
}

function fillExample() {
  const ex = metrics.example_input;
  $("latitude").value = ex.latitude;
  $("longitude").value = ex.longitude;
  $("roof_area_m2").value = ex.roof_area_m2;
  $("slope_deg").value = ex.slope_deg;
  $("aspect_deg").value = Math.round(ex.aspect_deg);
  $("aspect-value").textContent = ASPECT_WORDS($("aspect_deg").value);
  setMarker(ex.latitude, ex.longitude);
  map.setView([ex.latitude, ex.longitude], 14);
}

function showError(msg) {
  const err = $("error");
  err.hidden = !msg;
  err.textContent = msg || "";
}

function renderResult(data) {
  $("result").hidden = false;
  $("result-class").textContent = data.klasse;
  $("result-class").style.color = COLORS[data.klasse];
  $("result-label").textContent = data.label;
  const box = $("proba");
  box.innerHTML = "";
  const labels = metrics.class_labels;
  Object.keys(labels)
    .sort()
    .forEach((k) => {
      const p = data.probabilities[k] ?? 0;
      const row = document.createElement("div");
      row.className = "proba-row";
      row.innerHTML = `
        <span>${k} ${labels[k].split(" / ")[0]}</span>
        <div class="bar"><span style="width:${(p * 100).toFixed(1)}%;background:${COLORS[k]}"></span></div>
        <span>${(p * 100).toFixed(1)}%</span>`;
      box.appendChild(row);
    });
}

$("predict-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const btn = $("predict-btn");
  btn.disabled = true;
  btn.textContent = "Predicting…";
  const payload = {
    latitude: Number($("latitude").value),
    longitude: Number($("longitude").value),
    roof_area_m2: Number($("roof_area_m2").value),
    slope_deg: Number($("slope_deg").value),
    aspect_deg: Number($("aspect_deg").value),
  };
  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      showError(JSON.stringify(body.detail || body, null, 2));
      $("result").hidden = true;
      return;
    }
    renderResult(body);
  } catch (err) {
    showError("API is not reachable. Start uvicorn app.main:app --host 127.0.0.1 --port 8000");
    $("result").hidden = true;
  } finally {
    btn.disabled = false;
    btn.textContent = "PREDICT SOLAR POTENTIAL";
  }
});

$("example-btn").addEventListener("click", fillExample);

(async function init() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error("metrics");
    metrics = await res.json();
    applyBounds(metrics.feature_ranges_train);
    fillExample();
  } catch (err) {
    showError("Could not load /metrics. Is the API running?");
  }
})();
