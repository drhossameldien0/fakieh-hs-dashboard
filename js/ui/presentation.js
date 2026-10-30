/* =========================================================================
   وضع العرض التلقائي الذكي (Smart Presentation Mode)
   الأولوية دائمًا للتوقيت: قرب نهاية الحصة وفي الفواصل تعود الشاشة للرئيسية.
   ========================================================================= */
(function (root) {
  'use strict';
  var T = root.FakiehTime, S = root.FakiehStore;
  var PAGES = {
    occasions: function (s) { root.FakiehOccasions.startSlides(s); },
    safety:    function (s) { root.FakiehSafety.startSlides(0, s); },
    conduct:   function (s) { root.FakiehConduct.startSlides(s); }
  };
  var pausedUntil = 0, current = null;

  function cfg() { return S.state.presentation; }

  /**
   * يحدد ما يجب عرضه الآن (دالة نقية تقريبًا — قابلة للاختبار).
   * يعيد: { view, assembly?, reason } أو null إذا لم يكن العرض التلقائي مفعّلًا
   */
  function decide(ctx, c) {
    c = c || cfg();
    if (!c.enabled) return null;
    var st = ctx.state, sec = ctx.parts.secOfDay;
    if (!ctx.schoolDay) return slotView(c, sec) || { view: 'home', reason: 'لا دوام' };
    // 1) الطابور: أذكار الصباح
    if (st.kind === 'period' && st.period.type === 'assembly' && c.assemblyAzkar) {
      return st.remaining <= c.returnBeforeEndSeconds ? { view: 'home', reason: 'قرب نهاية الطابور' } : { view: 'azkar', assembly: true, reason: 'الطابور الصباحي' };
    }
    // 2) قرب نهاية أي فترة أو الفاصل بين الحصص: التوقيت أولًا
    if ((st.kind === 'period' && st.remaining <= c.returnBeforeEndSeconds) || st.kind === 'gap') return { view: 'home', reason: 'أولوية التوقيت' };
    // 3) الأوقات التي تحددها الإدارة
    var slot = slotView(c, sec);
    if (slot) return slot;
    // 4) الاستراحة: تدوير المحتوى
    if (c.breakRotation && st.kind === 'period' && st.period.type === 'break' && c.breakViews.length) {
      return { view: rotate(c.breakViews, sec, c.rotateSeconds), reason: 'الاستراحة' };
    }
    // 5) قبل الدوام أو بعده
    if ((st.kind === 'before' || st.kind === 'ended') && c.outsideViews && c.outsideViews.length) {
      return { view: rotate(['home'].concat(c.outsideViews), sec, c.rotateSeconds), reason: 'خارج وقت الحصص' };
    }
    return { view: 'home', reason: 'اليوم الدراسي' };
  }
  function rotate(views, sec, every) { return views[Math.floor(sec / Math.max(15, every)) % views.length]; }
  function slotView(c, sec) {
    var slots = c.slots || [];
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i], a = T.parseHM(s.start), b = T.parseHM(s.end);
      if (s.enabled !== false && sec >= a && sec < b && s.views && s.views.length) return { view: rotate(s.views, sec, c.rotateSeconds), reason: 'وقت حددته الإدارة' };
    }
    return null;
  }

  /** يُستدعى كل ثانية من حلقة التطبيق */
  function step(ctx) {
    var d = decide(ctx);
    updateBadge(d);
    if (!d || Date.now() < pausedUntil) { current = null; return; }
    var key = d.view + (d.assembly ? ':a' : '');
    if (key === current) return;
    current = key;
    var App = root.FakiehApp, Az = root.FakiehAzkar;
    root.FakiehSlides.close();
    if (d.assembly) { if (!Az.isAssembly) Az.enterFocus(true); return; }
    if (Az.isAssembly) Az.exitFocus();
    App.go(d.view, { auto: true });
    if (PAGES[d.view] && cfg().autoSlides) PAGES[d.view](cfg().slideSeconds);
  }

  /** عند تدخل المستخدم يدويًا: إيقاف مؤقت */
  function userAction() {
    if (!cfg().enabled) return;
    pausedUntil = Date.now() + cfg().manualPauseMinutes * 60000;
    current = null;
  }

  function updateBadge(d) {
    var b = document.getElementById('presentBtn'); if (!b) return;
    var on = !!cfg().enabled, paused = on && Date.now() < pausedUntil;
    b.classList.toggle('on', on && !paused);
    b.classList.toggle('paused', paused);
    b.title = !on ? 'العرض التلقائي متوقف — اضغط للتشغيل' : paused ? 'العرض التلقائي متوقف مؤقتًا بسبب التحكم اليدوي — اضغط للاستئناف' : 'العرض التلقائي يعمل (' + (d ? d.reason : '') + ') — اضغط للإيقاف';
  }

  function toggle() {
    if (cfg().enabled && Date.now() < pausedUntil) { pausedUntil = 0; current = null; return; }
    S.set('presentation.enabled', !cfg().enabled);
    pausedUntil = 0; current = null;
    root.FakiehApp.toast(cfg().enabled ? 'تم تشغيل العرض التلقائي' : 'تم إيقاف العرض التلقائي', 3000);
  }

  root.FakiehPresentation = { decide: decide, step: step, userAction: userAction, toggle: toggle };
})(window);
