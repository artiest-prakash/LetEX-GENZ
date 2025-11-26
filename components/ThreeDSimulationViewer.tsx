
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { GeneratedSimulation } from '../types';
import { refineSimulationCode } from '../services/geminiService';

interface ThreeDSimulationViewerProps {
  simulation: GeneratedSimulation;
  onClose: () => void;
  onSave: () => void;
  saveStatus: 'saving' | 'saved' | 'error' | null;
}

export const ThreeDSimulationViewer: React.FC<ThreeDSimulationViewerProps> = ({ simulation: initialSimulation, onClose, onSave, saveStatus }) => {
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
      setSimulation(refinedSim);
      setChangesCommitted(true);
      setTimeout(() => setChangesCommitted(false), 3000); 
      setIsEditing(false);
      setEditPrompt('');
    } catch (error) {
      console.error("Refinement failed:", error);
      alert("Failed to apply changes. Please try again.");
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
      
      {/* HEADER (Dark Mode) */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
               3D View
             </div>
             <h2 className="text-3xl font-bold text-white tracking-tight font-brand">{simulation.title}</h2>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">{simulation.description}</p>
        </div>
        <div className="flex items-center gap-3">
            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`
                 flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-sm border border-transparent
                 ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}
              `}
            >
               <Icons.Pencil className="w-4 h-4" />
               {isEditing ? 'Close Editor' : 'Edit 3D Model'}
            </button>

            <button
                onClick={onSave}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-sm border
                    ${saveStatus === 'saved' 
                        ? 'bg-green-900/30 text-green-400 border-green-800 cursor-default' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}
                `}
            >
                {saveStatus === 'saving' ? (
                    <Icons.Refresh className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                    <Icons.Check className="w-4 h-4" />
                ) : (
                    <Icons.Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-full border border-slate-700 transition-colors shadow-sm"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* CHANGES COMMITTED POPUP */}
      {changesCommitted && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-green-600 text-white px-6 py-2 rounded-full shadow-lg shadow-green-900/50 flex items-center gap-2 font-semibold border border-green-500">
            <Icons.Check className="w-4 h-4" />
            Model Updated Successfully
          </div>
        </div>
      )}

      {/* 3D SIMULATION CONTAINER */}
      <div 
         ref={containerRef}
         className={`
           relative w-full bg-slate-900 rounded-xl border border-slate-700 shadow-2xl shadow-black overflow-hidden group
           ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none' : 'aspect-video'}
         `}
      >
        
        {/* SHIMMER EFFECT OVERLAY (Refining) */}
        {isRefining && (
          <div className="absolute inset-0 z-50 rounded-xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="bg-slate-800 border border-slate-600 px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                 <Icons.Box className="w-5 h-5 text-blue-400 animate-spin" />
                 <span className="font-semibold text-slate-200">Rebuilding 3D Mesh...</span>
               </div>
            </div>
          </div>
        )}

        {/* EDIT OVERLAY */}
        {isEditing && !isRefining && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40 animate-in slide-in-from-bottom-4 fade-in">
             <form 
               onSubmit={handleRefineSubmit}
               className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-blue-500/50 shadow-2xl flex items-center gap-2"
             >
                <div className="bg-blue-900/50 p-3 rounded-xl text-blue-300">
                  <Icons.Bot className="w-6 h-6" />
                </div>
                <input 
                  type="text" 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe changes (e.g. 'Make the planets glow', 'Add rings to the sphere')..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 font-medium h-12"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!editPrompt.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icons.ArrowRight className="w-5 h-5" />
                </button>
             </form>
          </div>
        )}

        {/* The Iframe */}
        {/* We use inline styles to force full width/height and touch handling */}
        <iframe
          ref={iframeRef}
          srcDoc={simulation.code}
          title={simulation.title}
          className="w-full h-full border-none block touch-none"
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          sandbox="allow-scripts allow-same-origin"
          allow="accelerometer; camera; encrypted-media; gyroscope; microphone; xr-spatial-tracking"
        />

        {/* Interaction Hint */}
        {!isEditing && (
            <div className="absolute top-4 right-4 pointer-events-none bg-black/40 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity select-none">
                Touch to Rotate & Zoom
            </div>
        )}

        {/* Fullscreen Trigger */}
        <button 
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-blue-600 text-white rounded-lg backdrop-blur border border-white/10 transition-all opacity-0 group-hover:opacity-100"
        >
            {isFullscreen ? <Icons.Close className="w-5 h-5"/> : <Icons.Maximize className="w-5 h-5"/>}
        </button>

      </div>

      {/* CONTROL BAR (Dark Mode) */}
      <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest mb-6">
              <Icons.Cpu className="w-4 h-4" />
              3D Environment Controls
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {simulation.controls.map((control) => (
              <div key={control.id} className="flex flex-col gap-2">
                {control.type === 'slider' && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-300">{control.label}</label>
                      <span className="font-mono text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded text-xs border border-blue-500/30">
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
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                    />
                  </>
                )}
                {control.type === 'button' && (
                  <button onClick={() => handleButtonClick(control.id)} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                    <Icons.Refresh className="w-4 h-4" /> {control.label}
                  </button>
                )}
                {control.type === 'toggle' && (
                   <div className="flex items-center justify-between mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="font-semibold text-slate-300 text-sm">{control.label}</span>
                      <button onClick={() => handleControlChange(control.id, !controlValues[control.id])} className={`w-12 h-6 rounded-full transition-colors relative ${controlValues[control.id] ? 'bg-blue-600' : 'bg-slate-600'}`}>
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
