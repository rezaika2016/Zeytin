/*
 * Uang, tanggal, dan pembantu DOM.
 *
 * Uang disimpan sebagai bilangan bulat rupiah, tanpa sen. Restoran ini
 * tidak pernah menagih pecahan rupiah, dan bilangan bulat menutup seluruh
 * kemungkinan galat pembulatan di laporan — sama seperti proyek kasirnya.
 */

import { business } from './config.js';

/* ------------------------------------------------------------------ uang */

export function money(amount) {
    const n = Math.round(Number(amount) || 0);
    const sign = n < 0 ? '-' : '';

    return `${sign}Rp ${Math.abs(n).toLocaleString('id-ID')}`;
}

/** Tanpa "Rp", untuk kolom tabel yang sudah punya kepala kolom bersatuan. */
export function num(amount) {
    const n = Math.round(Number(amount) || 0);

    return n.toLocaleString('id-ID');
}

/** Menerima "45.000", "45000", "Rp 45.000", 45000 — semuanya jadi 45000. */
export function parseMoney(value) {
    if (typeof value === 'number') {
        return Math.round(value);
    }

    const digits = String(value ?? '').replace(/[^0-9-]/g, '');

    return digits === '' || digits === '-' ? 0 : parseInt(digits, 10);
}

/* --------------------------------------------------------------- tanggal */

/** Kunci tanggal YYYY-MM-DD, dipakai sebagai id dokumen harian. */
export function dateKey(value) {
    const d = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(d.getTime())) {
        return '';
    }

    // Sengaja memakai komponen waktu lokal, bukan toISOString(): yang
    // terakhir memindahkan tanggal ke UTC, sehingga penjualan tengah malam
    // di Bali bisa tercatat di hari sebelumnya.
    const pad = (n) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today() {
    return dateKey(new Date());
}

/** Serial tanggal Excel (epoch 1899-12-30) menjadi YYYY-MM-DD. */
export function excelSerialToDate(serial) {
    const n = Number(serial);

    if (!Number.isFinite(n) || n <= 0) {
        return '';
    }

    const ms = Math.round(n) * 86400000;
    const d = new Date(Date.UTC(1899, 11, 30) + ms);

    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function formatDate(key, locale = 'en') {
    if (!key) {
        return '—';
    }

    const [y, m, d] = key.split('-').map(Number);

    return new Date(y, m - 1, d).toLocaleDateString(
        locale === 'id' ? 'id-ID' : 'en-GB',
        { day: '2-digit', month: 'short', year: 'numeric' },
    );
}

export function formatMonth(key, locale = 'en') {
    const [y, m] = key.split('-').map(Number);

    return new Date(y, m - 1, 1).toLocaleDateString(
        locale === 'id' ? 'id-ID' : 'en-GB',
        { month: 'long', year: 'numeric' },
    );
}

export function monthKey(key) { return key.slice(0, 7); }
export function yearKey(key) { return key.slice(0, 4); }

/** Rentang tanggal untuk periode siap pakai di halaman laporan. */
export function presetRange(preset) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

    switch (preset) {
        case 'today':
            return { from: iso(now), to: iso(now) };
        case 'yesterday': {
            const d = new Date(now);
            d.setDate(d.getDate() - 1);
            return { from: iso(d), to: iso(d) };
        }
        case 'last7': {
            const d = new Date(now);
            d.setDate(d.getDate() - 6);
            return { from: iso(d), to: iso(now) };
        }
        case 'thisMonth':
            return { from: iso(startOfMonth(now)), to: iso(now) };
        case 'lastMonth': {
            const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return { from: iso(startOfMonth(d)), to: iso(endOfMonth(d)) };
        }
        case 'thisYear':
            return { from: `${now.getFullYear()}-01-01`, to: iso(now) };
        case 'lastYear':
            return { from: `${now.getFullYear() - 1}-01-01`, to: `${now.getFullYear() - 1}-12-31` };
        default:
            return { from: iso(startOfMonth(now)), to: iso(now) };
    }
}

/** Setiap tanggal dalam rentang, termasuk hari yang tidak ada datanya. */
export function eachDate(from, to) {
    const out = [];
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);
    const cursor = new Date(fy, fm - 1, fd);
    const end = new Date(ty, tm - 1, td);

    // Rentang terbalik tidak pernah berguna dan hanya menghasilkan tabel
    // kosong tanpa penjelasan; diperlakukan sebagai satu hari.
    if (cursor > end) {
        return [dateKey(cursor)];
    }

    while (cursor <= end) {
        out.push(dateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return out;
}

/* -------------------------------------------------------------------- DOM */

export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) {
            continue;
        }

        if (key === 'class') {
            node.className = value;
        } else if (key === 'html') {
            node.innerHTML = value;
        } else if (key === 'text') {
            node.textContent = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
            node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            node.setAttribute(key, value === true ? '' : value);
        }
    }

    for (const child of [].concat(children)) {
        if (child === null || child === undefined || child === false) {
            continue;
        }

        node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }

    return node;
}

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
}

export function toast(message, kind = 'ok', title = '') {
    const host = document.getElementById('toasts');

    if (!host) {
        return;
    }

    const node = el('div', { class: `toast toast--${kind}` }, [
        title ? el('strong', { text: title }) : null,
        el('span', { text: message }),
    ]);

    host.append(node);
    setTimeout(() => node.remove(), kind === 'err' ? 8000 : 4000);
}

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const CURRENCY_LABEL = business.currency;
