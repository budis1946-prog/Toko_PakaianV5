/****************************************************
 * TOKO BAJU - FRONTEND
 ****************************************************/

/* ==================================================
   CONFIGURATION
================================================== */

// GANTI DENGAN URL WEB APP APPS SCRIPT ANDA
const API_URL =
  "https://script.google.com/macros/s/AKfycbzm8k95byPU8YkFPkjt2v5ud2kqw-r8w0Fy65MKBIqxrvQoYWaNCqNviA9TdqqPEXdk/exec";

// GANTI DENGAN NOMOR WHATSAPP TOKO
const WHATSAPP_NUMBER = "6283160104255";

/* ==================================================
   GLOBAL
================================================== */

let products = [];

let currentUser = null;

let editId = null;

let currentPhotoUrl = "";

/* ==================================================
   ELEMENT
================================================== */

const productContainer = document.getElementById("productContainer");

const loading = document.getElementById("loading");

const searchInput = document.getElementById("searchInput");

const statusFilter = document.getElementById("statusFilter");

const adminDashboard = document.getElementById("adminDashboard");

const buyerInfo = document.getElementById("buyerInfo");

const addProductButton = document.getElementById("addProductButton");

const adminLoginButton = document.getElementById("adminLoginButton");

const logoutButton = document.getElementById("logoutButton");

const modeInfo = document.getElementById("modeInfo");

const adminLoginModal = document.getElementById("adminLoginModal");

const closeAdminLogin = document.getElementById("closeAdminLogin");

const adminLoginForm = document.getElementById("adminLoginForm");

const loginUsername = document.getElementById("loginUsername");

const loginPassword = document.getElementById("loginPassword");

const loginMessage = document.getElementById("loginMessage");

const productModal = document.getElementById("productModal");

const closeProductModal = document.getElementById("closeProductModal");

const productForm = document.getElementById("productForm");

const modalTitle = document.getElementById("modalTitle");

const productId = document.getElementById("productId");

const foto = document.getElementById("foto");

const nama = document.getElementById("nama");

const deskripsi = document.getElementById("deskripsi");

const hargaBeli = document.getElementById("hargaBeli");

const hargaJual = document.getElementById("hargaJual");

const profitPreview = document.getElementById("profitPreview");

const stok = document.getElementById("stok");

const photoPreview = document.getElementById("photoPreview");

const formMessage = document.getElementById("formMessage");

const saveProductButton = document.getElementById("saveProductButton");

const imageViewer = document.getElementById("imageViewer");

const largeImage = document.getElementById("largeImage");

const closeImageViewer = document.getElementById("closeImageViewer");

/* ==================================================
   INITIALIZE
================================================== */

document.addEventListener("DOMContentLoaded", () => {
  checkSession();

  setupEvents();
});

/* ==================================================
   EVENTS
================================================== */

function setupEvents() {
  // Search
  searchInput.addEventListener("input", renderProducts);

  // Filter
  statusFilter.addEventListener("change", renderProducts);

  // Login Admin
  adminLoginButton.addEventListener("click", openAdminLogin);

  closeAdminLogin.addEventListener("click", closeAdminLoginModal);

  adminLoginForm.addEventListener("submit", loginAdmin);

  // Logout
  logoutButton.addEventListener("click", logoutAdmin);

  // Add product
  addProductButton.addEventListener("click", openAddProduct);

  closeProductModal.addEventListener("click", closeProduct);

  productForm.addEventListener("submit", saveProduct);

  // Harga berubah
  hargaBeli.addEventListener("input", calculateProfit);

  hargaJual.addEventListener("input", calculateProfit);

  // Foto
  foto.addEventListener("change", previewPhoto);

  // Image viewer
  closeImageViewer.addEventListener("click", closeViewer);

  imageViewer.addEventListener("click", function (e) {
    if (e.target === imageViewer) {
      closeViewer();
    }
  });
}

/* ==================================================
   SESSION
================================================== */

function checkSession() {
  try {
    const saved = localStorage.getItem("tokoBajuAdmin");

    if (saved) {
      currentUser = JSON.parse(saved);

      if (currentUser.token && currentUser.role === "ADMIN") {
        showAdminMode();

        return;
      }
    }
  } catch (error) {
    localStorage.removeItem("tokoBajuAdmin");
  }

  showBuyerMode();
}

/* ==================================================
   MODE BUYER
================================================== */

function showBuyerMode() {
  currentUser = null;

  adminDashboard.classList.add("hidden");

  buyerInfo.classList.remove("hidden");

  addProductButton.classList.add("hidden");

  adminLoginButton.classList.remove("hidden");

  logoutButton.classList.add("hidden");

  modeInfo.textContent = "🛍️ Buyer";

  loadProducts();
}

/* ==================================================
   MODE ADMIN
================================================== */

function showAdminMode() {
  adminDashboard.classList.remove("hidden");

  buyerInfo.classList.add("hidden");

  addProductButton.classList.remove("hidden");

  adminLoginButton.classList.add("hidden");

  logoutButton.classList.remove("hidden");

  modeInfo.textContent = "👨‍💼 " + currentUser.username + " • ADMIN";

  loadProducts();
}

/* ==================================================
   IS ADMIN
================================================== */

function isAdmin() {
  return currentUser && currentUser.role === "ADMIN" && currentUser.token;
}

/* ==================================================
   LOGIN MODAL
================================================== */

function openAdminLogin() {
  loginUsername.value = "";

  loginPassword.value = "";

  loginMessage.textContent = "";

  adminLoginModal.classList.remove("hidden");

  setTimeout(() => loginUsername.focus(), 100);
}

function closeAdminLoginModal() {
  adminLoginModal.classList.add("hidden");
}

/* ==================================================
   LOGIN
================================================== */

async function loginAdmin(e) {
  e.preventDefault();

  loginMessage.textContent = "Memproses login...";

  try {
    const response = await postData({
      action: "login",

      username: loginUsername.value.trim(),

      password: loginPassword.value,
    });

    if (!response.success) {
      loginMessage.textContent = response.message;

      return;
    }

    currentUser = {
      username: response.username,

      role: response.role,

      token: response.token,
    };

    localStorage.setItem("tokoBajuAdmin", JSON.stringify(currentUser));

    closeAdminLoginModal();

    showAdminMode();
  } catch (error) {
    loginMessage.textContent = "Login gagal: " + error.message;
  }
}

/* ==================================================
   LOGOUT
================================================== */

function logoutAdmin() {
  localStorage.removeItem("tokoBajuAdmin");

  currentUser = null;

  showBuyerMode();
}

/* ==================================================
   LOAD PRODUCTS
================================================== */

async function loadProducts() {
  loading.classList.remove("hidden");

  productContainer.innerHTML = "";

  try {
    let url = API_URL + "?action=list";

    if (isAdmin()) {
      url += "&token=" + encodeURIComponent(currentUser.token);
    }

    const response = await fetch(url);

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Gagal memuat data.");
    }

    products = Array.isArray(result.data) ? result.data : [];

    renderProducts();
  } catch (error) {
    productContainer.innerHTML = `

      <div class="empty">

        <h3>⚠️ Gagal memuat data</h3>

        <p style="margin-top:10px">
          ${escapeHtml(error.message)}
        </p>

        <button
          class="btn btn-primary"
          style="margin-top:15px"
          onclick="loadProducts()"
        >
          🔄 Coba Lagi
        </button>

      </div>

    `;
  } finally {
    loading.classList.add("hidden");
  }
}

/* ==================================================
   RENDER
================================================== */

function renderProducts() {

  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();

  const status =
    statusFilter.value;

  let filtered =
    products.filter(product => {

      const matchSearch =
        String(product.nama || "")
          .toLowerCase()
          .includes(keyword) ||

        String(product.deskripsi || "")
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        status === "ALL" ||
        String(product.status || "")
          .toUpperCase() === status;

      return matchSearch && matchStatus;
    });


  /*
   * BUYER:
   * Produk SOLD tidak ditampilkan.
   */
  if (!isAdmin()) {

    filtered =
      filtered.filter(product =>
        String(product.status || "")
          .toUpperCase() !== "SOLD"
      );
  }


  /*
   * ADMIN:
   * Dashboard tetap menggunakan
   * data sesuai filter Admin.
   */
  if (isAdmin()) {

    updateDashboard(filtered);
  }


  if (!filtered.length) {

    productContainer.innerHTML = `

      <div class="empty">

        <h3>
          📭 Tidak ada produk
        </h3>

        <p style="margin-top:8px">
          ${
            isAdmin()
              ? "Belum ada produk yang sesuai dengan pencarian."
              : "Saat ini belum ada produk yang tersedia."
          }
        </p>

      </div>

    `;

    return;
  }


  productContainer.innerHTML =
    filtered
      .map(product =>
        isAdmin()
          ? adminProductCard(product)
          : buyerProductCard(product)
      )
      .join("");
}

/* ==================================================
   BUYER CARD
================================================== */

function buyerProductCard(product) {
  const image = product.foto
    ? `

      <img
        src="${escapeAttribute(product.foto)}"
        class="product-image"
        alt="${escapeAttribute(product.nama)}"
        onclick="openImage('${escapeAttribute(product.foto)}')"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      >

      <div
        class="no-image"
        style="display:none"
      >
        🖼️ Gambar gagal dimuat
      </div>

    `
    : `

      <div class="no-image">
        📷 Belum ada foto
      </div>

    `;

  const sold = String(product.status).toUpperCase() === "SOLD";

  const statusClass = sold ? "status-sold" : "status-ready";

  return `

    <article class="product-card">

      ${image}

      <div class="product-body">

        <h3 class="product-name">
          ${escapeHtml(product.nama)}
        </h3>

        <p class="product-description">
          ${escapeHtml(product.deskripsi || "-")}
        </p>

        <div class="price">
          ${formatRupiah(product.hargaJual)}
        </div>

        <div class="stock">
          📦 Stok: ${Number(product.stok || 0)}
        </div>

        <span class="status ${statusClass}">
          ${escapeHtml(product.status)}
        </span>


        ${
          !sold
            ? `

              <button
                class="btn btn-whatsapp"
                onclick="beliWhatsApp('${escapeAttribute(product.id)}')"
              >
                💬 Beli via WhatsApp
              </button>

            `
            : `

              <button
                class="btn"
                disabled
                style="width:100%;background:#e5e7eb;color:#6b7280"
              >
                Produk Sudah Terjual
              </button>

            `
        }

      </div>

    </article>

  `;
}

/* ==================================================
   ADMIN CARD
================================================== */

function adminProductCard(product) {
  const image = product.foto
    ? `

      <img
        src="${escapeAttribute(product.foto)}"
        class="product-image"
        alt="${escapeAttribute(product.nama)}"
        onclick="openImage('${escapeAttribute(product.foto)}')"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      >

      <div
        class="no-image"
        style="display:none"
      >
        🖼️ Gambar gagal dimuat
      </div>

    `
    : `

      <div class="no-image">
        📷 Belum ada foto
      </div>

    `;

  const sold = String(product.status).toUpperCase() === "SOLD";

  const statusClass = sold ? "status-sold" : "status-ready";

  return `

    <article class="product-card">

      ${image}

      <div class="product-body">

        <h3 class="product-name">
          ${escapeHtml(product.nama)}
        </h3>

        <p class="product-description">
          ${escapeHtml(product.deskripsi || "-")}
        </p>


        <div class="buy-price">
          Harga Beli:
          <b>
            ${formatRupiah(product.hargaBeli)}
          </b>
        </div>


        <div class="price">
          Harga Jual:
          ${formatRupiah(product.hargaJual)}
        </div>


        <div class="profit">
          Profit:
          ${formatRupiah(product.profit)}
        </div>


        <div class="stock">
          📦 Stok:
          ${Number(product.stok || 0)}
        </div>


        <span class="status ${statusClass}">
          ${escapeHtml(product.status)}
        </span>


        <div class="card-actions">


          ${
            !sold
              ? `

                <button
                  class="btn btn-success"
                  onclick="markProductSold('${escapeAttribute(product.id)}')"
                >
                  ✅ SOLD
                </button>

              `
              : `

                <button
                  class="btn"
                  disabled
                  style="background:#e5e7eb;color:#6b7280"
                >
                  SOLD
                </button>

              `
          }


          <button
            class="btn btn-warning"
            onclick="editProduct('${escapeAttribute(product.id)}')"
          >
            ✏️ Edit
          </button>


          <button
            class="btn btn-danger"
            onclick="deleteProduct('${escapeAttribute(product.id)}')"
          >
            🗑️ Hapus
          </button>


        </div>

      </div>

    </article>

  `;
}

/* ==================================================
   DASHBOARD
================================================== */

function updateDashboard(list) {

  let totalProduk = 0;
  let totalReady = 0;
  let totalSold = 0;

  let totalModal = 0;
  let totalPenjualan = 0;
  let totalProfit = 0;

  list.forEach(product => {

    totalProduk++;

    const status =
      String(product.status || "")
        .toUpperCase();

    const hargaBeli =
      Number(product.hargaBeli || 0);

    const hargaJual =
      Number(product.hargaJual || 0);

    const profit =
      Number(product.profit || 0);

    const stok =
      Number(product.stok || 0);


    if (status === "READY") {
      totalReady++;
    }


    if (status === "SOLD") {
      totalSold++;
    }


    // =================================
    // TOTAL MODAL
    // SOLD TETAP DIHITUNG
    // =================================

    const stokAwal =
  Number(product.stokawal || product.stokAwal || product.stok || 0);

totalModal += hargaBeli * stokAwal;


    // =================================
    // TOTAL PENJUALAN
    // HANYA PRODUK SOLD
    // =================================

    if (status === "SOLD") {

      totalPenjualan += hargaJual;

      totalProfit += profit;

    }

  });


  document.getElementById("totalProduk").textContent =
    totalProduk;

  document.getElementById("totalReady").textContent =
    totalReady;

  document.getElementById("totalSold").textContent =
    totalSold;

  document.getElementById("totalModal").textContent =
    formatRupiah(totalModal);

  document.getElementById("totalPenjualan").textContent =
    formatRupiah(totalPenjualan);

  document.getElementById("totalProfit").textContent =
    formatRupiah(totalProfit);
}

/* ==================================================
   ADD PRODUCT
================================================== */

function openAddProduct() {
  if (!isAdmin()) {
    alert("Silakan login sebagai Admin.");

    return;
  }

  editId = null;

  currentPhotoUrl = "";

  modalTitle.textContent = "Tambah Produk";

  productForm.reset();

  productId.value = "";

  stok.value = 1;

  profitPreview.value = "Rp0";

  photoPreview.innerHTML = "";

  formMessage.textContent = "";

  productModal.classList.remove("hidden");
}

/* ==================================================
   EDIT PRODUCT
================================================== */

function editProduct(id) {
  if (!isAdmin()) {
    alert("Akses Admin diperlukan.");

    return;
  }

  const product = products.find((item) => String(item.id) === String(id));

  if (!product) {
    alert("Produk tidak ditemukan.");

    return;
  }

  editId = id;

  modalTitle.textContent = "Edit Produk";

  productId.value = product.id;

  nama.value = product.nama || "";

  deskripsi.value = product.deskripsi || "";

  hargaBeli.value = product.hargaBeli || 0;

  hargaJual.value = product.hargaJual || 0;

  stok.value = product.stok ?? 0;

  currentPhotoUrl = product.foto || "";

  if (product.foto) {
    photoPreview.innerHTML = `

      <img
        src="${escapeAttribute(product.foto)}"
        alt="Preview"
      >

    `;
  } else {
    photoPreview.innerHTML = "";
  }

  calculateProfit();

  formMessage.textContent = "";

  productModal.classList.remove("hidden");
}

/* ==================================================
   CLOSE PRODUCT
================================================== */

function closeProduct() {
  productModal.classList.add("hidden");
}

/* ==================================================
   PREVIEW PHOTO
================================================== */

function previewPhoto() {
  const file = foto.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");

    foto.value = "";

    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    photoPreview.innerHTML = `

        <img
          src="${e.target.result}"
          alt="Preview Foto"
        >

      `;
  };

  reader.readAsDataURL(file);
}

/* ==================================================
   COMPRESS IMAGE
================================================== */

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();

      img.onload = function () {
        const maxWidth = 1200;

        let width = img.width;

        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);

          width = maxWidth;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;

        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);

        const result = canvas.toDataURL("image/jpeg", 0.75);

        resolve(result);
      };

      img.onerror = reject;

      img.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* ==================================================
   UPLOAD FOTO
================================================== */

async function uploadPhoto(file) {
  const compressed = await compressImage(file);

  // Periksa ukuran hasil kompresi
  const size = Math.round((compressed.length * 3) / 4);

  // Maksimal sekitar 4 MB
  if (size > 4 * 1024 * 1024) {
    throw new Error("Foto masih terlalu besar. Gunakan foto yang lebih kecil.");
  }

  const response = await postData({
    action: "upload",

    token: currentUser.token,

    fileName: "produk_" + Date.now() + ".jpg",

    base64: compressed,
  });

  if (!response.success) {
    throw new Error(response.message);
  }

  return response.url;
}

/* ==================================================
   SAVE PRODUCT
================================================== */

async function saveProduct(e) {
  e.preventDefault();

  if (!isAdmin()) {
    alert("Silakan login sebagai Admin.");

    return;
  }

  formMessage.textContent = "Menyimpan data...";

  saveProductButton.disabled = true;

  try {
    let photoUrl = currentPhotoUrl;

    // ==============================================
    // Upload foto baru
    // ==============================================

    if (foto.files.length > 0) {
      formMessage.textContent = "Mengupload foto...";

      photoUrl = await uploadPhoto(foto.files[0]);
    }

    const data = {
      token: currentUser.token,

      action: editId ? "update" : "add",

      id: editId || "",

      foto: photoUrl,

      nama: nama.value.trim(),

      deskripsi: deskripsi.value.trim(),

      hargaBeli: Number(hargaBeli.value || 0),

      hargaJual: Number(hargaJual.value || 0),

      stok: Number(stok.value || 0),
    };

    formMessage.textContent = "Menyimpan produk...";

    const response = await postData(data);

    if (!response.success) {
      throw new Error(response.message);
    }

    alert(
      editId ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.",
    );

    closeProduct();

    await loadProducts();
  } catch (error) {
    formMessage.textContent = "❌ " + error.message;
  } finally {
    saveProductButton.disabled = false;
  }
}

/* ==================================================
   MARK SOLD
================================================== */

async function markProductSold(id) {
  if (!isAdmin()) {
    alert("Akses Admin diperlukan.");

    return;
  }

  const product = products.find((item) => String(item.id) === String(id));

  if (!product) {
    return;
  }

  const yakin = confirm(`Tandai "${product.nama}" sebagai SOLD?`);

  if (!yakin) {
    return;
  }

  try {
    const response = await postData({
      action: "sold",

      token: currentUser.token,

      id: id,
    });

    if (!response.success) {
      throw new Error(response.message);
    }

    alert("Produk berhasil ditandai SOLD.");

    await loadProducts();
  } catch (error) {
    alert("Gagal: " + error.message);
  }
}

/* ==================================================
   DELETE
================================================== */

async function deleteProduct(id) {
  if (!isAdmin()) {
    alert("Akses Admin diperlukan.");

    return;
  }

  const product = products.find((item) => String(item.id) === String(id));

  if (!product) {
    return;
  }

  const yakin = confirm(`Hapus produk "${product.nama}"?`);

  if (!yakin) {
    return;
  }

  try {
    const response = await postData({
      action: "delete",

      token: currentUser.token,

      id: id,
    });

    if (!response.success) {
      throw new Error(response.message);
    }

    alert("Produk berhasil dihapus.");

    await loadProducts();
  } catch (error) {
    alert("Gagal menghapus: " + error.message);
  }
}

/* ==================================================
   WHATSAPP
================================================== */

function beliWhatsApp(id) {
  const product = products.find((item) => String(item.id) === String(id));

  if (!product) {
    alert("Produk tidak ditemukan.");

    return;
  }

  if (String(product.status).toUpperCase() === "SOLD") {
    alert("Produk sudah terjual.");

    return;
  }

  const message =
    "Halo, saya ingin membeli produk:%0A%0A" +
    "Nama: " +
    encodeURIComponent(product.nama) +
    "%0A" +
    "Harga: " +
    encodeURIComponent(formatRupiah(product.hargaJual)) +
    "%0A" +
    "ID: " +
    encodeURIComponent(product.id);

  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + message;

  window.open(url, "_blank");
}

/* ==================================================
   IMAGE VIEWER
================================================== */

function openImage(url) {
  if (!url) {
    return;
  }

  largeImage.src = url;

  imageViewer.classList.remove("hidden");
}

function closeViewer() {
  imageViewer.classList.add("hidden");

  largeImage.src = "";
}

/* ==================================================
   PROFIT
================================================== */

function calculateProfit() {
  const beli = Number(hargaBeli.value || 0);

  const jual = Number(hargaJual.value || 0);

  const profit = jual - beli;

  profitPreview.value = formatRupiah(profit);
}

/* ==================================================
   POST
================================================== */

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(data),
  });

  return await response.json();
}

/* ==================================================
   RUPIAH
================================================== */

function formatRupiah(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}
