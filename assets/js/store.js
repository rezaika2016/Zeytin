/*
 * Lapisan data.
 *
 * Dua penyimpanan di balik satu antarmuka:
 *
 *   firestore — dipakai kalau assets/js/config.js sudah diisi
 *   local     — localStorage, dipakai kalau belum
 *
 * Mode lokal bukan mainan: tanpanya, tampilan aplikasi tidak bisa dilihat
 * sama sekali sebelum proyek Firebase dibuat, dan kesalahan tata letak baru
 * ketahuan setelah data sungguhan masuk. Tapi ia memang tidak layak untuk
 * catatan sungguhan — membersihkan data situs berarti semuanya hilang, dan
 * halaman masuk mengatakan itu apa adanya.
 */

import { firebase as firebaseConfig } from './config.js';
import { uid } from './util.js';

const FIREBASE_VERSION = '10.12.5';

/**
 * Koleksi beserta nama kolom tanggalnya.
 *
 * Kolom tanggal dipakai untuk menyaring di sisi Firestore, bukan setelah
 * ditarik — laporan tahunan yang menarik seluruh koleksi tiap kali dibuka
 * akan mahal, karena Firestore ditagih per dokumen yang dibaca.
 */
export const COLLECTIONS = {
    days: 'date',
    expenses: 'date',
    transfers: 'date',
    payroll: 'month',
    outstanding: 'date',
    suppliers: null,
};

const LOCAL_PREFIX = 'zeytin.data.';

export const store = {
    mode: 'local',
    user: null,

    /* ------------------------------------------------------------ init */

    async init() {
        if (!firebaseConfig.apiKey) {
            this.mode = 'local';

            return this;
        }

        const [{ initializeApp }, auth, firestore] = await Promise.all([
            import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
            import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
            import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`),
        ]);

        this._app = initializeApp(firebaseConfig);
        this._auth = auth;
        this._fs = firestore;
        this._authInstance = auth.getAuth(this._app);
        this._db = firestore.getFirestore(this._app);
        this.mode = 'firestore';

        return this;
    },

    /* ------------------------------------------------------------ auth */

    async signIn() {
        if (this.mode === 'local') {
            this.user = { name: 'Local user', email: 'local@device', photo: '' };

            return this.user;
        }

        const provider = new this._auth.GoogleAuthProvider();
        const result = await this._auth.signInWithPopup(this._authInstance, provider);

        this.user = this._shape(result.user);

        return this.user;
    },

    async signOut() {
        if (this.mode === 'firestore') {
            await this._auth.signOut(this._authInstance);
        }

        this.user = null;
    },

    /** Memanggil kembali sesi yang masih hidup, supaya tidak perlu masuk ulang. */
    onAuth(callback) {
        if (this.mode === 'local') {
            callback(null);

            return () => {};
        }

        return this._auth.onAuthStateChanged(this._authInstance, (user) => {
            this.user = user ? this._shape(user) : null;
            callback(this.user);
        });
    },

    _shape(user) {
        return {
            name: user.displayName || user.email,
            email: (user.email || '').toLowerCase(),
            photo: user.photoURL || '',
        };
    },

    /* ------------------------------------------------------------ data */

    /**
     * @param {string} name koleksi
     * @param {{from?: string, to?: string}} range disaring pada kolom tanggalnya
     */
    async list(name, range = {}) {
        const field = COLLECTIONS[name];

        if (this.mode === 'local') {
            const rows = this._local(name);

            return this._filter(rows, field, range);
        }

        const { collection, getDocs, query, where, orderBy } = this._fs;
        const parts = [collection(this._db, name)];

        if (field && range.from) {
            parts.push(where(field, '>=', this._bound(field, range.from, 'from')));
        }

        if (field && range.to) {
            parts.push(where(field, '<=', this._bound(field, range.to, 'to')));
        }

        if (field) {
            parts.push(orderBy(field));
        }

        const snapshot = await getDocs(query(...parts));

        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },

    /** Payroll disimpan per bulan (YYYY-MM), jadi batasnya dipotong. */
    _bound(field, value, edge) {
        if (field !== 'month') {
            return value;
        }

        return value.slice(0, 7);
    },

    _filter(rows, field, range) {
        if (!field || (!range.from && !range.to)) {
            return rows;
        }

        const from = range.from ? this._bound(field, range.from) : null;
        const to = range.to ? this._bound(field, range.to) : null;

        return rows
            .filter((row) => {
                const value = row[field] || '';

                if (from && value < from) return false;
                if (to && value > to) return false;

                return Boolean(value);
            })
            .sort((a, b) => String(a[field]).localeCompare(String(b[field])));
    },

    async put(name, id, data) {
        const key = id || uid();

        if (this.mode === 'local') {
            const rows = this._local(name);
            const index = rows.findIndex((row) => row.id === key);
            const record = { ...data, id: key };

            if (index >= 0) {
                rows[index] = record;
            } else {
                rows.push(record);
            }

            this._saveLocal(name, rows);

            return record;
        }

        const { doc, setDoc } = this._fs;
        await setDoc(doc(this._db, name, key), data, { merge: true });

        return { ...data, id: key };
    },

    /** Menulis banyak baris sekaligus — dipakai pengimpor Excel. */
    async putMany(name, records) {
        if (this.mode === 'local') {
            const rows = this._local(name);

            for (const record of records) {
                const key = record.id || uid();
                const index = rows.findIndex((row) => row.id === key);
                const value = { ...record, id: key };

                if (index >= 0) {
                    rows[index] = value;
                } else {
                    rows.push(value);
                }
            }

            this._saveLocal(name, rows);

            return records.length;
        }

        const { doc, writeBatch } = this._fs;

        // Firestore membatasi 500 operasi per batch; pengimpor bisa membawa
        // lebih dari itu dalam satu berkas bulanan.
        let written = 0;

        for (let i = 0; i < records.length; i += 400) {
            const batch = writeBatch(this._db);

            for (const record of records.slice(i, i + 400)) {
                const { id, ...data } = record;
                batch.set(doc(this._db, name, id || uid()), data, { merge: true });
            }

            await batch.commit();
            written += Math.min(400, records.length - i);
        }

        return written;
    },

    async remove(name, id) {
        if (this.mode === 'local') {
            this._saveLocal(name, this._local(name).filter((row) => row.id !== id));

            return;
        }

        const { doc, deleteDoc } = this._fs;
        await deleteDoc(doc(this._db, name, id));
    },

    /* ----------------------------------------------------------- lokal */

    _local(name) {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_PREFIX + name) || '[]');
        } catch {
            return [];
        }
    },

    _saveLocal(name, rows) {
        try {
            localStorage.setItem(LOCAL_PREFIX + name, JSON.stringify(rows));
        } catch (error) {
            throw new Error('Penyimpanan peramban penuh atau diblokir. Data terakhir tidak tersimpan.');
        }
    },
};
