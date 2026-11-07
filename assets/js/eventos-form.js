/* ==========================================================================
   Toá Rooftop — Formulário de eventos
   Valida os campos e abre o WhatsApp comercial com a mensagem pronta.
   Número em assets/js/config.js (whatsapp). Nada é enviado a servidor.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("[data-events-form]");
  if (!form) return;

  var CONFIG = window.TOA_CONFIG || {};
  var TZ = CONFIG.timezone || "America/Maceio";

  function waUrl(text) {
    if (window.TOA && window.TOA.waUrl) return window.TOA.waUrl(text);
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text);
  }

  /* Hoje no fuso de Maceió, formato AAAA-MM-DD (o mesmo do input date) */
  function todayISO() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
        .format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  /* AAAA-MM-DD → "12/12/2026 (sábado)" */
  function formatDate(iso) {
    var p = iso.split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12));
    var weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(d);
    return p[2] + "/" + p[1] + "/" + p[0] + " (" + weekday + ")";
  }

  var fields = {
    nome: form.elements.nome,
    data: form.elements.data,
    pessoas: form.elements.pessoas,
    tipo: form.elements.tipo,
    mensagem: form.elements.mensagem,
  };

  fields.data.min = todayISO();

  /* Esconde a barra fixa de reserva enquanto a pessoa preenche (teclado aberto no celular) */
  form.addEventListener("focusin", function () {
    document.documentElement.classList.add("is-filling-form");
  });
  form.addEventListener("focusout", function () {
    document.documentElement.classList.remove("is-filling-form");
  });

  /* Regras: retorna a mensagem de erro ou "" */
  var rules = {
    nome: function (v) {
      v = v.trim();
      if (!v) return "Informe seu nome.";
      if (v.length < 2) return "O nome precisa ter pelo menos 2 letras.";
      return "";
    },
    data: function (v) {
      if (!v) return "Escolha a data do evento.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Use uma data válida.";
      if (v < todayISO()) return "Escolha uma data a partir de hoje.";
      return "";
    },
    pessoas: function (v) {
      if (!v) return "Informe o número de pessoas.";
      var n = Number(v);
      if (!Number.isInteger(n) || n < 1) return "Use um número inteiro a partir de 1.";
      return "";
    },
    tipo: function (v) {
      return v ? "" : "Selecione o tipo de evento.";
    },
  };

  function validate(name) {
    var input = fields[name];
    var msg = rules[name](input.value);
    var errorEl = document.getElementById(input.getAttribute("aria-describedby"));
    if (msg) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
    if (errorEl) errorEl.textContent = msg;
    return !msg;
  }

  /* Depois do primeiro erro, revalida enquanto a pessoa corrige */
  Object.keys(rules).forEach(function (name) {
    var input = fields[name];
    var evt = input.tagName === "SELECT" || input.type === "date" ? "change" : "input";
    input.addEventListener(evt, function () {
      if (input.hasAttribute("aria-invalid")) validate(name);
    });
    input.addEventListener("blur", function () {
      if (input.value) validate(name);
    });
  });

  function buildMessage() {
    var lines = [
      "Olá! Gostaria de solicitar uma proposta de evento no Toá Rooftop.",
      "",
      "*Nome:* " + fields.nome.value.trim(),
      "*Data:* " + formatDate(fields.data.value),
      "*Tipo de evento:* " + fields.tipo.value,
      "*Nº de pessoas:* " + Number(fields.pessoas.value),
    ];
    var msg = fields.mensagem.value.trim();
    if (msg) lines.push("*Mensagem:* " + msg);
    lines.push("", "(Enviado pelo site)");
    return lines.join("\n");
  }

  var done = form.querySelector("[data-events-done]");
  var fallback = form.querySelector("[data-events-fallback]");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (done) done.hidden = true;   /* limpa a confirmação de um envio anterior */

    var firstInvalid = null;
    ["nome", "data", "pessoas", "tipo"].forEach(function (name) {
      if (!validate(name) && !firstInvalid) firstInvalid = fields[name];
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var url = waUrl(buildMessage());

    var win = window.open(url, "_blank");
    if (win) win.opener = null;

    if (fallback) fallback.href = url;
    if (done) {
      done.hidden = false;
      done.focus();
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "evento_whatsapp", { event_type: fields.tipo.value, guests: Number(fields.pessoas.value) });
    }
  });
})();
