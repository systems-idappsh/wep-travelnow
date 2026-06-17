// FILE: assets/js/chatbot.js
// Rol: lógica frontend del chatbot IA de Travel Now.
// Importante:
// - Conserva IDs actuales idappsh-chat-* para no romper HTML/CSS existente.
// - Conecta con Cloudflare Worker Travel Now.
// - No contiene API keys.
// - No toca navegación global.

(() => {
  if (window.__TRAVEL_NOW_CHATBOT_INIT__) return;
  window.__TRAVEL_NOW_CHATBOT_INIT__ = true;

  const WORKER_URL = "https://travelnow-chatbot-ia.systems-idappsh.workers.dev/chat";

  const GREETINGS = [
    "Hola 👋 Soy el asistente de Travel Now. ¿Qué trámite necesitas revisar?",
    "¡Hola! Puedo ayudarte con visas, pasaportes, citas o asesoría personalizada.",
    "Bienvenido a Travel Now 🌎 ¿Buscas información sobre visas, pasaporte o citas?",
    "Hola 😊 Cuéntame qué trámite necesitas y te oriento paso a paso."
  ];

  const DEFAULT_OPTIONS = [
    { label: "Visas americanas", send: "Quiero información sobre visas americanas" },
    { label: "Pasaportes", send: "Quiero información sobre pasaportes" },
    { label: "Visas por país", send: "Quiero información sobre visas por país" },
    { label: "Agendar cita", send: "Quiero información sobre agendado de citas" },
    { label: "Asesoría", send: "Quiero una asesoría personalizada" }
  ];

  const SESSION_KEY = "TRAVEL_NOW_CHAT_SESSION_ID";
  const CONTEXT_KEY = "TRAVEL_NOW_CHAT_CONTEXT";

  const randomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

  const makeId = () => {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const safeText = (value, maxLength = 2000) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
  };

  document.addEventListener("DOMContentLoaded", () => {
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
      console.warn("Faltan elementos del chatbot Travel Now:", missing.join(", "));
      return;
    }

    let booted = false;
    let isSending = false;
    let history = [];
    let currentContext = localStorage.getItem(CONTEXT_KEY) || "inicio";
    let sessionId = localStorage.getItem(SESSION_KEY) || makeId();

    localStorage.setItem(SESSION_KEY, sessionId);

    const navStack = [];

    function resetChat() {
      msgList.innerHTML = "";
      history = [];
      navStack.length = 0;
      currentContext = localStorage.getItem(CONTEXT_KEY) || "inicio";
    }

    function appendBubble(role, text) {
      const div = document.createElement("div");
      div.className = `msg ${role}`;
      div.textContent = String(text ?? "");
      msgList.appendChild(div);
      msgList.scrollTop = msgList.scrollHeight;
      return div;
    }

    function normalizeButtons(buttons) {
      if (!Array.isArray(buttons)) return [];

      return buttons
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const label = safeText(item.label || "Opción", 70);
          const send = safeText(item.send || "", 260);
          const url = safeText(item.url || "", 500);

          return { label, send, url };
        })
        .filter((item) => item.label && (item.send || item.url));
    }

    function appendButtonsRow(buttons, { pushMenu = false } = {}) {
      const validButtons = normalizeButtons(buttons);

      if (!validButtons.length) return null;

      const wrap = document.createElement("div");
      wrap.className = "action-row";

      validButtons.forEach((item) => {
        if (item.url) {
          const a = document.createElement("a");
          a.className = "action-btn";
          a.href = item.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = item.label;
          wrap.appendChild(a);
          return;
        }

        const btn = document.createElement("button");
        btn.className = "action-btn";
        btn.type = "button";
        btn.textContent = item.label;

        btn.addEventListener("click", () => {
          wrap.remove();
          handleAction(item.send);
        });

        wrap.appendChild(btn);
      });

      if (!wrap.childNodes.length) return null;

      msgList.appendChild(wrap);
      msgList.scrollTop = msgList.scrollHeight;

      if (pushMenu) {
        const onlySend = validButtons.filter((item) => item.send);

        if (onlySend.length) {
          navStack.push({
            context: currentContext,
            options: onlySend
          });

          if (navStack.length > 30) navStack.shift();
        }
      }

      return wrap;
    }

    function showStart() {
      appendBubble("assistant", randomGreeting());

      appendButtonsRow([
        { label: "Ver temas", send: "__topics__" },
        { label: "Pregunta directa", send: "__direct__" }
      ], { pushMenu: true });
    }

    function goBackMenu() {
      if (navStack.length < 2) {
        resetChat();
        showStart();
        return;
      }

      navStack.pop();

      const prev = navStack[navStack.length - 1];

      if (prev?.context) {
        currentContext = prev.context;
        localStorage.setItem(CONTEXT_KEY, currentContext);
      }

      appendButtonsRow(prev.options, { pushMenu: false });
    }

    function clamp(number, min, max) {
      return Math.max(min, Math.min(max, number));
    }

    function syncPanelToLauncher() {
      const panelHeight = panel.offsetHeight || 540;
      const launcherBox = launcher.getBoundingClientRect();

      const gap = 14;
      const desiredTop = launcherBox.top - panelHeight - gap;

      const minTop = 12;
      const maxTop = window.innerHeight - panelHeight - 12;
      const top = clamp(desiredTop, minTop, maxTop);

      panel.style.bottom = "auto";
      panel.style.top = `${top}px`;
    }

    function openPanel() {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");

      if (!booted) {
        booted = true;
        resetChat();
        showStart();
      }

      requestAnimationFrame(() => {
        syncPanelToLauncher();
        input.focus();
      });
    }

    function closePanel() {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }

    function togglePanel() {
      if (panel.classList.contains("open")) {
        closePanel();
        return;
      }

      openPanel();
    }

    launcher.addEventListener("click", (event) => {
      event.stopPropagation();
      togglePanel();
    });

    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      closePanel();
    });

    panel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      if (!panel.classList.contains("open")) return;

      const clickedInside = panel.contains(event.target) || launcher.contains(event.target);

      if (!clickedInside) closePanel();
    });

    function setupPresence() {
      let raf = null;

      const minTop = 140;
      const maxTop = () => Math.max(180, window.innerHeight - 170);

      function setTop(px) {
        document.documentElement.style.setProperty("--cb-launcher-top", `${px}px`);
      }

      function syncTop() {
        const doc = document.documentElement;
        const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        const top = minTop + (maxTop() - minTop) * progress;

        setTop(top);

        if (panel.classList.contains("open")) {
          syncPanelToLauncher();
        }
      }

      function onScrollOrResize() {
        if (raf) return;

        raf = requestAnimationFrame(() => {
          raf = null;
          syncTop();
        });
      }

      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });

      syncTop();

      let lock = false;

      function nudge() {
        if (lock) return;
        if (panel.classList.contains("open")) return;
        if (document.visibilityState !== "visible") return;

        lock = true;

        launcher.classList.remove("is-nudging");
        launcher.offsetHeight;
        launcher.classList.add("is-nudging");

        window.setTimeout(() => launcher.classList.remove("is-nudging"), 560);
        window.setTimeout(() => {
          lock = false;
        }, 1200);
      }

      window.setInterval(nudge, 9000);
    }

    setupPresence();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage();
    });

    sendBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
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
        return {
          raw,
          data: JSON.parse(raw)
        };
      } catch {
        return {
          raw,
          data: {
            ok: false,
            reply: raw
          }
        };
      }
    }

    function pickQuickActions(data) {
      const actions = Array.isArray(data?.quick_actions) ? data.quick_actions : [];

      return actions
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: safeText(item.label || "Abrir", 70),
          url: safeText(item.url || "", 500)
        }))
        .filter((item) => item.label && item.url);
    }

    function pickOptions(data) {
      const options = Array.isArray(data?.options) ? data.options : [];

      return options
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          label: safeText(item.label || "Opción", 70),
          send: safeText(item.send || "", 260)
        }))
        .filter((item) => item.label && item.send);
    }

    function handleAction(send) {
      const action = safeText(send, 300);

      if (!action) return;

      if (action === "__direct__") {
        appendBubble("assistant", "Va. Escríbeme tu duda sobre visas, pasaportes, citas o asesoría 🙂");
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

    async function internalSend(text, { showUser = true } = {}) {
      const message = safeText(text, 1600);

      if (!message || isSending) return;

      isSending = true;
      input.disabled = true;
      sendBtn.disabled = true;

      if (showUser) {
        appendBubble("user", message);
      }

      history.push({
        role: "user",
        content: message
      });

      if (history.length > 12) {
        history = history.slice(-12);
      }

      const typing = appendBubble("assistant", "Escribiendo…");

      try {
        const response = await fetch(WORKER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message,
            history,
            context: currentContext,
            session_id: sessionId,
            page_url: window.location.href
          })
        });

        const { raw, data } = await parseResponse(response);

        typing.remove();

        if (!response.ok || data?.ok === false) {
          console.warn("Travel Now chatbot error:", {
            status: response.status,
            raw,
            data
          });

          appendBubble(
            "assistant",
            "No pude conectar bien con el asistente en este momento. Puedes intentar de nuevo o contactarnos por WhatsApp."
          );

          appendButtonsRow([
            { label: "Reintentar", send: message },
            { label: "Ver temas", send: "__topics__" },
            { label: "WhatsApp", url: "https://wa.me/5215521114448" }
          ], { pushMenu: true });

          return;
        }

        if (typeof data?.context === "string" && data.context.trim()) {
          currentContext = data.context.trim();
          localStorage.setItem(CONTEXT_KEY, currentContext);
        }

        const reply = safeText(data?.reply || "", 2000);

        if (reply) {
          appendBubble("assistant", reply);

          history.push({
            role: "assistant",
            content: reply
          });

          if (history.length > 12) {
            history = history.slice(-12);
          }
        } else {
          appendBubble(
            "assistant",
            "Puedo ayudarte con visas, pasaportes, citas o asesoría personalizada. ¿Qué trámite necesitas revisar?"
          );
        }

        const quickActions = pickQuickActions(data);
        if (quickActions.length) {
          appendButtonsRow(quickActions, { pushMenu: false });
        }

        const options = pickOptions(data);

        if (options.length) {
          appendButtonsRow(options, { pushMenu: true });
        } else {
          appendButtonsRow(DEFAULT_OPTIONS, { pushMenu: true });
        }
      } catch (error) {
        typing.remove();

        console.warn("Travel Now chatbot fetch failed:", error);

        appendBubble(
          "assistant",
          "Se perdió la conexión con el asistente. Intenta otra vez o contáctanos por WhatsApp."
        );

        appendButtonsRow([
          { label: "Reintentar", send: message },
          { label: "WhatsApp", url: "https://wa.me/5215521114448" },
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
      const text = safeText(input.value, 1600);

      if (!text) return;

      input.value = "";
      internalSend(text, { showUser: true });
    }
  });
})();