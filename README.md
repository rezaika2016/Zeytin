# Zeytin — Laporan Keuangan

Aplikasi pelaporan untuk **ZEYTiN** (PT. Kebap and Meze House), Koloni Bali,
Jl. Raya Semat No.1, Canggu, Badung.

Menggantikan pembukuan berkas Excel bulanan dengan laporan yang dihitung
ulang dari datanya sendiri. Kerabat dekat proyek kasir Kebap & Meze House,
dan mengikuti pola yang sama: Laravel 12 + Filament 5 + Livewire, **tanpa
Node/npm/Vite**, uang sebagai bilangan bulat rupiah, tidak ada tabel saldo.

> **Status: baru fondasi.** Yang ada di repo ini sejauh ini Laravel + Filament
> dan dokumen analisis di bawah. Belum ada tabel, model, maupun halaman.
> Pertanyaan cakupan di bagian terakhir masih menunggu jawaban klien.

## Jangan commit berkas data klien

`.gitignore` mengunci `*.xlsx`, `*.xls`, dan `*.csv` di akar repo. **Repo ini
publik**, sedangkan berkas sumber dari klien berisi:

- nomor rekening bank dan nama pemilik rekening ~400 pemasok
- nomor HP narahubung tiap pemasok
- gaji tiap karyawan beserta potongan BPJS, lengkap dengan namanya
- gaji pemilik dan omzet bulanan

Sekali terbit ke repo publik, anggap data itu sudah tersebar permanen —
GitHub menyimpan cache dan repo publik rutin di-scrape. Simpan berkasnya di
luar repo, atau ubah repo jadi privat lebih dulu kalau memang perlu ikut.

## Berkas sumber

Rancangan aplikasi ini diturunkan dari
`ZEYTiN Daily Income & Expense Aug 2025.xlsx` (157 KB, 8 sheet). Berkasnya
tidak ikut di repo; ringkasan strukturnya ada di sini supaya rancangannya
tetap bisa ditelusuri tanpa membuka berkas aslinya.

| Sheet | Isi | Kolom |
|---|---|---|
| **Income** | 31 baris harian + rekap | Date · Petty cash · Cash · BNI · Grab Food · Go Food · Go Pay · Total Sales · Supplier Cash · Expense · Remaining Supplier Cash · Grand Income |
| **Expense** | Belanja tunai harian, ±1.030 baris | Date · Vendor · Items · Qty · Unit · Price · Disc · Tax · Total |
| **Supplier Transfer Payment** | Pembayaran transfer, ±1.050 baris | No · Date · Vendor · Items · Unit · Qty · Price · Total · Payment Method · Payment Status |
| **Outstanding INV** | Tagihan belum dibayar | Vendor · Date Order · Due Time · Items · … · Status |
| **Payroll** | Gaji per karyawan, dipisah Front Staff / Kitchen Staff | Nama · hari & jam kerja · day off · cuti · lembur · rate/jam · Basic Salary · Deduction BPJS · Grand Total |
| **Supplier Database** | ±400 pemasok | Nama · Kontak · Items · Harga · Qty · Bank · No. Rekening · A/n · Payment Method |
| **Salary Own** | Gaji pemilik | Aslan Salary July · Agust |
| **Undefined Payment** | Header saja, kosong | — |

### Yang membedakannya dari aplikasi kasir Kebap

Bukan sekadar "kasir tanpa POS" — ada empat hal yang tidak punya padanan di
sana, dan keempatnya memengaruhi bentuk tabelnya:

1. **Channel pemasukan ada enam**, bukan tiga: Petty cash, Cash, BNI,
   Grab Food, Go Food, Go Pay.
2. **Supplier Cash** — uang tunai yang dititipkan untuk belanja pemasok,
   dengan sisa harian (`Remaining Supplier Cash`) yang bisa minus.
3. **Penanda penalang ada di Payment Status**, isinya `PT KEBAP PAID` atau
   `ASLAN PAID`. Dari sinilah pembagian antar pemilik berasal.
4. **Payroll adalah modul tersendiri** — jam kerja, lembur, sisa cuti,
   potongan BPJS — bukan sekadar satu baris "gaji".

Tidak ada sheet pajak sama sekali, padahal pajak ada di daftar permintaan
awal klien.

### Dua kejanggalan di berkas aslinya

Dicatat apa adanya, bukan diam-diam dibetulkan — keduanya perlu dikonfirmasi
ke klien sebelum angkanya dipakai sebagai acuan:

- **Rekap atas dan bawah tidak cocok.** Blok ringkasan `O8:R9` menulis
  Grand Expense **500.000**, sedangkan baris total `K40` menulis Expense
  **42.654.578**.
- **Tanggalnya Agustus 2026, bukan 2025.** Serial Excel 46235–46265 =
  1–31 Agustus 2026, padahal nama berkasnya "Aug 2025" dan sheet Payroll
  menulis "1st – 31th September 2025".

## Menjalankan

```bash
composer install

cp .env.example .env
php artisan key:generate

mysql -u root -e "CREATE DATABASE zeytin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
php artisan migrate

php artisan filament:assets   # salin aset Filament ke public/ (PHP, bukan build)
php artisan serve
```

Zona waktunya **Asia/Makassar** (WITA), bukan Jakarta — usahanya di Bali.

## Yang masih perlu diputuskan

**Aplikasinya untuk mencatat, atau untuk menampilkan?**

- *Mencatat* — staf berhenti memakai Excel dan mengetik langsung di
  aplikasi. Perlu halaman input untuk tiap sheet, validasi, dan hak akses
  per peran.
- *Menampilkan* — staf tetap memakai Excel, berkasnya diunggah tiap bulan,
  dan aplikasi hanya mengolah serta menyajikan laporannya. Perlu pengimpor
  yang tahan terhadap perubahan bentuk berkas.

Jawabannya mengubah separuh rancangan, jadi belum ada tabel yang dibuat
sampai ini jelas.
