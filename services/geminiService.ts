import { GoogleGenAI, Type } from "@google/genai";
import { NutritionalAnalysisData, Nutrient } from '../types';

// API Key provided by the user.
const ai = new GoogleGenAI({ apiKey: "AIzaSyCtu-1v1Gx_DUXP0seYnKDOpf8vpcAOryM" });

const nutrientSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nome do nutriente (ex: 'Proteínas', 'Ferro')." },
        amount: { type: Type.STRING, description: "Quantidade com unidade (ex: '12g', '2.5mg')." },
        dailyValue: { type: Type.STRING, description: "Percentual do valor diário recomendado (ex: '24%')." },
    },
    required: ["name", "amount", "dailyValue"],
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        nomePrato: { type: Type.STRING, description: "O nome do prato, ex: 'Salmão Grelhado com Legumes'." },
        description: { type: Type.STRING, description: "Uma breve descrição do prato." },
        calorias: { type: Type.NUMBER, description: "Total de calorias estimado para a porção (apenas o número)." },
        carboidratos: { type: Type.NUMBER, description: "Total de carboidratos em gramas para a porção (apenas o número)." },
        proteinas: { type: Type.NUMBER, description: "Total de proteínas em gramas para a porção (apenas o número)." },
        gorduras: { type: Type.NUMBER, description: "Total de gorduras em gramas para a porção (apenas o número)." },
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
            description: "Lista de macronutrientes. Incluir Calorias, Proteínas, Carboidratos e Gorduras Totais.",
            items: nutrientSchema,
        },
        micronutrients: {
            type: Type.ARRAY,
            description: "Lista de 5 vitaminas e minerais importantes encontrados no prato (ex: Ferro, Vitamina C, Cálcio, Potássio, Sódio).",
            items: nutrientSchema,
        }
    },
    required: ["nomePrato", "description", "calorias", "carboidratos", "proteinas", "gorduras", "notaSaude", "pros", "cons", "macronutrients", "micronutrients"],
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
      text: "Analise a imagem deste prato. Identifique os alimentos, crie um nome para o prato e forneça uma breve descrição. Estime as informações nutricionais para a porção mostrada. Forneça os valores numéricos para calorias, carboidratos, proteínas e gorduras. Além disso, crie uma tabela detalhada com macronutrientes (Calorias, Proteínas, Carboidratos, Gorduras Totais) e 5 vitaminas e minerais relevantes, incluindo a quantidade (com unidade) e o % do Valor Diário. Dê uma nota de 0 a 10 para o quão saudável é. Liste 3 pontos positivos (prós) e 3 negativos (contras) sobre o prato. Responda apenas com o JSON seguindo o schema.",
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
    const isNutrient = (item: any): item is Nutrient => 
        typeof item.name === 'string' &&
        typeof item.amount === 'string' &&
        typeof item.dailyValue === 'string';

    if (
      typeof result.nomePrato !== 'string' ||
      typeof result.description !== 'string' ||
      typeof result.calorias !== 'number' ||
      typeof result.carboidratos !== 'number' ||
      typeof result.proteinas !== 'number' ||
      typeof result.gorduras !== 'number' ||
      typeof result.notaSaude !== 'number' ||
      !Array.isArray(result.pros) || !result.pros.every((p: any) => typeof p === 'string') ||
      !Array.isArray(result.cons) || !result.cons.every((c: any) => typeof c === 'string') ||
      !Array.isArray(result.macronutrients) || !result.macronutrients.every(isNutrient) ||
      !Array.isArray(result.micronutrients) || !result.micronutrients.every(isNutrient)
    ) {
      throw new Error("Resposta da API em formato inválido.");
    }

    return result;

  } catch (error) {
    console.error("Erro ao analisar imagem com a API Gemini:", error);
    throw new Error("Não foi possível analisar a imagem. Tente novamente.");
  }
};