/* =========================================================================
   مكوّن التقويم الشهري (يبدأ الأسبوع بالأحد، والاتجاه من اليمين لليسار)
   ========================================================================= */
(function (root) {
  'use strict';
  var T = root.FakiehTime, S = root.FakiehStore, C = root.FakiehContent;
  var SHORT_DAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  function key(y, m, d) { return y + '-' + T.pad(m) + '-' + T.pad(d); }
  function weekday(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  var hijriDayFmt = null;
  function hijriDay(k) {
    hijriDayFmt = hijriDayFmt || new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', day: 'numeric' });
    var a = k.split('-');
    return hijriDayFmt.format(new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 12)));
  }

  /**
   * يرسم شهرًا كاملًا.
   * decorate(dateKey) => { cls: '', html: '' , title: '' }
   */
  function month(y, m, todayKey, decorate, opts) {
    opts = opts || {};
    var first = weekday(y, m, 1), n = daysIn(y, m), html = '';
    if (!opts.mini) html += SHORT_DAYS.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');
    else html += SHORT_DAYS.map(function (d) { return '<div class="cal-dow">' + d[0] + '</div>'; }).join('');
    for (var i = 0; i < first; i++) html += '<div class="cal-cell empty"></div>';
    for (var d = 1; d <= n; d++) {
      var k = key(y, m, d), dec = decorate ? decorate(k) || {} : {};
      var cls = 'cal-cell' + (k === todayKey ? ' today' : '') + (dec.cls ? ' ' + dec.cls : '');
      html += '<div class="' + cls + '"' + (dec.title ? ' title="' + C.esc(dec.title) + '"' : '') + ' data-date="' + k + '">' +
        '<span class="cal-d">' + T.digits(d, S.state.visual.digits) + '</span>' +
        (opts.mini ? '' : '<span class="cal-h">' + T.digits(hijriDay(k), S.state.visual.digits) + '</span>') +
        (dec.html || '') + '</div>';
    }
    return '<div class="cal-grid' + (opts.mini ? ' mini' : '') + '">' + html + '</div>';
  }

  function monthTitle(y, m) {
    var mid = key(y, m, 15);
    return MONTHS[m - 1] + ' ' + T.digits(y, S.state.visual.digits) + ' م <small>' + C.hijri(mid, { day: undefined }) + '</small>';
  }

  root.FakiehCalendar = { month: month, monthTitle: monthTitle, key: key, daysIn: daysIn, weekday: weekday, MONTHS: MONTHS };
})(window);
