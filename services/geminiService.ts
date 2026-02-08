
import { GoogleGenAI } from "@google/genai";

/**
 * Safely retrieves the API key from process.env.API_KEY.
 * This handles potential ReferenceErrors in browser environments where 'process' is not defined globally.
 */
const getApiKey = (): string => {
  try {
    // import.meta.env 방식 (Vite 표준)
    const viteKey = import.meta.env?.VITE_API_KEY;
    if (viteKey) {
      console.log('Using VITE_API_KEY from import.meta.env');
      return viteKey;
    }
    
    // process.env 방식 (define으로 주입된 값)
    if (process.env.VITE_API_KEY) {
      console.log('Using VITE_API_KEY from process.env');
      return process.env.VITE_API_KEY;
    }
    
    if (process.env.GEMINI_API_KEY) {
      console.log('Using GEMINI_API_KEY from process.env');
      return process.env.GEMINI_API_KEY;
    }
    
    if (process.env.API_KEY) {
      console.log('Using API_KEY from process.env');
      return process.env.API_KEY;
    }
    
    console.error('All API key sources failed');
    throw new Error('API_KEY not found in any environment variables');
  } catch (e) {
    console.error("Error accessing API Key:", e);
    throw e;
  }
};
/**
 * Creates a new instance of the GoogleGenAI client.
 * Strictly uses the value from process.env.API_KEY.
 */
const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "API_KEY를 찾을 수 없습니다. Vercel Dashboard의 'Environment Variables' 항목에 'API_KEY'라는 이름으로 키가 등록되어 있는지 확인해주세요. 설정 후에는 Redeploy가 필요합니다."
    );
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Utility to retry an async function for robustness
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`API 호출 실패, 재시도 중... (남은 횟수: ${retries})`, error);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return withRetry(fn, retries - 1);
  }
}

export const generateRecipe = async (ingredients: string) => {
  return withRetry(async () => {
    const ai = getAiClient();
    const prompt = `Act as a world-class chef. Recommend a delicious recipe using these ingredients: ${ingredients}. 
    Provide the output in Korean. Format the response as a clear title, ingredient list, and step-by-step instructions. 
    Keep it professional but encouraging.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!response.text) {
      throw new Error("레시피 텍스트를 생성하지 못했습니다.");
    }
    return response.text;
  });
};

export const generateFoodImage = async (recipeTitle: string) => {
  return withRetry(async () => {
    const ai = getAiClient();
    const prompt = `A professional, high-quality food photography of ${recipeTitle}. Realistic, cinematic lighting, 8k resolution, appetizing presentation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};

export const editImageWithText = async (base64Image: string, editPrompt: string) => {
  return withRetry(async () => {
    const ai = getAiClient();
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const base64Data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};
