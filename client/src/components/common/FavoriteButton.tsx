'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavorite } from '@/services/orderService';
import { cn } from '@/lib/utils/cn';

interface Props {
  productId: string;
  isFavorited: boolean;
  className?: string;
}

const FavoriteButton = ({ productId, isFavorited, className }: Props) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
      return;
    }
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110',
        isFavorited
          ? 'text-danger bg-danger/10 hover:bg-danger/20'
          : 'text-gray-400 bg-white/80 hover:bg-gray-100',
        className
      )}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;
