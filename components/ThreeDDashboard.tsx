import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Icons } from './Icons';
import { generateWithOpenRouter } from '../services/openRouterService';
import { GeneratedSimulation, GenerationStatus, UserProfile, AIModelId } from '../types';
import { LoadingState } from './LoadingState';
import { ThreeDSimulationViewer } from './ThreeDSimulationViewer';
import { ModelSelector } from './ModelSelector';

interface ThreeDDashboardProps {
  user: any;
  userProfile: UserProfile | null;
  onUpdateCredits: (newCredits: number) => void;
  onSave: (sim: GeneratedSimulation) => void;
  onPublish?: (sim: GeneratedSimulation) => void;
  onRequireLogin: () => void;
  saveStatus: 'saving' | 'saved' | 'error' | null;
}

const COST_3D = 4.0;

const SUGGESTIONS_3D = [
  "A rotating 3D solar system with texturized planets",
  "A detailed 3D Penguin made of shapes",
  "A molecular structure of caffeine",
  "A cyberpunk city street with neon lights",
  "An interactive 3D particle field",
  "A futuristic flying car concept",
  "A DNA double helix visualization",
  "A low-poly 3D forest scene"
];

export const ThreeDDashboard: React.FC<ThreeDDashboardProps> = ({ 
    user, userProfile, onUpdateCredits, onSave, onPublish, onRequireLogin, saveStatus 
}) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [pendingSimulation, setPendingSimulation] = useState<GeneratedSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('grok-2');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) { onRequireLogin(); return; }

    if (userProfile && (userProfile.credits < COST_3D || userProfile.is_banned)) {
        alert(userProfile.is_banned ? "Account restricted." : `Insufficient credits (${COST_3D} required).`);
        return;
    }

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);
    setPendingSimulation(null);

    try {
      const data = await generateWithOpenRouter(prompt, selectedModel);
      setPendingSimulation(data);
      
      if (user && userProfile) {
         const newCredits = Math.max(0, userProfile.credits - COST_3D);
         onUpdateCredits(newCredits); 
         await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);
      }
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
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 text-slate-900 -mt-4 md:-mt-10 px-4 py-6 md:py-10 md:px-8 relative z-10">
      
      {status === GenerationStatus.IDLE && (
        <div className="max-w-4xl mx-auto text-center mt-6 md:mt-10 animate-in fade-in slide-in-from-bottom-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-xl shadow-orange-500/10">
               <Icons.Box className="w-3 h-3" />
               3D Studio Active
            </div>

            <h1 className="text-4xl md:text-7xl font-bold text-slate-900 mb-4 md:mb-6 tracking-tight">
               Build in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Three Dimensions</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-10 md:mb-12">
               Generate immersive WebGL experiences instantly. Visualize molecules, space, or complex structures.
            </p>

            {/* INPUT BAR - FIXED: Removed overflow-hidden to let dropdown appear */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col relative group w-full max-w-3xl mx-auto z-30">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a 3D scene (e.g. 'A futuristic robot arm picking up a cube')"
                    className="w-full bg-transparent px-6 py-6 pb-24 text-slate-800 placeholder-slate-400 focus:outline-none resize-none h-48 md:h-52 text-base md:text-lg font-medium leading-relaxed rounded-3xl"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                />
                
                {/* Focus Glow Visualization */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300 border-2 border-transparent group-focus-within:border-orange-100 group-focus-within:shadow-[0_0_20px_rgba(249,115,22,0.15)]"></div>

                {/* Bottom Bar - Rounded Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-between rounded-b-3xl">
                    <div className="relative z-50">
                        <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 relative z-40
                            ${!prompt.trim() 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02]'}
                        `}
                    >
                        <span>Render 3D</span>
                        <Icons.Box className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* SUGGESTION SLIDER */}
            <div className="mt-8 w-full max-w-3xl mx-auto overflow-x-auto pb-4 no-scrollbar relative z-20">
               <div className="flex gap-3 px-4 min-w-max mx-auto snap-x">
                  {SUGGESTIONS_3D.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => setPrompt(s)}
                        className="snap-center px-5 py-2.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-sm text-slate-500 hover:text-orange-600 rounded-full transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        {s}
                    </button>
                  ))}
               </div>
            </div>
        </div>
      )}

      {status === GenerationStatus.GENERATING && (
         <div className="text-slate-900 relative z-10">
            <LoadingState simulationTitle={pendingSimulation?.title} onComplete={onLoadingComplete} userName={user?.user_metadata?.full_name || "Creator"} />
         </div>
      )}

      {status === GenerationStatus.COMPLETED && simulation && (
         <div className="max-w-6xl mx-auto relative z-10">
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
          <div className="max-w-xl mx-auto mt-20 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center animate-in fade-in zoom-in relative z-10">
             <Icons.X className="w-10 h-10 text-red-500 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-red-600 mb-2">3D Render Failed</h3>
             <p className="text-slate-500 mb-6 text-sm">{error}</p>
             <button onClick={handleClose} className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Dismiss</button>
          </div>
      )}
    </div>
  );
};