// FILE: layout/chatbot.js
// Travel Now Chatbot contextual híbrido.
// - Inserta HTML del chatbot automáticamente.
// - Saluda según hora local.
// - Mantiene visitante, nombre, historial y contexto en localStorage.
// - Usa "Info. página actual" con flujo predeterminado.
// - Usa IA solo para pregunta directa o preguntas libres.
// - No contiene API keys.

(() => {
  "use strict";

  if (window.__TRAVEL_NOW_CONTEXTUAL_CHATBOT_INIT__) return;
  window.__TRAVEL_NOW_CONTEXTUAL_CHATBOT_INIT__ = true;

  const ENDPOINT = "https://travelnow-chatbot-ia.systems-idappsh.workers.dev/chat";
  const WHATSAPP_URL = "https://wa.me/5215521114448";
  const MAX_INPUT_CHARS = 420;
  const MAX_RENDERED_REPLY_CHARS = 700;
  const MAX_HISTORY_ITEMS = 12;

  const STORAGE = Object.freeze({
    visitorId: "TRAVEL_NOW_VISITOR_ID",
    visitorName: "TRAVEL_NOW_VISITOR_NAME",
    sessionId: "TRAVEL_NOW_CHAT_SESSION_ID",
    context: "TRAVEL_NOW_CHAT_CONTEXT",
    history: "TRAVEL_NOW_CHAT_HISTORY",
    lastPage: "TRAVEL_NOW_LAST_PAGE",
    lastIntent: "TRAVEL_NOW_LAST_INTENT",
    booted: "TRAVEL_NOW_CHAT_BOOTED"
  });

  const PAGE_MAP = [
    {
      key: "visas_americanas",
      label: "Visas Americanas",
      test: (path) => path.includes("/pages/tramites/visas-americanas") || path.includes("/pages/visaspais/visa-estados-unidos"),
      questions: [
        { label: "Requisitos", send: "Quiero requisitos generales para visa americana" },
        { label: "DS-160", send: "Necesito ayuda con el DS-160" },
        { label: "Primera vez", send: "Voy a tramitar visa americana por primera vez" },
        { label: "Renovación", send: "Quiero renovar mi visa americana" },
        { label: "Entrevista", send: "Cómo prepararme para entrevista consular" },
        { label: "Asesoría", send: "Quiero agendar asesoría para visa americana" }
      ]
    },
    {
      key: "pasaportes",
      label: "Pasaportes",
      test: (path) => path.includes("/pages/tramites/pasaportes"),
      questions: [
        { label: "Primera vez", send: "Quiero información de pasaporte por primera vez" },
        { label: "Renovación", send: "Quiero renovar mi pasaporte" },
        { label: "Menores", send: "Quiero información de pasaporte para menor de edad" },
        { label: "Reposición", send: "Necesito reposición de pasaporte" },
        { label: "Citas", send: "Quiero información sobre citas de pasaporte" },
        { label: "Asesoría", send: "Quiero asesoría para pasaporte" }
      ]
    },
    {
      key: "agendado_citas",
      label: "Agendado de Citas",
      test: (path) => path.includes("/pages/tramites/agendado-citas"),
      questions: [
        { label: "Cómo funciona", send: "Cómo funciona el agendado de citas" },
        { label: "Cita CAS", send: "Quiero información sobre cita CAS" },
        { label: "Consulado", send: "Quiero información sobre cita en consulado" },
        { label: "Reprogramar", send: "Quiero reprogramar una cita" },
        { label: "Adelanto", send: "Quiero revisar adelanto de cita" },
        { label: "WhatsApp", url: WHATSAPP_URL }
      ]
    },
    {
      key: "asesoria",
      label: "Asesoría Personalizada",
      test: (path) => path.includes("/pages/tramites/asesoria-personalizada"),
      questions: [
        { label: "Qué incluye", send: "Qué incluye la asesoría personalizada" },
        { label: "DS-160", send: "Necesito ayuda con DS-160" },
        { label: "Revisión", send: "Quiero revisión de mi caso" },
        { label: "Entrevista", send: "Quiero preparación para entrevista" },
        { label: "Costo", send: "Quiero saber costo de asesoría" },
        { label: "WhatsApp", url: WHATSAPP_URL }
      ]
    },
    {
      key: "servicios",
      label: "Servicios",
      test: (path) => path.includes("/pages/core/servicios") || path === "/" || path.endsWith("/index.html"),
      questions: [
        { label: "Visas americanas", send: "Quiero información sobre visas americanas" },
        { label: "Pasaportes", send: "Quiero información sobre pasaportes" },
        { label: "Agendado citas", send: "Quiero información sobre agendado de citas" },
        { label: "Asesoría", send: "Quiero una asesoría personalizada" },
        { label: "Visas por país", send: "Quiero información sobre visas por país" },
        { label: "WhatsApp", url: WHATSAPP_URL }
      ]
    },
    {
      key: "visaspais",
      label: "Visas por País",
      test: (path) => path.includes("/pages/visaspais/"),
      questions: [
        { label: "Requisitos", send: "Quiero requisitos de esta visa por país" },
        { label: "Tiempo proceso", send: "Cuánto tarda este trámite de visa" },
        { label: "Documentos", send: "Qué documentos necesito para esta visa" },
        { label: "Costo", send: "Quiero saber costo de este trámite" },
        { label: "Asesoría", send: "Quiero asesoría para esta visa" },
        { label: "WhatsApp", url: WHATSAPP_URL }
      ]
    },
    {
      key: "faq",
      label: "Preguntas Frecuentes",
      test: (path) => path.includes("/pages/core/faq"),
      questions: [
        { label: "Visas", send: "Preguntas frecuentes sobre visas" },
        { label: "Pasaportes", send: "Preguntas frecuentes sobre pasaportes" },
        { label: "Citas", send: "Preguntas frecuentes sobre citas" },
        { label: "Costos", send: "Preguntas frecuentes sobre costos" },
        { label: "Contacto", send: "Quiero contactar a Travel Now" }
      ]
    },
    {
      key: "contacto",
      label: "Contacto",
      test: (path) => path.includes("/pages/core/contacto"),
      questions: [
        { label: "WhatsApp", url: WHATSAPP_URL },
        { label: "Correo", url: "mailto:contacto@travel-now.com.mx" },
        { label: "Servicios", url: "https://travel-now.com.mx/pages/core/servicios.html" },
        { label: "Asesoría", send: "Quiero una asesoría personalizada" },
        { label: "Visa americana", send: "Quiero información sobre visa americana" }
      ]
    }
  ];

  function safeString(value, max = 1000) {
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  }

  function makeId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getStorage(key, fallback = "") {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {}
  }

  function parseJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getHourGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }

  function getCurrentPageInfo() {
    const url = new URL(window.location.href);
    const path = url.pathname || "/";
    const normalizedPath = path === "" ? "/" : path;

    const match = PAGE_MAP.find((page) => {
      try {
        return page.test(normalizedPath);
      } catch {
        return false;
      }
    });

    return match || PAGE_MAP.find((page) => page.key === "servicios");
  }

  function clipForBubble(text, max = MAX_RENDERED_REPLY_CHARS) {
    const raw = safeString(text, max + 120);
    if (raw.length <= max) return raw;

    const clipped = raw.slice(0, max).trim();
    const sentenceEnd = Math.max(
      clipped.lastIndexOf("."),
      clipped.lastIndexOf("?"),
      clipped.lastIndexOf("!")
    );

    if (sentenceEnd > Math.floor(max * 0.65)) {
      return `${clipped.slice(0, sentenceEnd + 1).trim()}`;
    }

    return `${clipped.replace(/[,\s]+$/g, "")}…`;
  }

  function detectName(text) {
    const clean = safeString(text, 160);
    if (!clean) return "";

    const patterns = [
      /\bme llamo\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,2})/i,
      /\bmi nombre es\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,2})/i,
      /\bsoy\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,2})/i
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match?.[1]) {
        return match[1]
          .trim()
          .replace(/[^\p{L}\s]/gu, "")
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ");
      }
    }

    return "";
  }

  function ensureChatbotMarkup() {
    if (document.getElementById("idappsh-chat-launcher")) return;

    const launcher = document.createElement("button");
    launcher.id = "idappsh-chat-launcher";
    launcher.className = "travel-chat-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Abrir asistente Travel Now");
    launcher.innerHTML = `
      <span class="chatbot-icon" aria-hidden="true">✈️</span>
      <span class="chatbot-pulse" aria-hidden="true"></span>
    `;

    const panel = document.createElement("section");
    panel.id = "idappsh-chat-panel";
    panel.className = "travel-chat-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <header class="chat-head">
        <div class="chat-brand">
          <strong>Travel Now Assistant</strong>
          <span>Visas, pasaportes y asesoría</span>
        </div>
        <button id="idappsh-chat-close" class="chat-close" type="button" aria-label="Cerrar chat">×</button>
      </header>

      <div id="idappsh-chat-messages" class="chat-messages" aria-live="polite"></div>

      <form id="idappsh-chat-form" class="chat-form">
        <input
          id="idappsh-chat-input"
          type="text"
          maxlength="${MAX_INPUT_CHARS}"
          placeholder="Escribe tu duda..."
          autocomplete="off"
        />
        <button id="idappsh-chat-send" type="submit" aria-label="Enviar">Enviar</button>
      </form>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureChatbotMarkup();

    const launcher = document.getElementById("idappsh-chat-launcher");
    const panel = document.getElementById("idappsh-chat-panel");
    const closeBtn = document.getElementById("idappsh-chat-close");
    const msgList = document.getElementById("idappsh-chat-messages");
    const input = document.getElementById("idappsh-chat-input");
    const sendBtn = document.getElementById("idappsh-chat-send");
    const form = document.getElementById("idappsh-chat-form");

    const missing = [];
    if (!launcher) missing.push("idappsh-chat-launcher");
    if (!panel) missing.push("idappsh-chat-panel");
    if (!closeBtn) missing.push("idappsh-chat-close");
    if (!msgList) missing.push("idappsh-chat-messages");
    if (!input) missing.push("idappsh-chat-input");
    if (!sendBtn) missing.push("idappsh-chat-send");
    if (!form) missing.push("idappsh-chat-form");

    if (missing.length) {
      console.warn("Travel Now Chatbot: faltan elementos:", missing.join(", "));
      return;
    }

    let isSending = false;
    let bootedThisPage = false;
    let visitorId = getStorage(STORAGE.visitorId) || makeId();
    let sessionId = getStorage(STORAGE.sessionId) || makeId();
    let visitorName = getStorage(STORAGE.visitorName);
    let currentContext = getStorage(STORAGE.context, "inicio");
    let history = parseJson(getStorage(STORAGE.history, "[]"), []);
    const currentPage = getCurrentPageInfo();
    const lastPage = getStorage(STORAGE.lastPage);

    setStorage(STORAGE.visitorId, visitorId);
    setStorage(STORAGE.sessionId, sessionId);
    setStorage(STORAGE.lastPage, window.location.href);

    if (!Array.isArray(history)) history = [];

    function persistHistory() {
      const cleaned = history
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: safeString(item.content, MAX_RENDERED_REPLY_CHARS)
        }))
        .filter((item) => item.content)
        .slice(-MAX_HISTORY_ITEMS);

      history = cleaned;
      setStorage(STORAGE.history, JSON.stringify(cleaned));
    }

    function persistContext(context) {
      currentContext = safeString(context, 80) || "inicio";
      setStorage(STORAGE.context, currentContext);
    }

    function appendBubble(role, text, { save = false } = {}) {
      const div = document.createElement("div");
      div.className = `msg ${role}`;
      div.textContent = clipForBubble(String(text ?? ""));
      msgList.appendChild(div);
      msgList.scrollTop = msgList.scrollHeight;

      if (save && (role === "user" || role === "assistant")) {
        history.push({ role, content: div.textContent });
        persistHistory();
      }

      return div;
    }

    function appendButtonsRow(buttons) {
      const cleanButtons = Array.isArray(buttons) ? buttons : [];
      const wrap = document.createElement("div");
      wrap.className = "action-row";

      cleanButtons
        .filter((button) => button && typeof button === "object")
        .slice(0, 7)
        .forEach((button) => {
          const label = safeString(button.label || "Opción", 70);
          const send = safeString(button.send || "", 300);
          const url = safeString(button.url || "", 700);

          if (!label || (!send && !url)) return;

          if (url) {
            const a = document.createElement("a");
            a.className = "action-btn";
            a.href = url;
            a.target = url.startsWith("http") ? "_self" : "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = label;
            a.addEventListener("click", () => {
              setStorage(STORAGE.lastIntent, label);
              persistContext(currentContext);
              persistHistory();
            });
            wrap.appendChild(a);
            return;
          }

          const btn = document.createElement("button");
          btn.className = "action-btn";
          btn.type = "button";
          btn.textContent = label;
          btn.addEventListener("click", () => {
            wrap.remove();
            handleAction(send);
          });
          wrap.appendChild(btn);
        });

      if (!wrap.childNodes.length) return null;

      msgList.appendChild(wrap);
      msgList.scrollTop = msgList.scrollHeight;
      return wrap;
    }

    function initialButtons() {
      return [
        { label: "Info. página actual", send: "__page_info__" },
        { label: "Pregunta directa", send: "__direct__" },
        { label: "WhatsApp", url: WHATSAPP_URL }
      ];
    }

    function showInitialGreeting() {
      const namePart = visitorName ? `, ${visitorName}` : "";
      const greeting = `${getHourGreeting()}${namePart} 👋\nSoy el asistente de Travel Now.\n¿En qué puedo ayudarte?`;

      appendBubble("assistant", greeting, { save: false });
      appendButtonsRow(initialButtons());
    }

    function showResumeGreeting() {
      const changedPage = lastPage && lastPage !== window.location.href;
      const namePart = visitorName ? `, ${visitorName}` : "";

      if (changedPage) {
        appendBubble(
          "assistant",
          `${getHourGreeting()}${namePart} 👋\nSeguimos aquí. Ahora estás en ${currentPage.label}.`,
          { save: false }
        );
        appendButtonsRow(initialButtons());
        return;
      }

      showInitialGreeting();
    }

    function renderStoredHistory() {
      msgList.innerHTML = "";

      const usableHistory = Array.isArray(history) ? history.slice(-6) : [];
      usableHistory.forEach((item) => {
        appendBubble(item.role, item.content, { save: false });
      });

      if (usableHistory.length) {
        appendButtonsRow(initialButtons());
      } else {
        showResumeGreeting();
      }
    }

    function openPanel() {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");

      if (!bootedThisPage) {
        bootedThisPage = true;
        renderStoredHistory();
      }

      requestAnimationFrame(() => input.focus());
    }

    function closePanel() {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }

    function togglePanel() {
      if (panel.classList.contains("open")) closePanel();
      else openPanel();
    }

    launcher.addEventListener("click", (event) => {
      event.stopPropagation();
      togglePanel();
    });

    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      closePanel();
    });

    panel.addEventListener("click", (event) => event.stopPropagation());

    document.addEventListener("click", (event) => {
      if (!panel.classList.contains("open")) return;
      if (!panel.contains(event.target) && !launcher.contains(event.target)) closePanel();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage();
    });

    sendBtn.addEventListener("click", (event) => {
      event.preventDefault();
      sendMessage();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    async function parseResponse(response) {
      const raw = await response.text();

      try {
        return { raw, data: JSON.parse(raw) };
      } catch {
        return { raw, data: { ok: false, reply: raw } };
      }
    }

    function handleAction(send) {
      const action = safeString(send, 300);
      if (!action) return;

      if (action === "__direct__") {
        setStorage(STORAGE.lastIntent, "direct_question");
        appendBubble(
          "assistant",
          "Claro. Escríbeme tu duda sobre visas, pasaportes, citas o asesoría de Travel Now.",
          { save: false }
        );
        input.focus();
        return;
      }

      internalSend(action, { showUser: action !== "__page_info__" && action !== "__topics__" });
    }

    async function internalSend(text, { showUser = true } = {}) {
      const message = safeString(text, MAX_INPUT_CHARS);
      if (!message || isSending) return;

      isSending = true;
      input.disabled = true;
      sendBtn.disabled = true;

      const detectedName = detectName(message);
      if (detectedName) {
        visitorName = detectedName;
        setStorage(STORAGE.visitorName, detectedName);
      }

      if (showUser) appendBubble("user", message, { save: true });

      const typing = appendBubble("assistant", "Escribiendo…", { save: false });

      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: history.slice(-MAX_HISTORY_ITEMS),
            context: currentContext,
            session_id: sessionId,
            visitor_id: visitorId,
            visitor_name: visitorName,
            page_url: window.location.href,
            page_context: currentPage.key,
            page_label: currentPage.label,
            max_reply_chars: MAX_RENDERED_REPLY_CHARS
          })
        });

        const { data, raw } = await parseResponse(response);
        typing.remove();

        if (!response.ok || data?.ok === false) {
          console.warn("Travel Now Chatbot error:", response.status, raw, data);

          appendBubble(
            "assistant",
            "No pude responder bien ahora. Puedo ayudarte por WhatsApp o puedes intentar de nuevo.",
            { save: false }
          );

          appendButtonsRow([
            { label: "Reintentar", send: message },
            { label: "WhatsApp", url: WHATSAPP_URL },
            { label: "Info. página actual", send: "__page_info__" }
          ]);
          return;
        }

        if (data.context) persistContext(data.context);

        const reply = clipForBubble(data.reply || "¿Qué trámite necesitas revisar?");
        appendBubble("assistant", reply, { save: true });

        const quickActions = Array.isArray(data.quick_actions) ? data.quick_actions : [];
        const options = Array.isArray(data.options) ? data.options : [];

        if (quickActions.length) appendButtonsRow(quickActions);
        if (options.length) appendButtonsRow(options);
        if (!quickActions.length && !options.length) appendButtonsRow(initialButtons());
      } catch (error) {
        typing.remove();

        console.warn("Travel Now Chatbot fetch failed:", error);

        appendBubble(
          "assistant",
          "Se perdió la conexión. Intenta otra vez o contáctanos por WhatsApp.",
          { save: false }
        );

        appendButtonsRow([
          { label: "Reintentar", send: message },
          { label: "WhatsApp", url: WHATSAPP_URL },
          { label: "Info. página actual", send: "__page_info__" }
        ]);
      } finally {
        isSending = false;
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }
    }

    function sendMessage() {
      const text = safeString(input.value, MAX_INPUT_CHARS);
      if (!text) return;
      input.value = "";
      internalSend(text, { showUser: true });
    }

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open-chatbot], [data-open-assistant]");
      if (!trigger) return;

      const href = trigger.getAttribute("href") || "";
      if (href === "#assistantModal") return;

      event.preventDefault();
      openPanel();
    });
  });
})();
