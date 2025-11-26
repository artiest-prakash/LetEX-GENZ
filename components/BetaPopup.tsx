
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

export const BetaPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500); // Wait for fade out animation
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex items-center justify-center 
        bg-slate-900/60 backdrop-blur-md px-4
        transition-opacity duration-500 ease-in-out
        ${isFading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden text-center animate-in zoom-in-95 duration-500">
        
        {/* Background Decorations */}
        <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-cyan-100 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <Icons.Logo className="w-16 h-16 animate-pulse" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 font-brand mb-1">LetEX</h2>
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Beta Preview
          </div>

          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Welcome to the future of virtual simulation. This platform is currently under <strong className="text-slate-700">Beta Testing</strong>. 
            Experience physics like never before.
          </p>

          {/* Countdown / Progress */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 10) * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between w-full text-xs font-mono text-slate-400">
            <span>Entering Lab...</span>
            <span>{timeLeft}s</span>
          </div>

          {/* Manual Skip (Optional UX improvement) */}
          <button 
            onClick={handleClose}
            className="mt-6 text-slate-300 hover:text-slate-500 text-xs transition-colors"
          >
            Skip Countdown
          </button>
        </div>
      </div>
    </div>
  );
};
