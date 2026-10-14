/* ============================================================
   glass.js
   Liquid-glass card: drag to move + zoom in / out.
   Adapted from the reference component. Exposes: Portfolio.initGlass()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  Portfolio.initGlass = function () {
    var card = document.getElementById('glass-card');
    if (!card) return;

    /* ---------------- zoom ---------------- */
    var zoomIn = document.getElementById('zoom-in');
    var zoomOut = document.getElementById('zoom-out');

    var scale = 1;
    var STEP = 0.1;
    var MIN = 0.6;
    var MAX = 1.8;

    function applyScale() {
      card.style.setProperty('--scale-factor', scale.toFixed(2));
    }

    if (zoomIn) {
      zoomIn.addEventListener('click', function () {
        scale = Math.min(MAX, scale + STEP);
        applyScale();
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener('click', function () {
        scale = Math.max(MIN, scale - STEP);
        applyScale();
      });
    }

    /* ---------------- drag ---------------- */
    var dragging = false;
    var startX = 0;
    var startY = 0;
    var originLeft = 0;
    var originTop = 0;

    function pointOf(event) {
      var t = event.touches ? event.touches[0] : event;
      return { x: t.clientX, y: t.clientY };
    }

    function isInteractive(target) {
      return !!(target.closest('button') || target.closest('a'));
    }

    function dragStart(event) {
      if (isInteractive(event.target)) return;

      dragging = true;
      card.classList.add('dragging');

      var p = pointOf(event);
      startX = p.x;
      startY = p.y;

      var rect = card.getBoundingClientRect();

      /* Detach from the layout once, then move with fixed coordinates so
         dragging stays correct regardless of page scroll. */
      if (window.getComputedStyle(card).position !== 'fixed') {
        card.style.position = 'fixed';
        card.style.margin = '0';
        card.style.width = rect.width + 'px';
        card.style.left = rect.left + 'px';
        card.style.top = rect.top + 'px';
      }

      originLeft = parseFloat(card.style.left) || rect.left;
      originTop = parseFloat(card.style.top) || rect.top;
    }

    function dragMove(event) {
      if (!dragging) return;
      if (event.cancelable) event.preventDefault();

      var p = pointOf(event);
      var rect = card.getBoundingClientRect();

      var maxLeft = Math.max(0, window.innerWidth - rect.width);
      var maxTop = Math.max(0, window.innerHeight - rect.height);

      var left = originLeft + (p.x - startX);
      var top = originTop + (p.y - startY);

      card.style.left = Math.max(0, Math.min(maxLeft, left)) + 'px';
      card.style.top = Math.max(0, Math.min(maxTop, top)) + 'px';
    }

    function dragEnd() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('dragging');
    }

    /* double-click / double-tap the card to send it home */
    function reset() {
      card.style.position = '';
      card.style.margin = '';
      card.style.width = '';
      card.style.left = '';
      card.style.top = '';
      scale = 1;
      applyScale();
    }
    card.addEventListener('dblclick', reset);

    card.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);

    card.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('touchcancel', dragEnd);

    window.addEventListener('resize', function () {
      if (window.getComputedStyle(card).position !== 'fixed') return;
      var rect = card.getBoundingClientRect();
      card.style.left = Math.max(0, Math.min(window.innerWidth - rect.width,
        parseFloat(card.style.left) || 0)) + 'px';
      card.style.top = Math.max(0, Math.min(window.innerHeight - rect.height,
        parseFloat(card.style.top) || 0)) + 'px';
    });
  };
})();
