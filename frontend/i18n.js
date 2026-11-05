const I18N = {
  en: {
    title: "GeoSolar AI — Swiss rooftop solar",
    navMap: "Map",
    navAbout: "About",
    aboutTitle: "About GeoSolar AI",
    aboutHtml: `
      <h1>About</h1>
      <p class="lead">A small map of Swiss rooftops and how well they suit solar panels.</p>
      <p>Switzerland has already rated about 10 million roofs (Sonnendach.ch — BFE, swisstopo, MeteoSwiss), from class 1 (low) to 5 (excellent). Neighbourhood hexes are counted from that full cadastre. Each-roof view shows a random sample of 100,000 official points so the page stays light. Nothing here is made up, and it does not predict kWh — the official class is already based on irradiation.</p>
      <h2>Two views</h2>
      <p><strong>Each roof</strong> is the cadastre point itself. <strong>Hex 2.4 km</strong> groups nearby roofs so you can see a neighbourhood mix. A cell on the Rhine can overlap Austria or Liechtenstein even when every roof in it is Swiss; the white country line is a simplified outline.</p>
      <p><span class="em">Blue</span> is high suitability (class 4–5). <span class="dim">Orange</span> is low (class 1–2). Search an address, Swiss postcode or coordinates (WGS84 or LV95), or use your location. You can jump to a city, turn the satellite on or off, and switch the interface between English, German, French and Italian.</p>
      <p>The map is the cadastre. Ask the panel about a city, a class, or the current view. The answer uses these official counts and can open the city it names. This is a side project, not a product. Data: <a href="https://opendata.swiss/de/dataset/eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie">opendata.swiss</a>. Code: <a href="https://github.com/alexanderduckworthhu/geosolar-ai">GitHub</a>.</p>
    `,
    captionHex:
      'Tap a cell. <span class="em">Blue</span> is high suitability (class 4–5). <span class="dim">Orange</span> is low (class 1–2). Cells are 2.4 km clusters from Sonnendach.ch.',
    captionRoofs:
      'Each mark is <span class="em">one sampled roof</span> — the official Sonnendach MultiPoint, not a neighbourhood average.',
    hintHex: "Hover to preview · click to pin · scroll to zoom",
    hintRoofs: "Hover a roof · click to pin · scroll to zoom",
    hintHexTouch: "Tap a cell · pinch to zoom",
    hintRoofsTouch: "Tap a roof · pinch to zoom",
    searchLabel: "Search",
    searchPlaceholder: "Address, postcode or coordinates",
    searchEmpty: "No place found in Switzerland",
    searchClear: "Clear search",
    searchWgs: "WGS84",
    searchLv95: "LV95",
    searchAddress: "Address",
    searchPlz: "Postcode",
    locate: "Locate",
    locateFail: "Could not read your location",
    locateOutside: "That point is outside Switzerland",
    loadHex: "Loading neighbourhoods…",
    loadRoofs: "Loading 100,000 roofs…",
    sheetMore: "Controls",
    sheetLess: "Map",
    viewHex: "Hex 2.4 km",
    viewRoofs: "Each roof",
    mapOn: "Map",
    mapOff: "No map",
    bordersOn: "Borders",
    bordersOff: "No borders",
    classFloor: "Class floor",
    zoom: "Zoom",
    zoomOut: "CH",
    zoomIn: "City",
    meanClass: "Mean class",
    pct45: "Class 4–5",
    meanMetric: "mean class",
    pctMetric: "% class 4–5",
    chartTitle: "Class mix",
    legendLow: "Low suitability",
    legendGood: "Good",
    legendExcellent: "Excellent",
    legendFloor: "Below class floor",
    switzerland: "Switzerland",
    city: "City",
    allRoofs: "All sampled roofs",
    preview: "Preview",
    pinnedHex: "Pinned cell",
    pinnedRoof: "Pinned roof",
    classes: ["low", "medium", "good", "very good", "excellent"],
    axisLow: "1 low",
    axisHigh: "5 excellent",
    ahead: "ahead of",
    behind: "behind",
    thisCell: "This cell",
    locale: "en-CH",
    subHex: (n, h) => `${n} roofs · ${h} cells · 2.4 km`,
    subRoofs: (n) => `${n} roofs · official MultiPoint`,
    subHexPin: (n, slope, aspect) => `${n} roofs · mean slope ${slope}° · aspect ${aspect}°`,
    subRoofPin: (area, slope, aspect) => `${area} m² · slope ${slope}° · aspect ${aspect}°`,
    insightSame: (pct, slope) =>
      `Class 4–5 roofs are <strong>${pct}%</strong> of this set — the same mix as Switzerland. Mean slope ${slope}°.`,
    insightDelta: (scope, abs, dir, pct, vs, slope) =>
      `${scope} is <strong>${abs}</strong> points ${dir} Switzerland on class 4–5 roofs (${pct}% vs ${vs}%). Mean slope ${slope}°.`,
    insightRoof: (k, label, slope, aspect, area) =>
      `Official Sonnendach class <strong>${k}</strong> (${label}). Slope ${slope}°, aspect ${aspect}°, ${area} m² — the cadastre MultiPoint.`,
    askLabel: "Chat",
    askClose: "Close",
    askPlaceholder: "Example: Give me the stats of Thun",
    askButton: "Send",
    askOpen: (name) => `Open ${name}`,
    askHelp:
      "Ask for a city’s stats, which city is highest, or tell me to open a city, switch the view, or set the class floor.",
    askNoModel: "No language model is connected to this page, so I can’t answer as an assistant yet.",
    askNoGpu: "This browser can’t run the assistant. It needs WebGPU.",
    askLoading: (pct) => `Loading the assistant… ${pct}%`,
    askUnknown:
      "That's outside this map. I only answer questions about GeoSolar AI: Swiss roofs, the official class, the cities, and the controls on this page.",
    askOffTopicCity: (name) =>
      `That's outside this map. I don't cover that. Ask for the roofs in ${name} if that's what you meant.`,
    askScopeHex: (name, n, cells, mean, pct) =>
      `${name} is on screen: ${n} roofs in ${cells} cells of 2.4 km, mean class ${mean}, ${pct}% class 4–5.`,
    askScopeRoofs: (name, n, mean, pct) =>
      `${name} is showing ${n} sampled roofs, mean class ${mean}, ${pct}% class 4–5. This view is 100,000 official points.`,
    askClassCount: (k, label, n, pct, scope) =>
      `Class ${k} (${label}) is ${n} roofs in ${scope}, ${pct}% of that set.`,
    askRoads: "This map does not draw roads. The satellite shows the ground, and the city names stay.",
    askPrice:
      "Prices, subsidies, and installers are not on this map. What I can tell you is the official class, from 1 (low) to 5 (excellent).",
    askAspect:
      "Aspect is the direction of the roof face. In this cadastre south is 0°, and the value runs from −180° to 180°. Slope and aspect are already part of the official class.",
    askDownload: "This page is a viewer. The cadastre is published on opendata.swiss, from Sonnendach.ch.",
    askUpdated: "The class on the map is the published Sonnendach rating. This page does not run a newer survey.",
    askAccurate: "The colour is the official class, copied from the cadastre. This chat does not make a second guess.",
    askHello: "Hello. Ask about a city, a class, the colours, or what this view is showing.",
    askThanks: "Anytime. Ask about a city, a class, or the view you have open.",
    askWhat:
      "GeoSolar AI is a map of Swiss roofs and their official Sonnendach class, from 1 (low) to 5 (excellent). Hexes count the full cadastre. Each-roof view draws 100,000 official points.",
    askSource:
      "The classes come from Sonnendach.ch: BFE, swisstopo, and MeteoSwiss, published on opendata.swiss. This map does not invent a second rating.",
    askKwh:
      "There is no kWh figure. The official class is already based on irradiation, so a yield number would only restate that class.",
    askHex:
      "A hex is a 2.4 km cell. Its colour and its count come from every official roof inside it.",
    askFace:
      "One point is one roof face, not a whole building. A house with several faces has several points.",
    askCircle:
      "A city here is a circle around its centre, not the municipal border. The stats are the roofs inside that circle.",
    askLang: "The page is in English, German, French, and Italian. Use EN, DE, FR, or IT, or name the language.",
    askLangDone: "The page is in English.",
    askSearch: "Search an address, a Swiss postcode, or coordinates in WGS84 or LV95. Locate uses this device.",
    askHouse:
      "Search the address, then open each roof. That view is a sample of 100,000 points, so one house can be missing. The hex for that place still counts the full cadastre.",
    askPinHow: "Hover a cell or a roof to preview it, then click to pin it. On a phone, tap.",
    askAi:
      "I answer from the cadastre already loaded on this map: cities, classes, and the current view. I do not guess a new class, and I do not estimate kWh.",
    askCities: (list) => `The city chips are ${list}. Each one is a circle.`,
    askSlope:
      "Slope and aspect come from the cadastre. A useful slope and a south-facing face are already part of the official class. Pin a roof to read its own numbers.",
    askGrey: "Grey is the middle of the scale, around class 3. Blue is class 4–5. Orange is class 1–2.",
    askZoom: "Scroll to zoom, or use the zoom slider. CH fits the country. City zooms into the selected circle.",
    askShare: "The address bar keeps the language, the view, and the city, so a link opens the same map.",
    askLakes:
      "Hexes cover Switzerland, lakes included. Neighbouring countries stay on the satellite. A cell on the border can sit against a simplified country line.",
    askWhySample:
      "Drawing all 10 million roofs would be too heavy for the browser. Hexes already count every one. Each-roof view keeps 100,000 official points.",
    askMeanMode:
      "Mean class colours a cell by its average. Class 4–5 colours it by the share of strong roofs. Say “colour by mean” or “colour by class 4–5” to switch.",
    askFloorExplain: "The class floor dims anything below the number you set. Those roofs stay on the map.",
    askAbout: "This is a side project for reading the official roof cadastre, not a product and not a yield calculator.",
    askGithub: "The code is on GitHub, under alexanderduckworthhu/geosolar-ai.",
    askCantons: "The chips are cities, drawn as circles. The map does not switch to canton or municipality shapes.",
    askLocate: "Looking up this device. The map moves only if the point is in Switzerland.",
    askHere: (name) => `This view is ${name}.`,
    askModeMean: "Colouring by mean class.",
    askModePct: "Colouring by the share of class 4–5.",
    askBest: (name, pct, mean, n) =>
      `<strong>${name}</strong> has the highest share of class 4–5 roofs among these cities: ${pct}%, mean class ${mean}, from ${n} roofs in the full cadastre.`,
    askWorst: (name, pct, mean, n) =>
      `<strong>${name}</strong> has the lowest share of class 4–5 roofs among these cities: ${pct}%, mean class ${mean}, from ${n} roofs in the full cadastre.`,
    askCity: (name, n, mean, pct, slope, abs, dir, vs) =>
      `<strong>${name}</strong>: ${n} roofs, mean class ${mean}, ${pct}% class 4–5, mean slope ${slope}°. ${abs} points ${dir} Switzerland (${vs}% class 4–5). Full cadastre.`,
    askCitySame: (name, n, mean, pct, slope) =>
      `<strong>${name}</strong>: ${n} roofs, mean class ${mean}, ${pct}% class 4–5, mean slope ${slope}°. Same class 4–5 mix as Switzerland. Full cadastre.`,
    askVersus: (a, ap, an, b, bp, bn) =>
      `<strong>${a}</strong> is ${ap}% class 4–5 (${an} roofs). <strong>${b}</strong> is ${bp}% (${bn} roofs). Both counts are the full cadastre.`,
    bitRoofs: (name, n) => `<strong>${name}</strong> has ${n} roofs.`,
    bitMean: (name, mean) => `<strong>${name}</strong> averages class ${mean}.`,
    bitPct: (name, pct) => `<strong>${name}</strong> is ${pct}% class 4–5.`,
    bitSlope: (name, slope) => `Roofs in <strong>${name}</strong> average a ${slope}° slope.`,
    bitShort: (name, pct, mean) => `<strong>${name}</strong>: ${pct}% class 4–5, mean class ${mean}.`,
    bitAhead: (name, pct) => `<strong>${name}</strong> is ahead of Switzerland on class 4–5, at ${pct}%.`,
    bitBehind: (name, pct) => `<strong>${name}</strong> is behind Switzerland on class 4–5, at ${pct}%.`,
    bitMatch: (name, pct) => `<strong>${name}</strong> matches Switzerland on class 4–5, at ${pct}%.`,
    bitIsTop: (name, pct) => `<strong>${name}</strong> is the highest of these cities, at ${pct}% class 4–5.`,
    bitNotTop: (name, pct, top, topPct) =>
      `<strong>${name}</strong> is not the highest, at ${pct}% class 4–5. <strong>${top}</strong> is, at ${topPct}%.`,
    bitVersusPct: (a, ap, b, bp) => `<strong>${a}</strong> is ${ap}% class 4–5. <strong>${b}</strong> is ${bp}%.`,
    bitVersusN: (a, an, b, bn) => `<strong>${a}</strong> has ${an} roofs. <strong>${b}</strong> has ${bn}.`,
    bitVersusMean: (a, am, b, bm) => `<strong>${a}</strong> averages class ${am}. <strong>${b}</strong> averages class ${bm}.`,
    bitVersusSlope: (a, as, b, bs) => `<strong>${a}</strong> averages ${as}°. <strong>${b}</strong> averages ${bs}°.`,
    bitWinner: (winner, wp, loser, lp) =>
      `<strong>${winner}</strong> is higher on class 4–5: ${wp}% against ${lp}% in <strong>${loser}</strong>.`,
    askRank: (list) => `By share of class 4–5 roofs: ${list}.`,
    askClass: (k, label) =>
      `Class ${k} is ${label}. The scale runs from 1, low, to 5, excellent. The colour on the map is Switzerland’s official rating.`,
    askCountHex: (scope, n, cells, pct) =>
      `${scope} counts ${n} roofs in ${cells} cells of 2.4 km, from the full cadastre. ${pct}% are class 4–5.`,
    askCountRoofs: (scope, n, pct) =>
      `${scope} is showing ${n} sampled roofs, and ${pct}% of this sample are class 4–5. The sample is 100,000 official points, not the full cadastre.`,
    askSample:
      "Hex cells count the full cadastre, about 10 million roofs. Each-roof view draws a sample of 100,000 official points. Both use the official class. There is no kWh figure.",
    askColors:
      "Blue is class 4–5, high suitability. Orange is class 1–2, low. Grey sits in the middle. The class is the official Sonnendach rating.",
    askPinnedHex: (n, pct, mean, slope) =>
      `This cell has ${n} roofs, mean class ${mean}, ${pct}% class 4–5, mean slope ${slope}°. The count is the full cadastre.`,
    askPinnedRoof: (k, label, area, slope, aspect) =>
      `This roof is official class ${k} (${label}), ${area} m², slope ${slope}°, aspect ${aspect}°. A building can have several faces, so several points.`,
    askNoPin: "Pin a cell or a roof first, then ask about it.",
    askViewHex: "Hex view is on. Cells are 2.4 km and count the full cadastre.",
    askViewRoofs: "Each-roof view is on. These are 100,000 sampled official points.",
    askFloor: (n) => `Class floor is ${n}. Anything below that is dimmed.`,
    askLooseFloor: (n) => `I set the class floor to ${n}, so anything below that is dimmed. That was the closest control for this request.`,
    askLooseSlope: (name, slope, list) =>
      `<strong>${name}</strong> has the steepest roofs of these cities, mean slope ${slope}°. By slope: ${list}.`,
    askLooseFlat: (name, slope, list) =>
      `<strong>${name}</strong> has the flattest roofs of these cities, mean slope ${slope}°. By slope: ${list}.`,
    askLoose: (place, n, mean, pct) =>
      `That stays on this map, but it doesn’t name a city, a class, or a control. You’re on ${place}: ${n} roofs, mean class ${mean}, ${pct}% class 4–5. Name one of those and I can answer it.`,
    askMapOn: "Satellite is on.",
    askMapOff: "Satellite is off.",
    askBordersOn: "Borders are on.",
    askBordersOff: "Borders are off.",
    askNational: (n, mean, pct) =>
      `Switzerland’s cadastre here is ${n} roofs, mean class ${mean}, ${pct}% class 4–5.`,
    baseline: (mean, pct) =>
      `Across Switzerland, roofs average class <strong>${mean}</strong> and <strong>${pct}%</strong> class 4–5.`,
  },
  de: {
    title: "GeoSolar AI — Schweizer Dachflächen",
    navMap: "Karte",
    navAbout: "Über",
    aboutTitle: "Über GeoSolar AI",
    aboutHtml: `
      <h1>Über das Projekt</h1>
      <p class="lead">Eine kleine Karte Schweizer Dächer und ihrer Eignung für Solarenergie.</p>
      <p>Die Schweiz hat bereits rund 10 Millionen Dächer bewertet (Sonnendach.ch — BFE, swisstopo, MeteoSwiss), Klasse 1 (gering) bis 5 (hervorragend). Die Hex-Nachbarschaften zählen das ganze Kataster. Die Dachansicht zeigt eine Zufallsstichprobe von 100'000 offiziellen Punkten, damit die Seite leicht bleibt. Nichts ist erfunden, und es gibt keine kWh-Prognose — die offizielle Klasse beruht schon auf der Einstrahlung.</p>
      <h2>Zwei Ansichten</h2>
      <p><strong>Jedes Dach</strong> ist der Katasterpunkt selbst. <strong>Hex 2,4 km</strong> fasst benachbarte Dächer zusammen. Eine Zelle am Rhein kann nach Österreich oder Liechtenstein ragen, auch wenn jedes Dach darin schweizerisch ist; die weisse Landesgrenze ist vereinfacht.</p>
      <p><span class="em">Blau</span> steht für hohe Eignung (Klasse 4–5). <span class="dim">Orange</span> für geringe (Klasse 1–2). Suche nach Adresse, PLZ oder Koordinaten (WGS84 oder LV95), oder nutze den Standort. Man kann zu einer Stadt springen, das Satellitenbild ein- oder ausschalten und die Oberfläche auf Deutsch, Französisch, Italienisch oder Englisch stellen.</p>
      <p>Die Karte ist der Kataster. Im Feld kann man nach einer Stadt, einer Klasse oder der aktuellen Ansicht fragen. Die Antwort nutzt diese offiziellen Zahlen und kann die genannte Stadt öffnen. Ein Nebenprojekt, kein Produkt. Daten: <a href="https://opendata.swiss/de/dataset/eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie">opendata.swiss</a>. Code: <a href="https://github.com/alexanderduckworthhu/geosolar-ai">GitHub</a>.</p>
    `,
    captionHex:
      'Zelle wählen. <span class="em">Blau</span> steht für hohe Eignung (Klasse 4–5). <span class="dim">Orange</span> für geringe (Klasse 1–2). Zellen: 2,4 km aus Sonnendach.ch.',
    captionRoofs:
      'Jeder Punkt ist <span class="em">ein beprobtes Dach</span> — der offizielle Sonnendach-MultiPoint, kein Nachbarschaftsmittel.',
    hintHex: "Hover prüft · Klick pinnt · Scroll zoomt",
    hintRoofs: "Dach anfahren · Klick pinnt · Scroll zoomt",
    hintHexTouch: "Zelle tippen · kneifen zum Zoomen",
    hintRoofsTouch: "Dach tippen · kneifen zum Zoomen",
    searchLabel: "Suche",
    searchPlaceholder: "Adresse, PLZ oder Koordinaten",
    searchEmpty: "Kein Ort in der Schweiz gefunden",
    searchClear: "Suche löschen",
    searchWgs: "WGS84",
    searchLv95: "LV95",
    searchAddress: "Adresse",
    searchPlz: "PLZ",
    locate: "Standort",
    locateFail: "Standort nicht lesbar",
    locateOutside: "Dieser Punkt liegt ausserhalb der Schweiz",
    loadHex: "Nachbarschaften laden…",
    loadRoofs: "100'000 Dächer laden…",
    sheetMore: "Steuerung",
    sheetLess: "Karte",
    viewHex: "Hex 2,4 km",
    viewRoofs: "Jedes Dach",
    mapOn: "Karte",
    mapOff: "Ohne Karte",
    bordersOn: "Grenzen",
    bordersOff: "Ohne Grenzen",
    classFloor: "Klassenschwelle",
    zoom: "Zoom",
    zoomOut: "CH",
    zoomIn: "Stadt",
    meanClass: "Mittlere Klasse",
    pct45: "Klasse 4–5",
    meanMetric: "mittlere Klasse",
    pctMetric: "% Klasse 4–5",
    chartTitle: "Klassenmix",
    legendLow: "Geringe Eignung",
    legendGood: "Gut",
    legendExcellent: "Hervorragend",
    legendFloor: "Unter der Schwelle",
    switzerland: "Schweiz",
    city: "Stadt",
    allRoofs: "Alle beprobten Dächer",
    preview: "Vorschau",
    pinnedHex: "Fixierte Zelle",
    pinnedRoof: "Fixiertes Dach",
    classes: ["gering", "mittel", "gut", "sehr gut", "hervorragend"],
    axisLow: "1 gering",
    axisHigh: "5 hervorragend",
    ahead: "vor",
    behind: "hinter",
    thisCell: "Diese Zelle",
    locale: "de-CH",
    subHex: (n, h) => `${n} Dächer · ${h} Zellen · 2,4 km`,
    subRoofs: (n) => `${n} Dächer · offizieller MultiPoint`,
    subHexPin: (n, slope, aspect) => `${n} Dächer · mittlere Neigung ${slope}° · Ausrichtung ${aspect}°`,
    subRoofPin: (area, slope, aspect) => `${area} m² · Neigung ${slope}° · Ausrichtung ${aspect}°`,
    insightSame: (pct, slope) =>
      `Klasse 4–5 macht <strong>${pct}%</strong> dieses Ausschnitts aus — derselbe Mix wie die Schweiz. Mittlere Neigung ${slope}°.`,
    insightDelta: (scope, abs, dir, pct, vs, slope) =>
      `${scope} liegt <strong>${abs}</strong> Punkte ${dir} der Schweiz bei Klasse 4–5 (${pct}% vs ${vs}%). Mittlere Neigung ${slope}°.`,
    insightRoof: (k, label, slope, aspect, area) =>
      `Offizielle Sonnendach-Klasse <strong>${k}</strong> (${label}). Neigung ${slope}°, Ausrichtung ${aspect}°, ${area} m² — der Kataster-MultiPoint.`,
    askLabel: "Chat",
    askClose: "Schliessen",
    askPlaceholder: "Beispiel: Gib mir die Zahlen von Thun",
    askButton: "Senden",
    askOpen: (name) => `${name} öffnen`,
    askHelp:
      "Frag nach den Zahlen einer Stadt, welche Stadt am höchsten liegt, oder sag, eine Stadt zu öffnen, die Ansicht zu wechseln oder die Klassenschwelle zu setzen.",
    askNoModel: "Mit dieser Seite ist kein Sprachmodell verbunden, deshalb kann ich noch nicht als Assistent antworten.",
    askNoGpu: "Dieser Browser kann den Assistenten nicht ausführen. Es braucht WebGPU.",
    askLoading: (pct) => `Assistent wird geladen… ${pct}%`,
    askUnknown:
      "Das liegt ausserhalb dieser Karte. Ich beantworte nur Fragen zu GeoSolar AI: Schweizer Dächer, die offizielle Klasse, die Städte und die Steuerung auf dieser Seite.",
    askOffTopicCity: (name) =>
      `Das liegt ausserhalb dieser Karte. Danach frage ich nicht. Frag nach den Dächern in ${name}, wenn du das meintest.`,
    askScopeHex: (name, n, cells, mean, pct) =>
      `${name} ist offen: ${n} Dächer in ${cells} Zellen von 2,4 km, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5.`,
    askScopeRoofs: (name, n, mean, pct) =>
      `${name} zeigt ${n} Dächer der Stichprobe, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5. Diese Ansicht hat 100'000 offizielle Punkte.`,
    askClassCount: (k, label, n, pct, scope) =>
      `Klasse ${k} (${label}) sind ${n} Dächer in ${scope}, ${pct}% dieser Menge.`,
    askRoads: "Diese Karte zeichnet keine Strassen. Das Satellitenbild zeigt den Boden, die Städtenamen bleiben.",
    askPrice:
      "Preise, Förderungen und Installateure stehen nicht auf dieser Karte. Was ich sagen kann, ist die offizielle Klasse, von 1 (gering) bis 5 (hervorragend).",
    askAspect:
      "Die Ausrichtung ist die Richtung der Dachfläche. In diesem Kataster ist Süden 0°, der Wert läuft von −180° bis 180°. Neigung und Ausrichtung stecken schon in der offiziellen Klasse.",
    askDownload: "Diese Seite ist ein Betrachter. Das Kataster liegt auf opendata.swiss, von Sonnendach.ch.",
    askUpdated: "Die Klasse auf der Karte ist die veröffentlichte Sonnendach-Bewertung. Diese Seite macht keine neuere Erhebung.",
    askAccurate: "Die Farbe ist die offizielle Klasse, aus dem Kataster übernommen. Dieser Chat schätzt keine zweite Klasse.",
    askHello: "Hallo. Frag nach einer Stadt, einer Klasse, den Farben oder der offenen Ansicht.",
    askThanks: "Gern. Frag nach einer Stadt, einer Klasse oder der Ansicht.",
    askWhat:
      "GeoSolar AI ist eine Karte Schweizer Dächer und ihrer offiziellen Sonnendach-Klasse, von 1 (gering) bis 5 (hervorragend). Hex-Zellen zählen das ganze Kataster. Die Dachansicht zeichnet 100'000 offizielle Punkte.",
    askSource:
      "Die Klassen kommen von Sonnendach.ch: BFE, swisstopo und MeteoSchweiz, veröffentlicht auf opendata.swiss. Diese Karte erfindet keine zweite Bewertung.",
    askKwh:
      "Es gibt keine kWh-Zahl. Die offizielle Klasse beruht schon auf der Einstrahlung, eine Ertragszahl würde sie nur wiederholen.",
    askHex:
      "Ein Hex ist eine Zelle von 2,4 km. Farbe und Anzahl kommen von jedem offiziellen Dach darin.",
    askFace:
      "Ein Punkt ist eine Dachfläche, nicht ein ganzes Gebäude. Ein Haus mit mehreren Flächen hat mehrere Punkte.",
    askCircle:
      "Eine Stadt ist hier ein Kreis um den Mittelpunkt, nicht die Gemeindegrenze. Die Zahlen sind die Dächer in diesem Kreis.",
    askLang: "Die Seite gibt es auf Deutsch, Französisch, Italienisch und Englisch. Nimm DE, FR, IT oder EN, oder nenne die Sprache.",
    askLangDone: "Die Seite ist auf Deutsch.",
    askSearch: "Suche eine Adresse, eine PLZ oder Koordinaten in WGS84 oder LV95. Standort nutzt dieses Gerät.",
    askHouse:
      "Suche die Adresse und öffne dann jedes Dach. Diese Ansicht ist eine Stichprobe von 100'000 Punkten, ein einzelnes Haus kann fehlen. Die Hex-Zelle an diesem Ort zählt trotzdem das ganze Kataster.",
    askPinHow: "Fahre über eine Zelle oder ein Dach für die Vorschau, dann klicke zum Fixieren. Auf dem Telefon tippen.",
    askAi:
      "Ich antworte aus dem Kataster, das schon auf dieser Karte liegt: Städte, Klassen und die aktuelle Ansicht. Ich schätze keine neue Klasse und keine kWh.",
    askCities: (list) => `Die Stadtschalter sind ${list}. Jede Stadt ist ein Kreis.`,
    askSlope:
      "Neigung und Ausrichtung kommen aus dem Kataster. Eine brauchbare Neigung und eine Südfläche stecken schon in der offiziellen Klasse. Fixiere ein Dach, um seine Zahlen zu lesen.",
    askGrey: "Grau ist die Mitte der Skala, um Klasse 3. Blau ist Klasse 4–5. Orange ist Klasse 1–2.",
    askZoom: "Scrollen zoomt, oder der Schieber. CH zeigt das Land. Stadt zoomt in den gewählten Kreis.",
    askShare: "Die Adresszeile behält Sprache, Ansicht und Stadt, ein Link öffnet dieselbe Karte.",
    askLakes:
      "Die Hex-Zellen decken die Schweiz ab, inklusive der Seen. Nachbarländer bleiben auf dem Satellitenbild. Eine Zelle an der Grenze kann an einer vereinfachten Landeslinie liegen.",
    askWhySample:
      "Alle 10 Millionen Dächer zu zeichnen wäre zu schwer für den Browser. Die Hex-Zellen zählen schon jedes. Die Dachansicht behält 100'000 offizielle Punkte.",
    askMeanMode:
      "Mittlere Klasse färbt eine Zelle nach dem Durchschnitt. Klasse 4–5 färbt nach dem Anteil starker Dächer. Sag „färbe nach Mittel“ oder „färbe nach Klasse 4–5“.",
    askFloorExplain: "Die Klassenschwelle dimmt alles unter der gesetzten Zahl. Diese Dächer bleiben auf der Karte.",
    askAbout: "Das ist ein Nebenprojekt zum Lesen des offiziellen Dachkatasters, kein Produkt und kein Ertragsrechner.",
    askGithub: "Der Code liegt auf GitHub, unter alexanderduckworthhu/geosolar-ai.",
    askCantons: "Die Schalter sind Städte, als Kreise gezeichnet. Die Karte wechselt nicht zu Kantons- oder Gemeindeformen.",
    askLocate: "Ich suche dieses Gerät. Die Karte rückt nur, wenn der Punkt in der Schweiz liegt.",
    askHere: (name) => `Diese Ansicht ist ${name}.`,
    askModeMean: "Gefärbt nach mittlerer Klasse.",
    askModePct: "Gefärbt nach dem Anteil Klasse 4–5.",
    askBest: (name, pct, mean, n) =>
      `<strong>${name}</strong> hat den höchsten Anteil an Klasse 4–5 unter diesen Städten: ${pct}%, im Mittel Klasse ${mean}, aus ${n} Dächern im ganzen Kataster.`,
    askWorst: (name, pct, mean, n) =>
      `<strong>${name}</strong> hat den niedrigsten Anteil an Klasse 4–5 unter diesen Städten: ${pct}%, im Mittel Klasse ${mean}, aus ${n} Dächern im ganzen Kataster.`,
    askCity: (name, n, mean, pct, slope, abs, dir, vs) =>
      `<strong>${name}</strong>: ${n} Dächer, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5, mittlere Neigung ${slope}°. ${abs} Punkte ${dir} der Schweiz (${vs}% Klasse 4–5). Ganzes Kataster.`,
    askCitySame: (name, n, mean, pct, slope) =>
      `<strong>${name}</strong>: ${n} Dächer, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5, mittlere Neigung ${slope}°. Derselbe Klasse-4–5-Mix wie die Schweiz. Ganzes Kataster.`,
    askVersus: (a, ap, an, b, bp, bn) =>
      `<strong>${a}</strong> hat ${ap}% Klasse 4–5 (${an} Dächer). <strong>${b}</strong> hat ${bp}% (${bn} Dächer). Beides ist das ganze Kataster.`,
    bitRoofs: (name, n) => `<strong>${name}</strong> hat ${n} Dächer.`,
    bitMean: (name, mean) => `<strong>${name}</strong> liegt im Mittel bei Klasse ${mean}.`,
    bitPct: (name, pct) => `<strong>${name}</strong> hat ${pct}% Klasse 4–5.`,
    bitSlope: (name, slope) => `Die Dächer in <strong>${name}</strong> haben im Mittel ${slope}° Neigung.`,
    bitShort: (name, pct, mean) => `<strong>${name}</strong>: ${pct}% Klasse 4–5, im Mittel Klasse ${mean}.`,
    bitAhead: (name, pct) => `<strong>${name}</strong> liegt bei Klasse 4–5 vor der Schweiz, bei ${pct}%.`,
    bitBehind: (name, pct) => `<strong>${name}</strong> liegt bei Klasse 4–5 hinter der Schweiz, bei ${pct}%.`,
    bitMatch: (name, pct) => `<strong>${name}</strong> trifft die Schweiz bei Klasse 4–5, bei ${pct}%.`,
    bitIsTop: (name, pct) => `<strong>${name}</strong> ist die höchste dieser Städte, bei ${pct}% Klasse 4–5.`,
    bitNotTop: (name, pct, top, topPct) =>
      `<strong>${name}</strong> ist nicht die höchste, bei ${pct}% Klasse 4–5. <strong>${top}</strong> ist es, bei ${topPct}%.`,
    bitVersusPct: (a, ap, b, bp) => `<strong>${a}</strong> hat ${ap}% Klasse 4–5. <strong>${b}</strong> hat ${bp}%.`,
    bitVersusN: (a, an, b, bn) => `<strong>${a}</strong> hat ${an} Dächer. <strong>${b}</strong> hat ${bn}.`,
    bitVersusMean: (a, am, b, bm) => `<strong>${a}</strong> liegt im Mittel bei Klasse ${am}. <strong>${b}</strong> bei Klasse ${bm}.`,
    bitVersusSlope: (a, as, b, bs) => `<strong>${a}</strong> hat im Mittel ${as}°. <strong>${b}</strong> hat ${bs}°.`,
    bitWinner: (winner, wp, loser, lp) =>
      `<strong>${winner}</strong> liegt bei Klasse 4–5 höher: ${wp}% gegen ${lp}% in <strong>${loser}</strong>.`,
    askRank: (list) => `Nach Anteil Klasse 4–5: ${list}.`,
    askClass: (k, label) =>
      `Klasse ${k} ist ${label}. Die Skala geht von 1, gering, bis 5, hervorragend. Die Farbe auf der Karte ist die offizielle Bewertung der Schweiz.`,
    askCountHex: (scope, n, cells, pct) =>
      `${scope} zählt ${n} Dächer in ${cells} Zellen von 2,4 km, aus dem ganzen Kataster. ${pct}% sind Klasse 4–5.`,
    askCountRoofs: (scope, n, pct) =>
      `${scope} zeigt ${n} Dächer aus der Stichprobe, davon ${pct}% Klasse 4–5. Die Stichprobe hat 100'000 offizielle Punkte, nicht das ganze Kataster.`,
    askSample:
      "Die Hex-Zellen zählen das ganze Kataster, rund 10 Millionen Dächer. Jedes Dach zeigt eine Stichprobe von 100'000 offiziellen Punkten. Beides nutzt die offizielle Klasse. Es gibt keine kWh-Zahl.",
    askColors:
      "Blau ist Klasse 4–5, hohe Eignung. Orange ist Klasse 1–2, gering. Grau liegt dazwischen. Die Klasse ist die offizielle Sonnendach-Bewertung.",
    askPinnedHex: (n, pct, mean, slope) =>
      `Diese Zelle hat ${n} Dächer, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5, mittlere Neigung ${slope}°. Gezählt ist das ganze Kataster.`,
    askPinnedRoof: (k, label, area, slope, aspect) =>
      `Dieses Dach ist offizielle Klasse ${k} (${label}), ${area} m², Neigung ${slope}°, Ausrichtung ${aspect}°. Ein Gebäude kann mehrere Flächen haben, also mehrere Punkte.`,
    askNoPin: "Zuerst eine Zelle oder ein Dach pinnen, dann danach fragen.",
    askViewHex: "Die Hex-Ansicht ist an. Die Zellen sind 2,4 km und zählen das ganze Kataster.",
    askViewRoofs: "Die Ansicht Jedes Dach ist an. Das sind 100'000 offizielle Punkte aus der Stichprobe.",
    askFloor: (n) => `Die Klassenschwelle ist ${n}. Darunter wird abgeblendet.`,
    askLooseFloor: (n) => `Die Klassenschwelle steht auf ${n}, darunter wird abgeblendet. Das war die passendste Steuerung für diese Anfrage.`,
    askLooseSlope: (name, slope, list) =>
      `<strong>${name}</strong> hat die steilsten Dächer dieser Städte, im Mittel ${slope}°. Nach Neigung: ${list}.`,
    askLooseFlat: (name, slope, list) =>
      `<strong>${name}</strong> hat die flachsten Dächer dieser Städte, im Mittel ${slope}°. Nach Neigung: ${list}.`,
    askLoose: (place, n, mean, pct) =>
      `Das bleibt auf dieser Karte, nennt aber keine Stadt, keine Klasse und keine Steuerung. Offen ist ${place}: ${n} Dächer, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5. Nenne eines davon, dann kann ich antworten.`,
    askMapOn: "Das Satellitenbild ist an.",
    askMapOff: "Das Satellitenbild ist aus.",
    askBordersOn: "Die Grenzen sind an.",
    askBordersOff: "Die Grenzen sind aus.",
    askNational: (n, mean, pct) =>
      `Das Kataster der Schweiz umfasst hier ${n} Dächer, im Mittel Klasse ${mean}, ${pct}% Klasse 4–5.`,
    baseline: (mean, pct) =>
      `In der Schweiz liegen Dächer im Mittel bei Klasse <strong>${mean}</strong> und <strong>${pct}%</strong> Klasse 4–5.`,
  },
  fr: {
    title: "GeoSolar AI — Toits solaires suisses",
    navMap: "Carte",
    navAbout: "À propos",
    aboutTitle: "À propos de GeoSolar AI",
    aboutHtml: `
      <h1>À propos</h1>
      <p class="lead">Une petite carte des toits suisses et de leur aptitude solaire.</p>
      <p>La Suisse a déjà classé environ 10 millions de toits (Sonnendach.ch — OFEN, swisstopo, MétéoSuisse), de la classe 1 (faible) à 5 (excellent). Les hexagones comptent tout le cadastre. La vue toit par toit montre un échantillon de 100&nbsp;000 points officiels pour garder la page légère. Rien n’est inventé, et il n’y a pas de prévision en kWh — la classe officielle repose déjà sur l’irradiation.</p>
      <h2>Deux vues</h2>
      <p><strong>Chaque toit</strong> est le point du cadastre. <strong>Hex 2,4 km</strong> regroupe les toits voisins. Une cellule sur le Rhin peut empiéter sur l’Autriche ou le Liechtenstein même si chaque toit est suisse ; le trait blanc du pays est simplifié.</p>
      <p>Le <span class="em">bleu</span> signale une haute aptitude (classes 4–5). L’<span class="dim">orange</span> une faible (classes 1–2). Cherchez une adresse, un NPA ou des coordonnées (WGS84 ou MN95), ou utilisez votre position. On peut sauter à une ville, activer ou non le satellite, et passer l’interface en français, allemand, italien ou anglais.</p>
      <p>La carte est le cadastre. Le panneau répond à une question sur une ville, une classe ou la vue en cours. La réponse utilise ces chiffres officiels et peut ouvrir la ville citée. Un projet parallèle, pas un produit. Données : <a href="https://opendata.swiss/de/dataset/eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie">opendata.swiss</a>. Code : <a href="https://github.com/alexanderduckworthhu/geosolar-ai">GitHub</a>.</p>
    `,
    captionHex:
      'Choisissez une cellule. Le <span class="em">bleu</span> signale une haute aptitude (classes 4–5). L’<span class="dim">orange</span> une faible (classes 1–2). Cellules de 2,4 km, Sonnendach.ch.',
    captionRoofs:
      'Chaque marque est <span class="em">un toit échantillonné</span> — le MultiPoint officiel Sonnendach, pas une moyenne de quartier.',
    hintHex: "Survoler pour prévisualiser · cliquer pour épingler · défiler pour zoomer",
    hintRoofs: "Survoler un toit · cliquer pour épingler · défiler pour zoomer",
    hintHexTouch: "Toucher une cellule · pincer pour zoomer",
    hintRoofsTouch: "Toucher un toit · pincer pour zoomer",
    searchLabel: "Recherche",
    searchPlaceholder: "Adresse, NPA ou coordonnées",
    searchEmpty: "Aucun lieu trouvé en Suisse",
    searchClear: "Effacer la recherche",
    searchWgs: "WGS84",
    searchLv95: "MN95",
    searchAddress: "Adresse",
    searchPlz: "NPA",
    locate: "Position",
    locateFail: "Position illisible",
    locateOutside: "Ce point est hors de Suisse",
    loadHex: "Chargement des quartiers…",
    loadRoofs: "Chargement de 100 000 toits…",
    sheetMore: "Contrôles",
    sheetLess: "Carte",
    viewHex: "Hex 2,4 km",
    viewRoofs: "Chaque toit",
    mapOn: "Carte",
    mapOff: "Sans carte",
    bordersOn: "Frontières",
    bordersOff: "Sans frontières",
    classFloor: "Seuil de classe",
    zoom: "Zoom",
    zoomOut: "CH",
    zoomIn: "Ville",
    meanClass: "Classe moyenne",
    pct45: "Classes 4–5",
    meanMetric: "classe moyenne",
    pctMetric: "% classes 4–5",
    chartTitle: "Mix de classes",
    legendLow: "Faible aptitude",
    legendGood: "Bon",
    legendExcellent: "Excellent",
    legendFloor: "Sous le seuil",
    switzerland: "Suisse",
    city: "Ville",
    allRoofs: "Toits échantillonnés",
    preview: "Aperçu",
    pinnedHex: "Cellule épinglée",
    pinnedRoof: "Toit épinglé",
    classes: ["faible", "moyen", "bon", "très bon", "excellent"],
    axisLow: "1 faible",
    axisHigh: "5 excellent",
    ahead: "devant",
    behind: "derrière",
    thisCell: "Cette cellule",
    locale: "fr-CH",
    subHex: (n, h) => `${n} toits · ${h} cellules · 2,4 km`,
    subRoofs: (n) => `${n} toits · MultiPoint officiel`,
    subHexPin: (n, slope, aspect) => `${n} toits · pente moy. ${slope}° · orientation ${aspect}°`,
    subRoofPin: (area, slope, aspect) => `${area} m² · pente ${slope}° · orientation ${aspect}°`,
    insightSame: (pct, slope) =>
      `Les classes 4–5 représentent <strong>${pct}%</strong> de cet ensemble — le même mix que la Suisse. Pente moyenne ${slope}°.`,
    insightDelta: (scope, abs, dir, pct, vs, slope) =>
      `${scope} est <strong>${abs}</strong> points ${dir} la Suisse pour les classes 4–5 (${pct}% vs ${vs}%). Pente moyenne ${slope}°.`,
    insightRoof: (k, label, slope, aspect, area) =>
      `Classe Sonnendach officielle <strong>${k}</strong> (${label}). Pente ${slope}°, orientation ${aspect}°, ${area} m² — le MultiPoint du cadastre.`,
    askLabel: "Chat",
    askClose: "Fermer",
    askPlaceholder: "Exemple : Donne-moi les chiffres de Thoune",
    askButton: "Envoyer",
    askOpen: (name) => `Ouvrir ${name}`,
    askHelp:
      "Demandez les chiffres d’une ville, quelle ville est la plus haute, ou dites d’ouvrir une ville, de changer la vue ou de régler le seuil de classe.",
    askNoModel: "Aucun modèle de langue n’est relié à cette page, je ne peux pas encore répondre comme assistant.",
    askNoGpu: "Ce navigateur ne peut pas lancer l’assistant. Il lui faut WebGPU.",
    askLoading: (pct) => `Chargement de l’assistant… ${pct}%`,
    askUnknown:
      "C’est en dehors de cette carte. Je ne réponds qu’aux questions sur GeoSolar AI : les toits suisses, la classe officielle, les villes et les commandes de cette page.",
    askOffTopicCity: (name) =>
      `C’est en dehors de cette carte. Je ne couvre pas ça. Demandez les toits de ${name} si c’est ce que vous vouliez.`,
    askScopeHex: (name, n, cells, mean, pct) =>
      `${name} est à l’écran : ${n} toits dans ${cells} cellules de 2,4 km, classe moyenne ${mean}, ${pct}% en classes 4–5.`,
    askScopeRoofs: (name, n, mean, pct) =>
      `${name} montre ${n} toits de l’échantillon, classe moyenne ${mean}, ${pct}% en classes 4–5. Cette vue compte 100&nbsp;000 points officiels.`,
    askClassCount: (k, label, n, pct, scope) =>
      `La classe ${k} (${label}) compte ${n} toits dans ${scope}, ${pct}% de cet ensemble.`,
    askRoads: "Cette carte ne trace pas les routes. Le satellite montre le sol, et les noms de villes restent.",
    askPrice:
      "Les prix, les subventions et les installateurs ne sont pas sur cette carte. Ce que je peux dire, c’est la classe officielle, de 1 (faible) à 5 (excellent).",
    askAspect:
      "L’orientation est la direction de la face du toit. Dans ce cadastre le sud est 0°, et la valeur va de −180° à 180°. Pente et orientation sont déjà dans la classe officielle.",
    askDownload: "Cette page est un lecteur. Le cadastre est publié sur opendata.swiss, depuis Sonnendach.ch.",
    askUpdated: "La classe sur la carte est la note Sonnendach publiée. Cette page ne fait pas un relevé plus récent.",
    askAccurate: "La couleur est la classe officielle, reprise du cadastre. Ce chat ne propose pas une seconde note.",
    askHello: "Bonjour. Demandez une ville, une classe, les couleurs, ou ce que montre cette vue.",
    askThanks: "Avec plaisir. Demandez une ville, une classe, ou la vue ouverte.",
    askWhat:
      "GeoSolar AI est une carte des toits suisses et de leur classe Sonnendach officielle, de 1 (faible) à 5 (excellent). Les hex comptent tout le cadastre. Chaque toit dessine 100&nbsp;000 points officiels.",
    askSource:
      "Les classes viennent de Sonnendach.ch : OFEN, swisstopo et MétéoSuisse, publiées sur opendata.swiss. Cette carte n’invente pas une seconde note.",
    askKwh:
      "Il n’y a pas de chiffre en kWh. La classe officielle repose déjà sur l’irradiation, un rendement ne ferait que la répéter.",
    askHex:
      "Un hex est une cellule de 2,4 km. Sa couleur et son compte viennent de chaque toit officiel à l’intérieur.",
    askFace:
      "Un point est une face de toit, pas un bâtiment entier. Une maison à plusieurs faces a plusieurs points.",
    askCircle:
      "Une ville ici est un cercle autour du centre, pas la limite communale. Les chiffres sont les toits dans ce cercle.",
    askLang: "La page est en français, allemand, italien et anglais. Utilisez FR, DE, IT ou EN, ou nommez la langue.",
    askLangDone: "La page est en français.",
    askSearch: "Cherchez une adresse, un NPA ou des coordonnées en WGS84 ou MN95. Localiser utilise cet appareil.",
    askHouse:
      "Cherchez l’adresse, puis ouvrez chaque toit. Cette vue est un échantillon de 100&nbsp;000 points, une maison peut manquer. L’hex de l’endroit compte quand même tout le cadastre.",
    askPinHow: "Survolez une cellule ou un toit pour l’aperçu, puis cliquez pour l’épingler. Sur un téléphone, touchez.",
    askAi:
      "Je réponds à partir du cadastre déjà chargé sur cette carte : villes, classes et vue actuelle. Je ne devine pas une nouvelle classe et je n’estime pas les kWh.",
    askCities: (list) => `Les villes sont ${list}. Chacune est un cercle.`,
    askSlope:
      "La pente et l’orientation viennent du cadastre. Une pente utile et une face au sud sont déjà dans la classe officielle. Épinglez un toit pour lire ses chiffres.",
    askGrey: "Le gris est le milieu de l’échelle, autour de la classe 3. Le bleu est les classes 4–5. L’orange est les classes 1–2.",
    askZoom: "La molette zoome, ou le curseur. CH cadre le pays. Ville zoome dans le cercle choisi.",
    askShare: "La barre d’adresse garde la langue, la vue et la ville, un lien ouvre la même carte.",
    askLakes:
      "Les hex couvrent la Suisse, lacs compris. Les pays voisins restent sur le satellite. Une cellule à la frontière peut toucher un tracé simplifié.",
    askWhySample:
      "Dessiner les 10 millions de toits serait trop lourd pour le navigateur. Les hex comptent déjà chacun. Chaque toit garde 100&nbsp;000 points officiels.",
    askMeanMode:
      "Classe moyenne colorie une cellule par sa moyenne. Classes 4–5 colorient par la part de toits forts. Dites « couleur par moyenne » ou « couleur par classes 4–5 ».",
    askFloorExplain: "Le seuil de classe atténue tout ce qui est sous le nombre choisi. Ces toits restent sur la carte.",
    askAbout: "C’est un projet parallèle pour lire le cadastre officiel des toits, pas un produit et pas un calculateur de rendement.",
    askGithub: "Le code est sur GitHub, sous alexanderduckworthhu/geosolar-ai.",
    askCantons: "Les pastilles sont des villes, dessinées en cercles. La carte ne passe pas aux formes de canton ou de commune.",
    askLocate: "Je cherche cet appareil. La carte ne bouge que si le point est en Suisse.",
    askHere: (name) => `Cette vue est ${name}.`,
    askModeMean: "Colorié par la classe moyenne.",
    askModePct: "Colorié par la part de classes 4–5.",
    askBest: (name, pct, mean, n) =>
      `<strong>${name}</strong> a la plus grande part de classes 4–5 parmi ces villes : ${pct}%, classe moyenne ${mean}, sur ${n} toits du cadastre complet.`,
    askWorst: (name, pct, mean, n) =>
      `<strong>${name}</strong> a la plus petite part de classes 4–5 parmi ces villes : ${pct}%, classe moyenne ${mean}, sur ${n} toits du cadastre complet.`,
    askCity: (name, n, mean, pct, slope, abs, dir, vs) =>
      `<strong>${name}</strong> : ${n} toits, classe moyenne ${mean}, ${pct}% en classes 4–5, pente moyenne ${slope}°. ${abs} points ${dir} la Suisse (${vs}% en classes 4–5). Cadastre complet.`,
    askCitySame: (name, n, mean, pct, slope) =>
      `<strong>${name}</strong> : ${n} toits, classe moyenne ${mean}, ${pct}% en classes 4–5, pente moyenne ${slope}°. Même mix de classes 4–5 que la Suisse. Cadastre complet.`,
    askVersus: (a, ap, an, b, bp, bn) =>
      `<strong>${a}</strong> est à ${ap}% de classes 4–5 (${an} toits). <strong>${b}</strong> est à ${bp}% (${bn} toits). Les deux comptes viennent du cadastre complet.`,
    bitRoofs: (name, n) => `<strong>${name}</strong> compte ${n} toits.`,
    bitMean: (name, mean) => `<strong>${name}</strong> est en moyenne en classe ${mean}.`,
    bitPct: (name, pct) => `<strong>${name}</strong> est à ${pct}% en classes 4–5.`,
    bitSlope: (name, slope) => `Les toits de <strong>${name}</strong> ont une pente moyenne de ${slope}°.`,
    bitShort: (name, pct, mean) => `<strong>${name}</strong> : ${pct}% en classes 4–5, classe moyenne ${mean}.`,
    bitAhead: (name, pct) => `<strong>${name}</strong> est devant la Suisse en classes 4–5, à ${pct}%.`,
    bitBehind: (name, pct) => `<strong>${name}</strong> est derrière la Suisse en classes 4–5, à ${pct}%.`,
    bitMatch: (name, pct) => `<strong>${name}</strong> rejoint la Suisse en classes 4–5, à ${pct}%.`,
    bitIsTop: (name, pct) => `<strong>${name}</strong> est la plus haute de ces villes, à ${pct}% en classes 4–5.`,
    bitNotTop: (name, pct, top, topPct) =>
      `<strong>${name}</strong> n’est pas la plus haute, à ${pct}% en classes 4–5. <strong>${top}</strong> l’est, à ${topPct}%.`,
    bitVersusPct: (a, ap, b, bp) => `<strong>${a}</strong> est à ${ap}% en classes 4–5. <strong>${b}</strong> est à ${bp}%.`,
    bitVersusN: (a, an, b, bn) => `<strong>${a}</strong> compte ${an} toits. <strong>${b}</strong> en compte ${bn}.`,
    bitVersusMean: (a, am, b, bm) => `<strong>${a}</strong> est en moyenne en classe ${am}. <strong>${b}</strong> en classe ${bm}.`,
    bitVersusSlope: (a, as, b, bs) => `<strong>${a}</strong> a une pente moyenne de ${as}°. <strong>${b}</strong> de ${bs}°.`,
    bitWinner: (winner, wp, loser, lp) =>
      `<strong>${winner}</strong> est plus haut en classes 4–5 : ${wp}% contre ${lp}% à <strong>${loser}</strong>.`,
    askRank: (list) => `Par part de classes 4–5 : ${list}.`,
    askClass: (k, label) =>
      `La classe ${k} est ${label}. L’échelle va de 1, faible, à 5, excellent. La couleur sur la carte est la note officielle de la Suisse.`,
    askCountHex: (scope, n, cells, pct) =>
      `${scope} compte ${n} toits dans ${cells} cellules de 2,4 km, sur tout le cadastre. ${pct}% sont en classes 4–5.`,
    askCountRoofs: (scope, n, pct) =>
      `${scope} montre ${n} toits de l’échantillon, dont ${pct}% en classes 4–5. L’échantillon compte 100&nbsp;000 points officiels, pas tout le cadastre.`,
    askSample:
      "Les hexagones comptent tout le cadastre, environ 10 millions de toits. Chaque toit montre un échantillon de 100&nbsp;000 points officiels. Les deux utilisent la classe officielle. Il n’y a pas de chiffre en kWh.",
    askColors:
      "Le bleu est les classes 4–5, haute aptitude. L’orange est les classes 1–2, faible. Le gris est au milieu. La classe est la note officielle Sonnendach.",
    askPinnedHex: (n, pct, mean, slope) =>
      `Cette cellule a ${n} toits, classe moyenne ${mean}, ${pct}% en classes 4–5, pente moyenne ${slope}°. Le compte est tout le cadastre.`,
    askPinnedRoof: (k, label, area, slope, aspect) =>
      `Ce toit est en classe officielle ${k} (${label}), ${area} m², pente ${slope}°, orientation ${aspect}°. Un bâtiment peut avoir plusieurs faces, donc plusieurs points.`,
    askNoPin: "Épinglez d’abord une cellule ou un toit, puis posez la question.",
    askViewHex: "La vue hex est active. Les cellules font 2,4 km et comptent tout le cadastre.",
    askViewRoofs: "La vue toit par toit est active. Ce sont 100&nbsp;000 points officiels de l’échantillon.",
    askFloor: (n) => `Le seuil de classe est ${n}. En dessous, c’est atténué.`,
    askLooseFloor: (n) => `Le seuil de classe est à ${n}, en dessous c’est atténué. C’était la commande la plus proche pour cette demande.`,
    askLooseSlope: (name, slope, list) =>
      `<strong>${name}</strong> a les toits les plus pentus de ces villes, pente moyenne ${slope}°. Par pente : ${list}.`,
    askLooseFlat: (name, slope, list) =>
      `<strong>${name}</strong> a les toits les plus plats de ces villes, pente moyenne ${slope}°. Par pente : ${list}.`,
    askLoose: (place, n, mean, pct) =>
      `Cela reste sur cette carte, mais sans ville, classe ou commande. Vous êtes sur ${place} : ${n} toits, classe moyenne ${mean}, ${pct}% en classes 4–5. Nommez-en un et je peux répondre.`,
    askMapOn: "Le satellite est activé.",
    askMapOff: "Le satellite est désactivé.",
    askBordersOn: "Les frontières sont affichées.",
    askBordersOff: "Les frontières sont masquées.",
    askNational: (n, mean, pct) =>
      `Le cadastre de la Suisse compte ici ${n} toits, classe moyenne ${mean}, ${pct}% en classes 4–5.`,
    baseline: (mean, pct) =>
      `En Suisse, les toits ont en moyenne la classe <strong>${mean}</strong> et <strong>${pct}%</strong> en classes 4–5.`,
  },
  it: {
    title: "GeoSolar AI — Tetti solari svizzeri",
    navMap: "Mappa",
    navAbout: "Info",
    aboutTitle: "Info su GeoSolar AI",
    aboutHtml: `
      <h1>Info</h1>
      <p class="lead">Una piccola mappa dei tetti svizzeri e della loro idoneità al solare.</p>
      <p>La Svizzera ha già classificato circa 10 milioni di tetti (Sonnendach.ch — UFE, swisstopo, MeteoSvizzera), dalla classe 1 (bassa) alla 5 (eccellente). Gli esagoni contano tutto il catasto. La vista tetto per tetto mostra un campione di 100&nbsp;000 punti ufficiali per tenere la pagina leggera. Niente è inventato, e non c’è una previsione in kWh — la classe ufficiale si basa già sull’irraggiamento.</p>
      <h2>Due viste</h2>
      <p><strong>Ogni tetto</strong> è il punto del catasto. <strong>Hex 2,4 km</strong> raggruppa i tetti vicini. Una cella sul Reno può sporgere in Austria o nel Liechtenstein anche se ogni tetto è svizzero; il tratto bianco del paese è semplificato.</p>
      <p>Il <span class="em">blu</span> indica alta idoneità (classi 4–5). L’<span class="dim">arancio</span> indica bassa (classi 1–2). Cerca un indirizzo, un NPA o delle coordinate (WGS84 o MN95), oppure usa la posizione. Si può saltare a una città, accendere o spegnere il satellite, e usare italiano, tedesco, francese o inglese.</p>
      <p>La mappa è il catasto. Nel pannello si può chiedere di una città, di una classe o della vista attuale. La risposta usa questi numeri ufficiali e può aprire la città indicata. Un progetto parallelo, non un prodotto. Dati: <a href="https://opendata.swiss/de/dataset/eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie">opendata.swiss</a>. Codice: <a href="https://github.com/alexanderduckworthhu/geosolar-ai">GitHub</a>.</p>
    `,
    captionHex:
      'Scegli una cella. Il <span class="em">blu</span> indica alta idoneità (classi 4–5). L’<span class="dim">arancio</span> indica bassa (classi 1–2). Celle da 2,4 km, Sonnendach.ch.',
    captionRoofs:
      'Ogni segno è <span class="em">un tetto campionato</span> — il MultiPoint ufficiale Sonnendach, non una media di quartiere.',
    hintHex: "Passa per l’anteprima · clicca per fissare · scorri per lo zoom",
    hintRoofs: "Passa su un tetto · clicca per fissare · scorri per lo zoom",
    hintHexTouch: "Tocca una cella · pizzica per lo zoom",
    hintRoofsTouch: "Tocca un tetto · pizzica per lo zoom",
    searchLabel: "Cerca",
    searchPlaceholder: "Indirizzo, NPA o coordinate",
    searchEmpty: "Nessun luogo trovato in Svizzera",
    searchClear: "Cancella ricerca",
    searchWgs: "WGS84",
    searchLv95: "MN95",
    searchAddress: "Indirizzo",
    searchPlz: "NPA",
    locate: "Posizione",
    locateFail: "Posizione non leggibile",
    locateOutside: "Questo punto è fuori dalla Svizzera",
    loadHex: "Caricamento quartieri…",
    loadRoofs: "Caricamento di 100.000 tetti…",
    sheetMore: "Controlli",
    sheetLess: "Mappa",
    viewHex: "Hex 2,4 km",
    viewRoofs: "Ogni tetto",
    mapOn: "Mappa",
    mapOff: "Senza mappa",
    bordersOn: "Confini",
    bordersOff: "Senza confini",
    classFloor: "Soglia di classe",
    zoom: "Zoom",
    zoomOut: "CH",
    zoomIn: "Città",
    meanClass: "Classe media",
    pct45: "Classi 4–5",
    meanMetric: "classe media",
    pctMetric: "% classi 4–5",
    chartTitle: "Mix di classi",
    legendLow: "Bassa idoneità",
    legendGood: "Buono",
    legendExcellent: "Eccellente",
    legendFloor: "Sotto la soglia",
    switzerland: "Svizzera",
    city: "Città",
    allRoofs: "Tetti campionati",
    preview: "Anteprima",
    pinnedHex: "Cella fissata",
    pinnedRoof: "Tetto fissato",
    classes: ["scarso", "medio", "buono", "molto buono", "eccellente"],
    axisLow: "1 scarso",
    axisHigh: "5 eccellente",
    ahead: "davanti a",
    behind: "dietro",
    thisCell: "Questa cella",
    locale: "it-CH",
    subHex: (n, h) => `${n} tetti · ${h} celle · 2,4 km`,
    subRoofs: (n) => `${n} tetti · MultiPoint ufficiale`,
    subHexPin: (n, slope, aspect) => `${n} tetti · pendenza media ${slope}° · esposizione ${aspect}°`,
    subRoofPin: (area, slope, aspect) => `${area} m² · pendenza ${slope}° · esposizione ${aspect}°`,
    insightSame: (pct, slope) =>
      `Le classi 4–5 sono il <strong>${pct}%</strong> di questo insieme — lo stesso mix della Svizzera. Pendenza media ${slope}°.`,
    insightDelta: (scope, abs, dir, pct, vs, slope) =>
      `${scope} è <strong>${abs}</strong> punti ${dir} la Svizzera per le classi 4–5 (${pct}% vs ${vs}%). Pendenza media ${slope}°.`,
    insightRoof: (k, label, slope, aspect, area) =>
      `Classe Sonnendach ufficiale <strong>${k}</strong> (${label}). Pendenza ${slope}°, esposizione ${aspect}°, ${area} m² — il MultiPoint del catasto.`,
    askLabel: "Chat",
    askClose: "Chiudi",
    askPlaceholder: "Esempio: Dammi le statistiche di Thun",
    askButton: "Invia",
    askOpen: (name) => `Apri ${name}`,
    askHelp:
      "Chiedi le statistiche di una città, quale città è la più alta, oppure di aprire una città, cambiare vista o impostare la soglia di classe.",
    askNoModel: "Nessun modello linguistico è collegato a questa pagina, quindi non posso ancora rispondere come assistente.",
    askNoGpu: "Questo browser non può eseguire l’assistente. Serve WebGPU.",
    askLoading: (pct) => `Caricamento dell’assistente… ${pct}%`,
    askUnknown:
      "Questo è fuori da questa mappa. Rispondo solo a domande su GeoSolar AI: i tetti svizzeri, la classe ufficiale, le città e i comandi di questa pagina.",
    askOffTopicCity: (name) =>
      `Questo è fuori da questa mappa. Non copro quello. Chiedi dei tetti di ${name} se era quello che intendevi.`,
    askScopeHex: (name, n, cells, mean, pct) =>
      `${name} è sullo schermo: ${n} tetti in ${cells} celle da 2,4 km, classe media ${mean}, ${pct}% in classi 4–5.`,
    askScopeRoofs: (name, n, mean, pct) =>
      `${name} mostra ${n} tetti del campione, classe media ${mean}, ${pct}% in classi 4–5. Questa vista ha 100&nbsp;000 punti ufficiali.`,
    askClassCount: (k, label, n, pct, scope) =>
      `La classe ${k} (${label}) conta ${n} tetti in ${scope}, il ${pct}% di quell’insieme.`,
    askRoads: "Questa mappa non disegna le strade. Il satellite mostra il suolo, e i nomi delle città restano.",
    askPrice:
      "Prezzi, incentivi e installatori non sono su questa mappa. Quello che posso dire è la classe ufficiale, da 1 (bassa) a 5 (eccellente).",
    askAspect:
      "L’esposizione è la direzione della falda. In questo catasto il sud è 0°, e il valore va da −180° a 180°. Pendenza ed esposizione sono già nella classe ufficiale.",
    askDownload: "Questa pagina è un lettore. Il catasto è pubblicato su opendata.swiss, da Sonnendach.ch.",
    askUpdated: "La classe sulla mappa è la valutazione Sonnendach pubblicata. Questa pagina non fa un rilievo più recente.",
    askAccurate: "Il colore è la classe ufficiale, presa dal catasto. Questa chat non propone una seconda classe.",
    askHello: "Ciao. Chiedi di una città, di una classe, dei colori o di quello che mostra questa vista.",
    askThanks: "Volentieri. Chiedi di una città, di una classe o della vista aperta.",
    askWhat:
      "GeoSolar AI è una mappa dei tetti svizzeri e della loro classe Sonnendach ufficiale, da 1 (bassa) a 5 (eccellente). Gli hex contano l’intero catasto. Ogni tetto disegna 100&nbsp;000 punti ufficiali.",
    askSource:
      "Le classi arrivano da Sonnendach.ch: UFE, swisstopo e MeteoSvizzera, pubblicate su opendata.swiss. Questa mappa non inventa una seconda valutazione.",
    askKwh:
      "Non c’è una cifra in kWh. La classe ufficiale si basa già sull’irraggiamento, un rendimento la ripeterebbe soltanto.",
    askHex:
      "Un hex è una cella di 2,4 km. Colore e conteggio arrivano da ogni tetto ufficiale al suo interno.",
    askFace:
      "Un punto è una falda, non un intero edificio. Una casa con più falde ha più punti.",
    askCircle:
      "Una città qui è un cerchio intorno al centro, non il confine comunale. I numeri sono i tetti dentro quel cerchio.",
    askLang: "La pagina è in italiano, tedesco, francese e inglese. Usa IT, DE, FR o EN, oppure indica la lingua.",
    askLangDone: "La pagina è in italiano.",
    askSearch: "Cerca un indirizzo, un NPA o coordinate in WGS84 o MN95. Posizione usa questo dispositivo.",
    askHouse:
      "Cerca l’indirizzo, poi apri ogni tetto. Quella vista è un campione di 100&nbsp;000 punti, una casa può mancare. L’hex di quel posto conta comunque l’intero catasto.",
    askPinHow: "Passa su una cella o un tetto per l’anteprima, poi clicca per fissarlo. Sul telefono, tocca.",
    askAi:
      "Rispondo dal catasto già caricato su questa mappa: città, classi e vista attuale. Non indovino una nuova classe e non stimo i kWh.",
    askCities: (list) => `Le città sono ${list}. Ognuna è un cerchio.`,
    askSlope:
      "Pendenza ed esposizione arrivano dal catasto. Una pendenza utile e una falda a sud sono già dentro la classe ufficiale. Fissa un tetto per leggerne i numeri.",
    askGrey: "Il grigio è il centro della scala, intorno alla classe 3. Il blu è le classi 4–5. L’arancio è le classi 1–2.",
    askZoom: "Lo scorrimento zooma, o il cursore. CH inquadra il paese. Città zooma nel cerchio scelto.",
    askShare: "La barra dell’indirizzo tiene lingua, vista e città, un link apre la stessa mappa.",
    askLakes:
      "Gli hex coprono la Svizzera, laghi compresi. I paesi vicini restano sul satellite. Una cella sul confine può toccare un tratto semplificato.",
    askWhySample:
      "Disegnare tutti i 10 milioni di tetti sarebbe troppo pesante per il browser. Gli hex contano già ognuno. Ogni tetto tiene 100&nbsp;000 punti ufficiali.",
    askMeanMode:
      "Classe media colora una cella con la media. Classi 4–5 colorano con la quota di tetti forti. Di’ «colora per media» o «colora per classi 4–5».",
    askFloorExplain: "La soglia di classe attenua tutto ciò che sta sotto il numero scelto. Quei tetti restano sulla mappa.",
    askAbout: "È un progetto parallelo per leggere il catasto ufficiale dei tetti, non un prodotto e non un calcolatore di resa.",
    askGithub: "Il codice è su GitHub, sotto alexanderduckworthhu/geosolar-ai.",
    askCantons: "I pulsanti sono città, disegnate come cerchi. La mappa non passa alle forme di cantone o di comune.",
    askLocate: "Cerco questo dispositivo. La mappa si sposta solo se il punto è in Svizzera.",
    askHere: (name) => `Questa vista è ${name}.`,
    askModeMean: "Colorato per classe media.",
    askModePct: "Colorato per la quota di classi 4–5.",
    askBest: (name, pct, mean, n) =>
      `<strong>${name}</strong> ha la quota più alta di classi 4–5 tra queste città: ${pct}%, classe media ${mean}, su ${n} tetti dell’intero catasto.`,
    askWorst: (name, pct, mean, n) =>
      `<strong>${name}</strong> ha la quota più bassa di classi 4–5 tra queste città: ${pct}%, classe media ${mean}, su ${n} tetti dell’intero catasto.`,
    askCity: (name, n, mean, pct, slope, abs, dir, vs) =>
      `<strong>${name}</strong>: ${n} tetti, classe media ${mean}, ${pct}% in classi 4–5, pendenza media ${slope}°. ${abs} punti ${dir} la Svizzera (${vs}% in classi 4–5). Catasto intero.`,
    askCitySame: (name, n, mean, pct, slope) =>
      `<strong>${name}</strong>: ${n} tetti, classe media ${mean}, ${pct}% in classi 4–5, pendenza media ${slope}°. Stesso mix di classi 4–5 della Svizzera. Catasto intero.`,
    askVersus: (a, ap, an, b, bp, bn) =>
      `<strong>${a}</strong> è al ${ap}% di classi 4–5 (${an} tetti). <strong>${b}</strong> è al ${bp}% (${bn} tetti). Entrambi i conti sono l’intero catasto.`,
    bitRoofs: (name, n) => `<strong>${name}</strong> ha ${n} tetti.`,
    bitMean: (name, mean) => `<strong>${name}</strong> ha una classe media di ${mean}.`,
    bitPct: (name, pct) => `<strong>${name}</strong> è al ${pct}% in classi 4–5.`,
    bitSlope: (name, slope) => `I tetti di <strong>${name}</strong> hanno una pendenza media di ${slope}°.`,
    bitShort: (name, pct, mean) => `<strong>${name}</strong>: ${pct}% in classi 4–5, classe media ${mean}.`,
    bitAhead: (name, pct) => `<strong>${name}</strong> è davanti alla Svizzera nelle classi 4–5, al ${pct}%.`,
    bitBehind: (name, pct) => `<strong>${name}</strong> è dietro la Svizzera nelle classi 4–5, al ${pct}%.`,
    bitMatch: (name, pct) => `<strong>${name}</strong> è in linea con la Svizzera nelle classi 4–5, al ${pct}%.`,
    bitIsTop: (name, pct) => `<strong>${name}</strong> è la più alta di queste città, al ${pct}% in classi 4–5.`,
    bitNotTop: (name, pct, top, topPct) =>
      `<strong>${name}</strong> non è la più alta, al ${pct}% in classi 4–5. Lo è <strong>${top}</strong>, al ${topPct}%.`,
    bitVersusPct: (a, ap, b, bp) => `<strong>${a}</strong> è al ${ap}% in classi 4–5. <strong>${b}</strong> è al ${bp}%.`,
    bitVersusN: (a, an, b, bn) => `<strong>${a}</strong> ha ${an} tetti. <strong>${b}</strong> ne ha ${bn}.`,
    bitVersusMean: (a, am, b, bm) => `<strong>${a}</strong> ha classe media ${am}. <strong>${b}</strong> ha ${bm}.`,
    bitVersusSlope: (a, as, b, bs) => `<strong>${a}</strong> ha pendenza media ${as}°. <strong>${b}</strong> ha ${bs}°.`,
    bitWinner: (winner, wp, loser, lp) =>
      `<strong>${winner}</strong> è più alta nelle classi 4–5: ${wp}% contro ${lp}% a <strong>${loser}</strong>.`,
    askRank: (list) => `Per quota di classi 4–5: ${list}.`,
    askClass: (k, label) =>
      `La classe ${k} è ${label}. La scala va da 1, bassa, a 5, eccellente. Il colore sulla mappa è la classe ufficiale della Svizzera.`,
    askCountHex: (scope, n, cells, pct) =>
      `${scope} conta ${n} tetti in ${cells} celle da 2,4 km, sull’intero catasto. Il ${pct}% è in classi 4–5.`,
    askCountRoofs: (scope, n, pct) =>
      `${scope} mostra ${n} tetti del campione, di cui il ${pct}% in classi 4–5. Il campione è di 100&nbsp;000 punti ufficiali, non l’intero catasto.`,
    askSample:
      "Le celle hex contano l’intero catasto, circa 10 milioni di tetti. Ogni tetto mostra un campione di 100&nbsp;000 punti ufficiali. Entrambi usano la classe ufficiale. Non c’è una cifra in kWh.",
    askColors:
      "Il blu è le classi 4–5, alta idoneità. L’arancio è le classi 1–2, bassa. Il grigio sta in mezzo. La classe è la valutazione ufficiale Sonnendach.",
    askPinnedHex: (n, pct, mean, slope) =>
      `Questa cella ha ${n} tetti, classe media ${mean}, ${pct}% in classi 4–5, pendenza media ${slope}°. Il conto è l’intero catasto.`,
    askPinnedRoof: (k, label, area, slope, aspect) =>
      `Questo tetto è in classe ufficiale ${k} (${label}), ${area} m², pendenza ${slope}°, esposizione ${aspect}°. Un edificio può avere più falde, quindi più punti.`,
    askNoPin: "Prima fissa una cella o un tetto, poi chiedi di quello.",
    askViewHex: "La vista hex è attiva. Le celle sono da 2,4 km e contano l’intero catasto.",
    askViewRoofs: "La vista tetto per tetto è attiva. Sono 100&nbsp;000 punti ufficiali del campione.",
    askFloor: (n) => `La soglia di classe è ${n}. Sotto, è attenuato.`,
    askLooseFloor: (n) => `La soglia di classe è ${n}, sotto è attenuato. Era il comando più vicino per questa richiesta.`,
    askLooseSlope: (name, slope, list) =>
      `<strong>${name}</strong> ha i tetti più ripidi di queste città, pendenza media ${slope}°. Per pendenza: ${list}.`,
    askLooseFlat: (name, slope, list) =>
      `<strong>${name}</strong> ha i tetti più piatti di queste città, pendenza media ${slope}°. Per pendenza: ${list}.`,
    askLoose: (place, n, mean, pct) =>
      `Resta su questa mappa, ma non indica una città, una classe o un comando. Sei su ${place}: ${n} tetti, classe media ${mean}, ${pct}% in classi 4–5. Indicane uno e posso rispondere.`,
    askMapOn: "Il satellite è acceso.",
    askMapOff: "Il satellite è spento.",
    askBordersOn: "I confini sono visibili.",
    askBordersOff: "I confini sono nascosti.",
    askNational: (n, mean, pct) =>
      `Il catasto della Svizzera qui conta ${n} tetti, classe media ${mean}, ${pct}% in classi 4–5.`,
    baseline: (mean, pct) =>
      `In Svizzera i tetti hanno in media classe <strong>${mean}</strong> e <strong>${pct}%</strong> in classi 4–5.`,
  },
};
