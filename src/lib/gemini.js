const API_KEY = import.meta.env.VITE_AI_API_KEY;
const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Cliente LLM usando xAI (Grok).
 * Reemplaza db.integrations.Core.InvokeLLM de Base44.
 * Soporta prompt de texto, texto extraído de PDF, y respuesta JSON estructurada.
 */
export async function invokeLLM(params) {
  const { prompt, response_json_schema } = params;

  const systemMessage = response_json_schema
    ? 'Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, sin bloques de código.'
    : 'Eres un asistente médico experto en contenido clínico hospitalario.';

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
  ];

  const body = {
    model: MODEL,
    messages,
    temperature: 0.3,
  };

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error API: HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  if (response_json_schema) {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) return JSON.parse(match[1]);
      throw new Error('La IA no devolvió JSON válido');
    }
  }

  return text;
}
