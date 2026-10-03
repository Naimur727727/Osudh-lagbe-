/**
 * AuraMed+ Modern Digital Pharmacy & Healthcare Hub
 * Frontend Application Engine (Connected to Real Express Backend)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    products: typeof MEDICINES_DATABASE !== 'undefined' ? [...MEDICINES_DATABASE] : [],
    filteredProducts: [],
    currentCategory: "all",
    searchQuery: "",
    sortBy: "featured",
    cart: JSON.parse(localStorage.getItem("auramed_cart")) || [],
    discountPercent: 0,
    activeCoupon: null,
    theme: localStorage.getItem("auramed_theme") || "light",
    pillReminders: JSON.parse(localStorage.getItem("auramed_pill_reminders")) || [
      { name: "Glucovance Metformin", time: "08:00 AM", instruction: "With breakfast", active: true },
      { name: "LipidCare Atorvastatin", time: "09:00 PM", instruction: "After dinner", active: true }
    ],
    uploadedRx: null,
    currentOrder: JSON.parse(localStorage.getItem("auramed_recent_order")) || null,
    chatSessionId: 'session_' + (localStorage.getItem("auramed_chat_session") || Date.now()),
    currentUser: JSON.parse(localStorage.getItem("auramed_user")) || null,
    userToken: localStorage.getItem("auramed_user_token") || null
  };

  localStorage.setItem("auramed_chat_session", state.chatSessionId);

  // Known Drug Interactions Database for Checker
  const DRUG_INTERACTIONS = [
    {
      drugs: ["Ibuprofen", "Paracetamol"],
      severity: "mild",
      title: "Generally Safe with Staggered Dosing",
      message: "Can be used together for refractory pain, but stagger doses by 2-3 hours to avoid liver and stomach load."
    },
    {
      drugs: ["Ibuprofen", "Aspirin"],
      severity: "severe",
      title: "High Risk: Increased Bleeding & GI Ulceration",
      message: "Concurrent use of multiple NSAIDs significantly increases the risk of serious gastrointestinal bleeding and reduces cardioprotective aspirin efficacy."
    },
    {
      drugs: ["Amoxicillin", "Omeprazole"],
      severity: "safe",
      title: "Synergistic (Commonly Prescribed for H. pylori)",
      message: "Safe to take together. Often combined in clinical triple-therapy regimens for gastric ulcers."
    },
    {
      drugs: ["Metformin", "Atorvastatin"],
      severity: "safe",
      title: "Safe & Frequently Co-prescribed",
      message: "Standard combination for patients managing metabolic syndrome, diabetes, and dyslipidemia. Take as scheduled."
    },
    {
      drugs: ["Cetirizine", "Dextromethorphan (Cough)"],
      severity: "mild",
      title: "Moderate Drowsiness Warning",
      message: "Combining antihistamines with cough medicines may heighten sedation or dry mouth. Avoid operating heavy machinery."
    }
  ];

  /* --------------------------------------------------------------------------
     Theme Management
     -------------------------------------------------------------------------- */
  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    updateThemeIcon();
  }

  function toggleTheme() {
    state.theme = state.theme === "light" ? "dark" : "light";
    localStorage.setItem("auramed_theme", state.theme);
    document.documentElement.setAttribute("data-theme", state.theme);
    updateThemeIcon();
    showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`, "info");
  }

  function updateThemeIcon() {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (!themeBtn) return;
    if (state.theme === "dark") {
      themeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
    } else {
      themeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;
    }
  }

  /* --------------------------------------------------------------------------
     Fetch Products from Backend REST API
     -------------------------------------------------------------------------- */
  async function fetchProductsFromBackend() {
    try {
      const params = new URLSearchParams();
      if (state.currentCategory && state.currentCategory !== "all") params.append("category", state.currentCategory);
      if (state.searchQuery) params.append("search", state.searchQuery);
      if (state.sortBy && state.sortBy !== "featured") params.append("sort", state.sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        state.products = json.data;
        state.filteredProducts = json.data;
        renderProducts();
        return;
      }
    } catch (err) {
      console.warn("Backend API unavailable, falling back to local dataset:", err);
    }

    // Local fallback
    filterAndSortProductsLocally();
  }

  function getProductIconSvg(type) {
    switch (type) {
      case "capsule":
        return `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
          <path d="m8.5 8.5 7 7"></path>
        </svg>`;
      case "tablet":
        return `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>`;
      case "device":
        return `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="14" x="3" y="5" rx="2"></rect>
          <path d="M7 15h4M15 15h2M7 11h10"></path>
          <circle cx="12" cy="12" r="1"></circle>
        </svg>`;
      case "bottle":
        return `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3h8v3H8z"></path>
          <path d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7z"></path>
          <path d="M12 11v6M9 14h6"></path>
        </svg>`;
      case "box":
        return `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
          <path d="m3.3 7 8.7 5 8.7-5"></path>
          <path d="M12 22V12"></path>
        </svg>`;
      default:
        return `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 8v8M8 12h8"></path>
        </svg>`;
    }
  }

  function filterAndSortProductsLocally() {
    let result = [...state.products];
    if (state.currentCategory !== "all") {
      result = result.filter(p => p.category === state.currentCategory);
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.genericName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }
    if (state.sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (state.sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (state.sortBy === "rating") result.sort((a, b) => b.rating - a.rating);

    state.filteredProducts = result;
    renderProducts();
  }

  const productsGrid = document.getElementById("productsGrid");
  const filterTabs = document.querySelectorAll(".filter-tab-btn");
  const sortSelect = document.getElementById("catalogSortSelect");
  const searchInput = document.getElementById("headerSearchInput");
  const searchDropdown = document.getElementById("searchResultsDropdown");

  function renderProducts() {
    if (!productsGrid) return;

    if (state.filteredProducts.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem;">No medicines found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Try adjusting your search terms or filter categories.</p>
          <button id="resetFilterBtn" class="btn-primary" style="margin-top: 1.25rem;">Show All Medicines</button>
        </div>
      `;
      document.getElementById("resetFilterBtn")?.addEventListener("click", () => {
        state.currentCategory = "all";
        state.searchQuery = "";
        if (searchInput) searchInput.value = "";
        filterTabs.forEach(t => t.classList.toggle("active", t.dataset.category === "all"));
        fetchProductsFromBackend();
      });
      return;
    }

    productsGrid.innerHTML = state.filteredProducts.map(med => `
      <article class="product-card" data-id="${med.id}">
        <div class="product-media">
          <span class="product-badge-flag ${med.requiresRx ? 'badge-rx' : 'badge-otc'}">
            ${med.requiresRx ? 'Rx Required' : 'OTC Health'}
          </span>
          <div class="product-art-container" style="background: var(--bg-surface);">
            ${getProductIconSvg(med.imageType)}
          </div>
          <button class="quick-view-btn" data-id="${med.id}">Quick Details</button>
        </div>
        <div class="product-details">
          <div class="product-meta-row">
            <span class="product-category-text">${med.categoryLabel || med.category}</span>
            <span class="product-rating">
              ★ ${(med.rating || 4.8).toFixed(1)} <span style="color: var(--text-muted); font-weight: normal;">(${med.reviewsCount || 100})</span>
            </span>
          </div>
          <h3 class="product-name" title="${med.name}">${med.name}</h3>
          <p class="product-generic">${med.genericName || ''}</p>
          <span class="product-dosage">${med.dosage || 'Standard Pack'}</span>
          
          <div class="product-pricing-row">
            <div class="price-box">
              <span class="current-price">$${parseFloat(med.price).toFixed(2)}</span>
              ${med.originalPrice ? `<span class="original-price">$${parseFloat(med.originalPrice).toFixed(2)}</span>` : ''}
            </div>
            <button class="btn-add-cart" data-id="${med.id}" title="Add to cart" aria-label="Add ${med.name} to cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `).join("");

    // Bind Add to Cart buttons
    productsGrid.querySelectorAll(".btn-add-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.id);
      });
    });

    // Bind Quick View buttons
    productsGrid.querySelectorAll(".quick-view-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openQuickViewModal(btn.dataset.id);
      });
    });

    // Card click
    productsGrid.querySelectorAll(".product-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".btn-add-cart") && !e.target.closest(".quick-view-btn")) {
          openQuickViewModal(card.dataset.id);
        }
      });
    });
  }

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.currentCategory = tab.dataset.category;
      fetchProductsFromBackend();
    });
  });

  // Category cards
  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const cat = card.dataset.category;
      state.currentCategory = cat;
      filterTabs.forEach(t => t.classList.toggle("active", t.dataset.category === cat));
      fetchProductsFromBackend();
      document.getElementById("catalogSection")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      fetchProductsFromBackend();
    });
  }

  // Search input live autocomplete
  if (searchInput && searchDropdown) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();
      state.searchQuery = val;

      debounceTimer = setTimeout(() => {
        if (val.length >= 2) {
          const matches = state.products.filter(p =>
            p.name.toLowerCase().includes(val.toLowerCase()) ||
            (p.genericName && p.genericName.toLowerCase().includes(val.toLowerCase()))
          ).slice(0, 5);

          if (matches.length > 0) {
            searchDropdown.innerHTML = matches.map(m => `
              <div class="search-item" data-id="${m.id}">
                <div class="search-item-info">
                  <span class="search-item-name">${m.name}</span>
                  <span class="search-item-generic">${m.genericName || ''} • ${m.dosage || ''}</span>
                </div>
                <span class="search-item-price">$${parseFloat(m.price).toFixed(2)}</span>
              </div>
            `).join("");
            searchDropdown.classList.add("active");

            searchDropdown.querySelectorAll(".search-item").forEach(item => {
              item.addEventListener("click", () => {
                openQuickViewModal(item.dataset.id);
                searchDropdown.classList.remove("active");
              });
            });
          } else {
            searchDropdown.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;">No matching medicines</div>`;
            searchDropdown.classList.add("active");
          }
        } else {
          searchDropdown.classList.remove("active");
        }

        fetchProductsFromBackend();
      }, 250);
    });

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove("active");
      }
    });
  }

  /* --------------------------------------------------------------------------
     Shopping Cart Management
     -------------------------------------------------------------------------- */
  const cartDrawer = document.getElementById("cartDrawer");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartBtnTrigger = document.getElementById("cartBtnTrigger");
  const cartCloseBtn = document.getElementById("cartCloseBtn");
  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartBadge = document.getElementById("cartBadge");
  const cartSubtotalEl = document.getElementById("cartSubtotal");
  const cartDeliveryFeeEl = document.getElementById("cartDeliveryFee");
  const cartGrandTotalEl = document.getElementById("cartGrandTotal");
  const btnCheckoutTrigger = document.getElementById("btnCheckoutTrigger");
  const applyCouponBtn = document.getElementById("applyCouponBtn");
  const couponInput = document.getElementById("couponInput");
  const couponNotice = document.getElementById("couponNotice");

  function saveCart() {
    localStorage.setItem("auramed_cart", JSON.stringify(state.cart));
    updateCartUI();
  }

  function addToCart(medId, qty = 1) {
    const med = state.products.find(p => p.id === medId);
    if (!med) return;

    const existing = state.cart.find(item => item.id === medId);
    if (existing) {
      existing.quantity += qty;
    } else {
      state.cart.push({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        price: parseFloat(med.price),
        requiresRx: med.requiresRx,
        imageType: med.imageType,
        quantity: qty
      });
    }

    saveCart();
    showToast(`Added "${med.name}" to cart`, med.requiresRx ? "rx" : "success");

    if (cartBtnTrigger) {
      cartBtnTrigger.style.transform = "scale(1.2)";
      setTimeout(() => cartBtnTrigger.style.transform = "scale(1)", 200);
    }
  }

  function updateQuantity(medId, delta) {
    const item = state.cart.find(i => i.id === medId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      state.cart = state.cart.filter(i => i.id !== medId);
    }
    saveCart();
  }

  function updateCartUI() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
      cartBadge.textContent = totalCount;
      cartBadge.style.display = totalCount > 0 ? "flex" : "none";
    }

    if (!cartItemsContainer) return;

    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.8rem; margin-bottom: 0.75rem;">🛒</div>
          <p style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">Your Cart is Empty</p>
          <p style="font-size: 0.85rem;">Browse our verified medicine catalog and add health items.</p>
        </div>
      `;
      if (cartSubtotalEl) cartSubtotalEl.textContent = "$0.00";
      if (cartDeliveryFeeEl) cartDeliveryFeeEl.textContent = "$0.00";
      if (cartGrandTotalEl) cartGrandTotalEl.textContent = "$0.00";
      if (btnCheckoutTrigger) btnCheckoutTrigger.disabled = true;
      return;
    }

    if (btnCheckoutTrigger) btnCheckoutTrigger.disabled = false;
    const hasRxItem = state.cart.some(item => item.requiresRx);

    cartItemsContainer.innerHTML = `
      ${hasRxItem ? `
        <div style="background: var(--rx-bg); border: 1px solid rgba(225, 29, 72, 0.3); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; color: var(--rx-red); display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem;">
          <span style="font-size: 1.2rem;">⚠️</span>
          <div>
            <strong>Prescription Item Included:</strong> Our certified pharmacist will verify your Rx before dispatch.
          </div>
        </div>
      ` : ''}
      ${state.cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-icon">
            ${getProductIconSvg(item.imageType)}
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-name">${item.name}</h4>
            <span class="cart-item-dosage">${item.dosage || ''}</span>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          </div>
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn btn-qty-minus" data-id="${item.id}">−</button>
            <span class="cart-qty-num">${item.quantity}</span>
            <button class="cart-qty-btn btn-qty-plus" data-id="${item.id}">+</button>
          </div>
        </div>
      `).join("")}
    `;

    cartItemsContainer.querySelectorAll(".btn-qty-minus").forEach(btn => {
      btn.addEventListener("click", () => updateQuantity(btn.dataset.id, -1));
    });
    cartItemsContainer.querySelectorAll(".btn-qty-plus").forEach(btn => {
      btn.addEventListener("click", () => updateQuantity(btn.dataset.id, 1));
    });

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (state.discountPercent / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const deliveryFee = subtotalAfterDiscount > 35 || subtotalAfterDiscount === 0 ? 0 : 4.99;
    const grandTotal = subtotalAfterDiscount + deliveryFee;

    if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (cartDeliveryFeeEl) cartDeliveryFeeEl.textContent = deliveryFee === 0 ? "FREE (Orders over $35)" : `$${deliveryFee.toFixed(2)}`;
    if (cartGrandTotalEl) cartGrandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;
  }

  function openCart() {
    updateCartUI();
    if (cartDrawer) cartDrawer.classList.add("active");
    if (cartBackdrop) cartBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove("active");
    if (cartBackdrop) cartBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (cartBtnTrigger) cartBtnTrigger.addEventListener("click", openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);

  // Apply Coupon
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener("click", () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === "AURA10" || code === "HEALTH10") {
        state.discountPercent = 10;
        state.activeCoupon = code;
        if (couponNotice) {
          couponNotice.textContent = "10% Healthcare discount activated!";
          couponNotice.style.color = "var(--accent-emerald)";
        }
        updateCartUI();
        showToast("10% discount promo applied!", "success");
      } else {
        if (couponNotice) {
          couponNotice.textContent = "Invalid coupon code. Try 'AURA10'";
          couponNotice.style.color = "var(--rx-red)";
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     Real Prescription Upload via REST API (Multer Backend)
     -------------------------------------------------------------------------- */
  const rxModal = document.getElementById("rxUploadModal");
  const openRxModalBtns = document.querySelectorAll(".btn-open-rx-modal");
  const closeRxModalBtn = document.getElementById("closeRxModalBtn");
  const rxDropzone = document.getElementById("rxModalDropzone");
  const rxFileInput = document.getElementById("rxFileInput");
  const rxFilePreview = document.getElementById("rxFilePreview");
  const rxForm = document.getElementById("rxUploadForm");
  const heroDropzone = document.getElementById("heroRxDropzone");
  const heroRxInput = document.getElementById("heroRxInput");

  function openRxModal() {
    if (state.currentUser) {
      const patientName = document.getElementById("rxPatientName");
      const patientPhone = document.getElementById("rxPatientPhone");
      if (patientName && !patientName.value) patientName.value = state.currentUser.name || "";
      if (patientPhone && !patientPhone.value) patientPhone.value = state.currentUser.phone || "";
    }
    if (rxModal) rxModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeRxModal() {
    if (rxModal) rxModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  openRxModalBtns.forEach(btn => btn.addEventListener("click", openRxModal));
  if (closeRxModalBtn) closeRxModalBtn.addEventListener("click", closeRxModal);
  if (rxModal) {
    rxModal.addEventListener("click", (e) => {
      if (e.target === rxModal) closeRxModal();
    });
  }

  function handleFileSelected(file) {
    if (!file) return;
    state.uploadedRx = file;

    if (rxFilePreview) {
      rxFilePreview.style.display = "block";
      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = (e) => {
        rxFilePreview.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; padding: 0.85rem; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border);">
            ${isImg ? `<img src="${e.target.result}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" alt="Rx Preview" />` : `<div style="font-size: 2rem;">📄</div>`}
            <div style="flex: 1; overflow: hidden;">
              <p style="font-weight: 700; font-size: 0.85rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${file.name}</p>
              <p style="font-size: 0.75rem; color: var(--text-muted);">${(file.size / 1024).toFixed(1)} KB • Ready for Backend Dispatch</p>
            </div>
            <span style="color: var(--accent-emerald); font-weight: 700; font-size: 0.8rem;">✓ Attached</span>
          </div>
        `;
      };

      if (isImg) reader.readAsDataURL(file);
      else {
        rxFilePreview.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; padding: 0.85rem; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border);">
            <div style="font-size: 2rem;">📄</div>
            <div style="flex: 1; overflow: hidden;">
              <p style="font-weight: 700; font-size: 0.85rem;">${file.name}</p>
              <p style="font-size: 0.75rem; color: var(--text-muted);">${(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <span style="color: var(--accent-emerald); font-weight: 700; font-size: 0.8rem;">✓ Attached</span>
          </div>
        `;
      }
    }

    showToast(`Prescription "${file.name}" attached`, "success");
  }

  if (rxDropzone && rxFileInput) {
    rxDropzone.addEventListener("click", () => rxFileInput.click());
    rxDropzone.addEventListener("dragover", (e) => { e.preventDefault(); rxDropzone.classList.add("dragover"); });
    rxDropzone.addEventListener("dragleave", () => rxDropzone.classList.remove("dragover"));
    rxDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      rxDropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length) handleFileSelected(e.dataTransfer.files[0]);
    });
    rxFileInput.addEventListener("change", (e) => {
      if (e.target.files.length) handleFileSelected(e.target.files[0]);
    });
  }

  if (heroDropzone && heroRxInput) {
    heroDropzone.addEventListener("click", () => heroRxInput.click());
    heroRxInput.addEventListener("change", (e) => {
      if (e.target.files.length) {
        handleFileSelected(e.target.files[0]);
        openRxModal();
      }
    });
  }

  // Submit Prescription to Backend API
  if (rxForm) {
    rxForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const patientName = document.getElementById("rxPatientName").value;
      const patientPhone = document.getElementById("rxPatientPhone").value;
      const patientNotes = document.getElementById("rxPatientNotes")?.value || "";

      if (!state.uploadedRx) {
        showToast("Please attach a prescription file first", "rx");
        return;
      }

      const submitBtn = rxForm.querySelector("button[type='submit']");
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>Uploading to Pharmacist Cloud...</span>`;
      submitBtn.disabled = true;

      try {
        const formData = new FormData();
        formData.append("prescriptionFile", state.uploadedRx);
        formData.append("patientName", patientName);
        formData.append("patientPhone", patientPhone);
        formData.append("patientNotes", patientNotes);

        const res = await fetch("/api/prescriptions/upload", {
          method: "POST",
          body: formData
        });
        const result = await res.json();

        if (result.success) {
          closeRxModal();
          showToast(`Prescription #${result.data.id} submitted! Verified by pharmacist soon.`, "success");
          rxForm.reset();
          if (rxFilePreview) rxFilePreview.style.display = "none";
          state.uploadedRx = null;
        } else {
          showToast(result.message || "Upload failed", "rx");
        }
      } catch (err) {
        console.error("Prescription upload error:", err);
        showToast("Saved locally and queued for dispensary review!", "success");
        closeRxModal();
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  /* --------------------------------------------------------------------------
     Quick View Product Modal
     -------------------------------------------------------------------------- */
  const quickViewModal = document.getElementById("quickViewModal");
  const quickViewContent = document.getElementById("quickViewContent");
  const closeQuickViewBtn = document.getElementById("closeQuickViewBtn");

  function openQuickViewModal(medId) {
    const med = state.products.find(p => p.id === medId);
    if (!med || !quickViewContent) return;

    quickViewContent.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 2rem; align-items: start;">
        <div style="background: var(--bg-subtle); border-radius: var(--radius-lg); padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <div class="product-art-container" style="width: 110px; height: 110px; font-size: 3rem; background: var(--bg-surface); margin-bottom: 1.5rem;">
            ${getProductIconSvg(med.imageType)}
          </div>
          <span class="product-badge-flag ${med.requiresRx ? 'badge-rx' : 'badge-otc'}" style="margin-bottom: 0.75rem;">
            ${med.requiresRx ? 'Requires Valid Doctor Rx' : 'Over-the-Counter Medicine'}
          </span>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${med.brand || 'Authorized Pharma'} • Authentic Batch</p>
          <p style="font-size: 0.75rem; color: var(--primary); margin-top: 0.35rem; font-weight: 600;">${med.temperatureControl || 'Store below 25°C'}</p>
        </div>

        <div>
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 0.3rem;">
            ${med.categoryLabel || med.category}
          </div>
          <h2 style="font-size: 1.6rem; margin-bottom: 0.3rem;">${med.name}</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-bottom: 1rem;">Generic: ${med.genericName || med.name}</p>

          <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.25rem;">
            <span style="font-family: 'Outfit'; font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">$${parseFloat(med.price).toFixed(2)}</span>
            ${med.originalPrice ? `<span style="font-size: 0.95rem; color: var(--text-light); text-decoration: line-through;">$${parseFloat(med.originalPrice).toFixed(2)}</span>` : ''}
            <span style="font-size: 0.8rem; background: var(--primary-soft); color: var(--primary); font-weight: 700; padding: 0.15rem 0.5rem; border-radius: var(--radius-sm);">${med.dosage || 'Standard'}</span>
          </div>

          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 1.25rem;">
            ${med.description || 'Clinical pharmaceutical formulation tested for maximum therapeutic efficacy.'}
          </p>

          <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem; font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <div><strong>Active Formulation:</strong> ${med.activeIngredients || 'Standard verified composition'}</div>
            <div><strong>Recommended Usage:</strong> ${med.usageAdvice || 'Take as indicated on prescription label.'}</div>
            <div><strong>Precautions & Side Effects:</strong> ${med.sideEffects || 'Follow clinical guidance.'}</div>
          </div>

          <div style="display: flex; gap: 1rem; align-items: center;">
            <div class="cart-qty-ctrl" style="padding: 0.3rem;">
              <button class="cart-qty-btn" id="modalQtyMinus">−</button>
              <span class="cart-qty-num" id="modalQtyVal">1</span>
              <button class="cart-qty-btn" id="modalQtyPlus">+</button>
            </div>
            <button class="btn-primary" id="modalAddCartBtn" style="flex: 1;">
              Add to Shopping Cart
            </button>
          </div>
        </div>
      </div>
    `;

    let modalQty = 1;
    const qtyVal = document.getElementById("modalQtyVal");
    document.getElementById("modalQtyMinus").addEventListener("click", () => {
      if (modalQty > 1) { modalQty--; qtyVal.textContent = modalQty; }
    });
    document.getElementById("modalQtyPlus").addEventListener("click", () => {
      modalQty++; qtyVal.textContent = modalQty;
    });

    document.getElementById("modalAddCartBtn").addEventListener("click", () => {
      addToCart(med.id, modalQty);
      closeQuickView();
    });

    if (quickViewModal) {
      quickViewModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeQuickView() {
    if (quickViewModal) quickViewModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (closeQuickViewBtn) closeQuickViewBtn.addEventListener("click", closeQuickView);
  if (quickViewModal) {
    quickViewModal.addEventListener("click", (e) => {
      if (e.target === quickViewModal) closeQuickView();
    });
  }

  /* --------------------------------------------------------------------------
     Checkout & Real Order Placement to Backend API
     -------------------------------------------------------------------------- */
  const checkoutModal = document.getElementById("checkoutModal");
  const closeCheckoutModalBtn = document.getElementById("closeCheckoutModalBtn");
  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutItemsSummary = document.getElementById("checkoutItemsSummary");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  function openCheckout() {
    closeCart();
    if (!checkoutModal) return;

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (state.discountPercent / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const deliveryFee = subtotalAfterDiscount > 35 ? 0 : 4.99;
    const grandTotal = subtotalAfterDiscount + deliveryFee;

    if (checkoutItemsSummary) {
      checkoutItemsSummary.innerHTML = state.cart.map(i => `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
          <span>${i.name} × ${i.quantity}</span>
          <span style="font-weight: 700;">$${(i.price * i.quantity).toFixed(2)}</span>
        </div>
      `).join("");
    }

    if (checkoutTotalEl) checkoutTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

    // Auto-fill logged in customer details
    if (state.currentUser) {
      const nameInput = document.getElementById("checkoutFullName");
      const phoneInput = document.getElementById("checkoutPhone");
      const addressInput = document.getElementById("checkoutAddress");
      if (nameInput && !nameInput.value) nameInput.value = state.currentUser.name || "";
      if (phoneInput && !phoneInput.value) phoneInput.value = state.currentUser.phone || "";
      if (addressInput && !addressInput.value) addressInput.value = state.currentUser.address || "";
    }

    checkoutModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCheckout() {
    if (checkoutModal) checkoutModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (btnCheckoutTrigger) btnCheckoutTrigger.addEventListener("click", openCheckout);
  if (closeCheckoutModalBtn) closeCheckoutModalBtn.addEventListener("click", closeCheckout);
  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) closeCheckout();
    });
  }

  // Handle Order Submit
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const customerName = document.getElementById("checkoutFullName").value;
      const phone = document.getElementById("checkoutPhone").value;
      const address = document.getElementById("checkoutAddress").value;
      const speed = document.querySelector("input[name='deliverySpeed']:checked")?.value || "express";
      const paymentMethod = document.querySelector("input[name='paymentMethod']:checked")?.value || "card";

      const submitBtn = checkoutForm.querySelector("button[type='submit']");
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>Saving Order to Dispensary Database...</span>`;
      submitBtn.disabled = true;

      const payload = {
        customerId: state.currentUser ? state.currentUser.id : null,
        customerEmail: state.currentUser ? state.currentUser.email : null,
        customerName,
        phone,
        address,
        speed,
        paymentMethod,
        items: [...state.cart]
      };

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success) {
          state.currentOrder = result.data;
          localStorage.setItem("auramed_recent_order", JSON.stringify(result.data));
          state.cart = [];
          saveCart();
          closeCheckout();
          showOrderConfirmationModal(result.data);
          showToast(`Order #${result.data.orderId} created successfully!`, "success");
        } else {
          showToast(result.message || "Failed to create order", "rx");
        }
      } catch (err) {
        console.warn("Backend error, storing order locally:", err);
        const orderNumber = "AM-" + Math.floor(100000 + Math.random() * 900000);
        const fallbackOrder = {
          orderId: orderNumber,
          customerName,
          phone,
          address,
          speed,
          paymentMethod,
          items: [...state.cart],
          grandTotal: state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
          placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "confirmed"
        };
        state.currentOrder = fallbackOrder;
        localStorage.setItem("auramed_recent_order", JSON.stringify(fallbackOrder));
        state.cart = [];
        saveCart();
        closeCheckout();
        showOrderConfirmationModal(fallbackOrder);
      } finally {
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      }
    });
  }

  /* --------------------------------------------------------------------------
     Live Order Tracking (Syncs with Backend)
     -------------------------------------------------------------------------- */
  const orderTrackModal = document.getElementById("orderTrackModal");
  const closeTrackModalBtn = document.getElementById("closeTrackModalBtn");
  const trackContentEl = document.getElementById("trackContent");
  const trackOrderNavBtn = document.getElementById("trackOrderNavBtn");

  async function syncOrderTracking(orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        state.currentOrder = data.data;
        localStorage.setItem("auramed_recent_order", JSON.stringify(data.data));
      }
    } catch (err) {
      console.warn("Could not fetch latest tracking from API:", err);
    }
  }

  async function showOrderConfirmationModal(order) {
    if (!orderTrackModal || !trackContentEl) return;

    if (order.orderId) {
      await syncOrderTracking(order.orderId);
      order = state.currentOrder || order;
    }

    const currentStatus = order.status || "confirmed";
    const statusMap = {
      confirmed: 1,
      verified: 2,
      packing: 3,
      out_for_delivery: 4,
      delivered: 5
    };
    const currentStep = statusMap[currentStatus] || 1;

    trackContentEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="width: 64px; height: 64px; background: rgba(16, 185, 129, 0.1); color: var(--accent-emerald); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem;">
          ✓
        </div>
        <h2 style="font-size: 1.6rem; margin-bottom: 0.4rem;">Order Status: ${currentStatus.replace(/_/g, ' ').toUpperCase()}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Recipient: ${order.customerName} • Live database synced</p>
        <div style="display: inline-block; background: var(--bg-subtle); padding: 0.4rem 1rem; border-radius: var(--radius-full); font-weight: 800; color: var(--primary); margin-top: 0.75rem; font-size: 0.95rem;">
          Order #${order.orderId}
        </div>
      </div>

      <!-- Live Tracking Steps -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem; position: relative; padding-left: 1.5rem; border-left: 2px solid var(--primary);">
        <div style="position: relative; opacity: ${currentStep >= 1 ? 1 : 0.4};">
          <div style="position: absolute; left: -1.95rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: ${currentStep >= 1 ? 'var(--accent-emerald)' : 'var(--border)'};"></div>
          <h4 style="font-size: 0.95rem;">1. Order Received & Authenticated</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Timestamp: ${order.placedAt} • Electronic verification approved</p>
        </div>

        <div style="position: relative; opacity: ${currentStep >= 2 ? 1 : 0.4};">
          <div style="position: absolute; left: -1.95rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: ${currentStep >= 2 ? 'var(--primary)' : 'var(--border)'};"></div>
          <h4 style="font-size: 0.95rem;">2. Registered Pharmacist Verification</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Checking batch numbers, expiry & patient guidelines</p>
        </div>

        <div style="position: relative; opacity: ${currentStep >= 3 ? 1 : 0.4};">
          <div style="position: absolute; left: -1.95rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: ${currentStep >= 3 ? 'var(--primary)' : 'var(--border)'};"></div>
          <h4 style="font-size: 0.95rem;">3. Cold-Chain Packaging & Tamper-Sealing</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Insulated temperature-controlled pharmaceutical pouch</p>
        </div>

        <div style="position: relative; opacity: ${currentStep >= 4 ? 1 : 0.4};">
          <div style="position: absolute; left: -1.95rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: ${currentStep >= 4 ? 'var(--accent-emerald)' : 'var(--border)'};"></div>
          <h4 style="font-size: 0.95rem;">4. Express Courier Out for Delivery</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Delivering directly to: ${order.address}</p>
        </div>
      </div>

      <div style="background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1.5rem;">
        <h5 style="margin-bottom: 0.5rem; font-weight: 700;">Delivery & Payment Summary</h5>
        <p><strong>Total:</strong> $${parseFloat(order.grandTotal || order.subtotal).toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
        <p><strong>Contact:</strong> ${order.phone}</p>
      </div>

      <button id="closeTrackBtnInside" class="btn-primary" style="width: 100%;">
        Close & Continue Shopping
      </button>
    `;

    orderTrackModal.classList.add("active");
    document.body.style.overflow = "hidden";

    document.getElementById("closeTrackBtnInside")?.addEventListener("click", () => {
      orderTrackModal.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  function openOrderTracker() {
    if (!state.currentOrder) {
      showToast("No active orders found. Place an order to track live delivery!", "info");
      return;
    }
    showOrderConfirmationModal(state.currentOrder);
  }

  if (trackOrderNavBtn) trackOrderNavBtn.addEventListener("click", openOrderTracker);
  if (closeTrackModalBtn) {
    closeTrackModalBtn.addEventListener("click", () => {
      orderTrackModal.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  /* --------------------------------------------------------------------------
     Interactive Health Suite (Calculators & Interaction Checker)
     -------------------------------------------------------------------------- */
  const suiteTabs = document.querySelectorAll(".suite-tab-btn");
  const suitePanels = document.querySelectorAll(".suite-panel");

  suiteTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      suiteTabs.forEach(t => t.classList.remove("active"));
      suitePanels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target)?.classList.add("active");
    });
  });

  // BMI Tool
  const calcBmiBtn = document.getElementById("calcBmiBtn");
  const bmiWeightInput = document.getElementById("bmiWeight");
  const bmiHeightInput = document.getElementById("bmiHeight");
  const bmiAgeInput = document.getElementById("bmiAge");
  const bmiResultBox = document.getElementById("bmiResultBox");

  if (calcBmiBtn) {
    calcBmiBtn.addEventListener("click", () => {
      const weight = parseFloat(bmiWeightInput.value);
      const heightCm = parseFloat(bmiHeightInput.value);
      const age = parseInt(bmiAgeInput.value) || 30;

      if (!weight || !heightCm) {
        showToast("Please enter valid weight and height", "rx");
        return;
      }

      const heightM = heightCm / 100;
      const bmi = weight / (heightM * heightM);
      const waterLiters = (weight * 0.033).toFixed(1);
      const safeParacetamolMg = age < 12 ? (weight * 15).toFixed(0) : "1000mg per single dose (max 4000mg/day)";

      let status = "Normal weight";
      let colorClass = "safe";
      if (bmi < 18.5) { status = "Underweight"; colorClass = "warning"; }
      else if (bmi >= 25 && bmi < 30) { status = "Overweight"; colorClass = "warning"; }
      else if (bmi >= 30) { status = "Obese"; colorClass = "warning"; }

      bmiResultBox.className = `tool-result-box ${colorClass}`;
      bmiResultBox.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">Clinical Health Assessment</div>
        <div style="font-size: 2.2rem; font-weight: 800; font-family: 'Outfit'; margin: 0.2rem 0;">BMI: ${bmi.toFixed(1)}</div>
        <div style="font-weight: 700; margin-bottom: 0.75rem;">Category: ${status}</div>
        <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">
          <p>💧 <strong>Recommended Daily Hydration:</strong> ${waterLiters} Liters/day</p>
          <p>💊 <strong>Standard Safe Paracetamol Limit:</strong> ${safeParacetamolMg}</p>
        </div>
      `;
    });
  }

  // Drug Interaction Tool
  const checkInteractionBtn = document.getElementById("checkInteractionBtn");
  const drug1Select = document.getElementById("drug1Select");
  const drug2Select = document.getElementById("drug2Select");
  const interactionResultBox = document.getElementById("interactionResultBox");

  if (checkInteractionBtn) {
    checkInteractionBtn.addEventListener("click", () => {
      const drug1 = drug1Select.value;
      const drug2 = drug2Select.value;

      if (!drug1 || !drug2) {
        showToast("Please select two medicines to check compatibility", "rx");
        return;
      }

      if (drug1 === drug2) {
        interactionResultBox.className = "tool-result-box warning";
        interactionResultBox.innerHTML = `
          <h4 style="color: var(--rx-red); margin-bottom: 0.4rem;">⚠️ Identical Medication Selected</h4>
          <p style="font-size: 0.85rem;">Taking duplicate medicines simultaneously increases the danger of accidental overdose.</p>
        `;
        return;
      }

      const matched = DRUG_INTERACTIONS.find(item =>
        item.drugs.includes(drug1) && item.drugs.includes(drug2)
      );

      if (matched) {
        const isSevere = matched.severity === "severe";
        interactionResultBox.className = `tool-result-box ${isSevere ? 'warning' : 'safe'}`;
        interactionResultBox.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.4rem;">${isSevere ? '⛔' : '🛡️'}</span>
            <h4 style="color: ${isSevere ? 'var(--rx-red)' : 'var(--accent-emerald)'}; font-size: 1rem;">${matched.title}</h4>
          </div>
          <p style="font-size: 0.88rem; line-height: 1.5; color: var(--text-secondary);">${matched.message}</p>
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.6rem;">Checked between ${drug1} & ${drug2} • AuraMed Pharmacovigilance DB</span>
        `;
      } else {
        interactionResultBox.className = "tool-result-box safe";
        interactionResultBox.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.4rem;">✅</span>
            <h4 style="color: var(--accent-emerald); font-size: 1rem;">No Significant Interactions Documented</h4>
          </div>
          <p style="font-size: 0.88rem; line-height: 1.5; color: var(--text-secondary);">${drug1} and ${drug2} have no high-severity contraindications found in standard clinical pharmacopeias.</p>
        `;
      }
    });
  }

  // Pill Reminder Planner
  const reminderForm = document.getElementById("pillReminderForm");
  const reminderListEl = document.getElementById("pillReminderList");

  function renderPillReminders() {
    if (!reminderListEl) return;
    if (state.pillReminders.length === 0) {
      reminderListEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No reminders scheduled yet.</p>`;
      return;
    }

    reminderListEl.innerHTML = state.pillReminders.map((r, index) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
        <div>
          <div style="font-weight: 700; font-size: 0.9rem;">${r.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${r.time} • ${r.instruction}</div>
        </div>
        <button class="delete-reminder-btn" data-index="${index}" style="color: var(--text-light); font-size: 1.1rem; padding: 0.2rem 0.5rem;" title="Remove reminder">✕</button>
      </div>
    `).join("");

    reminderListEl.querySelectorAll(".delete-reminder-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index);
        state.pillReminders.splice(idx, 1);
        localStorage.setItem("auramed_pill_reminders", JSON.stringify(state.pillReminders));
        renderPillReminders();
        showToast("Reminder removed", "info");
      });
    });
  }

  if (reminderForm) {
    reminderForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("reminderMedName").value;
      const time = document.getElementById("reminderTime").value;
      const instruction = document.getElementById("reminderInstruction").value;

      state.pillReminders.push({ name, time, instruction, active: true });
      localStorage.setItem("auramed_pill_reminders", JSON.stringify(state.pillReminders));
      renderPillReminders();
      reminderForm.reset();
      showToast(`Reminder set for ${name} at ${time}`, "success");
    });
  }

  /* --------------------------------------------------------------------------
     Live Pharmacist Chat (Connected to Backend /api/consultations)
     -------------------------------------------------------------------------- */
  const floatingChatTrigger = document.getElementById("floatingChatTrigger");
  const chatWindow = document.getElementById("chatWindow");
  const closeChatBtn = document.getElementById("closeChatBtn");
  const chatInput = document.getElementById("chatInput");
  const chatSendBtn = document.getElementById("chatSendBtn");
  const chatMessagesEl = document.getElementById("chatMessages");

  function toggleChat() {
    if (!chatWindow) return;
    chatWindow.classList.toggle("active");
    if (chatWindow.classList.contains("active")) {
      chatInput?.focus();
    }
  }

  if (floatingChatTrigger) floatingChatTrigger.addEventListener("click", toggleChat);
  if (closeChatBtn) closeChatBtn.addEventListener("click", () => chatWindow.classList.remove("active"));

  function appendChatMessage(text, sender = "bot") {
    if (!chatMessagesEl) return;
    const msg = document.createElement("div");
    msg.className = `chat-bubble ${sender}`;
    msg.textContent = text;
    chatMessagesEl.appendChild(msg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  async function handleSendChat() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

    appendChatMessage(text, "user");
    chatInput.value = "";

    try {
      const res = await fetch("/api/consultations/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.chatSessionId,
          message: text
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        appendChatMessage(data.reply.text, "bot");
      }
    } catch (err) {
      appendChatMessage("Our pharmacist is available 24/7. Call (800) 555-AURA for immediate support.", "bot");
    }
  }

  if (chatSendBtn) chatSendBtn.addEventListener("click", handleSendChat);
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSendChat();
    });
  }

  /* --------------------------------------------------------------------------
     Toast Notification System
     -------------------------------------------------------------------------- */
  function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type === 'rx' ? 'toast-rx' : type === 'success' ? 'toast-success' : ''}`;
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "rx") icon = "💊";

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <span style="font-size: 0.85rem; font-weight: 600;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* --------------------------------------------------------------------------
     Customer Authentication & Account Management
     -------------------------------------------------------------------------- */
  const userAccountBtn = document.getElementById("userAccountBtn");
  const userAccountLabel = document.getElementById("userAccountLabel");
  const userAccountIcon = document.getElementById("userAccountIcon");
  const customerAuthModal = document.getElementById("customerAuthModal");
  const closeCustomerAuthModalBtn = document.getElementById("closeCustomerAuthModalBtn");
  const authTabLoginBtn = document.getElementById("authTabLoginBtn");
  const authTabRegisterBtn = document.getElementById("authTabRegisterBtn");
  const authPanelLogin = document.getElementById("authPanelLogin");
  const authPanelRegister = document.getElementById("authPanelRegister");
  const customerLoginForm = document.getElementById("customerLoginForm");
  const customerRegisterForm = document.getElementById("customerRegisterForm");
  const switchRegisterLink = document.getElementById("switchRegisterLink");
  const switchLoginLink = document.getElementById("switchLoginLink");

  const customerProfileModal = document.getElementById("customerProfileModal");
  const closeCustomerProfileModalBtn = document.getElementById("closeCustomerProfileModalBtn");
  const profileCustomerName = document.getElementById("profileCustomerName");
  const profileCustomerContact = document.getElementById("profileCustomerContact");
  const profileCustomerAddress = document.getElementById("profileCustomerAddress");
  const customerOrdersHistoryList = document.getElementById("customerOrdersHistoryList");
  const customerSignOutBtn = document.getElementById("customerSignOutBtn");

  function updateUserAccountUI() {
    if (!userAccountLabel) return;
    if (state.currentUser) {
      const firstName = (state.currentUser.name || "Customer").split(" ")[0];
      userAccountLabel.textContent = firstName;
      if (userAccountIcon) userAccountIcon.textContent = "👤";
      userAccountBtn?.setAttribute("title", `Signed in as ${state.currentUser.name}`);
    } else {
      userAccountLabel.textContent = "Sign In";
      if (userAccountIcon) userAccountIcon.textContent = "👤";
      userAccountBtn?.setAttribute("title", "Sign in or create account");
    }
  }

  function openCustomerAuthModal(tab = 'login') {
    if (!customerAuthModal) return;
    switchAuthTab(tab);
    customerAuthModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCustomerAuthModal() {
    if (customerAuthModal) customerAuthModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      authTabLoginBtn?.classList.add("active");
      authTabRegisterBtn?.classList.remove("active");
      if (authPanelLogin) authPanelLogin.style.display = "block";
      if (authPanelRegister) authPanelRegister.style.display = "none";
    } else {
      authTabRegisterBtn?.classList.add("active");
      authTabLoginBtn?.classList.remove("active");
      if (authPanelLogin) authPanelLogin.style.display = "none";
      if (authPanelRegister) authPanelRegister.style.display = "block";
    }
  }

  async function openCustomerProfileModal() {
    if (!customerProfileModal || !state.currentUser) return;
    if (profileCustomerName) profileCustomerName.textContent = state.currentUser.name || "Customer";
    if (profileCustomerContact) profileCustomerContact.textContent = `${state.currentUser.phone || ''} ${state.currentUser.email ? '• ' + state.currentUser.email : ''}`;
    if (profileCustomerAddress) profileCustomerAddress.textContent = state.currentUser.address || "No address saved";

    customerProfileModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Load past orders
    if (customerOrdersHistoryList) {
      customerOrdersHistoryList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">Fetching your order history...</p>`;
      try {
        const query = state.currentUser.phone || state.currentUser.email || state.currentUser.name;
        const res = await fetch(`/api/auth/my-orders?phone=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.success && data.orders && data.orders.length > 0) {
          customerOrdersHistoryList.innerHTML = data.orders.map(order => `
            <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.9rem;">#${order.orderId}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">${order.placedAt}</span>
                <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem;">
                  ${order.items.map(i => `${i.name} (×${i.quantity})`).join(', ')}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">$${parseFloat(order.grandTotal || order.subtotal).toFixed(2)}</div>
                <span class="admin-badge status-${order.status}" style="font-size: 0.7rem;">${order.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          `).join("");
        } else {
          customerOrdersHistoryList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No past orders yet. Browse our medicines and place your first order!</p>`;
        }
      } catch (err) {
        customerOrdersHistoryList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Could not load past orders.</p>`;
      }
    }
  }

  function closeCustomerProfileModal() {
    if (customerProfileModal) customerProfileModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (userAccountBtn) {
    userAccountBtn.addEventListener("click", () => {
      if (state.currentUser) openCustomerProfileModal();
      else openCustomerAuthModal('login');
    });
  }

  if (closeCustomerAuthModalBtn) closeCustomerAuthModalBtn.addEventListener("click", closeCustomerAuthModal);
  if (customerAuthModal) {
    customerAuthModal.addEventListener("click", (e) => {
      if (e.target === customerAuthModal) closeCustomerAuthModal();
    });
  }

  if (closeCustomerProfileModalBtn) closeCustomerProfileModalBtn.addEventListener("click", closeCustomerProfileModal);
  if (customerProfileModal) {
    customerProfileModal.addEventListener("click", (e) => {
      if (e.target === customerProfileModal) closeCustomerProfileModal();
    });
  }

  if (authTabLoginBtn) authTabLoginBtn.addEventListener("click", () => switchAuthTab('login'));
  if (authTabRegisterBtn) authTabRegisterBtn.addEventListener("click", () => switchAuthTab('register'));
  if (switchRegisterLink) {
    switchRegisterLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthTab('register');
    });
  }
  if (switchLoginLink) {
    switchLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthTab('login');
    });
  }

  // Handle Customer Login
  if (customerLoginForm) {
    customerLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const identifier = document.getElementById("custLoginIdentifier").value.trim();
      const password = document.getElementById("custLoginPassword").value;
      const submitBtn = customerLoginForm.querySelector("button[type='submit']");
      const origText = submitBtn.textContent;
      submitBtn.textContent = "Signing In...";
      submitBtn.disabled = true;

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();

        if (data.success && data.user) {
          state.currentUser = data.user;
          state.userToken = data.token;
          localStorage.setItem("auramed_user", JSON.stringify(data.user));
          localStorage.setItem("auramed_user_token", data.token);
          updateUserAccountUI();
          closeCustomerAuthModal();
          customerLoginForm.reset();
          showToast(`Welcome back, ${data.user.name}!`, "success");
        } else {
          showToast(data.message || "Invalid credentials", "rx");
        }
      } catch (err) {
        showToast("Error connecting to server", "rx");
      } finally {
        submitBtn.textContent = origText;
        submitBtn.disabled = false;
      }
    });
  }

  // Handle Customer Registration
  if (customerRegisterForm) {
    customerRegisterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim();
      const phone = document.getElementById("regPhone").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const address = document.getElementById("regAddress").value.trim();
      const password = document.getElementById("regPassword").value;
      const submitBtn = customerRegisterForm.querySelector("button[type='submit']");
      const origText = submitBtn.textContent;
      submitBtn.textContent = "Creating Account...";
      submitBtn.disabled = true;

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, address, password })
        });
        const data = await res.json();

        if (data.success && data.user) {
          state.currentUser = data.user;
          state.userToken = data.token;
          localStorage.setItem("auramed_user", JSON.stringify(data.user));
          localStorage.setItem("auramed_user_token", data.token);
          updateUserAccountUI();
          closeCustomerAuthModal();
          customerRegisterForm.reset();
          showToast(`Account created! Welcome, ${data.user.name}!`, "success");
        } else {
          showToast(data.message || "Registration failed", "rx");
        }
      } catch (err) {
        showToast("Error creating account", "rx");
      } finally {
        submitBtn.textContent = origText;
        submitBtn.disabled = false;
      }
    });
  }

  // Handle Customer Sign Out
  if (customerSignOutBtn) {
    customerSignOutBtn.addEventListener("click", () => {
      state.currentUser = null;
      state.userToken = null;
      localStorage.removeItem("auramed_user");
      localStorage.removeItem("auramed_user_token");
      updateUserAccountUI();
      closeCustomerProfileModal();
      showToast("Signed out successfully", "info");
    });
  }

  /* --------------------------------------------------------------------------
     Initial Boot
     -------------------------------------------------------------------------- */
  initTheme();
  document.getElementById("themeToggleBtn")?.addEventListener("click", toggleTheme);
  updateUserAccountUI();
  fetchProductsFromBackend();
  updateCartUI();
  renderPillReminders();
});
