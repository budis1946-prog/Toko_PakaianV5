/****************************************************
 * TOKO PAKAIAN - JAVASCRIPT
 ****************************************************/

/* ==================================================
   CONFIG
================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwYtDzZcBObWxY9AJHT-QT5wtW-aqtaSpkbwlEeT4FQJU-YiffKK33HBR65sKEfMnNV/exec";

const WHATSAPP_NUMBER = "6283160104255";

/* ==================================================
   GLOBAL
================================================== */

let products = [];

let currentUser = null;

let editId = null;

let currentPhotoUrl = "";

/* ==================================================
   START
================================================== */

document.addEventListener("DOMContentLoaded", function () {
  checkSession();
  setupFilterListeners();
});

/* ==================================================
   SESSION
================================================== */

function checkSession() {
  const saved = localStorage.getItem("tokoBajuUser");

  if (saved) {
    try {
      const user = JSON.parse(saved);

      if (user && user.role === "ADMIN" && user.token) {
        currentUser = user;

        showAdminMode();

        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // DEFAULT = BUYER
  currentUser = {
    role: "BUYER",
  };

  showBuyerMode();
}

/* ==================================================
   BUYER MODE
================================================== */

function showBuyerMode() {
  document.getElementById("buyerArea").classList.remove("hidden");

  document.getElementById("adminArea").classList.add("hidden");

  document.getElementById("adminLoginBtn").classList.remove("hidden");

  document.getElementById("logoutBtn").classList.add("hidden");

  document.getElementById("userInfo").textContent = "🛍️ Buyer";

  loadProducts();
}

/* ==================================================
   ADMIN MODE
================================================== */

function showAdminMode() {
  document.getElementById("buyerArea").classList.add("hidden");

  document.getElementById("adminArea").classList.remove("hidden");

  document.getElementById("adminLoginBtn").classList.add("hidden");

  document.getElementById("logoutBtn").classList.remove("hidden");

  document.getElementById("userInfo").textContent =
    "🔐 Admin: " + (currentUser.username || "");

  loadProducts();
}

/* ==================================================
   LOAD PRODUCTS
================================================== */

async function loadProducts() {
  const loading = document.getElementById("loading");

  if (loading) {
    loading.classList.remove("hidden");
  }

  try {
    let url = API_URL + "?action=list";

    // Admin menggunakan token
    if (currentUser && currentUser.role === "ADMIN" && currentUser.token) {
      url += "&token=" + encodeURIComponent(currentUser.token);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Gagal memuat data.");
    }

    products = Array.isArray(result.data) ? result.data : [];

    renderProducts();
  } catch (error) {
    console.error(error);

    showError(
      "Gagal memuat data produk. " + "Periksa URL API dan koneksi internet.",
    );
  } finally {
    if (loading) {
      loading.classList.add("hidden");
    }
  }
}

/* ==================================================
   FILTER LISTENERS
================================================== */

function setupFilterListeners() {
  const adminStatusFilter = document.getElementById("adminStatusFilter");

  if (adminStatusFilter) {
    adminStatusFilter.addEventListener("change", function () {
      renderProducts();
    });
  }

  const adminSearchInput = document.getElementById("adminSearchInput");

  if (adminSearchInput) {
    adminSearchInput.addEventListener("input", function () {
      renderProducts();
    });
  }

  const statusFilter = document.getElementById("statusFilter");

  if (statusFilter) {
    statusFilter.addEventListener("change", function () {
      renderProducts();
    });
  }

  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderProducts();
    });
  }
}

/* ==================================================
   RENDER PRODUCTS
================================================== */

function renderProducts() {
  let list = [...products];

  /* ================================================
     BUYER
  ================================================ */

  if (!currentUser || currentUser.role !== "ADMIN") {
    // HANYA READY
    list = list.filter(function (p) {
      return (
        String(p.status || "")
          .trim()
          .toUpperCase() === "READY"
      );
    });

    // SEARCH BUYER
    const searchInput = document.getElementById("searchInput");

    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

    if (keyword) {
      list = list.filter(function (p) {
        return (
          String(p.nama || "")
            .toLowerCase()
            .includes(keyword) ||
          String(p.deskripsi || "")
            .toLowerCase()
            .includes(keyword)
        );
      });
    }

    // FILTER READY
    const filter = document.getElementById("statusFilter");

    if (filter && filter.value !== "ALL") {
      list = list.filter(function (p) {
        return String(p.status).toUpperCase() === filter.value;
      });
    }

    renderBuyerProducts(list);

    return;
  }

  /* ================================================
   ADMIN
================================================ */

  const searchInput = document.getElementById("adminSearchInput");

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  // Filter berdasarkan pencarian
  if (keyword) {
    list = list.filter(function (p) {
      return (
        String(p.nama || "")
          .toLowerCase()
          .includes(keyword) ||
        String(p.deskripsi || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }

  // Filter berdasarkan status
  const filter = document.getElementById("adminStatusFilter");

  if (filter && filter.value !== "ALL") {
    list = list.filter(function (p) {
      return (
        String(p.status || "")
          .trim()
          .toUpperCase() === filter.value
      );
    });
  }

  /*
   * SUMMARY MENGIKUTI FILTER
   */
  updateDashboard(list);

  // Tampilkan produk hasil filter
  renderAdminProducts(list);
}

/* ==================================================
   BUYER PRODUCTS
================================================== */

function renderBuyerProducts(list) {
  const grid = document.getElementById("productGrid");

  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `

      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:50px;
        color:#777;
      ">

        <h3>Produk belum tersedia</h3>

        <p>
          Belum ada produk READY.
        </p>

      </div>

    `;

    return;
  }

  grid.innerHTML = list.map(buyerProductCard).join("");
}

/* ==================================================
   BUYER CARD
================================================== */

function buyerProductCard(product) {
  const image =
    product.foto || "https://via.placeholder.com/600x600?text=No+Image";

  const whatsappMessage = encodeURIComponent(
    "Halo Ashera.id, saya ingin membeli:\n\n" +
      "Nama: " +
      (product.nama || "") +
      "\n" +
      "Harga: " +
      formatRupiah(product.hargaJual) +
      "\n\nApakah masih tersedia?",
  );

  const whatsappUrl =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + whatsappMessage;

  return `

    <div class="product-card">

      <img
        class="product-image"
        src="${escapeAttribute(image)}"
        alt="${escapeAttribute(product.nama)}"
        loading="lazy"
        onclick="openImageViewer('${escapeAttribute(image)}')"
        onerror="this.src='https://via.placeholder.com/600x600?text=Gambar+Gagal+Dimuat'"
      >


      <div class="product-body">

        <div class="product-name">
          ${escapeHtml(product.nama)}
        </div>


        <div class="product-description">
          ${escapeHtml(product.deskripsi || "-")}
        </div>


        <div class="product-price">
          ${formatRupiah(product.hargaJual)}
        </div>


        <div class="product-meta">

          <span class="status status-ready">
            READY
          </span>

        </div>


        <a
          href="${whatsappUrl}"
          target="_blank"
          class="whatsapp-btn"
        >
          💬 Beli via WhatsApp
        </a>

      </div>

    </div>

  `;
}

/* ==================================================
   ADMIN PRODUCTS
================================================== */

function renderAdminProducts(list) {
  const grid = document.getElementById("adminProductGrid");

  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `

      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:50px;
        color:#777;
      ">

        <h3>Tidak ada produk</h3>

      </div>

    `;

    return;
  }

  grid.innerHTML = list.map(adminProductCard).join("");
}

/* ==================================================
   ADMIN CARD
================================================== */

function adminProductCard(product) {
  const image =
    product.foto || "https://via.placeholder.com/600x600?text=No+Image";

  const status = String(product.status || "READY").toUpperCase();

  let actions = "";

  if (status === "READY") {
    actions = `

      <button
        class="btn btn-success"
        onclick="markProductSold('${escapeAttribute(product.id)}')"
      >
        ✓ SOLD
      </button>

    `;
  }

  return `

    <div class="product-card">

      <img
        class="product-image"
        src="${escapeAttribute(image)}"
        alt="${escapeAttribute(product.nama)}"
        loading="lazy"
        onclick="openImageViewer('${escapeAttribute(image)}')"
        onerror="this.src='https://via.placeholder.com/600x600?text=Gambar+Gagal+Dimuat'"
      >


      <div class="product-body">

        <div class="product-name">
          ${escapeHtml(product.nama)}
        </div>


        <div class="product-description">
          ${escapeHtml(product.deskripsi || "-")}
        </div>


        <div style="margin-bottom:8px">
          <small>
            Harga Beli
          </small>

          <div>
            <strong>
              ${formatRupiah(product.hargaBeli)}
            </strong>
          </div>
        </div>


        <div style="margin-bottom:8px">

          <small>
            Harga Jual
          </small>

          <div class="product-price">
            ${formatRupiah(product.hargaJual)}
          </div>

        </div>


        <div style="margin-bottom:10px">

          <small>
            Profit
          </small>

          <div>
            <strong>
              ${formatRupiah(product.profit)}
            </strong>
          </div>

        </div>


        <span
          class="status ${status === "SOLD" ? "status-sold" : "status-ready"}"
        >
          ${status}
        </span>


        <div class="admin-actions">

          <button
            class="btn btn-warning"
            onclick="editProduct('${escapeAttribute(product.id)}')"
          >
            ✏️ Edit
          </button>


          ${actions}


          <button
            class="btn btn-danger"
            onclick="deleteProduct('${escapeAttribute(product.id)}')"
          >
            🗑️ Hapus
          </button>

        </div>

      </div>

    </div>

  `;
}

/* ==================================================
   DASHBOARD
================================================== */

function updateDashboard(list) {
  // Total produk berdasarkan filter
  const total = list.length;

  // READY berdasarkan filter
  const ready = list.filter(function (p) {
    return (
      String(p.status || "")
        .trim()
        .toUpperCase() === "READY"
    );
  }).length;

  // SOLD berdasarkan filter
  const sold = list.filter(function (p) {
    return (
      String(p.status || "")
        .trim()
        .toUpperCase() === "SOLD"
    );
  }).length;

  // Total Modal
  const totalModal = list.reduce(function (total, p) {
    return total + (Number(p.hargaBeli) || 0);
  }, 0);

  // Total Penjualan
  const totalPenjualan = list
    .filter(function (p) {
      return (
        String(p.status || "")
          .trim()
          .toUpperCase() === "SOLD"
      );
    })
    .reduce(function (total, p) {
      return total + (Number(p.hargaJual) || 0);
    }, 0);

  // Total Profit
  const totalProfit = list
    .filter(function (p) {
      return (
        String(p.status || "")
          .trim()
          .toUpperCase() === "SOLD"
      );
    })
    .reduce(function (total, p) {
      return total + (Number(p.profit) || 0);
    }, 0);

  // Tampilkan ke dashboard

  document.getElementById("totalProduk").textContent = total;

  document.getElementById("totalReady").textContent = ready;

  document.getElementById("totalSold").textContent = sold;

  document.getElementById("totalModal").textContent = formatRupiah(totalModal);

  document.getElementById("totalPenjualan").textContent =
    formatRupiah(totalPenjualan);

  document.getElementById("totalProfit").textContent =
    formatRupiah(totalProfit);
}

/* ==================================================
   LOGIN MODAL
================================================== */

function openLoginModal() {
  document.getElementById("loginModal").classList.remove("hidden");

  document.getElementById("loginUsername").focus();
}

function closeLoginModal() {
  document.getElementById("loginModal").classList.add("hidden");

  document.getElementById("loginError").textContent = "";
}

/* ==================================================
   LOGIN ADMIN
================================================== */

async function loginAdmin(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();

  const password = document.getElementById("loginPassword").value;

  const errorBox = document.getElementById("loginError");

  errorBox.textContent = "Sedang login...";

  try {
    const result = await postData({
      action: "login",

      username: username,

      password: password,
    });

    if (!result.success) {
      errorBox.textContent = result.message || "Login gagal.";

      return;
    }

    currentUser = {
      username: result.username,

      role: "ADMIN",

      token: result.token,
    };

    localStorage.setItem(
      "tokoBajuUser",

      JSON.stringify(currentUser),
    );

    document.getElementById("loginUsername").value = "";

    document.getElementById("loginPassword").value = "";

    closeLoginModal();

    showAdminMode();
  } catch (error) {
    errorBox.textContent = error.message || "Login gagal.";
  }
}

/* ==================================================
   LOGOUT
================================================== */

function logoutAdmin() {
  localStorage.removeItem("tokoBajuUser");

  currentUser = {
    role: "BUYER",
  };

  showBuyerMode();
}

/* ==================================================
   PRODUCT MODAL
================================================== */

function openProductModal() {
  editId = null;

  currentPhotoUrl = "";

  document.getElementById("productModalTitle").textContent = "Tambah Produk";

  document.getElementById("productId").value = "";

  document.getElementById("productName").value = "";

  document.getElementById("productDescription").value = "";

  document.getElementById("productBuyPrice").value = "";

  document.getElementById("productSellPrice").value = "";

  document.getElementById("productPhoto").value = "";

  document.getElementById("productPhotoUrl").value = "";

  document.getElementById("photoPreview").innerHTML = "";

  document.getElementById("productModal").classList.remove("hidden");
}

function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

/* ==================================================
   EDIT PRODUCT
================================================== */

function editProduct(id) {
  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    alert("Produk tidak ditemukan.");

    return;
  }

  editId = product.id;

  currentPhotoUrl = product.foto || "";

  document.getElementById("productModalTitle").textContent = "Edit Produk";

  document.getElementById("productId").value = product.id;

  document.getElementById("productName").value = product.nama || "";

  document.getElementById("productDescription").value = product.deskripsi || "";

  document.getElementById("productBuyPrice").value = product.hargaBeli || 0;

  document.getElementById("productSellPrice").value = product.hargaJual || 0;

  document.getElementById("productPhotoUrl").value = product.foto || "";

  document.getElementById("productPhoto").value = "";

  if (product.foto) {
    document.getElementById("photoPreview").innerHTML = `

        <img
          src="${escapeAttribute(product.foto)}"
          onerror="this.style.display='none'"
        >

      `;
  }

  document.getElementById("productModal").classList.remove("hidden");
}

/* ==================================================
   SAVE PRODUCT
================================================== */

async function saveProduct(event) {
  event.preventDefault();

  const button = document.getElementById("saveProductBtn");

  button.disabled = true;

  button.textContent = "Menyimpan...";

  try {
    const id = document.getElementById("productId").value.trim();

    const nama = document.getElementById("productName").value.trim();

    const deskripsi = document
      .getElementById("productDescription")
      .value.trim();

    const hargaBeli =
      Number(document.getElementById("productBuyPrice").value) || 0;

    const hargaJual =
      Number(document.getElementById("productSellPrice").value) || 0;

    let foto = document.getElementById("productPhotoUrl").value.trim();

    const photoFile = document.getElementById("productPhoto").files[0];

    /* ============================================
       UPLOAD FOTO BARU
    ============================================ */

    if (photoFile) {
      if (photoFile.size > 5 * 1024 * 1024) {
        throw new Error("Foto terlalu besar. Maksimal 5 MB.");
      }

      button.textContent = "Mengompres foto...";

      const compressed = await compressImage(photoFile);

      button.textContent = "Mengupload foto...";

      const uploadResult = await postData({
        action: "upload",

        token: currentUser.token,

        base64: compressed.base64,

        mimeType: compressed.mimeType,
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }

      foto = uploadResult.url;
    }

    /* ============================================
       ADD / UPDATE
    ============================================ */

    const action = id ? "update" : "add";

    button.textContent = "Menyimpan...";

    const data = {
      action: action,

      token: currentUser.token,

      id: id,

      foto: foto,

      nama: nama,

      deskripsi: deskripsi,

      hargaBeli: hargaBeli,

      hargaJual: hargaJual,
    };

    const result = await postData(data);

    if (!result.success) {
      throw new Error(result.message || "Gagal menyimpan.");
    }

    alert(result.message || "Berhasil disimpan.");

    closeProductModal();

    await loadProducts();
  } catch (error) {
    alert(error.message || "Terjadi kesalahan.");
  } finally {
    button.disabled = false;

    button.textContent = "Simpan Produk";
  }
}

/* ==================================================
   MARK SOLD
================================================== */

async function markProductSold(id) {
  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    return;
  }

  const confirmSold = confirm(
    "Ubah produk '" + product.nama + "' menjadi SOLD?",
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
      throw new Error(result.message);
    }

    alert("Produk berhasil menjadi SOLD.");

    await loadProducts();
  } catch (error) {
    alert(error.message || "Gagal mengubah status.");
  }
}

/* ==================================================
   DELETE
================================================== */

async function deleteProduct(id) {
  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    return;
  }

  const confirmed = confirm("Hapus produk '" + product.nama + "'?");

  if (!confirmed) {
    return;
  }

  try {
    const result = await postData({
      action: "delete",

      token: currentUser.token,

      id: id,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    alert("Produk berhasil dihapus.");

    await loadProducts();
  } catch (error) {
    alert(error.message || "Gagal menghapus produk.");
  }
}

/* ==================================================
   PHOTO PREVIEW
================================================== */

function previewPhoto(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Foto terlalu besar. Maksimal 5 MB.");

    event.target.value = "";

    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    document.getElementById("photoPreview").innerHTML = `

          <img
            src="${e.target.result}"
            alt="Preview"
          >

        `;
  };

  reader.readAsDataURL(file);
}

/* ==================================================
   COMPRESS IMAGE
================================================== */

function compressImage(file) {
  return new Promise(function (resolve, reject) {
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

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

        resolve({
          base64: dataUrl,

          mimeType: "image/jpeg",
        });
      };

      img.onerror = reject;

      img.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* ==================================================
   IMAGE VIEWER
================================================== */

function openImageViewer(url) {
  if (!url) {
    return;
  }

  document.getElementById("largeImage").src = url;

  document.getElementById("imageViewer").classList.remove("hidden");
}

function closeImageViewer() {
  document.getElementById("imageViewer").classList.add("hidden");

  document.getElementById("largeImage").src = "";
}

/* ==================================================
   POST DATA
================================================== */

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return await response.json();
}

/* ==================================================
   RUPIAH
================================================== */

function formatRupiah(value) {
  const number = Number(value) || 0;

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

/* ==================================================
   ESCAPE ATTRIBUTE
================================================== */

function escapeAttribute(value) {
  return escapeHtml(value);
}

/* ==================================================
   ERROR
================================================== */

function showError(message) {
  const errorBox = document.getElementById("errorMessage");

  if (!errorBox) {
    return;
  }

  errorBox.textContent = message;

  errorBox.classList.remove("hidden");
}
