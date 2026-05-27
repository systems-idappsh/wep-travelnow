/* =========================================================
   /layout/layout-loader.js
   Carga componentes globales de Travel Now una sola vez.

   Orden intencional:
   1) nav-data.js          datos compartidos
   2) header.js            menú principal
   3) footer.js            footer dinámico
   4) componente_bandera.js selector de países, solo actúa si existe contenedor
   5) support.js           puente/no-op para compatibilidad
   6) chatbot.js           chatbot IA global
========================================================= */
(function () {
  "use strict";

  if (window.__TN_LAYOUT_LOADER_INIT__) return;
  window.__TN_LAYOUT_LOADER_INIT__ = true;

  var currentScript = document.currentScript;
  var layoutBase = "/layout/";

  try {
    if (currentScript && currentScript.src) {
      layoutBase = new URL(".", currentScript.src).href;
    }
  } catch (error) {
    layoutBase = "/layout/";
  }

  var scripts = [
    "nav-data.js",
    "header.js",
    "footer.js",
    "componente_bandera.js",
    "support.js",
    "chatbot.js"
  ];

  function resolveScript(src) {
    try {
      return new URL(src, layoutBase).href;
    } catch (error) {
      return layoutBase + src;
    }
  }

  function alreadyLoaded(absSrc) {
    var nodes = document.querySelectorAll("script[src]");
    var index;

    for (index = 0; index < nodes.length; index += 1) {
      var nodeSrc = nodes[index].getAttribute("src");

      if (!nodeSrc) continue;

      try {
        if (new URL(nodeSrc, document.baseURI).href === absSrc) {
          return true;
        }
      } catch (error) {
        if (nodeSrc === absSrc) {
          return true;
        }
      }
    }

    return false;
  }

  function showCriticalError(message) {
    function renderError() {
      if (!document.body || document.getElementById("tn-layout-error")) return;

      var box = document.createElement("div");
      box.id = "tn-layout-error";
      box.setAttribute("role", "alert");
      box.style.cssText =
        "position:fixed;left:12px;right:12px;top:12px;z-index:99999;" +
        "padding:12px 14px;border-radius:12px;background:#fff3cd;color:#3d2b00;" +
        "border:1px solid #ffda6a;font:600 14px system-ui,Arial;" +
        "box-shadow:0 10px 30px rgba(0,0,0,.16)";

      box.textContent = message;
      document.body.insertBefore(box, document.body.firstChild);
    }

    if (document.body) {
      renderError();
      return;
    }

    document.addEventListener("DOMContentLoaded", renderError, { once: true });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var absSrc = resolveScript(src);
      var script;

      if (alreadyLoaded(absSrc)) {
        resolve(absSrc);
        return;
      }

      script = document.createElement("script");
      script.src = absSrc;
      script.async = false;
      script.defer = false;
      script.dataset.tnLayoutScript = "true";

      script.onload = function () {
        resolve(absSrc);
      };

      script.onerror = function () {
        reject(new Error("No se pudo cargar: " + absSrc));
      };

      document.head.appendChild(script);
    });
  }

  function loadSequentially(list) {
    return list.reduce(function (chain, src) {
      return chain.then(function () {
        return loadScript(src);
      });
    }, Promise.resolve());
  }

  loadSequentially(scripts).catch(function (error) {
    if (window.console && typeof window.console.error === "function") {
      window.console.error("[Travel Now layout-loader]", error);
    }

    showCriticalError("No se pudieron cargar algunos componentes del sitio. Recarga la página.");
  });
})();
