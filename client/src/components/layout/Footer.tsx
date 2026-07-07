import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">فروشگاه قطعات یدکی خودرو</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              عرضه کننده انواع قطعات یدکی خودروهای ایرانی و خارجی با بهترین کیفیت و کمترین قیمت
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-3">دسترسی سریع</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition">خانه</Link></li>
              <li><Link href="/products" className="hover:text-white transition">محصولات</Link></li>
              <li><Link href="/categories" className="hover:text-white transition">دسته‌بندی‌ها</Link></li>
              <li><Link href="/about" className="hover:text-white transition">درباره ما</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-3">دسته‌بندی‌ها</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/products?category=engine" className="hover:text-white transition">موتور و پیشرانه</Link></li>
              <li><Link href="/products?category=brake-clutch" className="hover:text-white transition">ترمز و کلاچ</Link></li>
              <li><Link href="/products?category=suspension-steering" className="hover:text-white transition">تعلیق و فرمان</Link></li>
              <li><Link href="/products?category=electrical" className="hover:text-white transition">برق و الکترونیک</Link></li>
              <li><Link href="/products?category=accessories" className="hover:text-white transition">اکسسوری</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-3">اطلاعات تماس</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</li>
              <li>موبایل: ۰۹۱۲۱۲۳۴۵۶۷</li>
              <li>ایمیل: info@carparts.ir</li>
              <li>آدرس: تهران، خیابان آزادی</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>کلیه حقوق مادی و معنوی این سایت محفوظ است &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
