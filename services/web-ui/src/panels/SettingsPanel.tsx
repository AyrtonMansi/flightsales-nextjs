import { LogOut, Trash2, AlertTriangle } from 'lucide-react';

interface SettingsPanelProps {
  onLogout: () => void;
}

export function SettingsPanel({ onLogout }: SettingsPanelProps) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#e0e0e0]">Settings</h1>
          <p className="text-[#666] text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Account Section */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4">Account</h2>
          
          <div className="space-y-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#ff4444]/30 hover:bg-[#ff4444]/5 transition-all group"
            >
              <LogOut size={18} className="text-[#666] group-hover:text-[#ff4444]" />
              <div className="text-left">
                <div className="text-sm text-[#e0e0e0]">Logout</div>
                <div className="text-xs text-[#666]">Sign out of your account</div>
              </div>
            </button>
          </div>
        </div>

        {/* Data Section */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4">Data</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                if (confirm('Clear all chat history? This cannot be undone.')) {
                  localStorage.removeItem('synapse_chats');
                  window.location.reload();
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#ffaa00]/30 hover:bg-[#ffaa00]/5 transition-all group"
            >
              <Trash2 size={18} className="text-[#666] group-hover:text-[#ffaa00]" />
              <div className="text-left">
                <div className="text-sm text-[#e0e0e0]">Clear Chat History</div>
                <div className="text-xs text-[#666]">Remove all conversation history</div>
              </div>
            </button>

            <button
              onClick={() => {
                if (confirm('Delete all data and reset? This cannot be undone.')) {
                  localStorage.clear();
                  window.location.href = '/';
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#ff4444]/30 hover:bg-[#ff4444]/5 transition-all group"
            >
              <AlertTriangle size={18} className="text-[#666] group-hover:text-[#ff4444]" />
              <div className="text-left">
                <div className="text-sm text-[#e0e0e0]">Reset All Data</div>
                <div className="text-xs text-[#666]">Delete API keys, settings, and history</div>
              </div>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4">About</h2>
          <div className="space-y-2 text-sm text-[#666]">
            <p>Synapse Gateway v1.0.0</p>
            <p>Decentralized AI Inference Network</p>
            <p className="text-xs text-[#444] mt-4">
              © 2026 Synapse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
