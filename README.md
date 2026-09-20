# Zeytin — Financial Reporting

Aplikasi pelaporan keuangan untuk **ZEYTiN** (PT. Kebap and Meze House),
Koloni Bali — Jl. Raya Semat No.1, Canggu, Badung.

Menggantikan pembukuan Excel bulanan, **tanpa membuang konsep pelaporannya**:
definisi tiap kolom diambil langsung dari rumus di dalam berkas Excel klien,
bukan dikarang ulang.

| | |
|---|---|
| Hosting | **GitHub Pages** (situs statis) |
| Basis data | **Firebase Firestore** |
| Masuk | **Google Sign-In**, tiga alamat yang diizinkan |
| Tampilan | Sidebar kiri bergaya Filament, ditulis sendiri — **bukan** Filament |
| Halaman | **Dashboard** · **Handler** · **Reports** |
| Bahasa | **Inggris** bawaan, opsi Indonesia |
| Ekspor | **PDF** (jsPDF) dan **Excel** (SheetJS) |
| Rentang | Harian · Bulanan · Tahunan · Kustom |

**Tanpa Node/npm/Vite.** JavaScript modul biasa, pustaka dari CDN saat
dibutuhkan. Tidak ada langkah build sama sekali — apa yang ada di repo itulah
yang disajikan.

## Mencoba sekarang, sebelum Firebase disiapkan

```bash
php -S 127.0.0.1:8321        # atau server statis apa pun
```

Lalu buka **`http://127.0.0.1:8321/?demo`** — aplikasi terisi 45 hari data
contoh dan langsung masuk tanpa login.

Angka contohnya karangan, bukan angka Zeytin yang sebenarnya; repo ini publik.
Mode `?demo` hanya hidup selama `config.js` belum diisi. Begitu Firebase
terpasang, jalan pintas itu mati dengan sendirinya.

> Modul ES tidak bisa dimuat lewat `file://` — harus lewat server, walaupun
> server statis sederhana.

## Menyiapkan Firebase

1. Buat proyek di [console.firebase.google.com](https://console.firebase.google.com)
2. **Authentication → Sign-in method → Google**: aktifkan
3. **Authentication → Settings → Authorized domains**: tambahkan domain
   GitHub Pages Anda
4. **Firestore Database**: buat, mulai dalam mode terkunci
5. **Firestore → Rules**: tempel isi [`firestore.rules`](firestore.rules)
6. Salin konfigurasi web ke [`assets/js/config.js`](assets/js/config.js)

Daftar email di `config.js` dan di `firestore.rules` **harus sama persis**.
Yang di `config.js` cuma menyembunyikan tampilan; yang benar-benar menolak
adalah `firestore.rules`, dan ia berjalan di server Google.

### Keamanan — baca sebelum memasukkan data asli

Ini situs statis: seluruh kodenya, termasuk `projectId` dan daftar email,
**terbaca siapa saja** yang membuka halamannya. Itu cara kerja Firebase,
bukan kesalahan konfigurasi.

Yang menjaga data hanya `firestore.rules`. Tanpa aturan itu terpasang, siapa
pun yang tahu `projectId` bisa membaca nomor rekening ±400 pemasok, nomor
telepon narahubung, dan gaji tiap karyawan. **Jangan masukkan data asli
sebelum langkah 5 selesai.**

`.gitignore` mengunci `*.xlsx`, `*.xls`, dan `*.csv` supaya berkas sumber
klien tidak pernah ikut ter-commit.

## Konsep yang dipertahankan dari berkas Excel

Diambil dari rumus di dalam selnya, bukan ditebak dari angkanya:

| Kolom | Rumus asli | Di aplikasi |
|---|---|---|
| Total Sales | `=SUM(D8:H8)` | cash + bni + grabFood + goFood + goPay |
| Supplier Cash | `=456560+D8` | `SUPPLIER_CASH_OPENING` + cash |
| Remaining Supplier Cash | `=J8-K8` | Supplier Cash − belanja hari itu |
| Grand Income | `=I8-D8` | Total Sales − cash (nontunai) |
| Total baris belanja | `=((E*G)+I-H)` | (qty × price) + tax − disc |

**Petty cash sengaja tidak ikut Total Sales**, karena rumus aslinya memang
mulai dari kolom D dan melewati C. Perilaku itu dipertahankan, dan ditandai
`excl.` di dasbor supaya tidak dikira hilang karena salah hitung.

### Tiga hal yang diperbaiki, atas persetujuan klien

Rinciannya di [`docs/DISKUSI.md`](docs/DISKUSI.md).

1. **Grand Expense** di berkas aslinya menunjuk satu baris belanja
   (`Expense!J80` = 500.000), bukan totalnya. Di sini dijumlahkan penuh —
   belanja tunai sebenarnya 42.872.068.
2. **Transfer ke pemasok** (157.986.252) tidak pernah ikut hitungan laba.
   Di sini ikut sebagai pengeluaran. Laba turun dari 240.264.812 menjadi
   39.906.492.
3. **Rentang belanja harian** di berkas aslinya diketik tangan
   (`Expense!J5:J8`, `J9:J12`, …) sehingga 217.490 terlewat. Di sini
   pengelompokannya berdasarkan tanggal, jadi tidak ada yang bisa luput.

### Saldo global

```
Saldo global = penjualan − (belanja tunai + transfer pemasok + gaji)
             + sisa titipan belanja pemasok
             − tagihan yang belum dibayar
```

Dihitung di satu tempat (`ledger.js`) dan dipakai dasbor, laporan, PDF, dan
Excel. Kalau angka yang sama dihitung berbeda di empat tempat, yang rusak
kepercayaannya — bukan sekadar angkanya.

## Mengimpor berkas Excel bulanan

**Handler → Import Excel.** Pengimpornya tidak menganggap "baris 1 header,
sisanya data", karena berkas klien tidak begitu: tanggal hanya ada di baris
pertama tiap kelompok, header muncul dua kali dengan nama kolom berbeda, dan
tiap sheet mulai di baris berlainan.

Ia mencari baris header berdasarkan nama kolom, mewarisi tanggal yang kosong,
dan **melaporkan sheet yang bentuknya berubah** alih-alih menebak. Galat diam
di pengimpor adalah cara tercepat merusak laporan tanpa ada yang sadar.

Bulan untuk sheet Payroll ditanyakan, tidak ditebak — judulnya di berkas asli
berupa kalimat bebas yang tidak dijamin bentuknya.

## Struktur

```
index.html                    kerangka: masuk, sidebar, dua panel
tests.html                    uji mandiri, buka di peramban
firestore.rules               satu-satunya yang benar-benar menjaga data
assets/css/app.css            seluruh gaya, tulisan tangan
assets/js/
  config.js                   Firebase, daftar email, channel, saldo awal
  ledger.js                   sumber tunggal semua angka laporan
  schema.js                   bentuk tiap catatan, mengikuti kolom Excel
  store.js                    Firestore + mode lokal di balik satu antarmuka
  data.js                     pengambilan data satu rentang
  i18n.js                     kamus Inggris & Indonesia
  util.js                     uang, tanggal, pembantu DOM
  exports.js                  PDF dan Excel
  demo.js                     data contoh untuk ?demo
  pages/                      dashboard · handler · import · reports
docs/DISKUSI.md               catatan diskusi & temuan atas berkas klien
```

## Tes

Buka **`/tests.html`** lewat server.

**36 uji, semuanya lolos** (diverifikasi 20 September 2026 di Chrome).

Yang diuji bukan "halaman terbuka", tapi hal-hal yang membuat laporan salah
kalau rusak:

- Total Sales benar-benar melewati petty cash
- Supplier Cash, sisa titipan, dan pemasukan nontunai sesuai rumus aslinya
- transfer pemasok dan gaji ikut mengurangi laba
- tagihan yang sudah lunas tidak dihitung sebagai utang
- sisa titipan adalah keadaan hari terakhir, bukan jumlah antar hari
- laporan bulanan dan tahunan berjumlah sama dengan harian, per channel
  maupun keseluruhan
- hari tanpa penjualan tetap muncul sebagai baris nol, bukan hilang
- rentang tanggal terbalik tidak menghasilkan tabel kosong tanpa penjelasan
- serial tanggal Excel 46235 dibaca sebagai 1 Agustus 2026
- tiap kunci bahasa Inggris punya terjemahan Indonesianya

## Yang belum dikerjakan

- **Firebase belum pernah dihubungkan.** Seluruh alur diuji di mode lokal,
  termasuk di peramban sungguhan. Alur masuk Google dan penolakan oleh
  `firestore.rules` baru bisa dibuktikan setelah proyek Firebase dibuat.
- **Rekap bulanan belum disimpan.** Firestore ditagih per dokumen dibaca,
  jadi laporan tahunan yang menarik ribuan baris tiap kali dibuka akan mahal.
  Rencananya menyimpan rekap bulanan yang tetap bisa dihitung ulang dari
  dokumen aslinya.
- **Sheet Payroll diimpor sebagian** — nama, gaji pokok, potongan BPJS, dan
  total. Kolom jam kerja, lembur, dan sisa cuti belum ikut.
