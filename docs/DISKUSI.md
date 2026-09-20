# Catatan Diskusi — Aplikasi Laporan Zeytin

> Status: **masih tahap diskusi.** Belum ada yang dibangun berdasarkan
> catatan ini. Berkas ini merekam permintaan klien beserta konsekuensi
> teknisnya, supaya keputusannya bisa diambil sebelum kode ditulis.

Terakhir diperbarui: 20 September 2026.

## Permintaan

1. Di-host di **GitHub Pages**
2. Basis data **Firebase** — Firestore atau Realtime Database, dibebaskan
3. **Login dengan Google**
4. Tampilan bergaya Filament (sidebar kiri), **tapi bukan Filament**
5. Halaman: **Dashboard** dan **Handler** — satu halaman handler saja untuk
   menangani seluruh laporan
6. Seluruh informasi di berkas Excel dipakai; itu bentuk pelaporan yang
   sekarang berlaku
7. Tombol **export PDF** (untuk laporan ke bos) dan **download Excel**
8. Laporan seprofesional dan sekeren mungkin — pembacanya orang luar negeri,
   **bahasa Inggris**, dengan opsi bahasa Indonesia
9. Rentang laporan: **harian, bulanan, tahunan, dan kustom**
10. Dashboard fokus pada ringkasan singkat: sisa saldo dan sejenisnya

## Jawaban klien atas pertanyaan terbuka

**Pengguna: satu orang saja, tanpa peran.** Kliennya adalah stafnya sendiri.
Dia ingin pelaporannya dipermudah, bukan sistem berlapis. Tidak ada admin
dan operator, tidak ada hak akses per peran.

**Pemasukan data: diketik *dan* diunggah.** Keduanya, bukan salah satu.

**Isi halaman Handler:** formulir lengkap untuk semua laporan, selesai dalam
satu halaman.

**Dashboard:** menampilkan semua saldo, ditambah satu **saldo global**.

### Apa artinya

Satu pengguna tanpa peran **sangat menyederhanakan** aplikasinya:

- Tidak perlu tabel pengguna, tidak perlu manajemen peran, tidak perlu
  pemeriksaan hak akses di tiap halaman.
- Firebase Security Rules-nya jadi sesederhana mungkin dan justru paling
  aman: hanya satu alamat email yang boleh membaca dan menulis. Siapa pun
  yang masuk dengan akun Google lain langsung ditolak di tingkat basis data,
  bukan sekadar disembunyikan di tampilan.
- Tidak ada jejak audit "siapa mengubah apa", karena pelakunya cuma satu.

Alamat email itu **wajib diketahui sebelum aturan keamanannya ditulis.**
Selama belum ada, jangan masukkan data asli.

## Bagian tersulit: mengurai berkas Excel-nya

Karena datanya juga diunggah, pengimpornya harus sanggup membaca berkas
seperti `ZEYTiN Daily Income & Expense Aug 2025.xlsx`. Berkas itu ditulis
manusia untuk dibaca manusia, dan bentuknya tidak rapi:

- **Tanggal hanya ditulis di baris pertama tiap kelompok.** Di sheet Expense,
  satu tanggal menaungi beberapa baris belanja di bawahnya; baris kedua dan
  seterusnya kolom tanggalnya kosong dan harus diwarisi dari atas.
- **Baris header muncul lebih dari sekali.** Di sheet Outstanding INV ada dua
  blok terpisah dengan header sendiri-sendiri (baris 1 dan baris 8), dan
  judul kolomnya pun berbeda: satu menulis "Due Time", satunya "Deliv Date".
- **Data tidak mulai dari baris 1.** Income mulai baris 7, Expense baris 4,
  Supplier Database baris 9, Payroll baris 19.
- **Payroll terbagi dua bagian** — Front Staff dan Kitchen Staff — masing-
  masing dengan header dan baris subtotalnya sendiri.
- **Blok rekap menyelip di samping data.** Di Income, kolom O sampai R berisi
  ringkasan yang tidak ada hubungannya dengan baris harian di sebelah kiri.

Konsekuensinya: pengimpor tidak boleh menganggap "baris 1 header, sisanya
data". Ia harus mencari baris headernya, mewarisi tanggal yang kosong, dan
**menolak dengan jelas** kalau bentuk berkasnya berubah — bukan diam-diam
memasukkan angka ke kolom yang salah. Galat diam di pengimpor adalah cara
tercepat merusak laporan tanpa ada yang sadar.

## Saldo yang ditampilkan di Dashboard

Klien meminta "semuanya, dan ada saldo global juga". Dari berkas Excel, yang
tersedia:

| Saldo | Asal |
|---|---|
| Kas per channel | Petty cash · Cash · BNI · Grab Food · Go Food · Go Pay |
| Remaining Supplier Cash | Titipan tunai belanja pemasok, bisa minus |
| Grand Income | Total pemasukan |
| Outstanding | Tagihan pemasok yang belum dibayar |

**Usulan rumus saldo global** — perlu dikonfirmasi ke klien sebelum dipakai:

```
Saldo global = seluruh kas & bank
             + sisa titipan belanja pemasok
             − tagihan yang belum dibayar
```

Yang penting bukan rumusnya, melainkan bahwa rumusnya **tertulis dan sama di
seluruh aplikasi**. Angka ini yang akan dilihat bos, dan kalau definisinya
berbeda antara dashboard dan laporan PDF, yang rusak kepercayaannya, bukan
sekadar angkanya.

## Benturan yang harus diputuskan

### GitHub Pages tidak bisa menjalankan Laravel

GitHub Pages hanya menyajikan berkas statis — HTML, CSS, JavaScript, gambar.
Tidak ada PHP di sana, tidak ada MySQL, tidak ada Laravel.

Artinya fondasi Laravel + Filament yang sudah terlanjur di-commit ke repo ini
**tidak bisa dipakai** untuk arah yang baru:

| | Rencana lama | Arah baru |
|---|---|---|
| Hosting | Shared hosting / XAMPP | GitHub Pages (statis) |
| Bahasa | PHP (Laravel 12) | JavaScript di peramban |
| Basis data | MySQL | Firebase Firestore |
| Tampilan | Filament 5 | Buatan sendiri, bergaya Filament |
| Login | Filament auth | Google Sign-In (Firebase Auth) |

**Saran: hapus fondasi Laravel-nya** dan mulai sebagai aplikasi statis.
Belum ada yang dihapus — menunggu persetujuan.

### Keamanan data

Berkas sumbernya memuat nomor rekening dan nama pemilik rekening sekitar 400
pemasok, nomor HP narahubung, dan gaji tiap karyawan. Di aplikasi statis,
seluruh kode dan konfigurasi Firebase **terbaca siapa saja** yang membuka
situsnya — itu memang cara kerja Firebase, bukan kesalahan konfigurasi.

Yang menjaga datanya hanya dua lapis:

1. **Firebase Security Rules** yang membatasi baca/tulis ke satu email yang
   diizinkan. Tanpa ini, siapa pun yang tahu alamat situsnya bisa membaca
   seluruh data keuangan.
2. **Pembatasan siapa yang boleh masuk.** Login Google saja tidak cukup —
   siapa pun punya akun Google.

Repo ini sendiri publik, tapi datanya tinggal di Firebase, bukan di repo.
Itu tidak jadi masalah asalkan aturannya benar. Berkas `*.xlsx`, `*.xls`,
dan `*.csv` dikunci di `.gitignore` supaya berkas sumbernya tidak pernah
ikut ter-commit.

## Keputusan teknis: Firestore, bukan Realtime Database

- **Kueri rentang tanggal.** Laporan harian, bulanan, tahunan, dan kustom
  semuanya berarti "ambil baris antara tanggal A dan B". Firestore
  menanganinya lewat indeks; Realtime Database hanya punya satu kunci urut
  per kueri, sehingga penyaringan gabungan terpaksa dikerjakan di peramban
  setelah menarik lebih banyak data dari yang dibutuhkan.
- **Bentuk datanya cocok.** Tiap baris Excel jadi satu dokumen dengan bidang
  bernama — dekat dengan bentuk aslinya, mudah ditelusuri di konsol Firebase.
- **Aturan keamanannya lebih ekspresif**, dan itu justru lapisan yang paling
  menentukan di sini.

Realtime Database unggul untuk sinkronisasi cepat antar banyak klien —
obrolan, status daring, kolaborasi langsung. Tidak ada kebutuhan seperti itu
di aplikasi ini, apalagi penggunanya cuma satu orang.

Konsekuensi biaya: Firestore ditagih per dokumen yang dibaca. Laporan tahunan
yang menarik ribuan baris tiap kali dibuka bisa mahal, jadi rekap bulanan
sebaiknya ikut disimpan. Ini satu-satunya tempat di proyek ini yang
menyimpang dari prinsip "tidak ada tabel saldo" — alasannya biaya, bukan
kemudahan, dan rekapnya harus bisa dihitung ulang dari dokumen aslinya kalau
sewaktu-waktu diragukan.

## Yang masih perlu dijelaskan

1. **Alamat email Google** yang boleh masuk. Wajib ada sebelum aturan
   keamanan ditulis dan sebelum data asli dimasukkan.
2. **Konfirmasi rumus saldo global** di atas.
3. **Kejanggalan di berkas aslinya** — dua hal ini perlu ditanyakan ke klien,
   bukan dibetulkan diam-diam:
   - Rekap atas dan bawah tidak cocok: blok ringkasan `O8:R9` menulis Grand
     Expense **500.000**, sedangkan baris total `K40` menulis Expense
     **42.654.578**.
   - Tanggalnya Agustus 2026, bukan 2025. Serial Excel 46235–46265 =
     1–31 Agustus 2026, padahal nama berkasnya "Aug 2025" dan sheet Payroll
     menulis "1st – 31th September 2025".

## Catatan teknis untuk nanti

- Tanpa Node/npm, sejalan dengan proyek-proyek sebelumnya: JavaScript biasa
  plus pustaka dari CDN.
- Export PDF: jsPDF + autoTable. Export Excel dan **pengurai berkas unggahan**:
  SheetJS. Ketiganya berjalan di peramban, tidak perlu server.
- Dua bahasa (Inggris bawaan, Indonesia opsional) ditangani berkas kamus
  sederhana, pola yang sama seperti proyek kasir Kebap.
- GitHub Pages menyajikan dari cabang `gh-pages` atau folder `/docs` di
  `main`. Berkas ini ada di `/docs`, jadi kalau `/docs` yang dipilih sebagai
  akar situs, catatan ini perlu dipindah lebih dulu supaya tidak ikut
  terbit ke publik.
