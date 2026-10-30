/* =========================================================================
   الشاشة الرئيسية: الساعة، العداد التنازلي، الجدول، التقويم، الإعلانات
   ========================================================================= */
(function (root) {
  'use strict';
  var T = root.FakiehTime, S = root.FakiehStore, C = root.FakiehContent;
  var $ = function (id) { return document.getElementById(id); };

  var KIND_LABEL = { lesson: 'الحصة الحالية', break: 'الاستراحة', prayer: 'وقت الصلاة', assembly: 'الطابور الصباحي' };
  var last = { countdown: null, scheduleKey: null, dateKey: null, announceIdx: -1, announceAt: 0, miniIdx: -1, miniAt: 0 };

  function d(str) { return T.digits(str, S.state.visual.digits); }
  function hm(sec) { return d(T.formatHM(sec, S.state.visual.use12h)); }

  /** يكتب العداد بخانات ثابتة العرض حتى لا يهتز النص */
  function setCountdown(el, text) {
    if (last.countdown === text) return;
    last.countdown = text;
    el.innerHTML = d(text).split('').map(function (c) {
      return c === ':' ? '<span class="colon">:</span>' : '<span>' + c + '</span>';
    }).join('');
    el.classList.toggle('long', text.length > 5);
  }

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [201, 174, 99];
  }
  /** لون تدريجي من الأبيض إلى الذهبي خلال آخر خمس دقائق */
  function warnColor(remaining) {
    var ws = S.state.visual.warnSeconds;
    if (remaining > ws) return '';
    var t = Math.min(1, Math.max(0, (ws - remaining) / ws)), g = hexToRgb(S.state.theme.gold);
    var c = [255, 255, 255].map(function (w, i) { return Math.round(w + (g[i] - w) * (0.35 + 0.65 * t)); });
    return 'rgb(' + c.join(',') + ')';
  }

  /** حساب ما يُعرض في القلب (مشترك مع شريط التوقيت المصغّر) */
  function describe(ctx) {
    var st = ctx.state, out = { kindLabel: '', title: '', countdown: null, label: '', progress: 0, start: '', end: '', next: '', message: '', idle: false, remaining: Infinity, warnable: false };
    if (!ctx.schoolDay) {
      var hol = T.holidayFor(ctx.schedule, ctx.parts.dateKey);
      var nsd = T.nextSchoolDay(ctx.schedule, ctx.parts.dateKey, ctx.parts.weekday);
      out.idle = true; out.kindLabel = hol ? 'إجازة' : 'لا يوجد دوام';
      out.title = hol ? (hol.name || 'إجازة رسمية') : 'لا يوجد دوام اليوم';
      if (nsd) out.next = 'أقرب يوم دراسي: <b>' + T.WEEKDAY_NAMES[nsd.weekday] + ' ' + C.gregorian(nsd.dateKey, { year: undefined }) + '</b>';
      return out;
    }
    if (st.kind === 'empty') { out.idle = true; out.title = 'لا يوجد جدول مفعّل'; return out; }
    if (st.kind === 'ended') {
      var n2 = T.nextSchoolDay(ctx.schedule, ctx.parts.dateKey, ctx.parts.weekday);
      out.idle = true; out.kindLabel = 'نهاية الدوام'; out.title = 'انتهى اليوم الدراسي بحمد الله';
      if (n2) out.next = 'اليوم الدراسي التالي: <b>' + T.WEEKDAY_NAMES[n2.weekday] + '</b>';
      return out;
    }
    if (st.kind === 'before') {
      out.kindLabel = 'قبل بداية اليوم الدراسي'; out.title = 'يبدأ اليوم الدراسي بـ ' + st.next.name;
      out.start = hm(st.next.start); out.end = hm(st.next.end);
      if (st.remaining > 3 * 3600) { out.idle = true; out.next = 'يبدأ الدوام الساعة <b>' + hm(st.next.start) + '</b>'; return out; }
      out.countdown = T.formatCountdown(st.remaining); out.label = 'يبدأ بعد'; out.remaining = st.remaining;
      return out;
    }
    if (st.kind === 'gap') {
      out.kindLabel = 'الفاصل بين الحصص'; out.title = 'الفاصل بين الحصص';
      out.countdown = T.formatCountdown(st.remaining); out.label = 'تبدأ «' + st.next.name + '» بعد';
      out.progress = st.progress; out.start = hm(st.startsAt); out.end = hm(st.endsAt); out.remaining = st.remaining;
      out.next = 'التالية: <b>' + C.esc(st.next.name) + '</b> — ' + hm(st.next.start);
      return out;
    }
    var p = st.period;
    out.kindLabel = KIND_LABEL[p.type] || 'الفترة الحالية'; out.title = p.name;
    out.countdown = T.formatCountdown(st.remaining); out.label = 'الوقت المتبقي';
    out.progress = st.progress; out.start = hm(p.start); out.end = hm(p.end);
    out.remaining = st.remaining; out.warnable = true;
    out.next = st.next ? 'الحصة التالية: <b>' + C.esc(st.next.name) + '</b> — ' + hm(st.next.start) : 'آخر فترة في اليوم الدراسي';
    return out;
  }

  function renderHero(ctx, info) {
    var hero = $('hero');
    var clock = T.formatClock(ctx.parts.secOfDay, S.state.visual.use12h, true);
    $('clock').textContent = d(clock.time);
    $('clockSuffix').textContent = clock.suffix;
    $('stateKind').textContent = info.kindLabel || '—';
    $('stateTitle').textContent = info.title;
    hero.classList.toggle('idle', info.idle);
    $('heroMessage').textContent = '';
    if (!info.idle && info.countdown) {
      setCountdown($('countdown'), info.countdown);
      $('countdownLabel').textContent = info.label;
      $('progressBar').style.width = (info.progress * 100).toFixed(2) + '%';
      $('startTime').textContent = info.start; $('endTime').textContent = info.end;
    } else { last.countdown = null; }
    $('heroNext').innerHTML = info.next;

    var warn = info.warnable && info.remaining <= S.state.visual.warnSeconds;
    var fin = info.warnable && info.remaining <= S.state.visual.finalSeconds;
    hero.classList.toggle('warn', warn);
    hero.classList.toggle('final', fin);
    $('countdown').style.color = warn ? warnColor(info.remaining) : '';
  }

  /* ---------------------------- الجدول ---------------------------- */
  function renderSchedule(ctx) {
    var st = ctx.state, periods = ctx.periods;
    var curId = st.kind === 'period' ? st.period.id : null;
    var nextId = st.kind === 'gap' || st.kind === 'before' ? st.next.id : (st.next ? st.next.id : null);
    var key = [ctx.periodsKey, curId, nextId, st.kind, ctx.schoolDay, ctx.parts.dateKey].join('|');
    if (key === last.scheduleKey) return;
    last.scheduleKey = key;
    var sec = ctx.parts.secOfDay, html = '';
    periods.forEach(function (p, i) {
      if (i > 0 && periods[i - 1].end < p.start) {
        var gapCur = st.kind === 'gap' && st.next.id === p.id;
        html += '<li class="sched-gap' + (gapCur ? ' current' : '') + '" aria-hidden="true"></li>';
      }
      var cls = ['sched-row', 'type-' + p.type];
      if (ctx.schoolDay) {
        if (p.id === curId) cls.push('current');
        else if (p.end <= sec) cls.push('done');
        else if (p.id === nextId) cls.push('next');
      }
      html += '<li class="' + cls.join(' ') + '"><span class="sched-name">' + C.esc(p.name.replace(' (الدولي)', '')) +
        (p.international ? ' <span class="badge-intl">دولي</span>' : '') + '</span>' +
        '<span class="sched-time">' + d(T.formatHM(p.start, false)) + ' – ' + d(T.formatHM(p.end, false)) + '</span></li>';
    });
    $('scheduleList').innerHTML = html;
    var prof = S.state.schedule.profiles[S.state.schedule.activeProfile];
    $('profileChip').textContent = prof ? prof.name : '';
  }

  /* ---------------------------- التاريخ والمناسبات ---------------------------- */
  function renderDates(ctx, force) {
    if (!force && last.dateKey === ctx.parts.dateKey) return;
    last.dateKey = ctx.parts.dateKey;
    var now = new Date(ctx.ms);
    var h = C.hijri(now), g = C.gregorian(now) + ' م';   // التقويم الهجري يضيف «هـ» تلقائيًا
    $('dateHijri').textContent = h; $('dateGreg').textContent = T.WEEKDAY_NAMES[ctx.parts.weekday] + ' — ' + g;
    $('dayName').textContent = T.WEEKDAY_NAMES[ctx.parts.weekday];
    $('bigHijri').textContent = h; $('bigGreg').textContent = g;

    var cats = root.FAKIEH_OCCASION_CATEGORIES, maxRemind = Math.max.apply(null, S.state.occasions.remindDays.concat([7]));
    var list = C.upcomingOccasions(ctx.parts.dateKey, 5);
    $('occasionsList').innerHTML = list.length ? list.map(function (o) {
      var cat = cats[o.category] || cats.school;
      var dd = o.dateKey.split('-');
      return '<li class="occ' + (o.inDays <= maxRemind ? ' soon' : '') + '" style="--occ:' + cat.color + '">' +
        '<div class="occ-date"><b>' + d(+dd[2]) + '</b><small>' + C.gregorian(o.dateKey, { day: undefined, year: undefined }) + '</small></div>' +
        '<div><div class="occ-name">' + C.esc(o.name) + '</div><div class="occ-cat">' + cat.label + ' · ' + C.hijri(o.dateKey, { year: undefined }) + '</div></div>' +
        '<span class="occ-days">' + d(C.daysLabel(o.inDays)) + '</span></li>';
    }).join('') : '<li class="occ-empty">لا توجد مناسبات مسجلة</li>';
  }

  /* ---------------------------- الإعلانات ---------------------------- */
  function renderAnnouncements(ctx) {
    var items = (S.state.announcements || []).filter(function (a) { return a.active && a.text; });
    var el = $('announceText');
    if (!items.length) { el.textContent = 'لا توجد إعلانات حاليًا'; return; }
    if (ctx.ms - last.announceAt < 12000 && last.announceIdx >= 0) return;
    last.announceAt = ctx.ms;
    last.announceIdx = (last.announceIdx + 1) % items.length;
    var text = items[last.announceIdx].text;
    if (el.textContent === text) return;
    el.classList.add('fade');
    setTimeout(function () { el.textContent = text; el.classList.remove('fade'); }, 450);
  }

  /* ---------------------------- أذكار الطابور على الرئيسية ---------------------------- */
  function renderAzkarMini(ctx) {
    var on = S.state.azkar.enabled && S.state.azkar.showOnHomeDuringAssembly && ctx.schoolDay &&
      ctx.state.kind === 'period' && ctx.state.period.type === 'assembly';
    document.getElementById('app').classList.toggle('assembly-time', on);
    $('azkarMini').hidden = !on;
    if (!on) return;
    var list = C.azkar('morning');
    if (!list.length) return;
    if (ctx.ms - last.miniAt < S.state.azkar.homeSlideSeconds * 1000 && last.miniIdx >= 0) return;
    last.miniAt = ctx.ms;
    last.miniIdx = (last.miniIdx + 1) % list.length;
    var z = list[last.miniIdx], el = $('azkarMiniText');
    el.classList.add('fade');
    setTimeout(function () {
      el.textContent = z.text.replace(/\n/g, ' ');
      el.style.fontSize = z.text.length > 260 ? '1.05rem' : z.text.length > 160 ? '1.2rem' : '';
      $('azkarMiniCount').textContent = z.count || '';
      $('azkarMiniSource').textContent = z.source;
      el.classList.remove('fade');
    }, 500);
  }

  /* ---------------------------- مواقيت الصلاة ---------------------------- */
  var P = root.FakiehPrayer, prayerBound = false;
  function renderPrayer(ctx) {
    var el = $('prayerPanel'), cfg = S.state.prayer;
    el.hidden = !cfg.enabled || !cfg.showCard || !ctx.prayer;
    if (el.hidden) return;
    if (!prayerBound) {
      prayerBound = true;
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pr]'); if (!b) return;
        if (b.dataset.pr === 'pre') S.set('prayer.preAlertEnabled', !S.state.prayer.preAlertEnabled);
        if (b.dataset.pr === 'adhan') { S.set('prayer.adhanEnabled', !S.state.prayer.adhanEnabled); if (!S.state.prayer.adhanEnabled) root.FakiehApp.hideAdhan(); }
        last.prayerKey = null;
      });
    }
    var t = ctx.prayer.times, nx = ctx.prayer.next;
    var key = [ctx.parts.dateKey, nx && nx.key, cfg.preAlertEnabled, cfg.adhanEnabled, S.state.visual.digits, S.state.visual.use12h].join('|');
    if (key !== last.prayerKey) {
      last.prayerKey = key;
      el.innerHTML = '<div class="panel-head"><h2>مواقيت الصلاة</h2><span class="chip">' + C.esc(cfg.city) + ' · أم القرى</span></div>' +
        '<div class="pr-list">' + ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(function (k) {
          return '<div class="pr-item' + (nx && nx.key === k ? ' next' : '') + (cfg.alertPrayers[k] ? ' alerted' : '') + '"><span>' + P.NAMES[k] + '</span><b>' + d(T.formatHM(t[k], false)) + '</b></div>';
        }).join('') + '</div>' +
        '<div class="pr-foot"><span class="pr-next" id="prNext"></span>' +
        '<button class="pr-tg' + (cfg.preAlertEnabled ? ' on' : '') + '" data-pr="pre" title="تشغيل/إغلاق التنبيه قبل الصلاة">' + (cfg.preAlertEnabled ? '🔔' : '🔕') + ' التنبيه</button>' +
        '<button class="pr-tg' + (cfg.adhanEnabled ? ' on' : '') + '" data-pr="adhan" title="تشغيل/إغلاق صوت الأذان">' + (cfg.adhanEnabled ? '🔊' : '🔇') + ' الأذان</button></div>';
    }
    var n = $('prNext');
    if (n) n.textContent = nx ? d(nx.name + ' بعد ' + T.formatCountdown(nx.remaining)) : d('الفجر غدًا');
  }

  function render(ctx) {
    var info = describe(ctx);
    renderHero(ctx, info);
    renderSchedule(ctx);
    renderDates(ctx);
    renderPrayer(ctx);
    renderAnnouncements(ctx);
    renderAzkarMini(ctx);
    return info;
  }

  root.FakiehHome = {
    render: render, describe: describe, warnColor: warnColor,
    invalidate: function () { last.prayerKey = null; last.scheduleKey = null; last.dateKey = null; last.countdown = null; last.announceIdx = -1; last.miniIdx = -1; }
  };
})(window);
