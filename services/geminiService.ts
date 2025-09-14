import { NutritionalAnalysisData, BodyCompositionData } from '../types';

export const analyzeMealImage = async (base64Image: string, mimeType: string): Promise<Omit<NutritionalAnalysisData, 'data' | 'imageUrl'>> => {
  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result || typeof result !== 'object') {
        throw new Error("A resposta da API estava vazia ou em formato inválido.");
    }

    return result;

  } catch (error: any) {
    console.error("Erro ao chamar a função Netlify:", error);
    throw new Error("Não foi possível analisar a imagem. Verifique sua conexão e tente novamente.");
  }
};

export const getHealthTips = async (
    analysisHistory: NutritionalAnalysisData[],
    compositionHistory: BodyCompositionData[]
): Promise<string> => {
    try {
        const response = await fetch('/.netlify/functions/health-tips', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ analysisHistory, compositionHistory }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.tips) {
            throw new Error("A API não retornou nenhuma dica.");
        }
        
        return data.tips;

    } catch (error: any) {
        console.error("Erro ao gerar dicas de saúde:", error);
        throw new Error("Não foi possível gerar as dicas. Tente novamente mais tarde.");
    }
};