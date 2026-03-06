import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async generateActivity(level: string, topic: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a language learning activity for a ${level} level student on the topic of "${topic}". 
      Return a JSON object with:
      - title: string
      - instructions: string
      - exercises: array of { question: string, options: string[], correctIndex: number }
      - conversationPrompt: string (a prompt for the student to respond to)`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async evaluateResponse(userResponse: string, context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate the following language learner's response: "${userResponse}"
      Context: ${context}
      Provide feedback on:
      - grammar: string
      - vocabulary: string
      - overallScore: number (0-100)
      - suggestion: string`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  }
};
