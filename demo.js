/* Drives the workflow page's mini-app demos. Each .demo-window[data-demo] has a
   timeline: a list of [delayMs, ops] steps, where each op is [selector, class]
   to add or [selector, class, 'rm'] to remove. The demo plays when scrolled
   into view, holds the finished state, resets, and loops. */
(function () {
  'use strict';

  var TIMELINES = {
    import: [
      [500,  [['.dw-file', 'in']]],
      [800,  [['.dw-file', 'drop']]],
      [800,  [['.dw-file', 'away'], ['.dw-skel', 'in'], ['.dw-drop', 'filled']]],
      [1400, [['.b-build', 'press']]],
      [600,  [['.dw-drop', 'gone'], ['.dw-rows', 'rows-in']]],
      [3200, []]
    ],
    characters: [
      [500,  [['.ch-1', 'pop']]],
      [380,  [['.ch-2', 'pop']]],
      [380,  [['.ch-3', 'pop']]],
      [800,  [['.r1', 'assigned']]],
      [450,  [['.r2', 'assigned']]],
      [450,  [['.r3', 'assigned']]],
      [450,  [['.r4', 'assigned']]],
      [3200, []]
    ],
    record: [
      [600,  [['.r1', 'ready']]],
      [1000, [['.r1', 'ready', 'rm'], ['.r1', 'recording'], ['.dock-rec', 'active']]],
      [1900, [['.r1', 'recording', 'rm'], ['.r1', 'done'], ['.dock-rec', 'active', 'rm']]],
      [500,  [['.r2', 'ready']]],
      [1000, [['.r2', 'ready', 'rm'], ['.r2', 'recording'], ['.dock-rec', 'active']]],
      [1900, [['.r2', 'recording', 'rm'], ['.r2', 'done'], ['.dock-rec', 'active', 'rm']]],
      [500,  [['.r3', 'ready']]],
      [1000, [['.r3', 'ready', 'rm'], ['.r3', 'recording'], ['.dock-rec', 'active']]],
      [1900, [['.r3', 'recording', 'rm'], ['.r3', 'done'], ['.dock-rec', 'active', 'rm']]],
      [2400, []]
    ],
    separate: [
      [600,  [['.b-ds', 'active']]],
      [1000, [['.b-sep', 'press']]],
      [500,  [['.old2', 'out'], ['.n2a', 'in'], ['.n2b', 'in']]],
      [650,  [['.old3', 'out'], ['.n3a', 'in'], ['.n3b', 'in']]],
      [3400, []]
    ],
    dialogue: [
      [600,  [['.b-ds', 'active']]],
      [900,  [['.r2', 'fx-in']]],
      [550,  [['.r4', 'fx-in']]],
      [1100, [['.b-gen', 'press']]],
      [350,  [['.r2', 'shimmer'], ['.r4', 'shimmer']]],
      [1100, [['.r2', 'done'], ['.r4', 'done']]],
      [3000, []]
    ],
    levels: [
      [500,  [['.b-acx', 'active']]],
      [600,  [['.t1', 'draw'], ['.t2', 'draw'], ['.t3', 'draw']]],
      [1300, [['.v1', 'show']]],
      [550,  [['.v2', 'show'], ['.t2', 'flag']]],
      [550,  [['.v3', 'show'], ['.t3', 'flag']]],
      [1300, [['.b-fix', 'press']]],
      [500,  [['.t2', 'fixed']]],
      [1100, [['.b-rerec', 'press']]],
      [400,  [['.t3', 'draw', 'rm'], ['.t3', 'flag', 'rm']]],
      [1200, [['.t3', 'retake'], ['.t3', 'fixed'], ['.t3', 'draw']]],
      [3400, []]
    ],
    roundtrip: [
      [500,  [['.rt-take', 'draw']]],
      [1200, [['.rt-v', 'show'], ['.rt-take', 'flag']]],
      [1200, [['.b-ext', 'press']]],
      [500,  [['.rt-watch', 'show']]],
      [700,  [['.dw-ext', 'open']]],
      [500,  [['.dw-ext', 'wavein']]],
      [1500, [['.dw-ext-selbox', 'in']]],
      [900,  [['.b-zap', 'press']]],
      [420,  [['.dw-ext', 'trim'], ['.dw-ext-selbox', 'in', 'rm']]],
      [1000, [['.b-save', 'press']]],
      [420,  [['.dw-ext-saved', 'show']]],
      [1000, [['.dw-ext', 'away']]],
      [500,  [['.rt-take', 'fixed'], ['.rt-take', 'flag', 'rm'], ['.rt-watch', 'sync']]],
      [3600, []]
    ],
    compile: [
      [400,  [['.k1', 'in']]],
      [220,  [['.k2', 'in']]],
      [220,  [['.k3', 'in']]],
      [220,  [['.k4', 'in']]],
      [220,  [['.k5', 'in']]],
      [700,  [['.dw-playhead', 'sweep']]],
      [2600, [['.dw-acx', 'pass'], ['.b-acx', 'pulse']]],
      [2600, []]
    ]
  };

  function applyOps(demo, ops, applied) {
    ops.forEach(function (op) {
      var els = demo.querySelectorAll(op[0]);
      els.forEach(function (el) {
        if (op[2] === 'rm') el.classList.remove(op[1]);
        else { el.classList.add(op[1]); if (applied) applied.push([el, op[1]]); }
      });
    });
  }

  function resetDemo(demo) {
    demo.classList.add('dw-reset');
    (demo._applied || []).forEach(function (p) { p[0].classList.remove(p[1]); });
    demo._applied = [];
    // force reflow so the class removals land without transitions
    void demo.offsetWidth;
    demo.classList.remove('dw-reset');
  }

  function play(demo, steps, idx) {
    if (!demo._playing) return;
    if (idx >= steps.length) {
      resetDemo(demo);
      demo._timer = setTimeout(function () { play(demo, steps, 0); }, 650);
      return;
    }
    demo._timer = setTimeout(function () {
      applyOps(demo, steps[idx][1], demo._applied);
      play(demo, steps, idx + 1);
    }, steps[idx][0]);
  }

  var demos = document.querySelectorAll('.demo-window[data-demo]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    // No animation: jump every demo straight to its finished state.
    demos.forEach(function (demo) {
      var steps = TIMELINES[demo.dataset.demo] || [];
      demo.classList.add('dw-reset');
      steps.forEach(function (s) { applyOps(demo, s[1], null); });
    });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var demo = e.target;
      if (e.isIntersecting && !demo._playing) {
        demo._playing = true;
        demo._applied = demo._applied || [];
        play(demo, TIMELINES[demo.dataset.demo] || [], 0);
      } else if (!e.isIntersecting && demo._playing) {
        demo._playing = false;
        clearTimeout(demo._timer);
        resetDemo(demo);
      }
    });
  }, { threshold: 0.35 });

  demos.forEach(function (d) { io.observe(d); });
})();
