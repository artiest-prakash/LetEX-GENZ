
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { AIModel, AIModelId } from '../types';

const MODELS: AIModel[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fastest inference, optimized for low latency simulations.',
    color: 'bg-blue-500'
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'High precision code generation, best for complex logic.',
    color: 'bg-orange-500'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Balanced performance and creativity.',
    color: 'bg-green-500'
  },
  {
    id: 'llama-3',
    name: 'Llama 3 70B',
    provider: 'Meta',
    description: 'Open source powerful model.',
    color: 'bg-purple-500'
  }
];

interface ModelSelectorProps {
  selectedModel: AIModelId;
  onSelect: (id: AIModelId) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
          border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={`w-2 h-2 rounded-full ${currentModel.color}`}></span>
        <span className="text-slate-700">{currentModel.name}</span>
        <Icons.ArrowRight className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Reasoning Engine
          </div>
          <div className="p-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
                  ${selectedModel === model.id ? 'bg-blue-50/80 ring-1 ring-blue-200' : 'hover:bg-slate-50'}
                `}
              >
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${model.color}`} />
                <div>
                  <div className="font-semibold text-slate-800 text-sm flex items-center justify-between w-full">
                    {model.name}
                    {selectedModel === model.id && <Icons.Check className="w-3 h-3 text-blue-600" />}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug mt-0.5">
                    {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
