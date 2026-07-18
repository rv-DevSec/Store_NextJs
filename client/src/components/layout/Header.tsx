'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { toPersianNumber, formatPrice } from '@/lib/utils/numbers';
import { cn } from '@/lib/utils/cn';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems, totalItems, totalPrice, cartOpen, setCartOpen, removeFromCart, updateQty } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setCartOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-primary hover:text-primary-light transition-colors duration-200">
            قطعات یدکی خودرو
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی محصول..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary-dark transition-all duration-200 active:scale-95"
              >
                جستجو
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3">
            {user?.role !== 'seller' && (
              <div ref={cartRef} className="relative">
                <button
                  onClick={() => setCartOpen(!cartOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-90"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce-in">
                      {toPersianNumber(totalItems)}
                    </span>
                  )}
                </button>

                {cartOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-scale-in origin-top-left max-h-[calc(100vh-6rem)] overflow-y-auto">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold">سبد خرید ({toPersianNumber(totalItems)})</h3>
                        <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {cartItems.length === 0 ? (
                        <p className="text-gray-500 text-center py-8 animate-fade-in">سبد خرید خالی است</p>
                      ) : (
                        <>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {cartItems.map((item) => (
                              <div
                                key={item._id}
                                className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                              >
                                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 flex-shrink-0">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateQty(item._id, item.qty - 1)}
                                    className="w-6 h-6 flex items-center justify-center border rounded text-xs hover:bg-gray-50 transition-all duration-200 active:scale-90"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 text-center text-xs font-medium">{toPersianNumber(item.qty)}</span>
                                  <button
                                    onClick={() => item.qty < item.stock && updateQty(item._id, item.qty + 1)}
                                    className="w-6 h-6 flex items-center justify-center border rounded text-xs hover:bg-gray-50 transition-all duration-200 active:scale-90"
                                  >
                                    +
                                  </button>
                                </div>
                                <button onClick={() => removeFromCart(item._id)} className="text-gray-300 hover:text-danger transition-colors duration-200 p-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500">مجموع</p>
                              <p className="font-bold">{formatPrice(totalPrice)}</p>
                            </div>
                            <Link
                              href="/checkout"
                              onClick={() => setCartOpen(false)}
                              className="bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary-dark transition-all duration-200 active:scale-95"
                            >
                              تسویه حساب
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-90"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-scale-in origin-top-left">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-all duration-200">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        پروفایل
                      </Link>
                      <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-all duration-200">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        علاقه‌مندی‌ها
                      </Link>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-all duration-200">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        سفارشات من
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-gray-50 transition-all duration-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          پنل مدیریت
                        </Link>
                      )}
                      {user.role === 'seller' && (
                        <Link href="/seller" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-gray-50 transition-all duration-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          پنل فروشنده
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 w-full text-right px-4 py-2.5 text-sm text-danger hover:bg-gray-50 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        خروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-all duration-200 active:scale-95">
                ورود / ثبت‌نام
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-90"
            >
              <svg className={cn('w-6 h-6 text-gray-700 transition-transform duration-200', mobileMenuOpen && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
            mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="pb-4 pt-2">
            <form onSubmit={handleSearch} className="mb-3 animate-slide-down">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:border-primary"
                />
                <button type="submit" className="absolute left-1 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary-dark transition-all duration-200 active:scale-95">
                  جستجو
                </button>
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {[
                { to: '/', label: 'خانه' },
                { to: '/products', label: 'محصولات' },
                { to: '/categories', label: 'دسته‌بندی‌ها' },
                { to: '/about', label: 'درباره ما' },
                ...(user ? [
                  { to: '/profile', label: 'پروفایل' },
                  { to: '/wishlist', label: 'علاقه‌مندی‌ها' },
                  { to: '/orders', label: 'سفارشات من' },
                ] : []),
              ].map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 hover:text-primary transition-all duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
