/* =========================================================================
   منطق التنبيهات — دوال نقية قابلة للاختبار
   يحدد أي تنبيه يجب أن يُطلق الآن، ويمنع تكرار التنبيه لنفس الحدث،
   ولا يُطلق تنبيهًا فات موعده بأكثر من مهلة السماح (حتى لا يرن الجرس متأخرًا).
   ========================================================================= */
(function (root) {
  'use strict';

  var KIND_PRIORITY = { warn1: 1, warn2: 2, end: 3 };

  /** يبني أحداث التنبيه لليوم من قائمة الفترات */
  function buildAlertEvents(periods, cfg) {
    var out = [];
    periods.forEach(function (p) {
      if (!cfg.periodTypes || !cfg.periodTypes[p.type]) return;
      function add(kind, at) {
        // التنبيه المسبق يجب أن يقع داخل الفترة نفسها
        if (at > p.start && at <= p.end) out.push({ key: p.id + ':' + kind, kind: kind, at: at, period: p });
      }
      if (cfg.warn1Enabled) add('warn1', p.end - cfg.warn1Minutes * 60);
      if (cfg.warn2Enabled) add('warn2', p.end - cfg.warn2Minutes * 60);
      if (cfg.endEnabled) add('end', p.end);
    });
    return out.sort(function (a, b) { return a.at - b.at || KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]; });
  }

  /** الأحداث التي حان موعدها بين التحديث السابق والحالي، ضمن مهلة السماح */
  function dueEvents(events, prevSec, nowSec, graceSec) {
    return events.filter(function (e) { return e.at > prevSec && e.at <= nowSec && nowSec - e.at <= graceSec; });
  }

  /** متتبع يحفظ ما أُطلق اليوم لمنع التكرار */
  function AlertTracker() { this.dateKey = null; this.prevSec = null; this.fired = {}; }
  AlertTracker.prototype.step = function (dateKey, nowSec, events, graceSec) {
    if (dateKey !== this.dateKey) { this.dateKey = dateKey; this.fired = {}; this.prevSec = nowSec; return []; }
    // أول تحديث أو رجوع الساعة للخلف: لا نطلق شيئًا من الماضي
    if (this.prevSec === null || nowSec < this.prevSec) { this.prevSec = nowSec; return []; }
    var self = this;
    var due = dueEvents(events, this.prevSec, nowSec, graceSec).filter(function (e) { return !self.fired[e.key]; });
    due.forEach(function (e) { self.fired[e.key] = true; });
    this.prevSec = nowSec;
    return due;
  };
  AlertTracker.prototype.reset = function () { this.dateKey = null; this.prevSec = null; this.fired = {}; };

  /** عند تزامن أكثر من حدث نشغّل الأهم فقط */
  function mostImportant(events) {
    return events.reduce(function (best, e) { return !best || KIND_PRIORITY[e.kind] >= KIND_PRIORITY[best.kind] ? e : best; }, null);
  }

  var api = { buildAlertEvents: buildAlertEvents, dueEvents: dueEvents, AlertTracker: AlertTracker, mostImportant: mostImportant };
  root.FakiehAlerts = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
