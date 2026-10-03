// Empty VITE_API_URL = use Vite proxy (/api → localhost:5000). Set it for production.
const API_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("ac_admin_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* no body */
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me", { auth: true }),

  // Products
  getProducts: (all = false) => request(`/products${all ? "?all=1" : ""}`, { auth: all }),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request("/products", { method: "POST", body: data, auth: true }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: "PUT", body: data, auth: true }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE", auth: true }),
  reorderProductImages: (id, images) => request(`/products/${id}/reorder-images`, { method: "PUT", body: { images }, auth: true }),
  bulkProducts: (ids, action) => request("/products/bulk", { method: "POST", body: { ids, action }, auth: true }),

  uploadProductImages: async (files) => {
    const form = new FormData();
    Array.from(files).forEach(f => form.append("images", f));
    const res = await fetch(`${API_URL}/products/upload-images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Upload failed"); }
    return res.json(); // { urls: ["/uploads/products/prod-xxx.jpg", ...] }
  },

  // Collections
  getCollections: (all = false) => request(`/collections${all ? "?all=1" : ""}`, { auth: all }),
  createCollection: (data) => request("/collections", { method: "POST", body: data, auth: true }),
  updateCollection: (id, data) => request(`/collections/${id}`, { method: "PUT", body: data, auth: true }),
  deleteCollection: (id) => request(`/collections/${id}`, { method: "DELETE", auth: true }),

  // Orders
  createOrder: (data) => request("/orders", { method: "POST", body: data }),
  getOrders: () => request("/orders", { auth: true }),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: "PUT", body: data, auth: true }),

  // Customer order lookup + cancellation
  getOrderForCustomer: (id, email) => request(`/orders/${id}/customer?email=${encodeURIComponent(email)}`),
  requestCancellation: (id, email, reason, note) =>
    request(`/orders/${id}/cancel-request`, { method: "POST", body: { email, reason, note } }),

  // Admin cancellation management
  getCancellations: (status) => request(`/orders/cancellations${status ? `?status=${status}` : ""}`, { auth: true }),
  approveCancellation: (id, adminNote, refundAmount) =>
    request(`/orders/${id}/cancel-approve`, { method: "PUT", body: { adminNote, refundAmount }, auth: true }),
  rejectCancellation: (id, adminNote) =>
    request(`/orders/${id}/cancel-reject`, { method: "PUT", body: { adminNote }, auth: true }),
  markRefundProcessed: (id, data) =>
    request(`/orders/${id}/refund-mark`, { method: "PUT", body: data, auth: true }),

  // Profit reporting
  getProfitSummary: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return request(`/orders/profit-summary?${params.toString()}`, { auth: true });
  },
  getOrderProfit: (id) => request(`/orders/${id}/profit`, { auth: true }),

  // Customers
  getCustomers: () => request("/customers", { auth: true }),

  // Discounts
  validateDiscount: (code) => request("/discounts/validate", { method: "POST", body: { code } }),
  getDiscounts: () => request("/discounts", { auth: true }),
  createDiscount: (data) => request("/discounts", { method: "POST", body: data, auth: true }),
  updateDiscount: (id, data) => request(`/discounts/${id}`, { method: "PUT", body: data, auth: true }),
  deleteDiscount: (id) => request(`/discounts/${id}`, { method: "DELETE", auth: true }),

  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (data) => request("/settings", { method: "PUT", body: data, auth: true }),

  // Banners
  getBanners: () => request("/banners"),
  deleteBanner: (id) => request(`/banners/${id}`, { method: "DELETE", auth: true }),
  uploadBanner: async (label, file) => {
    const form = new FormData();
    form.append("label", label);
    form.append("image", file);
    const res = await fetch(`${API_URL}/banners`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },



  // Site image upload (separate from product images)
  // Ads
  getAds:    ()       => request("/ads", { auth: true }),
  createAd:  (data)   => request("/ads", { method:"POST", body:data, auth:true }),
  updateAd:  (id, d)  => request(`/ads/${id}`, { method:"PUT", body:d, auth:true }),
  deleteAd:  (id)     => request(`/ads/${id}`, { method:"DELETE", auth:true }),

  uploadSiteImage: async (file) => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${API_URL}/banners/site-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json(); // { url }
  },

  // Ad campaigns
  getAdCampaigns: () => request("/ads", { auth: true }),
  createAdCampaign: (data) => request("/ads", { method: "POST", body: data, auth: true }),
  updateAdCampaign: (id, data) => request(`/ads/${id}`, { method: "PUT", body: data, auth: true }),
  deleteAdCampaign: (id) => request(`/ads/${id}`, { method: "DELETE", auth: true }),

  // Site images — dedicated upload that auto-saves to settings
  // Ads
  getAds:    ()       => request("/ads", { auth: true }),
  createAd:  (data)   => request("/ads", { method:"POST", body:data, auth:true }),
  updateAd:  (id, d)  => request(`/ads/${id}`, { method:"PUT", body:d, auth:true }),
  deleteAd:  (id)     => request(`/ads/${id}`, { method:"DELETE", auth:true }),

  uploadSiteImage: async (key, file) => {
    const form = new FormData();
    form.append("key", key);
    form.append("image", file);
    const res = await fetch(`${API_URL}/settings/upload-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form
    });
    if (!res.ok) throw new Error("Site image upload failed");
    return res.json(); // { url, key }
  },

  // Reviews
  getReviews: (productId) => request(`/products/${productId}/reviews`),
  getAllReviews: () => request("/products/all-reviews", { auth: true }),
  deleteReview: (id) => request(`/products/reviews/${id}`, { method: "DELETE", auth: true }),
  verifyReview: (id) => request(`/products/reviews/${id}/verify`, { method: "PUT", auth: true }),
  submitReview: async (productId, data, imageFiles = []) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    imageFiles.forEach(f => form.append("images", f));
    const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
      method: "POST", body: form
    });
    if (!res.ok) throw new Error("Review submission failed");
    return res.json();
  },

  // Payments
  getRazorpayKey: () => request("/payments/razorpay/key"),
  createRazorpayOrder: (amount, receipt) => request("/payments/razorpay/create-order", { method: "POST", body: { amount, receipt } }),
  verifyRazorpayPayment: (payload) => request("/payments/razorpay/verify", { method: "POST", body: payload })
};

export { API_URL, getToken };
