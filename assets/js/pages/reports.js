/*
 * Laporan — harian, bulanan, tahunan, dan rentang bebas.
 *
 * Keempatnya menjumlahkan baris harian yang sama dari App ledger, lalu
 * digulung ke periode yang diminta. Karena itu laporan bulanan tidak
 * mungkin berbeda dari laporan harian untuk rentang yang sama — keduanya
 * menjumlahkan baris yang persis sama.
 *
 * Pembacanya orang luar negeri, jadi tampilannya dibuat rapi dan tenang:
 * ringkasan di atas, rincian di bawah, dan tombol ekspor yang menghasilkan
 * berkas dengan angka yang sama persis dengan yang terlihat di layar.
 */

import { CHANNELS } from '../config.js';
import { loadPeriod } from '../data.js';
import { groupByMonth, groupByYear } from '../ledger.js';
import { t, lang } from '../i18n.js';
import { el, money, formatDate, formatMonth, presetRange } from '../util.js';
import { exportPdf, exportExcel } from '../exports.js';

const MODES = ['daily', 'monthly', 'yearly', 'custom'];

let mode = 'daily';
let range = presetRange('thisMonth');
let last = null;

export async function renderReports(host) {
    host.replaceChildren(el('div', { class: 'loader', text: '…' }));

    const { data, report } = await loadPeriod(range.from, range.to);
    const locale = lang();
    const rows = periodRows(report, locale);

    last = { report, rows, data, mode, locale };

    host.replaceChildren(
        toolbar(host),
        summary(report),
        el('div', { class: 'grid', style: 'margin-top:1rem' }, [
            breakdownCard(rows, report, locale),
            expensesCard(report),
        ]),
    );
}

/* ------------------------------------------------------- baris periode */

function periodRows(report, locale) {
    if (mode === 'monthly') {
        return groupByMonth(report.rows).map((row) => ({ ...row, label: formatMonth(row.key, locale) }));
    }

    if (mode === 'yearly') {
        return groupByYear(report.rows).map((row) => ({ ...row, label: row.key }));
    }

    // Harian dan kustom sama-sama per hari; bedanya cuma cara memilih
    // rentangnya. Hari kosong dibuang di sini supaya laporan yang dikirim
    // ke bos tidak penuh baris nol.
    return report.rows
        .filter((row) => row.totalSales > 0 || row.expense > 0)
        .map((row) => ({ ...row, key: row.date, label: formatDate(row.date, locale) }));
}

/* ------------------------------------------------------------ kontrol */

function toolbar(host) {
    const presets = ['today', 'last7', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'];

    const from = el('input', {
        type: 'date',
        value: range.from,
        onchange: (e) => { range.from = e.target.value; renderReports(host); },
    });

    const to = el('input', {
        type: 'date',
        value: range.to,
        onchange: (e) => { range.to = e.target.value; renderReports(host); },
    });

    return el('div', { class: 'toolbar' }, [
        el('div', { style: 'display:flex;gap:.25rem' }, MODES.map((m) => el('button', {
            type: 'button',
            class: `chip ${mode === m ? 'is-active' : ''}`,
            onclick: () => { mode = m; renderReports(host); },
        }, t(`rep.${m}`)))),

        el('label', { class: 'field' }, [el('span', { text: t('rep.from') }), from]),
        el('label', { class: 'field' }, [el('span', { text: t('rep.to') }), to]),

        el('span', { class: 'spacer' }),

        ...(mode === 'custom' ? [] : presets.map((preset) => el('button', {
            type: 'button',
            class: 'chip',
            onclick: () => { range = presetRange(preset); renderReports(host); },
        }, t(`preset.${preset}`)))),

        el('button', {
            type: 'button',
            class: 'btn btn--ghost btn--sm',
            onclick: () => last && exportExcel(last),
        }, t('rep.excel')),

        el('button', {
            type: 'button',
            class: 'btn btn--sm',
            onclick: () => last && exportPdf(last),
        }, t('rep.pdf')),
    ]);
}

/* ----------------------------------------------------------- ringkasan */

function summary(report) {
    const items = [
        [t('dash.sales'), money(report.totalSales), ''],
        [t('dash.cashless'), money(report.cashless), ''],
        [t('dash.cashExpense'), money(report.cashExpense), ''],
        [t('dash.transfers'), money(report.transfers), ''],
        [t('dash.payroll'), money(report.payroll), ''],
        [t('dash.profit'), money(report.netProfit), report.netProfit < 0 ? 'neg' : 'pos'],
    ];

    return el('div', { class: 'grid grid--stats' }, [
        el('div', { class: 'stat stat--hero' }, [
            el('div', { class: 'stat__label', text: t('dash.global') }),
            el('div', {
                class: `stat__value ${report.globalBalance < 0 ? 'neg' : ''}`,
                text: money(report.globalBalance),
            }),
            el('div', { class: 'stat__hint', text: t('dash.globalHint') }),
        ]),
        ...items.map(([label, value, tone]) => el('div', { class: 'stat' }, [
            el('div', { class: 'stat__label', text: label }),
            el('div', { class: `stat__value ${tone}`, text: value }),
        ])),
    ]);
}

/* -------------------------------------------------------------- tabel */

function breakdownCard(rows, report, locale) {
    if (!rows.length) {
        return el('div', { class: 'card' }, [el('p', { class: 'empty', text: t('rep.noData') })]);
    }

    const head = el('tr', {}, [
        el('th', {}, t('rep.period')),
        ...CHANNELS.map((c) => el('th', { class: 'num' }, c.label)),
        el('th', { class: 'num' }, t('dash.sales')),
        el('th', { class: 'num' }, t('dash.cashExpense')),
    ]);

    const body = rows.map((row) => el('tr', {}, [
        el('td', { text: row.label }),
        ...CHANNELS.map((c) => el('td', { class: 'num', text: money(row[c.key]) })),
        el('td', { class: 'num', text: money(row.totalSales) }),
        el('td', { class: 'num', text: money(row.expense) }),
    ]));

    const foot = el('tr', {}, [
        el('td', { text: t('rep.grandTotal') }),
        ...CHANNELS.map((c) => el('td', { class: 'num', text: money(report.byChannel[c.key]) })),
        el('td', { class: 'num', text: money(report.totalSales) }),
        el('td', { class: 'num', text: money(report.cashExpense) }),
    ]);

    return el('div', { class: 'card' }, [
        el('div', { class: 'card__head' }, [
            el('h2', { text: t('rep.breakdown') }),
            el('span', { class: 'spacer' }),
            el('span', { class: 'muted', style: 'font-size:.75rem' },
                `${t('rep.avgPerDay')}: ${money(report.averagePerDay)}`),
        ]),
        el('div', { class: 'table-wrap' }, [
            el('table', { class: 'data' }, [
                el('thead', {}, [head]),
                el('tbody', {}, body),
                el('tfoot', {}, [foot]),
            ]),
        ]),
    ]);
}

function expensesCard(report) {
    const rows = [
        [t('dash.cashExpense'), report.cashExpense],
        [t('dash.transfers'), report.transfers],
        [t('dash.payroll'), report.payroll],
    ];

    return el('div', { class: 'card' }, [
        el('div', { class: 'card__head' }, [el('h2', { text: t('rep.expenses') })]),
        el('div', { class: 'table-wrap' }, [
            el('table', { class: 'data' }, [
                el('tbody', {}, rows.map(([label, value]) => el('tr', {}, [
                    el('td', { text: label }),
                    el('td', { class: 'num', text: money(value) }),
                ]))),
                el('tfoot', {}, [
                    el('tr', {}, [
                        el('td', { text: t('rep.grandTotal') }),
                        el('td', { class: 'num', text: money(report.totalExpenses) }),
                    ]),
                ]),
            ]),
        ]),
    ]);
}
