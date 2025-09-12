import { GoogleGenAI, Type } from "@google/genai";
import { NutritionalAnalysisData } from '../types';

// IMPORTANT: Hardcoding API keys is not a recommended practice for production applications.
// This is done here as per the user's specific request.
// In a real-world scenario, this should be an environment variable.
const API_KEY = "AIzaSyCtu-1v1Gx_DUXP0seYnKDOpf8vpcAOryM";

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        nomePrato: { type: Type.STRING, description: "O nome do prato, ex: 'Feijoada Completa'." },
        description: { type: Type.STRING, description: "Uma breve descrição do prato tradicional." },
        calorias: { type: Type.NUMBER, description: "Total de calorias estimado para uma porção de 100g." },
        carboidratos: { type: Type.NUMBER, description: "Total de carboidratos em gramas." },
        proteinas: { type: Type.NUMBER, description: "Total de proteínas em gramas." },
        gorduras: { type: Type.NUMBER, description: "Total de gorduras em gramas." },
        notaSaude: { type: Type.NUMBER, description: "Nota de 0 a 10 para a saúde do prato." },
        pros: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Uma lista de 3 pontos positivos (prós) sobre a saúde do prato."
        },
        cons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Uma lista de 3 pontos negativos (contras) sobre a saúde do prato."
        }
    },
    required: ["nomePrato", "description", "calorias", "carboidratos", "proteinas", "gorduras", "notaSaude", "pros", "cons"],
};


export const analyzeMealImage = async (base64Image: string, mimeType: string): Promise<Omit<NutritionalAnalysisData, 'data' | 'imageUrl'>> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: "Analise a imagem deste prato. Identifique os alimentos, crie um nome para o prato, e forneça uma breve descrição. Estime as informações nutricionais (calorias, carboidratos, proteínas, gorduras) para uma porção de 100g. Dê uma nota de 0 a 10 para o quão saudável é. Liste 3 pontos positivos (prós) e 3 negativos (contras) sobre o prato. Responda apenas com o JSON seguindo o schema.",
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    // Validation
    if (
      typeof result.nomePrato !== 'string' ||
      typeof result.description !== 'string' ||
      typeof result.calorias !== 'number' ||
      typeof result.carboidratos !== 'number' ||
      typeof result.proteinas !== 'number' ||
      typeof result.gorduras !== 'number' ||
      typeof result.notaSaude !== 'number' ||
      !Array.isArray(result.pros) ||
      !Array.isArray(result.cons) ||
      !result.pros.every((p: any) => typeof p === 'string') ||
      !result.cons.every((c: any) => typeof c === 'string')
    ) {
      throw new Error("Resposta da API em formato inválido.");
    }

    return result;

  } catch (error) {
    console.error("Erro ao analisar imagem com a API Gemini:", error);
    throw new Error("Não foi possível analisar a imagem. Tente novamente.");
  }
};
