/* =========================================================================
   تبويب الأيام العالمية والمناسبات التعليمية
   ========================================================================= */
(function (root) {
  'use strict';
  var T = root.FakiehTime, S = root.FakiehStore, C = root.FakiehContent, I = root.FakiehIcons, Cal = root.FakiehCalendar;
  var CATS = root.FAKIEH_OCCASION_CATEGORIES, VER = root.FAKIEH_VERIFICATION;
  var st = { view: 'month', y: 0, m: 0, filter: {}, selected: null, todayKey: '' };
  var images = {};   // id -> objectURL
  var v;

  function d(s) { return T.digits(s, S.state.visual.digits); }
  function today() { return T.zonedParts(root.FakiehApp.now(), S.state.timeZone).dateKey; }
  function visible(o) { return !st.filter[o.category]; }

  /** كل المناسبات الواقعة في سنة ميلادية معينة */
  function inYear(y) {
    return C.occasionsList().filter(visible).map(function (o) {
      var k = o.date ? (o.date.slice(0, 4) === String(y) ? o.date : null) : (o.month && o.day ? Cal.key(y, o.month, o.day) : null);
      return k ? Object.assign({}, o, { dateKey: k }) : null;
    }).filter(Boolean);
  }
  function byDate(list) { var m = {}; list.forEach(function (o) { (m[o.dateKey] = m[o.dateKey] || []).push(o); }); return m; }

  function loadImages() {
    C.occasionsList().forEach(function (o) {
      if (!o.hasImage || images[o.id]) return;
      S.files.get('occ-img:' + o.id).then(function (b) { if (b) { images[o.id] = URL.createObjectURL(b); if (v && v.classList.contains('active')) render(); } }).catch(function () {});
    });
  }

  function mount() {
    v = document.getElementById('view-occasions');
    var t = today().split('-'); st.y = +t[0]; st.m = +t[1];
    v.addEventListener('click', onClick);
    loadImages();
    render();
  }

  function countdownBlock(o) {
    var n = o.inDays;
    if (n === 0) return '<div class="oc-count today"><b>اليوم</b></div>';
    return '<div class="oc-count"><b>' + d(n) + '</b><span>' + (n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? 'أيام' : 'يومًا') + '</span><small>متبقٍ</small></div>';
  }
  function remindBadge(o) {
    var r = S.state.occasions.remindDays;
    return r.indexOf(o.inDays) > -1 || o.inDays === 0 ? '<span class="oc-remind">' + I.alert + (o.inDays === 0 ? 'اليوم' : 'تنبيه: ' + d(C.daysLabel(o.inDays))) + '</span>' : '';
  }
  function catChip(o) { var c = CATS[o.category] || CATS.school; return '<span class="oc-cat" style="--c:' + c.color + '">' + c.label + '</span>'; }
  function verChip(o) { return '<span class="oc-ver v-' + (o.verification || 'needs-review') + '">' + C.esc(VER[o.verification] || 'بحاجة لمراجعة') + '</span>'; }

  function heroHTML(o) {
    if (!o) return '<div class="oc-hero panel"><p class="muted">لا توجد مناسبات قادمة ضمن التصنيفات المختارة</p></div>';
    var c = CATS[o.category] || CATS.school;
    return '<div class="oc-hero panel" style="--c:' + c.color + '">' +
      '<div class="oc-hero-top"><span class="oc-hero-label">' + (st.selected ? 'المناسبة المختارة' : 'المناسبة القادمة') + '</span>' + catChip(o) + '</div>' +
      (images[o.id] ? '<img class="oc-hero-img" src="' + images[o.id] + '" alt="">' : '<div class="oc-hero-icon">' + I.occasions + '</div>') +
      '<h2 class="oc-hero-name">' + C.esc(o.name) + '</h2>' +
      '<div class="oc-hero-dates"><span>' + C.gregorian(o.dateKey) + ' م</span><span>' + C.hijri(o.dateKey) + '</span></div>' +
      countdownBlock(o) + remindBadge(o) +
      (o.description ? '<p class="oc-hero-desc">' + C.esc(o.description) + '</p>' : '') +
      '<div class="oc-hero-meta">' + verChip(o) +
      '<span>المصدر: ' + (o.sourceUrl ? '<a href="' + C.esc(o.sourceUrl) + '" target="_blank" rel="noopener">' + C.esc(o.source || 'رابط') + '</a>' : C.esc(o.source || '—')) + '</span>' +
      '<span>آخر تحديث: ' + d(o.lastUpdated || '—') + '</span></div></div>';
  }

  function toolbar() {
    var views = [['month', 'شهري'], ['year', 'سنوي'], ['cards', 'المناسبات القريبة']];
    return '<div class="pg-toolbar">' +
      '<div class="seg">' + views.map(function (x) { return '<button data-oc-view="' + x[0] + '" class="' + (st.view === x[0] ? 'active' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="oc-filters">' + Object.keys(CATS).map(function (k) {
        return '<button class="oc-filter' + (st.filter[k] ? ' off' : '') + '" data-oc-filter="' + k + '" style="--c:' + CATS[k].color + '"><i></i>' + CATS[k].label + '</button>';
      }).join('') + '</div>' +
      '<span class="az-spacer"></span>' +
      (st.view !== 'cards' ? '<div class="oc-nav"><button class="btn btn-sm" data-oc-nav="-1">' + I.prev + '</button><button class="btn btn-sm" data-oc-nav="0">اليوم</button><button class="btn btn-sm" data-oc-nav="1">' + I.next + '</button></div>' : '') +
      '<button class="btn" data-oc-slides>' + I.slides + 'عرض تلقائي</button></div>';
  }

  function monthHTML() {
    var map = byDate(inYear(st.y));
    return '<h3 class="cal-title">' + Cal.monthTitle(st.y, st.m) + '</h3>' + Cal.month(st.y, st.m, st.todayKey, function (k) {
      var list = map[k]; if (!list) return null;
      return { cls: 'has', title: list.map(function (o) { return o.name; }).join('، '),
        html: list.map(function (o) { return '<button class="cal-ev" data-oc-pick="' + o.id + '|' + k + '" style="--c:' + (CATS[o.category] || CATS.school).color + '">' + C.esc(o.name) + '</button>'; }).join('') };
    });
  }

  function yearHTML() {
    var map = byDate(inYear(st.y)), html = '<h3 class="cal-title">' + d(st.y) + ' م</h3><div class="oc-year">';
    for (var m = 1; m <= 12; m++) {
      var count = 0;
      var grid = Cal.month(st.y, m, st.todayKey, function (k) {
        var l = map[k]; if (!l) return null; count += l.length;
        return { cls: 'has', title: l.map(function (o) { return o.name; }).join('، '), html: '<i style="--c:' + (CATS[l[0].category] || CATS.school).color + '"></i>' };
      }, { mini: true });
      html += '<div class="oc-mini" data-oc-month="' + m + '"><h4>' + Cal.MONTHS[m - 1] + (count ? ' <span>' + d(count) + '</span>' : '') + '</h4>' + grid + '</div>';
    }
    return html + '</div>';
  }

  function cardsHTML(list) {
    return '<div class="oc-cards">' + list.slice(0, 9).map(function (o) {
      var c = CATS[o.category] || CATS.school;
      return '<button class="oc-card" data-oc-pick="' + o.id + '|' + o.dateKey + '" style="--c:' + c.color + '">' +
        (images[o.id] ? '<img src="' + images[o.id] + '" alt="">' : '') +
        '<div class="oc-card-days"><b>' + (o.inDays === 0 ? 'اليوم' : d(o.inDays)) + '</b>' + (o.inDays ? '<small>يوم</small>' : '') + '</div>' +
        '<div class="oc-card-body">' + catChip(o) + '<h4>' + C.esc(o.name) + '</h4><p>' + C.gregorian(o.dateKey) + ' م — ' + C.hijri(o.dateKey) + '</p>' + remindBadge(o) + '</div></button>';
    }).join('') + '</div>';
  }

  function render() {
    if (!v) return;
    st.todayKey = today();
    var upcoming = C.upcomingOccasions(st.todayKey).filter(visible);
    var hero = null;
    if (st.selected) {
      var p = st.selected.split('|'), o = C.occasionsList().filter(function (x) { return x.id === p[0]; })[0];
      if (o) hero = Object.assign({}, o, { dateKey: p[1], inDays: T.daysBetween(st.todayKey, p[1]) });
    }
    hero = hero || upcoming[0];
    if (hero && hero.inDays < 0) hero.inDays = 0;
    var body = st.view === 'month' ? monthHTML() : st.view === 'year' ? yearHTML() : cardsHTML(upcoming);
    v.innerHTML = '<div class="pg oc-layout">' + heroHTML(hero) + '<div class="panel pg-main">' + toolbar() + '<div class="pg-body">' + body + '</div></div></div>';
  }

  function onClick(e) {
    var b = e.target.closest('button, [data-oc-month]'); if (!b) return;
    var ds = b.dataset;
    if (ds.ocView) { st.view = ds.ocView; render(); }
    else if (ds.ocFilter) { st.filter[ds.ocFilter] = !st.filter[ds.ocFilter]; render(); }
    else if (ds.ocNav !== undefined) {
      var n = +ds.ocNav;
      if (n === 0) { var t = st.todayKey.split('-'); st.y = +t[0]; st.m = +t[1]; st.selected = null; }
      else if (st.view === 'year') st.y += n;
      else { st.m += n; if (st.m < 1) { st.m = 12; st.y--; } if (st.m > 12) { st.m = 1; st.y++; } }
      render();
    }
    else if (ds.ocPick) { st.selected = ds.ocPick; render(); }
    else if (ds.ocMonth) { st.m = +ds.ocMonth; st.view = 'month'; render(); }
    else if (ds.ocSlides !== undefined) startSlides();
  }

  function slideHTML(o) {
    var c = CATS[o.category] || CATS.school;
    return '<div class="sl sl-occ" style="--c:' + c.color + '">' +
      (images[o.id] ? '<img class="sl-img" src="' + images[o.id] + '" alt="">' : '<div class="sl-icon">' + I.occasions + '</div>') +
      '<div class="sl-kicker">' + c.label + '</div><h2 class="sl-title">' + C.esc(o.name) + '</h2>' +
      '<div class="sl-dates">' + C.gregorian(o.dateKey) + ' م &nbsp;•&nbsp; ' + C.hijri(o.dateKey) + '</div>' +
      '<div class="sl-count">' + (o.inDays === 0 ? 'اليوم' : d(C.daysLabel(o.inDays))) + '</div>' +
      (o.description ? '<p class="sl-text">' + C.esc(o.description) + '</p>' : '') +
      '<div class="sl-foot">' + verChip(o) + '<span>المصدر: ' + C.esc(o.source || '—') + '</span></div></div>';
  }
  function slides() { return C.upcomingOccasions(today()).filter(visible).slice(0, 8).map(slideHTML); }
  function startSlides(seconds) {
    var s = slides();
    if (s.length) root.FakiehSlides.open(s, { seconds: seconds || 15, owner: 'occasions' });
  }

  /** تنبيه المناسبات قبل موعدها (مرة واحدة يوميًا لكل مناسبة) */
  function checkReminders(todayKey) {
    var stored = {}; try { stored = JSON.parse(localStorage.getItem('fakieh.occReminded') || '{}'); } catch (e) {}
    if (stored.date !== todayKey) stored = { date: todayKey, ids: [] };
    var due = C.upcomingOccasions(todayKey).filter(function (o) {
      return (o.inDays === 0 || S.state.occasions.remindDays.indexOf(o.inDays) > -1) && stored.ids.indexOf(o.id) === -1;
    });
    if (!due.length) return;
    var o = due[0];
    root.FakiehApp.toast((o.inDays === 0 ? 'اليوم: ' : C.daysLabel(o.inDays) + ': ') + o.name, 9000);
    due.forEach(function (x) { stored.ids.push(x.id); });
    try { localStorage.setItem('fakieh.occReminded', JSON.stringify(stored)); } catch (e) {}
  }

  root.FakiehOccasions = {
    mount: mount, render: render, startSlides: startSlides, checkReminders: checkReminders,
    refresh: function () { loadImages(); render(); },
    setImage: function (id, blob) { if (images[id]) URL.revokeObjectURL(images[id]); if (blob) images[id] = URL.createObjectURL(blob); else delete images[id]; }
  };
})(window);
