import { Activity, Server, Zap, Globe, Clock, TrendingUp } from 'lucide-react';
import type { Stats } from '../App';

interface NetworkPanelProps {
  stats: Stats;
}

export function NetworkPanel({ stats }: NetworkPanelProps) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#e0e0e0]">Network</h1>
          <p className="text-[#666] text-sm mt-1">
            Real-time network telemetry and node status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Server}
            label="Nodes Online"
            value={stats.nodes_online.toString()}
            subtext="Active workers"
            accent
          />
          <StatCard
            icon={Zap}
            label="Jobs Today"
            value={stats.jobs_today.toLocaleString()}
            subtext="Total processed"
          />
          <StatCard
            icon={Clock}
            label="Avg Latency"
            value={`${stats.avg_latency}ms`}
            subtext="Round-trip time"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Cost"
            value={`$${stats.avg_cost.toFixed(4)}`}
            subtext="Per 1K tokens"
          />
        </div>

        {/* Models Available */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4 flex items-center gap-2">
            <Globe size={18} className="text-[#00ff88]" />
            Available Models
          </h2>
          <div className="space-y-3">
            {stats.models_available.map((model) => (
              <div
                key={model}
                className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#222]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                  <span className="text-[#e0e0e0] font-mono text-sm">{model}</span>
                </div>
                <span className="text-xs text-[#00ff88]">Available</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network Health */}
        <div className="panel p-6">
          <h2 className="text-lg font-medium text-[#e0e0e0] mb-4 flex items-center gap-2">
            <Activity size={18} className="text-[#00ff88]" />
            Network Health
          </h2>
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${
              stats.network_health === 'healthy' ? 'bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.5)]' :
              stats.network_health === 'degraded' ? 'bg-[#ffaa00]' : 'bg-[#ff4444]'
            }`} />
            <span className={`text-lg capitalize ${
              stats.network_health === 'healthy' ? 'text-[#00ff88]' :
              stats.network_health === 'degraded' ? 'text-[#ffaa00]' : 'text-[#ff4444]'
            }`}>
              {stats.network_health}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  accent 
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  accent?: boolean;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-[#666] mb-2">
        <Icon size={16} />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-mono ${accent ? 'text-[#00ff88] glow-green' : 'text-[#e0e0e0]'}`}>
        {value}
      </div>
      <div className="text-xs text-[#444] mt-1">{subtext}</div>
    </div>
  );
}
