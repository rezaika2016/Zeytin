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

## Menyalakan GitHub Pages

**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`.**

Alamatnya nanti:

```
https://rezaika2016.github.io/Zeytin/
```

Perhatikan sub-path `/Zeytin/` — situs proyek GitHub Pages tidak disajikan
di akar domain. Seluruh path di aplikasi ini relatif, dan peruteannya memakai
hash (`#/reports`), jadi tidak ada yang perlu diubah. Kombinasi itu sudah
diuji dengan menyajikan berkasnya dari sub-path yang sama.

Dua berkas pendukungnya:

- **`.nojekyll`** — mematikan Jekyll. Tanpa ini GitHub memproses repo sebagai
  situs Jekyll, yang antara lain mengabaikan berkas berawalan garis bawah.
  Situs ini tidak butuh pemrosesan apa pun; berkasnya sudah siap saji.
- **`robots.txt`** — meminta mesin pencari tidak mengindeks. Itu permintaan,
  bukan penjagaan; yang menjaga data tetap `firestore.rules`.

> **Repo ini harus publik** supaya GitHub Pages gratis. Artinya seluruh isi
> repo — termasuk `docs/DISKUSI.md` beserta angka di dalamnya — bisa dibaca
> siapa saja, baik lewat github.com maupun lewat alamat Pages di atas.

## Menyiapkan Firebase

1. Buat proyek di [console.firebase.google.com](https://console.firebase.google.com)
2. **Authentication → Sign-in method → Google**: aktifkan
3. **Authentication → Settings → Authorized domains**: tambahkan
   `rezaika2016.github.io`. Tanpa ini, jendela masuk Google akan menolak
   dengan `auth/unauthorized-domain` — dan pesannya tidak menjelaskan
   sebabnya, jadi mudah dikira aplikasinya yang rusak.
4. **Firestore Database**: buat, mulai dalam mode terkunci
5. **Firestore → Rules**: tempel isi [`firestore.rules`](firestore.rules)
6. Salin konfigurasi web ke [`assets/js/config.js`](assets/js/config.js)

Daftar email di `config.js` dan di `firestore.rules` **harus sama persis** —
dan itu dijaga oleh salah satu uji di `tests.html`, bukan oleh ingatan.
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

### Lima hal yang ditemukan di berkas aslinya

Rinciannya di [`docs/DISKUSI.md`](docs/DISKUSI.md). Tiga yang pertama sudah
disetujui klien untuk diperbaiki; dua terakhir ditemukan belakangan, saat
berkas Agustus benar-benar diimpor.

1. **Grand Expense** di berkas aslinya menunjuk satu baris belanja
   (`Expense!J80` = 500.000), bukan totalnya. Di sini dijumlahkan penuh —
   belanja tunai sebenarnya 42.872.068.
2. **Transfer ke pemasok** (78.993.126) tidak pernah ikut hitungan laba.
   Di sini ikut sebagai pengeluaran. Laba turun dari 240.264.812 menjadi
   127.731.327.
3. **Rentang belanja harian** di berkas aslinya diketik tangan
   (`Expense!J5:J8`, `J9:J12`, …) sehingga 217.490 terlewat. Di sini
   pengelompokannya berdasarkan tanggal, jadi tidak ada yang bisa luput.
4. **Penjualan yang dilaporkan melewatkan tanggal 31.** `Income!Q8` berisi
   272.151.757; jumlah ketiga puluh satu harinya 280.983.465. Selisih
   8.831.708 itu persis penjualan 31 Agustus — hari terakhir jatuh di luar
   rentang yang diketik tangan.
5. **Satu tanggal salah ketik tahun:** `"18/8/2028"` di sheet Expense.
   Aplikasi tidak membetulkannya diam-diam — tabel hasil impor menampilkan
   rentang tanggal tiap sheet, jadi tahun yang melenceng langsung kelihatan.
   Perbaikannya di sel itu sendiri.

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

Tanggalnya dua bentuk sekaligus: serial Excel di awal bulan, lalu teks
ketikan tangan ("31/08/2026") di sisanya. Keduanya dibaca hari-dulu.
Tabel hasil impor menampilkan **rentang tanggal yang terbaca tiap sheet**,
supaya salah ketik tahun — yang tidak mengubah jumlah baris dan tidak
memunculkan galat — kelihatan sebelum datanya dipakai.

Bulan untuk sheet Payroll ditanyakan, tidak ditebak — judulnya di berkas asli
berupa kalimat bebas yang tidak dijamin bentuknya.

### Mengimpor ulang berkas yang sama itu aman

Tiap baris impor diberi nomor yang diturunkan dari isinya, bukan nomor acak.
Akibatnya impor kedua atas berkas yang sama **menimpa baris yang sama**, tidak
menambah baris baru. Diuji dengan mengimpor berkas Agustus tiga kali: jumlah
barisnya tetap 230, totalnya tidak bergerak.

Kalau satu sel dibetulkan di Excel lalu berkasnya diimpor ulang, baris versi
lamanya dibuang — bukan ditinggalkan berdampingan dengan yang baru. Yang
dibuang hanya baris **bertanda `source: 'import'`** dan hanya di dalam rentang
tanggal berkas itu.

**Apa yang diketik lewat halaman Handler tidak pernah disentuh impor.** Berkas
Excel berwenang atas baris yang ia bawa sendiri, bukan atas seluruh isi basis
data. Jumlah baris yang diganti ditampilkan di tabel hasil, supaya penghapusan
tidak pernah terjadi diam-diam.

## Alur sehari-hari

Dua jalan masuk, dipakai bersamaan:

| | Kapan | Caranya |
|---|---|---|
| **Ketik** | tiap hari, sambil jalan | Handler → tab yang sesuai → isi formulir |
| **Unggah** | tiap akhir bulan | Handler → Import Excel |

Penjualan harian paling enak diketik langsung tiap tutup kasir — angkanya
sedikit dan langsung terlihat di dasbor. Belanja, transfer, dan payroll lebih
enak diimpor sebulan sekali dari berkas yang memang sudah Anda isi.

Keduanya boleh dicampur tanpa takut bentrok: impor tidak menghapus ketikan,
dan ketikan tidak menghalangi impor.

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

**48 uji, semuanya lolos** (diverifikasi 20 September 2026 di Chrome).

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
- tanggal ketikan tangan "31/08/2026" dibaca hari-dulu, bukan ditolak
- tanggal mustahil ("31/13/2026") ditolak, bukan digeser ke bulan berikutnya
- baris impor yang isinya sama selalu dapat nomor yang sama, jadi mengimpor
  berkas yang sama dua kali tidak menggandakan apa pun
- dua baris belanja yang benar-benar kembar dalam satu hari tetap dua baris
- tiap kunci bahasa Inggris punya terjemahan Indonesianya
- daftar email di `firestore.rules` sama persis dengan yang di `config.js`

## Yang belum dikerjakan

- **Alur masuk Google belum diuji sungguhan.** Konfigurasi `zeytin-report`
  sudah terpasang dan SDK-nya termuat — aplikasi tidak lagi jatuh ke mode
  lokal. Jendela masuk Google dan penolakan oleh `firestore.rules` baru bisa
  dibuktikan lewat peramban biasa, bukan peramban tanpa tampilan.
- **Rekap bulanan belum disimpan.** Firestore ditagih per dokumen dibaca,
  jadi laporan tahunan yang menarik ribuan baris tiap kali dibuka akan mahal.
  Rencananya menyimpan rekap bulanan yang tetap bisa dihitung ulang dari
  dokumen aslinya.
- **Sheet Payroll diimpor sebagian** — nama, gaji pokok, potongan BPJS, dan
  total. Kolom jam kerja, lembur, dan sisa cuti belum ikut.
