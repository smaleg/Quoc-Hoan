
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, TranslationResult } from "./types";

const API_KEY = process.env.API_KEY || "";

export const translateText = async (
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<TranslationResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
  Provide a detailed linguistic breakdown. 
  Text: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      systemInstruction: `Bạn là một chuyên gia ngôn ngữ học hàng đầu về Tạng ngữ (Tibetan) và tiếng Việt. 
      Nhiệm vụ của bạn là dịch thuật chính xác giữa hai ngôn ngữ này, bao gồm cả Tạng ngữ cổ điển và hiện đại.
      Luôn cung cấp phiên âm (Wylie hoặc phonetics), phân tích ngữ pháp, nguồn gốc từ vựng (nếu có) và ví dụ sử dụng.
      Dữ liệu của bạn được tối ưu hóa dựa trên các từ điển Tạng-Việt uy tín nhất.`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING },
          transliteration: { type: Type.STRING },
          grammarAnalysis: { type: Type.STRING },
          etymology: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                translated: { type: Type.STRING }
              },
              required: ["original", "translated"]
            }
          }
        },
        required: ["translatedText", "examples"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as TranslationResult;
};

export const generateSpeech = async (text: string, lang: Language): Promise<Uint8Array | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    // Use a prebuilt voice. Note: Tibetan might require a specific voice or generalized Asian voice if available.
    // Defaulting to a high-quality voice for Vietnamese or a clear neutral voice for others.
    const voiceName = lang === Language.VIETNAMESE ? 'Kore' : 'Puck'; 
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this text clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    return decodeBase64(base64Audio);
  } catch (error) {
    console.error("Speech generation error:", error);
    return null;
  }
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
