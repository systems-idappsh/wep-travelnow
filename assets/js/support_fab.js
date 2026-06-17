/* =========================================================
   /assets/js/support_fab.js
   Panel flotante de soporte - Travel Now
========================================================= */
(function () {
  "use strict";

  if (window.__TN_SUPPORT_FAB_INIT__) return;
  window.__TN_SUPPORT_FAB_INIT__ = true;

  var WA_URL =
    "https://wa.me/5215521114448?text=Hola%2C%20vengo%20desde%20travel-now.com.mx%20y%20quiero%20informaci%C3%B3n%20%F0%9F%99%82";

  var FB_URL = "https://www.facebook.com/share/1DTbZwXcYM/";
  var TK_URL = "https://www.tiktok.com/@travel.nowvisas";

  function onReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function createSupportUI() {
    /* -------------------------------------------------------
       FIX: Los HTMLs de todas las páginas incluían elementos
       estáticos (#supportFab, #supportPanel, #supportOverlay)
       sin binding funcional. Al cargar este script se creaba
       un segundo FAB (tnSupportFab), resultando en dos botones
       visibles simultáneamente. Se eliminan los residuos estáticos
       antes de crear los elementos dinámicos.
    ------------------------------------------------------- */
    var legacyFab     = document.getElementById("supportFab");
    var legacyPanel   = document.getElementById("supportPanel");
    var legacyOverlay = document.getElementById("supportOverlay");

    if (legacyFab)     legacyFab.remove();
    if (legacyPanel)   legacyPanel.remove();
    if (legacyOverlay) legacyOverlay.remove();

    var overlay = document.getElementById("tnSupportOverlay");
    var fab = document.getElementById("tnSupportFab");
    var panel = document.getElementById("tnSupportPanel");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "tnSupportOverlay";
      overlay.className = "support-overlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }

    if (!fab) {
      fab = document.createElement("button");
      fab.id = "tnSupportFab";
      fab.className = "support-fab";
      fab.type = "button";
      fab.setAttribute("aria-label", "Abrir soporte");
      fab.setAttribute("aria-expanded", "false");
      fab.setAttribute("aria-controls", "tnSupportPanel");

      fab.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M12 2a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h1v-5H6V9a6 6 0 1 1 12 0v1h-3v5h1a3 3 0 0 0 3-3V9a7 7 0 0 0-7-7Zm-2 17h4v2h-4v-2Z"/>' +
        "</svg>";

      document.body.appendChild(fab);
    }

    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "tnSupportPanel";
      panel.className = "support-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "false");
      panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("aria-label", "Soporte Travel Now");

      panel.innerHTML =
        '<div class="support-head">' +
          '<div class="support-title">Contáctanos</div>' +
          '<button type="button" class="support-close" id="tnSupportClose" aria-label="Cerrar soporte">Cerrar</button>' +
        "</div>" +

        '<div class="support-actions">' +

          '<a class="social-btn is-wa" href="' + WA_URL + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="left">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                '<path d="M12 2a10 10 0 0 0-8.68 15l-1.1 4.02 4.12-1.08A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.07-1.1l-.29-.17-2.45.65.66-2.35-.19-.3A8 8 0 1 1 12 20Zm4.2-6.05c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.52.12-.15.23-.6.75-.74.9-.14.15-.27.17-.5.06-.23-.12-.97-.36-1.85-1.14-.68-.61-1.14-1.35-1.27-1.58-.13-.23-.01-.35.1-.46.1-.1.23-.27.34-.4.11-.14.15-.23.23-.38.08-.15.04-.28-.02-.4-.06-.12-.52-1.24-.71-1.7-.19-.44-.38-.38-.52-.38h-.44c-.15 0-.4.05-.6.28-.2.23-.78.76-.78 1.85s.8 2.14.91 2.29c.12.15 1.58 2.48 3.86 3.38.54.23.97.36 1.3.46.55.18 1.05.15 1.44.09.44-.07 1.36-.56 1.55-1.1.19-.55.19-1.01.13-1.1-.06-.1-.21-.15-.44-.27Z"/>' +
              "</svg>" +
              '<span class="meta"><span class="label">WhatsApp</span><span class="sub">Respuesta inmediata</span></span>' +
            "</span>" +
            '<span aria-hidden="true">→</span>' +
          "</a>" +

          '<a class="social-btn is-fb" href="' + FB_URL + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="left">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                '<path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6H16.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.2V11H7.5v3H10v8h3.5Z"/>' +
              "</svg>" +
              '<span class="meta"><span class="label">Facebook</span><span class="sub">Travel Now</span></span>' +
            "</span>" +
            '<span aria-hidden="true">→</span>' +
          "</a>" +

          '<a class="social-btn is-tk" href="' + TK_URL + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="left">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                '<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09Z"/>' +
              "</svg>" +
              '<span class="meta"><span class="label">TikTok</span><span class="sub">@travel.nowvisas</span></span>' +
            "</span>" +
            '<span aria-hidden="true">→</span>' +
          "</a>" +

          '<a class="social-btn is-phone" href="tel:+5215521114448">' +
            '<span class="left">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                '<path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24c1.12.37 2.33.57 3.59.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.47.57 3.59a1 1 0 0 1-.24 1l-2.2 2.2z"/>' +
              "</svg>" +
              '<span class="meta"><span class="label">Llamar</span><span class="sub">55 2111 4448</span></span>' +
            "</span>" +
            '<span aria-hidden="true">→</span>' +
          "</a>" +

          '<button class="social-btn is-assistant" type="button" data-open-assistant>' +
            '<span class="left">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                '<path d="M12 2a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h1v-5H6V9a6 6 0 1 1 12 0v1h-3v5h1a3 3 0 0 0 3-3V9a7 7 0 0 0-7-7Zm-2 17h4v2h-4z"/>' +
              "</svg>" +
              '<span class="meta"><span class="label">Asistente</span><span class="sub">Formulario guiado</span></span>' +
            "</span>" +
            '<span aria-hidden="true">→</span>' +
          "</button>" +

        "</div>";

      document.body.appendChild(panel);
    }

    return {
      overlay: overlay,
      fab: fab,
      panel: panel
    };
  }

  function init() {
    var ui = createSupportUI();

    if (!ui || !ui.overlay || !ui.fab || !ui.panel) return;

    var overlay = ui.overlay;
    var fab = ui.fab;
    var panel = ui.panel;
    var lastFocused = null;

    if (fab.dataset.tnSupportBound === "true") return;
    fab.dataset.tnSupportBound = "true";

    function isOpen() {
      return panel.classList.contains("is-open");
    }

    function openPanel() {
      lastFocused = document.activeElement;

      overlay.classList.add("is-open");
      panel.classList.add("is-open");

      overlay.setAttribute("aria-hidden", "false");
      panel.setAttribute("aria-hidden", "false");
      fab.setAttribute("aria-expanded", "true");

      var closeButton = document.getElementById("tnSupportClose");

      if (closeButton) {
        setTimeout(function () {
          closeButton.focus();
        }, 50);
      }
    }

    function closePanel() {
      overlay.classList.remove("is-open");
      panel.classList.remove("is-open");

      overlay.setAttribute("aria-hidden", "true");
      panel.setAttribute("aria-hidden", "true");
      fab.setAttribute("aria-expanded", "false");

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    fab.addEventListener("click", function () {
      if (isOpen()) {
        closePanel();
        return;
      }

      openPanel();
    });

    overlay.addEventListener("click", closePanel);

    document.addEventListener("click", function (event) {
      var target = event.target;

      if (!target) return;

      if (target.closest("#tnSupportClose")) {
        closePanel();
        return;
      }

      if (target.closest(".is-support")) {
        event.preventDefault();
        openPanel();
        return;
      }

      if (target.closest(".is-assistant")) {
        closePanel();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!event) return;

      if (event.key === "Escape" && isOpen()) {
        closePanel();
      }
    });
  }

  onReady(init);
})();