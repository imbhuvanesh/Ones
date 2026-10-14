/* ============================================================
   reveal.js
   The scroll-driven reveal engine (blur + fade).
   Exposes: Portfolio.initSplit(), Portfolio.initReveal()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* Stagger between siblings inside a [data-reveal-group] */
  var STAGGER = 90;

  /* ----------------------------------------------------------
     Split a heading into per-letter masked spans.
     Markup: <h1 class="split" data-split>Name</h1>
     ---------------------------------------------------------- */
  Portfolio.initSplit = function () {
    var targets = document.querySelectorAll('[data-split]');

    Array.prototype.forEach.call(targets, function (el) {
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;

      var frag = document.createDocumentFragment();

      try {
        for (var i = 0; i < text.length; i++) {
          var ch = text.charAt(i);

          var mask = document.createElement('span');
          mask.className = 'char-mask';

          var span = document.createElement('span');
          span.className = 'char';
          span.style.setProperty('--i', String(i));

          if (ch === ' ') {
            span.classList.add('char--space');
            span.innerHTML = '&nbsp;';
          } else {
            span.textContent = ch;
          }

          mask.appendChild(span);
          frag.appendChild(mask);
        }

        /* Swap in one go — the original text stands if anything above fails. */
        el.textContent = '';
        el.appendChild(frag);
      } catch (err) {
        el.textContent = text;
      }
    });
  };

  /* ----------------------------------------------------------
     Observe every [data-reveal] and add .reveal-in on entry.
     ---------------------------------------------------------- */
  Portfolio.initReveal = function () {
    var items = Array.prototype.slice.call(
      document.querySelectorAll('[data-reveal]')
    );
    if (!items.length) return;

    /* 1. Resolve delays. */
    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      var children = group.querySelectorAll(':scope > [data-reveal]');
      Array.prototype.forEach.call(children, function (child, index) {
        var extra = parseFloat(child.getAttribute('data-reveal-delay') || '0') || 0;
        child.style.setProperty('--reveal-d', index * STAGGER + extra + 'ms');
      });
    });

    items.forEach(function (el) {
      if (el.closest('[data-reveal-group]')) return; /* already handled */
      var extra = parseFloat(el.getAttribute('data-reveal-delay') || '0') || 0;
      if (extra) el.style.setProperty('--reveal-d', extra + 'ms');
    });

    /* 2. Reduced motion: reveal instantly, skip the observer. */
    if (prefersReducedMotion()) {
      items.forEach(function (el) { el.classList.add('reveal-in'); });
      return;
    }

    /* 3. Reveal on scroll, and re-arm on the way out so every scroll
          through replays the reveal. data-reveal-once="true" opts out. */
    var DURATION = 1000;
    var timers = new WeakMap();

    function delayOf(el) {
      return parseFloat(
        (el.style.getPropertyValue('--reveal-d') || '0').replace('ms', '')
      ) || 0;
    }

    function clearTimer(el) {
      var timer = timers.get(el);
      if (timer) {
        window.clearTimeout(timer);
        timers.delete(el);
      }
    }

    /* Drop the filter once the reveal has finished, so it never keeps a
       containing block (or a GPU layer) alive. */
    function settle(el) {
      clearTimer(el);
      timers.set(el, window.setTimeout(function () {
        el.classList.add('reveal-done');
        timers.delete(el);
      }, DURATION + delayOf(el) + 120));
    }

    function reset(el) {
      clearTimer(el);
      el.classList.remove('reveal-in', 'reveal-done');
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var el = entry.target;
          var once = el.getAttribute('data-reveal-once') === 'true';

          if (entry.isIntersecting) {
            if (!el.classList.contains('reveal-in')) {
              el.classList.add('reveal-in');
              settle(el);
            }
            if (once) observer.unobserve(el);
          } else if (!once) {
            reset(el);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );

    items.forEach(function (el) { observer.observe(el); });
  };
})();
