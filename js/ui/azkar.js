/* =========================================================================
   تبويب الأذكار: عرض كبير، تنقل يدوي وتلقائي، وضع العرض المركّز ووضع الطابور
   ========================================================================= */
(function (root) {
  'use strict';
  var S = root.FakiehStore, C = root.FakiehContent, T = root.FakiehTime, I = root.FakiehIcons;

  var CATS = [
    { id: 'morning',  label: 'أذكار الصباح', icon: 'sun' },
    { id: 'evening',  label: 'أذكار المساء', icon: 'moon' },
    { id: 'selected', label: 'أذكار مختارة', icon: 'star' }
  ];
  var st = { cat: 'morning', idx: 0, playing: true, list: [], focus: false, assembly: false };
  var el = {};
  var app, hideTimer;

  function d(s) { return T.digits(s, S.state.visual.digits); }

  function mount() {
    app = document.getElementById('app');
    var v = document.getElementById('view-azkar');
    v.innerHTML =
      '<div class="az-toolbar">' +
        '<div class="assembly-banner">' + I.flag + 'وضع الطابور الصباحي</div>' +
        '<div class="az-cats" role="tablist">' + CATS.map(function (c) {
          return '<button class="az-cat" role="tab" data-cat="' + c.id + '">' + I[c.icon] + c.label + ' <span class="n" data-count="' + c.id + '"></span></button>';
        }).join('') + '</div>' +
        '<div class="az-spacer"></div>' +
        '<div class="az-controls">' +
          '<label class="az-interval">مدة العرض <select id="azInterval">' +
            [10, 15, 20, 25, 30, 45, 60].map(function (s) { return '<option value="' + s + '">' + s + ' ثانية</option>'; }).join('') +
          '</select></label>' +
          '<button class="btn" id="azPlay"></button>' +
          '<button class="btn" id="azAssembly">' + I.flag + 'وضع الطابور</button>' +
          '<button class="btn" id="azFocus"></button>' +
        '</div>' +
      '</div>' +
      '<div class="az-stage">' +
        '<button class="az-nav" id="azPrev" aria-label="الذكر السابق">' + I.prev + '</button>' +
        '<article class="az-card" id="azCard">' +
          '<span class="az-corner tr">' + I.ornament + '</span><span class="az-corner tl">' + I.ornament + '</span>' +
          '<span class="az-corner br">' + I.ornament + '</span><span class="az-corner bl">' + I.ornament + '</span>' +
          '<div class="az-head"><span class="az-title" id="azTitle"></span><span class="az-count" id="azCount"></span></div>' +
          '<div class="az-body" id="azBody"><p class="az-text" id="azText"></p></div>' +
          '<p class="az-virtue" id="azVirtue"></p>' +
          '<div class="az-foot">' +
            '<div class="az-source" id="azSource"></div>' +
            '<div class="az-dots" id="azDots"></div>' +
            '<div class="az-index" id="azIndex"></div>' +
          '</div>' +
          '<div class="az-timer"><span id="azTimer"></span></div>' +
        '</article>' +
        '<button class="az-nav" id="azNext" aria-label="الذكر التالي">' + I.next + '</button>' +
      '</div>';

    ['azInterval', 'azPlay', 'azAssembly', 'azFocus', 'azPrev', 'azNext', 'azTitle', 'azCount', 'azBody', 'azText', 'azVirtue', 'azSource', 'azDots', 'azIndex', 'azTimer']
      .forEach(function (id) { el[id] = document.getElementById(id); });

    v.querySelectorAll('.az-cat').forEach(function (b) { b.addEventListener('click', function () { setCategory(b.dataset.cat); }); });
    el.azPrev.addEventListener('click', prev);
    el.azNext.addEventListener('click', next);
    el.azPlay.addEventListener('click', togglePlay);
    el.azFocus.addEventListener('click', function () { st.focus ? exitFocus() : enterFocus(false); });
    el.azAssembly.addEventListener('click', function () { st.assembly ? exitFocus() : enterFocus(true); });
    el.azInterval.addEventListener('change', function () { S.set('azkar.slideSeconds', +el.azInterval.value); restartTimer(); });
    el.azDots.addEventListener('click', function (e) { var i = e.target.dataset.i; if (i !== undefined) show(+i); });
    el.azTimer.addEventListener('animationend', function () { if (st.playing) next(); });
    v.addEventListener('mousemove', function () {
      if (!st.focus) return;
      app.classList.add('show-controls'); clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { app.classList.remove('show-controls'); }, 3000);
    });
    root.addEventListener('resize', function () { fit(); });

    st.playing = S.state.azkar.autoAdvance;
    st.cat = defaultCategory();
    refresh();
  }

  /** الصباح حتى منتصف اليوم، والمساء بعد العصر تقريبًا */
  function defaultCategory() {
    var h = T.zonedParts(root.FakiehApp ? root.FakiehApp.now() : Date.now(), S.state.timeZone).hour;
    return h >= 15 ? 'evening' : 'morning';
  }

  function refresh() {
    CATS.forEach(function (c) {
      var n = C.azkar(c.id).length, span = document.querySelector('[data-count="' + c.id + '"]');
      if (span) span.textContent = '(' + d(n) + ')';
    });
    el.azInterval.value = String(S.state.azkar.slideSeconds);
    if (!el.azInterval.value) el.azInterval.value = '20';
    setCategory(st.cat, true);
  }

  function setCategory(cat, keepIdx) {
    st.cat = cat;
    st.list = C.azkar(cat);
    if (!keepIdx || st.idx >= st.list.length) st.idx = 0;
    document.querySelectorAll('.az-cat').forEach(function (b) { b.classList.toggle('active', b.dataset.cat === cat); });
    el.azDots.innerHTML = st.list.map(function (_, i) { return '<button class="az-dot" data-i="' + i + '" aria-label="ذكر ' + (i + 1) + '"></button>'; }).join('');
    show(st.idx, true);
  }

  function show(i, instant) {
    var n = st.list.length;
    if (!n) {
      el.azTitle.textContent = ''; el.azCount.textContent = ''; el.azVirtue.textContent = ''; el.azSource.innerHTML = ''; el.azIndex.textContent = '';
      el.azText.innerHTML = '<span class="az-empty">لا توجد أذكار معتمدة في هذا القسم — يمكن تفعيلها من الإعدادات</span>';
      return;
    }
    st.idx = ((i % n) + n) % n;
    var z = st.list[st.idx];
    var apply = function () {
      el.azTitle.textContent = z.title || CATS.filter(function (c) { return c.id === st.cat; })[0].label;
      el.azCount.textContent = z.count || '';
      el.azText.textContent = z.text;
      el.azVirtue.textContent = z.virtue || '';
      el.azSource.innerHTML = C.esc(z.source) + (z.grade ? '<small>' + C.esc(z.grade) + '</small>' : '');
      el.azIndex.innerHTML = d(st.idx + 1) + ' <small>/ ' + d(n) + '</small>';
      el.azDots.querySelectorAll('.az-dot').forEach(function (b, k) { b.classList.toggle('active', k === st.idx); });
      fit();
      el.azText.classList.remove('out');
      restartTimer();
    };
    if (instant) apply();
    else { el.azText.classList.add('out'); setTimeout(apply, 380); }
  }

  /** تصغير الخط تلقائيًا للنصوص الطويلة حتى تبقى ضمن الإطار */
  function fit() {
    var t = el.azText, box = el.azBody;
    if (!t || !box.clientHeight) return;
    t.style.fontSize = '';
    var size = parseFloat(getComputedStyle(t).fontSize), min = size * 0.38;
    var guard = 0;
    while ((t.scrollHeight > box.clientHeight - 8 || t.scrollWidth > box.clientWidth) && size > min && guard++ < 40) {
      size *= 0.94; t.style.fontSize = size + 'px';
    }
  }

  function restartTimer() {
    var bar = el.azTimer;
    bar.style.animation = 'none';
    void bar.offsetWidth;   // إعادة تشغيل الحركة
    bar.style.animation = 'azTimer ' + S.state.azkar.slideSeconds + 's linear forwards';
    bar.style.animationPlayState = st.playing && st.list.length > 1 ? 'running' : 'paused';
    el.azPlay.innerHTML = st.playing ? I.pause + 'إيقاف التنقل' : I.play + 'تشغيل تلقائي';
    el.azPlay.classList.toggle('on', st.playing);
  }

  function next() { show(st.idx + 1); }
  function prev() { show(st.idx - 1); }
  function togglePlay() { st.playing = !st.playing; el.azTimer.style.animationPlayState = st.playing ? 'running' : 'paused'; restartTimer(); }

  function enterFocus(assembly) {
    st.focus = true; st.assembly = !!assembly;
    app.classList.add('azkar-focus'); app.classList.toggle('assembly-mode', st.assembly);
    if (st.assembly) { st.playing = true; setCategory('morning'); }
    root.FakiehApp.go('azkar');
    if (root.FakiehApp.requestFullscreen) root.FakiehApp.requestFullscreen();
    updateFocusButtons();
    setTimeout(fit, 400);
  }
  function exitFocus(goHome) {
    var wasAssembly = st.assembly;
    st.focus = false; st.assembly = false;
    app.classList.remove('azkar-focus', 'assembly-mode', 'show-controls');
    updateFocusButtons();
    if (goHome || wasAssembly) root.FakiehApp.go('home');
    setTimeout(fit, 400);
  }
  function updateFocusButtons() {
    el.azFocus.innerHTML = st.focus && !st.assembly ? I.shrink + 'إنهاء العرض' : I.expand + 'عرض كامل';
    el.azAssembly.innerHTML = I.flag + (st.assembly ? 'إنهاء وضع الطابور' : 'وضع الطابور');
    el.azAssembly.classList.toggle('on', st.assembly);
  }

  function onKey(e) {
    if (e.key === 'ArrowLeft') { next(); return true; }
    if (e.key === 'ArrowRight') { prev(); return true; }
    if (e.key === ' ') { togglePlay(); return true; }
    if (e.key === 'Escape' && st.focus) { exitFocus(); return true; }
    return false;
  }

  root.FakiehAzkar = {
    mount: mount, refresh: refresh, fit: fit, onKey: onKey,
    enterFocus: enterFocus, exitFocus: exitFocus,
    get isAssembly() { return st.assembly; }, get isFocus() { return st.focus; }
  };
})(window);
