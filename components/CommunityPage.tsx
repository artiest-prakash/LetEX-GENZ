
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Icons } from './Icons';
import { HistoryItem } from '../types';

interface CommunityPageProps {
  onLoadSimulation: (item: HistoryItem) => void;
}

const CATEGORIES = ['All', 'Physics', 'Chemistry', 'Biology', 'Math', 'Space'];

export const CommunityPage: React.FC<CommunityPageProps> = ({ onLoadSimulation }) => {
  const [simulations, setSimulations] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchCommunitySimulations();
  }, []);

  const fetchCommunitySimulations = async () => {
    setLoading(true);
    // Fetching the last 50 simulations. In a real app, we'd filter by 'public' flag.
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching community sims:", error);
    } else if (data) {
      setSimulations(data as HistoryItem[]);
    }
    setLoading(false);
  };

  // Simple keyword matching for categorization since DB doesn't have tags
  const filteredSimulations = simulations.filter(sim => {
    if (activeCategory === 'All') return true;
    const text = (sim.title + " " + sim.prompt).toLowerCase();
    
    switch (activeCategory) {
      case 'Physics': return text.match(/gravity|pendulum|force|motion|wave|friction|magnet|optics/);
      case 'Chemistry': return text.match(/molecule|atom|reaction|bond|fluid|gas/);
      case 'Biology': return text.match(/cell|dna|life|evolution|population/);
      case 'Math': return text.match(/fractal|chaos|graph|geometry|calculus|pi/);
      case 'Space': return text.match(/orbit|planet|star|galaxy|solar|gravity|black hole/);
      default: return true;
    }
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-purple-50 rounded-2xl mb-4 text-purple-600">
           <Icons.Globe className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">LetEX Community</h1>
        <p className="text-slate-500">Discover what other researchers and students are building.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center overflow-x-auto pb-4 mb-8 gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
              ${activeCategory === cat 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulations.length > 0 ? (
            filteredSimulations.map((sim) => (
              <div 
                key={sim.id}
                onClick={() => onLoadSimulation(sim)}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                {/* Visual Placeholder since we don't have thumbnails */}
                <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center group-hover:from-blue-50 group-hover:to-cyan-50 transition-colors relative">
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-100 to-transparent"></div>
                   <Icons.Lab className="w-12 h-12 text-slate-300 group-hover:text-blue-500 transition-colors group-hover:scale-110 duration-300" />
                   
                   {/* Subject Tag Estimate */}
                   <div className="absolute top-4 right-4 bg-white/80 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase text-slate-500">
                     {activeCategory === 'All' ? 'Sim' : activeCategory}
                   </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {sim.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                    {sim.prompt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                       <Icons.User className="w-3 h-3" /> 
                       {sim.user_id ? 'Researcher' : 'Anonymous'}
                    </span>
                    <span>{new Date(sim.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
               <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                 <Icons.Box className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-slate-500">No simulations found for "{activeCategory}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
