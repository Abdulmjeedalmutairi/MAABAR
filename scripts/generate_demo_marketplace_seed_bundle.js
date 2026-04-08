const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'demo-marketplace-seed');

const SECTORS = [
  {
    slug: 'consumer-electronics',
    name: 'Consumer Electronics & Mobile Accessories',
    ar: 'الإلكترونيات الاستهلاكية وملحقات الجوال',
    appCategory: 'electronics',
    city: 'Shenzhen',
    supplier: {
      companyName: 'VoltBridge Consumer Tech Co., Ltd.',
      contactName: 'Lina Zhou',
      shortName: 'VoltBridge',
      speciality: 'Consumer Electronics & Mobile Accessories',
      businessType: 'Manufacturer / OEM / ODM',
      yearEstablished: 2014,
      yearsExperience: 11,
      minOrderValue: 1800,
      rating: 4.8,
      reviewsCount: 26,
      customizationSupport: 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait'],
      languages: ['English', 'Mandarin'],
      address: 'Bao’an Smart Device Industrial Park, Shenzhen, Guangdong, China',
      website: 'https://voltbridge-demo.example',
      tradeLink: 'https://trade.voltbridge-demo.example/storefront',
      description: 'Synthetic demo supplier focused on mobile accessories, desk electronics, and fast-moving retail SKUs for marketplace presentation only.',
    },
    products: [
      ['65W GaN Travel Charger', 'شاحن سفر GaN بقدرة 65 واط'],
      ['Magnetic Wireless Power Bank', 'باور بانك مغناطيسي لاسلكي'],
      ['USB-C 8-in-1 Docking Hub', 'محول USB-C متعدد المنافذ 8 في 1'],
      ['Portable 15.6" Monitor', 'شاشة محمولة 15.6 بوصة'],
      ['Bluetooth Call Earbuds', 'سماعات بلوتوث للمكالمات'],
      ['Dashboard Dual-Lens Camera', 'كاميرا سيارة بعدستين'],
      ['Tablet Stand with Cooling Base', 'حامل جهاز لوحي مع تبريد'],
      ['Mini Label Printer', 'طابعة ملصقات صغيرة'],
      ['Foldable Desk Lamp', 'مصباح مكتب قابل للطي'],
      ['POS Receipt Printer', 'طابعة إيصالات نقاط البيع'],
    ],
    requests: [
      {
        traderKey: 'riyadh-retail-group',
        titleEn: 'Need private-label fast chargers and power banks for retail launch',
        titleAr: 'مطلوب شواحن سريعة وباور بانك بعلامة خاصة لإطلاق تجزئة',
        quantity: '4,000 charger units + 2,500 power banks',
        budgetPerUnit: 13,
        paymentPlan: 30,
        sampleRequirement: 'preferred',
        description: 'Retail-focused sourcing batch for Riyadh electronics shelves. Clean packaging, Arabic manual insert, and stable carton packing required.',
      },
      {
        traderKey: 'jeddah-gadgets',
        titleEn: 'Looking for portable monitors for reseller channel',
        titleAr: 'نبحث عن شاشات محمولة لقناة إعادة البيع',
        quantity: '600 units',
        budgetPerUnit: 82,
        paymentPlan: 40,
        sampleRequirement: 'required',
        description: 'Need consistent panel quality, HDMI + USB-C support, and carton branding suitable for Saudi e-commerce resellers.',
      },
    ],
  },
  {
    slug: 'smart-home-security',
    name: 'Smart Home, Access Control & Security',
    ar: 'المنزل الذكي والتحكم بالدخول والحلول الأمنية',
    appCategory: 'electronics',
    city: 'Hangzhou',
    supplier: {
      companyName: 'HomeMesh Secure Systems Co., Ltd.',
      contactName: 'Amy Chen',
      shortName: 'HomeMesh',
      speciality: 'Smart Home, Access Control & Security',
      businessType: 'Manufacturer / Solution Integrator',
      yearEstablished: 2016,
      yearsExperience: 9,
      minOrderValue: 2500,
      rating: 4.7,
      reviewsCount: 19,
      customizationSupport: 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.',
      exportMarkets: ['Saudi Arabia', 'Bahrain', 'UAE'],
      languages: ['English', 'Mandarin'],
      address: 'Binjiang IoT Security Cluster, Hangzhou, Zhejiang, China',
      website: 'https://homemesh-demo.example',
      tradeLink: 'https://trade.homemesh-demo.example/security',
      description: 'Synthetic demo supplier for smart locks, cameras, sensors, and project-based access control bundles.',
    },
    products: [
      ['Wi-Fi Smart Door Lock', 'قفل باب ذكي عبر الواي فاي'],
      ['Video Doorbell Kit', 'طقم جرس باب بالفيديو'],
      ['Smart Plug Twin Pack', 'طقم مقابس ذكية مزدوج'],
      ['Indoor PTZ Camera', 'كاميرا داخلية متحركة PTZ'],
      ['Motion Sensor Alarm Kit', 'طقم إنذار بحساس حركة'],
      ['Curtain Motor Set', 'طقم محرك ستارة ذكي'],
      ['Scene Control Wall Switch', 'مفتاح تحكم بالمشاهد'],
      ['Water Leak Sensor', 'حساس تسرب مياه'],
      ['Indoor Intercom Panel', 'شاشة انتركوم داخلية'],
      ['Zigbee Gateway Hub', 'بوابة ربط Zigbee'],
    ],
    requests: [
      {
        traderKey: 'khobar-smart-living',
        titleEn: 'Villa project needs smart locks, doorbells, and indoor panels',
        titleAr: 'مشروع فلل يحتاج أقفال ذكية وأجراس باب وشاشات داخلية',
        quantity: '120 villa kits',
        budgetPerUnit: 165,
        paymentPlan: 30,
        sampleRequirement: 'required',
        description: 'Project batch for a gated compound in Eastern Province. Need app stability, Arabic quick-start cards, and replacement unit policy.',
      },
      {
        traderKey: 'riyadh-facility-buying',
        titleEn: 'Need water leak sensors and smart plugs for facilities maintenance inventory',
        titleAr: 'مطلوب حساسات تسرب ومقابس ذكية لمخزون صيانة المرافق',
        quantity: '3,000 mixed units',
        budgetPerUnit: 11,
        paymentPlan: 50,
        sampleRequirement: 'preferred',
        description: 'Looking for fast-moving maintenance items with stable carton labeling and ready replacement stock.',
      },
    ],
  },
  {
    slug: 'solar-energy-storage',
    name: 'Solar Energy, Inverters & Storage',
    ar: 'الطاقة الشمسية والمحولات وأنظمة التخزين',
    appCategory: 'electronics',
    city: 'Ningbo',
    supplier: {
      companyName: 'SunHarbor Energy Tech Co., Ltd.',
      contactName: 'Victor Lin',
      shortName: 'SunHarbor',
      speciality: 'Solar Energy, Inverters & Storage',
      businessType: 'Manufacturer / Assembly Plant',
      yearEstablished: 2012,
      yearsExperience: 13,
      minOrderValue: 4800,
      rating: 4.9,
      reviewsCount: 31,
      customizationSupport: 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.',
      exportMarkets: ['Saudi Arabia', 'Jordan', 'Egypt', 'UAE'],
      languages: ['English', 'Mandarin'],
      address: 'Beilun Renewable Power Zone, Ningbo, Zhejiang, China',
      website: 'https://sunharbor-demo.example',
      tradeLink: 'https://trade.sunharbor-demo.example/solar',
      description: 'Synthetic demo supplier for solar and backup energy products with strong catalog depth for industrial and residential sourcing screens.',
    },
    products: [
      ['Hybrid Solar Inverter 5kW', 'محول طاقة شمسي هجين 5 كيلوواط'],
      ['LiFePO4 Battery Rack 10kWh', 'بطارية LiFePO4 بسعة 10 كيلوواط'],
      ['Portable Power Station 1200W', 'محطة طاقة محمولة 1200 واط'],
      ['Foldable Solar Panel Kit', 'طقم ألواح شمسية قابلة للطي'],
      ['MPPT Charge Controller', 'منظم شحن MPPT'],
      ['Solar Street Light Set', 'طقم إنارة شارع بالطاقة الشمسية'],
      ['Smart Power Meter', 'عداد طاقة ذكي'],
      ['DC Combiner Box', 'صندوق تجميع DC'],
      ['Roof Mount Rail Set', 'طقم سكك تثبيت سقفية'],
      ['Home ESS Cabinet', 'خزانة تخزين طاقة منزلية'],
    ],
    requests: [
      {
        traderKey: 'qassim-green-supply',
        titleEn: 'Need hybrid inverters and battery racks for reseller inventory',
        titleAr: 'مطلوب محولات هجينة ورفوف بطاريات لمخزون موزع',
        quantity: '180 inverter sets',
        budgetPerUnit: 690,
        paymentPlan: 30,
        sampleRequirement: 'preferred',
        description: 'Distributor order for regional solar retail. Need warranty terms, serial traceability, and clean pallet readiness.',
      },
      {
        traderKey: 'jeddah-site-power',
        titleEn: 'Looking for portable power stations for field operations',
        titleAr: 'نبحث عن محطات طاقة محمولة للعمليات الميدانية',
        quantity: '420 units',
        budgetPerUnit: 220,
        paymentPlan: 40,
        sampleRequirement: 'required',
        description: 'Units will be used by service teams and pop-up events. Need robust carton protection and accessories pack.',
      },
    ],
  },
  {
    slug: 'building-materials-hardware',
    name: 'Building Materials, Fixtures & Hardware',
    ar: 'مواد البناء والتجهيزات والقطع المعدنية',
    appCategory: 'building',
    city: 'Foshan',
    supplier: {
      companyName: 'StoneAxis Building Supply Co., Ltd.',
      contactName: 'Mira Wu',
      shortName: 'StoneAxis',
      speciality: 'Building Materials, Fixtures & Hardware',
      businessType: 'Manufacturer / Export House',
      yearEstablished: 2011,
      yearsExperience: 14,
      minOrderValue: 5200,
      rating: 4.8,
      reviewsCount: 22,
      customizationSupport: 'Project color matching, showroom sample kits, and contractor carton labeling.',
      exportMarkets: ['Saudi Arabia', 'Qatar', 'Bahrain', 'Oman'],
      languages: ['English', 'Mandarin'],
      address: 'Nanhai Building Finishes District, Foshan, Guangdong, China',
      website: 'https://stoneaxis-demo.example',
      tradeLink: 'https://trade.stoneaxis-demo.example/materials',
      description: 'Synthetic demo supplier for contractor-grade finishes, sanitary hardware, and specification-led building products.',
    },
    products: [
      ['Porcelain Floor Tile Series', 'سلسلة بلاط أرضيات بورسلان'],
      ['Quartz Countertop Slab', 'لوح سطح كوارتز'],
      ['Aluminum Window Profile Set', 'طقم بروفايل نوافذ ألمنيوم'],
      ['Bathroom Mixer Faucet', 'خلاط مغسلة حمام'],
      ['Thermostatic Shower Set', 'طقم دش ثرموستاتي'],
      ['Stainless Kitchen Sink', 'حوض مطبخ ستانلس'],
      ['Architect Door Handle Set', 'طقم مقابض أبواب معماري'],
      ['SPC Flooring Panel', 'ألواح أرضيات SPC'],
      ['LED Mirror Cabinet', 'خزانة مرآة LED'],
      ['Decor Wall Panel', 'ألواح جدارية ديكورية'],
    ],
    requests: [
      {
        traderKey: 'riyadh-fitout-group',
        titleEn: 'Need contractor-grade faucets, sinks, and mirror cabinets for fit-out project',
        titleAr: 'مطلوب خلاطات وأحواض وخزائن مرايا لمشروع تشطيبات',
        quantity: 'Project mix for 180 apartments',
        budgetPerUnit: 58,
        paymentPlan: 30,
        sampleRequirement: 'required',
        description: 'Need matching finish quality, stable replacement policy, and export packing for staged delivery.',
      },
      {
        traderKey: 'madinah-build-mart',
        titleEn: 'Looking for SPC flooring and wall panel collections for showroom launch',
        titleAr: 'نبحث عن مجموعات أرضيات SPC وألواح جدارية لإطلاق معرض',
        quantity: '2 showroom containers',
        budgetPerUnit: 12,
        paymentPlan: 40,
        sampleRequirement: 'preferred',
        description: 'Mix should cover premium and mid-market display boards with Arabic catalog labels.',
      },
    ],
  },
  {
    slug: 'hospitality-furniture',
    name: 'Hospitality, Office & Residential Furniture',
    ar: 'أثاث الضيافة والمكاتب والسكن',
    appCategory: 'furniture',
    city: 'Foshan',
    supplier: {
      companyName: 'HarborNest Furnishings Co., Ltd.',
      contactName: 'Nora Liang',
      shortName: 'HarborNest',
      speciality: 'Hospitality, Office & Residential Furniture',
      businessType: 'Manufacturer / Project Supplier',
      yearEstablished: 2013,
      yearsExperience: 12,
      minOrderValue: 6500,
      rating: 4.7,
      reviewsCount: 18,
      customizationSupport: 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Kuwait'],
      languages: ['English', 'Mandarin'],
      address: 'Shunde Furniture Manufacturing Hub, Foshan, Guangdong, China',
      website: 'https://harbornest-demo.example',
      tradeLink: 'https://trade.harbornest-demo.example/furniture',
      description: 'Synthetic demo supplier for hospitality furniture, office fit-outs, and premium furnishing bundles.',
    },
    products: [
      ['Hotel Bed Base', 'قاعدة سرير فندقي'],
      ['Lobby Lounge Chair', 'كرسي لاونج للردهة'],
      ['Reception Sofa Set', 'طقم كنبة استقبال'],
      ['Solid Wood Dining Set', 'طقم طاولة طعام خشب صلب'],
      ['Bedside Table Unit', 'وحدة طاولة جانبية'],
      ['Outdoor Rattan Seating Set', 'طقم جلسة راتان خارجي'],
      ['Conference Meeting Table', 'طاولة اجتماعات'],
      ['Open Office Workstation', 'محطة عمل مكتبية'],
      ['Storage Display Cabinet', 'خزانة عرض وتخزين'],
      ['Accent Side Table', 'طاولة جانبية ديكورية'],
    ],
    requests: [
      {
        traderKey: 'jeddah-hospitality-procurement',
        titleEn: 'Need hotel room furniture package for boutique property',
        titleAr: 'مطلوب باكج أثاث غرف فندقية لفندق بوتيك',
        quantity: '96 room sets',
        budgetPerUnit: 540,
        paymentPlan: 30,
        sampleRequirement: 'required',
        description: 'Need bed bases, side tables, lounge chairs, and finish approval samples before production.',
      },
      {
        traderKey: 'riyadh-office-source',
        titleEn: 'Looking for office workstations and conference tables',
        titleAr: 'نبحث عن محطات عمل مكتبية وطاولات اجتماعات',
        quantity: 'One full office floor',
        budgetPerUnit: 230,
        paymentPlan: 40,
        sampleRequirement: 'preferred',
        description: 'Need modular layouts, cable management options, and quick sample swatches for approval.',
      },
    ],
  },
  {
    slug: 'packaging-printing',
    name: 'Packaging, Labels & Printing',
    ar: 'التغليف والملصقات والطباعة',
    appCategory: 'other',
    city: 'Qingdao',
    supplier: {
      companyName: 'PackFolio Print & Pack Co., Ltd.',
      contactName: 'Kevin Tao',
      shortName: 'PackFolio',
      speciality: 'Packaging, Labels & Printing',
      businessType: 'Manufacturer / Converter',
      yearEstablished: 2015,
      yearsExperience: 10,
      minOrderValue: 1400,
      rating: 4.8,
      reviewsCount: 24,
      customizationSupport: 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Jordan', 'Egypt'],
      languages: ['English', 'Mandarin'],
      address: 'West Coast Packaging Cluster, Qingdao, Shandong, China',
      website: 'https://packfolio-demo.example',
      tradeLink: 'https://trade.packfolio-demo.example/packaging',
      description: 'Synthetic demo supplier for retail packaging, corrugated shipping, and branded print assets.',
    },
    products: [
      ['Corrugated Shipping Carton', 'كرتون شحن مموج'],
      ['Custom Printed Mailer Box', 'علبة شحن مطبوعة مخصصة'],
      ['Stand-up Zipper Pouch', 'أكياس واقفة بسحاب'],
      ['Rigid Gift Box', 'علبة هدايا صلبة'],
      ['Thermal Label Roll', 'رول ملصقات حرارية'],
      ['Retail Hang Tag Set', 'طقم بطاقات تعليق'],
      ['Food Grade Paper Cup', 'كوب ورقي غذائي'],
      ['Foam Protection Insert', 'بطانة حماية فوم'],
      ['Barcode Sticker Sheet', 'ورقة ملصقات باركود'],
      ['Laminated Product Catalog', 'كتالوج منتج مغلف'],
    ],
    requests: [
      {
        traderKey: 'riyadh-beauty-house',
        titleEn: 'Need premium mailer boxes and barcode labels for cosmetics launch',
        titleAr: 'مطلوب علب شحن فاخرة وملصقات باركود لإطلاق مستحضرات تجميل',
        quantity: '18,000 mixed packaging units',
        budgetPerUnit: 0.95,
        paymentPlan: 50,
        sampleRequirement: 'required',
        description: 'Looking for shelf-ready premium packaging with Arabic ingredient sticker space and stable color matching.',
      },
      {
        traderKey: 'dammam-food-brand',
        titleEn: 'Looking for food-safe cups and takeout print packaging',
        titleAr: 'نبحث عن أكواب آمنة غذائياً وتغليف مطبوع للتيك أواي',
        quantity: '55,000 units',
        budgetPerUnit: 0.22,
        paymentPlan: 30,
        sampleRequirement: 'preferred',
        description: 'Need strong grease resistance, carton labeling, and fast replenishment readiness for food outlets.',
      },
    ],
  },
  {
    slug: 'textiles-apparel',
    name: 'Textiles, Uniforms & Apparel',
    ar: 'المنسوجات واليونيفورم والملابس',
    appCategory: 'clothing',
    city: 'Shaoxing',
    supplier: {
      companyName: 'LoomPeak Textile Works Co., Ltd.',
      contactName: 'Grace Xu',
      shortName: 'LoomPeak',
      speciality: 'Textiles, Uniforms & Apparel',
      businessType: 'Manufacturer / Fabric Mill',
      yearEstablished: 2010,
      yearsExperience: 15,
      minOrderValue: 2200,
      rating: 4.7,
      reviewsCount: 27,
      customizationSupport: 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait'],
      languages: ['English', 'Mandarin'],
      address: 'Keqiao Textile Market Zone, Shaoxing, Zhejiang, China',
      website: 'https://loompeak-demo.example',
      tradeLink: 'https://trade.loompeak-demo.example/textiles',
      description: 'Synthetic demo supplier for apparel basics, uniforms, and textile rolls for private-label and hospitality use cases.',
    },
    products: [
      ['Heavy Cotton T-Shirt', 'تيشيرت قطن ثقيل'],
      ['Abaya Fabric Roll', 'رول قماش عبايات'],
      ['Hotel Towel Set', 'طقم مناشف فندقية'],
      ['Performance Polo Shirt', 'قميص بولو عملي'],
      ['Workwear Utility Jacket', 'جاكيت عمل'],
      ['Fleece Hoodie', 'هودي فليس'],
      ['Denim Fabric Roll', 'رول قماش دنيم'],
      ['Linen Bedsheet Set', 'طقم مفارش كتان'],
      ['Baby Romper Collection', 'تشكيلة رومبر أطفال'],
      ['Uniform Shirt Program', 'برنامج قمصان يونيفورم'],
    ],
    requests: [
      {
        traderKey: 'riyadh-uniform-hub',
        titleEn: 'Need embroidered polo uniforms for service teams',
        titleAr: 'مطلوب قمصان بولو مطرزة لفرق الخدمة',
        quantity: '3,500 pieces across sizes',
        budgetPerUnit: 8.5,
        paymentPlan: 30,
        sampleRequirement: 'required',
        description: 'Need durable fabric, color consistency, and size-set samples before mass production.',
      },
      {
        traderKey: 'makkah-hotel-linen',
        titleEn: 'Looking for hospitality towels and bedsheet sets',
        titleAr: 'نبحث عن مناشف ومفارش ضيافة',
        quantity: '12,000 mixed linen units',
        budgetPerUnit: 6.8,
        paymentPlan: 40,
        sampleRequirement: 'preferred',
        description: 'Hotel supply batch with repeated replenishment potential. Need absorbency and wash-cycle specs.',
      },
    ],
  },
  {
    slug: 'beauty-packaging-care',
    name: 'Beauty Packaging & Personal Care Tools',
    ar: 'عبوات التجميل وأدوات العناية الشخصية',
    appCategory: 'other',
    city: 'Guangzhou',
    supplier: {
      companyName: 'PureForm Beauty Pack Co., Ltd.',
      contactName: 'Ivy Sun',
      shortName: 'PureForm',
      speciality: 'Beauty Packaging & Personal Care Tools',
      businessType: 'Manufacturer / Packaging Supplier',
      yearEstablished: 2017,
      yearsExperience: 8,
      minOrderValue: 1700,
      rating: 4.8,
      reviewsCount: 21,
      customizationSupport: 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Jordan'],
      languages: ['English', 'Mandarin'],
      address: 'Baiyun Beauty Packaging Belt, Guangzhou, Guangdong, China',
      website: 'https://pureform-demo.example',
      tradeLink: 'https://trade.pureform-demo.example/beauty',
      description: 'Synthetic demo supplier for cosmetic containers, salon accessories, and launch-ready beauty packaging.',
    },
    products: [
      ['Airless Pump Bottle', 'عبوة بمضخة بدون هواء'],
      ['Glass Serum Dropper Bottle', 'عبوة سيروم زجاجية بقطارة'],
      ['Makeup Brush Set', 'طقم فرش مكياج'],
      ['PET Cream Jar', 'عبوة كريم PET'],
      ['Lip Gloss Tube', 'أنبوب ملمع شفاه'],
      ['Travel Cosmetic Kit', 'طقم سفر تجميلي'],
      ['Trigger Spray Bottle', 'عبوة بخاخ زناد'],
      ['Foam Pump Bottle', 'عبوة مضخة رغوية'],
      ['Sachet Packaging Film', 'فيلم تغليف ساشيه'],
      ['Salon Towel Wrap', 'منشفة صالون قابلة للف'],
    ],
    requests: [
      {
        traderKey: 'riyadh-beauty-house',
        titleEn: 'Need serum bottles, jars, and lip gloss tubes for new beauty brand',
        titleAr: 'مطلوب عبوات سيروم وعلب وأنابيب ملمع لبراند تجميلي جديد',
        quantity: '28,000 mixed packaging units',
        budgetPerUnit: 0.68,
        paymentPlan: 40,
        sampleRequirement: 'required',
        description: 'Need premium finish, color consistency, and Arabic label application space for launch SKUs.',
      },
      {
        traderKey: 'jeddah-salon-source',
        titleEn: 'Looking for brush kits and salon towel wraps',
        titleAr: 'نبحث عن أطقم فرش ومنشفات صالون',
        quantity: '2,400 mixed units',
        budgetPerUnit: 4.2,
        paymentPlan: 50,
        sampleRequirement: 'preferred',
        description: 'Need salon-grade kits with retail-ready packs and repeatable replenishment lead times.',
      },
    ],
  },
  {
    slug: 'foodservice-kitchen',
    name: 'Food Service, Kitchen & HORECA Supplies',
    ar: 'مستلزمات الأغذية والمطابخ وقطاع الضيافة',
    appCategory: 'food',
    city: 'Xiamen',
    supplier: {
      companyName: 'KitchenRoute Supply Co., Ltd.',
      contactName: 'Daniel He',
      shortName: 'KitchenRoute',
      speciality: 'Food Service, Kitchen & HORECA Supplies',
      businessType: 'Manufacturer / Trading House',
      yearEstablished: 2014,
      yearsExperience: 11,
      minOrderValue: 2600,
      rating: 4.7,
      reviewsCount: 17,
      customizationSupport: 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Oman'],
      languages: ['English', 'Mandarin'],
      address: 'Tong’an Commercial Kitchen Cluster, Xiamen, Fujian, China',
      website: 'https://kitchenroute-demo.example',
      tradeLink: 'https://trade.kitchenroute-demo.example/horeca',
      description: 'Synthetic demo supplier for restaurants, cafés, delivery kitchens, and hotel buffet operations.',
    },
    products: [
      ['Gastronorm Food Pan Set', 'طقم أواني GN'],
      ['Stainless Chafing Dish', 'صحن تسخين ستانلس'],
      ['Insulated Delivery Box', 'صندوق توصيل معزول'],
      ['Disposable Cutlery Pack', 'طقم أدوات مائدة للاستعمال مرة واحدة'],
      ['Paper Food Container', 'علبة طعام ورقية'],
      ['Commercial Blender Jar', 'وعاء خلاط تجاري'],
      ['Vacuum Food Sealer', 'جهاز تفريغ وحفظ الطعام'],
      ['Chef Knife Set', 'طقم سكاكين شيف'],
      ['Silicone Baking Mat', 'حصيرة خبز سيليكون'],
      ['Cold Beverage Dispenser', 'موزع مشروبات باردة'],
    ],
    requests: [
      {
        traderKey: 'dammam-food-brand',
        titleEn: 'Need insulated delivery boxes and takeaway containers',
        titleAr: 'مطلوب صناديق توصيل معزولة وعلب تيك أواي',
        quantity: '7,500 mixed units',
        budgetPerUnit: 3.4,
        paymentPlan: 30,
        sampleRequirement: 'preferred',
        description: 'Looking for food-service durability, stack efficiency, and stable replenishment for delivery operations.',
      },
      {
        traderKey: 'makkah-hotel-linen',
        titleEn: 'Looking for buffet warmers and beverage dispensers for hospitality use',
        titleAr: 'نبحث عن سخانات بوفيه وموزعات مشروبات للاستخدام الفندقي',
        quantity: '260 units',
        budgetPerUnit: 47,
        paymentPlan: 40,
        sampleRequirement: 'required',
        description: 'Need polished stainless finish, replacement part readiness, and project packing by site.',
      },
    ],
  },
  {
    slug: 'industrial-tools-safety',
    name: 'Industrial Tools, Safety & Site Equipment',
    ar: 'الأدوات الصناعية والسلامة ومعدات المواقع',
    appCategory: 'building',
    city: 'Suzhou',
    supplier: {
      companyName: 'ForgeGrid Industrial Co., Ltd.',
      contactName: 'Ethan Qiao',
      shortName: 'ForgeGrid',
      speciality: 'Industrial Tools, Safety & Site Equipment',
      businessType: 'Manufacturer / Industrial Supplier',
      yearEstablished: 2009,
      yearsExperience: 16,
      minOrderValue: 3900,
      rating: 4.8,
      reviewsCount: 29,
      customizationSupport: 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.',
      exportMarkets: ['Saudi Arabia', 'UAE', 'Qatar', 'Iraq'],
      languages: ['English', 'Mandarin'],
      address: 'Kunshan Industrial Tooling District, Suzhou, Jiangsu, China',
      website: 'https://forgegrid-demo.example',
      tradeLink: 'https://trade.forgegrid-demo.example/tools',
      description: 'Synthetic demo supplier for contractor tools, PPE, and maintenance equipment with strong utility-focused merchandising.',
    },
    products: [
      ['Cordless Drill Kit', 'عدة دريل لاسلكي'],
      ['Auto-Darkening Welding Helmet', 'خوذة لحام ذاتية التعتيم'],
      ['Cut-Resistant Safety Gloves', 'قفازات سلامة مقاومة للقطع'],
      ['Heavy Duty Impact Wrench', 'مفتاح صدمات قوي'],
      ['Rolling Tool Cabinet', 'خزانة أدوات متحركة'],
      ['Cross-Line Laser Level', 'ميزان ليزر'],
      ['Air Hose Reel', 'بكرة خرطوم هواء'],
      ['Full Body Safety Harness', 'حزام أمان كامل للجسم'],
      ['Bench Grinder Unit', 'جلّاخة طاولة'],
      ['Scaffold Wheel Caster Set', 'طقم عجلات سقالة'],
    ],
    requests: [
      {
        traderKey: 'riyadh-facility-buying',
        titleEn: 'Need drill kits, gloves, and tool cabinets for maintenance teams',
        titleAr: 'مطلوب دريلات وقفازات وخزائن أدوات لفرق الصيانة',
        quantity: '1,200 mixed maintenance units',
        budgetPerUnit: 22,
        paymentPlan: 30,
        sampleRequirement: 'preferred',
        description: 'Need consistent industrial packaging, item labeling, and spare-part continuity for maintenance operations.',
      },
      {
        traderKey: 'madinah-build-mart',
        titleEn: 'Looking for laser levels and safety harnesses for contractor distribution',
        titleAr: 'نبحث عن موازين ليزر وأحزمة أمان لتوزيع المقاولين',
        quantity: '900 mixed units',
        budgetPerUnit: 34,
        paymentPlan: 40,
        sampleRequirement: 'required',
        description: 'Products should suit reseller display, with master carton markings and warranty detail cards.',
      },
    ],
  },
];

const TRADERS = [
  { key: 'riyadh-retail-group', fullName: 'Faisal Alqahtani', companyName: 'Riyadh Retail Group', city: 'Riyadh', phone: '+966550101001', focus: 'Electronics retail and branded launches' },
  { key: 'jeddah-gadgets', fullName: 'Huda Alharbi', companyName: 'Jeddah Gadgets Trading', city: 'Jeddah', phone: '+966550101002', focus: 'Consumer electronics distribution' },
  { key: 'khobar-smart-living', fullName: 'Mazen Alotaibi', companyName: 'Khobar Smart Living', city: 'Al Khobar', phone: '+966550101003', focus: 'Smart home and villa automation' },
  { key: 'riyadh-facility-buying', fullName: 'Reem Alenzi', companyName: 'Riyadh Facility Buying Co.', city: 'Riyadh', phone: '+966550101004', focus: 'Facility maintenance procurement' },
  { key: 'qassim-green-supply', fullName: 'Yousef Almutairi', companyName: 'Qassim Green Supply', city: 'Buraidah', phone: '+966550101005', focus: 'Solar and off-grid reseller stock' },
  { key: 'jeddah-site-power', fullName: 'Sara Alzahrani', companyName: 'Jeddah Site Power', city: 'Jeddah', phone: '+966550101006', focus: 'Field power and portable energy' },
  { key: 'riyadh-fitout-group', fullName: 'Abdullah Alshehri', companyName: 'Riyadh Fitout Group', city: 'Riyadh', phone: '+966550101007', focus: 'Interior fit-out and apartments' },
  { key: 'madinah-build-mart', fullName: 'Waleed Alghamdi', companyName: 'Madinah Build Mart', city: 'Madinah', phone: '+966550101008', focus: 'Showroom and contractor distribution' },
  { key: 'jeddah-hospitality-procurement', fullName: 'Lama Alghamdi', companyName: 'Jeddah Hospitality Procurement', city: 'Jeddah', phone: '+966550101009', focus: 'Hotels and serviced apartments' },
  { key: 'riyadh-office-source', fullName: 'Nawaf Alsubaie', companyName: 'Riyadh Office Source', city: 'Riyadh', phone: '+966550101010', focus: 'Corporate office furnishing' },
  { key: 'riyadh-beauty-house', fullName: 'Noura Alotaibi', companyName: 'Riyadh Beauty House', city: 'Riyadh', phone: '+966550101011', focus: 'Beauty retail and e-commerce' },
  { key: 'dammam-food-brand', fullName: 'Rakan Alrashidi', companyName: 'Dammam Food Brand House', city: 'Dammam', phone: '+966550101012', focus: 'Food packaging and cloud kitchens' },
  { key: 'riyadh-uniform-hub', fullName: 'Raghad Alharbi', companyName: 'Riyadh Uniform Hub', city: 'Riyadh', phone: '+966550101013', focus: 'Uniforms and workwear' },
  { key: 'makkah-hotel-linen', fullName: 'Khaled Binjaber', companyName: 'Makkah Hotel Linen Supply', city: 'Makkah', phone: '+966550101014', focus: 'Hospitality linen and food service' },
  { key: 'jeddah-salon-source', fullName: 'Abeer Alsahli', companyName: 'Jeddah Salon Source', city: 'Jeddah', phone: '+966550101015', focus: 'Salon consumables and accessories' },
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined || value === '') return 'null';
  return Number.isFinite(Number(value)) ? String(Number(value)) : 'null';
}

function sqlBoolean(value) {
  return value ? 'true' : 'false';
}

function sqlArray(values = []) {
  const cleaned = (Array.isArray(values) ? values : []).filter(Boolean);
  if (!cleaned.length) return 'array[]::text[]';
  return `array[${cleaned.map((item) => sqlString(item)).join(', ')}]::text[]`;
}

function picsum(seed, width = 1200, height = 900) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

function avatar(companyName) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=101828&color=F5F7FA&bold=true&size=256`;
}

function makeSupplierEmail(slug) {
  return `seed.supplier.${slug}@example.com`;
}

function makeTraderEmail(slug) {
  return `seed.trader.${slug}@example.com`;
}

function buildSupplierRecord(sector, index) {
  const email = makeSupplierEmail(sector.slug);
  const base = sector.supplier;
  const companySlug = slugify(base.shortName || base.companyName);
  const factoryImages = [1, 2, 3].map((n) => picsum(`maabar-${sector.slug}-factory-${n}`));

  return {
    seedKey: `supplier-${sector.slug}`,
    sectorSlug: sector.slug,
    sectorName: sector.name,
    email,
    role: 'supplier',
    signupProfile: {
      company_name: base.companyName,
      city: sector.city,
      country: 'China',
      trade_link: base.tradeLink,
      speciality: base.speciality,
      status: 'registered',
    },
    profilePatch: {
      company_name: base.companyName,
      full_name: base.contactName,
      role: 'supplier',
      status: 'verified',
      city: sector.city,
      country: 'China',
      whatsapp: `+8613800${String(index + 1).padStart(4, '0')}`,
      wechat: `${companySlug}_sales`,
      trade_link: base.tradeLink,
      trade_links: [base.tradeLink, `${base.website}/catalog`, `${base.website}/factory-tour`],
      speciality: base.speciality,
      min_order_value: base.minOrderValue,
      business_type: base.businessType,
      year_established: base.yearEstablished,
      years_experience: base.yearsExperience,
      languages: base.languages,
      customization_support: base.customizationSupport,
      export_markets: base.exportMarkets,
      company_address: base.address,
      company_website: base.website,
      company_description: base.description,
      bio_en: base.description,
      bio_ar: `مورد تجريبي آمن لعرض تجربة مَعبر في قطاع ${sector.ar}. لا يمثل شركة حقيقية أو وثائق حقيقية.`,
      bio_zh: `Demo-safe supplier profile for ${sector.name}.`,
      avatar_url: avatar(base.companyName),
      factory_images: factoryImages,
      factory_photo: factoryImages[0],
      preferred_display_currency: 'USD',
      rating: base.rating,
      reviews_count: base.reviewsCount,
      reg_number: `DEMO-${String(index + 1).padStart(4, '0')}-${sector.slug.toUpperCase().slice(0, 4)}`,
      num_employees: 35 + (index * 9),
      pay_method: 'swift',
      bank_name: `${base.shortName} Demo Bank`,
      swift_code: `DEMOCH${String(index + 1).padStart(4, '0')}`,
      payout_beneficiary_name: `${base.shortName} Demo Co.`,
      payout_account_number: `6222020000${String(index + 1).padStart(6, '0')}`,
      payout_branch_name: `${sector.city} Export Branch`,
      payout_iban: `CN00DEMO${String(index + 1).padStart(10, '0')}`,
    },
  };
}

function buildTraderRecord(trader, index) {
  return {
    seedKey: `trader-${trader.key}`,
    email: makeTraderEmail(trader.key),
    role: 'buyer',
    signupProfile: {
      full_name: trader.fullName,
      phone: trader.phone,
      city: trader.city,
      company_name: trader.companyName,
      status: 'active',
    },
    profilePatch: {
      full_name: trader.fullName,
      role: 'buyer',
      status: 'active',
      city: trader.city,
      country: 'Saudi Arabia',
      phone: trader.phone,
      company_name: trader.companyName,
      preferred_display_currency: 'SAR',
      avatar_url: avatar(trader.companyName),
      bio_en: `Synthetic demo buyer account for ${trader.focus}.`,
      bio_ar: `حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.`,
    },
  };
}

function buildProductRecord(sector, supplier, tuple, index) {
  const [nameEn, nameAr] = tuple;
  const slug = slugify(nameEn);
  const basePrice = Math.round((18 + (index * 7.5) + (sector.appCategory === 'furniture' ? 90 : 0) + (sector.slug.includes('solar') ? 140 : 0) + (sector.slug.includes('packaging') ? -12 : 0)) * 100) / 100;
  const moq = sector.appCategory === 'furniture'
    ? `${20 + (index * 5)} sets`
    : sector.appCategory === 'food'
      ? `${500 + (index * 150)} pcs`
      : sector.appCategory === 'building'
        ? `${100 + (index * 25)} pcs`
        : `${200 + (index * 80)} pcs`;
  const sampleAvailable = index % 2 === 0;
  const imageSet = [1, 2, 3].map((n) => picsum(`maabar-${sector.slug}-${slug}-${n}`));

  return {
    seedKey: `product-${sector.slug}-${slug}`,
    supplierEmail: supplier.email,
    sectorSlug: sector.slug,
    category: sector.appCategory,
    name_en: nameEn,
    name_ar: nameAr,
    name_zh: nameEn,
    price_from: basePrice,
    currency: 'USD',
    moq,
    desc_en: `${nameEn} from the synthetic ${supplier.profilePatch.company_name} demo catalog for ${sector.name}. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.`,
    desc_ar: `${nameAr} ضمن كتالوج تجريبي آمن من ${supplier.profilePatch.company_name} لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.`,
    image_url: imageSet[0],
    gallery_images: imageSet,
    video_url: null,
    spec_material: sector.appCategory === 'furniture' ? 'Wood veneer + powder-coated steel' : sector.appCategory === 'building' ? 'Ceramic / aluminum / stainless steel mix by SKU' : sector.appCategory === 'clothing' ? 'Cotton / blended textile' : 'ABS / steel / engineered components',
    spec_dimensions: sector.appCategory === 'furniture' ? 'Project sizes available on request' : sector.slug === 'packaging-printing' ? 'Custom dieline sizes available' : 'Standard export dimensions available',
    spec_unit_weight: sector.appCategory === 'solar-energy-storage' ? `${6 + index * 2} kg` : `${0.4 + index * 0.18} kg`,
    spec_color_options: index % 3 === 0 ? 'Black / White / Custom brand colors' : 'Standard export assortment',
    spec_packaging_details: 'Master carton export packing with inner protection and barcode-ready labels.',
    spec_customization: supplier.profilePatch.customization_support,
    spec_lead_time_days: 12 + index,
    sample_available: sampleAvailable,
    sample_price: sampleAvailable ? Math.max(8, Math.round(basePrice * 0.35)) : null,
    sample_shipping: sampleAvailable ? Math.max(5, Math.round(basePrice * 0.15)) : null,
    sample_max_qty: sampleAvailable ? 3 : null,
    sample_note: sampleAvailable ? 'Sample order available for pre-production approval.' : null,
    is_active: true,
  };
}

function buildRequestRecord(sector, traderMap, request, index) {
  const trader = traderMap.get(request.traderKey);
  if (!trader) throw new Error(`Unknown trader key: ${request.traderKey}`);
  return {
    seedKey: `request-${sector.slug}-${index + 1}`,
    buyerEmail: trader.email,
    sectorSlug: sector.slug,
    category: sector.appCategory,
    title_en: request.titleEn,
    title_ar: request.titleAr,
    title_zh: request.titleEn,
    quantity: request.quantity,
    description: request.description,
    budget_per_unit: request.budgetPerUnit,
    payment_plan: request.paymentPlan,
    sample_requirement: request.sampleRequirement,
    reference_image: picsum(`maabar-request-${sector.slug}-${index + 1}`),
    status: 'open',
  };
}

function createBundle() {
  const suppliers = SECTORS.map(buildSupplierRecord);
  const traders = TRADERS.map(buildTraderRecord);
  const traderMap = new Map(traders.map((item) => [item.seedKey.replace(/^trader-/, ''), item]));
  const products = [];
  const requests = [];

  SECTORS.forEach((sector, sectorIndex) => {
    const supplier = suppliers[sectorIndex];
    sector.products.forEach((tuple, productIndex) => {
      products.push(buildProductRecord(sector, supplier, tuple, productIndex));
    });
    sector.requests.forEach((request, requestIndex) => {
      requests.push(buildRequestRecord(sector, traderMap, request, requestIndex));
    });
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      purpose: 'Synthetic demo-safe marketplace seeding for MAABAR UX evaluation',
      warning: 'All companies, names, descriptions, IDs, and media are synthetic demo data. No real private documents or official records are included.',
      counts: {
        sectors: SECTORS.length,
        suppliers: suppliers.length,
        traders: traders.length,
        products: products.length,
        requests: requests.length,
      },
      coverageNote: 'The current app exposes 6 first-class category enums, so 10 commercial sectors are represented through speciality/profile/product narratives with category mapping where needed.',
      chosenApproach: 'Prepare synthetic account manifest + SQL upserts/inserts keyed by profile email, so demo accounts can be created through existing auth flow and enriched through existing Supabase tables.',
    },
    sectors: SECTORS.map((sector) => ({
      slug: sector.slug,
      name: sector.name,
      ar: sector.ar,
      appCategory: sector.appCategory,
    })),
    suppliers,
    traders,
    products,
    requests,
  };
}

function buildSql(bundle) {
  const lines = [];
  lines.push('-- Synthetic demo-safe MAABAR marketplace seed');
  lines.push('-- IMPORTANT: this file assumes demo auth accounts already exist in public.profiles with the emails listed in account-manifest.json.');
  lines.push('-- It intentionally does not create auth.users or upload private documents.');
  lines.push('begin;');
  lines.push('');

  bundle.suppliers.forEach((supplier) => {
    const p = supplier.profilePatch;
    lines.push(`-- Supplier profile: ${p.company_name}`);
    lines.push(`update public.profiles set`);
    lines.push(`  full_name = ${sqlString(p.full_name)},`);
    lines.push(`  role = 'supplier',`);
    lines.push(`  status = 'verified',`);
    lines.push(`  company_name = ${sqlString(p.company_name)},`);
    lines.push(`  city = ${sqlString(p.city)},`);
    lines.push(`  country = ${sqlString(p.country)},`);
    lines.push(`  whatsapp = ${sqlString(p.whatsapp)},`);
    lines.push(`  wechat = ${sqlString(p.wechat)},`);
    lines.push(`  trade_link = ${sqlString(p.trade_link)},`);
    lines.push(`  trade_links = ${sqlArray(p.trade_links)},`);
    lines.push(`  speciality = ${sqlString(p.speciality)},`);
    lines.push(`  min_order_value = ${sqlNumber(p.min_order_value)},`);
    lines.push(`  business_type = ${sqlString(p.business_type)},`);
    lines.push(`  year_established = ${sqlNumber(p.year_established)},`);
    lines.push(`  years_experience = ${sqlNumber(p.years_experience)},`);
    lines.push(`  languages = ${sqlArray(p.languages)},`);
    lines.push(`  customization_support = ${sqlString(p.customization_support)},`);
    lines.push(`  export_markets = ${sqlArray(p.export_markets)},`);
    lines.push(`  company_address = ${sqlString(p.company_address)},`);
    lines.push(`  company_website = ${sqlString(p.company_website)},`);
    lines.push(`  company_description = ${sqlString(p.company_description)},`);
    lines.push(`  bio_en = ${sqlString(p.bio_en)},`);
    lines.push(`  bio_ar = ${sqlString(p.bio_ar)},`);
    lines.push(`  bio_zh = ${sqlString(p.bio_zh)},`);
    lines.push(`  avatar_url = ${sqlString(p.avatar_url)},`);
    lines.push(`  factory_images = ${sqlArray(p.factory_images)},`);
    lines.push(`  factory_photo = ${sqlString(p.factory_photo)},`);
    lines.push(`  preferred_display_currency = 'USD',`);
    lines.push(`  rating = ${sqlNumber(p.rating)},`);
    lines.push(`  reviews_count = ${sqlNumber(p.reviews_count)},`);
    lines.push(`  reg_number = ${sqlString(p.reg_number)},`);
    lines.push(`  num_employees = ${sqlNumber(p.num_employees)},`);
    lines.push(`  pay_method = ${sqlString(p.pay_method)},`);
    lines.push(`  bank_name = ${sqlString(p.bank_name)},`);
    lines.push(`  swift_code = ${sqlString(p.swift_code)},`);
    lines.push(`  payout_beneficiary_name = ${sqlString(p.payout_beneficiary_name)},`);
    lines.push(`  payout_account_number = ${sqlString(p.payout_account_number)},`);
    lines.push(`  payout_branch_name = ${sqlString(p.payout_branch_name)},`);
    lines.push(`  payout_iban = ${sqlString(p.payout_iban)}`);
    lines.push(`where email = ${sqlString(supplier.email)};`);
    lines.push('');
  });

  bundle.traders.forEach((trader) => {
    const p = trader.profilePatch;
    lines.push(`-- Trader profile: ${p.company_name}`);
    lines.push(`update public.profiles set`);
    lines.push(`  full_name = ${sqlString(p.full_name)},`);
    lines.push(`  role = 'buyer',`);
    lines.push(`  status = 'active',`);
    lines.push(`  city = ${sqlString(p.city)},`);
    lines.push(`  country = ${sqlString(p.country)},`);
    lines.push(`  phone = ${sqlString(p.phone)},`);
    lines.push(`  company_name = ${sqlString(p.company_name)},`);
    lines.push(`  preferred_display_currency = 'SAR',`);
    lines.push(`  avatar_url = ${sqlString(p.avatar_url)},`);
    lines.push(`  bio_en = ${sqlString(p.bio_en)},`);
    lines.push(`  bio_ar = ${sqlString(p.bio_ar)}`);
    lines.push(`where email = ${sqlString(trader.email)};`);
    lines.push('');
  });

  bundle.products.forEach((product) => {
    lines.push(`insert into public.products (`);
    lines.push(`  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active`);
    lines.push(`)`);
    lines.push(`select`);
    lines.push(`  p.id, ${sqlString(product.name_ar)}, ${sqlString(product.name_en)}, ${sqlString(product.name_zh)}, ${sqlNumber(product.price_from)}, ${sqlString(product.currency)}, ${sqlString(product.category)}, ${sqlString(product.moq)}, ${sqlString(product.desc_en)}, ${sqlString(product.desc_ar)}, ${sqlString(product.image_url)}, ${sqlArray(product.gallery_images)}, ${sqlString(product.video_url)}, ${sqlString(product.spec_material)}, ${sqlString(product.spec_dimensions)}, ${sqlString(product.spec_unit_weight)}, ${sqlString(product.spec_color_options)}, ${sqlString(product.spec_packaging_details)}, ${sqlString(product.spec_customization)}, ${sqlNumber(product.spec_lead_time_days)}, ${sqlBoolean(product.sample_available)}, ${sqlNumber(product.sample_price)}, ${sqlNumber(product.sample_shipping)}, ${sqlNumber(product.sample_max_qty)}, ${sqlString(product.sample_note)}, true`);
    lines.push(`from public.profiles p`);
    lines.push(`where p.email = ${sqlString(product.supplierEmail)}`);
    lines.push(`  and not exists (`);
    lines.push(`    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower(${sqlString(product.name_en)})`);
    lines.push(`  );`);
    lines.push('');
  });

  bundle.requests.forEach((request) => {
    lines.push(`insert into public.requests (`);
    lines.push(`  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image`);
    lines.push(`)`);
    lines.push(`select`);
    lines.push(`  p.id, ${sqlString(request.title_ar)}, ${sqlString(request.title_en)}, ${sqlString(request.title_zh)}, ${sqlString(request.quantity)}, ${sqlString(request.description)}, ${sqlString(request.category)}, 'open', ${sqlNumber(request.budget_per_unit)}, ${sqlNumber(request.payment_plan)}, ${sqlString(request.sample_requirement)}, ${sqlString(request.reference_image)}`);
    lines.push(`from public.profiles p`);
    lines.push(`where p.email = ${sqlString(request.buyerEmail)}`);
    lines.push(`  and not exists (`);
    lines.push(`    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower(${sqlString(request.title_en)}) and coalesce(existing.quantity, '') = ${sqlString(request.quantity)}`);
    lines.push(`  );`);
    lines.push('');
  });

  lines.push('commit;');
  lines.push('');
  return lines.join('\n');
}

function buildPlanMarkdown(bundle) {
  const counts = bundle.meta.counts;
  const sectorLines = bundle.sectors
    .map((sector) => `- ${sector.name} (${sector.appCategory})`)
    .join('\n');

  return [
    '# Demo marketplace seeding plan',
    '',
    '> Synthetic demo-safe data only. No real company records, licenses, or private documents.',
    '',
    '## Chosen approach',
    '',
    'Use the mechanisms that already exist in this repo/runtime instead of inventing a new backend path:',
    '',
    '1. **Existing auth/profile flow** creates the user shell.',
    '2. **Existing Supabase tables** (`profiles`, `products`, `requests`) hold the marketplace-facing data.',
    '3. This package prepares:',
    '   - account manifest for demo suppliers/traders',
    '   - rich profile patch data',
    '   - import-ready SQL that updates profiles by **email** and inserts products/requests idempotently',
    '',
    '## Why this approach',
    '',
    '- `src/pages/AdminSeed.jsx` only supports very small AI-driven inserts for requests/products. It is not a real bulk marketplace seeder and cannot create the supplier/trader account base.',
    '- Current repo already depends on Supabase tables and real auth flows, so the safest implementation is to prepare deterministic synthetic data for those exact tables.',
    '',
    '## Dataset created',
    '',
    `- Sectors: **${counts.sectors}**`,
    `- Suppliers: **${counts.suppliers}**`,
    `- Traders: **${counts.traders}**`,
    `- Products: **${counts.products}** (**10 per supplier**)`,
    `- Requests: **${counts.requests}**`,
    '',
    '## Sector coverage',
    '',
    sectorLines,
    '',
    '## Important constraint discovered',
    '',
    'The current app exposes only **6 first-class product/request categories** in UI filters (`electronics`, `furniture`, `clothing`, `building`, `food`, `other`).',
    '',
    'So this seed covers **10 commercial sectors**, but some sectors are mapped into the nearest existing app category while preserving full sector identity through:',
    '- supplier `speciality`',
    '- company descriptions',
    '- product naming/specs',
    '- request titles/descriptions',
    '',
    '## Prepared files',
    '',
    '- `account-manifest.json`',
    '- `demo-marketplace-seed.bundle.json`',
    '- `demo-marketplace-seed.sql`',
    '',
    '## Execution notes / blockers',
    '',
    '### Ready now',
    '- Rich synthetic dataset is prepared and deterministic.',
    '- SQL is import-ready **once matching demo auth accounts exist in `public.profiles`**.',
    '',
    '### Blockers before safe full execution',
    '- There is no verified in-repo bulk seed pipeline for creating **auth users** at scale.',
    '- Production auth currently uses real email confirmation, so automated public sign-up seeding is not safe to run blindly from this subagent.',
    '- Private supplier verification documents are intentionally **not** generated or uploaded. That would require a separate safe placeholder strategy and private storage handling.',
    '',
    '## Recommended next execution step',
    '',
    '1. Create the demo auth accounts through a controlled admin-safe path.',
    '2. Run `demo-marketplace-seed.sql` in Supabase SQL editor or equivalent approved admin path.',
    '3. Spot-check public pages: suppliers, products, product detail, supplier detail, requests.',
    '',
  ].join('\n');
}

function buildAccountManifest(bundle) {
  return {
    generatedAt: bundle.meta.generatedAt,
    note: 'Synthetic demo-only account list to be created via existing auth flow before applying the SQL seed.',
    suppliers: bundle.suppliers.map((supplier) => ({
      seedKey: supplier.seedKey,
      email: supplier.email,
      role: supplier.role,
      signupProfile: supplier.signupProfile,
      company_name: supplier.profilePatch.company_name,
      speciality: supplier.profilePatch.speciality,
      city: supplier.profilePatch.city,
      country: supplier.profilePatch.country,
      trade_link: supplier.profilePatch.trade_link,
    })),
    traders: bundle.traders.map((trader) => ({
      seedKey: trader.seedKey,
      email: trader.email,
      role: trader.role,
      signupProfile: trader.signupProfile,
      full_name: trader.profilePatch.full_name,
      company_name: trader.profilePatch.company_name,
      city: trader.profilePatch.city,
      phone: trader.profilePatch.phone,
    })),
  };
}

function main() {
  const bundle = createBundle();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'demo-marketplace-seed.bundle.json'), JSON.stringify(bundle, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'demo-marketplace-seed.sql'), buildSql(bundle));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'account-manifest.json'), JSON.stringify(buildAccountManifest(bundle), null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), buildPlanMarkdown(bundle));
  console.log(`Generated demo marketplace seed bundle in ${OUTPUT_DIR}`);
}

main();
