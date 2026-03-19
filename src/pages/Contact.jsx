import React from 'react';
const T = {
  ar: { title:'تواصل معنا', sub:'نحن هنا للمساعدة.', wa:'واتساب', email:'البريد الإلكتروني' },
  en: { title:'Contact Us', sub:'We are here to help.', wa:'WhatsApp', email:'Email' },
  zh: { title:'联系我们', sub:'我们随时为您提供帮助。', wa:'WhatsApp', email:'电子邮件' }
};
export default function Contact({ lang }) {
  const t = T[lang] || T.ar;
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FAF8F4',padding:'100px 24px'}}>
      <div style={{background:'#fff',border:'1px solid #e8e4de',padding:'64px 48px',width:'100%',maxWidth:480,textAlign:'center'}}>
        <h2 style={{fontSize:42,fontWeight:300,marginBottom:12}}>{t.title}</h2>
        <p style={{color:'#6b6b6b',fontSize:15,marginBottom:48}}>{t.sub}</p>
        <a href="https://wa.me/9665XXXXXXXX" style={styles.btn}>
          <span style={{fontSize:24}}>💬</span>
          <div style={{flex:1,textAlign:'right'}}>
            <p style={{fontSize:11,letterSpacing:2,color:'#6b6b6b',marginBottom:4}}>{t.wa}</p>
            <p style={{fontSize:15,fontWeight:500}}>+966 5X XXX XXXX</p>
          </div>
        </a>
        <a href="mailto:hello@maabar.com" style={styles.btn}>
          <span style={{fontSize:24}}>✉️</span>
          <div style={{flex:1,textAlign:'right'}}>
            <p style={{fontSize:11,letterSpacing:2,color:'#6b6b6b',marginBottom:4}}>{t.email}</p>
            <p style={{fontSize:15,fontWeight:500}}>hello@maabar.com</p>
          </div>
        </a>
      </div>
    </div>
  );
}
const styles = {
  btn: { display:'flex',alignItems:'center',gap:16,padding:'20px 28px',border:'1px solid #e8e4de',background:'#fff',textDecoration:'none',color:'#1a1a1a',marginBottom:12,borderRadius:3 }
};