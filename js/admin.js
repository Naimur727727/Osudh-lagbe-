/**
 * AuraMed+ Business Admin Portal Logic
 * Complete authentication, master controls, and live REST API integrations
 */

document.addEventListener("DOMContentLoaded", () => {
  // Authentication Elements
  const adminLoginGate = document.getElementById("adminLoginGate");
  const adminAppLayout = document.getElementById("adminAppLayout");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const adminProfileName = document.getElementById("adminProfileName");
  const adminProfileRole = document.getElementById("adminProfileRole");

  // KPI Elements
  const kpiRevenue = document.getElementById("kpiRevenue");
  const kpiOrders = document.getElementById("kpiOrders");
  const kpiRx = document.getElementById("kpiRx");
  const kpiStock = document.getElementById("kpiStock");

  // Tables
  const adminOrdersTableBody = document.getElementById("adminOrdersTableBody");
  const adminRxTableBody = document.getElementById("adminRxTableBody");
  const adminInventoryTableBody = document.getElementById("adminInventoryTableBody");

  // Action Buttons & Modals
  const refreshAdminBtn = document.getElementById("refreshAdminBtn");
  const openAddMedModalBtn = document.getElementById("openAddMedModalBtn");
  const closeAddMedModalBtn = document.getElementById("closeAddMedModalBtn");
  const addMedModal = document.getElementById("addMedModal");
  const addMedForm = document.getElementById("addMedForm");

  // Settings Forms
  const storeSettingsForm = document.getElementById("storeSettingsForm");
  const changePasswordForm = document.getElementById("changePasswordForm");

  /* --------------------------------------------------------------------------
     Authentication & Session Handling
     -------------------------------------------------------------------------- */
  function getAuthToken() {
    return localStorage.getItem("auramed_admin_token");
  }

  function setAuthToken(token, user) {
    localStorage.setItem("auramed_admin_token", token);
    localStorage.setItem("auramed_admin_user", JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem("auramed_admin_token");
    localStorage.removeItem("auramed_admin_user");
  }

  async function checkAuth() {
    const token = getAuthToken();
    if (!token) {
      showLoginScreen();
      return;
    }

    try {
      const res = await fetch("/api/admin/verify", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        showAppScreen(data.data);
      } else {
        showLoginScreen();
      }
    } catch (err) {
      // Offline fallback
      const savedUser = JSON.parse(localStorage.getItem("auramed_admin_user"));
      if (savedUser) {
        showAppScreen(savedUser);
      } else {
        showLoginScreen();
      }
    }
  }

  function showLoginScreen() {
    if (adminLoginGate) adminLoginGate.style.display = "flex";
    if (adminAppLayout) adminAppLayout.style.display = "none";
  }

  function showAppScreen(user) {
    if (adminLoginGate) adminLoginGate.style.display = "none";
    if (adminAppLayout) adminAppLayout.style.display = "grid";

    if (adminProfileName) adminProfileName.textContent = user.name || "Dr. Alex Vance";
    if (adminProfileRole) adminProfileRole.textContent = user.role || "Super Admin";

    loadAllData();
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const submitBtn = document.getElementById("btnAdminLoginSubmit");

      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying Credentials...";

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const result = await res.json();

        if (result.success && result.data) {
          setAuthToken(result.data.token, result.data);
          showAppScreen(result.data);
          showAdminToast("Welcome back! Full master access unlocked.", "success");
        } else {
          showAdminToast(result.message || "Invalid credentials", "error");
        }
      } catch (err) {
        console.error("Login request error:", err);
        showAdminToast("Connection error to auth server", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "🔓 Sign In to Admin Console";
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => {
      clearAuth();
      showLoginScreen();
      showAdminToast("You have been signed out.", "info");
    });
  }

  /* --------------------------------------------------------------------------
     Tab Switching
     -------------------------------------------------------------------------- */
  const navItems = document.querySelectorAll(".admin-nav-item");
  const tabContents = document.querySelectorAll(".admin-tab-content");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const targetTab = item.dataset.tab;
      if (targetTab === "tabOverview") {
        tabContents.forEach(c => {
          c.style.display = (c.id === "tabSettings") ? "none" : "block";
        });
      } else {
        tabContents.forEach(c => {
          c.style.display = (c.id === targetTab) ? "block" : "none";
        });
      }
    });
  });

  // Modal controls
  if (openAddMedModalBtn) openAddMedModalBtn.addEventListener("click", () => addMedModal.classList.add("active"));
  if (closeAddMedModalBtn) closeAddMedModalBtn.addEventListener("click", () => addMedModal.classList.remove("active"));
  if (addMedModal) {
    addMedModal.addEventListener("click", (e) => {
      if (e.target === addMedModal) addMedModal.classList.remove("active");
    });
  }

  /* --------------------------------------------------------------------------
     Data Fetching: Stats, Orders, Prescriptions, Inventory, Settings
     -------------------------------------------------------------------------- */
  function loadAllData() {
    loadStats();
    loadOrders();
    loadPrescriptions();
    loadInventory();
    loadSettings();
  }

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success && data.data) {
        if (kpiRevenue) kpiRevenue.textContent = `$${data.data.totalRevenue.toFixed(2)}`;
        if (kpiOrders) kpiOrders.textContent = data.data.totalOrders;
        if (kpiRx) kpiRx.textContent = data.data.pendingPrescriptions;
        if (kpiStock) kpiStock.textContent = data.data.activeProducts;
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!data.success || !adminOrdersTableBody) return;

      if (data.data.length === 0) {
        adminOrdersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders found.</td></tr>`;
        return;
      }

      adminOrdersTableBody.innerHTML = data.data.map(order => `
        <tr>
          <td>
            <strong>#${order.orderId}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${order.placedAt}</span>
          </td>
          <td>
            <strong>${order.customerName}</strong><br>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${order.phone}</span><br>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${order.address}</span>
          </td>
          <td>
            ${order.items.map(i => `<div style="font-size: 0.8rem;">• ${i.name} (×${i.quantity})</div>`).join("")}
          </td>
          <td>
            <strong>$${parseFloat(order.grandTotal || order.subtotal).toFixed(2)}</strong><br>
            <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted);">${order.paymentMethod}</span>
          </td>
          <td>
            <span class="admin-badge status-${order.status}">
              ${order.status.replace(/_/g, ' ')}
            </span>
          </td>
          <td>
            <select class="form-control change-order-status-select" data-order-id="${order.orderId}" style="font-size: 0.8rem; padding: 0.35rem 0.6rem;">
              <option value="">Update Status...</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'disabled' : ''}>Confirmed</option>
              <option value="verified" ${order.status === 'verified' ? 'disabled' : ''}>Pharmacist Verified</option>
              <option value="packing" ${order.status === 'packing' ? 'disabled' : ''}>Cold-Packed</option>
              <option value="out_for_delivery" ${order.status === 'out_for_delivery' ? 'disabled' : ''}>Out for Delivery</option>
              <option value="delivered" ${order.status === 'delivered' ? 'disabled' : ''}>Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'disabled' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `).join("");

      adminOrdersTableBody.querySelectorAll(".change-order-status-select").forEach(sel => {
        sel.addEventListener("change", async (e) => {
          const newStatus = e.target.value;
          if (!newStatus) return;
          const orderId = sel.dataset.orderId;

          try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus })
            });
            const result = await res.json();
            if (result.success) {
              showAdminToast(`Order #${orderId} updated to ${newStatus}`, "success");
              loadOrders();
              loadStats();
            }
          } catch (err) {
            showAdminToast("Failed to update status", "error");
          }
        });
      });
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  }

  async function loadPrescriptions() {
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (!data.success || !adminRxTableBody) return;

      if (data.data.length === 0) {
        adminRxTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No prescriptions in queue.</td></tr>`;
        return;
      }

      adminRxTableBody.innerHTML = data.data.map(rx => `
        <tr>
          <td><strong>#${rx.id}</strong></td>
          <td>
            <strong>${rx.patientName}</strong><br>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${rx.patientPhone}</span>
          </td>
          <td>
            ${rx.fileUrl ? `<a href="${rx.fileUrl}" target="_blank" style="color: var(--primary); font-weight: 700; text-decoration: underline;">📄 View ${rx.fileName}</a>` : `<span style="color: var(--text-muted);">Text Submission</span>`}
          </td>
          <td style="max-width: 200px; font-size: 0.8rem; color: var(--text-secondary);">
            ${rx.patientNotes || 'None specified'}
          </td>
          <td>
            <span class="admin-badge status-${rx.status}">
              ${rx.status.replace(/_/g, ' ')}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn-primary approve-rx-btn" data-id="${rx.id}" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
                ✓ Approve
              </button>
              <button class="btn-secondary reject-rx-btn" data-id="${rx.id}" style="font-size: 0.75rem; padding: 0.35rem 0.65rem; color: var(--rx-red);">
                ✕ Reject
              </button>
            </div>
          </td>
        </tr>
      `).join("");

      adminRxTableBody.querySelectorAll(".approve-rx-btn").forEach(btn => {
        btn.addEventListener("click", () => updateRxStatus(btn.dataset.id, "approved", "Approved by registered pharmacist"));
      });
      adminRxTableBody.querySelectorAll(".reject-rx-btn").forEach(btn => {
        btn.addEventListener("click", () => updateRxStatus(btn.dataset.id, "rejected", "Prescription illegible or expired"));
      });
    } catch (err) {
      console.error("Error loading prescriptions:", err);
    }
  }

  async function updateRxStatus(rxId, status, note) {
    try {
      const res = await fetch(`/api/prescriptions/${rxId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, pharmacistNotes: note })
      });
      const result = await res.json();
      if (result.success) {
        showAdminToast(`Prescription #${rxId} marked as ${status}`, "success");
        loadPrescriptions();
        loadStats();
      }
    } catch (err) {
      showAdminToast("Failed to update prescription", "error");
    }
  }

  async function loadInventory() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!data.success || !adminInventoryTableBody) return;

      adminInventoryTableBody.innerHTML = data.data.map(p => `
        <tr>
          <td>
            <strong>${p.name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${p.genericName} • ${p.brand}</span>
          </td>
          <td>${p.categoryLabel || p.category}</td>
          <td><strong>$${parseFloat(p.price).toFixed(2)}</strong></td>
          <td>
            <span style="font-weight: 700; color: ${p.stockQuantity < 20 ? 'var(--rx-red)' : 'var(--accent-emerald)'};">
              ${p.stockQuantity || 50} units
            </span>
          </td>
          <td>
            <span class="product-badge-flag ${p.requiresRx ? 'badge-rx' : 'badge-otc'}">
              ${p.requiresRx ? 'Rx Required' : 'OTC'}
            </span>
          </td>
          <td>
            <button class="delete-med-btn btn-secondary" data-id="${p.id}" style="color: var(--rx-red); padding: 0.25rem 0.6rem; font-size: 0.75rem;">
              Delete
            </button>
          </td>
        </tr>
      `).join("");

      adminInventoryTableBody.querySelectorAll(".delete-med-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (!confirm("Are you sure you want to remove this medication from inventory?")) return;
          try {
            const res = await fetch(`/api/products/${btn.dataset.id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
              showAdminToast("Medicine removed from catalog", "success");
              loadInventory();
              loadStats();
            }
          } catch (err) {
            showAdminToast("Error deleting medicine", "error");
          }
        });
      });
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  }

  // Load and Save Store Settings
  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.data) {
        document.getElementById("settingStoreName").value = data.data.storeName || "";
        document.getElementById("settingStorePhone").value = data.data.storePhone || "";
        document.getElementById("settingCurrency").value = data.data.currency || "$";
        document.getElementById("settingFreeDelivery").value = data.data.freeDeliveryThreshold || 35.00;
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }

  if (storeSettingsForm) {
    storeSettingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        storeName: document.getElementById("settingStoreName").value,
        storePhone: document.getElementById("settingStorePhone").value,
        currency: document.getElementById("settingCurrency").value,
        freeDeliveryThreshold: parseFloat(document.getElementById("settingFreeDelivery").value)
      };

      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showAdminToast("Store settings saved successfully!", "success");
        }
      } catch (err) {
        showAdminToast("Failed to update store settings", "error");
      }
    });
  }

  // Change Password
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;

      try {
        const res = await fetch("/api/admin/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const result = await res.json();
        if (result.success) {
          showAdminToast("Password changed successfully!", "success");
          changePasswordForm.reset();
        } else {
          showAdminToast(result.message || "Password change failed", "error");
        }
      } catch (err) {
        showAdminToast("Error connecting to server", "error");
      }
    });
  }

  // Add Medicine Form
  if (addMedForm) {
    addMedForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById("newMedName").value,
        genericName: document.getElementById("newMedGeneric").value,
        category: document.getElementById("newMedCategory").value,
        price: parseFloat(document.getElementById("newMedPrice").value),
        stockQuantity: parseInt(document.getElementById("newMedStock").value),
        requiresRx: document.getElementById("newMedRx").checked,
        dosage: document.getElementById("newMedDosage").value || "Standard Unit"
      };

      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showAdminToast(`Added "${payload.name}" to inventory!`, "success");
          addMedForm.reset();
          addMedModal.classList.remove("active");
          loadInventory();
          loadStats();
        }
      } catch (err) {
        showAdminToast("Failed to add medicine", "error");
      }
    });
  }

  function showAdminToast(msg, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `<span style="font-weight: 700; font-size: 0.85rem;">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  if (refreshAdminBtn) {
    refreshAdminBtn.addEventListener("click", () => {
      loadAllData();
      showAdminToast("Admin data refreshed", "info");
    });
  }

  // Initial Auth Check
  checkAuth();
});
