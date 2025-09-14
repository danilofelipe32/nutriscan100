import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, LoaderCircle, Flame, Beef, Wheat, Droplets, CheckCircle2, XCircle, Share2, Download, RefreshCcw, Lightbulb, X } from 'lucide-react';
import { analyzeMealImage, getHealthTips } from '../services/geminiService';
import { NutritionalAnalysisData, Nutrient, BodyCompositionData } from '../types';

declare var jspdf: any;
declare var html2canvas: any;

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const [header, base64] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
        resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

const HealthScoreDonut: React.FC<{ score: number }> = ({ score }) => {
  const size = 150;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="transparent" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-800">{score.toFixed(0)}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">(Saúde geral do prato)</p>
    </div>
  );
};

const MacroCard: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-start justify-center text-left">
     <div className="flex items-center gap-2 mb-1">
        {icon}
        <h4 className="text-sm font-medium text-gray-600">{label}</h4>
     </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const ProsConsList: React.FC<{ title: string; items: string[]; isPro: boolean }> = ({ title, items, isPro }) => {
  const iconColor = isPro ? 'text-green-500' : 'text-red-500';
  const Icon = isPro ? CheckCircle2 : XCircle;

  return (
    <div>
      <h4 className={`text-lg font-semibold mb-3 ${isPro ? 'text-green-600' : 'text-red-600'}`}>{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-700">
            <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const NutrientTable: React.FC<{ title: string; nutrients: Nutrient[] }> = ({ title, nutrients }) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50">
          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 w-1/2">{title}</th>
          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">Quantidade</th>
          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600">% VD</th>
        </tr>
      </thead>
      <tbody>
        {nutrients.map((nutrient, index) => (
          <tr key={index} className="border-t border-gray-200">
            <td className="px-4 py-2 font-medium text-gray-800">{nutrient.name}</td>
            <td className="px-4 py-2 text-gray-600">{nutrient.amount}</td>
            <td className="px-4 py-2 text-gray-600">{nutrient.dailyValue}</td>
          </tr>
        ))}
      </tbody>
    </table>
);

const NutritionalDetails: React.FC<{ analysis: NutritionalAnalysisData; onClose: () => void }> = ({ analysis, onClose }) => (
  <div className="pt-6">
    <div className="text-center mb-4">
        <button onClick={onClose} className="text-primary text-sm font-semibold hover:underline">
          Ocultar Detalhes Nutricionais
        </button>
    </div>
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <NutrientTable title="Macronutrientes" nutrients={analysis.macronutrients} />
      {analysis.micronutrients && analysis.micronutrients.length > 0 && (
         <NutrientTable title="Vitaminas e Minerais" nutrients={analysis.micronutrients} />
      )}
    </div>
  </div>
);


const NutritionalAnalysis: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<NutritionalAnalysisData | null>(null);
  const [history, setHistory] = useState<NutritionalAnalysisData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [tipsContent, setTipsContent] = useState('');
  const [isTipsLoading, setIsTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const analysisResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('nutriScanAnalysisHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      setHistory([]);
    }
  }, []);
  
  const runAnalysis = async (fileToAnalyze: File) => {
    if (!fileToAnalyze) return;

    const imageUrl = URL.createObjectURL(fileToAnalyze);
    setImage(imageUrl);
    setAnalysis(null);
    setIsLoading(true);
    setError(null);
    setShowDetails(false);
    
    try {
      const { base64, mimeType } = await fileToBase64(fileToAnalyze);
      const result = await analyzeMealImage(base64, mimeType);
      
      const newAnalysis: NutritionalAnalysisData = {
        ...result,
        data: new Date().toISOString().split('T')[0],
        imageUrl,
      };

      setAnalysis(newAnalysis);

      // Save image with base64 for persistent history display
      const historyAnalysis = { ...newAnalysis, imageUrl: `data:${mimeType};base64,${base64}` };
      const updatedHistory = [historyAnalysis, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('nutriScanAnalysisHistory', JSON.stringify(updatedHistory));

    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      runAnalysis(selectedFile);
    }
    event.target.value = ''; 
  };
  
  const resetAnalysis = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
    setShowDetails(false);
  }

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('nutriScanAnalysisHistory');
  };

  const handleDeleteItem = (indexToDelete: number) => {
    const updatedHistory = history.filter((_, index) => index !== indexToDelete);
    setHistory(updatedHistory);
    localStorage.setItem('nutriScanAnalysisHistory', JSON.stringify(updatedHistory));
  };

  const handleViewHistoryItem = (itemToView: NutritionalAnalysisData) => {
    setAnalysis(itemToView);
    setImage(itemToView.imageUrl);
    setShowDetails(false);
  };

  const handleGenerateTips = async () => {
    setIsTipsModalOpen(true);
    setIsTipsLoading(true);
    setTipsError(null);
    setTipsContent('');

    try {
        const storedCompositionHistory = localStorage.getItem('nutriScanCompositionHistory');
        const compositionHistory: BodyCompositionData[] = storedCompositionHistory ? JSON.parse(storedCompositionHistory) : [];
        
        const tips = await getHealthTips(history, compositionHistory);
        setTipsContent(tips);

    } catch (e: any) {
        setTipsError(e.message || 'Ocorreu um erro ao gerar as dicas.');
    } finally {
        setIsTipsLoading(false);
    }
  };
  
  const handleShare = async () => {
    if (!analysis) return;

    const shareData = {
      title: `Análise Nutricional: ${analysis.nomePrato}`,
      text: `Confira a análise do meu prato: ${analysis.nomePrato}!\n\n- Calorias: ${analysis.calorias.toFixed(0)} kcal\n- Nota de Saúde: ${analysis.notaSaude.toFixed(1)}/10\n\nAnalisado com NutriScan.`,
      url: 'https://nutriscan100.netlify.app/',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Análise compartilhada com sucesso!');
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      alert('A função de compartilhar não é suportada neste navegador. Tente copiar o link.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysisResultRef.current || !analysis) return;

    setIsDownloadingPdf(true);
    try {
      const canvas = await html2canvas(analysisResultRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageMargin = 10;
      const effectivePdfWidth = pdfWidth - (pageMargin * 2);
      const effectivePdfHeight = pdf.internal.pageSize.getHeight() - (pageMargin * 2);

      const finalPdfHeight = (imgProps.height * effectivePdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', pageMargin, pageMargin, effectivePdfWidth, finalPdfHeight);
      
      const fileName = `analise_nutricional_${analysis.nomePrato.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        setError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
        setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      {!image && !isLoading && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Análise do Prato</h2>
          <p className="text-gray-600 mb-6">Tire uma foto ou envie a imagem de um prato para obter uma análise nutricional completa e instantânea.</p>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => cameraInputRef.current?.click()} className="flex-1 bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
              <Camera size={20}/> Abrir Câmera
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors">
              <Upload size={20}/> Enviar Foto
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            {image && <img src={image} alt="Prato a ser analisado" className="max-w-full h-auto max-h-80 mx-auto rounded-lg shadow-md mb-4" />}
            <div className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-700">
                <LoaderCircle className="animate-spin" size={24}/> 
                <p>Analisando sua refeição...</p>
            </div>
            <p className="text-gray-500 mt-2">Isso pode levar alguns segundos.</p>
        </div>
      )}

      {error && (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
             <p className="text-red-500">{error}</p>
             <button onClick={resetAnalysis} className="mt-4 bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">
                Tentar Novamente
             </button>
        </div>
      )}

      {analysis && !isLoading && (
         <div className="bg-white p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
            <div ref={analysisResultRef} className="space-y-6 bg-white">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{analysis.nomePrato}</h2>
                    <p className="text-gray-600 mt-1">{analysis.description}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MacroCard icon={<Flame size={20} className="text-orange-500"/>} label="Calorias" value={`${analysis.calorias.toFixed(0)} kcal`} />
                    <MacroCard icon={<Beef size={20} className="text-red-500"/>} label="Proteínas" value={`${analysis.proteinas.toFixed(1)}g`} />
                    <MacroCard icon={<Wheat size={20} className="text-yellow-500"/>} label="Carboidratos" value={`${analysis.carboidratos.toFixed(1)}g`} />
                    <MacroCard icon={<Droplets size={20} className="text-blue-500"/>} label="Gorduras" value={`${analysis.gorduras.toFixed(1)}g`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                    <div className="flex justify-center items-center md:col-span-1">
                        <HealthScoreDonut score={analysis.notaSaude} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <ProsConsList title="Prós" items={analysis.pros} isPro={true} />
                        <ProsConsList title="Contras" items={analysis.cons} isPro={false} />
                    </div>
                </div>
            </div>

            {showDetails ? (
              <NutritionalDetails analysis={analysis} onClose={() => setShowDetails(false)} />
            ) : (
              <div className="text-center pt-2">
                <button onClick={() => setShowDetails(true)} className="text-primary font-semibold hover:underline">
                  Ver Detalhes Nutricionais
                </button>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleShare} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors border border-gray-300">
                        <Share2 size={18}/> Compartilhar
                    </button>
                    <button 
                        onClick={handleDownloadPdf}
                        disabled={isDownloadingPdf}
                        className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isDownloadingPdf ? (
                            <>
                                <LoaderCircle size={18} className="animate-spin" /> Baixando...
                            </>
                        ) : (
                            <>
                                <Download size={18}/> Baixar PDF
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => {
                            resetAnalysis();
                            fileInputRef.current?.click();
                        }}
                        className="flex-1 bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                        <RefreshCcw size={18}/> Analisar Outra Imagem
                    </button>
                </div>
            </div>
         </div>
      )}

      {history.length > 0 && !image && !isLoading && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Histórico de Análises</h3>
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={handleGenerateTips} 
                        className="bg-yellow-400 text-gray-800 font-bold py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-yellow-500 transition-colors text-sm"
                        title="Gerar Dicas com IA"
                    >
                        <Lightbulb size={16}/> Dicas
                    </button>
                    <button onClick={clearHistory} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm">
                        <Trash2 size={14}/> Limpar Tudo
                    </button>
                </div>
            </div>
          <ul className="space-y-3">
            {history.map((item, index) => (
              <li 
                key={index}
                onClick={() => handleViewHistoryItem(item)}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:shadow-sm cursor-pointer"
                >
                <img src={item.imageUrl} alt={item.nomePrato} className="w-16 h-16 object-cover rounded-md"/>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.nomePrato}</p>
                  <p className="text-sm text-gray-500">{new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-primary">{item.calorias.toFixed(0)} kcal</p>
                    <p className="text-sm text-gray-500">Nota: {item.notaSaude.toFixed(1)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(index);
                  }}
                  className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                  aria-label={`Deletar análise de ${item.nomePrato}`}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isTipsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="tips-modal-title">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4 flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="flex-shrink-0 p-6 pb-4 flex justify-between items-center border-b border-gray-200">
                      <h3 id="tips-modal-title" className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <Lightbulb className="text-yellow-500" />
                          Dicas Saudáveis Personalizadas
                      </h3>
                      <button
                          onClick={() => setIsTipsModalOpen(false)}
                          className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                          aria-label="Fechar modal de dicas"
                      >
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="flex-grow overflow-y-auto">
                      <div className="p-6">
                          {isTipsLoading ? (
                              <div className="text-center py-8">
                                  <LoaderCircle className="animate-spin mx-auto text-primary" size={40} />
                                  <p className="mt-4 text-gray-600">Aguarde, nossa IA está preparando dicas especiais para você...</p>
                              </div>
                          ) : tipsError ? (
                              <div className="text-center py-8">
                                  <XCircle className="mx-auto text-red-500" size={40} />
                                  <p className="mt-4 text-red-600">{tipsError}</p>
                              </div>
                          ) : (
                              <div className="text-gray-700 space-y-4" style={{ whiteSpace: 'pre-wrap' }}>
                                  {tipsContent}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex-shrink-0 p-6 pt-4 flex justify-end items-center border-t border-gray-200">
                      <button
                          onClick={() => setIsTipsModalOpen(false)}
                          className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default NutritionalAnalysis;