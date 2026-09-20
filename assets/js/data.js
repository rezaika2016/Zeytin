/*
 * Pengambilan data untuk satu rentang tanggal.
 *
 * Dipisah supaya dasbor, halaman laporan, dan pengekspor menarik data
 * dengan cara yang persis sama. Kalau tiap halaman mengambil sendiri-
 * sendiri, cepat atau lambat ada yang lupa menyaring rentangnya dan
 * angkanya berbeda antar halaman tanpa ada yang sadar.
 */

import { store } from './store.js';
import { periodReport } from './ledger.js';

export async function loadPeriod(from, to) {
    const [days, expenses, transfers, payroll, outstanding] = await Promise.all([
        store.list('days', { from, to }),
        store.list('expenses', { from, to }),
        store.list('transfers', { from, to }),
        store.list('payroll', { from, to }),
        // Tagihan belum dibayar tidak dibatasi rentang: yang belum lunas
        // dari bulan lalu tetap kewajiban hari ini.
        store.list('outstanding'),
    ]);

    const data = { days, expenses, transfers, payroll, outstanding };

    return { data, report: periodReport(data, from, to) };
}
