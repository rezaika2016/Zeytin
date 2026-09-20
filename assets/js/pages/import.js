/*
 * Pengimpor berkas Excel bulanan.
 *
 * Berkas klien ditulis manusia untuk dibaca manusia, bukan untuk diurai
 * mesin, dan bentuknya tidak rapi:
 *
 *   - Tanggal hanya ditulis di baris pertama tiap kelompok; baris di
 *     bawahnya kosong dan harus mewarisi dari atas.
 *   - Baris header muncul lebih dari sekali (Outstanding INV punya dua
 *     blok), dengan judul kolom yang berbeda antar blok.
 *   - Tiap sheet mulai di baris berlainan: Income 7, Expense 4,
 *     Supplier Database 9, Payroll 19.
 *   - Blok rekap menyelip di samping data (Income kolom O–R).
 *
 * Karena itu pengimpor ini TIDAK menganggap "baris 1 header, sisanya data".
 * Ia mencari baris headernya berdasarkan nama kolom, dan kalau tidak
 * ketemu, ia MENOLAK sheet itu dan mengatakannya. Menebak posisi kolom
 * berarti memasukkan angka ke tempat yang salah tanpa ada yang sadar —
 * cara tercepat merusak laporan.
 */

import { store } from '../store.js';
import { t } from '../i18n.js';
import { el, excelSerialToDate, toast, uid, today } from '../util.js';
import { lineTotal } from '../ledger.js';

const SHEETJS = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm';

/**
 * Bentuk tiap sheet yang dikenali.
 *
 * `required` adalah judul kolom yang harus ada supaya sebuah baris dianggap
 * baris header. Sengaja dipilih yang paling khas, bukan semuanya, supaya
 * penambahan kolom oleh klien tidak langsung membuat impor gagal.
 */
const SPECS = [
    {
        sheet: 'Income',
        target: 'days',
        idFrom: 'date',
        required: ['date', 'total sales'],
        map: {
            date: ['date'],
            pettyCash: ['petty cash'],
            cash: ['cash'],
            bni: ['bni'],
            grabFood: ['grab food'],
            goFood: ['go food'],
            goPay: ['go pay'],
        },
        build: (row) => (row.date ? row : null),
    },
    {
        sheet: 'Expense',
        target: 'expenses',
        required: ['date', 'items', 'total'],
        map: {
            date: ['date'],
            vendor: ['vendor'],
            item: ['items', 'item'],
            qty: ['qty'],
            unit: ['unit'],
            price: ['price'],
            disc: ['disc'],
            tax: ['tax'],
        },
        inheritDate: true,
        build: (row) => (row.item ? { ...row, total: lineTotal(row) } : null),
    },
    {
        sheet: 'Supplier Transfer Payment',
        target: 'transfers',
        required: ['date', 'items', 'total expense'],
        map: {
            date: ['date'],
            vendor: ['vendor'],
            item: ['items', 'item'],
            unit: ['unit'],
            qty: ['qty'],
            price: ['price'],
            total: ['total expense'],
            method: ['payment methode', 'payment method'],
            status: ['payment status'],
        },
        inheritDate: true,
        build: (row) => (row.item ? row : null),
    },
    {
        sheet: 'Outstanding INV',
        target: 'outstanding',
        required: ['vendor', 'items', 'total'],
        map: {
            date: ['date order'],
            dueDate: ['due time', 'deliv date'],
            vendor: ['vendor'],
            item: ['items', 'item'],
            unit: ['unit'],
            qty: ['qty'],
            price: ['price'],
            disc: ['disc'],
            tax: ['tax'],
            status: ['status'],
        },
        inheritDate: true,
        build: (row) => (row.item ? { ...row, total: lineTotal(row) } : null),
    },
    {
        sheet: 'Supplier Database',
        target: 'suppliers',
        required: ["supplier's name", 'contact person'],
        map: {
            name: ["supplier's name", 'supplier name'],
            contact: ['contact person'],
            item: ['items', 'item'],
            price: ['price'],
            bank: ['bank'],
            account: ['bank account'],
            accountName: ['a/n'],
            method: ['payment methode', 'payment method'],
        },
        build: (row) => (row.name ? row : null),
    },
    {
        sheet: 'Payroll',
        target: 'payroll',
        required: ['name', 'basic sallary'],
        map: {
            name: ['name'],
            basic: ['basic sallary', 'basic salary'],
            bpjs: ['deduction bpjs'],
            grandTotal: ['grand total sallary', 'grand total salary'],
        },
        // Bulannya tidak bisa dibaca dari sheet: judulnya berupa kalimat
        // bebas ("Work Sheet Summary 1st - 31th September 2025") yang tidak
        // dijamin bentuknya. Ditanyakan ke pengguna, bukan ditebak.
        needsMonth: true,
        build: (row, ctx) => (row.name ? { ...row, month: ctx.month, section: row.section || 'Front Staff' } : null),
    },
];

/* ------------------------------------------------------------ tampilan */

export function renderImport(host, onDone) {
    let file = null;
    let month = today().slice(0, 7);

    const log = el('div', { style: 'margin-top:1rem' });

    const runBtn = el('button', {
        class: 'btn',
        type: 'button',
        disabled: true,
        onclick: async () => {
            runBtn.disabled = true;
            log.replaceChildren(el('p', { class: 'loader', text: t('import.reading') }));

            try {
                const results = await importWorkbook(file, { month });
                log.replaceChildren(report(results));

                const total = results.reduce((sum, r) => sum + (r.imported || 0), 0);
                toast(total ? `${t('import.done')} — ${total} ${t('import.rows')}` : t('import.nothing'), total ? 'ok' : 'warn');

                if (total && onDone) {
                    // Tabel di tab lain ikut memuat ulang, supaya hasil
                    // impor langsung terlihat, bukan setelah pindah halaman.
                    setTimeout(onDone, 1200);
                }
            } catch (error) {
                log.replaceChildren(el('p', { class: 'notice notice--warn', text: error.message }));
                toast(error.message, 'err');
            } finally {
                runBtn.disabled = !file;
            }
        },
    }, t('import.run'));

    const picker = el('input', {
        type: 'file',
        accept: '.xlsx,.xls',
        onchange: (e) => {
            file = e.target.files[0] || null;
            runBtn.disabled = !file;
        },
    });

    host.replaceChildren(el('div', { class: 'card' }, [
        el('div', { class: 'card__head' }, [el('h2', { text: t('tab.import') })]),
        el('div', { class: 'card__body' }, [
            el('p', { class: 'notice', text: t('import.intro') }),
            el('div', { class: 'form-grid', style: 'margin-top:1rem' }, [
                el('label', { class: 'field' }, [
                    el('span', { text: t('import.pick') }),
                    picker,
                ]),
                el('label', { class: 'field' }, [
                    el('span', { text: `${t('f.month')} — Payroll` }),
                    el('input', {
                        type: 'month',
                        value: month,
                        oninput: (e) => { month = e.target.value; },
                    }),
                ]),
            ]),
            el('div', { style: 'margin-top:1rem' }, [runBtn]),
            log,
        ]),
    ]));
}

function report(results) {
    return el('div', { class: 'table-wrap' }, [
        el('table', { class: 'data' }, [
            el('thead', {}, [
                el('tr', {}, [
                    el('th', {}, 'Sheet'),
                    el('th', { class: 'num' }, t('import.rows')),
                    el('th', {}, t('import.range')),
                    el('th', {}, t('f.status')),
                ]),
            ]),
            el('tbody', {}, results.map((r) => el('tr', {}, [
                el('td', {}, r.sheet),
                el('td', { class: 'num' }, String(r.imported ?? 0)),
                el('td', { class: 'muted' }, r.range || '—'),
                el('td', { class: r.error ? 'warn' : 'pos' }, r.error || 'OK'),
            ]))),
        ]),
    ]);
}

/* -------------------------------------------------------------- mesin */

export async function importWorkbook(file, ctx = {}) {
    const XLSX = await import(/* @vite-ignore */ SHEETJS);
    const book = XLSX.read(await file.arrayBuffer(), { cellDates: false });
    const results = [];

    for (const spec of SPECS) {
        const sheet = book.Sheets[spec.sheet];

        if (!sheet) {
            results.push({ sheet: spec.sheet, imported: 0, error: t('import.sheetMissing') });
            continue;
        }

        const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: null });
        const blocks = findHeaderRows(grid, spec.required);

        if (!blocks.length) {
            results.push({ sheet: spec.sheet, imported: 0, error: t('import.headerMissing') });
            continue;
        }

        const records = [];

        for (const block of blocks) {
            records.push(...readBlock(grid, block, spec, ctx));
        }

        if (!records.length) {
            results.push({ sheet: spec.sheet, imported: 0, error: '—' });
            continue;
        }

        try {
            await store.putMany(spec.target, records);
            results.push({ sheet: spec.sheet, imported: records.length, range: dateRange(records) });
        } catch (error) {
            results.push({ sheet: spec.sheet, imported: 0, error: error.message });
        }
    }

    return results;
}

/**
 * Semua baris yang tampak seperti baris header, bukan cuma yang pertama.
 * Outstanding INV punya dua blok dengan judul kolom berbeda, dan keduanya
 * berisi data yang sah.
 */
function findHeaderRows(grid, required) {
    const blocks = [];

    for (let r = 0; r < grid.length; r++) {
        const cells = (grid[r] || []).map(norm);

        if (!cells.some(Boolean)) {
            continue;
        }

        const hasAll = required.every((label) => cells.some((cell) => cell === label));

        if (hasAll) {
            blocks.push(r);
        }
    }

    return blocks;
}

function readBlock(grid, headerRow, spec, ctx) {
    const header = (grid[headerRow] || []).map(norm);
    const columns = {};

    for (const [field, aliases] of Object.entries(spec.map)) {
        const index = header.findIndex((cell) => aliases.includes(cell));

        if (index >= 0) {
            columns[field] = index;
        }
    }

    const records = [];
    let lastDate = '';
    let section = '';
    let blank = 0;

    for (let r = headerRow + 1; r < grid.length; r++) {
        const cells = grid[r] || [];

        if (!cells.some((cell) => cell !== null && cell !== '')) {
            // Beberapa baris kosong berturut-turut menandai blok berakhir.
            if (++blank >= 8) break;
            continue;
        }

        blank = 0;

        // Baris berikutnya adalah header lagi: blok ini selesai.
        const asHeader = cells.map(norm);
        if (spec.required.every((label) => asHeader.some((cell) => cell === label))) {
            break;
        }

        // Penanda bagian di sheet Payroll, ditulis sebagai baris teks biasa.
        const sectionLabel = asHeader.find((cell) => cell === 'front staff' || cell === 'kitchen staff');
        if (sectionLabel) {
            section = sectionLabel === 'front staff' ? 'Front Staff' : 'Kitchen Staff';
            continue;
        }

        const row = {};

        for (const [field, index] of Object.entries(columns)) {
            row[field] = cells[index];
        }

        if ('date' in columns) {
            const parsed = toDate(row.date);

            if (parsed) {
                lastDate = parsed;
            }

            // Tanggal hanya ditulis di baris pertama tiap kelompok.
            row.date = spec.inheritDate ? (parsed || lastDate) : parsed;
        }

        if ('dueDate' in columns) {
            row.dueDate = toDate(row.dueDate) || '';
        }

        for (const field of ['qty', 'price', 'disc', 'tax', 'total', 'basic', 'bpjs', 'grandTotal',
            'pettyCash', 'cash', 'bni', 'grabFood', 'goFood', 'goPay']) {
            if (field in row) {
                row[field] = toNumber(row[field]);
            }
        }

        for (const field of ['vendor', 'item', 'unit', 'method', 'status', 'name', 'contact', 'bank', 'account', 'accountName']) {
            if (field in row) {
                row[field] = row[field] === null ? '' : String(row[field]).trim();
            }
        }

        if (section) {
            row.section = section;
        }

        const built = spec.build(row, ctx);

        if (!built) {
            continue;
        }

        built.id = spec.idFrom ? built[spec.idFrom] : uid();

        if (built.id) {
            records.push(built);
        }
    }

    return records;
}

function norm(value) {
    return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));

    return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Tanggal Excel bisa berupa serial angka atau teks.
 *
 * Teksnya ditulis tangan oleh staf dengan urutan hari dulu — "31/08/2026".
 * `Date.parse` menolak bentuk itu; ia mengharap bulan dulu. Kalau ditolak,
 * baris itu dianggap tak bertanggal lalu mewarisi tanggal baris sebelumnya,
 * sehingga belanja dua minggu terakhir menumpuk di satu hari. Totalnya tetap
 * benar, yang rusak rinciannya — galat semacam itu yang paling lama tidak
 * ketahuan.
 *
 * Urutan hari-dulu dipakai tanpa menebak: itu yang ada di berkas klien dan
 * lazim di Indonesia. "05/08/2026" berarti 5 Agustus, bukan 8 Mei.
 */
export function toDate(value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    if (typeof value === 'number') {
        return excelSerialToDate(value);
    }

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);

    if (dmy) {
        const day = Number(dmy[1]);
        const month = Number(dmy[2]);
        const year = Number(dmy[3]);

        // Tanggal mustahil ditolak, bukan digeser jadi bulan berikutnya
        // seperti yang dilakukan konstruktor Date.
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return '';
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const parsed = Date.parse(text);

    if (Number.isNaN(parsed)) {
        return '';
    }

    const d = new Date(parsed);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Rentang tanggal yang benar-benar terbaca dari sheet, ditampilkan apa
 * adanya di tabel hasil.
 *
 * Gunanya bukan hiasan: salah ketik tahun di satu sel — di berkas Agustus
 * 2026 ada satu baris tertulis "18/8/2028" — tidak mengubah jumlah baris
 * dan tidak memunculkan galat apa pun. Yang berubah cuma ujung rentangnya.
 * Ditampilkan begini, kekeliruan itu kelihatan sebelum datanya dipakai;
 * kalau disembunyikan, baru ketahuan saat laporan tahunan terlihat aneh.
 */
function dateRange(records) {
    const keys = records.map((row) => row.date || row.month).filter(Boolean).sort();

    if (!keys.length) {
        return '';
    }

    return keys[0] === keys[keys.length - 1] ? keys[0] : `${keys[0]} … ${keys[keys.length - 1]}`;
}
