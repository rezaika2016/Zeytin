/*
 * Bentuk tiap jenis catatan, mengikuti kolom berkas Excel klien.
 *
 * Satu tempat untuk nama kolom, jenis isian, dan kolom mana yang tampil di
 * tabel. Formulir, tabel, pengimpor Excel, dan pengekspor semuanya membaca
 * dari sini — jadi menambah satu kolom cukup diubah sekali, dan keempatnya
 * tidak mungkin berbeda pendapat soal nama kolom.
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
            { name: 'vendor', type: 'text', label: 'f.vendor' },
            { name: 'item', type: 'text', label: 'f.item', required: true },
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
            { name: 'vendor', type: 'text', label: 'f.vendor' },
            { name: 'item', type: 'text', label: 'f.item', required: true },
            { name: 'unit', type: 'text', label: 'f.unit' },
            { name: 'qty', type: 'number', label: 'f.qty', default: 1 },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'method', type: 'select', label: 'f.method', options: ['Transfer', 'COD', 'Cash'] },
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

    suppliers: {
        key: 'suppliers',
        tab: 'tab.suppliers',
        dateField: null,
        fields: [
            { name: 'name', type: 'text', label: 'f.name', required: true },
            { name: 'contact', type: 'text', label: 'f.contact' },
            { name: 'item', type: 'text', label: 'f.item' },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'bank', type: 'text', label: 'f.bank' },
            { name: 'account', type: 'text', label: 'f.account' },
            { name: 'accountName', type: 'text', label: 'f.accountName' },
            { name: 'method', type: 'select', label: 'f.method', options: ['COD', 'Transfer'] },
        ],
        columns: ['name', 'contact', 'item', 'price', 'bank', 'account', 'accountName', 'method'],
    },

    outstanding: {
        key: 'outstanding',
        tab: 'tab.outstanding',
        dateField: 'date',
        fields: [
            { name: 'date', type: 'date', label: 'f.date', required: true },
            { name: 'dueDate', type: 'date', label: 'f.dueDate' },
            { name: 'vendor', type: 'text', label: 'f.vendor' },
            { name: 'item', type: 'text', label: 'f.item', required: true },
            { name: 'qty', type: 'number', label: 'f.qty', default: 1 },
            { name: 'price', type: 'money', label: 'f.price' },
            { name: 'disc', type: 'money', label: 'f.disc' },
            { name: 'tax', type: 'money', label: 'f.tax' },
            { name: 'status', type: 'select', label: 'f.status', options: ['Need the payment', 'Waiting the payment', 'PAID'] },
        ],
        computed: (row) => ({ total: lineTotal(row) }),
        columns: ['date', 'dueDate', 'vendor', 'item', 'qty', 'price', 'total', 'status'],
    },
};

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
