/* =========================================================================
   اختبارات حسابات التوقيت والتنبيهات — تعمل في Node وفي المتصفح (tests/tests.html)
   ========================================================================= */
(function (root) {
  'use strict';

  function defineTests(T, A, defaults) {
    var tests = [];
    function test(name, fn) { tests.push({ name: name, fn: fn }); }
    function eq(actual, expected, msg) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error((msg || '') + ' المتوقع: ' + JSON.stringify(expected) + ' — الفعلي: ' + JSON.stringify(actual));
      }
    }
    function at(hms) { return T.parseHM(hms); }
    var sched = JSON.parse(JSON.stringify(defaults.schedule));
    var periods = T.buildPeriods(sched);
    var noIntl = T.buildPeriods(Object.assign({}, sched, { showInternational: false }));

    test('تحويل الوقت إلى ثوانٍ', function () {
      eq(T.parseHM('07:15'), 26100); eq(T.parseHM('13:40'), 49200); eq(isNaN(T.parseHM('25:00')), true);
    });
    test('عدد الفترات: 11 مع الدولي و10 بدونه', function () { eq(periods.length, 11); eq(noIntl.length, 10); });
    test('الأوقات محفوظة كما في الجدول دون تعديل', function () {
      eq(periods.map(function (p) { return p.startHM + '-' + p.endHM; }), [
        '07:15-07:30', '07:30-08:15', '08:17-09:02', '09:03-09:47', '09:48-10:33', '10:33-10:52',
        '10:53-11:33', '11:33-12:13', '12:13-12:53', '12:53-13:00', '13:00-13:40']);
    });
    test('المثال: 09:20:35 = الحصة الثالثة ومتبقٍ 26:25 والتالية الرابعة 09:48', function () {
      var s = T.resolveState(periods, at('09:20:35'));
      eq(s.kind, 'period'); eq(s.period.name, 'الحصة الثالثة');
      eq(T.formatCountdown(s.remaining), '26:25'); eq(s.next.name, 'الحصة الرابعة'); eq(s.next.startHM, '09:48');
    });
    test('طابور الصباح 07:20', function () {
      var s = T.resolveState(periods, at('07:20')); eq(s.period.id, 'assembly'); eq(s.remaining, 600);
    });
    test('الفاصل 08:15–08:17 يعد تنازليًا لبداية الحصة الثانية', function () {
      var s = T.resolveState(periods, at('08:16:00'));
      eq(s.kind, 'gap'); eq(s.next.id, 'p2'); eq(T.formatCountdown(s.remaining), '01:00');
    });
    test('الفاصل الدقيقة 09:02–09:03', function () { eq(T.resolveState(periods, at('09:02:30')).kind, 'gap'); });
    test('الاستراحة 10:40', function () { eq(T.resolveState(periods, at('10:40')).period.id, 'break'); });
    test('الفاصل بعد الاستراحة 10:52–10:53', function () {
      var s = T.resolveState(periods, at('10:52:30')); eq(s.kind, 'gap'); eq(s.next.id, 'p5'); eq(s.remaining, 30);
    });
    test('الحد بين حصتين متلاصقتين 11:33 يتبع السادسة', function () {
      eq(T.resolveState(periods, at('11:32:59')).period.id, 'p5');
      eq(T.resolveState(periods, at('11:33:00')).period.id, 'p6');
    });
    test('الصلاة 12:55', function () { eq(T.resolveState(periods, at('12:55')).period.id, 'prayer'); });
    test('الحصة الثامنة تظهر مع الدولي وتختفي بدونه', function () {
      eq(T.resolveState(periods, at('13:10')).period.id, 'p8');
      eq(T.resolveState(noIntl, at('13:10')).kind, 'ended');
    });
    test('انتهاء اليوم 13:40', function () { eq(T.resolveState(periods, at('13:40')).kind, 'ended'); });
    test('قبل بداية اليوم 06:00: متبقٍ 1:15:00', function () {
      var s = T.resolveState(periods, at('06:00')); eq(s.kind, 'before'); eq(T.formatCountdown(s.remaining), '1:15:00');
    });
    test('العداد يصل 00:00 لحظة النهاية ولا يكون سالبًا', function () {
      eq(T.formatCountdown(0.4), '00:01'); eq(T.formatCountdown(0), '00:00'); eq(T.formatCountdown(-5), '00:00');
    });
    test('المنطقة الزمنية: 06:20:35 UTC = 09:20:35 الرياض (الجمعة)', function () {
      var p = T.zonedParts(Date.UTC(2026, 9, 30, 6, 20, 35), 'Asia/Riyadh');
      eq([p.hour, p.minute, p.second, p.weekday, p.dateKey], [9, 20, 35, 5, '2026-10-30']);
    });
    test('منتصف الليل في الرياض يغير التاريخ', function () {
      eq(T.zonedParts(Date.UTC(2026, 9, 30, 21, 0, 0), 'Asia/Riyadh').dateKey, '2026-10-31');
    });
    test('أيام الدراسة والإجازات', function () {
      eq(T.isSchoolDay(sched, { weekday: 5, dateKey: '2026-10-30' }), false);
      eq(T.isSchoolDay(sched, { weekday: 0, dateKey: '2026-11-01' }), true);
      var h = Object.assign({}, sched, { holidays: [{ from: '2026-11-01', to: '2026-11-03', name: 'إجازة' }] });
      eq(T.isSchoolDay(h, { weekday: 2, dateKey: '2026-11-03' }), false);
      eq(T.isSchoolDay(h, { weekday: 3, dateKey: '2026-11-04' }), true);
    });
    test('اليوم الدراسي التالي بعد الجمعة هو الأحد', function () {
      eq(T.nextSchoolDay(sched, '2026-10-30', 5).dateKey, '2026-11-01');
    });
    test('تنسيق 12 ساعة', function () {
      eq(T.formatClock(at('09:20:35'), true), { time: '09:20:35', suffix: 'صباحًا' });
      eq(T.formatHM('13:00', true), '01:00 م');
    });
    test('موعد المناسبة القادم والأيام المتبقية', function () {
      eq(T.nextOccurrence({ month: 12, day: 18 }, '2026-10-30'), '2026-12-18');
      eq(T.nextOccurrence({ month: 9, day: 23 }, '2026-10-30'), '2027-09-23');
      eq(T.daysBetween('2026-10-30', '2026-12-18'), 49);
    });

    var cfg = defaults.alerts;
    var events = A.buildAlertEvents(periods, cfg);
    test('أحداث الحصة الثالثة: 09:42 و09:46 و09:47', function () {
      var p3 = events.filter(function (e) { return e.period.id === 'p3'; });
      eq(p3.map(function (e) { return e.kind + '@' + T.hmFromSec(e.at); }), ['warn1@09:42', 'warn2@09:46', 'end@09:47']);
    });
    test('لا تنبيهات للطابور والصلاة افتراضيًا', function () {
      eq(events.some(function (e) { return e.period.type === 'assembly' || e.period.type === 'prayer'; }), false);
    });
    test('التنبيه يُطلق عند موعده', function () {
      eq(A.dueEvents(events, at('09:41:59'), at('09:42:00'), 10).map(function (e) { return e.key; }), ['p3:warn1']);
    });
    test('لا يُطلق التنبيه متأخرًا بعد مهلة السماح', function () {
      eq(A.dueEvents(events, at('09:41:00'), at('09:43:00'), 10).length, 0);
    });
    test('منع تكرار التنبيه لنفس الحدث', function () {
      var tr = new A.AlertTracker();
      tr.step('2026-11-01', at('09:41:58'), events, 10);
      var a = tr.step('2026-11-01', at('09:42:00'), events, 10);
      tr.prevSec = at('09:41:59');            // محاكاة تحديث مكرر لنفس الثانية
      var b = tr.step('2026-11-01', at('09:42:01'), events, 10);
      eq([a.length, b.length], [1, 0]);
    });
    test('أول تحديث بعد فتح الصفحة لا يطلق تنبيهات قديمة', function () {
      var tr = new A.AlertTracker();
      eq(tr.step('2026-11-01', at('09:42:05'), events, 10).length, 0);
    });
    test('تزامن حدثين: يُشغَّل الأهم (الجرس)', function () {
      eq(A.mostImportant([{ kind: 'warn2' }, { kind: 'end' }, { kind: 'warn1' }]).kind, 'end');
    });
    test('فحص الجدول يكتشف التداخل', function () {
      var w = T.validatePeriods([{ name: 'أ', start: '08:00', end: '08:45' }, { name: 'ب', start: '08:40', end: '09:00' }]);
      eq(w.length, 1);
    });

    /* ---------------- مواقيت الصلاة (أم القرى — مكة) ----------------
       القيم المرجعية من واجهة Aladhan بطريقة أم القرى (method=4) */
    var PR = root.FakiehPrayer;
    if (PR) {
      var pcfg = defaults.prayer;
      function hm(t) { var r = {}; PR.ORDER.forEach(function (k) { r[k] = T.hmFromSec(t[k]); }); return r; }
      test('مواقيت مكة 1 نوفمبر 2026 تطابق أم القرى', function () {
        eq(hm(PR.timesFor('2026-11-01', pcfg)), { fajr: '05:06', sunrise: '06:24', dhuhr: '12:04', asr: '15:20', maghrib: '17:45', isha: '19:15' });
      });
      test('رمضان 15 فبراير 2027: العشاء بعد المغرب بساعتين', function () {
        var t = PR.timesFor('2027-02-15', pcfg), h = hm(t);
        eq(t.ramadan, true);
        // العصر: فرق أقل من دقيقة بين طرق التقريب في البرامج المختلفة، لذا نقبل ±1 دقيقة
        eq(Math.abs(t.asr - at('15:51')) <= 60, true, 'العصر');
        delete h.asr;
        eq(h, { fajr: '05:34', sunrise: '06:52', dhuhr: '12:35', maghrib: '18:18', isha: '20:18' });
      });
      test('فرق الضبط بالدقائق يُطبَّق', function () {
        var c = JSON.parse(JSON.stringify(pcfg)); c.offsets.dhuhr = 2;
        eq(T.hmFromSec(PR.timesFor('2026-11-01', c).dhuhr), '12:06');
      });
      test('أحداث الظهر: تنبيه قبل 5 دقائق ثم الأذان', function () {
        var ev = PR.prayerEvents(PR.timesFor('2026-11-01', pcfg), pcfg);
        eq(ev.map(function (e) { return e.kind + '@' + T.hmFromSec(e.at); }), ['prayerPre@11:59', 'adhan@12:04']);
      });
      test('إيقاف تنبيه ما قبل الصلاة يُبقي الأذان فقط', function () {
        var c = JSON.parse(JSON.stringify(pcfg)); c.preAlertEnabled = false;
        eq(PR.prayerEvents(PR.timesFor('2026-11-01', c), c).map(function (e) { return e.kind; }), ['adhan']);
      });
      test('الصلاة القادمة بعد الفجر هي الظهر', function () {
        eq(PR.nextPrayer(PR.timesFor('2026-11-01', pcfg), at('09:00')).key, 'dhuhr');
      });
    }

    /* ---------------- العرض التلقائي ---------------- */
    var P = root.FakiehPresentation;
    if (P) {
      var pc = JSON.parse(JSON.stringify(defaults.presentation)); pc.enabled = true;
      function pctx(hms, schoolDay) {
        var sec = at(hms);
        return { parts: { secOfDay: sec }, schoolDay: schoolDay !== false, state: T.resolveState(periods, sec) };
      }
      test('العرض التلقائي متوقف افتراضيًا', function () { eq(P.decide(pctx('10:40'), defaults.presentation), null); });
      test('الطابور: أذكار الصباح', function () { eq(P.decide(pctx('07:20'), pc).view, 'azkar'); eq(P.decide(pctx('07:20'), pc).assembly, true); });
      test('آخر دقيقتين من الطابور: العودة للتوقيت', function () { eq(P.decide(pctx('07:28:30'), pc).view, 'home'); });
      test('أثناء الحصة: شاشة التوقيت', function () { eq(P.decide(pctx('09:20'), pc).view, 'home'); });
      test('الاستراحة: تدوير المحتوى', function () { eq(pc.breakViews.indexOf(P.decide(pctx('10:40'), pc).view) > -1, true); });
      test('قبل نهاية الاستراحة بدقيقة: العودة للتوقيت', function () { eq(P.decide(pctx('10:51'), pc).view, 'home'); });
      test('الفاصل بين الحصص: شاشة التوقيت', function () { eq(P.decide(pctx('08:16'), pc).view, 'home'); });
      test('وقت تحدده الإدارة', function () {
        var c2 = JSON.parse(JSON.stringify(pc)); c2.slots = [{ start: '11:00', end: '11:20', views: ['safety'], enabled: true }];
        eq(P.decide(pctx('11:05'), c2).view, 'safety');
        eq(P.decide(pctx('11:25'), c2).view, 'home');
      });
      test('أولوية التوقيت تتقدم على وقت الإدارة قرب نهاية الحصة', function () {
        var c3 = JSON.parse(JSON.stringify(pc)); c3.slots = [{ start: '11:00', end: '11:40', views: ['safety'], enabled: true }];
        eq(P.decide(pctx('11:32'), c3).view, 'home');
      });
    }

    return tests;
  }

  function runTests(T, A, defaults, log) {
    var tests = defineTests(T, A, defaults), passed = 0, failed = 0;
    tests.forEach(function (t) {
      try { t.fn(); passed++; log(true, t.name); }
      catch (e) { failed++; log(false, t.name, e.message); }
    });
    return { passed: passed, failed: failed, total: tests.length };
  }

  root.FakiehTests = { runTests: runTests };
  if (typeof module === 'object' && module.exports) module.exports = root.FakiehTests;
})(typeof window !== 'undefined' ? window : globalThis);
