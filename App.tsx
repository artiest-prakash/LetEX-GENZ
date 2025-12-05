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
          setUserProfile(payload.new as UserProfile);
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  };

  const fetchUserProfile = async (userId: string) => {
    let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setUserProfile(data as UserProfile);
  };

  const fetchHistory = async (userId: string) => {
    setIsLoadingHistory(true);
    const { data } = await supabase.from('simulations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setHistory(data as HistoryItem[]);
    setIsLoadingHistory(false);
  };

  const checkPendingGeneration = async (currentUser: any) => {
    const pendingPrompt = localStorage.getItem('pending_gen_prompt');
    const pendingType = localStorage.getItem('pending_gen_type');

    if (pendingPrompt && currentUser) {
        localStorage.removeItem('pending_gen_prompt');
        localStorage.removeItem('pending_gen_type');
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
      options: { redirectTo: window.location.origin }
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
    if (!userToUse) { setShowLoginModal(true); return; }

    if (userProfile && (userProfile.credits < COST_2D || userProfile.is_banned)) {
        alert(userProfile.is_banned ? "Account restricted." : "Insufficient credits.");
        return;
    }

    setStatus(GenerationStatus.GENERATING);
    setError(null);
    setSimulation(null);
    setPendingSimulation(null);
    setSaveStatus(null);
    setCurrentPage('home');

    try {
      const data = await generateSimulationCode(promptToUse, false, selectedModel);
      setPendingSimulation(data);
      if (userToUse) {
        const newCredits = Math.max(0, (userProfile?.credits || 0) - COST_2D);
        setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);
        await supabase.from('profiles').update({ credits: newCredits }).eq('id', userToUse.id);
      }
    } catch (err) {
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
    if (!targetSim || !user) { if(!user) setShowLoginModal(true); return; }

    setSaveStatus('saving');
    const { error: saveError } = await supabase.from('simulations').insert({
      user_id: user.id,
      title: targetSim.title,
      prompt: prompt || targetSim.title, 
      simulation_data: targetSim
    });

    if (saveError) {
      setSaveStatus('error');
      alert("Save failed: " + saveError.message);
    } else {
      setSaveStatus('saved');
      fetchHistory(user.id);
    }
  };

  const handlePublish = async (simToPublish?: GeneratedSimulation) => {
    const targetSim = simToPublish || simulation;
    if (!targetSim || !user) { if(!user) setShowLoginModal(true); return; }

    const { error: saveError } = await supabase.from('simulations').insert({
        user_id: user.id,
        title: targetSim.title,
        prompt: prompt || targetSim.title,
        simulation_data: targetSim,
    });

    if (saveError) alert("Failed to publish.");
    else {
        alert("Published Successfully!");
        setSaveStatus('saved');
        fetchHistory(user.id);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setSimulation(item.simulation_data);
    setStatus(GenerationStatus.COMPLETED);
    setSaveStatus('saved');
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSimulation = () => {
    setSimulation(null);
    setPendingSimulation(null);
    setStatus(GenerationStatus.IDLE);
    setPrompt('');
    setSaveStatus(null);
  };

  const userName = userProfile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || "Explorer";
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 bg-[#f8fafc]">
      
      {/* BACKGROUND AMBIENT BLOBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[120px] opacity-70 mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[600px] h-[600px] bg-purple-100/60 rounded-full blur-[120px] opacity-70 mix-blend-multiply"></div>
          <div className="absolute top-[30%] right-[20%] w-[50vw] md:w-[400px] h-[400px] bg-cyan-100/50 rounded-full blur-[100px] opacity-50 mix-blend-multiply"></div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      <BetaPopup />

      {/* Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
           <div className="bg-white pl-4 pr-6 py-3 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <Icons.Sparkles className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-800 text-sm">Credits Added Successfully!</p>
           </div>
        </div>
      )}

      {/* Navigation */}
      {currentPage !== 'admin' && (
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => setCurrentPage('home')}>
                <div className="bg-blue-50 p-1.5 md:p-2 rounded-xl text-blue-600 border border-blue-100">
                    <Icons.Logo className="w-6 h-6" />
                </div>
                <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 font-brand">LetEX</span>
            </div>

            {/* Desktop Center Tabs */}
            <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200">
                {['home', '3d', 'community'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => { setCurrentPage(tab as Page); resetSimulation(); }}
                      className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all ${currentPage === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {tab === 'home' ? '2D Lab' : tab === '3d' ? '3D Lab' : 'Community'}
                    </button>
                ))}
                {isAdmin && <button onClick={() => setCurrentPage('admin')} className="px-6 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">Admin</button>}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Assistant Toggle */}
                <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-2 md:px-3 md:py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 flex items-center gap-2 transition-all">
                    <Icons.Sparkles className="w-5 h-5 md:w-4 md:h-4 text-blue-500" />
                    <span className="hidden md:inline">Assistant</span>
                </button>

                {user ? (
                    <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200">
                        {/* Credits */}
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
                           <Icons.Cpu className="w-3.5 h-3.5 text-blue-500" />
                           {userProfile?.credits || 0}
                        </div>

                        {/* Profile Pic */}
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white cursor-pointer relative group">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full" />
                            ) : userName.charAt(0)}
                            
                            {/* Dropdown for Logout */}
                            <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                                    <Icons.LogOut className="w-3 h-3" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowLoginModal(true)} className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-bold shadow-lg shadow-slate-900/10">Sign In</button>
                )}
            </div>
        </div>

        {/* Mobile Tabs Row */}
        <div className="md:hidden flex items-center justify-center gap-2 pb-3 px-4 overflow-x-auto no-scrollbar">
            {['home', '3d', 'community'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => { setCurrentPage(tab as Page); resetSimulation(); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${currentPage === tab ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {tab === 'home' ? '2D Lab' : tab === '3d' ? '3D Lab' : 'Community'}
                </button>
            ))}
            {isAdmin && <button onClick={() => setCurrentPage('admin')} className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Admin</button>}
        </div>
      </nav>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 md:px-0">
        
        {currentPage === 'about' && <AboutPage onBack={() => setCurrentPage('home')} />}
        {currentPage === 'terms' && <TermsPage onBack={() => setCurrentPage('home')} />}
        {currentPage === 'admin' && <AdminDashboard onBack={() => setCurrentPage('home')} />}
        
        {currentPage === '3d' && (
          <ThreeDDashboard 
             user={user}
             userProfile={userProfile}
             onUpdateCredits={(newCredits) => setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null)}
             onSave={handleManualSave} 
             onPublish={handlePublish}
             saveStatus={saveStatus}
             onRequireLogin={() => setShowLoginModal(true)}
          />
        )}

        {currentPage === 'community' && <CommunityPage onLoadSimulation={loadFromHistory} />}
        
        {currentPage === 'home' && (
          <div className="w-full max-w-5xl flex flex-col items-center pb-20 pt-8 md:pt-12">
            {status === GenerationStatus.IDLE && (
              <div className="text-center mb-10 animate-in slide-in-from-bottom-8 fade-in w-full relative z-10 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-blue-200 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-6 shadow-sm backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  AI Physics Engine v2.0
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                  {user ? `Welcome back, ${userName}` : "Welcome to LetEX"}
                </h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                  Describe any physics experiment or simulation. LetEX will build it instantly.
                </p>
              </div>
            )}

            {/* GENERATION UI */}
            {status !== GenerationStatus.COMPLETED && status !== GenerationStatus.GENERATING && (
              <div className="w-full transition-all duration-700 ease-in-out px-4 md:px-0">
                
                {/* INPUT CONTAINER - FIXED: Removed overflow-hidden, added relative layout constraints */}
                <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col relative group w-full max-w-4xl mx-auto z-30">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your simulation (e.g., 'A double pendulum with adjustable mass')"
                      className="w-full bg-transparent px-6 py-6 pb-24 text-slate-800 placeholder-slate-400 focus:outline-none resize-none h-48 md:h-52 text-lg font-medium leading-relaxed rounded-t-3xl rounded-b-3xl"
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                    />
                    
                    {/* Focus Ring Visualization */}
                    <div className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-transparent group-focus-within:border-blue-100 transition-all"></div>

                    {/* Bottom Action Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-between rounded-b-3xl">
                         <div className="relative z-50">
                            <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
                         </div>

                         <button
                          onClick={() => handleGenerate()}
                          disabled={!prompt.trim()}
                          className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all relative z-40
                            ${!prompt.trim() 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:scale-[1.02]'}
                          `}
                        >
                          Generate <Icons.ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* SUGGESTION SLIDER */}
                {status === GenerationStatus.IDLE && (
                  <div className="mt-8 w-full max-w-4xl mx-auto relative z-20">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-4">Try these examples</p>
                     
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#f8fafc] to-transparent z-10 pointer-events-none md:hidden"></div>
                        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#f8fafc] to-transparent z-10 pointer-events-none md:hidden"></div>
                        
                        <div className="flex gap-3 overflow-x-auto pb-4 px-4 snap-x no-scrollbar">
                            {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(s)}
                                className="snap-start shrink-0 px-4 py-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-sm text-slate-600 hover:text-blue-600 rounded-xl transition-all shadow-sm whitespace-nowrap"
                            >
                                {s}
                            </button>
                            ))}
                        </div>
                     </div>
                  </div>
                )}

                {/* History Grid */}
                {status === GenerationStatus.IDLE && user && history.length > 0 && (
                  <div className="mt-12 max-w-5xl w-full px-2 relative z-10">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Your Recent Lab Work</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.slice(0, 6).map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => loadFromHistory(item)}
                          className="group bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                             <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Icons.Lab className="w-4 h-4" /></div>
                             <span className="text-[10px] text-slate-400 font-mono">{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RESULTS AREA */}
            <div className="w-full max-w-6xl mt-4 relative z-10">
              {status === GenerationStatus.GENERATING && (
                <LoadingState simulationTitle={pendingSimulation?.title} onComplete={onLoadingComplete} userName={userName} />
              )}
              {status === GenerationStatus.ERROR && (
                <div className="max-w-md mx-auto p-8 bg-white border border-red-100 rounded-2xl shadow-lg text-center">
                  <Icons.X className="w-10 h-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Simulation Failed</h3>
                  <p className="text-slate-500 mb-6 text-sm">{error}</p>
                  <button onClick={() => handleGenerate()} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">Try Again</button>
                </div>
              )}
              {status === GenerationStatus.COMPLETED && simulation && (
                 <SimulationViewer simulation={simulation} onClose={resetSimulation} onSave={() => handleManualSave()} onPublish={() => handlePublish()} saveStatus={saveStatus} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {currentPage !== 'admin' && (
      <footer className="w-full text-center py-8 text-slate-400 text-xs border-t border-slate-100 bg-white relative z-10">
        <p>© 2024 LetEX Virtual Labs</p>
      </footer>
      )}
      
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;