/* ============================================================
   mascot.js
   Vanilla port of the `page-mascot` React component.
   A cursor-aware character built from two 3x3 sprite sheets:
   nine head directions + nine expressions.

   Markup:
     <div data-mascot
          data-directions="mascots/bunny-directions.webp"
          data-reactions="mascots/bunny-reactions.webp"
          data-size="140"
          data-label="bunny"></div>

   Exposes: Portfolio.initMascots()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  /* Same order as the sheets are drawn (row-major, 3x3). */
  var DIRECTIONS = [
    'up-left', 'up', 'up-right',
    'left', 'center', 'right',
    'down-left', 'down', 'down-right'
  ];

  var REACTIONS = [
    'blink', 'heart', 'sparkle',
    'surprised', 'wink', 'bashful',
    'sleepy', 'dizzy', 'delighted'
  ];

  /* Clockwise from the right, matching atan2 with y pointing down. */
  var CLOCKWISE = [
    'right', 'down-right', 'down', 'down-left',
    'left', 'up-left', 'up', 'up-right'
  ];

  var SECTOR      = (Math.PI * 2) / CLOCKWISE.length;
  var HYSTERESIS  = 0.12;
  var DEAD_ZONE   = 70;

  var PAYOFFS     = ['heart', 'sparkle', 'delighted'];
  var BOOP_PAYOFF = 120;
  var BOOP_END    = 560;
  var SQUASH_MS   = 420;
  var DIZZY_AFTER = 4;
  var DIZZY_WINDOW = 1600;
  var DIZZY_END   = 1100;

  var SQUASH = [
    { transform: 'scale(1, 1)', easing: 'ease-in' },
    { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
    { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
    { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
    { transform: 'scale(1, 1)' }
  ];

  function cellPosition(index) {
    /* background-size: 300% -> each cell lands cleanly on 0 / 50 / 100% */
    return (index % 3) * 50 + '% ' + Math.floor(index / 3) * 50 + '%';
  }

  function wrapAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function build(slot) {
    var directions = slot.getAttribute('data-directions');
    var reactions = slot.getAttribute('data-reactions');
    if (!directions || !reactions) return;

    var size = parseInt(slot.getAttribute('data-size') || '140', 10);
    var label = slot.getAttribute('data-label') || 'mascot';

    /* ----- DOM ----- */
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'mascot';
    /* The click now navigates, so the accessible name states the action
       rather than the character. `data-label` stays part of the component's
       markup contract (see the header) but is no longer announced. */
    button.setAttribute('aria-label', 'Back to top');
    button.style.width = size + 'px';
    button.style.height = size + 'px';

    var squash = document.createElement('span');
    squash.className = 'mascot__squash';

    var directionLayer = document.createElement('span');
    directionLayer.className = 'mascot__layer';
    directionLayer.style.backgroundImage = 'url("' + directions + '")';

    var reactionLayer = document.createElement('span');
    reactionLayer.className = 'mascot__layer';
    reactionLayer.style.backgroundImage = 'url("' + reactions + '")';
    reactionLayer.style.opacity = '0';

    squash.appendChild(directionLayer);
    squash.appendChild(reactionLayer);
    button.appendChild(squash);

    var hint = document.createElement('span');
    hint.className = 'mascot__hint';
    hint.textContent = 'click me';
    hint.setAttribute('aria-hidden', 'true');

    slot.appendChild(button);
    slot.appendChild(hint);

    /* ----- state ----- */
    var direction = 'center';
    var reaction = null;
    var timers = [];
    var boops = { count: 0, at: 0 };

    function render() {
      directionLayer.style.backgroundPosition =
        cellPosition(DIRECTIONS.indexOf(direction));
      reactionLayer.style.backgroundPosition =
        cellPosition(REACTIONS.indexOf(reaction || 'blink'));
      directionLayer.style.opacity = reaction ? '0' : '1';
      reactionLayer.style.opacity = reaction ? '1' : '0';
    }

    /* ----- pointer tracking (fine pointers only) ----- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var sector = -1;
      var pointer = null;

      var aim = function () {
        if (!pointer) return;

        var box = button.getBoundingClientRect();
        var dx = pointer.x - (box.left + box.width / 2);
        var dy = pointer.y - (box.top + box.height / 2);

        if (Math.hypot(dx, dy) < DEAD_ZONE) {
          sector = -1;
          if (direction !== 'center') { direction = 'center'; render(); }
          return;
        }

        var angle = Math.atan2(dy, dx);

        /* hold the current sector until the pointer is well past its edge */
        if (sector !== -1 &&
            Math.abs(wrapAngle(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) {
          return;
        }

        sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
        var next = CLOCKWISE[sector];
        if (next !== direction) { direction = next; render(); }
      };

      var onMove = function (event) {
        pointer = { x: event.clientX, y: event.clientY };
        aim();
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', aim, { passive: true });
    }

    /* ----- boop ----- */
    function clearTimers() {
      timers.forEach(window.clearTimeout);
      timers = [];
    }

    function later(ms, next) {
      timers.push(window.setTimeout(function () {
        reaction = next;
        render();
      }, ms));
    }

    function boop() {
      clearTimers();

      var now = Date.now();
      if (now - boops.at < DIZZY_WINDOW) {
        boops.count += 1;
      } else {
        boops.count = 1;
      }
      boops.at = now;

      if (boops.count >= DIZZY_AFTER) {
        boops.count = 0;
        reaction = 'dizzy';
        render();
        later(DIZZY_END, null);
      } else {
        reaction = 'blink';
        render();
        /* the payoff reaction arrives a beat after the blink */
        later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
        later(BOOP_END, null);
      }

      if (reducedMotion() || typeof squash.animate !== 'function') return;
      squash.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' });
    }

    /* Clicking the mascot sends the visitor back to the top of the page.
       window.scrollTo() honours `scroll-behavior`, which base.css already
       flips to `auto` for prefers-reduced-motion — we mirror that check so
       those visitors get an instant jump instead of a long glide. */
    function toTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reducedMotion() ? 'auto' : 'smooth'
      });
    }

    /* One click: play the reaction, then ride back up to the top. */
    button.addEventListener('click', function () {
      boop();
      toTop();
    });

    render();
  }

  Portfolio.initMascots = function () {
    document.querySelectorAll('[data-mascot]').forEach(build);
  };
})();
