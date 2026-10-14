/* ============================================================
   edge.js
   Elastic section seams.

   Every section ends with <svg class="edge"> whose path is a flat line at
   rest. Scroll velocity stretches the middle of the curve downwards and an
   elastic ease springs it back — the boundary between two sections behaves
   like a liquid surface.

   The geometry lives in a 0 0 100 100 viewBox that is stretched to the
   width of the page, so 1 vertical unit is ~3px of the 300px-tall box.
   Only sections currently near the viewport react.

   Exposes: Portfolio.initEdge()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  /* Resting seam, and the seam pushed down by `v` viewBox units. */
  var FLAT = 'M0,100 C0,100 19,100 50,100 C81,100 100,100 100,100';

  var MAX_DIP      = 22;    /* ≈66px at rest height */
  var MIN_VELOCITY = 180;   /* px/s before the seam reacts at all */
  var MAX_VELOCITY = 2200;  /* px/s that produces the full dip */

  function dip(v) {
    var y = 100 + v;
    return 'M0,100 C0,100 19,' + y + ' 50,' + y + ' C81,' + y + ' 100,100 100,100';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function init() {
    var gsap = window.gsap;
    if (!gsap || prefersReducedMotion()) return;

    var edges = [];

    Array.prototype.forEach.call(document.querySelectorAll('.edge'), function (svg) {
      var paths = svg.querySelectorAll('.edge__path');
      if (!paths.length) return;

      var section = svg.closest('section') || svg.parentNode;
      var edge = { paths: paths, near: true };

      /* Only the seams close to the viewport are worth animating. */
      if ('IntersectionObserver' in window && section) {
        edge.near = false;
        new IntersectionObserver(function (entries) {
          edge.near = entries[0].isIntersecting;
        }, { rootMargin: '25% 0px 25% 0px' }).observe(section);
      }

      edges.push(edge);
    });

    if (!edges.length) return;

    var lastY = window.scrollY;
    var lastT = performance.now();
    var velocity = 0;

    gsap.ticker.add(function () {
      var now = performance.now();
      var y = window.scrollY;
      var dt = Math.max(now - lastT, 1);
      lastT = now;

      var instant = ((y - lastY) / dt) * 1000; /* px per second */
      lastY = y;

      /* Smooth, so a single jittery frame cannot spike the curve. */
      velocity = velocity * 0.55 + instant * 0.45;

      var speed = Math.abs(velocity);
      if (speed < MIN_VELOCITY) return;

      /* Clamp before the value reaches the ease as well — elastic.out() with a
         large amplitude overshoots enormously and would fling the curve off
         the page. */
      var clamped = Math.min(speed, MAX_VELOCITY);
      var amount = (clamped / MAX_VELOCITY) * MAX_DIP;
      var stretched = dip(amount.toFixed(2));

      edges.forEach(function (edge) {
        if (!edge.near) return;
        gsap.killTweensOf(edge.paths);
        gsap.timeline()
          .to(edge.paths, {
            duration: 0.1,
            ease: 'none',
            attr: { d: stretched }
          })
          .to(edge.paths, {
            duration: 0.45 + clamped / 4000,
            ease: 'elastic.out(' + (clamped / 1500).toFixed(2) + ')',
            attr: { d: FLAT }
          });
      });
    });
  }

  Portfolio.initEdge = init;
})();
