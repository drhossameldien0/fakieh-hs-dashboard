/* =========================================================================
   نواة التوقيت — دوال نقية قابلة للاختبار (تعمل في المتصفح وفي Node)
   كل الحسابات تُشتق من الوقت الفعلي في كل تحديث، ولا تعتمد على إنقاص عداد.
   ========================================================================= */
(function (root) {
  'use strict';

  var DAY = 86400;
  var WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var WEEKDAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  function pad(n) { return String(n).padStart(2, '0'); }

  /** "07:15" -> 26100 ثانية من بداية اليوم */
  function parseHM(s) {
    var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(s || '').trim());
    if (!m) return NaN;
    var h = +m[1], mi = +m[2], se = +(m[3] || 0);
    if (h > 23 || mi > 59 || se > 59) return NaN;
    return h * 3600 + mi * 60 + se;
  }

  /** 26100 -> "07:15" */
  function hmFromSec(sec) {
    sec = ((Math.floor(sec) % DAY) + DAY) % DAY;
    return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor((sec % 3600) / 60));
  }

  var fmtCache = {};
  /** مكونات التاريخ والوقت في منطقة زمنية محددة (افتراضيًا Asia/Riyadh) */
  function zonedParts(ms, tz) {
    tz = tz || 'Asia/Riyadh';
    var fmt = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }));
    var p = {};
    fmt.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
    var hour = (+p.hour) % 24;
    var frac = (((ms % 1000) + 1000) % 1000) / 1000;
    return {
      year: +p.year, month: +p.month, day: +p.day,
      hour: hour, minute: +p.minute, second: +p.second,
      weekday: WEEKDAYS[p.weekday],
      dateKey: p.year + '-' + p.month + '-' + p.day,
      secOfDay: hour * 3600 + (+p.minute) * 60 + (+p.second) + frac
    };
  }

  /** يبني قائمة الفترات الفعّالة (بالثواني) من الإعدادات ويرتبها */
  function buildPeriods(scheduleCfg) {
    var profile = scheduleCfg.profiles[scheduleCfg.activeProfile] || { periods: [] };
    return profile.periods
      .filter(function (p) { return p.enabled !== false && (!p.international || scheduleCfg.showInternational); })
      .map(function (p) {
        return {
          id: p.id, name: p.name, type: p.type || 'lesson', international: !!p.international,
          startHM: p.start, endHM: p.end, start: parseHM(p.start), end: parseHM(p.end)
        };
      })
      .filter(function (p) { return isFinite(p.start) && isFinite(p.end) && p.end > p.start; })
      .sort(function (a, b) { return a.start - b.start; });
  }

  /** فحص الجدول وإرجاع تحذيرات (بداية بعد النهاية، تداخل…) */
  function validatePeriods(periods) {
    var warnings = [];
    periods.forEach(function (p) {
      var s = parseHM(p.start), e = parseHM(p.end);
      if (!isFinite(s) || !isFinite(e)) warnings.push('صيغة الوقت غير صحيحة في: ' + p.name);
      else if (e <= s) warnings.push('وقت النهاية يجب أن يكون بعد البداية في: ' + p.name);
    });
    var sorted = periods.filter(function (p) { return p.enabled !== false; })
      .map(function (p) { return { name: p.name, s: parseHM(p.start), e: parseHM(p.end) }; })
      .sort(function (a, b) { return a.s - b.s; });
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i].s < sorted[i - 1].e) warnings.push('تداخل بين «' + sorted[i - 1].name + '» و«' + sorted[i].name + '»');
    }
    return warnings;
  }

  /**
   * يحدد الحالة الحالية لليوم الدراسي.
   * kind: period | gap | before | ended | empty
   * البداية شاملة والنهاية غير شاملة: [start, end)
   */
  function resolveState(periods, sec) {
    if (!periods.length) return { kind: 'empty' };
    var first = periods[0];
    var lastEnd = periods.reduce(function (m, p) { return Math.max(m, p.end); }, 0);
    for (var i = 0; i < periods.length; i++) {
      var p = periods[i];
      if (sec >= p.start && sec < p.end) {
        return {
          kind: 'period', period: p, index: i, next: periods[i + 1] || null,
          startsAt: p.start, endsAt: p.end, total: p.end - p.start,
          remaining: p.end - sec, progress: (sec - p.start) / (p.end - p.start)
        };
      }
    }
    if (sec < first.start) return { kind: 'before', next: first, endsAt: first.start, remaining: first.start - sec };
    if (sec >= lastEnd) return { kind: 'ended' };
    for (var j = 0; j < periods.length - 1; j++) {
      var prev = periods[j], nxt = periods[j + 1];
      if (sec >= prev.end && sec < nxt.start) {
        return {
          kind: 'gap', prev: prev, next: nxt, index: j + 1,
          startsAt: prev.end, endsAt: nxt.start, total: nxt.start - prev.end,
          remaining: nxt.start - sec, progress: (sec - prev.end) / (nxt.start - prev.end)
        };
      }
    }
    return { kind: 'ended' };
  }

  /** هل اليوم يوم دراسي؟ (أيام الدراسة + الإجازات المسجلة) */
  function isSchoolDay(scheduleCfg, parts) {
    if ((scheduleCfg.schoolDays || []).indexOf(parts.weekday) === -1) return false;
    return !holidayFor(scheduleCfg, parts.dateKey);
  }

  function holidayFor(scheduleCfg, dateKey) {
    var list = scheduleCfg.holidays || [];
    for (var i = 0; i < list.length; i++) {
      var h = list[i];
      if (h.from && dateKey >= h.from && dateKey <= (h.to || h.from)) return h;
    }
    return null;
  }

  /** الثواني المتبقية -> "26:25" أو "1:02:05" (تقريب للأعلى حتى يصل الصفر لحظة النهاية) */
  function formatCountdown(sec) {
    var s = Math.max(0, Math.ceil(sec - 1e-6));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h > 0 ? h + ':' + pad(m) + ':' + pad(r) : pad(m) + ':' + pad(r);
  }

  /** وقت اليوم -> { time: "09:20:35", suffix: "صباحًا" } */
  function formatClock(secOfDay, use12h, withSeconds) {
    var s = Math.floor(secOfDay);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    var suffix = h < 12 ? 'صباحًا' : 'مساءً';
    var hh = use12h ? (h % 12 || 12) : h;
    return { time: pad(hh) + ':' + pad(m) + (withSeconds === false ? '' : ':' + pad(r)), suffix: use12h ? suffix : '' };
  }

  /** "13:00" -> "01:00 م" (أو 24 ساعة) */
  function formatHM(hm, use12h) {
    var sec = typeof hm === 'number' ? hm : parseHM(hm);
    if (!isFinite(sec)) return '--:--';
    var c = formatClock(sec, use12h, false);
    return use12h ? c.time + ' ' + (sec < 43200 ? 'ص' : 'م') : c.time;
  }

  var ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function digits(str, system) {
    if (system !== 'arab') return String(str);
    return String(str).replace(/[0-9]/g, function (d) { return ARABIC_DIGITS[+d]; });
  }

  function keyToUTC(key) { var a = key.split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]); }
  function daysBetween(fromKey, toKey) { return Math.round((keyToUTC(toKey) - keyToUTC(fromKey)) / 86400000); }
  function addDays(key, n) {
    var d = new Date(keyToUTC(key) + n * 86400000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /** أقرب موعد قادم لمناسبة (سنوية بالشهر واليوم، أو بتاريخ محدد) */
  function nextOccurrence(occ, todayKey) {
    if (occ.date) return occ.date >= todayKey ? occ.date : null;
    if (!occ.month || !occ.day) return null;
    var y = +todayKey.slice(0, 4);
    var k = y + '-' + pad(occ.month) + '-' + pad(occ.day);
    return k >= todayKey ? k : (y + 1) + '-' + pad(occ.month) + '-' + pad(occ.day);
  }

  /** أول يوم دراسي قادم بعد تاريخ معين (للعرض في أيام الإجازة) */
  function nextSchoolDay(scheduleCfg, fromKey, fromWeekday) {
    for (var i = 1; i <= 60; i++) {
      var key = addDays(fromKey, i), wd = (fromWeekday + i) % 7;
      if (isSchoolDay(scheduleCfg, { dateKey: key, weekday: wd })) return { dateKey: key, weekday: wd, inDays: i };
    }
    return null;
  }

  var api = {
    DAY: DAY, WEEKDAY_NAMES: WEEKDAY_NAMES,
    pad: pad, parseHM: parseHM, hmFromSec: hmFromSec, zonedParts: zonedParts,
    buildPeriods: buildPeriods, validatePeriods: validatePeriods, resolveState: resolveState,
    isSchoolDay: isSchoolDay, holidayFor: holidayFor, nextSchoolDay: nextSchoolDay,
    formatCountdown: formatCountdown, formatClock: formatClock, formatHM: formatHM, digits: digits,
    daysBetween: daysBetween, addDays: addDays, nextOccurrence: nextOccurrence
  };
  root.FakiehTime = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
