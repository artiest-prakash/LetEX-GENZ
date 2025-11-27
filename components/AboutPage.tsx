
import React from 'react';
import { Icons } from './Icons';

export const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-6">
          <Icons.Logo className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 font-brand">
          Reimagining the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Virtual Laboratory</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          LetEX replaces static, pre-built simulations with a dual-engine AI core (Gemini 2.5 & Llama 3) that builds physically accurate 2D & 3D environments instantly.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        
        {/* Feature 1 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
            <Icons.Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Model AI Core</h3>
          <p className="text-slate-500 leading-relaxed">
            We leverage <strong>Google Gemini 2.5</strong> for fast, accurate 2D physics and <strong>SambaNova's Llama 3 70B</strong> for complex, high-fidelity 3D generation. The right brain for the right task.
          </p>
        </div>

        {/* Feature 2 (New 3D) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
            <Icons.Box className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Photorealistic 3D Studio</h3>
          <p className="text-slate-500 leading-relaxed">
            Step into a "Virtual Studio" environment with infinite floors, soft shadow mapping, and physically based materials. Visualize molecules, solar systems, and abstract math in full WebGL.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
            <Icons.Code className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Natural Language Coding</h3>
          <p className="text-slate-500 leading-relaxed">
            Describe a double pendulum, a flock of birds, or a chaotic attractor in plain English. LetEX writes the JavaScript, HTML5 Canvas, and Three.js code automatically.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 mb-6">
            <Icons.Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Community & Sharing</h3>
          <p className="text-slate-500 leading-relaxed">
            Save your discoveries to the cloud. Share your simulations with the global research community. Remix and refine existing experiments with a single click.
          </p>
        </div>

      </div>

      {/* Comparison Section */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white mb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20" />
        
        <h2 className="text-3xl font-bold mb-10 relative z-10 text-center">Why LetEX is Different</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-slate-400 border-b border-slate-700 pb-2">Traditional Virtual Labs</h4>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-center gap-3">
                <Icons.X className="w-5 h-5 text-red-500 shrink-0" />
                Limited to pre-made experiments
              </li>
              <li className="flex items-center gap-3">
                <Icons.X className="w-5 h-5 text-red-500 shrink-0" />
                2D only or outdated graphics
              </li>
              <li className="flex items-center gap-3">
                <Icons.X className="w-5 h-5 text-red-500 shrink-0" />
                Static parameters (can't change the rules)
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-blue-400 border-b border-blue-900/50 pb-2">The LetEX Advantage</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Icons.Check className="w-5 h-5 text-green-400 shrink-0" />
                <span className="font-bold text-white">2D & 3D Generation</span> - Canvas & WebGL
              </li>
              <li className="flex items-center gap-3">
                <Icons.Check className="w-5 h-5 text-green-400 shrink-0" />
                <span className="font-bold text-white">SambaNova Powered</span> - Llama 3.3 Accuracy
              </li>
              <li className="flex items-center gap-3">
                <Icons.Check className="w-5 h-5 text-green-400 shrink-0" />
                <span className="font-bold text-white">Dynamic Control</span> - You define the variables
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
        >
          <Icons.Play className="w-5 h-5 fill-current" />
          Start Creating
        </button>
      </div>

    </div>
  );
};
