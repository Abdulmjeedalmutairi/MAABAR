import { useEffect } from 'react';

const TITLES = {
  ar: {
    home:         'مَعبر | استورد من الصين بدون وسطاء',
    login:        'تسجيل الدخول | مَعبر',
    dashboard:    'لوحة التحكم | مَعبر',
    requests:     'الطلبات | مَعبر',
    products:     'المنتجات | مَعبر',
    suppliers:    'الموردين | مَعبر',
    supplier:     'بوابة الموردين | مَعبر',
    about:        'عن مَعبر',
    contact:      'تواصل معنا | مَعبر',
    support:      'دعم معبر 24/7 | مَعبر',
    faq:          'الأسئلة الشائعة | مَعبر',
    terms:        'الشروط والأحكام | مَعبر',
    checkout:     'إتمام الدفع | مَعبر',
    admin:        'لوحة الأدمن | مَعبر',
  },
  en: {
    home:         'Maabar | Import from China Without Middlemen',
    login:        'Sign In | Maabar',
    dashboard:    'Dashboard | Maabar',
    requests:     'Requests | Maabar',
    products:     'Products | Maabar',
    suppliers:    'Suppliers | Maabar',
    supplier:     'Supplier Portal | Maabar',
    about:        'About Maabar',
    contact:      'Contact Us | Maabar',
    support:      'Maabar Support 24/7 | Maabar',
    faq:          'FAQ | Maabar',
    terms:        'Terms & Conditions | Maabar',
    checkout:     'Checkout | Maabar',
    admin:        'Admin | Maabar',
  },
  zh: {
    home:         'Maabar | 无中间商从中国进口',
    login:        '登录 | Maabar',
    dashboard:    '控制台 | Maabar',
    requests:     '需求 | Maabar',
    products:     '产品 | Maabar',
    suppliers:    '供应商 | Maabar',
    supplier:     '供应商门户 | Maabar',
    about:        '关于 Maabar',
    contact:      '联系我们 | Maabar',
    support:      'Maabar 24/7 支持 | Maabar',
    faq:          '常见问题 | Maabar',
    terms:        '条款与条件 | Maabar',
    checkout:     '结账 | Maabar',
    admin:        '管理员 | Maabar',
  },
};

export default function usePageTitle(page, lang) {
  useEffect(() => {
    const titles = TITLES[lang] || TITLES.ar;
    document.title = titles[page] || 'مَعبر | Maabar';
  }, [page, lang]);
}
