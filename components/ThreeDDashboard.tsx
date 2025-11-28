
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
  "A molecular structure visualization of caffeine",
  "A flock of boids flying in 3D space",
  "A 3D terrain mesh generation from noise",
  "An interactive 3D cube field with wave motion"
];

export const ThreeDDashboard: React.FC<ThreeDDashboardProps> = ({ 
    user, userProfile, onUpdateCredits, onSave, onPublish, onRequireLogin, saveStatus 
}) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [pendingSimulation, setPendingSimulation] = useState<GeneratedSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('claude-sonnet');

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
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 text-slate-900 -mt-4 md:-mt-10 px-4 py-10 md:px-8">
      
      {status === GenerationStatus.IDLE && (
        <div className="max-w-4xl mx-auto text-center mt-10 animate-in fade-in slide-in-from-bottom-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-xl shadow-indigo-500/10">
               <Icons.Box className="w-3 h-3" />
               3D Studio Active
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
               Build in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Three Dimensions</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
               Generate immersive WebGL experiences instantly. Visualize molecules, space, or abstract art with accurate lighting and physics using the world's best AI models.
            </p>

            <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-indigo-500/10 flex flex-col gap-4 max-w-2xl mx-auto border border-indigo-50 ring-1 ring-indigo-500/5">
               <div className="relative">
                  <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     placeholder="Describe a 3D scene (e.g. 'A spinning galaxy of particles')"
                     className="w-full bg-slate-50 hover:bg-white focus:bg-white rounded-xl px-5 py-4 pr-32 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none h-32 md:h-28 text-lg"
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleGenerate();
                        }
                     }}
                  />
                  
                  {/* Model Selector Positioned Absolute Top Right */}
                  <div className="absolute top-3 right-3 z-10">
                      <ModelSelector 
                          selectedModel={selectedModel}
                          onSelect={setSelectedModel}
                      />
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-3">
                     <span className="text-xs text-indigo-600/70 font-bold mr-2">
                        {COST_3D} Credits
                      </span>
                     <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className={`
                           flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
                           ${!prompt.trim() 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30'}
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
                     className="px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs text-slate-500 hover:text-indigo-600 rounded-lg transition-all shadow-sm"
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
