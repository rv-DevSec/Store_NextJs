import api from '@/lib/api';

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateAddress = async (addresses: unknown[]) => {
  const { data } = await api.put('/auth/addresses', { addresses });
  return data;
};
