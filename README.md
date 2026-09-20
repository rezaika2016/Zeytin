# Zeytin — Financial Reporting

Aplikasi pelaporan keuangan untuk **ZEYTiN** (PT. Kebap and Meze House),
Koloni Bali — Jl. Raya Semat No.1, Canggu, Badung.

Menggantikan pembukuan Excel bulanan dengan laporan yang dihitung ulang dari
datanya sendiri, sambil **mempertahankan konsep pelaporan yang sudah
berlaku** di berkas Excel-nya.

> **Status: tahap diskusi.** Belum ada aplikasi yang dibangun. Yang ada di
> repo ini baru catatan rancangan.
>
> Rancangan dan temuannya ada di **[`docs/DISKUSI.md`](docs/DISKUSI.md)** —
> termasuk tiga kejanggalan pada rekap berkas Excel yang masih menunggu
> jawaban klien.

## Bentuknya

| | |
|---|---|
| Hosting | **GitHub Pages** (situs statis) |
| Basis data | **Firebase Firestore** |
| Masuk | **Google Sign-In**, tiga alamat yang diizinkan |
| Tampilan | Sidebar kiri bergaya Filament, ditulis sendiri — **bukan** Filament |
| Halaman | **Dashboard** · **Handler** (satu halaman untuk seluruh laporan) |
| Bahasa | **Inggris** sebagai bawaan, dengan opsi Indonesia |
| Ekspor | **PDF** (jsPDF) dan **Excel** (SheetJS) |
| Rentang laporan | Harian · Bulanan · Tahunan · Kustom |

**Tanpa Node/npm/Vite** — JavaScript biasa dengan pustaka dari CDN, sejalan
dengan proyek-proyek sebelumnya.

> Pernah dimulai sebagai Laravel 12 + Filament 5, lalu dibuang karena GitHub
> Pages tidak menjalankan PHP. Kodenya masih ada di commit `b5075de` kalau
> suatu saat diperlukan.

## Jangan commit berkas data klien

`.gitignore` mengunci `*.xlsx`, `*.xls`, dan `*.csv` di akar repo.
**Repo ini publik**, sedangkan berkas sumber dari klien berisi:

- nomor rekening bank dan nama pemilik rekening ±400 pemasok
- nomor HP narahubung tiap pemasok
- gaji tiap karyawan beserta potongan BPJS, lengkap dengan namanya
- gaji pemilik dan omzet bulanan

Sekali terbit ke repo publik, anggap data itu sudah tersebar permanen —
GitHub menyimpan cache dan repo publik rutin di-scrape. Datanya tinggal di
Firestore, bukan di repo.

Hal yang sama berlaku untuk aplikasinya: di situs statis, konfigurasi
Firebase terbaca siapa saja yang membuka halamannya. Yang menjaga datanya
hanya **Firestore Security Rules** dan daftar email yang diizinkan — bukan
menu yang disembunyikan. Jangan masukkan data asli sebelum aturan itu
terpasang.
