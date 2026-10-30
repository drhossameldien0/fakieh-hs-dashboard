/* =========================================================================
   تبويب الأمن والسلامة المدرسية
   ========================================================================= */
(function (root) {
  'use strict';
  var S = root.FakiehStore, C = root.FakiehContent, I = root.FakiehIcons, T = root.FakiehTime;
  var images = {};   // topicId -> objectURL
  var v;

  function topics() { return root.FAKIEH_SAFETY || []; }
  function cfg() { return S.state.safety; }

  function loadImages() {
    topics().forEach(function (t) {
      if (!cfg().images[t.id] || images[t.id]) return;
      S.files.get('safety-img:' + t.id).then(function (b) { if (b) { images[t.id] = URL.createObjectURL(b); render(); } }).catch(function () {});
    });
  }

  function mount() {
    v = document.getElementById('view-safety');
    v.addEventListener('click', onClick);
    loadImages();
    render();
  }

  function field(label, value, placeholder) {
    return '<div class="sf-field"><span>' + label + '</span>' + (value ? '<p>' + C.esc(value).replace(/\n/g, '<br>') + '</p>' : '<p class="sf-empty">' + placeholder + '</p>') + '</div>';
  }

  function infoHTML() {
    var c = cfg();
    var contacts = (c.contacts || []).filter(function (x) { return x.label || x.number; });
    return '<div class="panel sf-info">' +
      '<div class="panel-head"><h2>' + I.siren + ' معلومات الطوارئ في المدرسة</h2>' +
      (c.approved ? '<span class="oc-ver v-official">اعتمدها مسؤول الأمن والسلامة</span>' : '<span class="oc-ver v-needs-review">بانتظار مراجعة مسؤول الأمن والسلامة</span>') + '</div>' +
      '<div class="sf-grid">' +
      field('مسارات الإخلاء', c.evacuation, 'تُدخلها إدارة الأمن والسلامة من الإعدادات') +
      field('نقاط التجمع', c.assembly, 'تُدخلها إدارة الأمن والسلامة من الإعدادات') +
      field('مسؤول الأمن والسلامة', c.officer, 'يُدخل من الإعدادات') +
      '<div class="sf-field"><span>أرقام التواصل الداخلية</span>' + (contacts.length ? '<ul class="sf-contacts">' + contacts.map(function (x) {
        return '<li>' + C.esc(x.label) + ' <b dir="ltr">' + C.esc(x.number) + '</b></li>'; }).join('') + '</ul>' : '<p class="sf-empty">تُدخل من الإعدادات</p>') + '</div>' +
      '</div>' +
      '<div class="sf-nums">' + (root.FAKIEH_EMERGENCY_NUMBERS || []).map(function (n) {
        return '<div><b>' + T.digits(n.number, S.state.visual.digits) + '</b><span>' + n.label + '</span></div>'; }).join('') + '</div></div>';
  }

  function render() {
    if (!v) return;
    v.innerHTML = '<div class="pg sf-layout">' + infoHTML() +
      '<div class="panel pg-main"><div class="pg-toolbar"><h2 class="pg-title">' + I.shield + 'الأمن والسلامة المدرسية</h2><span class="az-spacer"></span>' +
      '<span class="muted sf-hint">اضغط على أي بطاقة لعرضها بملء الشاشة</span>' +
      '<button class="btn" data-sf-slides>' + I.slides + 'عرض الشرائح التوعوية</button></div>' +
      '<div class="pg-body"><div class="sf-cards">' + topics().map(function (t, i) {
        return '<button class="sf-card" data-sf-open="' + i + '" style="--c:' + t.color + '">' +
          (images[t.id] ? '<img src="' + images[t.id] + '" alt="">' : '') +
          '<span class="sf-icon">' + (I[t.icon] || I.shield) + '</span><h3>' + C.esc(t.title) + '</h3>' +
          '<ul>' + t.points.slice(0, 3).map(function (p) { return '<li>' + C.esc(p) + '</li>'; }).join('') + '</ul>' +
          (t.points.length > 3 ? '<span class="sf-more">+ ' + T.digits(t.points.length - 3, S.state.visual.digits) + ' تعليمات</span>' : '') + '</button>';
      }).join('') + '</div></div></div></div>';
  }

  function slideHTML(t) {
    return '<div class="sl sl-safety" style="--c:' + t.color + '">' +
      (images[t.id] ? '<img class="sl-poster" src="' + images[t.id] + '" alt="">' : '') +
      '<div class="sl-col"><div class="sl-icon">' + (I[t.icon] || I.shield) + '</div><h2 class="sl-title">' + C.esc(t.title) + '</h2>' +
      '<ol class="sl-points">' + t.points.map(function (p) { return '<li>' + C.esc(p) + '</li>'; }).join('') + '</ol>' +
      (t.id === 'evacuation' && cfg().assembly ? '<div class="sl-note">نقطة التجمع: ' + C.esc(cfg().assembly) + '</div>' : '') +
      '</div></div>';
  }
  function startSlides(start, seconds) {
    root.FakiehSlides.open(topics().map(slideHTML), { seconds: seconds || cfg().slideSeconds || 15, owner: 'safety', start: start || 0 });
  }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sfOpen !== undefined) startSlides(+b.dataset.sfOpen);
    if (b.dataset.sfSlides !== undefined) startSlides(0);
  }

  root.FakiehSafety = {
    mount: mount, render: render, startSlides: startSlides,
    refresh: function () { loadImages(); render(); },
    setImage: function (id, blob) { if (images[id]) URL.revokeObjectURL(images[id]); if (blob) images[id] = URL.createObjectURL(blob); else delete images[id]; }
  };
})(window);
