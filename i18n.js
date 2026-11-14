// ============================================================
// Servis Tracker — Bahasa (BM / EN) dan Tema (gelap / cerah)
// Semua teks yang dilihat pengguna duduk di sini. Teks statik dalam index.html
// guna atribut data-i18n*, teks dinamik dalam app.js guna t("kunci").
// ============================================================

const I18N = {
  ms: {
    "app.name": "Servis Tracker",
    "signin.desc": "Jejak servis minyak enjin dan penyelenggaraan kenderaan anda. Log masuk dengan akaun Google untuk mengakses data anda dari mana-mana peranti.",
    "signin.button": "Log masuk dengan Google",
    "conn.connecting": "Menyambung…",
    "conn.ok": "Bersambung — data disegerakkan secara automatik",
    "conn.error": "Ralat",
    "account.fallback": "Akaun Google",

    "menu.open": "Buka menu",
    "menu.addVehicle": "Tambah Kenderaan",
    "menu.language": "Bahasa",
    "menu.theme": "Tema",
    "menu.themeDark": "Gelap",
    "menu.themeLight": "Cerah",
    "menu.signOut": "Log Keluar",

    "license.title": "Lesen Memandu",
    "license.emptyBadge": "Belum Diisi",
    "license.emptyBody": "Ketik untuk menambah kelas lesen anda (pilihan)",
    "license.noDate": "tiada tarikh",
    "license.modalNote": "Pilihan. Tidak menjejaskan penjejakan servis kenderaan. Tiada pemberitahuan automatik; untuk rujukan sahaja.",
    "license.addClass": "Tambah Kelas",
    "license.class": "Kelas Lesen",
    "license.expiry": "Tarikh Luput",
    "license.removeRow": "Buang kelas lesen ini",

    "empty.text": "Belum ada kenderaan didaftarkan.",
    "empty.cta": "Daftar Kenderaan Pertama",
    "nav.back": "Kembali",

    "status.ok": "OK",
    "status.warn": "Hampir Tiba",
    "status.danger": "Lewat",
    "status.na": "Belum Log",
    "status.noRecord": "Tiada Rekod",
    "status.noRecordYet": "Belum Ada Rekod",

    "vehicle.mileage": "Mileage semasa",
    "vehicle.roadtax": "Cukai Jalan",
    "time.daysLeft": "baki {n} hari",
    "time.daysOver": "lewat {n} hari",
    "time.kmLeft": "baki {km}",
    "time.kmOver": "lewat {km}",
    "time.months": "{n} bulan",
    "roadtax.expires": "Luput",
    "roadtax.notSet": "Belum diisi. Pilih \"Edit Kenderaan\" untuk menambah tarikh luput.",

    "detail.updateMileage": "Kemas Kini Mileage",
    "detail.editVehicle": "Edit Kenderaan",
    "detail.schedule": "Jadual Servis",
    "detail.customItems": "Item Tambahan",
    "detail.addItem": "Tambah Item",
    "detail.deleteVehicle": "Padam Kenderaan",
    "detail.noSchedule": "Jenis kenderaan ini tiada jadual servis standard. Gunakan \"Tambah Item\" untuk mula menjejak.",

    "item.noRecord": "Belum ada rekod servis. Log servis pertama untuk mula menjejak.",
    "item.last": "Servis terakhir",
    "item.nextKm": "Servis seterusnya (mileage)",
    "item.nextDate": "Servis seterusnya (tarikh)",
    "item.oilUsed": "Jenis minyak",
    "item.note": "Nota",
    "item.interval": "Interval semasa",
    "item.noInterval": "Tiada interval ditetapkan",
    "item.log": "Log Servis",
    "item.editInterval": "Ubah Interval",
    "custom.noRecord": "Belum ada rekod.",
    "custom.nextKm": "Seterusnya (mileage)",
    "custom.nextDate": "Seterusnya (tarikh)",
    "custom.log": "Log",
    "custom.delete": "Padam",

    "oil.semi": "Semi Sintetik",
    "oil.fully": "Sintetik Penuh",
    "interval.km": "Interval (km)",
    "interval.months": "Interval (bulan)",
    "interval.blank": "kosongkan jika tiada",

    "form.cancel": "Batal",
    "form.save": "Simpan",
    "form.removePhoto": "Buang Gambar",
    "form.photoPreview": "Pratonton gambar kenderaan",

    "add.title": "Daftar Kenderaan",
    "add.type": "Jenis Kenderaan",
    "add.name": "Nama Kenderaan (pilihan)",
    "add.namePh": "cth: Kereta keluarga",
    "add.plate": "No. Pendaftaran (pilihan)",
    "add.platePh": "cth: WXX 1234",
    "add.mileage": "Mileage Semasa (km)",
    "add.mileagePh": "cth: 7000",
    "add.roadtax": "Tarikh Luput Cukai Jalan (pilihan)",
    "add.photo": "Gambar Kenderaan (pilihan)",
    "add.intervals": "Interval Servis (boleh diubah mengikut kenderaan anda)",
    "add.submit": "Daftar",
    "edit.title": "Edit Kenderaan",
    "editInterval.title": "Ubah Interval",
    "delete.title": "Padam kenderaan ini?",
    "delete.body": "Semua rekod servis, mileage dan interval untuk kenderaan ini akan dipadam secara kekal dan tidak boleh dipulihkan.",
    "delete.confirm": "Padam",
    "mileage.title": "Kemas Kini Mileage",
    "mileage.submit": "Kemas Kini",
    "log.title": "Log Servis",
    "log.oilType": "Jenis Minyak",
    "log.mileage": "Mileage Semasa Servis (km)",
    "log.date": "Tarikh Servis",
    "log.note": "Nota (pilihan)",
    "log.notePh": "cth: Bengkel ABC, RM85",
    "custom.title": "Tambah Item Servis",
    "custom.name": "Nama Item",
    "custom.namePh": "cth: Tukar tayar",
    "custom.km": "Interval (km) — kosongkan jika tiada",
    "custom.months": "Interval (bulan) — kosongkan jika tiada",
    "custom.submit": "Tambah",

    "err.mileageRange": "Mileage mesti nombor bulat antara 0 hingga {max} km",
    "err.mileageRequired": "Sila isi mileage semasa",
    "err.mileageLower": "Mileage baharu ({next}) lebih rendah daripada bacaan semasa ({current}). Teruskan?",
    "err.dateFuture": "Tarikh servis tidak boleh melebihi hari ini",
    "err.mileageNeeded": "Sila isi mileage semasa servis. Item ini dijejak mengikut km.",
    "err.intervalPositive": "Interval mesti lebih daripada 0, atau kosongkan",
    "err.itemName": "Sila isi nama item",
    "err.signInFirst": "Sila log masuk dahulu",
    "err.photo": "Gambar tidak dapat diproses. Gunakan fail imej bersaiz kurang daripada 25MB.",
    "confirm.deleteItem": "Padam item \"{name}\"? Rekod servisnya akan turut dipadam.",

    "toast.vehicleAdded": "Kenderaan didaftarkan",
    "toast.vehicleAddFail": "Gagal mendaftar kenderaan",
    "toast.vehicleUpdated": "Kenderaan dikemas kini",
    "toast.vehicleUpdateFail": "Gagal mengemas kini kenderaan",
    "toast.licenseSaved": "Lesen dikemas kini",
    "toast.licenseFail": "Gagal menyimpan lesen",
    "toast.intervalSaved": "Interval dikemas kini",
    "toast.intervalFail": "Gagal mengemas kini interval",
    "toast.mileageSaved": "Mileage dikemas kini",
    "toast.mileageFail": "Gagal mengemas kini mileage",
    "toast.serviceSaved": "Servis direkodkan",
    "toast.serviceFail": "Gagal merekod servis",
    "toast.itemAdded": "Item ditambah",
    "toast.itemAddFail": "Gagal menambah item",
    "toast.itemDeleted": "Item dipadam",
    "toast.itemDeleteFail": "Gagal memadam item",
    "toast.vehicleDeleted": "Kenderaan dipadam",
    "toast.vehicleDeleteFail": "Gagal memadam kenderaan",
    "toast.offline": "{msg} (luar talian — akan disegerakkan apabila dalam talian)"
  },

  en: {
    "app.name": "Servis Tracker",
    "signin.desc": "Track engine oil changes and vehicle maintenance. Sign in with your Google account to access your data from any device.",
    "signin.button": "Sign in with Google",
    "conn.connecting": "Connecting…",
    "conn.ok": "Connected — data syncs automatically",
    "conn.error": "Error",
    "account.fallback": "Google account",

    "menu.open": "Open menu",
    "menu.addVehicle": "Add Vehicle",
    "menu.language": "Language",
    "menu.theme": "Theme",
    "menu.themeDark": "Dark",
    "menu.themeLight": "Light",
    "menu.signOut": "Sign Out",

    "license.title": "Driving Licence",
    "license.emptyBadge": "Not Set",
    "license.emptyBody": "Tap to add your licence classes (optional)",
    "license.noDate": "no date",
    "license.modalNote": "Optional. Does not affect vehicle service tracking. No automatic notifications; for reference only.",
    "license.addClass": "Add Class",
    "license.class": "Licence Class",
    "license.expiry": "Expiry Date",
    "license.removeRow": "Remove this licence class",

    "empty.text": "No vehicles registered yet.",
    "empty.cta": "Register Your First Vehicle",
    "nav.back": "Back",

    "status.ok": "OK",
    "status.warn": "Due Soon",
    "status.danger": "Overdue",
    "status.na": "Not Logged",
    "status.noRecord": "No Record",
    "status.noRecordYet": "No Record Yet",

    "vehicle.mileage": "Current mileage",
    "vehicle.roadtax": "Road Tax",
    "time.daysLeft": "{n} days left",
    "time.daysOver": "{n} days overdue",
    "time.kmLeft": "{km} left",
    "time.kmOver": "{km} overdue",
    "time.months": "{n} months",
    "roadtax.expires": "Expires",
    "roadtax.notSet": "Not set. Choose \"Edit Vehicle\" to add the expiry date.",

    "detail.updateMileage": "Update Mileage",
    "detail.editVehicle": "Edit Vehicle",
    "detail.schedule": "Service Schedule",
    "detail.customItems": "Additional Items",
    "detail.addItem": "Add Item",
    "detail.deleteVehicle": "Delete Vehicle",
    "detail.noSchedule": "This vehicle type has no standard service schedule. Use \"Add Item\" to start tracking.",

    "item.noRecord": "No service record yet. Log the first service to start tracking.",
    "item.last": "Last service",
    "item.nextKm": "Next service (mileage)",
    "item.nextDate": "Next service (date)",
    "item.oilUsed": "Oil type",
    "item.note": "Note",
    "item.interval": "Current interval",
    "item.noInterval": "No interval set",
    "item.log": "Log Service",
    "item.editInterval": "Edit Interval",
    "custom.noRecord": "No record yet.",
    "custom.nextKm": "Next (mileage)",
    "custom.nextDate": "Next (date)",
    "custom.log": "Log",
    "custom.delete": "Delete",

    "oil.semi": "Semi-synthetic",
    "oil.fully": "Fully synthetic",
    "interval.km": "Interval (km)",
    "interval.months": "Interval (months)",
    "interval.blank": "leave blank if none",

    "form.cancel": "Cancel",
    "form.save": "Save",
    "form.removePhoto": "Remove Photo",
    "form.photoPreview": "Vehicle photo preview",

    "add.title": "Register Vehicle",
    "add.type": "Vehicle Type",
    "add.name": "Vehicle Name (optional)",
    "add.namePh": "e.g. Family car",
    "add.plate": "Registration No. (optional)",
    "add.platePh": "e.g. WXX 1234",
    "add.mileage": "Current Mileage (km)",
    "add.mileagePh": "e.g. 7000",
    "add.roadtax": "Road Tax Expiry (optional)",
    "add.photo": "Vehicle Photo (optional)",
    "add.intervals": "Service Intervals (adjust to suit your vehicle)",
    "add.submit": "Register",
    "edit.title": "Edit Vehicle",
    "editInterval.title": "Edit Interval",
    "delete.title": "Delete this vehicle?",
    "delete.body": "All service records, mileage and intervals for this vehicle will be permanently deleted and cannot be recovered.",
    "delete.confirm": "Delete",
    "mileage.title": "Update Mileage",
    "mileage.submit": "Update",
    "log.title": "Log Service",
    "log.oilType": "Oil Type",
    "log.mileage": "Mileage at Service (km)",
    "log.date": "Service Date",
    "log.note": "Note (optional)",
    "log.notePh": "e.g. ABC Workshop, RM85",
    "custom.title": "Add Service Item",
    "custom.name": "Item Name",
    "custom.namePh": "e.g. Tyre replacement",
    "custom.km": "Interval (km) — leave blank if none",
    "custom.months": "Interval (months) — leave blank if none",
    "custom.submit": "Add",

    "err.mileageRange": "Mileage must be a whole number from 0 to {max} km",
    "err.mileageRequired": "Please enter the current mileage",
    "err.mileageLower": "The new mileage ({next}) is lower than the current reading ({current}). Continue?",
    "err.dateFuture": "Service date cannot be in the future",
    "err.mileageNeeded": "Please enter the mileage at service. This item is tracked by km.",
    "err.intervalPositive": "Interval must be greater than 0, or leave blank",
    "err.itemName": "Please enter an item name",
    "err.signInFirst": "Please sign in first",
    "err.photo": "The photo could not be processed. Use an image file smaller than 25MB.",
    "confirm.deleteItem": "Delete item \"{name}\"? Its service record will also be deleted.",

    "toast.vehicleAdded": "Vehicle registered",
    "toast.vehicleAddFail": "Could not register vehicle",
    "toast.vehicleUpdated": "Vehicle updated",
    "toast.vehicleUpdateFail": "Could not update vehicle",
    "toast.licenseSaved": "Licence updated",
    "toast.licenseFail": "Could not save licence",
    "toast.intervalSaved": "Interval updated",
    "toast.intervalFail": "Could not update interval",
    "toast.mileageSaved": "Mileage updated",
    "toast.mileageFail": "Could not update mileage",
    "toast.serviceSaved": "Service logged",
    "toast.serviceFail": "Could not log service",
    "toast.itemAdded": "Item added",
    "toast.itemAddFail": "Could not add item",
    "toast.itemDeleted": "Item deleted",
    "toast.itemDeleteFail": "Could not delete item",
    "toast.vehicleDeleted": "Vehicle deleted",
    "toast.vehicleDeleteFail": "Could not delete vehicle",
    "toast.offline": "{msg} (offline — will sync when back online)"
  }
};

// ---------- Simpanan pilihan (localStorage boleh gagal dalam mod peribadi) ----------
function prefGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function prefSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* abaikan */ }
}

// ---------- Bahasa ----------
// Pilihan tersimpan dulu; kalau tiada, ikut bahasa peranti (Melayu → BM, selain itu EN).
let LANG = prefGet("lang") || ((navigator.language || "").toLowerCase().startsWith("ms") ? "ms" : "en");
if (!I18N[LANG]) LANG = "en";

// Terjemah satu kunci, dengan pemboleh ubah {nama}.
function t(key, vars) {
  let s = I18N[LANG][key] ?? I18N.en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
// Teks dwibahasa dari schedules.js ({ ms, en }) atau teks biasa (cth nama item yang ditaip user).
function tr(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[LANG] ?? value.en ?? value.ms ?? "";
}
// Format nombor dan tarikh ikut bahasa.
function locale() {
  return LANG === "ms" ? "ms-MY" : "en-MY";
}

// Isi semua teks statik dalam HTML.
function applyI18n(root = document) {
  document.documentElement.lang = LANG;
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  root.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
  document.querySelectorAll("[data-lang-option]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.langOption === LANG));
  });
}

function setLang(lang) {
  if (!I18N[lang] || lang === LANG) return;
  LANG = lang;
  prefSet("lang", lang);
  applyI18n();
  if (typeof window.onLangChange === "function") window.onLangChange();
}

// ---------- Tema ----------
// Asal app ni gelap; tema cerah ialah pilihan. Atribut data-theme pada <html>
// ditetapkan awal dalam <head> (index.html) supaya tiada kelipan.
function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  prefSet("theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#F4F7FB" : "#05070E";
  document.querySelectorAll("[data-theme-option]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.themeOption === theme));
  });
}

applyI18n();
setTheme(getTheme());
