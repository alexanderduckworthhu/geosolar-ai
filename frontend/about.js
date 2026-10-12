let lang = localStorage.getItem("geosolar-lang") || "en";
if (!I18N[lang]) lang = "en";

(function readQuery() {
  const p = new URLSearchParams(location.search);
  const l = p.get("lang");
  if (l && I18N[l]) {
    lang = l;
    localStorage.setItem("geosolar-lang", l);
  }
})();

function mapHref() {
  return lang === "en" ? "./" : `./?lang=${lang}`;
}

function aboutHref() {
  return lang === "en" ? "about.html" : `about.html?lang=${lang}`;
}

function syncUrl() {
  const qs = lang === "en" ? "" : `?lang=${lang}`;
  history.replaceState(null, "", `${location.pathname}${qs}`);
}

function applyAbout() {
  const i = I18N[lang];
  document.documentElement.lang = lang;
  document.title = i.aboutTitle;
  const navMap = document.getElementById("nav-map");
  const navAbout = document.getElementById("nav-about");
  navMap.textContent = i.navMap;
  navMap.setAttribute("href", mapHref());
  navAbout.textContent = i.navAbout;
  navAbout.setAttribute("href", aboutHref());
  document.getElementById("about-root").innerHTML = i.aboutHtml;
  document.querySelectorAll("#langs button").forEach((b) => {
    b.classList.toggle("on", b.dataset.lang === lang);
  });
}

document.querySelectorAll("#langs button").forEach((b) => {
  b.addEventListener("click", () => {
    lang = b.dataset.lang;
    localStorage.setItem("geosolar-lang", lang);
    applyAbout();
    syncUrl();
  });
});

applyAbout();
syncUrl();
