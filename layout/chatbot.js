/* =========================================================
   /layout/chatbot.js  — Travel Now Chatbot IA v2.0
   Cambios respecto a v1:
   - Saludo por hora local (buenos días / tardes / noches)
   - Botones iniciales: Info. página actual · Pregunta directa · WhatsApp
   - handleAction: caso __page_info__ corregido
   - Tracking de visitante: VISITOR_ID, VISITOR_NAME, LAST_PAGE, LAST_INTENT
   - Extracción de nombre desde mensajes del usuario
   - Payload completo al Worker: visitor_id, visitor_name, page_path, max_reply_chars

   Sin cambios:
   - IDs idappsh-chat-* (CSS ya los usa)
   - Worker/CSS/HTML/layout-loader — no tocar
========================================================= */
(function () {
  "use strict";

  if (window.__TN_CHATBOT_INIT__) return;

  window.__TN_CHATBOT_INIT__          = true;
  window.__TRAVEL_NOW_CHATBOT_INIT__  = true;
  window.__IDAPPSH_CHATBOT_INIT__     = true;

  /* -------------------------------------------------------
     Constantes
  ------------------------------------------------------- */
  var WORKER_URL    = "https://travelnow-chatbot-ia.systems-idappsh.workers.dev/chat";
  var WHATSAPP_URL  = "https://wa.me/5215521114448";
  var CHATBOT_CSS   = "/assets/css/layout/chatbot.css";
  var CHATBOT_ICON  = "/assets/img/mp4/flotante1.webp";
  var MAX_REPLY_CHARS = 520;

  // Claves localStorage
  var SESSION_KEY      = "TRAVEL_NOW_CHAT_SESSION_ID";
  var CONTEXT_KEY      = "TRAVEL_NOW_CHAT_CONTEXT";
  var VISITOR_ID_KEY   = "TRAVEL_NOW_VISITOR_ID";
  var VISITOR_NAME_KEY = "TRAVEL_NOW_VISITOR_NAME";
  var LAST_PAGE_KEY    = "TRAVEL_NOW_LAST_PAGE";
  var LAST_INTENT_KEY  = "TRAVEL_NOW_LAST_INTENT";
  var HISTORY_KEY      = "TRAVEL_NOW_CHAT_HISTORY";

  // Palabras rechazadas para el patrón "soy X"
  var SOY_BLOCKLIST = [
    "estudiante", "mexicano", "mexicana", "menor", "cliente", "usuario",
    "asesor", "asesora", "turista", "adulto", "adulta", "mayor", "persona",
    "solicitante", "de", "del", "la", "el", "un", "una", "nuevo", "nueva",
    "interesado", "interesada", "extranjero", "extranjera"
  ];

  /* -------------------------------------------------------
     Utilidades generales
  ------------------------------------------------------- */

  function onReady(callback) {
    if (typeof callback !== "function") return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function safeText(value, maxLength) {
    var limit = Number.isFinite(Number(maxLength)) ? Number(maxLength) : 2000;
    if (typeof value !== "string") return "";
    return value.trim().slice(0, limit);
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  /* -------------------------------------------------------
     Saludo por hora local
  ------------------------------------------------------- */

  function getTimeGreeting() {
    var hour = new Date().getHours();
    if (hour >= 5  && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }

  /* -------------------------------------------------------
     Helpers localStorage (tolerantes a fallo)
  ------------------------------------------------------- */

  function lsGet(key) {
    try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) { /* noop */ }
  }

  function getVisitorId() {
    var id = lsGet(VISITOR_ID_KEY);
    if (id) return id;
    id = makeId();
    lsSet(VISITOR_ID_KEY, id);
    return id;
  }

  function getVisitorName()         { return lsGet(VISITOR_NAME_KEY); }
  function setVisitorName(name)     { lsSet(VISITOR_NAME_KEY, safeText(name, 60)); }
  function getLastPage()            { return lsGet(LAST_PAGE_KEY); }
  function setLastPage(path)        { lsSet(LAST_PAGE_KEY, safeText(path, 300)); }
  function setLastIntent(intent)    { lsSet(LAST_INTENT_KEY, safeText(intent, 120)); }

  function parseStoredContext() { return lsGet(CONTEXT_KEY) || "inicio"; }
  function setStoredContext(ctx) { lsSet(CONTEXT_KEY, ctx); }

  function parseSessionId() {
    var id = lsGet(SESSION_KEY);
    if (id) return id;
    id = makeId();
    lsSet(SESSION_KEY, id);
    return id;
  }

  /* -------------------------------------------------------
     Extracción de nombre desde mensaje del usuario
     Patrones: "me llamo X", "mi nombre es X", "soy X"
  ------------------------------------------------------- */

  /* -------------------------------------------------------
     Persistencia del historial en localStorage
     - Maximo 12 mensajes, cada uno truncado a 900 chars
     - Si el JSON guardado esta corrupto, reinicia silenciosamente
  ------------------------------------------------------- */

  function loadHistory() {
    var raw = lsGet(HISTORY_KEY);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (m) {
          return m && typeof m === "object" &&
                 (m.role === "user" || m.role === "assistant") &&
                 typeof m.content === "string";
        })
        .map(function (m) {
          return { role: m.role, content: m.content.slice(0, 900) };
        })
        .slice(-12);
    } catch (e) {
      lsSet(HISTORY_KEY, "");
      return [];
    }
  }

  function saveHistory(history) {
    var trimmed = history
      .map(function (m) {
        return { role: m.role, content: String(m.content || "").slice(0, 900) };
      })
      .slice(-12);
    try {
      lsSet(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) { /* noop - quota excedida, no romper */ }
  }

  function extractName(text) {
    if (typeof text !== "string") return null;

    var patterns = [
      /\bme\s+llamo\s+([A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30})/i,
      /\bmi\s+nombre\s+es\s+([A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30})/i,
      /\bsoy\s+([A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30})(?=\s*[,.\n!?]|\s*$)/i
    ];

    var found = null;
    patterns.some(function (re) {
      var match = text.match(re);
      if (!match || !match[1]) return false;
      var candidate = match[1].toLowerCase();
      if (SOY_BLOCKLIST.indexOf(candidate) !== -1) return false;
      found = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      return true;
    });

    return found;
  }

  /* -------------------------------------------------------
     Constructor del saludo inicial
     - Usa nombre guardado si existe
     - Detecta si el usuario viene de otra página
  ------------------------------------------------------- */

  function buildGreeting() {
    var saludo      = getTimeGreeting();
    var name        = getVisitorName();
    var lastPage    = getLastPage();
    var currentPath = window.location.pathname;

    // Persistir página actual
    setLastPage(currentPath);

    if (name && lastPage && lastPage !== currentPath) {
      // Visitante conocido que viene de otra sección
      return saludo + ", " + name + " 👋\nSeguimos aquí. ¿En qué puedo ayudarte?";
    }

    if (name) {
      return saludo + ", " + name + " 👋\nSoy el asistente de Travel Now. ¿En qué puedo ayudarte?";
    }

    return saludo + " 👋 Soy el asistente de Travel Now.\n¿En qué puedo ayudarte?";
  }

  /* -------------------------------------------------------
     DOM — CSS y marcado del chatbot
  ------------------------------------------------------- */

  function ensureStylesheet(href) {
    var cleanHref = safeText(href, 300);
    var links;
    var index;

    if (!cleanHref) return;

    links = document.querySelectorAll('link[rel="stylesheet"][href]');
    for (index = 0; index < links.length; index += 1) {
      try {
        if (new URL(links[index].getAttribute("href"), document.baseURI).pathname === cleanHref) {
          return;
        }
      } catch (error) {
        if (links[index].getAttribute("href") === cleanHref) return;
      }
    }

    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cleanHref;
    document.head.appendChild(link);
  }

  function createElement(tagName, options) {
    var el   = document.createElement(tagName);
    var opts = options && typeof options === "object" ? options : {};
    var key;

    if (opts.id)        el.id        = opts.id;
    if (opts.className) el.className = opts.className;
    if (opts.text)      el.textContent = opts.text;

    if (opts.attrs && typeof opts.attrs === "object") {
      for (key in opts.attrs) {
        if (Object.prototype.hasOwnProperty.call(opts.attrs, key)) {
          el.setAttribute(key, String(opts.attrs[key]));
        }
      }
    }

    return el;
  }

  function ensureChatbotMarkup() {
    var existingLauncher = document.getElementById("idappsh-chat-launcher");
    var existingPanel    = document.getElementById("idappsh-chat-panel");

    if (existingLauncher && existingPanel) return;

    if (existingLauncher) existingLauncher.remove();
    if (existingPanel)    existingPanel.remove();

    // --- Launcher (botón flotante) ---
    var launcher = createElement("button", {
      id: "idappsh-chat-launcher",
      attrs: { type: "button", "aria-label": "Abrir chat de Travel Now" }
    });

    var icon = createElement("img", {
      className: "chatbot-gif-icon",
      attrs: {
        src: CHATBOT_ICON, alt: "Travel Now Assistant",
        loading: "eager", decoding: "async", width: "92", height: "192"
      }
    });

    var fallbackIcon = createElement("i", {
      className: "fa-solid fa-comments",
      attrs: { "aria-hidden": "true" }
    });

    icon.addEventListener("error", function () {
      icon.remove();
      if (!launcher.contains(fallbackIcon)) launcher.appendChild(fallbackIcon);
    });

    launcher.appendChild(icon);

    // --- Panel del chat ---
    var panel = createElement("section", {
      id: "idappsh-chat-panel",
      attrs: { "aria-hidden": "true", "aria-label": "Chat de Travel Now" }
    });

    var head   = createElement("div", { className: "chat-head" });
    var title  = createElement("div", { className: "chat-title" });
    var name   = createElement("div", { className: "chat-name", text: "Travel Now Assistant" });
    var sub    = createElement("div", { className: "chat-sub", text: "Visas, pasaportes y asesoría" });
    var close  = createElement("button", {
      id: "idappsh-chat-close", className: "chat-close", text: "×",
      attrs: { type: "button", "aria-label": "Cerrar chat" }
    });

    title.appendChild(name);
    title.appendChild(sub);
    head.appendChild(title);
    head.appendChild(close);

    var body = createElement("div", {
      id: "idappsh-chat-messages", className: "chat-body",
      attrs: { role: "log", "aria-live": "polite" }
    });

    var form = createElement("form", {
      id: "idappsh-chat-form", className: "chat-foot",
      attrs: { autocomplete: "off" }
    });

    var input = createElement("input", {
      id: "idappsh-chat-input",
      attrs: {
        type: "text", placeholder: "Escribe tu duda…",
        autocomplete: "off", maxlength: "1600", "aria-label": "Escribe tu mensaje"
      }
    });

    var send = createElement("button", {
      id: "idappsh-chat-send", className: "chat-send",
      attrs: { type: "submit", "aria-label": "Enviar mensaje" }
    });

    var sendIcon = createElement("i", {
      className: "fa-solid fa-paper-plane",
      attrs: { "aria-hidden": "true" }
    });

    send.appendChild(sendIcon);
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(form);

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
  }

  function normalizeButtons(buttons) {
    if (!Array.isArray(buttons)) return [];
    return buttons
      .filter(function (item) { return item && typeof item === "object"; })
      .map(function (item) {
        return {
          label: safeText(item.label || "Opción", 70),
          send:  safeText(item.send  || "", 260),
          url:   safeText(item.url   || "", 500)
        };
      })
      .filter(function (item) { return item.label && (item.send || item.url); });
  }

  /* -------------------------------------------------------
     Inicialización principal (post-DOMContentLoaded)
  ------------------------------------------------------- */

  onReady(function () {
    ensureStylesheet(CHATBOT_CSS);
    ensureChatbotMarkup();

    var launcher = document.getElementById("idappsh-chat-launcher");
    var panel    = document.getElementById("idappsh-chat-panel");
    var closeBtn = document.getElementById("idappsh-chat-close");
    var msgList  = document.getElementById("idappsh-chat-messages");
    var input    = document.getElementById("idappsh-chat-input");
    var sendBtn  = document.getElementById("idappsh-chat-send");
    var form     = document.getElementById("idappsh-chat-form");

    var booted         = false;
    var isSending      = false;
    var history        = loadHistory();
    var currentContext = parseStoredContext();
    var sessionId      = parseSessionId();
    var visitorId      = getVisitorId();
    var navStack       = [];

    if (!launcher || !panel || !closeBtn || !msgList || !input || !sendBtn || !form) {
      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("[Travel Now chatbot] Faltan elementos para inicializar.");
      }
      return;
    }

    /* ---
       Opciones por defecto cuando el Worker no devuelve opciones
    --- */
    var DEFAULT_OPTIONS = [
      { label: "Visas americanas", send: "Quiero información sobre visas americanas" },
      { label: "Pasaportes",       send: "Quiero información sobre pasaportes" },
      { label: "Agendar cita",     send: "Quiero información sobre agendado de citas" },
      { label: "Asesoría",         send: "Quiero una asesoría personalizada" },
      { label: "Visas por país",   send: "Quiero información sobre visas por país" }
    ];

    /* -------------------------------------------------------
       Estado del chat
    ------------------------------------------------------- */

    function resetChat() {
      msgList.replaceChildren();
      history = [];
      saveHistory([]);
      navStack.length = 0;
      currentContext = parseStoredContext();
    }

    function appendBubble(role, text) {
      var div = document.createElement("div");
      div.className = "msg " + (role === "user" ? "user" : "assistant");
      div.textContent = String(text == null ? "" : text);
      msgList.appendChild(div);
      msgList.scrollTop = msgList.scrollHeight;
      return div;
    }

    function appendButtonsRow(buttons, options) {
      var settings     = options && typeof options === "object" ? options : {};
      var validButtons = normalizeButtons(buttons);
      var wrap;

      if (!validButtons.length) return null;

      wrap = document.createElement("div");
      wrap.className = "action-row";

      validButtons.forEach(function (item) {
        if (item.url) {
          var a = document.createElement("a");
          a.className   = "action-btn";
          a.href        = item.url;
          a.target      = "_blank";
          a.rel         = "noopener noreferrer";
          a.textContent = item.label;
          wrap.appendChild(a);
          return;
        }

        var btn = document.createElement("button");
        btn.className   = "action-btn";
        btn.type        = "button";
        btn.textContent = item.label;
        btn.addEventListener("click", function () {
          wrap.remove();
          handleAction(item.send);
        });
        wrap.appendChild(btn);
      });

      if (!wrap.childNodes.length) return null;

      msgList.appendChild(wrap);
      msgList.scrollTop = msgList.scrollHeight;

      if (settings.pushMenu) {
        var onlySend = validButtons.filter(function (item) { return item.send; });
        if (onlySend.length) {
          navStack.push({ context: currentContext, options: onlySend });
          if (navStack.length > 30) navStack.shift();
        }
      }

      return wrap;
    }

    /* -------------------------------------------------------
       Pantalla de inicio y navegación hacia atrás
    ------------------------------------------------------- */

    function showStart() {
      appendBubble("assistant", buildGreeting());
      appendButtonsRow([
        { label: "Info. página actual", send: "__page_info__" },
        { label: "Pregunta directa",    send: "__direct__"    },
        { label: "WhatsApp",            url:  WHATSAPP_URL    }
      ], { pushMenu: true });
    }

    function goBackMenu() {
      if (navStack.length < 2) {
        resetChat();
        showStart();
        return;
      }
      navStack.pop();
      var previous = navStack[navStack.length - 1];
      if (previous && previous.context) {
        currentContext = previous.context;
        setStoredContext(currentContext);
      }
      appendButtonsRow(previous.options, { pushMenu: false });
    }

    /* -------------------------------------------------------
       Posicionamiento del panel relativo al launcher
    ------------------------------------------------------- */

    function clamp(number, min, max) {
      return Math.max(min, Math.min(max, number));
    }

    function syncPanelToLauncher() {
      var panelHeight = panel.offsetHeight || 540;
      var launcherBox = launcher.getBoundingClientRect();
      var top = clamp(launcherBox.top - panelHeight - 14, 12, window.innerHeight - panelHeight - 12);
      panel.style.bottom = "auto";
      panel.style.top    = String(top) + "px";
    }

    /* -------------------------------------------------------
       Apertura y cierre del panel
    ------------------------------------------------------- */

    function openPanel() {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      launcher.setAttribute("aria-expanded", "true");

      if (!booted) {
        booted = true;
        resetChat();
        showStart();
      }

      window.requestAnimationFrame(function () {
        syncPanelToLauncher();
        input.focus();
      });
    }

    function closePanel() {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      launcher.setAttribute("aria-expanded", "false");
    }

    function togglePanel() {
      if (panel.classList.contains("open")) { closePanel(); return; }
      openPanel();
    }

    /* -------------------------------------------------------
       Event listeners
    ------------------------------------------------------- */

    launcher.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePanel();
    });

    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closePanel();
    });

    // Evitar que clics dentro del panel cierren el chat
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // Clic fuera del panel → cerrar
    document.addEventListener("click", function (e) {
      if (!panel.classList.contains("open")) return;
      if (!panel.contains(e.target) && !launcher.contains(e.target)) closePanel();
    });

    // Escape → cerrar
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });

    // Trigger externo: data-open-chatbot o data-open-ai-chat
    document.addEventListener("click", function (e) {
      var trigger = e.target && e.target.closest
        ? e.target.closest("[data-open-chatbot], [data-open-ai-chat]")
        : null;
      if (!trigger) return;
      e.preventDefault();
      openPanel();
    });

    /* -------------------------------------------------------
       Presencia animada del launcher (flotar + nudge periódico)
    ------------------------------------------------------- */

    function setupPresence() {
      var raf  = null;
      var lock = false;
      var minTop = 140;

      function maxTop() { return Math.max(180, window.innerHeight - 170); }

      function setTop(px) {
        document.documentElement.style.setProperty("--cb-launcher-top", String(px) + "px");
      }

      function syncTop() {
        var doc       = document.documentElement;
        var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        var progress  = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        setTop(minTop + (maxTop() - minTop) * progress);
        if (panel.classList.contains("open")) syncPanelToLauncher();
      }

      function onScrollOrResize() {
        if (raf) return;
        raf = window.requestAnimationFrame(function () { raf = null; syncTop(); });
      }

      function nudge() {
        if (lock || panel.classList.contains("open") || document.visibilityState !== "visible") return;
        lock = true;
        launcher.classList.remove("is-nudging");
        void launcher.offsetHeight;
        launcher.classList.add("is-nudging");
        window.setTimeout(function () { launcher.classList.remove("is-nudging"); }, 560);
        window.setTimeout(function () { lock = false; }, 1200);
      }

      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });
      syncTop();
      window.setInterval(nudge, 9000);
    }

    setupPresence();

    /* -------------------------------------------------------
       Envío del formulario
    ------------------------------------------------------- */

    form.addEventListener("submit", function (e) { e.preventDefault(); sendMessage(); });
    sendBtn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); sendMessage(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    /* -------------------------------------------------------
       Parseo de respuesta del Worker
    ------------------------------------------------------- */

    async function parseResponse(response) {
      var raw = await response.text();
      try   { return { raw: raw, data: JSON.parse(raw) }; }
      catch { return { raw: raw, data: { ok: false, reply: raw } }; }
    }

    function pickQuickActions(data) {
      var actions = Array.isArray(data && data.quick_actions) ? data.quick_actions : [];
      return actions
        .filter(function (item) { return item && typeof item === "object"; })
        .map(function (item) {
          return { label: safeText(item.label || "Abrir", 70), url: safeText(item.url || "", 500) };
        })
        .filter(function (item) { return item.label && item.url; });
    }

    function pickOptions(data) {
      var options = Array.isArray(data && data.options) ? data.options : [];
      return options
        .filter(function (item) { return item && typeof item === "object"; })
        .map(function (item) {
          return { label: safeText(item.label || "Opción", 70), send: safeText(item.send || "", 260) };
        })
        .filter(function (item) { return item.label && item.send; });
    }

    /* -------------------------------------------------------
       Manejador de acciones de botones
    ------------------------------------------------------- */

    function handleAction(send) {
      var action = safeText(send, 300);
      if (!action) return;

      // Solicitar info de la página actual → Worker resuelve por URL
      if (action === "__page_info__") {
        internalSend("__page_info__", { showUser: false });
        return;
      }

      // Modo pregunta libre → solo muestra instrucción, sin llamada al Worker
      if (action === "__direct__") {
        appendBubble("assistant", "Claro. Escríbeme tu duda sobre visas, pasaportes, citas, DS-160 o asesoría 🙂");
        input.focus();
        return;
      }

      if (action === "__back__") {
        goBackMenu();
        return;
      }

      if (action === "__topics__") {
        internalSend("__topics__", { showUser: false });
        return;
      }

      internalSend(action, { showUser: true });
    }

    /* -------------------------------------------------------
       Envío principal — conecta con Cloudflare Worker
    ------------------------------------------------------- */

    async function internalSend(text, options) {
      var settings = options && typeof options === "object" ? options : {};
      var message  = safeText(text, 1600);
      var typing, response, parsed, data, reply, quickActions, botOptions;

      if (!message || isSending) return;

      isSending = true;
      input.disabled  = true;
      sendBtn.disabled = true;

      if (settings.showUser !== false) {
        appendBubble("user", message);
      }

      history.push({ role: "user", content: message.slice(0, 900) });
      if (history.length > 12) history = history.slice(-12);
      saveHistory(history);

      // Extracción de nombre — solo en mensajes libres, primera vez
      var detectedName = extractName(message);
      var isNewName    = false;
      if (detectedName && !getVisitorName()) {
        setVisitorName(detectedName);
        isNewName = true;
      }

      typing = appendBubble("assistant", "Escribiendo…");

      try {
        response = await fetch(WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:         message,
            history:         history,
            context:         currentContext,
            session_id:      sessionId,
            visitor_id:      visitorId,
            visitor_name:    getVisitorName(),
            page_url:        window.location.href,
            page_path:       window.location.pathname,
            max_reply_chars: MAX_REPLY_CHARS
          })
        });

        parsed = await parseResponse(response);
        data   = parsed.data || {};

        typing.remove();

        if (!response.ok || data.ok === false) {
          if (window.console && typeof window.console.warn === "function") {
            window.console.warn("[Travel Now chatbot] Error del Worker", {
              status: response.status, raw: parsed.raw, data: data
            });
          }
          appendBubble(
            "assistant",
            "No pude conectar con el asistente en este momento. Intenta de nuevo o contáctanos por WhatsApp."
          );
          appendButtonsRow([
            { label: "Reintentar", send: message       },
            { label: "Ver temas",  send: "__topics__"  },
            { label: "WhatsApp",   url:  WHATSAPP_URL  }
          ], { pushMenu: true });
          return;
        }

        // Actualizar contexto
        if (typeof data.context === "string" && data.context.trim()) {
          currentContext = data.context.trim();
          setStoredContext(currentContext);
          setLastIntent(currentContext);
        }

        // Acuse de nombre si se detectó por primera vez
        if (isNewName) {
          appendBubble("assistant", "Mucho gusto, " + detectedName + " 👋");
        }

        reply = safeText(data.reply || "", 2000);

        if (reply) {
          appendBubble("assistant", reply);
          history.push({ role: "assistant", content: reply.slice(0, 900) });
          if (history.length > 12) history = history.slice(-12);
          saveHistory(history);
        } else {
          appendBubble(
            "assistant",
            "Puedo ayudarte con visas, pasaportes, citas o asesoría personalizada. ¿Qué trámite necesitas revisar?"
          );
        }

        quickActions = pickQuickActions(data);
        if (quickActions.length) appendButtonsRow(quickActions, { pushMenu: false });

        botOptions = pickOptions(data);
        appendButtonsRow(botOptions.length ? botOptions : DEFAULT_OPTIONS, { pushMenu: true });

      } catch (error) {
        typing.remove();
        if (window.console && typeof window.console.warn === "function") {
          window.console.warn("[Travel Now chatbot] Fetch falló", error);
        }
        appendBubble(
          "assistant",
          "Se perdió la conexión con el asistente. Intenta otra vez o contáctanos por WhatsApp."
        );
        appendButtonsRow([
          { label: "Reintentar", send: message      },
          { label: "WhatsApp",   url:  WHATSAPP_URL },
          { label: "Ver temas",  send: "__topics__" }
        ], { pushMenu: true });
      } finally {
        isSending        = false;
        input.disabled   = false;
        sendBtn.disabled = false;
        input.focus();
      }
    }

    function sendMessage() {
      var text = safeText(input.value, 1600);
      if (!text) return;
      input.value = "";
      internalSend(text, { showUser: true });
    }

  }); // onReady

})(); 
