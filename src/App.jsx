import React, { useState, useEffect } from 'react';
import { 
  Search, Bug, ShieldAlert, Zap, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, RefreshCw, ExternalLink, Layout, Code2, Cpu, LineChart, 
  BookOpen, LogOut, User, ShieldCheck, Globe 
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

// --- STEP 2: Initialize Firebase Safely ---
let app, auth, db, provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// --- STEP 3: Gemini API Config ---
const getApiKey = () => {
  try {
    // Looks for VITE_GEMINI_API_KEY in Vercel environment variables
    return import.meta.env.VITE_GEMINI_API_KEY || "";
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
      console.error(err);
      setError("Failed to sign in. Please ensure Google Auth is enabled in your Firebase Console.");
    }
  };

  const handleSignOut = () => auth && signOut(auth);

  const cleanJsonResponse = (text) => {
    if (!text) return "";
    let cleaned = text.trim();
    if (cleaned.includes('```')) {
      const parts = cleaned.split('```');
      cleaned = parts.length > 1 ? parts[1] : parts[0];
      if (cleaned.toLowerCase().startsWith('json')) {
        cleaned = cleaned.substring(4);
      }
    }
    return cleaned.trim();
  };

  const analyzeWebsite = async (targetUrl) => {
    if (!apiKey) {
      setError("API Key Missing! Please add 'VITE_GEMINI_API_KEY' to Vercel Environment Variables and Redeploy.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    const promptText = `Task: Perform a technical bug audit for the website: ${targetUrl}.
    Rules: Return ONLY a raw JSON object. No markdown, no intro text.
    
    JSON Format:
    {
      "siteScore": 85,
      "summary": "layman summary of site health",
      "bugs": [
        {
          "id": 1,
          "type": "Performance|UI|Security",
          "title": "Short title",
          "description": "Layman explanation",
          "severity": "High|Medium|Low",
          "fix": "Technical fix suggestion"
        }
      ],
      "stats": { "performance": 80, "security": 85, "accessibility": 90 }
    }`;

    // We will try the stable v1 endpoint which works for most keys
    const tryRequest = async (modelName) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });
      return response;
    };

    try {
      // Try primary stable model
      let response = await tryRequest("gemini-1.5-flash");

      // If primary fails with "not found", try the latest alias
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error?.message?.includes("not found")) {
          response = await tryRequest("gemini-1.5-flash-latest");
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error("AI returned empty results. Please try again.");
      
      const cleanedData = cleanJsonResponse(rawText);
      const data = JSON.parse(cleanedData);
      setReport(data);
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(`Critical Error: ${err.message}. Please ensure the Generative Language API is enabled for your key in Google AI Studio.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const Documentation = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <BookOpen className="text-indigo-600 w-8 h-8" /> Documentation
        </h2>
        <div className="space-y-6 text-slate-600 leading-relaxed">
          <p>BugEye AI uses large language models to simulate a site audit. It evaluates structural patterns, UI responsiveness, and security headers based on publicly available data.</p>
          <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 text-indigo-800 text-sm rounded-r-xl">
            <strong>Pro Tip:</strong> Ensure your API key is created at <a href="https://aistudio.google.com/" target="_blank" className="font-bold underline">Google AI Studio</a>. Keys from the standard Google Cloud Console sometimes require additional billing setup.
          </div>
        </div>
        <button onClick={() => setView('home')} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setView('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 p-2 rounded-lg"><Bug className="text-white w-5 h-5" /></div>
            <span className="font-bold text-xl">BugEye<span className="text-indigo-600">AI</span></span>
          </button>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setView('docs')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Docs</button>
            {user ? (
              <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <span className="text-xs font-bold text-slate-700">{user.displayName || 'Developer'}</span>
                <button onClick={handleSignOut} className="hover:text-rose-500 transition-colors ml-1"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={handleGoogleSignIn} className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {view === 'docs' ? <Documentation /> : (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight text-slate-900">
                Find Website Bugs <span className="text-indigo-600">Instantly</span>
              </h1>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">Enter any website URL to generate an AI-powered bug report in seconds.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(url) analyzeWebsite(url); }} className="relative mb-8 group">
              <input 
                type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-website.com"
                className="w-full p-6 pl-14 rounded-3xl border-2 border-slate-200 focus:border-indigo-600 outline-none shadow-xl transition-all text-lg"
              />
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <button 
                disabled={isAnalyzing}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200"
              >
                {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Analyze Site"}
              </button>
            </form>

            {error && (
              <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-bold mb-1">Configuration Required</p>
                  <p className="text-sm leading-relaxed opacity-90">{error}</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-20 animate-pulse">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                  <Bug className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">AI is Auditing Architecture...</h3>
                <p className="text-slate-400 mt-2 italic">Scanning UI components and security protocols</p>
              </div>
            )}

            {report && !isAnalyzing && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Performance', val: report.stats?.performance || 0, color: 'text-blue-600', icon: Zap },
                    { label: 'Security', val: report.stats?.security || 0, color: 'text-rose-600', icon: ShieldCheck },
                    { label: 'Accessibility', val: report.stats?.accessibility || 0, color: 'text-purple-600', icon: Layout }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <span className="text-2xl font-black text-slate-900">{stat.val}%</span>
                      </div>
                      <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-8 border-b border-slate-100 relative z-10">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Health Score</h2>
                      <p className="text-slate-500 mt-1">Simulated audit based on URL structure</p>
                    </div>
                    <div className="bg-indigo-600 px-8 py-5 rounded-3xl shadow-xl shadow-indigo-100">
                      <div className="text-4xl font-black text-white">{report.siteScore || 0}%</div>
                    </div>
                  </div>

                  <div className="mb-10 relative z-10">
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Executive Summary
                    </h3>
                    <p className="text-lg text-slate-700 leading-relaxed italic border-l-4 border-indigo-100 pl-6">
                      "{report.summary}"
                    </p>
                  </div>

                  <div className="space-y-6 relative z-10">
                    {report.bugs?.map((bug, i) => (
                      <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{bug.title}</h3>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            bug.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {bug.severity} Priority
                          </span>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Layman Explanation:</p>
                            <p className="text-slate-600 text-sm leading-relaxed">{bug.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Fix Suggestion:</p>
                            <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl font-mono text-[11px] whitespace-pre-wrap border border-slate-800 shadow-inner group-hover:border-indigo-900/50 transition-colors">
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

      <footer className="py-12 border-t border-slate-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center opacity-40 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bug className="w-5 h-5" />
            <span className="font-bold">BugEye AI v1.2</span>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest">Built with React & Gemini Stable API</p>
        </div>
      </footer>
    </div>
  );
};

export default App;