/* =========================================================
   TRAVEL NOW — TRÁMITES JS v1.2
   Navegación interna, FAQ, reveal on scroll y WhatsApp contextual.
========================================================= */

(function () {
  'use strict';

  const SELECTORS = {
    header: '.header',
    quickSelect: '#quickSectionNav',
    quickChip: '.tramite-chip',
    anchor: 'a[href^="#"]',
    faqQuestion: '.faq-question',
    reveal: '.reveal-on-scroll',
    whatsapp: 'a[href*="wa.me"], a[href*="whatsapp"]'
  };

  function getHeaderOffset() {
    const header = document.querySelector(SELECTORS.header);
    const headerHeight = header && Number.isFinite(header.offsetHeight)
      ? header.offsetHeight
      : 80;

    return headerHeight + 28;
  }

  function safeQuerySelector(selector) {
    if (typeof selector !== 'string' || selector.trim() === '') return null;

    try {
      return document.querySelector(selector);
    } catch (error) {
      console.warn('Selector inválido en tramites.js:', selector);
      return null;
    }
  }

  function scrollToSection(targetSelector, shouldFocus) {
    const target = safeQuerySelector(targetSelector);

    if (!target) return false;

    const top =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      getHeaderOffset();

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: 'smooth'
    });

    if (shouldFocus) {
      target.setAttribute('tabindex', '-1');
      window.setTimeout(() => {
        try {
          target.focus({ preventScroll: true });
        } catch (error) {
          target.focus();
        }
      }, 450);
    }

    return true;
  }

  function setActiveChip(activeHref) {
    const chips = document.querySelectorAll(SELECTORS.quickChip);

    if (!chips.length) return;

    chips.forEach((chip) => {
      const isActive = chip.getAttribute('href') === activeHref;
      chip.classList.toggle('is-active', isActive);

      if (isActive) {
        chip.setAttribute('aria-current', 'true');
      } else {
        chip.removeAttribute('aria-current');
      }
    });
  }

  function initInternalNavigation() {
    const select = document.querySelector(SELECTORS.quickSelect);

    if (select) {
      select.addEventListener('change', (event) => {
        const value = event && event.target ? event.target.value : '';

        if (!value) return;

        const moved = scrollToSection(value, true);

        if (moved) {
          setActiveChip(value);
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', value);
          }
        }
      });
    }

    const anchors = document.querySelectorAll(SELECTORS.anchor);

    anchors.forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');

        if (!href || href === '#') return;

        if (href === '#top') {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const target = safeQuerySelector(href);

        if (!target) return;

        event.preventDefault();

        const moved = scrollToSection(href, true);

        if (moved) {
          setActiveChip(href);

          if (select && Array.from(select.options).some((option) => option.value === href)) {
            select.value = href;
          }

          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', href);
          }
        }
      });
    });
  }

  function initActiveSectionObserver() {
    const chips = document.querySelectorAll(SELECTORS.quickChip);

    if (!chips.length || !window.IntersectionObserver) return;

    const sections = Array.from(chips)
      .map((chip) => chip.getAttribute('href'))
      .filter(Boolean)
      .map((href) => safeQuerySelector(href))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible || !visible.target || !visible.target.id) return;

      setActiveChip(`#${visible.target.id}`);
    }, {
      root: null,
      threshold: [0.22, 0.35, 0.5],
      rootMargin: `-${getHeaderOffset()}px 0px -55% 0px`
    });

    sections.forEach((section) => observer.observe(section));
  }

  function initFAQAccordion() {
    const faqItems = document.querySelectorAll(SELECTORS.faqQuestion);

    if (!faqItems.length) return;

    faqItems.forEach((button) => {
      button.addEventListener('click', function () {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const answer = this.nextElementSibling;

        if (!answer) return;

        this.setAttribute('aria-expanded', String(!isExpanded));
        answer.classList.toggle('is-open', !isExpanded);
      });
    });
  }

  function initRevealOnScroll() {
    const elements = document.querySelectorAll(SELECTORS.reveal);

    if (!elements.length) return;

    if (!window.IntersectionObserver) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach((el) => observer.observe(el));
  }

  function updateWhatsAppLinks() {
    const waLinks = document.querySelectorAll(SELECTORS.whatsapp);

    if (!waLinks.length) return;

    const pagePath = window.location.pathname
      .split('/')
      .pop()
      .replace('.html', '')
      .replace('.htm', '');

    const messages = {
      'agendado-citas': 'Hola, quiero información sobre el servicio de agendado de citas para visa americana 📅',
      'asesoria-personalizada': 'Hola, me interesa recibir asesoría personalizada para mi trámite migratorio 💼',
      'pasaportes': 'Hola, necesito información sobre trámite de pasaporte mexicano 🛂',
      'visas-americanas': 'Hola, quiero información sobre el trámite de visa americana 🇺🇸'
    };

    const contextMessage = messages[pagePath] || 'Hola, quiero información sobre trámites migratorios 🌎';

    waLinks.forEach((link) => {
      try {
        const url = new URL(link.href);

        if (!url.searchParams.has('text')) {
          url.searchParams.set('text', contextMessage);
          link.href = url.toString();
        }
      } catch (error) {
        console.warn('Link de WhatsApp inválido:', link.href);
      }
    });
  }

  function openHashOnLoad() {
    if (!window.location.hash) return;

    window.setTimeout(() => {
      scrollToSection(window.location.hash, true);
      setActiveChip(window.location.hash);
    }, 250);
  }

  function init() {
    try {
      initFAQAccordion();
      initRevealOnScroll();
      initInternalNavigation();
      initActiveSectionObserver();
      updateWhatsAppLinks();
      openHashOnLoad();
    } catch (error) {
      console.error('Error inicializando tramites.js:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
