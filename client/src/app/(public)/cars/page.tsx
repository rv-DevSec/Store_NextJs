'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCars } from '@/services/productService';
import CarIcon from '@/components/ui/CarIcon';
import SEO from '@/components/common/SEO';

const Cars = () => {
  const { data, isLoading } = useQuery({ queryKey: ['cars'], queryFn: getCars });

  const allCars: { _id: string; brand: string; model: string; image?: string }[] = [];
  if (data?.brands) {
    for (const brand of data.brands) {
      for (const m of brand.models) {
        allCars.push({ _id: m._id, brand: brand.brand, model: m.model, image: m.image });
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title="خودروها" description="لیست خودروهای سازگار با قطعات فروشگاه" />
      <h1 className="text-2xl font-bold mb-6">خودروها</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 shimmer rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allCars.map((car) => (
            <Link
              key={car._id}
              href={`/products?car=${car._id}`}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-xl hover:-translate-y-1 hover:border-primary transition-all duration-300 group"
            >
              <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 overflow-hidden group-hover:bg-gray-50 transition-colors">
                {car.image ? (
                  <img src={car.image} alt={car.model} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <CarIcon className="w-20 h-16 group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
              <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{car.brand} {car.model}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cars;
