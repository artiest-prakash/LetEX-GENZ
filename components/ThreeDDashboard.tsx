
import React, { useState } from 'react';
import { Icons } from './Icons';
import { generateSimulationCode } from '../services/geminiService';
import { GeneratedSimulation, GenerationStatus } from '../types';
import { LoadingState } from './LoadingState';
import { ThreeDSimulationViewer } from './ThreeDSimulationViewer';

interface ThreeDDashboardProps {
  user: any;
  onSave: (sim: GeneratedSimulation) => void;
  saveStatus: 'saving' | 'saved' | 'error' | null;
}

const SUGGESTIONS_3D = [
  "A rotating 3D solar system with texturized planets",
  "A molecular structure visualization of caffeine",
  "A flock of boids flying in 3D space",
  "A 3D terrain mesh generation from noise",
  "An interactive 3D cube field with wave motion"
];

export const ThreeDDashboard: React.FC<ThreeDDashboardProps> = ({ user, onSave, saveStatus }) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [pendingSimulation, setPendingSimulation] = useState<GeneratedSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);
    setPendingSimulation(null);

    try {
      // Pass 'true' for is3D
      const data = await generateSimulationCode(prompt, true);
      setPendingSimulation(data);
    } catch (err) {
      console.error("3D Generation Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const onLoadingComplete = () => {
    if (pendingSimulation) {
      setSimulation(pendingSimulation);
      setStatus(GenerationStatus.COMPLETED);
    }
  };

  const handleClose = () => {
    setSimulation(null);
    setPendingSimulation(null);
    setStatus(GenerationStatus.IDLE);
    setPrompt('');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white -mt-4 md:-mt-10 px-4 py-10 md:px-8">
      
      {status === GenerationStatus.IDLE && (
        <div className="max-w-4xl mx-auto text-center mt-10 animate-in fade-in slide-in-from-bottom-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-xl shadow-cyan-900/10">
               <Icons.Box className="w-3 h-3" />
               LetEX 3D Engine
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
               Build in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Three Dimensions</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
               Generate immersive WebGL experiences instantly. Visualize molecules, space, or abstract art with accurate lighting and physics.
            </p>

            <div className="bg-slate-900 p-2 rounded-2xl shadow-2xl flex flex-col gap-4 max-w-2xl mx-auto border border-slate-800 ring-1 ring-white/5">
               <div className="relative">
                  <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe a 3D scene (e.g. 'A spinning galaxy of particles')"
                     className="w-full bg-slate-950 hover:bg-slate-900 focus:bg-slate-950 rounded-xl px-5 py-4 pr-32 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-32 md:h-28 text-lg"
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleGenerate();
                        }
                     }}
                  />
                  <div className="absolute bottom-3 right-3">
                     <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className={`
                           flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
                           ${!prompt.trim() 
                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30'}
                        `}
                     >
                        <span>Render 3D</span>
                        <Icons.Box className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
               {SUGGESTIONS_3D.map((s, i) => (
                  <button
                     key={i}
                     onClick={() => setPrompt(s)}
                     className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-400 hover:text-blue-300 rounded-lg transition-all shadow-sm"
                  >
                     {s}
                  </button>
               ))}
            </div>
        </div>
      )}

      {status === GenerationStatus.GENERATING && (
         <div className="text-white">
            <LoadingState 
                simulationTitle={pendingSimulation?.title} 
                onComplete={onLoadingComplete}
                userName={user?.user_metadata?.full_name || "Creator"}
            />
         </div>
      )}

      {status === GenerationStatus.COMPLETED && simulation && (
         <div className="max-w-6xl mx-auto">
             <ThreeDSimulationViewer 
                simulation={simulation}
                onClose={handleClose}
                onSave={() => onSave(simulation)}
                saveStatus={saveStatus}
             />
         </div>
      )}

      {status === GenerationStatus.ERROR && (
          <div className="max-w-xl mx-auto mt-20 p-8 bg-red-900/10 border border-red-500/20 rounded-2xl shadow-lg text-center animate-in fade-in zoom-in">
             <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Icons.X className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-red-400 mb-2">3D Render Failed</h3>
             <p className="text-red-300/80 mb-6">{error}</p>
             <button onClick={handleClose} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors">Dismiss</button>
          </div>
      )}

    </div>
  );
};
