/* WA Folders email signup. Posts to the dedicated Netlify function. Never used to send mail by itself. */
(function () {
  var ENDPOINT = "https://wafolders-signup.netlify.app/api/subscribe";
  var MSG = {
    en: {
      sending: "Sending…",
      ok: "Thanks — you're on the list.",
      already: "Thanks — you're already on the list.",
      invalid: "Please enter a valid email address.",
      rate: "Too many tries. Please wait a bit and try again.",
      fail: "Something went wrong. Please try again, or email toolshed+wafolders@mail.grokbot.com."
    },
    "pt-BR": {
      sending: "Enviando…",
      ok: "Pronto — você está na lista.",
      already: "Pronto — você já está na lista.",
      invalid: "Digite um endereço de e-mail válido.",
      rate: "Muitas tentativas. Espere um pouco e tente de novo.",
      fail: "Não deu certo. Tente de novo, ou escreva para toolshed+wafolders@mail.grokbot.com."
    }
  };

  function messages(form) {
    return MSG[form.getAttribute("data-lang")] || MSG.en;
  }

  function setStatus(form, text, kind) {
    var el = form.parentElement.querySelector(".status");
    if (!el) return;
    el.textContent = text || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  function validEmail(v) {
    v = (v || "").trim();
    if (!v || v.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var form = ev.target;
    var t = messages(form);
    var emailInput = form.querySelector('input[name="email"]');
    var honey = form.querySelector('input[name="website"]');
    var btn = form.querySelector('button[type="submit"]');
    var email = (emailInput && emailInput.value) || "";
    if (!validEmail(email)) {
      setStatus(form, t.invalid, "err");
      if (emailInput) emailInput.focus();
      return;
    }
    if (btn) btn.disabled = true;
    setStatus(form, t.sending, "");
    var body = {
      email: email,
      website: (honey && honey.value) || "",
      source: form.getAttribute("data-source") || "",
      lang: form.getAttribute("data-lang") || ""
    };
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { res: res, data: data || {} };
        }).catch(function () {
          return { res: res, data: {} };
        });
      })
      .then(function (r) {
        if (r.data.ok) {
          setStatus(form, r.data.already ? t.already : t.ok, "ok");
          if (emailInput) emailInput.value = "";
        } else if (r.data.error === "invalid_email") {
          setStatus(form, t.invalid, "err");
        } else if (r.data.error === "rate_limited" || r.res.status === 429) {
          setStatus(form, t.rate, "err");
        } else {
          setStatus(form, t.fail, "err");
        }
      })
      .catch(function () {
        setStatus(form, t.fail, "err");
      })
      .then(function () {
        if (btn) btn.disabled = false;
      });
  }

  function init() {
    var forms = document.querySelectorAll("form.js-signup");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", onSubmit);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
