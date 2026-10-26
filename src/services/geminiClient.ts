import { GoogleGenAI } from '@google/genai';

/**
 * Retrieves the Gemini API key from environment variables at build or runtime.
 * Never hardcoded.
 */
export const getGeminiApiKey = (): string => {
  const envKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
};

export const hasClientGeminiKey = (): boolean => {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 5);
};

export const getDirectGenAIClient = (): GoogleGenAI | null => {
  const key = getGeminiApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};
