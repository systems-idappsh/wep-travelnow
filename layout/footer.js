/* =========================================================
   /layout/footer.js
   Renderiza footer dinámico:
   - #footer-nav
   - #footer-social
   - #footer-legal
   - #year / .js-year
   - logo de marca en footer
   - estado activo por página/sección actual

   Seguro, idempotente y sin innerHTML.
========================================================= */
(function () {
  "use strict";

  if (window.__TN_FOOTER_INIT__) return;
  window.__TN_FOOTER_INIT__ = true;

  function onReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function normalizePath(value) {
    var raw = typeof value === "string" ? value : "/index.html";

    try {
      raw = new URL(raw, window.location.origin).pathname;
    } catch (error) {
      raw = raw.split("?")[0].split("#")[0];
    }

    try {
      raw = decodeURIComponent(raw);
    } catch (error) {
      /* Mantener ruta original si no se puede decodificar. */
    }

    raw = raw.replace(/\/+$/, "");

    if (!raw || raw === "") return "/index.html";
    if (raw === "/") return "/index.html";

    return raw;
  }

  function sameInternalPage(a, b) {
    var pathA = normalizePath(a);
    var pathB = normalizePath(b);

    if (pathA === pathB) return true;

    /*
      Soporta sitios publicados en subcarpetas, por ejemplo:
      /mi-sitio/pages/core/contacto.html
      contra item.url:
      /pages/core/contacto.html
    */
    if (pathA !== "/index.html" && pathB.endsWith(pathA)) return true;
    if (pathB !== "/index.html" && pathA.endsWith(pathB)) return true;

    if (pathA === "/index.html" && /\/index\.html$/i.test(pathB)) return true;
    if (pathB === "/index.html" && /\/index\.html$/i.test(pathA)) return true;

    return false;
  }

  function sectionFromPath(value) {
    var path = normalizePath(value);

    if (path === "/index.html" || /\/index\.html$/i.test(path)) return "home";

    if (path.indexOf("/pages/core/servicios") !== -1) return "servicios";
    if (path.indexOf("/pages/core/nosotros") !== -1) return "nosotros";
    if (path.indexOf("/pages/core/faq") !== -1) return "faq";
    if (path.indexOf("/pages/core/contacto") !== -1) return "contacto";

    if (path.indexOf("/pages/visaspais/") !== -1) return "servicios";
    if (path.indexOf("/pages/tramites/") !== -1) return "servicios";

    if (path.indexOf("/pages/legal/") !== -1) return "legal";

    return "";
  }

  function isExternal(item) {
    if (!item || typeof item !== "object") return false;
    if (item.external === true) return true;

    var url = typeof item.url === "string" ? item.url : "";

    return /^https?:\/\//i.test(url);
  }

  function isActive(item) {
    if (!item || typeof item !== "object") return false;
    if (isExternal(item)) return false;

    var currentPath = window.location.pathname || "/index.html";
    var currentSection = sectionFromPath(currentPath);

    if (sameInternalPage(item.url, currentPath)) return true;

    if (
      typeof item.section === "string" &&
      item.section &&
      item.section === currentSection
    ) {
      return true;
    }

    return false;
  }

  function createIcon(iconClass) {
    var icon = document.createElement("i");
    icon.setAttribute("aria-hidden", "true");

    if (typeof iconClass === "string" && iconClass.trim()) {
      icon.className = iconClass.trim();
    }

    return icon;
  }

  function createSafeLink(item, baseClass) {
    if (!item || typeof item !== "object") return null;
    if (typeof item.url !== "string" || typeof item.name !== "string") return null;

    var link = document.createElement("a");
    var label = document.createElement("span");

    link.href = item.url;
    link.className = baseClass || "";

    if (typeof item.className === "string" && item.className.trim()) {
      link.classList.add(item.className.trim());
    }

    if (isActive(item)) {
      link.classList.add("active");
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }

    if (isExternal(item)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    if (typeof item.icon === "string" && item.icon.trim()) {
      link.appendChild(createIcon(item.icon));
    }

    label.textContent = item.name;
    link.appendChild(label);

    return link;
  }

  function appendTitle(target, text) {
    var title = document.createElement("div");
    title.className = "footer-column-title";
    title.textContent = text;
    target.appendChild(title);
  }

  function enhanceBrandBlock() {
    var title = document.querySelector("footer .footer-brand-title");

    if (!title) return;

    var column = title.closest(".footer-col");

    if (!column || column.dataset.tnBrandEnhanced === "1") return;

    var logoSrc =
      typeof window.FOOTER_LOGO === "string" && window.FOOTER_LOGO.trim()
        ? window.FOOTER_LOGO.trim()
        : "/assets/img/logo/logo.svg";

    var head = document.createElement("div");
    var logoLink = document.createElement("a");
    var logo = document.createElement("img");
    var textWrap = document.createElement("div");

    head.className = "footer-brand-head";
    logoLink.className = "footer-brand-logo-link";
    logoLink.href = "/index.html";
    logoLink.setAttribute("aria-label", "Ir a la página principal de Travel Now");

    logo.className = "footer-brand-logo";
    logo.src = logoSrc;
    logo.alt = "Travel Now";
    logo.loading = "lazy";
    logo.decoding = "async";

    textWrap.className = "footer-brand-text";

    column.insertBefore(head, title);
    logoLink.appendChild(logo);
    textWrap.appendChild(title);
    head.appendChild(logoLink);
    head.appendChild(textWrap);

    column.dataset.tnBrandEnhanced = "1";
  }

  function renderNavBlock(target, items) {
    if (!target || !Array.isArray(items) || !items.length) return;
    if (target.dataset.tnRendered === "1") return;

    target.className = "footer-col";
    target.replaceChildren();

    appendTitle(target, "Navegación");

    var linksWrap = document.createElement("div");
    var list = document.createElement("ul");

    linksWrap.className = "footer-links";
    list.className = "list";

    items.forEach(function (item) {
      var link = createSafeLink(item, "");

      if (!link) return;

      var li = document.createElement("li");
      li.appendChild(link);
      list.appendChild(li);
    });

    linksWrap.appendChild(list);
    target.appendChild(linksWrap);
    target.dataset.tnRendered = "1";
  }

  function renderSocialBlock(target, items) {
    if (!target || !Array.isArray(items) || !items.length) return;
    if (target.dataset.tnRendered === "1") return;

    target.className = "footer-col";
    target.replaceChildren();

    appendTitle(target, "Redes y Contacto");

    var wrap = document.createElement("div");
    wrap.className = "footer-social-list";

    items.forEach(function (item) {
      var link = createSafeLink(item, "social-item");

      if (link) {
        wrap.appendChild(link);
      }
    });

    target.appendChild(wrap);
    target.dataset.tnRendered = "1";
  }

  function renderLegalBlock(target, items) {
    if (!target || !Array.isArray(items) || !items.length) return;
    if (target.dataset.tnRendered === "1") return;

    target.className = "footer-col";
    target.replaceChildren();

    appendTitle(target, "Legal");

    var wrap = document.createElement("div");
    wrap.className = "footer-legal";

    items.forEach(function (item) {
      var link = createSafeLink(item, "legal-item");

      if (link) {
        wrap.appendChild(link);
      }
    });

    target.appendChild(wrap);
    target.dataset.tnRendered = "1";
  }

  function fillYear() {
    var year = String(new Date().getFullYear());
    var byId = document.getElementById("year");
    var byClass = document.querySelectorAll(".js-year");

    if (byId && !byId.textContent.trim()) {
      byId.textContent = year;
    }

    byClass.forEach(function (node) {
      if (node && !node.textContent.trim()) {
        node.textContent = year;
      }
    });
  }

  onReady(function () {
    fillYear();
    enhanceBrandBlock();

    renderNavBlock(
      document.getElementById("footer-nav"),
      Array.isArray(window.FOOTER_NAV) ? window.FOOTER_NAV : []
    );

    renderSocialBlock(
      document.getElementById("footer-social"),
      Array.isArray(window.FOOTER_SOCIAL) ? window.FOOTER_SOCIAL : []
    );

    renderLegalBlock(
      document.getElementById("footer-legal"),
      Array.isArray(window.FOOTER_LEGAL) ? window.FOOTER_LEGAL : []
    );
  });
})();
