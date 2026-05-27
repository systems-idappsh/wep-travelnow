/* =========================================================
   /assets/js/assistant_form.js
   Formulario asistente -> WhatsApp
========================================================= */
(function () {
  "use strict";

  if (window.__TN_ASSISTANT_FORM_INIT__) return;
  window.__TN_ASSISTANT_FORM_INIT__ = true;

  var WA_NUMBER = "5215521114448";
  var STORAGE_KEY = "travelNowAssistantFormData";
  var MAX_DETALLE = 200;

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var telRegex = /^[0-9+\s().-]{7,20}$/;

  function onReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function valueOf(element) {
    return element && typeof element.value === "string" ? element.value.trim() : "";
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function setMessage(target, message, type) {
    if (!target) return;

    target.textContent = message || "";
    target.className = "notice";

    if (type) {
      target.classList.add("is-" + type);
    }
  }

  function isStorageAvailable() {
    try {
      var key = "__tn_storage_test__";
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function init() {
    var form = byId("assistantForm");

    if (!form) return;
    if (form.dataset.tnAssistantBound === "true") return;

    form.dataset.tnAssistantBound = "true";

    var fields = {
      nombre: byId("a_nombre"),
      tel: byId("a_tel"),
      email: byId("a_email"),
      tramite: byId("a_tramite"),
      ciudad: byId("a_ciudad"),
      detalle: byId("a_detalle")
    };

    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    var charCount = byId("charCount");
    var formMsg = byId("formMsg");
    var canStore = isStorageAvailable();

    function setState(element, valid, touched) {
      if (!element) return;

      if (!touched) {
        element.removeAttribute("aria-invalid");
        element.classList.remove("is-valid", "is-invalid");
        return;
      }

      element.setAttribute("aria-invalid", valid ? "false" : "true");
      element.classList.toggle("is-valid", valid);
      element.classList.toggle("is-invalid", !valid);
    }

    function validateField(name, touched) {
      var element = fields[name];
      var value = valueOf(element);
      var valid = true;

      if (name === "nombre") {
        valid = normalizeText(value).length >= 3;
      }

      if (name === "email") {
        valid = emailRegex.test(value);
      }

      if (name === "tel") {
        valid = !value || telRegex.test(value);
      }

      if (name === "tramite") {
        valid = value.length > 0;
      }

      if (name === "ciudad") {
        valid = value.length > 0;
      }

      if (name === "detalle") {
        var requiereDetalle = valueOf(fields.tramite).toLowerCase() === "otros";

        valid = !requiereDetalle || normalizeText(value).length >= 5;

        if (value.length > MAX_DETALLE) {
          valid = false;
        }
      }

      setState(element, valid, touched);
      return valid;
    }

    function updateCounter() {
      if (!fields.detalle || !charCount) return;

      var count = fields.detalle.value.length;

      charCount.textContent = count + " / " + MAX_DETALLE;
      charCount.classList.toggle("is-limit", count >= MAX_DETALLE);
    }

    function validateAll(touched) {
      var names = ["nombre", "email", "tel", "tramite", "ciudad", "detalle"];

      var valid = names.every(function (name) {
        return validateField(name, touched);
      });

      if (submitBtn) {
        submitBtn.disabled = !valid;
      }

      updateCounter();

      return valid;
    }

    function save() {
      if (!canStore) return;

      try {
        var data = {};

        Object.keys(fields).forEach(function (key) {
          data[key] = valueOf(fields[key]);
        });

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {}
    }

    function restore() {
      if (!canStore) return;

      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) return;

        var data = JSON.parse(raw);

        if (!data || typeof data !== "object") return;

        Object.keys(fields).forEach(function (key) {
          if (fields[key] && typeof data[key] === "string") {
            fields[key].value = data[key];
          }
        });
      } catch (error) {}
    }

    function clearStoredData() {
      if (!canStore) return;

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {}
    }

    function buildWhatsAppMessage() {
      var lines = [
        "Hola, solicito información desde travel-now.com.mx:",
        "Nombre: " + normalizeText(valueOf(fields.nombre)),
        "Teléfono: " + (normalizeText(valueOf(fields.tel)) || "No proporcionado"),
        "Correo: " + valueOf(fields.email),
        "Trámite: " + normalizeText(valueOf(fields.tramite)),
        "Ubicación consulado: " + normalizeText(valueOf(fields.ciudad))
      ];

      var detalle = normalizeText(valueOf(fields.detalle));

      if (detalle) {
        lines.push("Detalles: " + detalle);
      }

      return lines.join("\n");
    }

    Object.keys(fields).forEach(function (key) {
      var element = fields[key];

      if (!element) return;

      element.addEventListener("input", function () {
        validateAll(true);
        save();
        setMessage(formMsg, "", "");
      });

      element.addEventListener("change", function () {
        validateAll(true);
        save();
        setMessage(formMsg, "", "");
      });

      element.addEventListener("blur", function () {
        validateField(key, true);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!validateAll(true)) {
        setMessage(formMsg, "Revisa los campos marcados antes de continuar.", "error");
        return;
      }

      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(buildWhatsAppMessage());

      setMessage(formMsg, "Abriendo WhatsApp...", "success");

      var popup = window.open(url, "_blank", "noopener,noreferrer");

      if (popup) {
        popup.opener = null;
      } else {
        window.location.href = url;
      }

      clearStoredData();
      form.reset();
      validateAll(false);
      updateCounter();
    });

    restore();
    validateAll(false);
    updateCounter();
  }

  onReady(init);
})();