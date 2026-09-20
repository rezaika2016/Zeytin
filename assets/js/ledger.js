/*
 * Sumber tunggal seluruh angka laporan.
 *
 * Tidak ada saldo yang disimpan. Semua dihitung ulang dari catatan harian,
 * belanja, transfer, gaji, dan tagihan setiap kali diminta. Saldo yang
 * disimpan terpisah bisa menyimpang dari catatannya, dan itu jenis galat
 * yang paling sulit dilacak di pembukuan.
 *
 * ── Konsep yang dipertahankan dari berkas Excel klien ──
 *
 *   Total Sales             = SUM(D:H)  → cash + bni + grabFood + goFood + goPay
 *                             (petty cash TIDAK ikut; rumus aslinya memang
 *                             mulai dari kolom D dan melewati C)
 *   Supplier Cash           = 456560 + cash
 *   Remaining Supplier Cash = Supplier Cash − belanja tunai hari itu
 *   Grand Income (cashless) = Total Sales − cash
 *
 * ── Tiga hal yang sengaja DIPERBAIKI, atas persetujuan klien ──
 *
 *   1. Grand Expense di berkas aslinya menunjuk satu baris belanja
 *      (Expense!J80 = 500.000), bukan totalnya. Di sini dijumlahkan penuh.
 *   2. Transfer ke pemasok (157.986.252) tidak pernah ikut hitungan laba
 *      di berkas aslinya. Di sini ikut sebagai pengeluaran.
 *   3. Belanja harian di berkas aslinya menunjuk rentang baris yang diketik
 *      tangan, sehingga ada baris yang terlewat (217.490). Di sini
 *      pengelompokannya berdasarkan tanggal, jadi tidak ada yang bisa luput.
 *
 * Rinciannya di docs/DISKUSI.md.
 */

import { CHANNELS, SUPPLIER_CASH_OPENING } from './config.js';
import { eachDate, monthKey, yearKey } from './util.js';

const SALES_CHANNELS = CHANNELS.filter((c) => c.inSales).map((c) => c.key);

const int = (value) => Math.round(Number(value) || 0);

/* ------------------------------------------------------------ satu hari */

/**
 * Angka satu hari, mengikuti definisi kolom di berkas Excel.
 *
 * @param {object} day    baris pemasukan harian (boleh kosong)
 * @param {number} spent  belanja tunai hari itu
 */
export function dayFigures(day = {}, spent = 0) {
    const channels = {};

    for (const channel of CHANNELS) {
        channels[channel.key] = int(day[channel.key]);
    }

    const totalSales = SALES_CHANNELS.reduce((sum, key) => sum + channels[key], 0);
    const supplierCash = SUPPLIER_CASH_OPENING + channels.cash;

    return {
        date: day.date || '',
        ...channels,
        totalSales,
        cashless: totalSales - channels.cash,
        supplierCash,
        expense: int(spent),
        remainingSupplierCash: supplierCash - int(spent),
    };
}

/* --------------------------------------------------------- satu periode */

/**
 * Seluruh angka untuk satu rentang tanggal.
 *
 * @param {object} data {days, expenses, transfers, payroll, outstanding}
 * @param {string} from YYYY-MM-DD
 * @param {string} to   YYYY-MM-DD
 */
export function periodReport(data, from, to) {
    const days = indexBy(data.days || [], 'date');
    const spentByDate = sumBy(data.expenses || [], 'date', 'total');

    const rows = eachDate(from, to).map((date) => dayFigures(
        { ...(days[date] || {}), date },
        spentByDate[date] || 0,
    ));

    const totals = blankTotals();

    for (const row of rows) {
        for (const key of Object.keys(totals)) {
            totals[key] += row[key] || 0;
        }
    }

    // Sisa titipan pemasok bukan angka yang boleh dijumlahkan antar hari —
    // yang bermakna adalah keadaan hari terakhir yang benar-benar tercatat.
    const lastRecorded = [...rows].reverse().find((row) => row.totalSales > 0 || row.expense > 0);
    totals.remainingSupplierCash = lastRecorded ? lastRecorded.remainingSupplierCash : 0;

    const transfers = sumField(data.transfers || [], 'total');
    const payroll = sumField(data.payroll || [], 'grandTotal');
    const outstanding = sumField(
        (data.outstanding || []).filter((row) => !isSettled(row.status)),
        'total',
    );

    const totalExpenses = totals.expense + transfers + payroll;

    return {
        from,
        to,
        rows,
        days: rows.length,
        recordedDays: rows.filter((row) => row.totalSales > 0).length,

        totalSales: totals.totalSales,
        cashless: totals.cashless,
        byChannel: Object.fromEntries(CHANNELS.map((c) => [c.key, totals[c.key]])),

        cashExpense: totals.expense,
        transfers,
        payroll,
        totalExpenses,

        remainingSupplierCash: totals.remainingSupplierCash,
        outstanding,

        netProfit: totals.totalSales - totalExpenses,
        averagePerDay: rows.length ? Math.round(totals.totalSales / rows.length) : 0,

        /*
         * Saldo global.
         *
         * Uang yang benar-benar dipegang usaha: seluruh pemasukan dikurangi
         * yang sudah dibayarkan, ditambah sisa titipan belanja pemasok,
         * dikurangi tagihan yang sudah jatuh tapi belum dibayar.
         *
         * Rumus ini dipakai di dasbor, laporan PDF, dan unduhan Excel —
         * satu definisi, satu tempat. Kalau angka yang sama dihitung
         * berbeda di tiga tempat, yang rusak kepercayaannya, bukan sekadar
         * angkanya.
         */
        globalBalance: totals.totalSales - totalExpenses
            + totals.remainingSupplierCash - outstanding,
    };
}

function blankTotals() {
    const totals = { totalSales: 0, cashless: 0, expense: 0, supplierCash: 0, remainingSupplierCash: 0 };

    for (const channel of CHANNELS) {
        totals[channel.key] = 0;
    }

    return totals;
}

/* ------------------------------------------------- pengelompokan periode */

/** Baris harian digulung ke bulan. Bulan tanpa catatan tidak ditampilkan. */
export function groupByMonth(rows) {
    return rollUp(rows, (row) => monthKey(row.date));
}

export function groupByYear(rows) {
    return rollUp(rows, (row) => yearKey(row.date));
}

function rollUp(rows, keyOf) {
    const buckets = new Map();

    for (const row of rows) {
        if (!row.date) {
            continue;
        }

        const key = keyOf(row);

        if (!buckets.has(key)) {
            buckets.set(key, { key, days: 0, recordedDays: 0, ...blankTotals() });
        }

        const bucket = buckets.get(key);
        bucket.days += 1;

        if (row.totalSales > 0) {
            bucket.recordedDays += 1;
        }

        for (const field of Object.keys(blankTotals())) {
            bucket[field] += row[field] || 0;
        }

        // Sama seperti di periodReport: sisa titipan adalah keadaan
        // terakhir, bukan jumlah antar hari.
        if (row.totalSales > 0 || row.expense > 0) {
            bucket.remainingSupplierCash = row.remainingSupplierCash;
        }
    }

    return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/* -------------------------------------------------------------- pembantu */

/** Status tagihan yang dianggap sudah beres, apa pun ejaannya. */
export function isSettled(status) {
    const value = String(status || '').toLowerCase();

    return value.includes('paid') || value.includes('lunas') || value.includes('settled');
}

function indexBy(rows, key) {
    return Object.fromEntries(rows.map((row) => [row[key], row]));
}

function sumBy(rows, key, field) {
    const out = {};

    for (const row of rows) {
        const k = row[key];

        if (!k) {
            continue;
        }

        out[k] = (out[k] || 0) + int(row[field]);
    }

    return out;
}

export function sumField(rows, field) {
    return (rows || []).reduce((sum, row) => sum + int(row[field]), 0);
}

/**
 * Total satu baris belanja, mengikuti rumus asli di berkas Excel:
 * `=((qty * price) + tax - disc)`.
 */
export function lineTotal({ qty, price, tax, disc }) {
    return int(qty || 0) * int(price || 0) + int(tax || 0) - int(disc || 0);
}
