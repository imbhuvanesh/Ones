/* ============================================================
   hero-trail.js
   GSAP cursor-following image trail for the hero.

   Portraits are absolutely/fixed positioned and faded in, dragged
   along the pointer's travel direction, then scaled away. A new
   image is emitted every `gap` pixels of pointer travel.

   Requires: js/vendor/gsap.min.js (loaded first)
   ============================================================ */
(function () {
  'use strict';

  function init() {
    if (typeof window.gsap === 'undefined') return;

    var gsap = window.gsap;
    var images = gsap.utils.toArray('.Hero__image');
    if (!images.length) return;

    /* Only run where there is a real cursor, and never against the
       user's reduced-motion preference. */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var gap = 60;
    var index = 0;
    var wrapper = gsap.utils.wrap(0, images.length);

    var mousePos = { x: 0, y: 0 };
    var lastMousePos = { x: 0, y: 0 };
    var cachedMousePos = { x: 0, y: 0 };

    /* Only emit while the hero is on screen. */
    var active = true;
    var hero = document.getElementById('hero');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        active = entries[0].isIntersecting;
        /* reset the origin so re-entering doesn't dump a burst of images */
        lastMousePos = { x: mousePos.x, y: mousePos.y };
      }, { threshold: 0 }).observe(hero);
    }

    document.addEventListener('mouseenter', function (e) {
      lastMousePos = { x: e.x, y: e.y };
      mousePos = { x: e.x, y: e.y };
    });

    document.addEventListener('mousemove', function (e) {
      mousePos = { x: e.x, y: e.y };
    });

    gsap.ticker.add(imageTrail);

    function imageTrail() {
      if (!active) return;

      var travelDistance = Math.hypot(
        lastMousePos.x - mousePos.x,
        lastMousePos.y - mousePos.y
      );

      /* ease the emission origin toward the pointer */
      cachedMousePos.x = gsap.utils.interpolate(
        cachedMousePos.x || mousePos.x,
        mousePos.x,
        0.1
      );
      cachedMousePos.y = gsap.utils.interpolate(
        cachedMousePos.y || mousePos.y,
        mousePos.y,
        0.1
      );

      if (travelDistance > gap) {
        animateImage();
        lastMousePos = { x: mousePos.x, y: mousePos.y };
      }
    }

    function animateImage() {
      var img = images[wrapper(index)];
      var deltaX = mousePos.x - lastMousePos.x;
      var deltaY = mousePos.y - lastMousePos.y;

      gsap.killTweensOf(img);
      gsap.set(img, { clearProps: 'all' });
      gsap.set(img, {
        rotation: 'random(-20,20)',
        left: mousePos.x,
        top: mousePos.y,
        xPercent: -50,
        yPercent: -50
      });

      gsap
        .timeline()
        .to(img, { opacity: 1, duration: 0.2 })
        .to(
          img,
          {
            x: '+=' + deltaX,
            y: '+=' + deltaY,
            ease: 'power4.out',
            duration: 1
          },
          '<'
        )
        .to(img, {
          scale: 0,
          ease: 'expo.in',
          duration: 1
        });

      index++;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
