
import React, { useState, useEffect } from 'react';
import NutritionalAnalysis from './components/NutritionalAnalysis';
import BodyComposition from './components/BodyComposition';
import { Leaf, BarChart3, DownloadCloud } from 'lucide-react';

type Tab = 'analysis' | 'composition';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
  
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setInstallPrompt(null);
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analysis':
        return <NutritionalAnalysis />;
      case 'composition':
        return <BodyComposition />;
      default:
        return null;
    }
  };

  const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 text-sm font-medium transition-colors duration-300 ease-in-out ${
        activeTab === tab
          ? 'bg-primary text-white border-b-4 border-green-700'
          : 'bg-white text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center relative">
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="text-primary">Nutri</span>
              <span className="text-dark">Scan</span>
            </h1>
            <p className="text-gray-500 mt-1">Sua saúde em foco.</p>
          </div>
          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white font-bold py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
              aria-label="Instalar aplicativo"
              title="Instalar NutriScan"
            >
              <DownloadCloud size={20} />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}
        </div>
      </header>

      <nav className="bg-white shadow-md sticky top-0 z-10 flex">
          <TabButton tab="analysis" label="Análise Nutricional" icon={<Leaf size={18} />} />
          <TabButton tab="composition" label="Composição Corporal" icon={<BarChart3 size={18} />} />
      </nav>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {renderContent()}
      </main>

      <footer className="text-center py-4 mt-8 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} NutriScan. Todos os direitos reservados.</p>
        <p className="mt-1">
          <a
            href="https://wa.me/5584999780963"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Produzido por Danilo Arruda
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;