import { useState } from 'react';
import { Key, Copy, Check, Terminal } from 'lucide-react';

interface ApiKeysPanelProps {
  apiKey: string;
}

export function ApiKeysPanel({ apiKey }: ApiKeysPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#e0e0e0]">API Keys</h1>
          <p className="text-[#666] text-sm mt-1">
            Manage your API keys and integration settings
          </p>
        </div>

        {/* Current Key */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-[#00ff88]" />
            <h2 className="text-lg font-medium text-[#e0e0e0]">Your API Key</h2>
          </div>
          
          <div className="key-display flex items-center justify-between gap-4">
            <code className="flex-1">{apiKey}</code>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#666] hover:text-[#00ff88] hover:border-[#00ff88]/30 transition-all"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          
          <p className="text-xs text-[#444] mt-3">
            This key grants access to the Synapse inference network. Keep it secure.
          </p>
        </div>

        {/* Quick Start */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={18} className="text-[#00ff88]" />
            <h2 className="text-lg font-medium text-[#e0e0e0]">Quick Start</h2>
          </div>
          
          <p className="text-sm text-[#666] mb-3">
            Use this snippet to start making requests:
          </p>
          
          <div className="key-display text-xs overflow-x-auto">
            <pre>{`curl https://api.synapse.sh/v1/chat/completions \\
  -H "Authorization: Bearer ${apiKey.slice(0, 20)}..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}</pre>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4">Rate Limits</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="text-xs text-[#666] uppercase tracking-wider">Requests / Minute</div>
              <div className="text-2xl font-mono text-[#e0e0e0] mt-1">60</div>
            </div>
            <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <div className="text-xs text-[#666] uppercase tracking-wider">Tokens / Day</div>
              <div className="text-2xl font-mono text-[#e0e0e0] mt-1">100K</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
