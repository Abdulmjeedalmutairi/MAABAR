import {
  MAABAR_AI_ENDPOINT,
  MAABAR_AI_HEADERS,
  MAABAR_AI_LEGACY_PROXY_ENDPOINT,
  MAABAR_AI_PERSONA_NAME,
  MAABAR_AI_TASKS,
} from './config';

function getLanguageName(language = 'ar') {
  if (language === 'zh') return '中文';
  if (language === 'en') return 'English';
  return 'العربية';
}

function getRepresentativeOpening(language = 'ar', representativeName = 'سلمان') {
  if (language === 'zh') return `您好，我是来自 Maabar 的 ${representativeName}。`;
  if (language === 'en') return `Hello, this is ${representativeName} from Maabar.`;
  return `مرحبا، معك ${representativeName} من معبر.`;
}

function stripCodeFence(text = '') {
  return text.replace(/```json|```/g, '').trim();
}

async function callLegacyProxy(system, messages) {
  const response = await fetch(MAABAR_AI_LEGACY_PROXY_ENDPOINT, {
    method: 'POST',
    headers: MAABAR_AI_HEADERS,
    body: JSON.stringify({ system, messages }),
  });

  const data = await response.json().catch(() => ({}));
  const text = data?.content?.[0]?.text || '';

  if (!response.ok || !text) {
    throw new Error(data?.error || `Legacy AI proxy failed with status ${response.status}`);
  }

  return text;
}

async function requestMaabarAI(task, payload) {
  try {
    const response = await fetch(MAABAR_AI_ENDPOINT, {
      method: 'POST',
      headers: MAABAR_AI_HEADERS,
      body: JSON.stringify({
        task,
        personaName: MAABAR_AI_PERSONA_NAME,
        payload,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.error) {
      throw new Error(data?.error || `AI request failed with status ${response.status}`);
    }

    return data;
  } catch (_error) {
    return requestLegacyMaabarAI(task, payload);
  }
}

async function requestLegacyMaabarAI(task, payload) {
  if (task === MAABAR_AI_TASKS.IDEA_TO_PRODUCT) {
    const prompt = [
      `Language: ${payload.language}`,
      `User intent mode: ${payload.mode}`,
      `Original user message: ${payload.initialIdea}`,
      ...(payload.answers || []).map((answer, index) => `Q${index + 1}: ${payload.questions?.[index] || ''}\nA${index + 1}: ${answer}`),
    ].join('\n\n');

    const text = await callLegacyProxy(
      `You are ${MAABAR_AI_PERSONA_NAME}, Maabar's sourcing and manufacturing agent.
Return ONLY valid JSON with these exact fields:
{
  "product_name_ar": "اسم المنتج بالعربي",
  "product_name_en": "Product name in English",
  "product_name_zh": "产品中文名",
  "specs": "Key specifications and user requirements",
  "factory_type": "Type of supplier or factory needed",
  "city": "Best Chinese manufacturing city",
  "price_estimate": "Estimated target/unit price in USD if possible",
  "moq": "Recommended minimum order quantity",
  "timeline": "Estimated production timeline",
  "request_description": "Professional supplier-ready brief for matching and sourcing",
  "category": "one of: electronics, furniture, clothing, building, food, other"
}
Rules:
- Keep text professional, concise, commercial, and natural.
- Always respond in ${getLanguageName(payload.language)} for all content fields.
- category must stay in English enum.
- No emojis.
- No markdown. No extra commentary.`,
      [{ role: 'user', content: prompt }]
    );

    return { result: JSON.parse(stripCodeFence(text)) };
  }

  if (task === MAABAR_AI_TASKS.PRODUCT_CONVERSATION) {
    const representativeName = payload.userProfile?.representativeName || 'سلمان';
    const conversation = payload.conversation || [];
    const text = await callLegacyProxy(
      `You are ${MAABAR_AI_PERSONA_NAME}, Maabar's product idea and manufacturing conversation agent.
Return ONLY valid JSON with this exact shape:
{
  "reply": "Human-like assistant reply",
  "intent": "build_product|supplier_match|clarify",
  "nextStep": "continue|brief_ready|supplier_ready",
  "enoughInfo": false
}
Rules:
- Respond only in ${getLanguageName(payload.language)}. Do not mix in other languages unless the user explicitly asks.
- Sound human, elegant, practical, and Saudi in tone.
- If this is the first reply, open with: ${getRepresentativeOpening(payload.language, representativeName)}
- If the user greets you, greet back naturally.
- If the user is describing a product idea, help shape the idea before suggesting suppliers.
- Do not rush to tell them to post a request unless the concept is already clear.
- Ask only one concise follow-up question at a time.
- Understand short and typo-heavy Arabic.
- Do not assume the user's gender unless it is explicit.
- No emojis.
- No markdown. No extra commentary.`,
      [{ role: 'user', content: `Conversation: ${JSON.stringify(conversation)}\nUser message: ${payload.userMessage}` }]
    );

    return { result: JSON.parse(stripCodeFence(text)) };
  }

  if (task === MAABAR_AI_TASKS.CHAT_TRANSLATION) {
    const text = await callLegacyProxy(
      `You are ${MAABAR_AI_PERSONA_NAME}, a trade translator for Maabar.
Translate the message from ${getLanguageName(payload.sourceLanguage)} to ${getLanguageName(payload.targetLanguage)}.
Keep all numbers, negotiation tone, and business meaning accurate.
Do not add emojis.
Return only the translated text.`,
      [{ role: 'user', content: payload.text }]
    );

    return { translatedText: stripCodeFence(text) };
  }

  if (task === MAABAR_AI_TASKS.CUSTOMER_SUPPORT) {
    const representativeName = payload.userProfile?.representativeName || 'سلمان';
    const conversation = payload.conversation || [];
    const text = await callLegacyProxy(
      `You are ${MAABAR_AI_PERSONA_NAME}, Maabar's 24/7 customer support agent.
Return ONLY valid JSON with this exact shape:
{
  "reply": "Short helpful support reply",
  "supportArea": "accounts|orders|payments|suppliers|shipping|translation|general",
  "suggestedActions": ["Action 1", "Action 2", "Action 3"],
  "escalate": false
}
Rules:
- Respond in ${getLanguageName(payload.language)}.
- Sound human, elegant, and professional.
- If this is the first reply, open with: ${getRepresentativeOpening(payload.language, representativeName)}
- If manual follow-up is needed, set escalate=true.
- No emojis.
- No markdown. No extra commentary.`,
      [{ role: 'user', content: `Conversation: ${JSON.stringify(conversation)}\nUser message: ${payload.userMessage}` }]
    );

    return { result: JSON.parse(stripCodeFence(text)) };
  }

  throw new Error(`Unsupported AI task: ${task}`);
}

export async function generateIdeaToProductReport({
  language,
  mode,
  initialIdea,
  questions,
  answers,
}) {
  const data = await requestMaabarAI(MAABAR_AI_TASKS.IDEA_TO_PRODUCT, {
    language,
    mode,
    initialIdea,
    questions,
    answers,
  });

  return data.result;
}

export async function requestProductConversationReply({
  language,
  conversation,
  userMessage,
  userProfile,
}) {
  const data = await requestMaabarAI(MAABAR_AI_TASKS.PRODUCT_CONVERSATION, {
    language,
    conversation,
    userMessage,
    userProfile,
  });

  return data.result;
}

export async function translateChatMessage({
  text,
  sourceLanguage,
  targetLanguage,
  conversationRole = 'trade_chat',
}) {
  const data = await requestMaabarAI(MAABAR_AI_TASKS.CHAT_TRANSLATION, {
    text,
    sourceLanguage,
    targetLanguage,
    conversationRole,
  });

  return data.translatedText || '';
}

export async function requestSupportReply({
  language,
  conversation,
  userMessage,
  userProfile,
}) {
  const data = await requestMaabarAI(MAABAR_AI_TASKS.CUSTOMER_SUPPORT, {
    language,
    conversation,
    userMessage,
    userProfile,
  });

  return data.result;
}
