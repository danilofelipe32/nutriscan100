export interface NutrientInfo {
  name: string;
  quantity: string;
  dailyValue: string;
}

export interface NutritionalAnalysisData {
  data: string;
  nomePrato: string;
  description: string;
  calorias: number;
  carboidratos: number;
  proteinas: number;
  gorduras: number;
  notaSaude: number;
  pros: string[];
  cons: string[];
  imageUrl: string; 
  macronutrients: NutrientInfo[];
  micronutrients: NutrientInfo[];
}

export enum Sex {
  MALE = 'Masculino',
  FEMALE = 'Feminino',
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentário',
  LIGHT = 'Leve',
  MODERATE = 'Moderado',
  INTENSE = 'Intenso',
}

export interface BodyCompositionData {
  data: string;
  idade: number;
  sexo: Sex;
  pesoAtual: number;
  altura: number;
  IMC: number;
  classificacaoIMC: string;
  pesoIdeal: number;
  faixaPesoIdeal: [number, number];
  TMB: number;
  caloriasTotais: number;
}