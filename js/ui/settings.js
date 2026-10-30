/* =========================================================================
   لوحة الإعدادات (الإدارة) — كل التعديلات تُحفظ فورًا في المتصفح
   ========================================================================= */
(function (root) {
  'use strict';
  var S = root.FakiehStore, T = root.FakiehTime, AU = root.FakiehAudio, C = root.FakiehContent;
  var esc = C.esc;

  var SECTIONS = [
    { id: 'schedule',   label: 'الجدول والتوقيت' },
    { id: 'alerts',     label: 'التنبيهات الصوتية' },
    { id: 'prayer',     label: 'مواقيت الصلاة والأذان' },
    { id: 'azkar',      label: 'الأذكار والأحاديث' },
    { id: 'occasions',  label: 'المناسبات والأيام العالمية' },
    { id: 'academic',   label: 'التقويم الدراسي' },
    { id: 'safety',     label: 'الأمن والسلامة' },
    { id: 'conduct',    label: 'السلوك والمواظبة' },
    { id: 'presentation', label: 'العرض التلقائي' },
    { id: 'ticker',     label: 'الشريط والإعلانات' },
    { id: 'appearance', label: 'المظهر والعرض' },
    { id: 'backup',     label: 'النسخ الاحتياطي والأمان' }
  ];
  var TYPES = { lesson: 'حصة', break: 'استراحة', prayer: 'صلاة', assembly: 'طابور' };
  var KINDS = { warn1: 'التنبيه الأول', warn2: 'التنبيه الثاني', end: 'جرس النهاية' };
  var DAYS = T.WEEKDAY_NAMES;

  var ui = { section: 'schedule', editProfile: null, occEdit: null };
  var root$;

  /* ---------------------------- عناصر النماذج ---------------------------- */
  function toggle(path, label, hint) {
    return '<label class="f-toggle"><input type="checkbox" data-path="' + path + '"' + (S.get(path) ? ' checked' : '') + '><span class="sw"></span><span>' + label +
      (hint ? '<small>' + hint + '</small>' : '') + '</span></label>';
  }
  function number(path, label, min, max, step, suffix) {
    return '<label class="f-field"><span>' + label + '</span><span class="f-inline"><input type="number" data-path="' + path + '" data-num value="' + S.get(path) +
      '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '">' + (suffix ? '<em>' + suffix + '</em>' : '') + '</span></label>';
  }
  function range(path, label, min, max, step, fmt) {
    var v = S.get(path);
    return '<label class="f-field"><span>' + label + ' <b class="f-val" data-val-for="' + path + '">' + (fmt ? fmt(v) : v) + '</b></span><input type="range" data-path="' + path +
      '" data-num value="' + v + '" min="' + min + '" max="' + max + '" step="' + step + '"' + (fmt ? ' data-fmt="pct"' : '') + '></label>';
  }
  function select(path, label, options, num) {
    var v = S.get(path);
    return '<label class="f-field"><span>' + label + '</span><select data-path="' + path + '"' + (num ? ' data-num' : '') + '>' + Object.keys(options).map(function (k) {
      return '<option value="' + k + '"' + (String(v) === String(k) ? ' selected' : '') + '>' + options[k] + '</option>';
    }).join('') + '</select></label>';
  }
  function text(path, label) {
    return '<label class="f-field"><span>' + label + '</span><input type="text" data-path="' + path + '" value="' + esc(S.get(path)) + '"></label>';
  }
  function color(path, label) {
    return '<label class="f-field f-color"><span>' + label + '</span><input type="color" data-path="' + path + '" value="' + S.get(path) + '"></label>';
  }
  function card(title, body, note) {
    return '<section class="s-card"><h3>' + title + '</h3>' + (note ? '<p class="s-note">' + note + '</p>' : '') + body + '</section>';
  }
  function pct(v) { return Math.round(v * 100) + '%'; }

  /* ---------------------------- الأقسام ---------------------------- */
  var render = {};

  render.schedule = function () {
    var sc = S.state.schedule, profiles = sc.profiles;
    var ep = ui.editProfile && profiles[ui.editProfile] ? ui.editProfile : sc.activeProfile;
    ui.editProfile = ep;
    var profOpts = {}; Object.keys(profiles).forEach(function (k) { profOpts[k] = profiles[k].name; });
    var rows = profiles[ep].periods.map(function (p, i) {
      return '<tr>' +
        '<td><input type="text" data-coll="period" data-i="' + i + '" data-f="name" value="' + esc(p.name) + '"></td>' +
        '<td><select data-coll="period" data-i="' + i + '" data-f="type">' + Object.keys(TYPES).map(function (t) { return '<option value="' + t + '"' + (p.type === t ? ' selected' : '') + '>' + TYPES[t] + '</option>'; }).join('') + '</select></td>' +
        '<td><input type="time" data-coll="period" data-i="' + i + '" data-f="start" value="' + p.start + '"></td>' +
        '<td><input type="time" data-coll="period" data-i="' + i + '" data-f="end" value="' + p.end + '"></td>' +
        '<td class="c"><input type="checkbox" data-coll="period" data-i="' + i + '" data-f="international"' + (p.international ? ' checked' : '') + '></td>' +
        '<td class="c"><input type="checkbox" data-coll="period" data-i="' + i + '" data-f="enabled"' + (p.enabled !== false ? ' checked' : '') + '></td>' +
        '<td class="c"><button class="btn btn-sm btn-danger" data-action="del-period" data-i="' + i + '">حذف</button></td></tr>';
    }).join('');
    var warnings = T.validatePeriods(profiles[ep].periods);
    var hol = (sc.holidays || []).map(function (h, i) {
      return '<tr><td><input type="text" data-coll="holiday" data-i="' + i + '" data-f="name" value="' + esc(h.name) + '" placeholder="اسم الإجازة"></td>' +
        '<td><input type="date" data-coll="holiday" data-i="' + i + '" data-f="from" value="' + (h.from || '') + '"></td>' +
        '<td><input type="date" data-coll="holiday" data-i="' + i + '" data-f="to" value="' + (h.to || '') + '"></td>' +
        '<td class="c"><button class="btn btn-sm btn-danger" data-action="del-holiday" data-i="' + i + '">حذف</button></td></tr>';
    }).join('');

    return card('التوقيت المعتمد',
        '<div class="f-grid">' + select('schedule.activeProfile', 'التوقيت المستخدم الآن', profOpts) +
        toggle('schedule.showInternational', 'إظهار الحصة الثامنة (القسم الدولي)', 'عند الإخفاء تنتهي الحصص بعد الصلاة') + '</div>') +
      card('أيام الدراسة',
        '<div class="f-days">' + DAYS.map(function (n, i) {
          return '<label class="f-chip"><input type="checkbox" data-action="day" value="' + i + '"' + (sc.schoolDays.indexOf(i) > -1 ? ' checked' : '') + '><span>' + n + '</span></label>';
        }).join('') + '</div>', 'لا تعمل التنبيهات الصوتية إلا في أيام الدراسة المحددة هنا وخارج الإجازات.') +
      card('تعديل جدول الحصص',
        '<div class="f-row">' + select('__editProfile', 'الجدول الذي تعدّله', profOpts) +
        '<button class="btn" data-action="copy-profile">نسخ الشتوي إلى الصيفي</button></div>' +
        (warnings.length ? '<div class="s-warn">' + warnings.map(esc).join('<br>') + '</div>' : '<div class="s-ok">الجدول سليم: لا يوجد تداخل بين الفترات</div>') +
        '<div class="t-wrap"><table class="s-table"><thead><tr><th>الفترة</th><th>النوع</th><th>من</th><th>إلى</th><th>دولي</th><th>مفعّلة</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<button class="btn" data-action="add-period">+ إضافة فترة</button>',
        'الأوقات تُحفظ كما تُدخل تمامًا دون أي تعديل تلقائي. الفواصل بين الحصص تُحسب تلقائيًا من الفراغ بين نهاية فترة وبداية التي تليها.') +
      card('الإجازات والأيام المستثناة',
        '<div class="t-wrap"><table class="s-table"><thead><tr><th>الاسم</th><th>من</th><th>إلى</th><th></th></tr></thead><tbody>' + (hol || '<tr><td colspan="4" class="muted">لا توجد إجازات مسجلة</td></tr>') + '</tbody></table></div>' +
        '<button class="btn" data-action="add-holiday">+ إضافة إجازة</button>',
        'أدخل الإجازات الرسمية من التقويم المعتمد لوزارة التعليم فقط.');
  };

  render.alerts = function () {
    var a = S.state.alerts;
    var soundOpts = {}; Object.keys(AU.BUILTIN).forEach(function (k) { soundOpts[k] = AU.BUILTIN[k].label; }); soundOpts.custom = 'ملف مرفوع (MP3/WAV)';
    var kinds = Object.keys(KINDS).map(function (k) {
      return '<div class="s-sound">' +
        '<b>' + KINDS[k] + '</b>' + select('alerts.sounds.' + k, 'الصوت', soundOpts) +
        '<label class="btn btn-sm f-file">رفع ملف<input type="file" accept="audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav" data-action="upload" data-kind="' + k + '"></label>' +
        '<span class="muted" data-file-status="' + k + '">' + (a.sounds[k] === 'custom' ? (AU.hasCustom(k) ? 'ملف محمّل' : 'لم يُرفع ملف بعد') : '') + '</span>' +
        '<button class="btn btn-sm" data-action="test" data-kind="' + k + '">تجربة</button></div>';
    }).join('');
    return card('التحكم العام',
        '<div class="f-row"><button class="btn btn-gold" data-action="unlock">تفعيل الصوت</button>' +
        '<span class="s-pill ' + (AU.isUnlocked() ? 'ok' : '') + '">' + (AU.isUnlocked() ? 'الصوت مسموح في المتصفح' : 'الصوت غير مفعّل بعد — اضغط الزر') + '</span>' +
        '<button class="btn" data-action="test" data-kind="end">جرس تجريبي لاختبار السماعات</button></div>' +
        '<div class="f-grid">' + toggle('alerts.enabled', 'تشغيل التنبيهات الصوتية') + range('alerts.volume', 'مستوى الصوت', 0, 1, 0.05, pct) + '</div>') +
      card('مواعيد التنبيه',
        '<div class="f-grid">' +
        toggle('alerts.warn1Enabled', 'التنبيه الأول قبل النهاية') + number('alerts.warn1Minutes', 'قبل النهاية بـ', 1, 30, 1, 'دقيقة') +
        toggle('alerts.warn2Enabled', 'التنبيه الثاني قبل النهاية') + number('alerts.warn2Minutes', 'قبل النهاية بـ', 1, 10, 1, 'دقيقة') +
        toggle('alerts.endEnabled', 'جرس عند نهاية الفترة') + number('alerts.graceSeconds', 'تجاهل التنبيه إن تأخر أكثر من', 2, 60, 1, 'ثانية') +
        '</div><h4>الفترات التي تُطلق لها التنبيهات</h4><div class="f-days">' + Object.keys(TYPES).map(function (t) {
          return '<label class="f-chip"><input type="checkbox" data-path="alerts.periodTypes.' + t + '"' + (a.periodTypes[t] ? ' checked' : '') + '><span>' + TYPES[t] + '</span></label>';
        }).join('') + '</div>') +
      card('أصوات التنبيهات', kinds, 'يُحفظ الملف المرفوع داخل المتصفح على هذا الجهاز فقط (لا يُرفع لأي خادم). يفضّل ملف قصير (أقل من 10 ثوانٍ).') +
      card('متطلبات التشغيل الموثوق',
        '<ul class="s-list">' +
        '<li>يجب الضغط على «تفعيل الصوت» مرة بعد كل فتح للصفحة؛ هذا قيد أمني في المتصفحات.</li>' +
        '<li>لا يمكن ضمان رنين الجرس إذا نام الجهاز أو أُغلق المتصفح أو صُغّرت النافذة لفترة طويلة.</li>' +
        '<li>اضبط إعدادات الطاقة في Windows على «عدم السكون أبدًا» وأبقِ الشاشة والسماعات تعمل.</li>' +
        '<li>يطلب التطبيق إبقاء الشاشة نشطة (Wake Lock) عند دعم المتصفح لذلك، لكنه لا يغني عن ضبط Windows.</li>' +
        '<li>للتشغيل الآلي دون ضغط: شغّل Chrome بالخيار <code>--autoplay-policy=no-user-gesture-required</code> (موضّح في دليل التشغيل).</li>' +
        '</ul>');
  };

  render.azkar = function () {
    var ov = S.state.contentOverrides;
    function rows(list, kind) {
      return list.map(function (z) {
        var o = (ov[kind] || {})[z.id] || {};
        return '<tr><td><div class="s-clip">' + esc(z.title ? z.title + ' — ' : '') + esc(z.text) + '</div><small class="muted">' + esc(z.source) + (z.grade ? ' · ' + esc(z.grade) : '') + '</small></td>' +
          (kind === 'azkar' ? '<td class="c">' + ({ morning: 'صباح', evening: 'مساء', selected: 'مختارة' })[z.category] + '</td>' : '<td class="c">' + esc(z.topic) + '</td>') +
          '<td class="c"><input type="checkbox" data-coll="ov" data-kind="' + kind + '" data-id="' + z.id + '" data-f="active"' + (o.active !== false ? ' checked' : '') + '></td>' +
          '<td class="c"><input type="checkbox" data-coll="ov" data-kind="' + kind + '" data-id="' + z.id + '" data-f="approved"' + (o.approved ? ' checked' : '') + '></td></tr>';
      }).join('');
    }
    var head = '<thead><tr><th>النص والمصدر</th><th>القسم</th><th>عرض</th><th>اعتمدته الإدارة</th></tr></thead>';
    return card('عرض الأذكار',
        '<div class="f-grid">' + toggle('azkar.enabled', 'تفعيل الأذكار') +
        select('azkar.slideSeconds', 'مدة عرض الذكر في تبويب الأذكار', { 15: '15 ثانية', 20: '20 ثانية', 25: '25 ثانية', 30: '30 ثانية', 45: '45 ثانية', 60: 'دقيقة' }, true) +
        toggle('azkar.autoAdvance', 'الانتقال التلقائي بين الأذكار') +
        toggle('azkar.showOnHomeDuringAssembly', 'عرض أذكار الصباح على الرئيسية أثناء الطابور', 'تظهر في العمود الجانبي دون حجب الساعة والعداد') +
        number('azkar.homeSlideSeconds', 'مدة الذكر على الرئيسية', 8, 60, 1, 'ثانية') +
        toggle('azkar.autoAssemblyMode', 'تشغيل وضع الطابور تلقائيًا عند بداية الطابور', 'ينتقل لشاشة الأذكار الكاملة ثم يعود للتوقيت عند انتهاء الطابور') +
        toggle('azkar.approvedOnly', 'عرض ما اعتمدته الإدارة فقط', 'فعّله بعد مراجعة النصوص من مختص شرعي') + '</div>') +
      card('مراجعة الأذكار (' + root.FAKIEH_AZKAR.length + ')', '<div class="t-wrap t-tall"><table class="s-table">' + head + '<tbody>' + rows(root.FAKIEH_AZKAR, 'azkar') + '</tbody></table></div>',
        'النصوص مأخوذة من مصادرها المذكورة. يُرجى مراجعتها من مختص شرعي ثم تعليم «اعتمدته الإدارة». لإضافة ذكر جديد عدّل الملف js/data/azkar.js مع ذكر مصدره.') +
      card('مراجعة الأحاديث (' + root.FAKIEH_HADITH.length + ')', '<div class="t-wrap t-tall"><table class="s-table">' + head + '<tbody>' + rows(root.FAKIEH_HADITH, 'hadith') + '</tbody></table></div>');
  };

  render.occasions = function () {
    var cats = root.FAKIEH_OCCASION_CATEGORIES, ver = root.FAKIEH_VERIFICATION;
    var list = C.occasionsList();
    var catOpts = Object.keys(cats).map(function (k) { return [k, cats[k].label]; });
    var rows = list.map(function (o) {
      var when = o.date ? o.date : T.pad(o.day) + '/' + T.pad(o.month) + ' (سنويًا)';
      return '<tr><td><span class="cat-dot" style="--c:' + (cats[o.category] || cats.school).color + '"></span>' + esc(o.name) + '</td><td class="c num">' + when + '</td>' +
        '<td class="c">' + (cats[o.category] || {}).label + '</td><td><small>' + esc(ver[o.verification] || o.verification) + '</small></td>' +
        '<td class="c nowrap"><button class="btn btn-sm" data-action="occ-edit" data-id="' + o.id + '">تعديل</button> <button class="btn btn-sm btn-danger" data-action="occ-del" data-id="' + o.id + '">حذف</button></td></tr>';
    }).join('');
    var form = '';
    if (ui.occEdit) {
      var o = ui.occEdit === 'new' ? { id: '', name: '', category: 'school', month: '', day: '', date: '', description: '', source: '', sourceUrl: '', verification: 'needs-review' } :
        list.filter(function (x) { return x.id === ui.occEdit; })[0] || {};
      var recurring = !o.date;
      form = '<form class="s-form" id="occForm">' +
        '<h4>' + (ui.occEdit === 'new' ? 'إضافة مناسبة' : 'تعديل مناسبة') + '</h4><div class="f-grid">' +
        '<label class="f-field"><span>اسم المناسبة</span><input name="name" required value="' + esc(o.name) + '"></label>' +
        '<label class="f-field"><span>التصنيف</span><select name="category">' + catOpts.map(function (c) { return '<option value="' + c[0] + '"' + (o.category === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="f-field"><span>التكرار</span><select name="mode"><option value="yearly"' + (recurring ? ' selected' : '') + '>سنويًا (يوم وشهر ميلادي)</option><option value="once"' + (!recurring ? ' selected' : '') + '>مرة واحدة (تاريخ محدد)</option></select></label>' +
        '<label class="f-field"><span>اليوم / الشهر (للسنوي)</span><span class="f-inline"><input name="day" type="number" min="1" max="31" value="' + (o.day || '') + '"><em>/</em><input name="month" type="number" min="1" max="12" value="' + (o.month || '') + '"></span></label>' +
        '<label class="f-field"><span>التاريخ (لمرة واحدة)</span><input name="date" type="date" value="' + (o.date || '') + '"></label>' +
        '<label class="f-field"><span>حالة التحقق</span><select name="verification">' + Object.keys(ver).map(function (k) { return '<option value="' + k + '"' + (o.verification === k ? ' selected' : '') + '>' + ver[k] + '</option>'; }).join('') + '</select></label>' +
        '<label class="f-field"><span>المصدر الرسمي</span><input name="source" value="' + esc(o.source) + '"></label>' +
        '<label class="f-field"><span>رابط المصدر</span><input name="sourceUrl" type="url" dir="ltr" value="' + esc(o.sourceUrl) + '"></label>' +
        '</div><label class="f-field"><span>وصف مختصر</span><textarea name="description" rows="2">' + esc(o.description) + '</textarea></label>' +
        '<div class="f-row" style="margin-top:.6rem"><label class="btn btn-sm f-file">' + (o.hasImage ? 'تغيير الصورة / الشعار' : 'إضافة صورة أو شعار') + '<input type="file" name="image" accept="image/*"></label>' +
        (o.hasImage ? '<label class="f-toggle"><input type="checkbox" name="removeImage"><span class="sw"></span><span>حذف الصورة الحالية</span></label>' : '') + '</div>' +
        '<div class="f-row"><button class="btn btn-gold" type="submit">حفظ</button><button class="btn" type="button" data-action="occ-cancel">إلغاء</button></div></form>';
    }
    return card('التذكير المسبق',
        '<label class="f-field"><span>أيام التذكير قبل المناسبة (مفصولة بفاصلة)</span><input type="text" data-action="remind" value="' + S.state.occasions.remindDays.join('، ') + '"></label>',
        'تظهر المناسبة في الشريط المتحرك وتُميَّز في قائمة المناسبات خلال هذه المدة.') +
      card('قائمة المناسبات (' + list.length + ')',
        form + '<div class="f-row"><button class="btn" data-action="occ-new">+ إضافة مناسبة مدرسية</button>' +
        (S.state.occasions.list ? '<button class="btn" data-action="occ-restore">استعادة القائمة الافتراضية</button>' : '') + '</div>' +
        '<div class="t-wrap t-tall"><table class="s-table"><thead><tr><th>المناسبة</th><th>التاريخ</th><th>التصنيف</th><th>التحقق</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>',
        'القائمة الأولية تحتاج إلى مراجعة: الأيام الدولية معلنة من الأمم المتحدة ومنظماتها، ولا يُعد أيٌّ منها معتمدًا من وزارة التعليم إلا بعد التحقق الرسمي.');
  };

  /* ---------------------------- مواقيت الصلاة والأذان ---------------------------- */
  render.prayer = function () {
    var p = S.state.prayer, P = root.FakiehPrayer;
    var dk = T.zonedParts(root.FakiehApp.now(), S.state.timeZone).dateKey, t = P.timesFor(dk, p);
    var soundOpts = {}; Object.keys(AU.BUILTIN).forEach(function (k) { soundOpts[k] = AU.BUILTIN[k].label; });
    var table = '<div class="t-wrap"><table class="s-table"><thead><tr>' + P.ORDER.map(function (k) { return '<th>' + P.NAMES[k] + '</th>'; }).join('') + '</tr></thead><tbody><tr>' +
      P.ORDER.map(function (k) { return '<td class="c num"><b>' + T.formatHM(t[k], false) + '</b></td>'; }).join('') + '</tr><tr>' +
      P.ORDER.map(function (k) { return '<td class="c"><span class="f-inline"><input type="number" data-path="prayer.offsets.' + k + '" data-num value="' + (p.offsets[k] || 0) + '" min="-30" max="30" style="max-width:5rem"><em>د</em></span></td>'; }).join('') +
      '</tr></tbody></table></div>';
    return card('مواقيت اليوم — ' + esc(p.city) + ' (' + esc(p.method) + ')',
        toggle('prayer.enabled', 'تفعيل مواقيت الصلاة') + table,
        'تُحسب المواقيت فلكيًا داخل الجهاز دون إنترنت بطريقة أم القرى (الفجر 18.5°، العشاء بعد المغرب بـ 90 دقيقة و120 في رمضان). طابقها مع تقويم أم القرى الرسمي، وإن وُجد فرق فاكتب عدد الدقائق في الصف الثاني (موجب للتأخير وسالب للتقديم).') +
      card('إغلاق وتشغيل الأصوات',
        '<div class="f-grid">' + toggle('prayer.preAlertEnabled', 'التنبيه قبل الصلاة', 'إغلاقه يوقف تنبيه ما قبل الأذان فقط') +
        toggle('prayer.adhanEnabled', 'صوت الأذان', 'إغلاقه يكتم الأذان ويبقى إشعار دخول الوقت مكتوبًا على الشاشة') + '</div>',
        'يمكن أيضًا الإغلاق السريع من زرَّي «التنبيه» و«الأذان» في بطاقة مواقيت الصلاة على الشاشة الرئيسية، وزر «إيقاف الأذان» يظهر أثناء تشغيله.') +
      card('الصلوات التي يُنبَّه لها',
        '<div class="f-days">' + ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(function (k) {
          return '<label class="f-chip"><input type="checkbox" data-path="prayer.alertPrayers.' + k + '"' + (p.alertPrayers[k] ? ' checked' : '') + '><span>' + P.NAMES[k] + '</span></label>';
        }).join('') + '</div><div class="f-grid" style="margin-top:1rem">' +
        toggle('prayer.schoolDaysOnly', 'في أيام الدراسة فقط', 'لا يعمل في الإجازات وأيام نهاية الأسبوع') +
        toggle('prayer.showCard', 'إظهار بطاقة المواقيت في الرئيسية') + '</div>') +
      card('التنبيه قبل الصلاة',
        '<div class="f-grid">' + number('prayer.preAlertMinutes', 'قبل الأذان بـ', 1, 30, 1, 'دقيقة') + select('prayer.preAlertSound', 'صوت التنبيه', soundOpts) + '</div>' +
        '<button class="btn btn-sm" data-action="test-prayer-pre">تجربة صوت التنبيه</button>') +
      card('الأذان',
        '<div class="f-grid">' + range('prayer.adhanVolume', 'مستوى صوت الأذان', 0, 1, 0.05, pct) + '</div>' +
        '<div class="f-row" style="margin-top:.8rem"><label class="btn btn-gold f-file">' + (p.hasAdhanFile ? 'تغيير ملف الأذان' : 'رفع ملف الأذان (MP3)') +
        '<input type="file" accept="audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav" data-action="upload-adhan"></label>' +
        '<span class="s-pill ' + (p.hasAdhanFile ? 'ok' : '') + '" data-file-status="adhan">' + (p.hasAdhanFile ? 'ملف الأذان محفوظ' : 'لم يُرفع ملف أذان بعد') + '</span>' +
        '<button class="btn" data-action="test-adhan">تجربة الأذان</button><button class="btn" data-action="stop-adhan">إيقاف</button>' +
        (p.hasAdhanFile ? '<button class="btn btn-danger" data-action="del-adhan">حذف الملف</button>' : '') + '</div>',
        'لا يتضمن التطبيق تسجيلًا للأذان؛ ارفع تسجيلًا تختاره المدرسة. بدون ملف يُعرض إشعار «حان الآن موعد الأذان» مع نغمة تنبيه هادئة.');
  };

  /* ---------------------------- التقويم الدراسي ---------------------------- */
  var ACAD_TYPES = { holiday: 'إجازة', term: 'بداية / نهاية', exam: 'اختبارات', activity: 'نشاط مدرسي' };
  function acadData() { return S.state.academic.data || root.FAKIEH_ACADEMIC; }
  function ensureAcad() { if (!S.state.academic.data) S.state.academic.data = S.clone(root.FAKIEH_ACADEMIC); return S.state.academic.data; }

  render.academic = function () {
    var dt = acadData();
    var rows = dt.events.map(function (e, i) {
      return '<tr><td><input type="text" data-coll="acad" data-i="' + i + '" data-f="name" value="' + esc(e.name) + '"></td>' +
        '<td><select data-coll="acad" data-i="' + i + '" data-f="type">' + Object.keys(ACAD_TYPES).map(function (t) { return '<option value="' + t + '"' + (e.type === t ? ' selected' : '') + '>' + ACAD_TYPES[t] + '</option>'; }).join('') + '</select></td>' +
        '<td><input type="date" data-coll="acad" data-i="' + i + '" data-f="from" value="' + (e.from || '') + '"></td>' +
        '<td><input type="date" data-coll="acad" data-i="' + i + '" data-f="to" value="' + (e.to || '') + '"></td>' +
        '<td><input type="text" data-coll="acad" data-i="' + i + '" data-f="note" value="' + esc(e.note || '') + '" placeholder="ملاحظة"></td>' +
        '<td class="c"><button class="btn btn-sm btn-danger" data-action="del-acad" data-i="' + i + '">حذف</button></td></tr>';
    }).join('');
    function meta(f, label, type) { return '<label class="f-field"><span>' + label + '</span><input type="' + (type || 'text') + '" data-coll="acadmeta" data-f="' + f + '" value="' + esc(dt[f] || '') + '"' + (type === 'url' ? ' dir="ltr"' : '') + '></label>'; }
    return card('حالة الاعتماد',
        '<div class="f-grid">' + toggle('academic.approved', 'تم التحقق من التقويم الرسمي واعتماده', 'لا تفعّله إلا بعد مطابقة كل التواريخ مع موقع وزارة التعليم') +
        toggle('academic.applyToSchedule', 'إيقاف التنبيهات الصوتية تلقائيًا في الإجازات', 'يعمل فقط بعد اعتماد التقويم') + '</div>',
        'إلى أن يُعتمد التقويم تظهر عبارة «بانتظار اعتماد التقويم الرسمي» في تبويب التقويم الدراسي، ولا تُستخدم إجازاته في إيقاف الجرس.') +
      card('بيانات العام الدراسي',
        '<div class="f-grid">' + meta('year', 'العام الدراسي') + meta('region', 'المنطقة / المدن') + meta('yearStart', 'بداية العام', 'date') + meta('yearEnd', 'آخر يوم دراسي', 'date') +
        meta('sourceName', 'اسم المصدر الرسمي') + meta('sourceUrl', 'رابط المصدر الرسمي', 'url') + meta('lastUpdated', 'تاريخ آخر تحديث', 'date') + meta('draftNote', 'ملاحظة حالة البيانات') + '</div>') +
      card('الأحداث والإجازات والاختبارات',
        '<div class="t-wrap t-tall"><table class="s-table"><thead><tr><th>الحدث</th><th>النوع</th><th>من</th><th>إلى</th><th>ملاحظة</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="f-row"><button class="btn" data-action="add-acad" data-type="exam">+ موعد اختبارات</button><button class="btn" data-action="add-acad" data-type="activity">+ نشاط مدرسي</button>' +
        '<button class="btn" data-action="add-acad" data-type="holiday">+ إجازة</button>' +
        (S.state.academic.data ? '<button class="btn" data-action="acad-restore">استعادة المسودة الافتراضية</button>' : '') + '</div>',
        'للإجازة ليوم واحد اجعل «من» و«إلى» نفس التاريخ. التاريخ الهجري يُحسب تلقائيًا بتقويم أم القرى.');
  };

  /* ---------------------------- الأمن والسلامة ---------------------------- */
  render.safety = function () {
    var c = S.state.safety;
    var contacts = (c.contacts || []).map(function (x, i) {
      return '<tr><td><input type="text" data-coll="contact" data-i="' + i + '" data-f="label" value="' + esc(x.label) + '" placeholder="مثل: وكيل شؤون الطلاب"></td>' +
        '<td><input type="text" dir="ltr" data-coll="contact" data-i="' + i + '" data-f="number" value="' + esc(x.number) + '" placeholder="التحويلة أو الرقم"></td>' +
        '<td class="c"><button class="btn btn-sm btn-danger" data-action="del-contact" data-i="' + i + '">حذف</button></td></tr>';
    }).join('');
    var imgs = (root.FAKIEH_SAFETY || []).map(function (t) {
      return '<div class="s-sound"><b>' + esc(t.title) + '</b><span class="muted">' + (c.images[t.id] ? 'توجد صورة / ملصق' : 'لا توجد صورة') + '</span>' +
        '<label class="btn btn-sm f-file">رفع ملصق<input type="file" accept="image/*" data-action="safety-img" data-id="' + t.id + '"></label>' +
        (c.images[t.id] ? '<button class="btn btn-sm btn-danger" data-action="del-safety-img" data-id="' + t.id + '">حذف</button>' : '<span></span>') + '<span></span></div>';
    }).join('');
    function area(f, label, ph) { return '<label class="f-field"><span>' + label + '</span><textarea rows="3" data-path="safety.' + f + '" placeholder="' + ph + '">' + esc(c[f] || '') + '</textarea></label>'; }
    return card('الاعتماد',
        toggle('safety.approved', 'راجع مسؤول الأمن والسلامة المحتوى واعتمده'),
        'التعليمات التوعوية عامة ومختصرة. يجب أن يراجعها مسؤول الأمن والسلامة بالمدرسة ويطابقها مع إرشادات الدفاع المدني والجهات المختصة.') +
      card('معلومات الطوارئ الخاصة بالمدرسة',
        '<div class="f-grid">' + area('evacuation', 'مسارات الإخلاء', 'مثال: الدور الأرضي — عبر الباب الشرقي…') + area('assembly', 'نقاط التجمع', 'مثال: الساحة الخارجية…') + '</div>' +
        '<label class="f-field" style="margin-top:.8rem"><span>مسؤول الأمن والسلامة</span><input type="text" data-path="safety.officer" value="' + esc(c.officer || '') + '"></label>' +
        '<h4>أرقام التواصل الداخلية</h4><div class="t-wrap"><table class="s-table"><thead><tr><th>الجهة</th><th>الرقم</th><th></th></tr></thead><tbody>' +
        (contacts || '<tr><td colspan="3" class="muted">لا توجد أرقام</td></tr>') + '</tbody></table></div>' +
        '<button class="btn" data-action="add-contact">+ إضافة رقم</button>',
        'هذه الحقول تُدخلها إدارة المدرسة فقط، ولا يقترح التطبيق أي مسار أو نقطة تجمع أو رقم داخلي.') +
      card('صور وملصقات السلامة', imgs, 'يُحفظ الملصق في متصفح هذا الجهاز ويظهر في البطاقة والشرائح.') +
      card('الشرائح', number('safety.slideSeconds', 'مدة كل شريحة', 5, 120, 1, 'ثانية'));
  };

  /* ---------------------------- السلوك والمواظبة ---------------------------- */
  render.conduct = function () {
    var D = root.FAKIEH_CONDUCT;
    var pend = D.sections.filter(function (s) { return s.pending; });
    return card('المصدر',
        '<p>' + esc(D.source) + ' — ' + esc(D.edition) + '</p><p class="muted">' + esc(D.basis) + '</p>',
        'النصوص المعروضة منقولة حرفيًا من اللوحة الموجزة. لا يضيف التطبيق درجات أو عقوبات أو إجراءات غياب من عنده.') +
      card('أقسام بانتظار النص الرسمي',
        pend.map(function (s) {
          return '<label class="f-field"><span>' + s.title + '</span><textarea rows="5" data-path="conduct.custom.' + s.id + '" placeholder="انسخ هنا النص الرسمي من الدليل الكامل لقواعد السلوك والمواظبة">' + esc((S.state.conduct.custom || {})[s.id] || '') + '</textarea></label>';
        }).join(''),
        'اللوحة الموجزة لا تتضمن تفاصيل هذه الأقسام. انقل النص من الدليل الرسمي الكامل كما هو.') +
      card('الشرائح', number('conduct.slideSeconds', 'مدة كل شريحة', 5, 120, 1, 'ثانية'));
  };

  /* ---------------------------- العرض التلقائي ---------------------------- */
  var VIEWS = { home: 'الرئيسية', azkar: 'الأذكار', occasions: 'المناسبات', academic: 'التقويم الدراسي', safety: 'الأمن والسلامة', conduct: 'السلوك والمواظبة' };
  function viewChips(list, attrs) {
    return '<div class="f-days">' + Object.keys(VIEWS).map(function (k) {
      return '<label class="f-chip"><input type="checkbox" value="' + k + '" ' + attrs + (list.indexOf(k) > -1 ? ' checked' : '') + '><span>' + VIEWS[k] + '</span></label>';
    }).join('') + '</div>';
  }
  render.presentation = function () {
    var p = S.state.presentation;
    var slots = (p.slots || []).map(function (s, i) {
      return '<div class="s-slot"><label class="f-toggle"><input type="checkbox" data-coll="slot" data-i="' + i + '" data-f="enabled"' + (s.enabled !== false ? ' checked' : '') + '><span class="sw"></span><span>مفعّل</span></label>' +
        '<label class="f-field"><span>من</span><input type="time" data-coll="slot" data-i="' + i + '" data-f="start" value="' + s.start + '"></label>' +
        '<label class="f-field"><span>إلى</span><input type="time" data-coll="slot" data-i="' + i + '" data-f="end" value="' + s.end + '"></label>' +
        viewChips(s.views || [], 'data-coll="slotview" data-i="' + i + '"') +
        '<button class="btn btn-sm btn-danger" data-action="del-slot" data-i="' + i + '">حذف</button></div>';
    }).join('');
    return card('تشغيل العرض التلقائي',
        '<div class="f-grid">' + toggle('presentation.enabled', 'تفعيل العرض التلقائي الذكي', 'يمكن أيضًا تشغيله وإيقافه من الزر في الشريط العلوي') +
        number('presentation.manualPauseMinutes', 'إيقاف مؤقت عند التحكم اليدوي', 1, 60, 1, 'دقيقة') +
        number('presentation.returnBeforeEndSeconds', 'العودة لشاشة التوقيت قبل نهاية الفترة بـ', 30, 600, 10, 'ثانية') +
        number('presentation.rotateSeconds', 'مدة عرض كل تبويب عند التدوير', 30, 1800, 10, 'ثانية') +
        toggle('presentation.autoSlides', 'تشغيل الشرائح تلقائيًا في التبويب المعروض') + number('presentation.slideSeconds', 'مدة الشريحة', 5, 120, 1, 'ثانية') + '</div>',
        'الأولوية دائمًا للتوقيت: في الفواصل بين الحصص وقبل نهاية أي فترة تعود الشاشة للرئيسية، وتظهر تنبيهات الحصص في كل التبويبات.') +
      card('الطابور والاستراحة',
        '<div class="f-grid">' + toggle('presentation.assemblyAzkar', 'عرض أذكار الصباح بملء الشاشة أثناء الطابور') + toggle('presentation.breakRotation', 'تدوير المحتوى أثناء الاستراحة') + '</div>' +
        '<h4>ما يُعرض أثناء الاستراحة</h4>' + viewChips(p.breakViews || [], 'data-action="breakviews"') +
        '<h4>ما يُعرض قبل الدوام وبعده (بالتناوب مع الرئيسية)</h4>' + viewChips(p.outsideViews || [], 'data-action="outsideviews"')) +
      card('أوقات تحددها الإدارة', (slots || '<p class="muted">لا توجد أوقات مضافة</p>') + '<button class="btn" data-action="add-slot">+ إضافة وقت عرض</button>',
        'مثال: من 12:53 إلى 13:00 عرض «السلوك والمواظبة». إذا اخترت أكثر من تبويب تُعرض بالتناوب.');
  };

  render.ticker = function () {
    var anns = (S.state.announcements || []).map(function (a, i) {
      return '<tr><td><input type="text" data-coll="ann" data-i="' + i + '" data-f="text" value="' + esc(a.text) + '"></td>' +
        '<td class="c"><input type="checkbox" data-coll="ann" data-i="' + i + '" data-f="active"' + (a.active ? ' checked' : '') + '></td>' +
        '<td class="c"><button class="btn btn-sm btn-danger" data-action="del-ann" data-i="' + i + '">حذف</button></td></tr>';
    }).join('');
    return card('الشريط المتحرك',
        '<div class="f-grid">' + toggle('ticker.enabled', 'إظهار الشريط المتحرك') + toggle('ticker.animate', 'تحريك الشريط', 'عند الإيقاف يظهر نص ثابت') +
        range('ticker.speed', 'سرعة الحركة', 1, 10, 0.5) + '</div><h4>المحتوى المعروض</h4><div class="f-days">' +
        [['hadith', 'أحاديث نبوية'], ['tips', 'نصائح إسلامية'], ['motivation', 'عبارات تحفيزية'], ['announcements', 'إعلانات المدرسة'], ['occasions', 'تذكير المناسبات']].map(function (s) {
          return '<label class="f-chip"><input type="checkbox" data-path="ticker.sources.' + s[0] + '"' + (S.state.ticker.sources[s[0]] ? ' checked' : '') + '><span>' + s[1] + '</span></label>';
        }).join('') + '</div>') +
      card('إعلانات المدرسة',
        '<div class="t-wrap"><table class="s-table"><thead><tr><th>نص الإعلان</th><th>مفعّل</th><th></th></tr></thead><tbody>' + (anns || '<tr><td colspan="3" class="muted">لا توجد إعلانات</td></tr>') + '</tbody></table></div>' +
        '<button class="btn" data-action="add-ann">+ إضافة إعلان</button>');
  };

  render.appearance = function () {
    return card('هوية المدرسة', '<div class="f-grid">' + text('school.name', 'اسم المدرسة') + text('school.subtitle', 'العنوان الفرعي') + '</div>') +
      card('الألوان',
        '<div class="f-grid f-grid-3">' + color('theme.bg', 'لون الخلفية (أخضر داكن)') + color('theme.primary', 'اللون الأساسي (أخضر)') + color('theme.gold', 'اللون الذهبي') + '</div>' +
        '<button class="btn" data-action="theme-reset">استعادة ألوان الهوية</button>') +
      card('عرض الوقت',
        '<div class="f-grid">' + select('visual.use12h', 'نظام الساعة', { 'true': '12 ساعة (صباحًا/مساءً)', 'false': '24 ساعة' }) +
        select('visual.digits', 'شكل الأرقام', { latn: '0123456789', arab: '٠١٢٣٤٥٦٧٨٩' }) +
        number('visual.warnSeconds', 'بدء التحول للذهبي قبل النهاية بـ', 30, 900, 30, 'ثانية') +
        number('visual.finalSeconds', 'التنبيه البصري الأخير قبل النهاية بـ', 10, 300, 10, 'ثانية') + '</div>') +
      card('ملء الشاشة', '<button class="btn btn-gold" data-action="fullscreen">تبديل وضع ملء الشاشة</button>',
        'اختصار لوحة المفاتيح: حرف F. في تبويب الأذكار: الأسهم للتنقل، والمسافة للإيقاف، وEsc للخروج من العرض الكامل.') +
      card('الخطوط', '<p class="muted">يستخدم التطبيق خط «Expo Arabic» من مجلد fonts (عادي، متوسط، عريض). لتغييره استبدل الملفات أو عدّل أعلى ملف css/base.css.</p>');
  };

  render.backup = function () {
    return card('تصدير واستيراد الإعدادات',
        '<div class="f-row"><button class="btn btn-gold" data-action="export">تصدير الإعدادات (JSON)</button>' +
        '<label class="btn f-file">استيراد ملف إعدادات<input type="file" accept="application/json,.json" data-action="import"></label>' +
        '<button class="btn btn-danger" data-action="reset">استعادة الإعدادات الافتراضية</button></div>',
        'تُحفظ الإعدادات في متصفح هذا الجهاز وليس في مجلد المشروع. ملف التصدير نسخة كاملة تشمل الإعدادات وملف الأذان والأصوات والصور المرفوعة؛ استورده في الجهاز الآخر لنقل كل شيء.') +
      card('الأمان',
        '<ul class="s-list">' +
        '<li>هذه النسخة مخصصة للعمل المحلي على جهاز العرض، ولوحة الإعدادات غير محمية بكلمة مرور.</li>' +
        '<li>لا يجوز الاعتماد على كلمة مرور مكتوبة داخل JavaScript، فأي شخص يستطيع قراءتها من المتصفح.</li>' +
        '<li>عند الحاجة لإدارة عن بُعد أو نشر الموقع: يلزم خادم بمصادقة حقيقية (مثل حسابات Microsoft 365 المدرسية عبر Microsoft Entra ID، أو Firebase Authentication)، مع حفظ الإعدادات في قاعدة بيانات وصلاحيات للمسؤولين فقط، وبقاء شاشات العرض للقراءة فقط.</li>' +
        '</ul>');
  };

  /* ---------------------------- التركيب والأحداث ---------------------------- */
  function mount() {
    root$ = document.getElementById('view-settings');
    root$.innerHTML = '<nav class="s-nav">' + SECTIONS.map(function (s) {
      return '<button data-sec="' + s.id + '">' + s.label + '</button>';
    }).join('') + '<p class="s-nav-note">تُحفظ التعديلات تلقائيًا</p></nav><div class="s-body" id="sBody"></div>';
    root$.querySelector('.s-nav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sec]'); if (b) { ui.section = b.dataset.sec; ui.occEdit = null; draw(); }
    });
    root$.addEventListener('change', onChange);
    root$.addEventListener('input', onInput);
    root$.addEventListener('click', onClick);
    root$.addEventListener('submit', onSubmit);
    draw();
  }

  function draw() {
    root$.querySelectorAll('[data-sec]').forEach(function (b) { b.classList.toggle('active', b.dataset.sec === ui.section); });
    var body = document.getElementById('sBody'), top = body.scrollTop;
    body.innerHTML = '<h2 class="s-title">' + SECTIONS.filter(function (s) { return s.id === ui.section; })[0].label + '</h2>' + render[ui.section]();
    body.scrollTop = top;
  }

  function valueOf(inp) {
    if (inp.type === 'checkbox') return inp.checked;
    if (inp.hasAttribute('data-num')) return +inp.value;
    if (inp.value === 'true') return true;
    if (inp.value === 'false') return false;
    return inp.value;
  }

  function onInput(e) {
    var inp = e.target;
    if (inp.type === 'range' && inp.dataset.path) {
      var lbl = root$.querySelector('[data-val-for="' + inp.dataset.path + '"]');
      if (lbl) lbl.textContent = inp.dataset.fmt === 'pct' ? pct(+inp.value) : inp.value;
      S.set(inp.dataset.path, +inp.value);
    }
  }

  function profilePeriods() { return S.state.schedule.profiles[ui.editProfile].periods; }

  function onChange(e) {
    var inp = e.target, ds = inp.dataset;
    if (ds.path === '__editProfile') { ui.editProfile = inp.value; draw(); return; }
    if (ds.path && inp.type !== 'range') {
      S.set(ds.path, valueOf(inp));
      if (ds.path === 'schedule.activeProfile') { ui.editProfile = inp.value; draw(); }
      if (/^alerts\.sounds\./.test(ds.path)) { root.FakiehApp.reloadSounds(); draw(); }
      if (/^prayer\.(offsets|enabled)/.test(ds.path)) draw();
      return;
    }
    if (ds.coll === 'period') {
      var p = profilePeriods()[+ds.i], v = valueOf(inp);
      p[ds.f] = v;
      if (ds.f === 'enabled' && v) delete p.enabled;
      S.save(); refreshWarnings(); return;
    }
    if (ds.coll === 'holiday') {
      var h = S.state.schedule.holidays[+ds.i]; h[ds.f] = inp.value;
      if (ds.f === 'from' && (!h.to || h.to < h.from)) { h.to = h.from; draw(); }
      S.save(); return;
    }
    if (ds.coll === 'ann') { S.state.announcements[+ds.i][ds.f] = valueOf(inp); S.save(); return; }
    if (ds.coll === 'acad') {
      var ev = ensureAcad().events[+ds.i]; ev[ds.f] = inp.value;
      if (ds.f === 'to' && !inp.value) delete ev.to;
      if (ds.f === 'from' && ev.to && ev.to < ev.from) { ev.to = ev.from; draw(); }
      S.save(); return;
    }
    if (ds.coll === 'acadmeta') { ensureAcad()[ds.f] = inp.value; S.save(); return; }
    if (ds.coll === 'contact') { S.state.safety.contacts[+ds.i][ds.f] = inp.value; S.save(); return; }
    if (ds.coll === 'slot') { S.state.presentation.slots[+ds.i][ds.f] = valueOf(inp); S.save(); return; }
    if (ds.coll === 'slotview') {
      var vs = []; root$.querySelectorAll('[data-coll="slotview"][data-i="' + ds.i + '"]').forEach(function (c) { if (c.checked) vs.push(c.value); });
      S.state.presentation.slots[+ds.i].views = vs; S.save(); return;
    }
    if (ds.action === 'breakviews' || ds.action === 'outsideviews') {
      var list = []; root$.querySelectorAll('[data-action="' + ds.action + '"]').forEach(function (c) { if (c.checked) list.push(c.value); });
      S.set('presentation.' + (ds.action === 'breakviews' ? 'breakViews' : 'outsideViews'), list); return;
    }
    if (ds.action === 'safety-img') {
      var file = inp.files[0], id = ds.id; if (!file) return;
      if (file.size > 6 * 1024 * 1024) return alert('الصورة كبيرة جدًا (الحد 6 ميجابايت)');
      S.files.put('safety-img:' + id, file).then(function () {
        root.FakiehSafety.setImage(id, file); S.state.safety.images[id] = true; S.save(); draw();
      }).catch(function () { alert('تعذر حفظ الصورة في المتصفح'); });
      return;
    }
    if (ds.coll === 'ov') {
      var ov = S.state.contentOverrides; ov[ds.kind] = ov[ds.kind] || {};
      ov[ds.kind][ds.id] = Object.assign({}, ov[ds.kind][ds.id] || {}); ov[ds.kind][ds.id][ds.f] = inp.checked;
      S.save(); return;
    }
    if (ds.action === 'day') {
      var days = []; root$.querySelectorAll('[data-action="day"]').forEach(function (c) { if (c.checked) days.push(+c.value); });
      S.set('schedule.schoolDays', days); return;
    }
    if (ds.action === 'remind') {
      var nums = inp.value.split(/[,،\s]+/).map(function (x) { return parseInt(T.digits(x, 'latn').replace(/[٠-٩]/g, function (c) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(c); }), 10); })
        .filter(function (n) { return n > 0 && n < 120; });
      if (nums.length) S.set('occasions.remindDays', nums.sort(function (a, b) { return b - a; }));
      draw(); return;
    }
    if (ds.action === 'upload') return uploadSound(inp);
    if (ds.action === 'upload-adhan') {
      var af = inp.files[0]; if (!af) return;
      if (af.size > 15 * 1024 * 1024) return alert('الملف كبير جدًا (الحد 15 ميجابايت)');
      root$.querySelector('[data-file-status="adhan"]').textContent = 'جارٍ التحميل…';
      S.files.put('sound:adhan', af).then(function () { return AU.loadCustom('adhan', af); }).then(function (ok) {
        if (!ok) { root$.querySelector('[data-file-status="adhan"]').textContent = 'تعذرت قراءة الملف — جرّب MP3 أو WAV'; return; }
        S.set('prayer.hasAdhanFile', true); draw(); root.FakiehApp.toast('تم حفظ ملف الأذان', 3000);
      }).catch(function () { alert('تعذر حفظ الملف في المتصفح'); });
      return;
    }
    if (ds.action === 'import') return importFile(inp);
  }

  function refreshWarnings() {
    var w = T.validatePeriods(profilePeriods()), box = root$.querySelector('.s-warn, .s-ok');
    if (!box) return;
    box.className = w.length ? 's-warn' : 's-ok';
    box.innerHTML = w.length ? w.map(esc).join('<br>') : 'الجدول سليم: لا يوجد تداخل بين الفترات';
  }

  function ensureOccList() { if (!S.state.occasions.list) S.state.occasions.list = S.clone(root.FAKIEH_OCCASIONS); return S.state.occasions.list; }

  function onClick(e) {
    var b = e.target.closest('[data-action]'); if (!b || b.tagName === 'INPUT') return;
    var a = b.dataset.action, i = +b.dataset.i;
    switch (a) {
      case 'add-period':
        var ps = profilePeriods(), lastP = ps[ps.length - 1];
        var st = lastP ? lastP.end : '07:00', en = T.hmFromSec(T.parseHM(st) + 45 * 60);
        ps.push({ id: 'x' + Date.now().toString(36), name: 'فترة جديدة', type: 'lesson', start: st, end: en });
        S.save(); draw(); break;
      case 'del-period':
        if (confirm('حذف «' + profilePeriods()[i].name + '» من الجدول؟')) { profilePeriods().splice(i, 1); S.save(); draw(); } break;
      case 'copy-profile':
        if (confirm('سيُستبدل جدول التوقيت الصيفي بنسخة من الشتوي. متابعة؟')) {
          S.state.schedule.profiles.summer.periods = S.clone(S.state.schedule.profiles.winter.periods); S.save(); draw();
        } break;
      case 'add-holiday':
        S.state.schedule.holidays.push({ name: '', from: '', to: '' }); S.save(); draw(); break;
      case 'del-holiday':
        S.state.schedule.holidays.splice(i, 1); S.save(); draw(); break;
      case 'add-ann':
        S.state.announcements.push({ id: 'a' + Date.now().toString(36), text: '', active: true }); S.save(); draw(); break;
      case 'del-ann':
        S.state.announcements.splice(i, 1); S.save(); draw(); break;
      case 'unlock':
        root.FakiehApp.unlockAudio().then(draw); break;
      case 'test':
        root.FakiehApp.unlockAudio().then(function (ok) {
          if (!ok) return alert('تعذر تفعيل الصوت في هذا المتصفح');
          var k = b.dataset.kind, snd = S.state.alerts.sounds[k];
          if (snd === 'custom' && !AU.hasCustom(k)) return alert('اختر «ملف مرفوع» ثم ارفع ملفًا أولًا');
          AU.play(snd, k);
        }); break;
      case 'occ-new': ui.occEdit = 'new'; draw(); break;
      case 'occ-edit': ui.occEdit = b.dataset.id; draw(); break;
      case 'occ-cancel': ui.occEdit = null; draw(); break;
      case 'occ-del':
        var l = ensureOccList(), idx = l.findIndex(function (o) { return o.id === b.dataset.id; });
        if (idx > -1 && confirm('حذف «' + l[idx].name + '»؟')) { l.splice(idx, 1); S.save(); draw(); } break;
      case 'occ-restore':
        if (confirm('استعادة القائمة الافتراضية وحذف تعديلاتك على المناسبات؟')) { S.set('occasions.list', null); draw(); } break;
      case 'test-prayer-pre':
        root.FakiehApp.unlockAudio().then(function () { AU.play(S.state.prayer.preAlertSound, 'prayerPre'); }); break;
      case 'test-adhan':
        root.FakiehApp.unlockAudio().then(function () { root.FakiehApp.showAdhan({ name: 'الظهر' }); }); break;
      case 'stop-adhan':
        root.FakiehApp.hideAdhan(); break;
      case 'del-adhan':
        if (confirm('حذف ملف الأذان المحفوظ؟')) {
          root.FakiehApp.hideAdhan(); S.files.remove('sound:adhan').catch(function () {});
          AU.loadCustom('adhan', null); S.set('prayer.hasAdhanFile', false); draw();
        } break;
      case 'add-acad':
        var t = b.dataset.type, dk = T.zonedParts(Date.now(), S.state.timeZone).dateKey;
        ensureAcad().events.push({ id: 'ac-' + Date.now().toString(36), type: t, name: ({ exam: 'اختبارات', activity: 'نشاط مدرسي', holiday: 'إجازة' })[t], from: dk, to: dk });
        S.save(); draw(); break;
      case 'del-acad':
        var evs = ensureAcad().events;
        if (confirm('حذف «' + evs[i].name + '»؟')) { evs.splice(i, 1); S.save(); draw(); } break;
      case 'acad-restore':
        if (confirm('استعادة المسودة الافتراضية وحذف تعديلاتك على التقويم الدراسي؟')) { S.set('academic.data', null); draw(); } break;
      case 'add-contact':
        S.state.safety.contacts.push({ label: '', number: '' }); S.save(); draw(); break;
      case 'del-contact':
        S.state.safety.contacts.splice(i, 1); S.save(); draw(); break;
      case 'del-safety-img':
        var sid = b.dataset.id;
        S.files.remove('safety-img:' + sid).catch(function () {});
        root.FakiehSafety.setImage(sid, null); delete S.state.safety.images[sid]; S.save(); draw(); break;
      case 'add-slot':
        S.state.presentation.slots.push({ start: '12:53', end: '13:00', views: ['conduct'], enabled: true }); S.save(); draw(); break;
      case 'del-slot':
        S.state.presentation.slots.splice(i, 1); S.save(); draw(); break;
      case 'theme-reset':
        S.set('theme', S.clone(root.FAKIEH_DEFAULTS.theme)); draw(); break;
      case 'fullscreen':
        document.fullscreenElement ? document.exitFullscreen() : root.FakiehApp.requestFullscreen(); break;
      case 'export': exportFile(); break;
      case 'reset':
        if (confirm('ستُحذف جميع الإعدادات المحفوظة وتعود القيم الافتراضية. متابعة؟')) { S.reset(); ui.editProfile = null; draw(); } break;
    }
  }

  function onSubmit(e) {
    if (e.target.id !== 'occForm') return;
    e.preventDefault();
    var f = e.target, g = function (n) { return f.elements[n].value.trim(); };
    var once = g('mode') === 'once';
    if (once && !g('date')) return alert('أدخل التاريخ');
    if (!once && (!+g('day') || !+g('month'))) return alert('أدخل اليوم والشهر');
    var item = {
      id: ui.occEdit === 'new' ? 'occ-' + Date.now().toString(36) : ui.occEdit,
      name: g('name'), category: g('category'), description: g('description'),
      source: g('source'), sourceUrl: g('sourceUrl'), verification: g('verification'),
      lastUpdated: T.zonedParts(Date.now(), S.state.timeZone).dateKey
    };
    if (once) item.date = g('date'); else { item.month = +g('month'); item.day = +g('day'); }
    var l = ensureOccList(), idx = l.findIndex(function (o) { return o.id === item.id; });
    if (idx > -1 && l[idx].hasImage) item.hasImage = true;
    var file = f.elements.image && f.elements.image.files[0];
    var removeImg = f.elements.removeImage && f.elements.removeImage.checked;
    if (file && file.size > 4 * 1024 * 1024) return alert('الصورة كبيرة جدًا (الحد 4 ميجابايت)');
    if (removeImg) { item.hasImage = false; S.files.remove('occ-img:' + item.id).catch(function () {}); root.FakiehOccasions.setImage(item.id, null); }
    if (file) { item.hasImage = true; S.files.put('occ-img:' + item.id, file).catch(function () { alert('تعذر حفظ الصورة في المتصفح'); }); root.FakiehOccasions.setImage(item.id, file); }
    if (idx > -1) l[idx] = item; else l.push(item);
    ui.occEdit = null; S.save(); draw();
  }

  function uploadSound(inp) {
    var file = inp.files[0], k = inp.dataset.kind;
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return alert('الملف كبير جدًا (الحد 8 ميجابايت)');
    var status = root$.querySelector('[data-file-status="' + k + '"]');
    status.textContent = 'جارٍ التحميل…';
    S.files.put('sound:' + k, file)
      .then(function () { return AU.loadCustom(k, file); })
      .then(function (ok) {
        if (!ok) { status.textContent = 'تعذرت قراءة الملف — جرّب MP3 أو WAV'; return; }
        S.set('alerts.sounds.' + k, 'custom'); draw();
        root.FakiehApp.toast('تم حفظ صوت «' + KINDS[k] + '»', 3000);
      })
      .catch(function () { status.textContent = 'تعذر حفظ الملف في المتصفح'; });
  }

  function exportFile() {
    root.FakiehApp.toast('جارٍ تجهيز النسخة الاحتياطية…', 3000);
    S.exportFull().then(function (text) {
      var blob = new Blob([text], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fakieh-dashboard-backup-' + T.zonedParts(Date.now(), S.state.timeZone).dateKey + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }).catch(function (err) { alert('تعذر إنشاء النسخة الاحتياطية: ' + err.message); });
  }
  function importFile(inp) {
    var file = inp.files[0]; if (!file) return;
    file.text().then(function (txt) { return S.importFull(txt); }).then(function (n) {
      alert('تم استيراد الإعدادات' + (n ? ' و' + n + ' ملفات (أصوات وصور)' : '') + '. ستُعاد تحميل الصفحة الآن.');
      location.reload();
    }).catch(function (err) { alert('تعذر استيراد الملف: ' + err.message); });
  }

  root.FakiehSettings = { mount: mount, onShow: function () { if (root$) draw(); } };
})(window);
