/* Speech-to-speech morph players. Each .sts-card plays its original recording
   and its STS character-voice render simultaneously through Web Audio (one
   clock, so they stay sample-locked), with the slider crossfading between them
   in real time (equal-power, so loudness holds steady). The TTS button is a
   plain one-shot player. One thing plays at a time across the whole page. */
(function () {
  'use strict';

  var ctx = null;
  var cache = {};      // url -> Promise<AudioBuffer>
  var current = null;  // { stop } whatever is playing right now
  var token = 0;       // cancels stale async plays

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function load(url) {
    if (!cache[url]) {
      cache[url] = fetch(url)
        .then(function (r) { if (!r.ok) throw new Error('fetch ' + url); return r.arrayBuffer(); })
        .then(function (ab) { return getCtx().decodeAudioData(ab); });
    }
    return cache[url];
  }
  function stopCurrent() {
    if (current) { var c = current; current = null; c.stop(); }
  }
  function fmt(s) {
    if (!isFinite(s)) return '–:––';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }
  // Compare-divider position 0..100. Like an image before/after slider: the
  // ORIGINAL is revealed from the left (0 = all character voice, 100 = all
  // original). Equal-power blend so loudness holds steady mid-drag.
  function mixGains(v) {
    var x = Math.max(0, Math.min(1, v / 100));
    return { orig: Math.sin(x * Math.PI / 2), sts: Math.cos(x * Math.PI / 2) };
  }

  document.querySelectorAll('.sts-card').forEach(function (card) {
    var play = card.querySelector('.sp-play');
    var stop = card.querySelector('.sp-stop');
    var mix = card.querySelector('.sp-mix');
    var time = card.querySelector('.sp-time');
    var tplay = card.querySelector('.tp-play');
    var tstop = card.querySelector('.tp-stop');
    var raf = 0;
    var m = null;   // morph playback state
    var t = null;   // tts playback state

    function setMorphBtns(playing) { play.disabled = playing; stop.disabled = !playing; }
    function setTtsBtns(playing) { tplay.disabled = playing; tstop.disabled = !playing; }

    // ---- morph player (original + character voice, synced) ----
    function morphStop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (m) {
        var was = m; m = null;
        try { was.srcO.stop(); } catch (e) { /* already stopped */ }
        try { was.srcS.stop(); } catch (e) { /* already stopped */ }
      }
      setMorphBtns(false);
      time.textContent = '–:––';
    }

    play.addEventListener('click', function () {
      stopCurrent();
      var my = ++token;
      play.disabled = true;
      Promise.all([load(card.dataset.orig), load(card.dataset.sts)]).then(function (bufs) {
        if (my !== token) { return; } // another play started while we loaded
        var c = getCtx();
        var srcO = c.createBufferSource(); srcO.buffer = bufs[0];
        var srcS = c.createBufferSource(); srcS.buffer = bufs[1];
        var gO = c.createGain(); var gS = c.createGain();
        var g = mixGains(Number(mix.value));
        gO.gain.value = g.orig; gS.gain.value = g.sts;
        srcO.connect(gO); gO.connect(c.destination);
        srcS.connect(gS); gS.connect(c.destination);
        var t0 = c.currentTime + 0.06; // tiny scheduling headroom = true sync
        srcO.start(t0); srcS.start(t0);
        var dur = Math.max(bufs[0].duration, bufs[1].duration);
        m = { srcO: srcO, srcS: srcS, gO: gO, gS: gS, t0: t0, dur: dur };
        current = { stop: morphStop };
        setMorphBtns(true);
        srcS.onended = function () {
          if (m && m.srcS === srcS) { current = null; morphStop(); }
        };
        (function tick() {
          if (!m) return;
          time.textContent = fmt(Math.max(0, c.currentTime - m.t0)) + ' / ' + fmt(m.dur);
          raf = requestAnimationFrame(tick);
        })();
      }).catch(function (e) {
        console.error('sts morph:', e);
        if (my === token) { setMorphBtns(false); time.textContent = 'audio unavailable'; }
      });
    });

    stop.addEventListener('click', function () { current = null; morphStop(); });

    var cmpr = card.querySelector('.cmpr');
    mix.addEventListener('input', function () {
      // the divider + revealed panes always track the drag, playing or not
      if (cmpr) cmpr.style.setProperty('--x', mix.value + '%');
      if (!m) return;
      var g = mixGains(Number(mix.value));
      var now = getCtx().currentTime;
      // short smoothing so dragging never clicks or zippers
      m.gO.gain.setTargetAtTime(g.orig, now, 0.03);
      m.gS.gain.setTargetAtTime(g.sts, now, 0.03);
    });

    // ---- flat TTS player ----
    var tfill = card.querySelector('.tp-fill');
    var ttime = card.querySelector('.tp-time');
    var traf = 0;
    function ttsStop() {
      if (traf) { cancelAnimationFrame(traf); traf = 0; }
      if (t) {
        var was = t; t = null;
        try { was.src.stop(); } catch (e) { /* already stopped */ }
      }
      setTtsBtns(false);
      if (tfill) tfill.style.width = '0%';
      if (ttime) ttime.textContent = '–:––';
    }

    tplay.addEventListener('click', function () {
      stopCurrent();
      var my = ++token;
      tplay.disabled = true;
      load(card.dataset.tts).then(function (buf) {
        if (my !== token) { return; }
        var c = getCtx();
        var src = c.createBufferSource(); src.buffer = buf;
        src.connect(c.destination);
        var t0 = c.currentTime + 0.03;
        src.start(t0);
        t = { src: src, t0: t0, dur: buf.duration };
        current = { stop: ttsStop };
        setTtsBtns(true);
        src.onended = function () {
          if (t && t.src === src) { current = null; ttsStop(); }
        };
        (function tick() {
          if (!t) return;
          var el = Math.max(0, c.currentTime - t.t0);
          if (tfill) tfill.style.width = Math.min(100, el / t.dur * 100) + '%';
          if (ttime) ttime.textContent = fmt(el) + ' / ' + fmt(t.dur);
          traf = requestAnimationFrame(tick);
        })();
      }).catch(function (e) {
        console.error('sts tts:', e);
        if (my === token) setTtsBtns(false);
      });
    });

    tstop.addEventListener('click', function () { current = null; ttsStop(); });
  });
})();
