
import React, { useState, useEffect } from 'react';
import { BodyCompositionData, Sex, ActivityLevel } from '../types';
import { Calculator, Trash2, TrendingUp, Target, HeartPulse, Flame } from 'lucide-react';

// New component for the BMI visualization bar
const BmiClassificationChart: React.FC<{ bmi: number }> = ({ bmi }) => {
  const categories = [
    { name: 'Abaixo', range: [0, 18.5], color: 'bg-blue-400' },
    { name: 'Normal', range: [18.5, 25], color: 'bg-green-500' },
    { name: 'Sobrepeso', range: [25, 30], color: 'bg-yellow-400' },
    { name: 'Obesidade', range: [30, 40], color: 'bg-red-500' },
  ];

  // Clamp BMI for positioning to a max of 40 for visual representation
  const clampedBmi = Math.max(0, Math.min(bmi, 40));
  const positionPercent = (clampedBmi / 40) * 100;

  return (
    <div className="mt-4">
       <h4 className="text-gray-500 text-sm font-medium mb-2">Classificação do seu IMC</h4>
      <div className="relative w-full">
        {/* The segmented bar */}
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="w-[46.25%] bg-blue-400"></div> {/* 18.5 / 40 */}
          <div className="w-[16.25%] bg-green-500"></div> {/* (25 - 18.5) / 40 */}
          <div className="w-[12.5%] bg-yellow-400"></div> {/* (30 - 25) / 40 */}
          <div className="w-[25%] bg-red-500"></div> {/* (40 - 30) / 40 */}
        </div>
        {/* BMI Marker */}
        <div
          className="absolute top-[-4px] transition-all duration-500 ease-out"
          style={{ left: `calc(${positionPercent}% - 8px)` }}
        >
          <div className="w-4 h-4 bg-white border-2 border-primary rounded-full shadow-lg"></div>
           <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center">
            <span className="text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded-md whitespace-nowrap">
              Você: {bmi.toFixed(1)}
            </span>
            <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800 mx-auto"></div>
          </div>
        </div>
      </div>
       {/* Labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
      </div>
    </div>
  );
};


const BodyComposition: React.FC = () => {
  const [formData, setFormData] = useState({
    dob: '',
    sex: Sex.FEMALE,
    activityLevel: ActivityLevel.SEDENTARY,
    weight: '',
    height: '',
  });
  const [result, setResult] = useState<BodyCompositionData | null>(null);
  const [history, setHistory] = useState<BodyCompositionData[]>([]);

  useEffect(() => {
    try {
        const storedHistory = localStorage.getItem('nutriScanCompositionHistory');
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    } catch(e) {
        console.error("Failed to parse history from localStorage", e);
        setHistory([]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { dob, sex, activityLevel, weight, height } = formData;
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!dob || isNaN(weightNum) || isNaN(heightNum) || weightNum <= 0 || heightNum <= 0) {
        alert("Por favor, preencha todos os campos com valores válidos.");
        return;
    }

    const age = calculateAge(dob);
    
    // IMC
    const heightInMeters = heightNum / 100;
    const imc = weightNum / (heightInMeters * heightInMeters);
    let imcClassification = '';
    if (imc < 18.5) imcClassification = 'Abaixo do peso';
    else if (imc < 25) imcClassification = 'Normal';
    else if (imc < 30) imcClassification = 'Sobrepeso';
    else imcClassification = 'Obesidade';
    
    // Peso Ideal
    let idealWeight = 0;
    if (sex === Sex.MALE) {
        idealWeight = 52 + 0.75 * (heightNum - 152.4);
    } else {
        idealWeight = 52 + 0.67 * (heightNum - 152.4);
    }
    const idealWeightRange: [number, number] = [idealWeight - 5, idealWeight + 5];

    // TMB (Mifflin-St Jeor)
    let tmb = 0;
    if (sex === Sex.MALE) {
        tmb = (10 * weightNum) + (6.25 * heightNum) - (5 * age) + 5;
    } else {
        tmb = (10 * weightNum) + (6.25 * heightNum) - (5 * age) - 161;
    }

    // Calorias Totais
    const activityFactors = {
        [ActivityLevel.SEDENTARY]: 1.2,
        [ActivityLevel.LIGHT]: 1.375,
        [ActivityLevel.MODERATE]: 1.55,
        [ActivityLevel.INTENSE]: 1.725,
    };
    const totalCalories = tmb * activityFactors[activityLevel];

    const newResult: BodyCompositionData = {
        data: new Date().toISOString().split('T')[0],
        idade: age,
        sexo: sex,
        pesoAtual: weightNum,
        altura: heightNum,
        IMC: imc,
        classificacaoIMC: imcClassification,
        pesoIdeal: idealWeight,
        faixaPesoIdeal: idealWeightRange,
        TMB: tmb,
        caloriasTotais: totalCalories,
    };

    setResult(newResult);
    const updatedHistory = [newResult, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('nutriScanCompositionHistory', JSON.stringify(updatedHistory));
  };
  
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('nutriScanCompositionHistory');
  };

  const ResultCard = ({ icon, title, value, subValue }: { icon: React.ReactNode, title: string, value: string, subValue?: string }) => (
    <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-4">
      <div className="bg-primary/20 text-primary p-3 rounded-full">{icon}</div>
      <div>
        <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subValue && <p className="text-sm text-gray-600">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Avaliação Corporal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sexo</label>
              <select name="sex" value={formData.sex} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                {Object.values(Sex).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Peso Atual (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} required min="1" step="0.1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Altura (cm)</label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nível de Atividade Física</label>
              <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                {Object.values(ActivityLevel).map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
            <Calculator size={20} /> Calcular
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Seus Resultados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard icon={<TrendingUp size={24}/>} title="IMC" value={result.IMC.toFixed(1)} subValue={result.classificacaoIMC} />
            <ResultCard icon={<Target size={24}/>} title="Peso Ideal" value={`${result.pesoIdeal.toFixed(1)} kg`} subValue={`Faixa: ${result.faixaPesoIdeal[0].toFixed(1)} - ${result.faixaPesoIdeal[1].toFixed(1)} kg`} />
            <ResultCard icon={<HeartPulse size={24}/>} title="Taxa Metabólica Basal (TMB)" value={`${result.TMB.toFixed(0)}`} subValue="kcal/dia" />
            <ResultCard icon={<Flame size={24}/>} title="Gasto Calórico Total" value={`${result.caloriasTotais.toFixed(0)}`} subValue="kcal/dia" />
          </div>
          <BmiClassificationChart bmi={result.IMC} />
        </div>
      )}
      
      {history.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Histórico de Avaliações</h3>
            <button onClick={clearHistory} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"><Trash2 size={14}/> Limpar</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3">Data</th>
                        <th scope="col" className="px-4 py-3">Peso</th>
                        <th scope="col" className="px-4 py-3">IMC</th>
                        <th scope="col" className="px-4 py-3">Classificação</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, index) => (
                    <tr key={index} className="bg-white border-b">
                        <td className="px-4 py-3">{new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td className="px-4 py-3">{item.pesoAtual} kg</td>
                        <td className="px-4 py-3">{item.IMC.toFixed(1)}</td>
                        <td className="px-4 py-3">{item.classificacaoIMC}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyComposition;
