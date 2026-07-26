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
  }
};

// Modifikasi lain / servis tambahan yang user boleh tambah manual (bukan berjadual tetap)
const FREEFORM_ITEM_KEY = "custom_item";
