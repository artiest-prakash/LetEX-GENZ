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
import { AdminDashboard } from './components/AdminDashboard';
import { ModelSelector } from './components/ModelSelector';
import { GenerationStatus, GeneratedSimulation, HistoryItem, Page, UserProfile, AIModelId } from './types';

const ADMIN_EMAIL = "ommprakashswain117@gmail.com";
const COST_2D = 2.5;

const SUGGESTIONS = [
  "A double pendulum chaotic physics simulation",
  "A solar system orbit simulator with gravity controls",
  "A fluid particle simulation with viscosity controls",
  "A projectile motion lab with wind resistance",
  "A wave interference simulator",
  "An interactive spring-mass damper system",
  "A visual demonstration of Pythagorean theorem",
  "Evolutionary steering behavior simulation"
];

// --- LOGIN MODAL COMPONENT ---
const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: () => void }> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-300 border border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
          <Icons.Close className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
             <Icons.User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Login to Continue</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Create simulations, save your work, and access the 3D studio.
            <br/>
            <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full mt-2 inline-block">
              🎉 Get 15 Free Credits Instantly
            </span>
          </p>

          <button 
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all hover:scale-[1.02] shadow-xl shadow-slate-900/10"
          >
            <Icons.Google className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <p className="mt-6 text-xs text-slate-400">
            By signing in, you agree to our Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModelId>('gemini-flash');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [simulation, setSimulation] = useState<GeneratedSimulation | null>(null);
  const [pendingSimulation, setPendingSimulation] = useState<GeneratedSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auth & History State
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  
  // UX State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  // Initialize Auth & Load History
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchHistory(session.user.id);
        checkPendingGeneration(session.user);
        setupRealtimeSubscription(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchHistory(session.user.id);
        checkPendingGeneration(session.user);
        setupRealtimeSubscription(session.user.id);
      } else {
        setHistory([]);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- REALTIME UPDATE SUBSCRIPTION ---
  const setupRealtimeSubscription = (userId: string) => {
    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime profile update:", payload.new);
          setUserProfile(payload.new as UserProfile);
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  };

  const fetchUserProfile = async (userId: string) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUserProfile(data as UserProfile);
    }
  };

  const fetchHistory = async (userId: string) => {
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setHistory(data as HistoryItem[]);
    }
    setIsLoadingHistory(false);
  };

  // --- AUTO GENERATE LOGIC ---
  const checkPendingGeneration = async (currentUser: any) => {
    const pendingPrompt = localStorage.getItem('pending_gen_prompt');
    const pendingType = localStorage.getItem('pending_gen_type');

    if (pendingPrompt && currentUser) {
        // Clear immediately to prevent loops
        localStorage.removeItem('pending_gen_prompt');
        localStorage.removeItem('pending_gen_type');
        
        // Show Welcome Toast
        setShowWelcomeToast(true);
        setTimeout(() => setShowWelcomeToast(false), 5000);

        if (pendingType === '3d') {
            setCurrentPage('3d');
            alert("Welcome back! Please click 'Render 3D' to start your pending simulation.");
        } else {
            setPrompt(pendingPrompt);
            setTimeout(() => {
                handleGenerate(pendingPrompt, currentUser);
            }, 1000);
        }
    }
  };

  const handleLogin = async () => {
    if (prompt.trim()) {
       localStorage.setItem('pending_gen_prompt', prompt);
       localStorage.setItem('pending_gen_type', currentPage === '3d' ? '3d' : '2d');
    }

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

  const handleGenerate = async (overridePrompt?: string, overrideUser?: any) => {
    const promptToUse = overridePrompt || prompt;
    const userToUse = overrideUser || user;

    if (!promptToUse.trim()) return;

    if (!userToUse) {
      setShowLoginModal(true);
      return;
    }

    if (userProfile) {
        if (userProfile.credits < COST_2D) {
            alert(`Insufficient credits! This simulation requires ${COST_2D} credits.`);
            return;
        }
        if (userProfile.is_banned) {
            alert("Your account has been restricted.");
            return;
        }
    }

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);
    setPendingSimulation(null);
    setSaveStatus(null);
    setCurrentPage('home');

    try {
      // Force 2D Generation
      const data = await generateSimulationCode(promptToUse, false, selectedModel);
      setPendingSimulation(data);
      
      // Deduct Credit
      if (userToUse) {
        const currentCredits = userProfile?.credits || 15;
        const newCredits = Math.max(0, currentCredits - COST_2D);
        
        setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);

        const { error } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userToUse.id);
            
        if (error) console.error("Credit deduction failed:", error);
      }

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
      setShowLoginModal(true);
      return;
    }

    setSaveStatus('saving');
    
    const { data, error: saveError } = await supabase.from('simulations').insert({
      user_id: user.id,
      title: targetSim.title,
      prompt: prompt || targetSim.title, 
      simulation_data: targetSim
    }).select();

    if (saveError) {
      console.error("Supabase Save Failed:", saveError);
      setSaveStatus('error');
      alert("Failed to save: " + saveError.message);
    } else {
      setSaveStatus('saved');
      fetchHistory(user.id);
    }
  };

  const handlePublish = async (simToPublish?: GeneratedSimulation) => {
    const targetSim = simToPublish || simulation;
    if (!targetSim) return;
    if (!user) {
        setShowLoginModal(true);
        return;
    }

    const { error: saveError } = await supabase.from('simulations').insert({
        user_id: user.id,
        title: targetSim.title,
        prompt: prompt || targetSim.title,
        simulation_data: targetSim,
    });

    if (saveError) {
        alert("Failed to publish to community.");
    } else {
        alert("Published to Community Successfully!");
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
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const userName = userProfile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || "Explorer";
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc]">
      
      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />

      {/* Beta Testing Popup */}
      <BetaPopup />

      {/* Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
           <div className="bg-white pl-4 pr-6 py-3 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Congratulations! 🎉</p>
                <p className="text-slate-500 text-xs">You got 15 free credits</p>
              </div>
           </div>
        </div>
      )}

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Navigation (Sticky & Glassmorphic) */}
      {currentPage !== 'admin' && (
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-6 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center gap-2 md:gap-3 group cursor-pointer shrink-0" onClick={() => setCurrentPage('home')}>
                <div className="bg-white p-1.5 md:p-2 rounded-xl shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                <Icons.Logo className="text-blue-600 w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-lg md:text-2xl font-bold tracking-tight text-slate-800 font-brand brand-font">LetEX</span>
            </div>

            {/* Center Tabs (Desktop) */}
            <div className="hidden md:flex items-center bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50">
                <button 
                onClick={() => { setCurrentPage('home'); resetSimulation(); }}
                className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${currentPage === 'home' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                2D Lab
                </button>
                <button 
                onClick={() => { setCurrentPage('3d'); resetSimulation(); }}
                className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${currentPage === '3d' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                3D Lab
                </button>
                <button 
                onClick={() => { setCurrentPage('community'); resetSimulation(); }}
                className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${currentPage === 'community' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                Community
                </button>
                {isAdmin && (
                    <button 
                    onClick={() => { setCurrentPage('admin'); resetSimulation(); }}
                    className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${currentPage === 'admin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                    Admin
                    </button>
                )}
            </div>

            {/* User Profile / Mobile Menu */}
            <div className="flex items-center gap-2 md:gap-4">
                
                {/* Assistant Toggle (Visible on Mobile now too, icon only) */}
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`
                        flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full text-sm font-bold transition-all border
                        ${isChatOpen 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
                    `}
                >
                    <Icons.Sparkles className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isChatOpen ? 'text-yellow-300' : 'text-blue-500'}`} />
                    <span className="hidden md:inline">Assistant</span>
                </button>

                {user ? (
                    <div className="flex items-center gap-2 md:gap-4 pl-2 md:pl-4 border-l border-slate-200/60">
                         {/* Credits (Desktop) */}
                        {userProfile && (
                            <div className="hidden md:flex px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 items-center gap-1.5 shadow-sm">
                                <Icons.Cpu className="w-3 h-3 text-blue-500" />
                                {userProfile.credits} Credits
                            </div>
                        )}
                        
                         {/* Credits (Mobile Compact) */}
                         {userProfile && (
                            <div className="md:hidden flex items-center gap-1 text-xs font-bold text-slate-500">
                                <Icons.Cpu className="w-3 h-3 text-blue-500" />
                                {userProfile.credits}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden lg:block">
                                <p className="text-xs font-bold text-slate-700 leading-tight">{userName}</p>
                                <p className={`text-[10px] leading-tight font-semibold ${userProfile?.is_pro ? 'text-yellow-600' : 'text-slate-400'}`}>
                                    {userProfile?.is_pro ? 'PRO MEMBER' : 'Free Account'}
                                </p>
                            </div>
                            
                            <div className={`
                                relative w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm cursor-pointer border border-white shrink-0
                                ${userProfile?.is_pro ? 'ring-2 ring-yellow-400 ring-offset-1 bg-slate-900' : 'bg-blue-100 text-blue-600'}
                            `}>
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full" />
                                ) : (
                                    <span>{userName.charAt(0).toUpperCase()}</span>
                                )}
                                {userProfile?.is_pro && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-[3px] border-2 border-white shadow-sm" title="Verified Pro">
                                        <Icons.Check className="w-2 h-2 stroke-[3]" />
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={handleLogout}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-full transition-colors hidden md:block"
                                title="Sign Out"
                            >
                                <Icons.LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-2 px-4 md:px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs md:text-sm font-semibold transition-all shadow-md shadow-slate-900/10"
                    >
                        <Icons.Google className="w-4 h-4" />
                        <span className="hidden md:inline">Sign In</span>
                        <span className="md:hidden">Login</span>
                    </button>
                )}
            </div>
        </div>

        {/* Mobile Tabs (Below Nav) */}
        <div className="md:hidden flex justify-center mt-3 pb-1 gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3">
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${currentPage === 'home' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>2D Lab</button>
            <button onClick={() => setCurrentPage('3d')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${currentPage === '3d' ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>3D Lab</button>
            <button onClick={() => setCurrentPage('community')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${currentPage === 'community' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>Community</button>
            {isAdmin && (
                 <button onClick={() => setCurrentPage('admin')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${currentPage === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>Admin</button>
            )}
        </div>
      </nav>
      )}

      <main className="relative z-10 flex-1 flex flex-col items-center w-full md:pt-4">
        
        {currentPage === 'about' && <AboutPage onBack={() => setCurrentPage('home')} />}
        {currentPage === 'terms' && <TermsPage onBack={() => setCurrentPage('home')} />}
        {currentPage === 'admin' && <AdminDashboard onBack={() => setCurrentPage('home')} />}
        
        {currentPage === '3d' && (
          <ThreeDDashboard 
             user={user}
             userProfile={userProfile}
             onUpdateCredits={(newCredits) => setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null)}
             onSave={(sim) => handleManualSave(sim)} 
             onPublish={(sim) => handlePublish(sim)}
             saveStatus={saveStatus}
             onRequireLogin={() => setShowLoginModal(true)}
          />
        )}

        {currentPage === 'community' && (
           <CommunityPage onLoadSimulation={loadFromHistory} />
        )}
        
        {currentPage === 'home' && (
          <div className="w-full px-4 pb-20 pt-10 flex flex-col items-center">
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

            {status !== GenerationStatus.COMPLETED && status !== GenerationStatus.GENERATING && (
              <div className="w-full max-w-5xl mb-12 transition-all duration-700 ease-in-out">
                {/* 2D Input Area - Modernized */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 max-w-3xl mx-auto overflow-hidden relative group">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your simulation (e.g., 'Double pendulum with adjustable mass')"
                      className="w-full bg-transparent rounded-2xl px-6 py-6 pb-20 text-slate-700 placeholder-slate-400 focus:outline-none transition-all resize-none h-40 md:h-44 text-lg font-medium leading-relaxed group-focus-within:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                    />
                    
                    {/* Focus Glow */}
                    <div className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300 border-2 border-transparent group-focus-within:border-blue-100 group-focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)]"></div>
                    
                    {/* Input Bottom Bar (Model Selector Left, Generate Right) */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                         {/* Model Selector (Bottom Left) */}
                        <ModelSelector 
                            selectedModel={selectedModel}
                            onSelect={setSelectedModel}
                        />

                        {/* Generate Button (Bottom Right) */}
                        <button
                          onClick={() => handleGenerate()}
                          disabled={!prompt.trim()}
                          className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300
                            ${!prompt.trim() 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95'}
                          `}
                        >
                          <span>Generate</span>
                          <Icons.ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                  </div>
                </div>
                
                {/* Horizontal Suggestion Slider */}
                {status === GenerationStatus.IDLE && (
                  <div className="mt-8 w-full max-w-5xl mx-auto overflow-x-auto pb-4 no-scrollbar">
                     <div className="flex gap-3 px-4 min-w-max mx-auto snap-x">
                        {SUGGESTIONS.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestion(s)}
                            className="snap-center px-5 py-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-sm text-slate-600 hover:text-blue-600 rounded-full transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                          >
                            {s}
                          </button>
                        ))}
                     </div>
                  </div>
                )}

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

            <div className="w-full max-w-6xl">
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
                    onClick={() => handleGenerate()}
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
                    onPublish={() => handlePublish()}
                    saveStatus={saveStatus}
                 />
              )}
            </div>
          </div>
        )}
      </main>

      {currentPage !== 'admin' && (
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
      )}
      
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

    </div>
  );
};

export default App;