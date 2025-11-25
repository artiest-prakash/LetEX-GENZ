import React, { useState, useEffect } from 'react';
import { generateSimulationCode } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { SimulationViewer } from './components/SimulationViewer';
import { LoadingState } from './components/LoadingState';
import { Icons } from './components/Icons';
import { GenerationStatus, GeneratedSimulation, HistoryItem } from './types';

const SUGGESTIONS = [
  "A double pendulum chaotic physics simulation",
  "A solar system orbit simulator with gravity controls",
  "A fluid particle simulation with viscosity controls",
  "A projectile motion lab with wind resistance",
  "A wave interference simulator"
];

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auth & History State
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

  // Initialize Auth & Load History
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHistory(session.user.id);
      } else {
        setHistory([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = async (userId: string) => {
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching history:", error.message);
    } else if (data) {
      setHistory(data as HistoryItem[]);
    }
    setIsLoadingHistory(false);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetSimulation();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);
    setSaveStatus(null);

    try {
      // 1. Generate Simulation
      const data = await generateSimulationCode(prompt);
      setSimulation(data);
      setStatus(GenerationStatus.COMPLETED);
      
      // 2. Save to history if logged in
      if (user) {
        setSaveStatus('saving');
        console.log("Saving simulation to Supabase for user:", user.id);
        
        const { error: saveError } = await supabase.from('simulations').insert({
          user_id: user.id,
          title: data.title,
          prompt: prompt,
          simulation_data: data // Supabase client handles JSON object serialization
        });

        if (saveError) {
          console.error("Supabase Save Failed:", saveError);
          setSaveStatus('error');
        } else {
          console.log("Simulation saved successfully.");
          setSaveStatus('saved');
          // Refresh history list
          fetchHistory(user.id);
        }
      }

    } catch (err) {
      console.error("Generation/Save Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    console.log("Loading from history:", item.title);
    setPrompt(item.prompt);
    setSimulation(item.simulation_data);
    setStatus(GenerationStatus.COMPLETED);
    setSaveStatus('saved'); // It's already saved
    // Scroll to top to see simulation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const resetSimulation = () => {
    setSimulation(null);
    setStatus(GenerationStatus.IDLE);
    setPrompt('');
    setSaveStatus(null);
  };

  // Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Explorer";

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc]">
      
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={resetSimulation}>
          <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform duration-300">
            <Icons.Logo className="text-blue-600 w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 font-brand brand-font">LetEX</span>
        </div>
        
        {/* Auth / Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-slate-100 text-xs text-slate-400">
            <div className={`w-1.5 h-1.5 rounded-full ${status === GenerationStatus.GENERATING ? 'bg-blue-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
            {status === GenerationStatus.GENERATING ? 'Processing' : 'System Online'}
          </div>
          
          {user ? (
             <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {userName[0]}
                    </div>
                  )}
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-slate-700 leading-tight">{userName}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">Pro Member</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <Icons.LogOut className="w-4 h-4" />
                </button>
             </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-lg text-sm font-semibold transition-all"
            >
              <Icons.Google className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 pt-4 md:pt-10 pb-20">
        
        {/* Hero Section */}
        {status === GenerationStatus.IDLE && (
          <div className="text-center mb-10 animate-in slide-in-from-bottom-5 fade-in duration-700 max-w-5xl mx-auto mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              AI-Powered Simulation Engine v2.0
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
              {user ? (
                <>
                   <span className="text-slate-400 font-normal block text-3xl md:text-4xl mb-2">{getGreeting()}, {userName}</span>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Ready to Discover?</span>
                </>
              ) : (
                <>Welcome To <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Reality</span></>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Describe a physics experiment, a game, or a scientific model. LetEX generates accurate, interactive simulations instantly.
            </p>
          </div>
        )}

        {/* Input Section */}
        {status !== GenerationStatus.COMPLETED && (
          <div className={`w-full transition-all duration-700 ease-in-out ${status !== GenerationStatus.IDLE ? 'mb-8' : 'mb-12'}`}>
            <div className={`bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col gap-4 transition-all duration-500 ${status !== GenerationStatus.IDLE ? 'max-w-3xl mx-auto' : 'max-w-2xl mx-auto'}`}>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your simulation (e.g., 'Double pendulum with adjustable mass')"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white rounded-xl px-5 py-4 pr-32 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-32 md:h-28 text-lg"
                  disabled={status === GenerationStatus.GENERATING}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
                
                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || status === GenerationStatus.GENERATING}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
                      ${!prompt.trim() || status === GenerationStatus.GENERATING 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95'}
                    `}
                  >
                    {status === GenerationStatus.GENERATING ? (
                      <>
                        <Icons.Refresh className="w-4 h-4 animate-spin" />
                        <span>Compiling...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate</span>
                        <Icons.ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Suggestions */}
            {status === GenerationStatus.IDLE && (
              <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="px-4 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-sm text-slate-600 hover:text-blue-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Simulation History Cards */}
            {status === GenerationStatus.IDLE && user && (
              <div className="mt-16 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Icons.History className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Simulations</h3>
                  </div>
                  {isLoadingHistory && <Icons.Refresh className="w-3 h-3 text-slate-400 animate-spin" />}
                </div>
                
                {history.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-sm">No simulations saved yet. Try creating one!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group bg-white hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icons.Lab className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-700 line-clamp-1 mb-1">{item.title || "Untitled Simulation"}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.prompt}</p>
                        <div className="mt-auto flex items-center text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Load Environment <Icons.ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="w-full">
          {status === GenerationStatus.GENERATING && (
            <LoadingState />
          )}

          {status === GenerationStatus.ERROR && (
            <div className="max-w-xl mx-auto p-8 bg-white border border-red-100 rounded-2xl shadow-lg text-center animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.Lab className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Simulation Failed</h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <button 
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Try Again
              </button>
            </div>
          )}

          {status === GenerationStatus.COMPLETED && simulation && (
             <div className="relative">
               {saveStatus === 'saved' && (
                 <div className="absolute top-0 right-0 -mt-10 mb-4 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50 shadow-sm border border-green-200">
                   <Icons.Check className="w-3 h-3" />
                   Saved to History
                 </div>
               )}
               <SimulationViewer 
                  simulation={simulation}
                  onClose={resetSimulation}
               />
             </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 text-slate-400 text-sm">
        <p>© 2024 LetEX Virtual Labs. Physics Engine v2.5</p>
      </footer>

    </div>
  );
};

export default App;