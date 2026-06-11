import { ReactNode, useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Activity, 
  Key, 
  Server, 
  Settings,
  LogOut,
  ChevronDown,
  Terminal,
  Zap
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Stats } from '../App';

interface GatewayLayoutProps {
  children: ReactNode;
  apiKey: string;
  wallet: string;
  stats: Stats;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onLogout: () => void;
}

const models = [
  { id: 'deepseek-v3', name: 'DeepSeek V3', cost: '$0.0015/1K' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', cost: '$0.0020/1K' },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', cost: '$0.0018/1K' },
];

export function GatewayLayout({ 
  children, 
  apiKey: _apiKey,
  wallet,
  stats,
  selectedModel,
  onModelChange,
  onLogout
}: GatewayLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat', path: '/chat' },
    { id: 'network', icon: Activity, label: 'Network', path: '/network' },
    { id: 'keys', icon: Key, label: 'API Keys', path: '/keys' },
    { id: 'run-node', icon: Server, label: 'Run a Node', path: '/run-node' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleNewChat = () => {
    navigate('/chat');
    // Dispatch event to clear chat
    window.dispatchEvent(new Event('new-chat'));
  };

  const isActive = (path: string) => location.pathname === path;

  const selectedModelData = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex overflow-hidden">
      {/* Background Grid */}
      <div 
        className="fixed inset-0 pointer-events-none bg-grid"
        style={{ zIndex: 0 }}
      />

      {/* Sidebar */}
      <aside 
        className={`relative z-10 flex flex-col border-r border-[#222] bg-[#0a0a0a]/80 backdrop-blur-sm transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-[#222]">
          <Link to="/chat" className="flex items-center gap-2">
            <Terminal size={20} className="text-[#00ff88]" />
            {!sidebarCollapsed && (
              <span className="font-semibold text-[#e0e0e0]">Synapse</span>
            )}
          </Link>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className={`btn-secondary w-full flex items-center justify-center gap-2 ${
              sidebarCollapsed ? 'px-2' : ''
            }`}
          >
            <Plus size={18} />
            {!sidebarCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''} ${
                sidebarCollapsed ? 'justify-center px-2' : ''
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-[#222]">
          <button
            onClick={onLogout}
            className={`sidebar-link text-[#666] hover:text-[#ff4444] w-full ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            }`}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
          
          {!sidebarCollapsed && wallet && (
            <div className="mt-2 px-3 py-2 text-xs text-[#444] truncate font-mono">
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-1/2 w-6 h-12 bg-[#111] border border-[#222] rounded-r-lg flex items-center justify-center text-[#444] hover:text-[#888]"
        >
          <ChevronDown 
            size={14} 
            className={`transform transition-transform ${sidebarCollapsed ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-[#222] bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-between px-4">
          {/* Left: Model Selector */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
            >
              <Zap size={14} className="text-[#00ff88]" />
              <span className="text-sm text-[#e0e0e0]">{selectedModelData.name}</span>
              <ChevronDown size={14} className="text-[#666]" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 panel py-1 z-50">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors ${
                      selectedModel === model.id ? 'text-[#00ff88]' : 'text-[#e0e0e0]'
                    }`}
                  >
                    <span className="text-sm">{model.name}</span>
                    <span className="text-xs text-[#555]">{model.cost}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-6">
            {/* Nodes Online */}
            <div className="flex items-center gap-2">
              <div className={`status-dot ${stats.nodes_online > 0 ? 'online' : 'offline'}`} />
              <span className="text-sm text-[#888]">
                <span className="text-[#00ff88] font-mono">{stats.nodes_online}</span> nodes
              </span>
            </div>

            {/* Latency */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-[#888]">
              <Activity size={14} />
              <span className="font-mono">{stats.avg_latency}ms</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                stats.network_health === 'healthy' ? 'bg-[#00ff88]' : 
                stats.network_health === 'degraded' ? 'bg-[#ffaa00]' : 'bg-[#ff4444]'
              }`} />
              <span className={`text-xs capitalize hidden sm:inline ${
                stats.network_health === 'healthy' ? 'text-[#00ff88]' : 
                stats.network_health === 'degraded' ? 'text-[#ffaa00]' : 'text-[#ff4444]'
              }`}>
                {stats.network_health}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
