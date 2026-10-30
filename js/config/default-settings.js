/* =========================================================================
   الإعدادات الافتراضية — يمكن تعديلها من لوحة الإعدادات دون لمس الكود.
   ما يُحفظ من لوحة الإعدادات يُخزَّن في المتصفح (localStorage) ويطغى على هذه القيم.
   ========================================================================= */
window.FAKIEH_DEFAULTS = {
  version: 1,

  school: {
    name: 'ثانوية عبدالرحمن فقيه',
    subtitle: 'لوحة التوقيت المدرسي الذكية'
  },

  timeZone: 'Asia/Riyadh',

  schedule: {
    activeProfile: 'winter',
    showInternational: true,          // الحصة الثامنة (القسم الدولي)
    schoolDays: [0, 1, 2, 3, 4],      // 0=الأحد … 6=السبت — عدّلها من الإعدادات
    holidays: [],                     // [{ from: '2026-11-20', to: '2026-11-22', name: 'إجازة' }]
    profiles: {
      winter: {
        name: 'التوقيت الشتوي',
        periods: [
          { id: 'assembly', name: 'طابور الصباح',          type: 'assembly', start: '07:15', end: '07:30' },
          { id: 'p1',       name: 'الحصة الأولى',           type: 'lesson',   start: '07:30', end: '08:15' },
          { id: 'p2',       name: 'الحصة الثانية',          type: 'lesson',   start: '08:17', end: '09:02' },
          { id: 'p3',       name: 'الحصة الثالثة',          type: 'lesson',   start: '09:03', end: '09:47' },
          { id: 'p4',       name: 'الحصة الرابعة',          type: 'lesson',   start: '09:48', end: '10:33' },
          { id: 'break',    name: 'الاستراحة',              type: 'break',    start: '10:33', end: '10:52' },
          { id: 'p5',       name: 'الحصة الخامسة',          type: 'lesson',   start: '10:53', end: '11:33' },
          { id: 'p6',       name: 'الحصة السادسة',          type: 'lesson',   start: '11:33', end: '12:13' },
          { id: 'p7',       name: 'الحصة السابعة',          type: 'lesson',   start: '12:13', end: '12:53' },
          { id: 'prayer',   name: 'الصلاة',                 type: 'prayer',   start: '12:53', end: '13:00' },
          { id: 'p8',       name: 'الحصة الثامنة (الدولي)', type: 'lesson',   start: '13:00', end: '13:40', international: true }
        ]
      },
      summer: {
        name: 'التوقيت الصيفي',
        note: 'نسخة مبدئية مطابقة للشتوي — عدّلها عند اعتماد التوقيت الصيفي',
        periods: [
          { id: 'assembly', name: 'طابور الصباح',          type: 'assembly', start: '07:15', end: '07:30' },
          { id: 'p1',       name: 'الحصة الأولى',           type: 'lesson',   start: '07:30', end: '08:15' },
          { id: 'p2',       name: 'الحصة الثانية',          type: 'lesson',   start: '08:17', end: '09:02' },
          { id: 'p3',       name: 'الحصة الثالثة',          type: 'lesson',   start: '09:03', end: '09:47' },
          { id: 'p4',       name: 'الحصة الرابعة',          type: 'lesson',   start: '09:48', end: '10:33' },
          { id: 'break',    name: 'الاستراحة',              type: 'break',    start: '10:33', end: '10:52' },
          { id: 'p5',       name: 'الحصة الخامسة',          type: 'lesson',   start: '10:53', end: '11:33' },
          { id: 'p6',       name: 'الحصة السادسة',          type: 'lesson',   start: '11:33', end: '12:13' },
          { id: 'p7',       name: 'الحصة السابعة',          type: 'lesson',   start: '12:13', end: '12:53' },
          { id: 'prayer',   name: 'الصلاة',                 type: 'prayer',   start: '12:53', end: '13:00' },
          { id: 'p8',       name: 'الحصة الثامنة (الدولي)', type: 'lesson',   start: '13:00', end: '13:40', international: true }
        ]
      }
    }
  },

  alerts: {
    enabled: true,
    volume: 0.8,
    warn1Enabled: true, warn1Minutes: 5,   // قبل النهاية بخمس دقائق
    warn2Enabled: true, warn2Minutes: 1,   // قبل النهاية بدقيقة
    endEnabled: true,                      // جرس النهاية
    graceSeconds: 10,                      // لا يُطلق التنبيه إن فات موعده بأكثر من هذا
    periodTypes: { lesson: true, break: true, assembly: false, prayer: false },
    sounds: { warn1: 'chime', warn2: 'double', end: 'bell' }   // أو 'custom' لملف مرفوع
  },

  visual: {
    warnSeconds: 300,   // يبدأ التحول للذهبي
    finalSeconds: 60,   // تنبيه بصري للدقيقة الأخيرة
    use12h: true,
    digits: 'latn'      // latn = 0123 ، arab = ٠١٢٣
  },

  azkar: {
    enabled: true,
    slideSeconds: 20,              // مدة عرض كل ذكر في تبويب الأذكار (15–30 مقترح)
    autoAdvance: true,
    showOnHomeDuringAssembly: true,
    homeSlideSeconds: 15,
    autoAssemblyMode: false,       // الانتقال تلقائيًا لوضع الطابور عند بداية الطابور
    approvedOnly: false            // عرض المعتمد من الإدارة فقط
  },

  ticker: {
    enabled: true,
    animate: true,
    speed: 4,                      // سرعة الحركة (rem في الثانية)
    sources: { hadith: true, tips: true, motivation: true, announcements: true, occasions: true }
  },

  announcements: [
    { id: 'a1', text: 'مرحبًا بكم في ثانوية عبدالرحمن فقيه — نتمنى لكم يومًا دراسيًا موفقًا', active: true }
  ],

  occasions: {
    remindDays: [7, 3, 1],         // تنبيه قبل المناسبة بـ 7 و3 أيام ويوم واحد
    list: null                     // null = استخدام القائمة الافتراضية من js/data/occasions.js
  },

  contentOverrides: { azkar: {}, hadith: {} },   // { id: { active: bool, approved: bool } }

  prayer: {
    enabled: true,
    city: 'مكة المكرمة',
    lat: 21.4225, lng: 39.8262, tz: 3,
    method: 'تقويم أم القرى',
    fajrAngle: 18.5, ishaMinutes: 90, ramadanIshaMinutes: 120, asrFactor: 1,
    offsets: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },   // ضبط بالدقائق لمطابقة التقويم الرسمي
    alertPrayers: { fajr: false, dhuhr: true, asr: false, maghrib: false, isha: false },
    schoolDaysOnly: true,          // التنبيه والأذان في أيام الدراسة فقط
    preAlertEnabled: true,         // تنبيه قبل الصلاة
    preAlertMinutes: 5,
    preAlertSound: 'soft',
    adhanEnabled: true,            // تشغيل الأذان (يتطلب رفع ملف الأذان)
    adhanVolume: 1,
    hasAdhanFile: false,           // يُرفع ملف الأذان (MP3) من الإعدادات ويُحفظ في المتصفح
    showCard: true
  },

  academic: {
    approved: false,               // يُفعَّل بعد مطابقة التواريخ مع التقويم الرسمي لوزارة التعليم
    applyToSchedule: true,         // بعد الاعتماد: إيقاف التنبيهات تلقائيًا في الإجازات
    data: null                     // null = البيانات الافتراضية من js/data/academic-calendar.js
  },

  safety: {
    approved: false,               // مراجعة مسؤول الأمن والسلامة
    evacuation: '',                // مسارات الإخلاء — تُدخلها المدرسة فقط
    assembly: '',                  // نقاط التجمع
    officer: '',                   // مسؤول الأمن والسلامة
    contacts: [],                  // [{ label, number }] أرقام داخلية
    images: {},                    // { topicId: true } الصور محفوظة في المتصفح
    slideSeconds: 15
  },

  conduct: {
    custom: { rights: '', attendance: '' },   // نصوص رسمية تُدخلها الإدارة من الدليل الكامل
    slideSeconds: 15
  },

  presentation: {
    enabled: false,
    assemblyAzkar: true,           // أذكار الصباح أثناء الطابور
    returnBeforeEndSeconds: 120,   // العودة لشاشة التوقيت قبل نهاية الفترة
    breakRotation: true,           // عرض المحتوى أثناء الاستراحة
    breakViews: ['occasions', 'safety', 'conduct'],
    outsideViews: [],              // محتوى يُعرض قبل الدوام أو بعده (اختياري)
    rotateSeconds: 120,            // مدة كل تبويب عند التدوير
    autoSlides: true,              // تشغيل الشرائح تلقائيًا في التبويب المعروض
    slideSeconds: 15,
    manualPauseMinutes: 5,         // إيقاف مؤقت عند التحكم اليدوي
    slots: [
      { start: '12:53', end: '13:00', views: ['conduct'], enabled: false }
    ]
  },

  theme: {
    bg: '#04241a',
    primary: '#127a3e',
    gold: '#c9ae63'
  }
};
