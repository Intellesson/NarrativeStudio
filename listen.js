/* Mini audio players for the "Hear it. Then verify it." comparison section.
   Each .lp[data-src] gets play/pause, a seekable progress bar and a time
   readout. Only one sample plays at a time. A missing file (the recordings
   are dropped into assets/audio/ separately) marks the card "coming soon"
   instead of breaking. */
(function () {
  'use strict';

  var players = [];

  function fmt(s) {
    if (!isFinite(s)) return '–:––';
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  document.querySelectorAll('.lp[data-src]').forEach(function (lp) {
    var audio = new Audio();
    audio.preload = 'metadata';
    audio.src = lp.dataset.src;

    var btn = lp.querySelector('.lp-play');
    var track = lp.querySelector('.lp-track');
    var fill = lp.querySelector('.lp-fill');
    var time = lp.querySelector('.lp-time');
    var card = lp.closest('.listen-card');

    players.push(audio);

    audio.addEventListener('loadedmetadata', function () {
      time.textContent = '0:00 / ' + fmt(audio.duration);
    });
    audio.addEventListener('error', function () {
      if (card) card.classList.add('lp-missing');
      time.textContent = 'coming soon';
      btn.disabled = true;
    });
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    });
    audio.addEventListener('ended', function () {
      btn.textContent = '▶';
      fill.style.width = '0%';
      audio.currentTime = 0;
    });
    audio.addEventListener('pause', function () { btn.textContent = '▶'; });
    audio.addEventListener('play', function () {
      btn.textContent = '❚❚';
      // one at a time: pause the others
      players.forEach(function (a) { if (a !== audio) a.pause(); });
    });

    btn.addEventListener('click', function () {
      if (audio.paused) audio.play(); else audio.pause();
    });
    track.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var r = track.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  });
})();
