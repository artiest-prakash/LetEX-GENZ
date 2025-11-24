
import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './Icons';
import { GeneratedSimulation, SimulationControl } from '../types';

interface SimulationViewerProps {
  simulation: GeneratedSimulation;
  onClose: () => void;
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({ simulation, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  const [zoom, setZoom] = useState(1);

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

  const handleControlChange = (id: string, value: any) => {
    setControlValues(prev => ({ ...prev, [id]: value }));
    
    // Send message to iframe
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ id, value }, '*');
    }
  };

  const handleButtonClick = (id: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ id, value: true }, '*');
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2.5)); // Increased max zoom
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.25)); // Increased min zoom (wider view)
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Listen for fullscreen change events to update state if user presses Esc
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
        <button 
          onClick={onClose}
          className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full border border-slate-200 transition-colors shadow-sm"
        >
          <Icons.Close className="w-6 h-6" />
        </button>
      </div>

      {/* INSTRUCTIONS */}
      <div className="mb-8 bg-white border border-blue-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
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
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-2xl mb-8">
        <div 
          ref={containerRef}
          className={`
            relative w-full bg-slate-50 overflow-hidden rounded-xl flex items-center justify-center
            ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : 'aspect-video'}
          `}
        >
          {/* 
            INVERSE VIEWPORT SCALING
            To "Zoom Out" and see more context (hidden parts), we increase the width/height 
            and scale it down. This acts like a wide-angle lens.
          */}
          <iframe
            ref={iframeRef}
            srcDoc={simulation.code}
            title={simulation.title}
            className="border-none transition-all duration-300 ease-out shadow-sm"
            style={{ 
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
              // Flexbox handles the centering, scale applies from center
            }}
            sandbox="allow-scripts allow-same-origin"
          />
          
          {/* Floating Zoom Indicator on Hover or Change */}
          <div className="absolute top-4 right-4 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md z-10 font-mono shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-300">
            Field of View: {Math.round(100 / zoom)}%
          </div>
        </div>
      </div>

      {/* CONTROL BAR - GENERATED DYNAMICALLY */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Controls Section */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-400 uppercase text-xs font-bold tracking-widest">
            <Icons.Cpu className="w-4 h-4" />
            Simulation Parameters
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

        {/* System & View Actions */}
        <div className="lg:col-span-1 flex flex-col gap-4">
           <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex-1 flex flex-col justify-center items-center text-center">
              <Icons.Logo className="w-10 h-10 text-blue-400 mb-3 animate-spin-slow" />
              <h3 className="text-lg font-bold mb-1">LetEX Engine</h3>
              <p className="text-slate-400 text-xs mb-4">Physics v2.5 Active</p>
              
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
                  title="Zoom Out (See More)"
                >
                  <Icons.ZoomOut className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={handleResetZoom}
                  className="flex-1 text-xs font-mono text-slate-400 hover:text-white transition-colors text-center py-2 rounded hover:bg-slate-700/50"
                  title="Reset View"
                >
                  {Math.round(zoom * 100)}%
                </button>
                
                <button 
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors"
                  title="Zoom In (Focus)"
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
