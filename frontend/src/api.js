import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Stable guest session ID so cart persists across page loads
function getSessionId() {
  let id = localStorage.getItem('session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('session_id', id);
  }
  return id;
}

// Attach token + session ID to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only act on actual 401 HTTP responses, not network errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register:      (data) => api.post('/register', data),
  login:         (data) => api.post('/login', data),
  logout:        ()     => api.post('/logout'),
  user:          ()     => api.get('/user'),
  updateProfile: (data) => api.put('/user/profile', data),
  uploadAvatar:  (data) => api.post('/user/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Products
export const productAPI = {
  all: (params) => api.get('/products', { params }),
  show: (slug) => api.get(`/products/${slug}`),
  featured: () => api.get('/products/featured'),
  bestSellers: () => api.get('/products/best-sellers'),
  categories: () => api.get('/categories'),
  collections: () => api.get('/collections'),
  mediums: () => api.get('/mediums'),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon'),
  saveForLater: (itemId) => api.post(`/cart/save-for-later/${itemId}`),
  moveToWishlist: (itemId) => api.post(`/cart/move-to-wishlist/${itemId}`),
};

// Orders
export const orderAPI = {
  all: () => api.get('/orders'),
  show: (id) => api.get(`/orders/${id}`),
  checkout: (data) => api.post('/checkout', data),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
};

// Custom Orders
export const customOrderAPI = {
  all: () => api.get('/custom-orders'),
  show: (id) => api.get(`/custom-orders/${id}`),
  create: (data) => api.post('/custom-orders', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  estimate: (data) => api.post('/custom-orders/estimate', data),
  track: (orderNumber) => api.get(`/custom-orders/track/${orderNumber}`),
  uploadFiles: (id, data) => api.post(`/custom-orders/${id}/files`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeFile: (fileId) => api.delete(`/custom-orders/files/${fileId}`),
};

// Wishlist
export const wishlistAPI = {
  all: () => api.get('/wishlist'),
  toggle: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

// Reviews
export const reviewAPI = {
  forProduct: (productId) => api.get(`/reviews/${productId}`),
  canReview:  (productId) => api.get(`/reviews/${productId}/can-review`),
  create:     (data)      => api.post('/reviews', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Admin
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  orders: () => api.get('/admin/orders'),
  orderDetail: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  customOrders: () => api.get('/admin/custom-orders'),
  customOrderDetail: (id) => api.get(`/admin/custom-orders/${id}`),
  updateCustomOrderStatus: (id, data) => api.put(`/admin/custom-orders/${id}/status`, data),
  sendQuote: (id, data) => api.post(`/admin/custom-orders/${id}/quote`, data),
  products: () => api.get('/admin/products'),
  showProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProduct: (id, data) => api.post(`/admin/products/${id}`, data, {
    // Use POST with FormData so image uploads work on update too
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  reviews: () => api.get('/admin/reviews'),
  approveReview: (id) => api.put(`/admin/reviews/${id}/approve`),
  users: () => api.get('/admin/users'),
  analytics: () => api.get('/admin/analytics'),
};

export default api;