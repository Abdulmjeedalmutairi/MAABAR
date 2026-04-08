const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const SEND_EMAILS_URL = `${SUPABASE_URL}/functions/v1/send-email`;
const EMAIL_REDIRECT_SUPPLIER = 'https://maabar.io/auth/callback?next=%2Fdashboard&role=supplier';
const EMAIL_REDIRECT_BUYER = 'https://maabar.io/auth/callback?next=%2Fdashboard&role=buyer';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(prefix='t') { return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`; }
function decodeHtml(s='') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function extractUrl(text='') {
  const decoded = decodeHtml(text);
  const match = decoded.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}
async function jfetch(url, options={}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { res, data, text };
}

async function createMailbox(tag) {
  const domRes = await jfetch('https://api.mail.tm/domains');
  const domain = domRes.data?.['hydra:member']?.[0]?.domain;
  if (!domain) throw new Error(`mail.tm domain fetch failed: ${domRes.text}`);
  const address = `${rand(tag)}@${domain}`;
  const password = rand('P');
  const create = await jfetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!create.res.ok) throw new Error(`mail.tm account create failed for ${address}: ${create.text}`);
  const token = await jfetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!token.res.ok) throw new Error(`mail.tm token failed for ${address}: ${token.text}`);
  return { address, password, token: token.data?.token };
}

async function waitForMailboxLink(mailbox, label, timeoutMs=180000) {
  const started = Date.now();
  while ((Date.now() - started) < timeoutMs) {
    const list = await jfetch('https://api.mail.tm/messages', {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });
    const items = list.data?.['hydra:member'] || [];
    if (items.length) {
      for (const item of items) {
        const msg = await jfetch(`https://api.mail.tm/messages/${item.id}`, {
          headers: { Authorization: `Bearer ${mailbox.token}` },
        });
        const body = [msg.data?.text, msg.data?.html?.join('\n'), msg.text].filter(Boolean).join('\n');
        const url = extractUrl(body);
        if (url) return { url, message: msg.data };
      }
    }
    await sleep(4000);
  }
  throw new Error(`Timed out waiting for ${label} email at ${mailbox.address}`);
}

async function confirmLink(url) {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, location: res.headers.get('location') };
}

function sbClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  });
}

async function signUpSupplier(sb, mailbox, password) {
  return sb.auth.signUp({
    email: mailbox.address,
    password,
    options: {
      emailRedirectTo: EMAIL_REDIRECT_SUPPLIER,
      data: {
        role: 'supplier',
        status: 'registered',
        company_name: `Retest Supplier ${rand('Co')}`,
        whatsapp: '+8613000000000',
        wechat: rand('wechat'),
        trade_link: 'https://example.com/company',
        trade_links: ['https://example.com/company'],
        speciality: 'general goods',
        country: 'China',
        city: 'Shenzhen',
      },
    },
  });
}

async function signUpBuyer(sb, mailbox, password) {
  return sb.auth.signUp({
    email: mailbox.address,
    password,
    options: {
      emailRedirectTo: EMAIL_REDIRECT_BUYER,
      data: {
        role: 'buyer',
        status: 'active',
        full_name: 'Retest Buyer',
        phone: '+966500000000',
        city: 'Riyadh',
        company_name: 'Retest Buyer Co',
      },
    },
  });
}

async function signIn(sb, email, password) {
  const r = await sb.auth.signInWithPassword({ email, password });
  if (r.error) throw r.error;
  return r.data;
}

async function fetchOwnProfile(sb, userId) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

async function run() {
  const report = {
    startedAt: new Date().toISOString(),
    evidence: {},
    tests: [],
    cleanup: {},
  };
  const supplierMailbox = await createMailbox('sup');
  const buyerMailbox = await createMailbox('buy');
  const supplierPassword = 'Aa!23456sup';
  const buyerPassword = 'Aa!23456buy';

  report.evidence.supplierMailbox = supplierMailbox.address;
  report.evidence.buyerMailbox = buyerMailbox.address;

  const supAnon = sbClient();
  const buyAnon = sbClient();

  const supplierSignup = await signUpSupplier(supAnon, supplierMailbox, supplierPassword);
  report.evidence.supplierSignup = { error: supplierSignup.error?.message || null, userId: supplierSignup.data?.user?.id || null, sessionReturned: !!supplierSignup.data?.session };
  if (supplierSignup.error) throw supplierSignup.error;

  const buyerSignup = await signUpBuyer(buyAnon, buyerMailbox, buyerPassword);
  report.evidence.buyerSignup = { error: buyerSignup.error?.message || null, userId: buyerSignup.data?.user?.id || null, sessionReturned: !!buyerSignup.data?.session };
  if (buyerSignup.error) throw buyerSignup.error;

  const supConfirm = await waitForMailboxLink(supplierMailbox, 'supplier signup');
  const buyConfirm = await waitForMailboxLink(buyerMailbox, 'buyer signup');
  report.evidence.supplierConfirmMailSubject = supConfirm.message?.subject || null;
  report.evidence.buyerConfirmMailSubject = buyConfirm.message?.subject || null;
  report.evidence.supplierConfirmHit = await confirmLink(supConfirm.url);
  report.evidence.buyerConfirmHit = await confirmLink(buyConfirm.url);

  const supplierSb = sbClient();
  const buyerSb = sbClient();
  const supplierAuth = await signIn(supplierSb, supplierMailbox.address, supplierPassword);
  const buyerAuth = await signIn(buyerSb, buyerMailbox.address, buyerPassword);
  const supplierUser = supplierAuth.user;
  const buyerUser = buyerAuth.user;
  report.evidence.supplierUserId = supplierUser.id;
  report.evidence.buyerUserId = buyerUser.id;

  const initialSupplierProfile = await fetchOwnProfile(supplierSb, supplierUser.id);
  const initialBuyerProfile = await fetchOwnProfile(buyerSb, buyerUser.id);
  report.evidence.initialSupplierProfile = {
    id: initialSupplierProfile.id,
    role: initialSupplierProfile.role,
    status: initialSupplierProfile.status,
    maabar_supplier_id: initialSupplierProfile.maabar_supplier_id || null,
    company_name: initialSupplierProfile.company_name,
  };
  report.evidence.initialBuyerProfile = {
    id: initialBuyerProfile.id,
    role: initialBuyerProfile.role,
    status: initialBuyerProfile.status,
  };

  // Control check: supplier can still update ordinary fields.
  const ordinaryUpdate = await supplierSb.from('profiles').update({ company_description: 'post-hotfix retest ordinary update ok' }).eq('id', supplierUser.id).select('company_description').single();
  report.tests.push({
    key: 'ordinary_profile_update',
    ok: !ordinaryUpdate.error,
    result: ordinaryUpdate.error ? ordinaryUpdate.error.message : ordinaryUpdate.data,
  });

  // 1) Protected profile fields cannot be self-changed.
  const sensitiveAttempt = await supplierSb.from('profiles').update({ status: 'verified', role: 'admin', maabar_supplier_id: 'SELF-SET' }).eq('id', supplierUser.id).select('id,status,role,maabar_supplier_id').single();
  const supplierAfterSensitive = await fetchOwnProfile(supplierSb, supplierUser.id);
  report.tests.push({
    key: 'self_change_sensitive_profile_fields',
    ok: !!sensitiveAttempt.error && supplierAfterSensitive.status === initialSupplierProfile.status && supplierAfterSensitive.role === initialSupplierProfile.role && (supplierAfterSensitive.maabar_supplier_id || null) === (initialSupplierProfile.maabar_supplier_id || null),
    error: sensitiveAttempt.error?.message || null,
    after: {
      status: supplierAfterSensitive.status,
      role: supplierAfterSensitive.role,
      maabar_supplier_id: supplierAfterSensitive.maabar_supplier_id || null,
    },
  });

  // Buyer creates an open request for offer/chat tests.
  const requestInsert = await buyerSb.from('requests').insert({
    buyer_id: buyerUser.id,
    title_ar: 'طلب اختبار بعد hotfix',
    title_en: 'Post-hotfix retest request',
    title_zh: 'Hotfix 后复测需求',
    quantity: 100,
    description: 'live security retest request',
    category: 'other',
    status: 'open',
    payment_plan: 30,
    sample_requirement: 'required',
  }).select('id,status,buyer_id').single();
  if (requestInsert.error) throw requestInsert.error;
  report.evidence.request = requestInsert.data;

  // 2) Unverified supplier cannot bypass UI to create an offer.
  const offerAttempt = await supplierSb.from('offers').insert({
    request_id: requestInsert.data.id,
    supplier_id: supplierUser.id,
    price: 12.5,
    shipping_cost: 4,
    shipping_method: 'sea',
    moq: 100,
    delivery_days: 15,
    origin: 'China',
    note: 'bypass retest',
    status: 'accepted',
  }).select('id,status').single();
  report.tests.push({
    key: 'unverified_supplier_offer_insert_blocked',
    ok: !!offerAttempt.error,
    error: offerAttempt.error?.message || null,
  });

  // 3) Unverified supplier cannot send live chat messages.
  const msgAttempt = await supplierSb.from('messages').insert({
    sender_id: supplierUser.id,
    receiver_id: buyerUser.id,
    content: 'supplier live chat bypass retest',
  }).select('id').single();
  report.tests.push({
    key: 'unverified_supplier_message_send_blocked',
    ok: !!msgAttempt.error,
    error: msgAttempt.error?.message || null,
  });

  // Secondary message control from buyer to supplier should also be blocked while supplier unverified.
  const buyerMsgAttempt = await buyerSb.from('messages').insert({
    sender_id: buyerUser.id,
    receiver_id: supplierUser.id,
    content: 'buyer to unverified supplier retest',
  }).select('id').single();
  report.tests.push({
    key: 'buyer_to_unverified_supplier_message_blocked',
    ok: !!buyerMsgAttempt.error,
    error: buyerMsgAttempt.error?.message || null,
  });

  // 4) Normal supplier verification submission still works after lockdown.
  const verificationFieldUpdate = await supplierSb.from('profiles').update({
    reg_number: rand('REG-'),
    years_experience: 5,
    num_employees: 20,
    license_photo: 'https://example.com/license.jpg',
    factory_photo: 'https://example.com/factory.jpg',
    factory_images: ['https://example.com/factory.jpg'],
    factory_videos: [],
    company_description: 'Verification submission retest',
  }).eq('id', supplierUser.id).select('reg_number,years_experience,license_photo,factory_photo').single();
  report.tests.push({
    key: 'verification_fields_update_allowed',
    ok: !verificationFieldUpdate.error,
    error: verificationFieldUpdate.error?.message || null,
  });

  const submitRpc = await supplierSb.rpc('submit_supplier_verification');
  const submitResult = Array.isArray(submitRpc.data) ? submitRpc.data[0] : submitRpc.data;
  report.tests.push({
    key: 'submit_supplier_verification_rpc',
    ok: !submitRpc.error && submitResult?.status === 'verification_under_review',
    error: submitRpc.error?.message || null,
    status: submitResult?.status || null,
  });

  const supplierAfterSubmit = await fetchOwnProfile(supplierSb, supplierUser.id);
  report.evidence.supplierAfterSubmit = {
    status: supplierAfterSubmit.status,
    role: supplierAfterSubmit.role,
    maabar_supplier_id: supplierAfterSubmit.maabar_supplier_id || null,
  };

  // 5) Notification + email path for verification submission works live.
  const notificationInsert = await supplierSb.from('notifications').insert({
    user_id: supplierUser.id,
    type: 'verification_submitted',
    title_ar: 'تم إرسال التحقق وبات الحساب الآن تحت المراجعة',
    title_en: 'Your verification was submitted and is now under review',
    title_zh: '您的认证已提交，账户现已进入审核中',
    ref_id: supplierUser.id,
    is_read: false,
  }).select('id,type,user_id,created_at').single();
  report.tests.push({
    key: 'verification_notification_insert',
    ok: !notificationInsert.error,
    error: notificationInsert.error?.message || null,
    row: notificationInsert.data || null,
  });

  const emailCall = await jfetch(SEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      type: 'supplier_verification_submitted',
      data: {
        recipientUserId: supplierUser.id,
        name: supplierAfterSubmit.company_name || supplierMailbox.address.split('@')[0],
        lang: 'en',
      },
    }),
  });
  report.tests.push({
    key: 'verification_email_function_call',
    ok: emailCall.res.ok,
    status: emailCall.res.status,
    payload: emailCall.data,
  });

  const verificationMail = await waitForMailboxLink(supplierMailbox, 'supplier verification submitted', 120000);
  report.tests.push({
    key: 'verification_email_received',
    ok: !!verificationMail.message,
    subject: verificationMail.message?.subject || null,
    intro: verificationMail.message?.intro || null,
  });

  // 6) Regression spot-check: supplier in under-review is still blocked from offers/messages.
  const offerUnderReviewAttempt = await supplierSb.from('offers').insert({
    request_id: requestInsert.data.id,
    supplier_id: supplierUser.id,
    price: 13,
    shipping_cost: 5,
    shipping_method: 'air',
    moq: 100,
    delivery_days: 10,
    origin: 'China',
    note: 'under review retest',
  }).select('id').single();
  report.tests.push({
    key: 'under_review_supplier_offer_still_blocked',
    ok: !!offerUnderReviewAttempt.error,
    error: offerUnderReviewAttempt.error?.message || null,
  });

  const msgUnderReviewAttempt = await supplierSb.from('messages').insert({
    sender_id: supplierUser.id,
    receiver_id: buyerUser.id,
    content: 'under-review chat retest',
  }).select('id').single();
  report.tests.push({
    key: 'under_review_supplier_message_still_blocked',
    ok: !!msgUnderReviewAttempt.error,
    error: msgUnderReviewAttempt.error?.message || null,
  });

  // Chat read spot-check: query pair after blocked inserts; expected empty result, but this is only a weak signal.
  const messageSelect = await supplierSb.from('messages').select('id,sender_id,receiver_id,content').or(`and(sender_id.eq.${supplierUser.id},receiver_id.eq.${buyerUser.id}),and(sender_id.eq.${buyerUser.id},receiver_id.eq.${supplierUser.id})`);
  report.tests.push({
    key: 'supplier_message_read_query_after_lock',
    ok: !messageSelect.error,
    count: messageSelect.data?.length ?? null,
    note: 'empty result here is only supportive; no pre-existing conversation was available to prove read-denial against existing rows',
    error: messageSelect.error?.message || null,
  });

  console.log(JSON.stringify(report, null, 2));
}

run().catch((err) => {
  console.error('FATAL', err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
