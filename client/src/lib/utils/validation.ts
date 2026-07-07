export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^09\d{9}$/.test(phone);
};

export const isValidPostalCode = (code: string): boolean => {
  return /^\d{10}$/.test(code);
};
