import { useState } from 'react';
import { Copy, Check, Terminal, Wallet, Activity } from 'lucide-react';

interface RunNodePanelProps {
  wallet: string;
}

export function RunNodePanel({ wallet }: RunNodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [nodeStatus] = useState<'idle' | 'running' | 'error'>('idle');

  const installCommand = 'curl -fsSL https://synapse.sh/install.sh | bash';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#e0e0e0]">Run a Node</h1>
          <p className="text-[#666] text-sm mt-1">
            Contribute compute and earn rewards
          </p>
        </div>

        {/* One-Line Install */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={18} className="text-[#00ff88]" />
            <h2 className="text-lg font-medium text-[#e0e0e0]">Quick Install</h2>
          </div>
          
          <p className="text-sm text-[#666] mb-3">
            Run this command on any machine with a GPU:
          </p>
          
          <div className="key-display flex items-center justify-between gap-4">
            <code className="flex-1 text-xs">{installCommand}</code>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#666] hover:text-[#00ff88] hover:border-[#00ff88]/30 transition-all"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Wallet Configuration */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-[#00ff88]" />
            <h2 className="text-lg font-medium text-[#e0e0e0]">Earnings Wallet</h2>
          </div>
          
          {wallet ? (
            <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Connected</div>
              <code className="text-sm text-[#00ff88]">{wallet}</code>
            </div>
          ) : (
            <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <p className="text-sm text-[#666]">
                No wallet configured. Set one in Settings to receive earnings.
              </p>
            </div>
          )}
        </div>

        {/* Node Status */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-[#00ff88]" />
            <h2 className="text-lg font-medium text-[#e0e0e0]">Node Status</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              nodeStatus === 'running' ? 'bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.5)]' :
              nodeStatus === 'error' ? 'bg-[#ff4444]' : 'bg-[#444]'
            }`} />
            <span className={`capitalize ${
              nodeStatus === 'running' ? 'text-[#00ff88]' :
              nodeStatus === 'error' ? 'text-[#ff4444]' : 'text-[#666]'
            }`}>
              {nodeStatus}
            </span>
          </div>
          
          {nodeStatus === 'idle' && (
            <p className="text-sm text-[#444] mt-3">
              Run the install command above to start your node.
            </p>
          )}
        </div>

        {/* Earnings Estimate */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4">Earnings Estimate</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="text-xs text-[#666] uppercase tracking-wider">Daily</div>
              <div className="text-xl font-mono text-[#e0e0e0] mt-1">~$5-15</div>
              <div className="text-xs text-[#444] mt-1">RTX 4090</div>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="text-xs text-[#666] uppercase tracking-wider">Weekly</div>
              <div className="text-xl font-mono text-[#e0e0e0] mt-1">~$35-105</div>
              <div className="text-xs text-[#444] mt-1">RTX 4090</div>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="text-xs text-[#666] uppercase tracking-wider">Monthly</div>
              <div className="text-xl font-mono text-[#e0e0e0] mt-1">~$150-450</div>
              <div className="text-xs text-[#444] mt-1">RTX 4090</div>
            </div>
          </div>
          <p className="text-xs text-[#444] mt-3">
            Estimates based on average network utilization. Actual earnings vary.
          </p>
        </div>
      </div>
    </div>
  );
}
