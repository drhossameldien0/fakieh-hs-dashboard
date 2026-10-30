/* =========================================================================
   عرض الشرائح بملء منطقة المحتوى — مشترك بين المناسبات والسلامة والسلوك.
   يبقى شريط التوقيت وتذييل الحقوق ظاهرين دائمًا.
   ========================================================================= */
(function (root) {
  'use strict';
  var I = root.FakiehIcons, T = root.FakiehTime, S = root.FakiehStore;
  var el = null, st = { slides: [], idx: 0, playing: true, seconds: 15, open: false, owner: null };
  var app;

  function ensure() {
    if (el) return;
    app = document.getElementById('app');
    el = document.createElement('section');
    el.className = 'slideshow';
    el.id = 'slideshow';
    el.innerHTML =
      '<div class="ss-stage" id="ssStage"></div>' +
      '<div class="ss-bar">' +
        '<button class="ss-btn" data-ss="prev" aria-label="السابق">' + I.prev + '</button>' +
        '<button class="ss-btn" data-ss="play" aria-label="إيقاف/تشغيل"></button>' +
        '<button class="ss-btn" data-ss="next" aria-label="التالي">' + I.next + '</button>' +
        '<span class="ss-index" id="ssIndex"></span>' +
        '<button class="ss-btn" data-ss="close" aria-label="إغلاق العرض">' + I.close + '</button>' +
      '</div>' +
      '<div class="ss-timer"><span id="ssTimer"></span></div>';
    document.getElementById('views').appendChild(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ss]'); if (!b) return;
      ({ prev: prev, next: next, play: toggle, close: close })[b.dataset.ss]();
    });
    document.getElementById('ssTimer').addEventListener('animationend', function () { if (st.playing) next(); });
  }

  /** slides: مصفوفة HTML ، opts: { seconds, owner, start } */
  function open(slides, opts) {
    ensure();
    opts = opts || {};
    st.slides = slides; st.idx = opts.start || 0; st.seconds = opts.seconds || 15; st.owner = opts.owner || null;
    st.playing = opts.autoplay !== false; st.open = true;
    el.classList.add('open'); app.classList.add('page-focus');
    show(st.idx);
  }
  function close() {
    if (!st.open) return;
    st.open = false;
    el.classList.remove('open'); app.classList.remove('page-focus');
  }
  function show(i) {
    var n = st.slides.length; if (!n) return;
    st.idx = ((i % n) + n) % n;
    var stage = document.getElementById('ssStage');
    stage.classList.add('out');
    setTimeout(function () {
      stage.innerHTML = st.slides[st.idx];
      stage.classList.remove('out');
    }, 250);
    document.getElementById('ssIndex').innerHTML = T.digits(st.idx + 1, S.state.visual.digits) + ' <small>/ ' + T.digits(n, S.state.visual.digits) + '</small>';
    restart();
  }
  function restart() {
    var bar = document.getElementById('ssTimer');
    bar.style.animation = 'none'; void bar.offsetWidth;
    bar.style.animation = 'azTimer ' + st.seconds + 's linear forwards';
    bar.style.animationPlayState = st.playing && st.slides.length > 1 ? 'running' : 'paused';
    el.querySelector('[data-ss="play"]').innerHTML = st.playing ? I.pause : I.play;
  }
  function next() { show(st.idx + 1); }
  function prev() { show(st.idx - 1); }
  function toggle() { st.playing = !st.playing; restart(); }

  function onKey(e) {
    if (!st.open) return false;
    if (e.key === 'ArrowLeft') { next(); return true; }
    if (e.key === 'ArrowRight') { prev(); return true; }
    if (e.key === ' ') { toggle(); return true; }
    if (e.key === 'Escape') { close(); return true; }
    return false;
  }

  root.FakiehSlides = {
    open: open, close: close, onKey: onKey,
    get isOpen() { return st.open; }, get owner() { return st.open ? st.owner : null; }
  };
})(window);
