/* =========================================================================
   تبويب التقويم الدراسي والإجازات الرسمية
   ========================================================================= */
(function (root) {
  'use strict';
  var T = root.FakiehTime, S = root.FakiehStore, C = root.FakiehContent, I = root.FakiehIcons, Cal = root.FakiehCalendar;
  var TYPES = root.FAKIEH_ACADEMIC_TYPES;
  var st = { view: 'timeline', y: 0, m: 0 };
  var v;

  function d(s) { return T.digits(s, S.state.visual.digits); }
  function today() { return T.zonedParts(root.FakiehApp.now(), S.state.timeZone).dateKey; }

  /* ---------------------------- البيانات ---------------------------- */
  function data() { return S.state.academic.data || root.FAKIEH_ACADEMIC; }
  function approved() { return !!S.state.academic.approved; }
  function events() {
    return data().events.concat(S.state.academic.extraEvents || [])
      .slice().sort(function (a, b) { return a.from < b.from ? -1 : a.from > b.from ? 1 : 0; });
  }
  function holidays() { return events().filter(function (e) { return e.type === 'holiday' && e.from; }); }
  function eventsOn(k) { return events().filter(function (e) { return k >= e.from && k <= (e.to || e.from); }); }
  function holidayOn(k) { return holidays().filter(function (h) { return k >= h.from && k <= (h.to || h.from); })[0] || null; }

  /** الإجازات بصيغة جدول الحصص (لإيقاف التنبيهات) — فقط بعد الاعتماد */
  function scheduleHolidays() {
    if (!approved() || !S.state.academic.applyToSchedule) return [];
    return holidays().map(function (h) { return { from: h.from, to: h.to || h.from, name: h.name }; });
  }

  function weekdayOf(k) { var a = k.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])).getUTCDay(); }
  function isStudyDay(k) {
    var dt = data();
    return k >= dt.yearStart && k <= dt.yearEnd && S.state.schedule.schoolDays.indexOf(weekdayOf(k)) > -1 && !holidayOn(k);
  }
  function returnDate(h) {
    var k = h.to || h.from;
    for (var i = 1; i < 40; i++) { var n = T.addDays(k, i); if (isStudyDay(n)) return n; }
    return null;
  }
  /** الإجازة الحالية أو القادمة */
  function nextHoliday(k) {
    var list = holidays();
    for (var i = 0; i < list.length; i++) if ((list[i].to || list[i].from) >= k) return list[i];
    return null;
  }

  /* ---------------------------- العرض ---------------------------- */
  function mount() {
    v = document.getElementById('view-academic');
    var t = today().split('-'); st.y = +t[0]; st.m = +t[1];
    v.addEventListener('click', onClick);
    render();
  }

  function banner() {
    var dt = data();
    if (approved()) {
      return '<div class="ac-banner ok">' + I.check + '<div><b>تقويم معتمد</b> — ' + C.esc(dt.sourceName) + ' · آخر تحديث: ' + d(dt.lastUpdated || '—') +
        (dt.sourceUrl ? ' · <a href="' + C.esc(dt.sourceUrl) + '" target="_blank" rel="noopener">المصدر الرسمي</a>' : '') + '</div></div>';
    }
    return '<div class="ac-banner pending">' + I.alert + '<div><b>بانتظار اعتماد التقويم الرسمي</b>' +
      '<span>' + C.esc(dt.draftNote || 'التواريخ المعروضة مسودة غير مؤكدة') + '. يُعتمد من الإعدادات بعد المطابقة مع موقع وزارة التعليم.</span>' +
      '<span>آخر تحديث للبيانات: ' + d(dt.lastUpdated || '—') + (dt.sourceUrl ? ' · <a href="' + C.esc(dt.sourceUrl) + '" target="_blank" rel="noopener">صفحة التقويم في موقع الوزارة</a>' : '') + '</span></div></div>';
  }

  function sideHTML(k) {
    var dt = data(), total = T.daysBetween(dt.yearStart, dt.yearEnd), done = Math.min(total, Math.max(0, T.daysBetween(dt.yearStart, k)));
    var pct = total > 0 ? Math.round(done / total * 100) : 0;
    var h = nextHoliday(k), inH = h && k >= h.from;
    var hol = '';
    if (h) {
      var ret = returnDate(h), n = T.daysBetween(k, h.from);
      hol = '<div class="panel ac-next' + (inH ? ' now' : '') + '">' +
        '<div class="ac-next-label">' + (inH ? 'نحن الآن في' : 'الإجازة القادمة') + '</div>' +
        '<h2>' + C.esc(h.name) + '</h2>' +
        (inH ? '<div class="ac-next-count"><b>' + I.calendar + '</b><span>العودة للدراسة</span></div>'
             : '<div class="ac-next-count"><b>' + d(n) + '</b><span>' + (n === 1 ? 'يوم' : n === 2 ? 'يومان' : n <= 10 ? 'أيام' : 'يومًا') + '</span></div>') +
        '<dl><dt>من</dt><dd>' + C.gregorian(h.from) + ' م<small>' + C.hijri(h.from) + '</small></dd>' +
        '<dt>إلى</dt><dd>' + C.gregorian(h.to || h.from) + ' م<small>' + C.hijri(h.to || h.from) + '</small></dd>' +
        (ret ? '<dt>العودة</dt><dd>' + T.WEEKDAY_NAMES[weekdayOf(ret)] + ' ' + C.gregorian(ret) + ' م<small>' + C.hijri(ret) + '</small></dd>' : '') + '</dl>' +
        (h.note ? '<p class="muted">' + C.esc(h.note) + '</p>' : '') + (!approved() ? '<span class="oc-ver v-needs-review">موعد غير معتمد بعد</span>' : '') + '</div>';
    }
    return '<aside class="ac-side">' +
      '<div class="panel ac-year"><div class="ac-year-label">العام الدراسي</div><h2>' + C.esc(dt.year) + '</h2>' +
      '<p class="muted">' + C.esc(dt.region) + '</p>' +
      '<div class="ac-range"><span>البداية<b>' + C.gregorian(dt.yearStart) + '</b><small>' + C.hijri(dt.yearStart) + '</small></span>' +
      '<span>النهاية<b>' + C.gregorian(dt.yearEnd) + '</b><small>' + C.hijri(dt.yearEnd) + '</small></span></div>' +
      '<div class="ac-prog"><span style="width:' + pct + '%"></span></div><div class="ac-prog-label">مضى ' + d(pct) + '% من العام الدراسي</div></div>' +
      hol + '</aside>';
  }

  function toolbar() {
    var views = [['timeline', 'الخط الزمني'], ['month', 'شهري'], ['list', 'القائمة']];
    return '<div class="pg-toolbar"><div class="seg">' + views.map(function (x) {
      return '<button data-ac-view="' + x[0] + '" class="' + (st.view === x[0] ? 'active' : '') + '">' + x[1] + '</button>';
    }).join('') + '</div><span class="az-spacer"></span>' +
      (st.view === 'month' ? '<div class="oc-nav"><button class="btn btn-sm" data-ac-nav="-1">' + I.prev + '</button><button class="btn btn-sm" data-ac-nav="0">الشهر الحالي</button><button class="btn btn-sm" data-ac-nav="1">' + I.next + '</button></div>' : '') +
      '<div class="ac-legend"><span class="lg study">يوم دراسي</span><span class="lg hol">إجازة</span><span class="lg off">نهاية الأسبوع</span><span class="lg exam">اختبارات</span><span class="lg act">نشاط</span></div></div>';
  }

  function timelineHTML(k) {
    var dt = data(), start = dt.yearStart, end = dt.yearEnd, total = T.daysBetween(start, end) || 1;
    function pos(key) { return Math.max(0, Math.min(100, T.daysBetween(start, key) / total * 100)); }
    var html = '<div class="tl"><div class="tl-track">';
    // الشهور
    var a = start.split('-'), y = +a[0], m = +a[1];
    for (var i = 0; i < 12; i++) {
      var mk = Cal.key(y, m, 1);
      if (mk > end) break;
      if (mk >= start) html += '<span class="tl-month" style="right:' + pos(mk) + '%">' + Cal.MONTHS[m - 1] + '</span>';
      m++; if (m > 12) { m = 1; y++; }
    }
    events().forEach(function (e) {
      if (!e.from || e.from > end || (e.to || e.from) < start) return;
      var r = pos(e.from), w = Math.max(0.5, pos(e.to || e.from) - r + 100 / total);
      var c = (TYPES[e.type] || TYPES.activity).color;
      if (e.type === 'term') html += '<span class="tl-mark" style="right:' + r + '%;--c:' + c + '" title="' + C.esc(e.name) + '"></span>';
      else html += '<span class="tl-seg t-' + e.type + '" style="right:' + r + '%;width:' + w + '%;--c:' + c + '" title="' + C.esc(e.name) + '"></span>';
    });
    if (k >= start && k <= end) html += '<span class="tl-today" style="right:' + pos(k) + '%"><i>اليوم</i></span>';
    html += '</div></div><div class="tl-list">';
    events().forEach(function (e) {
      var c = (TYPES[e.type] || TYPES.activity).color, past = (e.to || e.from) < k, now = k >= e.from && k <= (e.to || e.from);
      var len = e.to ? T.daysBetween(e.from, e.to) + 1 : 0;
      html += '<div class="tl-item' + (past ? ' past' : '') + (now ? ' now' : '') + '" style="--c:' + c + '">' +
        '<span class="tl-dot"></span><div><b>' + C.esc(e.name) + '</b>' +
        '<span>' + C.gregorian(e.from, { year: undefined }) + (e.to && e.to !== e.from ? ' – ' + C.gregorian(e.to, { year: undefined }) : '') + ' م' +
        ' · ' + C.hijri(e.from, { year: undefined }) + (e.to && e.to !== e.from ? ' – ' + C.hijri(e.to, { year: undefined }) : '') + '</span></div>' +
        (len > 1 ? '<em>' + d(len) + ' أيام</em>' : '') + '</div>';
    });
    return html + '</div>';
  }

  function monthHTML(k) {
    return '<h3 class="cal-title">' + Cal.monthTitle(st.y, st.m) + '</h3>' + Cal.month(st.y, st.m, k, function (key) {
      var evs = eventsOn(key), cls = [];
      if (holidayOn(key)) cls.push('hol');
      else if (isStudyDay(key)) cls.push('study');
      else cls.push('off');
      evs.forEach(function (e) { if (e.type === 'exam') cls.push('exam'); if (e.type === 'activity') cls.push('act'); });
      var labels = evs.filter(function (e) { return e.from === key || e.type !== 'holiday'; }).map(function (e) {
        return '<span class="cal-ev" style="--c:' + (TYPES[e.type] || TYPES.activity).color + '">' + C.esc(e.name) + '</span>';
      }).join('');
      return { cls: cls.join(' '), html: labels, title: evs.map(function (e) { return e.name; }).join('، ') };
    });
  }

  function listHTML(k) {
    return '<div class="t-wrap"><table class="s-table ac-table"><thead><tr><th>الحدث</th><th>النوع</th><th>من</th><th>إلى</th><th>المدة</th></tr></thead><tbody>' +
      events().map(function (e) {
        var t = TYPES[e.type] || TYPES.activity, len = e.to ? T.daysBetween(e.from, e.to) + 1 : 1;
        return '<tr class="' + ((e.to || e.from) < k ? 'past' : '') + '"><td>' + C.esc(e.name) + (e.note ? '<small class="muted"> — ' + C.esc(e.note) + '</small>' : '') + '</td>' +
          '<td class="c"><span class="oc-cat" style="--c:' + t.color + '">' + t.label + '</span></td>' +
          '<td class="c">' + C.gregorian(e.from) + '<br><small class="muted">' + C.hijri(e.from) + '</small></td>' +
          '<td class="c">' + (e.to ? C.gregorian(e.to) + '<br><small class="muted">' + C.hijri(e.to) + '</small>' : '—') + '</td>' +
          '<td class="c">' + d(len) + (len === 1 ? ' يوم' : ' أيام') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function render() {
    if (!v) return;
    var k = today();
    var body = st.view === 'timeline' ? timelineHTML(k) : st.view === 'month' ? monthHTML(k) : listHTML(k);
    v.innerHTML = '<div class="pg ac-layout">' + banner() + sideHTML(k) + '<div class="panel pg-main">' + toolbar() + '<div class="pg-body">' + body + '</div></div></div>';
  }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.acView) { st.view = b.dataset.acView; render(); }
    if (b.dataset.acNav !== undefined) {
      var n = +b.dataset.acNav;
      if (n === 0) { var t = today().split('-'); st.y = +t[0]; st.m = +t[1]; }
      else { st.m += n; if (st.m < 1) { st.m = 12; st.y--; } if (st.m > 12) { st.m = 1; st.y++; } }
      render();
    }
  }

  root.FakiehAcademic = { mount: mount, render: render, scheduleHolidays: scheduleHolidays, data: data, events: events, nextHoliday: nextHoliday };
})(window);
