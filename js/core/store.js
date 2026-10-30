/* =========================================================================
   حفظ الإعدادات محليًا (localStorage) + تخزين ملفات الصوت (IndexedDB)
   ========================================================================= */
(function (root) {
  'use strict';

  var KEY = 'fakieh.settings.v1';
  var listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  /** دمج عميق: القيم المحفوظة تطغى على الافتراضية، والمصفوفات تُستبدل كاملة */
  function deepMerge(base, over) {
    var out = clone(base);
    if (!isObj(over)) return out;
    Object.keys(over).forEach(function (k) {
      if (isObj(over[k]) && isObj(out[k])) out[k] = deepMerge(out[k], over[k]);
      else if (over[k] !== undefined) out[k] = clone(over[k]);
    });
    return out;
  }

  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
    return deepMerge(root.FAKIEH_DEFAULTS, saved);
  }

  var state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('تعذر حفظ الإعدادات', e); return false; }
    listeners.forEach(function (fn) { fn(state); });
    return true;
  }

  /** الوصول بالمسار: get('alerts.volume') */
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, state);
  }
  function set(path, value) {
    var keys = path.split('.'), o = state;
    for (var i = 0; i < keys.length - 1; i++) { if (!isObj(o[keys[i]])) o[keys[i]] = {}; o = o[keys[i]]; }
    o[keys[keys.length - 1]] = value;
    return save();
  }

  function exportJSON() {
    return JSON.stringify({ app: 'fakieh-school-dashboard', exportedAt: new Date().toISOString(), settings: state }, null, 2);
  }
  function importJSON(text) {
    var data = JSON.parse(text);
    var incoming = data && data.settings ? data.settings : data;
    if (!isObj(incoming) || !incoming.schedule) throw new Error('الملف لا يحتوي على إعدادات صالحة');
    state = deepMerge(root.FAKIEH_DEFAULTS, incoming);
    save();
  }
  function reset() { state = clone(root.FAKIEH_DEFAULTS); try { localStorage.removeItem(KEY); } catch (e) {} save(); }

  /* ----------------------- IndexedDB لملفات الصوت ----------------------- */
  var dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!root.indexedDB) return reject(new Error('IndexedDB غير متاح'));
      var req = indexedDB.open('fakieh-dashboard', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('files'); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }
  function fileOp(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction('files', mode), st = tx.objectStore('files'), req = fn(st);
        tx.oncomplete = function () { resolve(req && req.result); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  var files = {
    put: function (key, blob) { return fileOp('readwrite', function (s) { return s.put(blob, key); }); },
    get: function (key) { return fileOp('readonly', function (s) { return s.get(key); }); },
    remove: function (key) { return fileOp('readwrite', function (s) { return s.delete(key); }); },
    keys: function () { return fileOp('readonly', function (s) { return s.getAllKeys(); }); }
  };

  function blobToDataURL(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.onerror = reject; r.readAsDataURL(blob);
    });
  }
  function dataURLToBlob(url) { return fetch(url).then(function (r) { return r.blob(); }); }

  /** نسخة احتياطية كاملة: الإعدادات + الملفات المرفوعة (الأذان، الأصوات، الصور) */
  function exportFull() {
    return files.keys().catch(function () { return []; }).then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return files.get(k).then(function (b) { return b ? blobToDataURL(b).then(function (u) { return [k, u]; }) : null; });
      }));
    }).then(function (pairs) {
      var map = {}; pairs.forEach(function (p) { if (p) map[p[0]] = p[1]; });
      return JSON.stringify({ app: 'fakieh-school-dashboard', exportedAt: new Date().toISOString(), settings: state, files: map });
    });
  }
  /** استيراد نسخة كاملة (يستعيد الملفات إن وُجدت) */
  function importFull(text) {
    var data = JSON.parse(text);
    importJSON(text);
    var fl = data && data.files ? data.files : {};
    return Promise.all(Object.keys(fl).map(function (k) {
      return dataURLToBlob(fl[k]).then(function (b) { return files.put(k, b); });
    })).then(function () { return Object.keys(fl).length; });
  }

  root.FakiehStore = {
    get state() { return state; },
    get: get, set: set, save: save,
    onChange: function (fn) { listeners.push(fn); },
    exportJSON: exportJSON, importJSON: importJSON, exportFull: exportFull, importFull: importFull, reset: reset,
    deepMerge: deepMerge, clone: clone, files: files
  };
})(window);
