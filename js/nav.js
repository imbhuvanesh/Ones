/* ============================================================
   nav.js
   Mobile menu, sticky-bar state and active-section highlighting.
   Exposes: Portfolio.initNav()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  Portfolio.initNav = function () {
    var nav = document.getElementById('site-nav');
    var toggle = document.getElementById('nav-toggle');
    var menu = document.getElementById('nav-menu');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

    /* ---------------- mobile menu ---------------- */
    if (toggle && menu) {
      var closeMenu = function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      };

      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) closeMenu();
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeMenu();
      });
    }

    /* ---------------- sticky bar ---------------- */
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        if (!nav) return;
        nav.classList.toggle('is-stuck', (window.pageYOffset || 0) > 24);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------------- active section ---------------- */
    var map = [];
    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href.length < 2) return;
      var section = document.getElementById(href.slice(1));
      if (section) map.push({ section: section, link: link });
    });

    if (!map.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          map.forEach(function (pair) {
            pair.link.classList.toggle(
              'is-active',
              pair.section === entry.target
            );
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    map.forEach(function (pair) { observer.observe(pair.section); });
  };
})();
