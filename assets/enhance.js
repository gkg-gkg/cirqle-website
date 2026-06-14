/* ── Cirqle shared UI enhancements (loaded site-wide) ──
   Self-contained & idempotent: injects its own elements, so no
   per-page markup is required. Skips heavy effects on touch
   devices and when the user prefers reduced motion. */
(function () {
  'use strict';

  // ── Scroll progress bar ──
  var bar = document.getElementById('scrollProgress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.id = 'scrollProgress';
    document.body.appendChild(bar);
  }
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Reflect signed-in state on simple marketing navs ──
  // (scoped to the nav CTA only; pages with their own auth handling
  //  use different button classes and are left untouched)
  try {
    var sess = JSON.parse(localStorage.getItem('cirqle_session') || sessionStorage.getItem('cirqle_session') || 'null');
    if (sess) {
      document.querySelectorAll('nav a.btn.btn-blue[href$="signup.html"]').forEach(function (a) {
        a.setAttribute('href', 'dashboard.html');
        a.textContent = 'Go to dashboard';
      });
    }
  } catch (e) { /* ignore malformed session */ }

  // ── Pointer-driven effects (skip on touch / reduced-motion) ──
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduceMotion) return;

  // Cursor spotlight glow that smoothly trails the pointer
  var glow = document.getElementById('cursorGlow');
  if (!glow) {
    glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.id = 'cursorGlow';
    document.body.appendChild(glow);
  }
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var gx = mx, gy = my, raf = null;
  function trail() {
    gx += (mx - gx) * 0.16;
    gy += (my - gy) * 0.16;
    glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
    if (Math.abs(mx - gx) > 0.4 || Math.abs(my - gy) > 0.4) {
      raf = requestAnimationFrame(trail);
    } else {
      raf = null;
    }
  }
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    glow.style.opacity = '1';
    if (!raf) raf = requestAnimationFrame(trail);
  }, { passive: true });
  document.addEventListener('mouseleave', function () {
    glow.style.opacity = '0';
  });

  // ── Magnetic primary buttons ──
  document.querySelectorAll('.btn-primary').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var dx = e.clientX - r.left - r.width / 2;
      var dy = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + dx * 0.22 + 'px,' + dy * 0.34 + 'px)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
  });
})();
