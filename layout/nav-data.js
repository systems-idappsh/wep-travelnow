/* =========================================================
   /layout/nav-data.js
   Fuente única de datos para navegación global.
   ---------------------------------------------------------
   REGLAS:
   - Todas las rutas internas usan rutas absolutas (/...)
   - Compatible con:
       /index.html
       /pages/core/*
       /pages/legal/*
       /pages/tramites/*
       /pages/visaspais/*
   - NO usar ../ ni ../../
========================================================= */
(function () {
  "use strict";

  /* ======================================================
     NAV PRINCIPAL
  ====================================================== */
  window.NAV_ITEMS = [
    {
      name: "Principal",
      url: "/index.html",
      section: "home"
    },
    {
      name: "Servicios",
      url: "/pages/core/servicios.html",
      section: "servicios"
    },
    {
      name: "Nosotros",
      url: "/pages/core/nosotros.html",
      section: "nosotros"
    },
    {
      name: "FAQ",
      url: "/pages/core/faq.html",
      section: "faq"
    },
    {
      name: "Contacto",
      url: "/pages/core/contacto.html",
      section: "contacto"
    }
  ];

  /* ======================================================
     FOOTER NAV
  ====================================================== */
  window.FOOTER_NAV = window.NAV_ITEMS.slice();

  /* ======================================================
     LOGO FOOTER
  ====================================================== */
  window.FOOTER_LOGO = "/assets/img/logo/logo.svg";


  /* ======================================================
     FOOTER LEGAL
  ====================================================== */
  window.FOOTER_LEGAL = [
    {
      name: "Aviso de privacidad",
      url: "/pages/legal/aviso_privacidad.html",
      icon: "fa-solid fa-shield-halved",
      className: "privacidad"
    },
    {
      name: "Términos y condiciones",
      url: "/pages/legal/terminos_condiciones.html",
      icon: "fa-solid fa-file-contract",
      className: "terminos"
    }
  ];

  /* ======================================================
     REDES / CONTACTO
  ====================================================== */
  window.FOOTER_SOCIAL = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/share/1DTbZwXcYM/",
      icon: "fa-brands fa-facebook-f",
      className: "facebook",
      external: true
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@travel.nowvisas",
      icon: "fa-brands fa-tiktok",
      className: "tiktok",
      external: true
    },
    {
      name: "WhatsApp",
      url: "https://wa.me/5215521114448",
      icon: "fa-brands fa-whatsapp",
      className: "whatsapp",
      external: true
    },
    {
      name: "+52 1 55 2111 4448",
      url: "tel:+5215521114448",
      icon: "fa-solid fa-phone",
      className: "phone",
      external: false
    },
    {
      name: "contacto@travel-now.com.mx",
      url: "mailto:contacto@travel-now.com.mx",
      icon: "fa-solid fa-envelope",
      className: "email",
      external: false
    }
  ];

  /* ======================================================
     READY FLAG
  ====================================================== */
  window.__TN_NAV_DATA_READY__ = true;
})();