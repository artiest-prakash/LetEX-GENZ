
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { GeneratedSimulation } from '../types';
import { refineSimulationCode } from '../services/geminiService';

interface ThreeDSimulationViewerProps {
  simulation: GeneratedSimulation;
  onClose: () => void;
  onSave: () => void;
  onPublish?: () => void;
  saveStatus: 'saving' | 'saved' | 'error' | null;
}

export const ThreeDSimulationViewer: React.FC<ThreeDSimulationViewerProps> = ({ simulation: initialSimulation, onClose, onSave, onPublish, saveStatus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Simulation State
  const [simulation, setSimulation] = useState<GeneratedSimulation>(initialSimulation);
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  
  // Edit / Refine State
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [changesCommitted, setChangesCommitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize control values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    simulation.controls.forEach(c => {
      if (c.defaultValue !== undefined) {
        initialValues[c.id] = c.defaultValue;
      }
    });
    setControlValues(initialValues);
  }, [simulation]);

  const sendMessage = (id: string, value: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ id, value }, '*');
    }
  };

  const handleControlChange = (id: string, value: any) => {
    setControlValues(prev => ({ ...prev, [id]: value }));
    sendMessage(id, value);
  };

  const handleButtonClick = (id: string) => {
    sendMessage(id, true);
  };

  // Handle Refinement
  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;

    setIsRefining(true);
    try {
      const refinedSim = await refineSimulationCode(simulation, editPrompt);
      // Validate code before setting
      if (refinedSim.code.length < 50) throw new Error("Generated code too short");
      
      setSimulation(refinedSim);
      setChangesCommitted(true);
      setTimeout(() => setChangesCommitted(false), 3000); 
      setIsEditing(false);
      setEditPrompt('');
    } catch (error) {
      console.error("Refinement failed:", error);
      alert("Failed to apply changes. Please try again. " + error);
    } finally {
      setIsRefining(false);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
     const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
     document.addEventListener('fullscreenchange', onFullscreenChange);
     return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-700">
      
      {/* HEADER (Light Modern Theme) */}
      <div className="flex flex-col md:flex-row items-start justify-between mb-6 px-1 gap-4 md:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-indigo-200">
               3D Viewport
             </div>
             <h2 className="text-3xl font-bold text-slate-800 tracking-tight font-brand">{simulation.title}</h2>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">{simulation.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`
                 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm border text-sm
                 ${isEditing ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}
              `}
            >
               <Icons.Pencil className="w-3.5 h-3.5" />
               {isEditing ? 'Close' : 'Modify'}
            </button>

            {/* Share to Community */}
             <button
                onClick={onPublish}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm border text-sm bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200"
            >
                <Icons.Globe className="w-3.5 h-3.5" />
                <span>Share</span>
            </button>

            <button
                onClick={onSave}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm border text-sm
                    ${saveStatus === 'saved' 
                        ? 'bg-green-50 text-green-600 border-green-200 cursor-default' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}
                `}
            >
                {saveStatus === 'saving' ? (
                    <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                ) : saveStatus === 'saved' ? (
                    <Icons.Check className="w-3.5 h-3.5" />
                ) : (
                    <Icons.Save className="w-3.5 h-3.5" />
                )}
                {saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 transition-colors shadow-sm"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* CHANGES COMMITTED POPUP */}
      {changesCommitted && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-green-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 font-semibold">
            <Icons.Check className="w-4 h-4" />
            Environment Updated
          </div>
        </div>
      )}

      {/* 3D SIMULATION CONTAINER (White Theme) */}
      <div 
         ref={containerRef}
         className={`
           relative w-full bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group flex flex-col
           ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none' : 'aspect-video'}
         `}
      >
        
        {/* SHIMMER EFFECT OVERLAY (Refining) */}
        {isRefining && (
          <div className="absolute inset-0 z-50 rounded-xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="bg-white border border-slate-200 px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center gap-3">
                 <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                    <Icons.Box className="w-6 h-6 text-indigo-500 absolute top-3 left-3" />
                 </div>
                 <span className="font-semibold text-slate-700">Rebuilding Mesh...</span>
               </div>
            </div>
          </div>
        )}

        {/* EDIT OVERLAY */}
        {isEditing && !isRefining && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40 animate-in slide-in-from-bottom-4 fade-in">
             <form 
               onSubmit={handleRefineSubmit}
               className="bg-white/90 backdrop-blur-md p-2 rounded-xl border border-indigo-200 shadow-2xl flex items-center gap-2"
             >
                <div className="bg-indigo-600 p-3 rounded-lg text-white">
                  <Icons.Bot className="w-6 h-6" />
                </div>
                <input 
                  type="text" 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Ex: 'Add a red wireframe sphere', 'Increase rotation speed'..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 font-medium h-12"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!editPrompt.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icons.ArrowRight className="w-5 h-5" />
                </button>
             </form>
          </div>
        )}

        {/* The Iframe with unique key to force full re-render when code changes */}
        <iframe
          key={`${simulation.title}-${simulation.code.length}`}
          ref={iframeRef}
          srcDoc={simulation.code}
          title={simulation.title}
          className="w-full h-full border-none block touch-none bg-white"
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          sandbox="allow-scripts allow-same-origin"
          allow="accelerometer; camera; encrypted-media; gyroscope; microphone; xr-spatial-tracking"
        />

        {/* Studio Overlays */}
        {!isEditing && (
            <>
                <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">VIEWPORT [PERSPECTIVE]</span>
                    <span className="text-[10px] font-mono text-indigo-500 font-bold">READY</span>
                </div>

                <div className="absolute top-4 right-4 pointer-events-none bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity select-none flex items-center gap-2 shadow-sm">
                    <Icons.Box className="w-3 h-3" />
                    <span>Touch/Click to Rotate • Zoom</span>
                </div>
            </>
        )}

        {/* Fullscreen Trigger */}
        <button 
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 p-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-500 rounded-lg backdrop-blur border border-slate-200 shadow-md transition-all opacity-0 group-hover:opacity-100"
        >
            {isFullscreen ? <Icons.Close className="w-5 h-5"/> : <Icons.Maximize className="w-5 h-5"/>}
        </button>

      </div>

      {/* CONTROL BAR (White Theme) */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest">
                <Icons.Cpu className="w-4 h-4" />
                Parameters
            </div>
            <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">ENGINE ACTIVE</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {simulation.controls.map((control) => (
              <div key={control.id} className="flex flex-col gap-2">
                {control.type === 'slider' && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-700">{control.label}</label>
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">
                        {controlValues[control.id]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={controlValues[control.id] || 0}
                      onChange={(e) => handleControlChange(control.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                    />
                  </>
                )}
                {control.type === 'button' && (
                  <button onClick={() => handleButtonClick(control.id)} className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                    <Icons.Refresh className="w-4 h-4" /> {control.label}
                  </button>
                )}
                {control.type === 'toggle' && (
                   <div className="flex items-center justify-between mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700 text-sm">{control.label}</span>
                      <button onClick={() => handleControlChange(control.id, !controlValues[control.id])} className={`w-12 h-6 rounded-full transition-colors relative ${controlValues[control.id] ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                         <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${controlValues[control.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                   </div>
                )}
              </div>
            ))}
          </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </div>
  );
};
