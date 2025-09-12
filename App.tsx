
import React, { useState } from 'react';
import NutritionalAnalysis from './components/NutritionalAnalysis';
import BodyComposition from './components/BodyComposition';
import { Leaf, BarChart3 } from 'lucide-react';

type Tab = 'analysis' | 'composition';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-4xl font-bold text-center">
            <span className="text-primary">Nutri</span>
            <span className="text-dark">Scan</span>
          </h1>
          <p className="text-center text-gray-500 mt-1">Sua saúde em foco.</p>
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
      </footer>
    </div>
  );
};

export default App;
