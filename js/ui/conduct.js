/* =========================================================================
   تبويب قواعد السلوك والمواظبة — ملخصات للطلاب + النص الرسمي + البحث
   ========================================================================= */
(function (root) {
  'use strict';
  var S = root.FakiehStore, C = root.FakiehContent, I = root.FakiehIcons, T = root.FakiehTime;
  var D = root.FAKIEH_CONDUCT;
  var st = { section: 'discipline', full: false, q: '' };
  var v;

  function d(s) { return T.digits(s, S.state.visual.digits); }
  var DEG_COLORS = { 1: '#4aa3c9', 2: '#2fa86a', 3: '#d9b45a', 4: '#e08a3c', 5: '#d66a5a' };

  /** "d3:6" -> { text, degree, deduction, group } */
  function ref(r) {
    var m = /^([ds])(\d):(\d+)$/.exec(r); if (!m) return null;
    var list = m[1] === 'd' ? D.degrees : D.staff;
    var g = list.filter(function (x) { return x.degree === +m[2]; })[0]; if (!g) return null;
    return { text: g.items[+m[3] - 1], degree: g.degree, deduction: g.deduction, group: m[1] === 's' ? 'تجاه الهيئة التعليمية والإدارية' : g.title };
  }
  function degBadge(x) { return '<span class="cd-deg" style="--c:' + DEG_COLORS[x.degree] + '">الدرجة ' + ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'][x.degree] + ' · ' + x.deduction + '</span>'; }
  function hl(text) {
    var t = C.esc(text);
    if (!st.q) return t;
    var q = C.esc(st.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp(q, 'g'), '<mark>$&</mark>');
  }

  function mount() {
    v = document.getElementById('view-conduct');
    v.addEventListener('click', onClick);
    v.addEventListener('input', function (e) { if (e.target.id === 'cdSearch') { st.q = e.target.value.trim(); renderBody(); } });
    render();
  }

  /* ---------------------------- أجزاء النص الرسمي ---------------------------- */
  function gradingHTML() {
    var g = D.grading;
    return '<div class="cd-grading"><p class="cd-lead">' + hl(g.intro) + '</p><div class="cd-bars">' +
      '<div class="cd-bar pos" style="flex:' + g.positive.points + '"><b>' + d(g.positive.points) + '</b><span>' + g.positive.title + '</span></div>' +
      '<div class="cd-bar exc" style="flex:' + g.excellent.points + '"><b>' + d(g.excellent.points) + '</b><span>' + g.excellent.title + '</span></div></div>' +
      '<div class="cd-two"><div><h4>أ/ ' + g.positive.title + ' (' + d(g.positive.points) + ' درجة)</h4><ul>' + g.positive.items.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ul></div>' +
      '<div><h4>ب/ ' + g.excellent.title + ' (' + d(g.excellent.points) + ' درجة)</h4><ul>' + g.excellent.items.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="cd-two"><div><h4>فرص التعويض</h4><ul>' + g.compensation.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ul></div>' +
      '<div><h4>آلية التوثيق</h4><ul>' + g.documentation.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ul></div></div></div>';
  }
  function excellentHTML(onlyFirst) {
    var e = D.excellent;
    if (onlyFirst) return practiceHTML(e.practices[0]);
    return '<div class="cd-exc"><p class="cd-lead">' + hl(e.intro) + '</p><h4>موضوعات السلوك المتميز المقترحة</h4><div class="cd-topics">' +
      e.topics.map(function (t) { return '<span>' + hl(t) + '</span>'; }).join('') + '</div>' +
      '<h4>ممارسات السلوك المتميز المقترحة (فرص التعويض)</h4>' + e.practices.map(practiceHTML).join('') +
      '<p class="cd-note">◄ ' + hl(e.note) + '</p></div>';
  }
  function practiceHTML(p) {
    return '<div class="cd-practice"><ul>' + p.items.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ul><span>' + hl(p.points) + '</span></div>';
  }
  function measuresHTML() {
    return '<div class="cd-measures">' + D.measures.map(function (m) {
      return '<div><h4>' + hl(m.title) + '</h4><ul>' + m.items.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div><p class="cd-note">«' + hl(D.measuresNote) + '»</p>';
  }
  function degreesHTML(list, title) {
    return (title ? '<h3 class="cd-h">' + title + '</h3>' : '') + '<div class="cd-degrees">' + list.map(function (g) {
      return '<div class="cd-col" style="--c:' + DEG_COLORS[g.degree] + '"><h4>' + g.title + '</h4><ol>' +
        g.items.map(function (i) { return '<li>' + hl(i) + '</li>'; }).join('') + '</ol><span class="cd-ded">' + g.deduction + '</span></div>';
    }).join('') + '</div>';
  }
  function fullHTML() {
    return '<div class="cd-full">' + '<h3 class="cd-h">تقييم السلوك</h3>' + gradingHTML() +
      degreesHTML(D.degrees, 'مشكلات السلوك ودرجاتها') +
      degreesHTML(D.staff.map(function (s) { return Object.assign({}, s, { title: 'تجاه الهيئة التعليمية والإدارية — ' + s.title }); }), 'مشكلات الطلبة تجاه الهيئة التعليمية والإدارية') +
      '<h3 class="cd-h">من أبرز الإجراءات التربوية العلاجية المستخدمة للمشكلات السلوكية</h3>' + measuresHTML() +
      '<h3 class="cd-h">السلوك المتميز</h3>' + excellentHTML() + '</div>';
  }

  /* ---------------------------- قسم مبسّط ---------------------------- */
  function sectionHTML(sec) {
    var custom = (S.state.conduct.custom || {})[sec.id];
    var html = '<article class="cd-section"><div class="cd-sec-head"><span class="cd-sec-icon">' + (I[sec.icon] || I.conduct) + '</span><h2>' + sec.title + '</h2></div>';
    if (sec.summary) html += '<p class="cd-summary">' + hl(sec.summary) + '</p>';
    if (sec.pending && !custom) html += '<div class="cd-pending">' + I.alert + '<div><b>بانتظار إدخال النص الرسمي</b><span>لا تتضمن اللوحة الموجزة المعتمدة تفاصيل هذا القسم. تُضيفه الإدارة من الإعدادات نقلًا عن الدليل الكامل لقواعد السلوك والمواظبة (' + D.edition + ').</span></div></div>';
    if (custom) html += '<div class="cd-custom"><h4>من الدليل الرسمي (أدخلته الإدارة)</h4><p>' + hl(custom).replace(/\n/g, '<br>') + '</p></div>';
    var refs = (sec.refs || []).map(ref).filter(Boolean);
    if (refs.length) html += '<h4 class="cd-from">من النص الرسمي</h4><ul class="cd-refs">' + refs.map(function (r) {
      return '<li style="--c:' + DEG_COLORS[r.degree] + '"><p>' + hl(r.text) + '</p>' + degBadge(r) + '</li>'; }).join('') + '</ul>';
    (sec.extra || []).forEach(function (x) {
      if (x === 'grading') html += gradingHTML();
      if (x === 'excellent') html += excellentHTML();
      if (x === 'excellent:0') html += '<h4 class="cd-from">من السلوك المتميز</h4>' + excellentHTML(true);
      if (x === 'measures') html += measuresHTML();
    });
    return html + '</article>';
  }

  /* ---------------------------- البحث ---------------------------- */
  function searchHTML() {
    var q = st.q, hits = [];
    D.degrees.concat(D.staff.map(function (s) { return Object.assign({}, s, { title: 'تجاه الهيئة التعليمية — ' + s.title }); })).forEach(function (g) {
      g.items.forEach(function (i) { if (i.indexOf(q) > -1) hits.push('<li style="--c:' + DEG_COLORS[g.degree] + '"><p>' + hl(i) + '</p><span class="cd-deg" style="--c:' + DEG_COLORS[g.degree] + '">' + g.title + ' · ' + g.deduction + '</span></li>'); });
    });
    D.measures.forEach(function (m) { m.items.forEach(function (i) { if (i.indexOf(q) > -1) hits.push('<li><p>' + hl(i) + '</p><span class="cd-deg">إجراء تربوي: ' + m.title + '</span></li>'); }); });
    D.excellent.practices.forEach(function (p) { p.items.forEach(function (i) { if (i.indexOf(q) > -1) hits.push('<li><p>' + hl(i) + '</p><span class="cd-deg">سلوك متميز · ' + p.points + '</span></li>'); }); });
    D.excellent.topics.forEach(function (t) { if (t.indexOf(q) > -1) hits.push('<li><p>' + hl(t) + '</p><span class="cd-deg">موضوع سلوك متميز</span></li>'); });
    var g = D.grading; [g.intro].concat(g.positive.items, g.excellent.items, g.compensation, g.documentation).forEach(function (i) { if (i.indexOf(q) > -1) hits.push('<li><p>' + hl(i) + '</p><span class="cd-deg">تقييم السلوك</span></li>'); });
    Object.keys(S.state.conduct.custom || {}).forEach(function (k) {
      var txt = S.state.conduct.custom[k]; if (txt && txt.indexOf(q) > -1) hits.push('<li><p>' + hl(txt.slice(0, 300)) + '</p><span class="cd-deg">نص أدخلته الإدارة</span></li>');
    });
    return '<div class="cd-search-res"><h3 class="cd-h">نتائج البحث عن «' + C.esc(q) + '»: ' + d(hits.length) + '</h3>' +
      (hits.length ? '<ul class="cd-refs">' + hits.join('') + '</ul>' : '<p class="muted">لا توجد نتائج</p>') + '</div>';
  }

  function render() {
    if (!v) return;
    v.innerHTML = '<div class="pg cd-layout">' +
      '<div class="panel cd-top"><div class="cd-title"><h2>' + I.conduct + 'قواعد السلوك والمواظبة</h2><span class="cd-src">' + C.esc(D.source) + ' — ' + C.esc(D.edition) + '</span></div>' +
      '<label class="cd-search">' + I.search + '<input id="cdSearch" type="search" placeholder="ابحث داخل القواعد… مثل: التأخر، الجوال، التنمر" value="' + C.esc(st.q) + '"></label>' +
      '<button class="btn' + (st.full ? ' on' : '') + '" data-cd-full>' + I.list + 'النص الرسمي الكامل</button>' +
      '<button class="btn" data-cd-slides>' + I.slides + 'شرائح توعوية</button></div>' +
      '<nav class="panel cd-nav">' + D.sections.map(function (s) {
        return '<button data-cd-sec="' + s.id + '" class="' + (!st.full && !st.q && st.section === s.id ? 'active' : '') + '">' + (I[s.icon] || I.conduct) + '<span>' + s.title + '</span>' + (s.pending && !(S.state.conduct.custom || {})[s.id] ? '<i class="cd-dot" title="بانتظار النص الرسمي"></i>' : '') + '</button>';
      }).join('') + '<p class="cd-disc">' + C.esc(D.disclaimer) + '</p></nav>' +
      '<div class="panel pg-main"><div class="pg-body" id="cdBody"></div></div></div>';
    renderBody();
  }
  function renderBody() {
    var body = document.getElementById('cdBody'); if (!body) return;
    if (st.q) body.innerHTML = searchHTML();
    else if (st.full) body.innerHTML = fullHTML();
    else body.innerHTML = sectionHTML(D.sections.filter(function (s) { return s.id === st.section; })[0]);
    v.querySelectorAll('[data-cd-sec]').forEach(function (b) { b.classList.toggle('active', !st.full && !st.q && b.dataset.cdSec === st.section); });
  }

  function slideHTML(sec) {
    var refs = (sec.refs || []).map(ref).filter(Boolean).slice(0, 3);
    return '<div class="sl sl-conduct"><div class="sl-col"><div class="sl-icon">' + (I[sec.icon] || I.conduct) + '</div>' +
      '<div class="sl-kicker">قواعد السلوك والمواظبة</div><h2 class="sl-title">' + sec.title + '</h2>' +
      (sec.summary ? '<p class="sl-text">' + C.esc(sec.summary) + '</p>' : '') +
      (refs.length ? '<ul class="sl-refs">' + refs.map(function (r) { return '<li style="--c:' + DEG_COLORS[r.degree] + '">' + C.esc(r.text) + ' <span>' + r.deduction + '</span></li>'; }).join('') + '</ul>' : '') +
      '<div class="sl-foot"><span>' + C.esc(D.source) + ' — ' + C.esc(D.edition) + '</span></div></div></div>';
  }
  function startSlides(seconds) {
    var secs = D.sections.filter(function (s) { return s.summary; });
    root.FakiehSlides.open(secs.map(slideHTML), { seconds: seconds || S.state.conduct.slideSeconds || 15, owner: 'conduct' });
  }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cdSec) { st.section = b.dataset.cdSec; st.full = false; st.q = ''; var s = document.getElementById('cdSearch'); if (s) s.value = ''; renderBody(); }
    if (b.dataset.cdFull !== undefined) { st.full = !st.full; st.q = ''; render(); }
    if (b.dataset.cdSlides !== undefined) startSlides();
  }

  root.FakiehConduct = { mount: mount, render: render, startSlides: startSlides };
})(window);
