import api from '@/lib/api';
import type { ProductFilters } from '@/types';

export const getProducts = async (params: ProductFilters = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const { data } = await api.get(`/products?${query.toString()}`);
  return data;
};

export const getProductBySlug = async (slug: string) => {
  const { data } = await api.get(`/products/${slug}`);
  return data;
};

export const getCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const getCars = async () => {
  const { data } = await api.get('/cars');
  return data;
};

export const getSettings = async () => {
  const { data } = await api.get('/settings');
  return data;
};

export const createProductRequest = async (req: { name: string; phone: string; productName: string; description?: string }) => {
  const { data } = await api.post('/product-requests', req);
  return data;
};
