/*
 * Handler — satu halaman untuk seluruh pencatatan.
 *
 * Klien meminta formulirnya selesai dalam satu halaman, jadi tiap jenis
 * catatan jadi satu tab, bukan satu halaman tersendiri. Formulir dan
 * tabelnya dibangun dari assets/js/schema.js, sehingga menambah kolom
 * cukup diubah di satu tempat.
 *
 * Tabnya dibagi dua kelompok: catatan harian di depan, data induk
 * (pemasok, barang, cara bayar) di belakang. Data induk jarang disentuh,
 * tapi isinya yang membuat formulir harian cepat diisi.
 */

import { SCHEMAS, MASTERS, MONEY_FIELDS, comboOptions, masterMatch } from '../schema.js';
import { store } from '../store.js';
import { t, lang } from '../i18n.js';
import { el, money, parseMoney, today, formatDate, toast } from '../util.js';
import { renderImport } from './import.js';

let activeTab = 'days';

export async function renderHandler(host) {
    const daily = Object.keys(SCHEMAS).filter((key) => !SCHEMAS[key].master);
    const tabs = [...daily, ...MASTERS, 'import'];

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

/* ------------------------------------------------------------ pemuatan */

/**
 * Seluruh data induk sekaligus.
 *
 * Ditarik utuh karena jumlahnya puluhan baris dan dipakai oleh hampir tiap
 * kotak isian di halaman ini. Menariknya per kotak berarti puluhan
 * permintaan ke Firestore untuk satu formulir.
 */
async function loadMasters() {
    const entries = await Promise.all(
        MASTERS.map(async (key) => [key, await store.list(key)]),
    );

    return Object.fromEntries(entries);
}

async function renderCollection(host, schema, editing = null) {
    const [rows, masters] = await Promise.all([store.list(schema.key), loadMasters()]);

    // Terbaru di atas: yang baru dicatat itulah yang paling sering dicek
    // ulang sesaat setelah diketik.
    rows.sort((a, b) => String(b[schema.dateField] || b.name || '')
        .localeCompare(String(a[schema.dateField] || a.name || '')));

    const form = formCard(schema, host, masters, rows, editing);

    host.replaceChildren(form, listCard(schema, rows, host));

    if (editing) {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/* -------------------------------------------------------------- formulir */

function initialValue(field, editing) {
    if (editing) {
        const value = editing[field.name];

        return value === undefined || value === null ? '' : String(value);
    }

    if (field.type === 'date') {
        return today();
    }

    if (field.type === 'month') {
        return today().slice(0, 7);
    }

    if (field.type === 'select') {
        return field.options[0];
    }

    return field.default === undefined ? '' : String(field.default);
}

function formCard(schema, host, masters, rows, editing) {
    const state = {};
    const controls = {};

    // Kolom yang isinya datang dari data induk, bukan dari tangan orang.
    // Dibedakan supaya memilih barang lain ikut memperbarui harganya, tapi
    // harga yang sudah diketik sendiri tidak pernah tertimpa.
    const autoFilled = new Set();

    for (const field of schema.fields) {
        state[field.name] = initialValue(field, editing);
    }

    const applyFill = (field, value) => {
        if (!field.fills) {
            return;
        }

        const match = masterMatch(field, masters, value);

        if (!match) {
            return;
        }

        for (const [target, from] of Object.entries(field.fills)) {
            const incoming = match[from];

            if (incoming === undefined || incoming === null || incoming === '') {
                continue;
            }

            const current = String(state[target] ?? '').trim();

            if (current && !autoFilled.has(target)) {
                continue;
            }

            state[target] = String(incoming);
            autoFilled.add(target);

            if (controls[target]) {
                controls[target].value = state[target];
            }
        }
    };

    const inputs = schema.fields.map((field) => {
        let control;
        let extra = null;

        if (field.type === 'select') {
            control = el('select', {
                onchange: (e) => { state[field.name] = e.target.value; },
            }, field.options.map((option) => el('option', {
                value: option,
                selected: option === state[field.name],
            }, option)));
        } else if (field.type === 'combo') {
            const listId = `dl-${schema.key}-${field.name}`;

            control = el('input', {
                type: 'text',
                list: listId,
                value: state[field.name],
                autocomplete: 'off',
                oninput: (e) => {
                    state[field.name] = e.target.value;
                    applyFill(field, e.target.value);
                },
            });

            extra = el('datalist', { id: listId },
                comboOptions(field, masters, rows).map((option) => el('option', { value: option })));
        } else {
            control = el('input', {
                type: inputType(field.type),
                value: state[field.name],
                inputmode: field.type === 'money' || field.type === 'number' ? 'numeric' : null,
                oninput: (e) => {
                    state[field.name] = e.target.value;
                    autoFilled.delete(field.name);
                },
            });
        }

        controls[field.name] = control;

        return el('label', { class: 'field' }, [
            el('span', { text: field.raw ? field.label : t(field.label) }),
            control,
            extra,
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

        /*
         * Ditandai sebagai ketikan orang, bukan hasil impor. Penandanya
         * dipakai pengimpor Excel untuk memutuskan baris mana yang boleh ia
         * ganti — baris yang pernah disentuh di sini jadi milik penggunanya,
         * dan impor berikutnya tidak akan menghapusnya.
         */
        record.source = 'typed';

        // Catatan harian memakai tanggalnya sendiri sebagai nomor baris,
        // jadi nomornya selalu dihitung ulang dari isian — bukan diambil
        // dari baris yang sedang diubah.
        const id = schema.idFrom ? record[schema.idFrom] : (editing ? editing.id : null);

        try {
            await store.put(schema.key, id, record);

            // Mengubah tanggalnya berarti memindahkan barisnya. Tanpa
            // membuang yang lama, harinya akan terhitung dua kali.
            if (editing && editing.id !== id) {
                await store.remove(schema.key, editing.id);
            }

            toast(t(editing ? 'act.updated' : 'act.saved'), 'ok');
            await renderCollection(host, schema);
        } catch (error) {
            toast(error.message, 'err');
        }
    };

    const actions = [
        el('button', { class: 'btn', type: 'button', onclick: submit },
            t(editing ? 'act.update' : 'act.save')),
    ];

    if (editing) {
        actions.push(el('button', {
            class: 'btn btn--ghost',
            type: 'button',
            style: 'margin-left:.5rem',
            onclick: () => renderCollection(host, schema),
        }, t('act.cancel')));
    }

    return el('div', { class: 'card', style: 'margin-bottom:1rem' }, [
        el('div', { class: 'card__head' }, [
            el('h2', { text: t(schema.tab) }),
            el('span', { class: 'spacer' }),
            editing
                ? el('span', { class: 'badge badge--warn', text: t('form.editing') })
                : (schema.idFrom
                    ? el('span', { class: 'muted', style: 'font-size:.75rem', text: t('import.willReplace') })
                    : null),
        ]),
        el('div', { class: 'card__body' }, [
            el('div', { class: 'form-grid' }, inputs),
            el('div', { style: 'margin-top:1rem' }, actions),
        ]),
    ]);
}

/* ---------------------------------------------------------------- tabel */

function listCard(schema, rows, host) {
    if (!rows.length) {
        return el('div', { class: 'card' }, [
            el('p', { class: 'empty', text: t(schema.master ? 'master.empty' : 'rep.noData') }),
        ]);
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
        el('td', { class: 'row-actions' }, [
            el('button', {
                class: 'btn btn--ghost btn--sm',
                type: 'button',
                onclick: () => renderCollection(host, schema, row),
            }, t('act.edit')),
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
