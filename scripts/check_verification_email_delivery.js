const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const SEND_EMAILS_URL = `${SUPABASE_URL}/functions/v1/send-email`;
const EMAIL_REDIRECT_SUPPLIER = 'https://maabar.io/auth/callback?next=%2Fdashboard&role=supplier';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function rand(prefix='t'){ return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`; }
function decodeHtml(s=''){ return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x2F;/g,'/').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>'); }
function extractUrl(text=''){ const m=decodeHtml(text).match(/https?:\/\/[^\s"'<>]+/i); return m?m[0]:null; }
async function jfetch(url, options={}){ const res=await fetch(url, options); const text=await res.text(); let data; try{ data=JSON.parse(text);}catch{data=text;} return {res,text,data}; }
async function createMailbox(tag){
  const dom=await jfetch('https://api.mail.tm/domains');
  const domain=dom.data?.['hydra:member']?.[0]?.domain;
  const address=`${rand(tag)}@${domain}`;
  const password=rand('P');
  let r=await jfetch('https://api.mail.tm/accounts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address,password})});
  if(!r.res.ok) throw new Error(r.text);
  r=await jfetch('https://api.mail.tm/token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address,password})});
  if(!r.res.ok) throw new Error(r.text);
  return {address,password,token:r.data.token};
}
async function listSubjects(mailbox){
  const list=await jfetch('https://api.mail.tm/messages',{headers:{Authorization:`Bearer ${mailbox.token}`}});
  const items=list.data?.['hydra:member']||[];
  return items.map(x=>({id:x.id,subject:x.subject,intro:x.intro}));
}
async function waitForSubject(mailbox, matcher, timeoutMs=120000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    const list=await jfetch('https://api.mail.tm/messages',{headers:{Authorization:`Bearer ${mailbox.token}`}});
    const items=list.data?.['hydra:member']||[];
    for(const item of items){
      if(matcher(item.subject||'', item.intro||'')) return item;
    }
    await sleep(4000);
  }
  return null;
}
function sbClient(){ return createClient(SUPABASE_URL, SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch}}); }

(async()=>{
  const mailbox=await createMailbox('vsup');
  const password='Aa!23456sup';
  const sb=sbClient();
  const signup=await sb.auth.signUp({
    email: mailbox.address,
    password,
    options:{
      emailRedirectTo: EMAIL_REDIRECT_SUPPLIER,
      data:{role:'supplier',status:'registered',company_name:`Email Retest ${rand('Co')}`,country:'China',city:'Shenzhen',trade_link:'https://example.com/company'}
    }
  });
  if(signup.error) throw signup.error;
  let confirmMail=null;
  const start=Date.now();
  while(Date.now()-start<120000){
    const list=await jfetch('https://api.mail.tm/messages',{headers:{Authorization:`Bearer ${mailbox.token}`}});
    const items=list.data?.['hydra:member']||[];
    if(items.length){
      const msg=await jfetch(`https://api.mail.tm/messages/${items[0].id}`,{headers:{Authorization:`Bearer ${mailbox.token}`}});
      const body=[msg.data?.text,msg.data?.html?.join('\n'),msg.text].filter(Boolean).join('\n');
      const url=extractUrl(body);
      if(url){ confirmMail={subject:msg.data?.subject,intro:msg.data?.intro,url}; break; }
    }
    await sleep(4000);
  }
  if(!confirmMail) throw new Error('No confirmation email');
  const confirmHit=await fetch(confirmMail.url,{redirect:'manual'});
  const signin=await sb.auth.signInWithPassword({email:mailbox.address,password});
  if(signin.error) throw signin.error;
  const userId=signin.data.user.id;
  const emailCall=await jfetch(SEND_EMAILS_URL,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${SUPABASE_ANON_KEY}`},body:JSON.stringify({type:'supplier_verification_submitted',data:{recipientUserId:userId,name:'Email Retest',lang:'en'}})});
  const received=await waitForSubject(mailbox,(sub,intro)=>/under review/i.test(sub)||/Verification Submitted/i.test(intro)||/Your verification is now under review/i.test(intro),120000);
  console.log(JSON.stringify({mailbox:mailbox.address,confirmSubject:confirmMail.subject,confirmIntro:confirmMail.intro,confirmStatus:confirmHit.status,emailCallStatus:emailCall.res.status,emailCallPayload:emailCall.data,subjects:await listSubjects(mailbox),verificationMail:received},null,2));
})().catch(err=>{console.error('FATAL',err.message||err); if(err.stack) console.error(err.stack); process.exit(1);});
