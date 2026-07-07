'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getProducts, getProductBySlug, getCategories, getCars } from '@/services/productService';
import type { ProductFilters } from '@/types';

export const useProducts = (params: ProductFilters) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCars = () => {
  return useQuery({
    queryKey: ['cars'],
    queryFn: getCars,
    staleTime: 10 * 60 * 1000,
  });
};
