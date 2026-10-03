/**
 * AuraMed+ Database Layer
 * Persistent file-based JSON database engine with atomic writes and CRUD operations.
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial Seed Products
const INITIAL_PRODUCTS = [
  {
    id: "med-1",
    name: "Paracetamol Advance Fast-Acting",
    genericName: "Paracetamol / Acetaminophen",
    brand: "GSK Healthcare",
    category: "pain-relief",
    categoryLabel: "Pain & Fever",
    dosage: "500mg - 20 Tablets",
    price: 4.99,
    originalPrice: 6.99,
    rating: 4.9,
    reviewsCount: 342,
    requiresRx: false,
    inStock: true,
    stockQuantity: 150,
    badge: "Bestseller",
    description: "Rapid relief for mild to moderate pain including headache, toothache, muscle aches, and fever reduction. Formulated with Optizorb technology.",
    activeIngredients: "Paracetamol 500mg per tablet",
    usageAdvice: "Take 1-2 tablets every 4 to 6 hours as needed. Do not exceed 8 tablets in 24 hours.",
    sideEffects: "Rare when taken as directed. Allergic reactions or liver toxicity if overdosed.",
    temperatureControl: "Store below 25°C",
    imageType: "pill"
  },
  {
    id: "med-2",
    name: "AmoxiClav Broad-Spectrum",
    genericName: "Amoxicillin + Potassium Clavulanate",
    brand: "Novartis Pharma",
    category: "antibiotics",
    categoryLabel: "Antibiotics",
    dosage: "625mg - 10 Film-Coated Tablets",
    price: 18.50,
    originalPrice: 22.00,
    rating: 4.8,
    reviewsCount: 189,
    requiresRx: true,
    inStock: true,
    stockQuantity: 45,
    badge: "Rx Required",
    description: "Prescription penicillin antibiotic combined with a beta-lactamase inhibitor for respiratory, ear, and sinus infections.",
    activeIngredients: "Amoxicillin 500mg, Clavulanic Acid 125mg",
    usageAdvice: "Strictly as prescribed by a licensed physician. Complete the full course even if symptoms subside.",
    sideEffects: "Mild diarrhea, nausea, stomach discomfort.",
    temperatureControl: "Store in a cool dry place",
    imageType: "capsule"
  },
  {
    id: "med-3",
    name: "LipidCare Atorvastatin",
    genericName: "Atorvastatin Calcium",
    brand: "Pfizer Labs",
    category: "chronic-care",
    categoryLabel: "Cardiovascular & BP",
    dosage: "20mg - 30 Film-Coated Tablets",
    price: 14.75,
    originalPrice: 19.99,
    rating: 4.9,
    reviewsCount: 276,
    requiresRx: true,
    inStock: true,
    stockQuantity: 80,
    badge: "Doctor Choice",
    description: "HMG-CoA reductase inhibitor (statin) used to reduce LDL bad cholesterol and triglycerides, lowering risk of heart disease and stroke.",
    activeIngredients: "Atorvastatin Calcium 20mg",
    usageAdvice: "Take one tablet once daily at the same time every evening, with or without food.",
    sideEffects: "Muscle soreness, digestive issues, mild headache.",
    temperatureControl: "Store at 20°C to 25°C",
    imageType: "tablet"
  },
  {
    id: "med-4",
    name: "Glucovance Metformin XR",
    genericName: "Metformin Hydrochloride Extended-Release",
    brand: "Merck Group",
    category: "chronic-care",
    categoryLabel: "Diabetes Care",
    dosage: "500mg - 60 Extended Release Tablets",
    price: 12.20,
    originalPrice: 15.50,
    rating: 4.8,
    reviewsCount: 412,
    requiresRx: true,
    inStock: true,
    stockQuantity: 95,
    badge: "Daily Essential",
    description: "First-line oral anti-hyperglycemic agent for Type 2 Diabetes mellitus. Helps restore your body's proper response to insulin.",
    activeIngredients: "Metformin HCl 500mg Extended Release",
    usageAdvice: "Swallow whole with an evening meal. Do not crush or chew.",
    sideEffects: "Mild metallic taste, transient nausea, stomach upset.",
    temperatureControl: "Store at room temperature 15°C to 30°C",
    imageType: "tablet"
  },
  {
    id: "med-5",
    name: "AeroHist Cetirizine 24H",
    genericName: "Cetirizine Hydrochloride",
    brand: "Johnson & Johnson",
    category: "pain-relief",
    categoryLabel: "Allergy & Cold",
    dosage: "10mg - 30 Film-Coated Tablets",
    price: 7.95,
    originalPrice: 10.50,
    rating: 4.9,
    reviewsCount: 520,
    requiresRx: false,
    inStock: true,
    stockQuantity: 120,
    badge: "Non-Drowsy",
    description: "2nd generation antihistamine providing 24-hour relief from seasonal allergies, hay fever, sneezing, runny nose, and hives.",
    activeIngredients: "Cetirizine HCl 10mg",
    usageAdvice: "Take 1 tablet once daily with water. Can be taken with or without food.",
    sideEffects: "Slight dry mouth; rarely causes drowsiness.",
    temperatureControl: "Store below 25°C",
    imageType: "pill"
  },
  {
    id: "med-6",
    name: "GastroShield Omeprazole",
    genericName: "Omeprazole Delayed-Release",
    brand: "AstraZeneca",
    category: "pain-relief",
    categoryLabel: "Digestive & Acid Reflux",
    dosage: "20mg - 28 Gastro-Resistant Capsules",
    price: 11.40,
    originalPrice: 14.80,
    rating: 4.7,
    reviewsCount: 310,
    requiresRx: false,
    inStock: true,
    stockQuantity: 70,
    badge: "Acid Relief",
    description: "Proton Pump Inhibitor (PPI) that suppresses stomach acid production, treating heartburn, GERD, and gastric ulcers effectively.",
    activeIngredients: "Omeprazole 20mg in enteric-coated pellets",
    usageAdvice: "Take 1 capsule in the morning at least 30 to 60 minutes before breakfast.",
    sideEffects: "Headache, mild stomach discomfort.",
    temperatureControl: "Store in moisture-proof blister below 25°C",
    imageType: "capsule"
  },
  {
    id: "med-7",
    name: "ImmunoBoost Zinc + Vitamin C 1000",
    genericName: "Ascorbic Acid + Zinc Citrate + Vitamin D3",
    brand: "NutriLife Bio",
    category: "vitamins",
    categoryLabel: "Vitamins & Immunity",
    dosage: "20 Effervescent Orange Tablets",
    price: 8.99,
    originalPrice: 12.00,
    rating: 4.9,
    reviewsCount: 680,
    requiresRx: false,
    inStock: true,
    stockQuantity: 200,
    badge: "Top Rated",
    description: "Triple-action immune defense formula. Rapid effervescent absorption delivers 1000mg pure Vitamin C, 15mg Elemental Zinc, and 1000 IU Vit D3.",
    activeIngredients: "Ascorbic Acid 1000mg, Zinc Citrate 15mg, Vit D3 1000IU",
    usageAdvice: "Dissolve 1 tablet in 200ml cold water once daily after food.",
    sideEffects: "Well tolerated. Excess intake may cause mild loose stools.",
    temperatureControl: "Keep tube tightly sealed in dry place",
    imageType: "effervescent"
  },
  {
    id: "med-8",
    name: "Omron Smart Upper Arm BP Monitor",
    genericName: "Automated Digital Sphygmomanometer",
    brand: "Omron Healthcare",
    category: "devices",
    categoryLabel: "Medical Devices",
    dosage: "HEM-7120 with IntelliSense Cuff",
    price: 49.99,
    originalPrice: 65.00,
    rating: 5.0,
    reviewsCount: 840,
    requiresRx: false,
    inStock: true,
    stockQuantity: 30,
    badge: "Clinical Accuracy",
    description: "Clinically certified upper arm blood pressure monitor. Features Intellisense automatic inflation, irregular heartbeat detection, and cuff wrap guide.",
    activeIngredients: "Digital Oscillometric Sensor, Latex-free comfort cuff (22-32 cm)",
    usageAdvice: "Sit comfortably and rest 5 minutes before measurement. Keep arm level with heart.",
    sideEffects: "None",
    temperatureControl: "Keep in protective carrying case",
    imageType: "device"
  },
  {
    id: "med-9",
    name: "Accu-Chek Instant Blood Glucose Kit",
    genericName: "Blood Glucose Monitoring System",
    brand: "Roche Diagnostics",
    category: "devices",
    categoryLabel: "Diabetes Monitors",
    dosage: "1 Meter + 25 Test Strips + 10 Lancets",
    price: 29.50,
    originalPrice: 38.00,
    rating: 4.8,
    reviewsCount: 512,
    requiresRx: false,
    inStock: true,
    stockQuantity: 40,
    badge: "Instant Results",
    description: "Effortless glucose testing with intuitive target range indicator. Requires a tiny 0.6 µL blood droplet and yields lab-precise readings within 4 seconds.",
    activeIngredients: "Electrochemical FAD-GDH sensor technology",
    usageAdvice: "Insert test strip, apply blood sample, read results. Pair with mySugr app.",
    sideEffects: "None",
    temperatureControl: "Store strips between 4°C and 30°C",
    imageType: "device"
  },
  {
    id: "med-10",
    name: "IbuPro Ultra Anti-Inflammatory",
    genericName: "Ibuprofen Liquid Filled Softgels",
    brand: "Abbott Health",
    category: "pain-relief",
    categoryLabel: "Pain Relief",
    dosage: "400mg - 24 Softgels",
    price: 6.49,
    originalPrice: 8.50,
    rating: 4.8,
    reviewsCount: 290,
    requiresRx: false,
    inStock: true,
    stockQuantity: 110,
    badge: "Fast Liquid Gel",
    description: "NSAID providing targeted relief for acute back pain, joint stiffness, menstrual cramps, dental pain, and muscular inflammation.",
    activeIngredients: "Solubilized Ibuprofen 400mg",
    usageAdvice: "Take 1 softgel every 6 to 8 hours with meals or milk. Do not take on an empty stomach.",
    sideEffects: "Gastrointestinal discomfort if taken without food.",
    temperatureControl: "Store below 25°C",
    imageType: "capsule"
  }
];

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      const defaultState = {
        products: INITIAL_PRODUCTS,
        orders: [
          {
            orderId: "AM-104829",
            customerName: "Robert Walker",
            phone: "(555) 234-8891",
            address: "842 Lexington Ave, Apt 4A",
            speed: "express",
            paymentMethod: "card",
            items: [
              { id: "med-1", name: "Paracetamol Advance Fast-Acting", dosage: "500mg - 20 Tablets", price: 4.99, quantity: 2 },
              { id: "med-7", name: "ImmunoBoost Zinc + Vitamin C 1000", dosage: "20 Effervescent Orange Tablets", price: 8.99, quantity: 1 }
            ],
            subtotal: 18.97,
            deliveryFee: 4.99,
            grandTotal: 23.96,
            status: "out_for_delivery",
            placedAt: "10:15 AM",
            createdAt: new Date().toISOString(),
            history: [
              { status: "confirmed", note: "Order placed via website", time: "10:15 AM" },
              { status: "verified", note: "Prescription and dosage verified by Dr. Elena", time: "10:22 AM" },
              { status: "packing", note: "Packed in cold-chain insulated pouch", time: "10:30 AM" },
              { status: "out_for_delivery", note: "Dispatched with Express Courier #9", time: "10:38 AM" }
            ]
          }
        ],
        prescriptions: [
          {
            id: "rx-9812",
            patientName: "Sarah Jenkins",
            patientPhone: "(555) 341-9920",
            patientNotes: "Allergic to Penicillin. Please check for non-penicillin alternative.",
            fileName: "rx_sample_doctor_dr_bennett.pdf",
            filePath: "uploads/prescriptions/sample.pdf",
            fileUrl: "/uploads/prescriptions/sample.pdf",
            status: "pending_review",
            pharmacistNotes: "",
            uploadedAt: new Date().toISOString()
          }
        ],
        consultations: [],
        users: [
          {
            id: "user-1",
            name: "Tanvir Ahmed",
            email: "tanvir@example.com",
            phone: "01712345678",
            password: "password123",
            address: "House 12, Road 5, Dhanmondi, Dhaka",
            createdAt: new Date().toISOString()
          }
        ],
        admin: {
          email: "admin@auramed.com",
          password: "admin123",
          name: "Dr. Alex Vance, PharmD",
          role: "Super Admin / Chief Pharmacist",
          token: "auramed_token_" + Date.now()
        },
        settings: {
          storeName: "AuraMed+ Digital Pharmacy & Healthcare",
          storePhone: "(800) 555-AURA",
          currency: "$",
          freeDeliveryThreshold: 35.00,
          standardDeliveryFee: 4.99
        }
      };
      this.write(defaultState);
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (!parsed.users) parsed.users = [];
      return parsed;
    } catch (err) {
      console.error("Error reading database:", err);
      return { products: [], orders: [], prescriptions: [], consultations: [], users: [] };
    }
  }

  write(data) {
    try {
      const tempPath = DB_FILE + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
      return true;
    } catch (err) {
      console.error("Error writing to database:", err);
      return false;
    }
  }

  // --- Products Helpers ---
  getProducts(query = {}) {
    const db = this.read();
    let products = [...db.products];

    if (query.category && query.category !== "all") {
      products = products.filter(p => p.category === query.category);
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.genericName.toLowerCase().includes(s) ||
        p.brand.toLowerCase().includes(s) ||
        p.categoryLabel.toLowerCase().includes(s)
      );
    }

    if (query.sort) {
      switch (query.sort) {
        case "price-low":
          products.sort((a, b) => a.price - b.price);
          break;
        case "price-high":
          products.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          products.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    return products;
  }

  getProductById(id) {
    const db = this.read();
    return db.products.find(p => p.id === id);
  }

  createProduct(product) {
    const db = this.read();
    product.id = product.id || "med-" + (db.products.length + 1);
    product.inStock = product.inStock !== false;
    product.stockQuantity = product.stockQuantity || 50;
    db.products.push(product);
    this.write(db);
    return product;
  }

  updateProduct(id, updates) {
    const db = this.read();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) return null;

    db.products[index] = { ...db.products[index], ...updates };
    this.write(db);
    return db.products[index];
  }

  deleteProduct(id) {
    const db = this.read();
    const beforeCount = db.products.length;
    db.products = db.products.filter(p => p.id !== id);
    if (db.products.length !== beforeCount) {
      this.write(db);
      return true;
    }
    return false;
  }

  // --- Orders Helpers ---
  getOrders() {
    const db = this.read();
    return db.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getOrderById(orderId) {
    const db = this.read();
    return db.orders.find(o => o.orderId === orderId);
  }

  createOrder(orderData) {
    const db = this.read();
    const orderId = "AM-" + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();

    const newOrder = {
      orderId,
      customerName: orderData.customerName,
      phone: orderData.phone,
      address: orderData.address,
      speed: orderData.speed || "express",
      paymentMethod: orderData.paymentMethod || "card",
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee || 0,
      grandTotal: orderData.grandTotal || orderData.subtotal,
      status: "confirmed",
      placedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now.toISOString(),
      history: [
        {
          status: "confirmed",
          note: "Order placed via website checkout",
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    // Deduct stock quantities
    if (newOrder.items && newOrder.items.length) {
      newOrder.items.forEach(item => {
        const product = db.products.find(p => p.id === item.id);
        if (product && product.stockQuantity) {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
          if (product.stockQuantity === 0) product.inStock = false;
        }
      });
    }

    db.orders.unshift(newOrder);
    this.write(db);
    return newOrder;
  }

  updateOrderStatus(orderId, status, note = "") {
    const db = this.read();
    const order = db.orders.find(o => o.orderId === orderId);
    if (!order) return null;

    order.status = status;
    const now = new Date();
    order.history = order.history || [];
    order.history.push({
      status,
      note: note || `Status updated to ${status}`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.write(db);
    return order;
  }

  // --- Prescriptions Helpers ---
  getPrescriptions() {
    const db = this.read();
    return db.prescriptions.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  getPrescriptionById(id) {
    const db = this.read();
    return db.prescriptions.find(p => p.id === id);
  }

  createPrescription(rxData) {
    const db = this.read();
    const newRx = {
      id: "rx-" + Math.floor(1000 + Math.random() * 9000),
      patientName: rxData.patientName,
      patientPhone: rxData.patientPhone,
      patientNotes: rxData.patientNotes || "",
      fileName: rxData.fileName || "prescription.jpg",
      filePath: rxData.filePath || "",
      fileUrl: rxData.fileUrl || "",
      status: "pending_review",
      pharmacistNotes: "",
      uploadedAt: new Date().toISOString()
    };

    db.prescriptions.unshift(newRx);
    this.write(db);
    return newRx;
  }

  updatePrescriptionStatus(id, status, pharmacistNotes = "") {
    const db = this.read();
    const rx = db.prescriptions.find(p => p.id === id);
    if (!rx) return null;

    rx.status = status;
    if (pharmacistNotes) rx.pharmacistNotes = pharmacistNotes;
    rx.reviewedAt = new Date().toISOString();

    this.write(db);
    return rx;
  }

  // --- Consultations / Chat Helpers ---
  saveConsultationMessage(sessionId, message) {
    const db = this.read();
    let consultation = db.consultations.find(c => c.sessionId === sessionId);
    if (!consultation) {
      consultation = {
        id: "chat-" + Date.now(),
        sessionId,
        messages: [],
        createdAt: new Date().toISOString()
      };
      db.consultations.push(consultation);
    }

    consultation.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    this.write(db);
    return consultation;
  }

  getConsultationHistory(sessionId) {
    const db = this.read();
    return db.consultations.find(c => c.sessionId === sessionId) || { messages: [] };
  }

  // --- Admin Analytics ---
  getAdminStats() {
    const db = this.read();
    const totalOrders = db.orders.length;
    const totalRevenue = db.orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const pendingPrescriptions = db.prescriptions.filter(p => p.status === "pending_review").length;
    const activeProducts = db.products.length;
    const lowStockCount = db.products.filter(p => p.stockQuantity < 20).length;

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      pendingPrescriptions,
      activeProducts,
      lowStockCount,
      recentOrders: db.orders.slice(0, 5)
    };
  }

  // --- Admin Authentication & Access ---
  getAdmin() {
    const db = this.read();
    if (!db.admin) {
      db.admin = {
        email: "admin@auramed.com",
        password: "admin123",
        name: "Dr. Alex Vance, PharmD",
        role: "Super Admin / Chief Pharmacist",
        token: "auramed_token_master"
      };
      this.write(db);
    }
    return db.admin;
  }

  authenticateAdmin(email, password) {
    const admin = this.getAdmin();
    if (admin.email.toLowerCase() === email.toLowerCase().trim() && admin.password === password) {
      const db = this.read();
      const token = "auramed_session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      db.admin.token = token;
      this.write(db);

      return {
        success: true,
        user: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          token
        }
      };
    }
    return { success: false, message: "Invalid email or password" };
  }

  verifyAdminToken(token) {
    if (!token) return false;
    const admin = this.getAdmin();
    return admin.token === token;
  }

  changeAdminPassword(oldPassword, newPassword) {
    const db = this.read();
    const admin = this.getAdmin();
    if (admin.password !== oldPassword) {
      return { success: false, message: "Current password does not match" };
    }
    db.admin.password = newPassword;
    db.admin.token = "auramed_session_" + Date.now();
    this.write(db);
    return { success: true, message: "Password updated successfully" };
  }

  getSettings() {
    const db = this.read();
    return db.settings || {
      storeName: "AuraMed+ Digital Pharmacy & Healthcare",
      storePhone: "(800) 555-AURA",
      currency: "$",
      freeDeliveryThreshold: 35.00,
      standardDeliveryFee: 4.99
    };
  }

  updateSettings(updates) {
    const db = this.read();
    db.settings = { ...(db.settings || {}), ...updates };
    this.write(db);
    return db.settings;
  }

  // --- Customer / User Account Management ---
  registerUser({ name, email, phone, password, address }) {
    const db = this.read();
    db.users = db.users || [];

    const existing = db.users.find(u => 
      (email && u.email && u.email.toLowerCase() === email.toLowerCase().trim()) ||
      (phone && u.phone && u.phone.trim() === phone.trim())
    );

    if (existing) {
      return { success: false, message: "An account already exists with this email or phone number" };
    }

    const token = "user_token_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const newUser = {
      id: "user-" + (db.users.length + 1) + "_" + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : "",
      phone: phone ? phone.trim() : "",
      password: password,
      address: address ? address.trim() : "",
      token: token,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    this.write(db);

    const safeUser = { ...newUser };
    delete safeUser.password;

    return { success: true, message: "Account registered successfully", user: safeUser, token };
  }

  authenticateUser(identifier, password) {
    const db = this.read();
    db.users = db.users || [];

    const idClean = identifier.toLowerCase().trim();
    const user = db.users.find(u => 
      (u.email && u.email.toLowerCase() === idClean) ||
      (u.phone && u.phone.trim() === idClean)
    );

    if (!user || user.password !== password) {
      return { success: false, message: "Invalid email/phone or password" };
    }

    const token = "user_token_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    user.token = token;
    this.write(db);

    const safeUser = { ...user };
    delete safeUser.password;

    return { success: true, message: "Login successful", user: safeUser, token };
  }

  getUserByToken(token) {
    if (!token) return null;
    const db = this.read();
    db.users = db.users || [];
    const user = db.users.find(u => u.token === token);
    if (!user) return null;
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  getUserOrders(identifier) {
    if (!identifier) return [];
    const db = this.read();
    const idClean = identifier.toLowerCase().trim();
    return (db.orders || []).filter(o => 
      (o.phone && o.phone.trim() === idClean) ||
      (o.customerEmail && o.customerEmail.toLowerCase() === idClean) ||
      (o.customerName && o.customerName.toLowerCase().includes(idClean))
    );
  }

  getUserPrescriptions(identifier) {
    if (!identifier) return [];
    const db = this.read();
    const idClean = identifier.toLowerCase().trim();
    return (db.prescriptions || []).filter(p => 
      (p.patientPhone && p.patientPhone.trim() === idClean) ||
      (p.patientEmail && p.patientEmail.toLowerCase() === idClean) ||
      (p.patientName && p.patientName.toLowerCase().includes(idClean))
    );
  }
}

module.exports = new Database();
