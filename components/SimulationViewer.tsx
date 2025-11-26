
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { GeneratedSimulation, SimulationControl } from '../types';

interface SimulationViewerProps {
  simulation: GeneratedSimulation;
  onClose: () => void;
  onSave: () => void;
  saveStatus: 'saving' | 'saved' | 'error' | null;
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({ simulation, onClose, onSave, saveStatus }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  
  // View & Playback State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(true);

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

  const togglePlayback = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    sendMessage('set_paused', !newState);
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

  // Zoom Logic (Inverse Scaling for Field of View)
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan Logic
  const handlePan = (dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 animate-in slide-in-from-bottom-10 duration-700">
      
      {/* HEADER */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight font-brand">{simulation.title}</h2>
          <p className="text-slate-500 mt-2 text-lg max-w-3xl">{simulation.description}</p>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={onSave}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-sm border
                    ${saveStatus === 'saved' 
                        ? 'bg-green-50 text-green-700 border-green-200 cursor-default' 
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'}
                `}
            >
                {saveStatus === 'saving' ? (
                    <Icons.Refresh className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                    <Icons.Check className="w-4 h-4" />
                ) : (
                    <Icons.Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Simulation'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full border border-slate-200 transition-colors shadow-sm"
            >
              <Icons.Close className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="mb-6 bg-white border border-blue-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0 shadow-lg shadow-blue-500/30">
          <Icons.Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">How it works</h4>
          <p className="text-slate-600 leading-relaxed text-[15px]">
            {simulation.instructions}
          </p>
        </div>
      </div>

      {/* SIMULATION CONTAINER */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-2xl mb-8 relative group">
        <div 
          ref={containerRef}
          className={`
            relative w-full bg-slate-50 overflow-hidden rounded-xl flex items-center justify-center
            ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : 'aspect-video'}
          `}
        >
          {/* Iframe with Transform Logic */}
          <iframe
            ref={iframeRef}
            srcDoc={simulation.code}
            title={simulation.title}
            className="border-none transition-transform duration-200 ease-out shadow-sm origin-center"
            style={{ 
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            }}
            sandbox="allow-scripts allow-same-origin"
          />
          
          {/* Viewport Indicator */}
          <div className="absolute top-4 right-4 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md z-10 font-mono shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
             Zoom: {Math.round(zoom * 100)}% | Pan: {Math.round(pan.x)},{Math.round(pan.y)}
          </div>
        </div>

        {/* PLAYBACK & NAV BAR (Below Card) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
           
           <button
             onClick={togglePlayback}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'}`}
             title={isPlaying ? "Pause Simulation" : "Resume Simulation"}
           >
             {isPlaying ? <Icons.Pause className="w-4 h-4" /> : <Icons.Play className="w-4 h-4 ml-0.5" />}
           </button>

           <div className="w-px h-6 bg-slate-200"></div>
           
           {/* Pan Controls */}
           <div className="flex items-center gap-1">
             <button onClick={() => handlePan(40, 0)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Pan Left"><Icons.ArrowRight className="w-4 h-4 rotate-180"/></button>
             <button onClick={() => handlePan(-40, 0)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Pan Right"><Icons.ArrowRight className="w-4 h-4"/></button>
             <button onClick={() => handlePan(0, 40)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Pan Up"><Icons.ArrowRight className="w-4 h-4 -rotate-90"/></button>
             <button onClick={() => handlePan(0, -40)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Pan Down"><Icons.ArrowRight className="w-4 h-4 rotate-90"/></button>
           </div>
        </div>
      </div>

      {/* CONTROL BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sliders & User Controls */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-widest">
              <Icons.Cpu className="w-4 h-4" />
              Simulation Parameters
            </div>
            {/* Status Indicator */}
             <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPlaying ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isPlaying ? 'ACTIVE' : 'PAUSED'}
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {simulation.controls.map((control) => (
              <div key={control.id} className="flex flex-col gap-2">
                
                {control.type === 'slider' && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-700">{control.label}</label>
                      <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
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
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
                    />
                  </>
                )}

                {control.type === 'button' && (
                  <button
                    onClick={() => handleButtonClick(control.id)}
                    className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Icons.Refresh className="w-4 h-4" />
                    {control.label}
                  </button>
                )}

                {control.type === 'toggle' && (
                   <div className="flex items-center justify-between mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700 text-sm">{control.label}</span>
                      <button
                        onClick={() => handleControlChange(control.id, !controlValues[control.id])}
                        className={`w-12 h-6 rounded-full transition-colors relative ${controlValues[control.id] ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${controlValues[control.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                   </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {/* View Actions */}
        <div className="lg:col-span-1 flex flex-col gap-4">
           <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex-1 flex flex-col justify-center items-center text-center">
              <Icons.Logo className={`w-10 h-10 text-blue-400 mb-3 ${isPlaying ? 'animate-spin-slow' : 'opacity-50'}`} />
              <h3 className="text-lg font-bold mb-1">LetEX Engine</h3>
              <p className="text-slate-400 text-xs mb-4">Physics v2.5 {isPlaying ? 'Running' : 'Ready'}</p>
              
              <button 
                onClick={toggleFullscreen}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mb-3"
              >
                {isFullscreen ? <Icons.Close className="w-4 h-4"/> : <Icons.Maximize className="w-4 h-4"/>}
                {isFullscreen ? 'Exit Full' : 'Fullscreen'}
              </button>

              <div className="flex items-center gap-2 w-full bg-slate-800 p-1.5 rounded-xl border border-slate-700">
                <button 
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  title="Zoom Out"
                >
                  <Icons.ZoomOut className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={handleResetView}
                  className="flex-1 text-xs font-mono text-slate-400 hover:text-white transition-colors text-center py-2 rounded hover:bg-slate-700/50"
                  title="Reset View"
                >
                  Reset
                </button>
                
                <button 
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors"
                  title="Zoom In"
                >
                  <Icons.ZoomIn className="w-4 h-4" />
                </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
    