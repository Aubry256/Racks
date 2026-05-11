/**
 * lib/api.ts
 *
 * Central API client for all Racks frontend ↔ backend communication.
 *
 * WHY A SINGLE API MODULE:
 * - All API calls go through one place — easy to update base URL
 * - JWT token attachment happens automatically
 * - Token refresh happens automatically when access token expires
 * - If the API moves, you change one line (NEXT_PUBLIC_API_URL in .env)
 *
 * HOW JWT AUTH WORKS:
 * 1. User logs in → receives access token (2h) + refresh token (7d)
 * 2. Access token stored in localStorage
 * 3. Every API request adds: Authorization: Bearer <access_token>
 * 4. When access token expires (401 response), use refresh token to get new one
 * 5. If refresh token also expired → force logout
 */

import axios from "axios";

// Base URL from environment variable
// Development: http://localhost:8000
// Production:  https://api.racks.ug
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request Interceptor ───────────────────────────────────────────
// Runs BEFORE every API request
// Attaches the JWT access token to the Authorization header
api.interceptors.request.use((config) => {
  // Only in the browser (not during server-side rendering)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("racks_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response Interceptor ──────────────────────────────────────────
// Runs AFTER every API response
// Handles token refresh when the access token expires
api.interceptors.response.use(
  // Success: pass through unchanged
  (response) => response,

  // Error: check if it's a 401 (unauthorized = token expired)
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite retry loop

      const refreshToken = localStorage.getItem("racks_refresh_token");
      if (refreshToken) {
        try {
          // Get a new access token using the refresh token
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });

          // Save the new access token
          localStorage.setItem("racks_access_token", data.access);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh token also expired — force logout
          localStorage.removeItem("racks_access_token");
          localStorage.removeItem("racks_refresh_token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────────────────

/** Login — returns JWT tokens */
export const login = (email: string, password: string) =>
  api.post("/api/auth/login/", { email, password });

/** Register new customer account */
export const register = (data: {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  district?: string;
}) => api.post("/api/auth/register/", data);

// ── Products ──────────────────────────────────────────────────────

/** Get all products with optional filters */
export const getProducts = (
  params: {
    category?: string; // GET /api/products/?category=phones
    brand?: string; // GET /api/products/?brand=samsung
    on_promo?: boolean; // GET /api/products/?on_promo=true
    search?: string; // GET /api/products/?search=samsung tv
    ordering?: string; // GET /api/products/?ordering=price (or -price)
    page?: number; // GET /api/products/?page=2
  } = {},
) => api.get("/api/products/", { params });

/** Get a single product by slug */
export const getProduct = (slug: string) => api.get(`/api/products/${slug}/`);

/**
 * Get delivery info for a product and district.
 *
 * HCI Principle 3 — Visibility:
 * This is called on every product page to show the user
 * whether Racks delivers to their district and how long it takes.
 * Fixes the Dombelo problem of showing no delivery information.
 */
export const getProductDelivery = (productId: string, district: string) =>
  api.get(`/api/products/${productId}/delivery/`, { params: { district } });

/** Get all categories */
export const getCategories = () => api.get("/api/products/categories/");

// ── Cart ──────────────────────────────────────────────────────────

/** Get the current user's cart */
export const getCart = () => api.get("/api/orders/cart/");

/** Update cart items */
export const updateCart = (items: CartItem[]) =>
  api.post("/api/orders/cart/update/", { items });

// ── Orders ────────────────────────────────────────────────────────

/**
 * Create a draft order.
 *
 * HCI Principle 4 — Error Recovery:
 * The order is saved BEFORE payment is initiated.
 * If payment fails, the order survives.
 */
export const createOrder = (data: {
  items: CartItem[];
  total_amount: number;
  delivery_address: { line1: string; district: string };
  district: string;
  payment_method: string;
  delivery_fee?: number;
}) => api.post("/api/orders/", data);

/** Get all of the user's orders */
export const getOrders = () => api.get("/api/orders/");

/** Get a single order by ID */
export const getOrder = (id: string) => api.get(`/api/orders/${id}/`);

// ── Payments ──────────────────────────────────────────────────────

/**
 * Initiate a payment via Flutterwave.
 * Returns a payment_link (Flutterwave hosted checkout) or
 * demo_mode=true with simulated payment (for school demo).
 *
 * HCI Principle 2 — Feedback:
 * The response includes a human-readable 'message' about what
 * will happen (MoMo prompt sent to phone).
 */
export const initiatePayment = (orderId: string, phone?: string) =>
  api.post("/api/payments/initiate/", { order_id: orderId, phone });

// ── Promotions ────────────────────────────────────────────────────

/**
 * Get all currently active promotions for the homepage.
 *
 * Returns:
 * {
 *   flash_sale: { name, discount_pct, seconds_remaining, ... }
 *   brand_week: { brand, discount_pct, ends_at, ... }
 *   clearance:  [...]
 *   bundles:    [...]
 * }
 *
 * HCI Principle 3 — Visibility:
 * One call gives the frontend all the promotion data it needs.
 */
export const getActivePromos = () => api.get("/api/promotions/active/");

// ── Delivery ─────────────────────────────────────────────────────

/**
 * Get covered delivery zones.
 *
 * HCI Principle 5 — Constraints:
 * Used to populate the district dropdown at checkout.
 * Only shows districts we deliver to — prevents users
 * from selecting a district we don't cover.
 */
export const getCoveredZones = () =>
  api.get("/api/delivery-zones/", { params: { covered: "true" } });

// ── Type definitions ─────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  brand?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  promo_price: number | null;
  on_promo: boolean;
  current_price: number;
  saving_ugx: number;
  discount_pct: number;
  stock_qty: number;
  in_stock: boolean;
  images: string[];
  attributes: Record<string, string>;
  category_name: string;
}

// ── Image Upload ──────────────────────────────────────────────────
/** Upload a product image. Returns { url, name, size } */
export const uploadProductImage = (file: File) => {
  const form = new FormData();
  form.append("image", file);
  return api.post("/api/products/upload-image/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** Delete an uploaded image by URL */
export const deleteProductImage = (url: string) =>
  api.delete("/api/products/delete-image/", { data: { url } });

// ── Vendor Dashboard ──────────────────────────────────────────────
export const getVendorStats = () => api.get("/api/auth/vendor/stats/");
export const getVendorProducts = () => api.get("/api/auth/vendor/products/");
export const createVendorProduct = (data: any) =>
  api.post("/api/auth/vendor/products/", data);
export const updateVendorProduct = (id: string, data: any) =>
  api.put(`/api/auth/vendor/products/${id}/`, data);
export const deleteVendorProduct = (id: string) =>
  api.delete(`/api/auth/vendor/products/${id}/`);
export const getVendorOrders = () => api.get("/api/auth/vendor/orders/");

// ── Customer Dashboard ────────────────────────────────────────────
export const getCustomerOrders = () => api.get("/api/auth/customer/orders/");
export const getWishlist = () => api.get("/api/auth/customer/wishlist/");
export const addToWishlist = (productId: string) =>
  api.post("/api/auth/customer/wishlist/", { product_id: productId });
export const removeFromWishlist = (itemId: number) =>
  api.delete(`/api/auth/customer/wishlist/\${itemId}/`);
export const getCustomerAddresses = () =>
  api.get("/api/auth/customer/addresses/");
export const saveCustomerAddress = (data: any) =>
  api.post("/api/auth/customer/addresses/", data);
export const updateProfile = (data: any) =>
  api.put("/api/auth/customer/profile/", data);

// ── Admin Dashboard ───────────────────────────────────────────────
export const getAdminStats = () => api.get("/api/auth/admin/stats/");
export const getAdminOrders = (params?: any) =>
  api.get("/api/auth/admin/orders/", { params });
export const getAdminProducts = (params?: any) =>
  api.get("/api/auth/admin/products/", { params });
export const getPendingVendors = () =>
  api.get("/api/auth/admin/vendors/pending/");
export const approveVendor = (id: number) =>
  api.post(`/api/auth/admin/vendors/\${id}/`, { action: "approve" });
export const suspendVendor = (id: number) =>
  api.post(`/api/auth/admin/vendors/\${id}/`, { action: "suspend" });
export const updateOrderStatus = (id: string, status: string) =>
  api.patch(`/api/auth/admin/orders/\${id}/`, { status });

export default api;
