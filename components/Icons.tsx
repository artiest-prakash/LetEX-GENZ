
import React from 'react';
import { 
  Play, 
  Pause,
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
  ZoomOut,
  Check,
  LogOut,
  History,
  User,
  Calendar,
  Save,
  MessageSquare, // Chat Icon
  Send, // Send Icon
  Bot // Bot Icon
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

// Simple Google Icon SVG
const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.769 -21.864 51.959 -21.864 51.129 C -21.864 50.299 -21.734 49.489 -21.484 48.729 L -21.484 45.639 L -25.464 45.639 C -26.284 47.269 -26.754 49.129 -26.754 51.129 C -26.754 53.129 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.769 C -12.984 43.769 -11.424 44.379 -10.174 45.579 L -6.714 42.119 C -8.804 40.179 -11.514 39.019 -14.754 39.019 C -19.444 39.019 -23.494 41.719 -25.464 45.639 L -21.484 48.729 C -20.534 45.879 -17.884 43.769 -14.754 43.769 Z" />
    </g>
  </svg>
);

export const Icons = {
  Logo: LetexLogo,
  Google: GoogleIcon,
  Play,
  Pause,
  Cpu,
  Sparkles,
  ArrowRight,
  Maximize: Maximize2,
  Refresh: RefreshCw,
  Download,
  Code: Code2,
  Lab: FlaskConical,
  Close: X,
  X,
  ZoomIn,
  ZoomOut,
  Check,
  LogOut,
  History,
  User,
  Calendar,
  Save,
  MessageSquare,
  Send,
  Bot
};
