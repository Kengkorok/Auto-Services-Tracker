// ============================================================
// Jadual Servis — interval default untuk setiap jenis kenderaan
// Semua nilai boleh diubah oleh pengguna semasa daftar / kemudian (km / bulan).
// `icon` = nama ikon Lucide (lihat icons.js). Label dwibahasa: { ms, en }.
// ============================================================

// Nama item servis — dikongsi semua jenis kenderaan.
const ITEM_LABELS = {
  engine_oil:  { ms: "Minyak Enjin", en: "Engine Oil" },
  coolant:     { ms: "Cecair Penyejuk (Coolant)", en: "Coolant" },
  spark_plug:  { ms: "Palam Pencucuh", en: "Spark Plug" },
  air_filter:  { ms: "Penapis Udara", en: "Air Filter" },
  fuel_filter: { ms: "Penapis Bahan Api", en: "Fuel Filter" },
  brake_fluid: { ms: "Minyak Brek", en: "Brake Fluid" },
  battery:     { ms: "Bateri", en: "Battery" },
  cvt_belt:    { ms: "Tali Sawat CVT", en: "CVT Belt" },
  cvt_set:     { ms: "Set CVT (roller dll.)", en: "CVT Set (rollers etc.)" }
};

// Bina definisi minyak enjin (label jenis minyak datang dari i18n: oil.semi / oil.fully).
function oilItem(semi, fully, note) {
  return {
    label: ITEM_LABELS.engine_oil,
    hasOilType: true,
    oilTypes: { semi, fully },
    ...(note ? { note } : {})
  };
}
function item(key, km, months, note) {
  return { label: ITEM_LABELS[key], km, months, ...(note ? { note } : {}) };
}

const ESTIMATE_NOTE = {
  ms: "Anggaran umum — semak manual pengeluar kenderaan anda.",
  en: "General estimate — check your vehicle manufacturer's manual."
};

const VEHICLE_TYPES = {
  // ---------- Jenis yang dipaparkan semasa daftar ----------
  // Kereta & Van guna nilai template "Kenderaan Lain" asal; Motosikal guna nilai NMAX asal.
  car: {
    label: { ms: "Kereta", en: "Car" },
    vehicleClass: "car",
    icon: "car",
    items: {
      engine_oil:  oilItem({ km: 5000, months: 6 }, { km: 10000, months: 6 }),
      coolant:     item("coolant", 27500, null),
      spark_plug:  item("spark_plug", 20000, null, {
        ms: "Palam standard 20k–40k km. Palam iridium boleh mencapai 100k km.",
        en: "Standard plugs 20k–40k km. Iridium plugs can last up to 100k km."
      }),
      air_filter:  item("air_filter", 12500, null),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  motorcycle: {
    label: { ms: "Motosikal", en: "Motorcycle" },
    vehicleClass: "motor",
    icon: "motorbike",
    items: {
      engine_oil:  oilItem({ km: 2000, months: null }, { km: 2500, months: null }),
      spark_plug:  item("spark_plug", 9000, null, { ms: "Biasanya 8,000–10,000 km.", en: "Typically 8,000–10,000 km." }),
      air_filter:  item("air_filter", 12500, null),
      cvt_belt:    item("cvt_belt", 17500, null, {
        ms: "Untuk skuter (CVT), biasanya 15,000–20,000 km. Kosongkan interval jika motosikal anda menggunakan rantai.",
        en: "For scooters (CVT), typically 15,000–20,000 km. Leave the interval blank if your motorcycle uses a chain."
      }),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  van: {
    label: { ms: "Van", en: "Van" },
    vehicleClass: "van",
    icon: "truck",
    items: {
      engine_oil:  oilItem({ km: 5000, months: 6 }, { km: 10000, months: 6 }),
      coolant:     item("coolant", 27500, null),
      spark_plug:  item("spark_plug", 20000, null, {
        ms: "Untuk enjin petrol sahaja. Kosongkan jika van anda menggunakan diesel.",
        en: "Petrol engines only. Leave blank if your van runs on diesel."
      }),
      air_filter:  item("air_filter", 12500, null),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  lorry: {
    label: { ms: "Lori", en: "Lorry" },
    vehicleClass: "lorry",
    icon: "truck",
    items: {
      engine_oil:  oilItem({ km: 10000, months: 6 }, { km: 15000, months: 6 }, ESTIMATE_NOTE),
      coolant:     item("coolant", 50000, 24, ESTIMATE_NOTE),
      air_filter:  item("air_filter", 20000, 12, ESTIMATE_NOTE),
      fuel_filter: item("fuel_filter", 20000, null, ESTIMATE_NOTE),
      brake_fluid: item("brake_fluid", 40000, 24, ESTIMATE_NOTE),
      battery:     item("battery", null, 24)
    }
  },

  // ---------- Jenis lama (legacy) ----------
  // Tidak dipaparkan dalam borang daftar lagi, tapi dikekalkan supaya kenderaan
  // yang dah didaftarkan dengan jenis ini terus berfungsi dengan item & interval asal.
  persona16: {
    legacy: true,
    label: { ms: "Kereta", en: "Car" },
    vehicleClass: "car",
    icon: "car",
    items: {
      engine_oil:  oilItem({ km: 7000, months: 6 }, { km: 10000, months: 6 }),
      coolant:     item("coolant", 27500, null),
      spark_plug:  item("spark_plug", 30000, null, {
        ms: "20k–40k km. Palam iridium boleh mencapai 100k km.",
        en: "20k–40k km. Iridium plugs can last up to 100k km."
      }),
      air_filter:  item("air_filter", 12500, null),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  nmax155: {
    legacy: true,
    label: { ms: "Motosikal", en: "Motorcycle" },
    vehicleClass: "motor",
    icon: "scooter",
    items: {
      engine_oil:  oilItem({ km: 2000, months: null }, { km: 2500, months: null }),
      coolant:     item("coolant", 27500, null),
      spark_plug:  item("spark_plug", 9000, null, { ms: "8,000–10,000 km", en: "8,000–10,000 km" }),
      cvt_belt:    item("cvt_belt", 17500, null, { ms: "15,000–20,000 km", en: "15,000–20,000 km" }),
      cvt_set:     item("cvt_set", 40000, null),
      air_filter:  item("air_filter", 12500, null),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  lagenda115fi: {
    legacy: true,
    label: { ms: "Motosikal", en: "Motorcycle" },
    vehicleClass: "motor",
    icon: "scooter",
    items: {
      engine_oil:  oilItem({ km: 2000, months: null }, { km: 2500, months: null }),
      // Tiada coolant — enjin penyejukan udara.
      spark_plug:  item("spark_plug", 9000, null, { ms: "8,000–10,000 km", en: "8,000–10,000 km" }),
      cvt_belt:    item("cvt_belt", 17500, null, { ms: "15,000–20,000 km", en: "15,000–20,000 km" }),
      cvt_set:     item("cvt_set", 40000, null),
      air_filter:  item("air_filter", 12500, null),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  custom: {
    legacy: true,
    label: { ms: "Kereta", en: "Car" },
    vehicleClass: "custom",
    icon: "car-front",
    items: {
      engine_oil:  oilItem({ km: 5000, months: 6 }, { km: 10000, months: 6 }),
      coolant:     item("coolant", 27500, null),
      spark_plug:  item("spark_plug", 20000, null),
      air_filter:  item("air_filter", 12500, null),
      brake_fluid: item("brake_fluid", 20000, 24),
      battery:     item("battery", null, 24)
    }
  },
  helikopter: {
    legacy: true,
    label: { ms: "Lain-lain", en: "Other" },
    vehicleClass: "other",
    icon: "helicopter",
    items: {}
  },
  basikal: {
    legacy: true,
    label: { ms: "Lain-lain", en: "Other" },
    vehicleClass: "other",
    icon: "bike",
    items: {}
  }
};

// Item tambahan yang pengguna tambah sendiri (bukan berjadual tetap)
const FREEFORM_ITEM_KEY = "custom_item";

// ============================================================
// Kelas Lesen Memandu (JPJ Malaysia)
// ============================================================
const JPJ_LICENSE_CLASSES = [
  { value: "A",  label: { ms: "A — Motosikal roda tiga (dengan kontena)", en: "A — Three-wheeled motorcycle (with container)" } },
  { value: "A1", label: { ms: "A1 — Motosikal roda tiga", en: "A1 — Three-wheeled motorcycle" } },
  { value: "B",  label: { ms: "B — Motosikal dengan sespan (>250cc)", en: "B — Motorcycle with sidecar (>250cc)" } },
  { value: "B1", label: { ms: "B1 — Motosikal tanpa sespan (>250cc)", en: "B1 — Motorcycle without sidecar (>250cc)" } },
  { value: "B2", label: { ms: "B2 — Motosikal (≤250cc)", en: "B2 — Motorcycle (≤250cc)" } },
  { value: "D",  label: { ms: "D — Kereta (manual)", en: "D — Car (manual)" } },
  { value: "DA", label: { ms: "DA — Kereta (automatik)", en: "DA — Car (automatic)" } },
  { value: "E",  label: { ms: "E — Lori/trak (kenderaan berat)", en: "E — Lorry/truck (heavy vehicle)" } },
  { value: "E1", label: { ms: "E1 — Lori (GVW sederhana)", en: "E1 — Lorry (medium GVW)" } },
  { value: "E2", label: { ms: "E2 — Lori (GVW ringan, bukan automatik)", en: "E2 — Lorry (light GVW, non-automatic)" } },
  { value: "F",  label: { ms: "F — Traktor pertanian", en: "F — Agricultural tractor" } },
  { value: "G",  label: { ms: "G — Jengkaut / jentera tanah", en: "G — Excavator / earthmoving machinery" } },
  { value: "H",  label: { ms: "H — Kenderaan tentera", en: "H — Military vehicle" } },
  { value: "I",  label: { ms: "I — Teksi / kenderaan awam (PSV)", en: "I — Taxi / public service vehicle (PSV)" } },
  { value: "lain", label: { ms: "Lain-lain", en: "Other" } }
];
