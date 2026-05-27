

/* =========================================================
   TRAVEL NOW — HERO + REVIEWS v2.0
   Sin next-slide card. Carousel automático limpio.
========================================================= */

(function () {

  /* ===== SLIDES ===== */
  const SLIDES = [
    {
      img: 'assets/img/banner/agendado-citas.webp',
      pos: '60% center',
      eyebrow: 'Asesoría remota · Todo México',
      title: 'Tramitamos tu visa<br><span class="grad">de forma rápida y segura</span>',
      text: 'Te acompañamos paso a paso con requisitos correctos, preparación profesional y seguimiento real para que avances sin errores ni estrés.',
    },
    {
      img: 'assets/img/banner/asesoria-personalizada.webp',
      pos: '35% center',
      eyebrow: 'Gestión integral de documentos',
      title: 'Gestionamos tu pasaporte<br><span class="grad">para que viajes tranquilo</span>',
      text: 'Evita filas y errores. Nosotros revisamos y preparamos tu trámite correctamente desde el inicio hasta la entrega.',
    },
    {
      img: 'assets/img/banner/pasaportes.webp',
      pos: 'center',
      eyebrow: 'Especialistas en trámites migratorios',
      title: 'Asesoría experta en<br><span class="grad">trámites migratorios</span>',
      text: 'Casos especiales, rechazos o renovaciones. Te guiamos estratégicamente para aumentar tu probabilidad de aprobación.',
    },
    {
      img: 'assets/img/banner/visas-americanas.webp',
      pos: 'center',
      eyebrow: 'Visa Americana B1/B2 · DS-160 y entrevista',
      title: 'Tu visa americana<br><span class="grad">sin errores ni rechazos</span>',
      text: 'Preparamos tu DS-160, pago MRV y entrevista consular con estrategia probada. Atendemos casos especiales y renovaciones.',
    },
  ];

  

  const AUTO_DELAY = 6000;
  const TRANSITION_MS = 1200;

  const hero     = document.querySelector('.hero');
  const bgA      = document.querySelector('.hero-bg-a');
  const bgB      = document.querySelector('.hero-bg-b');
  const eyebrow  = document.getElementById('heroEyebrow');
  const titleEl  = document.getElementById('heroTitle');
  const textEl   = document.getElementById('heroText');
  const dots     = document.querySelectorAll('.hero-dot');

  if (!hero || !bgA || !bgB) return;

  let current   = 0;
  let animating = false;
  let autoTimer = null;

  /* init primer slide */
  bgA.style.backgroundImage    = `url(${SLIDES[0].img})`;
  bgA.style.backgroundPosition = SLIDES[0].pos;
  updateContent(0);
  updateDots(0);
  setTimeout(() => hero.classList.add('show-text'), 300);
  startAuto();

  /* === FUNCIONES === */

  function goTo(idx) {
    if (animating || idx === current) return;
    animating = true;

    /* fade out texto */
    hero.classList.remove('show-text');

    const next = SLIDES[idx];

    /* prepara B */
    bgB.style.backgroundImage    = `url(${next.img})`;
    bgB.style.backgroundPosition = next.pos;

    /* crossfade A→B */
    hero.classList.add('is-switching');

    setTimeout(() => {
      bgA.style.backgroundImage    = bgB.style.backgroundImage;
      bgA.style.backgroundPosition = bgB.style.backgroundPosition;
      hero.classList.remove('is-switching');

      updateContent(idx);
      updateDots(idx);

      current   = idx;
      animating = false;

      setTimeout(() => hero.classList.add('show-text'), 40);
    }, TRANSITION_MS);
  }

  function goNext() {
    goTo((current + 1) % SLIDES.length);
  }

  function updateContent(idx) {
    const s = SLIDES[idx];
    if (eyebrow)  eyebrow.textContent = s.eyebrow;
    if (titleEl)  titleEl.innerHTML   = s.title;
    if (textEl)   textEl.textContent  = s.text;
  }

  function updateDots(idx) {
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(goNext, AUTO_DELAY);
  }

  /* clicks en dots */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAuto();
    });
  });

  /* pausa en hover */
  hero.addEventListener('mouseenter', () => clearInterval(autoTimer));
  hero.addEventListener('mouseleave', startAuto);

  /* swipe táctil */
  let touchX = 0;
  hero.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    const dx = touchX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      goTo(dx > 0
        ? (current + 1) % SLIDES.length
        : (current - 1 + SLIDES.length) % SLIDES.length
      );
      startAuto();
    }
  }, { passive: true });

})();


/* =========================================================
   REVIEWS SLIDER
========================================================= */
window.addEventListener('load', () => {
  const reviews = document.querySelectorAll('.review');
  if (!reviews || reviews.length < 2) return;

  let idx = 0;
  reviews.forEach(r => r.classList.remove('active', 'exit'));
  reviews[0].classList.add('active');

  setInterval(() => {
    const cur  = reviews[idx];
    cur.classList.remove('active');
    cur.classList.add('exit');
    idx = (idx + 1) % reviews.length;
    reviews[idx].classList.add('active');
    setTimeout(() => cur.classList.remove('exit'), 800);
  }, 4500);
});




/* =========================================================
   FLAGS FILTER (home)
========================================================= */
(function () {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.flag-card');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.cat || 'all';
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.continent === cat;
        card.dataset.hidden = show ? 'false' : 'true';
      });
    });
  });
})();

/* FOOTER YEAR: gestionado por /layout/footer.js — duplicado eliminado. */
