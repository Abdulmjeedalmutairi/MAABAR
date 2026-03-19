import React from 'react';
const T = {
  ar: { title:'عن مَعبر', p1:'مَعبر هي منصة B2B تربط التاجرن السعوديين بالموردين الصينيين.', p2:'نؤمن أن التجارة بين السعودية والصين يجب أن تكون أسهل وأكثر شفافية.', p3:'المنصة تدعم ثلاث لغات: العربية والإنجليزية والصينية.' },
  en: { title:'About Maabar', p1:'Maabar is a B2B platform connecting Saudi buyers with Chinese suppliers.', p2:'We believe Saudi-China trade should be simpler and more transparent.', p3:'The platform supports three languages: Arabic, English, and Chinese.' },
  zh: { title:'关于Maabar', p1:'Maabar是连接沙特买家与中国供应商的B2B平台。', p2:'我们相信沙中贸易应该更简单透明。', p3:'平台支持三种语言。' }
};
export default function About({ lang }) {
  const t = T[lang] || T.ar;
  return (
    <div style={{minHeight:'100vh',paddingTop:72,background:'#FAF8F4'}}>
      <div style={{padding:'100px 60px 60px',borderBottom:'1px solid #e8e4de'}}>
        <h1 style={{fontSize:64,fontWeight:300,marginBottom:24}}>{t.title}</h1>
      </div>
      <div style={{padding:60,maxWidth:800}}>
        <p style={{fontSize:16,lineHeight:1.9,color:'#6b6b6b',marginBottom:24}}>{t.p1}</p>
        <p style={{fontSize:16,lineHeight:1.9,color:'#6b6b6b',marginBottom:24}}>{t.p2}</p>
        <p style={{fontSize:16,lineHeight:1.9,color:'#6b6b6b'}}>{t.p3}</p>
      </div>
    </div>
  );
}