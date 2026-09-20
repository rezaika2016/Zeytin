/*
 * Ekspor laporan ke PDF dan Excel.
 *
 * Keduanya dibuat dari baris yang sedang tampil di layar, bukan dihitung
 * ulang dengan cara lain. Berkas yang dikirim ke bos karena itu tidak
 * mungkin berbeda dari yang dilihat stafnya — kalau angkanya dihitung dua
 * kali dengan dua jalur, cepat atau lambat keduanya akan berselisih.
 *
 * Pustakanya diambil dari CDN saat tombolnya ditekan, bukan saat halaman
 * dibuka: keduanya berat, dan sebagian besar kunjungan tidak mengekspor
 * apa pun.
 */

import { business, CHANNELS } from './config.js';
import { t } from './i18n.js';
import { money, num, formatDate } from './util.js';

const JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';
const AUTOTABLE = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/+esm';
const SHEETJS = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm';

const OLIVE = [77, 124, 15];
const INK = [15, 23, 42];

function fileName(ctx, ext) {
    return `Zeytin-${ctx.mode}-${ctx.report.from}_${ctx.report.to}.${ext}`;
}

/* ---------------------------------------------------------------- PDF */

export async function exportPdf(ctx) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import(/* @vite-ignore */ JSPDF),
        import(/* @vite-ignore */ AUTOTABLE),
    ]);

    const autoTable = autoTableModule.default || autoTableModule.autoTable;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const { report, rows } = ctx;
    const width = doc.internal.pageSize.getWidth();

    /* ---- kepala surat ---- */

    doc.setFillColor(...OLIVE);
    doc.rect(0, 0, width, 64, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(business.name, 40, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${business.legalName} — ${business.address}`, 40, 46);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle(ctx), width - 40, 30, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${formatDate(report.from)} — ${formatDate(report.to)}`, width - 40, 46, { align: 'right' });

    /* ---- ringkasan ---- */

    doc.setTextColor(...INK);

    const summary = [
        [t('dash.sales'), money(report.totalSales)],
        [t('dash.cashExpense'), money(report.cashExpense)],
        [t('dash.transfers'), money(report.transfers)],
        [t('dash.payroll'), money(report.payroll)],
        [t('dash.profit'), money(report.netProfit)],
        [t('dash.global'), money(report.globalBalance)],
    ];

    autoTable(doc, {
        startY: 84,
        head: [[t('rep.summary'), '']],
        body: summary,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fontStyle: 'bold', textColor: OLIVE, fontSize: 11 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        tableWidth: 300,
    });

    /* ---- rincian ---- */

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [[
            t('rep.period'),
            ...CHANNELS.map((c) => c.label),
            t('dash.sales'),
            t('dash.cashExpense'),
        ]],
        body: rows.map((row) => [
            row.label,
            ...CHANNELS.map((c) => num(row[c.key])),
            num(row.totalSales),
            num(row.expense),
        ]),
        foot: [[
            t('rep.grandTotal'),
            ...CHANNELS.map((c) => num(report.byChannel[c.key])),
            num(report.totalSales),
            num(report.cashExpense),
        ]],
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 3, halign: 'right' },
        headStyles: { fillColor: OLIVE, textColor: 255, halign: 'right', fontSize: 8 },
        footStyles: { fillColor: [241, 245, 249], textColor: INK, fontStyle: 'bold', halign: 'right' },
        columnStyles: { 0: { halign: 'left', cellWidth: 110 } },
        margin: { left: 40, right: 40 },

        // Catatan kaki di tiap halaman: angka tanpa keterangan asalnya sulit
        // dipercaya, apalagi setelah dicetak dan berpindah tangan.
        didDrawPage: () => {
            const height = doc.internal.pageSize.getHeight();
            doc.setFontSize(7);
            doc.setTextColor(120);
            doc.text(
                `${t('rep.generated')}: ${new Date().toLocaleString('en-GB')} · ${business.name}`,
                40, height - 20,
            );
            doc.text(
                `${doc.internal.getNumberOfPages()}`,
                width - 40, height - 20, { align: 'right' },
            );
        },
    });

    doc.save(fileName(ctx, 'pdf'));
}

function reportTitle(ctx) {
    return `${t(`rep.${ctx.mode}`)} ${t('rep.title')}`;
}

/* -------------------------------------------------------------- Excel */

export async function exportExcel(ctx) {
    const XLSX = await import(/* @vite-ignore */ SHEETJS);
    const { report, rows, data } = ctx;
    const book = XLSX.utils.book_new();

    /* Ringkasan */
    const summary = [
        [business.name, ''],
        [business.legalName, ''],
        [t('rep.period'), `${report.from} — ${report.to}`],
        [t('rep.generated'), new Date().toISOString().slice(0, 19).replace('T', ' ')],
        ['', ''],
        [t('dash.sales'), report.totalSales],
        [t('dash.cashless'), report.cashless],
        [t('dash.cashExpense'), report.cashExpense],
        [t('dash.transfers'), report.transfers],
        [t('dash.payroll'), report.payroll],
        [t('dash.profit'), report.netProfit],
        [t('dash.supplierCash'), report.remainingSupplierCash],
        [t('dash.outstanding'), report.outstanding],
        [t('dash.global'), report.globalBalance],
    ];

    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(summary), 'Summary');

    /* Rincian per periode */
    const breakdown = [
        [t('rep.period'), ...CHANNELS.map((c) => c.label), t('dash.sales'), t('dash.cashExpense')],
        ...rows.map((row) => [row.label, ...CHANNELS.map((c) => row[c.key]), row.totalSales, row.expense]),
        [t('rep.grandTotal'), ...CHANNELS.map((c) => report.byChannel[c.key]), report.totalSales, report.cashExpense],
    ];

    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(breakdown), 'Breakdown');

    /* Catatan mentah, supaya tiap angka di atas bisa ditelusuri asalnya */
    appendRaw(XLSX, book, 'Expenses', data.expenses, ['date', 'vendor', 'item', 'qty', 'unit', 'price', 'disc', 'tax', 'total']);
    appendRaw(XLSX, book, 'Transfers', data.transfers, ['date', 'vendor', 'item', 'qty', 'price', 'total', 'method', 'status']);
    appendRaw(XLSX, book, 'Payroll', data.payroll, ['month', 'section', 'name', 'basic', 'bpjs', 'grandTotal']);
    appendRaw(XLSX, book, 'Outstanding', data.outstanding, ['date', 'dueDate', 'vendor', 'item', 'qty', 'price', 'total', 'status']);

    XLSX.writeFile(book, fileName(ctx, 'xlsx'));
}

function appendRaw(XLSX, book, name, rows, columns) {
    if (!rows || !rows.length) {
        return;
    }

    const aoa = [columns, ...rows.map((row) => columns.map((c) => row[c] ?? ''))];

    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(aoa), name);
}
