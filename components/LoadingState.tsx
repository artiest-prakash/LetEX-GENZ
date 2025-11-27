
import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';

interface LoadingStateProps {
  simulationTitle?: string;
  onComplete?: () => void;
  userName?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  simulationTitle, 
  onComplete, 
  userName = "Explorer" 
}) => {
  const [step, setStep] = useState(0);

  // Technical steps for the generation process
  const steps = [
    "Initializing Neural Network...",
    "Analyzing Physics Parameters...",
    "Synthesizing 3D Mesh Geometry...",
    "Compiling WebGL Shaders...",
    "Configuring Environment Lighting...",
    "Optimizing Frame Rate...",
    "Finalizing Simulation..."
  ];

  useEffect(() => {
    // Progress through steps
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500); // Update step every 1.5s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // If simulation is ready (we have a title), jump to end and finish
    if (simulationTitle) {
      setStep(steps.length - 1);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [simulationTitle, onComplete, steps.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full font-brand select-none relative">
      
      {/* Central Loader */}
      <div className="relative mb-12">
        {/* Pulsing Rings */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-20"></div>
        <div className="absolute inset-[-10px] rounded-full border-2 border-cyan-50 animate-pulse opacity-40"></div>
        
        {/* Logo Container */}
        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative z-10 border border-slate-100">
          <Icons.Cpu className="w-10 h-10 text-blue-600 animate-spin-slow duration-[3s]" />
          <div className="absolute -top-2 -right-2 bg-green-400 w-4 h-4 rounded-full border-2 border-white animate-bounce"></div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2 max-w-md px-4">
        <h2 className="text-2xl font-bold text-slate-800 animate-pulse">
           {simulationTitle ? "Simulation Ready" : "Building Environment"}
        </h2>
        
        <div className="h-8 flex items-center justify-center overflow-hidden relative">
             {steps.map((text, index) => (
                <div 
                   key={index}
                   className={`
                     absolute transition-all duration-500 font-mono text-sm
                     ${index === step ? 'opacity-100 translate-y-0 text-blue-600' : 
                       index < step ? 'opacity-0 -translate-y-4 text-slate-300' : 
                       'opacity-0 translate-y-4 text-slate-300'}
                   `}
                >
                  &gt; {text}
                </div>
             ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
           className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
           style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      <p className="mt-4 text-xs text-slate-400">
         Generating for {userName}
      </p>

    </div>
  );
};
