import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

// Schemas copied from the original geminiService.ts to be used on the server-side.
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


const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = "AIzaSyCtu-1v1Gx_DUXP0seYnKDOpf8vpcAOryM";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { base64Image, mimeType } = JSON.parse(event.body || '{}');

    if (!base64Image || !mimeType) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'base64Image' or 'mimeType' in the request body." }) };
    }

    const imagePart = {
      inlineData: { data: base64Image, mimeType: mimeType },
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
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: jsonText,
    };

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` }),
    };
  }
};

export { handler };