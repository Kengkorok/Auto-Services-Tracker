# Servis Tracker — Panduan Setup (Firebase + GitHub Pages)

App ni percuma sepenuhnya, disimpan di cloud (bukan wifi rumah anda), dan boleh
diakses dari mana-mana saja — Android, iPhone, laptop, semua boleh guna URL yang sama.

Ambil masa lebih kurang 15-20 minit untuk setup kali pertama. Selepas itu, guna je macam app biasa.

---

## Langkah 1 — Buat Projek Firebase (percuma)

1. Pergi ke https://console.firebase.google.com dan log masuk dengan akaun Google anda.
2. Klik **"Add project"** / "Tambah Projek".
3. Beri nama contoh `servis-tracker` → klik Continue.
4. Google Analytics — boleh **disable** (tak perlu untuk app ni) → klik **Create project**.
5. Tunggu sekejap sampai siap → klik **Continue**.

## Langkah 2 — Daftarkan "Web App" dalam projek tu

1. Dalam Firebase Console, klik ikon **`</>`** (Web) untuk daftar app baru.
2. Beri nickname contoh `servis-tracker-web` → **jangan** tick "Firebase Hosting" (kita guna GitHub Pages je) → klik **Register app**.
3. Firebase akan tunjukkan blok kod `firebaseConfig = {...}`. **Copy** semua nilai di dalamnya
   (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
4. Buka fail `firebase-config.js` dalam folder app ni, dan **gantikan** nilai `"GANTI_..."`
   dengan nilai sebenar yang anda copy tadi. Simpan fail.

## Langkah 3 — Aktifkan Firestore Database

1. Dalam Firebase Console (menu kiri) → **Build → Firestore Database** → klik **Create database**.
2. Pilih lokasi server contoh `asia-southeast1 (Singapore)` (paling dekat dengan Malaysia) → **Next**.
3. Pilih **"Start in production mode"** → **Enable**.

## Langkah 4 — Aktifkan Anonymous Authentication

App ni guna "Anonymous sign-in" supaya senang (tak perlu buat akaun/password), tapi
data tetap dilindungi oleh security rules supaya orang luar tak boleh access.

1. Firebase Console → **Build → Authentication** → klik **Get started**.
2. Tab **Sign-in method** → pilih **Anonymous** → **Enable** → **Save**.

## Langkah 5 — Set Firestore Security Rules

1. Firebase Console → **Firestore Database → Rules**.
2. Ganti semua rules dengan ini, kemudian klik **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vehicles/{vehicleId} {
      allow read, update, delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.ownerId == request.auth.uid;
    }
  }
}
```

Ini bermakna setiap orang yang "sign-in" (walaupun anonymous) melalui app anda
hanya boleh baca/tulis kenderaan yang `ownerId` dia sendiri — bukan setakat orang
random di internet takkan boleh access, tapi user lain yang buka app yang sama pun
takkan nampak/edit kenderaan anda.

> **Nota keselamatan:** Sebab guna anonymous auth (bukan login peribadi), setiap
> kali browser/device "sign-in anonymous" baru (contoh: clear cache, browser lain),
> ia dapat UID baru — jadi kenderaan lama tak akan muncul lagi (functionally macam
> akaun baru). Untuk elak ini dan dapat proper login merentas device, boleh minta
> saya tambah "Google Sign-In" supaya hanya email anda saja boleh masuk dan data
> ikut akaun, bukan ikut device/browser.

## Langkah 6 — Upload ke GitHub & Deploy dengan GitHub Pages (percuma)

1. Pergi ke https://github.com dan log masuk (atau daftar akaun percuma kalau belum ada).
2. Klik **+ → New repository**. Nama contoh `servis-tracker`. Pilih **Private** (disyorkan,
   supaya firebase-config.js anda tak nampak kat orang random) atau Public pun boleh.
   Klik **Create repository**.
3. Upload semua fail dalam folder `servis-tracker` (index.html, style.css, app.js,
   schedules.js, firebase-config.js, manifest.json, sw.js, folder icons/) — boleh guna
   cara "uploading an existing file" (drag & drop terus di GitHub web) atau guna git:

   ```
   cd servis-tracker
   git init
   git add .
   git commit -m "Servis Tracker v1"
   git branch -M main
   git remote add origin https://github.com/USERNAME/servis-tracker.git
   git push -u origin main
   ```

4. Dalam repo GitHub → **Settings → Pages**.
5. Under "Build and deployment" → Source: **Deploy from a branch** → Branch: **main** / folder **/(root)** → **Save**.
6. Tunggu 1-2 minit, refresh page tu — akan muncul URL contoh:
   `https://USERNAME.github.io/servis-tracker/`

   **Itulah URL app anda** — boleh buka dari phone, laptop, mana-mana saja, guna
   internet/data mobile pun boleh, bukan setakat wifi rumah.

> Kalau repo anda **Private**, GitHub Pages private repo perlukan pelan GitHub Pro
> (repo private + Pages percuma cuma untuk akaun Pro/Team). Kalau nak kekal 100%
> percuma, set repo jadi **Public** — firebase-config.js yang terdedah tu selamat
> je sebab akses sebenar dikawal oleh Firestore Security Rules (Langkah 5), bukan
> oleh "rahsia" API key tu.

## Langkah 7 — Install sebagai App di Phone

**Android (Chrome):**
1. Buka URL app tadi dalam Chrome.
2. Tap menu (⋮) → **Add to Home screen** / "Install app".

**iPhone (Safari):**
1. Buka URL app tadi dalam Safari.
2. Tap butang Share (kotak dengan anak panah ke atas).
3. Tap **Add to Home Screen**.

Lepas ni, ada icon app di home screen anda macam app biasa — buka terus tanpa browser bar.

## Langkah 8 — Mula Guna

1. Buka app → tap **+ Kenderaan** → daftar 3 kenderaan anda:
   - Proton Persona 1.6 (no plate anda)
   - Yamaha NMAX 155 V3 (no plate anda)
   - Yamaha Lagenda 115 FI (no plate anda)
2. Masukkan mileage semasa untuk setiap satu.
3. Untuk setiap item (Minyak Enjin, Coolant, dsb.) — kalau anda ingat bila kali
   terakhir servis & pada mileage berapa, tap **Log Servis** dan masukkan maklumat
   tu supaya app boleh calculate next servis dengan betul dari sekarang.
4. Lepas ni, setiap kali servis — tap **Log Servis** pada item berkenaan, pilih
   jenis minyak (semi/fully) kalau applicable, masukkan mileage & tarikh — app
   auto-calculate next due.

---

### Jika Ada Masalah

- **"Menyambung..." tak berubah / ralat merah** → semak semula `firebase-config.js`,
  pastikan semua nilai betul (bukan "GANTI_...").
- **Data tak muncul di phone lain** → pastikan anda buka URL yang sama
  (https://USERNAME.github.io/servis-tracker/), bukan buka fail index.html terus
  dari phone (sebab tu akan cari fail lokal, bukan URL online).
- Nak saya tambah ciri lain (contoh: reminder WhatsApp/Telegram bila due, atau
  Google Sign-In untuk extra security) — bagitahu saya, boleh saya sambung.
