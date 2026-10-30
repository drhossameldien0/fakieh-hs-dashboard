/* أيقونات SVG خطية بسيطة (بدون مكتبات خارجية حتى تعمل دون إنترنت) */
(function (root) {
  'use strict';
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }
  root.FakiehIcons = {
    clock:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
    azkar:    svg('<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/><path d="M17 4l.6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6z"/>'),
    sun:      svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon:     svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
    star:     svg('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'),
    occasions:svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 13.2l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17.5h2M11 17.5h2"/>'),
    shield:   svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    conduct:  svg('<path d="M12 3v18M5 7h14"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/><path d="M8 21h8"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    expand:   svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    shrink:   svg('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
    next:     svg('<path d="M15 6l-6 6 6 6"/>'),   // في RTL: التالي يشير لليسار
    prev:     svg('<path d="M9 6l6 6-6 6"/>'),
    play:     svg('<path d="M7 5l12 7-12 7z"/>'),
    pause:    svg('<path d="M8 5v14M16 5v14"/>'),
    flag:     svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    sound:    svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/>'),
    exit:     svg('<path d="M14 4h5v16h-5"/><path d="M10 12h9"/><path d="M7 9l-3 3 3 3"/><circle cx="9" cy="5" r="1.5"/>'),
    fire:     svg('<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2-6 1 1.5 1.5 2.5 1.5 4 1.5-1.5 2-4.5 1.5-8z"/>'),
    bolt:     svg('<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>'),
    flask:    svg('<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7.5 14h9"/>'),
    stairs:   svg('<path d="M3 20h5v-5h5v-5h5V5h3"/>'),
    aid:      svg('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/>'),
    siren:    svg('<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 18h14v3H5zM12 2v2M4.5 5.5l1.5 1.5M19.5 5.5L18 7"/>'),
    ball:     svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a15 15 0 0 1 0 18M3 12h18M5.5 6a12 12 0 0 0 13 0M5.5 18a12 12 0 0 1 13 0"/>'),
    building: svg('<path d="M4 21V5l8-3 8 3v16"/><path d="M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2"/>'),
    alert:    svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
    scale:    svg('<path d="M12 3v18M7 21h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>'),
    check:    svg('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
    handshake:svg('<path d="M3 11l4-4 4 2 3-2 7 5-3 3"/><path d="M7 7v6l5 5 2-2M11 9l5 5"/>'),
    shieldx:  svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>'),
    phone:    svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
    list:     svg('<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'),
    search:   svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    slides:   svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M10 8.5l4 2-4 2z"/>'),
    close:    svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    present:  svg('<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21l4-5 4 5"/><path d="M9.5 7.5l5 2-5 2z"/>'),
    ornament: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 4h40M4 4v40"/><path d="M12 12h22M12 12v22"/><path d="M4 4l14 14"/><circle cx="20" cy="20" r="3"/><path d="M44 4c-6 4-6 10 0 14M4 44c4-6 10-6 14 0"/></svg>'
  };
})(window);
