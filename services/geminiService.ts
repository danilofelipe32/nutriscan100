import { GoogleGenAI, Type } from "@google/genai";
import { NutritionalAnalysisData } from '../types';

// API key is hardcoded as requested to ensure functionality on Netlify without environment variables.
const ai = new GoogleGenAI({ apiKey: "AIzaSyCtu-1v1Gx_DUXP0seYnKDOpf8vpcAOryM" });

const nutrientInfoSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nome do nutriente (ex: 'Calorias', 'Ferro')." },
        quantity: { type: Type.STRING, description: "Quantidade com unidade (ex: '200 kcal', '2.5mg')." },
        dailyValue: { type: Type.STRING, description: "Percentual do Valor Diário (ex: '10%')." }
    },
    required: ["name", "quantity", "dailyValue"]
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        nomePrato: { type: Type.STRING, description: "O nome do prato, ex: 'Salada com Frango Grelhado'." },
        description: { type: Type.STRING, description: "Uma breve descrição do prato." },
        calorias: { type: Type.NUMBER, description: "Total de calorias (apenas o número)." },
        carboidratos: { type: Type.NUMBER, description: "Total de carboidratos em gramas (apenas o número)." },
        proteinas: { type: Type.NUMBER, description: "Total de proteínas em gramas (apenas o número)." },
        gorduras: { type: Type.NUMBER, description: "Total de gorduras em gramas (apenas o número)." },
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
        },
        macronutrients: {
            type: Type.ARRAY,
            items: nutrientInfoSchema,
            description: "Lista de macronutrientes: Calorias, Proteínas, Carboidratos, Gorduras Totais."
        },
        micronutrients: {
            type: Type.ARRAY,
            items: nutrientInfoSchema,
            description: "Lista de 3 a 5 micronutrientes importantes presentes no prato (ex: Ferro, Vitamina C, Cálcio)."
        }
    },
    required: [
      "nomePrato", "description", "calorias", "carboidratos", "proteinas", "gorduras", 
      "notaSaude", "pros", "cons", "macronutrients", "micronutrients"
    ],
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
      text: "Analise a imagem deste prato. Identifique os alimentos, crie um nome para o prato, e forneça uma breve descrição. Estime as informações nutricionais e dê uma nota de 0 a 10 para o quão saudável é. Liste 3 prós e 3 contras. Forneça uma lista de macronutrientes (Calorias, Proteínas, Carboidratos, Gorduras Totais) e uma lista de 3-5 micronutrientes relevantes (ex: Ferro, Vitamina C, Cálcio, Potássio), incluindo nome, quantidade com unidade e % do Valor Diário (%VD) para cada. Responda apenas com o JSON seguindo o schema.",
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
    
    // Basic validation
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
      !Array.isArray(result.macronutrients) ||
      !Array.isArray(result.micronutrients)
    ) {
      throw new Error("Resposta da API em formato inválido.");
    }

    return result;

  } catch (error) {
    console.error("Erro ao analisar imagem com a API Gemini:", error);
    throw new Error("Não foi possível analisar a imagem. Tente novamente.");
  }
};