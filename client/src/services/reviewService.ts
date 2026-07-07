import api from '@/lib/api';

export const getProductReviews = async (productId: string) => {
  const { data } = await api.get(`/reviews/product/${productId}`);
  return data;
};

export const createReview = async (reviewData: { product: string; rating: number; comment: string }) => {
  const { data } = await api.post('/reviews', reviewData);
  return data;
};

export const updateReview = async (id: string, reviewData: { rating?: number; comment?: string }) => {
  const { data } = await api.put(`/reviews/${id}`, reviewData);
  return data;
};

export const deleteReview = async (id: string) => {
  const { data } = await api.delete(`/reviews/${id}`);
  return data;
};

export const getUserReviews = async () => {
  const { data } = await api.get('/reviews/me');
  return data;
};
