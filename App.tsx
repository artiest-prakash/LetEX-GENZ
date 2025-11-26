
import React, { useState, useEffect } from 'react';
import { generateSimulationCode } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { SimulationViewer } from './components/SimulationViewer';
import { LoadingState } from './components/LoadingState';
import { AboutPage } from './components/AboutPage';
import { TermsPage } from './components/TermsPage';
import { ChatBot } from './components/ChatBot';
import { BetaPopup } from './components/BetaPopup';
import { Icons } from './components/Icons';
import { ThreeDDashboard } from './components/ThreeDDashboard';
import { CommunityPage } from './components/CommunityPage';
import { GenerationStatus, GeneratedSimulation, HistoryItem, Page } from './types';

const SUGGESTIONS = [
  "A double pendulum chaotic physics simulation",
  "A solar system orbit simulator with gravity controls",
  "A fluid particle simulation with viscosity controls",
  "A projectile motion lab with wind resistance",
  "A wave interference simulator"
];

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [pendingSimulation, setPendingSimulation] = useState<GeneratedSimulation | null>(null);
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
    setPendingSimulation(null);
    setSaveStatus(null);
    setCurrentPage('home');

    try {
      const data = await generateSimulationCode(prompt, false);
      setPendingSimulation(data);
    } catch (err) {
      console.error("Generation Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const onLoadingComplete = () => {
    if (pendingSimulation) {
      setSimulation(pendingSimulation);
      setStatus(GenerationStatus.COMPLETED);
    }
  };

  const handleManualSave = async (simToSave?: GeneratedSimulation) => {
    const targetSim = simToSave || simulation;
    if (!targetSim) return;

    if (!user) {
      handleLogin();
      return;
    }

    setSaveStatus('saving');
    
    const { error: saveError } = await supabase.from('simulations').insert({
      user_id: user.id,
      title: targetSim.title,
      prompt: prompt || targetSim.title, // Fallback if prompt was cleared
      simulation_data: targetSim
    });

    if (saveError) {
      console.error("Supabase Save Failed:", saveError);
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      fetchHistory(user.id);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setSimulation(item.simulation_data);
    setPendingSimulation(null);
    setStatus(GenerationStatus.COMPLETED);
    setSaveStatus('saved');
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const resetSimulation = () => {
    setSimulation(null);
    setPendingSimulation(null);
    setStatus(GenerationStatus.IDLE);
    setPrompt('');
    setSaveStatus(null);
    // Don't reset current page unless explicitly needed
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Explorer";

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc]">
      
      {/* Beta Testing Popup */}
      <BetaPopup />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100 group-hover:scale-105 transition-transform duration-300">
              <Icons.Logo className="text-blue-600 w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800 font-brand brand-font">LetEX</span>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-4 bg-white/50 backdrop-blur-sm p-1 rounded-full border border-slate-200/50">
            <button 
              onClick={() => { setCurrentPage('home'); resetSimulation(); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentPage === 'home' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              2D Lab
            </button>
            <button 
              onClick={() => { setCurrentPage('3d'); resetSimulation(); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentPage === '3d' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              3D Lab
            </button>
            <button 
              onClick={() => { setCurrentPage('community'); resetSimulation(); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentPage === 'community' ? 'bg-white text-purple-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Community
            </button>
          </div>
        </div>
        
        {/* Auth / Profile & LetEX AI Button */}
        <div className="flex items-center gap-4">
           {/* LetEX AI Button */}
           <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`
                hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border
                ${isChatOpen 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
              `}
            >
              <Icons.Sparkles className={`w-3.5 h-3.5 ${isChatOpen ? 'text-yellow-300' : 'text-blue-500'}`} />
              Assistant
            </button>

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

      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 pt-4 md:pt-10 pb-20">
        
        {currentPage === 'about' && <AboutPage onBack={() => setCurrentPage('home')} />}
        {currentPage === 'terms' && <TermsPage onBack={() => setCurrentPage('home')} />}
        
        {currentPage === '3d' && (
          <ThreeDDashboard 
             user={user} 
             onSave={(sim) => handleManualSave(sim)} 
             saveStatus={saveStatus}
          />
        )}

        {currentPage === 'community' && (
           <CommunityPage onLoadSimulation={loadFromHistory} />
        )}
        
        {currentPage === 'home' && (
          <>
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
                    <>Welcome To <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">LetEX</span></>
                  )}
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Describe a physics experiment, a game, or a scientific model. LetEX generates accurate, interactive simulations instantly.
                </p>
              </div>
            )}

            {/* Input Section */}
            {status !== GenerationStatus.COMPLETED && status !== GenerationStatus.GENERATING && (
              <div className="w-full mb-12 transition-all duration-700 ease-in-out">
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col gap-4 max-w-3xl mx-auto">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your simulation (e.g., 'Double pendulum with adjustable mass')"
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white rounded-xl px-5 py-4 pr-32 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-32 md:h-28 text-lg"
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
                        disabled={!prompt.trim()}
                        className={`
                          flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
                          ${!prompt.trim() 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95'}
                        `}
                      >
                        <span>Generate</span>
                        <Icons.ArrowRight className="w-4 h-4" />
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

                {/* History */}
                {status === GenerationStatus.IDLE && user && (
                  <div className="mt-16 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2">
                        <Icons.History className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Simulations</h3>
                      </div>
                      {isLoadingHistory && <Icons.Refresh className="w-3 h-3 text-slate-400 animate-spin" />}
                    </div>
                    {history.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => loadFromHistory(item)}
                            className="group bg-white hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Icons.Lab className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 group-hover:text-blue-700 line-clamp-1 mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.prompt}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-sm">No simulations saved yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content Area */}
            <div className="w-full">
              {status === GenerationStatus.GENERATING && (
                <LoadingState 
                  simulationTitle={pendingSimulation?.title} 
                  onComplete={onLoadingComplete}
                  userName={userName}
                />
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
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {status === GenerationStatus.COMPLETED && simulation && (
                 <SimulationViewer 
                    simulation={simulation}
                    onClose={resetSimulation}
                    onSave={() => handleManualSave()}
                    saveStatus={saveStatus}
                 />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 w-full text-center py-8 text-slate-400 text-sm">
        <p>© 2024 LetEX Virtual Labs. Physics Engine v2.5</p>
        <div className="mt-2 flex justify-center gap-4">
          <button onClick={() => setCurrentPage('terms')} className="hover:text-blue-500 transition-colors">
            Terms & Conditions
          </button>
          <button onClick={() => setCurrentPage('about')} className="hover:text-blue-500 transition-colors">
            About Us
          </button>
        </div>
      </footer>
      
      {/* Chat Bot Container */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

    </div>
  );
};

export default App;
