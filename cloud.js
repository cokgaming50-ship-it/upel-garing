// ==========================================
// cloud.js - Login + database bersama (Firebase)
// Dimuat SETELAH script.js. Kalau firebase-config.js belum diisi,
// file ini tidak melakukan apa-apa (aplikasi tetap mode lokal).
// ==========================================

(function () {

    const KUNCI = [
        "kk_transactions", "kk_listrik", "kk_wifiInfo", "kk_wifiPayments",
        "kk_beras", "kk_pembelian", "kk_penghuni", "kk_tugas"
    ];

    const cfg = window.FIREBASE_CONFIG;
    const belumDiisi = !cfg || !cfg.apiKey || String(cfg.apiKey).indexOf("ISI_") === 0;

    window.cloudAktif = false;

    if (belumDiisi) return; // MODE LOKAL

    window.cloudAktif = true;

    const overlay = document.getElementById("loginOverlay");
    const form = document.getElementById("loginForm");
    const pesan = document.getElementById("loginPesan");
    const tombol = document.getElementById("loginTombol");
    const lupa = document.getElementById("loginLupa");
    const btnLogout = document.getElementById("btnLogout");
    const akunEmail = document.getElementById("akunEmail");

    function tampilLogin(teks) {
        overlay.classList.add("show");
        if (teks !== undefined) pesan.textContent = teks;
    }

    tampilLogin(""); // kunci aplikasi sampai berhasil login

    if (typeof firebase === "undefined") {
        tampilLogin("Gagal memuat Firebase. Periksa koneksi internet, lalu muat ulang halaman.");
        form.style.display = "none";
        return;
    }

    firebase.initializeApp(cfg);

    const auth = firebase.auth();
    const db = firebase.firestore();
    const koleksi = db.collection("kontrakan");

    let berhenti = [];
    let timerRender = null;

    function jadwalRender() {
        clearTimeout(timerRender);
        timerRender = setTimeout(function () {
            renderSemua();
        }, 50);
    }

    function adaIsi(nilai) {
        if (Array.isArray(nilai)) return nilai.length > 0;
        if (nilai && typeof nilai === "object") return !!(nilai.provider || nilai.cost || nilai.dueDate);
        return false;
    }

    // ---------- kirim data ke database ----------
    window.cloudSimpan = function (key, value) {

        const user = auth.currentUser;
        if (!user) return;

        koleksi.doc(key).set({
            json: JSON.stringify(value),
            diubah: firebase.firestore.FieldValue.serverTimestamp(),
            oleh: user.email
        }).catch(function (error) {
            toast("Gagal menyimpan ke database: " + error.message);
        });

    };

    // ---------- terima data dari database ----------
    function mulaiSinkron() {

        KUNCI.forEach(function (key) {

            const hentikan = koleksi.doc(key).onSnapshot(function (snap) {

                if (!snap.exists) {
                    // Database masih kosong: unggah data lokal yang sudah ada (sekali saja)
                    const lokal = muat(key, null);
                    if (adaIsi(lokal)) window.cloudSimpan(key, lokal);
                    return;
                }

                if (snap.metadata.hasPendingWrites) return; // itu tulisan kita sendiri

                try {
                    terapkanDariCloud(key, JSON.parse(snap.data().json));
                    jadwalRender();
                } catch (error) {
                    console.error("Data cloud rusak:", key, error);
                }

            }, function (error) {
                toast("Tidak bisa membaca database: " + error.message);
            });

            berhenti.push(hentikan);

        });

    }

    function hentikanSinkron() {
        berhenti.forEach(function (fn) { fn(); });
        berhenti = [];
    }

    // ---------- login ----------
    function terjemahError(kode) {
        const peta = {
            "auth/invalid-credential": "Email atau password salah.",
            "auth/wrong-password": "Email atau password salah.",
            "auth/user-not-found": "Email atau password salah.",
            "auth/invalid-email": "Format email tidak valid.",
            "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
            "auth/network-request-failed": "Tidak ada koneksi internet."
        };
        return peta[kode] || "Gagal masuk (" + kode + ").";
    }

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        pesan.textContent = "";
        tombol.disabled = true;

        auth.signInWithEmailAndPassword(
            document.getElementById("loginEmail").value.trim(),
            document.getElementById("loginPassword").value
        ).catch(function (error) {
            pesan.textContent = terjemahError(error.code);
        }).then(function () {
            tombol.disabled = false;
        });

    });

    lupa.addEventListener("click", function (event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        if (!email) {
            pesan.textContent = "Isi email dulu, lalu klik 'Lupa password?'.";
            return;
        }

        auth.sendPasswordResetEmail(email).then(function () {
            pesan.textContent = "Link reset password sudah dikirim ke email (cek juga folder spam).";
        }).catch(function (error) {
            pesan.textContent = terjemahError(error.code);
        });

    });

    window.logoutAkun = function () {

        if (!confirm("Keluar dari akun ini?")) return;

        hentikanSinkron();

        // hapus salinan data di perangkat ini (penting untuk HP/laptop bersama)
        KUNCI.forEach(function (key) { localStorage.removeItem(key); });

        auth.signOut().then(function () {
            location.reload();
        });

    };

    auth.onAuthStateChanged(function (user) {

        hentikanSinkron();

        if (user) {
            overlay.classList.remove("show");
            if (btnLogout) btnLogout.style.display = "";
            if (akunEmail) akunEmail.textContent = "Masuk sebagai " + user.email;
            mulaiSinkron();
        } else {
            if (btnLogout) btnLogout.style.display = "none";
            if (akunEmail) akunEmail.textContent = "";
            tampilLogin();
        }

    });

})();