/* ============================================================
   scroll.js
   rAF-throttled background parallax.
   Mark any element with data-parallax="0.18" (speed).
   Exposes: Portfolio.initParallax()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  Portfolio.initParallax = function () {
    var layers = Array.prototype.slice.call(
      document.querySelectorAll('[data-parallax]')
    );
    if (!layers.length) return;

    /* Respect reduced-motion and skip on small/touch screens. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 760px)').matches) return;

    var ticking = false;

    function update() {
      ticking = false;

      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      /* the fixed layer is inset -18% top/bottom, so we may drift 18vh
         before an edge would show */
      var limit = window.innerHeight * 0.17;

      layers.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var shift = Math.max(-limit, Math.min(limit, y * speed));
        el.style.transform =
          'translate3d(0, ' + shift.toFixed(2) + 'px, 0) scale(1.06)';
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  };
})();
