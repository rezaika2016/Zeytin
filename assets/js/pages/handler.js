/*
 * Handler — satu halaman untuk seluruh pencatatan.
 *
 * Klien meminta formulirnya selesai dalam satu halaman, jadi tiap jenis
 * catatan jadi satu tab, bukan satu halaman tersendiri. Formulir dan
 * tabelnya dibangun dari assets/js/schema.js, sehingga menambah kolom
 * cukup diubah di satu tempat.
 */

import { SCHEMAS, MONEY_FIELDS } from '../schema.js';
import { store } from '../store.js';
import { t, lang } from '../i18n.js';
import { el, money, parseMoney, today, formatDate, toast } from '../util.js';
import { renderImport } from './import.js';

let activeTab = 'days';

export async function renderHandler(host) {
    const tabs = [...Object.keys(SCHEMAS), 'import'];

    const tabBar = el('div', { class: 'tabs' }, tabs.map((key) => el('button', {
        type: 'button',
        class: activeTab === key ? 'is-active' : '',
        onclick: () => {
            activeTab = key;
            renderHandler(host);
        },
    }, key === 'import' ? t('tab.import') : t(SCHEMAS[key].tab))));

    const body = el('div', { id: 'handlerBody' }, [el('div', { class: 'loader', text: '…' })]);

    host.replaceChildren(
        el('p', { class: 'notice', text: t('handler.intro'), style: 'margin-bottom:1rem' }),
        tabBar,
        body,
    );

    if (activeTab === 'import') {
        renderImport(body, () => renderHandler(host));

        return;
    }

    await renderCollection(body, SCHEMAS[activeTab]);
}

/* --------------------------------------------------------------- tabel */

async function renderCollection(host, schema) {
    const rows = await store.list(schema.key);

    // Terbaru di atas: yang baru dicatat itulah yang paling sering dicek
    // ulang sesaat setelah diketik.
    rows.sort((a, b) => String(b[schema.dateField] || b.name || '')
        .localeCompare(String(a[schema.dateField] || a.name || '')));

    host.replaceChildren(
        formCard(schema, host),
        listCard(schema, rows, host),
    );
}

function formCard(schema, host) {
    const state = {};

    for (const field of schema.fields) {
        state[field.name] = field.type === 'date'
            ? today()
            : (field.type === 'month' ? today().slice(0, 7) : (field.default ?? ''));
    }

    const inputs = schema.fields.map((field) => {
        const control = field.type === 'select'
            ? el('select', {
                onchange: (e) => { state[field.name] = e.target.value; },
            }, field.options.map((option) => el('option', { value: option }, option)))
            : el('input', {
                type: inputType(field.type),
                value: state[field.name],
                inputmode: field.type === 'money' || field.type === 'number' ? 'numeric' : null,
                oninput: (e) => { state[field.name] = e.target.value; },
            });

        if (field.type === 'select') {
            state[field.name] = field.options[0];
        }

        return el('label', { class: 'field' }, [
            el('span', { text: field.raw ? field.label : t(field.label) }),
            control,
        ]);
    });

    const submit = async () => {
        const missing = schema.fields.find((f) => f.required && !String(state[f.name] || '').trim());

        if (missing) {
            toast(`${missing.raw ? missing.label : t(missing.label)} — ${t('f.required', 'required')}`, 'err');

            return;
        }

        const record = {};

        for (const field of schema.fields) {
            record[field.name] = field.type === 'money' || field.type === 'number'
                ? parseMoney(state[field.name])
                : String(state[field.name] ?? '').trim();
        }

        Object.assign(record, schema.computed ? schema.computed(record) : {});

        try {
            await store.put(schema.key, schema.idFrom ? record[schema.idFrom] : null, record);
            toast(t('act.saved'), 'ok');
            await renderCollection(host, schema);
        } catch (error) {
            toast(error.message, 'err');
        }
    };

    return el('div', { class: 'card', style: 'margin-bottom:1rem' }, [
        el('div', { class: 'card__head' }, [
            el('h2', { text: t(schema.tab) }),
            el('span', { class: 'spacer' }),
            schema.idFrom
                ? el('span', { class: 'muted', style: 'font-size:.75rem', text: t('import.willReplace') })
                : null,
        ]),
        el('div', { class: 'card__body' }, [
            el('div', { class: 'form-grid' }, inputs),
            el('div', { style: 'margin-top:1rem' }, [
                el('button', { class: 'btn', type: 'button', onclick: submit }, t('act.save')),
            ]),
        ]),
    ]);
}

function listCard(schema, rows, host) {
    if (!rows.length) {
        return el('div', { class: 'card' }, [el('p', { class: 'empty', text: t('rep.noData') })]);
    }

    const locale = lang();

    const head = el('tr', {}, [
        ...schema.columns.map((name) => {
            const field = schema.fields.find((f) => f.name === name);
            const label = field ? (field.raw ? field.label : t(field.label)) : t(`f.${name}`, name);

            return el('th', { class: MONEY_FIELDS.has(name) ? 'num' : '' }, label);
        }),
        el('th', {}, ''),
    ]);

    const body = rows.map((row) => el('tr', {}, [
        ...schema.columns.map((name) => el('td', {
            class: MONEY_FIELDS.has(name) ? 'num' : '',
            text: cellText(name, row[name], locale),
        })),
        el('td', {}, [
            el('button', {
                class: 'btn btn--ghost btn--sm',
                type: 'button',
                onclick: async () => {
                    if (!confirm(t('act.confirmDelete'))) {
                        return;
                    }

                    await store.remove(schema.key, row.id);
                    toast(t('act.deleted'), 'ok');
                    await renderCollection(host, schema);
                },
            }, t('act.delete')),
        ]),
    ]));

    return el('div', { class: 'card' }, [
        el('div', { class: 'card__head' }, [
            el('h2', { text: `${rows.length} ${t('import.rows')}` }),
        ]),
        el('div', { class: 'table-wrap' }, [
            el('table', { class: 'data' }, [
                el('thead', {}, [head]),
                el('tbody', {}, body),
            ]),
        ]),
    ]);
}

function cellText(name, value, locale) {
    if (value === undefined || value === null || value === '') {
        return '—';
    }

    if (MONEY_FIELDS.has(name)) {
        return money(value);
    }

    if (name === 'date' || name === 'dueDate') {
        return formatDate(value, locale);
    }

    return String(value);
}

function inputType(type) {
    return { date: 'date', month: 'month', number: 'number', money: 'text' }[type] || 'text';
}
