/* =========================================================================
   طبقة المحتوى: تجمع البيانات الافتراضية مع تعديلات الإدارة المحفوظة
   ========================================================================= */
(function (root) {
  'use strict';
  var S = root.FakiehStore, T = root.FakiehTime;

  function withOverrides(list, kind) {
    var ov = (S.state.contentOverrides || {})[kind] || {};
    return list.map(function (item) {
      var o = ov[item.id] || {};
      return Object.assign({}, item, {
        active: o.active !== undefined ? o.active : true,
        approved: !!o.approved
      });
    });
  }

  /** الأذكار المعروضة لفئة (morning/evening/selected) حسب التفعيل والاعتماد */
  function azkar(category) {
    var approvedOnly = S.state.azkar.approvedOnly;
    return withOverrides(root.FAKIEH_AZKAR || [], 'azkar').filter(function (z) {
      return (!category || z.category === category) && z.active && (!approvedOnly || z.approved);
    });
  }
  function hadith() {
    var approvedOnly = S.state.azkar.approvedOnly;
    return withOverrides(root.FAKIEH_HADITH || [], 'hadith').filter(function (h) { return h.active && (!approvedOnly || h.approved); });
  }

  function occasionsList() { return S.state.occasions.list || root.FAKIEH_OCCASIONS || []; }

  /** المناسبات القادمة مرتبة، مع الأيام المتبقية */
  function upcomingOccasions(todayKey, limit) {
    return occasionsList().map(function (o) {
      var key = T.nextOccurrence(o, todayKey);
      return key ? Object.assign({}, o, { dateKey: key, inDays: T.daysBetween(todayKey, key) }) : null;
    }).filter(Boolean).sort(function (a, b) { return a.inDays - b.inDays; }).slice(0, limit || 99);
  }

  var hijriFmt = null, gregFmt = null, gregShort = null;
  function dateFromKey(key) { var a = key.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 9)); }
  function nu() { return S.state.visual.digits === 'arab' ? 'arab' : 'latn'; }
  function hijri(dateOrKey, opts) {
    var d = typeof dateOrKey === 'string' ? dateFromKey(dateOrKey) : dateOrKey;
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-' + nu(), Object.assign({ timeZone: S.state.timeZone, day: 'numeric', month: 'long', year: 'numeric' }, opts || {})).format(d);
  }
  function gregorian(dateOrKey, opts) {
    var d = typeof dateOrKey === 'string' ? dateFromKey(dateOrKey) : dateOrKey;
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-' + nu(), Object.assign({ timeZone: S.state.timeZone, day: 'numeric', month: 'long', year: 'numeric' }, opts || {})).format(d);
  }

  function daysLabel(n) {
    if (n === 0) return 'اليوم';
    if (n === 1) return 'غدًا';
    if (n === 2) return 'بعد يومين';
    if (n <= 10) return 'بعد ' + n + ' أيام';
    return 'بعد ' + n + ' يومًا';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  root.FakiehContent = {
    azkar: azkar, hadith: hadith, occasionsList: occasionsList, upcomingOccasions: upcomingOccasions,
    hijri: hijri, gregorian: gregorian, daysLabel: daysLabel, esc: esc
  };
})(window);
