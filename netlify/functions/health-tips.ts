import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Simplified types for validation/intellisense
interface NutritionalAnalysisInput {
  nomePrato: string;
  calorias: number;
  notaSaude: number;
  pros: string[];
  cons: string[];
}

interface BodyCompositionInput {
  data: string;
  pesoAtual: number;
  IMC: number;
  classificacaoIMC: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = "AIzaSyCtu-1v1Gx_DUXP0seYnKDOpf8vpcAOryM";
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.' }) };
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { analysisHistory, compositionHistory } = JSON.parse(event.body || '{}');

    if (!Array.isArray(analysisHistory) || !Array.isArray(compositionHistory)) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid 'analysisHistory' or 'compositionHistory'." }) };
    }

    const prompt = `
        Você é um nutricionista virtual e coach de saúde.
        Analise o histórico de refeições e avaliações corporais de um usuário e forneça 5 dicas de saúde personalizadas, práticas e encorajadoras.
        Baseie suas dicas nos padrões alimentares e nos dados corporais fornecidos.
        Formate sua resposta como uma lista de dicas claras e diretas, começando cada uma com um emoji relacionado.
        Seja positivo e motivador.

        Histórico de Análises Nutricionais (refeições):
        ${JSON.stringify(analysisHistory.map((a: NutritionalAnalysisInput) => ({ nome: a.nomePrato, calorias: a.calorias, nota: a.notaSaude, pros: a.pros, cons: a.cons })), null, 2)}

        Histórico de Avaliações Corporais:
        ${JSON.stringify(compositionHistory.map((c: BodyCompositionInput) => ({ data: c.data, peso: c.pesoAtual, imc: c.IMC, classificacao: c.classificacaoIMC })), null, 2)}

        Forneça 5 dicas com base nesses dados.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    const text = response.text;
    if (!text) {
        throw new Error("A API não retornou nenhuma dica.");
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tips: text }),
    };

  } catch (error: any) {
    console.error("Error generating health tips:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` }),
    };
  }
};

export { handler };
