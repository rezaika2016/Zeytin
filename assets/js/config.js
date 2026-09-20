/*
 * Konfigurasi aplikasi.
 *
 * Nilai Firebase di bawah BUKAN rahasia — di situs statis, apa pun yang
 * dikirim ke peramban bisa dibaca siapa saja yang membuka halamannya. Itu
 * memang cara kerja Firebase. Yang menjaga datanya adalah firestore.rules
 * beserta daftar ALLOWED_EMAILS, bukan penyembunyian konfigurasi ini.
 *
 * Selama firebase.apiKey masih kosong, aplikasi berjalan dalam mode lokal:
 * datanya disimpan di peramban ini saja. Berguna untuk mencoba tampilan
 * sebelum Firebase disiapkan, tapi JANGAN dipakai untuk data sungguhan —
 * membersihkan data situs berarti seluruh catatan hilang.
 */

export const firebase = {
    apiKey: 'AIzaSyAEKLT-nzn8p0ogO4sR1X2H15GiwlMFutE',
    authDomain: 'zeytin-report.firebaseapp.com',
    projectId: 'zeytin-report',
    storageBucket: 'zeytin-report.firebasestorage.app',
    messagingSenderId: '789730265813',
    appId: '1:789730265813:web:7ce5d044a54dc7323bf05c',
};

/**
 * Hanya alamat inilah yang boleh masuk.
 *
 * Daftar ini menyembunyikan tombol dan menutup tampilan, tapi yang
 * benar-benar menolak adalah firestore.rules di sisi server. Keduanya harus
 * berisi daftar yang sama — kalau berbeda, yang berlaku tetap aturan
 * Firestore, dan orangnya akan masuk ke aplikasi yang tidak memuat apa pun.
 */
export const ALLOWED_EMAILS = [
    'zeytin.canggu@gmail.com',
    'anatolia.kilic@gmail.com',
    'elzamcuan@gmail.com',
    'editor.mpi.semangat@gmail.com',
];

export const business = {
    name: 'ZEYTiN',
    legalName: 'PT. Kebap and Meze House',
    address: 'Koloni Bali, Jl. Raya Semat No.1, Canggu, Badung, Bali 80361',
    currency: 'IDR',
    locale: 'id-ID',
    timeZone: 'Asia/Makassar',
};

/**
 * Channel pemasukan, urutannya sama dengan kolom di berkas Excel.
 *
 * `inSales` menandai channel yang ikut Total Sales. Petty cash sengaja
 * tidak ikut karena rumus aslinya `=SUM(D:H)` dimulai dari kolom D dan
 * melewati C. Perilaku itu dipertahankan; lihat docs/DISKUSI.md.
 */
export const CHANNELS = [
    { key: 'pettyCash', label: 'Petty cash', inSales: false },
    { key: 'cash', label: 'Cash', inSales: true, isCash: true },
    { key: 'bni', label: 'BNI', inSales: true },
    { key: 'grabFood', label: 'Grab Food', inSales: true },
    { key: 'goFood', label: 'Go Food', inSales: true },
    { key: 'goPay', label: 'Go Pay', inSales: true },
];

/**
 * Saldo awal titipan belanja pemasok.
 *
 * Di berkas Excel, angka ini diketik langsung di tiap baris sebagai
 * `=456560+D8`. Di sini dijadikan satu pengaturan supaya bisa diubah di
 * satu tempat, bukan di ratusan baris.
 */
export const SUPPLIER_CASH_OPENING = 456560;
