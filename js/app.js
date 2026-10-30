/* =========================================================================
   التطبيق الرئيسي: حلقة التحديث، التبويبات، التنبيهات، الشريط المتحرك، الصوت
   ========================================================================= */
(function (root) {
  'use strict';
  var T = root.FakiehTime, A = root.FakiehAlerts, S = root.FakiehStore, AU = root.FakiehAudio;
  var C = root.FakiehContent, I = root.FakiehIcons, Home = root.FakiehHome, Az = root.FakiehAzkar;
  var $ = function (id) { return document.getElementById(id); };
  var app = $('app');

  var TABS = [
    { id: 'home',      label: 'الرئيسية',         icon: 'clock',     title: 'الرئيسية — الساعة والتوقيت المدرسي' },
    { id: 'azkar',     label: 'الأذكار',          icon: 'azkar',     title: 'أذكار الصباح والمساء' },
    { id: 'occasions', label: 'المناسبات',        icon: 'occasions', title: 'الأيام العالمية والمناسبات التعليمية' },
    { id: 'academic',  label: 'التقويم الدراسي',  icon: 'calendar',  title: 'التقويم الدراسي والإجازات الرسمية' },
    { id: 'safety',    label: 'الأمن والسلامة',   icon: 'shield',    title: 'الأمن والسلامة المدرسية' },
    { id: 'conduct',   label: 'السلوك والمواظبة', icon: 'conduct',   title: 'قواعد السلوك والمواظبة' },
    { id: 'settings',  label: 'الإعدادات',        icon: 'settings',  title: 'الإعدادات — خاصة بإدارة النظام' }
  ];

  /* ---------------------------- الوقت (مع وضع محاكاة للاختبار) ----------------------------
     مثال: index.html?now=2026-11-01T09:41:50  أو مع تسريع: &speed=20  (توقيت الرياض) */
  var sim = (function () {
    var q = new URLSearchParams(location.search), m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d))?$/.exec(q.get('now') || '');
    if (!m) return null;
    return { base: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 3, +m[5], +(m[6] || 0)), real: Date.now(), speed: Math.max(1, +(q.get('speed') || 1)) };
  })();
  function now() { return sim ? sim.base + (Date.now() - sim.real) * sim.speed : Date.now(); }

  /* ---------------------------- الحالة المشتقة ---------------------------- */
  var periods = [], periodsKey = '', alertEvents = [];
  var tracker = new A.AlertTracker();
  var lastKind = null, lastInfo = null;

  function rebuild() {
    periods = T.buildPeriods(S.state.schedule);
    periodsKey = JSON.stringify(periods.map(function (p) { return [p.id, p.start, p.end]; }));
    var a = S.state.alerts;
    alertEvents = A.buildAlertEvents(periods, a);
  }

  /** الجدول الفعلي: إجازات الإعدادات + إجازات التقويم الدراسي (بعد اعتماده فقط) */
  function effectiveSchedule() {
    var extra = root.FakiehAcademic ? root.FakiehAcademic.scheduleHolidays() : [];
    if (!extra.length) return S.state.schedule;
    return Object.assign({}, S.state.schedule, { holidays: (S.state.schedule.holidays || []).concat(extra) });
  }

  function context(ms) {
    var parts = T.zonedParts(ms, S.state.timeZone), schedule = effectiveSchedule();
    var schoolDay = T.isSchoolDay(schedule, parts);
    return { ms: ms, parts: parts, schedule: schedule, schoolDay: schoolDay, periods: periods, periodsKey: periodsKey, state: T.resolveState(periods, parts.secOfDay) };
  }

  /* ---------------------------- حلقة التحديث ----------------------------
     تُحسب كل القيم من الساعة الفعلية في كل مرة، فلا ينحرف العداد مع الوقت */
  function tick() {
    var ms = now(), ctx = context(ms);
    handlePrayer(ctx);
    lastInfo = Home.render(ctx);
    renderStrip(ctx, lastInfo);
    handleAlerts(ctx);
    handleAssembly(ctx);
    root.FakiehPresentation.step(ctx);
    onNewDay(ctx);
    var delay = sim && sim.speed > 1 ? 100 : 1000 - (Date.now() % 1000) + 15;
    setTimeout(tick, delay);
  }

  function renderStrip(ctx, info) {
    var clock = T.formatClock(ctx.parts.secOfDay, S.state.visual.use12h, true);
    $('tsClock').textContent = T.digits(clock.time, S.state.visual.digits);
    $('tsSuffix').textContent = clock.suffix;
    $('tsPeriod').textContent = info.title;
    $('tsCount').textContent = info.countdown && !info.idle ? T.digits(info.countdown, S.state.visual.digits) : '';
    $('tsCount').style.color = info.warnable && info.remaining <= S.state.visual.warnSeconds ? Home.warnColor(info.remaining) : '';
    $('tsBar').style.width = (info.idle ? 0 : info.progress * 100).toFixed(2) + '%';
    $('tsNext').innerHTML = info.next || '';
    $('timeStrip').classList.toggle('final', info.warnable && info.remaining <= S.state.visual.finalSeconds);
  }

  /* ---------------------------- التنبيهات ---------------------------- */
  var KIND_TEXT = {
    warn1: function (e) { return 'باقي ' + S.state.alerts.warn1Minutes + ' دقائق على نهاية ' + e.period.name; },
    warn2: function (e) { return 'باقي ' + (S.state.alerts.warn2Minutes === 1 ? 'دقيقة واحدة' : S.state.alerts.warn2Minutes + ' دقائق') + ' على نهاية ' + e.period.name; },
    end:   function (e) { return 'انتهت ' + e.period.name; }
  };
  function handleAlerts(ctx) {
    // لا تنبيهات في الإجازات أو خارج أيام الدراسة
    if (!ctx.schoolDay) { tracker.step(ctx.parts.dateKey, ctx.parts.secOfDay, [], 0); return; }
    var due = tracker.step(ctx.parts.dateKey, ctx.parts.secOfDay, alertEvents, S.state.alerts.graceSeconds);
    if (!due.length) return;
    var e = A.mostImportant(due);
    toast(T.digits(KIND_TEXT[e.kind](e), S.state.visual.digits));
    if (S.state.alerts.enabled) AU.play(S.state.alerts.sounds[e.kind], e.kind);
  }

  var toastTimer;
  function toast(text, ms) {
    var t = $('toast'); t.textContent = text; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 7000);
  }

  /* ---------------------------- مواقيت الصلاة والأذان ---------------------------- */
  var PR = root.FakiehPrayer, prayerTracker = new A.AlertTracker(), prayerCache = { key: null, times: null };
  function prayerTimes(dateKey) {
    var cfgKey = dateKey + JSON.stringify(S.state.prayer);
    if (prayerCache.key !== cfgKey) prayerCache = { key: cfgKey, times: PR.timesFor(dateKey, S.state.prayer) };
    return prayerCache.times;
  }
  function handlePrayer(ctx) {
    var cfg = S.state.prayer;
    if (!cfg.enabled) { ctx.prayer = null; return; }
    var times = prayerTimes(ctx.parts.dateKey);
    ctx.prayer = { times: times, next: PR.nextPrayer(times, ctx.parts.secOfDay) };
    var events = cfg.schoolDaysOnly && !ctx.schoolDay ? [] : PR.prayerEvents(times, cfg);
    var due = prayerTracker.step(ctx.parts.dateKey, ctx.parts.secOfDay, events, S.state.alerts.graceSeconds);
    if (!due.length) return;
    var e = due.filter(function (x) { return x.kind === 'adhan'; })[0] || due[0];
    if (e.kind === 'prayerPre') {
      toast(T.digits('بعد ' + cfg.preAlertMinutes + ' دقائق يحين أذان ' + e.name, S.state.visual.digits));
      AU.play(cfg.preAlertSound, 'prayerPre');
    } else {
      showAdhan(e);
    }
  }
  var adhanTimer;
  function showAdhan(e) {
    var cfg = S.state.prayer, bar = $('adhanBar'), hasFile = AU.hasCustom('adhan');
    $('adhanText').textContent = 'حان الآن موعد أذان ' + e.name + ' — ' + cfg.city;
    var playing = false;
    if (cfg.adhanEnabled) {
      playing = AU.play(hasFile ? 'custom' : 'soft', 'adhan', { volume: cfg.adhanVolume, onEnd: hideAdhan });
    }
    $('adhanNote').textContent = !cfg.adhanEnabled ? 'صوت الأذان مغلق' : !hasFile ? 'لم يُرفع ملف الأذان بعد — شُغّلت نغمة تنبيه بدلًا منه' : !playing ? 'الصوت غير مفعّل في المتصفح' : '';
    $('adhanStop').hidden = !(playing && hasFile);
    bar.hidden = false;
    clearTimeout(adhanTimer);
    adhanTimer = setTimeout(hideAdhan, hasFile && playing ? 6 * 60000 : 90000);
  }
  function hideAdhan() { clearTimeout(adhanTimer); AU.stop('adhan'); $('adhanBar').hidden = true; }

  /* ---------------------------- وضع الطابور التلقائي ---------------------------- */
  function handleAssembly(ctx) {
    var inAssembly = ctx.schoolDay && ctx.state.kind === 'period' && ctx.state.period.type === 'assembly';
    var kind = inAssembly ? 'assembly' : 'other';
    if (kind === lastKind) return;
    var first = lastKind === null;
    lastKind = kind;
    if (first && !inAssembly) return;
    if (S.state.presentation.enabled) return;   // العرض التلقائي يتولى ذلك
    if (inAssembly && S.state.azkar.enabled && S.state.azkar.autoAssemblyMode && !Az.isAssembly) Az.enterFocus(true);
    if (!inAssembly && Az.isAssembly) Az.exitFocus(true);
  }

  /* ---------------------------- التبويبات ---------------------------- */
  function buildTabs() {
    $('tabs').innerHTML = TABS.map(function (t) {
      return '<button class="tab" data-tab="' + t.id + '" title="' + t.title + '">' + I[t.icon] + '<span>' + t.label + '</span></button>';
    }).join('');
    $('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.tab'); if (b) go(b.dataset.tab);
    });
  }
  /** opts.auto = انتقال من العرض التلقائي (وليس من المستخدم) */
  function go(view, opts) {
    if (!TABS.some(function (t) { return t.id === view; })) view = 'home';
    if (!(opts && opts.auto)) root.FakiehPresentation.userAction();
    if (root.FakiehSlides.owner && root.FakiehSlides.owner !== view) root.FakiehSlides.close();
    if (view !== 'azkar' && Az.isFocus) Az.exitFocus();
    app.dataset.view = view;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.dataset.view === view); });
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === view); });
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    if (pagesDirty && view !== 'settings') { pagesDirty = false; renderPages(); }
    if (view === 'azkar') setTimeout(Az.fit, 60);
    if (view === 'settings' && root.FakiehSettings) root.FakiehSettings.onShow();
  }

  /* ---------------------------- الشريط المتحرك ---------------------------- */
  var tickerDate = null, pagesDirty = false;
  function tickerItems(todayKey) {
    var src = S.state.ticker.sources, lists = [];
    if (src.hadith) lists.push(C.hadith().map(function (h) { return { text: '«' + h.text + '»', sub: h.source, tag: h.topic }; }));
    if (src.announcements) lists.push((S.state.announcements || []).filter(function (a) { return a.active && a.text; }).map(function (a) { return { text: a.text, tag: 'إعلان' }; }));
    if (src.occasions) {
      var maxD = Math.max.apply(null, S.state.occasions.remindDays);
      lists.push(C.upcomingOccasions(todayKey).filter(function (o) { return o.inDays <= maxD; }).map(function (o) {
        return { text: C.daysLabel(o.inDays) + ': ' + o.name, tag: 'مناسبة' };
      }));
    }
    if (src.tips) lists.push((root.FAKIEH_TIPS || []).map(function (t) { return { text: t }; }));
    if (src.motivation) lists.push((root.FAKIEH_MOTIVATION || []).map(function (t) { return { text: t }; }));
    // دمج بالتناوب بين المصادر
    var out = [], max = Math.max.apply(null, lists.map(function (l) { return l.length; }).concat([0]));
    for (var i = 0; i < max; i++) lists.forEach(function (l) { if (l[i]) out.push(l[i]); });
    return out;
  }
  function buildTicker(todayKey) {
    var cfg = S.state.ticker, bar = $('ticker'), track = $('tickerTrack');
    bar.hidden = !cfg.enabled;
    if (!cfg.enabled) return;
    var items = tickerItems(todayKey);
    var html = items.map(function (it) {
      return '<span class="ticker-item">' + (it.tag ? '<span class="tag">' + C.esc(it.tag) + '</span>' : '') +
        C.esc(T.digits(it.text, S.state.visual.digits)) + (it.sub ? ' <small>' + C.esc(it.sub) + '</small>' : '') + '</span>';
    }).join('');
    bar.classList.toggle('ticker-static', !cfg.animate);
    track.style.animation = 'none';
    if (!cfg.animate) { track.innerHTML = items.length ? html.split('</span>').slice(0, 3).join('</span>') : ''; return; }
    track.innerHTML = html;
    var vp = track.parentElement.clientWidth, copies = 1;
    while (track.scrollWidth < vp && copies < 8 && items.length) { track.innerHTML += html; copies++; }
    var single = track.innerHTML;
    track.innerHTML = single + single;   // نسختان لحلقة متصلة
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    var dur = (track.scrollWidth / 2) / (Math.max(1, cfg.speed) * rem);
    void track.offsetWidth;
    track.style.animation = 'tickerMove ' + dur.toFixed(1) + 's linear infinite';
  }
  /** عند بداية يوم جديد (أو أول تشغيل): الشريط، تنبيهات المناسبات، الصفحات المرتبطة بالتاريخ */
  function onNewDay(ctx) {
    if (tickerDate === ctx.parts.dateKey) return;
    var first = tickerDate === null;
    tickerDate = ctx.parts.dateKey; buildTicker(tickerDate);
    root.FakiehOccasions.checkReminders(tickerDate);
    if (!first) renderPages();
  }
  function renderPages() {
    root.FakiehOccasions.refresh(); root.FakiehAcademic.render(); root.FakiehSafety.refresh(); root.FakiehConduct.render();
  }

  /* ---------------------------- الصوت ---------------------------- */
  function updateSoundStatus() {
    var b = $('soundStatus'), unlocked = AU.isUnlocked(), on = S.state.alerts.enabled;
    b.classList.toggle('ok', unlocked && on);
    b.querySelector('.status-label').textContent = !unlocked ? 'الصوت غير مفعّل' : on ? 'الصوت مفعّل' : 'التنبيهات مكتومة';
    b.title = !unlocked ? 'اضغط لتفعيل الصوت' : 'اضغط لكتم/تشغيل التنبيهات الصوتية';
    if (unlocked) $('soundGate').hidden = true;
  }
  function unlockAudio() {
    return AU.unlock().then(function (ok) { updateSoundStatus(); requestWakeLock(); return ok; });
  }
  function loadCustomSounds() {
    ['warn1', 'warn2', 'end', 'adhan'].forEach(function (k) {
      if (k === 'adhan' ? !S.state.prayer.hasAdhanFile : S.state.alerts.sounds[k] !== 'custom') return;
      S.files.get('sound:' + k).then(function (blob) { if (blob) AU.loadCustom(k, blob); }).catch(function () {});
    });
  }

  /* ---------------------------- إبقاء الشاشة نشطة ---------------------------- */
  var wakeLock = null;
  function requestWakeLock() {
    if (!navigator.wakeLock || wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l; l.addEventListener('release', function () { wakeLock = null; });
    }).catch(function () {});
  }

  /* ---------------------------- ملء الشاشة ---------------------------- */
  function isFull() { return !!document.fullscreenElement; }
  function requestFullscreen() { if (!isFull() && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); }
  function toggleFullscreen() { isFull() ? document.exitFullscreen() : requestFullscreen(); }
  function updateFsBtn() { $('fullscreenBtn').innerHTML = isFull() ? I.shrink : I.expand; }

  /* ---------------------------- المظهر ---------------------------- */
  function applyTheme() {
    var th = S.state.theme, r = document.documentElement.style;
    r.setProperty('--bg', th.bg); r.setProperty('--primary', th.primary); r.setProperty('--gold', th.gold);
    document.querySelectorAll('[data-bind="schoolName"]').forEach(function (e) { e.textContent = S.state.school.name; });
    document.querySelectorAll('[data-bind="schoolSubtitle"]').forEach(function (e) { e.textContent = S.state.school.subtitle; });
  }

  function updateNet() {
    var on = navigator.onLine, n = $('netStatus');
    n.classList.toggle('ok', on);
    n.title = on ? 'متصل بالإنترنت (التطبيق يعمل محليًا أيضًا)' : 'غير متصل — التطبيق يعمل محليًا';
  }

  /* ---------------------------- التشغيل ---------------------------- */
  function init() {
    rebuild(); applyTheme(); buildTabs();
    Az.mount();
    root.FakiehOccasions.mount(); root.FakiehAcademic.mount(); root.FakiehSafety.mount(); root.FakiehConduct.mount();
    root.FakiehSettings.mount();
    go((location.hash || '#home').slice(1), { auto: true });

    AU.setVolume(S.state.alerts.volume);
    AU.onStateChange(updateSoundStatus);
    loadCustomSounds();
    updateSoundStatus();
    $('soundGateBtn').addEventListener('click', unlockAudio);
    $('soundGateLater').addEventListener('click', function () { $('soundGate').hidden = true; });
    $('soundStatus').addEventListener('click', function () {
      if (!AU.isUnlocked()) unlockAudio();
      else { S.set('alerts.enabled', !S.state.alerts.enabled); }
    });
    // أي تفاعل أول مع الصفحة يفعّل الصوت أيضًا
    document.addEventListener('pointerdown', function first() {
      document.removeEventListener('pointerdown', first, true);
      if (!AU.isUnlocked()) unlockAudio();
    }, true);

    $('fullscreenBtn').addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', function () { updateFsBtn(); setTimeout(function () { Az.fit(); buildTicker(tickerDate); }, 300); });
    updateFsBtn();
    $('tsHome').addEventListener('click', function () { go('home'); });
    root.addEventListener('hashchange', function () { go(location.hash.slice(1)); });

    document.addEventListener('keydown', function (e) {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (root.FakiehSlides.onKey(e)) { e.preventDefault(); return; }
      if (app.dataset.view === 'azkar' && Az.onKey(e)) { e.preventDefault(); return; }
      if (e.key === 'f' || e.key === 'F' || e.key === 'ب') toggleFullscreen();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) requestWakeLock(); });
    root.addEventListener('online', updateNet); root.addEventListener('offline', updateNet); updateNet();
    var rt; root.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { buildTicker(tickerDate); }, 300); });

    $('adhanStop').addEventListener('click', hideAdhan);
    $('adhanClose').addEventListener('click', hideAdhan);
    $('presentBtn').innerHTML = I.present;
    $('presentBtn').addEventListener('click', function () { root.FakiehPresentation.toggle(); });

    S.onChange(function () {
      rebuild(); applyTheme(); AU.setVolume(S.state.alerts.volume);
      Home.invalidate(); Az.refresh(); buildTicker(tickerDate); updateSoundStatus();
      if (app.dataset.view !== 'settings') renderPages(); else pagesDirty = true;
    });

    if (sim) { var b = $('simBadge'); b.hidden = false; b.textContent = 'وضع المحاكاة' + (sim.speed > 1 ? ' ×' + sim.speed : '') + ' — احذف ?now من الرابط للعودة للوقت الحقيقي'; }
    tick();
  }

  root.FakiehApp = {
    now: now, go: go, toast: toast, requestFullscreen: requestFullscreen, showAdhan: showAdhan, hideAdhan: hideAdhan,
    reloadSounds: loadCustomSounds, rebuildTicker: function () { buildTicker(tickerDate); },
    unlockAudio: unlockAudio
  };
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})(window);
