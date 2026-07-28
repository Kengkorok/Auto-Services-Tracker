// ============================================================
// Jadual Servis — Interval untuk setiap jenis kenderaan
// Semua nilai boleh diedit dari sini (km / bulan)
// ============================================================

const VEHICLE_TYPES = {
  persona16: {
    label: "Proton Persona 1.6",
    vehicleClass: "car",
    icon: "🚗",
    items: {
      engine_oil: {
        label: "Minyak Enjin (Minyak Hitam)",
        hasOilType: true,
        oilTypes: {
          semi:  { label: "Semi Sintetik", km: 7000,  months: 6 },
          fully: { label: "Fully Sintetik", km: 10000, months: 6 }
        }
      },
      coolant:      { label: "Coolant",           km: 27500, months: null },
      spark_plug:   { label: "Spark Plug (Standard/NGK biasa)", km: 30000, months: null, note: "20k-40k. Kalau guna Iridium boleh sampai 100k — edit di sini." },
      air_filter:   { label: "Air Filter (Penapis Udara)", km: 12500, months: null },
      brake_fluid:  { label: "Minyak Brek",       km: 20000, months: 24 },
      battery:      { label: "Bateri",            km: null,  months: 24 }
    }
  },
  nmax155: {
    label: "Yamaha NMAX 155 V3",
    vehicleClass: "motor",
    icon: "🛵",
    items: {
      engine_oil: {
        label: "Minyak Enjin (Minyak Hitam)",
        hasOilType: true,
        oilTypes: {
          semi:  { label: "Semi Sintetik", km: 2000, months: null },
          fully: { label: "Fully Sintetik", km: 2500, months: null }
        }
      },
      coolant:      { label: "Coolant",             km: 27500, months: null },
      spark_plug:   { label: "Spark Plug",          km: 9000,  months: null, note: "8,000-10,000km" },
      cvt_belt:     { label: "CVT / V-Belt",        km: 17500, months: null, note: "15,000-20,000km" },
      cvt_set:      { label: "CVT Set (roller/dsb)",km: 40000, months: null },
      air_filter:   { label: "Air Filter (Penapis Udara)", km: 12500, months: null },
      brake_fluid:  { label: "Minyak Brek",         km: 20000, months: 24 },
      battery:      { label: "Bateri",              km: null,  months: 24 }
    }
  },
  lagenda115fi: {
    label: "Yamaha Lagenda 115 FI",
    vehicleClass: "motor",
    icon: "🛵",
    items: {
      engine_oil: {
        label: "Minyak Enjin (Minyak Hitam)",
        hasOilType: true,
        oilTypes: {
          semi:  { label: "Semi Sintetik", km: 2000, months: null },
          fully: { label: "Fully Sintetik", km: 2500, months: null }
        }
      },
      // TIADA coolant — Lagenda 115 FI air-cooled (bukan liquid-cooled)
      spark_plug:   { label: "Spark Plug",          km: 9000,  months: null, note: "8,000-10,000km" },
      cvt_belt:     { label: "CVT / V-Belt",        km: 17500, months: null, note: "15,000-20,000km" },
      cvt_set:      { label: "CVT Set (roller/dsb)",km: 40000, months: null },
      air_filter:   { label: "Air Filter (Penapis Udara)", km: 12500, months: null },
      brake_fluid:  { label: "Minyak Brek",         km: 20000, months: 24 },
      battery:      { label: "Bateri",              km: null,  months: 24 }
    }
  },
  custom: {
    label: "Kenderaan Lain (Custom)",
    vehicleClass: "custom",
    icon: "🚘",
    items: {
      engine_oil: {
        label: "Minyak Enjin (Minyak Hitam)",
        hasOilType: true,
        oilTypes: {
          semi:  { label: "Semi Sintetik", km: 5000, months: 6 },
          fully: { label: "Fully Sintetik", km: 10000, months: 6 }
        }
      },
      coolant:      { label: "Coolant",       km: 27500, months: null },
      spark_plug:   { label: "Spark Plug",    km: 20000, months: null },
      air_filter:   { label: "Air Filter",    km: 12500, months: null },
      brake_fluid:  { label: "Minyak Brek",   km: 20000, months: 24 },
      battery:      { label: "Bateri",        km: null,  months: 24 }
    }
  },
  // Dua ni sengaja tiada preset — untuk gelak/easter-egg, dan untuk sesiapa yang
  // ada kenderaan yang betul-betul tak match mana-mana kategori atas. User isi
  // sendiri sepenuhnya guna "+ Tambah Item" dalam halaman detail kenderaan.
  helikopter: {
    label: "Helikopter",
    vehicleClass: "other",
    icon: "🚁",
    items: {}
  },
  basikal: {
    label: "Basikal",
    vehicleClass: "other",
    icon: "🚲",
    items: {}
  }
};

// Modifikasi lain / servis tambahan yang user boleh tambah manual (bukan berjadual tetap)
const FREEFORM_ITEM_KEY = "custom_item";

// ============================================================
// Kelas Lesen Memandu Rasmi (JPJ Malaysia)
// ============================================================
const JPJ_LICENSE_CLASSES = [
  { value: "A",  label: "A — Motosikal roda tiga (dgn container)" },
  { value: "A1", label: "A1 — Motosikal roda tiga" },
  { value: "B",  label: "B — Motosikal & sespan (>250cc)" },
  { value: "B1", label: "B1 — Motosikal tanpa sespan (>250cc)" },
  { value: "B2", label: "B2 — Motosikal (≤250cc)" },
  { value: "D",  label: "D — Kereta (Manual)" },
  { value: "DA", label: "DA — Kereta (Automatik)" },
  { value: "E",  label: "E — Lori/Trak (Kenderaan Berat)" },
  { value: "E1", label: "E1 — Lori (GVW Sederhana)" },
  { value: "E2", label: "E2 — Lori (GVW Ringan, Bukan Automatik)" },
  { value: "F",  label: "F — Traktor Pertanian" },
  { value: "G",  label: "G — Jengkaut / Jentera Tanah" },
  { value: "H",  label: "H — Kenderaan Tentera" },
  { value: "I",  label: "I — Teksi / Kenderaan Awam (PSV)" },
  { value: "lain", label: "Lain-lain" }
];
