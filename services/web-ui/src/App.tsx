import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GatewayLayout } from './components/GatewayLayout';
import { ChatInterface } from './chat/ChatInterface';
import { NetworkPanel } from './panels/NetworkPanel';
import { ApiKeysPanel } from './panels/ApiKeysPanel';
import { RunNodePanel } from './panels/RunNodePanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { LandingView } from './pages/LandingView';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface Stats {
  nodes_online: number;
  jobs_today: number;
  tokens_processed: number;
  avg_cost: number;
  avg_latency: number;
  models_available: string[];
  network_health: 'healthy' | 'degraded' | 'unhealthy';
}

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string>('');
  const [hasLaunched, setHasLaunched] = useState(false);
  const [stats, setStats] = useState<Stats>({
    nodes_online: 0,
    jobs_today: 0,
    tokens_processed: 0,
    avg_cost: 0.0015,
    avg_latency: 89,
    models_available: ['deepseek-v3', 'llama-3.1-70b', 'mixtral-8x22b'],
    network_health: 'healthy',
  });
  const [selectedModel, setSelectedModel] = useState('deepseek-v3');

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('synapse_api_key');
    const storedWallet = localStorage.getItem('synapse_wallet');
    if (storedKey) {
      setApiKey(storedKey);
      setHasLaunched(true);
    }
    if (storedWallet) setWallet(storedWallet);
  }, []);

  // Poll stats every 5 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(prev => ({
            ...prev,
            nodes_online: data.nodes_online || prev.nodes_online,
            jobs_today: data.jobs_today || prev.jobs_today,
            tokens_processed: data.tokens_processed || prev.tokens_processed,
            avg_cost: data.avg_cost || prev.avg_cost,
            avg_latency: data.avg_latency || prev.avg_latency,
            network_health: data.network_health || prev.network_health,
          }));
        }
      } catch {
        // Silent fail - keep showing last known stats
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = (key: string, walletAddr: string) => {
    localStorage.setItem('synapse_api_key', key);
    localStorage.setItem('synapse_wallet', walletAddr);
    setApiKey(key);
    setWallet(walletAddr);
    setHasLaunched(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('synapse_api_key');
    localStorage.removeItem('synapse_wallet');
    setApiKey(null);
    setWallet('');
    setHasLaunched(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            hasLaunched ? (
              <Navigate to="/chat" replace />
            ) : (
              <LandingView 
                onLaunch={handleLaunch}
                stats={stats}
              />
            )
          } 
        />
        <Route 
          path="/*" 
          element={
            hasLaunched ? (
              <GatewayLayout
                apiKey={apiKey!}
                wallet={wallet}
                stats={stats}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onLogout={handleLogout}
              >
                <Routes>
                  <Route path="chat" element={
                    <ChatInterface 
                      apiKey={apiKey!} 
                      selectedModel={selectedModel}
                      stats={stats}
                    />
                  } />
                  <Route path="network" element={<NetworkPanel stats={stats} />} />
                  <Route path="keys" element={<ApiKeysPanel apiKey={apiKey!} />} />
                  <Route path="run-node" element={<RunNodePanel wallet={wallet} />} />
                  <Route path="settings" element={<SettingsPanel onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/chat" replace />} />
                </Routes>
              </GatewayLayout>
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
