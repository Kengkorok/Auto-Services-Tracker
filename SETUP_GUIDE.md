# Servis Tracker — Panduan Setup (Firebase + GitHub Pages)

App ni percuma sepenuhnya, disimpan di cloud (bukan wifi rumah anda), dan boleh
diakses dari mana-mana saja — Android, iPhone, laptop, semua boleh guna URL yang sama.

Ambil masa lebih kurang 20-25 minit untuk setup kali pertama. Selepas itu, guna je macam app biasa.

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

## Langkah 4 — Aktifkan Google Sign-In

App ni guna **Google Sign-In** (bukan anonymous) — supaya data anda ikut akaun
Google anda dan boleh diakses dari **mana-mana device** (phone, laptop, tablet),
bukan terikat kepada satu browser/device sahaja.

1. Firebase Console → **Build → Authentication** → klik **Get started** (kalau
   baru pertama kali) atau terus ke tab **Sign-in method**.
2. Klik **Google** dalam senarai providers → **Enable** → pilih email support anda
   → **Save**.
3. Masih dalam **Authentication**, klik tab **Settings → Authorized domains**.
   Klik **Add domain** dan masukkan domain GitHub Pages anda, contoh:
   `USERNAME.github.io` (tanpa `https://`, tanpa slash di belakang).
   **Langkah ni penting** — tanpa domain ni disenaraikan, Google Sign-In akan
   gagal/error bila app dibuka dari URL GitHub Pages anda (walaupun ia jalan elok
   di `localhost`).

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
    match /driverLicenses/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Ini bermakna setiap orang yang log masuk dengan akaun Google melalui app anda
hanya boleh baca/tulis kenderaan yang `ownerId` dia sendiri — orang lain yang
guna app yang sama (kalau anda buat public) takkan nampak/edit kenderaan anda,
dan sebaliknya. Sebab guna akaun Google sebenar (bukan anonymous), UID anda
kekal sama tak kira anda buka dari phone, laptop, atau device lain — data anda
akan sentiasa sync merentas semua device anda.

Bahagian `driverLicenses/{uid}` tu untuk ciri **Lesen Memandu** (pilihan) —
setiap akaun cuma boleh baca/tulis dokumen lesen dia sendiri (ID dokumen =
UID akaun Google tu sendiri).

## Langkah 6 — Buat Firestore Composite Index (PENTING — jangan skip)

App ni query kenderaan dengan **dua** syarat serentak — tapis ikut `ownerId`
DAN susun ikut `createdAt`. Firestore **tidak** buat index untuk kombinasi macam
ni secara automatik — anda kena buat index "composite" sekali sahaja secara
manual, atau app anda akan tersekat dengan mesej ralat lepas log masuk.

Cara termudah:
1. Selepas anda siapkan Langkah 1-5 dan buka app anda buat kali pertama serta
   log masuk dengan Google, **jangan risau** kalau anda nampak mesej ralat merah
   kat atas skrin — ia akan mengandungi **link biru boleh ditekan** terus ke
   Firebase Console untuk create index tu automatik.
2. Tekan link tu → ia akan buka Firebase Console dengan butang **Create Index**
   dah pun terisi automatik → tekan **Create Index**.
3. Tunggu 1-2 minit (Firebase akan build index tu di belakang tabir) → refresh
   app anda → sepatutnya dah okay dan senarai kenderaan muncul.

Kalau nak buat secara manual (tanpa tunggu error dulu):
1. Firebase Console → **Firestore Database → Indexes** tab → **Composite** →
   **Create Index**.
2. Collection ID: `vehicles`.
3. Tambah 2 fields: `ownerId` (Ascending), `createdAt` (Ascending).
4. Query scope: **Collection** → **Create Index**.
5. Tunggu status jadi "Enabled" (biasanya 1-2 minit untuk data kecil).

## Langkah 7 — Upload ke GitHub & Deploy dengan GitHub Pages (percuma)

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

   > Ingat balik ke **Langkah 4.3** — pastikan domain `USERNAME.github.io` ni
   > (ganti USERNAME dengan username GitHub sebenar anda) dah ditambah dalam
   > Authorized Domains Firebase, kalau tak Google Sign-In akan gagal di sini.

> Kalau repo anda **Private**, GitHub Pages private repo perlukan pelan GitHub Pro
> (repo private + Pages percuma cuma untuk akaun Pro/Team). Kalau nak kekal 100%
> percuma, set repo jadi **Public** — firebase-config.js yang terdedah tu selamat
> je sebab akses sebenar dikawal oleh Firestore Security Rules (Langkah 5), bukan
> oleh "rahsia" API key tu.

## Langkah 8 — Install sebagai App di Phone

**Android (Chrome):**
1. Buka URL app tadi dalam Chrome.
2. Tap menu (⋮) → **Add to Home screen** / "Install app".

**iPhone (Safari):**
1. Buka URL app tadi dalam Safari.
2. Tap butang Share (kotak dengan anak panah ke atas).
3. Tap **Add to Home Screen**.

Lepas ni, ada icon app di home screen anda macam app biasa — buka terus tanpa browser bar.

## Langkah 9 — Mula Guna

1. Buka app → tap **Sign in with Google** → pilih akaun Google anda.
2. Tap **+ Kenderaan** → daftar kenderaan anda (Proton Persona 1.6, Yamaha NMAX 155
   V3, Yamaha Lagenda 115 FI, kenderaan custom, atau — kalau nak main-main —
   Helikopter/Basikal 🚁🚲 pun ada). No. pendaftaran, gambar kenderaan, dan tarikh
   luput roadtax semuanya **pilihan** — boleh skip kalau tak nak isi.
3. Masukkan mileage semasa untuk setiap satu, dan ubah interval servis kalau perlu
   ikut kenderaan anda sendiri.
4. Untuk setiap item (Minyak Enjin, Coolant, dsb.) — kalau anda ingat bila kali
   terakhir servis & pada mileage berapa, tap **Log Servis** dan masukkan maklumat
   tu supaya app boleh calculate next servis dengan betul dari sekarang.
5. Lepas ni, setiap kali servis — tap **Log Servis** pada item berkenaan, pilih
   jenis minyak (semi/fully) kalau applicable, masukkan mileage & tarikh — app
   auto-calculate next due.
6. Log masuk dengan akaun Google yang sama di device lain (phone, laptop) — semua
   kenderaan dan rekod servis anda akan terus muncul, disegerak automatik.
7. Nak tambah rekod **Lesen Memandu** (pilihan, tak wajib) — tap kad "🪪 Lesen
   Memandu" di skrin utama, pilih kelas (ikut senarai rasmi JPJ) & tarikh luput,
   tap **+ Tambah Kelas** kalau ada lebih dari satu kelas. Ciri ni cuma rujukan
   visual — tiada notifikasi automatik, dan tak menjejaskan tracking servis
   kenderaan anda langsung.

---

### Jika Ada Masalah

- **"Menyambung..." tak berubah / ralat merah lepas log masuk** → biasanya sebab
  Firestore Composite Index belum dibuat (Langkah 6) — cari link biru dalam mesej
  ralat tu dan tekan untuk create index, ATAU sebab `firebase-config.js` masih ada
  nilai "GANTI_...".
- **"Google Sign-In gagal" / "unauthorized domain" / redirect balik ke skrin log masuk semula** →
  semak semula Langkah 4.3 — domain GitHub Pages anda kena disenaraikan dalam
  Firebase Authorized Domains.
- **Data tak muncul di phone lain** → pastikan anda log masuk dengan **akaun
  Google yang sama** di kedua-dua device, dan buka URL yang sama
  (https://USERNAME.github.io/servis-tracker/) — bukan buka fail index.html terus
  dari phone.
- Nak saya tambah ciri lain (contoh: reminder WhatsApp/Telegram bila due) —
  bagitahu saya, boleh saya sambung.
