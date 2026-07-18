'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { createOrder, requestPayment, validateCoupon, getAddresses, createAddress } from '@/services/orderService';
import { getSettings } from '@/services/productService';
import { formatPrice, toPersianNumber } from '@/lib/utils/numbers';
import SEO from '@/components/common/SEO';
import Link from 'next/link';

const CheckoutForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('zarinpal');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState({
    title: '', province: '', city: '', fullAddress: '', postalCode: '', phone: '',
  });
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [orderError, setOrderError] = useState('');

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: !!user,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const addresses = addressesData?.addresses || [];
  const settings = settingsData?.settings;
  const zarinpalEnabled = settings?.zarinpal?.enabled !== false;
  const shippingCost = 0;

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (data: { address?: { _id: string } }) => {
      if (data?.address?._id) {
        setSelectedAddressId(data.address._id);
      }
      setShowNewAddress(false);
    },
  });

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: async (data: { order?: { _id: string } }) => {
      if (!data?.order?._id) return;
      clearCart();
      if (paymentMethod === 'zarinpal' && zarinpalEnabled) {
        try {
          const payData = await requestPayment(data.order._id);
          if (payData?.url) {
            window.location.href = payData.url;
            return;
          }
        } catch {
          // fall through to order detail
        }
      }
      router.push(`/orders/${data.order._id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'خطا در ثبت سفارش';
      setOrderError(msg);
    },
  });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const data = await validateCoupon(couponCode, totalPrice);
      setCouponDiscount(data.coupon?.discountAmount || 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'کد تخفیف نامعتبر است';
      setCouponError(msg);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (cartItems.length === 0) return;
    setOrderError('');

    const shippingAddr = selectedAddressId
      ? addresses.find((a: { _id: string }) => a._id === selectedAddressId)
      : null;

    if (!shippingAddr && !showNewAddress) {
      setOrderError('لطفاً یک آدرس تحویل انتخاب کنید');
      return;
    }

    orderMutation.mutate({
      items: cartItems.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
      })),
      shippingAddress: shippingAddr ? {
        fullName: user.name,
        phone: shippingAddr.phone,
        province: shippingAddr.province,
        city: shippingAddr.city,
        fullAddress: shippingAddr.fullAddress,
        postalCode: shippingAddr.postalCode,
      } : undefined,
      couponCode: couponDiscount > 0 ? couponCode : undefined,
      paymentMethod,
    });
  };

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveNewAddress = () => {
    createAddressMutation.mutate(newAddress);
  };

  const finalTotal = Math.max(0, totalPrice - couponDiscount + shippingCost);

  if (cartItems.length === 0 && !orderMutation.isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <SEO title="تسویه حساب" />
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-gray-500 text-lg mb-4">سبد خرید شما خالی است</p>
        <Link href="/products" className="text-primary hover:underline">مشاهده محصولات</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SEO title="تسویه حساب" />
      <h1 className="text-2xl font-bold mb-6">تسویه حساب</h1>

      {orderError && (
        <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl mb-4">{orderError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold mb-4">آدرس تحویل</h2>
            {addressesLoading ? (
              <div className="h-16 shimmer rounded-lg" />
            ) : addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr: { _id: string; title: string; province: string; city: string; fullAddress: string; postalCode: string; phone: string }) => (
                  <label key={addr._id} className={`block border rounded-xl p-4 cursor-pointer transition ${selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="address" value={addr._id} checked={selectedAddressId === addr._id}
                      onChange={(e) => setSelectedAddressId(e.target.value)} className="ml-2" />
                    <div className="text-sm mt-1">
                      <p className="font-medium">{addr.title}</p>
                      <p className="text-gray-500">{addr.province}، {addr.city}، {addr.fullAddress}</p>
                      <p className="text-gray-400">کد پستی: {addr.postalCode} | {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : null}

            <button onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-primary text-sm hover:underline mt-3 inline-block">
              {showNewAddress ? 'انصراف' : '+ افزودن آدرس جدید'}
            </button>

            {showNewAddress && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">عنوان</label>
                    <input type="text" name="title" value={newAddress.title} onChange={handleNewAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">موبایل</label>
                    <input type="tel" name="phone" value={newAddress.phone} onChange={handleNewAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">استان</label>
                    <input type="text" name="province" value={newAddress.province} onChange={handleNewAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">شهر</label>
                    <input type="text" name="city" value={newAddress.city} onChange={handleNewAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">آدرس کامل</label>
                  <textarea name="fullAddress" value={newAddress.fullAddress} onChange={handleNewAddressChange} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">کد پستی</label>
                  <input type="text" name="postalCode" value={newAddress.postalCode} onChange={handleNewAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <button onClick={handleSaveNewAddress} disabled={createAddressMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
                  ذخیره آدرس
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold mb-4">روش پرداخت</h2>
            <div className="space-y-3">
              {zarinpalEnabled && (
                <label className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${paymentMethod === 'zarinpal' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="zarinpal" checked={paymentMethod === 'zarinpal'}
                    onChange={(e) => setPaymentMethod(e.target.value)} />
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-sm">پرداخت آنلاین (زرین‌پال)</p>
                    <p className="text-xs text-gray-500">پرداخت امن با کلیه کارت‌های بانکی</p>
                  </div>
                </label>
              )}
              <label className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)} />
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p className="font-medium text-sm">پرداخت در محل</p>
                  <p className="text-xs text-gray-500">پرداخت هنگام دریافت سفارش</p>
                </div>
              </label>
              {settings?.cardToCard?.active && (
                <div>
                  <label className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${paymentMethod === 'card-to-card' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="card-to-card" checked={paymentMethod === 'card-to-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)} />
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div>
                      <p className="font-medium text-sm">کارت به کارت</p>
                      <p className="text-xs text-gray-500">{settings.cardToCard.bankName} - {settings.cardToCard.cardNumber}</p>
                    </div>
                  </label>
                  {paymentMethod === 'card-to-card' && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">
                        پس از ثبت سفارش، اطلاعات کارت به کارت و نحوه آپلود رسید پرداخت در صفحه سفارش نمایش داده می‌شود.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-20">
            <h2 className="font-bold mb-4">خلاصه سفارش</h2>
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{toPersianNumber(item.qty)} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="text-xs font-medium">{formatPrice(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>مبلغ کل</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-danger">
                  <span>تخفیف</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>هزینه ارسال</span>
                <span>{shippingCost === 0 ? 'رایگان' : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>مبلغ قابل پرداخت</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="کد تخفیف"
                  className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary" />
                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                  className="flex-shrink-0 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition disabled:opacity-50">
                  {couponLoading ? '...' : 'اعمال'}
                </button>
              </div>
              {couponError && <p className="text-xs text-danger mt-1">{couponError}</p>}
              {couponDiscount > 0 && <p className="text-xs text-success mt-1">کد تخفیف اعمال شد</p>}
            </div>

            <button onClick={handleSubmit} disabled={orderMutation.isPending}
              className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50 shadow-lg shadow-primary/25">
              {orderMutation.isPending ? 'در حال ثبت سفارش...' : 'ثبت سفارش'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
