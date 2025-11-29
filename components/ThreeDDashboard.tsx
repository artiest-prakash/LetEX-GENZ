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

    if (!user) {
        onRequireLogin();
        return;
    }

    if (userProfile) {
        if (userProfile.credits < COST_3D) {
            alert(`Insufficient credits! 3D simulations require ${COST_3D} credits.`);
            return;
        }
        if (userProfile.is_banned) {
            alert("Your account has been restricted.");
            return;
        }
    }

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);
    setPendingSimulation(null);

    try {
      // Use OpenRouter (Claude/GPT) Service with Selected Model
      const data = await generateWithOpenRouter(prompt, selectedModel);
      setPendingSimulation(data);
      
      if (user && userProfile) {
         const newCredits = Math.max(0, userProfile.credits - COST_3D);
         onUpdateCredits(newCredits); 
         
         const { error } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', user.id);
            
         if (error) console.error("3D Credit deduction failed:", error);
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
    // Orange-Red Light Theme Background
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 text-slate-900 -mt-4 md:-mt-10 px-4 py-6 md:py-10 md:px-8">
      
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
               Generate immersive WebGL experiences instantly. Visualize molecules, space, or complex structures using geometric composition.
            </p>

            {/* Input Bar - Enhanced Appearance (White, Shadow, Glow) */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 max-w-2xl mx-auto overflow-hidden relative group">
               <div className="relative">
                  <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe a 3D scene (e.g. 'A futuristic robot arm picking up a cube')"
                     className="w-full bg-transparent rounded-2xl px-6 py-6 pb-20 text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none h-40 md:h-44 text-base md:text-lg font-medium leading-relaxed group-focus-within:ring-0"
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleGenerate();
                        }
                     }}
                  />
                  
                  {/* Focus Glow (Orange Tint) */}
                  <div className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300 border-2 border-transparent group-focus-within:border-orange-100 group-focus-within:shadow-[0_0_20px_rgba(249,115,22,0.15)]"></div>

                  {/* Input Bottom Bar (Model Selector Left, Generate Right) */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      {/* Model Selector (Bottom Left) */}
                      <ModelSelector 
                          selectedModel={selectedModel}
                          onSelect={setSelectedModel}
                      />

                      {/* Render Button (Bottom Right) */}
                      <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className={`
                           flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300
                           ${!prompt.trim() 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-95'}
                        `}
                     >
                        <span>Render 3D</span>
                        <Icons.Box className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            </div>

            {/* Horizontal Suggestion Slider */}
            <div className="mt-10 w-full overflow-x-auto pb-4 no-scrollbar">
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
          <div className="max-w-xl mx-auto mt-20 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center animate-in fade-in zoom-in">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Icons.X className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-red-600 mb-2">3D Render Failed</h3>
             <p className="text-slate-500 mb-6 text-sm">{error}</p>
             <button 
                onClick={handleClose} 
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
             >
                Dismiss
             </button>
          </div>
      )}

    </div>
  );
};