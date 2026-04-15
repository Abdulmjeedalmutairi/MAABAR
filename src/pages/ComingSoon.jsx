import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import usePageTitle from '../hooks/usePageTitle';

const TRANSLATIONS = {
  ar: {
    title: 'معبر قريباً',
    subtitle: 'منصة ربط التجار السعوديين بالموردين الصينيين',
    supplierSection: {
      title: 'المورد الصيني',
      desc: 'انضم كأحد الموردين المعتمدين. ارفع منتجاتك وأكمل ملفك التجاري.',
      cta: 'ابدأ كـ مورد',
      features: [
        'رفع المنتجات بسهولة',
        'تحديد الأسعار والمواصفات',
        'إكمال الملف التجاري',
        'استقبال طلبات الشراء مباشرة'
      ]
    },
    traderSection: {
      title: 'التاجر السعودي',
      desc: 'سجل الآن كأحد أوائل التجار على المنصة.',
      cta: 'سجل كـ تاجر',
      founderNote: 'إذا كنت من أول 20 تاجر، ستحصل على ميزات التاجر المؤسس.',
      notFounderNote: 'نأسف، أنت لست من أول 20 تاجر. يمكنك التسجيل والانتظار حتى الإطلاق الرسمي.',
      checking: 'جاري التحقق...'
    },
    previewAccess: {
      title: 'معاينة المنصة',
      desc: 'رابط خاص للمعاينة قبل الإطلاق الرسمي',
      cta: 'معاينة المنصة'
    },
    footer: '© 2026 معبر. جميع الحقوق محفوظة.'
  },
  en: {
    title: 'Maabar Coming Soon',
    subtitle: 'Connecting Saudi traders with Chinese suppliers',
    supplierSection: {
      title: 'Chinese Supplier',
      desc: 'Join as a verified supplier. Upload your products and complete your business profile.',
      cta: 'Start as Supplier',
      features: [
        'Easy product upload',
        'Set prices and specifications',
        'Complete business profile',
        'Receive direct purchase requests'
      ]
    },
    traderSection: {
      title: 'Saudi Trader',
      desc: 'Register now as one of the first traders on the platform.',
      cta: 'Register as Trader',
      founderNote: 'If you are among the first 20 traders, you will get Founder Trader benefits.',
      notFounderNote: 'Sorry, you are not among the first 20 traders. You can register and wait for official launch.',
      checking: 'Checking...'
    },
    previewAccess: {
      title: 'Preview Access',
      desc: 'Special link for preview before official launch',
      cta: 'Preview Platform'
    },
    footer: '© 2026 Maabar. All rights reserved.'
  },
  zh: {
    title: 'Maabar 即将上线',
    subtitle: '连接沙特贸易商与中国供应商',
    supplierSection: {
      title: '中国供应商',
      desc: '加入成为认证供应商。上传产品并完善您的商业资料。',
      cta: '成为供应商',
      features: [
        '轻松上传产品',
        '设定价格和规格',
        '完善商业资料',
        '直接接收采购请求'
      ]
    },
    traderSection: {
      title: '沙特贸易商',
      desc: '立即注册成为平台首批贸易商。',
      cta: '注册成为贸易商',
      founderNote: '如果您是前20名贸易商，您将获得创始贸易商权益。',
      notFounderNote: '抱歉，您不在前20名贸易商之内。您可以注册并等待正式上线。',
      checking: '检查中...'
    },
    previewAccess: {
      title: '预览访问',
      desc: '正式上线前的特别预览链接',
      cta: '预览平台'
    },
    footer: '© 2026 Maabar。保留所有权利。'
  }
};

// Simulate checking if trader is among first 20 (placeholder)
const checkIfFounderTrader = async () => {
  // This should be replaced with actual API call to check profile count
  // For now, simulate random
  return Math.random() > 0.5;
};

export default function ComingSoon({ lang = 'ar', user, profile }) {
  const navigate = useNavigate();
  const [currentLang, setCurrentLang] = useState(lang);
  const [isFounderTrader, setIsFounderTrader] = useState(null);
  const [loading, setLoading] = useState(false);

  usePageTitle('coming-soon', currentLang);

  useEffect(() => {
    // Set language from localStorage or default
    const stored = localStorage.getItem('maabar_lang');
    if (stored && ['ar', 'en', 'zh'].includes(stored)) {
      setCurrentLang(stored);
    }
  }, []);

  const handleSetLang = (newLang) => {
    setCurrentLang(newLang);
    localStorage.setItem('maabar_lang', newLang);
  };

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

  const handleSupplierClick = () => {
    navigate('/supplier-access');
  };

  const handleTraderClick = async () => {
    setLoading(true);
    // Simulate API call to check founder status
    const isFounder = await checkIfFounderTrader();
    setIsFounderTrader(isFounder);
    setLoading(false);
    if (isFounder) {
      navigate('/login/buyer?mode=signup&founder=true');
    } else {
      // Show message (could be modal or inline)
      // For now, navigate with parameter
      navigate('/login/buyer?mode=signup&founder=false');
    }
  };

  const handlePreviewClick = () => {
    navigate('/supplier-access');
  };

  return (
    <div dir={currentLang === 'ar' ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: currentLang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)',
      color: '#1a1a1a',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrandLogo size={40} />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>معبر</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Maabar</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleSetLang('ar')}
            style={{
              background: currentLang === 'ar' ? '#1a1a1a' : 'transparent',
              color: currentLang === 'ar' ? '#fff' : '#1a1a1a',
              border: '1px solid #ccc',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            عربي
          </button>
          <button
            onClick={() => handleSetLang('en')}
            style={{
              background: currentLang === 'en' ? '#1a1a1a' : 'transparent',
              color: currentLang === 'en' ? '#fff' : '#1a1a1a',
              border: '1px solid #ccc',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            English
          </button>
          <button
            onClick={() => handleSetLang('zh')}
            style={{
              background: currentLang === 'zh' ? '#1a1a1a' : 'transparent',
              color: currentLang === 'zh' ? '#fff' : '#1a1a1a',
              border: '1px solid #ccc',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            中文
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        marginBottom: '60px',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: '800',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          {t.title}
        </h2>
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: '#555',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          {t.subtitle}
        </p>
        <div style={{
          display: 'inline-block',
          background: '#1a1a1a',
          color: '#fff',
          padding: '8px 24px',
          borderRadius: '30px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          قيد التطوير • Coming Soon • 即将上线
        </div>
      </div>

      {/* Main Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        maxWidth: '1000px',
        margin: '0 auto 60px'
      }}>
        {/* Supplier Section */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid #eaeaea',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              {t.supplierSection.title}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
              {t.supplierSection.title}
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              {t.supplierSection.desc}
            </p>
          </div>
          <ul style={{ margin: '0 0 30px', padding: '0', listStyle: 'none', flexGrow: 1 }}>
            {t.supplierSection.features.map((feature, idx) => (
              <li key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                fontSize: '15px'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  background: '#f0f4ff',
                  color: '#667eea',
                  borderRadius: '50%',
                  marginRight: '12px',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={handleSupplierClick}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              width: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {t.supplierSection.cta}
          </button>
        </div>

        {/* Trader Section */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid #eaeaea',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              {t.traderSection.title}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
              {t.traderSection.title}
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
              {t.traderSection.desc}
            </p>
          </div>
          <div style={{ flexGrow: 1, marginBottom: '30px' }}>
            {isFounderTrader === null && !loading && (
              <p style={{ color: '#667eea', fontWeight: '500' }}>
                {t.traderSection.founderNote}
              </p>
            )}
            {loading && (
              <p style={{ color: '#888' }}>{t.traderSection.checking}</p>
            )}
            {isFounderTrader === false && (
              <div style={{
                background: '#fff9e6',
                border: '1px solid #ffd166',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '20px'
              }}>
                <p style={{ color: '#cc8500', margin: 0, fontSize: '14px' }}>
                  {t.traderSection.notFounderNote}
                </p>
              </div>
            )}
            {isFounderTrader === true && (
              <div style={{
                background: '#e6f7f0',
                border: '1px solid #34d399',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '20px'
              }}>
                <p style={{ color: '#059669', margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  🎉 تهانينا! أنت من أوائل 20 تاجر (تاجر مؤسس)
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleTraderClick}
            disabled={loading}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              width: '100%',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? t.traderSection.checking : t.traderSection.cta}
          </button>
        </div>
      </div>

      {/* Preview Access */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto 40px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px dashed #ccc'
        }}>
          <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
            {t.previewAccess.title}
          </h3>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
            {t.previewAccess.desc}
          </p>
          <button
            onClick={handlePreviewClick}
            style={{
              background: 'transparent',
              color: '#1a1a1a',
              border: '2px solid #1a1a1a',
              padding: '12px 32px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#1a1a1a';
            }}
          >
            {t.previewAccess.cta}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        color: '#888',
        fontSize: '14px',
        padding: '20px 0',
        borderTop: '1px solid #eaeaea',
        marginTop: '40px'
      }}>
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}