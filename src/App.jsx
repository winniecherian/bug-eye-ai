import React, { useState, useEffect } from 'react';
import { 
  Search, Bug, ShieldAlert, Zap, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, RefreshCw, ExternalLink, Layout, Code2, Cpu, LineChart, 
  BookOpen, LogOut, User, ShieldCheck, Globe 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, 
  signOut, signInAnonymously, signInWithCustomToken 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- STEP 1: Paste your Firebase Config from the Firebase Console here! ---
// Go to Firebase Console -> Project Settings -> Your Apps -> Web App -> Config
// Make sure to replace these placeholder strings with your actual keys.




// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDr9zOG_5o8hj3ZanRMffgjwsLmS_lv7dY",
  authDomain: "bug-eye-ai.firebaseapp.com",
  projectId: "bug-eye-ai",
  storageBucket: "bug-eye-ai.firebasestorage.app",
  messagingSenderId: "864428209575",
  appId: "1:864428209575:web:599e22f211d157e1ef7282",
  measurementId: "G-BYJ3DFH5BG"
};

// Initialize Firebase

const analytics = getAnalytics(app);

// --- STEP 2: Initialize Firebase (With safety check to prevent blank screens) ---
let app, auth, db, provider;
try {
  // Only initialize if the user has replaced the placeholder text
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// --- STEP 3: Gemini API Config (Safe Access) ---
const getApiKey = () => {
  try {
    // Attempt to access Vite environment variable
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
  const [progress, setProgress] = useState(0);
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
      setError("Firebase is not configured. Please add your credentials to the code.");
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Failed to sign in. Check Firebase Auth settings.");
    }
  };

  const handleSignOut = () => auth && signOut(auth);

  const analyzeWebsite = async (targetUrl) => {
    if (!apiKey) {
      setError("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your Vercel Environment Variables.");
      return;
    }
    
    setIsAnalyzing(true);
    setProgress(10);
    setError(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze this website for bugs: ${targetUrl}` }] }],
          systemInstruction: { parts: [{ text: "Return a JSON bug report with siteScore (number), summary (string), bugs (array of objects with id, type, title, description, severity, fix), and stats (object with performance, security, accessibility numbers)." }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) throw new Error("API Connection Error");
      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error("Empty response from AI");
      
      const data = JSON.parse(rawText);
      setReport(data);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Ensure the URL is valid and your API key is correct.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const Documentation = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <BookOpen className="text-indigo-600 w-8 h-8" /> Documentation
        </h2>
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>BugEye AI uses large language models to simulate a deep technical audit of any public website. It analyzes common architectural patterns and potential vulnerabilities based on standard modern web practices.</p>
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-amber-800 text-sm">
            Note: For the best results, ensure your Vercel Environment Variables are correctly configured with your Gemini API Key.
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
          <button onClick={() => setView('home')} className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><Bug className="text-white w-5 h-5" /></div>
            <span className="font-bold text-xl">BugEye<span className="text-indigo-600">AI</span></span>
          </button>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setView('docs')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Docs</button>
            {user ? (
              <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <span className="text-xs font-bold text-slate-700">{user.displayName || 'Developer'}</span>
                <button onClick={handleSignOut} className="hover:text-rose-500 transition-colors"><LogOut className="w-4 h-4" /></button>
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
            {/* Warning for unconfigured Firebase */}
            {firebaseConfig.apiKey === "YOUR_API_KEY" && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold">Firebase Configuration Required</p>
                  <p>The app is running in restricted mode. Please paste your Firebase credentials into <strong>App.jsx</strong> to enable Google Sign-In.</p>
                </div>
              </div>
            )}

            <div className="text-center mb-12">
              <h1 className="text-5xl font-black mb-4 tracking-tight">Find Website Bugs <span className="text-indigo-600">Instantly</span></h1>
              <p className="text-slate-500 text-lg">Enter a URL to generate a comprehensive AI-powered bug report.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); analyzeWebsite(url); }} className="relative mb-12 group">
              <input 
                type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-website.com"
                className="w-full p-6 pl-14 rounded-3xl border-2 border-slate-200 focus:border-indigo-600 outline-none shadow-xl transition-all text-lg"
              />
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <button 
                disabled={isAnalyzing}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-bold transition-all"
              >
                {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Analyze Site"}
              </button>
            </form>

            {isAnalyzing && (
              <div className="text-center py-20 animate-pulse">
                <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-6" />
                <h3 className="text-xl font-bold">Scanning Site Architecture...</h3>
                <p className="text-slate-400 mt-2">Checking UI elements and security headers</p>
              </div>
            )}

            {error && (
              <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl mb-8 flex items-center gap-4">
                <div className="bg-rose-100 p-2 rounded-full"><ShieldAlert className="w-6 h-6" /></div>
                <p className="font-medium">{error}</p>
              </div>
            )}

            {report && !isAnalyzing && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Performance', val: report.stats.performance, color: 'text-blue-600', icon: Zap },
                    { label: 'Security', val: report.stats.security, color: 'text-rose-600', icon: ShieldCheck },
                    { label: 'Accessibility', val: report.stats.accessibility, color: 'text-purple-600', icon: Layout }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <span className="text-2xl font-black">{stat.val}%</span>
                      </div>
                      <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-8 border-b border-slate-100">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">Overall Health Score</h2>
                      <p className="text-slate-500 mt-1">Based on common web vitals and security patterns</p>
                    </div>
                    <div className="bg-indigo-50 px-8 py-4 rounded-3xl border border-indigo-100">
                      <div className="text-4xl font-black text-indigo-600">{report.siteScore}%</div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4">Summary</h3>
                    <p className="text-lg text-slate-700 leading-relaxed italic">"{report.summary}"</p>
                  </div>
                  
                  <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-6">Detailed Findings</h3>
                  <div className="space-y-6">
                    {report.bugs.map((bug, i) => (
                      <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-colors group">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{bug.type}</span>
                            <h3 className="text-xl font-bold text-slate-900 mt-2">{bug.title}</h3>
                          </div>
                          <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                            bug.severity === 'High' ? 'bg-rose-100 text-rose-700' : 
                            bug.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {bug.severity} Severity
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Layman Explanation:</p>
                            <p className="text-slate-600 leading-relaxed text-sm">{bug.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Fix Suggestion:</p>
                            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs leading-relaxed group-hover:text-indigo-300 transition-colors">
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
    </div>
  );
};

export default App;