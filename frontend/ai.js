const CITY_ALIASES = [
  ["st gallen", "sg"],
  ["st. gallen", "sg"],
  ["saint gall", "sg"],
  ["san gallo", "sg"],
  ["winterthur", "wi"],
  ["schaffhausen", "sh"],
  ["schaffhouse", "sh"],
  ["sciaffusa", "sh"],
  ["neuchatel", "ne"],
  ["neuenburg", "ne"],
  ["fribourg", "fr"],
  ["freiburg", "fr"],
  ["friburgo", "fr"],
  ["lausanne", "ls"],
  ["losanna", "ls"],
  ["luzern", "lu"],
  ["lucerne", "lu"],
  ["lucerna", "lu"],
  ["geneve", "ge"],
  ["geneva", "ge"],
  ["ginevra", "ge"],
  ["genf", "ge"],
  ["zurich", "zh"],
  ["zurigo", "zh"],
  ["basel", "bs"],
  ["basilea", "bs"],
  ["bale", "bs"],
  ["lugano", "ti"],
  ["winterthour", "wi"],
  ["bienne", "bi"],
  ["biel", "bi"],
  ["thoune", "th"],
  ["thun", "th"],
  ["berne", "be"],
  ["berna", "be"],
  ["bern", "be"],
  ["coire", "gr"],
  ["coira", "gr"],
  ["chur", "gr"],
  ["sitten", "vs"],
  ["sion", "vs"],
];

let lastCity = null;
let greeted = false;

function aiCopy() {
  const code = localStorage.getItem("geosolar-lang") || "en";
  return (typeof I18N !== "undefined" && I18N[code]) || I18N.en;
}

function fold(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function num(value, digits) {
  return new Intl.NumberFormat(aiCopy().locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function mentionedCities(question) {
  const found = [];
  let rest = ` ${question} `;
  CITY_ALIASES.forEach(([alias, id]) => {
    const token = ` ${alias} `;
    if (!rest.includes(token)) return;
    if (!found.some((city) => city.id === id)) {
      const row = window.GeoSolar.cityStats().find((city) => city.id === id);
      if (row) found.push(row);
    }
    rest = rest.split(alias).join(" ");
  });
  return found;
}

function focusOf(question) {
  return {
    simple: /\b(simpl\w*|short|brief|quick|summary|kurz\w*|knapp|einfach|vereinfach\w*|court|bref|semplice|semplif\w*|breve|riassunt\w*|basics|uberblick|apercu|sintesi|tldr|nutshell)\b/.test(
      question
    ),
    n: /\b(how many|wie viele|combien|quanti|count|anzahl|nombre|numero|roofs|dacher|toits|tetti)\b/.test(question),
    mean: /\b(mean|average|durchschnitt|moyenne|media|im mittel|mittlere)\b/.test(question),
    pct: /\b(percent|prozent|pourcent|share|anteil|quota|suitab|eignung|aptitude|idoneit)\b/.test(question) || /(?:class|klasse|classe)\s*4/.test(question) || question.includes("%"),
    slope: /\b(slope|neigung|pente|pendenza|steep|steil|pitch)\b/.test(question),
    compare: /\b(compar\w*|versus|vs|gegenuber|par rapport|rispetto|against)\b/.test(question),
    good: /\b(good|bad|worth|suitable|geeignet|eignet|gut|schlecht|bon|mauvais|buon|cattivo|besser|schlechter|better|worse|pire)\b/.test(question),
    best: /\b(the best|the highest|am besten|am hochsten|le meilleur|la meilleure|il migliore|piu alta|best city|hochste stadt)\b/.test(question),
  };
}

function renderPlace(question, place, isCountry) {
  const copy = aiCopy();
  const national = window.GeoSolar.mapSnapshot().national;
  const asked = focusOf(question || "");
  const name = place.name || copy.switzerland;
  const delta = isCountry ? 0 : place.pct4 - national.pct4;
  const n = num(place.n, 0);
  const mean = num(place.mean_klasse, 1);
  const pct = num(place.pct4, 0);
  const slope = num(place.mean_slope, 0);
  const parts = [];
  if (asked.n) parts.push(copy.bitRoofs(name, n));
  if (asked.mean || (/\b(class|klasse|classe)\b/.test(question || "") && !asked.pct)) parts.push(copy.bitMean(name, mean));
  if (asked.pct) parts.push(copy.bitPct(name, pct));
  if (asked.slope) parts.push(copy.bitSlope(name, slope));
  if (!isCountry && asked.best) {
    const top = window.GeoSolar.cityStats().slice().sort((a, b) => b.pct4 - a.pct4)[0];
    parts.push(top.id === place.id ? copy.bitIsTop(name, pct) : copy.bitNotTop(name, pct, top.name, num(top.pct4, 0)));
  } else if (!isCountry && (asked.good || asked.compare)) {
    if (Math.abs(delta) < 0.15) parts.push(copy.bitMatch(name, pct));
    else if (delta > 0) parts.push(copy.bitAhead(name, pct));
    else parts.push(copy.bitBehind(name, pct));
  }
  if (parts.length) return parts.join(" ");
  if (asked.simple) return copy.bitShort(name, pct, mean);
  if (isCountry) return copy.askNational(n, mean, pct);
  if (Math.abs(delta) < 0.15) return copy.askCitySame(name, n, mean, pct, slope);
  const dir = delta >= 0 ? copy.ahead : copy.behind;
  return copy.askCity(name, n, mean, pct, slope, num(Math.abs(delta), 1), dir, num(national.pct4, 0));
}

function versusLine(a, b, question) {
  const copy = aiCopy();
  const asked = focusOf(question);
  const parts = [];
  if (asked.n) parts.push(copy.bitVersusN(a.name, num(a.n, 0), b.name, num(b.n, 0)));
  if (asked.mean) parts.push(copy.bitVersusMean(a.name, num(a.mean_klasse, 1), b.name, num(b.mean_klasse, 1)));
  if (asked.pct) parts.push(copy.bitVersusPct(a.name, num(a.pct4, 0), b.name, num(b.pct4, 0)));
  if (asked.slope) parts.push(copy.bitVersusSlope(a.name, num(a.mean_slope, 0), b.name, num(b.mean_slope, 0)));
  if (parts.length) return parts.join(" ");
  if (asked.simple) return copy.bitVersusPct(a.name, num(a.pct4, 0), b.name, num(b.pct4, 0));
  if (asked.good || asked.compare) {
    const higher = a.pct4 >= b.pct4 ? a : b;
    const lower = higher === a ? b : a;
    return copy.bitWinner(higher.name, num(higher.pct4, 0), lower.name, num(lower.pct4, 0));
  }
  return copy.askVersus(a.name, num(a.pct4, 0), num(a.n, 0), b.name, num(b.pct4, 0), num(b.n, 0));
}

function cityLine(city, question) {
  lastCity = city;
  return renderPlace(question || "", city, false);
}

const TOPICS = [
  { id: "askHello", lead: /^(hi|hello|hey|hallo|bonjour|salut|ciao|buongiorno|servus|yo|good morning|good evening|guten tag|bonsoir)\b/ },
  { id: "askThanks", stems: ["thank", "thanks", "danke", "merci", "grazie", "dankeschon"] },
  { id: "askKwh", stems: ["kwh", "kilowatt", "yield", "ertrag", "stromertrag", "electricity", "electricite", "elettric", "einstrahl", "irradiation", "ensoleillement", "irraggiamento", "how much power", "puissance", "potenza", "rendement", "resa"] },
  { id: "askSource", stems: ["sonnendach", "opendata", "swisstopo", "meteoswiss", "meteoschweiz", "meteo suisse", "meteosvizzera", "bfe", "ofen", "ufe", "data from", "where does", "woher", "d ou viennent", "da dove", "herkunft", "dataset", "who publishes", "veroffentlicht", "official data", "offizielle daten", "donnees officielles", "dati ufficiali", "is it official"] },
  { id: "askWhat", stems: ["geosolar", "what is this", "was ist das", "qu est ce", "c est quoi", "cos e", "che cos", "this app", "this map", "this site", "diese karte", "cette carte", "questa mappa", "what does this", "how does this", "how does it", "wie funktioniert", "comment ca marche", "come funziona", "how do i use", "wie benutze", "comment utiliser"] },
  { id: "askHex", stems: ["what is a hex", "was ist ein hex", "hexagon", "sechseck", "esagon", "2 4 km", "how big", "wie gross", "quelle taille", "quanto e grande", "cell size", "zellengrosse"] },
  { id: "askFace", stems: ["roof face", "dachflache", "pan de toit", "falda", "whole building", "ganzes gebaude", "batiment entier", "intero edificio", "several points", "mehrere punkte", "plusieurs points"] },
  { id: "askCircle", stems: ["circle", "radius", "kreis", "rayon", "raggio", "municipal", "gemeindegrenze", "stadtgrenze", "limite communale", "confine comunale", "not the border"] },
  { id: "askWhySample", stems: ["too heavy", "too many roofs", "why not all", "nicht alle", "pas tous", "non tutti", "10 million", "100 000", "100000", "why a sample", "warum eine stichprobe", "pourquoi un echantillon", "every roof", "all the roofs", "alle dacher", "tous les toits", "tutti i tetti", "difference between", "unterschied zwischen", "difference entre", "differenza tra"] },
  { id: "askHouse", stems: ["my house", "mein haus", "ma maison", "casa mia", "my roof", "mein dach", "my address", "meine adresse", "find my", "specific house", "einzelnes haus"] },
  { id: "askSearch", stems: ["how do i search", "how to search", "postcode", "postleitzahl", "plz", "npa", "address", "adresse", "indirizzo", "coordinates", "koordinaten", "coordonnees", "coordinate", "wgs84", "lv95", "mn95"] },
  { id: "askPinHow", stems: ["how to pin", "how do i pin", "hover", "preview", "vorschau", "apercu", "anteprima", "fixieren", "epingl", "fissare", "click to pin"] },
  { id: "askAi", stems: ["are you ai", "an ai", "chatbot", "chat bot", "language model", "llm", "chatgpt", "robot", "do you guess", "schatzt du", "estimes tu", "who are you", "wer bist", "qui es tu", "chi sei", "artificial"] },
  { id: "askCities", stems: ["which cities", "what cities", "welche stadte", "quelles villes", "quali citta", "list of cities", "city list", "stadte gibt", "villes disponibles", "citta disponibili"] },
  { id: "askSlope", stems: ["slope", "neigung", "pente", "pendenza", "aspect", "ausrichtung", "orientation", "esposizione", "south facing", "south face", "sudlage", "face au sud", "a sud"] },
  { id: "askGrey", stems: ["grey", "gray", "grau", "gris", "grigio", "middle of the scale", "why grey", "warum grau"] },
  { id: "askZoom", stems: ["how to zoom", "how do i zoom", "zoom slider", "scroll to zoom", "zoomen"] },
  { id: "askShare", stems: ["share", "teilen", "partager", "condivid", "bookmark", "address bar", "adresszeile", "permalink", "same map", "link open"] },
  { id: "askLakes", stems: ["lake", "lakes", "lago", "leman", "bodensee", "genfersee", "liechtenstein", "austria", "osterreich", "germany", "deutschland", "frankreich", "france", "italy", "italien", "italie", "neighbour", "neighbor", "nachbarland", "voisin", "vicino", "landesgrenze", "country line", "simplified border", "white line", "weisse linie", "ligne blanche", "linea bianca"] },
  { id: "askRoads", stems: ["road", "roads", "street", "strasse", "strassen", "autobahn", "highway", "autoroute", "autostrada", "strade"] },
  { id: "askPrice", stems: ["price", "prices", "preis", "preise", "prix", "prezzo", "cost", "costs", "kosten", "subsid", "subvention", "incentiv", "installer", "installateur", "installatore", "quote", "angebot", "offerte", "how much does"] },
  { id: "askAspect", stems: ["north facing", "south facing", "east facing", "west facing", "nordlage", "sudlage", "which way", "direction of the roof", "ausrichtung", "north", "south", "nord", "sud"] },
  { id: "askDownload", stems: ["download", "herunterladen", "telecharger", "scaricare", "export", "csv", "get the data", "daten holen"] },
  { id: "askUpdated", stems: ["how old", "how recent", "when was", "updated", "aktualisiert", "mis a jour", "aggiornat", "what year", "welches jahr", "quelle annee", "che anno", "how current", "wie aktuell"] },
  { id: "askAccurate", stems: ["accurate", "accuracy", "genau", "precis", "affidab", "reliable", "richtig", "correct", "fehler", "mistake", "how sure", "trust"] },
  { id: "askMeanMode", stems: ["mean class", "mittlere klasse", "classe moyenne", "classe media", "two colours", "two colors", "zwei farben", "deux couleurs", "due colori", "colour by", "color by", "how is it coloured", "how is it colored", "wie farbt"] },
  { id: "askFloorExplain", stems: ["what is the class floor", "what does the floor", "was ist die klassenschwelle", "seuil de classe", "soglia di classe", "what is the floor", "why dim", "warum gedimmt", "dimmed", "klassenschwelle", "seuil", "soglia"] },
  { id: "askAbout", stems: ["who made", "who built", "wer hat", "qui a fait", "chi ha fatto", "side project", "nebenprojekt", "projet parallele", "progetto parallelo", "is this a product", "about this", "uber das projekt", "a propos"] },
  { id: "askGithub", stems: ["github", "source code", "quellcode", "code source", "codice sorgente"] },
  { id: "askCantons", stems: ["canton", "kanton", "municipality shape", "gemeindeform", "commune shape"] },
  { id: "askHere", stems: ["where am i", "wo bin ich", "ou suis", "dove sono", "which city is this", "welche stadt ist das", "current city", "aktuelle stadt", "what am i looking", "was sehe ich"] },
  { id: "askLang", stems: ["which language", "what language", "welche sprache", "quelle langue", "quale lingua", "can you speak", "sprichst du", "parles tu", "parli"] },
];

function requestedLang(question) {
  const named =
    (/\b(deutsch|german|allemand|tedesco|auf de)\b/.test(question) && "de") ||
    (/\b(english|englisch|anglais|inglese|auf en)\b/.test(question) && "en") ||
    (/\b(francais|french|franzosisch|francese|auf fr)\b/.test(question) && "fr") ||
    (/\b(italiano|italian|italienisch|auf it)\b/.test(question) && "it") ||
    null;
  if (!named) return null;
  if (/^(deutsch|english|francais|italiano|german|french|italian|englisch)$/.test(question)) return named;
  if (/(switch|change|set|sprich|parle|parla|language|sprache|langue|lingua|auf deutsch|auf englisch|auf franzosisch|auf italienisch|in english|in german|in french|in italian|en francais|en allemand|en anglais)/.test(question)) {
    return named;
  }
  return null;
}

function isOffTopic(question) {
  return (
    /\b(weather|wetter|forecast|previsioni|joke|witz|blague|barzelletta|news|nachrichten|actualites|notizie|president|politik|politique|politica|sport|football|fussball|soccer|recipe|rezept|recette|ricetta|bitcoin|crypto|movie|song|lied|poem|gedicht|poesie|poesia|homework|hauptstadt|capitale|capital of)\b/.test(
      question
    ) ||
    /\bmeteo\b/.test(question) ||
    /\d+\s*\+\s*\d+/.test(question)
  );
}

function onMap(question) {
  return /\b(roof|roofs|dach|dacher|toit|toits|tetto|tetti|hex|karte|carte|mappa|map|solar|sonne|soleil|sole|class|klasse|classe|colour|color|farbe|farben|couleur|colore|city|stadt|stadte|ville|villes|citta|zoom|border|grenze|grenzen|frontiere|confini|satellite|satellit|floor|schwelle|seuil|soglia|slope|neigung|pente|pendenza|view|ansicht|vue|vista|sample|stichprobe|cadastre|kataster|catasto|pin|search|suche|legend|legende|cell|zelle|cellule|cella|language|sprache|langue|lingua|lake|lakes|lago|kwh|ertrag|yield|blue|orange|blau|bleu|blu|grey|gray|grau|gris|grigio|mean|canton|kanton|circle|kreis|radius|house|haus|maison|casa|address|adresse|postcode|plz|npa|coordinate|wgs84|lv95|hover|scroll|locate|standort|github|opendata|aspect|ausrichtung|orientation|esposizione|building|gebaude|batiment|edificio|subsid|subvention|preis|price|prix|prezzo|kosten|download|daten|donnees|dati|sonnendach|geosolar|install|road|strasse|strassen|route|strada|north|south|nord|sud|accurate|genau|share|anteil|million|control|steuerung|commande|comandi|switzerland|schweiz|suisse|svizzera|count|zahl|compte|conto|colouring|farbung|legend|panel|button|schalter)\b/.test(
    question
  );
}

function related(question) {
  if (onMap(question)) return true;
  return /\b(town|towns|place|places|area|here|blob|blobs|cluster|clusters|patch|corner|spot|sunny|sunniest|dull|weak|poor|strong|excellent|steep|steeper|flat|flattest|tilt|tilted|pitch|dim|fade|hide|filter|promising|crowded|panel|panels|around|looking|neighbourhood|neighborhood)\b/.test(
    question
  );
}

function looseAnswer(question, snap, copy) {
  if (!related(question)) return null;
  const go = /\b(show|open|take|jump|bring|zeig|offnen|ouvrir|montr|apri|porta|emmene|go)\b/.test(question);
  const dim = /\b(hide|dim|fade|filter|ignore|drop|grey out|gray out|ausblend|masqu|attenu|nascond|filtra|only the|just the)\b/.test(question);
  const low = /\b(weak|poor|dull|bad|low|schwach|faible|scarso|mauvais|worse|schlechter|pire|peggio)\b/.test(question);
  const high = /\b(strong|excellent|great|sunny|sunniest|promising|stark|ottim|bonnes)\b/.test(question);
  const steep = /\b(steep|steeper|steepest|tilt|tilted|pitch|steil|ripid|raide)\b/.test(question);
  const byRoofs = /\b(most|fewest|least|biggest|largest|smallest)\b/.test(question) && /\b(roofs|dacher|toits|tetti)\b/.test(question);
  const flat = /\b(flat|flattest|flach|piatto)\b/.test(question) && !/\b(flattest roofs of)\b/.test(question);
  const here = /\b(here|this area|around here|this corner|this spot|looking at|right now|hier|ici)\b/.test(question);
  const stats = window.GeoSolar.cityStats();

  if (dim && (low || high)) {
    const floor = high && !low ? (/\bexcellent\b/.test(question) ? 5 : 4) : 3;
    window.GeoSolar.setFloor(floor);
    return { html: copy.askLooseFloor(floor) };
  }
  if (byRoofs && stats.length && !steep && !flat) {
    const few = /\b(fewest|least|smallest)\b/.test(question);
    const sorted = stats.slice().sort((a, b) => (few ? a.n - b.n : b.n - a.n));
    const city = sorted[0];
    if (go) window.GeoSolar.goCity(city.id);
    return {
      html: copy.bitRoofs(city.name, num(city.n, 0)),
      city: go ? null : city,
    };
  }
  if ((steep || flat) && stats.length) {
    const sorted = stats.slice().sort((a, b) => (flat ? a.mean_slope - b.mean_slope : b.mean_slope - a.mean_slope));
    const city = sorted[0];
    if (go) window.GeoSolar.goCity(city.id);
    const list = sorted
      .slice(0, 5)
      .map((row) => `${row.name} ${num(row.mean_slope, 0)}°`)
      .join(", ");
    const html = flat
      ? copy.askLooseFlat(city.name, num(city.mean_slope, 0), list)
      : copy.askLooseSlope(city.name, num(city.mean_slope, 0), list);
    return { html, city: go ? null : city };
  }
  if (high && (go || /\b(which|what|who|wo|ou|dove|welche|quel)\b/.test(question))) {
    const city = stats.slice().sort((a, b) => b.pct4 - a.pct4)[0];
    if (go) window.GeoSolar.goCity(city.id);
    return {
      html: copy.askBest(city.name, num(city.pct4, 0), num(city.mean_klasse, 1), num(city.n, 0)),
      city: go ? null : city,
    };
  }
  if (low && /\b(which|what|who|wo|ou|dove|welche|quel)\b/.test(question) && !here) {
    const city = stats.slice().sort((a, b) => a.pct4 - b.pct4)[0];
    if (go) window.GeoSolar.goCity(city.id);
    return {
      html: copy.askWorst(city.name, num(city.pct4, 0), num(city.mean_klasse, 1), num(city.n, 0)),
      city: go ? null : city,
    };
  }
  if (here) {
    if (low || high) return { html: renderPlace("compare", Object.assign({ name: snap.cityName, id: snap.cityId }, snap.stats), snap.cityId === "ch") };
    return { html: scopeAnswer(copy, snap) };
  }
  return {
    html: copy.askLoose(snap.cityName, num(snap.stats.n, 0), num(snap.stats.mean_klasse, 1), num(snap.stats.pct4, 0)),
  };
}

function scopeAnswer(copy, snap) {
  const pct = num(snap.stats.pct4, 0);
  const mean = num(snap.stats.mean_klasse, 1);
  const n = num(snap.stats.n, 0);
  if (snap.view === "roofs") return copy.askScopeRoofs(snap.cityName, n, mean, pct);
  return copy.askScopeHex(snap.cityName, n, num(snap.nHex, 0), mean, pct);
}

function bestTopic(question) {
  let best = null;
  let bestScore = 0;
  TOPICS.forEach((topic) => {
    let score = 0;
    if (topic.lead && topic.lead.test(question) && question.split(" ").length <= 4) score += 14;
    (topic.stems || []).forEach((stem) => {
      if (!question.includes(stem)) return;
      const word = new RegExp(`(?:^|\\s)${stem.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?:\\s|$)`).test(question);
      if (word) score += Math.max(stem.length, 6);
      else if (stem.length >= 8) score += stem.length;
    });
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  });
  return bestScore >= 5 ? best : null;
}

function topicAnswer(topic, copy, snap) {
  if (topic.id === "askCities") {
    const list = window.GeoSolar.cityStats().map((city) => city.name).join(", ");
    return copy.askCities(list);
  }
  if (topic.id === "askHere") return copy.askHere(snap.cityName);
  const text = copy[topic.id];
  return typeof text === "function" ? text(snap.cityName) : text;
}

function answerQuestion(raw) {
  const question = fold(raw);
  if (!window.GeoSolar || typeof window.GeoSolar.mapSnapshot !== "function") return null;
  let snap;
  try {
    snap = window.GeoSolar.mapSnapshot();
  } catch (_) {
    return null;
  }
  if (!snap || !snap.national) return null;
  const cities = mentionedCities(question);
  const wantsOpen = /(show|open|go to|take me|jump|bring me|zeig|offnen|ouvrir|montr|apri|mostra|aller)/.test(question);
  const floor = /(?:floor|schwelle|seuil|soglia)\D*([1-5])/.exec(question);
  const mapOff = /(no map|map off|hide the map|satellite off|ohne karte|sans carte|senza mappa)/.test(question);
  const mapOn = /(map on|show the map|satellite on|mit karte|avec la carte|con la mappa)/.test(question);
  const bordersOff = /(no borders|borders off|hide borders|ohne grenzen|sans frontiere|senza confini)/.test(question);
  const bordersOn = /(borders on|show borders|mit grenzen|avec les frontieres|con i confini)/.test(question);
  const wantsHex = /(hex|zelle|zellen|cellule|cellules|esagon|neighbourhood|nachbar)/.test(question);
  const wantsRoofs = /(each roof|roofs|jedes dach|dachansicht|chaque toit|toit par toit|ogni tetto|tetto per tetto)/.test(question);
  const slopeAsk = /\b(steep|steeper|steepest|tilt|tilted|pitch|steil|ripid|raide|flat|flattest|flach|piatto|slope|neigung|pente|pendenza)\b/.test(question);
  const wantsBest = /(best|highest|strongest|hochst|beste|starkst|meilleur|plus haut|plus forte|migliore|piu alta|sunniest|sunny)/.test(question) || (/\bmost\b/.test(question) && !slopeAsk && !/\broofs\b|\bdacher\b|\btoits\b|\btetti\b/.test(question));
  const wantsWorst = /(worst|lowest|schlecht|niedrigst|pire|plus bas|plus faible|peggiore)/.test(question) || (/\bleast\b/.test(question) && !slopeAsk);
  const wantsRank = /(rank|ranking|classement|classifica|reihenfolge|vergleich der stadte|compare cities|compare the cities|top 5|top five)/.test(question);
  const wantsClass = /(class|klasse|classe)\s*([1-5])/.exec(question);
  const wantsCount = /(how many|wie viele|combien|quanti|was zahlt|que compte|cosa conta|this view|cette vue|questa vista|what am i|was sehe)/.test(question);
  const wantsSample = /(sample|stichprobe|echantillon|campione|cadastre|kataster|catasto|10 million|10 millionen)/.test(question);
  const wantsColor = /(colou?r|farbe|couleur|colore|blue|orange|blau|bleu|blu|legend|legende)/.test(question);
  const wantsPin = /(this roof|dieses dach|ce toit|questo tetto|this cell|this hex|diese zelle|cette cellule|questa cella|pinned)/.test(question);
  const wantsHelp = /^(help|hilfe|aide|aiuto)$/.test(question) || /(what can i|was kann ich|que puis|cosa posso)/.test(question);
  const wantsCountry = /(switzerland|schweiz|suisse|svizzera)/.test(question);
  const nextLang = requestedLang(question);
  if (nextLang && window.GeoSolar.setLang) {
    window.GeoSolar.setLang(nextLang);
    askLabels();
  }
  const copy = aiCopy();

  if (floor) {
    window.GeoSolar.setFloor(Number(floor[1]));
    return { html: copy.askFloor(floor[1]) };
  }
  if (mapOff) {
    window.GeoSolar.setBase(false);
    return { html: copy.askMapOff };
  }
  if (mapOn) {
    window.GeoSolar.setBase(true);
    return { html: copy.askMapOn };
  }
  if (bordersOff) {
    window.GeoSolar.setBorders(false);
    return { html: copy.askBordersOff };
  }
  if (bordersOn) {
    window.GeoSolar.setBorders(true);
    return { html: copy.askBordersOn };
  }
  if (/(colou?r by mean|color by mean|use mean class|nach mittlerer klasse|farbe nach mittel|farbe nach mittler|par la classe moyenne|couleur par moyenne|per la classe media|colora per media)/.test(question)) {
    window.GeoSolar.setMode("mean");
    return { html: copy.askModeMean };
  }
  if (/(colou?r by class 4|color by class 4|colou?r by share|color by share|use class 4|nach anteil|farbe nach klasse 4|par la part|couleur par classes 4|per la quota|colora per classi 4)/.test(question)) {
    window.GeoSolar.setMode("pct4");
    return { html: copy.askModePct };
  }
  if (/(locate me|find my location|my location|mein standort|localise moi|trovami|use my location)/.test(question)) {
    window.GeoSolar.locateMe();
    return { html: copy.askLocate };
  }
  if (nextLang && question.split(" ").length <= 5 && !cities.length) {
    return { html: copy.askLangDone };
  }
  if (isOffTopic(question)) {
    if (cities.length === 1) return { html: copy.askOffTopicCity(cities[0].name) };
    return { html: copy.askUnknown };
  }
  if (wantsRoofs && wantsOpen) {
    window.GeoSolar.setViewMode("roofs");
    return { html: copy.askViewRoofs };
  }
  if (wantsHex && wantsOpen) {
    window.GeoSolar.setViewMode("hex");
    return { html: copy.askViewHex };
  }
  if (wantsHelp) return { html: copy.askHelp };
  if (wantsClass) {
    const k = Number(wantsClass[2]);
    const counting = /(how many|wie viele|combien|quanti|anteil|share of|part de|quota)/.test(question);
    const bag = wantsCountry ? snap.national : snap.stats;
    const count = bag && bag.counts ? bag.counts[k - 1] : null;
    if (counting && count != null && bag.n) {
      const scope = wantsCountry ? copy.switzerland : snap.cityName;
      return { html: copy.askClassCount(k, copy.classes[k - 1], num(count, 0), num((100 * count) / bag.n, 1), scope) };
    }
    return { html: copy.askClass(k, copy.classes[k - 1]) };
  }
  if (cities.length >= 2) {
    const [a, b] = cities;
    return { html: versusLine(a, b, question) };
  }
  if (wantsBest && !cities.length && !slopeAsk) {
    const city = window.GeoSolar.cityStats().slice().sort((a, b) => b.pct4 - a.pct4)[0];
    if (wantsOpen) window.GeoSolar.goCity(city.id);
    return {
      html: copy.askBest(city.name, num(city.pct4, 0), num(city.mean_klasse, 1), num(city.n, 0)),
      city: wantsOpen ? null : city,
    };
  }
  if (wantsWorst && !cities.length && !slopeAsk) {
    const city = window.GeoSolar.cityStats().slice().sort((a, b) => a.pct4 - b.pct4)[0];
    if (wantsOpen) window.GeoSolar.goCity(city.id);
    return {
      html: copy.askWorst(city.name, num(city.pct4, 0), num(city.mean_klasse, 1), num(city.n, 0)),
      city: wantsOpen ? null : city,
    };
  }
  if (wantsRank && !cities.length) {
    const list = window.GeoSolar.cityStats()
      .slice()
      .sort((a, b) => b.pct4 - a.pct4)
      .slice(0, 5)
      .map((city) => `${city.name} ${num(city.pct4, 0)}%`)
      .join(", ");
    return { html: copy.askRank(list) };
  }
  if (cities.length === 1) {
    if (wantsOpen) window.GeoSolar.goCity(cities[0].id);
    return { html: cityLine(cities[0], question), city: wantsOpen ? null : cities[0] };
  }
  if (wantsOpen && lastCity && /\b(it|that|sie|la|lo|celui)\b/.test(question)) {
    window.GeoSolar.goCity(lastCity.id);
    return { html: cityLine(lastCity, question) };
  }
  if (wantsCountry && !wantsCount) {
    return { html: renderPlace(question, Object.assign({ name: copy.switzerland }, snap.national), true) };
  }
  if (wantsPin) {
    if (!snap.pin) return { html: copy.askNoPin };
    if (snap.pin.kind === "roof") {
      const pin = snap.pin;
      return {
        html: copy.askPinnedRoof(pin.klasse, copy.classes[pin.klasse - 1], num(pin.area, 0), num(pin.slope, 0), num(pin.aspect, 0)),
      };
    }
    const pin = snap.pin;
    return { html: copy.askPinnedHex(num(pin.n, 0), num(pin.pct4, 0), num(pin.mean, 1), num(pin.slope, 0)) };
  }
  if (wantsSample) return { html: copy.askSample };
  if (wantsColor) return { html: copy.askColors };
  if (wantsCount) {
    const pct = num(snap.stats.pct4, 0);
    if (snap.view === "roofs") return { html: copy.askCountRoofs(snap.cityName, num(snap.stats.n, 0), pct) };
    return { html: copy.askCountHex(snap.cityName, num(snap.stats.n, 0), num(snap.nHex, 0), pct) };
  }
  const topic = bestTopic(question);
  if (topic) return { html: topicAnswer(topic, copy, snap) };
  if (question.length < 2) return { html: scopeAnswer(copy, snap) };
  const loose = looseAnswer(question, snap, copy);
  if (loose) return loose;
  return { html: copy.askUnknown };
}

function escapeText(value) {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function appendMessage(kind, html, extraClass) {
  const log = document.getElementById("chat-log");
  if (!log) return;
  const item = document.createElement("div");
  item.className = `chat-msg ${kind}${extraClass ? ` ${extraClass}` : ""}`;
  item.innerHTML = html;
  log.appendChild(item);
  const button = item.querySelector("button");
  if (button) button.addEventListener("click", () => window.GeoSolar.goCity(button.dataset.city));
  log.scrollTop = log.scrollHeight;
}

function paintAnswer(result) {
  const copy = aiCopy();
  if (!result) return;
  const open = result.city
    ? ` <button type="button" data-city="${result.city.id}">${copy.askOpen(result.city.name)}</button>`
    : "";
  appendMessage("bot", `<span>${result.html}</span>${open}`);
}

function setChat(open) {
  const chat = document.getElementById("chat");
  const toggle = document.getElementById("btn-chat");
  if (!chat || !toggle) return;
  chat.hidden = !open;
  toggle.classList.toggle("on", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) {
    const input = document.getElementById("ask-input");
    if (input) input.focus();
  }
}

function askLabels() {
  const copy = aiCopy();
  const label = document.getElementById("ask-label");
  const input = document.getElementById("ask-input");
  const button = document.getElementById("ask-go");
  const toggle = document.getElementById("btn-chat");
  const close = document.getElementById("chat-close");
  if (label) label.textContent = copy.askLabel;
  if (input) input.placeholder = copy.askPlaceholder;
  if (button) button.setAttribute("aria-label", copy.askButton);
  if (toggle) toggle.setAttribute("aria-label", copy.askLabel);
  if (close) close.setAttribute("aria-label", copy.askClose);
  const log = document.getElementById("chat-log");
  const greet = log && log.querySelector(".chat-msg.greeting");
  if (greet) greet.innerHTML = copy.askHelp;
  else if (log && !greeted) {
    greeted = true;
    appendMessage("bot", copy.askHelp, "greeting");
  }
}

function roundFacts(place) {
  if (!place) return null;
  return {
    roofs: Math.round(place.n),
    mean_class: Math.round(place.mean_klasse * 10) / 10,
    percent_class_4_and_5: Math.round(place.pct4),
    mean_slope_degrees: Math.round(place.mean_slope),
  };
}

function packFacts() {
  const snap = window.GeoSolar && window.GeoSolar.mapSnapshot ? window.GeoSolar.mapSnapshot() : null;
  if (!snap) return {};
  const cities = (window.GeoSolar.cityStats() || []).map((city) =>
    Object.assign({ id: city.id, name: city.name }, roundFacts(city))
  );
  const pin = snap.pin
    ? snap.pin.kind === "roof"
      ? {
          kind: "roof",
          class: snap.pin.klasse,
          area: Math.round(snap.pin.area),
          slope: Math.round(snap.pin.slope),
          aspect: Math.round(snap.pin.aspect),
        }
      : {
          kind: "hex",
          n: Math.round(snap.pin.n),
          mean: Math.round(snap.pin.mean * 10) / 10,
          pct4: Math.round(snap.pin.pct4),
          slope: Math.round(snap.pin.slope),
        }
    : null;
  return {
    view: snap.view,
    place: snap.cityName,
    placeId: snap.cityId,
    here: roundFacts(snap.stats),
    cells: snap.nHex,
    national: Object.assign({ name: "Switzerland" }, roundFacts(snap.national)),
    cities,
    pin,
    notes: [
      "Hex cells are 2.4 km and count the full cadastre. Each-roof view draws a sample of 100000 official points.",
      "A city is a circle around its centre, not the municipal border.",
      "Class 1 is low and class 5 is excellent. Blue is class 4-5. Orange is class 1-2. Grey is the middle.",
      "South aspect is 0 degrees, from -180 to 180. Slope and aspect are already inside the official class.",
      "There is no kWh figure. The map does not draw roads. Satellite shows the ground. Neighbouring countries stay visible.",
      "Controls: open a city by id, class floor 1-5, view hex or roofs, satellite on or off, borders on or off, colour by mean or pct4.",
    ],
  };
}

function applyAction(action) {
  if (!action || !window.GeoSolar) return;
  if (action.type === "goCity" && action.id) window.GeoSolar.goCity(action.id);
  if (action.type === "setFloor") window.GeoSolar.setFloor(action.value);
  if (action.type === "setView") window.GeoSolar.setViewMode(action.value);
  if (action.type === "setBase") window.GeoSolar.setBase(action.value);
  if (action.type === "setBorders") window.GeoSolar.setBorders(action.value);
  if (action.type === "setMode") window.GeoSolar.setMode(action.value);
  if (action.type === "locate") window.GeoSolar.locateMe();
}

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
const ASK_SYSTEM = `You are the assistant inside GeoSolar AI, a map of Swiss roofs and their official Sonnendach class from 1 (low) to 5 (excellent).
The user message is JSON with lang, question, and facts.
Write reply in the language of lang: en, de, fr, or it.
Answer the question. Every number you write must already appear in facts. Never mention kWh.
roofs is a count of roofs, not people. mean_class is the average class from 1 to 5. percent_class_4_and_5 is the share of roofs in class 4 or 5 together, not class 5 alone. mean_slope_degrees is the average roof slope.
A simplified or short question uses only percent_class_4_and_5 and mean_class, in one sentence. A full stats question can use every field.
If the question is not about this map, its roofs, its classes, its cities, or its controls, say it is outside this map.
If the user asks to open, show, or go to a city, set action to {"type":"goCity","id":"..."} using that city's id from facts.cities. Otherwise action is null.
Other actions, only when asked: {"type":"setFloor","value":1 to 5}, {"type":"setView","value":"hex" or "roofs"}, {"type":"setBase","value":true or false}, {"type":"setBorders","value":true or false}, {"type":"setMode","value":"mean" or "pct4"}, {"type":"locate"}.
Return one JSON object and nothing else: {"reply":"...","action":null}`;

let enginePromise = null;
let onEngineProgress = null;
const chatTurns = [];

function parseModelText(content) {
  let text = String(content || "").trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(text.slice(start, end + 1));
      } catch (__) {
        parsed = null;
      }
    }
  }
  if (!parsed || typeof parsed !== "object") return { reply: text, action: null };
  const reply = String(parsed.reply || "").trim();
  return { reply: reply || text, action: parsed.action && typeof parsed.action === "object" ? parsed.action : null };
}

function ensureEngine() {
  if (!navigator.gpu) {
    const error = new Error("gpu");
    error.code = "gpu";
    return Promise.reject(error);
  }
  if (!enginePromise) {
    enginePromise = import("https://esm.sh/@mlc-ai/web-llm@0.2.79")
      .then(({ CreateMLCEngine }) =>
        CreateMLCEngine(MODEL_ID, {
          initProgressCallback(report) {
            if (onEngineProgress) onEngineProgress(report);
          },
        })
      )
      .catch((error) => {
        enginePromise = null;
        throw error;
      });
  }
  return enginePromise;
}

async function askModel(text, pending) {
  const copy = aiCopy();
  onEngineProgress = (report) => {
    const pct = Math.max(0, Math.min(100, Math.round((report.progress || 0) * 100)));
    pending.textContent = copy.askLoading(pct);
  };
  let engine;
  try {
    engine = await ensureEngine();
  } catch (error) {
    onEngineProgress = null;
    return error && error.code === "gpu" ? copy.askNoGpu : copy.askNoModel;
  }
  onEngineProgress = null;
  pending.textContent = "…";
  const lang = (localStorage.getItem("geosolar-lang") || "en").slice(0, 2);
  chatTurns.push({
    role: "user",
    content: JSON.stringify({ lang, question: text, facts: packFacts() }),
  });
  if (chatTurns.length > 6) chatTurns.splice(0, chatTurns.length - 6);
  let raw = "";
  try {
    const completion = await engine.chat.completions.create({
      messages: [{ role: "system", content: ASK_SYSTEM }, ...chatTurns],
      temperature: 0.2,
      max_tokens: 280,
    });
    raw = completion.choices[0].message.content || "";
  } catch (_) {
    chatTurns.pop();
    return copy.askNoModel;
  }
  chatTurns.push({ role: "assistant", content: raw });
  const parsed = parseModelText(raw);
  let action = parsed.action;
  if (!action && /\b(open|show|go to|take me|offnen|ouvrir|apri)\b/i.test(text)) {
    const cities = (window.GeoSolar.cityStats && window.GeoSolar.cityStats()) || [];
    const named = cities.find((city) => text.toLowerCase().includes(city.name.toLowerCase()));
    if (named) action = { type: "goCity", id: named.id };
  }
  applyAction(action);
  let reply = parsed.reply;
  if (action && action.type === "goCity" && /^gocity/i.test(reply)) {
    const named = ((window.GeoSolar.cityStats && window.GeoSolar.cityStats()) || []).find((city) => city.id === action.id);
    reply = named ? `Opened ${named.name}.` : reply;
  }
  return escapeText(reply).replace(/\n/g, "<br>");
}

const form = document.getElementById("ask-form");
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("ask-input");
    const text = input.value.trim();
    if (!text) return;
    appendMessage("user", escapeText(text));
    input.value = "";
    const pending = document.createElement("div");
    pending.className = "chat-msg bot";
    pending.textContent = "…";
    document.getElementById("chat-log").appendChild(pending);
    const html = await askModel(text, pending);
    pending.remove();
    appendMessage("bot", html);
  });
}

document.querySelectorAll("#langs button").forEach((button) => {
  button.addEventListener("click", () => window.setTimeout(askLabels, 0));
});

const chatToggle = document.getElementById("btn-chat");
const chatClose = document.getElementById("chat-close");
if (chatToggle) chatToggle.addEventListener("click", () => setChat(document.getElementById("chat").hidden));
if (chatClose) chatClose.addEventListener("click", () => setChat(false));
document.addEventListener("keydown", (event) => {
  const chat = document.getElementById("chat");
  if (event.key === "Escape" && chat && !chat.hidden) setChat(false);
});

askLabels();
