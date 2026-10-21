/* ============================================================
   main.js – Vanilla-JS, keine Abhängigkeiten.
   Aufgaben:
     1. Einblenden beim Scrollen (gestaffelt)
     2. Kopfzeile: Zustand beim Scrollen
     3. Menü auf schmalen Displays
     4. Aktiver Navigationspunkt
     5. Lichtkegel unter dem Mauszeiger
     6. Terminal im Hero tippt die Befehle
     7. E-Mail-Adresse kopieren
     8. Zahl der Referenzen, Jahr im Footer
   Die Seite funktioniert vollständig auch ohne dieses Skript.
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- 1 Einblenden ------------------------------------------- */
  var revealItems = document.querySelectorAll(".reveal");

  function showAll() {
    for (var i = 0; i < revealItems.length; i++) {
      revealItems[i].classList.add("is-visible");
    }
  }

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        // Was im selben Moment sichtbar wird, kommt nacheinander.
        var n = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.style.setProperty("--d", Math.min(n++ * 80, 480) + "ms");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    for (var j = 0; j < revealItems.length; j++) {
      observer.observe(revealItems[j]);
    }

    // Sicherheitsnetz: arbeitet der Observer nicht, alles anzeigen.
    var armSafetyNet = function () {
      if (document.hidden) {
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
  var sentinel = document.getElementById("top-sentinel");
  var header = document.getElementById("site-header");

  if (sentinel && header && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* --- 3 Menü ------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (header && toggle && nav) {
    toggle.hidden = false;
    header.classList.add("has-menu");

    var setOpen = function (open) {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", function () {
      setOpen(!header.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* --- 4 Aktiver Navigationspunkt ----------------------------- */
  if (nav && "IntersectionObserver" in window) {
    var navLinks = nav.querySelectorAll('a[href^="#"]');
    var linkFor = {};

    for (var a = 0; a < navLinks.length; a++) {
      var id = navLinks[a].getAttribute("href").slice(1);
      if (document.getElementById(id)) linkFor[id] = navLinks[a];
    }

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = linkFor[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            for (var k = 0; k < navLinks.length; k++) navLinks[k].classList.remove("is-active");
            link.classList.add("is-active");
          } else {
            link.classList.remove("is-active");
          }
        });
      },
      // Aktiv ist, was gerade die Bildschirmmitte kreuzt.
      { rootMargin: "-45% 0px -50% 0px" }
    );

    Object.keys(linkFor).forEach(function (key) {
      spy.observe(document.getElementById(key));
    });
  }

  /* --- 5 Lichtkegel ------------------------------------------ */
  if (window.matchMedia("(hover: hover)").matches) {
    var onSpot = function (e) {
      var el = e.currentTarget;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    };
    var spots = document.querySelectorAll(".spot");
    for (var s = 0; s < spots.length; s++) {
      spots[s].addEventListener("pointermove", onSpot);
    }
  }

  /* --- 6 Terminal -------------------------------------------- */
  // Die Zeilen stehen fertig im HTML. Hier werden sie nur nacheinander
  // aufgedeckt und die Befehle Zeichen für Zeichen getippt.
  var term = document.querySelector("[data-term]");

  if (term && !reducedMotion.matches) {
    var lines = term.querySelectorAll(".tl");
    var texts = [];

    for (var t = 0; t < lines.length; t++) {
      var cmd = lines[t].querySelector(".tc");
      texts.push(cmd ? cmd.textContent : null);
      if (cmd) cmd.textContent = "";
      lines[t].classList.remove("is-current");
    }

    term.classList.add("is-typing");
    var line = 0;

    var markCurrent = function (el) {
      for (var m = 0; m < lines.length; m++) lines[m].classList.remove("is-current");
      el.classList.add("is-current");
    };

    var step = function () {
      if (line >= lines.length) {
        term.classList.remove("is-typing");
        return;
      }
      var el = lines[line];
      var text = texts[line];
      var target = el.querySelector(".tc");
      line++;
      el.classList.add("is-on");

      if (!target) {
        window.setTimeout(step, 90);
        return;
      }

      markCurrent(el);
      if (!text) {
        step();
        return;
      }

      var k = 0;
      var type = function () {
        k++;
        target.textContent = text.slice(0, k);
        if (k < text.length) window.setTimeout(type, 38 + Math.random() * 55);
        else window.setTimeout(step, 420);
      };
      window.setTimeout(type, 320);
    };

    window.setTimeout(step, 900);
  }

  /* --- 7 E-Mail kopieren ------------------------------------- */
  var copyBtn = document.querySelector("[data-copy]");

  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    var copyLabel = copyBtn.querySelector("[data-copy-label]");
    var copyStatus = document.querySelector("[data-copy-status]");
    var original = copyLabel ? copyLabel.textContent : "";
    var resetTimer;

    copyBtn.hidden = false;
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(copyBtn.getAttribute("data-copy")).then(
        function () {
          if (copyLabel) copyLabel.textContent = "Kopiert";
          if (copyStatus) copyStatus.textContent = "E-Mail-Adresse kopiert";
          copyBtn.classList.add("is-done");
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            if (copyLabel) copyLabel.textContent = original;
            if (copyStatus) copyStatus.textContent = "";
            copyBtn.classList.remove("is-done");
          }, 2200);
        },
        function () {
          if (copyLabel) copyLabel.textContent = "Kopieren nicht möglich";
        }
      );
    });
  }

  /* --- 8 Zähler und Jahr ------------------------------------- */
  var countEl = document.querySelector("[data-ref-count]");
  var refCards = document.querySelectorAll("#referenzen .ref");
  if (countEl && refCards.length) countEl.textContent = String(refCards.length);

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --- 9 AhrComp im Browserfenster: Live-Status -------------- */
  /* Gleiche Regeln wie auf ahrcomp.de: Mo–Fr 9:00–17:30, Feiertage in
     Rheinland-Pfalz plus Heiligabend und Silvester geschlossen.
     Klassen tragen im Fenster das Präfix ac- (css/ahrcomp-mini.css). */
  var ahrSys = document.querySelector("[data-ahr-sys]");
  if (ahrSys) {
    var TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    var AUF = 540, ZU = 1050;
    var hhmm = function (m) {
      var h = Math.floor(m / 60), mm = m % 60;
      return (h < 10 ? "0" + h : h) + ":" + (mm < 10 ? "0" + mm : mm);
    };
    var tagKey = function (d) { return d.getMonth() + "-" + d.getDate(); };
    var feiertag = function (d) {
      var j = d.getFullYear();
      var a = j % 19, b = Math.floor(j / 100), c = j % 100, e = b % 4;
      var g = Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3);
      var h = (19 * a + b - Math.floor(b / 4) - g + 15) % 30;
      var l = (32 + 2 * e + 2 * Math.floor(c / 4) - h - c % 4) % 7;
      var t = h + l - 7 * Math.floor((a + 11 * h + 22 * l) / 451) + 114;
      var ostern = new Date(j, Math.floor(t / 31) - 1, (t % 31) + 1);
      var liste = ["0-1", "4-1", "9-3", "10-1", "11-24", "11-25", "11-26", "11-31"];
      [-2, 1, 39, 50, 60].forEach(function (o) {
        liste.push(tagKey(new Date(j, ostern.getMonth(), ostern.getDate() + o)));
      });
      return liste.indexOf(tagKey(d)) !== -1;
    };
    var offen = function (d) { return d.getDay() >= 1 && d.getDay() <= 5 && !feiertag(d); };
    var ahrStatus = function (now) {
      var cur = now.getHours() * 60 + now.getMinutes();
      if (offen(now) && cur >= AUF && cur < ZU) return { open: true, close: hhmm(ZU) };
      for (var i = 0; i < 21; i++) {
        var tag = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        if (!offen(tag) || (i === 0 && cur >= AUF)) continue;
        var wann = i === 0 ? "heute" : i === 1 ? "morgen" : i < 7 ? TAGE[tag.getDay()] :
          TAGE[tag.getDay()] + ", " + tag.getDate() + "." + (tag.getMonth() + 1) + ".";
        return { open: false, next: "öffnet " + wann + " um " + hhmm(AUF) + " Uhr" };
      }
      return { open: false, next: "" };
    };
    var setText = function (sel, txt) {
      var el = document.querySelector(sel);
      if (el) el.textContent = txt;
    };
    var setClass = function (sel, cls) {
      var el = document.querySelector(sel);
      if (el) el.className = cls;
    };
    var ahrApply = function () {
      var s = ahrStatus(new Date());
      setClass("[data-ahr-sysdot]", "ac-dot " + (s.open ? "ac-is-open" : "ac-is-closed"));
      setText("[data-ahr-sys]", s.open ? "Jetzt geöffnet · schließt " + s.close + " Uhr" : "Geschlossen · " + s.next);
      setClass("[data-ahr-deskdot]", "ac-dot" + (s.open ? "" : " ac-is-closed"));
      setText("[data-ahr-state]", s.open ? "Geöffnet" : "Geschlossen");
      setText("[data-ahr-hours]", s.open ? "schließt heute um " + s.close + " Uhr" :
        s.next.charAt(0).toUpperCase() + s.next.slice(1));
    };
    ahrApply();
    setInterval(ahrApply, 60000);
  }
})();
