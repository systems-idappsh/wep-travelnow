/* =========================================================
   TRAVEL NOW — PÁGINA DE PAÍS v2.1
   Fixes:
   - [BUG] yearEl no declarado → ReferenceError
   - [BUG] Binding de support panel eliminado: lo gestiona
           support_fab.js (cargado en las mismas páginas).
           Dejar este binding causaba conflicto y panel huérfano.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* === READ PROGRESS === */
  const bar = document.querySelector('.read-progress');
  const doc = document.querySelector('.pais-doc');

  if (bar && doc) {
    window.addEventListener('scroll', () => {
      const rect  = doc.getBoundingClientRect();
      const total = doc.offsetHeight - window.innerHeight;
      const done  = Math.max(0, -rect.top);
      bar.style.width = Math.min(100, (done / total) * 100) + '%';
    }, { passive: true });
  }

  /* === FAQ SELECT → SMOOTH SCROLL + HIGHLIGHT === */
  const select = document.getElementById('faq-select');
  if (select) {
    select.addEventListener('change', () => {
      const target = document.querySelector(select.value);
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      document.querySelectorAll('.doc-section.section-active')
        .forEach(s => s.classList.remove('section-active'));

      target.classList.add('section-active');
      setTimeout(() => target.classList.remove('section-active'), 3000);

      select.value = '';
    });
  }

  /* === AÑO EN FOOTER ===
     FIX: yearEl no estaba declarado, causando ReferenceError.
     Nota: footer.js también lo maneja con guardia de contenido vacío,
     por lo que esta asignación es idempotente.
  */
  const yearEl = document.getElementById('year');
  if (yearEl && !yearEl.textContent.trim()) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* NOTA: El panel de soporte (FAB, overlay, panel) es gestionado
     exclusivamente por /assets/js/support_fab.js, que ya está cargado
     en todas las páginas de país. El binding previo que existía aquí
     era un duplicado huérfano (no encontraba elementos .is-support)
     y se eliminó para evitar confusión y listeners zombie. */
});
