import React, { useState, useEffect } from 'react';
import { 
  Search, Bug, ShieldAlert, Zap, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, RefreshCw, ExternalLink, Layout, Code2, Cpu, LineChart, 
  BookOpen, Globe, Lock, Eye, ShieldX, History, Share2, ClipboardCheck, Info,
  ShieldCheck, Shield, Terminal, Fingerprint
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
    const saved = localStorage.getItem('bugeye_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (newReport, targetUrl) => {
    const entry = { url: targetUrl, score: newReport.siteScore, timestamp: new Date().toISOString(), report: newReport };
    const updated = [entry, ...history.filter(h => h.url !== targetUrl)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('bugeye_history', JSON.stringify(updated));
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
              content: `You are a Global Cybersecurity Lead specialized in Big Tech Infrastructure. 
              Your task is to audit websites specifically against the high-security benchmarks of Google, Meta (Facebook), and X.com. 
              Focus on: Hardened Headers (CSP, HSTS, XFO), Data Isolation, Information Disclosure prevention, and OAuth security patterns.
              You MUST provide a 'benchmarkReference' for every bug explaining which tech giant's security standard is being missed.`
            },
            {
              role: "user",
              content: `Perform a Hardened Security Audit for: ${targetUrl}. 
              Compare its architecture against Google's Zero-Trust, Meta's CSP strictness, and X.com's session management standards.
              
              Return a JSON object:
              {
                "siteScore": number,
                "summary": "layman summary",
                "bugs": [
                  {
                    "id": number,
                    "type": "Security|Performance|UI/UX",
                    "title": "string",
                    "description": "layman explanation",
                    "benchmarkReference": "Which specific Big Tech security standard (Google/Facebook/X) this is measured against",
                    "verificationMethod": "Explain how the AI simulated this check",
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

  const copyToClipboard = () => {
    const text = `BugEye AI Hardened Report for ${url}: Score ${report.siteScore}%. Benchmark verified.`;
    navigator.clipboard.writeText(text);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bugeye_hardened_report.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white border-red-700';
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const Documentation = () => (
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
            <p>BugEye AI simulates audits by comparing target URLs against the publicly documented security whitepapers of <strong>Google</strong> (Zero-Trust), <strong>Meta</strong> (XSS Mitigation), and <strong>X.com</strong> (Session Hardening). This ensures your site is measured against the best in the world.</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 text-center">
              <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm font-black text-indigo-600">G</div>
              <h4 className="font-bold text-slate-900 mb-1 text-sm">Google Standard</h4>
              <p className="text-[10px] uppercase tracking-tighter">Identity & TLS</p>
            </div>
            <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 text-center">
              <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm font-black text-blue-600">f</div>
              <h4 className="font-bold text-slate-900 mb-1 text-sm">Meta Standard</h4>
              <p className="text-[10px] uppercase tracking-tighter">CSP & Protection</p>
            </div>
            <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 text-center">
              <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm font-black text-slate-900">𝕏</div>
              <h4 className="font-bold text-slate-900 mb-1 text-sm">X Standard</h4>
              <p className="text-[10px] uppercase tracking-tighter">Auth & Integrity</p>
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
      {showCopyAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <ClipboardCheck className="w-5 h-5" /> Hardened Report Link Copied!
        </div>
      )}

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => { setView('home'); setReport(null); }} className="flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Bug className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight">BugEye<span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">AI</span></span>
          </button>
          
          <div className="flex items-center gap-8">
            <button onClick={() => setView('docs')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Hardened Benchmarks</button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Fingerprint className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Public Engine 2.0</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {view === 'docs' ? <Documentation /> : (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-tight">
                Find Website Bugs <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 font-black">Instantly.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Audited against the security protocols of Google, Meta, and X.com. Professional-grade penetration simulation without the sign-in.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(url) analyzeWebsite(url); }} className="relative mb-12 group">
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

            {!isAnalyzing && !report && history.length > 0 && (
              <div className="mb-12 animate-in fade-in duration-700">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" /> Hardened Session History
                </h3>
                <div className="flex flex-wrap gap-3">
                  {history.map((h, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setUrl(h.url); setReport(h.report); }}
                      className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 hover:border-indigo-500 hover:shadow-lg transition-all"
                    >
                      <Globe className="w-4 h-4 text-slate-400" />
                      {h.url}
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{h.score}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 bg-rose-50 border-2 border-rose-100 text-rose-700 rounded-[2rem] mb-12 flex items-start gap-5 animate-in slide-in-from-top-4">
                <ShieldX className="w-8 h-8 shrink-0 mt-1" />
                <div>
                  <p className="font-black text-lg mb-1 tracking-tight">Audit Interrupted</p>
                  <p className="text-md font-medium opacity-80">{error}</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-24 space-y-8 animate-pulse">
                <div className="relative inline-block">
                  <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                  <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Applying Big Tech Benchmarks...</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Comparing architecture against Google, Meta & X</p>
                </div>
              </div>
            )}

            {report && !isAnalyzing && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-4">
                    <button onClick={downloadReport} className="flex items-center gap-2 text-sm font-black text-slate-600 bg-white border border-slate-200 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Download className="w-4 h-4" /> Export Hardened Audit
                    </button>
                    <button onClick={copyToClipboard} className="flex items-center gap-2 text-sm font-black text-slate-600 bg-white border border-slate-200 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Share2 className="w-4 h-4" /> Share Results
                    </button>
                  </div>
                  <button onClick={() => { setReport(null); setUrl(''); }} className="text-sm font-black text-indigo-600 hover:underline">Clear Audit</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Security', val: report.stats?.security || 0, color: 'text-rose-600', icon: Lock },
                    { label: 'Performance', val: report.stats?.performance || 0, color: 'text-blue-600', icon: Zap },
                    { label: 'Access', val: report.stats?.accessibility || 0, color: 'text-purple-600', icon: CheckCircle2 },
                    { label: 'SEO Rank', val: report.stats?.seo || 0, color: 'text-emerald-600', icon: LineChart }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl group hover:border-indigo-500 transition-colors">
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

                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -z-0 opacity-40"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-10 border-b border-slate-100 relative z-10">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Security Profile Analysis</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-lg uppercase tracking-widest text-[10px]">Llama-3.3 Hardened Engine</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <span className="text-indigo-600 font-black uppercase tracking-widest text-[10px]">Google/Meta/X Benchmarks Applied</span>
                      </div>
                    </div>
                    <div className="bg-indigo-600 px-10 py-6 rounded-[2rem] shadow-2xl shadow-indigo-200">
                      <div className="text-5xl font-black text-white">{report.siteScore || 0}%</div>
                    </div>
                  </div>

                  <div className="mb-14 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Synthetic Crawl Conclusion</h3>
                    </div>
                    <p className="text-2xl text-slate-700 font-semibold leading-relaxed font-serif italic border-l-8 border-indigo-100 pl-8">
                      "{report.summary}"
                    </p>
                  </div>
                  
                  <div className="space-y-8 relative z-10">
                    {report.bugs?.map((bug, i) => (
                      <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-indigo-300 hover:bg-white transition-all duration-500 group">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-white rounded-lg border border-slate-200 text-indigo-600 uppercase text-[9px] font-black tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" /> {bug.type}
                              </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{bug.title}</h3>
                          </div>
                          <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getSeverityStyles(bug.severity)}`}>
                            {bug.severity} Risk
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vulnerability Detail</h4>
                              <p className="text-slate-600 leading-relaxed font-medium text-md">{bug.description}</p>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3" /> Industry Benchmark Reference
                                </h4>
                                <p className="text-xs text-indigo-800 font-bold italic">{bug.benchmarkReference}</p>
                              </div>
                              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Eye className="w-3 h-3" /> AI Verification Method
                                </h4>
                                <p className="text-[10px] text-slate-600 font-medium">{bug.verificationMethod}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Remediation Script (Hardened)</h4>
                            <div className="bg-slate-900 text-indigo-300 p-6 rounded-3xl font-mono text-[11px] whitespace-pre-wrap border border-slate-800 shadow-2xl leading-relaxed">
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
            <span className="font-black text-lg">BugEye AI x Hardened Security</span>
          </div>
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">
            Benchmarked against Google, Meta & X Infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;