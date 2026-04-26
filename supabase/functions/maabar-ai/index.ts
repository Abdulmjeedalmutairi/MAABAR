const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Lang = 'ar' | 'en' | 'zh';

type IdeaToProductPayload = {
  language?: Lang;
  mode?: 'supplier_match' | 'build_product';
  initialIdea?: string;
  questions?: string[];
  answers?: string[];
};

type ChatTranslationPayload = {
  text?: string;
  sourceLanguage?: Lang;
  targetLanguage?: Lang;
  conversationRole?: string;
};

type ProductConversationPayload = {
  language?: Lang;
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage?: string;
  userProfile?: {
    role?: string;
    representativeName?: string;
  };
};

type CustomerSupportPayload = {
  language?: Lang;
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage?: string;
  userProfile?: {
    email?: string;
    role?: string;
    companyName?: string;
    fullName?: string;
    representativeName?: string;
  };
};

type ManagedBriefPayload = {
  language?: Lang;
  title?: string;
  description?: string;
  category?: string;
  quantity?: string | number | null;
  budget?: string | number | null;
  // ISO 4217 — currency the buyer entered the budget in.
  // null/undefined ⇒ legacy row (treat as SAR per migration semantics).
  budget_currency?: string | null;
  response_deadline?: string | null;
};

type RequestBody = {
  task?: 'idea_to_product' | 'product_conversation' | 'chat_translation' | 'customer_support' | 'managed_brief';
  personaName?: string;
  payload?: IdeaToProductPayload | ProductConversationPayload | ChatTranslationPayload | CustomerSupportPayload | ManagedBriefPayload;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getLanguageName(lang: Lang = 'ar') {
  if (lang === 'zh') return '中文';
  if (lang === 'en') return 'English';
  return 'العربية';
}

function getRepresentativeOpening(lang: Lang = 'ar', representativeName = 'سلمان') {
  if (lang === 'zh') return `您好，我是来自 Maabar 的 ${representativeName}。`;
  if (lang === 'en') return `Hello, this is ${representativeName} from Maabar.`;
  return `مرحبا، معك ${representativeName} من معبر.`;
}

async function callGroq({
  apiKey,
  model = 'llama-3.3-70b-versatile',
  systemInstruction,
  prompt,
  responseMimeType,
}: {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  prompt: string;
  responseMimeType?: 'application/json' | 'text/plain';
}) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      ...(responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Groq request failed');
  }

  const text = data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error('Empty Groq response');
  }

  return text;
}

async function callGemini({
  apiKey,
  model = 'gemini-2.0-flash',
  systemInstruction,
  prompt,
  responseMimeType,
}: {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  prompt: string;
  responseMimeType?: 'application/json' | 'text/plain';
}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed');
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Empty Gemini response');
  }

  return text;
}

async function callProvider({
  systemInstruction,
  prompt,
  responseMimeType,
}: {
  systemInstruction: string;
  prompt: string;
  responseMimeType?: 'application/json' | 'text/plain';
}) {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (groqApiKey) {
    return callGroq({
      apiKey: groqApiKey,
      systemInstruction,
      prompt,
      responseMimeType,
    });
  }

  if (geminiApiKey) {
    return callGemini({
      apiKey: geminiApiKey,
      systemInstruction,
      prompt,
      responseMimeType,
    });
  }

  throw new Error('Missing GROQ_API_KEY or GEMINI_API_KEY secret');
}

function buildIdeaPrompt(payload: IdeaToProductPayload) {
  const language = payload.language || 'ar';
  const answers = payload.answers || [];
  const questions = payload.questions || [];

  return [
    `Language: ${language}`,
    `Intent mode: ${payload.mode || 'build_product'}`,
    `Initial idea: ${payload.initialIdea || ''}`,
    ...answers.map((answer, index) => `Question ${index + 1}: ${questions[index] || ''}\nAnswer ${index + 1}: ${answer}`),
  ].join('\n\n');
}

function buildProductConversationPrompt(payload: ProductConversationPayload) {
  const language = payload.language || 'ar';
  const conversation = payload.conversation || [];
  const userProfile = payload.userProfile || {};
  const representativeName = userProfile.representativeName || 'سلمان';

  return [
    `Respond in ${getLanguageName(language)}.`,
    `Use this Saudi representative opening only if this is the first reply: ${getRepresentativeOpening(language, representativeName)}`,
    `First interaction: ${conversation.length === 0 ? 'yes' : 'no'}`,
    `Representative name: ${representativeName}`,
    `User role: ${userProfile.role || 'buyer'}`,
    'Conversation so far:',
    ...conversation.map((message) => `${message.role}: ${message.content}`),
    `Latest user message: ${payload.userMessage || ''}`,
  ].join('\n');
}

function buildSupportPrompt(payload: CustomerSupportPayload) {
  const language = payload.language || 'ar';
  const conversation = payload.conversation || [];
  const userProfile = payload.userProfile || {};
  const representativeName = userProfile.representativeName || 'سلمان';

  return [
    `Respond in ${getLanguageName(language)}.`,
    `Use this Saudi representative opening only if this is the first reply: ${getRepresentativeOpening(language, representativeName)}`,
    `First interaction: ${conversation.length === 0 ? 'yes' : 'no'}`,
    `Representative name: ${representativeName}`,
    `User role: ${userProfile.role || 'guest'}`,
    `User company: ${userProfile.companyName || ''}`,
    `User name: ${userProfile.fullName || ''}`,
    'Conversation so far:',
    ...conversation.map((message) => `${message.role}: ${message.content}`),
    `Latest user message: ${payload.userMessage || ''}`,
  ].join('\n');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {

    const body = (await request.json()) as RequestBody;
    const personaName = body.personaName || 'وكيل معبر';

    if (!body.task || !body.payload) {
      return json({ error: 'Missing task or payload' }, 400);
    }

    if (body.task === 'idea_to_product') {
      const payload = body.payload as IdeaToProductPayload;
      const language = payload.language || 'ar';
      const systemInstruction = `You are ${personaName}, Maabar's sourcing and manufacturing agent.
Return ONLY valid JSON with these exact fields:
{
  "product_name_ar": "اسم المنتج بالعربي",
  "product_name_en": "Product name in English",
  "product_name_zh": "产品中文名",
  "specs": "Key specifications and user requirements",
  "factory_type": "Type of supplier or factory needed",
  "city": "Best Chinese manufacturing city",
  "price_estimate": "Leave this empty unless the user explicitly provided a target price",
  "moq": "Recommended minimum order quantity",
  "timeline": "Estimated production timeline",
  "request_description": "Professional supplier-ready brief for matching and sourcing",
  "category": "one of: electronics, furniture, clothing, building, food, other"
}
Rules:
- Keep the tone polished, practical, human, and suitable for a Saudi B2B sourcing flow.
- Always answer content fields in ${getLanguageName(language)}.
- Do not ask about payment method.
- Do not invent or estimate prices unless the user explicitly gave a target price; otherwise keep price_estimate empty.
- category must remain the English enum only.
- No emojis.
- No markdown. No commentary.`;

      const text = await callProvider({
        systemInstruction,
        prompt: buildIdeaPrompt(payload),
        responseMimeType: 'application/json',
      });

      return json({ result: JSON.parse(text) });
    }

    if (body.task === 'product_conversation') {
      const payload = body.payload as ProductConversationPayload;
      const language = payload.language || 'ar';
      const systemInstruction = `You are ${personaName}, Maabar's product idea and manufacturing conversation agent.
Return ONLY valid JSON with this exact shape:
{
  "reply": "Human-like assistant reply",
  "intent": "build_product|supplier_match|clarify",
  "nextStep": "continue|brief_ready|supplier_ready",
  "enoughInfo": false
}
Rules:
- Respond only in ${getLanguageName(language)}. Do not mix in English, Chinese, or other languages unless the user explicitly asks.
- Sound like a real Saudi Maabar representative, not a support bot.
- If this is the first reply in the conversation, open with the representative introduction from the prompt.
- If the user greets you, greet back naturally.
- If the user has a product idea, help shape the idea before sending them to suppliers.
- If the user clearly wants supplier matching and the available information is already enough, set nextStep to supplier_ready and enoughInfo to true.
- If the user declines adding more details, do not keep looping; decide whether the current information is enough and move forward when possible.
- Do not ask about payment method.
- Do NOT rush to say "create a request" or "contact suppliers" unless the idea is reasonably clear.
- Ask at most one concise follow-up question at a time.
- Understand short, fragmented, typo-heavy, or colloquial Saudi Arabic messages.
- Do not assume the user's gender unless it is explicit.
- No emojis.
- No markdown.
- No robotic phrases.`;
      const text = await callProvider({
        systemInstruction,
        prompt: buildProductConversationPrompt(payload),
        responseMimeType: 'application/json',
      });

      return json({ result: JSON.parse(text) });
    }

    if (body.task === 'chat_translation') {
      const payload = body.payload as ChatTranslationPayload;

      if (!payload.text || !payload.sourceLanguage || !payload.targetLanguage) {
        return json({ error: 'Translation payload is incomplete' }, 400);
      }

      const systemInstruction = `You are ${personaName}, Maabar's expert trade translator specializing in Saudi-China B2B communication.

TRANSLATION TASK:
Faithfully translate from ${getLanguageName(payload.sourceLanguage)} to ${getLanguageName(payload.targetLanguage)}.

CONTEXT & DOMAIN EXPERTISE:
- Platform: Maabar (مَعبر) - Saudi B2B marketplace connecting Saudi merchants with Chinese suppliers
- Communication types: Product inquiries, price negotiations, MOQ discussions, shipping/logistics, payment terms, sample requests, quality control, contracts
- Industries: Electronics, furniture, clothing, building materials, food products, general merchandise
- Cultural nuance: Respect Saudi business etiquette and Chinese manufacturing culture

CRITICAL RULES:
1. PRESERVE EXACTLY:
   - Numbers, prices, quantities, measurements, dates, percentages
   - Product specifications (materials, dimensions, colors, weights)
   - Technical terms and industry jargon
   - Names, addresses, contact information

2. ADAPT APPROPRIATELY:
   - Business tone: Professional yet approachable
   - Formality level: Match the original message's formality
   - Cultural references: Explain or adapt when necessary
   - Idioms/expressions: Translate meaning, not word-for-word

3. LANGUAGE-SPECIFIC GUIDELINES:
   - Arabic (العربية): Use Modern Standard Arabic (MSA) for formal business communication
   - Chinese (中文): Use simplified Chinese (普通话) with clear manufacturing/business terminology
   - English: Use international business English, clear and unambiguous

4. ABSOLUTE PROHIBITIONS:
   - Do NOT add explanations, notes, or commentary
   - Do NOT use emojis, markdown, or special formatting
   - Do NOT change the message intent or business purpose
   - Do NOT summarize or omit details
   - Do NOT add quotation marks around the translation

OUTPUT REQUIREMENT:
Return ONLY the translated text, nothing else.`;

      const translatedText = await callProvider({
        systemInstruction,
        prompt: `Conversation role: ${payload.conversationRole || 'trade_chat'}\nMessage:\n${payload.text}`,
        responseMimeType: 'text/plain',
      });

      return json({ translatedText });
    }

    if (body.task === 'customer_support') {
      const payload = body.payload as CustomerSupportPayload;
      const language = payload.language || 'ar';
      const systemInstruction = `You are ${personaName}, Maabar's 24/7 customer support agent.
Return ONLY valid JSON with this exact shape:
{
  "reply": "Short helpful support reply",
  "supportArea": "accounts|orders|payments|suppliers|shipping|translation|general",
  "suggestedActions": ["Action 1", "Action 2", "Action 3"],
  "escalate": false
}
Rules:
- Respond in ${getLanguageName(language)}.
- Sound like a real Saudi Maabar representative: elegant, natural, professional, never robotic.
- If this is the first reply in the conversation, open with the representative introduction provided in the prompt.
- Cover platform guidance broadly: account access, requests, offers, supplier communication, shipping, payments, translation, and onboarding.
- Never invent account-specific data you do not have.
- If human intervention is needed, set escalate=true and direct the user to support@maabar.io or WhatsApp +966 50 424 8942.
- No emojis.
- No markdown. No extra commentary.`;

      const text = await callProvider({
        systemInstruction,
        prompt: buildSupportPrompt(payload),
        responseMimeType: 'application/json',
      });

      return json({ result: JSON.parse(text) });
    }

    if (body.task === 'managed_brief') {
      const payload = body.payload as ManagedBriefPayload;
      const language = payload.language || 'ar';
      const nowIso = new Date().toISOString();

      const systemInstruction = `You are ${personaName}, Maabar's sourcing analyst. You receive a raw buyer B2B sourcing request and produce a structured internal brief used for supplier matching.

Return ONLY valid JSON with this exact shape:
{
  "cleaned_description": "<rewritten requirement, typos fixed, filler removed, 1-3 short paragraphs, in the buyer's language>",
  "extracted_specs": [{ "key": "<snake_case_key>", "value": "<value>", "unit": "<unit or null>", "confidence": "high|medium|low" }],
  "category": "electronics|furniture|clothing|building|food|other",
  "priority": "urgent|normal",
  "ai_confidence": "high|medium|low",
  "supplier_brief": {
    "ar": "<2-4 short supplier-facing lines, Arabic>",
    "en": "<2-4 short supplier-facing lines, English>",
    "zh": "<2-4 short supplier-facing lines, Simplified Chinese>"
  },
  "admin_follow_up_question": "<one concise question in the buyer's language | null>",
  "admin_internal_notes": "<admin-only observations in the buyer's language | null>"
}

Rules:
- cleaned_description: rewrite the raw prose into a crisp, unambiguous technical requirement. Stay in the buyer's language (${getLanguageName(language)}). Fix typos, remove filler. Never invent missing facts.
- extracted_specs: only specs that are actually stated or strongly implied. Use snake_case keys (material, quantity, color, size, finish, certification, lead_time_days, tolerance, packaging, target_unit_cost, etc.). Include unit when numeric. confidence reflects how firmly the text supports the value.
- category: pick the closest enum; never invent new ones.
- priority: urgent only if (a) the response_deadline is within ~14 days of the server-provided "now" OR (b) the description contains explicit urgency words (عاجل, مستعجل, urgent, asap, rush, 紧急, 加急). Otherwise normal.
- ai_confidence: high if quantity AND at least two meaningful specs AND use-case are all known; medium if one dimension is thin; low if multiple critical dimensions are missing.
- supplier_brief: 2-4 short lines per language, supplier-facing. Must NOT contain buyer identity, payment terms, budget, or internal notes. Include product class, key specs, quantity, deadline if present, origin expectations.
- admin_follow_up_question: set to a single concise question only if ai_confidence is "low" or "medium". null if "high".
- admin_internal_notes: one or two short lines of admin-only observations (unrealistic budget, missing certification, possible duplicate, etc.). null if nothing to flag.
- No emojis. No markdown. No commentary outside the JSON.`;

      const prompt = [
        `Buyer language: ${language}`,
        `Server time now (ISO): ${nowIso}`,
        `Title: ${payload.title || ''}`,
        `Raw description: ${payload.description || ''}`,
        `Form-selected category: ${payload.category || ''}`,
        `Quantity: ${payload.quantity ?? ''}`,
        `Budget per unit (optional): ${payload.budget ?? ''}${payload.budget_currency ? ' ' + payload.budget_currency : ''}`,
        `Response deadline (ISO, optional): ${payload.response_deadline || ''}`,
      ].join('\n');

      const text = await callProvider({
        systemInstruction,
        prompt,
        responseMimeType: 'application/json',
      });

      return json({ result: JSON.parse(text) });
    }

    return json({ error: 'Unsupported task' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
