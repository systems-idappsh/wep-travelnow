/* =========================================================
   /layout/header.js
   Renderiza el menú principal dentro de <nav id="nav"></nav>
   Maneja:
   - menú móvil (#menuBtn)
   - cierre al hacer clic en enlaces
   - estado activo por ruta
   - clases scrolled / is-fixed al hacer scroll
   - render seguro sin innerHTML
========================================================= */
(function () {
  "use strict";

  if (window.__TN_HEADER_INIT__) return;
  window.__TN_HEADER_INIT__ = true;

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

    raw = raw.replace(/\/+$/, "");

    if (!raw || raw === "") return "/index.html";
    if (raw === "/") return "/index.html";

    return raw;
  }

  function sectionFromPath(value) {
    var path = normalizePath(value);

    if (path === "/index.html") return "home";

    if (path.indexOf("/pages/core/servicios") !== -1) return "servicios";
    if (path.indexOf("/pages/core/nosotros") !== -1) return "nosotros";
    if (path.indexOf("/pages/core/faq") !== -1) return "faq";
    if (path.indexOf("/pages/core/contacto") !== -1) return "contacto";

    if (path.indexOf("/pages/visaspais/") !== -1) return "servicios";
    if (path.indexOf("/pages/tramites/") !== -1) return "servicios";

    if (path.indexOf("/pages/legal/") !== -1) return "";

    return "";
  }

  function createNavLink(item, currentSection) {
    if (!item || typeof item !== "object") return null;
    if (typeof item.name !== "string" || typeof item.url !== "string") return null;

    var link = document.createElement("a");
    var isActive = item.section && item.section === currentSection;

    link.href = item.url;
    link.textContent = item.name;

    if (isActive) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    return link;
  }

  function renderNav(navElement, items, currentSection) {
    if (!navElement || !Array.isArray(items)) return;

    var fragment = document.createDocumentFragment();

    items.forEach(function (item) {
      var link = createNavLink(item, currentSection);

      if (link) {
        fragment.appendChild(link);
      }
    });

    navElement.replaceChildren(fragment);
  }

  function closeMobileMenu(menuButton, navElement) {
    if (!menuButton || !navElement) return;

    navElement.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "Menú";
    document.body.style.overflow = "";
  }

  function bindMobileMenu(menuButton, navElement) {
    if (!menuButton || !navElement) return;

    if (menuButton.dataset.tnMenuBound === "true") return;
    menuButton.dataset.tnMenuBound = "true";

    menuButton.addEventListener("click", function () {
      var willOpen = !navElement.classList.contains("open");

      navElement.classList.toggle("open", willOpen);
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.textContent = willOpen ? "Cerrar" : "Menú";
      document.body.style.overflow = willOpen ? "hidden" : "";
    });

    navElement.addEventListener("click", function (event) {
      var target = event.target;

      if (!target || target.tagName !== "A") return;

      closeMobileMenu(menuButton, navElement);
    });

    document.addEventListener("click", function (event) {
      if (!navElement.classList.contains("open")) return;

      var target = event.target;
      var headerInner = document.querySelector(".header-inner");

      if (headerInner && headerInner.contains(target)) return;

      closeMobileMenu(menuButton, navElement);
    });

    document.addEventListener("keydown", function (event) {
      if (event && event.key === "Escape" && navElement.classList.contains("open")) {
        closeMobileMenu(menuButton, navElement);
      }
    });

    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 899 && navElement.classList.contains("open")) {
          closeMobileMenu(menuButton, navElement);
        }
      },
      { passive: true }
    );
  }

  function bindHeaderScroll() {
    var header = document.querySelector(".header");

    if (!header) return;
    if (header.dataset.tnScrollBound === "true") return;

    header.dataset.tnScrollBound = "true";

    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset || 0;

      header.classList.toggle("is-fixed", y > 80);
      header.classList.toggle("scrolled", y > 40);

      ticking = false;
    }

    function onScroll() {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  onReady(function () {
    var navElement = document.getElementById("nav");
    var menuButton = document.getElementById("menuBtn");
    var items = Array.isArray(window.NAV_ITEMS) ? window.NAV_ITEMS : [];
    var currentSection = sectionFromPath(window.location.pathname);

    renderNav(navElement, items, currentSection);
    bindMobileMenu(menuButton, navElement);
    bindHeaderScroll();
  });
})();