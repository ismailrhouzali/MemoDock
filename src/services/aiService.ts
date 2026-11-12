import { AppSettings } from '../db/types';

export type AIAction =
  | 'summarize'
  | 'grammar'
  | 'rewrite'
  | 'bullets'
  | 'explain'
  | 'ideas'
  | 'translate';

export interface AIPromptOptions {
  action: AIAction;
  text: string;
  targetLanguage?: string;
  customInstruction?: string;
}

export async function executeAIRequest(
  options: AIPromptOptions,
  settings: AppSettings
): Promise<string> {
  const { action, text, targetLanguage = 'Spanish', customInstruction } = options;

  if (!settings.aiApiKey) {
    throw new Error(
      'No AI API Key configured. Please go to Settings to add your Gemini, OpenAI, or custom API key.'
    );
  }

  let prompt = '';
  switch (action) {
    case 'summarize':
      prompt = `Provide a concise, clear summary of the following text:\n\n${text}`;
      break;
    case 'grammar':
      prompt = `Correct any spelling, grammar, and punctuation mistakes in the following text while preserving its original meaning and tone. Return only the corrected text:\n\n${text}`;
      break;
    case 'rewrite':
      prompt = `Rewrite and polish the following text to make it more articulate, elegant, and readable. Return only the rewritten text:\n\n${text}`;
      break;
    case 'bullets':
      prompt = `Convert the key points of the following text into a clean, structured bullet-point list:\n\n${text}`;
      break;
    case 'explain':
      prompt = `Explain the following concept or technical content in simple, understandable terms:\n\n${text}`;
      break;
    case 'ideas':
      prompt = `Based on the following content, brainstorm 5 creative and actionable ideas, next steps, or related insights:\n\n${text}`;
      break;
    case 'translate':
      prompt = `Translate the following text accurately into ${targetLanguage}. Return only the translation:\n\n${text}`;
      break;
  }

  if (customInstruction) {
    prompt += `\n\nAdditional instruction: ${customInstruction}`;
  }

  if (settings.aiProvider === 'gemini') {
    return callGemini(prompt, settings);
  } else if (settings.aiProvider === 'openai') {
    return callOpenAI(prompt, settings);
  } else {
    return callCustomProvider(prompt, settings);
  }
}

async function callGemini(prompt: string, settings: AppSettings): Promise<string> {
  const model = settings.aiModel || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.aiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text.trim();
}

async function callOpenAI(prompt: string, settings: AppSettings): Promise<string> {
  const model = settings.aiModel || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.aiApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a minimalist, highly intelligent writing assistant embedded in a personal notebook.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('OpenAI API returned an empty response.');
  }

  return text.trim();
}

async function callCustomProvider(prompt: string, settings: AppSettings): Promise<string> {
  const baseUrl = settings.aiBaseUrl || 'http://localhost:11434/v1';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const model = settings.aiModel || 'llama3';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.aiApiKey ? { Authorization: `Bearer ${settings.aiApiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Custom AI Provider Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Custom AI API returned an empty response.');
  }

  return text.trim();
}

