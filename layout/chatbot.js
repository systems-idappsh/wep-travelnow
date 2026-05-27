/* =========================================================
   /layout/chatbot.js — Travel Now Chatbot IA v2.4
   Corrección quirúrgica:
   - Historial real persistido en TRAVEL_NOW_CHAT_HISTORY
   - Extractor de nombre seguro con blocklist para patrón "soy X"
   - Mantiene endpoint, IDs idappsh-chat-* y compatibilidad CSS actual
   - Corrige capas/posición vía JS para que header/nav no tape chat, soporte ni modal
   - Envía page_context real: título, encabezados, texto visible y links internos
   - No repite saludo si ya saludó durante la sesión de navegación
========================================================= */
(function () {
  "use strict";

  if (window.__TN_CHATBOT_INIT__) return;

  window.__TN_CHATBOT_INIT__ = true;
  window.__TRAVEL_NOW_CHATBOT_INIT__ = true;
  window.__IDAPPSH_CHATBOT_INIT__ = true;

  /* -------------------------------------------------------
     Constantes
  ------------------------------------------------------- */
  var WORKER_URL = "https://travelnow-chatbot-ia.systems-idappsh.workers.dev/chat";
  var WHATSAPP_URL = "https://wa.me/5215521114448";
  var CHATBOT_CSS = "/assets/css/layout/chatbot.css";
  var CHATBOT_ICON = "/assets/img/mp4/flotante1.webp";
  var MAX_REPLY_CHARS = 520;
  var MAX_HISTORY_ITEMS = 2;
  var MAX_HISTORY_CHARS = 300;

  // Capas controladas por JS para evitar que header/nav tape asistentes o modales.
  var LAYER_Z = {
    header: 1000,
    supportFab: 12000,
    supportOverlay: 12500,
    supportPanel: 12600,
    assistantOverlay: 13000,
    assistantModal: 13100,
    chatLauncher: 14000,
    chatPanel: 14100
  };

  var SESSION_KEY = "TRAVEL_NOW_CHAT_SESSION_ID";
  var CONTEXT_KEY = "TRAVEL_NOW_CHAT_CONTEXT";
  var VISITOR_ID_KEY = "TRAVEL_NOW_VISITOR_ID";
  var VISITOR_NAME_KEY = "TRAVEL_NOW_VISITOR_NAME";
  var LAST_PAGE_KEY = "TRAVEL_NOW_LAST_PAGE";
  var LAST_INTENT_KEY = "TRAVEL_NOW_LAST_INTENT";
  var HISTORY_KEY = "TRAVEL_NOW_CHAT_HISTORY";
  var GREETING_SHOWN_KEY = "TRAVEL_NOW_GREETING_SHOWN";

  var SOY_BLOCKLIST = [
    "estudiante", "mexicano", "mexicana", "menor", "cliente", "usuario",
    "asesor", "asesora", "turista", "adulto", "adulta", "mayor", "persona",
    "solicitante", "de", "del", "la", "el", "un", "una", "nuevo", "nueva",
    "interesado", "interesada", "extranjero", "extranjera", "mexico", "méxico",
    "cdmx", "guadalajara", "monterrey", "tijuana", "hombre", "mujer"
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

  function normalizePlainText(value) {
    return safeText(value, 120)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function capitalizeName(value) {
    var name = safeText(value, 60).replace(/\s+/g, " ");
    if (!name) return "";

    return name
      .split(" ")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(" ");
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
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }

  /* -------------------------------------------------------
     Helpers localStorage tolerantes a fallo
  ------------------------------------------------------- */
  function lsGet(key) {
    try { return localStorage.getItem(key) || ""; } catch (error) { return ""; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (error) { /* noop */ }
  }

  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (error) { /* noop */ }
  }

  function ssGet(key) {
    try { return sessionStorage.getItem(key) || ""; } catch (error) { return ""; }
  }

  function ssSet(key, value) {
    try { sessionStorage.setItem(key, String(value)); } catch (error) { /* noop */ }
  }

  function hasGreetedThisSession() {
    return ssGet(GREETING_SHOWN_KEY) === "1";
  }

  function markGreetedThisSession() {
    ssSet(GREETING_SHOWN_KEY, "1");
  }

  function getVisitorId() {
    var id = lsGet(VISITOR_ID_KEY);
    if (id) return id;
    id = makeId();
    lsSet(VISITOR_ID_KEY, id);
    return id;
  }

  function getVisitorName() { return lsGet(VISITOR_NAME_KEY); }
  function setVisitorName(name) { lsSet(VISITOR_NAME_KEY, safeText(name, 60)); }
  function getLastPage() { return lsGet(LAST_PAGE_KEY); }
  function setLastPage(path) { lsSet(LAST_PAGE_KEY, safeText(path, 300)); }
  function setLastIntent(intent) { lsSet(LAST_INTENT_KEY, safeText(intent, 120)); }

  function parseStoredContext() { return lsGet(CONTEXT_KEY) || "inicio"; }
  function setStoredContext(ctx) { lsSet(CONTEXT_KEY, safeText(ctx, 80) || "inicio"); }

  function parseSessionId() {
    var id = lsGet(SESSION_KEY);
    if (id) return id;
    id = makeId();
    lsSet(SESSION_KEY, id);
    return id;
  }

  /* -------------------------------------------------------
     Historial persistente real
  ------------------------------------------------------- */
  function normalizeHistoryItem(item) {
    if (!item || typeof item !== "object") return null;

    var role = item.role === "assistant" ? "assistant" : item.role === "user" ? "user" : "";
    var content = safeText(item.content, MAX_HISTORY_CHARS);

    if (!role || !content) return null;

    return {
      role: role,
      content: content
    };
  }

  function loadStoredHistory() {
    var raw = lsGet(HISTORY_KEY);
    var parsed;

    if (!raw) return [];

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      lsRemove(HISTORY_KEY);
      return [];
    }

    if (!Array.isArray(parsed)) {
      lsRemove(HISTORY_KEY);
      return [];
    }

    return parsed
      .map(normalizeHistoryItem)
      .filter(Boolean)
      .slice(-MAX_HISTORY_ITEMS);
  }

  function saveStoredHistory(historyList) {
    var normalized = Array.isArray(historyList)
      ? historyList.map(normalizeHistoryItem).filter(Boolean).slice(-MAX_HISTORY_ITEMS)
      : [];

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
    } catch (error) {
      /* Si localStorage falla o está lleno, no rompemos el chat. */
    }

    return normalized;
  }

  /* -------------------------------------------------------
     Extracción segura de nombre
  ------------------------------------------------------- */
  function isBlockedNameCandidate(candidate, sourceType) {
    var normalized = normalizePlainText(candidate);
    var firstWord = normalized.split(/\s+/)[0] || "";

    if (!normalized || normalized.length < 2) return true;
    if (SOY_BLOCKLIST.indexOf(normalized) >= 0) return true;
    if (SOY_BLOCKLIST.indexOf(firstWord) >= 0) return true;

    // Para "soy X" somos más estrictos porque suele expresar condición, no nombre.
    if (sourceType === "soy" && normalized.indexOf(" ") >= 0) return true;

    return false;
  }

  function extractName(text) {
    var source = safeText(text, 300);
    var patterns;
    var found = null;

    if (!source) return null;

    patterns = [
      { type: "direct", re: /\bme\s+llamo\s+([A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30}(?:\s+[A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30})?)/i },
      { type: "direct", re: /\bmi\s+nombre\s+es\s+([A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30}(?:\s+[A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30})?)/i },
      { type: "soy", re: /\bsoy\s+([A-Za-záéíóúüÁÉÍÓÚÜñÑ]{2,30})(?=\s*[,\.\n!?]|\s*$)/i }
    ];

    patterns.some(function (item) {
      var match = source.match(item.re);
      var candidate;

      if (!match || !match[1]) return false;

      candidate = safeText(match[1], 60);
      if (isBlockedNameCandidate(candidate, item.type)) return false;

      found = capitalizeName(candidate);
      return Boolean(found);
    });

    return found;
  }

  /* -------------------------------------------------------
     Constructor del saludo inicial
  ------------------------------------------------------- */
  function buildGreeting() {
    var saludo = getTimeGreeting();
    var name = getVisitorName();
    var lastPage = getLastPage();
    var currentPath = window.location.pathname;

    setLastPage(currentPath);

    if (name && lastPage && lastPage !== currentPath) {
      return saludo + ", " + name + " 🤖🚬 \nSeguimos aquí.🗣️💨";
    }

    if (name) {
      return saludo + ", " + name + " 🥱 \nSoy el asistente de Travel Now. ¿En qué puedo ayudarte? 🛀";
    }

    return saludo + " ✈️ Soy el asistente de Travel Now.\n   🤖🫰 ¿En qué puedo ayudarte? ";
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
        if (new URL(links[index].getAttribute("href"), document.baseURI).pathname === cleanHref) return;
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
    var el = document.createElement(tagName);
    var opts = options && typeof options === "object" ? options : {};
    var key;

    if (opts.id) el.id = opts.id;
    if (opts.className) el.className = opts.className;
    if (opts.text) el.textContent = opts.text;

    if (opts.attrs && typeof opts.attrs === "object") {
      for (key in opts.attrs) {
        if (Object.prototype.hasOwnProperty.call(opts.attrs, key)) {
          el.setAttribute(key, String(opts.attrs[key]));
        }
      }
    }

    return el;
  }

  function setLayer(selector, zIndex, position) {
    var nodes = document.querySelectorAll(selector);

    nodes.forEach(function (node) {
      if (!node || !node.style) return;
      if (position && !node.style.position) node.style.position = position;
      node.style.zIndex = String(zIndex);
    });
  }

  function applyLayerFix() {
    // Header/nav: lo dejamos por debajo de asistentes flotantes.
    setLayer(".header, .site-header", LAYER_Z.header, "");

    // Soporte visual y formulario rápido. Estos elementos existen en HTML.
    setLayer("#supportFab, .support-fab", LAYER_Z.supportFab, "fixed");
    setLayer("#supportOverlay, .support-overlay", LAYER_Z.supportOverlay, "fixed");
    setLayer("#supportPanel, .support-panel", LAYER_Z.supportPanel, "fixed");
    setLayer("#assistantOverlay, .assistant-overlay", LAYER_Z.assistantOverlay, "fixed");
    setLayer("#assistantModal", LAYER_Z.assistantModal, "fixed");

    // Chatbot IA.
    setLayer("#idappsh-chat-launcher", LAYER_Z.chatLauncher, "fixed");
    setLayer("#idappsh-chat-panel", LAYER_Z.chatPanel, "fixed");
  }

  function getHeaderSafeTop() {
    var header = document.querySelector(".header, .site-header");
    var rect;
    var computed;

    if (!header) return 12;

    rect = header.getBoundingClientRect();
    computed = window.getComputedStyle ? window.getComputedStyle(header) : null;

    if (!rect || rect.height <= 0) return 12;

    if (
      header.classList.contains("is-fixed") ||
      header.classList.contains("scrolled") ||
      (computed && (computed.position === "fixed" || computed.position === "sticky"))
    ) {
      return Math.max(12, Math.ceil(rect.bottom + 12));
    }

    return 12;
  }

  function ensureChatbotMarkup() {
    var existingLauncher = document.getElementById("idappsh-chat-launcher");
    var existingPanel = document.getElementById("idappsh-chat-panel");

    if (existingLauncher && existingPanel) return;

    if (existingLauncher) existingLauncher.remove();
    if (existingPanel) existingPanel.remove();

    var launcher = createElement("button", {
      id: "idappsh-chat-launcher",
      attrs: { type: "button", "aria-label": "Abrir chat de Travel Now", "aria-expanded": "false" }
    });

    var icon = createElement("img", {
      className: "chatbot-gif-icon",
      attrs: {
        src: CHATBOT_ICON,
        alt: "Travel Now Assistant",
        loading: "eager",
        decoding: "async",
        width: "92",
        height: "192"
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

    var panel = createElement("section", {
      id: "idappsh-chat-panel",
      attrs: { "aria-hidden": "true", "aria-label": "Chat de Travel Now" }
    });

    var head = createElement("div", { className: "chat-head" });
    var title = createElement("div", { className: "chat-title" });
    var name = createElement("div", { className: "chat-name", text: "Travel Now Assistant" });
    var sub = createElement("div", { className: "chat-sub", text: "Visas, pasaportes y asesoría" });
    var close = createElement("button", {
      id: "idappsh-chat-close",
      className: "chat-close",
      text: "×",
      attrs: { type: "button", "aria-label": "Cerrar chat" }
    });

    title.appendChild(name);
    title.appendChild(sub);
    head.appendChild(title);
    head.appendChild(close);

    var body = createElement("div", {
      id: "idappsh-chat-messages",
      className: "chat-body",
      attrs: { role: "log", "aria-live": "polite" }
    });

    var form = createElement("form", {
      id: "idappsh-chat-form",
      className: "chat-foot",
      attrs: { autocomplete: "off" }
    });

    var input = createElement("input", {
      id: "idappsh-chat-input",
      attrs: {
        type: "text",
        placeholder: "Escribe tu duda…",
        autocomplete: "off",
        maxlength: "1600",
        "aria-label": "Escribe tu mensaje"
      }
    });

    var send = createElement("button", {
      id: "idappsh-chat-send",
      className: "chat-send",
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
          send: safeText(item.send || "", 260),
          url: safeText(item.url || "", 500)
        };
      })
      .filter(function (item) { return item.label && (item.send || item.url); });
  }

  function isInternalUrl(url) {
    try {
      return new URL(url, window.location.href).origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }


  /* -------------------------------------------------------
     Contexto real de la página actual
     - Se manda al Worker en cada mensaje.
     - Evita que el bot responda genérico cuando está dentro de una sección.
  ------------------------------------------------------- */
  function isNodeVisible(node) {
    var style;
    var rect;

    if (!node || !node.ownerDocument || !node.ownerDocument.documentElement.contains(node)) return false;

    style = window.getComputedStyle ? window.getComputedStyle(node) : null;
    if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) return false;

    rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    if (rect && rect.width === 0 && rect.height === 0) return false;

    return true;
  }

  function cleanDomText(value, maxLength) {
    return safeText(String(value || "").replace(/\s+/g, " "), maxLength || 800).trim();
  }

  function getReadablePageRoot() {
    return document.querySelector("main, .site-main, [role='main']") || document.body;
  }

  function shouldIgnorePageNode(node) {
    if (!node || node.nodeType !== 1) return true;

    return Boolean(node.closest([
      "script", "style", "noscript", "svg", "canvas",
      "header", "footer", "nav", "#nav", ".nav", ".header", ".site-header",
      "#idappsh-chat-panel", "#idappsh-chat-launcher",
      "#supportPanel", "#supportOverlay", "#supportFab",
      "#assistantModal", "#assistantOverlay", ".modal", ".support-panel", ".support-overlay"
    ].join(",")));
  }

  function collectUniqueTexts(nodes, maxItems, maxEach) {
    var seen = Object.create(null);
    var out = [];

    Array.prototype.forEach.call(nodes || [], function (node) {
      var text;
      var key;

      if (out.length >= maxItems) return;
      if (shouldIgnorePageNode(node)) return;
      if (!isNodeVisible(node)) return;

      text = cleanDomText(node.textContent, maxEach);
      if (!text || text.length < 3) return;

      key = text.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      out.push(text);
    });

    return out;
  }

  function collectPageLinks(root) {
    var seen = Object.create(null);
    var links = [];

    Array.prototype.forEach.call((root || document).querySelectorAll("a[href]"), function (node) {
      var label;
      var href;
      var url;
      var key;

      if (links.length >= 14) return;
      if (shouldIgnorePageNode(node)) return;
      if (!isNodeVisible(node)) return;

      label = cleanDomText(node.textContent || node.getAttribute("aria-label") || "", 70);
      href = safeText(node.getAttribute("href") || "", 500);
      if (!label || !href) return;

      try {
        url = new URL(href, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) return;

      key = url.pathname + url.hash + "|" + label.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;

      links.push({ label: label, url: url.pathname + url.search + url.hash });
    });

    return links;
  }

  function detectPageContextFromPath(pathname) {
    var path = safeText(pathname || window.location.pathname, 500).toLowerCase();

    if (path.indexOf("/pages/tramites/visas-americanas") !== -1 || path.indexOf("/pages/visaspais/visa-estados-unidos") !== -1) return "visas_americanas";
    if (path.indexOf("/pages/tramites/pasaportes") !== -1) return "pasaportes";
    if (path.indexOf("/pages/tramites/agendado-citas") !== -1) return "agendado_citas";
    if (path.indexOf("/pages/tramites/asesoria-personalizada") !== -1) return "asesoria";
    if (path.indexOf("/pages/visaspais/") !== -1) return "visaspais";
    if (path.indexOf("/pages/core/servicios") !== -1) return "servicios";
    if (path.indexOf("/pages/core/faq") !== -1) return "faq";
    if (path.indexOf("/pages/core/contacto") !== -1) return "contacto";

    return "inicio";
  }

  function collectPageContext() {
    var root = getReadablePageRoot();
    var title = cleanDomText(document.title, 160);
    var meta = document.querySelector('meta[name="description"]');
    var description = cleanDomText(meta ? meta.getAttribute("content") : "", 260);
    var headings = collectUniqueTexts(root.querySelectorAll("h1, h2, h3"), 18, 140);
    var bodyTexts = collectUniqueTexts(root.querySelectorAll("p, li, article, section .desc-signature, .lead, .section-subtext, .subtitle"), 36, 260);

    return {
      context: detectPageContextFromPath(window.location.pathname),
      title: title,
      description: description,
      path: window.location.pathname,
      url: window.location.href,
      headings: headings,
      text: cleanDomText(bodyTexts.join("\n"), 5200),
      links: collectPageLinks(root)
    };
  }

  /* -------------------------------------------------------
     Inicialización principal
  ------------------------------------------------------- */
  onReady(function () {
    ensureStylesheet(CHATBOT_CSS);
    ensureChatbotMarkup();

    var launcher = document.getElementById("idappsh-chat-launcher");
    var panel = document.getElementById("idappsh-chat-panel");
    var closeBtn = document.getElementById("idappsh-chat-close");
    var msgList = document.getElementById("idappsh-chat-messages");
    var input = document.getElementById("idappsh-chat-input");
    var sendBtn = document.getElementById("idappsh-chat-send");
    var form = document.getElementById("idappsh-chat-form");

    var booted = false;
    var isSending = false;
    var history = loadStoredHistory();
    var currentContext = parseStoredContext();
    var sessionId = parseSessionId();
    var visitorId = getVisitorId();
    var navStack = [];

    if (!launcher || !panel || !closeBtn || !msgList || !input || !sendBtn || !form) {
      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("[Travel Now chatbot] Faltan elementos para inicializar.");
      }
      return;
    }

    function pushHistory(role, content) {
      var item = normalizeHistoryItem({ role: role, content: content });
      if (!item) return;
      history.push(item);
      history = saveStoredHistory(history);
    }

    function renderStoredHistory() {
      if (!Array.isArray(history) || !history.length) return false;

      msgList.replaceChildren();
      history.forEach(function (item) {
        if (!item || !item.role || !item.content) return;
        appendBubble(item.role, item.content);
      });

      return true;
    }

    var DEFAULT_OPTIONS = [
      { label: "Visas americanas", send: "Quiero información sobre visas americanas" },
      { label: "Pasaportes", send: "Quiero información sobre pasaportes" },
      { label: "Agendar cita", send: "Quiero información sobre agendado de citas" },
      { label: "Asesoría", send: "Quiero una asesoría personalizada" },
      { label: "Visas por país", send: "Quiero información sobre visas por país" }
    ];

    function clearChatState() {
      msgList.replaceChildren();
      history = saveStoredHistory([]);
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
      var settings = options && typeof options === "object" ? options : {};
      var validButtons = normalizeButtons(buttons);
      var wrap;

      if (!validButtons.length) return null;

      wrap = document.createElement("div");
      wrap.className = "action-row";

      validButtons.forEach(function (item) {
        if (item.url) {
          var a = document.createElement("a");
          var internal = isInternalUrl(item.url);

          a.className = "action-btn";
          a.href = item.url;
          a.target = internal ? "_self" : "_blank";
          a.rel = internal ? "" : "noopener noreferrer";
          a.textContent = item.label;
          a.addEventListener("click", function () {
            setLastIntent("navigation:" + item.label);
            setLastPage(window.location.pathname);
            saveStoredHistory(history);
          });
          wrap.appendChild(a);
          return;
        }

        var btn = document.createElement("button");
        btn.className = "action-btn";
        btn.type = "button";
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

    function showStart() {
      var alreadyRenderedHistory = renderStoredHistory();

      if (!alreadyRenderedHistory) {
        if (hasGreetedThisSession()) {
          appendBubble(
            "assistant",
            "Elige una opción o escríbeme tu duda sobre visas, pasaportes, citas, DS-160 o asesoría."
          );
        } else {
          appendBubble("assistant", buildGreeting());
          markGreetedThisSession();
        }
      }

      appendButtonsRow([
        { label: "Info. página actual", send: "__page_info__" },
        { label: "Pregunta directa", send: "__direct__" },
        { label: "WhatsApp", url: WHATSAPP_URL }
      ], { pushMenu: true });
    }

    function goBackMenu() {
      if (navStack.length < 2) {
        clearChatState();
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

    function clamp(number, min, max) {
      return Math.max(min, Math.min(max, number));
    }

    function syncPanelToLauncher() {
      var minTop;
      var viewportGap;
      var availableHeight;
      var panelHeight;
      var launcherBox;
      var desiredTop;
      var maxTop;
      var top;

      applyLayerFix();

      minTop = getHeaderSafeTop();
      viewportGap = 12;
      availableHeight = Math.max(320, window.innerHeight - minTop - viewportGap);

      panel.style.bottom = "auto";
      panel.style.maxHeight = String(availableHeight) + "px";
      panel.style.zIndex = String(LAYER_Z.chatPanel);
      launcher.style.zIndex = String(LAYER_Z.chatLauncher);

      panelHeight = Math.min(panel.offsetHeight || 540, availableHeight);
      launcherBox = launcher.getBoundingClientRect();
      desiredTop = launcherBox.top - panelHeight - 14;
      maxTop = Math.max(minTop, window.innerHeight - panelHeight - viewportGap);
      top = clamp(desiredTop, minTop, maxTop);

      panel.style.top = String(top) + "px";
    }

    function openPanel() {
      applyLayerFix();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      launcher.setAttribute("aria-expanded", "true");

      if (!booted) {
        booted = true;
        msgList.replaceChildren();
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
      if (panel.classList.contains("open")) {
        closePanel();
        return;
      }
      openPanel();
    }

    launcher.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePanel();
    });

    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closePanel();
    });

    panel.addEventListener("click", function (e) { e.stopPropagation(); });

    document.addEventListener("click", function (e) {
      if (!panel.classList.contains("open")) return;
      if (!panel.contains(e.target) && !launcher.contains(e.target)) closePanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });

    document.addEventListener("click", function (e) {
      var trigger = e.target && e.target.closest
        ? e.target.closest("[data-open-chatbot], [data-open-ai-chat]")
        : null;
      if (!trigger) return;
      e.preventDefault();
      openPanel();
    });

    function setupPresence() {
      var raf = null;
      var lock = false;
      var minTop = 140;

      function maxTop() { return Math.max(180, window.innerHeight - 170); }

      function setTop(px) {
        document.documentElement.style.setProperty("--cb-launcher-top", String(px) + "px");
      }

      function syncTop() {
        var doc = document.documentElement;
        var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        var progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        setTop(minTop + (maxTop() - minTop) * progress);
        if (panel.classList.contains("open")) syncPanelToLauncher();
      }

      function onScrollOrResize() {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          raf = null;
          syncTop();
        });
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

    applyLayerFix();
    window.addEventListener("resize", applyLayerFix, { passive: true });
    document.addEventListener("click", applyLayerFix, true);

    setupPresence();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      sendMessage();
    });

    sendBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    async function parseResponse(response) {
      var raw = await response.text();
      try { return { raw: raw, data: JSON.parse(raw) }; }
      catch (error) { return { raw: raw, data: { ok: false, reply: raw } }; }
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

    function handleAction(send) {
      var action = safeText(send, 300);
      if (!action) return;

      if (action === "__page_info__") {
        setLastIntent("page_info");
        internalSend("__page_info__", { showUser: false });
        return;
      }

      if (action === "__direct__") {
        setLastIntent("direct_question");
        var msg = "Claro. Escríbeme tu duda sobre visas, pasaportes, citas, DS-160 o asesoría 🙂";
        appendBubble("assistant", msg);
        pushHistory("assistant", msg);
        input.focus();
        return;
      }

      if (action === "__back__") {
        goBackMenu();
        return;
      }

      if (action === "__topics__") {
        setLastIntent("topics");
        internalSend("__topics__", { showUser: false });
        return;
      }

      setLastIntent(action);
      internalSend(action, { showUser: true });
    }

    async function internalSend(text, options) {
      var settings = options && typeof options === "object" ? options : {};
      var message = safeText(text, 1600);
      var typing;
      var response;
      var parsed;
      var data;
      var reply;
      var quickActions;
      var botOptions;

      if (!message || isSending) return;

      isSending = true;
      input.disabled = true;
      sendBtn.disabled = true;

      if (settings.showUser !== false) {
        appendBubble("user", message);
        pushHistory("user", message);
      }

      var detectedName = settings.showUser !== false ? extractName(message) : null;
      var isNewName = false;

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
            message: message,
            history: history.slice(-MAX_HISTORY_ITEMS),
            context: currentContext,
            session_id: sessionId,
            visitor_id: visitorId,
            visitor_name: getVisitorName(),
            page_url: window.location.href,
            page_path: window.location.pathname,
            page_context: collectPageContext(),
            max_reply_chars: MAX_REPLY_CHARS
          })
        });

        parsed = await parseResponse(response);
        data = parsed.data || {};

        typing.remove();

        if (!response.ok || data.ok === false) {
          if (window.console && typeof window.console.warn === "function") {
            window.console.warn("[Travel Now chatbot] Error del Worker", {
              status: response.status,
              raw: parsed.raw,
              data: data
            });
          }

          appendBubble(
            "assistant",
            "No pude conectar con el asistente en este momento. Intenta de nuevo o contáctanos por WhatsApp."
          );

          appendButtonsRow([
            { label: "Reintentar", send: message },
            { label: "Ver temas", send: "__topics__" },
            { label: "WhatsApp", url: WHATSAPP_URL }
          ], { pushMenu: true });
          return;
        }

        if (typeof data.context === "string" && data.context.trim()) {
          currentContext = data.context.trim();
          setStoredContext(currentContext);
          setLastIntent(currentContext);
        }

        if (isNewName) {
          var nameAck = "Mucho gusto, " + detectedName + " 👋";
          appendBubble("assistant", nameAck);
          pushHistory("assistant", nameAck);
        }

        reply = safeText(data.reply || "", MAX_REPLY_CHARS);

        if (reply) {
          appendBubble("assistant", reply);
          pushHistory("assistant", reply);
        } else {
          var fallback = "fallbacak   👾🤯🤕🤧🫯   ";
          appendBubble("assistant", fallback);
          pushHistory("assistant", fallback);
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
          "Se perdió la conexión con el asistente. 🤯🤕🫯  ."
        );

        appendButtonsRow([
          { label: "Reintentar", send: message },
          { label: "WhatsApp", url: WHATSAPP_URL },
          { label: "Ver temas", send: "__topics__" }
        ], { pushMenu: true });
      } finally {
        isSending = false;
        input.disabled = false;
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
  });
})();
