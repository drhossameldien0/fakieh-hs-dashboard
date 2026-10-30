/* =========================================================================
   المناسبات والأيام العالمية — قائمة أولية تحتاج مراجعة واعتماد الإدارة.
   category:     national (وطنية) | education (تعليمية) | international (عالمية) | school (مدرسية)
   verification: official      = مناسبة رسمية بأمر ملكي/جهة حكومية
                 un            = يوم دولي معلن من الأمم المتحدة أو إحدى منظماتها (اعتماده في تقويم الوزارة يحتاج تحقق)
                 needs-review  = بحاجة إلى مراجعة واعتماد من إدارة المدرسة
   المناسبات السنوية تُعرَّف بالشهر واليوم (month/day) فتتجدد تلقائيًا كل عام،
   أو بتاريخ محدد date: 'YYYY-MM-DD' لحدث يقع مرة واحدة.
   ========================================================================= */
window.FAKIEH_OCCASIONS = [
  { id: 'saudi-national-day', name: 'اليوم الوطني السعودي', category: 'national', month: 9, day: 23,
    description: 'ذكرى توحيد المملكة العربية السعودية على يد الملك عبدالعزيز رحمه الله.',
    source: 'مناسبة وطنية رسمية', sourceUrl: '', verification: 'official', lastUpdated: '2026-10-30' },
  { id: 'founding-day', name: 'يوم التأسيس', category: 'national', month: 2, day: 22,
    description: 'ذكرى تأسيس الدولة السعودية الأولى عام 1727م، بأمر ملكي صدر عام 1443هـ.',
    source: 'أمر ملكي', sourceUrl: '', verification: 'official', lastUpdated: '2026-10-30' },
  { id: 'flag-day', name: 'يوم العلم', category: 'national', month: 3, day: 11,
    description: 'يوم للاعتزاز بالعلم السعودي وقيمه، بأمر ملكي صدر عام 1444هـ.',
    source: 'أمر ملكي', sourceUrl: '', verification: 'official', lastUpdated: '2026-10-30' },

  { id: 'education-day', name: 'اليوم الدولي للتعليم', category: 'education', month: 1, day: 24,
    description: 'يوم دولي يؤكد دور التعليم في السلام والتنمية.',
    source: 'الأمم المتحدة', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'teachers-day', name: 'اليوم العالمي للمعلم', category: 'education', month: 10, day: 5,
    description: 'يوم لتكريم المعلمين وتقدير رسالتهم.',
    source: 'اليونسكو', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'arabic-language-day', name: 'اليوم العالمي للغة العربية', category: 'education', month: 12, day: 18,
    description: 'احتفاء بلغة القرآن الكريم وإحدى اللغات الرسمية الست في الأمم المتحدة.',
    source: 'اليونسكو / الأمم المتحدة', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },

  { id: 'mental-health-day', name: 'اليوم العالمي للصحة النفسية', category: 'international', month: 10, day: 10,
    description: 'توعية بأهمية الصحة النفسية ودعمها.',
    source: 'منظمة الصحة العالمية', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'tolerance-day', name: 'اليوم الدولي للتسامح', category: 'international', month: 11, day: 16,
    description: 'تعزيز قيم التسامح والاحترام المتبادل.',
    source: 'اليونسكو', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'children-day', name: 'اليوم العالمي للطفل', category: 'international', month: 11, day: 20,
    description: 'يوم لتعزيز حقوق الطفل ورفاهه.',
    source: 'الأمم المتحدة', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'disability-day', name: 'اليوم الدولي للأشخاص ذوي الإعاقة', category: 'international', month: 12, day: 3,
    description: 'تعزيز حقوق الأشخاص ذوي الإعاقة ودمجهم في المجتمع.',
    source: 'الأمم المتحدة', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'volunteer-day', name: 'اليوم الدولي للمتطوعين', category: 'international', month: 12, day: 5,
    description: 'تقدير جهود المتطوعين وتشجيع ثقافة التطوع.',
    source: 'الأمم المتحدة', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'health-day', name: 'يوم الصحة العالمي', category: 'international', month: 4, day: 7,
    description: 'توعية بقضايا الصحة العامة.',
    source: 'منظمة الصحة العالمية', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' },
  { id: 'book-day', name: 'اليوم العالمي للكتاب وحقوق المؤلف', category: 'international', month: 4, day: 23,
    description: 'تشجيع القراءة واحترام حقوق المؤلفين.',
    source: 'اليونسكو', sourceUrl: 'https://www.un.org/ar/observances/list-days-weeks', verification: 'un', lastUpdated: '2026-10-30' }
];

window.FAKIEH_OCCASION_CATEGORIES = {
  national:      { label: 'مناسبة وطنية',  color: '#2fa86a' },
  education:     { label: 'مناسبة تعليمية', color: '#d9b45a' },
  international: { label: 'يوم عالمي',     color: '#4aa3c9' },
  school:        { label: 'فعالية مدرسية',  color: '#c97a9a' }
};

window.FAKIEH_VERIFICATION = {
  'official':     'رسمي',
  'un':           'يوم دولي — يحتاج تحقق من اعتماد الوزارة',
  'needs-review': 'بحاجة لمراجعة الإدارة'
};
