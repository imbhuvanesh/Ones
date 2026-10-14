/* ============================================================
   preloader.js
   Full-screen greeting preloader.

   "Hello" opens the overlay, the word then scrambles through greetings in
   other languages, and — because the greeting list closes on "Hello" and
   the exit always resolves back onto it — the last word on screen is
   "Hello" again before the whole overlay fades away. No layout is
   measured, no network is used, and the whole thing runs on a fixed 3s
   timeline, so it never adds a real loading delay.

   Exposes: Portfolio.initPreloader()
   ============================================================ */
(function () {
  'use strict';

  var Portfolio = (window.Portfolio = window.Portfolio || {});

  /* The word the overlay opens and closes on. */
  var HELLO = 'Hello';

  /* ----------------------------------------------------------
     The greetings in between, in cycle order. "Hello" sits last so the
     rotation always resolves back onto it, and the exit does the same.
     ---------------------------------------------------------- */
  var GREETINGS = [
    'வணக்கம்',     /* Tamil      */
    'नमस्ते',       /* Hindi      */
    'नमस्कार',      /* Marathi    */
    'Bonjour',    /* French     */
    'Hola',       /* Spanish    */
    'Ciao',       /* Italian    */
    'Olá',        /* Portuguese */
    'Hallo',      /* German     */
    'Hej',        /* Swedish    */
    'Привет',     /* Russian    */
    'Γειά σου',   /* Greek      */
    'Merhaba',    /* Turkish    */
    'مرحبا',       /* Arabic     */
    'שלום',        /* Hebrew     */
    'こんにちは',    /* Japanese   */
    '안녕하세요',    /* Korean     */
    '你好',         /* Chinese    */
    'สวัสดี',       /* Thai       */
    'Xin chào',   /* Vietnamese */
    'Jambo',      /* Swahili    */
    'Selamat',    /* Indonesian */
    'Ahoj',       /* Czech      */
    'നമസ്കാരം',     /* Malayalam  */
    HELLO         /* English — closing greeting */
  ];

  /* ---------- timing (ms) ---------- */
  var DURATION      = 3000;  /* the whole preloader: opening word → gone    */
  var SCRAMBLE      = 560;   /* how long a greeting takes to resolve        */
  var EXIT_SCRAMBLE = 420;   /* the closing resolve back onto "Hello"       */
  var HOLD          = 320;   /* how long a resolved greeting rests          */
  var FIRST_HOLD    = 460;   /* the opening "Hello" lingers a touch longer  */
  var FADE          = 700;   /* must match the transition in preloader.css  */
  var POLL          = 40;

  /* The exit (closing resolve + fade) has to fit inside DURATION, so the
     greeting cycle stops this many ms before the overlay is gone. */
  var LEAVE_AT      = DURATION - EXIT_SCRAMBLE - FADE;   /* 1880 */

  /* A grapheme cluster that starts with a combining mark has no base
     letter, so showing it alone would draw a dotted placeholder circle.
     Used to keep such clusters out of the shuffle pool. */
  var COMBINING = null;
  try { COMBINING = new RegExp('^\\p{M}', 'u'); } catch (err) { COMBINING = null; }

  /* ----------------------------------------------------------
     Split a string into user-perceived characters. Intl.Segmenter keeps
     Indic-style clusters (base + vowel signs + marks) together, so the
     scramble never tears a letter in half. Falls back to code units.
     ---------------------------------------------------------- */
  function graphemes(text) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        var segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
          .segment(text);
        var out = [];
        var it = segments[Symbol.iterator]();
        var step = it.next();
        while (!step.done) {
          out.push(step.value.segment);
          step = it.next();
        }
        if (out.length) return out;
      } catch (err) { /* fall through to the naive split */ }
    }
    return text.split('');
  }

  /* The shuffle draws from the target word's own characters, so every frame
     is plausible for the language being resolved into. */
  function poolFor(target) {
    var usable = target.filter(function (grapheme) {
      return COMBINING ? !COMBINING.test(grapheme) : true;
    });
    return usable.length ? usable : target;
  }

  /* ----------------------------------------------------------
     init
     ---------------------------------------------------------- */
  Portfolio.initPreloader = function () {
    var root = document.documentElement;
    var el = document.getElementById('preloader');
    var wordEl = el ? el.querySelector('[data-preloader-word]') : null;

    /* No overlay in the markup: make sure the scroll lock is released. */
    if (!el || !wordEl) {
      root.classList.remove('is-loading');
      return;
    }

    /* The <head> script only adds this class when the overlay should run
       (JS on, reduced motion off). Respect that decision here. */
    if (!root.classList.contains('is-loading')) return;

    function now() {
      return window.performance && window.performance.now
        ? window.performance.now()
        : Date.now();
    }

    /* The <head> script stamps the moment the overlay became visible; time
       the 3s intro from there so it is exact however long the scripts take
       to arrive. */
    var started = typeof window.__preloaderT0 === 'number'
      ? window.__preloaderT0
      : now();

    var raf = 0;
    var wait = 0;
    var index = -1;                 /* -1 → the opening "Hello" is showing */
    var shown = graphemes(HELLO);   /* graphemes currently on screen       */
    var exiting = false;            /* resolving onto the closing word     */
    var finished = false;           /* overlay is on its way out           */

    /* Let the word ease in on the next frame so its transition runs. */
    window.requestAnimationFrame(function () {
      el.classList.add('preloader--in');
    });

    function clearTimers() {
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      if (wait) { window.clearTimeout(wait); wait = 0; }
    }

    /* ----------------------------------------------------------
       Scramble from whatever is on screen toward `target`, then hand
       control to `done`. Positions resolve roughly left to right with a
       random spread, so the word settles into place instead of popping.
       ---------------------------------------------------------- */
    function scramble(target, duration, done) {
      var from = shown;
      var length = Math.max(from.length, target.length);
      var pool = poolFor(target);
      var word = target.join('');
      var locks = [];

      for (var i = 0; i < length; i++) {
        locks.push(Math.min(1, Math.random() * 0.55 + (i / length) * 0.45));
      }

      var start = now();

      function frame() {
        if (finished) return;

        var p = Math.min(1, (now() - start) / duration);
        var out = '';

        for (var j = 0; j < length; j++) {
          if (p >= locks[j]) {
            /* Resolved: the real character, or nothing when the word is
               shorter than the incoming one (the extra slot drops away). */
            if (j < target.length) out += target[j];
          } else {
            out += pool[(Math.random() * pool.length) | 0];
          }
        }

        wordEl.textContent = out || word;

        if (p < 1) {
          raf = window.requestAnimationFrame(frame);
          return;
        }

        wordEl.textContent = word;
        shown = target;
        done();
      }

      frame();
    }

    /* ----------------------------------------------------------
       The greeting cycle.
       ---------------------------------------------------------- */
    function advance() {
      if (finished || exiting) return;

      index = (index + 1) % GREETINGS.length;
      scramble(graphemes(GREETINGS[index]), SCRAMBLE, function () {
        wait = window.setTimeout(advance, HOLD);
      });
    }

    /* ----------------------------------------------------------
       The exit: always land on "Hello", then fade the overlay away.
       ---------------------------------------------------------- */
    function leave() {
      if (finished || exiting) return;
      exiting = true;
      clearTimers();

      if (shown.join('') === HELLO) {
        fade();
        return;
      }

      scramble(graphemes(HELLO), EXIT_SCRAMBLE, fade);
    }

    function fade() {
      if (finished) return;
      finished = true;
      clearTimers();

      el.classList.add('preloader--out');
      window.setTimeout(function () {
        root.classList.remove('is-loading');
        if (el.parentNode) el.parentNode.removeChild(el);
      }, FADE);
    }

    /* Opening word: the markup already shows "Hello", so just hold it. */
    wordEl.textContent = HELLO;
    wait = window.setTimeout(advance, FIRST_HOLD);

    /* ----------------------------------------------------------
       The preloader runs a fixed DURATION timeline: the greeting cycle
       plays freely, then the exit resolve and the fade use up the last
       stretch so the overlay is gone at ~3s regardless of how fast the
       page loaded. (The <head> script keeps an 8s failsafe on top.)
       ---------------------------------------------------------- */
    var poll = window.setInterval(function () {
      if (finished) {
        window.clearInterval(poll);
        return;
      }
      if (exiting) return;

      if (now() - started >= LEAVE_AT) {
        window.clearInterval(poll);
        leave();
      }
    }, POLL);
  };
})();
