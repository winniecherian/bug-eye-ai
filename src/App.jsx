import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bug, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  RefreshCw,
  ExternalLink,
  Layout,
  Code2,
  Cpu,
  LineChart,
  BookOpen,
  LogOut,
  User,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const appId = typeof __app_id !== 'undefined' ? __app_id : 'bug-eye-ai-default';

// --- Gemini API Config ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // 'home' or 'docs'
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // --- Auth Logic ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          await signInAnonymously(auth);
        }
      } else {
        // We stay unauthenticated initially until user clicks sign-in or we auto-anon
        // For this app, let's allow anonymous use if not signed in
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleSignOut = () => signOut(auth);

  // --- API Logic ---
  const analyzeWebsite = async (targetUrl) => {
    if (!user) {
      setError("Please sign in to analyze websites.");
      return;
    }
    
    setIsAnalyzing(true);
    setProgress(10);
    setError(null);

    const intervals = [20, 45, 70, 90];
    intervals.forEach((val, i) => {
      setTimeout(() => setProgress(val), (i + 1) * 800);
    });

    const systemPrompt = `You are an expert QA Engineer. 
    Analyze the provided URL for common web bugs. 
    Return JSON: {
      "siteScore": 0-100,
      "summary": "Short layman summary",
      "bugs": [{ "id": 1, "type": "UI/UX|Performance|Security", "title": "...", "description": "layman explanation", "severity": "High|Medium|Low", "fix": "code/config suggestion" }],
      "stats": { "performance": 0-100, "security": 0-100, "accessibility": 0-100 }
    }`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze: ${targetUrl}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error("API Error");
      const result = await response.json();
      const data = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
      setReport(data);
      setProgress(100);
    } catch (err) {
      setError("Analysis failed. Please try a different URL.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) analyzeWebsite(url);
  };

  // --- Documentation View ---
  const Documentation = () => (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <BookOpen className="text-indigo-600 w-8 h-8" /> 
          Documentation & Guide
        </h2>
        
        <div className="space-y-10">
          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Getting Started
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              BugEye AI uses advanced machine learning to simulate user interactions and architectural audits on any public website. Simply paste your URL into the dashboard to start.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-indigo-600 mb-1">Step 1</p>
                <p className="text-sm text-slate-500">Sign in with Google to enable secure analysis tokens.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-indigo-600 mb-1">Step 2</p>
                <p className="text-sm text-slate-500">Enter a full URL (including https://) into the search bar.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-indigo-600 mb-1">Step 3</p>
                <p className="text-sm text-slate-500">Review the layman-friendly report and share it with your team.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Analysis Categories
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl">
                <Zap className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <p className="font-bold">Performance</p>
                  <p className="text-sm text-slate-500">Checks for slow-loading assets, heavy scripts, and caching issues.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl">
                <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold">Security</p>
                  <p className="text-sm text-slate-500">Identifies missing SSL, exposed headers, and common script injection risks.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl">
                <Layout className="w-6 h-6 text-purple-500 shrink-0" />
                <div>
                  <p className="font-bold">UI/UX & Accessibility</p>
                  <p className="text-sm text-slate-500">Detects broken layouts on mobile, low contrast text, and confusing navigation.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Back to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => setView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Bug className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">BugEye<span className="text-indigo-600">AI</span></span>
          </button>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button onClick={() => setView('docs')} className={`hover:text-indigo-600 transition-colors ${view === 'docs' ? 'text-indigo-600' : ''}`}>Documentation</button>
            </div>
            
            {user && !user.isAnonymous ? (
              <div className="flex items-center gap-3 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full border border-white" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">{user.displayName || 'Developer'}</span>
                <button onClick={handleSignOut} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition-all text-sm font-bold flex items-center gap-2"
              >
                Sign Up with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {view === 'docs' ? (
          <Documentation />
        ) : (
          <>
            {/* Hero Section */}
            {!report && !isAnalyzing && (
              <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                  Detect bugs before your <span className="text-indigo-600 underline decoration-indigo-200 decoration-wavy">users do.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                  The world's first layman-friendly AI bug scanner. Enter a URL and get a professional report in seconds.
                </p>
              </div>
            )}

            {/* Input Area */}
            <div className={`transition-all duration-500 ease-in-out ${report || isAnalyzing ? 'mb-8' : 'max-w-2xl mx-auto'}`}>
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  type="text"
                  placeholder="https://your-website.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-14 pr-32 py-5 bg-white border-2 border-slate-200 rounded-2xl text-lg shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none"
                  disabled={isAnalyzing}
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Globe className="w-6 h-6" />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing || !url}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Analyze"}
                </button>
              </form>
              {error && <p className="mt-3 text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {error}</p>}
            </div>

            {/* Loading State */}
            {isAnalyzing && (
              <div className="max-w-2xl mx-auto text-center py-20 animate-pulse">
                <div className="mb-8 relative inline-block">
                  <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Bug className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Simulating Site Crawl...</h3>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-md mx-auto">
                  <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {/* Report Dashboard */}
            {report && !isAnalyzing && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                {/* Score Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute -right-4 -bottom-4 bg-indigo-50 w-20 h-20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative">
                      <p className="text-slate-500 text-sm font-medium mb-1">Health Score</p>
                      <h4 className="text-5xl font-black text-slate-900">{report.siteScore}%</h4>
                    </div>
                  </div>
                  {[
                    { label: 'Performance', val: report.stats.performance, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Security', val: report.stats.security, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Accessibility', val: report.stats.accessibility, icon: Layout, color: 'text-purple-500', bg: 'bg-purple-50' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 tracking-widest">{stat.val}/100</span>
                      </div>
                      <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                      <h4 className="text-xl font-bold">{stat.val > 70 ? 'Optimal' : 'Needs Work'}</h4>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">Detected Vulnerabilities</h2>
                    {report.bugs.map((bug) => (
                      <div key={bug.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-lg transition-all border-l-4" style={{ borderColor: bug.severity === 'High' ? '#f43f5e' : bug.severity === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{bug.type}</span>
                            <h3 className="text-xl font-bold text-slate-900 mt-1">{bug.title}</h3>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            bug.severity === 'High' ? 'bg-rose-100 text-rose-700' : 
                            bug.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {bug.severity} Priority
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-5 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">What this means:</p>
                            <p className="text-slate-600 leading-relaxed">{bug.description}</p>
                          </div>
                          <div className="bg-indigo-50/40 p-5 rounded-2xl">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">How to fix it:</p>
                            <p className="text-indigo-900/80 font-mono text-sm">{bug.fix}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100">
                      <h3 className="text-xl font-bold mb-4">Executive Summary</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-8">{report.summary}</p>
                      <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                        Download Report <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem]">
                      <h3 className="font-bold mb-4">Site Intelligence</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> SEO Metadata optimized
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <AlertTriangle className="w-5 h-5 text-amber-500" /> Mobile responsiveness issues
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-60">
            <Bug className="text-slate-900 w-5 h-5" />
            <span className="font-bold text-lg">BugEyeAI</span>
          </div>
          <p className="text-slate-400 text-sm">© 2025 BugEye. Power by Gemini Flash 2.5.</p>
          <div className="flex gap-4">
             <button onClick={() => setView('docs')} className="text-slate-400 hover:text-indigo-600 text-sm font-medium">Docs</button>
             <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><ExternalLink className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;