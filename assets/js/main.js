/* ==========================================================================
   Toá Rooftop — Comportamentos globais
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.TOA_CONFIG || {};
  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------- Links centralizados (data-link) ---------- */
  function waUrl(message) {
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(message || "");
  }

  document.querySelectorAll("[data-link]").forEach(function (el) {
    var key = el.getAttribute("data-link");
    if (key === "whatsapp" && CONFIG.whatsapp) {
      el.href = waUrl(CONFIG.whatsappDefaultMessage);
    } else if (CONFIG.links && CONFIG.links[key]) {
      el.href = CONFIG.links[key];
    }
  });

  /* ---------- Revelação na rolagem ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");

  if (!hasIO || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- Header: sólido após o topo, some ao descer ---------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;

    var updateHeader = function () {
      var y = window.scrollY;
      var menuOpen = root.classList.contains("menu-open");
      header.classList.toggle("is-solid", y > 40);
      if (!menuOpen) {
        var goingDown = y > lastY;
        header.classList.toggle("is-hidden", goingDown && y > window.innerHeight * 0.6);
      }
      lastY = y;
      ticking = false;
    };

    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(updateHeader); ticking = true; }
    }, { passive: true });
    updateHeader();

    /* Mostra o header ao navegar por teclado */
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  }

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var panel = document.querySelector("[data-menu]");
  var label = document.querySelector("[data-menu-label]");

  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Fechar" : "Menu";
    if (open) {
      panel.removeAttribute("inert");
      var first = panel.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    } else {
      panel.setAttribute("inert", "");
    }
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      setMenu(!root.classList.contains("menu-open"));
    });
    panel.querySelectorAll("[data-menu-link]").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    /* Fecha se a tela crescer para desktop com o menu aberto */
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Barra de reserva mobile: aparece quando o CTA do hero sai da tela ---------- */
  var bar = document.querySelector("[data-mobile-bar]");
  var heroCta = document.querySelector("[data-hero-cta]");
  if (bar) {
    if (heroCta && hasIO) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        /* visível quando o CTA do hero já passou (está acima da tela) */
        bar.classList.toggle("is-visible", !e.isIntersecting && e.boundingClientRect.top < 0);
      }).observe(heroCta);
    } else {
      bar.classList.add("is-visible");
    }
  }

  /* ---------- Menu: destaca a seção atual ---------- */
  var navLinks = document.querySelectorAll("[data-nav]");
  if (navLinks.length && hasIO) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    /* Observa todas as seções: as que não estão no menu (hero, coquetelaria)
       limpam o destaque em vez de deixar o anterior aceso. */
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach(function (s) {
      sectionIO.observe(s);
    });
  }

  /* ---------- Pratos-assinatura: item ativo troca a foto (desktop) ---------- */
  document.querySelectorAll("[data-dishes]").forEach(function (list) {
    var items = list.querySelectorAll("[data-dish]");
    var activate = function (item) {
      items.forEach(function (i) { i.classList.toggle("is-active", i === item); });
    };
    items.forEach(function (item) {
      item.addEventListener("mouseenter", function () { activate(item); });
      item.addEventListener("click", function () { activate(item); });
    });
  });

  /* ---------- Tour 360º: iframe sob demanda ---------- */
  document.querySelectorAll("[data-tour]").forEach(function (tour) {
    var btn = tour.querySelector("[data-tour-start]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = (CONFIG.links && CONFIG.links.tour360) || tour.getAttribute("data-tour-src");
      iframe.title = "Tour virtual 360º do Toá Rooftop";
      iframe.className = "tour__frame";
      iframe.allow = "fullscreen; accelerometer; gyroscope; xr-spatial-tracking";
      iframe.setAttribute("allowfullscreen", "");
      iframe.loading = "eager";
      tour.appendChild(iframe);
      tour.classList.add("is-playing");
      iframe.focus();
    });
  });

  /* ---------- Pôr do sol em Maceió (algoritmo solar padrão, estilo SunCalc) ---------- */
  function sunsetAt(date, lat, lng) {
    var rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009;
    var e = rad * 23.4397;
    var lw = rad * -lng, phi = rad * lat;
    var d = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var n = Math.round(d - J0 - lw / (2 * Math.PI));
    var ds = J0 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var h0 = rad * -0.833; /* refração + raio do disco solar */
    var w = Math.acos((Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = J0 + (w + lw) / (2 * Math.PI) + n;
    var Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return new Date((Jset + 0.5 - J1970) * dayMs);
  }

  var sunsetTime = document.querySelector("[data-sunset-time]");
  var addr = CONFIG.address || {};
  if (sunsetTime && typeof addr.lat === "number") {
    try {
      var tz = CONFIG.timezone || "America/Maceio";
      var parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
        .format(new Date()).split("-");
      /* meio-dia UTC do dia local garante o dia certo no cálculo */
      var todayNoon = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12));
      var set = sunsetAt(todayNoon, addr.lat, addr.lng);
      var sunsetText = "Pôr do sol hoje em Maceió";
      if (Date.now() > set.valueOf()) {
        set = sunsetAt(new Date(todayNoon.valueOf() + 86400000), addr.lat, addr.lng);
        sunsetText = "Pôr do sol amanhã em Maceió";
      }
      var hm = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })
        .format(set).split(":");
      sunsetTime.textContent = hm[0] + "h" + hm[1];
      sunsetTime.setAttribute("datetime", set.toISOString());
      var sunsetLabel = document.querySelector("[data-sunset-label]");
      if (sunsetLabel) sunsetLabel.textContent = sunsetText;
    } catch (err) { /* mantém "fim de tarde" */ }
  }

  /* ---------- Horário de hoje (fuso de Maceió) ---------- */
  var todayEl = document.querySelector("[data-today]");
  if (todayEl && CONFIG.hours) {
    try {
      var weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: CONFIG.timezone || "America/Maceio" })
        .format(new Date());
      var idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
      var hours = CONFIG.hours[idx];
      todayEl.textContent = hours ? "Hoje · " + hours : "Hoje · Fechado";
      todayEl.hidden = false;

      /* Destaca o dia de hoje na tabela de horários */
      var row = document.querySelector('.hours [data-day="' + idx + '"]');
      if (row) {
        row.classList.add("is-today");
        row.setAttribute("aria-current", "date");
        var th = row.querySelector("th");
        if (th) th.insertAdjacentHTML("beforeend", ' <span class="hours__today">Hoje</span>');
      }
    } catch (err) { /* sem Intl: mantém oculto */ }
  }

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Vídeo do hero (opcional, leve) ---------- */
  var heroMedia = document.querySelector("[data-hero-media]");
  var conn = navigator.connection || {};
  if (heroMedia && CONFIG.heroVideo && !reduceMotion && !conn.saveData) {
    var video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "metadata";
    video.setAttribute("aria-hidden", "true");
    video.src = CONFIG.heroVideo;
    video.addEventListener("canplay", function () { heroMedia.appendChild(video); }, { once: true });
    video.load();
  }

  /* ---------- Google Analytics 4 ---------- */
  var gaId = CONFIG.ga4Id;
  if (gaId && !/X{4,}/.test(gaId)) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
  }

  /* Eventos de conversão: elementos com data-track="nome_do_evento" */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-track]") : null;
    if (el && typeof window.gtag === "function") {
      window.gtag("event", el.getAttribute("data-track"), { link_url: el.href || "" });
    }
  });

  /* Expõe utilitários para scripts de seção (ex.: formulário de eventos) */
  window.TOA = { waUrl: waUrl, config: CONFIG };
})();
