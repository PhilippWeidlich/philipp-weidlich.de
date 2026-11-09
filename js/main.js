/* ============================================================
   main.js – Vanilla-JS, keine Abhängigkeiten.
   Aufgaben:
     1. Einblenden beim Scrollen (gestaffelt)
     2. Kopfzeile: Zustand beim Scrollen
     3. Menü auf schmalen Displays
     4. Aktiver Navigationspunkt
     5. Lichtkegel unter dem Mauszeiger
     6. Terminal im Hero tippt die Befehle, danach bedienbar (6.1)
     7. E-Mail-Adresse kopieren
     8. Zahl der Referenzen, Jahr im Footer, Ortszeit
     9. AhrComp im Browserfenster: Live-Status
    10. Netzwerk im Hero (Canvas)
    11. Befehlspalette (Strg/⌘ + K)
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
  // Danach wird die Eingabezeile freigeschaltet (Abschnitt 6.1).
  var term = document.querySelector("[data-term]");
  var termInput = term ? term.querySelector("[data-term-input]") : null;
  var MAIL = (document.querySelector("[data-copy]") || { getAttribute: function () { return ""; } })
    .getAttribute("data-copy") || "philippweidlich@proton.me";

  var jumpTo = function (id) {
    var target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", target ? "#" + id : window.location.pathname);
    }
  };

  var copyMail = function () {
    if (!navigator.clipboard || !window.isSecureContext) return Promise.reject();
    return navigator.clipboard.writeText(MAIL);
  };

  // Referenzen und Projekt stehen nur einmal im HTML – Terminal und
  // Befehlspalette lesen sie von dort.
  var refList = [].map.call(document.querySelectorAll("#referenzen .ref"), function (li) {
    var a = li.querySelector(".ref__title a");
    return {
      name: a.childNodes[0].nodeValue.replace(/\s+/g, " ").trim(),
      href: a.href,
      host: a.hostname.replace(/^www\./, "")
    };
  });
  var projectLink = document.querySelector(".project__title a");
  var GITHUB = "https://github.com/philippweidlich";

  /* 6.1 Eingabezeile: ein paar echte Befehle. Ausgaben entstehen nur über
     textContent – was getippt wird, landet nie als HTML auf der Seite. */
  var enableTermPrompt = function () {
    var out = term.querySelector("[data-term-out]");
    var row = term.querySelector("[data-term-row]");
    var body = term.querySelector(".term__body");
    var idle = term.querySelector("[data-term-idle]");
    if (!out || !row || !termInput || !body) return;

    if (idle) idle.parentNode.removeChild(idle);
    row.hidden = false;
    term.classList.add("is-live");

    var history = [];
    var hpos = 0;

    var addLine = function (cls) {
      var d = document.createElement("div");
      d.className = "tl" + (cls ? " " + cls : "");
      out.appendChild(d);
      return d;
    };
    var say = function (text, cls) { addLine(cls).textContent = text; };
    var kv = function (k, v, wide) {
      var d = addLine("tl--kv" + (wide ? " tl--wide" : ""));
      var a = document.createElement("span");
      var b = document.createElement("span");
      a.className = "tk";
      a.textContent = k;
      b.textContent = v;
      d.appendChild(a);
      d.appendChild(b);
    };
    var link = function (label, href, external, prefix) {
      var d = addLine();
      var a = document.createElement("a");
      if (prefix) d.appendChild(document.createTextNode(prefix));
      a.className = "term__link";
      a.href = href;
      a.textContent = label;
      if (external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      d.appendChild(a);
    };
    var textOf = function (sel) {
      var el = document.querySelector(sel);
      return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    };

    var SECTIONS = {
      "ueber-mich": "Über mich",
      "referenzen": "Referenzen",
      "projekte": "Eigene Projekte",
      "kontakt": "Kontakt"
    };
    var FILES = ["ueber-mich.txt", "profil.txt", "kontakt.txt"];

    var HELP = [
      ["help", "diese Übersicht"],
      ["whoami", "wer hier schreibt"],
      ["ls", "was es hier gibt"],
      ["cat <datei>", "Datei lesen, z. B. cat profil.txt"],
      ["cd <ziel>", "zum Abschnitt springen, z. B. cd referenzen"],
      ["referenzen", "alle Referenzen mit Link"],
      ["projekte", "eigenes Projekt"],
      ["github", "GitHub-Profil"],
      ["mail", "E-Mail-Adresse"],
      ["copy", "E-Mail-Adresse kopieren"],
      ["date", "Datum und Uhrzeit"],
      ["clear", "Ausgabe leeren"]
    ];

    var cmds = {
      help: function () {
        HELP.forEach(function (h) { kv(h[0], h[1], true); });
        say("Tab ergänzt, ↑/↓ blättert im Verlauf.", "t-dim");
      },
      whoami: function () { say("philipp-weidlich"); },
      ls: function (args) {
        var dir = (args[0] || "").replace(/\/$/, "");
        if (dir === "referenzen") return cmds.referenzen();
        if (dir === "projekte") return cmds.projekte();
        say(FILES.join("  ") + "  referenzen/  projekte/");
      },
      cat: function (args) {
        var file = (args[0] || "").replace(/\.txt$/, "");
        if (!file) return say("cat: Datei fehlt – zum Beispiel: cat profil.txt", "t-err");
        if (file === "ueber-mich") return say(textOf(".prose__lead"));
        if (file === "profil") {
          [].forEach.call(document.querySelectorAll(".spec__list > div"), function (rowEl) {
            kv(rowEl.querySelector("dt").textContent.trim() + ":", rowEl.querySelector("dd").textContent.trim(), true);
          });
          return;
        }
        if (file === "kontakt") return cmds.mail();
        say("cat: " + args[0] + ": Datei nicht gefunden – „ls“ zeigt, was da ist.", "t-err");
      },
      cd: function (args) {
        var dest = (args[0] || "~").replace(/\/$/, "").replace(/^#/, "");
        if (dest === "~" || dest === ".." || dest === "/") {
          say("→ nach oben", "t-dim");
          return jumpTo("");
        }
        if (!SECTIONS[dest]) {
          return say("cd: " + args[0] + ": gibt es nicht – möglich: " + Object.keys(SECTIONS).join(", "), "t-err");
        }
        say("→ " + SECTIONS[dest], "t-dim");
        termInput.blur();
        jumpTo(dest);
      },
      referenzen: function () {
        refList.forEach(function (r, i) {
          link(r.name, r.href, true, (i < 9 ? "0" : "") + (i + 1) + "  ");
        });
        say("„cd referenzen“ springt zu den Karten.", "t-dim");
      },
      projekte: function () {
        if (projectLink) link("LocalArc", projectLink.href, true, "01  ");
        say("Offline-Media-Player in einer einzigen HTML-Datei.", "t-dim");
      },
      github: function () { link("github.com/philippweidlich", GITHUB, true); },
      mail: function () {
        link(MAIL, "mailto:" + MAIL, false);
        say("Projektanfragen laufen über AhrComp: weidlich@ahrcomp.de", "t-dim");
      },
      copy: function () {
        copyMail().then(
          function () { say("Adresse kopiert: " + MAIL); scrollEnd(); },
          function () { say("Kopieren ist hier nicht möglich – die Adresse: " + MAIL, "t-err"); scrollEnd(); }
        );
      },
      date: function () {
        say(new Date().toLocaleString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " Uhr");
      },
      echo: function (args) { say(args.join(" ")); },
      clear: function () { out.textContent = ""; },
      sudo: function () { say("philipp ist nicht in der sudoers-Datei. Netter Versuch.", "t-err"); },
      exit: function () { say("Hier geblieben – den Tab schließt du selbst."); }
    };
    var ALIAS = {
      hilfe: "help", "?": "help", man: "help", dir: "ls", ll: "ls", refs: "referenzen",
      projekt: "projekte", kontakt: "mail", email: "mail", cls: "clear", open: "cd", goto: "cd"
    };

    var scrollEnd = function () { body.scrollTop = body.scrollHeight; };

    var run = function (raw) {
      var text = raw.trim();
      var echoLine = addLine("tl--gap tl--cmd");
      var p = document.createElement("span");
      var c = document.createElement("span");
      p.className = "tp";
      p.textContent = "~ $";
      c.className = "tc";
      c.textContent = text;
      echoLine.appendChild(p);
      echoLine.appendChild(c);

      if (text) {
        history.push(text);
        var parts = text.split(/\s+/);
        var name = parts[0].toLowerCase();
        name = ALIAS[name] || name;
        // Abschnittsname allein springt direkt hin
        if (!cmds[name] && SECTIONS[name]) {
          parts = ["cd", name];
          name = "cd";
        }
        if (Object.prototype.hasOwnProperty.call(cmds, name)) cmds[name](parts.slice(1));
        else say("bash: " + parts[0] + ": Befehl nicht gefunden – „help“ zeigt, was geht.", "t-err");
      }
      hpos = history.length;
      scrollEnd();
    };

    var complete = function (value) {
      var parts = value.split(/\s+/);
      var pool, word, hits;
      if (parts.length === 1) {
        pool = Object.keys(cmds);
        word = parts[0].toLowerCase();
      } else if (parts.length === 2 && (parts[0] === "cat" || parts[0] === "cd" || parts[0] === "ls")) {
        pool = parts[0] === "cat" ? FILES : Object.keys(SECTIONS);
        word = parts[1].toLowerCase();
      } else {
        return null;
      }
      hits = pool.filter(function (x) { return x.indexOf(word) === 0; });
      if (hits.length !== 1) return null;
      parts[parts.length - 1] = hits[0];
      return parts.join(" ");
    };

    termInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        run(termInput.value);
        termInput.value = "";
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (!history.length) return;
        e.preventDefault();
        hpos = Math.max(0, Math.min(history.length, hpos + (e.key === "ArrowUp" ? -1 : 1)));
        termInput.value = history[hpos] || "";
      } else if (e.key === "Tab" && !e.shiftKey && termInput.value.trim()) {
        // Nur abfangen, wenn es etwas zu ergänzen gibt – sonst wandert der Fokus weiter.
        var done = complete(termInput.value);
        if (done && done !== termInput.value) {
          e.preventDefault();
          termInput.value = done + (done.indexOf(" ") === -1 && /^(cat|cd)$/.test(done) ? " " : "");
        }
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        cmds.clear();
      }
    });

    // Klick irgendwo ins Terminal setzt den Cursor in die Eingabezeile.
    term.addEventListener("click", function (e) {
      if (e.target.closest("a") || String(window.getSelection())) return;
      termInput.focus({ preventScroll: true });
    });
  };

  if (term && !reducedMotion.matches) {
    var lines = term.querySelectorAll(".term__intro .tl");
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
        enableTermPrompt();
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
  } else if (term) {
    enableTermPrompt();
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

  // Ortszeit im Ahrtal neben dem Standort
  var clockEl = document.querySelector("[data-clock]");
  if (clockEl && window.Intl && Intl.DateTimeFormat) {
    try {
      var clockFmt = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
      var tickClock = function () { clockEl.textContent = clockFmt.format(new Date()) + " Uhr"; };
      tickClock();
      clockEl.title = "Ortszeit";
      clockEl.hidden = false;
      window.setInterval(tickClock, 15000);
    } catch (err) { /* Zeitzone unbekannt: Uhr bleibt ausgeblendet */ }
  }

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

  /* --- 10 Netzwerk im Hero ----------------------------------- */
  /* Knoten sitzen auf den Kreuzungen des Hintergrundrasters (72px),
     verbunden über rechtwinklige Leitungen. Pakete laufen von Knoten zu
     Knoten weiter; in der Nähe des Mauszeigers leuchten Knoten auf und
     schicken eigene Pakete los. Läuft nur, solange der Hero sichtbar ist.
     Bei reduzierter Bewegung: ein stehendes Bild. */
  var netCanvas = document.querySelector("[data-net]");
  var netCtx = netCanvas && netCanvas.getContext ? netCanvas.getContext("2d") : null;

  if (netCtx) {
    var CELL = 72;
    var HUES = ["94, 234, 212", "125, 211, 252", "165, 180, 252"];
    var nw = 0, nh = 0;
    var nodes = [], links = [], packets = [];
    var netRaf = 0, netLast = 0, netSpawnAt = 0, netOnScreen = true, netTimer = 0;
    var ptr = { x: 0, y: 0, on: false, spawnAt: 0 };

    var buildNet = function () {
      var rect = netCanvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      nw = Math.round(rect.width);
      nh = Math.round(rect.height);
      if (!nw || !nh) return false;
      netCanvas.width = Math.round(nw * dpr);
      netCanvas.height = Math.round(nh * dpr);
      netCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Am Raster des Hintergrunds ausrichten (waagerecht zentriert).
      var pageTop = rect.top + window.pageYOffset;
      var ox = (((nw - CELL) / 2) % CELL + CELL) % CELL;
      var oy = ((-pageTop) % CELL + CELL) % CELL;
      var cols = Math.floor((nw - ox) / CELL) + 1;
      var rows = Math.floor((nh - oy) / CELL) + 1;
      var want = Math.max(6, Math.min(44, Math.round(cols * rows * 0.19)));
      var used = {};
      nodes = [];
      links = [];
      packets = [];

      for (var tries = 0; nodes.length < want && tries < want * 12; tries++) {
        var c = Math.floor(Math.random() * cols);
        var r = Math.floor(Math.random() * rows);
        if (used[c + ":" + r]) continue;
        used[c + ":" + r] = true;
        nodes.push({
          c: c, r: r,
          x: Math.round(ox + c * CELL) + 0.5,
          y: Math.round(oy + r * CELL) + 0.5,
          core: Math.random() < 0.16,
          phase: Math.random() * 6.283,
          heat: 0,
          links: []
        });
      }

      var linked = {};
      nodes.forEach(function (a, i) {
        var near = [];
        nodes.forEach(function (b, j) {
          var d = Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
          if (i !== j && d <= 5) near.push({ j: j, d: d });
        });
        near.sort(function (p, q) { return p.d - q.d; });
        near.slice(0, 2).forEach(function (n) {
          var key = Math.min(i, n.j) + "-" + Math.max(i, n.j);
          var b = nodes[n.j];
          var pts = [[a.x, a.y]];
          var link;
          if (linked[key]) return;
          linked[key] = true;
          if (a.c !== b.c && a.r !== b.r) pts.push(Math.random() < 0.5 ? [b.x, a.y] : [a.x, b.y]);
          pts.push([b.x, b.y]);
          link = { a: i, b: n.j, pts: pts, len: n.d * CELL, hue: HUES[links.length % HUES.length] };
          links.push(link);
          a.links.push(link);
          b.links.push(link);
        });
      });
      return true;
    };

    var pointAt = function (link, t) {
      var dist = Math.max(0, Math.min(1, t)) * link.len;
      for (var i = 1; i < link.pts.length; i++) {
        var p = link.pts[i - 1], q = link.pts[i];
        var seg = Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]);
        if (dist <= seg || i === link.pts.length - 1) {
          var f = seg ? Math.min(1, dist / seg) : 0;
          return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
        }
        dist -= seg;
      }
      return link.pts[0];
    };

    var spawnPacket = function (link, from) {
      var dir = link.a === from ? 1 : -1;
      packets.push({ link: link, dir: dir, t: dir > 0 ? 0 : 1, speed: 0.07 + Math.random() * 0.08, hops: 0 });
    };

    var drawNet = function (now) {
      var i, k, l, n, p, pos, s, heat;
      netCtx.clearRect(0, 0, nw, nh);

      netCtx.lineWidth = 1;
      for (i = 0; i < links.length; i++) {
        l = links[i];
        heat = Math.max(nodes[l.a].heat, nodes[l.b].heat);
        netCtx.strokeStyle = "rgba(255, 255, 255, " + (0.075 + heat * 0.2).toFixed(3) + ")";
        netCtx.beginPath();
        netCtx.moveTo(l.pts[0][0], l.pts[0][1]);
        for (k = 1; k < l.pts.length; k++) netCtx.lineTo(l.pts[k][0], l.pts[k][1]);
        netCtx.stroke();
      }

      // Pakete: heller Kopf, dahinter eine kurze, ausklingende Spur
      for (i = 0; i < packets.length; i++) {
        p = packets[i];
        for (k = 7; k >= 0; k--) {
          pos = pointAt(p.link, p.t - p.dir * k * 7 / p.link.len);
          netCtx.fillStyle = "rgba(" + p.link.hue + ", " + ((1 - k / 8) * 0.9).toFixed(2) + ")";
          netCtx.beginPath();
          netCtx.arc(pos[0], pos[1], k === 0 ? 2.1 : 1.5 - k * 0.1, 0, 6.283);
          netCtx.fill();
        }
      }

      // Knoten: kleine Gehäuse mit Status-LED
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        s = n.core ? 5 : 3;
        netCtx.fillStyle = "#0b0e13";
        netCtx.strokeStyle = n.core
          ? "rgba(94, 234, 212, " + Math.min(1, 0.45 + n.heat * 0.5).toFixed(2) + ")"
          : "rgba(255, 255, 255, " + Math.min(1, 0.22 + n.heat * 0.5).toFixed(2) + ")";
        netCtx.beginPath();
        netCtx.rect(n.x - s, n.y - s, s * 2, s * 2);
        netCtx.fill();
        netCtx.stroke();

        netCtx.fillStyle = "rgba(94, 234, 212, " +
          Math.min(1, 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(now * 0.002 + n.phase)) + n.heat).toFixed(2) + ")";
        netCtx.beginPath();
        netCtx.arc(n.x, n.y, n.core ? 1.8 : 1.2, 0, 6.283);
        netCtx.fill();

        if (n.heat > 0.03) {
          netCtx.strokeStyle = "rgba(94, 234, 212, " + (n.heat * 0.45).toFixed(2) + ")";
          netCtx.beginPath();
          netCtx.arc(n.x, n.y, s + 4 + n.heat * 6, 0, 6.283);
          netCtx.stroke();
        }
      }
    };

    var tickNet = function (now) {
      var dt = Math.min(now - netLast, 48);
      var maxPackets = Math.max(4, Math.min(16, Math.round(links.length * 0.45)));
      var i, n, d, p, at, node, next, best = -1, bestD = 190;
      netLast = now;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        d = ptr.on ? Math.sqrt((n.x - ptr.x) * (n.x - ptr.x) + (n.y - ptr.y) * (n.y - ptr.y)) : 999;
        n.heat += ((d < 190 ? 1 - d / 190 : 0) - n.heat) * 0.1;
        if (d < bestD && n.links.length) { bestD = d; best = i; }
      }

      if (links.length && now > netSpawnAt && packets.length < maxPackets) {
        p = links[Math.floor(Math.random() * links.length)];
        spawnPacket(p, Math.random() < 0.5 ? p.a : p.b);
        netSpawnAt = now + 220 + Math.random() * 520;
      }
      if (best !== -1 && now > ptr.spawnAt && packets.length < maxPackets + 6) {
        n = nodes[best];
        spawnPacket(n.links[Math.floor(Math.random() * n.links.length)], best);
        ptr.spawnAt = now + 260;
      }

      for (i = packets.length - 1; i >= 0; i--) {
        p = packets[i];
        p.t += p.dir * p.speed * dt / p.link.len;
        if (p.t >= 0 && p.t <= 1) continue;
        // Angekommen: Knoten blinkt auf, das Paket nimmt die nächste Leitung
        at = p.dir > 0 ? p.link.b : p.link.a;
        node = nodes[at];
        node.heat = Math.max(node.heat, 0.7);
        next = [];
        for (d = 0; d < node.links.length; d++) {
          if (node.links[d] !== p.link) next.push(node.links[d]);
        }
        if (next.length && p.hops < 3) {
          p.link = next[Math.floor(Math.random() * next.length)];
          p.dir = p.link.a === at ? 1 : -1;
          p.t = p.dir > 0 ? 0 : 1;
          p.hops++;
        } else {
          packets.splice(i, 1);
        }
      }

      drawNet(now);
      netRaf = window.requestAnimationFrame(tickNet);
    };

    var netStop = function () {
      if (netRaf) window.cancelAnimationFrame(netRaf);
      netRaf = 0;
    };
    var netStart = function () {
      if (netRaf || reducedMotion.matches || !netOnScreen || document.hidden || !nodes.length) return;
      netLast = window.performance.now();
      netRaf = window.requestAnimationFrame(tickNet);
    };
    var netInit = function () {
      netStop();
      if (!buildNet()) return;
      drawNet(0);
      netStart();
    };

    netInit();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        netOnScreen = entries[0].isIntersecting;
        if (netOnScreen) netStart(); else netStop();
      }).observe(netCanvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) netStop(); else netStart();
    });

    // Neu aufbauen, wenn sich die Fläche ändert (Fensterbreite, Schrift geladen)
    var netResized = function () {
      window.clearTimeout(netTimer);
      netTimer = window.setTimeout(function () {
        var rect = netCanvas.getBoundingClientRect();
        if (Math.round(rect.width) !== nw || Math.round(rect.height) !== nh) netInit();
      }, 180);
    };
    if ("ResizeObserver" in window) new ResizeObserver(netResized).observe(netCanvas);
    else window.addEventListener("resize", netResized);

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !netRaf) return;
      var rect = netCanvas.getBoundingClientRect();
      ptr.x = e.clientX - rect.left;
      ptr.y = e.clientY - rect.top;
      ptr.on = ptr.y <= nh;
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { ptr.on = false; });

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", netInit);
    }
  }

  /* --- 11 Befehlspalette ------------------------------------- */
  /* Strg/⌘ + K oder "/" öffnet einen Dialog, der Abschnitte, Referenzen,
     Seiten und ein paar Aktionen durchsucht. Der Dialog entsteht hier im
     Skript – ohne JavaScript gibt es weder Knopf noch totes Markup. */
  var cmdkBtn = document.querySelector("[data-cmdk-open]");

  if (cmdkBtn && typeof HTMLDialogElement === "function" &&
      typeof HTMLDialogElement.prototype.showModal === "function") {
    var make = function (tag, cls, text) {
      var node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    };
    var norm = function (str) {
      return String(str).toLowerCase()
        .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
        .replace(/ß/g, "ss").replace(/é/g, "e");
    };

    var keyEl = cmdkBtn.querySelector("[data-cmdk-key]");
    if (keyEl && /Mac|iPhone|iPad/.test(navigator.platform || "")) keyEl.textContent = "⌘ K";

    var toastEl = null, toastTimer = 0;
    var toast = function (text) {
      if (!toastEl) {
        toastEl = make("p", "toast");
        toastEl.setAttribute("role", "status");
        document.body.appendChild(toastEl);
        void toastEl.offsetWidth;     // damit auch die erste Meldung einblendet
      }
      toastEl.textContent = text;
      toastEl.classList.add("is-on");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { toastEl.classList.remove("is-on"); }, 2400);
    };

    var entries = [];
    var addEntry = function (kind, title, hint, run, extra) {
      entries.push({
        kind: kind, title: title, hint: hint || "", run: run,
        hay: norm([title, hint, kind, extra].join(" "))
      });
    };
    var openTab = function (url) { window.open(url, "_blank", "noopener"); };

    if (nav) {
      [].forEach.call(nav.querySelectorAll('a[href^="#"]'), function (a) {
        var id = a.getAttribute("href").slice(1);
        addEntry("Abschnitt", a.textContent.trim(), "#" + id, function () { jumpTo(id); });
      });
    }
    refList.forEach(function (r) {
      addEntry("Referenz", r.name, r.host, function () { openTab(r.href); }, "webseite webauftritt");
    });
    if (projectLink) {
      addEntry("Projekt", "LocalArc", "github.com", function () { openTab(projectLink.href); }, "open source media player offline");
    }
    addEntry("Aktion", "E-Mail schreiben", MAIL, function () { window.location.href = "mailto:" + MAIL; }, "kontakt mail");
    if (navigator.clipboard && window.isSecureContext) {
      addEntry("Aktion", "E-Mail-Adresse kopieren", "", function () {
        copyMail().then(
          function () { toast("E-Mail-Adresse kopiert"); },
          function () { toast("Kopieren nicht möglich"); }
        );
      }, "kontakt mail copy zwischenablage");
    }
    addEntry("Aktion", "GitHub-Profil öffnen", "github.com/philippweidlich", function () { openTab(GITHUB); }, "code repo");
    if (term && termInput) {
      addEntry("Aktion", "Terminal benutzen", "help, ls, cat …", function () {
        term.scrollIntoView({ block: "center" });
        window.setTimeout(function () { termInput.focus({ preventScroll: true }); }, 60);
      }, "shell konsole bash befehl");
    }
    addEntry("Aktion", "Nach oben", "", function () { jumpTo(""); }, "anfang start top");
    [].forEach.call(document.querySelectorAll(".site-footer__links a:not([target])"), function (a) {
      addEntry("Seite", a.textContent.trim(), a.getAttribute("href"), function () { window.location.href = a.href; }, "rechtliches");
    });

    var dlg = make("dialog", "cmdk");
    var cmdkHead = make("div", "cmdk__head");
    var cmdkInput = make("input", "cmdk__input");
    var cmdkEsc = make("kbd", "kbd", "Esc");
    var cmdkList = make("ul", "cmdk__list");
    var cmdkEmpty = make("p", "cmdk__empty", "Nichts gefunden.");
    var cmdkFoot = make("p", "cmdk__foot");
    var shown = [], active = 0;

    dlg.setAttribute("aria-label", "Befehlspalette");
    cmdkInput.type = "text";
    cmdkInput.placeholder = "Suchen oder springen …";
    cmdkInput.autocomplete = "off";
    cmdkInput.spellcheck = false;
    cmdkInput.setAttribute("role", "combobox");
    cmdkInput.setAttribute("aria-expanded", "true");
    cmdkInput.setAttribute("aria-controls", "cmdk-list");
    cmdkInput.setAttribute("aria-autocomplete", "list");
    cmdkInput.setAttribute("aria-label", "Abschnitt, Referenz oder Aktion suchen");
    cmdkInput.setAttribute("enterkeyhint", "go");
    cmdkEsc.setAttribute("aria-hidden", "true");
    cmdkList.id = "cmdk-list";
    cmdkList.setAttribute("role", "listbox");
    cmdkList.setAttribute("aria-label", "Ergebnisse");
    cmdkEmpty.setAttribute("role", "status");
    cmdkEmpty.hidden = true;
    cmdkFoot.setAttribute("aria-hidden", "true");
    [[["↑", "↓"], "wählen"], [["↵"], "öffnen"], [["Esc"], "schließen"]].forEach(function (pair) {
      var span = make("span");
      pair[0].forEach(function (key) { span.appendChild(make("kbd", "kbd", key)); });
      span.appendChild(document.createTextNode(pair[1]));
      cmdkFoot.appendChild(span);
    });

    cmdkHead.appendChild(cmdkBtn.querySelector("svg").cloneNode(true));
    cmdkHead.appendChild(cmdkInput);
    cmdkHead.appendChild(cmdkEsc);
    dlg.appendChild(cmdkHead);
    dlg.appendChild(cmdkList);
    dlg.appendChild(cmdkEmpty);
    dlg.appendChild(cmdkFoot);
    document.body.appendChild(dlg);

    var setActive = function (index, scroll) {
      active = index;
      [].forEach.call(cmdkList.children, function (li, k) {
        li.setAttribute("aria-selected", k === index ? "true" : "false");
      });
      if (!shown.length) {
        cmdkInput.removeAttribute("aria-activedescendant");
        return;
      }
      cmdkInput.setAttribute("aria-activedescendant", "cmdk-o-" + index);
      if (scroll) cmdkList.children[index].scrollIntoView({ block: "nearest" });
    };

    var render = function () {
      var words = norm(cmdkInput.value).split(/\s+/).filter(Boolean);
      shown = entries.filter(function (entry) {
        return words.every(function (w) { return entry.hay.indexOf(w) !== -1; });
      });
      cmdkList.textContent = "";
      shown.forEach(function (entry, i) {
        var li = make("li", "cmdk__opt");
        var main = make("span", "cmdk__main");
        li.id = "cmdk-o-" + i;
        li.setAttribute("role", "option");
        li.setAttribute("data-i", String(i));
        main.appendChild(make("span", "cmdk__title", entry.title));
        if (entry.hint) main.appendChild(make("span", "cmdk__hint", entry.hint));
        li.appendChild(main);
        li.appendChild(make("span", "cmdk__kind", entry.kind));
        cmdkList.appendChild(li);
      });
      cmdkList.hidden = !shown.length;
      cmdkEmpty.hidden = shown.length > 0;
      cmdkList.scrollTop = 0;
      setActive(0, false);
    };

    var choose = function (index) {
      var entry = shown[index];
      if (!entry) return;
      dlg.close();
      entry.run();
    };
    var openCmdk = function () {
      if (dlg.open) return;
      cmdkInput.value = "";
      render();
      dlg.showModal();
      cmdkInput.focus();
    };
    var optIndex = function (e) {
      var li = e.target.closest(".cmdk__opt");
      return li ? Number(li.getAttribute("data-i")) : -1;
    };

    cmdkInput.addEventListener("input", render);
    cmdkInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (shown.length) setActive((active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length, true);
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(active);
      }
    });
    cmdkList.addEventListener("click", function (e) { choose(optIndex(e)); });
    cmdkList.addEventListener("pointermove", function (e) {
      var i = optIndex(e);
      if (i !== -1 && i !== active) setActive(i, false);
    });
    // Klick neben den Dialog (auf den abgedunkelten Grund) schließt ihn
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

    cmdkBtn.hidden = false;
    cmdkBtn.addEventListener("click", openCmdk);
    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (dlg.open) dlg.close(); else openCmdk();
      } else if (e.key === "/" && !dlg.open && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openCmdk();
      }
    });
  }
})();
