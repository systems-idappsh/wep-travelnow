/* =========================================================
   TRAVEL NOW — PROCESO DE TRABAJO v1.1
   Fix:
   - [BUG] scrollArmed nunca se rearma después de la primera
     activación. La línea `scrollArmed = true` dentro del bloque
     "fuera de la zona" era redundante (la guardia ya requiere
     scrollArmed=true para llegar ahí). La animación se disparaba
     solo una vez total y nunca volvía al entrar de nuevo.
   - Se reemplazó la lógica de flag único por el patrón correcto
     de "zona previa" (scrollWasInZone), igual al de nosotros.js.
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const section = document.getElementById("procesoTrabajo");

  if (!section) return;

  let rafId = null;

  /*
    scrollWasInZone rastrea si el scroll estaba dentro de la zona
    de activación en el ciclo anterior.
    - false → fuera de zona
    - true  → dentro de zona (animación ya disparada)

    La animación se dispara en el flanco de subida: fuera→dentro.
    Al salir de la zona (dentro→fuera), se rearma automáticamente.
  */
  let scrollWasInZone = false;

  function restartAnimation() {
    section.classList.remove("is-active");
    void section.offsetWidth; // fuerza reflow para reiniciar CSS animations
    section.classList.add("is-active");
  }

  function isSectionAtScrollLevel() {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const triggerLine = viewportHeight * 0.55;
    return rect.top <= triggerLine && rect.bottom >= triggerLine;
  }

  function handleScroll() {
    const isInZone = isSectionAtScrollLevel();

    // Flanco de subida: entró a la zona → disparar
    if (isInZone && !scrollWasInZone) {
      restartAnimation();
    }

    // Actualizar estado para el próximo ciclo
    // (el rearm ocurre automáticamente al salir: scrollWasInZone pasa a false)
    scrollWasInZone = isInZone;
  }

  function updateMouseGlow(event) {
    if (rafId) return;

    rafId = window.requestAnimationFrame(function () {
      const rect = section.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        rafId = null;
        return;
      }

      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));

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

  window.addEventListener("scroll", handleScroll, { passive: true });

  window.addEventListener("resize", function () {
    // Al cambiar el viewport, reiniciar el estado de zona
    // para que la próxima comprobación sea fresca
    scrollWasInZone = false;
  });

  // Evaluación inicial (por si la sección ya está en viewport al cargar)
  handleScroll();
});
