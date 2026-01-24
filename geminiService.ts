import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

/**
 * Fungsi untuk meningkatkan laporan menggunakan Gemini.
 * Inisialisasi GoogleGenAI dilakukan mengikut garis panduan rasmi dengan process.env.API_KEY.
 */
export const enhanceReport = async (title: string, currentObjective: string, impact: string): Promise<{enhancedObjective: string, enhancedImpact: string} | null> => {
  // Always use the process.env.API_KEY directly for initialization.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Tingkatkan laporan aktiviti ini (OPR - One Page Reporting). 
      Tajuk: ${title}
      Objektif Sedia Ada: ${currentObjective}
      Impak Sedia Ada: ${impact}
      
      Sila berikan versi yang lebih profesional dan formal dalam Bahasa Melayu untuk 'Objektif' dan 'Impak/Refleksi'.
      Pastikan ia sesuai untuk semakan prestasi sekolah atau korporat.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedObjective: { type: Type.STRING },
            enhancedImpact: { type: Type.STRING }
          },
          required: ["enhancedObjective", "enhancedImpact"]
        }
      }
    });

    // Access the extracted text output directly from the .text property.
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Kegagalan peningkatan Gemini:", error);
    return null;
  }
};