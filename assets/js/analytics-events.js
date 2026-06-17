/* =========================================================
   /assets/js/analytics-events.js
   Travel Now — GA4 Event Tracking  v1.0
   ID: G-EHFWH0HMRC

   Eventos registrados:
   - whatsapp_click       → clic en cualquier enlace de WhatsApp
   - phone_click          → clic en enlace tel:
   - form_submit          → envío de formulario de contacto o asistente
   - chatbot_opened       → apertura del chat IA
   - chatbot_message_sent → mensaje enviado al chatbot IA
   - cta_click            → clic en botones de servicio (Visas, Pasaportes, etc.)
   - assistant_opened     → apertura del modal asistente rápido
   - schedule_click       → clic en "Agendar cita"
   - advisory_click       → clic en "Solicitar asesoría"
========================================================= */

(function () {
  "use strict";

  /* --- Guard: evita doble inicialización --- */
  if (window.__TN_ANALYTICS_INIT__) return;
  window.__TN_ANALYTICS_INIT__ = true;

  /* --- Helper: push seguro a GA4 --- */
  function track(eventName, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, Object.assign({
      page_location: window.location.href,
      page_title:    document.title
    }, params || {}));
  }

  /* --- Helper: nombre de página legible --- */
  function pageName() {
    var path = window.location.pathname;
    if (path === "/" || path.endsWith("index.html")) return "inicio";
    var parts = path.split("/").filter(Boolean);
    var last  = parts[parts.length - 1] || "index";
    return last.replace(".html", "").replace(/-/g, "_");
  }

  /* --- Helper: texto limpio de un elemento --- */
  function labelOf(el) {
    return (el.getAttribute("aria-label") ||
            el.getAttribute("title")      ||
            el.textContent                || "").trim().slice(0, 80);
  }

  /* ==================================================
     1. WHATSAPP CLICK
     Detecta cualquier clic en enlace wa.me
  ================================================== */
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[href*='wa.me']");
    if (!link) return;
    track("whatsapp_click", {
      source_page: pageName(),
      button_label: labelOf(link) || "whatsapp"
    });
  }, true);

  /* ==================================================
     2. PHONE CLICK
     Detecta clic en enlace tel:
  ================================================== */
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[href^='tel:']");
    if (!link) return;
    track("phone_click", {
      source_page: pageName()
    });
  }, true);

  /* ==================================================
     3. FORM SUBMIT — Formulario de contacto
     IDs: #contactForm, #assistantForm
  ================================================== */
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form) return;

    var formId = form.id || form.className || "form";

    if (formId === "contactForm") {
      track("form_submit", {
        form_id:   "contact_form",
        form_name: "Formulario de contacto",
        source_page: pageName()
      });
    }

    if (formId === "assistantForm") {
      track("form_submit", {
        form_id:   "assistant_form",
        form_name: "Formulario asistente rápido",
        source_page: pageName()
      });
    }
  }, true);

  /* ==================================================
     4. CHATBOT IA — Apertura
     El launcher tiene id: idappsh-chat-launcher
  ================================================== */
  document.addEventListener("click", function (e) {
    var launcher = e.target.closest("#idappsh-chat-launcher");
    if (!launcher) return;
    track("chatbot_opened", {
      source_page: pageName()
    });
  }, true);

  /* ==================================================
     5. CHATBOT IA — Mensaje enviado
     Observa cuando aparece un nuevo .msg del usuario
     en el panel del chat (el chatbot usa e.preventDefault
     en el submit, así que no podemos escuchar el form)
  ================================================== */
  var _chatObserver = null;

  function watchChatMessages() {
    var panel = document.getElementById("idappsh-chat-panel");
    if (!panel || _chatObserver) return;

    var msgContainer = panel.querySelector(".chat-messages, .messages, [class*='messages']");
    if (!msgContainer) {
      /* Si el panel existe pero los mensajes aún no, reintenta */
      setTimeout(watchChatMessages, 800);
      return;
    }

    var _msgCount = msgContainer.querySelectorAll("[class*='msg']").length;

    _chatObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          /* Solo contar mensajes del usuario, no del bot */
          if (node.classList && (node.classList.contains("msg-user") ||
              node.classList.contains("user") ||
              node.getAttribute("data-role") === "user")) {
            track("chatbot_message_sent", {
              source_page: pageName()
            });
          }
        });
      });
    });

    _chatObserver.observe(msgContainer, { childList: true });
  }

  /* Inicia el observer cuando el chat se abre */
  document.addEventListener("click", function (e) {
    var launcher = e.target.closest("#idappsh-chat-launcher");
    if (!launcher) return;
    setTimeout(watchChatMessages, 600);
  }, true);

  /* ==================================================
     6. CTA BUTTONS — Botones de servicio
     Clase: .btn-action-travel
  ================================================== */
  var SERVICE_MAP = {
    "visas-americanas":      "Visas Americanas",
    "pasaportes":            "Pasaportes",
    "agendado-citas":        "Agendado de Citas",
    "asesoria-personalizada":"Asesoría Personalizada",
    "visa-canada":           "Visa Canadá",
    "visa-australia":        "Visa Australia",
    "visa-reino-unido":      "Visa Reino Unido",
    "visa-china":            "Visa China",
    "visa-india":            "Visa India",
    "visa-taiwan":           "Visa Taiwan",
    "visa-sudafrica":        "Visa Sudáfrica",
    "visa-estados-unidos":   "Visa Estados Unidos"
  };

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".btn-action-travel");
    if (!btn) return;

    var href       = btn.getAttribute("href") || "";
    var serviceKey = Object.keys(SERVICE_MAP).find(function (k) {
      return href.indexOf(k) !== -1;
    });

    track("cta_click", {
      service_name: serviceKey ? SERVICE_MAP[serviceKey] : labelOf(btn),
      destination:  href,
      source_page:  pageName()
    });

    /* Detectar si es "Agendar cita" específicamente */
    if (href.indexOf("agendado-citas") !== -1) {
      track("schedule_click", {
        source_page: pageName()
      });
    }

    /* Detectar si es "Solicitar asesoría" */
    if (href.indexOf("asesoria-personalizada") !== -1) {
      track("advisory_click", {
        source_page: pageName()
      });
    }
  }, true);

  /* ==================================================
     7. MODAL ASISTENTE — Apertura
     Trigger: [data-open-assistant]
  ================================================== */
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-open-assistant]");
    if (!trigger) return;
    /* Excluir el botón del chatbot que también usa data-open-assistant */
    if (trigger.closest("#tnSupportPanel, .is-assistant")) return;
    track("assistant_opened", {
      source_page:   pageName(),
      trigger_label: labelOf(trigger) || "asistente_rapido"
    });
  }, true);

})();
