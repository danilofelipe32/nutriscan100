import React, { useState, useEffect, useRef } from 'react';
import { NutritionalAnalysisData, NutrientInfo } from '../types';
import { analyzeMealImage } from '../services/geminiService';
import { Upload, ThumbsUp, ThumbsDown, Trash2, Camera, Share2, Download, Flame, Beef, Zap, Droplet } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SummaryCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-3">
        <div className="text-primary flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const NutrientTable = ({ title, nutrients }: { title: string, nutrients: NutrientInfo[] }) => (
    <div>
        <h5 className="font-bold text-gray-800 mb-2 uppercase tracking-wide">{title}</h5>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nutriente</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% VD</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {nutrients.map((nutrient, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{nutrient.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{nutrient.quantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{nutrient.dailyValue}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const ResultDisplay = ({ data, onBack }: { data: NutritionalAnalysisData, onBack: () => void }) => {
    const analysisRef = useRef<HTMLDivElement>(null);
    const [detailsVisible, setDetailsVisible] = useState(true);

    const handleShare = async () => {
        const shareData = {
            title: `Análise Nutricional: ${data.nomePrato}`,
            text: `Confira a análise da minha refeição: ${data.nomePrato}!\n\nCalorias: ${data.calorias} kcal\nProteínas: ${data.proteinas}g\nCarboidratos: ${data.carboidratos}g\nGorduras: ${data.gorduras}g\nNota de Saúde: ${data.notaSaude}/10\n\nGerado por NutriScan.`,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.text);
                alert('Análise copiada para a área de transferência!');
            }
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
            alert("Não foi possível compartilhar a análise.");
        }
    };

    const handleDownloadPdf = () => {
        const input = analysisRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`NutriScan-${data.nomePrato.replace(/\s/g, '_')}.pdf`);
        });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div ref={analysisRef} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <img src={data.imageUrl} alt="Prato analisado" className="rounded-lg w-full h-auto object-cover shadow-md" />
                    <div>
                        <h3 className="text-2xl font-bold text-primary">{data.nomePrato}</h3>
                        <p className="text-gray-600 mt-2">{data.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SummaryCard
                    icon={<Flame size={22} />}
                    label="Calorias"
                    value={`${data.calorias.toFixed(0)} kcal`}
                  />
                   <SummaryCard
                    icon={<Beef size={22} />}
                    label="Proteínas"
                    value={`${data.proteinas.toFixed(0)} g`}
                  />
                  <SummaryCard
                    icon={<Zap size={22} />}
                    label="Carboidratos"
                    value={`${data.carboidratos.toFixed(0)} g`}
                  />
                   <SummaryCard
                    icon={<Droplet size={22} />}
                    label="Gorduras Totais"
                    value={`${data.gorduras.toFixed(0)} g`}
                  />
                </div>

                <div className="text-center">
                    <button onClick={() => setDetailsVisible(!detailsVisible)} className="text-primary hover:underline text-sm font-medium">
                        {detailsVisible ? 'Ocultar Detalhes Nutricionais' : 'Mostrar Detalhes Nutricionais'}
                    </button>
                </div>

                {detailsVisible && (
                    <div className="space-y-4 animate-fade-in">
                         <NutrientTable title="MACRONUTRIENTES" nutrients={data.macronutrients || []} />
                         <NutrientTable title="VITAMINAS E MINERAIS" nutrients={data.micronutrients || []} />
                    </div>
                )}

                 <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-green-50 p-4 rounded-lg">
                        <h5 className="font-bold text-green-700 flex items-center gap-2"><ThumbsUp size={18} /> Prós</h5>
                        <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                            {data.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                        </ul>
                    </div>
                    <div className="flex-1 bg-red-50 p-4 rounded-lg">
                        <h5 className="font-bold text-red-700 flex items-center gap-2"><ThumbsDown size={18} /> Contras</h5>
                        <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                            {data.cons.map((con, i) => <li key={i}>{con}</li>)}
                        </ul>
                    </div>
                </div>
                
                <div>
                     <h5 className="font-bold text-gray-700 mb-2">Nota de Saúde: {data.notaSaude}/10</h5>
                     <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-primary h-4 rounded-full transition-all duration-500" style={{ width: `${data.notaSaude * 10}%` }}></div>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={handleShare} className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                    <Share2 size={20} />
                    <span>Compartilhar</span>
                </button>
                 <button onClick={handleDownloadPdf} className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                    <Download size={20} />
                    <span>Baixar PDF</span>
                </button>
                <button onClick={onBack} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                    Analisar Outra Imagem
                </button>
            </div>
        </div>
    );
};

const NutritionalAnalysis: React.FC = () => {
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<NutritionalAnalysisData | null>(null);
    const [history, setHistory] = useState<NutritionalAnalysisData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('nutriScanAnalysisHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch(e) {
            console.error("Failed to parse history from localStorage", e);
            setHistory([]);
        }
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setError(null);
            runAnalysis(file);
        }
    };

    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]); // remove data:mime/type;base64, prefix
            };
            reader.onerror = (error) => reject(error);
        });

    const runAnalysis = async (file: File) => {
        const filePreview = URL.createObjectURL(file);
        setPreview(filePreview);
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const base64Image = await toBase64(file);
            const analysis = await analyzeMealImage(base64Image, file.type);

            const newResult: NutritionalAnalysisData = {
                ...analysis,
                data: new Date().toISOString(),
                imageUrl: filePreview,
            };

            setResult(newResult);
            const updatedHistory = [newResult, ...history];
            setHistory(updatedHistory);
            localStorage.setItem('nutriScanAnalysisHistory', JSON.stringify(updatedHistory));

        } catch (err: any) {
            setError(err.message || "Ocorreu um erro ao analisar a imagem.");
            setPreview(null);
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewHistoryItem = (item: NutritionalAnalysisData) => {
        setResult(item);
    };

    const handleDeleteItem = (indexToDelete: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card from being clicked when deleting
        const updatedHistory = history.filter((_, index) => index !== indexToDelete);
        setHistory(updatedHistory);
        localStorage.setItem('nutriScanAnalysisHistory', JSON.stringify(updatedHistory));
        if (result?.data === history[indexToDelete].data) {
           setResult(null);
        }
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('nutriScanAnalysisHistory');
    };
    
    const handleBack = () => {
        setResult(null);
        setPreview(null);
        setError(null);
    };

    const LoadingDisplay = ({ imagePreview }: { imagePreview: string }) => (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Analisando sua refeição...</h2>
            <div className="relative inline-block">
                <img src={imagePreview} alt="Analisando prato" className="mx-auto h-48 w-auto rounded-md mb-4 shadow-md" />
                <div className="absolute inset-0 bg-white bg-opacity-50 flex justify-center items-center rounded-md">
                     <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
            <p className="text-gray-600">Isso pode levar alguns segundos.</p>
        </div>
    );

    if (result) {
        return <ResultDisplay data={result} onBack={handleBack} />;
    }
    
    if (loading && preview) {
        return <LoadingDisplay imagePreview={preview} />;
    }
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Análise Nutricional por Imagem</h2>
                 <p className="text-gray-600 mb-6 text-center sm:text-left">Tire uma foto do seu prato ou envie uma imagem da sua galeria para uma análise instantânea.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <label htmlFor="file-upload" className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer">
                        <Upload size={20} />
                        <span>Enviar Arquivo</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                    <label htmlFor="camera-upload" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors cursor-pointer">
                        <Camera size={20} />
                        <span>Tirar Foto</span>
                        <input id="camera-upload" name="camera-upload" type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleImageChange} />
                    </label>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </div>

            {history.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Histórico de Análises</h3>
                        <button onClick={clearHistory} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"><Trash2 size={14} /> Limpar</button>
                    </div>
                    <div className="space-y-3">
                        {history.map((item, index) => (
                            <div 
                                key={item.data + index}
                                onClick={() => handleViewHistoryItem(item)}
                                className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:shadow-md hover:border-primary transition-all duration-200 cursor-pointer"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleViewHistoryItem(item)}
                                aria-label={`Ver detalhes de ${item.nomePrato}`}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <img src={item.imageUrl} alt={item.nomePrato} className="w-16 h-16 object-cover rounded-md" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 truncate">{item.nomePrato}</p>
                                        <p className="text-sm text-gray-500">{new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {item.calorias.toFixed(0)} kcal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteItem(index, e)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                    aria-label={`Deletar análise de ${item.nomePrato}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NutritionalAnalysis;