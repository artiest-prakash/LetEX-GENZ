
import React, { useState } from 'react';
import { Icons } from './Icons';
import { generateSimulationCode } from '../services/geminiService';
import { GeneratedSimulation, GenerationStatus } from '../types';
import { LoadingState } from './LoadingState';
import { ThreeDSimulationViewer } from './ThreeDSimulationViewer';

interface ThreeDDashboardProps {
  user: any;
  onSave: (sim: GeneratedSimulation) => void;
  onPublish?: (sim: GeneratedSimulation) => void;
  saveStatus: 'saving' | 'saved' | 'error' | null;
}

const SUGGESTIONS_3D = [
  "A rotating 3D solar system with texturized planets",
  "A molecular structure visualization of caffeine",
  "A flock of boids flying in 3D space",
  "A 3D terrain mesh generation from noise",
  "An interactive 3D cube field with wave motion"
];

export const ThreeDDashboard: React.FC<ThreeDDashboardProps> = ({ user, onSave, onPublish, saveStatus }) => {
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
    // CRITICAL FIX: Ensure we have data before switching state
    if (pendingSimulation) {
      setSimulation(pendingSimulation);
      setStatus(GenerationStatus.COMPLETED);
    } else {
        // Fallback if data isn't ready yet (race condition safety)
        if (status === GenerationStatus.GENERATING && !error) {
             // Wait a bit or show error
             console.warn("Loading animation done, but data not ready.");
        }
    }
  };

  const handleClose = () => {
    setSimulation(null);
    setPendingSimulation(null);
    setStatus(GenerationStatus.IDLE);
    setPrompt('');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 via-slate-50 to-red-50 text-slate-900 -mt-4 md:-mt-10 px-4 py-10 md:px-8">
      
      {status === GenerationStatus.IDLE && (
        <div className="max-w-4xl mx-auto text-center mt-10 animate-in fade-in slide-in-from-bottom-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-xl shadow-orange-500/10">
               <Icons.Box className="w-3 h-3" />
               LetEX 3D Engine
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
               Build in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Three Dimensions</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
               Generate immersive WebGL experiences instantly. Visualize molecules, space, or abstract art with accurate lighting and physics.
            </p>

            <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-orange-500/10 flex flex-col gap-4 max-w-2xl mx-auto border border-orange-100 ring-1 ring-orange-500/5">
               <div className="relative">
                  <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe a 3D scene (e.g. 'A spinning galaxy of particles')"
                     className="w-full bg-slate-50 hover:bg-white focus:bg-white rounded-xl px-5 py-4 pr-32 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none h-32 md:h-28 text-lg"
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
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/30'}
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
                     className="px-4 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-xs text-slate-500 hover:text-orange-600 rounded-lg transition-all shadow-sm"
                  >
                     {s}
                  </button>
               ))}
            </div>
        </div>
      )}

      {status === GenerationStatus.GENERATING && (
         <div className="text-slate-900">
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
                onPublish={() => onPublish?.(simulation)}
                saveStatus={saveStatus}
             />
         </div>
      )}

      {status === GenerationStatus.ERROR && (
          <div className="max-w-xl mx-auto mt-20 p-8 bg-red-50 border border-red-100 rounded-2xl shadow-lg text-center animate-in fade-in zoom-in">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.X className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-red-600 mb-2">3D Render Failed</h3>
             <p className="text-red-800/80 mb-6">{error}</p>
             <button onClick={handleClose} className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">Dismiss</button>
          </div>
      )}

    </div>
  );
};
