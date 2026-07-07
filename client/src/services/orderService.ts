import api from '@/lib/api';

export const createOrder = async (orderData: Record<string, unknown>) => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

export const getOrders = async () => {
  const { data } = await api.get('/orders');
  return data;
};

export const getOrderById = async (id: string) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const requestPayment = async (orderId: string) => {
  const { data } = await api.post('/payment/zarinpal/request', { orderId });
  return data;
};

export const validateCoupon = async (code: string, totalAmount: number) => {
  const { data } = await api.post('/coupons/validate', { code, totalAmount });
  return data;
};

export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const getAdminOrders = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  const { data } = await api.get(`/admin/orders?${query.toString()}`);
  return data;
};

export const updateOrderStatus = async (
  id: string,
  status?: string,
  trackingCode?: string,
  paymentStatus?: string,
  transactionId?: string
) => {
  const { data } = await api.put(`/admin/orders/${id}`, { status, trackingCode, paymentStatus, transactionId });
  return data;
};

export const getAdminUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

export const getAdminReviews = async () => {
  const { data } = await api.get('/admin/reviews');
  return data;
};

export const approveReview = async (id: string) => {
  const { data } = await api.put(`/admin/reviews/${id}/approve`);
  return data;
};

export const rejectReview = async (id: string) => {
  const { data } = await api.put(`/admin/reviews/${id}/reject`);
  return data;
};

export const adminDeleteReview = async (id: string) => {
  const { data } = await api.delete(`/admin/reviews/${id}`);
  return data;
};

export const getAdminProducts = async () => {
  const { data } = await api.get('/admin/products');
  return data;
};

export const adminCreateProduct = async (product: Record<string, unknown>) => {
  const { data } = await api.post('/admin/products', product);
  return data;
};

export const adminUpdateProduct = async (id: string, product: Record<string, unknown>) => {
  const { data } = await api.put(`/admin/products/${id}`, product);
  return data;
};

export const adminDeleteProduct = async (id: string) => {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
};

export const adminDuplicateProduct = async (id: string) => {
  const { data } = await api.post(`/admin/products/${id}/duplicate`);
  return data;
};

export const adminCreateCategory = async (category: Record<string, unknown>) => {
  const { data } = await api.post('/admin/categories', category);
  return data;
};

export const adminUpdateCategory = async (id: string, category: Record<string, unknown>) => {
  const { data } = await api.put(`/admin/categories/${id}`, category);
  return data;
};

export const adminDeleteCategory = async (id: string) => {
  const { data } = await api.delete(`/admin/categories/${id}`);
  return data;
};

export const adminCreateCar = async (car: Record<string, unknown>) => {
  const { data } = await api.post('/admin/cars', car);
  return data;
};

export const adminUpdateCar = async (id: string, car: Record<string, unknown>) => {
  const { data } = await api.put(`/admin/cars/${id}`, car);
  return data;
};

export const adminDeleteCar = async (id: string) => {
  const { data } = await api.delete(`/admin/cars/${id}`);
  return data;
};

export const adminGetCoupons = async () => {
  const { data } = await api.get('/admin/coupons');
  return data;
};

export const adminCreateCoupon = async (coupon: Record<string, unknown>) => {
  const { data } = await api.post('/admin/coupons', coupon);
  return data;
};

export const adminUpdateCoupon = async (id: string, coupon: Record<string, unknown>) => {
  const { data } = await api.put(`/admin/coupons/${id}`, coupon);
  return data;
};

export const adminDeleteCoupon = async (id: string) => {
  const { data } = await api.delete(`/admin/coupons/${id}`);
  return data;
};

export const adminUpdateUser = async (id: string, updates: Record<string, unknown>) => {
  const { data } = await api.put(`/admin/users/${id}`, updates);
  return data;
};

export const adminDeleteUser = async (id: string) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

export const getAdminSellers = async () => {
  const { data } = await api.get('/admin/sellers');
  return data;
};

export const adminCreateSeller = async (seller: Record<string, unknown>) => {
  const { data } = await api.post('/admin/sellers', seller);
  return data;
};

export const adminUpdateSeller = async (id: string, updates: Record<string, unknown>) => {
  const { data } = await api.put(`/admin/sellers/${id}`, updates);
  return data;
};

export const adminDeleteSeller = async (id: string) => {
  const { data } = await api.delete(`/admin/sellers/${id}`);
  return data;
};

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/upload/image', formData);
  return data;
};

export const uploadImages = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const { data } = await api.post('/upload/images', formData);
  return data;
};

export const getFavorites = async () => {
  const { data } = await api.get('/wishlist');
  return data;
};

export const toggleFavorite = async (productId: string) => {
  const { data } = await api.post(`/wishlist/${productId}`);
  return data;
};

export const getAddresses = async () => {
  const { data } = await api.get('/addresses');
  return data;
};

export const createAddress = async (address: Record<string, unknown>) => {
  const { data } = await api.post('/addresses', address);
  return data;
};

export const updateAddress = async (id: string, address: Record<string, unknown>) => {
  const { data } = await api.put(`/addresses/${id}`, address);
  return data;
};

export const deleteAddress = async (id: string) => {
  const { data } = await api.delete(`/addresses/${id}`);
  return data;
};

export const updateOrderPaymentInfo = async (orderId: string, formData: Record<string, unknown>) => {
  const { data } = await api.put(`/orders/${orderId}/payment-info`, formData);
  return data;
};

export const adminDeleteOrder = async (id: string) => {
  const { data } = await api.delete(`/admin/orders/${id}`);
  return data;
};

export const getAdminSellerOrders = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  const { data } = await api.get(`/admin/seller-orders?${query.toString()}`);
  return data;
};

export const updateSellerOrderStatus = async (id: string, sellerStatus: string) => {
  const { data } = await api.put(`/admin/seller-orders/${id}/status`, { sellerStatus });
  return data;
};

export const adminDeleteSellerOrder = async (id: string) => {
  const { data } = await api.delete(`/admin/seller-orders/${id}`);
  return data;
};

export const downloadInvoice = async (orderId: string) => {
  const token = localStorage.getItem('token');
  if (!token) { alert('لطفاً وارد حساب خود شوید'); return; }
  try {
    const { data } = await api.get(`/invoice/${orderId}`, { responseType: 'blob' });
    const blob = new Blob([data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `invoice-${orderId.slice(-8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(link.href);
  } catch {
    alert('خطا در دانلود فاکتور');
  }
};

const downloadFromApi = async (url: string, filename: string) => {
  try {
    const { data } = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(link.href);
  } catch {
    alert('خطا در خروجی گرفتن');
  }
};

export const downloadProductsCsv = () => downloadFromApi('/admin/products/export/csv', 'products.csv');
export const downloadOrdersCsv = () => downloadFromApi('/admin/orders/export/csv', 'orders.csv');
