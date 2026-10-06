// ==========================================
// KONTRANKU - SISTEM MANAJEMEN KONTRAKAN
// script.js (versi lengkap, cocok dengan index.html terbaru)
// ==========================================


// ==========================================
// DATA (disimpan di localStorage browser)
// ==========================================

function muat(key, awal) {

    try {
        const nilai = JSON.parse(localStorage.getItem(key));
        return nilai === null || nilai === undefined ? awal : nilai;
    } catch (error) {
        return awal;
    }

}

function simpan(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

let transactions = muat("kk_transactions", []);
let listrikData = muat("kk_listrik", []);
let wifiInfo = muat("kk_wifiInfo", {
    provider: "",
    cost: 0,
    dueDate: "",
    status: "Aktif"
});
let wifiPayments = muat("kk_wifiPayments", []);
let berasData = muat("kk_beras", []);
let pembelianData = muat("kk_pembelian", []);
let penghuniData = muat("kk_penghuni", []);
let tugasData = muat("kk_tugas", []);

function simpanSemua() {
    simpan("kk_transactions", transactions);
    simpan("kk_listrik", listrikData);
    simpan("kk_wifiInfo", wifiInfo);
    simpan("kk_wifiPayments", wifiPayments);
    simpan("kk_beras", berasData);
    simpan("kk_pembelian", pembelianData);
    simpan("kk_penghuni", penghuniData);
    simpan("kk_tugas", tugasData);
}


// ==========================================
// FUNGSI BANTU
// ==========================================

const $ = function (id) {
    return document.getElementById(id);
};

function setTeks(id, teks) {
    const element = $(id);
    if (element) {
        element.textContent = teks;
    }
}

function esc(teks) {
    return String(teks === null || teks === undefined ? "" : teks)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ID unik (tidak pernah kembar walau dibuat bersamaan)
let idTerakhir = 0;

function buatId() {
    let id = Date.now();
    if (id <= idTerakhir) {
        id = idTerakhir + 1;
    }
    idTerakhir = id;
    return id;
}

function formatLokal(tanggal) {
    return tanggal.getFullYear() + "-" +
        String(tanggal.getMonth() + 1).padStart(2, "0") + "-" +
        String(tanggal.getDate()).padStart(2, "0");
}

function hariIni() {
    return formatLokal(new Date());
}

function bulanIni() {
    return hariIni().slice(0, 7);
}

function awalMinggu() {
    const tanggal = new Date();
    tanggal.setDate(tanggal.getDate() - tanggal.getDay());
    return formatLokal(tanggal);
}

function formatRupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(angka) || 0);
}

function formatKg(angka) {
    return (Number(angka) || 0).toLocaleString("id-ID", {
        maximumFractionDigits: 2
    }) + " kg";
}

function formatDate(tanggal) {

    if (!tanggal) {
        return "-";
    }

    const objek = new Date(tanggal + "T00:00:00");

    if (Number.isNaN(objek.getTime())) {
        return "-";
    }

    return objek.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

function jumlahkan(daftar, ambil) {
    return daftar.reduce(function (total, item) {
        return total + (Number(ambil(item)) || 0);
    }, 0);
}

function urutTanggalBaru(a, b) {
    if (a.date === b.date) {
        return b.id - a.id;
    }
    return String(b.date || "").localeCompare(String(a.date || ""));
}

function barisKosong(kolom, teks) {
    return `
        <tr>
            <td colspan="${kolom}" style="text-align:center; padding:30px; color:#999;">
                ${teks}
            </td>
        </tr>
    `;
}

// Notifikasi kecil di bawah layar
function toast(pesan) {

    const element = document.createElement("div");

    element.className = "toast";
    element.textContent = pesan;

    document.body.appendChild(element);

    setTimeout(function () {
        element.classList.add("hilang");
    }, 2200);

    setTimeout(function () {
        element.remove();
    }, 2700);

}

function bukaModal(id) {
    const modal = $(id);
    if (modal) {
        modal.classList.add("show");
    }
}

function tutupModal(id) {
    const modal = $(id);
    if (modal) {
        modal.classList.remove("show");
    }
}

// Klik area gelap atau tekan Esc untuk menutup modal
document.querySelectorAll(".modal").forEach(function (modal) {

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.classList.remove("show");
        }
    });

});

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        document.querySelectorAll(".modal.show").forEach(function (modal) {
            modal.classList.remove("show");
        });
    }

});


// ==========================================
// NAVIGASI
// ==========================================

function gotoPage(nama) {

    document.querySelectorAll(".menu-link").forEach(function (link) {
        link.classList.toggle("active", link.dataset.page === nama);
    });

    document.querySelectorAll(".page").forEach(function (page) {
        page.classList.toggle("active-page", page.id === nama + "-page");
    });

    if (nama === "dashboard") {
        updateKasChart();
    }

    window.scrollTo(0, 0);

}

document.querySelectorAll(".menu-link").forEach(function (link) {

    link.addEventListener("click", function (event) {
        event.preventDefault();
        if (link.dataset.page) {
            gotoPage(link.dataset.page);
        }
    });

});

document.querySelectorAll(".quick-card[data-page]").forEach(function (kartu) {

    kartu.addEventListener("click", function () {
        gotoPage(kartu.dataset.page);
    });

});

const tombolLihatSemua = $("lihatSemuaKas");

if (tombolLihatSemua) {
    tombolLihatSemua.addEventListener("click", function () {
        gotoPage("kas");
    });
}


// ==========================================
// 💰 KAS
// ==========================================

function tambahKasTerkait(sumber, refId, tanggal, kategori, jumlah, keterangan) {

    transactions.push({
        id: buatId(),
        type: "pengeluaran",
        description: keterangan,
        category: kategori,
        amount: jumlah,
        date: tanggal,
        source: sumber,
        refId: refId
    });

}

function urutkanTransaksi() {
    return transactions.slice().sort(urutTanggalBaru);
}

function updateKas() {

    const pemasukan = jumlahkan(
        transactions.filter(function (t) { return t.type === "pemasukan"; }),
        function (t) { return t.amount; }
    );

    const pengeluaran = jumlahkan(
        transactions.filter(function (t) { return t.type !== "pemasukan"; }),
        function (t) { return t.amount; }
    );

    setTeks("saldoKas", formatRupiah(pemasukan - pengeluaran));
    setTeks("totalPemasukan", formatRupiah(pemasukan));
    setTeks("totalPengeluaran", formatRupiah(pengeluaran));
    setTeks("dashboardSaldo", formatRupiah(pemasukan - pengeluaran));

    renderTransactions();
    renderDashboardTransactions();

}

function renderTransactions() {

    const table = $("transactionTable");

    if (!table) return;

    if (transactions.length === 0) {
        table.innerHTML = barisKosong(6, "Belum ada transaksi");
        return;
    }

    table.innerHTML = urutkanTransaksi().map(function (t) {

        const masuk = t.type === "pemasukan";

        return `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td>${esc(t.description) || "-"}</td>
                <td>${esc(t.category) || "-"}</td>
                <td>${masuk ? "Pemasukan" : "Pengeluaran"}</td>
                <td class="${masuk ? "income-text" : "expense-text"}">
                    ${masuk ? "+" : "-"} ${formatRupiah(t.amount)}
                </td>
                <td>
                    <button class="delete-button" onclick="deleteTransaction(${t.id})">
                        Hapus
                    </button>
                </td>
            </tr>
        `;

    }).join("");

}

function renderDashboardTransactions() {

    const container = $("dashboardTransactions");

    if (!container) return;

    if (transactions.length === 0) {

        container.classList.add("empty");

        container.innerHTML = `
            <div class="empty-icon">💰</div>
            <h3>Belum ada transaksi</h3>
            <p>Transaksi kas akan muncul di sini.</p>
        `;

        return;

    }

    container.classList.remove("empty");

    container.innerHTML = urutkanTransaksi().slice(0, 5).map(function (t) {

        const masuk = t.type === "pemasukan";

        return `
            <div class="dashboard-transaksi-item">
                <div>
                    <strong>${esc(t.description) || "Transaksi"}</strong>
                    <small>${esc(t.category) || "-"} • ${formatDate(t.date)}</small>
                </div>
                <strong class="${masuk ? "income-text" : "expense-text"}">
                    ${masuk ? "+" : "-"} ${formatRupiah(t.amount)}
                </strong>
            </div>
        `;

    }).join("");

}

function deleteTransaction(id) {

    const transaksi = transactions.find(function (t) { return t.id === id; });

    if (!transaksi) return;

    const pesan = transaksi.source
        ? "Transaksi ini berasal dari halaman lain. Data aslinya juga akan dihapus. Lanjutkan?"
        : "Yakin ingin menghapus transaksi ini?";

    if (!confirm(pesan)) return;

    // Hapus data asal (listrik / wifi / pembelian) kalau ada
    if (transaksi.source === "listrik") {
        listrikData = listrikData.filter(function (d) { return d.id !== transaksi.refId; });
    } else if (transaksi.source === "wifi") {
        wifiPayments = wifiPayments.filter(function (d) { return d.id !== transaksi.refId; });
    } else if (transaksi.source === "pembelian") {
        pembelianData = pembelianData.filter(function (d) { return d.id !== transaksi.refId; });
    }

    transactions = transactions.filter(function (t) { return t.id !== id; });

    simpanSemua();
    renderSemua();

}

const modalKas = $("transactionModal");
const formKas = $("transactionForm");

if ($("tambahTransaksiBtn")) {
    $("tambahTransaksiBtn").addEventListener("click", function () {
        if ($("transactionDate")) {
            $("transactionDate").value = hariIni();
        }
        bukaModal("transactionModal");
    });
}

if ($("closeModal")) {
    $("closeModal").addEventListener("click", function () {
        tutupModal("transactionModal");
    });
}

if (formKas) {

    formKas.addEventListener("submit", function (event) {

        event.preventDefault();

        const jumlah = Number($("transactionAmount").value);

        if (!jumlah || jumlah <= 0) {
            toast("Nominal transaksi harus lebih dari 0.");
            return;
        }

        transactions.push({
            id: buatId(),
            type: $("transactionType").value,
            description: $("transactionDescription").value.trim(),
            category: $("transactionCategory").value,
            amount: jumlah,
            date: $("transactionDate").value
        });

        simpan("kk_transactions", transactions);

        formKas.reset();
        tutupModal("transactionModal");

        renderSemua();

        toast("Transaksi berhasil disimpan.");

    });

}


// ==========================================
// ⚡ LISTRIK
// ==========================================

function renderListrik() {

    const table = $("listrikTable");

    const bulanIniTotal = jumlahkan(
        listrikData.filter(function (d) { return String(d.date).slice(0, 7) === bulanIni(); }),
        function (d) { return d.amount; }
    );

    const terakhir = listrikData.slice().sort(urutTanggalBaru)[0];

    setTeks("listrikBulanIni", formatRupiah(bulanIniTotal));
    setTeks("listrikTerakhir", terakhir ? formatDate(terakhir.date) : "-");
    setTeks("jumlahPembelianListrik", listrikData.length);

    if (!table) return;

    if (listrikData.length === 0) {
        table.innerHTML = barisKosong(4, "Belum ada pembelian listrik");
        return;
    }

    table.innerHTML = listrikData.slice().sort(urutTanggalBaru).map(function (d) {

        return `
            <tr>
                <td>${formatDate(d.date)}</td>
                <td>${esc(d.description) || "-"}</td>
                <td>${formatRupiah(d.amount)}</td>
                <td>
                    <button class="delete-btn" onclick="hapusListrik(${d.id})">Hapus</button>
                </td>
            </tr>
        `;

    }).join("");

}

if ($("tambahListrikBtn")) {
    $("tambahListrikBtn").addEventListener("click", function () {
        $("listrikDate").value = hariIni();
        bukaModal("listrikModal");
    });
}

if ($("closeListrikModal")) {
    $("closeListrikModal").addEventListener("click", function () {
        tutupModal("listrikModal");
    });
}

if ($("listrikForm")) {

    $("listrikForm").addEventListener("submit", function (event) {

        event.preventDefault();

        const jumlah = Number($("listrikAmount").value);

        if (!jumlah || jumlah <= 0) {
            toast("Nominal listrik harus lebih dari 0.");
            return;
        }

        const data = {
            id: buatId(),
            date: $("listrikDate").value,
            amount: jumlah,
            description: $("listrikDescription").value.trim() || "Token listrik"
        };

        listrikData.push(data);

        tambahKasTerkait("listrik", data.id, data.date, "Listrik", data.amount, data.description);

        simpanSemua();

        $("listrikForm").reset();
        tutupModal("listrikModal");

        renderSemua();

        toast("Pembelian listrik disimpan dan masuk ke Kas.");

    });

}

function hapusListrik(id) {

    if (!confirm("Yakin ingin menghapus data listrik ini?")) return;

    listrikData = listrikData.filter(function (d) { return d.id !== id; });

    transactions = transactions.filter(function (t) {
        return !(t.source === "listrik" && t.refId === id);
    });

    simpanSemua();
    renderSemua();

}


// ==========================================
// 📶 WI-FI
// ==========================================

function renderWifi() {

    setTeks("wifiStatus", wifiInfo.status || "Aktif");
    setTeks("wifiProvider", wifiInfo.provider || "-");
    setTeks("wifiCost", formatRupiah(wifiInfo.cost));
    setTeks("wifiDueDate", formatDate(wifiInfo.dueDate));

    const table = $("wifiPaymentTable");

    if (!table) return;

    if (wifiPayments.length === 0) {
        table.innerHTML = barisKosong(5, "Belum ada pembayaran Wi-Fi");
        return;
    }

    table.innerHTML = wifiPayments.slice().sort(urutTanggalBaru).map(function (p) {

        const lunas = p.status === "Lunas";

        return `
            <tr>
                <td>${formatDate(p.date)}</td>
                <td>${esc(p.provider || wifiInfo.provider) || "-"}</td>
                <td>${formatRupiah(p.amount)}</td>
                <td><span class="badge ${lunas ? "green" : "orange"}">${esc(p.status)}</span></td>
                <td>
                    <button class="delete-btn" onclick="hapusWifiPayment(${p.id})">Hapus</button>
                </td>
            </tr>
        `;

    }).join("");

}

function openWifiModal() {

    $("wifiProviderInput").value = wifiInfo.provider || "";
    $("wifiCostInput").value = wifiInfo.cost || "";
    $("wifiDueDateInput").value = wifiInfo.dueDate || "";
    $("wifiStatusInput").value = wifiInfo.status || "Aktif";

    bukaModal("wifiModal");

}

function closeWifiModal() {
    tutupModal("wifiModal");
}

function saveWifiInfo() {

    wifiInfo = {
        provider: $("wifiProviderInput").value.trim(),
        cost: Number($("wifiCostInput").value) || 0,
        dueDate: $("wifiDueDateInput").value,
        status: $("wifiStatusInput").value
    };

    simpan("kk_wifiInfo", wifiInfo);

    closeWifiModal();
    renderSemua();

    toast("Informasi Wi-Fi disimpan.");

}

function openWifiPaymentModal() {

    $("wifiPaymentDate").value = hariIni();
    $("wifiPaymentAmount").value = wifiInfo.cost || "";
    $("wifiPaymentStatus").value = "Lunas";

    bukaModal("wifiPaymentModal");

}

function closeWifiPaymentModal() {
    tutupModal("wifiPaymentModal");
}

function saveWifiPayment() {

    const jumlah = Number($("wifiPaymentAmount").value);
    const tanggal = $("wifiPaymentDate").value;

    if (!tanggal) {
        toast("Tanggal pembayaran harus diisi.");
        return;
    }

    if (!jumlah || jumlah <= 0) {
        toast("Jumlah pembayaran harus lebih dari 0.");
        return;
    }

    const pembayaran = {
        id: buatId(),
        date: tanggal,
        amount: jumlah,
        status: $("wifiPaymentStatus").value,
        provider: wifiInfo.provider
    };

    wifiPayments.push(pembayaran);

    // Hanya pembayaran yang lunas masuk sebagai pengeluaran Kas
    if (pembayaran.status === "Lunas") {
        tambahKasTerkait("wifi", pembayaran.id, tanggal, "Wi-Fi", jumlah, "Pembayaran Wi-Fi");
    }

    simpanSemua();

    closeWifiPaymentModal();
    renderSemua();

    toast("Pembayaran Wi-Fi disimpan.");

}

function hapusWifiPayment(id) {

    if (!confirm("Yakin ingin menghapus pembayaran Wi-Fi ini?")) return;

    wifiPayments = wifiPayments.filter(function (p) { return p.id !== id; });

    transactions = transactions.filter(function (t) {
        return !(t.source === "wifi" && t.refId === id);
    });

    simpanSemua();
    renderSemua();

}


// ==========================================
// 🍚 BERAS
// ==========================================

let jenisBeras = "masuk";

function getStokBeras(daftar) {

    const sumber = daftar || berasData;

    return sumber.reduce(function (stok, d) {
        const jumlah = Number(d.amount) || 0;
        return d.type === "masuk" ? stok + jumlah : stok - jumlah;
    }, 0);

}

function renderBeras() {

    const masuk = jumlahkan(
        berasData.filter(function (d) { return d.type === "masuk"; }),
        function (d) { return d.amount; }
    );

    const terpakai = jumlahkan(
        berasData.filter(function (d) { return d.type === "pakai"; }),
        function (d) { return d.amount; }
    );

    setTeks("stokBeras", formatKg(masuk - terpakai));
    setTeks("totalBerasMasuk", formatKg(masuk));
    setTeks("totalBerasTerpakai", formatKg(terpakai));

    const table = $("berasTable");

    if (!table) return;

    if (berasData.length === 0) {
        table.innerHTML = barisKosong(5, "Belum ada data beras");
        return;
    }

    table.innerHTML = berasData.slice().sort(urutTanggalBaru).map(function (d) {

        const isMasuk = d.type === "masuk";

        return `
            <tr>
                <td>${formatDate(d.date)}</td>
                <td>
                    <span class="badge ${isMasuk ? "green" : "orange"}">
                        ${isMasuk ? "Masuk" : "Dipakai"}
                    </span>
                </td>
                <td class="${isMasuk ? "income-text" : "expense-text"}">
                    ${isMasuk ? "+" : "-"} ${formatKg(d.amount)}
                </td>
                <td>${esc(d.description) || "-"}</td>
                <td>
                    <button class="delete-btn" onclick="hapusBeras(${d.id})">Hapus</button>
                </td>
            </tr>
        `;

    }).join("");

}

function openBerasModal(jenis) {

    jenisBeras = jenis === "pakai" ? "pakai" : "masuk";

    setTeks(
        "berasModalTitle",
        jenisBeras === "masuk" ? "🍚 Tambah Beras" : "🍚 Catat Pemakaian"
    );

    $("berasDate").value = hariIni();
    $("berasAmount").value = "";
    $("berasDescription").value = "";

    bukaModal("berasModal");

}

function closeBerasModal() {
    tutupModal("berasModal");
}

function saveBeras() {

    const jumlah = Number($("berasAmount").value);
    const tanggal = $("berasDate").value;

    if (!tanggal) {
        toast("Tanggal harus diisi.");
        return;
    }

    if (!jumlah || jumlah <= 0) {
        toast("Jumlah beras harus lebih dari 0 kg.");
        return;
    }

    if (jenisBeras === "pakai" && jumlah > getStokBeras()) {
        toast("Stok beras tidak cukup. Stok saat ini " + formatKg(getStokBeras()) + ".");
        return;
    }

    berasData.push({
        id: buatId(),
        date: tanggal,
        type: jenisBeras,
        amount: jumlah,
        description: $("berasDescription").value.trim()
    });

    simpan("kk_beras", berasData);

    closeBerasModal();
    renderSemua();

    toast("Data beras disimpan.");

}

function hapusBeras(id) {

    if (!confirm("Yakin ingin menghapus data beras ini?")) return;

    const sisa = berasData.filter(function (d) { return d.id !== id; });

    if (getStokBeras(sisa) < 0) {
        toast("Tidak bisa dihapus karena stok akan menjadi minus.");
        return;
    }

    berasData = sisa;

    simpan("kk_beras", berasData);
    renderSemua();

}


// ==========================================
// 🛒 PEMBELIAN
// ==========================================

function renderPembelian() {

    setTeks("totalPembelian", formatRupiah(jumlahkan(pembelianData, function (d) { return d.harga; })));
    setTeks("jumlahPembelian", pembelianData.length);

    const terakhir = pembelianData.slice().sort(urutTanggalBaru)[0];

    setTeks("pembelianTerakhir", terakhir ? formatDate(terakhir.date) : "-");

    const table = $("pembelianTable");

    if (!table) return;

    if (pembelianData.length === 0) {
        table.innerHTML = barisKosong(7, "Belum ada data pembelian");
        return;
    }

    table.innerHTML = pembelianData.slice().sort(urutTanggalBaru).map(function (d) {

        return `
            <tr>
                <td>${formatDate(d.date)}</td>
                <td>${esc(d.barang)}</td>
                <td>${esc(d.kategori) || "-"}</td>
                <td>${d.jumlah}</td>
                <td>${formatRupiah(d.harga)}</td>
                <td>${esc(d.keterangan) || "-"}</td>
                <td>
                    <button class="delete-btn" onclick="hapusPembelian(${d.id})">Hapus</button>
                </td>
            </tr>
        `;

    }).join("");

}

function openPembelianModal() {

    $("pembelianDate").value = hariIni();
    $("pembelianBarang").value = "";
    $("pembelianKategori").value = "";
    $("pembelianJumlah").value = "";
    $("pembelianHarga").value = "";
    $("pembelianKeterangan").value = "";

    bukaModal("pembelianModal");

}

function closePembelianModal() {
    tutupModal("pembelianModal");
}

function savePembelian() {

    const tanggal = $("pembelianDate").value;
    const barang = $("pembelianBarang").value.trim();
    const jumlah = Number($("pembelianJumlah").value);
    const harga = Number($("pembelianHarga").value);

    if (!tanggal) {
        toast("Tanggal harus diisi.");
        return;
    }

    if (!barang) {
        toast("Nama barang harus diisi.");
        return;
    }

    if (!jumlah || jumlah <= 0) {
        toast("Jumlah barang harus lebih dari 0.");
        return;
    }

    if (!harga || harga <= 0) {
        toast("Total harga harus lebih dari 0.");
        return;
    }

    const data = {
        id: buatId(),
        date: tanggal,
        barang: barang,
        kategori: $("pembelianKategori").value || "Lainnya",
        jumlah: jumlah,
        harga: harga,
        keterangan: $("pembelianKeterangan").value.trim()
    };

    pembelianData.push(data);

    tambahKasTerkait("pembelian", data.id, tanggal, "Belanja", harga, "Pembelian " + barang);

    simpanSemua();

    closePembelianModal();
    renderSemua();

    toast("Pembelian disimpan dan masuk ke Kas.");

}

function hapusPembelian(id) {

    if (!confirm("Yakin ingin menghapus data pembelian ini?")) return;

    pembelianData = pembelianData.filter(function (d) { return d.id !== id; });

    transactions = transactions.filter(function (t) {
        return !(t.source === "pembelian" && t.refId === id);
    });

    simpanSemua();
    renderSemua();

}


// ==========================================
// 👥 PENGHUNI
// ==========================================

let editPenghuniId = null;

function penghuniAktifList() {
    return penghuniData.filter(function (p) { return p.status === "Aktif"; });
}

function renderPenghuni() {

    const aktif = penghuniAktifList();

    const kamarTerisi = new Set(
        aktif
            .map(function (p) { return (p.kamar || "").trim().toLowerCase(); })
            .filter(function (k) { return k !== ""; })
    ).size;

    setTeks("totalPenghuni", penghuniData.length);
    setTeks("kamarTerisi", kamarTerisi);
    setTeks("penghuniAktif", aktif.length);

    const table = $("penghuniTable");

    if (!table) return;

    if (penghuniData.length === 0) {
        table.innerHTML = barisKosong(7, "Belum ada data penghuni");
        return;
    }

    table.innerHTML = penghuniData.slice().reverse().map(function (p) {

        const isAktif = p.status === "Aktif";

        return `
            <tr>
                <td><strong>${esc(p.nama)}</strong></td>
                <td>${esc(p.kamar) || "-"}</td>
                <td>${esc(p.hp) || "-"}</td>
                <td>${formatDate(p.tanggal)}</td>
                <td>
                    <span class="${isAktif ? "status-aktif" : "status-tidak-aktif"}">
                        ${esc(p.status)}
                    </span>
                </td>
                <td>${esc(p.keterangan) || "-"}</td>
                <td class="aksi-cell">
                    <button class="edit-btn" onclick="openPenghuniModal(${p.id})">Edit</button>
                    <button class="delete-btn" onclick="hapusPenghuni(${p.id})">Hapus</button>
                </td>
            </tr>
        `;

    }).join("");

}

function openPenghuniModal(id) {

    editPenghuniId = id || null;

    const data = id
        ? penghuniData.find(function (p) { return p.id === id; })
        : null;

    setTeks("penghuniModalTitle", data ? "👤 Edit Penghuni" : "👤 Tambah Penghuni");

    $("penghuniNama").value = data ? data.nama : "";
    $("penghuniKamar").value = data ? data.kamar : "";
    $("penghuniHp").value = data ? data.hp : "";
    $("penghuniTanggal").value = data ? data.tanggal : hariIni();
    $("penghuniStatus").value = data ? data.status : "Aktif";
    $("penghuniKeterangan").value = data ? data.keterangan : "";

    bukaModal("penghuniModal");

}

function closePenghuniModal() {
    tutupModal("penghuniModal");
}

function savePenghuni() {

    const nama = $("penghuniNama").value.trim();

    if (!nama) {
        toast("Nama penghuni harus diisi.");
        return;
    }

    const data = {
        id: editPenghuniId || buatId(),
        nama: nama,
        kamar: $("penghuniKamar").value.trim(),
        hp: $("penghuniHp").value.trim(),
        tanggal: $("penghuniTanggal").value,
        status: $("penghuniStatus").value,
        keterangan: $("penghuniKeterangan").value.trim()
    };

    if (editPenghuniId) {
        penghuniData = penghuniData.map(function (p) {
            return p.id === editPenghuniId ? data : p;
        });
    } else {
        penghuniData.push(data);
    }

    simpan("kk_penghuni", penghuniData);

    closePenghuniModal();
    renderSemua();

    toast(editPenghuniId ? "Data penghuni diperbarui." : "Penghuni ditambahkan.");

    editPenghuniId = null;

}

function hapusPenghuni(id) {

    if (!confirm("Yakin ingin menghapus data penghuni ini?")) return;

    penghuniData = penghuniData.filter(function (p) { return p.id !== id; });

    simpan("kk_penghuni", penghuniData);
    renderSemua();

}


// ==========================================
// 📋 TUGAS
// ==========================================

let editTugasId = null;

function tugasBelumList() {
    return tugasData.filter(function (t) { return t.status !== "Selesai"; });
}

function renderTugas() {

    const belum = tugasBelumList().length;

    setTeks("totalTugas", tugasData.length);
    setTeks("tugasBelumSelesai", belum);
    setTeks("tugasSelesai", tugasData.length - belum);

    const table = $("tugasTable");

    if (!table) return;

    if (tugasData.length === 0) {
        table.innerHTML = barisKosong(6, "Belum ada tugas");
        return;
    }

    // Tugas yang belum selesai ditampilkan paling atas
    const urut = tugasData.slice().sort(function (a, b) {

        const selesaiA = a.status === "Selesai" ? 1 : 0;
        const selesaiB = b.status === "Selesai" ? 1 : 0;

        if (selesaiA !== selesaiB) {
            return selesaiA - selesaiB;
        }

        return String(a.deadline || "9999").localeCompare(String(b.deadline || "9999"));

    });

    table.innerHTML = urut.map(function (t) {

        const selesai = t.status === "Selesai";
        const prioritas = (t.prioritas || "Sedang").toLowerCase();

        return `
            <tr>
                <td><strong>${esc(t.nama)}</strong></td>
                <td>${esc(t.pj) || "-"}</td>
                <td>${formatDate(t.deadline)}</td>
                <td><span class="prioritas-${prioritas}">${esc(t.prioritas)}</span></td>
                <td>
                    <span class="tugas-status ${selesai ? "tugas-selesai" : "tugas-belum"}">
                        ${selesai ? "Selesai" : "Belum Selesai"}
                    </span>
                </td>
                <td class="aksi-cell">
                    <button class="action-btn" onclick="toggleTugas(${t.id})">
                        ${selesai ? "Batalkan" : "Selesai"}
                    </button>
                    <button class="edit-btn" onclick="openTugasModal(${t.id})">Edit</button>
                    <button class="delete-btn" onclick="hapusTugas(${t.id})">Hapus</button>
                </td>
            </tr>
        `;

    }).join("");

}

function openTugasModal(id) {

    editTugasId = id || null;

    const data = id
        ? tugasData.find(function (t) { return t.id === id; })
        : null;

    setTeks("tugasModalTitle", data ? "📋 Edit Tugas" : "📋 Tambah Tugas");

    $("tugasNama").value = data ? data.nama : "";
    $("tugasPenanggungJawab").value = data ? data.pj : "";
    $("tugasDeadline").value = data ? data.deadline : "";
    $("tugasPrioritas").value = data ? data.prioritas : "Sedang";

    bukaModal("tugasModal");

}

function closeTugasModal() {
    tutupModal("tugasModal");
}

function saveTugas() {

    const nama = $("tugasNama").value.trim();

    if (!nama) {
        toast("Nama tugas harus diisi.");
        return;
    }

    const lama = editTugasId
        ? tugasData.find(function (t) { return t.id === editTugasId; })
        : null;

    const data = {
        id: editTugasId || buatId(),
        nama: nama,
        pj: $("tugasPenanggungJawab").value.trim(),
        deadline: $("tugasDeadline").value,
        prioritas: $("tugasPrioritas").value,
        status: lama ? lama.status : "Belum"
    };

    if (editTugasId) {
        tugasData = tugasData.map(function (t) {
            return t.id === editTugasId ? data : t;
        });
    } else {
        tugasData.push(data);
    }

    simpan("kk_tugas", tugasData);

    closeTugasModal();
    renderSemua();

    toast(editTugasId ? "Tugas diperbarui." : "Tugas ditambahkan.");

    editTugasId = null;

}

function toggleTugas(id) {

    const tugas = tugasData.find(function (t) { return t.id === id; });

    if (!tugas) return;

    tugas.status = tugas.status === "Selesai" ? "Belum" : "Selesai";

    simpan("kk_tugas", tugasData);
    renderSemua();

}

function hapusTugas(id) {

    if (!confirm("Yakin ingin menghapus tugas ini?")) return;

    tugasData = tugasData.filter(function (t) { return t.id !== id; });

    simpan("kk_tugas", tugasData);
    renderSemua();

}


// ==========================================
// 🏠 DASHBOARD
// ==========================================

function setBadge(id, teks, warna) {

    const element = $(id);

    if (!element) return;

    element.textContent = teks;
    element.className = "badge " + warna;

}

function updateDashboard() {

    // Listrik
    const adaListrikBulanIni = listrikData.some(function (d) {
        return String(d.date).slice(0, 7) === bulanIni();
    });

    const teksListrik = adaListrikBulanIni ? "Terdata" : "Belum Ada";

    setTeks("dashboardListrik", teksListrik);
    setBadge("statusListrikDashboard", teksListrik, adaListrikBulanIni ? "green" : "orange");

    // Wi-Fi
    const lunasBulanIni = wifiPayments.some(function (p) {
        return p.status === "Lunas" && String(p.date).slice(0, 7) === bulanIni();
    });

    let teksWifi = "Belum Bayar";
    let warnaWifi = "orange";

    if (wifiInfo.status === "Mati") {
        teksWifi = "Mati";
    } else if (lunasBulanIni) {
        teksWifi = "Lunas";
        warnaWifi = "green";
    } else if (wifiPayments.length === 0 && !wifiInfo.provider) {
        teksWifi = "Belum Ada";
    }

    setTeks("dashboardWifi", teksWifi);
    setBadge("statusWifiDashboard", teksWifi, warnaWifi);

    // Beras
    const stok = getStokBeras();

    setTeks("dashboardBeras", formatKg(stok));
    setBadge("statusBerasDashboard", formatKg(stok), stok >= 5 ? "green" : "orange");

    // Penghuni dan tugas
    setTeks("dashboardPenghuni", penghuniAktifList().length);
    setTeks("dashboardTugas", tugasBelumList().length);

    // Keuangan bulan ini
    const bulanTransaksi = transactions.filter(function (t) {
        return String(t.date).slice(0, 7) === bulanIni();
    });

    const masuk = jumlahkan(
        bulanTransaksi.filter(function (t) { return t.type === "pemasukan"; }),
        function (t) { return t.amount; }
    );

    const keluar = jumlahkan(
        bulanTransaksi.filter(function (t) { return t.type !== "pemasukan"; }),
        function (t) { return t.amount; }
    );

    setTeks("dashboardPemasukanBulanIni", formatRupiah(masuk));
    setTeks("dashboardPengeluaranBulanIni", formatRupiah(keluar));
    setTeks("dashboardSaldoBulanIni", formatRupiah(masuk - keluar));

    renderAktivitas();

}

const IKON_KATEGORI = {
    "Listrik": "⚡",
    "Wi-Fi": "📶",
    "Beras": "🍚",
    "Belanja": "🛒",
    "Iuran": "💰",
    "Perbaikan": "🔧",
    "Lainnya": "📌"
};

function renderAktivitas() {

    const container = $("dashboardActivityList");

    if (!container) return;

    const aktivitas = [];

    transactions.forEach(function (t) {

        const masuk = t.type === "pemasukan";

        aktivitas.push({
            id: t.id,
            ikon: IKON_KATEGORI[t.category] || (masuk ? "💰" : "📤"),
            judul: t.description || t.category || "Transaksi",
            sub: "Kas • " + (t.category || "-"),
            date: t.date,
            jumlah: (masuk ? "+ " : "- ") + formatRupiah(t.amount),
            kelas: masuk ? "income" : "expense"
        });

    });

    berasData.forEach(function (d) {

        const masuk = d.type === "masuk";

        aktivitas.push({
            id: d.id,
            ikon: "🍚",
            judul: masuk ? "Beras masuk" : "Beras dipakai",
            sub: "Beras" + (d.description ? " • " + d.description : ""),
            date: d.date,
            jumlah: (masuk ? "+ " : "- ") + formatKg(d.amount),
            kelas: masuk ? "income" : "expense"
        });

    });

    penghuniData.forEach(function (p) {

        aktivitas.push({
            id: p.id,
            ikon: "👥",
            judul: "Penghuni: " + p.nama,
            sub: "Penghuni • " + (p.kamar || "tanpa kamar"),
            date: p.tanggal,
            jumlah: "",
            kelas: ""
        });

    });

    tugasData.forEach(function (t) {

        aktivitas.push({
            id: t.id,
            ikon: t.status === "Selesai" ? "✅" : "📋",
            judul: t.nama,
            sub: "Tugas • " + (t.status === "Selesai" ? "Selesai" : "Belum selesai"),
            date: t.deadline,
            jumlah: "",
            kelas: ""
        });

    });

    if (aktivitas.length === 0) {
        container.innerHTML = `<p class="activity-empty">Belum ada aktivitas.</p>`;
        return;
    }

    aktivitas.sort(function (a, b) { return b.id - a.id; });

    container.innerHTML = aktivitas.slice(0, 6).map(function (a) {

        return `
            <div class="activity-item">
                <div class="activity-icon">${a.ikon}</div>
                <div class="activity-info">
                    <strong>${esc(a.judul)}</strong>
                    <span>${esc(a.sub)}</span>
                    <small>${formatDate(a.date)}</small>
                </div>
                <div class="activity-amount ${a.kelas}">${esc(a.jumlah)}</div>
            </div>
        `;

    }).join("");

}


// ==========================================
// 📈 GRAFIK KEUANGAN
// ==========================================

let kasChart = null;

function updateKasChart() {

    const canvas = $("kasChart");

    if (!canvas || typeof Chart === "undefined") return;

    const periode = $("chartPeriod") ? $("chartPeriod").value : "all";

    const terfilter = transactions.filter(function (t) {

        const tanggal = String(t.date || "");

        if (periode === "today") return tanggal === hariIni();
        if (periode === "week") return tanggal >= awalMinggu() && tanggal <= hariIni();
        if (periode === "month") return tanggal.slice(0, 7) === bulanIni();

        return true;

    });

    const masuk = jumlahkan(
        terfilter.filter(function (t) { return t.type === "pemasukan"; }),
        function (t) { return t.amount; }
    );

    const keluar = jumlahkan(
        terfilter.filter(function (t) { return t.type !== "pemasukan"; }),
        function (t) { return t.amount; }
    );

    if (kasChart) {
        kasChart.destroy();
    }

    kasChart = new Chart(canvas.getContext("2d"), {

        type: "bar",

        data: {
            labels: ["Pemasukan", "Pengeluaran", "Saldo"],
            datasets: [{
                label: "Keuangan",
                data: [masuk, keluar, masuk - keluar],
                backgroundColor: ["#10a96b", "#e86d6d", "#5b4fcf"],
                borderRadius: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (nilai) {
                            return formatRupiah(nilai);
                        }
                    }
                }
            }
        }

    });

}

if ($("chartPeriod")) {
    $("chartPeriod").addEventListener("change", updateKasChart);
}


// ==========================================
// 📊 LAPORAN
// ==========================================

function updateLaporan() {

    const pemasukan = jumlahkan(
        transactions.filter(function (t) { return t.type === "pemasukan"; }),
        function (t) { return t.amount; }
    );

    const pengeluaran = jumlahkan(
        transactions.filter(function (t) { return t.type !== "pemasukan"; }),
        function (t) { return t.amount; }
    );

    const totalListrik = jumlahkan(listrikData, function (d) { return d.amount; });

    const totalWifi = jumlahkan(
        wifiPayments.filter(function (p) { return p.status === "Lunas"; }),
        function (p) { return p.amount; }
    );

    const totalPembelian = jumlahkan(pembelianData, function (d) { return d.harga; });

    setTeks("laporanSaldoKas", formatRupiah(pemasukan - pengeluaran));
    setTeks("laporanListrik", formatRupiah(totalListrik));
    setTeks("laporanWifi", formatRupiah(totalWifi));
    setTeks("laporanPembelian", formatRupiah(totalPembelian));

    setTeks("laporanBeras", formatKg(getStokBeras()));
    setTeks("laporanPenghuni", penghuniAktifList().length);
    setTeks("laporanTugas", tugasBelumList().length);
    setTeks("laporanTransaksi", transactions.length);

    setTeks("laporanPemasukan", formatRupiah(pemasukan));
    setTeks("laporanPengeluaran", formatRupiah(pengeluaran));
    setTeks("laporanSaldoAkhir", formatRupiah(pemasukan - pengeluaran));

    setTeks("kategoriListrik", formatRupiah(totalListrik));
    setTeks("kategoriWifi", formatRupiah(totalWifi));
    setTeks("kategoriPembelian", formatRupiah(totalPembelian));

}


// ==========================================
// ⚙️ PENGATURAN
// ==========================================

function terapkanNama() {

    const namaKontrakan = localStorage.getItem("kk_namaKontrakan") || "KontrakanKu";
    const namaKelompok = localStorage.getItem("kk_namaKelompok") || "Penghuni";

    setTeks("logoNama", namaKontrakan);
    setTeks("profileNama", namaKelompok);
    setTeks("avatarProfil", namaKelompok.charAt(0).toUpperCase());
    setTeks("welcomeText", "Selamat datang kembali di " + namaKontrakan);

    document.title = namaKontrakan;

}

function loadPengaturan() {

    if ($("namaKontrakan")) {
        $("namaKontrakan").value = localStorage.getItem("kk_namaKontrakan") || "KontrakanKu";
    }

    if ($("namaKelompok")) {
        $("namaKelompok").value = localStorage.getItem("kk_namaKelompok") || "Penghuni";
    }

    const gelap = localStorage.getItem("kk_darkMode") === "true";

    if ($("darkModeToggle")) {
        $("darkModeToggle").checked = gelap;
    }

    document.body.classList.toggle("dark-mode", gelap);

    terapkanNama();

}

function simpanPengaturan() {

    const namaKontrakan = $("namaKontrakan").value.trim() || "KontrakanKu";
    const namaKelompok = $("namaKelompok").value.trim() || "Penghuni";

    localStorage.setItem("kk_namaKontrakan", namaKontrakan);
    localStorage.setItem("kk_namaKelompok", namaKelompok);

    terapkanNama();

    toast("Pengaturan disimpan.");

}

function toggleDarkMode() {

    const aktif = $("darkModeToggle").checked;

    document.body.classList.toggle("dark-mode", aktif);

    localStorage.setItem("kk_darkMode", aktif);

}

function backupData() {

    const semua = {
        transactions: transactions,
        listrikData: listrikData,
        wifiInfo: wifiInfo,
        wifiPayments: wifiPayments,
        berasData: berasData,
        pembelianData: pembelianData,
        penghuniData: penghuniData,
        tugasData: tugasData,
        namaKontrakan: localStorage.getItem("kk_namaKontrakan"),
        namaKelompok: localStorage.getItem("kk_namaKelompok")
    };

    const blob = new Blob([JSON.stringify(semua, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "backup-kontrakanku-" + hariIni() + ".json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast("Backup berhasil dibuat.");

}

function hapusSemuaData() {

    const pertama = confirm(
        "PERINGATAN!\n\n" +
        "Semua data KontrakanKu akan dihapus.\n\n" +
        "Pastikan sudah membuat backup terlebih dahulu.\n\n" +
        "Lanjutkan?"
    );

    if (!pertama) return;

    if (!confirm("Apakah kamu benar-benar yakin ingin menghapus SEMUA DATA?")) return;

    Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf("kk_") === 0) {
            localStorage.removeItem(key);
        }
    });

    alert("Semua data berhasil dihapus. Halaman akan dimuat ulang.");

    location.reload();

}


// ==========================================
// 🚀 JALANKAN SEMUA
// ==========================================

function renderSemua() {

    updateKas();
    renderListrik();
    renderWifi();
    renderBeras();
    renderPembelian();
    renderPenghuni();
    renderTugas();

    updateDashboard();
    updateLaporan();
    updateKasChart();

}

loadPengaturan();
renderSemua();