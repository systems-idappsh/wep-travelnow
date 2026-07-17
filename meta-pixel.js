/*
  META PIXEL — TRAVEL NOW
  Pixel ID: 1044465534700075
  ============================================================
  Un solo archivo, cargado en todas las páginas.
  Cualquier cambio futuro (nuevos eventos, ajustes) se hace
  aquí una sola vez y aplica a todo el sitio.
  ============================================================
*/
(function () {
  'use strict';

  var PIXEL_ID = '1044465534700075';

  // --- Base Pixel (bootstrap oficial de Meta) ---
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  // Fallback para navegadores sin JS (poco relevante aquí, el sitio ya requiere JS)
  var img = document.createElement('img');
  img.height = 1; img.width = 1; img.style.display = 'none';
  img.src = 'https://www.facebook.com/tr?id=' + PIXEL_ID + '&ev=PageView&noscript=1';
  document.body ? document.body.appendChild(img) : window.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(img); });

  // --- Tracking de eventos por comportamiento (sin depender de clases/IDs) ---
  function safeTrack(eventName, params) {
    if (typeof fbq !== 'function') return;
    try { fbq('track', eventName, params || {}); }
    catch (err) { console.warn('[Pixel] Error al trackear:', eventName, err); }
  }

  var fired = {};
  function trackOnce(key, eventName, params) {
    if (fired[key]) return;
    fired[key] = true;
    safeTrack(eventName, params);
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;

    var href = (el.getAttribute('href') || '').toLowerCase();
    var text = (el.textContent || '').trim().toLowerCase();

    if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1 || text === 'whatsapp') {
      trackOnce('whatsapp', 'Lead', { content_name: 'WhatsApp Click' });
      return;
    }

    if (text.indexOf('iniciar tr') !== -1 || text.indexOf('no esperes') !== -1) {
      trackOnce('cta_principal', 'Lead', { content_name: 'Iniciar Tramite CTA' });
      return;
    }

    var serviceButtons = ['ver información', 'ver requisitos', 'ver fechas', 'contactar', 'analisis'];
    for (var i = 0; i < serviceButtons.length; i++) {
      if (text.indexOf(serviceButtons[i]) !== -1) {
        safeTrack('ViewContent', { content_name: el.textContent.trim() });
        return;
      }
    }
  }, { passive: true });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.tagName === 'FORM') {
      safeTrack('Lead', { content_name: 'Form Submit: ' + (form.id || form.name || 'unknown') });
    }
  }, { passive: true });

})();
