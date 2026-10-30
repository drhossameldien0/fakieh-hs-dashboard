// تشغيل الاختبارات من سطر الأوامر:  node tests/run-node.js
global.window = global;
require('../js/config/default-settings.js');
const T = require('../js/core/time.js');
const A = require('../js/core/alerts.js');
require('../js/ui/presentation.js');
require('../js/core/prayer.js');
const { runTests } = require('./timing.spec.js');

const r = runTests(T, A, global.FAKIEH_DEFAULTS, (ok, name, err) =>
  console.log((ok ? '  ✔ ' : '  ✘ ') + name + (err ? '\n      ' + err : '')));
console.log(`\nالنتيجة: ${r.passed}/${r.total} ناجح` + (r.failed ? ` — ${r.failed} فاشل` : ''));
process.exit(r.failed ? 1 : 0);
