// ============================================================
// Servis Tracker — App Logic
// Guna Firebase Firestore (v9 modular, via CDN) sebagai storage
// supaya data boleh diakses dari mana-mana saja (bukan setakat wifi rumah)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc, deleteField,
  onSnapshot, serverTimestamp, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const connStatusEl = document.getElementById("connStatus");
// Teks awal ("Menyambung…") dah diisi oleh i18n.js; selepas ini app.js yang urus status ni.
connStatusEl.removeAttribute("data-i18n");
let vehicles = []; // local cache of {id, ...data}
let currentDetailId = null;
let currentUid = null;
let unsubscribeVehicles = null;
let unsubscribeLicense = null;
let licenseDoc = { classes: [] };

// ---------- AUTH ----------
// Guna Google Sign-In (bukan anonymous) supaya:
//   1) data ikut akaun Google anda — boleh akses dari MANA-MANA device (phone, laptop, dll)
//   2) setiap orang yang guna app ni (kalau public) dapat data terasing ikut akaun masing-masing
function setAuthLoading(msg) {
  connStatusEl.innerHTML = msg;
  connStatusEl.className = "conn-status";
}
function setAuthError(err) {
  connStatusEl.innerHTML = icon("circle-x", { size: 14 }) + " " + t("conn.error") + ": " + linkify(escapeHtml(err.message || String(err)));
  connStatusEl.className = "conn-status err";
}

// Tukar sebarang URL dalam teks ralat Firebase (contoh: link "create index") jadi <a> boleh ditekan.
function linkify(text) {
  return text.replace(/(https?:\/\/[^\s)]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener" class="err-link">${url}</a>`);
}
function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

window.signInGoogle = function () {
  console.log("[ServisTracker] signInGoogle() dipanggil — mula signInWithPopup...");
  signInWithPopup(auth, googleProvider).catch((err) => {
    console.error("[ServisTracker] signInWithPopup gagal:", err);
    setAuthError(err);
  });
};
window.signOutUser = async function () {
  if (unsubscribeVehicles) unsubscribeVehicles();
  if (unsubscribeLicense) unsubscribeLicense();
  licenseDoc = { classes: [] };
  await signOut(auth);
};

// Tiada redirect — popup akan tunjuk error sendiri kalau gagal.
let redirectErrorOccurred = false;

onAuthStateChanged(auth, (user) => {
  console.log("[ServisTracker] onAuthStateChanged fired. user:", user ? user.uid : null);
  const signedOutView = document.getElementById("signedOutView");
  const appShell = document.getElementById("app");
  if (user) {
    currentUid = user.uid;
    signedOutView.style.display = "none";
    appShell.style.display = "block";
    document.getElementById("userEmail").textContent = user.displayName || user.email || t("account.fallback");
    connStatusEl.innerHTML = icon("circle-check", { size: 14 }) + " " + t("conn.ok");
    connStatusEl.className = "conn-status ok";
    listenVehicles(user.uid);
    listenLicense(user.uid);
  } else {
    currentUid = null;
    vehicles = [];
    appShell.style.display = "none";
    signedOutView.style.display = "flex";
    // Jangan biarkan "Menyambung..." terlekat selama-lamanya — kalau tiada ralat
    // redirect, bermakna memang belum log masuk (state normal), so kosongkan status.
    if (!redirectErrorOccurred) {
      connStatusEl.innerHTML = "";
      connStatusEl.className = "conn-status";
    }
  }
});

// ---------- FIRESTORE LISTENER ----------
// Setiap user (UID akaun Google) cuma nampak kenderaan dia sendiri — ditapis dengan
// ownerId (bukan setakat filter client-side; firestore.rules juga enforce ini).
function listenVehicles(uid) {
  if (unsubscribeVehicles) unsubscribeVehicles();
  const q = query(collection(db, "vehicles"), where("ownerId", "==", uid), orderBy("createdAt", "asc"));
  unsubscribeVehicles = onSnapshot(q, (snap) => {
    vehicles = [];
    snap.forEach((d) => vehicles.push({ id: d.id, ...d.data() }));
    renderVehicleList();
    if (currentDetailId) renderDetail(currentDetailId);
  }, (err) => {
    setAuthError(err);
  });
}

// Lesen memandu — satu dokumen sahaja per akaun (ID dokumen = uid), berasingan
// daripada kenderaan sebab lesen melekat pada ORANG bukan pada kenderaan.
function listenLicense(uid) {
  if (unsubscribeLicense) unsubscribeLicense();
  unsubscribeLicense = onSnapshot(doc(db, "driverLicenses", uid), (snap) => {
    licenseDoc = snap.exists() ? snap.data() : { classes: [] };
    renderLicenseCard();
  }, (err) => {
    console.error("[ServisTracker] listenLicense error:", err);
  });
}

// ---------- HELPERS ----------
// Semua tarikh disimpan sebagai "YYYY-MM-DD" ikut masa TEMPATAN (bukan UTC).
// toISOString() guna UTC — di Malaysia (UTC+8) tu bagi tarikh semalam antara 12am-8am.
function pad2(n) {
  return String(n).padStart(2, "0");
}
function ymd(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}
function parseYMD(dateStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  return { y, m, d };
}
function todayStr() {
  const now = new Date();
  return ymd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
// Tambah bulan dan clamp ke hari terakhir bulan (31 Jan + 1 bulan = 28/29 Feb, bukan 3 Mac).
function addMonths(dateStr, months) {
  const { y, m, d } = parseYMD(dateStr);
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12 + 1;
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return ymd(ny, nm, Math.min(d, lastDay));
}
function daysBetween(dateStrA, dateStrB) {
  const a = parseYMD(dateStrA), b = parseYMD(dateStrB);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}
// "2026-11-13" dibaca oleh new Date() sebagai UTC — buat tarikh tempatan supaya paparan tak lari.
function localDate(dateStr) {
  const { y, m, d } = parseYMD(dateStr);
  return new Date(y, m - 1, d);
}

// ---------- VALIDASI MILEAGE ----------
const MAX_MILEAGE = 999999;
// Pulangkan { value } (null = kosong) atau { error } kalau nombor tak sah.
function readMileage(inputId) {
  const raw = document.getElementById(inputId).value.trim();
  if (raw === "") return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > MAX_MILEAGE || !Number.isInteger(n)) {
    return { error: t("err.mileageRange", { max: MAX_MILEAGE.toLocaleString(locale()) }) };
  }
  return { value: n };
}

// ---------- SIMPAN KE FIRESTORE ----------
// Firestore simpan perubahan dalam cache tempatan serta-merta (UI terus update),
// tapi promise cuma selesai bila server sahkan — kalau line lemah/offline, ia boleh
// tergantung lama. Jadi tutup modal terus, dan beritahu kalau server tolak.
function runWrite(promise, okKey, failKey) {
  const okMsg = t(okKey), failMsg = t(failKey);
  if (navigator.onLine) showToast(okMsg, "success");
  else showToast(t("toast.offline", { msg: okMsg }), "offline");
  return promise.catch((err) => {
    console.error("[ServisTracker] Gagal simpan:", err);
    showToast(failMsg + ": " + (err?.message || err), "error");
  });
}
function fmtKm(n) {
  if (n == null) return "-";
  return Number(n).toLocaleString(locale()) + " km";
}
function fmtDate(d) {
  if (!d) return "-";
  return localDate(d).toLocaleDateString(locale(), { year: "numeric", month: "short", day: "numeric" });
}
function statusLabel(status) {
  return t({ ok: "status.ok", warn: "status.warn", danger: "status.danger", na: "status.na", deferred: "status.deferred" }[status]);
}
// "baki 12 hari" / "lewat 3 hari" (dan versi km)
function daysText(n) {
  return n >= 0 ? t("time.daysLeft", { n }) : t("time.daysOver", { n: Math.abs(n) });
}
function kmText(n) {
  return n >= 0 ? t("time.kmLeft", { km: fmtKm(n) }) : t("time.kmOver", { km: fmtKm(Math.abs(n)) });
}
function monthsText(n) {
  return t("time.months", { n });
}
// Status untuk item yang cuma ada tarikh luput (bukan interval km/bulan) — dipakai
// untuk Roadtax & Lesen Memandu. Tiada notifikasi automatik, cuma visual.
function computeDateOnlyStatus(dateStr, warnDays) {
  if (!dateStr) return { status: "na", statusLabel: t("status.noRecord"), remainingDays: null };
  const remainingDays = daysBetween(todayStr(), dateStr);
  let status = "ok";
  if (remainingDays <= 0) status = "danger";
  else if (remainingDays <= (warnDays ?? 30)) status = "warn";
  return { status, statusLabel: statusLabel(status), remainingDays };
}
// Toast ada role="status" (aria-live) — screen reader umumkan mesejnya.
// Mesej ralat dibiar lebih lama supaya sempat dibaca.
// type: "success" | "error" | "info" | "offline" — tentukan ikon dan warna.
const TOAST_ICONS = { success: "circle-check", error: "circle-x", info: "circle-alert", offline: "circle-alert" };
let toastTimer = null;
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  // Bila <dialog> terbuka, halaman belakang jadi inert dan terlindung oleh backdrop —
  // jadi toast mesti duduk dalam dialog tu supaya nampak dan diumumkan.
  const host = document.querySelector("dialog[open]") || document.body;
  if (t.parentElement !== host) host.appendChild(t);
  t.innerHTML = icon(TOAST_ICONS[type] || TOAST_ICONS.info, { size: 16 }) + `<span>${escapeHtml(msg)}</span>`;
  t.className = "toast toast-" + type + " show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), type === "error" ? 6000 : 2500);
}

// ---------- MENU HAMBURGER ----------
// Corak "disclosure": butang (aria-expanded) + panel. Escape / klik di luar / Tab keluar → tutup.
const menuBtn = document.getElementById("menuBtn");
const appMenu = document.getElementById("appMenu");
function openMenu() {
  appMenu.hidden = false;
  menuBtn.setAttribute("aria-expanded", "true");
  appMenu.querySelector("button")?.focus();
}
function closeMenu(focusButton = true) {
  if (appMenu.hidden) return;
  appMenu.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
  if (focusButton) menuBtn.focus();
}
menuBtn.addEventListener("click", () => (appMenu.hidden ? openMenu() : closeMenu()));
document.addEventListener("click", (e) => {
  if (!appMenu.hidden && !e.target.closest(".menu-wrap")) closeMenu(false);
});
appMenu.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
  } else if (e.key === "Tab") {
    setTimeout(() => {
      if (!document.activeElement?.closest(".menu-wrap")) closeMenu(false);
    }, 0);
  }
});
window.signOutUser = ((orig) => async function () {
  closeMenu(false);
  return orig();
})(window.signOutUser);

// Bila bahasa ditukar: render semula semua teks dinamik.
window.onLangChange = function () {
  if (connStatusEl.classList.contains("ok")) {
    connStatusEl.innerHTML = icon("circle-check", { size: 14 }) + " " + t("conn.ok");
  }
  if (currentUid) {
    const u = auth.currentUser;
    document.getElementById("userEmail").textContent = u?.displayName || u?.email || t("account.fallback");
    renderVehicleList();
    renderLicenseCard();
    if (currentDetailId) renderDetail(currentDetailId);
  }
};

// ---------- AKSESIBILITI: KAD, MODAL, RALAT MEDAN ----------
// Elemen bukan-<button> yang ada role="button" kena respon Enter/Space macam butang.
window.activateOnKey = function (e) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.currentTarget.click();
  }
};

// Modal ialah <dialog>; showModal() pindahkan fokus ke dalam, perangkap Tab,
// dan Escape tutup. Kita simpan elemen yang buka modal supaya fokus kembali ke situ.
const modalReturnFocus = {};
function openModal(id) {
  const dlg = document.getElementById(id);
  clearFieldErrors(dlg);
  modalReturnFocus[id] = document.activeElement;
  if (!dlg.open) dlg.showModal();
}
window.closeModal = function (id) {
  const dlg = document.getElementById(id);
  if (dlg.open) dlg.close();
};
document.querySelectorAll("dialog.modal-overlay").forEach((dlg) => {
  dlg.addEventListener("close", () => {
    const back = modalReturnFocus[dlg.id];
    // Detail view dirender semula bila data berubah — kalau butang asal dah tiada, fokus ke tajuk.
    if (back && back.isConnected) back.focus();
    else document.querySelector("#detailView h2, #mainView")?.focus?.();
  });
});

// Papar ralat di bawah medan yang salah (bukan cuma toast yang hilang sendiri).
function fieldError(target, msg) {
  const input = typeof target === "string" ? document.getElementById(target) : target;
  const dlg = input.closest("dialog") || document;
  clearFieldErrors(dlg);
  const errId = (input.id || "field") + "-err";
  const err = document.createElement("div");
  err.className = "field-error";
  err.id = errId;
  err.innerHTML = icon("circle-alert", { size: 14 }) + `<span>${escapeHtml(msg)}</span>`;
  input.insertAdjacentElement("afterend", err);
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", errId);
  input.focus();
  input.addEventListener("input", () => clearFieldErrors(dlg), { once: true });
}
function clearFieldErrors(scope) {
  scope.querySelectorAll(".field-error").forEach((el) => el.remove());
  scope.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
    el.removeAttribute("aria-invalid");
    el.removeAttribute("aria-describedby");
  });
}

// ID unik untuk input yang dijana JS, supaya <label for> boleh sambung.
let fieldSeq = 0;
function nextFieldId(prefix) {
  return `${prefix}-${++fieldSeq}`;
}
function typeDef(typeKey) {
  return VEHICLE_TYPES[typeKey] || VEHICLE_TYPES.car;
}

// ---------- INTERVAL OVERRIDES ----------
// Setiap kenderaan boleh ada "intervals" tersendiri (diisi semasa daftar / diubah kemudian)
// yang override nilai default dalam schedules.js. Shape sentiasa:
//   bukan-minyak: { km, months }
//   ada jenis minyak: { oilTypes: { semi: {km, months}, fully: {km, months} } }
function effectiveInterval(vehicle, itemKey, itemDef) {
  const ov = (vehicle.intervals || {})[itemKey] || {};
  if (itemDef.hasOilType) {
    const out = { oilTypes: {} };
    Object.entries(itemDef.oilTypes).forEach(([ok, odef]) => {
      out.oilTypes[ok] = {
        km: ov.oilTypes?.[ok]?.km ?? odef.km ?? null,
        months: ov.oilTypes?.[ok]?.months ?? odef.months ?? null
      };
    });
    return out;
  }
  return {
    km: ov.km ?? itemDef.km ?? null,
    months: ov.months ?? itemDef.months ?? null
  };
}

// ---------- TANGGUH KE SERVIS SETERUSNYA ----------
// Item yang hampir tiba / lewat boleh ditangguh hingga servis minyak enjin seterusnya.
// Disimpan dalam serviceLog.<item>.deferred = { untilKm, untilDate, oilLastKm, oilLastDate, setOn }.
// Tangguh tamat bila: mileage capai untilKm, tarikh capai untilDate, ATAU minyak enjin
// dilog semula (servis dah berlaku). Log servis item tu sendiri buang rekod tangguh
// secara automatik sebab entri serviceLog diganti terus.
const DEFER_ANCHOR = "engine_oil";

// Titik servis minyak enjin seterusnya — sasaran tangguh. null kalau tak boleh dikira.
function deferAnchor(vehicle) {
  const def = typeDef(vehicle.typeKey).items[DEFER_ANCHOR];
  if (!def) return null;
  const s = computeItemStatus(vehicle, DEFER_ANCHOR, def, true);
  if (s.status === "na" || s.status === "danger") return null;
  if (s.nextDueKm == null && s.nextDueDate == null) return null;
  const log = vehicle.serviceLog?.[DEFER_ANCHOR] || {};
  return { untilKm: s.nextDueKm, untilDate: s.nextDueDate, oilLastKm: log.lastMileage ?? null, oilLastDate: log.lastDate ?? null };
}

function isDeferActive(vehicle, d) {
  if (!d) return false;
  const oil = vehicle.serviceLog?.[DEFER_ANCHOR] || {};
  if ((oil.lastMileage ?? null) !== (d.oilLastKm ?? null) || (oil.lastDate ?? null) !== (d.oilLastDate ?? null)) return false;
  if (d.untilKm != null && (vehicle.currentMileage || 0) >= d.untilKm) return false;
  if (d.untilDate != null && todayStr() >= d.untilDate) return false;
  return true;
}

function canDefer(vehicle, itemKey, s) {
  return itemKey !== DEFER_ANCHOR && (s.status === "warn" || s.status === "danger") && !!deferAnchor(vehicle);
}

window.deferItem = function (vehicleId, itemKey) {
  const v = vehicles.find((x) => x.id === vehicleId);
  const a = v && deferAnchor(v);
  if (!a) return;
  runWrite(updateDoc(doc(db, "vehicles", vehicleId), {
    [`serviceLog.${itemKey}.deferred`]: { ...a, setOn: todayStr() }
  }), "toast.deferred", "toast.deferFail");
};

window.undeferItem = function (vehicleId, itemKey) {
  runWrite(updateDoc(doc(db, "vehicles", vehicleId), {
    [`serviceLog.${itemKey}.deferred`]: deleteField()
  }), "toast.deferCleared", "toast.deferFail");
};

// Kira status untuk satu item berjadual (bukan custom).
// ignoreDefer = true → status sebenar tanpa ambil kira tangguh.
function computeItemStatus(vehicle, itemKey, itemDef, ignoreDefer = false) {
  const log = (vehicle.serviceLog || {})[itemKey];
  const eff = effectiveInterval(vehicle, itemKey, itemDef);
  let intervalKm = itemDef.hasOilType ? null : eff.km;
  let intervalMonths = itemDef.hasOilType ? null : eff.months;
  let oilType = null;

  if (itemDef.hasOilType) {
    oilType = log?.oilType || null;
    if (oilType && eff.oilTypes[oilType]) {
      intervalKm = eff.oilTypes[oilType].km ?? null;
      intervalMonths = eff.oilTypes[oilType].months ?? null;
    } else {
      intervalKm = null;
      intervalMonths = null;
    }
  }

  // Rekod wujud kalau ada mileage ATAU tarikh — item ikut bulan saja (cth Bateri) tak perlukan km.
  if (!log || (log.lastMileage == null && !log.lastDate)) {
    return {
      status: "na",
      statusLabel: t("status.noRecordYet"),
      nextDueKm: null,
      nextDueDate: null,
      remainingKm: null,
      remainingDays: null,
      oilType
    };
  }

  const nextDueKm = intervalKm != null && log.lastMileage != null ? log.lastMileage + intervalKm : null;
  const nextDueDate = intervalMonths != null && log.lastDate ? addMonths(log.lastDate, intervalMonths) : null;

  const remainingKm = nextDueKm != null ? nextDueKm - (vehicle.currentMileage || 0) : null;
  const remainingDays = nextDueDate != null ? daysBetween(todayStr(), nextDueDate) : null;

  const kmBuffer = intervalKm != null ? Math.max(300, Math.round(intervalKm * 0.08)) : null;
  const dayBuffer = 14;

  let status = "ok";
  const kmOverdue = remainingKm != null && remainingKm <= 0;
  const dateOverdue = remainingDays != null && remainingDays <= 0;
  const kmWarn = remainingKm != null && remainingKm <= kmBuffer;
  const dateWarn = remainingDays != null && remainingDays <= dayBuffer;

  if (kmOverdue || dateOverdue) status = "danger";
  else if (kmWarn || dateWarn) status = "warn";

  // Tangguh hanya bermakna bila item memang perlu servis; bila status sebenar dah OK, abaikan.
  const deferred = !ignoreDefer && status !== "ok" && isDeferActive(vehicle, log.deferred) ? log.deferred : null;
  if (deferred) status = "deferred";

  return {
    status,
    statusLabel: statusLabel(status),
    deferred,
    nextDueKm,
    nextDueDate,
    remainingKm,
    remainingDays,
    oilType
  };
}

function computeCustomItemStatus(vehicle, item) {
  if (item.lastMileage == null && !item.lastDate) {
    return { status: "na", statusLabel: t("status.noRecordYet"), nextDueKm: null, nextDueDate: null, remainingKm: null, remainingDays: null };
  }
  const nextDueKm = item.kmInterval && item.lastMileage != null ?item.lastMileage + Number(item.kmInterval) : null;
  const nextDueDate = item.monthsInterval && item.lastDate ? addMonths(item.lastDate, Number(item.monthsInterval)) : null;
  const remainingKm = nextDueKm != null ? nextDueKm - (vehicle.currentMileage || 0) : null;
  const remainingDays = nextDueDate != null ? daysBetween(todayStr(), nextDueDate) : null;
  const kmBuffer = item.kmInterval ? Math.max(300, Math.round(item.kmInterval * 0.08)) : null;

  let status = "ok";
  const kmOverdue = remainingKm != null && remainingKm <= 0;
  const dateOverdue = remainingDays != null && remainingDays <= 0;
  const kmWarn = remainingKm != null && kmBuffer != null && remainingKm <= kmBuffer;
  const dateWarn = remainingDays != null && remainingDays <= 14;
  if (kmOverdue || dateOverdue) status = "danger";
  else if (kmWarn || dateWarn) status = "warn";

  return { status, statusLabel: statusLabel(status), nextDueKm, nextDueDate, remainingKm, remainingDays };
}

function worstStatus(vehicle) {
  const td = typeDef(vehicle.typeKey);
  let worst = "na";
  const rank = { na: -1, ok: 0, deferred: 0, warn: 1, danger: 2 };
  Object.entries(td.items).forEach(([key, def]) => {
    const s = computeItemStatus(vehicle, key, def).status;
    if (rank[s] > rank[worst]) worst = s;
  });
  (vehicle.customItems || []).forEach((item) => {
    const s = computeCustomItemStatus(vehicle, item).status;
    if (rank[s] > rank[worst]) worst = s;
  });
  if (vehicle.roadtaxExpiry) {
    const s = computeDateOnlyStatus(vehicle.roadtaxExpiry).status;
    if (rank[s] > rank[worst]) worst = s;
  }
  return worst;
}

// ---------- GAMBAR KENDERAAN (compress + resize di browser, simpan sbg base64 dlm Firestore) ----------
// Firestore ada had 1MB sedokumen — so gambar WAJIB dimampat kecil dulu.
// Guna Firebase Storage lebih "proper" tapi perlukan setup tambahan (produk
// Firebase lain + rules baru) — kita elak untuk kekalkan SETUP_GUIDE simple.

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith("image/")) {
      reject({ notImage: true });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      reject({ tooBig: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const maxDim = 480;
        if (w > h && w > maxDim) { h = Math.round(h * (maxDim / w)); w = maxDim; }
        else if (h >= w && h > maxDim) { w = Math.round(w * (maxDim / h)); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        let dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        if (dataUrl.length > 900 * 1024) dataUrl = canvas.toDataURL("image/jpeg", 0.5);
        if (dataUrl.length > 900 * 1024) {
          reject({ tooBig: true });
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject({ error: true });
      img.src = e.target.result;
    };
    reader.onerror = () => reject({ error: true });
    reader.readAsDataURL(file);
  });
}

// Sambungkan satu <input type=file> kepada preview + callback bila gambar siap dimampat.
function bindPhotoInput(inputEl, previewImgEl, previewWrapEl, onReady) {
  inputEl.onchange = async () => {
    const file = inputEl.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      previewImgEl.src = dataUrl;
      previewWrapEl.style.display = "block";
      onReady(dataUrl);
    } catch (err) {
      showToast(t("err.photo"), "error");
      inputEl.value = "";
    }
  };
}

// Bina HTML satu "interval-group" untuk satu item (dipakai di borang daftar & borang ubah interval)
function renderIntervalGroupHTML(itemKey, def, values) {
  // Setiap input dapat ID unik + <label for>; setiap kumpulan ada role="group"
  // supaya screen reader sebut konteks (cth "Minyak Brek, Interval (km)").
  const field = (labelText, dataField, value, placeholder) => {
    const id = nextFieldId("iv");
    return `<div class="interval-field"><label for="${id}">${labelText}</label><input id="${id}" type="number" inputmode="numeric" min="1" data-field="${dataField}" value="${value ?? ""}"${placeholder ? ` placeholder="${placeholder}"` : ""}></div>`;
  };
  let inner = "";
  if (def.hasOilType) {
    const sub = (label, prefix, iv) => {
      const subId = nextFieldId("ivsub");
      return `
      <div role="group" aria-labelledby="${subId}">
        <div class="interval-subtitle" id="${subId}">${label}</div>
        <div class="interval-row">
          ${field(t("interval.km"), prefix + "Km", iv.km)}
          ${field(t("interval.months"), prefix + "Months", iv.months)}
        </div>
      </div>`;
    };
    inner = sub(t("oil.semi"), "semi", values.oilTypes.semi) + sub(t("oil.fully"), "fully", values.oilTypes.fully);
  } else {
    inner = `
      <div class="interval-row">
        ${field(t("interval.km"), "km", values.km, t("interval.blank"))}
        ${field(t("interval.months"), "months", values.months, t("interval.blank"))}
      </div>
    `;
  }
  const titleId = nextFieldId("ivtitle");
  return `
    <div class="interval-group" data-item-key="${itemKey}" role="group" aria-labelledby="${titleId}">
      <div class="interval-group-title" id="${titleId}">${tr(def.label)}</div>
      ${def.note ? `<div class="interval-group-note">${tr(def.note)}</div>` : ""}
      ${inner}
    </div>
  `;
}

// Render borang interval untuk SEMUA item satu jenis kenderaan (dipakai di modal Daftar Kenderaan)
function renderIntervalForm(containerEl, items) {
  containerEl.innerHTML = Object.entries(items).map(([key, def]) => {
    const defaultValues = def.hasOilType
      ? { oilTypes: { semi: { ...def.oilTypes.semi }, fully: { ...def.oilTypes.fully } } }
      : { km: def.km ?? null, months: def.months ?? null };
    return renderIntervalGroupHTML(key, def, defaultValues);
  }).join("");
}

// Baca semula nilai dari borang interval -> { itemKey: {km,months} atau {oilTypes:{...}} }
function collectIntervalsFromForm(containerEl, items) {
  const intervals = {};
  containerEl.querySelectorAll(".interval-group").forEach((group) => {
    const key = group.dataset.itemKey;
    const def = items[key];
    if (!def) return;
    const val = (sel) => {
      const el = group.querySelector(`[data-field="${sel}"]`);
      if (!el || el.value === "") return null;
      return Number(el.value);
    };
    if (def.hasOilType) {
      intervals[key] = {
        oilTypes: {
          semi: { km: val("semiKm"), months: val("semiMonths") },
          fully: { km: val("fullyKm"), months: val("fullyMonths") }
        }
      };
    } else {
      intervals[key] = { km: val("km"), months: val("months") };
    }
  });
  return intervals;
}

// ---------- RENDER: VEHICLE LIST ----------
function renderVehicleList() {
  const listEl = document.getElementById("vehicleList");
  const emptyEl = document.getElementById("emptyState");
  listEl.innerHTML = "";
  if (vehicles.length === 0) {
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  vehicles.forEach((v) => {
    const td = typeDef(v.typeKey);
    const status = worstStatus(v);
    const hasName = !!v.vehicleName;
    const thumbHtml = v.photoBase64 ? `<img src="${v.photoBase64}" class="vehicle-thumb" alt="">` : "";
    let roadtaxLine = "";
    if (v.roadtaxExpiry) {
      const rs = computeDateOnlyStatus(v.roadtaxExpiry);
      roadtaxLine = `<div class="vehicle-roadtax">${icon("id-card", { size: 14 })} ${t("vehicle.roadtax")}: ${fmtDate(v.roadtaxExpiry)} (${daysText(rs.remainingDays)})</div>`;
    }

    const card = document.createElement("div");
    card.className = "vehicle-card";
    card.setAttribute("role", "button");
    card.dataset.id = v.id;
    card.tabIndex = 0;
    card.onclick = () => openDetailView(v.id);
    card.onkeydown = activateOnKey;
    card.innerHTML = `
      <div class="vehicle-card-top">
        <div class="vehicle-card-left">
          ${thumbHtml}
          <div style="min-width:0;">
            <div class="vehicle-title">${hasName ? escapeHtml(v.vehicleName) : icon(td.icon) + " " + tr(td.label)}</div>
            ${hasName ? `<div class="vehicle-subtype">${icon(td.icon, { size: 14 })} ${tr(td.label)}</div>` : ""}
            ${v.plateNo ? `<div class="vehicle-plate">${escapeHtml(v.plateNo)}</div>` : ""}
          </div>
        </div>
        <span class="status-badge status-${status}">${statusLabel(status)}</span>
      </div>
      <div class="vehicle-mileage">${t("vehicle.mileage")}: <strong>${fmtKm(v.currentMileage)}</strong></div>
      ${roadtaxLine}
    `;
    listEl.appendChild(card);
  });
}

// ---------- LESEN MEMANDU: RENDER CARD DASHBOARD ----------
function renderLicenseCard() {
  const classes = licenseDoc.classes || [];
  const badgeEl = document.getElementById("licenseStatusBadge");
  const bodyEl = document.getElementById("licenseCardBody");
  if (!badgeEl || !bodyEl) return;
  // Kandungan kad ni diurus oleh JS (bukan applyI18n) supaya tak ditimpa bila tukar bahasa.
  badgeEl.removeAttribute("data-i18n");
  bodyEl.removeAttribute("data-i18n");

  if (classes.length === 0) {
    badgeEl.className = "status-badge status-na";
    badgeEl.textContent = t("license.emptyBadge");
    bodyEl.textContent = t("license.emptyBody");
    return;
  }
  const rank = { na: -1, ok: 0, deferred: 0, warn: 1, danger: 2 };
  let worst = "na";
  classes.forEach((c) => {
    const s = computeDateOnlyStatus(c.expiry).status;
    if (rank[s] > rank[worst]) worst = s;
  });
  badgeEl.className = "status-badge status-" + worst;
  badgeEl.textContent = worst === "na" ? "-" : statusLabel(worst);
  bodyEl.innerHTML = classes.map((c) => {
    const found = JPJ_LICENSE_CLASSES.find((x) => x.value === c.class);
    const label = found ? tr(found.label) : c.class;
    const s = computeDateOnlyStatus(c.expiry);
    return `${escapeHtml(label)} — ${c.expiry ? fmtDate(c.expiry) : t("license.noDate")} (${s.statusLabel})`;
  }).join("<br>");
}

// ---------- DETAIL VIEW ----------
function openDetailView(id) {
  currentDetailId = id;
  document.getElementById("mainView").style.display = "none";
  document.getElementById("detailView").style.display = "block";
  renderDetail(id);
  // Pengguna papan kekunci/screen reader: pindah fokus ke tajuk halaman baru.
  document.querySelector("#detailContent h2")?.focus();
}
window.closeDetailView = function () {
  const backTo = currentDetailId;
  currentDetailId = null;
  document.getElementById("detailView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
  // Pulangkan fokus ke kad kenderaan yang dibuka tadi.
  if (backTo) document.querySelector(`.vehicle-card[data-id="${backTo}"]`)?.focus();
};

function renderDetail(id) {
  const v = vehicles.find((x) => x.id === id);
  if (!v) return closeDetailView();
  const td = typeDef(v.typeKey);
  const container = document.getElementById("detailContent");

  const itemKeys = Object.keys(td.items);
  let itemsHtml = "";
  if (itemKeys.length === 0) {
    itemsHtml = `<div class="item-meta" style="padding:4px 0 12px;">${t("detail.noSchedule")}</div>`;
  } else {
    itemKeys.forEach((key) => {
      const def = td.items[key];
      const s = computeItemStatus(v, key, def);
      const log = (v.serviceLog || {})[key];
      itemsHtml += renderItemCard(v, key, def, s, log);
    });
  }

  const rs = computeDateOnlyStatus(v.roadtaxExpiry);
  const roadtaxHtml = `
    <div class="item-card ${rs.status}">
      <div class="item-top">
        <span class="item-label">${icon("id-card")} ${t("vehicle.roadtax")}</span>
        <span class="status-badge status-${rs.status}">${rs.statusLabel}</span>
      </div>
      <div class="item-meta">${v.roadtaxExpiry
        ? `${t("roadtax.expires")}: <strong>${fmtDate(v.roadtaxExpiry)}</strong> (${daysText(rs.remainingDays)})`
        : t("roadtax.notSet")}</div>
    </div>
  `;

  let customHtml = "";
  (v.customItems || []).forEach((item) => {
    const s = computeCustomItemStatus(v, item);
    customHtml += renderCustomItemCard(v.id, item, s);
  });

  const photoHtml = v.photoBase64 ? `<img src="${v.photoBase64}" class="detail-photo" alt="">` : "";
  const hasName = !!v.vehicleName;

  container.innerHTML = `
    ${photoHtml}
    <div class="detail-header">
      <div>
        <h2 tabindex="-1">${hasName ? escapeHtml(v.vehicleName) : icon(td.icon, { size: 22 }) + " " + tr(td.label)}</h2>
        ${hasName ? `<div class="vehicle-subtype">${icon(td.icon, { size: 14 })} ${tr(td.label)}</div>` : ""}
        ${v.plateNo ? `<div class="vehicle-plate">${escapeHtml(v.plateNo)}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="openUpdateMileageModal('${v.id}')">${t("detail.updateMileage")}</button>
        <button class="btn btn-outline btn-sm" onclick="openEditVehicleModal('${v.id}')">${icon("pencil", { size: 14 })} ${t("detail.editVehicle")}</button>
      </div>
    </div>
    <div class="vehicle-mileage">${t("vehicle.mileage")}: <strong>${fmtKm(v.currentMileage)}</strong></div>

    <div class="section-title">${t("vehicle.roadtax")}</div>
    <div class="item-list">${roadtaxHtml}</div>

    <div class="section-title">${t("detail.schedule")}</div>
    <div class="item-list">${itemsHtml}</div>

    <div class="section-title">${t("detail.customItems")}</div>
    <div class="item-list">${customHtml}</div>
    <div class="detail-actions">
      <button class="btn btn-secondary btn-sm" onclick="openAddCustomItemModal('${v.id}')">${icon("plus", { size: 16 })} ${t("detail.addItem")}</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDeleteVehicle('${v.id}')">${t("detail.deleteVehicle")}</button>
    </div>
  `;
}

function intervalSummaryText(def, eff) {
  const part = (iv) => [iv.km != null ? fmtKm(iv.km) : null, iv.months != null ? monthsText(iv.months) : null].filter(Boolean).join(" / ");
  if (def.hasOilType) {
    return `${t("oil.semi")}: ${part(eff.oilTypes.semi) || "-"} &nbsp;•&nbsp; ${t("oil.fully")}: ${part(eff.oilTypes.fully) || "-"}`;
  }
  return part(eff) || t("item.noInterval");
}

function renderItemCard(vehicle, key, def, s, log) {
  const vehicleId = vehicle.id;
  const eff = effectiveInterval(vehicle, key, def);
  let metaLines = [];
  let nextServiceHtml = "";
  if (s.status === "na") {
    metaLines.push(t("item.noRecord"));
  } else {
    metaLines.push(`${t("item.last")}: ${log?.lastMileage != null ? fmtKm(log.lastMileage) + " " : ""}(${fmtDate(log?.lastDate)})`);
    if (s.nextDueKm != null) nextServiceHtml = `<div class="next-due-highlight">${t("item.nextKm")}: <strong>${fmtKm(s.nextDueKm)}</strong> <span class="next-due-sub">(${kmText(s.remainingKm)})</span></div>`;
    if (s.nextDueDate != null) metaLines.push(`${t("item.nextDate")}: <strong>${fmtDate(s.nextDueDate)}</strong> (${daysText(s.remainingDays)})`);
    if (s.oilType && def.oilTypes) metaLines.push(`${t("item.oilUsed")}: ${t("oil." + s.oilType)}`);
    if (log?.lastNote) metaLines.push(`${t("item.note")}: ${escapeHtml(log.lastNote)}`);
  }
  metaLines.push(`${t("item.interval")}: ${intervalSummaryText(def, eff)}`);
  if (def.note) metaLines.push(`<em>${tr(def.note)}</em>`);

  let deferHtml = "";
  let deferBtn = "";
  if (s.deferred) {
    const when = [s.deferred.untilKm != null ? fmtKm(s.deferred.untilKm) : null, s.deferred.untilDate ? fmtDate(s.deferred.untilDate) : null].filter(Boolean).join(" / ");
    deferHtml = `<div class="defer-note">${icon("clock", { size: 14 })} <span>${t("item.deferredUntil", { when })}</span></div>`;
    deferBtn = `<button class="item-edit-link" onclick="undeferItem('${vehicleId}', '${key}')">${t("item.deferUndo")}</button>`;
  } else if (canDefer(vehicle, key, s)) {
    deferBtn = `<button class="btn btn-secondary btn-sm" onclick="deferItem('${vehicleId}', '${key}')">${icon("clock", { size: 14 })} ${t("item.defer")}</button>`;
  }

  return `
    <div class="item-card ${s.status}">
      <div class="item-top">
        <span class="item-label">${tr(def.label)}</span>
        <span class="status-badge status-${s.status}">${s.statusLabel}</span>
      </div>
      ${deferHtml}
      ${nextServiceHtml}
      <div class="item-meta">${metaLines.join("<br>")}</div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="openLogServiceModal('${vehicleId}', '${key}', ${!!def.hasOilType})">${t("item.log")}</button>
        ${deferBtn}
        <button class="item-edit-link" onclick="openEditIntervalModal('${vehicleId}', '${key}')">${icon("pencil", { size: 13 })} ${t("item.editInterval")}</button>
      </div>
    </div>
  `;
}

function renderCustomItemCard(vehicleId, item, s) {
  let metaLines = [];
  if (s.status === "na") {
    metaLines.push(t("custom.noRecord"));
  } else {
    if (s.nextDueKm != null) metaLines.push(`${t("custom.nextKm")}: <strong>${fmtKm(s.nextDueKm)}</strong> (${kmText(s.remainingKm)})`);
    if (s.nextDueDate != null) metaLines.push(`${t("custom.nextDate")}: <strong>${fmtDate(s.nextDueDate)}</strong>`);
  }
  return `
    <div class="item-card ${s.status}">
      <div class="item-top">
        <span class="item-label">${escapeHtml(item.label)}</span>
        <span class="status-badge status-${s.status}">${s.statusLabel}</span>
      </div>
      <div class="item-meta">${metaLines.join("<br>")}</div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="openLogServiceModal('${vehicleId}', '${item.id}', false, true)">${t("custom.log")}</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteCustomItem('${vehicleId}', '${item.id}')">${t("custom.delete")}</button>
      </div>
    </div>
  `;
}

// ---------- MODALS ----------

// Add Vehicle
let newVehiclePhotoData = null;
document.getElementById("addVehicleBtn").onclick = () => {
  closeMenu(true); // fokus ke butang menu dulu, supaya modal pulangkan fokus ke situ
  openAddVehicleModal();
};
window.openAddVehicleModal = function () {
  const sel = document.getElementById("newVehicleType");
  // Hanya jenis semasa (Kereta, Motosikal, Van, Lori) — jenis lama disorok.
  sel.innerHTML = Object.entries(VEHICLE_TYPES)
    .filter(([, v]) => !v.legacy)
    .map(([k, v]) => `<option value="${k}">${escapeHtml(tr(v.label))}</option>`).join("");
  document.getElementById("newVehicleName").value = "";
  document.getElementById("newVehiclePlate").value = "";
  document.getElementById("newVehicleMileage").value = "";
  document.getElementById("newVehicleRoadtax").value = "";
  newVehiclePhotoData = null;
  document.getElementById("newVehiclePhotoInput").value = "";
  document.getElementById("newVehiclePhotoPreviewWrap").style.display = "none";
  bindPhotoInput(
    document.getElementById("newVehiclePhotoInput"),
    document.getElementById("newVehiclePhotoPreview"),
    document.getElementById("newVehiclePhotoPreviewWrap"),
    (dataUrl) => { newVehiclePhotoData = dataUrl; }
  );

  const intervalsEl = document.getElementById("newVehicleIntervals");
  const renderForSelected = () => {
    const td = typeDef(sel.value);
    renderIntervalForm(intervalsEl, td.items);
  };
  sel.onchange = renderForSelected;
  renderForSelected();

  openModal("addVehicleModal");
};
window.clearNewVehiclePhoto = function () {
  newVehiclePhotoData = null;
  document.getElementById("newVehiclePhotoInput").value = "";
  document.getElementById("newVehiclePhotoPreviewWrap").style.display = "none";
};
window.submitAddVehicle = async function () {
  if (!currentUid) return showToast(t("err.signInFirst"), "error");
  const typeKey = document.getElementById("newVehicleType").value;
  const vehicleName = document.getElementById("newVehicleName").value.trim();
  const plateNo = document.getElementById("newVehiclePlate").value.trim();
  const m = readMileage("newVehicleMileage");
  if (m.error) return fieldError("newVehicleMileage", m.error);
  const mileage = m.value ?? 0;
  const roadtaxExpiry = document.getElementById("newVehicleRoadtax").value || null;

  const td = typeDef(typeKey);
  const intervalsEl = document.getElementById("newVehicleIntervals");
  const intervals = collectIntervalsFromForm(intervalsEl, td.items);

  const payload = {
    ownerId: currentUid,
    typeKey, plateNo, currentMileage: mileage,
    serviceLog: {}, customItems: [], intervals,
    vehicleName: vehicleName || null,
    roadtaxExpiry: roadtaxExpiry || null,
    photoBase64: newVehiclePhotoData || null,
    createdAt: serverTimestamp()
  };
  closeModal("addVehicleModal");
  runWrite(addDoc(collection(db, "vehicles"), payload), "toast.vehicleAdded", "toast.vehicleAddFail");
};

// Edit Vehicle (nama/plate/gambar/roadtax selepas daftar)
let editVehicleTargetId = null;
let editVehiclePhotoData = null;
window.openEditVehicleModal = function (vehicleId) {
  const v = vehicles.find((x) => x.id === vehicleId);
  if (!v) return;
  editVehicleTargetId = vehicleId;
  editVehiclePhotoData = v.photoBase64 || null;
  document.getElementById("editVehicleName").value = v.vehicleName || "";
  document.getElementById("editVehiclePlate").value = v.plateNo || "";
  document.getElementById("editVehicleRoadtax").value = v.roadtaxExpiry || "";
  document.getElementById("editVehiclePhotoInput").value = "";
  const previewWrap = document.getElementById("editVehiclePhotoPreviewWrap");
  const previewImg = document.getElementById("editVehiclePhotoPreview");
  if (v.photoBase64) {
    previewImg.src = v.photoBase64;
    previewWrap.style.display = "block";
  } else {
    previewWrap.style.display = "none";
  }
  bindPhotoInput(
    document.getElementById("editVehiclePhotoInput"),
    previewImg,
    previewWrap,
    (dataUrl) => { editVehiclePhotoData = dataUrl; }
  );
  openModal("editVehicleModal");
};
window.clearEditVehiclePhoto = function () {
  editVehiclePhotoData = null;
  document.getElementById("editVehiclePhotoInput").value = "";
  document.getElementById("editVehiclePhotoPreviewWrap").style.display = "none";
};
window.submitEditVehicle = async function () {
  if (!editVehicleTargetId) return;
  const vehicleName = document.getElementById("editVehicleName").value.trim();
  const plateNo = document.getElementById("editVehiclePlate").value.trim();
  const roadtaxExpiry = document.getElementById("editVehicleRoadtax").value || null;
  closeModal("editVehicleModal");
  runWrite(updateDoc(doc(db, "vehicles", editVehicleTargetId), {
    vehicleName: vehicleName || null,
    plateNo: plateNo || null,
    roadtaxExpiry: roadtaxExpiry || null,
    photoBase64: editVehiclePhotoData || null
  }), "toast.vehicleUpdated", "toast.vehicleUpdateFail");
};

// ---------- LESEN MEMANDU: MODAL ----------
function licenseClassRowHTML(selectedClass, expiry) {
  const options = JPJ_LICENSE_CLASSES.map((c) =>
    `<option value="${c.value}" ${c.value === selectedClass ? "selected" : ""}>${escapeHtml(tr(c.label))}</option>`
  ).join("");
  const classId = nextFieldId("lic-class");
  const expiryId = nextFieldId("lic-expiry");
  return `
    <div class="class-row" data-license-row>
      <div class="interval-field">
        <label for="${classId}">${t("license.class")}</label>
        <select id="${classId}" data-field="class">${options}</select>
      </div>
      <div class="interval-field">
        <label for="${expiryId}">${t("license.expiry")}</label>
        <input id="${expiryId}" type="date" data-field="expiry" value="${expiry || ""}">
      </div>
      <button type="button" class="class-row-delete" aria-label="${t("license.removeRow")}" onclick="this.closest('[data-license-row]').remove()">${icon("x")}</button>
    </div>
  `;
}
window.openLicenseModal = function () {
  const rowsEl = document.getElementById("licenseClassRows");
  const classes = licenseDoc.classes && licenseDoc.classes.length > 0 ? licenseDoc.classes : [{ class: "", expiry: "" }];
  rowsEl.innerHTML = classes.map((c) => licenseClassRowHTML(c.class, c.expiry)).join("");
  openModal("licenseModal");
};
window.addLicenseClassRow = function () {
  const rowsEl = document.getElementById("licenseClassRows");
  rowsEl.insertAdjacentHTML("beforeend", licenseClassRowHTML("", ""));
};
window.submitLicense = async function () {
  if (!currentUid) return showToast(t("err.signInFirst"), "error");
  const rowsEl = document.getElementById("licenseClassRows");
  const classes = [];
  rowsEl.querySelectorAll("[data-license-row]").forEach((row) => {
    const classVal = row.querySelector('[data-field="class"]').value;
    const expiryVal = row.querySelector('[data-field="expiry"]').value;
    if (classVal) classes.push({ class: classVal, expiry: expiryVal || null });
  });
  closeModal("licenseModal");
  runWrite(setDoc(doc(db, "driverLicenses", currentUid), { classes, updatedAt: serverTimestamp() }),
    "toast.licenseSaved", "toast.licenseFail");
};

// Edit Interval (satu item, selepas daftar)
let editIntervalTarget = { vehicleId: null, itemKey: null };
window.openEditIntervalModal = function (vehicleId, itemKey) {
  editIntervalTarget = { vehicleId, itemKey };
  const v = vehicles.find((x) => x.id === vehicleId);
  const td = typeDef(v.typeKey);
  const def = td.items[itemKey];
  const eff = effectiveInterval(v, itemKey, def);

  document.getElementById("editIntervalTitle").textContent = t("editInterval.title") + " — " + tr(def.label);
  const container = document.getElementById("editIntervalFields");
  container.innerHTML = renderIntervalGroupHTML(itemKey, def, eff);
  openModal("editIntervalModal");
};
window.submitEditInterval = async function () {
  const { vehicleId, itemKey } = editIntervalTarget;
  const v = vehicles.find((x) => x.id === vehicleId);
  const td = typeDef(v.typeKey);
  const container = document.getElementById("editIntervalFields");
  const intervals = collectIntervalsFromForm(container, td.items);
  const badInput = [...container.querySelectorAll("input[data-field]")]
    .find((el) => el.value !== "" && !(Number(el.value) > 0));
  if (badInput) return fieldError(badInput, t("err.intervalPositive"));
  closeModal("editIntervalModal");
  runWrite(updateDoc(doc(db, "vehicles", vehicleId), {
    [`intervals.${itemKey}`]: intervals[itemKey]
  }), "toast.intervalSaved", "toast.intervalFail");
};

// Update Mileage
let mileageTargetId = null;
window.openUpdateMileageModal = function (id) {
  mileageTargetId = id;
  const v = vehicles.find((x) => x.id === id);
  document.getElementById("updateMileageInput").value = v?.currentMileage || "";
  openModal("updateMileageModal");
};
window.submitUpdateMileage = async function () {
  const m = readMileage("updateMileageInput");
  if (m.error) return fieldError("updateMileageInput", m.error);
  if (m.value == null) return fieldError("updateMileageInput", t("err.mileageRequired"));
  const v = vehicles.find((x) => x.id === mileageTargetId);
  const current = v?.currentMileage || 0;
  if (m.value < current &&
      !confirm(t("err.mileageLower", { next: fmtKm(m.value), current: fmtKm(current) }))) {
    return;
  }
  closeModal("updateMileageModal");
  runWrite(updateDoc(doc(db, "vehicles", mileageTargetId), { currentMileage: m.value }),
    "toast.mileageSaved", "toast.mileageFail");
};

// Log Service
let logTarget = { vehicleId: null, itemKey: null, hasOilType: false, isCustom: false };
window.openLogServiceModal = function (vehicleId, itemKey, hasOilType, isCustom) {
  logTarget = { vehicleId, itemKey, hasOilType: !!hasOilType, isCustom: !!isCustom };
  const v = vehicles.find((x) => x.id === vehicleId);
  const td = typeDef(v.typeKey);
  const def = isCustom ? (v.customItems || []).find((c) => c.id === itemKey) : td.items[itemKey];

  document.getElementById("logServiceTitle").textContent = t("log.title") + " — " + tr(def.label);
  const oilRow = document.getElementById("oilTypeRow");
  if (hasOilType) {
    oilRow.style.display = "block";
    const sel = document.getElementById("logOilType");
    const eff = effectiveInterval(v, itemKey, def);
    sel.innerHTML = Object.entries(def.oilTypes).map(([k, o]) => {
      const km = eff.oilTypes[k]?.km;
      return `<option value="${k}">${t("oil." + k)}${km != null ? ` (+${fmtKm(km)})` : ""}</option>`;
    }).join("");
  } else {
    oilRow.style.display = "none";
  }
  document.getElementById("logServiceMileage").value = v.currentMileage || "";
  document.getElementById("logServiceDate").value = todayStr();
  document.getElementById("logServiceNote").value = "";
  openModal("logServiceModal");
};
window.submitLogService = async function () {
  const { vehicleId, itemKey, hasOilType, isCustom } = logTarget;
  const m = readMileage("logServiceMileage");
  if (m.error) return fieldError("logServiceMileage", m.error);
  const mileage = m.value; // null = tak diisi (OK untuk item yang ikut bulan saja)
  const dateVal = document.getElementById("logServiceDate").value || todayStr();
  if (dateVal > todayStr()) return fieldError("logServiceDate", t("err.dateFuture"));
  const note = document.getElementById("logServiceNote").value.trim();
  const v = vehicles.find((x) => x.id === vehicleId);
  const oilType = hasOilType ? document.getElementById("logOilType").value : undefined;

  // Mileage wajib kalau item ni ada interval km — tanpa km, next servis tak boleh dikira.
  let needsKm;
  if (isCustom) {
    needsKm = !!(v.customItems || []).find((c) => c.id === itemKey)?.kmInterval;
  } else {
    const def = typeDef(v.typeKey).items[itemKey];
    const eff = effectiveInterval(v, itemKey, def);
    needsKm = (def.hasOilType ? eff.oilTypes[oilType]?.km : eff.km) != null;
  }
  if (needsKm && mileage == null) return fieldError("logServiceMileage", t("err.mileageNeeded"));

  const newCurrent = mileage != null ? Math.max(mileage, v.currentMileage || 0) : (v.currentMileage || 0);
  let update;
  if (isCustom) {
    const customItems = (v.customItems || []).map((c) =>
      c.id === itemKey ? { ...c, lastMileage: mileage, lastDate: dateVal, lastNote: note } : c
    );
    update = { customItems, currentMileage: newCurrent };
  } else {
    const entry = { lastMileage: mileage, lastDate: dateVal, lastNote: note };
    if (oilType) entry.oilType = oilType;
    update = { [`serviceLog.${itemKey}`]: entry, currentMileage: newCurrent };
  }
  closeModal("logServiceModal");
  runWrite(updateDoc(doc(db, "vehicles", vehicleId), update), "toast.serviceSaved", "toast.serviceFail");
};

// Custom Items
let customItemTargetVehicle = null;
window.openAddCustomItemModal = function (vehicleId) {
  customItemTargetVehicle = vehicleId;
  document.getElementById("customItemLabel").value = "";
  document.getElementById("customItemKm").value = "";
  document.getElementById("customItemMonths").value = "";
  openModal("addCustomItemModal");
};
window.submitAddCustomItem = async function () {
  const label = document.getElementById("customItemLabel").value.trim();
  const km = document.getElementById("customItemKm").value;
  const months = document.getElementById("customItemMonths").value;
  if (!label) return fieldError("customItemLabel", t("err.itemName"));
  if (km !== "" && !(Number(km) > 0)) return fieldError("customItemKm", t("err.intervalPositive"));
  if (months !== "" && !(Number(months) > 0)) return fieldError("customItemMonths", t("err.intervalPositive"));
  const v = vehicles.find((x) => x.id === customItemTargetVehicle);
  const newItem = {
    id: "c" + Date.now(),
    label,
    kmInterval: km ? Number(km) : null,
    monthsInterval: months ? Number(months) : null,
    lastMileage: null,
    lastDate: null
  };
  const customItems = [...(v.customItems || []), newItem];
  closeModal("addCustomItemModal");
  runWrite(updateDoc(doc(db, "vehicles", customItemTargetVehicle), { customItems }),
    "toast.itemAdded", "toast.itemAddFail");
};
window.deleteCustomItem = function (vehicleId, itemId) {
  const v = vehicles.find((x) => x.id === vehicleId);
  const item = (v.customItems || []).find((c) => c.id === itemId);
  if (!confirm(t("confirm.deleteItem", { name: item?.label || "" }))) return;
  const customItems = (v.customItems || []).filter((c) => c.id !== itemId);
  runWrite(updateDoc(doc(db, "vehicles", vehicleId), { customItems }), "toast.itemDeleted", "toast.itemDeleteFail");
};

let pendingDeleteVehicleId = null;
window.confirmDeleteVehicle = function (vehicleId) {
  pendingDeleteVehicleId = vehicleId;
  openModal("deleteVehicleModal");
};
window.submitDeleteVehicle = async function () {
  if (!pendingDeleteVehicleId) return;
  const id = pendingDeleteVehicleId;
  pendingDeleteVehicleId = null;
  closeModal("deleteVehicleModal");
  closeDetailView();
  runWrite(deleteDoc(doc(db, "vehicles", id)), "toast.vehicleDeleted", "toast.vehicleDeleteFail");
};

// ---------- PWA: Service Worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
