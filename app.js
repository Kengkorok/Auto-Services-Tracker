// ============================================================
// Servis Tracker — App Logic
// Guna Firebase Firestore (v9 modular, via CDN) sebagai storage
// supaya data boleh diakses dari mana-mana saja (bukan setakat wifi rumah)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const connStatusEl = document.getElementById("connStatus");
let vehicles = []; // local cache of {id, ...data}
let currentDetailId = null;

// ---------- AUTH ----------
signInAnonymously(auth).catch((err) => {
  connStatusEl.textContent = "❌ Gagal sambung: " + err.message + " (semak firebase-config.js)";
  connStatusEl.className = "conn-status err";
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    connStatusEl.textContent = "✅ Bersambung — data disegerak automatik";
    connStatusEl.className = "conn-status ok";
    listenVehicles();
  }
});

// ---------- FIRESTORE LISTENER ----------
function listenVehicles() {
  const q = query(collection(db, "vehicles"), orderBy("createdAt", "asc"));
  onSnapshot(q, (snap) => {
    vehicles = [];
    snap.forEach((d) => vehicles.push({ id: d.id, ...d.data() }));
    renderVehicleList();
    if (currentDetailId) renderDetail(currentDetailId);
  }, (err) => {
    connStatusEl.textContent = "❌ Ralat Firestore: " + err.message;
    connStatusEl.className = "conn-status err";
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
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
function typeDef(typeKey) {
  return VEHICLE_TYPES[typeKey] || VEHICLE_TYPES.custom;
}

// Kira status untuk satu item berjadual (bukan custom)
function computeItemStatus(vehicle, itemKey, itemDef) {
  const log = (vehicle.serviceLog || {})[itemKey];
  let intervalKm = itemDef.km ?? null;
  let intervalMonths = itemDef.months ?? null;
  let oilType = null;

  if (itemDef.hasOilType) {
    oilType = log?.oilType || null;
    if (oilType && itemDef.oilTypes[oilType]) {
      intervalKm = itemDef.oilTypes[oilType].km ?? null;
      intervalMonths = itemDef.oilTypes[oilType].months ?? null;
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
  const rank = { ok: 0, na: 0, warn: 1, danger: 2 };
  Object.entries(td.items).forEach(([key, def]) => {
    const s = computeItemStatus(vehicle, key, def).status;
    if (rank[s] > rank[worst]) worst = s;
  });
  (vehicle.customItems || []).forEach((item) => {
    const s = computeCustomItemStatus(vehicle, item).status;
    if (rank[s] > rank[worst]) worst = s;
  });
  return worst;
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

    const card = document.createElement("div");
    card.className = "vehicle-card";
    card.onclick = () => openDetailView(v.id);
    card.innerHTML = `
      <div class="vehicle-card-top">
        <div>
          <div class="vehicle-title">${td.icon} ${td.label}</div>
          <div class="vehicle-plate">${v.plateNo || "-"}</div>
        </div>
        <span class="status-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="vehicle-mileage">Mileage semasa: <strong>${fmtKm(v.currentMileage)}</strong></div>
    `;
    listEl.appendChild(card);
  });
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

  let itemsHtml = "";
  Object.entries(td.items).forEach(([key, def]) => {
    const s = computeItemStatus(v, key, def);
    const log = (v.serviceLog || {})[key];
    itemsHtml += renderItemCard(v.id, key, def, s, log);
  });

  let customHtml = "";
  (v.customItems || []).forEach((item) => {
    const s = computeCustomItemStatus(v, item);
    customHtml += renderCustomItemCard(v.id, item, s);
  });

  container.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${td.icon} ${td.label}</h2>
        <div class="vehicle-plate">${v.plateNo || "-"}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="openUpdateMileageModal('${v.id}')">Kemaskini Mileage</button>
    </div>
    <div class="vehicle-mileage">Mileage semasa: <strong>${fmtKm(v.currentMileage)}</strong></div>

    <div class="section-title">Jadual Servis</div>
    <div class="item-list">${itemsHtml}</div>

    <div class="section-title">Item Tambahan / Modifikasi</div>
    <div class="item-list">${customHtml}</div>
    <div style="margin-top:12px;">
      <button class="btn btn-secondary btn-sm" onclick="openAddCustomItemModal('${v.id}')">+ Tambah Item</button>
      <button class="btn btn-link btn-sm" onclick="confirmDeleteVehicle('${v.id}')">Padam Kenderaan Ini</button>
    </div>
  `;
}

function renderItemCard(vehicleId, key, def, s, log) {
  let metaLines = [];
  if (s.status === "na") {
    metaLines.push("Belum ada rekod servis — log servis pertama untuk mula tracking.");
  } else {
    metaLines.push(`Servis lepas: ${fmtKm(log?.lastMileage)} (${fmtDate(log?.lastDate)})`);
    if (s.nextDueKm != null) metaLines.push(`Next servis (mileage): <strong>${fmtKm(s.nextDueKm)}</strong> (${s.remainingKm >= 0 ? "baki " + fmtKm(s.remainingKm) : "lebih " + fmtKm(Math.abs(s.remainingKm))})`);
    if (s.nextDueDate != null) metaLines.push(`Next servis (tarikh): <strong>${fmtDate(s.nextDueDate)}</strong> (${s.remainingDays >= 0 ? "baki " + s.remainingDays + " hari" : "lebih " + Math.abs(s.remainingDays) + " hari"})`);
    if (s.oilType && def.oilTypes) metaLines.push(`Jenis minyak digunakan: ${def.oilTypes[s.oilType].label}`);
    if (log?.lastNote) metaLines.push(`Nota: ${log.lastNote}`);
  }
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
        <span class="item-label">${item.label}</span>
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
document.getElementById("addVehicleBtn").onclick = () => openAddVehicleModal();
window.openAddVehicleModal = function () {
  const sel = document.getElementById("newVehicleType");
  sel.innerHTML = Object.entries(VEHICLE_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join("");
  document.getElementById("newVehiclePlate").value = "";
  document.getElementById("newVehicleMileage").value = "";
  document.getElementById("addVehicleModal").style.display = "flex";
};
window.submitAddVehicle = async function () {
  const typeKey = document.getElementById("newVehicleType").value;
  const plateNo = document.getElementById("newVehiclePlate").value.trim();
  const mileage = Number(document.getElementById("newVehicleMileage").value || 0);
  if (!plateNo) return showToast("Sila isi no. pendaftaran");
  await addDoc(collection(db, "vehicles"), {
    typeKey, plateNo, currentMileage: mileage,
    serviceLog: {}, customItems: [], createdAt: serverTimestamp()
  });
  closeModal("addVehicleModal");
  showToast("Kenderaan didaftarkan ✅");
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

window.confirmDeleteVehicle = async function (vehicleId) {
  if (!confirm("Padam kenderaan ini dan semua rekod servisnya?")) return;
  await deleteDoc(doc(db, "vehicles", vehicleId));
  closeDetailView();
  showToast("Kenderaan dipadam");
};

// ---------- PWA: Service Worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
