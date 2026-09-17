// ======================================================
// TOKO BAJU - JAVASCRIPT FINAL
// ======================================================

// ======================================================
// CONFIG
// ======================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbyBtVfnJ1rTVofpxlfSAwQ6mg86IFc142f-Hc-2WQxsKMrmvbPu6Q_qgGhBpHda7ARq/exec";

const WHATSAPP_NUMBER = "6283160104255";

// ======================================================
// GLOBAL
// ======================================================

let products = [];

let currentUser = null;

let editId = null;

let currentPhotoUrl = "";

// ======================================================
// DOM READY
// ======================================================

document.addEventListener("DOMContentLoaded", function () {
  checkSession();

  setupEvents();
});

// ======================================================
// SETUP EVENTS
// ======================================================

function setupEvents() {
  const searchInput = document.getElementById("searchInput");

  const statusFilter = document.getElementById("statusFilter");

  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", renderProducts);
  }

  const addButton = document.getElementById("addProductButton");

  if (addButton) {
    addButton.addEventListener("click", openAddProduct);
  }

  const loginButton = document.getElementById("adminLoginButton");

  if (loginButton) {
    loginButton.addEventListener("click", openLogin);
  }

  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.addEventListener("click", logoutAdmin);
  }

  const loginForm = document.getElementById("adminLoginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", loginAdmin);
  }

  const productForm = document.getElementById("productForm");

  if (productForm) {
    productForm.addEventListener("submit", saveProduct);
  }

  const hargaBeli = document.getElementById("hargaBeli");

  const hargaJual = document.getElementById("hargaJual");

  if (hargaBeli) {
    hargaBeli.addEventListener("input", calculateProfit);
  }

  if (hargaJual) {
    hargaJual.addEventListener("input", calculateProfit);
  }

  const foto = document.getElementById("foto");

  if (foto) {
    foto.addEventListener("change", previewPhoto);
  }

  const closeViewer = document.getElementById("closeImageViewer");

  if (closeViewer) {
    closeViewer.addEventListener("click", closeImageViewer);
  }

  const imageViewer = document.getElementById("imageViewer");

  if (imageViewer) {
    imageViewer.addEventListener("click", function (event) {
      if (event.target === imageViewer) {
        closeImageViewer();
      }
    });
  }
}

// ======================================================
// SESSION
// ======================================================

function checkSession() {
  const saved = localStorage.getItem("tokoBajuAdmin");

  if (!saved) {
    showBuyerMode();

    return;
  }

  try {
    const session = JSON.parse(saved);

    if (session && session.role === "ADMIN" && session.token) {
      currentUser = session;

      showAdminMode();
    } else {
      showBuyerMode();
    }
  } catch (error) {
    localStorage.removeItem("tokoBajuAdmin");

    showBuyerMode();
  }
}

// ======================================================
// ADMIN CHECK
// ======================================================

function isAdmin() {
  return currentUser && currentUser.role === "ADMIN" && currentUser.token;
}

// ======================================================
// BUYER MODE
// ======================================================

function showBuyerMode() {
  currentUser = null;

  const dashboard = document.getElementById("adminDashboard");

  const buyerInfo = document.getElementById("buyerInfo");

  const addButton = document.getElementById("addProductButton");

  const loginButton = document.getElementById("adminLoginButton");

  const logoutButton = document.getElementById("logoutButton");

  const modeInfo = document.getElementById("modeInfo");

  if (dashboard) {
    dashboard.style.display = "none";
  }

  if (buyerInfo) {
    buyerInfo.style.display = "block";
  }

  if (addButton) {
    addButton.style.display = "none";
  }

  if (loginButton) {
    loginButton.style.display = "inline-flex";
  }

  if (logoutButton) {
    logoutButton.style.display = "none";
  }

  if (modeInfo) {
    modeInfo.textContent = "🛍️ Buyer";
  }

  /*
   * Buyer hanya melihat READY.
   */

  updateBuyerStatusFilter();

  loadProducts();
}

// ======================================================
// ADMIN MODE
// ======================================================

function showAdminMode() {
  const dashboard = document.getElementById("adminDashboard");

  const buyerInfo = document.getElementById("buyerInfo");

  const addButton = document.getElementById("addProductButton");

  const loginButton = document.getElementById("adminLoginButton");

  const logoutButton = document.getElementById("logoutButton");

  const modeInfo = document.getElementById("modeInfo");

  if (dashboard) {
    dashboard.style.display = "grid";
  }

  if (buyerInfo) {
    buyerInfo.style.display = "none";
  }

  if (addButton) {
    addButton.style.display = "inline-flex";
  }

  if (loginButton) {
    loginButton.style.display = "none";
  }

  if (logoutButton) {
    logoutButton.style.display = "inline-flex";
  }

  if (modeInfo) {
    modeInfo.textContent = "👨‍💼 Admin: " + (currentUser.username || "");
  }

  updateBuyerStatusFilter();

  loadProducts();
}

// ======================================================
// STATUS FILTER
// ======================================================

function updateBuyerStatusFilter() {
  const filter = document.getElementById("statusFilter");

  if (!filter) {
    return;
  }

  if (isAdmin()) {
    filter.innerHTML = `
      <option value="ALL">
        Semua Status
      </option>

      <option value="READY">
        READY
      </option>

      <option value="SOLD">
        SOLD
      </option>
    `;
  } else {
    filter.innerHTML = `
      <option value="ALL">
        Semua Produk
      </option>

      <option value="READY">
        READY
      </option>
    `;
  }
}

// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {
  const loading = document.getElementById("loading");

  if (loading) {
    loading.style.display = "block";
  }

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

    products = result.data || [];

    renderProducts();
  } catch (error) {
    console.error(error);

    const container = document.getElementById("productContainer");

    if (container) {
      container.innerHTML = `

        <div class="empty">

          <h3>
            ⚠️ Gagal memuat data
          </h3>

          <p>
            ${escapeHtml(error.message)}
          </p>

        </div>
      `;
    }
  } finally {
    if (loading) {
      loading.style.display = "none";
    }
  }
}

// ======================================================
// RENDER PRODUCTS
// ======================================================

function renderProducts() {
  const searchInput = document.getElementById("searchInput");

  const statusFilter = document.getElementById("statusFilter");

  const container = document.getElementById("productContainer");

  if (!container) {
    return;
  }

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const status = statusFilter ? statusFilter.value : "ALL";

  let filtered = products.filter(function (product) {
    const nama = String(product.nama || "").toLowerCase();

    const deskripsi = String(product.deskripsi || "").toLowerCase();

    const productStatus = String(product.status || "").toUpperCase();

    const matchSearch = nama.includes(keyword) || deskripsi.includes(keyword);

    const matchStatus = status === "ALL" || productStatus === status;

    return matchSearch && matchStatus;
  });

  /*
   * BUYER
   *
   * Produk SOLD tidak pernah
   * ditampilkan.
   */

  if (!isAdmin()) {
    filtered = filtered.filter(function (product) {
      return String(product.status || "").toUpperCase() !== "SOLD";
    });
  }

  /*
   * ADMIN
   *
   * Dashboard tetap menghitung
   * READY + SOLD.
   */

  if (isAdmin()) {
    updateDashboard(filtered);
  }

  if (!filtered.length) {
    container.innerHTML = `

      <div class="empty">

        <h3>
          📭 Tidak ada produk
        </h3>

        <p style="margin-top:8px">
          ${
            isAdmin()
              ? "Belum ada produk yang sesuai."
              : "Saat ini belum ada produk tersedia."
          }
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML = filtered
    .map(function (product) {
      return isAdmin() ? adminProductCard(product) : buyerProductCard(product);
    })
    .join("");
}

// ======================================================
// BUYER CARD
// ======================================================

function buyerProductCard(product) {
  const foto = product.foto || "";

  return `

    <div class="product-card">

      <div
        class="product-image-wrapper"
        onclick="openImageViewer('${escapeAttribute(foto)}')"
      >

        ${
          foto
            ? `

              <img
                src="${escapeAttribute(foto)}"
                class="product-image"
                alt="${escapeAttribute(product.nama)}"
                onerror="this.src=''; this.alt='Gambar gagal dimuat'"
              >

            `
            : `

              <div class="no-image">
                📷 Tidak ada foto
              </div>

            `
        }

      </div>


      <div class="product-content">

        <h3>
          ${escapeHtml(product.nama)}
        </h3>


        <p class="description">
          ${escapeHtml(product.deskripsi)}
        </p>


        <div class="price">

          ${formatRupiah(product.hargaJual)}

        </div>


        <div class="product-info">

          <span>
            Stok:
            <strong>
              ${Number(product.stok || 0)}
            </strong>
          </span>

          <span class="status ready">
            READY
          </span>

        </div>


        <button
          class="btn-whatsapp"
          onclick="beliWhatsApp('${escapeAttribute(product.id)}')"
        >
          💬 Beli via WhatsApp
        </button>

      </div>

    </div>

  `;
}

// ======================================================
// ADMIN CARD
// ======================================================

function adminProductCard(product) {
  const status = String(product.status || "").toUpperCase();

  const statusClass = status === "SOLD" ? "sold" : "ready";

  return `

    <div class="product-card">

      <div
        class="product-image-wrapper"
        onclick="openImageViewer('${escapeAttribute(product.foto || "")}')"
      >

        ${
          product.foto
            ? `

              <img
                src="${escapeAttribute(product.foto)}"
                class="product-image"
                alt="${escapeAttribute(product.nama)}"
                onerror="this.src=''; this.alt='Gambar gagal dimuat'"
              >

            `
            : `

              <div class="no-image">
                📷 Tidak ada foto
              </div>

            `
        }

      </div>


      <div class="product-content">

        <h3>
          ${escapeHtml(product.nama)}
        </h3>


        <p class="description">
          ${escapeHtml(product.deskripsi)}
        </p>


        <div class="admin-price">

          <div>
            Harga Beli:
            <strong>
              ${formatRupiah(product.hargaBeli)}
            </strong>
          </div>

          <div>
            Harga Jual:
            <strong>
              ${formatRupiah(product.hargaJual)}
            </strong>
          </div>

          <div>
            Profit:
            <strong>
              ${formatRupiah(product.profit)}
            </strong>
          </div>

        </div>


        <div class="product-info">

          <span>
            Stok:
            <strong>
              ${Number(product.stok || 0)}
            </strong>
          </span>


          <span class="status ${statusClass}">
            ${status}
          </span>

        </div>


        <div class="admin-actions">

          ${
            status !== "SOLD"
              ? `

                <button
                  class="btn-sold"
                  onclick="markProductSold('${escapeAttribute(product.id)}')"
                >
                  ✓ SOLD
                </button>

              `
              : ""
          }


          <button
            class="btn-edit"
            onclick="editProduct('${escapeAttribute(product.id)}')"
          >
            ✏️ Edit
          </button>


          <button
            class="btn-delete"
            onclick="deleteProduct('${escapeAttribute(product.id)}')"
          >
            🗑️ Hapus
          </button>

        </div>

      </div>

    </div>

  `;
}

// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard(list) {
  let totalProduk = 0;

  let totalReady = 0;

  let totalSold = 0;

  let totalModal = 0;

  let totalPenjualan = 0;

  let totalProfit = 0;

  list.forEach(function (product) {
    totalProduk++;

    const status = String(product.status || "").toUpperCase();

    const hargaBeli = Number(product.hargaBeli || 0);

    const hargaJual = Number(product.hargaJual || 0);

    const profit = Number(product.profit || 0);

    const stok = Number(product.stok || 0);

    /*
     * Gunakan STOK AWAL.
     *
     * Jadi SOLD dengan stok tersedia
     * 0 tetap mempunyai modal.
     */

    let stokAwal = Number(product.stokAwal || product.stokawal || 0);

    /*
     * Untuk data lama yang belum
     * mempunyai stokawal:
     *
     * kalau stok masih > 0,
     * gunakan stok.
     */

    if (!stokAwal && stok > 0) {
      stokAwal = stok;
    }

    // ----------------------------------
    // STATUS
    // ----------------------------------

    if (status === "READY") {
      totalReady++;
    }

    if (status === "SOLD") {
      totalSold++;
    }

    // ----------------------------------
    // TOTAL MODAL
    //
    // READY + SOLD
    //
    // Harga Beli × Stok Awal
    // ----------------------------------

    totalModal += hargaBeli * stokAwal;

    // ----------------------------------
    // PENJUALAN
    // ----------------------------------

    if (status === "SOLD") {
      totalPenjualan += hargaJual;

      totalProfit += profit;
    }
  });

  setText("totalProduk", totalProduk);

  setText("totalReady", totalReady);

  setText("totalSold", totalSold);

  setText("totalModal", formatRupiah(totalModal));

  setText("totalPenjualan", formatRupiah(totalPenjualan));

  setText("totalProfit", formatRupiah(totalProfit));
}

// ======================================================
// ADD PRODUCT
// ======================================================

function openAddProduct() {
  editId = null;

  currentPhotoUrl = "";

  setText("productModalTitle", "Tambah Produk");

  resetProductForm();

  showModal("productModal");
}

// ======================================================
// EDIT PRODUCT
// ======================================================

function editProduct(id) {
  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    alert("Produk tidak ditemukan.");

    return;
  }

  editId = product.id;

  currentPhotoUrl = product.foto || "";

  setText("productModalTitle", "Edit Produk");

  setValue("productId", product.id);

  setValue("nama", product.nama);

  setValue("deskripsi", product.deskripsi);

  setValue("hargaBeli", product.hargaBeli);

  setValue("hargaJual", product.hargaJual);

  setValue("stok", product.stok);

  const preview = document.getElementById("photoPreview");

  if (preview && product.foto) {
    preview.src = product.foto;

    preview.style.display = "block";
  }

  calculateProfit();

  showModal("productModal");
}

// ======================================================
// RESET FORM
// ======================================================

function resetProductForm() {
  const form = document.getElementById("productForm");

  if (form) {
    form.reset();
  }

  setValue("productId", "");

  setText("profitPreview", "Rp0");

  const preview = document.getElementById("photoPreview");

  if (preview) {
    preview.src = "";

    preview.style.display = "none";
  }

  const message = document.getElementById("formMessage");

  if (message) {
    message.textContent = "";
  }
}

// ======================================================
// CLOSE PRODUCT
// ======================================================

function closeProduct() {
  hideModal("productModal");
}

// ======================================================
// LOGIN MODAL
// ======================================================

function openLogin() {
  const modal = document.getElementById("adminLoginModal");

  if (modal) {
    modal.style.display = "flex";
  }
}

function closeLogin() {
  hideModal("adminLoginModal");
}

// ======================================================
// LOGIN ADMIN
// ======================================================

async function loginAdmin(event) {
  event.preventDefault();

  const username = getValue("loginUsername");

  const password = getValue("loginPassword");

  const message = document.getElementById("loginMessage");

  if (message) {
    message.textContent = "Memproses login...";
  }

  try {
    const result = await postData({
      action: "login",

      username: username,

      password: password,
    });

    if (!result.success) {
      throw new Error(result.message || "Login gagal.");
    }

    currentUser = {
      username: result.username,

      role: result.role,

      token: result.token,
    };

    localStorage.setItem("tokoBajuAdmin", JSON.stringify(currentUser));

    closeLogin();

    showAdminMode();
  } catch (error) {
    if (message) {
      message.textContent = error.message;
    }
  }
}

// ======================================================
// LOGOUT
// ======================================================

function logoutAdmin() {
  localStorage.removeItem("tokoBajuAdmin");

  currentUser = null;

  showBuyerMode();
}

// ======================================================
// PREVIEW PHOTO
// ======================================================

async function previewPhoto(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  /*
   * Maksimal 5 MB
   */

  if (file.size > 5 * 1024 * 1024) {
    alert("Foto terlalu besar. Maksimal 5 MB.");

    event.target.value = "";

    return;
  }

  try {
    const compressed = await compressImage(file);

    currentPhotoUrl = compressed;

    const preview = document.getElementById("photoPreview");

    if (preview) {
      preview.src = compressed;

      preview.style.display = "block";
    }
  } catch (error) {
    alert("Gagal memproses foto.");
  }
}

// ======================================================
// COMPRESS IMAGE
// ======================================================

function compressImage(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = new Image();

      image.onload = function () {
        const maxWidth = 1200;

        let width = image.width;

        let height = image.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;

          width = maxWidth;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;

        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };

      image.onerror = reject;

      image.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// ======================================================
// UPLOAD PHOTO
// ======================================================

async function uploadPhoto() {
  if (!currentPhotoUrl) {
    return "";
  }

  /*
   * Jika foto tidak berubah
   * dan sudah berupa URL Drive,
   * jangan upload lagi.
   */

  if (currentPhotoUrl.startsWith("http")) {
    return currentPhotoUrl;
  }

  const result = await postData({
    action: "upload",

    token: currentUser.token,

    base64: currentPhotoUrl,

    fileName: "produk_" + Date.now() + ".jpg",
  });

  if (!result.success) {
    throw new Error(result.message || "Upload foto gagal.");
  }

  return result.url;
}

// ======================================================
// SAVE PRODUCT
// ======================================================

async function saveProduct(event) {
  event.preventDefault();

  if (!isAdmin()) {
    alert("Silakan login sebagai Admin.");

    return;
  }

  const button = document.getElementById("saveProductButton");

  const message = document.getElementById("formMessage");

  try {
    if (button) {
      button.disabled = true;

      button.textContent = "Menyimpan...";
    }

    const foto = await uploadPhoto();

    const data = {
      action: editId ? "update" : "add",

      token: currentUser.token,

      id: editId || "",

      foto: foto,

      nama: getValue("nama"),

      deskripsi: getValue("deskripsi"),

      hargaBeli: Number(getValue("hargaBeli") || 0),

      hargaJual: Number(getValue("hargaJual") || 0),

      stok: Number(getValue("stok") || 0),
    };

    const result = await postData(data);

    if (!result.success) {
      throw new Error(result.message || "Gagal menyimpan.");
    }

    closeProduct();

    await loadProducts();

    alert(
      editId ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.",
    );
  } catch (error) {
    if (message) {
      message.textContent = error.message;
    }

    alert(error.message);
  } finally {
    if (button) {
      button.disabled = false;

      button.textContent = "Simpan Produk";
    }
  }
}

// ======================================================
// MARK PRODUCT SOLD
// ======================================================

async function markProductSold(id) {
  if (!isAdmin()) {
    return;
  }

  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    return;
  }

  const confirmSold = confirm(
    'Tandai produk "' + product.nama + '" sebagai SOLD?',
  );

  if (!confirmSold) {
    return;
  }

  try {
    const result = await postData({
      action: "sold",

      token: currentUser.token,

      id: id,
    });

    if (!result.success) {
      throw new Error(result.message || "Gagal mengubah status.");
    }

    await loadProducts();

    alert("Produk berhasil ditandai SOLD.");
  } catch (error) {
    alert(error.message);
  }
}

// ======================================================
// DELETE PRODUCT
// ======================================================

async function deleteProduct(id) {
  if (!isAdmin()) {
    return;
  }

  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  const confirmDelete = confirm(
    'Hapus produk "' + (product ? product.nama : "") + '"?',
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const result = await postData({
      action: "delete",

      token: currentUser.token,

      id: id,
    });

    if (!result.success) {
      throw new Error(result.message || "Gagal menghapus.");
    }

    await loadProducts();

    alert("Produk berhasil dihapus.");
  } catch (error) {
    alert(error.message);
  }
}

// ======================================================
// WHATSAPP
// ======================================================

function beliWhatsApp(id) {
  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    return;
  }

  const message =
    "Halo, saya ingin membeli produk:%0A%0A" +
    "Nama: " +
    encodeURIComponent(product.nama) +
    "%0A" +
    "Harga: " +
    encodeURIComponent(formatRupiah(product.hargaJual));

  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + message;

  window.open(url, "_blank");
}

// ======================================================
// IMAGE VIEWER
// ======================================================

function openImageViewer(url) {
  if (!url) {
    return;
  }

  const viewer = document.getElementById("imageViewer");

  const image = document.getElementById("largeImage");

  if (!viewer || !image) {
    return;
  }

  image.src = url;

  viewer.style.display = "flex";
}

function closeImageViewer() {
  const viewer = document.getElementById("imageViewer");

  if (viewer) {
    viewer.style.display = "none";
  }
}

// ======================================================
// CALCULATE PROFIT
// ======================================================

function calculateProfit() {
  const hargaBeli = Number(getValue("hargaBeli") || 0);

  const hargaJual = Number(getValue("hargaJual") || 0);

  const profit = hargaJual - hargaBeli;

  setText("profitPreview", formatRupiah(profit));
}

// ======================================================
// POST DATA
// ======================================================

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

// ======================================================
// FORMAT RUPIAH
// ======================================================

function formatRupiah(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",

    currency: "IDR",

    maximumFractionDigits: 0,
  }).format(number);
}

// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================================================
// ESCAPE ATTRIBUTE
// ======================================================

function escapeAttribute(value) {
  return escapeHtml(value);
}

// ======================================================
// SET TEXT
// ======================================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

// ======================================================
// GET VALUE
// ======================================================

function getValue(id) {
  const element = document.getElementById(id);

  return element ? element.value : "";
}

// ======================================================
// SET VALUE
// ======================================================

function setValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value ?? "";
  }
}

// ======================================================
// SHOW MODAL
// ======================================================

function showModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.style.display = "flex";
  }
}

// ======================================================
// HIDE MODAL
// ======================================================

function hideModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.style.display = "none";
  }
}
