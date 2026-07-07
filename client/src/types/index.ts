export interface IUser {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'user' | 'seller' | 'admin';
  username?: string;
  isActive: boolean;
  markupPercent: number;
  addresses: IAddress[];
  favorites: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAddress {
  _id?: string;
  title: string;
  province: string;
  city: string;
  fullAddress: string;
  postalCode: string;
  phone: string;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  masterPrice: number;
  stock: number;
  images: string[];
  specs: Record<string, string>;
  compatibleCars: ICar[];
  category: ICategory | string;
  brand?: string;
  rating: number;
  numReviews: number;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  cartPrice?: number;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string | null;
  isActive: boolean;
  order: number;
  productCount?: number;
}

export interface ICar {
  _id: string;
  brand: string;
  model: string;
  year?: number;
  engineType?: string;
  slug: string;
  isActive: boolean;
}

export interface IOrder {
  _id: string;
  user: IUser | string;
  items: IOrderItem[];
  totalAmount: number;
  discountAmount: number;
  coupon?: string;
  shippingCost: number;
  paymentMethod: 'zarinpal' | 'cod' | 'card-to-card' | 'seller';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentInfo?: {
    authority?: string;
    refId?: string;
    cardPan?: string;
    fee?: number;
    feeType?: string;
    transactionId?: string;
    receiptImage?: string;
    nonce?: string;
  };
  shippingAddress?: {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    fullAddress: string;
    postalCode: string;
  };
  type: 'customer' | 'seller';
  seller?: string;
  sellerStatus?: 'in_progress' | 'calling' | 'called' | 'accept' | 'sent' | 'cancelled';
  sellerNote?: string;
  trackingCode?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  product: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface IReview {
  _id: string;
  user: { _id: string; name: string };
  product: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface ISiteSettings {
  headerImage?: string;
  festival?: {
    active: boolean;
    title: string;
    subtitle: string;
    btnText: string;
    products: IProduct[];
    bgColor: string;
  };
  cardToCard?: {
    active: boolean;
    bankName: string;
    cardNumber: string;
    accountHolder: string;
    shaba: string;
  };
  zarinpal?: {
    enabled: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  products?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ProductFilters {
  search?: string;
  category?: string;
  car?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  stock: number;
}
