import React, { useState, useEffect } from 'react';
import { 
  Search, Bug, ShieldAlert, Zap, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, RefreshCw, ExternalLink, Layout, Code2, Cpu, LineChart, 
  BookOpen, LogOut, User, ShieldCheck, Globe, Lock, Eye, ShieldX
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- STEP 1: Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDr9zOG_5o8hj3ZanRMffgjwsLmS_lv7dY",
  authDomain: "bug-eye-ai.firebaseapp.com",
  projectId: "bug-eye-ai",
  storageBucket: "bug-eye-ai.firebasestorage.app",
  messagingSenderId: "864428209575",
  appId: "1:864428209575:web:599e22f211d157e1ef7282",
  measurementId: "G-BYJ3DFH5BG"
};

// --- STEP 2: Initialize Firebase ---
let app, auth, db, provider;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// --- STEP 3: Groq API Config ---
const getApiKey = () => {
  try {
    return import.meta.env.VITE_GROQ_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Auth service is not ready. Please refresh.");
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Failed to sign in. Ensure Google Auth is enabled in Firebase Console.");
    }
  };

  const handleSignOut = () => auth && signOut(auth);

  const analyzeWebsite = async (targetUrl) => {
    if (!apiKey) {
      setError("Groq API Key Missing! Please add 'VITE_GROQ_API_KEY' to Vercel.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    const securityScenarios = [
      "SSL/TLS Certificate Validity & Strength",
      "Missing Security Headers (CSP, HSTS, X-Frame-Options)",
      "Cookie Vulnerabilities (HttpOnly, Secure, SameSite missing)",
      "Information Disclosure (Server version headers, sensitive paths)",
      "Cross-Site Scripting (XSS) entry points",
      "Broken Access Control or CSRF risks",
      "Comparison with industry leaders like X.com and Facebook.com security posture"
    ];

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a Senior Cybersecurity Auditor and QA Lead. 
              Analyze websites against modern security standards and provide high-readability JSON reports. 
              Be critical and technical, but explain fixes for a layman to understand.`
            },
            {
              role: "user",
              content: `Perform a deep security and technical audit for: ${targetUrl}. 
              Specifically investigate these scenarios: ${securityScenarios.join(", ")}.
              
              Return a JSON object with this schema:
              {
                "siteScore": number (0-100),
                "summary": "A high-level readable summary of security and performance",
                "bugs": [
                  {
                    "id": number,
                    "type": "Security|Performance|UI/UX",
                    "title": "string",
                    "description": "Deep layman explanation of the risk",
                    "severity": "Critical|High|Medium|Low",
                    "fix": "Specific code or configuration steps to resolve"
                  }
                ],
                "stats": {
                  "performance": number,
                  "security": number,
                  "accessibility": number,
                  "seo": number
                }
              }`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const result = await response.json();
      const data = JSON.parse(result.choices[0].message.content);
      setReport(data);
    } catch (err) {
      setError(`Analysis Failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'security': return <Lock className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      default: return <Layout className="w-4 h-4" />;
    }
  };

  const Documentation = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-200">
        <h2 className="text-4xl font-black mb-8 flex items-center gap-4 text-slate-900">
          <ShieldCheck className="text-indigo-600 w-10 h-10" /> Security Engine Docs
        </h2>
        <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
          <section className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Cpu className="w-6 h-6" /> Llama 3 Security Simulation
            </h3>
            <p>BugEye AI simulates "Penetration Tests" by analyzing a site's public architectural footprints. It checks if the site matches the rigorous security standards of platforms like Facebook or X (formerly Twitter).</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-slate-100 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-2">Header Audits</h4>
              <p className="text-sm">Evaluates CSP, HSTS, and Frame Protection to prevent clickjacking and injection.</p>
            </div>
            <div className="p-6 border border-slate-100 rounded-2xl">
              <h4 className="font-bold text-slate-900 mb-2">Data Leakage</h4>
              <p className="text-sm">Identifies if server versions or internal paths are accidentally exposed in HTTP responses.</p>
            </div>
          </div>
        </div>
        <button onClick={() => setView('home')} className="mt-12 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setView('home')} className="flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Bug className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight">BugEye<span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">AI</span></span>
          </button>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setView('docs')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Security Docs</button>
            {user ? (
              <div className="flex items-center gap-4 bg-slate-100 p-1.5 pl-4 rounded-full border border-slate-200">
                <span className="text-sm font-bold text-slate-700">{user.displayName || 'Dev Mode'}</span>
                <button onClick={handleSignOut} className="bg-white p-2 rounded-full shadow-sm hover:text-rose-500 transition-all"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={handleGoogleSignIn} className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-black hover:bg-slate-800 transition-all hover:shadow-xl active:scale-95">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {view === 'docs' ? <Documentation /> : (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-6xl font-black tracking-tighter text-slate-900">
                Audit Your Security <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Instantly.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium">
                Deep architectural analysis powered by Groq Llama 3. Compare your site against the giants of the web.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(url) analyzeWebsite(url); }} className="relative mb-16 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative">
                <input 
                  type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://facebook.com or your project URL..."
                  className="w-full p-8 pl-16 rounded-[2rem] border-2 border-white bg-white focus:border-indigo-600 outline-none shadow-2xl transition-all text-xl font-medium"
                />
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-6 h-6" />
                <button 
                  disabled={isAnalyzing}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 active:scale-95"
                >
                  {isAnalyzing ? <RefreshCw className="w-6 h-6 animate-spin" /> : "Run Audit"}
                </button>
              </div>
            </form>

            {error && (
              <div className="p-8 bg-rose-50 border-2 border-rose-100 text-rose-700 rounded-[2rem] mb-12 flex items-start gap-5 animate-in slide-in-from-top-4">
                <ShieldX className="w-8 h-8 shrink-0 mt-1" />
                <div>
                  <p className="font-black text-lg mb-1">Audit Failed</p>
                  <p className="text-md font-medium opacity-80">{error}</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-24 space-y-8 animate-pulse">
                <div className="relative inline-block">
                  <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                  <ShieldAlert className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Intercepting Network Patterns...</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Groq Llama 3 is performing a deep scan</p>
                </div>
              </div>
            )}

            {report && !isAnalyzing && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Security', val: report.stats?.security || 0, color: 'text-rose-600', icon: Lock },
                    { label: 'Performance', val: report.stats?.performance || 0, color: 'text-blue-600', icon: Zap },
                    { label: 'Accessibility', val: report.stats?.accessibility || 0, color: 'text-purple-600', icon: User },
                    { label: 'SEO Rank', val: report.stats?.seo || 0, color: 'text-emerald-600', icon: LineChart }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl hover:shadow-indigo-100 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className="text-3xl font-black text-slate-900">{stat.val}%</span>
                      </div>
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Main Report Card */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -z-0 opacity-40"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-10 border-b border-slate-100 relative z-10">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Site Health Report</h2>
                      <p className="text-slate-400 font-bold text-lg uppercase tracking-widest text-xs">Reference Model: Llama-3.3-70b</p>
                    </div>
                    <div className="bg-indigo-600 px-10 py-6 rounded-[2rem] shadow-2xl shadow-indigo-200 transform hover:scale-105 transition-transform">
                      <div className="text-5xl font-black text-white">{report.siteScore || 0}%</div>
                      <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest text-center mt-1">Global Score</p>
                    </div>
                  </div>

                  <div className="mb-14 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Auditor's Summary</h3>
                    </div>
                    <p className="text-2xl text-slate-700 font-semibold leading-relaxed font-serif italic">
                      "{report.summary}"
                    </p>
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                    {report.bugs?.map((bug, i) => (
                      <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-indigo-300 hover:bg-white transition-all duration-500 group">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-white rounded-lg border border-slate-200 text-indigo-600">
                                {getTypeIcon(bug.type)}
                              </span>
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{bug.type}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{bug.title}</h3>
                          </div>
                          <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getSeverityStyles(bug.severity)}`}>
                            {bug.severity} Risk
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Vulnerability Insight</h4>
                            <p className="text-slate-600 leading-relaxed font-medium">{bug.description}</p>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest">Developer Remediation</h4>
                            <div className="bg-slate-900 text-indigo-300 p-6 rounded-3xl font-mono text-xs whitespace-pre-wrap border border-slate-800 shadow-2xl leading-relaxed">
                              {bug.fix}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-20 border-t border-slate-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 opacity-40">
            <Bug className="w-6 h-6" />
            <span className="font-black text-lg">BugEye AI v2.0</span>
          </div>
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">
            Groq Llama-3.3-70b-Versatile Pipeline
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;