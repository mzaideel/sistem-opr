import { GoogleGenAI } from "@google/genai";

/**
 * Fungsi untuk menjana impak dan refleksi secara automatik menggunakan Gemini AI.
 * Membantu guru menulis refleksi program yang profesional dan formal.
 */
export const generateAIImpact = async (title: string, category: string, objectives: string[]) => {
  // Sentiasa gunakan process.env.API_KEY untuk kunci API yang telah dikonfigurasikan dalam persekitaran
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Anda adalah pakar penulisan laporan sekolah (One Page Report - OPR). Sila jana perenggan "Impak & Refleksi" yang profesional, formal, dan berimpak tinggi dalam Bahasa Melayu untuk program/aktiviti berikut:
  
Tajuk Program: ${title}
Kategori: ${category}
Objektif: ${objectives.filter(o => o && o.trim() !== '').join(', ')}

Sila berikan respon dalam satu perenggan yang mengandungi 3-4 ayat yang padat. Fokus kepada keberkesanan program, pencapaian objektif, dan nilai tambah positif kepada murid serta sekolah. Jangan sertakan sebarang format markdown (seperti **bold** atau #) atau simbol tambahan. Terus berikan teks refleksi sahaja.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Mengambil teks dari response menggunakan property .text mengikut garis panduan SDK terkini
    return response.text?.trim() || 'Gagal menjana refleksi. Sila cuba lagi.';
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return 'Ralat semasa menghubungi AI. Sila pastikan sambungan internet stabil atau cuba lagi seketika.';
  }
};
