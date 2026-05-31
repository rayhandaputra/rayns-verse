/**
 * Gemini AI Service — Server-only
 *
 * Provides AI-powered utilities for the ERP system.
 * Uses Google Gemini 1.5 Flash for fast, structured responses.
 *
 * Usage:
 *   import { GeminiService } from "~/services/gemini.server";
 *   const result = await GeminiService.analyze({ prompt: "..." });
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const DEFAULT_MODEL = "gemini-1.5-flash";

export interface GeminiResponse {
  success: boolean;
  data?: any;
  text?: string;
  error?: string;
}

export const GeminiService = {
  /**
   * Generate structured JSON response from AI
   *
   * @example
   * const result = await GeminiService.generateJSON({
   *   prompt: "Analisa order ini...",
   *   schema: "{ analysis: string, suggestions: string[] }"
   * });
   */
  generateJSON: async ({
    prompt,
    schema,
    model = DEFAULT_MODEL,
  }: {
    prompt: string;
    schema?: string;
    model?: string;
  }): Promise<GeminiResponse> => {
    try {
      if (!GEMINI_API_KEY) {
        return { success: false, error: "GEMINI_API_KEY not configured" };
      }

      const genModel = genAI.getGenerativeModel({ model });

      const fullPrompt = schema
        ? `${prompt}\n\nFormat output harus JSON valid dengan struktur: ${schema}\nJangan tambahkan markdown code block, langsung JSON saja.`
        : `${prompt}\n\nBerikan response dalam format JSON valid. Jangan tambahkan markdown code block.`;

      const result = await genModel.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      // Clean JSON from markdown if present
      const cleanJson = text.replace(/```json|```/g, "").trim();

      try {
        const parsed = JSON.parse(cleanJson);
        return { success: true, data: parsed, text: cleanJson };
      } catch {
        // If not valid JSON, return as text
        return { success: true, text };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Generate plain text response from AI
   *
   * @example
   * const result = await GeminiService.generateText({
   *   prompt: "Buatkan deskripsi produk untuk..."
   * });
   */
  generateText: async ({
    prompt,
    model = DEFAULT_MODEL,
  }: {
    prompt: string;
    model?: string;
  }): Promise<GeminiResponse> => {
    try {
      if (!GEMINI_API_KEY) {
        return { success: false, error: "GEMINI_API_KEY not configured" };
      }

      const genModel = genAI.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return { success: true, text };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Analyze order data and provide business insights
   *
   * @example
   * const result = await GeminiService.analyzeOrder({
   *   orderData: { items: [...], total: 500000 },
   *   question: "Apakah margin profit order ini sehat?"
   * });
   */
  analyzeOrder: async ({
    orderData,
    question,
  }: {
    orderData: any;
    question: string;
  }): Promise<GeminiResponse> => {
    const prompt = `
Anda adalah analis bisnis ERP untuk perusahaan konveksi (ID card, lanyard, kaos).
Analisa data order berikut dan jawab pertanyaan user.

Data Order:
${JSON.stringify(orderData, null, 2)}

Pertanyaan: ${question}

Berikan jawaban dalam Bahasa Indonesia yang profesional.
Format: { "analysis": "...", "suggestions": ["..."], "risk_level": "low|medium|high" }
    `.trim();

    return GeminiService.generateJSON({ prompt });
  },
};
