/* =========================================================
   AUTH + LOGIN (5 USERS)
   ========================================================= */

let authDB = null;

/* --- FORCE OVERLAY DEFAULT STATE --- */
const loginOverlay = document.getElementById("loginOverlay");

/* IndexedDB Init */
const authReq = indexedDB.open("AuthDB", 1);

authReq.onupgradeneeded = (e) => {
  const db = e.target.result;
  if (!db.objectStoreNames.contains("users")) {
    db.createObjectStore("users", { keyPath: "username" });
  }
};

authReq.onsuccess = (e) => {
  authDB = e.target.result;
  createDefaultUsers().then(checkLogin);
};

authReq.onerror = () => {
  console.error("Gagal membuka IndexedDB");
};

/* --- LOGIN STATE HANDLER (SINGLE SOURCE OF TRUTH) --- */
function checkLogin() {
  const isLogin = sessionStorage.getItem("login") === "true";
  loginOverlay.style.display = isLogin ? "none" : "flex";
}

/* --- HASH PASSWORD --- */
async function hashPassword(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* --- CREATE 5 DEFAULT USERS --- */
async function createDefaultUsers() {
  // Daftar 5 user default
  const defaultUsers = [
    { username: "admin", password: "admin123" },
    { username: "sekre", password: "sekre123" },
    { username: "ppk", password: "ppk12345" },
    { username: "bendahara", password: "bend123" },
    { username: "staff", password: "staff123" },
  ];

  return new Promise((resolve) => {
    const tx = authDB.transaction("users", "readonly");
    const store = tx.objectStore("users");

    // Cek apakah user sudah ada
    const checkPromises = defaultUsers.map((user) => {
      return new Promise((res) => {
        const req = store.get(user.username);
        req.onsuccess = () => {
          res({
            username: user.username,
            exists: !!req.result,
            password: user.password,
          });
        };
      });
    });

    Promise.all(checkPromises).then(async (results) => {
      const tx2 = authDB.transaction("users", "readwrite");
      const store2 = tx2.objectStore("users");

      for (let result of results) {
        if (!result.exists) {
          const hashedPw = await hashPassword(result.password);
          store2.add({
            username: result.username,
            password: hashedPw,
          });
          console.log(`User ${result.username} dibuat`);
        }
      }

      tx2.oncomplete = () => {
        console.log("Inisialisasi user selesai");
        resolve();
      };
    });
  });
}

/* --- LOGIN FUNCTION --- */
async function login() {
  if (!authDB) {
    alert("Database belum siap, refresh halaman");
    return;
  }

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const status = document.getElementById("loginStatus");

  status.innerText = "";

  const tx = authDB.transaction("users", "readonly");
  const store = tx.objectStore("users");
  const req = store.get(username);

  req.onsuccess = async () => {
    if (!req.result) {
      status.innerText = "User tidak ditemukan";
      return;
    }

    const hash = await hashPassword(password);
    if (hash === req.result.password) {
      sessionStorage.setItem("login", "true");
      sessionStorage.setItem("username", username);
      checkLogin();
    } else {
      status.innerText = "Password salah";
    }
  };
}
// ===== HELPER FUNCTIONS =====
function formatRupiah(angka) {
  return "Rp " + parseInt(angka).toLocaleString("id-ID");
}

function formatTanggal(tanggal) {
  if (!tanggal) return "";
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const date = new Date(tanggal);
  return (
    date.getDate() + " " + bulan[date.getMonth()] + " " + date.getFullYear()
  );
}

function parseRincianPekerjaan(text) {
  if (!text || text.trim() === "") return [];
  const lines = text.trim().split("\n");
  return lines
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return {
        no: parts[0] || "",
        uraian: parts[1] || "",
        qty: parts[2] || "",
        satuan: parts[3] || "",
        harga: parseInt(parts[4]) || 0,
        total: parseInt(parts[5]) || 0,
      };
    })
    .filter((item) => item.no);
}

// Fungsi untuk mengkonversi angka ke terbilang
function angkaTerbilang(angka) {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  if (angka < 12) return bilangan[angka];
  if (angka < 20) return bilangan[angka - 10] + " Belas";
  if (angka < 100)
    return bilangan[Math.floor(angka / 10)] + " Puluh " + bilangan[angka % 10];
  if (angka < 200) return "Seratus " + angkaTerbilang(angka - 100);
  if (angka < 1000)
    return (
      bilangan[Math.floor(angka / 100)] +
      " Ratus " +
      angkaTerbilang(angka % 100)
    );
  if (angka < 2000) return "Seribu " + angkaTerbilang(angka - 1000);
  if (angka < 1000000)
    return (
      angkaTerbilang(Math.floor(angka / 1000)) +
      " Ribu " +
      angkaTerbilang(angka % 1000)
    );
  if (angka < 1000000000)
    return (
      angkaTerbilang(Math.floor(angka / 1000000)) +
      " Juta " +
      angkaTerbilang(angka % 1000000)
    );
  if (angka < 1000000000000)
    return (
      angkaTerbilang(Math.floor(angka / 1000000000)) +
      " Miliar " +
      angkaTerbilang(angka % 1000000000)
    );
  if (angka < 1000000000000000)
    return (
      angkaTerbilang(Math.floor(angka / 1000000000000)) +
      " Triliun " +
      angkaTerbilang(angka % 1000000000000)
    );

  return "";
}

function konversiTerbilang(angka) {
  if (!angka || angka === 0) return "Nol Rupiah";
  const hasil = angkaTerbilang(angka).trim().replace(/\s+/g, " ");
  return hasil + " Rupiah";
}

// Fungsi untuk menghitung total otomatis dari rincian pekerjaan
function hitungTotalKontrak() {
  const rincianText = document.getElementById("rincianPekerjaan").value;
  const rincianPekerjaan = parseRincianPekerjaan(rincianText);

  let total = 0;
  for (let i = 0; i < rincianPekerjaan.length; i++) {
    total += rincianPekerjaan[i].total;
  }

  // Update nilai kontrak
  document.getElementById("nilaiKontrak").value = total;

  // Update terbilang
  document.getElementById("terbilang").value = konversiTerbilang(total);
}

function validateInputs() {
  const required = {
    nomorSPK: "Nomor SPK",
    tanggalSPK: "Tanggal SPK",
    namaPPK: "Nama PPK",
    namaPenyedia: "Nama Penyedia",
    paketPekerjaan: "Paket Pekerjaan",
    nomorDPA: "Nomor DPA",
    tanggalDPA: "Tanggal DPA",
    kegiatan: "Kegiatan",
    subKegiatan: "Sub Kegiatan",
    rincianPekerjaan: "Rincian Pekerjaan",
    waktuPelaksanaan: "Waktu Pelaksanaan",
    lokasi: "Lokasi",
    tanggalTTD: "Tanggal TTD",
    namaPihakPertama: "Nama Pihak Pertama",
    Pangkat: "Pangkat/Golongan",
    nipPihakPertama: "NIP Pihak Pertama",
    namaDirektur: "Nama Direktur",
  };

  for (let id in required) {
    const value = document.getElementById(id).value;
    if (!value || value.trim() === "") {
      alert('Field "' + required[id] + '" harus diisi!');
      document.getElementById(id).focus();
      return false;
    }
  }
  return true;
}

function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = function () {
      console.warn("icons/LogoPPT.png tidak ditemukan, lanjut tanpa logo");
      resolve(null);
    };
    img.src = "icons/LogoPPT.png";
  });
}

// ===== GENERATE PDF =====
async function generatePDF() {
  console.log("Generate PDF dipanggil");

  // Hitung total terlebih dahulu
  hitungTotalKontrak();

  if (typeof window.jspdf === "undefined") {
    alert("ERROR: Library jsPDF belum ter-load!");
    return;
  }

  if (!validateInputs()) return;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const logoBase64 = await loadLogo();

    const nomorSPK = document.getElementById("nomorSPK").value;
    const tanggalSPK = formatTanggal(
      document.getElementById("tanggalSPK").value
    );
    const namaPPK = document.getElementById("namaPPK").value;
    const namaPenyedia = document.getElementById("namaPenyedia").value;
    const paketPekerjaan = document.getElementById("paketPekerjaan").value;
    const nomorDPA = document.getElementById("nomorDPA").value;
    const tanggalDPA = formatTanggal(
      document.getElementById("tanggalDPA").value
    );
    const kegiatan = document.getElementById("kegiatan").value;
    const subKegiatan = document.getElementById("subKegiatan").value;
    const sumberDana = document.getElementById("sumberDana").value;
    const nilaiKontrak = document.getElementById("nilaiKontrak").value;
    const terbilang = document.getElementById("terbilang").value;
    const rincianPekerjaan = parseRincianPekerjaan(
      document.getElementById("rincianPekerjaan").value
    );
    const waktuPelaksanaan = document.getElementById("waktuPelaksanaan").value;
    const lokasi = document.getElementById("lokasi").value;
    const tanggalTTD = formatTanggal(
      document.getElementById("tanggalTTD").value
    );
    const namaPihakPertama = document.getElementById("namaPihakPertama").value;
    const Pangkat = document.getElementById("Pangkat").value;
    const nipPihakPertama = document.getElementById("nipPihakPertama").value;
    const namaDirektur = document.getElementById("namaDirektur").value;

    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);

    let y = 15;
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 15, y, 25, 25);
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PEMERINTAH PROVINSI PAPUA TENGAH", 105, y + 5, {
      align: "center",
    });
    y += 10;
    doc.text("SEKRETARIAT DPRPT", 105, y, { align: "center" });
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Jalan Pepera, Kelurahan Karang Mulia, Kabupaten Nabire - Provinsi Papua Tengah",
      105,
      y,
      { align: "center" }
    );
    y += 10;

    doc.setLineWidth(1.5);
    doc.line(10, y, 200, y);
    y += 2;
    doc.setLineWidth(0.5);
    doc.line(10, y, 200, y);
    y += 10;

    doc.setLineWidth(0.5);
    doc.rect(10, y, 90, 20);
    doc.rect(100, y, 100, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SURAT PERINTAH KERJA ( SPK )", 55, y + 10, { align: "center" });

    doc.setFontSize(9);
    doc.text("SATUAN KERJA PERANGKAT DAERAH :", 105, y + 5);
    doc.text("SEKRETARIAT DPRPT PROVINSI PAPUA TENGAH", 105, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const alamatLines = doc.splitTextToSize(
      "Jalan Pepera, Kelurahan Karang Mulia, Kabupaten Nabire - Provinsi Papua Tengah",
      90
    );
    doc.text(alamatLines, 105, y + 14);
    y += 22;

    doc.setFontSize(9);
    doc.text("Nomor SPK    :", 105, y);
    doc.text(nomorSPK, 145, y);
    y += 5;
    doc.text("Tanggal      :", 105, y);
    doc.text(tanggalSPK, 145, y);
    y += 10;

    doc.setLineWidth(0.5);
    doc.rect(10, y, 35, 7);
    doc.rect(45, y, 5, 7);
    doc.rect(50, y, 150, 7);
    doc.setFont("helvetica", "bold");
    doc.text("NAMA PPK", 12, y + 5);
    doc.text(":", 47, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(namaPPK.toUpperCase(), 52, y + 5);
    y += 7;

    doc.rect(10, y, 35, 7);
    doc.rect(45, y, 5, 7);
    doc.rect(50, y, 150, 7);
    doc.setFont("helvetica", "bold");
    doc.text("NAMA PENYEDIA", 12, y + 5);
    doc.text(":", 47, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(namaPenyedia.toUpperCase(), 52, y + 5);
    y += 7;

    const paketHeight = 10;
    doc.rect(10, y, 35, paketHeight);
    doc.rect(45, y, 5, paketHeight);
    doc.rect(50, y, 150, paketHeight);
    doc.setFont("helvetica", "bold");
    doc.text("Paket Pekerjaan", 12, y + 5);
    doc.text(":", 47, y + 5);
    doc.setFont("helvetica", "normal");
    const paketLines = doc.splitTextToSize(paketPekerjaan, 145);
    doc.text(paketLines, 52, y + 4);
    y += paketHeight;
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const sumberDanaTitle =
      "Sumber Dana DPA Sekretariat DPRPT Provinsi Papua Tengah";
    doc.text(sumberDanaTitle, 10, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.text("Nomor DPA     :", 10, y);
    doc.text(nomorDPA + ", Tanggal " + tanggalDPA, 45, y);
    y += 5;
    doc.text("Kegiatan      :", 10, y);
    doc.text(kegiatan, 45, y);
    y += 5;
    doc.text("Sub Kegiatan  :", 10, y);
    doc.text(subKegiatan, 45, y);
    y += 5;
    doc.text("Sumber Dana   :", 10, y);
    doc.text(sumberDana, 45, y);
    y += 8;

    doc.text(
      "Sumber dana : " +
        sumberDana +
        "; Nomor : " +
        nomorDPA +
        ", Tanggal " +
        tanggalDPA,
      10,
      y
    );
    y += 8;

    doc.text(
      "Nilai kontrak termasuk Pajak Pertambahan Nilai (PPN) adalah sebesar",
      10,
      y
    );
    doc.setFont("helvetica", "bold");
    doc.text(formatRupiah(nilaiKontrak), 155, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.text("Terbilang    : " + terbilang, 10, y);
    y += 10;

    if (y > 240) {
      doc.addPage();
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);
      y = 15;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RINCIAN PEKERJAAN", 105, y, { align: "center" });
    y += 7;

    doc.setFontSize(8);
    doc.setLineWidth(0.5);
    doc.rect(10, y, 10, 8);
    doc.rect(20, y, 70, 8);
    doc.rect(90, y, 20, 8);
    doc.rect(110, y, 20, 8);
    doc.rect(130, y, 35, 8);
    doc.rect(165, y, 35, 8);

    doc.text("No.", 15, y + 5, { align: "center" });
    doc.text("Uraian Pekerjaan", 55, y + 5, { align: "center" });
    doc.text("Kuantitas", 100, y + 5, { align: "center" });
    doc.text("Satuan", 120, y + 5, { align: "center" });
    doc.text("Harga Satuan (Setelah PPn)", 147, y + 5, { align: "center" });
    doc.text("TOTAL", 182, y + 5, { align: "center" });
    y += 8;

    doc.setFont("helvetica", "normal");
    for (let i = 0; i < rincianPekerjaan.length; i++) {
      const item = rincianPekerjaan[i];
      if (y > 265) {
        doc.addPage();
        doc.setLineWidth(1);
        doc.rect(5, 5, 200, 287);
        y = 15;
      }

      const rowHeight = 7;
      doc.rect(10, y, 10, rowHeight);
      doc.rect(20, y, 70, rowHeight);
      doc.rect(90, y, 20, rowHeight);
      doc.rect(110, y, 20, rowHeight);
      doc.rect(130, y, 35, rowHeight);
      doc.rect(165, y, 35, rowHeight);

      doc.text(String(item.no), 15, y + 4, { align: "center" });
      const uraianLines = doc.splitTextToSize(String(item.uraian), 65);
      doc.text(uraianLines, 22, y + 4);
      doc.text(String(item.qty), 100, y + 4, { align: "center" });
      doc.text(String(item.satuan), 120, y + 4, { align: "center" });
      doc.text(formatRupiah(item.harga), 163, y + 4, { align: "right" });
      doc.text(formatRupiah(item.total), 198, y + 4, { align: "right" });

      y += Math.max(rowHeight, uraianLines.length * 4 + 3);
    }

    doc.setLineWidth(0.5);
    doc.rect(10, y, 155, 7);
    doc.rect(165, y, 35, 7);
    doc.setFont("helvetica", "bold");
    doc.text("Rp", 168, y + 5);
    doc.text(formatRupiah(nilaiKontrak).replace("Rp ", ""), 198, y + 5, {
      align: "right",
    });
    y += 10;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Terbilang : " + terbilang, 10, y);
    y += 8;

    if (y > 250) {
      doc.addPage();
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);
      y = 15;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const waktuText =
      "Waktu Pelaksanaan Pekerjaan " +
      waktuPelaksanaan +
      " (Tiga Puluh) hari Kalender terhitung di tanda tangani Surat Perintah Kerja (SPK)";
    doc.text(waktuText, 10, y);
    y += 15;

    doc.text(lokasi + ", " + tanggalTTD, 150, y);
    y += 10;

    doc.setLineWidth(0.5);
    doc.rect(10, y, 90, 30);
    doc.rect(100, y, 100, 30);

    doc.setFont("helvetica", "bold");
    doc.text("PIHAK PERTAMA", 55, y + 5, { align: "center" });
    doc.text("PIHAK KEDUA", 150, y + 5, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("KABAG FASILITASI PENGANGGARAN DAN PENGAWASAN", 55, y, {
      align: "center",
    });
    doc.text(namaPenyedia.toUpperCase(), 150, y, { align: "center" });
    y += 5;
    doc.text("SEKREARIAT DPRPT PROVINSI PAPUA TENGAH", 55, y, {
      align: "center",
    });
    y += 5;
    doc.text("PEJABAT PEMBUAT KOMITMEN", 55, y, { align: "center" });
    y += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(namaPihakPertama.toUpperCase(), 55, y, { align: "center" });
    doc.text(namaDirektur.toUpperCase(), 150, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(Pangkat, 55, y, { align: "center" });
    doc.text("Direktur", 150, y, { align: "center" });
    y += 5;
    doc.text("NIP. " + nipPihakPertama, 55, y, { align: "center" });

    doc.setLineWidth(1);
    doc.rect(135, y - 25, 20, 15);
    doc.setFontSize(10);
    doc.text("Materai", 145, y - 17, { align: "center" });

    doc.save("SPK_" + nomorSPK.replace(/\//g, "_") + ".pdf");
    console.log("PDF berhasil dibuat!");
    alert("PDF berhasil di-download!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Gagal membuat PDF!\n\nError: " + error.message);
  }
}

// ===== GENERATE WORD =====
async function generateWord() {
  console.log("Generate Word dipanggil");

  // Hitung total terlebih dahulu
  hitungTotalKontrak();

  if (!validateInputs()) return;

  try {
    const logoBase64 = await loadLogo();
    const nomorSPK = document.getElementById("nomorSPK").value;
    const tanggalSPK = formatTanggal(
      document.getElementById("tanggalSPK").value
    );
    const namaPPK = document.getElementById("namaPPK").value;
    const namaPenyedia = document.getElementById("namaPenyedia").value;
    const paketPekerjaan = document.getElementById("paketPekerjaan").value;
    const nomorDPA = document.getElementById("nomorDPA").value;
    const tanggalDPA = formatTanggal(
      document.getElementById("tanggalDPA").value
    );
    const kegiatan = document.getElementById("kegiatan").value;
    const subKegiatan = document.getElementById("subKegiatan").value;
    const sumberDana = document.getElementById("sumberDana").value;
    const nilaiKontrak = document.getElementById("nilaiKontrak").value;
    const terbilang = document.getElementById("terbilang").value;
    const rincianPekerjaan = parseRincianPekerjaan(
      document.getElementById("rincianPekerjaan").value
    );
    const waktuPelaksanaan = document.getElementById("waktuPelaksanaan").value;
    const lokasi = document.getElementById("lokasi").value;
    const tanggalTTD = formatTanggal(
      document.getElementById("tanggalTTD").value
    );
    const namaPihakPertama = document.getElementById("namaPihakPertama").value;
    const Pangkat = document.getElementById("Pangkat").value;
    const nipPihakPertama = document.getElementById("nipPihakPertama").value;
    const namaDirektur = document.getElementById("namaDirektur").value;

    let tableRows = "";
    for (let i = 0; i < rincianPekerjaan.length; i++) {
      const item = rincianPekerjaan[i];
      tableRows +=
        "<tr>" +
        '<td style="text-align: center;">' +
        item.no +
        "</td>" +
        "<td>" +
        item.uraian +
        "</td>" +
        '<td style="text-align: center;">' +
        item.qty +
        "</td>" +
        '<td style="text-align: center;">' +
        item.satuan +
        "</td>" +
        '<td style="text-align: right;">' +
        formatRupiah(item.harga) +
        "</td>" +
        '<td style="text-align: right;">' +
        formatRupiah(item.total) +
        "</td>" +
        "</tr>";
    }

    const logoHTML = logoBase64
      ? '<img src="' +
        logoBase64 +
        '" width="80" height="80" style="float: left; margin-right: 20px;">'
      : "";

    const htmlContent =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>SPK</title></head>' +
      '<body style="border: 3px solid black; padding: 20px; font-family: Arial;">' +
      '<div style="text-align: center; margin-bottom: 20px; position: relative;">' +
      logoHTML +
      '<h2 style="margin: 5px 0;"><b>PEMERINTAH PROVINSI PAPUA TENGAH</b></h2>' +
      '<h2 style="margin: 5px 0;"><b>SEKRETARIAT DPRPT</b></h2>' +
      '<p style="margin: 5px 0;">Jalan Pepera, Kelurahan Karang Mulia, Kabupaten Nabire - Provinsi Papua Tengah</p>' +
      '<hr style="border: 2px solid black; margin: 15px 0;">' +
      '<div style="clear: both;"></div>' +
      "</div>" +
      '<table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">' +
      "<tr>" +
      '<td style="width: 45%; text-align: center;"><b>SURAT PERINTAH KERJA ( SPK )</b></td>' +
      '<td style="width: 55%;">' +
      "<b>SATUAN KERJA PERANGKAT DAERAH :</b><br>" +
      "<b>SEKRETARIAT DPRPT PROVINSI PAPUA TENGAH</b><br>" +
      "<small>Jalan Pepera, Kelurahan Karang Mulia, Kabupaten Nabire - Provinsi Papua Tengah</small><br>" +
      "Nomor SPK : <b>" +
      nomorSPK +
      "</b><br>" +
      "Tanggal : <b>" +
      tanggalSPK +
      "</b>" +
      "</td></tr></table>" +
      '<table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">' +
      '<tr><td style="width: 20%;"><b>NAMA PPK</b></td><td style="width: 2%;">:</td><td>' +
      namaPPK.toUpperCase() +
      "</td></tr>" +
      "<tr><td><b>NAMA PENYEDIA</b></td><td>:</td><td>" +
      namaPenyedia.toUpperCase() +
      "</td></tr>" +
      "<tr><td><b>Paket Pekerjaan</b></td><td>:</td><td>" +
      paketPekerjaan +
      "</td></tr>" +
      "</table>" +
      "<p><b>Sumber Dana DPA Sekretariat DPRPT Provinsi Papua Tengah</b></p>" +
      "<p>Nomor DPA : " +
      nomorDPA +
      ", Tanggal " +
      tanggalDPA +
      "</p>" +
      "<p>Kegiatan : " +
      kegiatan +
      "</p>" +
      "<p>Sub Kegiatan : " +
      subKegiatan +
      "</p>" +
      "<p>Sumber Dana : " +
      sumberDana +
      "</p><br>" +
      "<p>Sumber dana : " +
      sumberDana +
      "; Nomor : " +
      nomorDPA +
      ", Tanggal " +
      tanggalDPA +
      "</p><br>" +
      "<p>Nilai kontrak termasuk Pajak Pertambahan Nilai (PPN) adalah sebesar <b>" +
      formatRupiah(nilaiKontrak) +
      "</b></p>" +
      "<p><i>Terbilang : " +
      terbilang +
      "</i></p><br>" +
      '<h4 style="text-align: center;"><b>RINCIAN PEKERJAAN</b></h4>' +
      '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">' +
      '<thead><tr style="background-color: #f0f0f0;">' +
      "<th>No.</th><th>Uraian Pekerjaan</th><th>Kuantitas</th><th>Satuan</th><th>Harga Satuan (Setelah PPn)</th><th>TOTAL</th>" +
      "</tr></thead><tbody>" +
      tableRows +
      '<tr style="font-weight: bold; background-color: #f0f0f0;">' +
      '<td colspan="5" style="text-align: right;">Rp</td>' +
      '<td style="text-align: right;">' +
      formatRupiah(nilaiKontrak).replace("Rp ", "") +
      "</td></tr>" +
      "</tbody></table>" +
      "<p><i>Terbilang : " +
      terbilang +
      "</i></p><br><br>" +
      "<p>Waktu Pelaksanaan Pekerjaan " +
      waktuPelaksanaan +
      " (Tiga Puluh) hari Kalender terhitung di tanda tangani Surat Perintah Kerja (SPK)</p><br><br>" +
      '<p style="text-align: right;">' +
      lokasi +
      ", " +
      tanggalTTD +
      "</p><br>" +
      '<table border="1" cellpadding="10" style="width: 100%; border-collapse: collapse;">' +
      "<tr>" +
      '<td style="text-align: center; width: 50%;"><b>PIHAK PERTAMA</b><br><br>KABAG FASILITASI PENGANGGARAN DAN PENGAWASAN<br>SEKREARIAT DPRPT PROVINSI PAPUA TENGAH<br>PEJABAT PEMBUAT KOMITMEN<br><br><br><br><b>' +
      namaPihakPertama.toUpperCase() +
      "</b><br>" +
      Pangkat +
      "<br>NIP. " +
      nipPihakPertama +
      "</td>" +
      '<td style="text-align: center; width: 50%;"><b>PIHAK KEDUA</b><br><br>' +
      namaPenyedia.toUpperCase() +
      '<br><br><br><div style="border: 2px solid black; width: 80px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;"><b>Materai</b></div><br><br><b>' +
      namaDirektur.toUpperCase() +
      "</b><br>Direktur</td>" +
      "</tr>" +
      "</table>" +
      "</body>" +
      "</html>";

    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SPK_" + nomorSPK.replace(/\//g, "_") + ".doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Word berhasil dibuat!");
    alert("Word berhasil di-download!");
  } catch (error) {
    console.error("Error generating Word:", error);
    alert("Gagal membuat Word!\n\nError: " + error.message);
  }
}
