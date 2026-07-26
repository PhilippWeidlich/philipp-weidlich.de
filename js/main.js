/* ============================================================
   main.js – minimales Vanilla-JS, keine Abhängigkeiten.
   Aufgaben:
     1. Scroll-Reveal per IntersectionObserver
     2. Schatten der Kopfzeile beim Scrollen
     3. Jahr im Footer
   Die Seite funktioniert vollständig auch ohne dieses Skript.
   ============================================================ */
(function () {
  "use strict";

  /* --- 1 Scroll-Reveal ---------------------------------------- */
  var revealItems = document.querySelectorAll(".reveal");

  function showAll() {
    for (var i = 0; i < revealItems.length; i++) {
      revealItems[i].classList.add("is-visible");
    }
  }

  // Nutzerwunsch "weniger Bewegung" respektieren: sofort alles anzeigen.
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // einmalig – keine Dauerlast
        });
      },
      // Etwas vor dem Sichtbarwerden starten, damit es ruhig wirkt.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );

    for (var j = 0; j < revealItems.length; j++) {
      observer.observe(revealItems[j]);
    }

    /* Sicherheitsnetz: Der Hero liegt beim Laden im Sichtfeld, also muss nach
       kurzer Zeit mindestens ein Element eingeblendet sein. Ist das nicht so,
       arbeitet der Observer nicht -> alles anzeigen. Verhindert im Fehlerfall
       eine leere Seite, ohne den normalen Scroll-Effekt zu beeinträchtigen. */
    var armSafetyNet = function () {
      if (document.hidden) {
        // Im Hintergrund-Tab liefert der Observer korrekt nichts – später prüfen.
        document.addEventListener("visibilitychange", function onShow() {
          if (document.hidden) return;
          document.removeEventListener("visibilitychange", onShow);
          armSafetyNet();
        });
        return;
      }
      window.setTimeout(function () {
        if (!document.querySelector(".reveal.is-visible")) showAll();
      }, 2000);
    };
    armSafetyNet();

    // Wenn der Nutzer die Einstellung während der Sitzung ändert.
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", function (e) {
        if (e.matches) {
          observer.disconnect();
          showAll();
        }
      });
    }
  }

  /* --- 2 Kopfzeile ------------------------------------------- */
  // Sentinel statt scroll-Event: der Browser meldet nur bei Zustandswechsel.
  var sentinel = document.getElementById("top-sentinel");
  var header = document.getElementById("site-header");

  if (sentinel && header && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* --- 3 Jahr im Footer -------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
