import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-4 border-4 border-cyan-400 rounded-full border-b-transparent animate-spin-reverse opacity-70"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
        </div>
      </div>
      
      <h3 className="text-xl font-medium text-slate-800 mb-2">Compiling Virtual Environment</h3>
      <div className="flex flex-col items-center gap-1 text-sm text-slate-500 font-mono">
        <span className="animate-pulse">Analyzing physics parameters...</span>
        <span className="animate-pulse delay-75">Generating render logic...</span>
        <span className="animate-pulse delay-150">Optimizing shader code...</span>
      </div>
    </div>
  );
};
