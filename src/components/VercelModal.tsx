import React, { useState } from 'react';
import { useParty } from '../context/PartyContext';
import { X, Check, Copy, ExternalLink, Terminal, ShieldCheck, Zap } from 'lucide-react';

export const VercelModal: React.FC = () => {
  const { isVercelModalOpen, setIsVercelModalOpen } = useParty();
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isVercelModalOpen) return null;

  const copyVercelCommand = () => {
    navigator.clipboard?.writeText('npm run build && npx vercel --prod');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
              <svg viewBox="0 0 75 65" className="w-4 h-4 fill-current">
                <polygon points="37.5,0 75,65 0,65" />
              </svg>
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-neutral-100">Deploy to Vercel</h2>
              <p className="text-xs text-neutral-400">Ready-to-ship configuration with vercel.json included</p>
            </div>
          </div>
          <button
            onClick={() => setIsVercelModalOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Vercel Configuration Verified</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              The project includes a pre-configured <code className="text-rose-400 font-mono bg-neutral-900 px-1 py-0.5 rounded">vercel.json</code> with SPA routing rules and client-side WebRTC signaling mesh.
            </p>
          </div>

          {/* Option 1: Git Push to Vercel */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Method 1: Connect via GitHub / GitLab
            </h3>
            <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-1.5 pl-1">
              <li>Push your code to a GitHub repository.</li>
              <li>Go to <span className="text-white font-semibold">vercel.com/new</span> and import the repository.</li>
              <li>Leave build command as <code className="text-neutral-200 font-mono">npm run build</code> and output as <code className="text-neutral-200 font-mono">dist</code>.</li>
              <li>Click <span className="text-white font-semibold">Deploy</span> — your live site will be live on <code className="text-rose-400 font-mono">.vercel.app</code> in ~30 seconds!</li>
            </ol>
          </div>

          {/* Option 2: Vercel CLI */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Method 2: Deploy with Vercel CLI
            </h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>npx vercel --prod</span>
              </div>
              <button
                onClick={copyVercelCommand}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs transition-colors cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* WebRTC & Sync Architecture Note */}
          <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-850 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Full-Stack & Peer Mesh Support</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              When deployed as a static site on Vercel, the app automatically switches to peer-to-peer WebRTC voice audio mesh and local storage sync. For a custom dedicated WebSocket backend, simply point <code className="text-neutral-300 font-mono">APP_URL</code> to your server.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <a
            href="https://vercel.com/docs/deployments/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <span>Vercel Documentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setIsVercelModalOpen(false)}
            className="px-4 py-2 bg-white hover:bg-neutral-200 text-neutral-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
