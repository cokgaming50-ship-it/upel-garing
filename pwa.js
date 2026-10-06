// Mendaftarkan service worker + tombol "Pasang Aplikasi"
(function () {

    // service worker hanya jalan di https:// atau localhost (GitHub Pages sudah https)
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("sw.js").catch(function () {});
        });
    }

    let tawaran = null;
    const tombol = document.getElementById("btnPasang");

    window.addEventListener("beforeinstallprompt", function (event) {
        event.preventDefault();
        tawaran = event;
        if (tombol) tombol.style.display = "";
    });

    if (tombol) {
        tombol.addEventListener("click", function () {
            if (!tawaran) return;
            tawaran.prompt();
            tawaran.userChoice.then(function () {
                tawaran = null;
                tombol.style.display = "none";
            });
        });
    }

    window.addEventListener("appinstalled", function () {
        if (tombol) tombol.style.display = "none";
    });

})();