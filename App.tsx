
import React, { useState } from 'react';
import { generateSimulationCode } from './services/geminiService';
import { SimulationViewer } from './components/SimulationViewer';
import { LoadingState } from './components/LoadingState';
import { Icons } from './components/Icons';
import { GenerationStatus, GeneratedSimulation } from './types';

const SUGGESTIONS = [
  "A double pendulum chaotic physics simulation",
  "A solar system orbit simulator with gravity controls",
  "A fluid particle simulation with viscosity controls",
  "A projectile motion lab with wind resistance",
  "A wave interference simulator"
];

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);

    try {
      const data = await generateSimulationCode(prompt);
      setSimulation(data);
      setStatus(GenerationStatus.COMPLETED);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    // Optional: auto-submit could be added here
  };

  const resetSimulation = () => {
    setSimulation(null);
    setStatus(GenerationStatus.IDLE);
    setPrompt('');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc]">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={resetSimulation}>
          <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform duration-300">
            <Icons.Logo className="text-blue-600 w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 font-brand brand-font">LetEX</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 pt-4 md:pt-10 pb-20">
        
        {/* Hero Section */}
        {status === GenerationStatus.IDLE && (
          <div className="text-center mb-12 animate-in slide-in-from-bottom-5 fade-in duration-700 max-w-5xl mx-auto mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              AI-Powered Simulation Engine v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1]">
              Welcome To <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Reality</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Describe a physics experiment, a game, or a scientific model. LetEX generates accurate, interactive simulations instantly.
            </p>
          </div>
        )}

        {/* Input Section */}
        {status !== GenerationStatus.COMPLETED && (
          <div className={`w-full transition-all duration-700 ease-in-out ${status !== GenerationStatus.IDLE ? 'mb-8' : 'mb-16'}`}>
            <div className={`bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col gap-4 transition-all duration-500 ${status !== GenerationStatus.IDLE ? 'max-w-3xl mx-auto' : 'max-w-2xl mx-auto'}`}>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your simulation (e.g., 'Double pendulum with adjustable mass')"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white rounded-xl px-5 py-4 pr-32 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-32 md:h-28 text-lg"
                  disabled={status === GenerationStatus.GENERATING}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || status === GenerationStatus.GENERATING}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
                      ${!prompt.trim() || status === GenerationStatus.GENERATING 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95'}
                    `}
                  >
                    {status === GenerationStatus.GENERATING ? (
                      <>
                        <Icons.Refresh className="w-4 h-4 animate-spin" />
                        <span>Compiling...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate</span>
                        <Icons.ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            {status === GenerationStatus.IDLE && (
              <div className="mt-10 flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="px-4 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-sm text-slate-600 hover:text-blue-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="w-full">
          {status === GenerationStatus.GENERATING && (
            <LoadingState />
          )}

          {status === GenerationStatus.ERROR && (
            <div className="max-w-xl mx-auto p-8 bg-white border border-red-100 rounded-2xl shadow-lg text-center animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Lab className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Simulation Failed</h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <button 
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Try Again
              </button>
            </div>
          )}

          {status === GenerationStatus.COMPLETED && simulation && (
             <SimulationViewer 
                simulation={simulation}
                onClose={resetSimulation}
             />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 text-slate-400 text-sm">
        <p>© 2024 LetEX Virtual Labs. Physics Engine v2.5</p>
      </footer>

    </div>
  );
};

export default App;
