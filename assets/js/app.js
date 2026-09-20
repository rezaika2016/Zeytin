/*
 * Kerangka aplikasi: masuk, sidebar, dan perutean.
 *
 * Perutean memakai hash (#/dashboard) supaya berjalan di GitHub Pages tanpa
 * perlu aturan rewrite di server — GitHub Pages tidak punya server yang bisa
 * diatur.
 */

import { ALLOWED_EMAILS } from './config.js';
import { store } from './store.js';
import { t, lang, setLang, toggleLang, applyStatic } from './i18n.js';
import { toast } from './util.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderHandler } from './pages/handler.js';
import { renderReports } from './pages/reports.js';

const ROUTES = {
    dashboard: { title: 'nav.dashboard', render: renderDashboard },
    handler: { title: 'handler.title', render: renderHandler },
    reports: { title: 'rep.title', render: renderReports },
};

const $ = (id) => document.getElementById(id);

/* --------------------------------------------------------------- tema */

const THEME_KEY = 'zeytin.theme';

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Peramban dengan penyimpanan diblokir tetap bisa dipakai; temanya
        // cuma tidak diingat antar kunjungan.
    }
}

function initTheme() {
    let theme = 'light';

    try {
        theme = localStorage.getItem(THEME_KEY)
            || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
        // abaikan
    }

    applyTheme(theme);
}

/* --------------------------------------------------------------- masuk */

function isAllowed(email) {
    return ALLOWED_EMAILS.map((e) => e.toLowerCase()).includes(String(email || '').toLowerCase());
}

function showSignIn(message = '') {
    $('shell').hidden = true;
    $('signin').hidden = false;

    const note = $('signinNote');

    if (store.mode === 'local') {
        note.className = 'signin__note warn';
        note.textContent = message || t('signin.local');
    } else {
        note.className = 'signin__note muted';
        note.textContent = message;
    }
}

function showApp(user) {
    $('signin').hidden = true;
    $('shell').hidden = false;

    $('userName').textContent = user.name;
    $('userEmail').textContent = user.email;

    const photo = $('userPhoto');

    if (user.photo) {
        photo.src = user.photo;
        photo.hidden = false;
    } else {
        photo.hidden = true;
    }

    const badge = $('storeBadge');
    badge.textContent = store.mode === 'local' ? t('store.local') : t('store.cloud');
    badge.className = store.mode === 'local' ? 'badge badge--warn' : 'badge';

    route();
}

/* ------------------------------------------------------------ perutean */

async function route() {
    if (!store.user) {
        return;
    }

    const name = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
    const entry = ROUTES[name] || ROUTES.dashboard;

    document.querySelectorAll('[data-nav]').forEach((link) => {
        link.classList.toggle('is-active', link.dataset.nav === name);
    });

    $('pageTitle').textContent = t(entry.title);
    $('sidebar').classList.remove('is-open');

    try {
        await entry.render($('content'));
    } catch (error) {
        console.error(error);
        $('content').innerHTML = '';
        toast(error.message || String(error), 'err');
    }
}

/* ---------------------------------------------------------------- init */

async function main() {
    initTheme();
    document.documentElement.lang = lang();
    applyStatic();

    try {
        await store.init();
    } catch (error) {
        console.error(error);
        toast(`Firebase: ${error.message}`, 'err');
    }

    /* tombol-tombol */

    $('btnSignIn').addEventListener('click', async () => {
        try {
            const user = await store.signIn();

            if (store.mode === 'firestore' && !isAllowed(user.email)) {
                await store.signOut();
                showSignIn(t('signin.denied'));

                return;
            }

            showApp(user);
        } catch (error) {
            // Menutup jendela Google bukan galat yang perlu dilaporkan.
            if (String(error.code || '').includes('popup-closed')) {
                return;
            }

            showSignIn(error.message);
        }
    });

    $('btnSignOut').addEventListener('click', async () => {
        await store.signOut();
        showSignIn();
    });

    $('btnLang').addEventListener('click', () => { toggleLang(); route(); });
    $('btnTheme').addEventListener('click', () => {
        applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });

    $('btnSidebar').addEventListener('click', () => {
        $('sidebar').classList.toggle('is-open');
    });

    document.querySelectorAll('[data-lang]').forEach((button) => {
        button.addEventListener('click', () => {
            setLang(button.dataset.lang);
            route();
        });
    });

    window.addEventListener('hashchange', route);
    window.addEventListener('lang:changed', () => {
        const badge = $('storeBadge');

        if (badge.textContent) {
            badge.textContent = store.mode === 'local' ? t('store.local') : t('store.cloud');
        }
    });

    /* sesi */

    if (store.mode === 'local') {
        /*
         * `?demo` mengisi data contoh lalu langsung masuk, supaya tampilan
         * aplikasi bisa dilihat sebelum Firebase disiapkan. Sengaja hanya
         * berlaku di mode lokal: begitu config.js terisi, cabang ini tidak
         * pernah dijalankan lagi, jadi tidak ada jalan pintas masuk ke data
         * sungguhan.
         */
        if (new URLSearchParams(location.search).has('demo')) {
            const { seedDemo } = await import('./demo.js');

            try {
                await seedDemo();
            } catch (error) {
                toast(error.message, 'err');
            }

            showApp(await store.signIn());

            return;
        }

        showSignIn();

        return;
    }

    store.onAuth((user) => {
        if (user && isAllowed(user.email)) {
            showApp(user);
        } else if (user) {
            store.signOut().then(() => showSignIn(t('signin.denied')));
        } else {
            showSignIn();
        }
    });
}

main();
