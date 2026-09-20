/*
 * Dasbor — ringkasan singkat, seperti yang diminta klien.
 *
 * Yang ditonjolkan satu angka: saldo global. Sisanya pendukung. Halaman ini
 * sengaja tidak punya penyaring apa pun selain periode, karena begitu ia
 * menjadi tempat menganalisis, ia berhenti menjadi tempat melihat sekilas.
 */

import { CHANNELS } from '../config.js';
import { loadPeriod } from '../data.js';
import { t, lang } from '../i18n.js';
import { el, money, formatDate, presetRange } from '../util.js';

let range = presetRange('thisMonth');

export async function renderDashboard(host) {
    host.replaceChildren(el('div', { class: 'loader', text: '…' }));

    const { report } = await loadPeriod(range.from, range.to);
    const locale = lang();

    host.replaceChildren(
        periodPicker(host),
        stats(report),
        el('div', { class: 'grid grid--2' }, [
            channelCard(report),
            recentCard(report, locale),
        ]),
    );
}

/* ------------------------------------------------------------- periode */

function periodPicker(host) {
    const presets = ['today', 'last7', 'thisMonth', 'lastMonth', 'thisYear'];

    return el('div', { class: 'toolbar' }, [
        el('span', { class: 'muted', text: t('rep.period') }),
        ...presets.map((preset) => el('button', {
            class: 'chip',
            type: 'button',
            onclick: () => {
                range = presetRange(preset);
                renderDashboard(host);
            },
        }, t(`preset.${preset}`))),
        el('span', { class: 'spacer' }),
        el('span', { class: 'muted num', text: `${range.from} → ${range.to}` }),
    ]);
}

/* -------------------------------------------------------------- angka */

function stats(report) {
    const cards = [
        stat(t('dash.sales'), money(report.totalSales), `${report.recordedDays} / ${report.days} ${t('rep.days').toLowerCase()}`),
        stat(t('dash.cashless'), money(report.cashless)),
        stat(t('dash.cashExpense'), money(report.cashExpense)),
        stat(t('dash.transfers'), money(report.transfers)),
        stat(t('dash.payroll'), money(report.payroll)),
        stat(t('dash.profit'), money(report.netProfit), '', report.netProfit < 0 ? 'neg' : 'pos'),
        stat(t('dash.supplierCash'), money(report.remainingSupplierCash), '', report.remainingSupplierCash < 0 ? 'neg' : ''),
        stat(t('dash.outstanding'), money(report.outstanding), '', report.outstanding > 0 ? 'warn' : ''),
    ];

    return el('div', { class: 'grid grid--stats', style: 'margin-bottom:1rem' }, [
        el('div', { class: 'stat stat--hero' }, [
            el('div', { class: 'stat__label', text: t('dash.global') }),
            el('div', {
                class: `stat__value ${report.globalBalance < 0 ? 'neg' : ''}`,
                text: money(report.globalBalance),
            }),
            el('div', { class: 'stat__hint', text: t('dash.globalHint') }),
        ]),
        ...cards,
    ]);
}

function stat(label, value, hint = '', tone = '') {
    return el('div', { class: 'stat' }, [
        el('div', { class: 'stat__label', text: label }),
        el('div', { class: `stat__value ${tone}`, text: value }),
        hint ? el('div', { class: 'stat__hint', text: hint }) : null,
    ]);
}

/* ------------------------------------------------------------ rincian */

function channelCard(report) {
    const rows = CHANNELS.map((channel) => {
        const value = report.byChannel[channel.key] || 0;
        const share = report.totalSales > 0 && channel.inSales
            ? `${Math.round((value / report.totalSales) * 100)}%`
            : '—';

        return el('tr', {}, [
            el('td', {}, [
                channel.label,
                // Petty cash tidak ikut Total Sales; ditandai supaya tidak
                // dikira hilang dari hitungan karena salah.
                channel.inSales ? null : el('span', { class: 'badge', style: 'margin-left:.5rem', text: 'excl.' }),
            ]),
            el('td', { class: 'num', text: money(value) }),
            el('td', { class: 'num muted', text: share }),
        ]);
    });

    return el('div', { class: 'card' }, [
        el('div', { class: 'card__head' }, [el('h2', { text: t('dash.byChannel') })]),
        el('div', { class: 'table-wrap' }, [
            el('table', { class: 'data' }, [
                el('tbody', {}, rows),
                el('tfoot', {}, [
                    el('tr', {}, [
                        el('td', { text: t('dash.sales') }),
                        el('td', { class: 'num', text: money(report.totalSales) }),
                        el('td', { class: 'num', text: '100%' }),
                    ]),
                ]),
            ]),
        ]),
    ]);
}

function recentCard(report, locale) {
    const recent = report.rows
        .filter((row) => row.totalSales > 0 || row.expense > 0)
        .slice(-10)
        .reverse();

    const body = recent.length
        ? el('div', { class: 'table-wrap' }, [
            el('table', { class: 'data' }, [
                el('thead', {}, [
                    el('tr', {}, [
                        el('th', { text: t('f.date') }),
                        el('th', { class: 'num', text: t('dash.sales') }),
                        el('th', { class: 'num', text: t('dash.cashExpense') }),
                        el('th', { class: 'num', text: t('dash.supplierCash') }),
                    ]),
                ]),
                el('tbody', {}, recent.map((row) => el('tr', {}, [
                    el('td', { text: formatDate(row.date, locale) }),
                    el('td', { class: 'num', text: money(row.totalSales) }),
                    el('td', { class: 'num', text: money(row.expense) }),
                    el('td', {
                        class: `num ${row.remainingSupplierCash < 0 ? 'neg' : ''}`,
                        text: money(row.remainingSupplierCash),
                    }),
                ]))),
            ]),
        ])
        : el('p', { class: 'empty', text: t('dash.noData') });

    return el('div', { class: 'card' }, [
        el('div', { class: 'card__head' }, [el('h2', { text: t('dash.recent') })]),
        body,
    ]);
}
