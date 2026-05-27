/* =========================================================
   TRAVEL NOW — carousel.js v1.0
   Carrusel de servicios de visas y pasaportes.

   Arquitectura:
   - SERVICES: array centralizado, única fuente de verdad
   - Estado encapsulado en objeto local (no vars globales)
   - Autoplay desacoplado y pausable
   - Render dinámico limpio
   - Sin listeners duplicados
   - Compatible con servicios.html estructura existente
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     DATOS CENTRALIZADOS — 10 servicios obligatorios
     ========================================================= */
  var SERVICES = [
    {
      id:    "visa-usa",
      flag:  "🇺🇸",
      title: "Visa Americana B1/B2",
      desc:  "El trámite más solicitado. DS-160, pago MRV y preparación completa para tu entrevista consular. Vigencia hasta 10 años.",
      time:  "1–2 días internos",
      tag:   "B1/B2",
      cta:   "Ver requisitos",
      href:  "/pages/visaspais/visa-estados-unidos.html"
    },
    {
      id:    "pasaporte",
      flag:  "📘",
      title: "Pasaporte Mexicano",
      desc:  "Primera vez o renovación. Gestión completa ante la SRE: documentación, cita y seguimiento hasta la entrega.",
      time:  "Variable SRE",
      tag:   "Pasaporte",
      cta:   "Consultar",
      href:  "https://wa.me/5215521114448?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20pasaporte%20mexicano"
    },
    {
      id:    "eta-uk",
      flag:  "🇬🇧",
      title: "ETA Reino Unido",
      desc:  "Permiso electrónico 100% digital. Sin visita a embajada. Resolución en 72 horas. Vigencia 2 años.",
      time:  "72 horas",
      tag:   "Digital",
      cta:   "Ver proceso",
      href:  "/pages/visaspais/visa-reino-unido.html"
    },
    {
      id:    "visa-china",
      flag:  "🇨🇳",
      title: "Visa China",
      desc:  "Turismo, negocios, tránsito. Requiere cita presencial para toma de huellas. Tiempo normal: 3 días hábiles.",
      time:  "3 días hábiles",
      tag:   "Presencial",
      cta:   "Ver requisitos",
      href:  "/pages/visaspais/visa-china.html"
    },
    {
      id:    "visa-taiwan",
      flag:  "🇹🇼",
      title: "Visa Taiwán",
      desc:  "Visa de turismo o negocios. Una o múltiples entradas. Vigencia 3 meses. Trámite normal en 4 días hábiles.",
      time:  "4 días hábiles",
      tag:   "Turismo",
      cta:   "Ver requisitos",
      href:  "/pages/visaspais/visa-taiwan.html"
    },
    {
      id:    "evisa-india",
      flag:  "🇮🇳",
      title: "e-Visa India",
      desc:  "Visa electrónica 100% digital. Sin embajada. Proceso en 5 días hábiles. Vigencia 1 mes o 1 año.",
      time:  "5 días hábiles",
      tag:   "Digital",
      cta:   "Ver proceso",
      href:  "/pages/visaspais/visa-india.html"
    },
    {
      id:    "visa-australia",
      flag:  "🇦🇺",
      title: "Visa Australia",
      desc:  "Turismo, negocios o tránsito. Requiere cita para biométricos. Proceso: 4 a 8 semanas.",
      time:  "4–8 semanas",
      tag:   "Biométricos",
      cta:   "Ver requisitos",
      href:  "/pages/visaspais/visa-australia.html"
    },
    {
      id:    "visa-sudafrica",
      flag:  "🇿🇦",
      title: "Visa Sudáfrica",
      desc:  "Visa de visitante. Documentación completa incluyendo comprobante de solvencia. 20 días hábiles.",
      time:  "20 días hábiles",
      tag:   "Visitante",
      cta:   "Ver requisitos",
      href:  "/pages/visaspais/visa-sudafrica.html"
    },
    {
      id:    "visa-canada",
      flag:  "🇨🇦",
      title: "Visa Canadiense",
      desc:  "Turismo y negocios. Gestión integral ante Immigration, Refugees and Citizenship Canada.",
      time:  "Variable IRCC",
      tag:   "Turismo",
      cta:   "Consultar disponibilidad",
      href:  "https://wa.me/5215521114448?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20visa%20canadiense"
    },
    {
      id:    "asesoria",
      flag:  "🎯",
      title: "Asesoría Personalizada",
      desc:  "Casos especiales, rechazos anteriores, situaciones migratorias complejas. Análisis y estrategia a tu medida.",
      time:  "Según el caso",
      tag:   "Especializada",
      cta:   "Consultar por WhatsApp",
      href:  "https://wa.me/5215521114448?text=Hola%2C%20necesito%20una%20asesor%C3%ADa%20personalizada%20%F0%9F%99%82"
    }
  ];

  /* =========================================================
     ESTADO LOCAL — encapsulado, sin vars globales
     ========================================================= */
  var state = {
    current:   0,
    total:     SERVICES.length,
    timer:     null,
    paused:    false,
    INTERVAL:  4800
  };

  /* =========================================================
     REFS DOM — cacheadas una sola vez
     ========================================================= */
  var dom = {};

  function cacheDOM() {
    dom.media    = document.querySelector(".carousel__media-img");
    dom.mediaBg  = document.querySelector(".carousel__media-bg");
    dom.tag      = document.querySelector(".carousel__tag");
    dom.title    = document.querySelector(".carousel__title");
    dom.desc     = document.querySelector(".carousel__desc");
    dom.list     = document.querySelector(".carousel__list");
    dom.dotsWrap = document.querySelector(".dots");
    dom.chipsWrap= document.querySelector(".chips");
    dom.btnPrev  = document.querySelector(".arrow-btn--prev");
    dom.btnNext  = document.querySelector(".arrow-btn--next");
    dom.carousel = document.querySelector(".carousel");
  }

  /* =========================================================
     RENDER — actualizar el slide activo
     ========================================================= */
  function renderSlide(idx) {
    var s = SERVICES[idx];
    if (!s) return;

    /* Flag/icono */
    if (dom.media) {
      dom.media.textContent = s.flag;
      dom.media.style.cssText = "";          /* limpiar inline previo */
      dom.media.classList.add("is-emoji");   /* CSS maneja el display */
    }
    if (dom.mediaBg) {
      dom.mediaBg.style.background = "";     /* reset si había imagen */
    }

    /* Textos */
    if (dom.tag)   dom.tag.textContent   = s.tag;
    if (dom.title) dom.title.textContent = s.title;
    if (dom.desc)  dom.desc.textContent  = s.desc;

    /* Lista de beneficios → tiempo de proceso + CTA */
    if (dom.list) {
      dom.list.innerHTML =
        '<li><i class="fas fa-clock" aria-hidden="true"></i> ' + s.time + '</li>' +
        '<li><i class="fas fa-check-circle" aria-hidden="true"></i> Atención 100% remota</li>' +
        '<li><i class="fas fa-shield-halved" aria-hidden="true"></i> +9 años de experiencia</li>';
    }

    /* CTA buttons */
    var ctaLink = document.querySelector(".carousel__cta-link");
    var ctaWa   = document.querySelector(".carousel__cta-wa");
    if (ctaLink) {
      ctaLink.textContent = s.cta;
      ctaLink.href = s.href;
      var isExternal = s.href.indexOf("wa.me") > -1;
      if (isExternal) {
        ctaLink.setAttribute("target", "_blank");
        ctaLink.setAttribute("rel", "noopener noreferrer");
      } else {
        ctaLink.removeAttribute("target");
        ctaLink.removeAttribute("rel");
      }
    }
    if (ctaWa) {
      ctaWa.setAttribute("data-tramite", s.title);
    }

    /* Activar dot */
    updateDots(idx);

    /* Activar chip */
    updateChips(idx);
  }

  /* =========================================================
     DOTS — generación y actualización
     ========================================================= */
  function renderDots() {
    if (!dom.dotsWrap) return;
    dom.dotsWrap.innerHTML = "";
    SERVICES.forEach(function (s, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Ir a " + s.title);
      btn.setAttribute("aria-current", i === 0 ? "true" : "false");
      btn.addEventListener("click", function () { goToSlide(i); });
      dom.dotsWrap.appendChild(btn);
    });
  }

  function updateDots(idx) {
    if (!dom.dotsWrap) return;
    var dots = dom.dotsWrap.querySelectorAll("button");
    dots.forEach(function (dot, i) {
      dot.setAttribute("aria-current", i === idx ? "true" : "false");
    });
  }

  /* =========================================================
     CHIPS — accesos rápidos compactos
     ========================================================= */
  function renderChips() {
    if (!dom.chipsWrap) return;
    dom.chipsWrap.innerHTML = "";
    SERVICES.forEach(function (s, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (i === 0 ? " active" : "");
      btn.setAttribute("aria-label", s.title);
      btn.textContent = s.flag + " " + s.tag;
      btn.addEventListener("click", function () { goToSlide(i); });
      dom.chipsWrap.appendChild(btn);
    });
  }

  function updateChips(idx) {
    if (!dom.chipsWrap) return;
    var chips = dom.chipsWrap.querySelectorAll(".chip");
    chips.forEach(function (chip, i) {
      chip.classList.toggle("active", i === idx);
    });
  }

  /* =========================================================
     NAVEGACIÓN
     ========================================================= */
  function goToSlide(idx) {
    state.current = (idx + state.total) % state.total;
    renderSlide(state.current);
    /* Reset autoplay timer al navegar manualmente */
    if (state.timer) {
      stopAutoplay();
      if (!state.paused) startAutoplay();
    }
  }

  function nextSlide() { goToSlide(state.current + 1); }
  function prevSlide() { goToSlide(state.current - 1); }

  /* =========================================================
     AUTOPLAY — desacoplado
     ========================================================= */
  function startAutoplay() {
    stopAutoplay();
    state.timer = setInterval(function () {
      if (!state.paused) nextSlide();
    }, state.INTERVAL);
  }

  function stopAutoplay() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function pauseAutoplay()  { state.paused = true; }
  function resumeAutoplay() { state.paused = false; }

  /* =========================================================
     EVENTOS — registrados una sola vez
     ========================================================= */
  function bindEvents() {
    /* Prev / Next */
    if (dom.btnPrev) dom.btnPrev.addEventListener("click", prevSlide);
    if (dom.btnNext) dom.btnNext.addEventListener("click", nextSlide);

    /* Pause on hover / focus (accesibilidad) */
    if (dom.carousel) {
      dom.carousel.addEventListener("mouseenter", pauseAutoplay);
      dom.carousel.addEventListener("mouseleave", resumeAutoplay);
      dom.carousel.addEventListener("focusin",    pauseAutoplay);
      dom.carousel.addEventListener("focusout",   resumeAutoplay);
      /* Touch: pausa breve al swipe */
      dom.carousel.addEventListener("touchstart", pauseAutoplay, { passive: true });
      dom.carousel.addEventListener("touchend", function () {
        setTimeout(resumeAutoplay, 1200);
      }, { passive: true });
    }

    /* Teclado en el carrusel */
    if (dom.carousel) {
      dom.carousel.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft")  { e.preventDefault(); prevSlide(); }
        if (e.key === "ArrowRight") { e.preventDefault(); nextSlide(); }
      });
    }

    /* Visibilidad de pestaña — pausa si el usuario cambia de tab */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pauseAutoplay();
      else resumeAutoplay();
    });
  }

  /* =========================================================
     INIT
     ========================================================= */
  function initCarousel() {
    cacheDOM();

    /* Salida limpia si no hay carrusel en la página */
    if (!dom.carousel) return;

    renderDots();
    renderChips();
    renderSlide(0);
    bindEvents();
    startAutoplay();
  }

  document.addEventListener("DOMContentLoaded", initCarousel);

})();
