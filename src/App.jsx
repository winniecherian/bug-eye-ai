import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Bug, ShieldAlert, Zap, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, RefreshCw, ExternalLink, Layout, Code2, Cpu, LineChart, 
  BookOpen, Globe, Lock, Eye, ShieldX, History, Share2, ClipboardCheck, Info,
  ShieldCheck, Shield, Terminal, Fingerprint, Activity, Server, ShieldPlus,
  Network, Key, FileWarning, Gauge
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
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
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
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
  const [view, setView] = useState('home');
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bugeye_history_v2');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (newReport, targetUrl) => {
    const entry = { url: targetUrl, score: newReport.siteScore, timestamp: new Date().toISOString(), report: newReport };
    const updated = [entry, ...history.filter(h => h.url !== targetUrl)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('bugeye_history_v2', JSON.stringify(updated));
  };

  const analyzeWebsite = async (targetUrl) => {
    if (!apiKey) {
      setError("Groq API Key Missing! Please add 'VITE_GROQ_API_KEY' to Vercel.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

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
              content: `You are a Principal Security Engineer. Perform an exhaustive architectural security audit. 
              Do not be repetitive. Analyze the specific nature of the URL (e.g., if it's a shop, check transaction security; if it's a blog, check script injection).
              Compare directly against Google's Zero Trust and Meta's dynamic CSP standards.`
            },
            {
              role: "user",
              content: `Perform a High-Parameter Hardened Security Audit for: ${targetUrl}. 
              
              You must evaluate 12 specific dimensions:
              1. TLS/SSL Protocol Version & Cipher Suite Strength
              2. Content Security Policy (CSP) Strictness
              3. HSTS & Transport Security
              4. X-Frame-Options (Clickjacking protection)
              5. Cookie Attributes (Secure, HttpOnly, SameSite)
              6. Information Disclosure (Server Headers/Version leakage)
              7. Resource Isolation (COOP/COEP)
              8. Subresource Integrity (SRI) for 3rd party scripts
              9. DNSSEC and Domain Security
              10. API Authentication Patterns
              11. Frontend Vulnerabilities (XSS entry points)
              12. Comparison with Facebook/X/Google Infrastructure Benchmarks
              
              Return a JSON object:
              {
                "siteScore": number,
                "summary": "Deep layman summary",
                "detailedStats": {
                  "infrastructure": number,
                  "application": number,
                  "dataPrivacy": number,
                  "network": number
                },
                "parameters": [
                  {"name": "string", "score": number, "status": "Secure|Warning|Critical"}
                ],
                "bugs": [
                  {
                    "id": number,
                    "type": "string",
                    "title": "string",
                    "description": "layman explanation",
                    "benchmarkReference": "Specific Big Tech standard",
                    "verificationMethod": "How this was simulated",
                    "severity": "Critical|High|Medium|Low",
                    "fix": "Technical fix"
                  }
                ],
                "stats": { "performance": number, "security": number, "accessibility": number, "seo": number }
              }`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      const data = JSON.parse(result.choices[0].message.content);
      setReport(data);
      saveToHistory(data, targetUrl);
    } catch (err) {
      setError(`Audit Failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white border-red-700';
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 pb-20">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => { setView('home'); setReport(null); }} className="flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Bug className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight">BugEye<span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">AI</span></span>
          </button>
          
          <div className="flex items-center gap-8">
            <button onClick={() => setView('docs')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Methodology</button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Hardened v2.0</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'docs' ? (
           <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
           <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-200">
             <h2 className="text-4xl font-black mb-8 flex items-center gap-4 text-slate-900">
               <ShieldCheck className="text-indigo-600 w-10 h-10" /> Hardened Benchmarks
             </h2>
             <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
               <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-slate-300">
                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                   <Terminal className="w-6 h-6 text-indigo-400" /> Big Tech Methodology
                 </h3>
                 <p>BugEye AI compares target URLs against the publicly documented security whitepapers of <strong>Google</strong> (Zero-Trust), <strong>Meta</strong> (XSS Mitigation), and <strong>X.com</strong> (Session Hardening).</p>
               </section>
             </div>
             <button onClick={() => setView('home')} className="mt-12 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">Back to Dashboard</button>
           </div>
         </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-tight">
                Find Website Bugs <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 font-black italic">Instantly.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Advanced multi-parameter security audit. Benchmarked against the world's most hardened infrastructures.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(url) analyzeWebsite(url); }} className="relative mb-12 group max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative">
                <input 
                  type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="Analyze a site (e.g. facebook.com)..."
                  className="w-full p-8 pl-16 rounded-[2rem] border-2 border-white bg-white focus:border-indigo-600 outline-none shadow-2xl transition-all text-xl font-medium"
                />
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-6 h-6" />
                <button 
                  disabled={isAnalyzing}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center gap-2"
                >
                  {isAnalyzing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <>Audit Site <Shield className="w-5 h-5" /></>}
                </button>
              </div>
            </form>

            {isAnalyzing && (
              <div className="text-center py-24 space-y-10 animate-pulse max-w-4xl mx-auto">
                <div className="relative inline-block">
                  <div className="w-32 h-32 border-[12px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                  <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Syncing 12 Security Parameters...</h3>
                  <div className="flex justify-center gap-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-3 h-3 bg-indigo-200 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 bg-rose-50 border-2 border-rose-100 text-rose-700 rounded-[2rem] mb-12 flex items-start gap-5 animate-in slide-in-from-top-4 max-w-4xl mx-auto">
                <ShieldX className="w-8 h-8 shrink-0 mt-1" />
                <div>
                  <p className="font-black text-lg mb-1 tracking-tight">Audit Interrupted</p>
                  <p className="text-md font-medium opacity-80">{error}</p>
                </div>
              </div>
            )}

            {report && !isAnalyzing && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                
                {/* Visual Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Main Score Card */}
                   <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                           <div>
                              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Security Posture</h2>
                              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Global Infrastructure Audit</p>
                           </div>
                           <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-200 text-center">
                              <span className="text-5xl font-black block leading-none">{report.siteScore}%</span>
                              <span className="text-[10px] font-black uppercase tracking-widest mt-2 block opacity-80">Health</span>
                           </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                           <div className="flex items-center gap-3 mb-3">
                              <Eye className="w-5 h-5 text-indigo-500" />
                              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Auditor Conclusion</h3>
                           </div>
                           <p className="text-xl text-slate-700 font-semibold leading-relaxed italic">"{report.summary}"</p>
                        </div>
                     </div>
                     
                     {/* 12-Parameter Matrix */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                        {report.parameters?.map((p, idx) => (
                           <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                              <p className="text-[9px] font-black text-slate-400 uppercase truncate mb-1">{p.name}</p>
                              <div className="flex items-center justify-between">
                                 <span className="text-lg font-black">{p.score}%</span>
                                 <div className={`w-2 h-2 rounded-full ${p.status === 'Secure' ? 'bg-emerald-500' : p.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>

                   {/* Distribution Stats */}
                   <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between text-white">
                      <div className="space-y-8">
                         <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                            <Activity className="text-indigo-400 w-6 h-6" /> Risk Distribution
                         </h3>
                         <div className="space-y-6">
                            {[
                              { label: 'Infrastructure', val: report.detailedStats?.infrastructure, color: 'bg-blue-500' },
                              { label: 'Application', val: report.detailedStats?.application, color: 'bg-rose-500' },
                              { label: 'Data Privacy', val: report.detailedStats?.dataPrivacy, color: 'text-purple-500' },
                              { label: 'Network', val: report.detailedStats?.network, color: 'bg-emerald-500' }
                            ].map((s, idx) => (
                               <div key={idx} className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                     <span>{s.label}</span>
                                     <span className="text-white">{s.val}%</span>
                                  </div>
                                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                     <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{width: `${s.val}%`}}></div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                      <div className="mt-8 pt-8 border-t border-slate-800">
                         <div className="flex items-center gap-3 text-indigo-400 mb-2">
                            <ShieldPlus className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Verification Profile</span>
                         </div>
                         <p className="text-xs text-slate-400 leading-relaxed font-medium">This audit uses Groq's high-entropy Llama 3 engine to cross-reference known Big Tech security footprints.</p>
                      </div>
                   </div>
                </div>

                {/* Bug Details - The "Hardened" List */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                       <FileWarning className="text-rose-600" /> Vulnerability Remediation
                    </h2>
                    <div className="flex gap-2">
                      <button onClick={downloadReport} className="p-2 hover:bg-white rounded-lg transition-colors"><Download className="w-5 h-5 text-slate-400" /></button>
                      <button onClick={copyToClipboard} className="p-2 hover:bg-white rounded-lg transition-colors"><Share2 className="w-5 h-5 text-slate-400" /></button>
                    </div>
                  </div>
                  
                  <div className="grid gap-8">
                    {report.bugs?.map((bug, i) => (
                      <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 relative z-10">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 uppercase text-[10px] font-black tracking-widest">{bug.type}</span>
                              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: AUDIT_00{bug.id}</span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{bug.title}</h3>
                          </div>
                          <span className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${getSeverityStyles(bug.severity)}`}>
                            {bug.severity} Risk
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vulnerability Insight</h4>
                              <p className="text-slate-600 leading-relaxed font-medium text-lg">{bug.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100">
                                <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3" /> Benchmark Ref
                                </h4>
                                <p className="text-[11px] text-indigo-800 font-bold italic">{bug.benchmarkReference}</p>
                              </div>
                              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Eye className="w-3 h-3" /> Analysis Method
                                </h4>
                                <p className="text-[11px] text-slate-600 font-medium">{bug.verificationMethod}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Security Remediation Script</h4>
                               <Terminal className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="bg-slate-900 text-indigo-300 p-8 rounded-[2rem] font-mono text-xs whitespace-pre-wrap border border-slate-800 shadow-2xl leading-relaxed relative group/code overflow-x-auto">
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
            <span className="font-black text-lg">BugEye AI v2.5 Hardened</span>
          </div>
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">
            Benchmarked against Google, Meta & X Global Infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;