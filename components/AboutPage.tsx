
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
          LetEX replaces static, pre-built simulations with a generative AI engine that builds physically accurate environments instantly from your imagination.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform duration-300">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
            <Icons.Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Generative Physics Core</h3>
          <p className="text-slate-500 leading-relaxed">
            Unlike traditional platforms that use hardcoded scenarios, LetEX writes the physics engine in real-time. Want to change gravity? Add wind? Just ask.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform duration-300">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
            <Icons.Code className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">No Coding Required</h3>
          <p className="text-slate-500 leading-relaxed">
            You don't need to know Python, JavaScript, or Unity. Describe your experiment in plain English, and our AI Architect constructs the code for you.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 hover:scale-105 transition-transform duration-300">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 mb-6">
            <Icons.Maximize className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Immersive & Minimal</h3>
          <p className="text-slate-500 leading-relaxed">
            Distraction-free UI designed for education. Fullscreen support, 16:9 cinematic aspect ratio, and intuitive external controls for data manipulation.
          </p>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white mb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-[100px] opacity-20" />
        
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
                Outdated graphics and UI
              </li>
              <li className="flex items-center gap-3">
                <Icons.X className="w-5 h-5 text-red-500 shrink-0" />
                Requires plugin downloads or Flash
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
                <span className="font-bold text-white">Infinite Possibilities</span> - Build anything
              </li>
              <li className="flex items-center gap-3">
                <Icons.Check className="w-5 h-5 text-green-400 shrink-0" />
                <span className="font-bold text-white">Modern Tech Stack</span> - React, WebGL, AI
              </li>
              <li className="flex items-center gap-3">
                <Icons.Check className="w-5 h-5 text-green-400 shrink-0" />
                <span className="font-bold text-white">Zero Setup</span> - Runs in browser instantly
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
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
        >
          <Icons.Play className="w-5 h-5 fill-current" />
          Start Creating Simulations
        </button>
      </div>

    </div>
  );
};
