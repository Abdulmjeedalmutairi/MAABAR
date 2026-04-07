const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL='https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const EMAIL_REDIRECT_SUPPLIER='https://maabar.io/auth/callback?next=%2Fdashboard&role=supplier';
const EMAIL_REDIRECT_BUYER='https://maabar.io/auth/callback?next=%2Fdashboard&role=buyer';
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function rand(p='t'){return `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;}
function decodeHtml(s=''){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x2F;/g,'/').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function extractUrl(text=''){const m=decodeHtml(text).match(/https?:\/\/[^\s"'<>]+/i);return m?m[0]:null;}
async function jfetch(url,opt={}){const res=await fetch(url,opt);const text=await res.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {res,text,data};}
async function createMailbox(tag){const dom=await jfetch('https://api.mail.tm/domains');const domain=dom.data['hydra:member'][0].domain;const address=`${rand(tag)}@${domain}`;const password=rand('P');let r=await jfetch('https://api.mail.tm/accounts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address,password})});if(!r.res.ok) throw new Error(r.text);r=await jfetch('https://api.mail.tm/token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address,password})});if(!r.res.ok) throw new Error(r.text);return {address,password,token:r.data.token};}
async function waitConfirm(mailbox){const start=Date.now();while(Date.now()-start<120000){const list=await jfetch('https://api.mail.tm/messages',{headers:{Authorization:`Bearer ${mailbox.token}`}});const items=list.data['hydra:member']||[];if(items.length){const msg=await jfetch(`https://api.mail.tm/messages/${items[0].id}`,{headers:{Authorization:`Bearer ${mailbox.token}`}});const url=extractUrl([msg.data?.text,msg.data?.html?.join('\n'),msg.text].filter(Boolean).join('\n'));if(url) return fetch(url,{redirect:'manual'});}await sleep(4000);}throw new Error('confirm timeout');}
function sb(){return createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch}});}
(async()=>{
 const supMail=await createMailbox('osup');
 const buyMail=await createMailbox('obuy');
 const supPass='Aa!23456sup';
 const buyPass='Aa!23456buy';
 const sup=sb(); const buy=sb();
 let r=await sup.auth.signUp({email:supMail.address,password:supPass,options:{emailRedirectTo:EMAIL_REDIRECT_SUPPLIER,data:{role:'supplier',status:'registered',company_name:`Offer Test ${rand('Co')}`,country:'China',city:'Shenzhen',trade_link:'https://example.com/company'}}}); if(r.error) throw r.error;
 r=await buy.auth.signUp({email:buyMail.address,password:buyPass,options:{emailRedirectTo:EMAIL_REDIRECT_BUYER,data:{role:'buyer',status:'active',full_name:'Offer Buyer',phone:'+966500000001',city:'Riyadh'}}}); if(r.error) throw r.error;
 await waitConfirm(supMail); await waitConfirm(buyMail);
 let s=await sup.auth.signInWithPassword({email:supMail.address,password:supPass}); if(s.error) throw s.error; const supId=s.data.user.id;
 let b=await buy.auth.signInWithPassword({email:buyMail.address,password:buyPass}); if(b.error) throw b.error; const buyId=b.data.user.id;
 const req=await buy.from('requests').insert({buyer_id:buyId,title_ar:'اختبار منع عرض',title_en:'Offer lock test',title_zh:'报价锁测试',quantity:50,description:'minimal offer lock test',category:'other',status:'open',payment_plan:30,sample_requirement:'required'}).select('id').single(); if(req.error) throw req.error;
 const offer=await sup.from('offers').insert({request_id:req.data.id,supplier_id:supId,price:10,moq:50,delivery_days:7,status:'pending'}).select('id,status').single();
 console.log(JSON.stringify({supplier:supMail.address,buyer:buyMail.address,request:req.data,offerError:offer.error?.message||null,offerData:offer.data||null},null,2));
})().catch(err=>{console.error('FATAL',err.message||err); if(err.stack) console.error(err.stack); process.exit(1);});
