document.addEventListener('DOMContentLoaded', function () {
  var video = document.getElementById('banner-video');
  var overlay = document.getElementById('video-overlay');
  var section = document.getElementById('video-banner');

  if (!video || !overlay || !section) return;

  var isInside = false;
  var isPlaying = false;

  function startVideo() {
    if (isPlaying) return;

    isPlaying = true;
    video.currentTime = 0;
    overlay.style.opacity = '0';

    video.play().catch(function () {
      isPlaying = false;
    });
  }

  // LOOP CONTROLADO
  video.addEventListener('ended', function () {
    isPlaying = false;
    if (isInside) startVideo();
  });

  // OVERLAY
  video.addEventListener('timeupdate', function () {
    if (!video.duration) return;
    var remaining = video.duration - video.currentTime;
    overlay.style.opacity = remaining <= 5.5 ? '1' : '0';
  });

  // HOVER = ÚNICO TRIGGER REAL
  section.addEventListener('mouseenter', function () {
    isInside = true;
    startVideo();
  });

  section.addEventListener('mouseleave', function () {
    isInside = false;
  });

  // SCROLL = SOLO APAGA (NO START)
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        isInside = false;
      }
    });
  }, { threshold: 0.6 });

  observer.observe(section);
});