/**
 * Travel Now — Nosotros Page Interactions
 * Archivo: assets/js/nosotros.js
 *
 * Objetivo:
 * - Activar la animación del proceso SOLO cuando:
 *   1. El cursor entra a la sección.
 *   2. El scroll llega al nivel visual de la sección.
 * - Reiniciar la animación cada vez que el cursor entra.
 * - Reiniciar la animación cada vez que el usuario sale y vuelve a entrar
 *   a la zona de activación por scroll.
 * - No activar automáticamente en DOMContentLoaded.
 */

(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var section = document.getElementById("procesoTrabajo");

    if (!section || !section.classList.contains("tnw-process")) {
      return;
    }

    var rafId = null;
    var scrollWasInsideTriggerZone = false;

    function restartAnimation() {
      section.classList.remove("is-active");

      /* Fuerza reflow para reiniciar animaciones CSS de forma confiable. */
      void section.offsetWidth;

      section.classList.add("is-active");
    }

    function isSectionAtScrollLevel() {
      var rect = section.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      /*
       * Línea de activación:
       * Se activa cuando la sección cruza aproximadamente el centro visual.
       * No se ejecuta al cargar la página porque no llamamos esta función
       * desde DOMContentLoaded, solo desde scroll/resize.
       */
      var triggerY = viewportHeight * 0.55;

      return rect.top <= triggerY && rect.bottom >= triggerY;
    }

    function handleScrollTrigger() {
      var isInside = isSectionAtScrollLevel();

      if (isInside && !scrollWasInsideTriggerZone) {
        restartAnimation();
      }

      scrollWasInsideTriggerZone = isInside;
    }

    function updateMouseGlow(event) {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(function () {
        var rect = section.getBoundingClientRect();

        if (!rect.width || !rect.height) {
          rafId = null;
          return;
        }

        var x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        var y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);

        section.style.setProperty("--mx", x + "%");
        section.style.setProperty("--my", y + "%");

        rafId = null;
      });
    }

    section.addEventListener("mouseenter", function (event) {
      restartAnimation();
      updateMouseGlow(event);
    });

    section.addEventListener("mousemove", updateMouseGlow);

    window.addEventListener("scroll", handleScrollTrigger, { passive: true });
    window.addEventListener("resize", function () {
      scrollWasInsideTriggerZone = false;
    });
  });
})();
