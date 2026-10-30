/* =========================================================================
   حساب مواقيت الصلاة فلكيًا (يعمل دون إنترنت) — دوال نقية قابلة للاختبار
   طريقة جامعة أم القرى: الفجر 18.5°، العشاء بعد المغرب بـ 90 دقيقة (120 في رمضان)،
   العصر على المذهب الجمهوري (ظل المثل)، المغرب عند الغروب.
   الخوارزمية مبنية على معادلات PrayTimes.org الفلكية المعروفة.
   ⚠ يُنصح بمطابقة النتائج مع تقويم أم القرى الرسمي، ويمكن ضبط فرق بالدقائق من الإعدادات.
   ========================================================================= */
(function (root) {
  'use strict';

  var rad = Math.PI / 180;
  function sin(d) { return Math.sin(d * rad); }
  function cos(d) { return Math.cos(d * rad); }
  function tan(d) { return Math.tan(d * rad); }
  function arcsin(x) { return Math.asin(x) / rad; }
  function arccos(x) { return Math.acos(x) / rad; }
  function arccot(x) { return Math.atan(1 / x) / rad; }
  function arctan2(y, x) { return Math.atan2(y, x) / rad; }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function sunPosition(jd) {
    var D = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * D, 360);
    var q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
    var e = 23.439 - 0.00000036 * D;
    var RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
    return { declination: arcsin(sin(e) * sin(L)), equation: q / 15 - fix(RA, 24) };
  }

  /**
   * يحسب مواقيت يوم واحد.
   * opt: { lat, lng, tz, fajrAngle, ishaMinutes, asrFactor }
   * يعيد الأوقات بالساعات العشرية بالتوقيت المحلي.
   */
  function computeDay(y, m, d, opt) {
    var lat = opt.lat, lng = opt.lng;
    var jDate = julian(y, m, d) - lng / (15 * 24);
    function midDay(t) { return fix(12 - sunPosition(jDate + t).equation, 24); }
    function angleTime(angle, t, ccw) {
      var decl = sunPosition(jDate + t).declination, noon = midDay(t);
      var T = arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return noon + (ccw ? -T : T);
    }
    function asrTime(factor, t) {
      var decl = sunPosition(jDate + t).declination;
      return angleTime(-arccot(factor + tan(Math.abs(lat - decl))), t);
    }
    var adj = opt.tz - lng / 15;
    var t = {
      fajr:    angleTime(opt.fajrAngle, 5 / 24, true) + adj,
      sunrise: angleTime(0.833, 6 / 24, true) + adj,
      dhuhr:   midDay(12 / 24) + adj,
      asr:     asrTime(opt.asrFactor || 1, 13 / 24) + adj,
      maghrib: angleTime(0.833, 18 / 24) + adj
    };
    t.isha = t.maghrib + opt.ishaMinutes / 60;
    return t;
  }

  var ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var NAMES = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

  /** الشهر الهجري (أم القرى) لتاريخ YYYY-MM-DD */
  var hijriFmt = null;
  function hijriMonth(dateKey) {
    hijriFmt = hijriFmt || new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', month: 'numeric' });
    var a = dateKey.split('-');
    return +hijriFmt.format(new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 12)));
  }

  /**
   * مواقيت يوم بالثواني من بداية اليوم، مقرّبة لأقرب دقيقة، مع فروق الضبط.
   * cfg = إعدادات prayer من ملف الإعدادات
   */
  function timesFor(dateKey, cfg) {
    var a = dateKey.split('-');
    var ramadan = hijriMonth(dateKey) === 9;
    var raw = computeDay(+a[0], +a[1], +a[2], {
      lat: cfg.lat, lng: cfg.lng, tz: cfg.tz, fajrAngle: cfg.fajrAngle, asrFactor: cfg.asrFactor || 1,
      ishaMinutes: ramadan ? cfg.ramadanIshaMinutes : cfg.ishaMinutes
    });
    var out = { ramadan: ramadan };
    ORDER.forEach(function (k) {
      var minutes = Math.round(raw[k] * 60) + ((cfg.offsets || {})[k] || 0);
      out[k] = minutes * 60;
    });
    return out;
  }

  /** الصلاة القادمة (الشروق مستثنى) */
  function nextPrayer(times, sec) {
    var list = ORDER.filter(function (k) { return k !== 'sunrise'; });
    for (var i = 0; i < list.length; i++) if (times[list[i]] > sec) return { key: list[i], name: NAMES[list[i]], at: times[list[i]], remaining: times[list[i]] - sec };
    return null;
  }

  /** أحداث التنبيه لليوم: تنبيه قبل الصلاة + الأذان */
  function prayerEvents(times, cfg) {
    var out = [];
    Object.keys(cfg.alertPrayers || {}).forEach(function (k) {
      if (!cfg.alertPrayers[k] || times[k] === undefined) return;
      if (cfg.preAlertEnabled && cfg.preAlertMinutes > 0) out.push({ key: 'prayer:' + k + ':pre', kind: 'prayerPre', prayer: k, name: NAMES[k], at: times[k] - cfg.preAlertMinutes * 60 });
      out.push({ key: 'prayer:' + k + ':adhan', kind: 'adhan', prayer: k, name: NAMES[k], at: times[k] });
    });
    return out.sort(function (a, b) { return a.at - b.at; });
  }

  var api = { computeDay: computeDay, timesFor: timesFor, nextPrayer: nextPrayer, prayerEvents: prayerEvents, hijriMonth: hijriMonth, ORDER: ORDER, NAMES: NAMES };
  root.FakiehPrayer = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
