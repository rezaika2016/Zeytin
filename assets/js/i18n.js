/*
 * Dua bahasa: Inggris sebagai bawaan, Indonesia sebagai pilihan.
 *
 * Laporannya dibaca orang luar negeri, jadi Inggris yang menjadi acuan;
 * Indonesia untuk staf yang mengisi datanya. Pilihan bahasa disimpan di
 * peramban, bukan di basis data — ia menempel pada perangkat, bukan pada
 * data perusahaan.
 */

const DICT = {
    en: {
        'app.tagline': 'Turkish Kitchen · Canggu, Bali',
        'app.subtitle': 'Financial Reporting',

        'signin.eyebrow': 'Financial Reporting',
        'signin.headline': 'Every figure, traced back to its entry',
        'signin.sub': 'Daily takings, expenses, supplier transfers and payroll — recomputed on demand, exported in one click.',
        'signin.title': 'Sign in',
        'signin.intro': 'Use the Google account registered for this restaurant.',
        'signin.google': 'Continue with Google',
        'signin.denied': 'This Google account is not registered for Zeytin. Ask the owner to add it.',
        'signin.local': 'Firebase is not configured yet, so the app runs on this device only. Data stays in this browser — do not use it for real records.',
        'signin.localBtn': 'Open in local mode',

        'nav.group.main': 'Overview',
        'nav.group.reports': 'Reports',
        'nav.dashboard': 'Dashboard',
        'nav.handler': 'Handler',
        'nav.reports': 'Reports',

        'store.local': 'Local mode',
        'store.cloud': 'Firestore',

        // Dashboard
        'dash.title': 'Dashboard',
        'dash.global': 'Global balance',
        'dash.globalHint': 'Cash & bank + remaining supplier cash − unpaid invoices',
        'dash.sales': 'Total sales',
        'dash.cashless': 'Grand income (cashless)',
        'dash.cashExpense': 'Cash expenses',
        'dash.transfers': 'Supplier transfers',
        'dash.payroll': 'Payroll',
        'dash.profit': 'Net profit',
        'dash.supplierCash': 'Remaining supplier cash',
        'dash.outstanding': 'Unpaid invoices',
        'dash.byChannel': 'Balance by channel',
        'dash.channelCash': 'Cash',
        'dash.channelNonCash': 'Non-cash',
        'dash.recent': 'Recent days',
        'dash.period': 'This month so far',
        'dash.noData': 'Nothing recorded yet. Open Handler to add the first day.',

        // Handler
        'handler.title': 'Handler',
        'handler.intro': 'Everything is entered here — type it in, or upload the monthly Excel file.',
        'tab.income': 'Daily income',
        'tab.expense': 'Cash expenses',
        'tab.transfer': 'Supplier transfers',
        'tab.payroll': 'Payroll',
        'tab.suppliers': 'Suppliers',
        'tab.outstanding': 'Outstanding',
        'tab.products': 'Products',
        'tab.methods': 'Payment methods',
        'tab.import': 'Import Excel',

        'f.date': 'Date',
        'f.vendor': 'Vendor',
        'f.item': 'Item',
        'f.qty': 'Qty',
        'f.unit': 'Unit',
        'f.price': 'Price',
        'f.disc': 'Disc',
        'f.tax': 'Tax',
        'f.total': 'Total',
        'f.method': 'Method',
        'f.status': 'Status',
        'f.name': 'Name',
        'f.contact': 'Contact',
        'f.bank': 'Bank',
        'f.account': 'Account no.',
        'f.accountName': 'Account name',
        'f.section': 'Section',
        'f.month': 'Month',
        'f.basic': 'Basic salary',
        'f.bpjs': 'BPJS deduction',
        'f.grand': 'Grand total',
        'f.note': 'Note',
        'f.dueDate': 'Due date',

        'act.save': 'Save',
        'act.add': 'Add',
        'act.delete': 'Delete',
        'act.cancel': 'Cancel',
        'act.confirmDelete': 'Delete this entry?',
        'act.saved': 'Saved',
        'act.deleted': 'Deleted',
        'act.edit': 'Edit',
        'act.update': 'Save changes',
        'act.updated': 'Changes saved',
        'form.editing': 'Editing an existing row',
        'master.empty': 'Nothing here yet. Add the ones you use most — the daily forms will suggest them.',

        'import.intro': 'Upload the monthly workbook. Each sheet is read separately, and anything that does not match the expected shape is reported instead of guessed.',
        'import.pick': 'Choose .xlsx file',
        'import.run': 'Import',
        'import.reading': 'Reading workbook…',
        'import.done': 'Import finished',
        'import.nothing': 'Nothing was imported.',
        'import.sheetMissing': 'Sheet not found',
        'import.headerMissing': 'Header row not found — the sheet layout has changed',
        'import.rows': 'rows',
        'import.range': 'Dates found',
        'import.replaced': 'replaced',
        'import.willReplace': 'Rows with the same date and item replace the existing ones.',
        'tpl.download': 'Download template',
        'tpl.hint': 'No matching file yet? Download the template — it already carries the six sheets with the exact names and column titles the importer looks for.',
        'tpl.guideTab': 'Guide',
        'tpl.guideTitle': 'Zeytin — monthly workbook template',
        'tpl.guideSheet': '1. Do not rename the sheets. A sheet under another name is skipped.',
        'tpl.guideHeader': '2. Keep the header row. Column titles are how the importer finds each column, so their position may change but their wording may not.',
        'tpl.guideDate': '3. Dates are day first: 05/08/2026 means 5 August. A real Excel date works too.',
        'tpl.guideMoney': '4. Money and quantities: digits only — no "Rp" and no hand-typed thousands separator.',
        'tpl.guideMonth': '5. Payroll has no month column. Pick the month in the app before importing.',
        'tpl.guideExtra': '6. Extra columns are ignored. Rows without an item (or a name) are skipped.',
        'tpl.guideSheetList': 'Sheets and their columns:',

        // Reports
        'rep.title': 'Reports',
        'rep.daily': 'Daily',
        'rep.monthly': 'Monthly',
        'rep.yearly': 'Yearly',
        'rep.custom': 'Custom',
        'rep.from': 'From',
        'rep.to': 'To',
        'rep.period': 'Period',
        'rep.apply': 'Apply',
        'rep.pdf': 'Export PDF',
        'rep.excel': 'Download Excel',
        'rep.print': 'Print',
        'rep.summary': 'Summary',
        'rep.breakdown': 'Sales breakdown',
        'rep.expenses': 'Expenses',
        'rep.noData': 'Nothing recorded in this period.',
        'rep.grandTotal': 'Grand total',
        'rep.days': 'Days',
        'rep.avgPerDay': 'Average per day',
        'rep.generated': 'Generated',
        'rep.preparedBy': 'Prepared by',

        'preset.today': 'Today',
        'preset.yesterday': 'Yesterday',
        'preset.last7': 'Last 7 days',
        'preset.thisMonth': 'This month',
        'preset.lastMonth': 'Last month',
        'preset.thisYear': 'This year',
        'preset.lastYear': 'Last year',
    },

    id: {
        'app.tagline': 'Dapur Turki · Canggu, Bali',
        'app.subtitle': 'Laporan Keuangan',

        'signin.eyebrow': 'Laporan Keuangan',
        'signin.headline': 'Tiap angka bisa dilacak ke catatan asalnya',
        'signin.sub': 'Pemasukan harian, pengeluaran, transfer pemasok, dan gaji — dihitung ulang saat diminta, diekspor sekali klik.',
        'signin.title': 'Masuk',
        'signin.intro': 'Gunakan akun Google yang terdaftar untuk restoran ini.',
        'signin.google': 'Lanjutkan dengan Google',
        'signin.denied': 'Akun Google ini tidak terdaftar untuk Zeytin. Minta pemilik menambahkannya.',
        'signin.local': 'Firebase belum disiapkan, jadi aplikasi berjalan di perangkat ini saja. Datanya tersimpan di peramban — jangan dipakai untuk catatan sungguhan.',
        'signin.localBtn': 'Buka dalam mode lokal',

        'nav.group.main': 'Ringkasan',
        'nav.group.reports': 'Laporan',
        'nav.dashboard': 'Dasbor',
        'nav.handler': 'Handler',
        'nav.reports': 'Laporan',

        'store.local': 'Mode lokal',
        'store.cloud': 'Firestore',

        'dash.title': 'Dasbor',
        'dash.global': 'Saldo global',
        'dash.globalHint': 'Kas & bank + sisa titipan pemasok − tagihan belum dibayar',
        'dash.sales': 'Total penjualan',
        'dash.cashless': 'Pemasukan nontunai',
        'dash.cashExpense': 'Belanja tunai',
        'dash.transfers': 'Transfer pemasok',
        'dash.payroll': 'Gaji',
        'dash.profit': 'Laba bersih',
        'dash.supplierCash': 'Sisa titipan pemasok',
        'dash.outstanding': 'Tagihan belum dibayar',
        'dash.byChannel': 'Saldo per channel',
        'dash.channelCash': 'Tunai',
        'dash.channelNonCash': 'Non-tunai',
        'dash.recent': 'Hari terakhir',
        'dash.period': 'Bulan ini',
        'dash.noData': 'Belum ada yang tercatat. Buka Handler untuk mengisi hari pertama.',

        'handler.title': 'Handler',
        'handler.intro': 'Semua diisi di sini — diketik langsung, atau diunggah dari berkas Excel bulanan.',
        'tab.income': 'Pemasukan harian',
        'tab.expense': 'Belanja tunai',
        'tab.transfer': 'Transfer pemasok',
        'tab.payroll': 'Gaji',
        'tab.suppliers': 'Pemasok',
        'tab.outstanding': 'Tagihan',
        'tab.products': 'Barang',
        'tab.methods': 'Cara bayar',
        'tab.import': 'Impor Excel',

        'f.date': 'Tanggal',
        'f.vendor': 'Pemasok',
        'f.item': 'Barang',
        'f.qty': 'Jml',
        'f.unit': 'Satuan',
        'f.price': 'Harga',
        'f.disc': 'Diskon',
        'f.tax': 'Pajak',
        'f.total': 'Total',
        'f.method': 'Cara bayar',
        'f.status': 'Status',
        'f.name': 'Nama',
        'f.contact': 'Kontak',
        'f.bank': 'Bank',
        'f.account': 'No. rekening',
        'f.accountName': 'Atas nama',
        'f.section': 'Bagian',
        'f.month': 'Bulan',
        'f.basic': 'Gaji pokok',
        'f.bpjs': 'Potongan BPJS',
        'f.grand': 'Total diterima',
        'f.note': 'Catatan',
        'f.dueDate': 'Jatuh tempo',

        'act.save': 'Simpan',
        'act.add': 'Tambah',
        'act.delete': 'Hapus',
        'act.cancel': 'Batal',
        'act.confirmDelete': 'Hapus catatan ini?',
        'act.saved': 'Tersimpan',
        'act.deleted': 'Terhapus',
        'act.edit': 'Ubah',
        'act.update': 'Simpan perubahan',
        'act.updated': 'Perubahan tersimpan',
        'form.editing': 'Sedang mengubah baris yang ada',
        'master.empty': 'Masih kosong. Isi yang paling sering dipakai — formulir hariannya nanti menyarankan ini.',

        'import.intro': 'Unggah berkas bulanan. Tiap sheet dibaca terpisah, dan apa pun yang bentuknya tidak sesuai dilaporkan, bukan ditebak.',
        'import.pick': 'Pilih berkas .xlsx',
        'import.run': 'Impor',
        'import.reading': 'Membaca berkas…',
        'import.done': 'Impor selesai',
        'import.nothing': 'Tidak ada yang diimpor.',
        'import.sheetMissing': 'Sheet tidak ditemukan',
        'import.headerMissing': 'Baris header tidak ketemu — bentuk sheet-nya berubah',
        'import.rows': 'baris',
        'import.range': 'Tanggal yang terbaca',
        'import.replaced': 'diganti',
        'import.willReplace': 'Baris dengan tanggal dan barang yang sama akan menggantikan yang lama.',
        'tpl.download': 'Unduh template',
        'tpl.hint': 'Belum punya berkas yang cocok? Unduh templatenya — isinya sudah keenam sheet dengan nama dan judul kolom persis seperti yang dicari pengimpor.',
        'tpl.guideTab': 'Petunjuk',
        'tpl.guideTitle': 'Zeytin — template berkas bulanan',
        'tpl.guideSheet': '1. Jangan mengganti nama sheet. Sheet bernama lain akan dilewati.',
        'tpl.guideHeader': '2. Jangan hapus baris judul kolom. Judul itulah yang dipakai mencari tiap kolom, jadi posisinya boleh bergeser tapi tulisannya jangan diubah.',
        'tpl.guideDate': '3. Tanggal ditulis hari dulu: 05/08/2026 berarti 5 Agustus. Format tanggal Excel juga bisa.',
        'tpl.guideMoney': '4. Uang dan jumlah: angka saja — tanpa "Rp" dan tanpa titik ribuan yang diketik tangan.',
        'tpl.guideMonth': '5. Payroll tidak punya kolom bulan. Pilih bulannya di aplikasi sebelum mengimpor.',
        'tpl.guideExtra': '6. Kolom tambahan boleh ada, akan diabaikan. Baris tanpa barang (atau tanpa nama) dilewati.',
        'tpl.guideSheetList': 'Daftar sheet dan kolomnya:',

        'rep.title': 'Laporan',
        'rep.daily': 'Harian',
        'rep.monthly': 'Bulanan',
        'rep.yearly': 'Tahunan',
        'rep.custom': 'Kustom',
        'rep.from': 'Dari',
        'rep.to': 'Sampai',
        'rep.period': 'Periode',
        'rep.apply': 'Terapkan',
        'rep.pdf': 'Ekspor PDF',
        'rep.excel': 'Unduh Excel',
        'rep.print': 'Cetak',
        'rep.summary': 'Ringkasan',
        'rep.breakdown': 'Rincian penjualan',
        'rep.expenses': 'Pengeluaran',
        'rep.noData': 'Belum ada yang tercatat di periode ini.',
        'rep.grandTotal': 'Total keseluruhan',
        'rep.days': 'Hari',
        'rep.avgPerDay': 'Rata-rata per hari',
        'rep.generated': 'Dibuat',
        'rep.preparedBy': 'Disusun oleh',

        'preset.today': 'Hari ini',
        'preset.yesterday': 'Kemarin',
        'preset.last7': '7 hari terakhir',
        'preset.thisMonth': 'Bulan ini',
        'preset.lastMonth': 'Bulan lalu',
        'preset.thisYear': 'Tahun ini',
        'preset.lastYear': 'Tahun lalu',
    },
};

/**
 * Dibuka untuk diuji: tests.html memeriksa tiap kunci Inggris punya
 * terjemahan Indonesianya. Kunci yang belum diterjemahkan tidak akan
 * kelihatan saat dipakai — ia diam-diam jatuh ke bahasa Inggris — jadi
 * satu-satunya cara menangkapnya adalah membandingkan kedua kamus.
 */
export const DICTIONARIES = DICT;

const STORAGE_KEY = 'zeytin.lang';

let current = 'en';

try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved && DICT[saved]) {
        current = saved;
    }
} catch {
    // Peramban dengan penyimpanan diblokir tetap harus bisa dipakai;
    // bahasanya kembali ke bawaan.
}

export function lang() {
    return current;
}

export function setLang(next) {
    if (!DICT[next]) {
        return;
    }

    current = next;

    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        // abaikan
    }

    document.documentElement.lang = next;
    applyStatic();
    window.dispatchEvent(new CustomEvent('lang:changed', { detail: next }));
}

export function toggleLang() {
    setLang(current === 'en' ? 'id' : 'en');
}

/** Terjemahan satu kunci. Kunci yang belum ada dikembalikan apa adanya. */
export function t(key, fallback = '') {
    return DICT[current][key] ?? DICT.en[key] ?? fallback ?? key;
}

/** Mengisi ulang elemen ber-atribut data-i18n di HTML statis. */
export function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        const key = node.getAttribute('data-i18n');
        const value = t(key, '');

        if (value) {
            node.textContent = value;
        }
    });

    document.querySelectorAll('[data-lang]').forEach((node) => {
        node.classList.toggle('is-active', node.getAttribute('data-lang') === current);
    });
}
