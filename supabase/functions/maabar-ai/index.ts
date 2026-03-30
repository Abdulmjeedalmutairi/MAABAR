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

type CustomerSupportPayload = {
  language?: Lang;
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage?: string;
  userProfile?: {
    email?: string;
    role?: string;
    companyName?: string;
    fullName?: string;
  };
};

type RequestBody = {
  task?: 'idea_to_product' | 'chat_translation' | 'customer_support';
  personaName?: string;
  payload?: IdeaToProductPayload | ChatTranslationPayload | CustomerSupportPayload;
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

function buildSupportPrompt(payload: CustomerSupportPayload) {
  const language = payload.language || 'ar';
  const conversation = payload.conversation || [];
  const userProfile = payload.userProfile || {};

  return [
    `Respond in ${getLanguageName(language)}.`,
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
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return json({ error: 'Missing GEMINI_API_KEY secret' }, 500);
    }

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
  "price_estimate": "Estimated target/unit price in USD if possible",
  "moq": "Recommended minimum order quantity",
  "timeline": "Estimated production timeline",
  "request_description": "Professional supplier-ready brief for matching and sourcing",
  "category": "one of: electronics, furniture, clothing, building, food, other"
}
Rules:
- Keep the tone polished, practical, and suitable for a Saudi B2B sourcing flow.
- Always answer content fields in ${getLanguageName(language)}.
- category must remain the English enum only.
- No markdown. No commentary.`;

      const text = await callGemini({
        apiKey,
        systemInstruction,
        prompt: buildIdeaPrompt(payload),
        responseMimeType: 'application/json',
      });

      return json({ result: JSON.parse(text) });
    }

    if (body.task === 'chat_translation') {
      const payload = body.payload as ChatTranslationPayload;

      if (!payload.text || !payload.sourceLanguage || !payload.targetLanguage) {
        return json({ error: 'Translation payload is incomplete' }, 400);
      }

      const systemInstruction = `You are ${personaName}, translating trade chat messages for Maabar.
Translate faithfully from ${getLanguageName(payload.sourceLanguage)} to ${getLanguageName(payload.targetLanguage)}.
Rules:
- Keep business intent, numbers, pricing, and negotiation tone precise.
- Do not add notes, explanations, or quotation marks.
- Return only the translated message text.`;

      const translatedText = await callGemini({
        apiKey,
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
- Be professional, calm, and practical.
- Cover platform guidance broadly: account access, requests, offers, supplier communication, shipping, payments, translation, and onboarding.
- Never invent account-specific data you do not have.
- If human intervention is needed, set escalate=true and direct the user to support@maabar.io or WhatsApp +966 50 424 8942.
- No markdown. No extra commentary.`;

      const text = await callGemini({
        apiKey,
        systemInstruction,
        prompt: buildSupportPrompt(payload),
        responseMimeType: 'application/json',
      });

      return json({ result: JSON.parse(text) });
    }

    return json({ error: 'Unsupported task' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
