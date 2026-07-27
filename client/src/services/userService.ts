import api from '@/lib/api';

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateAddress = async (id: string, addressData: Record<string, unknown>) => {
  const { data } = await api.put(`/addresses/${id}`, addressData);
  return data;
};
