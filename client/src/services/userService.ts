import api from '@/lib/api';

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateProfile = async (data: Record<string, unknown>) => {
  const { data: res } = await api.put('/auth/me', data);
  return res;
};

export const updateAddress = async (id: string, addressData: Record<string, unknown>) => {
  const { data } = await api.put(`/addresses/${id}`, addressData);
  return data;
};
