// ============================================================
// Ikon — Lucide (https://lucide.dev), lucide-static v1.64.0
// Path SVG disalin terus dari pakej npm lucide-static@1.64.0.
//
// ISC License — Copyright (c) 2026 Lucide Icons and Contributors
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES.
// ============================================================

const LUCIDE_ICONS = {
  "car": "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/> <circle cx=\"7\" cy=\"17\" r=\"2\"/> <path d=\"M9 17h6\"/> <circle cx=\"17\" cy=\"17\" r=\"2\"/>",
  "scooter": "<path d=\"M21 4h-3.5l2 11.05\"/> <path d=\"M6.95 17h5.142c.523 0 .95-.406 1.063-.916a6.5 6.5 0 0 1 5.345-5.009\"/> <circle cx=\"19.5\" cy=\"17.5\" r=\"2.5\"/> <circle cx=\"4.5\" cy=\"17.5\" r=\"2.5\"/>",
  "car-front": "<path d=\"m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8\"/> <path d=\"M7 14h.01\"/> <path d=\"M17 14h.01\"/> <rect width=\"18\" height=\"8\" x=\"3\" y=\"10\" rx=\"2\"/> <path d=\"M5 18v2\"/> <path d=\"M19 18v2\"/>",
  "helicopter": "<path d=\"M11 17v4\"/> <path d=\"M14 3v8a2 2 0 0 0 2 2h5.865\"/> <path d=\"M17 17v4\"/> <path d=\"M18 17a4 4 0 0 0 4-4 8 6 0 0 0-8-6 6 5 0 0 0-6 5v3a2 2 0 0 0 2 2z\"/> <path d=\"M2 10v5\"/> <path d=\"M6 3h16\"/> <path d=\"M7 21h14\"/> <path d=\"M8 13H2\"/>",
  "bike": "<circle cx=\"18.5\" cy=\"17.5\" r=\"3.5\"/> <circle cx=\"5.5\" cy=\"17.5\" r=\"3.5\"/> <circle cx=\"15\" cy=\"5\" r=\"1\"/> <path d=\"M12 17.5V14l-3-3 4-3 2 3h2\"/>",
  "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"/>",
  "id-card": "<path d=\"M13 19a4 4 0 00-8 0\"/> <path d=\"M16 10h2\"/> <path d=\"M16 14h2\"/> <circle cx=\"9\" cy=\"12\" r=\"3\"/> <rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/>",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/> <path d=\"M12 9v4\"/> <path d=\"M12 17h.01\"/>",
  "circle-x": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m15 9-6 6\"/> <path d=\"m9 9 6 6\"/>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m16 9-5.5 5.5L8 12\"/>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"/> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"/>",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"/> <path d=\"m15 5 4 4\"/>",
  "x": "<path d=\"M18 6 6 18\"/> <path d=\"m6 6 12 12\"/>",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\"/> <path d=\"M19 12H5\"/>",
  "log-out": "<path d=\"m16 17 5-5-5-5\"/> <path d=\"M21 12H9\"/> <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/>",
  "motorbike": "<path d=\"m18 14-1-3\"/> <path d=\"m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81\"/> <path d=\"M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5\"/> <circle cx=\"19\" cy=\"17\" r=\"3\"/> <circle cx=\"5\" cy=\"17\" r=\"3\"/>",
  "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/> <path d=\"M15 18H9\"/> <path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/> <circle cx=\"17\" cy=\"18\" r=\"2\"/> <circle cx=\"7\" cy=\"18\" r=\"2\"/>",
  "menu": "<path d=\"M4 5h16\"/> <path d=\"M4 12h16\"/> <path d=\"M4 19h16\"/>",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/> <path d=\"M12 2v2\"/> <path d=\"M12 20v2\"/> <path d=\"m4.93 4.93 1.41 1.41\"/> <path d=\"m17.66 17.66 1.41 1.41\"/> <path d=\"M2 12h2\"/> <path d=\"M20 12h2\"/> <path d=\"m6.34 17.66-1.41 1.41\"/> <path d=\"m19.07 4.93-1.41 1.41\"/>",
  "moon": "<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"/>",
  "languages": "<path d=\"m5 8 6 6\"/> <path d=\"m4 14 6-6 2-3\"/> <path d=\"M2 5h12\"/> <path d=\"M7 2h1\"/> <path d=\"m22 22-5-10-5 10\"/> <path d=\"M14 18h6\"/>",
  "circle-user": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <circle cx=\"12\" cy=\"10\" r=\"3\"/> <path d=\"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662\"/>",
  "plus": "<path d=\"M5 12h14\"/> <path d=\"M12 5v14\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"M12 6v6l4 2\"/>"
};

// Pulangkan SVG ikon sebagai string. Ikon hiasan (aria-hidden) — teks di sebelahnya
// yang bagi makna kepada screen reader. Kalau ikon berdiri sendiri, bagi `label`.
function icon(name, opts = {}) {
  const inner = LUCIDE_ICONS[name];
  if (!inner) return "";
  const size = opts.size || 18;
  const cls = "icon icon-" + name + (opts.className ? " " + opts.className : "");
  const a11y = opts.label ? `role="img" aria-label="${opts.label}"` : `aria-hidden="true" focusable="false"`;
  return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${inner}</svg>`;
}

// Isi semua <span data-icon="nama"> dalam HTML statik.
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]:empty").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, { size: Number(el.dataset.iconSize) || undefined });
  });
}
hydrateIcons();
