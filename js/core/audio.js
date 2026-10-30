/* =========================================================================
   محرك الصوت — نغمات مُولّدة (لا تحتاج ملفات) + ملفات MP3/WAV يرفعها المسؤول.
   المتصفحات تمنع تشغيل الصوت قبل أول تفاعل من المستخدم، لذلك يجب الضغط
   على زر «تفعيل الصوت» مرة واحدة بعد فتح الصفحة.
   ========================================================================= */
(function (root) {
  'use strict';

  var ctx = null, master = null;
  var customBuffers = {};          // kind -> AudioBuffer
  var stateListeners = [];

  var BUILTIN = {
    chime:  { label: 'نغمة هادئة' },
    double: { label: 'نغمة مزدوجة' },
    bell:   { label: 'جرس مدرسي' },
    soft:   { label: 'جرس ناعم' }
  };

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    ctx.onstatechange = notify;
    return ctx;
  }

  function isUnlocked() { return !!ctx && ctx.state === 'running'; }
  function notify() { stateListeners.forEach(function (fn) { fn(isUnlocked()); }); }

  /** يجب استدعاؤها داخل حدث نقر من المستخدم */
  function unlock() {
    var c = ensureCtx();
    if (!c) return Promise.resolve(false);
    // نغمة صامتة قصيرة لفتح القناة على بعض المتصفحات
    var o = c.createOscillator(), g = c.createGain();
    g.gain.value = 0; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.05);
    return c.resume().then(function () { notify(); return isUnlocked(); });
  }

  function setVolume(v) { ensureCtx(); if (master) master.gain.value = Math.max(0, Math.min(1, v)); }

  /** نغمة بسيطة بغلاف صوتي ناعم، تُوجَّه إلى مخرج out */
  function tone(out, freq, start, dur, peak, type, partials) {
    var t0 = ctx.currentTime + start;
    (partials || [[1, 1]]).forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq * p[0];
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak * p[1], t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(out);
      o.start(t0); o.stop(t0 + dur + 0.05);
    });
  }

  var BELL_PARTIALS = [[1, 1], [2.0, 0.5], [2.76, 0.35], [5.4, 0.15]];
  var SYNTH = {
    chime:  function (o) { tone(o, 880, 0, 1.4, 0.35); tone(o, 1318.5, 0.35, 1.8, 0.3); },
    double: function (o) { tone(o, 988, 0, 0.7, 0.4); tone(o, 988, 0.45, 0.7, 0.4); tone(o, 1318.5, 0.9, 1.6, 0.35); },
    bell:   function (o) { for (var i = 0; i < 3; i++) tone(o, 660, i * 0.9, 2.2, 0.35, 'sine', BELL_PARTIALS); },
    soft:   function (o) { tone(o, 523.25, 0, 1.6, 0.3); tone(o, 659.25, 0.25, 1.6, 0.25); tone(o, 783.99, 0.5, 2.2, 0.25); }
  };
  var active = [];   // { kind, gain, source }

  /** تحميل ملف صوت مرفوع (Blob) لنوع تنبيه */
  function loadCustom(kind, blob) {
    if (!blob) { delete customBuffers[kind]; return Promise.resolve(false); }
    var c = ensureCtx();
    if (!c) return Promise.resolve(false);
    return blob.arrayBuffer()
      .then(function (ab) { return new Promise(function (res, rej) { c.decodeAudioData(ab, res, rej); }); })
      .then(function (buf) { customBuffers[kind] = buf; return true; })
      .catch(function (e) { console.warn('تعذر قراءة ملف الصوت', e); return false; });
  }

  /**
   * تشغيل صوت: sound = اسم نغمة مدمجة أو 'custom'
   * opts.volume: مستوى خاص بهذا الصوت (0..1) ، opts.onEnd: عند الانتهاء
   * يعيد false إذا كان الصوت غير مفعّل بعد (لم يضغط المستخدم الزر)
   */
  function play(sound, kind, opts) {
    if (!isUnlocked()) return false;
    opts = opts || {};
    var g = ctx.createGain();
    g.gain.value = opts.volume === undefined ? 1 : opts.volume;
    g.connect(master);
    var entry = { kind: kind, gain: g, source: null };
    active.push(entry);
    var done = function () {
      active = active.filter(function (a) { return a !== entry; });
      try { g.disconnect(); } catch (e) {}
      if (opts.onEnd) opts.onEnd();
    };
    if (sound === 'custom' && customBuffers[kind]) {
      var s = ctx.createBufferSource();
      s.buffer = customBuffers[kind]; s.connect(g); s.onended = done; s.start();
      entry.source = s;
    } else {
      (SYNTH[sound] || SYNTH.chime)(g);
      entry.timer = setTimeout(done, 3500);
    }
    return true;
  }

  /** إيقاف الأصوات الجارية (كلها أو نوع محدد مثل الأذان) */
  function stop(kind) {
    active.filter(function (a) { return !kind || a.kind === kind; }).forEach(function (a) {
      clearTimeout(a.timer);
      if (a.source) { a.source.onended = null; try { a.source.stop(); } catch (e) {} }
      try { a.gain.disconnect(); } catch (e) {}
      active = active.filter(function (x) { return x !== a; });
    });
  }
  function isPlaying(kind) { return active.some(function (a) { return !kind || a.kind === kind; }); }

  root.FakiehAudio = {
    BUILTIN: BUILTIN,
    unlock: unlock, isUnlocked: isUnlocked, setVolume: setVolume,
    play: play, stop: stop, isPlaying: isPlaying, loadCustom: loadCustom,
    hasCustom: function (kind) { return !!customBuffers[kind]; },
    onStateChange: function (fn) { stateListeners.push(fn); }
  };
})(window);
