import Footer from '../components/Footer';
import React from 'react';

export default function Terms({ lang }) {
  const isAr = lang === 'ar';
  return (
    <div className="about-wrap">
      <div className="about-hero">
        <h1 className={`about-title${isAr ? ' ar' : ''}`}>
          {isAr ? 'شروط الخدمة وسياسة الخصوصية' : 'Terms of Service & Privacy Policy'}
        </h1>
      </div>
      <div className="about-body">
        <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 16 }}>{isAr ? 'شروط الخدمة' : 'Terms of Service'}</h2>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'باستخدامك منصة مَعبر، فأنت توافق على هذه الشروط والأحكام.' : 'By using Maabar, you agree to these terms.'}
        </p>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'مَعبر غير مسؤولة عن جودة المنتجات أو التأخير في الشحن.' : 'Maabar is not responsible for product quality or shipping delays.'}
        </p>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'يحق لمَعبر إيقاف أي حساب يخالف سياسة الاستخدام.' : 'Maabar reserves the right to suspend any account that violates usage policies.'}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 16, marginTop: 32 }}>{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h2>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'نحن نجمع البيانات الضرورية فقط لتشغيل المنصة. لا نبيع بياناتك لأي طرف ثالث.' : 'We collect only necessary data. We do not sell your data to third parties.'}
        </p>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'بياناتك محفوظة بأمان على خوادم Supabase المشفرة.' : 'Your data is securely stored on encrypted Supabase servers.'}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 16, marginTop: 32 }}>{isAr ? 'سياسة النزاعات' : 'Dispute Policy'}</h2>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'يمكن للتاجر رفع نزاع خلال 14 يوم. مَعبر تتدخل كطرف محايد وتقرر خلال 5 أيام عمل.' : 'Buyer can raise a dispute within 14 days. Maabar acts as a neutral party and decides within 5 business days.'}
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 16, marginTop: 32 }}>{isAr ? 'العمولة' : 'Commission'}</h2>
        <p className={`about-p${isAr ? ' ar' : ''}`}>
          {isAr ? 'تأخذ مَعبر عمولة 6% من قيمة كل صفقة مكتملة — 4% من المورد و2% من التاجر.' : 'Maabar charges a 6% commission — 4% from supplier and 2% from buyer.'}
        </p>
      </div>
      <Footer lang={lang} />

    </div>
  );
}
