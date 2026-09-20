/*
 * Data contoh untuk mode lokal.
 *
 * Angkanya karangan, bukan angka Zeytin yang sebenarnya — repo ini publik,
 * dan omzet serta gaji sungguhan tidak boleh ikut terbit. Bentuk kolomnya
 * yang ditiru, bukan isinya.
 *
 * Hanya aktif kalau Firebase belum disiapkan DAN alamatnya diberi `?demo`.
 * Begitu config.js terisi, berkas ini tidak pernah berjalan lagi.
 */

import { store } from './store.js';
import { lineTotal } from './ledger.js';
import { uid } from './util.js';

const VENDORS = ['Anadolu Meat', 'Pasar Segar', 'Bosphorus Dairy', 'Istanbul Spice', 'Bali Fresh'];
const ITEMS = ['Lamb shank', 'Chicken breast', 'Yoghurt 5kg', 'Bulgur sack', 'Tomato crate', 'Gas 50kg'];

export async function seedDemo() {
    const existing = await store.list('days');

    if (existing.length) {
        return false;
    }

    const days = [];
    const expenses = [];
    const transfers = [];

    const start = new Date();
    start.setDate(start.getDate() - 44);

    // Deret angka yang bisa diulang, bukan acak: dua kali membuka halaman
    // harus memberi angka yang sama, supaya tampilannya bisa dibandingkan.
    let seed = 7;
    const next = (max) => {
        seed = (seed * 1103515245 + 12345) % 2147483648;

        return seed % max;
    };

    for (let i = 0; i < 45; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);

        const pad = (n) => String(n).padStart(2, '0');
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        const busy = weekend ? 1.6 : 1;

        days.push({
            id: date,
            date,
            pettyCash: 50000 + next(50) * 1000,
            cash: Math.round((900000 + next(2200) * 1000) * busy),
            bni: Math.round((1800000 + next(6000) * 1000) * busy),
            grabFood: next(4) === 0 ? 0 : next(900) * 1000,
            goFood: next(5) === 0 ? 0 : next(600) * 1000,
            goPay: next(6) === 0 ? 0 : next(400) * 1000,
            note: '',
        });

        for (let e = 0, count = 1 + next(4); e < count; e++) {
            const row = {
                id: uid(),
                date,
                vendor: VENDORS[next(VENDORS.length)],
                item: ITEMS[next(ITEMS.length)],
                qty: 1 + next(5),
                unit: 'pack',
                price: 25000 + next(300) * 1000,
                disc: 0,
                tax: 0,
            };

            expenses.push({ ...row, total: lineTotal(row) });
        }

        if (next(4) === 0) {
            const qty = 1 + next(3);
            const price = 400000 + next(2500) * 1000;

            transfers.push({
                id: uid(),
                date,
                vendor: VENDORS[next(VENDORS.length)],
                item: ITEMS[next(ITEMS.length)],
                unit: 'kg',
                qty,
                price,
                total: qty * price,
                method: 'Transfer',
                status: next(3) === 0 ? 'ASLAN PAID' : 'PT KEBAP PAID',
            });
        }
    }

    const month = days[days.length - 1].date.slice(0, 7);

    const payroll = [
        { id: uid(), month, section: 'Front Staff', name: 'Ayu', basic: 4500000, bpjs: 0, grandTotal: 4500000 },
        { id: uid(), month, section: 'Front Staff', name: 'Silia', basic: 3215102, bpjs: 106030, grandTotal: 3109072 },
        { id: uid(), month, section: 'Kitchen Staff', name: 'Yulia', basic: 3332281, bpjs: 106030, grandTotal: 3226251 },
        { id: uid(), month, section: 'Kitchen Staff', name: 'Dian', basic: 4399038, bpjs: 0, grandTotal: 4399038 },
    ];

    const outstanding = [
        { id: uid(), date: days[30].date, dueDate: days[40].date, vendor: VENDORS[0], item: 'Lamb shank', qty: 4, price: 2806000, disc: 0, tax: 0, total: 11224000, status: 'Need the payment' },
        { id: uid(), date: days[35].date, dueDate: days[44].date, vendor: VENDORS[3], item: 'Bulgur sack', qty: 2, price: 740000, disc: 0, tax: 0, total: 1480000, status: 'Waiting the payment' },
    ];

    const suppliers = VENDORS.map((name, i) => ({
        id: uid(),
        name,
        contact: `08${(12 + i)}-1000-200${i}`,
        item: ITEMS[i] || '',
        price: 100000 + i * 25000,
        bank: i % 2 ? 'BCA' : 'BNI',
        account: `14${i}0${i}46387`,
        accountName: `${name} Bali`,
        method: i % 2 ? 'Transfer' : 'COD',
    }));

    await Promise.all([
        store.putMany('days', days),
        store.putMany('expenses', expenses),
        store.putMany('transfers', transfers),
        store.putMany('payroll', payroll),
        store.putMany('outstanding', outstanding),
        store.putMany('suppliers', suppliers),
    ]);

    return true;
}
