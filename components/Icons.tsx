
import React from 'react';
import { 
  Play, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  Maximize2, 
  RefreshCw, 
  Download,
  Code2,
  FlaskConical,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Custom SVG Logo: 3D Tau (Torque) Symbol
const LetexLogo = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="letex_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B5CF6" /> {/* Violet */}
        <stop offset="50%" stopColor="#3B82F6" /> {/* Blue */}
        <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Main 3D Tau Shape */}
    <path 
      d="M 15 25 
         Q 50 5 85 25 
         L 85 42 
         Q 65 32 60 38 
         L 58 80 
         Q 50 95 42 80 
         L 40 38 
         Q 35 32 15 42 
         Z"
      fill="url(#letex_grad)"
      filter="url(#glow)"
      opacity="0.95"
    />
    
    {/* Top Bar Highlights (Creating the cylindrical 3D effect) */}
    <path d="M 20 28 Q 50 12 80 28" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 25 34 Q 50 22 75 34" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" />

    {/* Stem Highlights (Vertical flow) */}
    <path d="M 50 40 L 50 82" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 46 45 L 46 78" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M 54 45 L 54 78" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Icons = {
  Logo: LetexLogo,
  Play,
  Cpu,
  Sparkles,
  ArrowRight,
  Maximize: Maximize2,
  Refresh: RefreshCw,
  Download,
  Code: Code2,
  Lab: FlaskConical,
  Close: X,
  ZoomIn,
  ZoomOut
};
