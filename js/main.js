/* ============================================================
   main.js
   Entry point — boots the hero + the scroll-reveal engine.
   The other modules (scroll.js, glass.js, mascot.js, nav.js) are
   still on disk and can be re-enabled by loading them and calling
   their init function below.
   ============================================================ */
(function () {
  'use strict';

  var P = window.Portfolio || {};

  function boot() {
    /* split the hero name into masked letters (no-op if [data-split] is absent) */
    if (typeof P.initSplit === 'function') P.initSplit();

    /* scroll-driven blur + fade reveals */
    try {
      if (typeof P.initReveal !== 'function') throw new Error('reveal.js missing');
      P.initReveal();
    } catch (err) {
      /* Never leave content hidden: drop the gate, everything shows as-is. */
      document.documentElement.classList.remove('js');
    }

    /* Decorative extras — a failure here must never hide content. */
    if (typeof P.initMascots === 'function') P.initMascots();

    /* Greeting preloader: fades itself out once the page is ready. Started
       last so the reveal engine is already observing behind it, and wrapped
       so a failure can never leave the overlay covering the site. */
    try {
      if (typeof P.initPreloader !== 'function') throw new Error('preloader.js missing');
      P.initPreloader();
    } catch (err) {
      document.documentElement.classList.remove('is-loading');
      var veil = document.getElementById('preloader');
      if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
