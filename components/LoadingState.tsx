
import React, { useEffect, useState } from 'react';

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
  const [introStage, setIntroStage] = useState<'letex' | 'x-only' | 'lyrics'>('letex');
  const [lyricIndex, setLyricIndex] = useState(0);

  // The 8-step Lyrics Sequence
  const lyrics = [
    "Let time taken to complete the simulation generating = X",
    `So, ${userName} Please Be Patient...`,
    "Let The Time X To Be Completed",
    "As Simulation Is a Function Of X",
    "X Is Directly Proportional To The Difficulty OF Simulation",
    "Yeah! X Is Approaching To Zero",
    "So Let's Differentiate Your Simulation With Respect To X",
    `And Finally We Got ${simulationTitle || "..."}`
  ];

  // 1. Handle Intro Animation (LetEX -> X -> Lyrics)
  useEffect(() => {
    // Show "LetEX" for 1.5s, then hide "LetE"
    const t1 = setTimeout(() => setIntroStage('x-only'), 1500);
    // Move X and start lyrics after another 1.5s
    const t2 = setTimeout(() => setIntroStage('lyrics'), 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // 2. Handle Lyrics Timing (7 seconds per line)
  useEffect(() => {
    if (introStage !== 'lyrics') return;

    // We stop auto-advancing at the last step until title is ready
    if (lyricIndex < lyrics.length - 1) {
      const timer = setTimeout(() => {
        setLyricIndex(prev => prev + 1);
      }, 7000); // 7 seconds per sentence as requested
      return () => clearTimeout(timer);
    }
  }, [introStage, lyricIndex, lyrics.length]);

  // 3. Handle Final Completion
  useEffect(() => {
    // If we are at the last step (index 7) and we have a title
    if (lyricIndex === lyrics.length - 1 && simulationTitle) {
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 5000); // Read the final title for 5s then show sim
      return () => clearTimeout(completeTimer);
    }
  }, [lyricIndex, simulationTitle, onComplete, lyrics.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full font-brand select-none overflow-hidden relative">
      
      {/* INTRO STAGE: LetEX -> X */}
      {introStage !== 'lyrics' && (
        <div className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 flex items-center relative transition-all duration-1000">
          <div className={`transition-all duration-1000 ease-in-out ${introStage === 'x-only' ? 'opacity-0 -translate-x-10 blur-sm' : 'opacity-100'}`}>
            LetE
          </div>
          <div className={`text-blue-600 transition-all duration-1000 ease-in-out ${introStage === 'x-only' ? 'scale-125 translate-x-12' : ''}`}>
            X
          </div>
        </div>
      )}

      {/* LYRICS STAGE */}
      {introStage === 'lyrics' && (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4 text-center h-[300px] relative">
          
          {/* Background Decoration: Giant X */}
          <div className="absolute right-[10%] top-[-20%] text-[300px] font-bold text-blue-50/50 pointer-events-none animate-pulse">
            X
          </div>

          {lyrics.map((line, index) => {
            // Determine visual state relative to current line
            const isCurrent = index === lyricIndex;
            const isPast = index < lyricIndex;
            const isFuture = index > lyricIndex;

            return (
              <div 
                key={index}
                className={`
                  absolute w-full px-4 transition-all duration-[2000ms] ease-in-out flex justify-center
                  ${isCurrent ? 'opacity-100 translate-y-0 scale-100 blur-0 z-10' : ''}
                  ${isPast ? 'opacity-10 -translate-y-24 scale-90 blur-sm z-0' : ''}
                  ${isFuture ? 'opacity-0 translate-y-24 scale-90 blur-sm z-0' : ''}
                `}
              >
                <h2 className={`
                  text-2xl md:text-4xl font-bold leading-relaxed max-w-3xl
                  ${isCurrent 
                    ? index === 7 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 scale-110' // Final Title Style
                      : 'text-slate-800' 
                    : 'text-slate-300'}
                `}>
                  {line}
                </h2>
              </div>
            );
          })}

          {/* "X approaching Zero" Indicator */}
          <div className="absolute bottom-[-80px] w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
             {/* Progress bar fills as lyrics progress */}
             <div 
               className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-[7000ms] ease-linear"
               style={{ width: `${((lyricIndex + 1) / lyrics.length) * 100}%` }}
             />
          </div>
          <div className="absolute bottom-[-60px] text-xs font-mono text-slate-400">
            d(Sim)/dX → 0
          </div>
        </div>
      )}

    </div>
  );
};
