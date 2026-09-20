# Catatan Diskusi — Aplikasi Laporan Zeytin

> Status: **masih tahap diskusi.** Belum ada aplikasi yang dibangun.
> Berkas ini merekam permintaan klien, konsep pelaporan yang berlaku
> sekarang, dan temuan atas berkas Excel-nya.

Terakhir diperbarui: 20 September 2026.

## Permintaan

1. Di-host di **GitHub Pages**
2. Basis data **Firebase** — dipilih **Firestore** (alasannya di bawah)
3. **Login dengan Google**
4. Tampilan bergaya Filament (sidebar kiri), **tapi bukan Filament**
5. Halaman: **Dashboard** dan **Handler** — satu halaman handler saja,
   formulirnya selesai dalam satu halaman
6. **Konsep Excel yang berlaku sekarang jangan dibuang**
7. Tombol **export PDF** (untuk laporan ke bos) dan **download Excel**
8. Laporan seprofesional dan sekeren mungkin — pembacanya orang luar negeri,
   **bahasa Inggris**, dengan opsi bahasa Indonesia
9. Rentang laporan: **harian, bulanan, tahunan, dan kustom**
10. Dashboard: semua saldo, ditambah satu **saldo global**

## Pengguna yang diizinkan

```
zeytin.canggu@gmail.com
anatolia.kilic@gmail.com
elzamcuan@gmail.com
```

Tanpa peran — ketiganya punya akses yang sama. Tidak ada admin dan operator,
tidak ada pemeriksaan hak akses per halaman.

> Ditulis klien sebagai `anatolia.kilic@ gmail.com` (ada spasi sebelum
> `gmail.com`). Diasumsikan salah ketik. **Perlu dikonfirmasi** — satu huruf
> meleset berarti orangnya tidak bisa masuk sama sekali.

Ketiga alamat ini masuk ke Firebase Security Rules. Penolakan terjadi di
tingkat basis data, bukan sekadar menu yang disembunyikan, sehingga akun
Google lain tidak bisa membaca apa pun walau tahu alamat situsnya.

## Konsep Excel yang berlaku sekarang

Diambil langsung dari rumus di dalam sel, bukan ditebak dari angkanya.
Inilah yang harus dipertahankan aplikasinya.

### Sheet Income — per hari

| Kolom | Rumus asli | Artinya |
|---|---|---|
| I — Total Sales | `=SUM(D8:H8)` | Cash + BNI + Grab Food + Go Food + Go Pay |
| J — Supplier Cash | `=456560+D8` | Titipan belanja = 456.560 + kas hari itu |
| K — Expense | `=SUM(Expense!J5:J8)` | Belanja tunai hari itu |
| L — Remaining Supplier Cash | `=J8-K8` | Sisa titipan (boleh minus) |
| M — Grand Income | `=I8-D8` | Total penjualan dikurangi tunai = **pemasukan nontunai** |

Totalnya di baris 40: `I40 =SUM(I6:I37)` · `K40 =SUM(K6:K37)` ·
`M40 =SUM(M6:M39)`.

### Blok rekap — Income kolom O sampai R

| Sel | Rumus asli | Nilai |
|---|---|---|
| O9 — Grand Income | `=I40` | 272.151.757 |
| P9 — Grand Expense | `=SUM(Expense!J80+'Supplier Transfer Payment'!J146)-('Supplier Transfer Payment'!J94+'Supplier Transfer Payment'!J96)` | 500.000 |
| Q9 — Payroll | `=SUM(Payroll!S40)` | 31.386.945 |
| R9 — Profit / Gross | `=((O9-P9)-Income!$Q$9)` | 240.264.812 |

## Tiga temuan yang perlu dikonfirmasi ke klien

Dilaporkan apa adanya. Saya bisa saja melewatkan konteks yang cuma klien
tahu, jadi ini pertanyaan, bukan vonis. Tapi ketiganya memengaruhi angka
yang dikirim ke bos, jadi tidak boleh dibawa diam-diam ke aplikasi baru.

### 1. Grand Expense menunjuk satu baris belanja, bukan totalnya

`Expense!J80` bukan sel total. Rumusnya `=((E80*G80)+I80-H80)` — itu
perhitungan **satu baris belanja** (qty × harga + pajak − diskon), nilainya
500.000.

Bagian lain rumusnya juga tidak menghasilkan apa-apa:
`'Supplier Transfer Payment'!J146` adalah `=sum(J94:J145)` atas **kolom J**,
padahal kolom J di sheet itu berisi teks status pembayaran (`PT KEBAP PAID`,
`ASLAN PAID`), bukan angka — hasilnya 0. `J94` dan `J96` kosong.

Jadi Grand Expense = 500.000 + 0 − 0 = **500.000**, sementara total belanja
tunai sesungguhnya **42.872.068**.

### 2. Transfer ke pemasok tidak ikut dihitung sama sekali

Sheet Supplier Transfer Payment, kolom H (Total Expense), berjumlah
**78.993.126** untuk 67 baris. Angka sebesar itu tidak masuk ke Grand
Expense maupun ke Profit / Gross.

> Koreksi. Catatan ini semula menulis **157.986.252**, persis dua kali
> lipat. Sebabnya baris `TOTAL` di dalam sheet itu (baris 86, kolom H)
> ikut terjumlah bersama baris datanya. Angka yang benar 78.993.126 —
> sudah dicocokkan dengan sel `TOTAL`-nya sendiri.

Kalau ketiga pengeluaran dijumlahkan sebagaimana mestinya:

| | Dilaporkan workbook | Kalau dihitung penuh |
|---|---|---|
| Penjualan | 272.151.757 | 280.983.465 |
| Belanja tunai | 500.000 | 42.872.068 |
| Transfer pemasok | — | 78.993.126 |
| Payroll | 31.386.945 | 31.386.944 |
| **Profit / Gross** | **240.264.812** | **127.731.327** |

Selisihnya **112,5 juta**. Mungkin saja transfer pemasok memang sengaja
tidak dihitung karena dibayar dari pos lain — tapi itu harus dinyatakan,
bukan tersirat.

### 3. Rentang harian dipilih tangan, dan ada baris yang terlewat

Kolom Expense di sheet Income menunjuk rentang baris yang diketik manual:
`Expense!J5:J8`, lalu `J9:J12`, lalu `J13:J20`, dan seterusnya. Menyisipkan
satu baris belanja baru tidak otomatis masuk hitungan hari itu.

Akibatnya sudah terjadi: jumlah seluruh kolom J di sheet Expense adalah
**42.872.068**, sedangkan `Income!K40` yang dipakai laporan menghasilkan
**42.654.578**. **217.490 tidak terhitung** karena jatuh di luar semua
rentang.

Di aplikasi nanti hal ini hilang dengan sendirinya: pengeluaran
dikelompokkan berdasarkan tanggalnya, bukan berdasarkan nomor baris.

### 4. Penjualan yang dilaporkan melewatkan tanggal 31

Penyakit yang sama dengan nomor 3, tapi kali ini mengenai angka paling
atas — yang dibaca bos lebih dulu daripada yang lain.

`Income!Q8` berisi **272.151.757**. Jumlah Total Sales ketiga puluh satu
harinya **280.983.465**. Selisihnya **8.831.708**, dan itu persis Total
Sales tanggal **31 Agustus**: satu hari penuh tidak masuk rentang yang
diketik tangan.

Hari terakhir adalah hari yang paling mungkin terlewat, karena barisnya
ditambahkan setelah rumusnya ditulis. Di aplikasi ini penjumlahan mengikuti
tanggal, jadi hari yang baru dimasukkan ikut dengan sendirinya.

### 5. Tanggal diketik sebagai teks, dan satu di antaranya salah tahun

Di sheet Expense, tanggal enam belas hari pertama berupa serial Excel
(46235, 46236, …) — angka yang dikenali Excel sebagai tanggal. Mulai baris
138 bentuknya berubah jadi teks biasa: `"17/8/2026"`, `"31/08/2026"`.

Satu di antaranya tertulis **`"18/8/2028"`** — tahun 2028, bukan 2026.
Excel tidak menganggapnya tanggal sama sekali, jadi tidak ada peringatan
apa pun, dan jumlah barisnya tetap sama. Belanja 464.000 hari itu akan
muncul di laporan tahun 2028 kalau dibiarkan.

Perbaikannya ada di sel itu, bukan di aplikasi: aplikasi tidak boleh
diam-diam membetulkan angka yang diketik manusia. Yang bisa dilakukan
aplikasi adalah membuatnya kelihatan — karena itu tabel hasil impor
menampilkan rentang tanggal yang terbaca tiap sheet.

### Catatan tambahan

- **Petty cash (kolom C) tidak ikut Total Sales.** `SUM(D:H)` dimulai dari
  D, melewati C. Disengaja atau tidak, perlu ditanyakan.
- **456.560 diketik langsung di tiap baris** Supplier Cash. Angka ini
  kelihatannya saldo awal titipan, tapi tidak ada keterangannya di mana pun.
- **3.051.605 dari transfer pemasok tidak punya status pembayaran** — 5 baris
  dari 67. Sisanya: 75.562.122 `PT KEBAP PAID`, 379.399 `ASLAN PAID`.
  (Catatan ini semula menulis 82.044.731 dan "lebih dari separuhnya";
  itu keliru, ikut terbawa salah jumlah yang sama dengan temuan nomor 2.)

## Saldo di Dashboard

Klien minta "semuanya, dan ada saldo global juga", dengan konsep Excel
dipertahankan. Jadi yang ditampilkan mengikuti kolom yang sudah ada:

| Saldo | Asal di Excel |
|---|---|
| Kas per channel | Petty cash · Cash · BNI · Grab Food · Go Food · Go Pay |
| Total Sales | `SUM(D:H)` per hari |
| Grand Income (nontunai) | `Total Sales − Cash` |
| Supplier Cash | `456.560 + Cash` |
| Remaining Supplier Cash | `Supplier Cash − Expense` |
| Outstanding | Tagihan pemasok yang belum dibayar |

**Saldo global belum bisa ditetapkan** sampai temuan nomor 1 dan 2 di atas
dijawab — rumus Profit / Gross yang ada sekarang tidak bisa dipakai apa
adanya. Yang penting bukan rumusnya, melainkan bahwa rumusnya **tertulis dan
sama persis** antara dashboard, laporan PDF, dan unduhan Excel. Kalau
definisinya berbeda antar tempat, yang rusak kepercayaannya, bukan sekadar
angkanya.

## Keputusan teknis

### Firestore, bukan Realtime Database

- **Kueri rentang tanggal.** Seluruh laporan berbentuk "ambil baris antara
  tanggal A dan B". Firestore menanganinya lewat indeks; Realtime Database
  hanya punya satu kunci urut per kueri, sehingga penyaringannya jatuh ke
  peramban setelah menarik data berlebih.
- **Bentuk datanya cocok.** Tiap baris Excel jadi satu dokumen dengan bidang
  bernama — dekat dengan bentuk aslinya, mudah ditelusuri di konsol.
- **Aturan keamanannya lebih ekspresif**, dan itu lapisan yang paling
  menentukan di sini.

Realtime Database unggul untuk sinkronisasi cepat antar banyak klien.
Tidak ada kebutuhan seperti itu di sini.

Konsekuensi biaya: Firestore ditagih per dokumen dibaca. Laporan tahunan
yang menarik ribuan baris tiap kali dibuka bisa mahal, jadi rekap bulanan
sebaiknya ikut disimpan — dan harus bisa dihitung ulang dari dokumen
aslinya kalau sewaktu-waktu diragukan.

### Laravel dibuang

GitHub Pages hanya menyajikan berkas statis: tidak ada PHP, tidak ada MySQL.
Klien sudah menyetujui — fondasi Laravel + Filament dihapus dari repo ini.
Riwayatnya tetap ada di commit `b5075de` kalau suatu saat diperlukan.

Bentuk barunya: HTML + CSS + JavaScript biasa, tanpa Node/npm, pustaka dari
CDN. Sejalan dengan proyek-proyek sebelumnya.

### Keamanan

Di aplikasi statis, seluruh kode dan konfigurasi Firebase **terbaca siapa
saja** yang membuka situsnya. Itu cara kerja Firebase, bukan kesalahan
konfigurasi. Yang menjaga datanya hanya Security Rules dan daftar email di
atas.

Berkas sumber Excel memuat nomor rekening ±400 pemasok, nomor HP, dan gaji
tiap karyawan. `.gitignore` mengunci `*.xlsx`, `*.xls`, `*.csv` supaya tidak
pernah ikut ter-commit ke repo publik ini. Datanya tinggal di Firestore.

## Bagian tersulit: mengurai berkas Excel yang diunggah

Karena datanya juga diunggah, pengimpornya harus membaca berkas seperti
`ZEYTiN Daily Income & Expense Aug 2025.xlsx`. Berkas itu ditulis manusia
untuk dibaca manusia:

- **Tanggal hanya di baris pertama tiap kelompok.** Di sheet Expense, satu
  tanggal menaungi beberapa baris belanja; baris berikutnya kosong dan harus
  mewarisi dari atas.
- **Header muncul lebih dari sekali.** Outstanding INV punya dua blok dengan
  header sendiri (baris 1 dan 8), dan judulnya berbeda: "Due Time" vs
  "Deliv Date".
- **Tiap sheet mulai di baris berlainan:** Income 7, Expense 4,
  Supplier Database 9, Payroll 19.
- **Payroll terbagi dua** — Front Staff dan Kitchen Staff — masing-masing
  dengan header dan subtotal sendiri.
- **Blok rekap menyelip di samping data** (Income kolom O–R).

Pengimpor harus mencari baris headernya, mewarisi tanggal yang kosong, dan
**menolak dengan jelas** kalau bentuk berkasnya berubah — bukan diam-diam
memasukkan angka ke kolom yang salah. Galat diam di pengimpor adalah cara
tercepat merusak laporan tanpa ada yang sadar.

## Rencana teknis

- **Hosting:** GitHub Pages. Perlu diputuskan menyajikan dari cabang
  `gh-pages` atau folder `/docs` di `main`. Catatan ini ada di `/docs`, jadi
  kalau `/docs` yang dipilih, berkas ini harus dipindah dulu supaya tidak
  ikut terbit.
- **Export PDF:** jsPDF + autoTable (CDN).
- **Export & impor Excel:** SheetJS (CDN).
- **Dua bahasa:** berkas kamus sederhana, Inggris sebagai bawaan.

## Yang masih ditunggu

1. Konfirmasi ejaan `anatolia.kilic@gmail.com`.
2. Jawaban atas tiga temuan di atas — terutama apakah transfer pemasok
   memang sengaja tidak masuk hitungan laba.
3. Setelah itu baru saldo global bisa ditetapkan rumusnya.
