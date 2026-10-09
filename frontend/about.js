let lang = localStorage.getItem("geosolar-lang") || "en";
if (!I18N[lang]) lang = "en";

function applyAbout() {
  const i = I18N[lang];
  document.documentElement.lang = lang;
  document.title = i.aboutTitle;
  document.getElementById("nav-map").textContent = i.navMap;
  document.getElementById("nav-about").textContent = i.navAbout;
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
  });
});

applyAbout();
