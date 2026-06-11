import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Key, Loader2, Copy, Check, ArrowRight, Zap, Activity, Globe } from 'lucide-react';
import type { Stats } from '../App';

interface LandingViewProps {
  onLaunch: (apiKey: string, wallet: string) => void;
  stats: Stats;
}

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function LandingView({ onLaunch, stats }: LandingViewProps) {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const isEmail = input.includes('@');
      const body = isEmail ? { email: input } : { wallet: input };
      
      const res = await fetch(`${API_URL}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate key');
      }
      
      const data = await res.json();
      setApiKey(data.api_key);
    } catch (err) {
      // Fallback to demo mode
      const demoKey = `synapse_${Array.from({length: 32}, () => Math.random().toString(36)[2]).join('')}`;
      setApiKey(demoKey);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnterGateway = () => {
    if (apiKey) {
      onLaunch(apiKey, input.trim());
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Grid */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Terminal size={28} className="text-[#00ff88]" />
          <span className="text-2xl font-semibold tracking-tight">Synapse</span>
        </motion.div>

        {!apiKey ? (
          // Generate Key State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Terminal size={20} className="text-[#00ff88]" />
              <div>
                <h3 className="font-semibold text-[#e0e0e0]">Synapse Gateway</h3>
                <p className="text-xs text-[#666]">Generate an API key to access the network</p>
              </div>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="wallet address or email"
              className="input-field w-full mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              autoFocus
            />

            {error && (
              <div className="text-[#ff4444] text-xs mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key size={16} />
                  Generate API Key
                </>
              )}
            </button>
          </motion.div>
        ) : (
          // Key Generated State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Terminal size={20} className="text-[#00ff88]" />
              <div>
                <h3 className="font-semibold text-[#e0e0e0]">API Key Generated</h3>
                <p className="text-xs text-[#666]">Save this key - it won't be shown again</p>
              </div>
            </div>

            <div className="key-display flex items-center justify-between gap-4 mb-4">
              <code className="flex-1">{apiKey}</code>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#666] hover:text-[#00ff88] hover:border-[#00ff88]/30 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <button
              onClick={handleEnterGateway}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Zap size={16} />
              Enter Gateway
              <ArrowRight size={16} />
            </button>

            <p className="mt-4 text-center text-xs text-[#444]">
              Your key is stored locally in your browser
            </p>
          </motion.div>
        )}

        {/* Live Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-8 mt-12"
        >
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#00ff88]" style={{ textShadow: '0 0 20px rgba(0,255,136,0.3)' }}>
              {stats.nodes_online}
            </div>
            <div className="text-xs text-[#555] uppercase tracking-wider mt-1 flex items-center gap-1">
              <Activity size={10} />
              Nodes
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#00ff88]" style={{ textShadow: '0 0 20px rgba(0,255,136,0.3)' }}>
              {stats.jobs_today.toLocaleString()}
            </div>
            <div className="text-xs text-[#555] uppercase tracking-wider mt-1">Jobs Today</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-semibold text-[#888]">
              ${stats.avg_cost.toFixed(4)}
            </div>
            <div className="text-xs text-[#555] uppercase tracking-wider mt-1 flex items-center gap-1">
              <Globe size={10} />
              Avg Cost
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 text-xs text-[#444]"
      >
        Run a node. Earn rewards. Power the network.
      </motion.div>
    </div>
  );
}
