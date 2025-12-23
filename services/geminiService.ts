
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ImageData } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeImage(image: ImageData): Promise<{ summary: string; tags: string[] }> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
              },
            },
            {
              text: "Analyze this image. Provide a concise summary and a list of key objects/features as tags. Return the result in JSON format.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "tags"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse analysis result", e);
      return { summary: "Could not analyze image.", tags: [] };
    }
  }

  async chatAboutImage(image: ImageData, prompt: string, history: { role: string; content: string }[]): Promise<string> {
    const parts = [
      {
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      },
      { text: prompt }
    ];

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: parts
        }
      ],
      config: {
        systemInstruction: "You are an expert visual indexer. Answer questions about the provided image accurately and concisely. Focus on identifying objects, text, colors, and spatial relationships."
      }
    });

    return response.text || "No response received.";
  }
}

export const geminiService = new GeminiService();
