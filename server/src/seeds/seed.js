require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Category = require('../models/Category');
const Car = require('../models/Car');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Car.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
    console.log('Old data cleared');

    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@123456';
    const admin = await User.create({
      name: 'مدیر سایت',
      phone: '09120000000',
      email: 'admin@store.com',
      password: adminPassword,
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email}`);

    const seller = await User.create({
      name: 'فروشنده نمونه',
      phone: '09131111111',
      username: 'seller1',
      email: 'seller@store.com',
      password: 'Seller@123456',
      role: 'seller',
      markupPercent: 15,
    });
    console.log(`Seller created: ${seller.username}`);

    const customer = await User.create({
      name: 'کاربر نمونه',
      phone: '09132222222',
      email: 'user@store.com',
      password: 'User@123456',
      role: 'user',
    });
    console.log(`Customer created: ${customer.email}`);

    const categories = await Category.insertMany([
      { name: 'موتور و پیشرانه', slug: 'engine', description: 'قطعات موتور خودرو', order: 1 },
      { name: 'ترمز و کلاچ', slug: 'brake-clutch', description: 'قطعات ترمز و کلاچ', order: 2 },
      { name: 'تعلیق و فرمان', slug: 'suspension-steering', description: 'قطعات تعلیق و فرمان', order: 3 },
      { name: 'بدنه و ظاهری', slug: 'body-exterior', description: 'قطعات بدنه خودرو', order: 4 },
      { name: 'برق و الکترونیک', slug: 'electrical', description: 'قطعات برقی خودرو', order: 5 },
      { name: 'فیلتر و روغن', slug: 'filters-oil', description: 'لوازم مصرفی خودرو', order: 6 },
      { name: 'کولر و بخاری', slug: 'cooling-heating', description: 'سیستم تهویه خودرو', order: 7 },
      { name: 'اکسسوری', slug: 'accessories', description: 'لوازم جانبی خودرو', order: 8 },
    ]);
    console.log(`${categories.length} categories created`);

    const cars = await Car.insertMany([
      { brand: 'سایپا', model: 'پراید ۱۱۱', year: 1390, engineType: 'M13', slug: 'saipa-pride-111' },
      { brand: 'سایپا', model: 'پراید ۱۳۱', year: 1385, engineType: 'M13', slug: 'saipa-pride-131' },
      { brand: 'سایپا', model: 'تیبا', year: 1395, engineType: 'M15', slug: 'saipa-tiba' },
      { brand: 'سایپا', model: 'ساینا', year: 1396, engineType: 'M15', slug: 'saipa-saina' },
      { brand: 'ایران خودرو', model: 'پژو ۲۰۶ تیپ ۲', year: 1390, engineType: 'TU3', slug: 'ikco-peugeot-206-type2' },
      { brand: 'ایران خودرو', model: 'پژو ۲۰۶ تیپ ۵', year: 1395, engineType: 'TU5', slug: 'ikco-peugeot-206-type5' },
      { brand: 'ایران خودرو', model: 'پژو ۴۰۵', year: 1385, engineType: 'XU7', slug: 'ikco-peugeot-405' },
      { brand: 'ایران خودرو', model: 'پژو پارس', year: 1390, engineType: 'XU7', slug: 'ikco-peugeot-pars' },
      { brand: 'ایران خودرو', model: 'سمند', year: 1390, engineType: 'EF7', slug: 'ikco-samand' },
      { brand: 'ایران خودرو', model: 'دنا', year: 1395, engineType: 'EF7', slug: 'ikco-dena' },
      { brand: 'ایران خودرو', model: 'رانا', year: 1395, engineType: 'TU5', slug: 'ikco-rana' },
      { brand: 'مدیران خودرو', model: 'چینی', year: 1395, engineType: 'Unknown', slug: 'mvm-x220' },
      { brand: 'کرمان موتور', model: 'کیا', year: 1390, engineType: 'Unknown', slug: 'kerman-kia' },
    ]);
    console.log(`${cars.length} cars created`);

    const products = await Product.insertMany([
      {
        name: 'لنت ترمز جلو پراید',
        slug: 'brake-pad-pride-front',
        description: 'لنت ترمز جلو پراید با کیفیت بالا، مناسب برای پراید ۱۱۱ و ۱۳۱',
        price: 450000,
        discountPrice: 420000,
        stock: 50,
        images: [],
        specs: { 'برند': 'اطلس', 'جنس': 'سرامیکی', 'گارانتی': '۶ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id],
        category: categories[1]._id,
        brand: 'اطلس',
        featured: true,
      },
      {
        name: 'فیلتر روغن پراید',
        slug: 'oil-filter-pride',
        description: 'فیلتر روغن پراید اصلی، مناسب برای موتور M13',
        price: 85000,
        stock: 200,
        images: [],
        specs: { 'برند': 'بوش', 'مدل موتور': 'M13', 'گارانتی': '۱ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id],
        category: categories[5]._id,
        brand: 'بوش',
        featured: true,
      },
      {
        name: 'فیلتر هوا پژو ۲۰۶',
        slug: 'air-filter-peugeot-206',
        description: 'فیلتر هوای پژو ۲۰۶ با کیفیت عالی، افزایش راندمان موتور',
        price: 120000,
        stock: 150,
        images: [],
        specs: { 'برند': 'والئو', 'مناسب برای': '۲۰۶ تیپ ۲ و ۵', 'گارانتی': '۳ ماه' },
        compatibleCars: [cars[4]._id, cars[5]._id],
        category: categories[5]._id,
        brand: 'والئو',
      },
      {
        name: 'عقربه کیلومتر پراید',
        slug: 'speedometer-cable-pride',
        description: 'عقربه کیلومتر پراید، مناسب برای پراید ۱۱۱ و ۱۳۱',
        price: 35000,
        stock: 300,
        images: [],
        specs: { 'برند': 'ایساکو', 'کیفیت': 'اصل', 'گارانتی': '۱ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id],
        category: categories[4]._id,
        brand: 'ایساکو',
      },
      {
        name: 'دینام پژو ۴۰۵',
        slug: 'alternator-peugeot-405',
        description: 'دینام ۱۲ ولت پژو ۴۰۵، مناسب برای موتور XU7',
        price: 2800000,
        stock: 20,
        images: [],
        specs: { 'برند': 'بوش', 'ولتاژ': '۱۲ ولت', 'آمپر': '۷۰', 'گارانتی': '۱۲ ماه' },
        compatibleCars: [cars[6]._id],
        category: categories[4]._id,
        brand: 'بوش',
        featured: true,
      },
      {
        name: 'لنت ترمز عقب سمند',
        slug: 'brake-pad-samand-rear',
        description: 'لنت ترمز عقب سمند با کیفیت سرامیکی',
        price: 480000,
        discountPrice: 450000,
        stock: 40,
        images: [],
        specs: { 'برند': 'اطلس', 'جنس': 'سرامیکی', 'گارانتی': '۶ ماه' },
        compatibleCars: [cars[8]._id],
        category: categories[1]._id,
        brand: 'اطلس',
      },
      {
        name: 'فیلتر بنزین پراید',
        slug: 'fuel-filter-pride',
        description: 'فیلتر بنزین پراید، افزایش عمر انژکتور',
        price: 75000,
        stock: 180,
        images: [],
        specs: { 'برند': 'استاندارد', 'کیفیت': 'بالا', 'گارانتی': '۱ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id, cars[2]._id],
        category: categories[5]._id,
        brand: 'استاندارد',
      },
      {
        name: 'تسمه تایم پژو ۲۰۶',
        slug: 'timing-belt-peugeot-206',
        description: 'تسمه تایم پژو ۲۰۶ TU5، تعویض هر ۶۰ هزار کیلومتر',
        price: 185000,
        stock: 60,
        images: [],
        specs: { 'برند': 'دایکو', 'مدل موتور': 'TU5', 'گارانتی': '۱۲ ماه' },
        compatibleCars: [cars[5]._id],
        category: categories[0]._id,
        brand: 'دایکو',
        featured: true,
      },
      {
        name: 'باتری خودرو ۶۰ آمپر',
        slug: 'car-battery-60ah',
        description: 'باتری ۶۰ آمپر صبا باتری، مناسب برای اکثر خودروهای ایرانی',
        price: 3200000,
        stock: 15,
        images: [],
        specs: { 'برند': 'صبا باتری', 'ظرفیت': '۶۰ آمپر', 'گارانتی': '۱۸ ماه' },
        compatibleCars: [cars[0]._id, cars[4]._id, cars[6]._id, cars[8]._id],
        category: categories[4]._id,
        brand: 'صبا باتری',
      },
      {
        name: 'آینه بغل برقی پژو پارس',
        slug: 'side-mirror-peugeot-pars',
        description: 'آینه بغل برقی پژو پارس، مدل طرح جدید',
        price: 1200000,
        stock: 25,
        images: [],
        specs: { 'برند': 'ایساکو', 'نوع': 'برقی', 'جنس': 'پلاستیک ABS', 'گارانتی': '۶ ماه' },
        compatibleCars: [cars[7]._id],
        category: categories[3]._id,
        brand: 'ایساکو',
      },
      {
        name: 'ترمومتر آب پراید',
        slug: 'coolant-temp-sensor-pride',
        description: 'سنسور دمای آب پراید، تنظیم دمای موتور',
        price: 45000,
        stock: 100,
        images: [],
        specs: { 'برند': 'ایساکو', 'کیفیت': 'اصل', 'گارانتی': '۳ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id],
        category: categories[6]._id,
        brand: 'ایساکو',
      },
      {
        name: 'وایر شمع پژو ۲۰۶',
        slug: 'spark-plug-wire-peugeot-206',
        description: 'وایر شمع پژو ۲۰۶ TU5، افزایش شتاب خودرو',
        price: 320000,
        stock: 45,
        images: [],
        specs: { 'برند': 'والئو', 'مدل موتور': 'TU5', 'گارانتی': '۶ ماه' },
        compatibleCars: [cars[5]._id],
        category: categories[0]._id,
        brand: 'والئو',
      },
      {
        name: 'ضد یخ ۵ لیتری',
        slug: 'antifreeze-5l',
        description: 'ضد یخ مخصوص خودرو، ۵ لیتری',
        price: 350000,
        stock: 80,
        images: [],
        specs: { 'برند': 'هیتکس', 'حجم': '۵ لیتر', 'نوع': 'آبی' },
        compatibleCars: [cars[0]._id, cars[4]._id, cars[6]._id, cars[8]._id],
        category: categories[5]._id,
        brand: 'هیتکس',
      },
      {
        name: 'روغن موتور ۱۰W-۴۰',
        slug: 'engine-oil-10w40',
        description: 'روغن موتور ۱۰W-۴۰ مناسب برای خودروهای ایرانی',
        price: 420000,
        discountPrice: 390000,
        stock: 100,
        images: [],
        specs: { 'برند': 'اسپیدی', 'گرانروی': '10W40', 'حجم': '۴ لیتر', 'گارانتی': 'اصالت کالا' },
        compatibleCars: [cars[0]._id, cars[4]._id, cars[6]._id, cars[8]._id],
        category: categories[5]._id,
        brand: 'اسپیدی',
        featured: true,
      },
      {
        name: 'کمک فناجو پراید',
        slug: 'shock-absorber-pride',
        description: 'کمک فناجو جلو پراید، افزایش پایداری خودرو',
        price: 850000,
        discountPrice: 800000,
        stock: 30,
        images: [],
        specs: { 'برند': 'بوش', 'نوع': 'روغنی', 'گارانتی': '۱۲ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id],
        category: categories[2]._id,
        brand: 'بوش',
        featured: true,
      },
      {
        name: 'ماتریک طلایی سایپا',
        slug: 'gold-emblem-saipa',
        description: 'ماتریک طلایی سایپا، مناسب برای پراید و تیبا',
        price: 150000,
        stock: 200,
        images: [],
        specs: { 'جنس': 'پلاستیک ABS آبکاری', 'رنگ': 'طلایی', 'گارانتی': '۱ ماه' },
        compatibleCars: [cars[0]._id, cars[1]._id, cars[2]._id, cars[3]._id],
        category: categories[7]._id,
        brand: 'سایپا',
      },
      {
        name: 'چراغ جلو پراید',
        slug: 'headlight-pride',
        description: 'چراغ جلو پراید ۱۱۱، شفاف و با نوردهی بالا',
        price: 650000,
        stock: 35,
        images: [],
        specs: { 'برند': 'ایساکو', 'نوع': 'شیشه‌ای', 'گارانتی': '۶ ماه' },
        compatibleCars: [cars[0]._id],
        category: categories[3]._id,
        brand: 'ایساکو',
      },
      {
        name: 'صافی کولر پژو ۴۰۵',
        slug: 'ac-filter-peugeot-405',
        description: 'صافی کولر پژو ۴۰۵، افزایش خنک‌کنندگی',
        price: 95000,
        stock: 70,
        images: [],
        specs: { 'برند': 'استاندارد', 'کیفیت': 'بالا', 'گارانتی': '۱ ماه' },
        compatibleCars: [cars[6]._id],
        category: categories[6]._id,
        brand: 'استاندارد',
      },
      {
        name: 'فن رادیاتور سمند',
        slug: 'radiator-fan-samand',
        description: 'فن رادیاتور سمند EF7، خنک‌کننده موتور',
        price: 950000,
        stock: 20,
        images: [],
        specs: { 'برند': 'رادیاتور ایران', 'مدل موتور': 'EF7', 'گارانتی': '۱۲ ماه' },
        compatibleCars: [cars[8]._id],
        category: categories[6]._id,
        brand: 'رادیاتور ایران',
      },
      {
        name: 'پمپ روغن پژو ۲۰۶',
        slug: 'oil-pump-peugeot-206',
        description: 'پمپ روغن موتور پژو ۲۰۶ تیپ ۵',
        price: 1400000,
        stock: 15,
        images: [],
        specs: { 'برند': 'بوش', 'مدل موتور': 'TU5', 'گارانتی': '۱۲ ماه' },
        compatibleCars: [cars[5]._id],
        category: categories[0]._id,
        brand: 'بوش',
      },
    ]);
    console.log(`${products.length} products created`);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const midYear = new Date();
    midYear.setMonth(midYear.getMonth() + 6);

    const coupons = await Coupon.insertMany([
      { code: 'WELCOME10', type: 'percent', value: 10, minPurchase: 500000, maxDiscount: 200000, usageLimit: 100, expiresAt: nextYear },
      { code: 'FREE50', type: 'fixed', value: 50000, minPurchase: 300000, usageLimit: 50, expiresAt: nextYear },
      { code: 'SUMMER20', type: 'percent', value: 20, minPurchase: 1000000, maxDiscount: 500000, usageLimit: 30, expiresAt: midYear },
    ]);
    console.log(`${coupons.length} coupons created`);

    console.log('\n✅ Seed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
