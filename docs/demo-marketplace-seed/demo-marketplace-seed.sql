-- Synthetic demo-safe MAABAR marketplace seed
-- IMPORTANT: this file assumes demo auth accounts already exist in public.profiles with the emails listed in account-manifest.json.
-- It intentionally does not create auth.users or upload private documents.
begin;
select set_config('request.jwt.claim.role', 'service_role', true);

-- Supplier profile: VoltBridge Consumer Tech Co., Ltd.
update public.profiles set
  full_name = 'Lina Zhou',
  role = 'supplier',
  status = 'verified',
  company_name = 'VoltBridge Consumer Tech Co., Ltd.',
  city = 'Shenzhen',
  country = 'China',
  whatsapp = '+86138000001',
  wechat = 'voltbridge_sales',
  trade_link = 'https://trade.voltbridge-demo.example/storefront',
  trade_links = array['https://trade.voltbridge-demo.example/storefront', 'https://voltbridge-demo.example/catalog', 'https://voltbridge-demo.example/factory-tour']::text[],
  speciality = 'Consumer Electronics & Mobile Accessories',
  min_order_value = 1800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2014,
  years_experience = 11,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Bao’an Smart Device Industrial Park, Shenzhen, Guangdong, China',
  company_website = 'https://voltbridge-demo.example',
  company_description = 'Synthetic demo supplier focused on mobile accessories, desk electronics, and fast-moving retail SKUs for marketplace presentation only.',
  bio_en = 'Synthetic demo supplier focused on mobile accessories, desk electronics, and fast-moving retail SKUs for marketplace presentation only.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع الإلكترونيات الاستهلاكية وملحقات الجوال. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Consumer Electronics & Mobile Accessories.',
  avatar_url = 'https://ui-avatars.com/api/?name=VoltBridge%20Consumer%20Tech%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-consumer-electronics-factory-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-factory-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-consumer-electronics-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.8,
  reviews_count = 26,
  reg_number = 'DEMO-0001-CONS',
  num_employees = 35,
  pay_method = 'swift',
  bank_name = 'VoltBridge Demo Bank',
  swift_code = 'DEMOCH0001',
  payout_beneficiary_name = 'VoltBridge Demo Co.',
  payout_account_number = '6222020000000001',
  payout_branch_name = 'Shenzhen Export Branch',
  payout_iban = 'CN00DEMO0000000001'
where email = 'seed.supplier.consumer-electronics@example.com';

-- Supplier profile: HomeMesh Secure Systems Co., Ltd.
update public.profiles set
  full_name = 'Amy Chen',
  role = 'supplier',
  status = 'verified',
  company_name = 'HomeMesh Secure Systems Co., Ltd.',
  city = 'Hangzhou',
  country = 'China',
  whatsapp = '+86138000002',
  wechat = 'homemesh_sales',
  trade_link = 'https://trade.homemesh-demo.example/security',
  trade_links = array['https://trade.homemesh-demo.example/security', 'https://homemesh-demo.example/catalog', 'https://homemesh-demo.example/factory-tour']::text[],
  speciality = 'Smart Home, Access Control & Security',
  min_order_value = 2500,
  business_type = 'Manufacturer / Solution Integrator',
  year_established = 2016,
  years_experience = 9,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.',
  export_markets = array['Saudi Arabia', 'Bahrain', 'UAE']::text[],
  company_address = 'Binjiang IoT Security Cluster, Hangzhou, Zhejiang, China',
  company_website = 'https://homemesh-demo.example',
  company_description = 'Synthetic demo supplier for smart locks, cameras, sensors, and project-based access control bundles.',
  bio_en = 'Synthetic demo supplier for smart locks, cameras, sensors, and project-based access control bundles.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع المنزل الذكي والتحكم بالدخول والحلول الأمنية. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Smart Home, Access Control & Security.',
  avatar_url = 'https://ui-avatars.com/api/?name=HomeMesh%20Secure%20Systems%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-smart-home-security-factory-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-factory-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-smart-home-security-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.7,
  reviews_count = 19,
  reg_number = 'DEMO-0002-SMAR',
  num_employees = 44,
  pay_method = 'swift',
  bank_name = 'HomeMesh Demo Bank',
  swift_code = 'DEMOCH0002',
  payout_beneficiary_name = 'HomeMesh Demo Co.',
  payout_account_number = '6222020000000002',
  payout_branch_name = 'Hangzhou Export Branch',
  payout_iban = 'CN00DEMO0000000002'
where email = 'seed.supplier.smart-home-security@example.com';

-- Supplier profile: SunHarbor Energy Tech Co., Ltd.
update public.profiles set
  full_name = 'Victor Lin',
  role = 'supplier',
  status = 'verified',
  company_name = 'SunHarbor Energy Tech Co., Ltd.',
  city = 'Ningbo',
  country = 'China',
  whatsapp = '+86138000003',
  wechat = 'sunharbor_sales',
  trade_link = 'https://trade.sunharbor-demo.example/solar',
  trade_links = array['https://trade.sunharbor-demo.example/solar', 'https://sunharbor-demo.example/catalog', 'https://sunharbor-demo.example/factory-tour']::text[],
  speciality = 'Solar Energy, Inverters & Storage',
  min_order_value = 4800,
  business_type = 'Manufacturer / Assembly Plant',
  year_established = 2012,
  years_experience = 13,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.',
  export_markets = array['Saudi Arabia', 'Jordan', 'Egypt', 'UAE']::text[],
  company_address = 'Beilun Renewable Power Zone, Ningbo, Zhejiang, China',
  company_website = 'https://sunharbor-demo.example',
  company_description = 'Synthetic demo supplier for solar and backup energy products with strong catalog depth for industrial and residential sourcing screens.',
  bio_en = 'Synthetic demo supplier for solar and backup energy products with strong catalog depth for industrial and residential sourcing screens.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع الطاقة الشمسية والمحولات وأنظمة التخزين. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Solar Energy, Inverters & Storage.',
  avatar_url = 'https://ui-avatars.com/api/?name=SunHarbor%20Energy%20Tech%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-solar-energy-storage-factory-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-factory-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-solar-energy-storage-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.9,
  reviews_count = 31,
  reg_number = 'DEMO-0003-SOLA',
  num_employees = 53,
  pay_method = 'swift',
  bank_name = 'SunHarbor Demo Bank',
  swift_code = 'DEMOCH0003',
  payout_beneficiary_name = 'SunHarbor Demo Co.',
  payout_account_number = '6222020000000003',
  payout_branch_name = 'Ningbo Export Branch',
  payout_iban = 'CN00DEMO0000000003'
where email = 'seed.supplier.solar-energy-storage@example.com';

-- Supplier profile: StoneAxis Building Supply Co., Ltd.
update public.profiles set
  full_name = 'Mira Wu',
  role = 'supplier',
  status = 'verified',
  company_name = 'StoneAxis Building Supply Co., Ltd.',
  city = 'Foshan',
  country = 'China',
  whatsapp = '+86138000004',
  wechat = 'stoneaxis_sales',
  trade_link = 'https://trade.stoneaxis-demo.example/materials',
  trade_links = array['https://trade.stoneaxis-demo.example/materials', 'https://stoneaxis-demo.example/catalog', 'https://stoneaxis-demo.example/factory-tour']::text[],
  speciality = 'Building Materials, Fixtures & Hardware',
  min_order_value = 5200,
  business_type = 'Manufacturer / Export House',
  year_established = 2011,
  years_experience = 14,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Project color matching, showroom sample kits, and contractor carton labeling.',
  export_markets = array['Saudi Arabia', 'Qatar', 'Bahrain', 'Oman']::text[],
  company_address = 'Nanhai Building Finishes District, Foshan, Guangdong, China',
  company_website = 'https://stoneaxis-demo.example',
  company_description = 'Synthetic demo supplier for contractor-grade finishes, sanitary hardware, and specification-led building products.',
  bio_en = 'Synthetic demo supplier for contractor-grade finishes, sanitary hardware, and specification-led building products.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع مواد البناء والتجهيزات والقطع المعدنية. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Building Materials, Fixtures & Hardware.',
  avatar_url = 'https://ui-avatars.com/api/?name=StoneAxis%20Building%20Supply%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-building-materials-hardware-factory-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-factory-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-building-materials-hardware-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.8,
  reviews_count = 22,
  reg_number = 'DEMO-0004-BUIL',
  num_employees = 62,
  pay_method = 'swift',
  bank_name = 'StoneAxis Demo Bank',
  swift_code = 'DEMOCH0004',
  payout_beneficiary_name = 'StoneAxis Demo Co.',
  payout_account_number = '6222020000000004',
  payout_branch_name = 'Foshan Export Branch',
  payout_iban = 'CN00DEMO0000000004'
where email = 'seed.supplier.building-materials-hardware@example.com';

-- Supplier profile: HarborNest Furnishings Co., Ltd.
update public.profiles set
  full_name = 'Nora Liang',
  role = 'supplier',
  status = 'verified',
  company_name = 'HarborNest Furnishings Co., Ltd.',
  city = 'Foshan',
  country = 'China',
  whatsapp = '+86138000005',
  wechat = 'harbornest_sales',
  trade_link = 'https://trade.harbornest-demo.example/furniture',
  trade_links = array['https://trade.harbornest-demo.example/furniture', 'https://harbornest-demo.example/catalog', 'https://harbornest-demo.example/factory-tour']::text[],
  speciality = 'Hospitality, Office & Residential Furniture',
  min_order_value = 6500,
  business_type = 'Manufacturer / Project Supplier',
  year_established = 2013,
  years_experience = 12,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.',
  export_markets = array['Saudi Arabia', 'UAE', 'Kuwait']::text[],
  company_address = 'Shunde Furniture Manufacturing Hub, Foshan, Guangdong, China',
  company_website = 'https://harbornest-demo.example',
  company_description = 'Synthetic demo supplier for hospitality furniture, office fit-outs, and premium furnishing bundles.',
  bio_en = 'Synthetic demo supplier for hospitality furniture, office fit-outs, and premium furnishing bundles.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع أثاث الضيافة والمكاتب والسكن. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Hospitality, Office & Residential Furniture.',
  avatar_url = 'https://ui-avatars.com/api/?name=HarborNest%20Furnishings%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-hospitality-furniture-factory-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-factory-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-hospitality-furniture-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.7,
  reviews_count = 18,
  reg_number = 'DEMO-0005-HOSP',
  num_employees = 71,
  pay_method = 'swift',
  bank_name = 'HarborNest Demo Bank',
  swift_code = 'DEMOCH0005',
  payout_beneficiary_name = 'HarborNest Demo Co.',
  payout_account_number = '6222020000000005',
  payout_branch_name = 'Foshan Export Branch',
  payout_iban = 'CN00DEMO0000000005'
where email = 'seed.supplier.hospitality-furniture@example.com';

-- Supplier profile: PackFolio Print & Pack Co., Ltd.
update public.profiles set
  full_name = 'Kevin Tao',
  role = 'supplier',
  status = 'verified',
  company_name = 'PackFolio Print & Pack Co., Ltd.',
  city = 'Qingdao',
  country = 'China',
  whatsapp = '+86138000006',
  wechat = 'packfolio_sales',
  trade_link = 'https://trade.packfolio-demo.example/packaging',
  trade_links = array['https://trade.packfolio-demo.example/packaging', 'https://packfolio-demo.example/catalog', 'https://packfolio-demo.example/factory-tour']::text[],
  speciality = 'Packaging, Labels & Printing',
  min_order_value = 1400,
  business_type = 'Manufacturer / Converter',
  year_established = 2015,
  years_experience = 10,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.',
  export_markets = array['Saudi Arabia', 'UAE', 'Jordan', 'Egypt']::text[],
  company_address = 'West Coast Packaging Cluster, Qingdao, Shandong, China',
  company_website = 'https://packfolio-demo.example',
  company_description = 'Synthetic demo supplier for retail packaging, corrugated shipping, and branded print assets.',
  bio_en = 'Synthetic demo supplier for retail packaging, corrugated shipping, and branded print assets.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع التغليف والملصقات والطباعة. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Packaging, Labels & Printing.',
  avatar_url = 'https://ui-avatars.com/api/?name=PackFolio%20Print%20%26%20Pack%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-packaging-printing-factory-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-factory-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-packaging-printing-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.8,
  reviews_count = 24,
  reg_number = 'DEMO-0006-PACK',
  num_employees = 80,
  pay_method = 'swift',
  bank_name = 'PackFolio Demo Bank',
  swift_code = 'DEMOCH0006',
  payout_beneficiary_name = 'PackFolio Demo Co.',
  payout_account_number = '6222020000000006',
  payout_branch_name = 'Qingdao Export Branch',
  payout_iban = 'CN00DEMO0000000006'
where email = 'seed.supplier.packaging-printing@example.com';

-- Supplier profile: LoomPeak Textile Works Co., Ltd.
update public.profiles set
  full_name = 'Grace Xu',
  role = 'supplier',
  status = 'verified',
  company_name = 'LoomPeak Textile Works Co., Ltd.',
  city = 'Shaoxing',
  country = 'China',
  whatsapp = '+86138000007',
  wechat = 'loompeak_sales',
  trade_link = 'https://trade.loompeak-demo.example/textiles',
  trade_links = array['https://trade.loompeak-demo.example/textiles', 'https://loompeak-demo.example/catalog', 'https://loompeak-demo.example/factory-tour']::text[],
  speciality = 'Textiles, Uniforms & Apparel',
  min_order_value = 2200,
  business_type = 'Manufacturer / Fabric Mill',
  year_established = 2010,
  years_experience = 15,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait']::text[],
  company_address = 'Keqiao Textile Market Zone, Shaoxing, Zhejiang, China',
  company_website = 'https://loompeak-demo.example',
  company_description = 'Synthetic demo supplier for apparel basics, uniforms, and textile rolls for private-label and hospitality use cases.',
  bio_en = 'Synthetic demo supplier for apparel basics, uniforms, and textile rolls for private-label and hospitality use cases.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع المنسوجات واليونيفورم والملابس. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Textiles, Uniforms & Apparel.',
  avatar_url = 'https://ui-avatars.com/api/?name=LoomPeak%20Textile%20Works%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-textiles-apparel-factory-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-factory-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-textiles-apparel-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.7,
  reviews_count = 27,
  reg_number = 'DEMO-0007-TEXT',
  num_employees = 89,
  pay_method = 'swift',
  bank_name = 'LoomPeak Demo Bank',
  swift_code = 'DEMOCH0007',
  payout_beneficiary_name = 'LoomPeak Demo Co.',
  payout_account_number = '6222020000000007',
  payout_branch_name = 'Shaoxing Export Branch',
  payout_iban = 'CN00DEMO0000000007'
where email = 'seed.supplier.textiles-apparel@example.com';

-- Supplier profile: PureForm Beauty Pack Co., Ltd.
update public.profiles set
  full_name = 'Ivy Sun',
  role = 'supplier',
  status = 'verified',
  company_name = 'PureForm Beauty Pack Co., Ltd.',
  city = 'Guangzhou',
  country = 'China',
  whatsapp = '+86138000008',
  wechat = 'pureform_sales',
  trade_link = 'https://trade.pureform-demo.example/beauty',
  trade_links = array['https://trade.pureform-demo.example/beauty', 'https://pureform-demo.example/catalog', 'https://pureform-demo.example/factory-tour']::text[],
  speciality = 'Beauty Packaging & Personal Care Tools',
  min_order_value = 1700,
  business_type = 'Manufacturer / Packaging Supplier',
  year_established = 2017,
  years_experience = 8,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.',
  export_markets = array['Saudi Arabia', 'UAE', 'Jordan']::text[],
  company_address = 'Baiyun Beauty Packaging Belt, Guangzhou, Guangdong, China',
  company_website = 'https://pureform-demo.example',
  company_description = 'Synthetic demo supplier for cosmetic containers, salon accessories, and launch-ready beauty packaging.',
  bio_en = 'Synthetic demo supplier for cosmetic containers, salon accessories, and launch-ready beauty packaging.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع عبوات التجميل وأدوات العناية الشخصية. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Beauty Packaging & Personal Care Tools.',
  avatar_url = 'https://ui-avatars.com/api/?name=PureForm%20Beauty%20Pack%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-beauty-packaging-care-factory-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-factory-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-beauty-packaging-care-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.8,
  reviews_count = 21,
  reg_number = 'DEMO-0008-BEAU',
  num_employees = 98,
  pay_method = 'swift',
  bank_name = 'PureForm Demo Bank',
  swift_code = 'DEMOCH0008',
  payout_beneficiary_name = 'PureForm Demo Co.',
  payout_account_number = '6222020000000008',
  payout_branch_name = 'Guangzhou Export Branch',
  payout_iban = 'CN00DEMO0000000008'
where email = 'seed.supplier.beauty-packaging-care@example.com';

-- Supplier profile: KitchenRoute Supply Co., Ltd.
update public.profiles set
  full_name = 'Daniel He',
  role = 'supplier',
  status = 'verified',
  company_name = 'KitchenRoute Supply Co., Ltd.',
  city = 'Xiamen',
  country = 'China',
  whatsapp = '+86138000009',
  wechat = 'kitchenroute_sales',
  trade_link = 'https://trade.kitchenroute-demo.example/horeca',
  trade_links = array['https://trade.kitchenroute-demo.example/horeca', 'https://kitchenroute-demo.example/catalog', 'https://kitchenroute-demo.example/factory-tour']::text[],
  speciality = 'Food Service, Kitchen & HORECA Supplies',
  min_order_value = 2600,
  business_type = 'Manufacturer / Trading House',
  year_established = 2014,
  years_experience = 11,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.',
  export_markets = array['Saudi Arabia', 'UAE', 'Oman']::text[],
  company_address = 'Tong’an Commercial Kitchen Cluster, Xiamen, Fujian, China',
  company_website = 'https://kitchenroute-demo.example',
  company_description = 'Synthetic demo supplier for restaurants, cafés, delivery kitchens, and hotel buffet operations.',
  bio_en = 'Synthetic demo supplier for restaurants, cafés, delivery kitchens, and hotel buffet operations.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع مستلزمات الأغذية والمطابخ وقطاع الضيافة. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Food Service, Kitchen & HORECA Supplies.',
  avatar_url = 'https://ui-avatars.com/api/?name=KitchenRoute%20Supply%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-foodservice-kitchen-factory-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-factory-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-foodservice-kitchen-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.7,
  reviews_count = 17,
  reg_number = 'DEMO-0009-FOOD',
  num_employees = 107,
  pay_method = 'swift',
  bank_name = 'KitchenRoute Demo Bank',
  swift_code = 'DEMOCH0009',
  payout_beneficiary_name = 'KitchenRoute Demo Co.',
  payout_account_number = '6222020000000009',
  payout_branch_name = 'Xiamen Export Branch',
  payout_iban = 'CN00DEMO0000000009'
where email = 'seed.supplier.foodservice-kitchen@example.com';

-- Supplier profile: ForgeGrid Industrial Co., Ltd.
update public.profiles set
  full_name = 'Ethan Qiao',
  role = 'supplier',
  status = 'verified',
  company_name = 'ForgeGrid Industrial Co., Ltd.',
  city = 'Suzhou',
  country = 'China',
  whatsapp = '+86138000010',
  wechat = 'forgegrid_sales',
  trade_link = 'https://trade.forgegrid-demo.example/tools',
  trade_links = array['https://trade.forgegrid-demo.example/tools', 'https://forgegrid-demo.example/catalog', 'https://forgegrid-demo.example/factory-tour']::text[],
  speciality = 'Industrial Tools, Safety & Site Equipment',
  min_order_value = 3900,
  business_type = 'Manufacturer / Industrial Supplier',
  year_established = 2009,
  years_experience = 16,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Iraq']::text[],
  company_address = 'Kunshan Industrial Tooling District, Suzhou, Jiangsu, China',
  company_website = 'https://forgegrid-demo.example',
  company_description = 'Synthetic demo supplier for contractor tools, PPE, and maintenance equipment with strong utility-focused merchandising.',
  bio_en = 'Synthetic demo supplier for contractor tools, PPE, and maintenance equipment with strong utility-focused merchandising.',
  bio_ar = 'مورد تجريبي آمن لعرض تجربة مَعبر في قطاع الأدوات الصناعية والسلامة ومعدات المواقع. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = 'Demo-safe supplier profile for Industrial Tools, Safety & Site Equipment.',
  avatar_url = 'https://ui-avatars.com/api/?name=ForgeGrid%20Industrial%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-industrial-tools-safety-factory-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-factory-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-factory-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-industrial-tools-safety-factory-1/1200/900',
  preferred_display_currency = 'USD',
  rating = 4.8,
  reviews_count = 29,
  reg_number = 'DEMO-0010-INDU',
  num_employees = 116,
  pay_method = 'swift',
  bank_name = 'ForgeGrid Demo Bank',
  swift_code = 'DEMOCH0010',
  payout_beneficiary_name = 'ForgeGrid Demo Co.',
  payout_account_number = '6222020000000010',
  payout_branch_name = 'Suzhou Export Branch',
  payout_iban = 'CN00DEMO0000000010'
where email = 'seed.supplier.industrial-tools-safety@example.com';

-- Trader profile: Riyadh Retail Group
update public.profiles set
  full_name = 'Faisal Alqahtani',
  role = 'buyer',
  status = 'active',
  city = 'Riyadh',
  country = 'Saudi Arabia',
  phone = '+966550101001',
  company_name = 'Riyadh Retail Group',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Riyadh%20Retail%20Group&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Electronics retail and branded launches.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.riyadh-retail-group@example.com';

-- Trader profile: Jeddah Gadgets Trading
update public.profiles set
  full_name = 'Huda Alharbi',
  role = 'buyer',
  status = 'active',
  city = 'Jeddah',
  country = 'Saudi Arabia',
  phone = '+966550101002',
  company_name = 'Jeddah Gadgets Trading',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Jeddah%20Gadgets%20Trading&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Consumer electronics distribution.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.jeddah-gadgets@example.com';

-- Trader profile: Khobar Smart Living
update public.profiles set
  full_name = 'Mazen Alotaibi',
  role = 'buyer',
  status = 'active',
  city = 'Al Khobar',
  country = 'Saudi Arabia',
  phone = '+966550101003',
  company_name = 'Khobar Smart Living',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Khobar%20Smart%20Living&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Smart home and villa automation.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.khobar-smart-living@example.com';

-- Trader profile: Riyadh Facility Buying Co.
update public.profiles set
  full_name = 'Reem Alenzi',
  role = 'buyer',
  status = 'active',
  city = 'Riyadh',
  country = 'Saudi Arabia',
  phone = '+966550101004',
  company_name = 'Riyadh Facility Buying Co.',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Riyadh%20Facility%20Buying%20Co.&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Facility maintenance procurement.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.riyadh-facility-buying@example.com';

-- Trader profile: Qassim Green Supply
update public.profiles set
  full_name = 'Yousef Almutairi',
  role = 'buyer',
  status = 'active',
  city = 'Buraidah',
  country = 'Saudi Arabia',
  phone = '+966550101005',
  company_name = 'Qassim Green Supply',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Qassim%20Green%20Supply&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Solar and off-grid reseller stock.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.qassim-green-supply@example.com';

-- Trader profile: Jeddah Site Power
update public.profiles set
  full_name = 'Sara Alzahrani',
  role = 'buyer',
  status = 'active',
  city = 'Jeddah',
  country = 'Saudi Arabia',
  phone = '+966550101006',
  company_name = 'Jeddah Site Power',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Jeddah%20Site%20Power&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Field power and portable energy.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.jeddah-site-power@example.com';

-- Trader profile: Riyadh Fitout Group
update public.profiles set
  full_name = 'Abdullah Alshehri',
  role = 'buyer',
  status = 'active',
  city = 'Riyadh',
  country = 'Saudi Arabia',
  phone = '+966550101007',
  company_name = 'Riyadh Fitout Group',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Riyadh%20Fitout%20Group&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Interior fit-out and apartments.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.riyadh-fitout-group@example.com';

-- Trader profile: Madinah Build Mart
update public.profiles set
  full_name = 'Waleed Alghamdi',
  role = 'buyer',
  status = 'active',
  city = 'Madinah',
  country = 'Saudi Arabia',
  phone = '+966550101008',
  company_name = 'Madinah Build Mart',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Madinah%20Build%20Mart&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Showroom and contractor distribution.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.madinah-build-mart@example.com';

-- Trader profile: Jeddah Hospitality Procurement
update public.profiles set
  full_name = 'Lama Alghamdi',
  role = 'buyer',
  status = 'active',
  city = 'Jeddah',
  country = 'Saudi Arabia',
  phone = '+966550101009',
  company_name = 'Jeddah Hospitality Procurement',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Jeddah%20Hospitality%20Procurement&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Hotels and serviced apartments.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.jeddah-hospitality-procurement@example.com';

-- Trader profile: Riyadh Office Source
update public.profiles set
  full_name = 'Nawaf Alsubaie',
  role = 'buyer',
  status = 'active',
  city = 'Riyadh',
  country = 'Saudi Arabia',
  phone = '+966550101010',
  company_name = 'Riyadh Office Source',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Riyadh%20Office%20Source&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Corporate office furnishing.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.riyadh-office-source@example.com';

-- Trader profile: Riyadh Beauty House
update public.profiles set
  full_name = 'Noura Alotaibi',
  role = 'buyer',
  status = 'active',
  city = 'Riyadh',
  country = 'Saudi Arabia',
  phone = '+966550101011',
  company_name = 'Riyadh Beauty House',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Riyadh%20Beauty%20House&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Beauty retail and e-commerce.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.riyadh-beauty-house@example.com';

-- Trader profile: Dammam Food Brand House
update public.profiles set
  full_name = 'Rakan Alrashidi',
  role = 'buyer',
  status = 'active',
  city = 'Dammam',
  country = 'Saudi Arabia',
  phone = '+966550101012',
  company_name = 'Dammam Food Brand House',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Dammam%20Food%20Brand%20House&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Food packaging and cloud kitchens.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.dammam-food-brand@example.com';

-- Trader profile: Riyadh Uniform Hub
update public.profiles set
  full_name = 'Raghad Alharbi',
  role = 'buyer',
  status = 'active',
  city = 'Riyadh',
  country = 'Saudi Arabia',
  phone = '+966550101013',
  company_name = 'Riyadh Uniform Hub',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Riyadh%20Uniform%20Hub&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Uniforms and workwear.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.riyadh-uniform-hub@example.com';

-- Trader profile: Makkah Hotel Linen Supply
update public.profiles set
  full_name = 'Khaled Binjaber',
  role = 'buyer',
  status = 'active',
  city = 'Makkah',
  country = 'Saudi Arabia',
  phone = '+966550101014',
  company_name = 'Makkah Hotel Linen Supply',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Makkah%20Hotel%20Linen%20Supply&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Hospitality linen and food service.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.makkah-hotel-linen@example.com';

-- Trader profile: Jeddah Salon Source
update public.profiles set
  full_name = 'Abeer Alsahli',
  role = 'buyer',
  status = 'active',
  city = 'Jeddah',
  country = 'Saudi Arabia',
  phone = '+966550101015',
  company_name = 'Jeddah Salon Source',
  preferred_display_currency = 'SAR',
  avatar_url = 'https://ui-avatars.com/api/?name=Jeddah%20Salon%20Source&background=101828&color=F5F7FA&bold=true&size=256',
  bio_en = 'Synthetic demo buyer account for Salon consumables and accessories.',
  bio_ar = 'حساب تاجر تجريبي آمن مخصص لعرض تجربة الشراء في مَعبر.'
where email = 'seed.trader.jeddah-salon-source@example.com';

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'شاحن سفر GaN بقدرة 65 واط', '65W GaN Travel Charger', '65W GaN Travel Charger', 18, 'USD', 'electronics', 200, '65W GaN Travel Charger from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'شاحن سفر GaN بقدرة 65 واط ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-65w-gan-travel-charger-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-65w-gan-travel-charger-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-65w-gan-travel-charger-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-65w-gan-travel-charger-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('65W GaN Travel Charger')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'باور بانك مغناطيسي لاسلكي', 'Magnetic Wireless Power Bank', 'Magnetic Wireless Power Bank', 25.5, 'USD', 'electronics', 280, 'Magnetic Wireless Power Bank from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'باور بانك مغناطيسي لاسلكي ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-magnetic-wireless-power-bank-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-magnetic-wireless-power-bank-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-magnetic-wireless-power-bank-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-magnetic-wireless-power-bank-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Magnetic Wireless Power Bank')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'محول USB-C متعدد المنافذ 8 في 1', 'USB-C 8-in-1 Docking Hub', 'USB-C 8-in-1 Docking Hub', 33, 'USD', 'electronics', 360, 'USB-C 8-in-1 Docking Hub from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'محول USB-C متعدد المنافذ 8 في 1 ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-usb-c-8-in-1-docking-hub-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-usb-c-8-in-1-docking-hub-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-usb-c-8-in-1-docking-hub-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-usb-c-8-in-1-docking-hub-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 14, true, 12, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('USB-C 8-in-1 Docking Hub')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'شاشة محمولة 15.6 بوصة', 'Portable 15.6" Monitor', 'Portable 15.6" Monitor', 40.5, 'USD', 'electronics', 440, 'Portable 15.6" Monitor from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'شاشة محمولة 15.6 بوصة ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-portable-15-6-monitor-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-portable-15-6-monitor-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-portable-15-6-monitor-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-portable-15-6-monitor-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Portable 15.6" Monitor')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'سماعات بلوتوث للمكالمات', 'Bluetooth Call Earbuds', 'Bluetooth Call Earbuds', 48, 'USD', 'electronics', 520, 'Bluetooth Call Earbuds from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'سماعات بلوتوث للمكالمات ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-bluetooth-call-earbuds-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-bluetooth-call-earbuds-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-bluetooth-call-earbuds-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-bluetooth-call-earbuds-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 16, true, 17, 7, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Bluetooth Call Earbuds')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'كاميرا سيارة بعدستين', 'Dashboard Dual-Lens Camera', 'Dashboard Dual-Lens Camera', 55.5, 'USD', 'electronics', 600, 'Dashboard Dual-Lens Camera from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'كاميرا سيارة بعدستين ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-dashboard-dual-lens-camera-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-dashboard-dual-lens-camera-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-dashboard-dual-lens-camera-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-dashboard-dual-lens-camera-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Dashboard Dual-Lens Camera')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'حامل جهاز لوحي مع تبريد', 'Tablet Stand with Cooling Base', 'Tablet Stand with Cooling Base', 63, 'USD', 'electronics', 680, 'Tablet Stand with Cooling Base from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'حامل جهاز لوحي مع تبريد ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-tablet-stand-with-cooling-base-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-tablet-stand-with-cooling-base-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-tablet-stand-with-cooling-base-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-tablet-stand-with-cooling-base-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 18, true, 22, 9, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Tablet Stand with Cooling Base')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طابعة ملصقات صغيرة', 'Mini Label Printer', 'Mini Label Printer', 70.5, 'USD', 'electronics', 760, 'Mini Label Printer from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طابعة ملصقات صغيرة ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-mini-label-printer-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-mini-label-printer-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-mini-label-printer-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-mini-label-printer-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Mini Label Printer')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'مصباح مكتب قابل للطي', 'Foldable Desk Lamp', 'Foldable Desk Lamp', 78, 'USD', 'electronics', 840, 'Foldable Desk Lamp from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'مصباح مكتب قابل للطي ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-foldable-desk-lamp-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-foldable-desk-lamp-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-foldable-desk-lamp-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-foldable-desk-lamp-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 20, true, 27, 12, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Foldable Desk Lamp')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طابعة إيصالات نقاط البيع', 'POS Receipt Printer', 'POS Receipt Printer', 85.5, 'USD', 'electronics', 920, 'POS Receipt Printer from the synthetic VoltBridge Consumer Tech Co., Ltd. demo catalog for Consumer Electronics & Mobile Accessories. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طابعة إيصالات نقاط البيع ضمن كتالوج تجريبي آمن من VoltBridge Consumer Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-consumer-electronics-pos-receipt-printer-1/1200/900', array['https://picsum.photos/seed/maabar-consumer-electronics-pos-receipt-printer-1/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-pos-receipt-printer-2/1200/900', 'https://picsum.photos/seed/maabar-consumer-electronics-pos-receipt-printer-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Private label packaging, custom firmware presets, logo printing, and bundled accessory kits.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.consumer-electronics@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('POS Receipt Printer')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'قفل باب ذكي عبر الواي فاي', 'Wi-Fi Smart Door Lock', 'Wi-Fi Smart Door Lock', 18, 'USD', 'electronics', 200, 'Wi-Fi Smart Door Lock from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'قفل باب ذكي عبر الواي فاي ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-wi-fi-smart-door-lock-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-wi-fi-smart-door-lock-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-wi-fi-smart-door-lock-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-wi-fi-smart-door-lock-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Wi-Fi Smart Door Lock')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم جرس باب بالفيديو', 'Video Doorbell Kit', 'Video Doorbell Kit', 25.5, 'USD', 'electronics', 280, 'Video Doorbell Kit from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم جرس باب بالفيديو ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-video-doorbell-kit-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-video-doorbell-kit-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-video-doorbell-kit-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-video-doorbell-kit-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Video Doorbell Kit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم مقابس ذكية مزدوج', 'Smart Plug Twin Pack', 'Smart Plug Twin Pack', 33, 'USD', 'electronics', 360, 'Smart Plug Twin Pack from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم مقابس ذكية مزدوج ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-smart-plug-twin-pack-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-smart-plug-twin-pack-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-smart-plug-twin-pack-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-smart-plug-twin-pack-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 14, true, 12, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Smart Plug Twin Pack')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'كاميرا داخلية متحركة PTZ', 'Indoor PTZ Camera', 'Indoor PTZ Camera', 40.5, 'USD', 'electronics', 440, 'Indoor PTZ Camera from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'كاميرا داخلية متحركة PTZ ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-indoor-ptz-camera-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-indoor-ptz-camera-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-indoor-ptz-camera-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-indoor-ptz-camera-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Indoor PTZ Camera')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم إنذار بحساس حركة', 'Motion Sensor Alarm Kit', 'Motion Sensor Alarm Kit', 48, 'USD', 'electronics', 520, 'Motion Sensor Alarm Kit from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم إنذار بحساس حركة ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-motion-sensor-alarm-kit-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-motion-sensor-alarm-kit-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-motion-sensor-alarm-kit-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-motion-sensor-alarm-kit-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 16, true, 17, 7, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Motion Sensor Alarm Kit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم محرك ستارة ذكي', 'Curtain Motor Set', 'Curtain Motor Set', 55.5, 'USD', 'electronics', 600, 'Curtain Motor Set from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم محرك ستارة ذكي ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-curtain-motor-set-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-curtain-motor-set-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-curtain-motor-set-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-curtain-motor-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Curtain Motor Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'مفتاح تحكم بالمشاهد', 'Scene Control Wall Switch', 'Scene Control Wall Switch', 63, 'USD', 'electronics', 680, 'Scene Control Wall Switch from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'مفتاح تحكم بالمشاهد ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-scene-control-wall-switch-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-scene-control-wall-switch-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-scene-control-wall-switch-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-scene-control-wall-switch-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 18, true, 22, 9, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Scene Control Wall Switch')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'حساس تسرب مياه', 'Water Leak Sensor', 'Water Leak Sensor', 70.5, 'USD', 'electronics', 760, 'Water Leak Sensor from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'حساس تسرب مياه ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-water-leak-sensor-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-water-leak-sensor-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-water-leak-sensor-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-water-leak-sensor-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Water Leak Sensor')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'شاشة انتركوم داخلية', 'Indoor Intercom Panel', 'Indoor Intercom Panel', 78, 'USD', 'electronics', 840, 'Indoor Intercom Panel from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'شاشة انتركوم داخلية ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-indoor-intercom-panel-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-indoor-intercom-panel-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-indoor-intercom-panel-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-indoor-intercom-panel-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 20, true, 27, 12, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Indoor Intercom Panel')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'بوابة ربط Zigbee', 'Zigbee Gateway Hub', 'Zigbee Gateway Hub', 85.5, 'USD', 'electronics', 920, 'Zigbee Gateway Hub from the synthetic HomeMesh Secure Systems Co., Ltd. demo catalog for Smart Home, Access Control & Security. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'بوابة ربط Zigbee ضمن كتالوج تجريبي آمن من HomeMesh Secure Systems Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-smart-home-security-zigbee-gateway-hub-1/1200/900', array['https://picsum.photos/seed/maabar-smart-home-security-zigbee-gateway-hub-1/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-zigbee-gateway-hub-2/1200/900', 'https://picsum.photos/seed/maabar-smart-home-security-zigbee-gateway-hub-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Custom panel branding, Arabic app language packs, and project kit bundling for villas and compounds.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.smart-home-security@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Zigbee Gateway Hub')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'محول طاقة شمسي هجين 5 كيلوواط', 'Hybrid Solar Inverter 5kW', 'Hybrid Solar Inverter 5kW', 158, 'USD', 'electronics', 200, 'Hybrid Solar Inverter 5kW from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'محول طاقة شمسي هجين 5 كيلوواط ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-hybrid-solar-inverter-5kw-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-hybrid-solar-inverter-5kw-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-hybrid-solar-inverter-5kw-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-hybrid-solar-inverter-5kw-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 12, true, 55, 24, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Hybrid Solar Inverter 5kW')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'بطارية LiFePO4 بسعة 10 كيلوواط', 'LiFePO4 Battery Rack 10kWh', 'LiFePO4 Battery Rack 10kWh', 165.5, 'USD', 'electronics', 280, 'LiFePO4 Battery Rack 10kWh from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'بطارية LiFePO4 بسعة 10 كيلوواط ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-lifepo4-battery-rack-10kwh-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-lifepo4-battery-rack-10kwh-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-lifepo4-battery-rack-10kwh-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-lifepo4-battery-rack-10kwh-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('LiFePO4 Battery Rack 10kWh')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'محطة طاقة محمولة 1200 واط', 'Portable Power Station 1200W', 'Portable Power Station 1200W', 173, 'USD', 'electronics', 360, 'Portable Power Station 1200W from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'محطة طاقة محمولة 1200 واط ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-portable-power-station-1200w-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-portable-power-station-1200w-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-portable-power-station-1200w-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-portable-power-station-1200w-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 14, true, 61, 26, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Portable Power Station 1200W')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم ألواح شمسية قابلة للطي', 'Foldable Solar Panel Kit', 'Foldable Solar Panel Kit', 180.5, 'USD', 'electronics', 440, 'Foldable Solar Panel Kit from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم ألواح شمسية قابلة للطي ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-foldable-solar-panel-kit-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-foldable-solar-panel-kit-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-foldable-solar-panel-kit-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-foldable-solar-panel-kit-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Foldable Solar Panel Kit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'منظم شحن MPPT', 'MPPT Charge Controller', 'MPPT Charge Controller', 188, 'USD', 'electronics', 520, 'MPPT Charge Controller from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'منظم شحن MPPT ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-mppt-charge-controller-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-mppt-charge-controller-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-mppt-charge-controller-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-mppt-charge-controller-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 16, true, 66, 28, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('MPPT Charge Controller')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم إنارة شارع بالطاقة الشمسية', 'Solar Street Light Set', 'Solar Street Light Set', 195.5, 'USD', 'electronics', 600, 'Solar Street Light Set from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم إنارة شارع بالطاقة الشمسية ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-solar-street-light-set-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-solar-street-light-set-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-solar-street-light-set-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-solar-street-light-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Solar Street Light Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عداد طاقة ذكي', 'Smart Power Meter', 'Smart Power Meter', 203, 'USD', 'electronics', 680, 'Smart Power Meter from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عداد طاقة ذكي ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-smart-power-meter-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-smart-power-meter-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-smart-power-meter-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-smart-power-meter-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 18, true, 71, 30, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Smart Power Meter')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'صندوق تجميع DC', 'DC Combiner Box', 'DC Combiner Box', 210.5, 'USD', 'electronics', 760, 'DC Combiner Box from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'صندوق تجميع DC ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-dc-combiner-box-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-dc-combiner-box-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-dc-combiner-box-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-dc-combiner-box-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('DC Combiner Box')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم سكك تثبيت سقفية', 'Roof Mount Rail Set', 'Roof Mount Rail Set', 218, 'USD', 'electronics', 840, 'Roof Mount Rail Set from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم سكك تثبيت سقفية ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-roof-mount-rail-set-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-roof-mount-rail-set-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-roof-mount-rail-set-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-roof-mount-rail-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 20, true, 76, 33, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Roof Mount Rail Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'خزانة تخزين طاقة منزلية', 'Home ESS Cabinet', 'Home ESS Cabinet', 225.5, 'USD', 'electronics', 920, 'Home ESS Cabinet from the synthetic SunHarbor Energy Tech Co., Ltd. demo catalog for Solar Energy, Inverters & Storage. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'خزانة تخزين طاقة منزلية ضمن كتالوج تجريبي آمن من SunHarbor Energy Tech Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-solar-energy-storage-home-ess-cabinet-1/1200/900', array['https://picsum.photos/seed/maabar-solar-energy-storage-home-ess-cabinet-1/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-home-ess-cabinet-2/1200/900', 'https://picsum.photos/seed/maabar-solar-energy-storage-home-ess-cabinet-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'White-label enclosures, Arabic spec sheets, and distributor packaging for solar retailers.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.solar-energy-storage@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Home ESS Cabinet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'سلسلة بلاط أرضيات بورسلان', 'Porcelain Floor Tile Series', 'Porcelain Floor Tile Series', 18, 'USD', 'building', 100, 'Porcelain Floor Tile Series from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'سلسلة بلاط أرضيات بورسلان ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-porcelain-floor-tile-series-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-porcelain-floor-tile-series-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-porcelain-floor-tile-series-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-porcelain-floor-tile-series-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Porcelain Floor Tile Series')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'لوح سطح كوارتز', 'Quartz Countertop Slab', 'Quartz Countertop Slab', 25.5, 'USD', 'building', 125, 'Quartz Countertop Slab from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'لوح سطح كوارتز ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-quartz-countertop-slab-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-quartz-countertop-slab-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-quartz-countertop-slab-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-quartz-countertop-slab-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Quartz Countertop Slab')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم بروفايل نوافذ ألمنيوم', 'Aluminum Window Profile Set', 'Aluminum Window Profile Set', 33, 'USD', 'building', 150, 'Aluminum Window Profile Set from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم بروفايل نوافذ ألمنيوم ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-aluminum-window-profile-set-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-aluminum-window-profile-set-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-aluminum-window-profile-set-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-aluminum-window-profile-set-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 14, true, 12, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Aluminum Window Profile Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'خلاط مغسلة حمام', 'Bathroom Mixer Faucet', 'Bathroom Mixer Faucet', 40.5, 'USD', 'building', 175, 'Bathroom Mixer Faucet from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'خلاط مغسلة حمام ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-bathroom-mixer-faucet-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-bathroom-mixer-faucet-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-bathroom-mixer-faucet-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-bathroom-mixer-faucet-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Bathroom Mixer Faucet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم دش ثرموستاتي', 'Thermostatic Shower Set', 'Thermostatic Shower Set', 48, 'USD', 'building', 200, 'Thermostatic Shower Set from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم دش ثرموستاتي ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-thermostatic-shower-set-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-thermostatic-shower-set-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-thermostatic-shower-set-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-thermostatic-shower-set-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 16, true, 17, 7, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Thermostatic Shower Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'حوض مطبخ ستانلس', 'Stainless Kitchen Sink', 'Stainless Kitchen Sink', 55.5, 'USD', 'building', 225, 'Stainless Kitchen Sink from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'حوض مطبخ ستانلس ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-stainless-kitchen-sink-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-stainless-kitchen-sink-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-stainless-kitchen-sink-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-stainless-kitchen-sink-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Stainless Kitchen Sink')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم مقابض أبواب معماري', 'Architect Door Handle Set', 'Architect Door Handle Set', 63, 'USD', 'building', 250, 'Architect Door Handle Set from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم مقابض أبواب معماري ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-architect-door-handle-set-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-architect-door-handle-set-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-architect-door-handle-set-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-architect-door-handle-set-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 18, true, 22, 9, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Architect Door Handle Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'ألواح أرضيات SPC', 'SPC Flooring Panel', 'SPC Flooring Panel', 70.5, 'USD', 'building', 275, 'SPC Flooring Panel from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'ألواح أرضيات SPC ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-spc-flooring-panel-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-spc-flooring-panel-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-spc-flooring-panel-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-spc-flooring-panel-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('SPC Flooring Panel')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'خزانة مرآة LED', 'LED Mirror Cabinet', 'LED Mirror Cabinet', 78, 'USD', 'building', 300, 'LED Mirror Cabinet from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'خزانة مرآة LED ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-led-mirror-cabinet-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-led-mirror-cabinet-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-led-mirror-cabinet-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-led-mirror-cabinet-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 20, true, 27, 12, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('LED Mirror Cabinet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'ألواح جدارية ديكورية', 'Decor Wall Panel', 'Decor Wall Panel', 85.5, 'USD', 'building', 325, 'Decor Wall Panel from the synthetic StoneAxis Building Supply Co., Ltd. demo catalog for Building Materials, Fixtures & Hardware. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'ألواح جدارية ديكورية ضمن كتالوج تجريبي آمن من StoneAxis Building Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-building-materials-hardware-decor-wall-panel-1/1200/900', array['https://picsum.photos/seed/maabar-building-materials-hardware-decor-wall-panel-1/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-decor-wall-panel-2/1200/900', 'https://picsum.photos/seed/maabar-building-materials-hardware-decor-wall-panel-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Project color matching, showroom sample kits, and contractor carton labeling.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.building-materials-hardware@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Decor Wall Panel')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'قاعدة سرير فندقي', 'Hotel Bed Base', 'Hotel Bed Base', 108, 'USD', 'furniture', 20, 'Hotel Bed Base from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'قاعدة سرير فندقي ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-hotel-bed-base-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-hotel-bed-base-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-hotel-bed-base-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-hotel-bed-base-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 12, true, 38, 16, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Hotel Bed Base')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'كرسي لاونج للردهة', 'Lobby Lounge Chair', 'Lobby Lounge Chair', 115.5, 'USD', 'furniture', 25, 'Lobby Lounge Chair from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'كرسي لاونج للردهة ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-lobby-lounge-chair-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-lobby-lounge-chair-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-lobby-lounge-chair-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-lobby-lounge-chair-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Lobby Lounge Chair')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم كنبة استقبال', 'Reception Sofa Set', 'Reception Sofa Set', 123, 'USD', 'furniture', 30, 'Reception Sofa Set from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم كنبة استقبال ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-reception-sofa-set-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-reception-sofa-set-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-reception-sofa-set-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-reception-sofa-set-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 14, true, 43, 18, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Reception Sofa Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم طاولة طعام خشب صلب', 'Solid Wood Dining Set', 'Solid Wood Dining Set', 130.5, 'USD', 'furniture', 35, 'Solid Wood Dining Set from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم طاولة طعام خشب صلب ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-solid-wood-dining-set-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-solid-wood-dining-set-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-solid-wood-dining-set-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-solid-wood-dining-set-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Solid Wood Dining Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'وحدة طاولة جانبية', 'Bedside Table Unit', 'Bedside Table Unit', 138, 'USD', 'furniture', 40, 'Bedside Table Unit from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'وحدة طاولة جانبية ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-bedside-table-unit-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-bedside-table-unit-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-bedside-table-unit-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-bedside-table-unit-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 16, true, 48, 21, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Bedside Table Unit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم جلسة راتان خارجي', 'Outdoor Rattan Seating Set', 'Outdoor Rattan Seating Set', 145.5, 'USD', 'furniture', 45, 'Outdoor Rattan Seating Set from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم جلسة راتان خارجي ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-outdoor-rattan-seating-set-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-outdoor-rattan-seating-set-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-outdoor-rattan-seating-set-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-outdoor-rattan-seating-set-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Outdoor Rattan Seating Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طاولة اجتماعات', 'Conference Meeting Table', 'Conference Meeting Table', 153, 'USD', 'furniture', 50, 'Conference Meeting Table from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طاولة اجتماعات ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-conference-meeting-table-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-conference-meeting-table-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-conference-meeting-table-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-conference-meeting-table-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 18, true, 54, 23, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Conference Meeting Table')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'محطة عمل مكتبية', 'Open Office Workstation', 'Open Office Workstation', 160.5, 'USD', 'furniture', 55, 'Open Office Workstation from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'محطة عمل مكتبية ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-open-office-workstation-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-open-office-workstation-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-open-office-workstation-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-open-office-workstation-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Open Office Workstation')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'خزانة عرض وتخزين', 'Storage Display Cabinet', 'Storage Display Cabinet', 168, 'USD', 'furniture', 60, 'Storage Display Cabinet from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'خزانة عرض وتخزين ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-storage-display-cabinet-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-storage-display-cabinet-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-storage-display-cabinet-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-storage-display-cabinet-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 20, true, 59, 25, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Storage Display Cabinet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طاولة جانبية ديكورية', 'Accent Side Table', 'Accent Side Table', 175.5, 'USD', 'furniture', 65, 'Accent Side Table from the synthetic HarborNest Furnishings Co., Ltd. demo catalog for Hospitality, Office & Residential Furniture. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طاولة جانبية ديكورية ضمن كتالوج تجريبي آمن من HarborNest Furnishings Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-hospitality-furniture-accent-side-table-1/1200/900', array['https://picsum.photos/seed/maabar-hospitality-furniture-accent-side-table-1/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-accent-side-table-2/1200/900', 'https://picsum.photos/seed/maabar-hospitality-furniture-accent-side-table-3/1200/900']::text[], null, 'Wood veneer + powder-coated steel', 'Project sizes available on request', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Hotel project sizing, custom finishes, branded upholstery labels, and carton coding by room type.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.hospitality-furniture@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Accent Side Table')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'كرتون شحن مموج', 'Corrugated Shipping Carton', 'Corrugated Shipping Carton', 6, 'USD', 'other', 200, 'Corrugated Shipping Carton from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'كرتون شحن مموج ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-corrugated-shipping-carton-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-corrugated-shipping-carton-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-corrugated-shipping-carton-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-corrugated-shipping-carton-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Corrugated Shipping Carton')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'علبة شحن مطبوعة مخصصة', 'Custom Printed Mailer Box', 'Custom Printed Mailer Box', 13.5, 'USD', 'other', 280, 'Custom Printed Mailer Box from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'علبة شحن مطبوعة مخصصة ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-custom-printed-mailer-box-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-custom-printed-mailer-box-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-custom-printed-mailer-box-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-custom-printed-mailer-box-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Custom Printed Mailer Box')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'أكياس واقفة بسحاب', 'Stand-up Zipper Pouch', 'Stand-up Zipper Pouch', 21, 'USD', 'other', 360, 'Stand-up Zipper Pouch from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'أكياس واقفة بسحاب ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-stand-up-zipper-pouch-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-stand-up-zipper-pouch-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-stand-up-zipper-pouch-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-stand-up-zipper-pouch-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 14, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Stand-up Zipper Pouch')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'علبة هدايا صلبة', 'Rigid Gift Box', 'Rigid Gift Box', 28.5, 'USD', 'other', 440, 'Rigid Gift Box from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'علبة هدايا صلبة ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-rigid-gift-box-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-rigid-gift-box-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-rigid-gift-box-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-rigid-gift-box-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Rigid Gift Box')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'رول ملصقات حرارية', 'Thermal Label Roll', 'Thermal Label Roll', 36, 'USD', 'other', 520, 'Thermal Label Roll from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'رول ملصقات حرارية ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-thermal-label-roll-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-thermal-label-roll-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-thermal-label-roll-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-thermal-label-roll-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 16, true, 13, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Thermal Label Roll')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم بطاقات تعليق', 'Retail Hang Tag Set', 'Retail Hang Tag Set', 43.5, 'USD', 'other', 600, 'Retail Hang Tag Set from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم بطاقات تعليق ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-retail-hang-tag-set-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-retail-hang-tag-set-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-retail-hang-tag-set-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-retail-hang-tag-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Retail Hang Tag Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'كوب ورقي غذائي', 'Food Grade Paper Cup', 'Food Grade Paper Cup', 51, 'USD', 'other', 680, 'Food Grade Paper Cup from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'كوب ورقي غذائي ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-food-grade-paper-cup-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-food-grade-paper-cup-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-food-grade-paper-cup-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-food-grade-paper-cup-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 18, true, 18, 8, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Food Grade Paper Cup')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'بطانة حماية فوم', 'Foam Protection Insert', 'Foam Protection Insert', 58.5, 'USD', 'other', 760, 'Foam Protection Insert from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'بطانة حماية فوم ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-foam-protection-insert-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-foam-protection-insert-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-foam-protection-insert-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-foam-protection-insert-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Foam Protection Insert')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'ورقة ملصقات باركود', 'Barcode Sticker Sheet', 'Barcode Sticker Sheet', 66, 'USD', 'other', 840, 'Barcode Sticker Sheet from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'ورقة ملصقات باركود ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-barcode-sticker-sheet-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-barcode-sticker-sheet-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-barcode-sticker-sheet-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-barcode-sticker-sheet-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 20, true, 23, 10, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Barcode Sticker Sheet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'كتالوج منتج مغلف', 'Laminated Product Catalog', 'Laminated Product Catalog', 73.5, 'USD', 'other', 920, 'Laminated Product Catalog from the synthetic PackFolio Print & Pack Co., Ltd. demo catalog for Packaging, Labels & Printing. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'كتالوج منتج مغلف ضمن كتالوج تجريبي آمن من PackFolio Print & Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-packaging-printing-laminated-product-catalog-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-printing-laminated-product-catalog-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-laminated-product-catalog-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-printing-laminated-product-catalog-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Custom dieline sizes available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Arabic print proofing, retail dielines, QR serialization, and mixed SKU carton breakdowns.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.packaging-printing@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Laminated Product Catalog')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'تيشيرت قطن ثقيل', 'Heavy Cotton T-Shirt', 'Heavy Cotton T-Shirt', 18, 'USD', 'clothing', 200, 'Heavy Cotton T-Shirt from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'تيشيرت قطن ثقيل ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-heavy-cotton-t-shirt-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-heavy-cotton-t-shirt-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-heavy-cotton-t-shirt-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-heavy-cotton-t-shirt-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Heavy Cotton T-Shirt')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'رول قماش عبايات', 'Abaya Fabric Roll', 'Abaya Fabric Roll', 25.5, 'USD', 'clothing', 280, 'Abaya Fabric Roll from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'رول قماش عبايات ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-abaya-fabric-roll-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-abaya-fabric-roll-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-abaya-fabric-roll-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-abaya-fabric-roll-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Abaya Fabric Roll')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم مناشف فندقية', 'Hotel Towel Set', 'Hotel Towel Set', 33, 'USD', 'clothing', 360, 'Hotel Towel Set from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم مناشف فندقية ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-hotel-towel-set-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-hotel-towel-set-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-hotel-towel-set-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-hotel-towel-set-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 14, true, 12, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Hotel Towel Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'قميص بولو عملي', 'Performance Polo Shirt', 'Performance Polo Shirt', 40.5, 'USD', 'clothing', 440, 'Performance Polo Shirt from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'قميص بولو عملي ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-performance-polo-shirt-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-performance-polo-shirt-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-performance-polo-shirt-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-performance-polo-shirt-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Performance Polo Shirt')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'جاكيت عمل', 'Workwear Utility Jacket', 'Workwear Utility Jacket', 48, 'USD', 'clothing', 520, 'Workwear Utility Jacket from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'جاكيت عمل ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-workwear-utility-jacket-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-workwear-utility-jacket-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-workwear-utility-jacket-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-workwear-utility-jacket-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 16, true, 17, 7, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Workwear Utility Jacket')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'هودي فليس', 'Fleece Hoodie', 'Fleece Hoodie', 55.5, 'USD', 'clothing', 600, 'Fleece Hoodie from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'هودي فليس ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-fleece-hoodie-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-fleece-hoodie-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-fleece-hoodie-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-fleece-hoodie-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Fleece Hoodie')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'رول قماش دنيم', 'Denim Fabric Roll', 'Denim Fabric Roll', 63, 'USD', 'clothing', 680, 'Denim Fabric Roll from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'رول قماش دنيم ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-denim-fabric-roll-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-denim-fabric-roll-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-denim-fabric-roll-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-denim-fabric-roll-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 18, true, 22, 9, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Denim Fabric Roll')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم مفارش كتان', 'Linen Bedsheet Set', 'Linen Bedsheet Set', 70.5, 'USD', 'clothing', 760, 'Linen Bedsheet Set from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم مفارش كتان ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-linen-bedsheet-set-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-linen-bedsheet-set-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-linen-bedsheet-set-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-linen-bedsheet-set-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Linen Bedsheet Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'تشكيلة رومبر أطفال', 'Baby Romper Collection', 'Baby Romper Collection', 78, 'USD', 'clothing', 840, 'Baby Romper Collection from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'تشكيلة رومبر أطفال ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-baby-romper-collection-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-baby-romper-collection-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-baby-romper-collection-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-baby-romper-collection-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 20, true, 27, 12, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Baby Romper Collection')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'برنامج قمصان يونيفورم', 'Uniform Shirt Program', 'Uniform Shirt Program', 85.5, 'USD', 'clothing', 920, 'Uniform Shirt Program from the synthetic LoomPeak Textile Works Co., Ltd. demo catalog for Textiles, Uniforms & Apparel. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'برنامج قمصان يونيفورم ضمن كتالوج تجريبي آمن من LoomPeak Textile Works Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-textiles-apparel-uniform-shirt-program-1/1200/900', array['https://picsum.photos/seed/maabar-textiles-apparel-uniform-shirt-program-1/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-uniform-shirt-program-2/1200/900', 'https://picsum.photos/seed/maabar-textiles-apparel-uniform-shirt-program-3/1200/900']::text[], null, 'Cotton / blended textile', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Uniform embroidery, custom fabric GSM, washing tests, and retailer packaging.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.textiles-apparel@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Uniform Shirt Program')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عبوة بمضخة بدون هواء', 'Airless Pump Bottle', 'Airless Pump Bottle', 6, 'USD', 'other', 200, 'Airless Pump Bottle from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عبوة بمضخة بدون هواء ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-airless-pump-bottle-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-airless-pump-bottle-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-airless-pump-bottle-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-airless-pump-bottle-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Airless Pump Bottle')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عبوة سيروم زجاجية بقطارة', 'Glass Serum Dropper Bottle', 'Glass Serum Dropper Bottle', 13.5, 'USD', 'other', 280, 'Glass Serum Dropper Bottle from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عبوة سيروم زجاجية بقطارة ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-glass-serum-dropper-bottle-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-glass-serum-dropper-bottle-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-glass-serum-dropper-bottle-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-glass-serum-dropper-bottle-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Glass Serum Dropper Bottle')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم فرش مكياج', 'Makeup Brush Set', 'Makeup Brush Set', 21, 'USD', 'other', 360, 'Makeup Brush Set from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم فرش مكياج ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-makeup-brush-set-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-makeup-brush-set-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-makeup-brush-set-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-makeup-brush-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 14, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Makeup Brush Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عبوة كريم PET', 'PET Cream Jar', 'PET Cream Jar', 28.5, 'USD', 'other', 440, 'PET Cream Jar from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عبوة كريم PET ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-pet-cream-jar-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-pet-cream-jar-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-pet-cream-jar-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-pet-cream-jar-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('PET Cream Jar')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'أنبوب ملمع شفاه', 'Lip Gloss Tube', 'Lip Gloss Tube', 36, 'USD', 'other', 520, 'Lip Gloss Tube from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'أنبوب ملمع شفاه ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-lip-gloss-tube-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-lip-gloss-tube-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-lip-gloss-tube-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-lip-gloss-tube-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 16, true, 13, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Lip Gloss Tube')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم سفر تجميلي', 'Travel Cosmetic Kit', 'Travel Cosmetic Kit', 43.5, 'USD', 'other', 600, 'Travel Cosmetic Kit from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم سفر تجميلي ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-travel-cosmetic-kit-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-travel-cosmetic-kit-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-travel-cosmetic-kit-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-travel-cosmetic-kit-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Travel Cosmetic Kit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عبوة بخاخ زناد', 'Trigger Spray Bottle', 'Trigger Spray Bottle', 51, 'USD', 'other', 680, 'Trigger Spray Bottle from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عبوة بخاخ زناد ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-trigger-spray-bottle-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-trigger-spray-bottle-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-trigger-spray-bottle-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-trigger-spray-bottle-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 18, true, 18, 8, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Trigger Spray Bottle')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عبوة مضخة رغوية', 'Foam Pump Bottle', 'Foam Pump Bottle', 58.5, 'USD', 'other', 760, 'Foam Pump Bottle from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عبوة مضخة رغوية ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-foam-pump-bottle-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-foam-pump-bottle-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-foam-pump-bottle-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-foam-pump-bottle-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Foam Pump Bottle')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'فيلم تغليف ساشيه', 'Sachet Packaging Film', 'Sachet Packaging Film', 66, 'USD', 'other', 840, 'Sachet Packaging Film from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'فيلم تغليف ساشيه ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-sachet-packaging-film-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-sachet-packaging-film-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-sachet-packaging-film-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-sachet-packaging-film-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 20, true, 23, 10, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Sachet Packaging Film')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'منشفة صالون قابلة للف', 'Salon Towel Wrap', 'Salon Towel Wrap', 73.5, 'USD', 'other', 920, 'Salon Towel Wrap from the synthetic PureForm Beauty Pack Co., Ltd. demo catalog for Beauty Packaging & Personal Care Tools. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'منشفة صالون قابلة للف ضمن كتالوج تجريبي آمن من PureForm Beauty Pack Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-beauty-packaging-care-salon-towel-wrap-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-packaging-care-salon-towel-wrap-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-salon-towel-wrap-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-packaging-care-salon-towel-wrap-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Silk-screen print, color master matching, private-label accessory kits, and low-MOQ launch packs.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.beauty-packaging-care@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Salon Towel Wrap')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم أواني GN', 'Gastronorm Food Pan Set', 'Gastronorm Food Pan Set', 18, 'USD', 'food', 500, 'Gastronorm Food Pan Set from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم أواني GN ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-gastronorm-food-pan-set-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-gastronorm-food-pan-set-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-gastronorm-food-pan-set-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-gastronorm-food-pan-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Gastronorm Food Pan Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'صحن تسخين ستانلس', 'Stainless Chafing Dish', 'Stainless Chafing Dish', 25.5, 'USD', 'food', 650, 'Stainless Chafing Dish from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'صحن تسخين ستانلس ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-stainless-chafing-dish-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-stainless-chafing-dish-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-stainless-chafing-dish-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-stainless-chafing-dish-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Stainless Chafing Dish')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'صندوق توصيل معزول', 'Insulated Delivery Box', 'Insulated Delivery Box', 33, 'USD', 'food', 800, 'Insulated Delivery Box from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'صندوق توصيل معزول ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-insulated-delivery-box-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-insulated-delivery-box-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-insulated-delivery-box-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-insulated-delivery-box-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 14, true, 12, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Insulated Delivery Box')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم أدوات مائدة للاستعمال مرة واحدة', 'Disposable Cutlery Pack', 'Disposable Cutlery Pack', 40.5, 'USD', 'food', 950, 'Disposable Cutlery Pack from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم أدوات مائدة للاستعمال مرة واحدة ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-disposable-cutlery-pack-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-disposable-cutlery-pack-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-disposable-cutlery-pack-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-disposable-cutlery-pack-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Disposable Cutlery Pack')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'علبة طعام ورقية', 'Paper Food Container', 'Paper Food Container', 48, 'USD', 'food', 1100, 'Paper Food Container from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'علبة طعام ورقية ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-paper-food-container-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-paper-food-container-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-paper-food-container-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-paper-food-container-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 16, true, 17, 7, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Paper Food Container')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'وعاء خلاط تجاري', 'Commercial Blender Jar', 'Commercial Blender Jar', 55.5, 'USD', 'food', 1250, 'Commercial Blender Jar from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'وعاء خلاط تجاري ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-commercial-blender-jar-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-commercial-blender-jar-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-commercial-blender-jar-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-commercial-blender-jar-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Commercial Blender Jar')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'جهاز تفريغ وحفظ الطعام', 'Vacuum Food Sealer', 'Vacuum Food Sealer', 63, 'USD', 'food', 1400, 'Vacuum Food Sealer from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'جهاز تفريغ وحفظ الطعام ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-vacuum-food-sealer-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-vacuum-food-sealer-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-vacuum-food-sealer-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-vacuum-food-sealer-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 18, true, 22, 9, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Vacuum Food Sealer')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم سكاكين شيف', 'Chef Knife Set', 'Chef Knife Set', 70.5, 'USD', 'food', 1550, 'Chef Knife Set from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم سكاكين شيف ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-chef-knife-set-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-chef-knife-set-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-chef-knife-set-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-chef-knife-set-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Chef Knife Set')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'حصيرة خبز سيليكون', 'Silicone Baking Mat', 'Silicone Baking Mat', 78, 'USD', 'food', 1700, 'Silicone Baking Mat from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'حصيرة خبز سيليكون ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-silicone-baking-mat-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-silicone-baking-mat-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-silicone-baking-mat-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-silicone-baking-mat-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 20, true, 27, 12, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Silicone Baking Mat')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'موزع مشروبات باردة', 'Cold Beverage Dispenser', 'Cold Beverage Dispenser', 85.5, 'USD', 'food', 1850, 'Cold Beverage Dispenser from the synthetic KitchenRoute Supply Co., Ltd. demo catalog for Food Service, Kitchen & HORECA Supplies. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'موزع مشروبات باردة ضمن كتالوج تجريبي آمن من KitchenRoute Supply Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-foodservice-kitchen-cold-beverage-dispenser-1/1200/900', array['https://picsum.photos/seed/maabar-foodservice-kitchen-cold-beverage-dispenser-1/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-cold-beverage-dispenser-2/1200/900', 'https://picsum.photos/seed/maabar-foodservice-kitchen-cold-beverage-dispenser-3/1200/900']::text[], null, 'ABS / steel / engineered components', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Restaurant branding, carton assortment by SKU, and project bundles for cafes and cloud kitchens.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.foodservice-kitchen@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Cold Beverage Dispenser')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'عدة دريل لاسلكي', 'Cordless Drill Kit', 'Cordless Drill Kit', 18, 'USD', 'building', 100, 'Cordless Drill Kit from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'عدة دريل لاسلكي ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cordless-drill-kit-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-cordless-drill-kit-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cordless-drill-kit-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cordless-drill-kit-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.4 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 12, true, 8, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Cordless Drill Kit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'خوذة لحام ذاتية التعتيم', 'Auto-Darkening Welding Helmet', 'Auto-Darkening Welding Helmet', 25.5, 'USD', 'building', 125, 'Auto-Darkening Welding Helmet from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'خوذة لحام ذاتية التعتيم ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-auto-darkening-welding-helmet-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-auto-darkening-welding-helmet-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-auto-darkening-welding-helmet-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-auto-darkening-welding-helmet-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.5800000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 13, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Auto-Darkening Welding Helmet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'قفازات سلامة مقاومة للقطع', 'Cut-Resistant Safety Gloves', 'Cut-Resistant Safety Gloves', 33, 'USD', 'building', 150, 'Cut-Resistant Safety Gloves from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'قفازات سلامة مقاومة للقطع ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cut-resistant-safety-gloves-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-cut-resistant-safety-gloves-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cut-resistant-safety-gloves-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cut-resistant-safety-gloves-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.76 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 14, true, 12, 5, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Cut-Resistant Safety Gloves')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'مفتاح صدمات قوي', 'Heavy Duty Impact Wrench', 'Heavy Duty Impact Wrench', 40.5, 'USD', 'building', 175, 'Heavy Duty Impact Wrench from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'مفتاح صدمات قوي ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-heavy-duty-impact-wrench-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-heavy-duty-impact-wrench-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-heavy-duty-impact-wrench-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-heavy-duty-impact-wrench-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '0.9400000000000001 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 15, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Heavy Duty Impact Wrench')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'خزانة أدوات متحركة', 'Rolling Tool Cabinet', 'Rolling Tool Cabinet', 48, 'USD', 'building', 200, 'Rolling Tool Cabinet from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'خزانة أدوات متحركة ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-rolling-tool-cabinet-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-rolling-tool-cabinet-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-rolling-tool-cabinet-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-rolling-tool-cabinet-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.12 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 16, true, 17, 7, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Rolling Tool Cabinet')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'ميزان ليزر', 'Cross-Line Laser Level', 'Cross-Line Laser Level', 55.5, 'USD', 'building', 225, 'Cross-Line Laser Level from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'ميزان ليزر ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cross-line-laser-level-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-cross-line-laser-level-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cross-line-laser-level-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-cross-line-laser-level-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.2999999999999998 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 17, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Cross-Line Laser Level')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'بكرة خرطوم هواء', 'Air Hose Reel', 'Air Hose Reel', 63, 'USD', 'building', 250, 'Air Hose Reel from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'بكرة خرطوم هواء ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-air-hose-reel-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-air-hose-reel-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-air-hose-reel-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-air-hose-reel-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.48 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 18, true, 22, 9, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Air Hose Reel')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'حزام أمان كامل للجسم', 'Full Body Safety Harness', 'Full Body Safety Harness', 70.5, 'USD', 'building', 275, 'Full Body Safety Harness from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'حزام أمان كامل للجسم ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-full-body-safety-harness-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-full-body-safety-harness-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-full-body-safety-harness-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-full-body-safety-harness-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.6600000000000001 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 19, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Full Body Safety Harness')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'جلّاخة طاولة', 'Bench Grinder Unit', 'Bench Grinder Unit', 78, 'USD', 'building', 300, 'Bench Grinder Unit from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'جلّاخة طاولة ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-bench-grinder-unit-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-bench-grinder-unit-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-bench-grinder-unit-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-bench-grinder-unit-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '1.8399999999999999 kg', 'Standard export assortment', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 20, true, 27, 12, 3, 'Sample order available for pre-production approval.', true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Bench Grinder Unit')
  );

insert into public.products (
  supplier_id, name_ar, name_en, name_zh, price_from, currency, category, moq, desc_en, desc_ar, image_url, gallery_images, video_url, spec_material, spec_dimensions, spec_unit_weight, spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days, sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select
  p.id, 'طقم عجلات سقالة', 'Scaffold Wheel Caster Set', 'Scaffold Wheel Caster Set', 85.5, 'USD', 'building', 325, 'Scaffold Wheel Caster Set from the synthetic ForgeGrid Industrial Co., Ltd. demo catalog for Industrial Tools, Safety & Site Equipment. Built to make marketplace listings feel dense, credible, and presentation-ready without using any real-world private product records.', 'طقم عجلات سقالة ضمن كتالوج تجريبي آمن من ForgeGrid Industrial Co., Ltd. لعرض تجربة القطاع داخل مَعبر بشكل واقعي بدون استخدام بيانات حقيقية خاصة.', 'https://picsum.photos/seed/maabar-industrial-tools-safety-scaffold-wheel-caster-set-1/1200/900', array['https://picsum.photos/seed/maabar-industrial-tools-safety-scaffold-wheel-caster-set-1/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-scaffold-wheel-caster-set-2/1200/900', 'https://picsum.photos/seed/maabar-industrial-tools-safety-scaffold-wheel-caster-set-3/1200/900']::text[], null, 'Ceramic / aluminum / stainless steel mix by SKU', 'Standard export dimensions available', '2.02 kg', 'Black / White / Custom brand colors', 'Master carton export packing with inner protection and barcode-ready labels.', 'Distributor carton coding, kit assembly, and private-label packaging for industrial retail chains.', 21, false, null, null, null, null, true
from public.profiles p
where p.email = 'seed.supplier.industrial-tools-safety@example.com'
  and not exists (
    select 1 from public.products existing where existing.supplier_id = p.id and lower(existing.name_en) = lower('Scaffold Wheel Caster Set')
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب شواحن سريعة وباور بانك بعلامة خاصة لإطلاق تجزئة', 'Need private-label fast chargers and power banks for retail launch', 'Need private-label fast chargers and power banks for retail launch', '4,000 charger units + 2,500 power banks', 'Retail-focused sourcing batch for Riyadh electronics shelves. Clean packaging, Arabic manual insert, and stable carton packing required.', 'electronics', 'open', 13, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-consumer-electronics-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-retail-group@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need private-label fast chargers and power banks for retail launch') and coalesce(existing.quantity, '') = '4,000 charger units + 2,500 power banks'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن شاشات محمولة لقناة إعادة البيع', 'Looking for portable monitors for reseller channel', 'Looking for portable monitors for reseller channel', 600, 'Need consistent panel quality, HDMI + USB-C support, and carton branding suitable for Saudi e-commerce resellers.', 'electronics', 'open', 82, 40, 'required', 'https://picsum.photos/seed/maabar-request-consumer-electronics-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.jeddah-gadgets@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for portable monitors for reseller channel') and coalesce(existing.quantity, '') = '600'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مشروع فلل يحتاج أقفال ذكية وأجراس باب وشاشات داخلية', 'Villa project needs smart locks, doorbells, and indoor panels', 'Villa project needs smart locks, doorbells, and indoor panels', 120, 'Project batch for a gated compound in Eastern Province. Need app stability, Arabic quick-start cards, and replacement unit policy.', 'electronics', 'open', 165, 30, 'required', 'https://picsum.photos/seed/maabar-request-smart-home-security-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.khobar-smart-living@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Villa project needs smart locks, doorbells, and indoor panels') and coalesce(existing.quantity, '') = '120'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب حساسات تسرب ومقابس ذكية لمخزون صيانة المرافق', 'Need water leak sensors and smart plugs for facilities maintenance inventory', 'Need water leak sensors and smart plugs for facilities maintenance inventory', '3,000 mixed units', 'Looking for fast-moving maintenance items with stable carton labeling and ready replacement stock.', 'electronics', 'open', 11, 50, 'preferred', 'https://picsum.photos/seed/maabar-request-smart-home-security-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-facility-buying@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need water leak sensors and smart plugs for facilities maintenance inventory') and coalesce(existing.quantity, '') = '3,000 mixed units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب محولات هجينة ورفوف بطاريات لمخزون موزع', 'Need hybrid inverters and battery racks for reseller inventory', 'Need hybrid inverters and battery racks for reseller inventory', 180, 'Distributor order for regional solar retail. Need warranty terms, serial traceability, and clean pallet readiness.', 'electronics', 'open', 690, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-solar-energy-storage-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.qassim-green-supply@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need hybrid inverters and battery racks for reseller inventory') and coalesce(existing.quantity, '') = '180'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن محطات طاقة محمولة للعمليات الميدانية', 'Looking for portable power stations for field operations', 'Looking for portable power stations for field operations', 420, 'Units will be used by service teams and pop-up events. Need robust carton protection and accessories pack.', 'electronics', 'open', 220, 40, 'required', 'https://picsum.photos/seed/maabar-request-solar-energy-storage-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.jeddah-site-power@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for portable power stations for field operations') and coalesce(existing.quantity, '') = '420'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب خلاطات وأحواض وخزائن مرايا لمشروع تشطيبات', 'Need contractor-grade faucets, sinks, and mirror cabinets for fit-out project', 'Need contractor-grade faucets, sinks, and mirror cabinets for fit-out project', 'Project mix for 180 apartments', 'Need matching finish quality, stable replacement policy, and export packing for staged delivery.', 'building', 'open', 58, 30, 'required', 'https://picsum.photos/seed/maabar-request-building-materials-hardware-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-fitout-group@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need contractor-grade faucets, sinks, and mirror cabinets for fit-out project') and coalesce(existing.quantity, '') = 'Project mix for 180 apartments'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن مجموعات أرضيات SPC وألواح جدارية لإطلاق معرض', 'Looking for SPC flooring and wall panel collections for showroom launch', 'Looking for SPC flooring and wall panel collections for showroom launch', 2, 'Mix should cover premium and mid-market display boards with Arabic catalog labels.', 'building', 'open', 12, 40, 'preferred', 'https://picsum.photos/seed/maabar-request-building-materials-hardware-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.madinah-build-mart@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for SPC flooring and wall panel collections for showroom launch') and coalesce(existing.quantity, '') = '2'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب باكج أثاث غرف فندقية لفندق بوتيك', 'Need hotel room furniture package for boutique property', 'Need hotel room furniture package for boutique property', 96, 'Need bed bases, side tables, lounge chairs, and finish approval samples before production.', 'furniture', 'open', 540, 30, 'required', 'https://picsum.photos/seed/maabar-request-hospitality-furniture-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.jeddah-hospitality-procurement@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need hotel room furniture package for boutique property') and coalesce(existing.quantity, '') = '96'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن محطات عمل مكتبية وطاولات اجتماعات', 'Looking for office workstations and conference tables', 'Looking for office workstations and conference tables', 'One full office floor', 'Need modular layouts, cable management options, and quick sample swatches for approval.', 'furniture', 'open', 230, 40, 'preferred', 'https://picsum.photos/seed/maabar-request-hospitality-furniture-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-office-source@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for office workstations and conference tables') and coalesce(existing.quantity, '') = 'One full office floor'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب علب شحن فاخرة وملصقات باركود لإطلاق مستحضرات تجميل', 'Need premium mailer boxes and barcode labels for cosmetics launch', 'Need premium mailer boxes and barcode labels for cosmetics launch', '18,000 mixed packaging units', 'Looking for shelf-ready premium packaging with Arabic ingredient sticker space and stable color matching.', 'other', 'open', 0.95, 50, 'required', 'https://picsum.photos/seed/maabar-request-packaging-printing-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-beauty-house@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need premium mailer boxes and barcode labels for cosmetics launch') and coalesce(existing.quantity, '') = '18,000 mixed packaging units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن أكواب آمنة غذائياً وتغليف مطبوع للتيك أواي', 'Looking for food-safe cups and takeout print packaging', 'Looking for food-safe cups and takeout print packaging', '55,000 units', 'Need strong grease resistance, carton labeling, and fast replenishment readiness for food outlets.', 'other', 'open', 0.22, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-packaging-printing-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.dammam-food-brand@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for food-safe cups and takeout print packaging') and coalesce(existing.quantity, '') = '55,000 units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب قمصان بولو مطرزة لفرق الخدمة', 'Need embroidered polo uniforms for service teams', 'Need embroidered polo uniforms for service teams', '3,500 pieces across sizes', 'Need durable fabric, color consistency, and size-set samples before mass production.', 'clothing', 'open', 8.5, 30, 'required', 'https://picsum.photos/seed/maabar-request-textiles-apparel-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-uniform-hub@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need embroidered polo uniforms for service teams') and coalesce(existing.quantity, '') = '3,500 pieces across sizes'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن مناشف ومفارش ضيافة', 'Looking for hospitality towels and bedsheet sets', 'Looking for hospitality towels and bedsheet sets', '12,000 mixed linen units', 'Hotel supply batch with repeated replenishment potential. Need absorbency and wash-cycle specs.', 'clothing', 'open', 6.8, 40, 'preferred', 'https://picsum.photos/seed/maabar-request-textiles-apparel-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.makkah-hotel-linen@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for hospitality towels and bedsheet sets') and coalesce(existing.quantity, '') = '12,000 mixed linen units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب عبوات سيروم وعلب وأنابيب ملمع لبراند تجميلي جديد', 'Need serum bottles, jars, and lip gloss tubes for new beauty brand', 'Need serum bottles, jars, and lip gloss tubes for new beauty brand', '28,000 mixed packaging units', 'Need premium finish, color consistency, and Arabic label application space for launch SKUs.', 'other', 'open', 0.68, 40, 'required', 'https://picsum.photos/seed/maabar-request-beauty-packaging-care-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-beauty-house@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need serum bottles, jars, and lip gloss tubes for new beauty brand') and coalesce(existing.quantity, '') = '28,000 mixed packaging units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن أطقم فرش ومنشفات صالون', 'Looking for brush kits and salon towel wraps', 'Looking for brush kits and salon towel wraps', '2,400 mixed units', 'Need salon-grade kits with retail-ready packs and repeatable replenishment lead times.', 'other', 'open', 4.2, 50, 'preferred', 'https://picsum.photos/seed/maabar-request-beauty-packaging-care-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.jeddah-salon-source@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for brush kits and salon towel wraps') and coalesce(existing.quantity, '') = '2,400 mixed units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب صناديق توصيل معزولة وعلب تيك أواي', 'Need insulated delivery boxes and takeaway containers', 'Need insulated delivery boxes and takeaway containers', '7,500 mixed units', 'Looking for food-service durability, stack efficiency, and stable replenishment for delivery operations.', 'food', 'open', 3.4, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-foodservice-kitchen-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.dammam-food-brand@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need insulated delivery boxes and takeaway containers') and coalesce(existing.quantity, '') = '7,500 mixed units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن سخانات بوفيه وموزعات مشروبات للاستخدام الفندقي', 'Looking for buffet warmers and beverage dispensers for hospitality use', 'Looking for buffet warmers and beverage dispensers for hospitality use', 260, 'Need polished stainless finish, replacement part readiness, and project packing by site.', 'food', 'open', 47, 40, 'required', 'https://picsum.photos/seed/maabar-request-foodservice-kitchen-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.makkah-hotel-linen@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for buffet warmers and beverage dispensers for hospitality use') and coalesce(existing.quantity, '') = '260'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'مطلوب دريلات وقفازات وخزائن أدوات لفرق الصيانة', 'Need drill kits, gloves, and tool cabinets for maintenance teams', 'Need drill kits, gloves, and tool cabinets for maintenance teams', '1,200 mixed maintenance units', 'Need consistent industrial packaging, item labeling, and spare-part continuity for maintenance operations.', 'building', 'open', 22, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-industrial-tools-safety-1/1200/900'
from public.profiles p
where p.email = 'seed.trader.riyadh-facility-buying@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Need drill kits, gloves, and tool cabinets for maintenance teams') and coalesce(existing.quantity, '') = '1,200 mixed maintenance units'
  );

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select
  p.id, 'نبحث عن موازين ليزر وأحزمة أمان لتوزيع المقاولين', 'Looking for laser levels and safety harnesses for contractor distribution', 'Looking for laser levels and safety harnesses for contractor distribution', 900, 'Products should suit reseller display, with master carton markings and warranty detail cards.', 'building', 'open', 34, 40, 'required', 'https://picsum.photos/seed/maabar-request-industrial-tools-safety-2/1200/900'
from public.profiles p
where p.email = 'seed.trader.madinah-build-mart@example.com'
  and not exists (
    select 1 from public.requests existing where existing.buyer_id = p.id and lower(existing.title_en) = lower('Looking for laser levels and safety harnesses for contractor distribution') and coalesce(existing.quantity, '') = '900'
  );

commit;
