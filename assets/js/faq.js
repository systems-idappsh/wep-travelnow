/* =========================================================
   TRAVEL NOW — faq.js v3.0
   Comportamiento:
   - Estado inicial VACÍO (ninguna pregunta visible)
   - Selector compacto de temas con dropdown
   - Búsqueda en tiempo real que filtra dentro del tema
   - Acordeones accesibles (uno abierto a la vez)
   - Deep-link via hash
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     DATOS DE TEMAS
     Fuente única de verdad. Sincronizado con data-cat en HTML.
     ========================================================= */
  var TOPICS = [
    { cat: "general",      emoji: "💬", label: "General",         count: 5  },
    { cat: "visa-usa",     emoji: "🇺🇸", label: "Visa Americana",  count: 6  },
    { cat: "otros-paises", emoji: "🌍", label: "Otros países",    count: 5  },
    { cat: "pasaporte",    emoji: "📘", label: "Pasaporte",       count: 3  },
    { cat: "proceso",      emoji: "⚙️",  label: "Proceso y pagos", count: 3  }
  ];

  /* =========================================================
     ESTADO
     ========================================================= */
  var state = {
    activeTopic: null,   /* cat string | null */
    searchTerm:  ""
  };

  /* =========================================================
     REFS DOM (cacheadas una sola vez)
     ========================================================= */
  var refs = {};

  function cacheRefs() {
    refs.input       = document.getElementById("faqTopicInput");
    refs.clearBtn    = document.getElementById("faqClearInput");
    refs.drop        = document.getElementById("faqTopicsDrop");
    refs.emptyState  = document.getElementById("faqEmptyState");
    refs.resultsHdr  = document.getElementById("faqResultsHeader");
    refs.resultsTitle= document.getElementById("faqResultsTitle");
    refs.resultsCount= document.getElementById("faqResultsCount");
    refs.list        = document.getElementById("faqList");
    refs.noResults   = document.getElementById("faqNoResults");
    refs.activeTag   = document.getElementById("faqActiveTopic");
    refs.activeLabel = document.getElementById("faqActiveLabel");
    refs.removeBtn   = document.getElementById("faqRemoveTopic");
    refs.items       = document.querySelectorAll(".faq-item");
    refs.questions   = document.querySelectorAll(".faq-question");
  }

  /* =========================================================
     RENDER: llenar dropdown de temas
     ========================================================= */
  function buildDropdown() {
    if (!refs.drop) return;
    refs.drop.innerHTML = "";
    TOPICS.forEach(function (t) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "faq-topic-item";
      btn.setAttribute("data-cat", t.cat);
      btn.innerHTML =
        '<span class="faq-topic-emoji">' + t.emoji + '</span>' +
        '<span class="faq-topic-meta">' +
          '<span class="faq-topic-name">' + t.label + '</span>' +
          '<span class="faq-topic-count">' + t.count + ' preguntas</span>' +
        '</span>' +
        '<i class="fas fa-check faq-topic-check" aria-hidden="true"></i>';
      btn.addEventListener("click", function () {
        selectTopic(t.cat);
      });
      refs.drop.appendChild(btn);
    });
  }

  /* =========================================================
     SELECCIONAR TEMA
     ========================================================= */
  function selectTopic(cat) {
    state.activeTopic = cat;
    state.searchTerm  = "";

    /* Limpiar input */
    if (refs.input) refs.input.value = "";
    if (refs.clearBtn) refs.clearBtn.classList.remove("visible");

    /* Cerrar dropdown */
    closeDropdown();

    /* Marcar item activo en dropdown */
    refs.drop && refs.drop.querySelectorAll(".faq-topic-item").forEach(function (btn) {
      btn.classList.toggle("selected", btn.getAttribute("data-cat") === cat);
    });

    /* Tag activo bajo el input */
    var topic = TOPICS.find(function (t) { return t.cat === cat; });
    if (topic && refs.activeLabel) {
      refs.activeLabel.textContent = topic.emoji + " " + topic.label;
    }
    if (refs.activeTag) refs.activeTag.classList.add("visible");

    renderItems();
  }

  /* =========================================================
     LIMPIAR SELECCIÓN DE TEMA
     ========================================================= */
  function clearTopic() {
    state.activeTopic = null;
    state.searchTerm  = "";
    if (refs.input)    refs.input.value = "";
    if (refs.clearBtn) refs.clearBtn.classList.remove("visible");
    if (refs.activeTag) refs.activeTag.classList.remove("visible");
    refs.drop && refs.drop.querySelectorAll(".faq-topic-item").forEach(function (btn) {
      btn.classList.remove("selected");
    });
    renderItems();
  }

  /* =========================================================
     RENDERIZAR ITEMS según estado
     ========================================================= */
  function renderItems() {
    var hasTopic = !!state.activeTopic;
    var term     = state.searchTerm.toLowerCase().trim();

    /* Sin tema seleccionado → estado vacío */
    if (!hasTopic) {
      showEmptyState();
      return;
    }

    /* Filtrar items */
    var visibleCount = 0;
    refs.items.forEach(function (item) {
      var matchesCat  = item.getAttribute("data-cat") === state.activeTopic;
      var qEl         = item.querySelector(".faq-q-text");
      var aEl         = item.querySelector(".faq-answer-inner");

      /* Reset highlight */
      if (qEl) qEl.innerHTML = qEl.textContent;

      if (!matchesCat) {
        item.setAttribute("data-hidden", "true");
        return;
      }

      if (term) {
        var fullText = ((qEl ? qEl.textContent : "") + " " + (aEl ? aEl.textContent : "")).toLowerCase();
        if (!fullText.includes(term)) {
          item.setAttribute("data-hidden", "true");
          return;
        }
        /* Resaltar término */
        if (qEl) {
          var safeQ = qEl.textContent;
          var regex = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
          qEl.innerHTML = safeQ.replace(regex, "<mark>$1</mark>");
        }
      }

      item.setAttribute("data-hidden", "false");
      visibleCount++;
    });

    /* Cabecera de resultados */
    showResultsHeader(visibleCount, term);

    /* Sin resultados */
    if (refs.noResults) refs.noResults.classList.toggle("visible", visibleCount === 0);
    if (refs.emptyState) refs.emptyState.classList.add("hidden");
  }

  /* =========================================================
     HELPERS DE VISTA
     ========================================================= */
  function showEmptyState() {
    if (refs.emptyState)  refs.emptyState.classList.remove("hidden");
    if (refs.resultsHdr)  refs.resultsHdr.classList.remove("visible");
    if (refs.noResults)   refs.noResults.classList.remove("visible");
    if (refs.list) {
      refs.items.forEach(function (item) {
        item.setAttribute("data-hidden", "true");
      });
    }
  }

  function showResultsHeader(count, term) {
    if (!refs.resultsHdr) return;
    refs.resultsHdr.classList.add("visible");
    if (refs.emptyState) refs.emptyState.classList.add("hidden");

    var topic = TOPICS.find(function (t) { return t.cat === state.activeTopic; });
    if (refs.resultsTitle && topic) {
      refs.resultsTitle.innerHTML =
        '<span class="faq-results-emoji">' + topic.emoji + '</span>' +
        (term ? '"' + state.searchTerm + '"' : topic.label);
    }
    if (refs.resultsCount) {
      refs.resultsCount.textContent = count + " resultado" + (count !== 1 ? "s" : "");
    }
  }

  /* =========================================================
     DROPDOWN: abrir / cerrar
     ========================================================= */
  function openDropdown() {
    if (!refs.drop) return;
    filterDropdownItems(refs.input ? refs.input.value : "");
    refs.drop.classList.add("visible");
  }

  function closeDropdown() {
    if (refs.drop) refs.drop.classList.remove("visible");
  }

  function filterDropdownItems(val) {
    if (!refs.drop) return;
    var term = val.toLowerCase().trim();
    refs.drop.querySelectorAll(".faq-topic-item").forEach(function (btn) {
      var name = (btn.querySelector(".faq-topic-name") || {}).textContent || "";
      btn.classList.toggle("hidden", !!(term && !name.toLowerCase().includes(term)));
    });
  }

  /* =========================================================
     ACORDEONES
     ========================================================= */
  function bindAccordions() {
    refs.questions.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item    = btn.closest(".faq-item");
        if (!item) return;
        var wasOpen = item.classList.contains("open");

        /* Cerrar todos */
        refs.items.forEach(function (i) {
          i.classList.remove("open");
          var q = i.querySelector(".faq-question");
          if (q) q.setAttribute("aria-expanded", "false");
        });

        /* Abrir si estaba cerrado */
        if (!wasOpen) {
          item.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* =========================================================
     DEEP LINK (hash en URL)
     ========================================================= */
  function handleDeepLink() {
    var hash = window.location.hash;
    if (!hash) return;
    var target = document.querySelector(hash);
    if (!target) return;

    var cat = target.getAttribute("data-cat");
    if (cat) {
      selectTopic(cat);
      setTimeout(function () {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("open");
        var q = target.querySelector(".faq-question");
        if (q) q.setAttribute("aria-expanded", "true");
      }, 350);
    }
  }

  /* =========================================================
     INIT
     ========================================================= */
  document.addEventListener("DOMContentLoaded", function () {
    cacheRefs();
    buildDropdown();

    /* Estado inicial: vacío */
    showEmptyState();

    /* Input: abrir dropdown al escribir */
    if (refs.input) {
      refs.input.addEventListener("focus", openDropdown);
      refs.input.addEventListener("input", function () {
        var val = refs.input.value;
        if (refs.clearBtn) refs.clearBtn.classList.toggle("visible", !!val.trim());
        filterDropdownItems(val);
        openDropdown();

        /* Si hay tema activo, también filtra las preguntas */
        if (state.activeTopic) {
          state.searchTerm = val;
          renderItems();
        }
      });
      refs.input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { closeDropdown(); refs.input.blur(); }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          var first = refs.drop && refs.drop.querySelector(".faq-topic-item:not(.hidden)");
          if (first) first.focus();
        }
      });
    }

    /* Teclado en dropdown items */
    if (refs.drop) {
      refs.drop.addEventListener("keydown", function (e) {
        var items = Array.from(refs.drop.querySelectorAll(".faq-topic-item:not(.hidden)"));
        var idx   = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); if (items[idx + 1]) items[idx + 1].focus(); }
        if (e.key === "ArrowUp")   { e.preventDefault(); if (idx > 0) items[idx - 1].focus(); else if (refs.input) refs.input.focus(); }
        if (e.key === "Escape")    { closeDropdown(); if (refs.input) refs.input.focus(); }
      });
    }

    /* Botón limpiar input */
    if (refs.clearBtn) {
      refs.clearBtn.addEventListener("click", function () {
        clearTopic();
        if (refs.input) refs.input.focus();
      });
    }

    /* Botón quitar tema activo */
    if (refs.removeBtn) {
      refs.removeBtn.addEventListener("click", clearTopic);
    }

    /* Cerrar dropdown al hacer clic fuera */
    document.addEventListener("click", function (e) {
      if (!e.target) return;
      var inside = (refs.input && refs.input.contains(e.target)) ||
                   (refs.drop  && refs.drop.contains(e.target));
      if (!inside) closeDropdown();
    });

    bindAccordions();
    handleDeepLink();

    /* Header scroll */
    var header = document.querySelector(".header");
    if (header) {
      var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 60); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    /* Footer year */
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

})();
