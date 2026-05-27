/* =========================================================
   /layout/support.js
   Puente de compatibilidad.

   El soporte visual lo controla:
   /assets/js/support_fab.js

   Este archivo se mantiene para que layout-loader no falle si algún flujo
   todavía espera /layout/support.js.
========================================================= */
(function () {
  "use strict";

  if (window.__TN_LAYOUT_SUPPORT_BRIDGE__) return;
  window.__TN_LAYOUT_SUPPORT_BRIDGE__ = true;
})();
