/*
 * Bentuk tiap jenis catatan, mengikuti kolom berkas Excel klien.
 *
 * Satu tempat untuk nama kolom, jenis isian, dan kolom mana yang tampil di
 * tabel. Formulir, tabel, pengimpor Excel, dan pengekspor semuanya membaca
 * dari sini — jadi menambah satu kolom cukup diubah sekali, dan keempatnya
 * tidak mungkin berbeda pendapat soal nama kolom.
 *
 * Jenis isian `combo` adalah kotak ketik biasa yang punya daftar saran:
 * isinya dari koleksi induk (`source`) digabung dengan nilai yang sudah
 * pernah dipakai di koleksi ini sendiri. Memilih satu saran ikut mengisi
 * kolom lain lewat `fills` — itu yang membuat pengisian jadi cepat.
 *
 * Kotak ketik, bukan daftar pilihan tertutup: nama barang di berkas klien
 * bebas ("Bayar gojek (Tepung)"), dan memaksanya masuk daftar tetap hanya
 * akan membuat orang berhenti mencatat.
 */

import { CHANNELS } from './config.js';
import { lineTotal } from './ledger.js';

export const SCHEMAS = {
    /* Sheet Income — satu baris per hari, id-nya tanggal itu sendiri,
       sehingga menyimpan tanggal yang sama mengganti, bukan menumpuk. */
    days: {
        key: 'days',
        tab: 'tab.income',
        idFrom: 'date',
        dateField: 'date',
        fields: [
            { name: 'date', type: 'date', label: 'f.date', required: true },
            ...CHANNELS.map((channel) => ({
                name: channel.key,
                type: 'money',
                label: channel.label,
                raw: true,
            })),
            { name: 'note', type: 'text', label: 'f.note' },
        ],
        columns: ['date', ...CHANNELS.map((c) => c.key), 'note'],
    },

    expenses: {
        key: 'expenses',
        tab: 'tab.expense',
        dateField: 'date',
        fields: [
            { name: 'date', type: 'date', label: 'f.date', required: true },
            { name: 'vendor', type: 'combo', label: 'f.vendor', source: 'suppliers' },
            { name: 'item', type: 'combo', label: 'f.item', required: true, source: 'products', fills: { unit: 'unit', price: 'price' } },
            { name: 'qty', type: 'number', label: 'f.qty', default: 1 },
            { name: 'unit', type: 'text', label: 'f.unit' },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'disc', type: 'money', label: 'f.disc' },
            { name: 'tax', type: 'money', label: 'f.tax' },
        ],
        // Rumus asli di berkas Excel: =((qty*price)+tax-disc)
        computed: (row) => ({ total: lineTotal(row) }),
        columns: ['date', 'vendor', 'item', 'qty', 'unit', 'price', 'total'],
    },

    transfers: {
        key: 'transfers',
        tab: 'tab.transfer',
        dateField: 'date',
        fields: [
            { name: 'date', type: 'date', label: 'f.date', required: true },
            { name: 'vendor', type: 'combo', label: 'f.vendor', source: 'suppliers', fills: { method: 'method' } },
            { name: 'item', type: 'combo', label: 'f.item', required: true, source: 'products', fills: { unit: 'unit', price: 'price' } },
            { name: 'unit', type: 'text', label: 'f.unit' },
            { name: 'qty', type: 'number', label: 'f.qty', default: 1 },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'method', type: 'combo', label: 'f.method', source: 'methods' },
            // Inilah penanda siapa yang menalangi. Di berkas aslinya lebih
            // dari separuh baris kosong, jadi "—" ikut jadi pilihan supaya
            // yang belum jelas tidak terpaksa ditebak.
            { name: 'status', type: 'select', label: 'f.status', options: ['PT KEBAP PAID', 'ASLAN PAID', '—'] },
        ],
        computed: (row) => ({ total: Math.round((Number(row.qty) || 0) * (Number(row.price) || 0)) }),
        columns: ['date', 'vendor', 'item', 'qty', 'price', 'total', 'method', 'status'],
    },

    payroll: {
        key: 'payroll',
        tab: 'tab.payroll',
        dateField: 'month',
        fields: [
            { name: 'month', type: 'month', label: 'f.month', required: true },
            { name: 'section', type: 'select', label: 'f.section', options: ['Front Staff', 'Kitchen Staff', 'Owner'] },
            { name: 'name', type: 'text', label: 'f.name', required: true },
            { name: 'basic', type: 'money', label: 'f.basic' },
            { name: 'bpjs', type: 'money', label: 'f.bpjs' },
        ],
        computed: (row) => ({
            grandTotal: Math.round((Number(row.basic) || 0) - (Number(row.bpjs) || 0)),
        }),
        columns: ['month', 'section', 'name', 'basic', 'bpjs', 'grandTotal'],
    },

    outstanding: {
        key: 'outstanding',
        tab: 'tab.outstanding',
        dateField: 'date',
        fields: [
            { name: 'date', type: 'date', label: 'f.date', required: true },
            { name: 'dueDate', type: 'date', label: 'f.dueDate' },
            { name: 'vendor', type: 'combo', label: 'f.vendor', source: 'suppliers' },
            { name: 'item', type: 'combo', label: 'f.item', required: true, source: 'products', fills: { price: 'price' } },
            { name: 'qty', type: 'number', label: 'f.qty', default: 1 },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'disc', type: 'money', label: 'f.disc' },
            { name: 'tax', type: 'money', label: 'f.tax' },
            { name: 'status', type: 'select', label: 'f.status', options: ['Need the payment', 'Waiting the payment', 'PAID'] },
        ],
        computed: (row) => ({ total: lineTotal(row) }),
        columns: ['date', 'dueDate', 'vendor', 'item', 'qty', 'price', 'total', 'status'],
    },

    /* ------------------------------------------------------ data induk */

    suppliers: {
        key: 'suppliers',
        tab: 'tab.suppliers',
        dateField: null,
        master: true,
        fields: [
            { name: 'name', type: 'text', label: 'f.name', required: true },
            { name: 'contact', type: 'text', label: 'f.contact' },
            { name: 'item', type: 'combo', label: 'f.item', source: 'products' },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'bank', type: 'text', label: 'f.bank' },
            { name: 'account', type: 'text', label: 'f.account' },
            { name: 'accountName', type: 'text', label: 'f.accountName' },
            { name: 'method', type: 'combo', label: 'f.method', source: 'methods' },
        ],
        columns: ['name', 'contact', 'item', 'price', 'bank', 'account', 'accountName', 'method'],
    },

    /*
     * Barang yang biasa dibelanjakan, beserta harga terakhirnya.
     *
     * Harga di sini cuma tawaran awal, bukan aturan: begitu dipilih di
     * formulir belanja, angkanya masih bisa ditimpa. Harga pemasok berubah
     * terus, dan formulir yang memaksakan harga lama akan membuat
     * catatannya salah dengan rapi.
     */
    products: {
        key: 'products',
        tab: 'tab.products',
        dateField: null,
        master: true,
        fields: [
            { name: 'name', type: 'text', label: 'f.item', required: true },
            { name: 'unit', type: 'text', label: 'f.unit' },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'vendor', type: 'combo', label: 'f.vendor', source: 'suppliers' },
            { name: 'note', type: 'text', label: 'f.note' },
        ],
        columns: ['name', 'unit', 'price', 'vendor', 'note'],
    },

    /*
     * Cara pembayaran. Di berkas Excel isinya diketik ulang tiap baris
     * ("Transfer", "COD", "Cash"), jadi ejaannya gampang berbeda-beda dan
     * pengelompokan laporannya ikut berantakan. Di sini didaftar sekali.
     */
    methods: {
        key: 'methods',
        tab: 'tab.methods',
        dateField: null,
        master: true,
        fields: [
            { name: 'name', type: 'text', label: 'f.method', required: true },
            { name: 'note', type: 'text', label: 'f.note' },
        ],
        columns: ['name', 'note'],
    },
};

/** Koleksi induk yang dipakai `combo` sebagai sumber saran. */
export const MASTERS = Object.keys(SCHEMAS).filter((key) => SCHEMAS[key].master);

/** Kolom uang, untuk memformat sel tabel dan ekspor. */
export const MONEY_FIELDS = new Set([
    'price', 'disc', 'tax', 'total', 'basic', 'bpjs', 'grandTotal',
    ...CHANNELS.map((c) => c.key),
]);

/** Judul kolom yang bukan kunci terjemahan — nama channel dan turunannya. */
export function columnLabel(schema, name) {
    const field = schema.fields.find((f) => f.name === name);

    if (field) {
        return field.raw ? field.label : null;
    }

    return null;
}

/**
 * Saran untuk satu kotak `combo`.
 *
 * Dua sumber digabung: koleksi induknya, dan nilai yang sudah pernah dipakai
 * di koleksi ini sendiri. Yang kedua penting — data hasil impor Excel tidak
 * pernah lewat halaman induk, jadi kalau hanya induknya yang dibaca, kotak
 * sarannya justru kosong di bulan-bulan pertama, saat paling dibutuhkan.
 */
export function comboOptions(field, masters = {}, rows = []) {
    const fromMaster = (masters[field.source] || []).map((row) => row.name);
    const fromRows = rows.map((row) => row[field.name]);

    const seen = new Map();

    for (const value of [...fromMaster, ...fromRows]) {
        const text = String(value ?? '').trim();

        if (text && !seen.has(text.toLowerCase())) {
            seen.set(text.toLowerCase(), text);
        }
    }

    return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Baris induk yang cocok dengan apa yang diketik, untuk mengisi kolom lain.
 *
 * Dicocokkan tanpa memandang huruf besar-kecil dan spasi di ujung, karena
 * yang mengetik manusia. Tidak ketemu berarti tidak ada yang diisi — bukan
 * menebak mana yang paling mirip.
 */
export function masterMatch(field, masters = {}, value) {
    const text = String(value ?? '').trim().toLowerCase();

    if (!text) {
        return null;
    }

    return (masters[field.source] || []).find(
        (row) => String(row.name ?? '').trim().toLowerCase() === text,
    ) || null;
}
