/**
 * Factory display-category grouping.
 *
 * A PURE DISPLAY/CONFIG layer over the real UI_CATEGORIES codes — NOT a schema
 * change. Factories and their products are each tagged with a single REAL code
 * (from supplierDashboardConstants.CATEGORIES); this file groups those codes
 * into 10 trader-facing cards for the Factories landing page. The landing page
 * shows these 10; clicking one lists factories where `category IN codes`.
 *
 * Styling (images, layout, animation) is deferred to the combined design pass.
 */

export const FACTORY_DISPLAY_CATEGORIES = [
  {
    key: 'electrical_home_electronics',
    codes: ['electronics', 'home_appliances'],
    image: '',
    label: { ar: 'الأجهزة الكهربائية وإلكترونيات المنزل', en: 'Electrical Appliances & Home Electronics', zh: '电器与家用电子' },
    desc:  { ar: 'الإلكترونيات الاستهلاكية والأجهزة المنزلية.', en: 'Consumer electronics and home appliances.', zh: '消费电子与家用电器。' },
  },
  {
    key: 'auto_parts_equipment',
    codes: ['auto_parts', 'car_accessories', 'tires', 'lubricants'],
    image: '',
    label: { ar: 'قطع غيار ومعدات السيارات', en: 'Auto Parts & Equipment', zh: '汽车配件与设备' },
    desc:  { ar: 'قطع غيار وإكسسوارات وإطارات وزيوت للمركبات.', en: 'Vehicle parts, accessories, tires, and lubricants.', zh: '汽车配件、周边、轮胎与润滑油。' },
  },
  {
    key: 'industrial_machinery',
    codes: ['industrial_machinery'],
    image: '',
    label: { ar: 'الآلات والمعدات الصناعية', en: 'Industrial Machinery & Equipment', zh: '工业机械与设备' },
    desc:  { ar: 'آلات التصنيع والمعدات الصناعية.', en: 'Manufacturing machinery and industrial equipment.', zh: '生产机械与工业设备。' },
  },
  {
    key: 'building_construction',
    codes: ['building'],
    image: '',
    label: { ar: 'مواد ومستلزمات البناء', en: 'Building & Construction Supplies', zh: '建筑与施工用品' },
    desc:  { ar: 'مواد البناء والأدوات والعدد والتجهيزات.', en: 'Construction materials, tools, hardware, and fixtures.', zh: '建材、工具、五金与配件。' },
  },
  {
    key: 'furniture_decor',
    codes: ['furniture', 'office_furniture', 'bedroom_furniture', 'kitchen_furniture', 'outdoor_furniture', 'home_decor'],
    image: '',
    label: { ar: 'الأثاث وديكور المنزل والمكتب', en: 'Furniture & Home/Office Décor', zh: '家具与家居/办公装饰' },
    desc:  { ar: 'أثاث وديكور للمنزل والمكتب والأماكن الخارجية.', en: 'Home, office, and outdoor furniture and décor.', zh: '家居、办公与户外家具及装饰。' },
  },
  {
    key: 'clothing_footwear',
    codes: ['clothing'],
    image: '',
    label: { ar: 'الملابس والأحذية', en: 'Clothing & Footwear', zh: '服装与鞋类' },
    desc:  { ar: 'ملابس وأحذية بالجملة.', en: 'Wholesale apparel and footwear.', zh: '批发服装与鞋类。' },
  },
  {
    key: 'beauty_personal_care',
    codes: ['beauty'],
    image: '',
    label: { ar: 'العناية والتجميل', en: 'Beauty & Personal Care', zh: '美容与个护' },
    desc:  { ar: 'مستحضرات التجميل ومنتجات العناية الشخصية.', en: 'Cosmetics and personal care products.', zh: '化妆品与个人护理产品。' },
  },
  {
    key: 'toys_kids',
    codes: ['toys'],
    image: '',
    label: { ar: 'الألعاب ومنتجات الأطفال', en: "Toys & Kids' Products", zh: '玩具与儿童用品' },
    desc:  { ar: 'ألعاب ومنتجات للأطفال.', en: 'Toys and children products.', zh: '玩具与儿童产品。' },
  },
  {
    key: 'medical_nonpharma',
    codes: ['health'],
    image: '',
    label: { ar: 'المعدات الطبية والمستلزمات الصحية غير الدوائية', en: 'Medical Equipment & Non-Pharma Health', zh: '医疗设备与非药品健康用品' },
    // Explicit exclusion: pharmaceuticals / SFDA-regulated drugs are out of scope.
    desc:  {
      ar: 'المعدات الطبية والمستلزمات الصحية غير الدوائية. لا يشمل الأدوية والمنتجات الخاضعة لهيئة الغذاء والدواء (خارج النطاق).',
      en: 'Medical equipment and non-pharmaceutical health supplies. Excludes pharmaceuticals and SFDA-regulated drugs (out of scope).',
      zh: '医疗设备与非药品健康用品。不包括药品及 SFDA 监管药物（不在范围内）。',
    },
  },
  {
    key: 'restaurant_hospitality',
    codes: ['packaging', 'hospitality_supplies'],
    image: '',
    label: { ar: 'مستلزمات المطاعم والضيافة', en: 'Restaurant & Hospitality Supplies', zh: '餐饮与酒店用品' },
    desc:  { ar: 'أدوات الطهي التجارية ومعدات المطابخ ومواد التغليف.', en: 'Commercial cookware, kitchen equipment, and packaging.', zh: '商用炊具、厨房设备与包装。' },
  },
];

// Localized list for rendering the landing grid. The category art lives as static
// WebP under public/categories/<key>.webp (matched to each key by filename); an
// explicit `image` on the entry overrides it.
export function displayCategoriesForLang(lang = 'ar') {
  return FACTORY_DISPLAY_CATEGORIES.map((c) => ({
    key: c.key,
    codes: c.codes,
    image: c.image || `/categories/${c.key}.webp`,
    label: c.label[lang] || c.label.en,
    desc: c.desc[lang] || c.desc.en,
  }));
}

export function getFactoryDisplayCategory(key) {
  return FACTORY_DISPLAY_CATEGORIES.find((c) => c.key === key) || null;
}

// Underlying real codes a display category maps to (for `category IN (...)`).
export function codesForDisplayCategory(key) {
  const c = getFactoryDisplayCategory(key);
  return c ? c.codes : [];
}

// Reverse lookup: which display category a real code belongs to (breadcrumbs).
export function displayCategoryForCode(code) {
  return FACTORY_DISPLAY_CATEGORIES.find((c) => c.codes.includes(code)) || null;
}
