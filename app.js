// ============================================================
// Servis Tracker — App Logic
// Guna Firebase Firestore (v9 modular, via CDN) sebagai storage
// supaya data boleh diakses dari mana-mana saja (bukan setakat wifi rumah)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
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
  connStatusEl.innerHTML = "❌ Ralat: " + linkify(escapeHtml(err.message || String(err)));
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
    document.getElementById("userEmail").textContent = user.displayName || user.email || "Akaun Google";
    connStatusEl.innerHTML = "✅ Bersambung — data disegerak automatik";
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
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA);
  const b = new Date(dateStrB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
function fmtKm(n) {
  if (n == null) return "-";
  return Number(n).toLocaleString("en-US") + " km";
}
function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ms-MY", { year: "numeric", month: "short", day: "numeric" });
}
// Status untuk item yang cuma ada tarikh luput (bukan interval km/bulan) — dipakai
// untuk Roadtax & Lesen Memandu. Tiada notifikasi automatik, cuma visual.
function computeDateOnlyStatus(dateStr, warnDays) {
  if (!dateStr) return { status: "na", statusLabel: "Tiada rekod", remainingDays: null };
  const remainingDays = daysBetween(todayStr(), dateStr);
  let status = "ok";
  if (remainingDays <= 0) status = "danger";
  else if (remainingDays <= (warnDays ?? 30)) status = "warn";
  const statusLabelMap = { ok: "OK", warn: "Due Soon", danger: "Overdue" };
  return { status, statusLabel: statusLabelMap[status], remainingDays };
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function typeDef(typeKey) {
  return VEHICLE_TYPES[typeKey] || VEHICLE_TYPES.custom;
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

// Kira status untuk satu item berjadual (bukan custom)
function computeItemStatus(vehicle, itemKey, itemDef) {
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

  if (!log || !log.lastMileage) {
    return {
      status: "na",
      statusLabel: "Belum ada rekod",
      nextDueKm: null,
      nextDueDate: null,
      remainingKm: null,
      remainingDays: null,
      oilType
    };
  }

  const nextDueKm = intervalKm != null ? log.lastMileage + intervalKm : null;
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

  const statusLabelMap = { ok: "OK", warn: "Due Soon", danger: "Overdue" };

  return {
    status,
    statusLabel: statusLabelMap[status],
    nextDueKm,
    nextDueDate,
    remainingKm,
    remainingDays,
    oilType
  };
}

function computeCustomItemStatus(vehicle, item) {
  if (!item.lastMileage && !item.lastDate) {
    return { status: "na", statusLabel: "Belum ada rekod", nextDueKm: null, nextDueDate: null, remainingKm: null, remainingDays: null };
  }
  const nextDueKm = item.kmInterval && item.lastMileage ? item.lastMileage + Number(item.kmInterval) : null;
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

  const statusLabelMap = { ok: "OK", warn: "Due Soon", danger: "Overdue" };
  return { status, statusLabel: statusLabelMap[status], nextDueKm, nextDueDate, remainingKm, remainingDays };
}

function worstStatus(vehicle) {
  const td = typeDef(vehicle.typeKey);
  let worst = "na";
  const rank = { na: -1, ok: 0, warn: 1, danger: 2 };
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
const PHOTO_TOO_BIG_MSG = "weh besar sangat gambar kau ni, kau rilek dulu, bende ni optional, resize gambar sampai 1MB atau snap gambar guna 3310 nokia purba kau dulu baru upload sini";

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
      showToast(PHOTO_TOO_BIG_MSG);
      inputEl.value = "";
    }
  };
}

// Bina HTML satu "interval-group" untuk satu item (dipakai di borang daftar & borang ubah interval)
function renderIntervalGroupHTML(itemKey, def, values) {
  let inner = "";
  if (def.hasOilType) {
    inner = `
      <div class="interval-subtitle">Semi Sintetik</div>
      <div class="interval-row">
        <div class="interval-field"><label>Interval (km)</label><input type="number" inputmode="numeric" data-field="semiKm" value="${values.oilTypes.semi.km ?? ""}"></div>
        <div class="interval-field"><label>Interval (bulan)</label><input type="number" inputmode="numeric" data-field="semiMonths" value="${values.oilTypes.semi.months ?? ""}"></div>
      </div>
      <div class="interval-subtitle">Fully Sintetik</div>
      <div class="interval-row">
        <div class="interval-field"><label>Interval (km)</label><input type="number" inputmode="numeric" data-field="fullyKm" value="${values.oilTypes.fully.km ?? ""}"></div>
        <div class="interval-field"><label>Interval (bulan)</label><input type="number" inputmode="numeric" data-field="fullyMonths" value="${values.oilTypes.fully.months ?? ""}"></div>
      </div>
    `;
  } else {
    inner = `
      <div class="interval-row">
        <div class="interval-field"><label>Interval (km)</label><input type="number" inputmode="numeric" data-field="km" value="${values.km ?? ""}" placeholder="kosongkan jika tiada"></div>
        <div class="interval-field"><label>Interval (bulan)</label><input type="number" inputmode="numeric" data-field="months" value="${values.months ?? ""}" placeholder="kosongkan jika tiada"></div>
      </div>
    `;
  }
  return `
    <div class="interval-group" data-item-key="${itemKey}">
      <div class="interval-group-title">${def.label}</div>
      ${def.note ? `<div class="interval-group-note">${def.note}</div>` : ""}
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
    const badgeClass = { ok: "status-ok", warn: "status-warn", danger: "status-danger", na: "status-na" }[status];
    const badgeLabel = { ok: "OK", warn: "Due Soon", danger: "Overdue", na: "Belum Log" }[status];

    const hasName = !!v.vehicleName;
    const thumbHtml = v.photoBase64 ? `<img src="${v.photoBase64}" class="vehicle-thumb" alt="">` : "";
    let roadtaxLine = "";
    if (v.roadtaxExpiry) {
      const rs = computeDateOnlyStatus(v.roadtaxExpiry);
      roadtaxLine = `<div class="vehicle-roadtax">🪪 Roadtax: ${fmtDate(v.roadtaxExpiry)} (${rs.remainingDays >= 0 ? "baki " + rs.remainingDays + " hari" : "lebih " + Math.abs(rs.remainingDays) + " hari"})</div>`;
    }

    const card = document.createElement("div");
    card.className = "vehicle-card";
    card.onclick = () => openDetailView(v.id);
    card.innerHTML = `
      <div class="vehicle-card-top">
        <div class="vehicle-card-left">
          ${thumbHtml}
          <div style="min-width:0;">
            <div class="vehicle-title">${hasName ? escapeHtml(v.vehicleName) : td.icon + " " + td.label}</div>
            ${hasName ? `<div class="vehicle-subtype">${td.icon} ${td.label}</div>` : ""}
            ${v.plateNo ? `<div class="vehicle-plate">${escapeHtml(v.plateNo)}</div>` : ""}
          </div>
        </div>
        <span class="status-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="vehicle-mileage">Mileage semasa: <strong>${fmtKm(v.currentMileage)}</strong></div>
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

  if (classes.length === 0) {
    badgeEl.className = "status-badge status-na";
    badgeEl.textContent = "Belum Diisi";
    bodyEl.textContent = "Tap untuk tambah kelas lesen anda (pilihan)";
    return;
  }
  const rank = { na: -1, ok: 0, warn: 1, danger: 2 };
  let worst = "na";
  classes.forEach((c) => {
    const s = computeDateOnlyStatus(c.expiry).status;
    if (rank[s] > rank[worst]) worst = s;
  });
  const badgeClass = { ok: "status-ok", warn: "status-warn", danger: "status-danger", na: "status-na" }[worst];
  const badgeLabel = { ok: "OK", warn: "Due Soon", danger: "Overdue", na: "-" }[worst];
  badgeEl.className = "status-badge " + badgeClass;
  badgeEl.textContent = badgeLabel;
  bodyEl.innerHTML = classes.map((c) => {
    const found = JPJ_LICENSE_CLASSES.find((x) => x.value === c.class);
    const label = found ? found.label : c.class;
    const s = computeDateOnlyStatus(c.expiry);
    return `${escapeHtml(label)} — ${c.expiry ? fmtDate(c.expiry) : "tiada tarikh"} (${s.statusLabel})`;
  }).join("<br>");
}

// ---------- DETAIL VIEW ----------
function openDetailView(id) {
  currentDetailId = id;
  document.getElementById("mainView").style.display = "none";
  document.getElementById("detailView").style.display = "block";
  renderDetail(id);
}
window.closeDetailView = function () {
  currentDetailId = null;
  document.getElementById("detailView").style.display = "none";
  document.getElementById("mainView").style.display = "block";
};

function renderDetail(id) {
  const v = vehicles.find((x) => x.id === id);
  if (!v) return closeDetailView();
  const td = typeDef(v.typeKey);
  const container = document.getElementById("detailContent");

  const itemKeys = Object.keys(td.items);
  let itemsHtml = "";
  if (itemKeys.length === 0) {
    itemsHtml = `<div class="item-meta" style="padding:4px 0 12px;">Kenderaan jenis ni takde jadual servis standard — guna "+ Tambah Item" di bawah untuk mula tracking sendiri 🙂</div>`;
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
        <span class="item-label">🪪 Roadtax</span>
        <span class="status-badge status-${rs.status}">${rs.statusLabel}</span>
      </div>
      <div class="item-meta">${v.roadtaxExpiry
        ? `Luput: <strong>${fmtDate(v.roadtaxExpiry)}</strong> (${rs.remainingDays >= 0 ? "baki " + rs.remainingDays + " hari" : "lebih " + Math.abs(rs.remainingDays) + " hari"})`
        : `Belum diisi — tekan "✎ Edit Kenderaan" untuk tambah tarikh luput.`}</div>
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
        <h2>${hasName ? escapeHtml(v.vehicleName) : td.icon + " " + td.label}</h2>
        ${hasName ? `<div class="vehicle-subtype">${td.icon} ${td.label}</div>` : ""}
        ${v.plateNo ? `<div class="vehicle-plate">${escapeHtml(v.plateNo)}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="openUpdateMileageModal('${v.id}')">Kemaskini Mileage</button>
        <button class="btn btn-outline btn-sm" onclick="openEditVehicleModal('${v.id}')">✎ Edit Kenderaan</button>
      </div>
    </div>
    <div class="vehicle-mileage">Mileage semasa: <strong>${fmtKm(v.currentMileage)}</strong></div>

    <div class="section-title">Roadtax</div>
    <div class="item-list">${roadtaxHtml}</div>

    <div class="section-title">Jadual Servis</div>
    <div class="item-list">${itemsHtml}</div>

    <div class="section-title">Item Tambahan / Modifikasi</div>
    <div class="item-list">${customHtml}</div>
    <div style="margin-top:12px;">
      <button class="btn btn-secondary btn-sm" onclick="openAddCustomItemModal('${v.id}')">+ Tambah Item</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDeleteVehicle('${v.id}')">Padam Kenderaan Ini</button>
    </div>
  `;
}

function intervalSummaryText(def, eff) {
  if (def.hasOilType) {
    const s = eff.oilTypes.semi, f = eff.oilTypes.fully;
    const sPart = [s.km != null ? fmtKm(s.km) : null, s.months != null ? s.months + " bulan" : null].filter(Boolean).join(" / ");
    const fPart = [f.km != null ? fmtKm(f.km) : null, f.months != null ? f.months + " bulan" : null].filter(Boolean).join(" / ");
    return `Semi: ${sPart || "-"} &nbsp;•&nbsp; Fully: ${fPart || "-"}`;
  }
  const part = [eff.km != null ? fmtKm(eff.km) : null, eff.months != null ? eff.months + " bulan" : null].filter(Boolean).join(" / ");
  return part || "Tiada interval ditetapkan";
}

function renderItemCard(vehicle, key, def, s, log) {
  const vehicleId = vehicle.id;
  const eff = effectiveInterval(vehicle, key, def);
  let metaLines = [];
  if (s.status === "na") {
    metaLines.push("Belum ada rekod servis — log servis pertama untuk mula tracking.");
  } else {
    metaLines.push(`Servis lepas: ${fmtKm(log?.lastMileage)} (${fmtDate(log?.lastDate)})`);
    if (s.nextDueKm != null) metaLines.push(`Next servis (mileage): <strong>${fmtKm(s.nextDueKm)}</strong> (${s.remainingKm >= 0 ? "baki " + fmtKm(s.remainingKm) : "lebih " + fmtKm(Math.abs(s.remainingKm))})`);
    if (s.nextDueDate != null) metaLines.push(`Next servis (tarikh): <strong>${fmtDate(s.nextDueDate)}</strong> (${s.remainingDays >= 0 ? "baki " + s.remainingDays + " hari" : "lebih " + Math.abs(s.remainingDays) + " hari"})`);
    if (s.oilType && def.oilTypes) metaLines.push(`Jenis minyak digunakan: ${def.oilTypes[s.oilType].label}`);
    if (log?.lastNote) metaLines.push(`Nota: ${escapeHtml(log.lastNote)}`);
  }
  metaLines.push(`Interval semasa: ${intervalSummaryText(def, eff)}`);
  if (def.note) metaLines.push(`<em>${def.note}</em>`);

  return `
    <div class="item-card ${s.status}">
      <div class="item-top">
        <span class="item-label">${def.label}</span>
        <span class="status-badge status-${s.status}">${s.statusLabel}</span>
      </div>
      <div class="item-meta">${metaLines.join("<br>")}</div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="openLogServiceModal('${vehicleId}', '${key}', ${!!def.hasOilType})">Log Servis</button>
        <button class="item-edit-link" onclick="openEditIntervalModal('${vehicleId}', '${key}')">✎ Ubah Interval</button>
      </div>
    </div>
  `;
}

function renderCustomItemCard(vehicleId, item, s) {
  let metaLines = [];
  if (s.status === "na") {
    metaLines.push("Belum ada rekod.");
  } else {
    if (s.nextDueKm != null) metaLines.push(`Next (mileage): <strong>${fmtKm(s.nextDueKm)}</strong> (${s.remainingKm >= 0 ? "baki " + fmtKm(s.remainingKm) : "lebih " + fmtKm(Math.abs(s.remainingKm))})`);
    if (s.nextDueDate != null) metaLines.push(`Next (tarikh): <strong>${fmtDate(s.nextDueDate)}</strong>`);
  }
  return `
    <div class="item-card ${s.status}">
      <div class="item-top">
        <span class="item-label">${escapeHtml(item.label)}</span>
        <span class="status-badge status-${s.status}">${s.statusLabel}</span>
      </div>
      <div class="item-meta">${metaLines.join("<br>")}</div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="openLogServiceModal('${vehicleId}', '${item.id}', false, true)">Log</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteCustomItem('${vehicleId}', '${item.id}')">Padam</button>
      </div>
    </div>
  `;
}

// ---------- MODALS ----------
window.closeModal = function (id) {
  document.getElementById(id).style.display = "none";
};

// Add Vehicle
let newVehiclePhotoData = null;
document.getElementById("addVehicleBtn").onclick = () => openAddVehicleModal();
window.openAddVehicleModal = function () {
  const sel = document.getElementById("newVehicleType");
  sel.innerHTML = Object.entries(VEHICLE_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join("");
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

  document.getElementById("addVehicleModal").style.display = "flex";
};
window.clearNewVehiclePhoto = function () {
  newVehiclePhotoData = null;
  document.getElementById("newVehiclePhotoInput").value = "";
  document.getElementById("newVehiclePhotoPreviewWrap").style.display = "none";
};
window.submitAddVehicle = async function () {
  if (!currentUid) return showToast("Sila log masuk dahulu");
  const typeKey = document.getElementById("newVehicleType").value;
  const vehicleName = document.getElementById("newVehicleName").value.trim();
  const plateNo = document.getElementById("newVehiclePlate").value.trim();
  const mileage = Number(document.getElementById("newVehicleMileage").value || 0);
  const roadtaxExpiry = document.getElementById("newVehicleRoadtax").value || null;

  const td = typeDef(typeKey);
  const intervalsEl = document.getElementById("newVehicleIntervals");
  const intervals = collectIntervalsFromForm(intervalsEl, td.items);

  try {
    const payload = {
      ownerId: currentUid,
      typeKey, plateNo, currentMileage: mileage,
      serviceLog: {}, customItems: [], intervals,
      vehicleName: vehicleName || null,
      roadtaxExpiry: roadtaxExpiry || null,
      photoBase64: newVehiclePhotoData || null,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "vehicles"), payload);
    closeModal("addVehicleModal");
    showToast("Kenderaan didaftarkan ✅");
  } catch (err) {
    showToast("❌ Gagal daftar: " + err.message);
  }
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
  document.getElementById("editVehicleModal").style.display = "flex";
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
  try {
    await updateDoc(doc(db, "vehicles", editVehicleTargetId), {
      vehicleName: vehicleName || null,
      plateNo: plateNo || null,
      roadtaxExpiry: roadtaxExpiry || null,
      photoBase64: editVehiclePhotoData || null
    });
    closeModal("editVehicleModal");
    showToast("Kenderaan dikemaskini ✅");
  } catch (err) {
    showToast("❌ Gagal kemaskini: " + err.message);
  }
};

// ---------- LESEN MEMANDU: MODAL ----------
function licenseClassRowHTML(selectedClass, expiry) {
  const options = JPJ_LICENSE_CLASSES.map((c) =>
    `<option value="${c.value}" ${c.value === selectedClass ? "selected" : ""}>${escapeHtml(c.label)}</option>`
  ).join("");
  return `
    <div class="class-row" data-license-row>
      <div class="interval-field">
        <label>Kelas Lesen</label>
        <select data-field="class">${options}</select>
      </div>
      <div class="interval-field">
        <label>Tarikh Luput</label>
        <input type="date" data-field="expiry" value="${expiry || ""}">
      </div>
      <button type="button" class="class-row-delete" onclick="this.closest('[data-license-row]').remove()">✕</button>
    </div>
  `;
}
window.openLicenseModal = function () {
  const rowsEl = document.getElementById("licenseClassRows");
  const classes = licenseDoc.classes && licenseDoc.classes.length > 0 ? licenseDoc.classes : [{ class: "", expiry: "" }];
  rowsEl.innerHTML = classes.map((c) => licenseClassRowHTML(c.class, c.expiry)).join("");
  document.getElementById("licenseModal").style.display = "flex";
};
window.addLicenseClassRow = function () {
  const rowsEl = document.getElementById("licenseClassRows");
  rowsEl.insertAdjacentHTML("beforeend", licenseClassRowHTML("", ""));
};
window.submitLicense = async function () {
  if (!currentUid) return showToast("Sila log masuk dahulu");
  const rowsEl = document.getElementById("licenseClassRows");
  const classes = [];
  rowsEl.querySelectorAll("[data-license-row]").forEach((row) => {
    const classVal = row.querySelector('[data-field="class"]').value;
    const expiryVal = row.querySelector('[data-field="expiry"]').value;
    if (classVal) classes.push({ class: classVal, expiry: expiryVal || null });
  });
  try {
    await setDoc(doc(db, "driverLicenses", currentUid), { classes, updatedAt: serverTimestamp() });
    closeModal("licenseModal");
    showToast("Lesen dikemaskini ✅");
  } catch (err) {
    showToast("❌ Gagal simpan: " + err.message);
  }
};

// Edit Interval (satu item, selepas daftar)
let editIntervalTarget = { vehicleId: null, itemKey: null };
window.openEditIntervalModal = function (vehicleId, itemKey) {
  editIntervalTarget = { vehicleId, itemKey };
  const v = vehicles.find((x) => x.id === vehicleId);
  const td = typeDef(v.typeKey);
  const def = td.items[itemKey];
  const eff = effectiveInterval(v, itemKey, def);

  document.getElementById("editIntervalTitle").textContent = "Ubah Interval — " + def.label;
  const container = document.getElementById("editIntervalFields");
  container.innerHTML = renderIntervalGroupHTML(itemKey, def, eff);
  document.getElementById("editIntervalModal").style.display = "flex";
};
window.submitEditInterval = async function () {
  const { vehicleId, itemKey } = editIntervalTarget;
  const v = vehicles.find((x) => x.id === vehicleId);
  const td = typeDef(v.typeKey);
  const container = document.getElementById("editIntervalFields");
  const intervals = collectIntervalsFromForm(container, td.items);
  await updateDoc(doc(db, "vehicles", vehicleId), {
    [`intervals.${itemKey}`]: intervals[itemKey]
  });
  closeModal("editIntervalModal");
  showToast("Interval dikemaskini ✅");
};

// Update Mileage
let mileageTargetId = null;
window.openUpdateMileageModal = function (id) {
  mileageTargetId = id;
  const v = vehicles.find((x) => x.id === id);
  document.getElementById("updateMileageInput").value = v?.currentMileage || "";
  document.getElementById("updateMileageModal").style.display = "flex";
};
window.submitUpdateMileage = async function () {
  const val = Number(document.getElementById("updateMileageInput").value || 0);
  await updateDoc(doc(db, "vehicles", mileageTargetId), { currentMileage: val });
  closeModal("updateMileageModal");
  showToast("Mileage dikemaskini ✅");
};

// Log Service
let logTarget = { vehicleId: null, itemKey: null, hasOilType: false, isCustom: false };
window.openLogServiceModal = function (vehicleId, itemKey, hasOilType, isCustom) {
  logTarget = { vehicleId, itemKey, hasOilType: !!hasOilType, isCustom: !!isCustom };
  const v = vehicles.find((x) => x.id === vehicleId);
  const td = typeDef(v.typeKey);
  const def = isCustom ? (v.customItems || []).find((c) => c.id === itemKey) : td.items[itemKey];

  document.getElementById("logServiceTitle").textContent = "Log Servis — " + (def.label);
  const oilRow = document.getElementById("oilTypeRow");
  if (hasOilType) {
    oilRow.style.display = "block";
    const sel = document.getElementById("logOilType");
    sel.innerHTML = Object.entries(def.oilTypes).map(([k, o]) => `<option value="${k}">${o.label} (+${o.km}km)</option>`).join("");
  } else {
    oilRow.style.display = "none";
  }
  document.getElementById("logServiceMileage").value = v.currentMileage || "";
  document.getElementById("logServiceDate").value = todayStr();
  document.getElementById("logServiceNote").value = "";
  document.getElementById("logServiceModal").style.display = "flex";
};
window.submitLogService = async function () {
  const { vehicleId, itemKey, hasOilType, isCustom } = logTarget;
  const mileage = Number(document.getElementById("logServiceMileage").value || 0);
  const dateVal = document.getElementById("logServiceDate").value || todayStr();
  const note = document.getElementById("logServiceNote").value.trim();
  const v = vehicles.find((x) => x.id === vehicleId);

  if (isCustom) {
    const customItems = (v.customItems || []).map((c) => {
      if (c.id === itemKey) {
        return { ...c, lastMileage: mileage, lastDate: dateVal, lastNote: note };
      }
      return c;
    });
    await updateDoc(doc(db, "vehicles", vehicleId), {
      customItems,
      currentMileage: Math.max(mileage, v.currentMileage || 0)
    });
  } else {
    const oilType = hasOilType ? document.getElementById("logOilType").value : undefined;
    const entry = { lastMileage: mileage, lastDate: dateVal, lastNote: note };
    if (oilType) entry.oilType = oilType;
    await updateDoc(doc(db, "vehicles", vehicleId), {
      [`serviceLog.${itemKey}`]: entry,
      currentMileage: Math.max(mileage, v.currentMileage || 0)
    });
  }
  closeModal("logServiceModal");
  showToast("Servis direkodkan ✅");
};

// Custom Items
let customItemTargetVehicle = null;
window.openAddCustomItemModal = function (vehicleId) {
  customItemTargetVehicle = vehicleId;
  document.getElementById("customItemLabel").value = "";
  document.getElementById("customItemKm").value = "";
  document.getElementById("customItemMonths").value = "";
  document.getElementById("addCustomItemModal").style.display = "flex";
};
window.submitAddCustomItem = async function () {
  const label = document.getElementById("customItemLabel").value.trim();
  const km = document.getElementById("customItemKm").value;
  const months = document.getElementById("customItemMonths").value;
  if (!label) return showToast("Sila isi nama item");
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
  await updateDoc(doc(db, "vehicles", customItemTargetVehicle), { customItems });
  closeModal("addCustomItemModal");
  showToast("Item ditambah ✅");
};
window.deleteCustomItem = async function (vehicleId, itemId) {
  const v = vehicles.find((x) => x.id === vehicleId);
  const customItems = (v.customItems || []).filter((c) => c.id !== itemId);
  await updateDoc(doc(db, "vehicles", vehicleId), { customItems });
  showToast("Item dipadam");
};

let pendingDeleteVehicleId = null;
window.confirmDeleteVehicle = function (vehicleId) {
  pendingDeleteVehicleId = vehicleId;
  document.getElementById("deleteVehicleModal").style.display = "flex";
};
window.submitDeleteVehicle = async function () {
  if (!pendingDeleteVehicleId) return;
  await deleteDoc(doc(db, "vehicles", pendingDeleteVehicleId));
  pendingDeleteVehicleId = null;
  closeModal("deleteVehicleModal");
  closeDetailView();
  showToast("Kenderaan dipadam");
};

// ---------- PWA: Service Worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
