/* ==========================================================================
   Toá Rooftop — Movimento e interações
   - Rolagem suave (Lenis, em assets/vendor) no desktop
   - Hero em "cortina": fica ao fundo enquanto a página desliza por cima
   - Títulos revelados palavra por palavra ([data-split])
   - Faixa tipográfica cinética ([data-kinetic])
   - Letreiro contínuo que reage à rolagem ([data-marquee])
   - Botões magnéticos (mouse)
   Tudo é desligado com "reduzir movimento" do sistema.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  /* ---------- Títulos palavra por palavra ---------- */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            w.className = "w";
            var inner = document.createElement("span");
            inner.className = "w__i";
            inner.style.setProperty("--i", i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    })(el);
    el.classList.add("is-split");
  }

  var splitEls = document.querySelectorAll("[data-split]");
  if (!reduce && hasIO) {
    splitEls.forEach(splitWords);
    var splitIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          splitIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    splitEls.forEach(function (el) { splitIO.observe(el); });
  }

  if (reduce) return; /* o resto é só movimento */

  /* ---------- Rolagem suave ---------- */
  var lenis = null;
  if (window.Lenis && finePointer) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    var rafLenis = function (t) { lenis.raf(t); requestAnimationFrame(rafLenis); };
    requestAnimationFrame(rafLenis);

    document.addEventListener("toa:menu", function (e) {
      if (e.detail && e.detail.open) lenis.stop(); else lenis.start();
    });
  }

  /* Links internos: rolagem suave com o header descontado */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    /* o espaço do header vem do scroll-padding-top do CSS (a Lenis e o scrollIntoView respeitam) */
    if (lenis) {
      lenis.scrollTo(id === "#topo" ? 0 : target, { duration: 1.4 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
    if (history.replaceState) history.replaceState(null, "", id);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  /* ---------- Loop de rolagem: hero em cortina + faixa cinética ---------- */
  var hero = document.querySelector("[data-hero]");
  var kinetics = Array.prototype.slice.call(document.querySelectorAll("[data-kinetic]"));
  var lastScrollY = window.scrollY;
  var velocity = 0;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    velocity = y - lastScrollY;
    lastScrollY = y;

    if (hero) {
      var p = clamp(y / vh, 0, 1);
      hero.style.setProperty("--hero-p", p.toFixed(4));
      /* fora de vista: não precisa pintar */
      hero.style.visibility = p >= 1 ? "hidden" : "";
    }

    kinetics.forEach(function (k) {
      var r = k.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      /* -1 quando entra por baixo, 0 no centro, 1 quando sai por cima */
      var prog = clamp((vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2), -1, 1);
      k.style.setProperty("--p", prog.toFixed(4));
    });
  }

  var scrollQueued = false;
  window.addEventListener("scroll", function () {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(function () { onScroll(); scrollQueued = false; });
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Letreiro contínuo ---------- */
  document.querySelectorAll("[data-marquee]").forEach(function (marquee) {
    var track = marquee.querySelector(".marquee__track");
    if (!track) return;
    /* duplica o conteúdo para o loop não ter emenda */
    track.innerHTML += track.innerHTML;
    var x = 0;
    var dir = 1;
    var visible = false;
    var last = performance.now();
    var BASE = 40; /* px por segundo */

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { last = performance.now(); requestAnimationFrame(tick); }
      }).observe(marquee);
    } else {
      visible = true;
    }

    function tick(now) {
      if (!visible) return;
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (Math.abs(velocity) > 0.5) dir = velocity > 0 ? 1 : -1;      /* inverte com a direção da rolagem */
      var boost = Math.min(Math.abs(velocity) * 6, 600);               /* acelera com a velocidade */
      velocity *= 0.9;
      x -= dir * (BASE + boost) * dt;
      var half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      requestAnimationFrame(tick);
    }
    if (!hasIO) requestAnimationFrame(tick);
  });

  /* ---------- Botões magnéticos (só com mouse) ---------- */
  if (finePointer) {
    document.querySelectorAll(".btn--primary, [data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        btn.style.translate = dx.toFixed(1) + "px " + dy.toFixed(1) + "px";
      });
      btn.addEventListener("mouseleave", function () { btn.style.translate = ""; });
    });
  }
})();
