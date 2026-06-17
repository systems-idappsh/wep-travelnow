/* =========================================================
   /assets/js/main.js
   Travel Now
   Controlador global:
   - Modal asistente
   - Review slider 3D
========================================================= */
(function () {
  "use strict";

  if (window.__TN_MAIN_INIT__) return;
  window.__TN_MAIN_INIT__ = true;

  function byId(id) {
    return document.getElementById(id);
  }

  function onReady(callback) {
    if (typeof callback !== "function") return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function safeString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function initAssistantModal() {
    var modal = byId("assistantModal");
    var closeBtn = byId("closeAssistant");
    var modalOverlay = byId("assistantOverlay");
    var lastFocused = null;

    if (!modal) return;

    function openModal(event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      lastFocused = document.activeElement;

      modal.classList.add("open", "is-open");
      modal.setAttribute("aria-hidden", "false");

      if (modalOverlay) {
        modalOverlay.classList.add("is-open");
      }

      document.body.style.overflow = "hidden";

      if (!window.matchMedia("(pointer:coarse)").matches) {
        var first = modal.querySelector("input, select, textarea, button");

        if (first && typeof first.focus === "function") {
          setTimeout(function () {
            first.focus();
          }, 60);
        }
      }
    }

    function closeModal() {
      modal.classList.remove("open", "is-open");
      modal.setAttribute("aria-hidden", "true");

      if (modalOverlay) {
        modalOverlay.classList.remove("is-open");
      }

      document.body.style.overflow = "";

      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    document.addEventListener("click", function (event) {
      var target = event.target;

      if (!target || typeof target.closest !== "function") return;

      var opener = target.closest("[data-open-assistant], .is-assistant-open, .is-assistant");

      if (!opener) return;

      openModal(event);
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    if (modalOverlay) {
      modalOverlay.addEventListener("click", closeModal);
    }

    document.addEventListener("keydown", function (event) {
      if (!event || !modal.classList.contains("open")) return;

      if (event.key === "Escape") {
        closeModal();
      }
    });
  }

  function initReviewSlider3D() {
    var stage = byId("reviews3dStage");
    var dataEl = byId("reviewsData");
    var btnPrev = byId("revPrev");
    var btnNext = byId("revNext");
    var countEl = byId("reviewsCount");
    var shell = byId("reviewsShell");

    if (!stage || !dataEl) return;

    var reviews = [];

    try {
      var raw = String(dataEl.textContent || "").trim();
      reviews = raw ? JSON.parse(raw) : [];
    } catch (error) {
      reviews = [];
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      if (countEl) countEl.textContent = "0 reseñas";
      return;
    }

    if (countEl) {
      countEl.textContent = reviews.length + " reseñas";
    }

    var index = 0;
    var autoTimer = null;
    var isPaused = false;
    var AUTO_MS = 4500;

    function clampIndex(value) {
      var total = reviews.length;
      return ((value % total) + total) % total;
    }

    function starsLine(value) {
      var stars = Math.max(1, Math.min(5, Math.round(Number(value) || 5)));
      return "★★★★★".slice(0, stars) + "☆☆☆☆☆".slice(0, 5 - stars);
    }

    function formatDate(value) {
      var raw = safeString(value);

      if (!raw) return "";

      var date = new Date(raw);

      if (Number.isNaN(date.getTime())) return raw;

      try {
        return date.toLocaleDateString("es-MX", {
          year: "numeric",
          month: "short",
          day: "2-digit"
        });
      } catch (error) {
        return raw;
      }
    }

    function makeElement(tag, className) {
      var element = document.createElement(tag);

      if (className) {
        element.className = className;
      }

      return element;
    }

    function renderCard(item, position, isActive) {
      var card = makeElement("article", "r3d-card");
      var head = makeElement("div", "r3d-head");
      var avatar = makeElement("div", "r3d-avatar");
      var info = makeElement("div", "r3d-info");
      var name = makeElement("div", "r3d-name");
      var meta = makeElement("div", "r3d-meta");
      var chip = makeElement("span", "src-chip");
      var dot = makeElement("span", "src-dot");
      var stars = makeElement("div", "r3d-stars");
      var text = makeElement("div", "r3d-text");
      var more = makeElement("button", "r3d-more");

      var date = safeString(item && item.date);
      var tag = safeString(item && item.tag);
      var metaText = [];

      card.setAttribute("data-pos", position);
      card.tabIndex = 0;

      avatar.textContent = safeString(item && item.avatar) || "AV";

      name.textContent = safeString(item && item.name) || "Reseña";

      if (date) metaText.push(formatDate(date));
      if (tag) metaText.push(tag);

      meta.textContent = metaText.join(" • ");

      dot.setAttribute("aria-hidden", "true");
      chip.appendChild(dot);
      chip.appendChild(document.createTextNode("Google"));

      if (meta.textContent) {
        meta.appendChild(document.createTextNode(" "));
      }

      meta.appendChild(chip);

      info.appendChild(name);
      info.appendChild(meta);

      head.appendChild(avatar);
      head.appendChild(info);

      stars.textContent = starsLine(item && item.stars);
      stars.setAttribute("aria-label", stars.textContent + " estrellas");

      text.textContent = safeString(item && item.text);

      more.type = "button";
      more.textContent = "Ver más";
      more.setAttribute("data-action", "toggle");

      if (!isActive) {
        more.hidden = true;
      }

      card.appendChild(head);
      card.appendChild(stars);
      card.appendChild(text);
      card.appendChild(more);

      return card;
    }

    function build(directionClass) {
      stage.replaceChildren();

      if (directionClass) {
        stage.classList.remove("slide-next", "slide-prev");
        stage.classList.add(directionClass);

        setTimeout(function () {
          stage.classList.remove(directionClass);
        }, 380);
      }

      stage.appendChild(renderCard(reviews[clampIndex(index - 1)], "prev", false));
      stage.appendChild(renderCard(reviews[index], "active", true));
      stage.appendChild(renderCard(reviews[clampIndex(index + 1)], "next", false));
    }

    function go(step) {
      index = clampIndex(index + step);
      build(step > 0 ? "slide-next" : "slide-prev");
    }

    function stopAuto() {
      if (!autoTimer) return;

      clearInterval(autoTimer);
      autoTimer = null;
    }

    function startAuto() {
      stopAuto();

      autoTimer = setInterval(function () {
        if (!isPaused) {
          go(1);
        }
      }, AUTO_MS);
    }

    function pause() {
      isPaused = true;
    }

    function resume() {
      isPaused = false;
    }

    build("");
    startAuto();

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        go(-1);
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", function () {
        go(1);
      });
    }

    if (shell) {
      shell.addEventListener("mouseenter", pause);
      shell.addEventListener("mouseleave", resume);
      shell.addEventListener("focusin", pause);
      shell.addEventListener("focusout", resume);
      shell.addEventListener("touchstart", pause, { passive: true });
      shell.addEventListener(
        "touchend",
        function () {
          setTimeout(resume, 800);
        },
        { passive: true }
      );
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        pause();
        return;
      }

      resume();
    });

    stage.addEventListener("click", function (event) {
      var target = event.target;

      if (!target || typeof target.getAttribute !== "function") return;

      if (target.getAttribute("data-action") !== "toggle") return;

      var card = typeof target.closest === "function" ? target.closest(".r3d-card") : null;

      if (!card) return;

      var isExpanded = card.classList.toggle("expanded");
      target.textContent = isExpanded ? "Ver menos" : "Ver más";
    });

    stage.addEventListener("keydown", function (event) {
      if (!event) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      }
    });

    window.addEventListener("beforeunload", stopAuto);
  }

  onReady(function () {
    initAssistantModal();
    initReviewSlider3D();
  });
})();