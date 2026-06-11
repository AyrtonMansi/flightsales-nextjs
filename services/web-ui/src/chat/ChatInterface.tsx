import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Terminal, Loader2, Activity, Server, Clock } from 'lucide-react';
import type { Stats } from '../App';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    model?: string;
    nodeId?: string;
    latency?: number;
    state?: 'queued' | 'routing' | 'executing' | 'streaming' | 'completed' | 'error';
  };
  timestamp: Date;
}

interface ChatInterfaceProps {
  apiKey: string;
  selectedModel: string;
  stats: Stats;
}

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function ChatInterface({ apiKey, selectedModel, stats }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle new chat event
  useEffect(() => {
    const handleNewChat = () => setMessages([]);
    window.addEventListener('new-chat', handleNewChat);
    return () => window.removeEventListener('new-chat', handleNewChat);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantId = `msg_${Date.now()}_ai`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      metadata: { state: 'queued', model: selectedModel },
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMsg]);

    try {
      const startTime = Date.now();

      // Simulate state transitions
      setTimeout(() => updateMessage(assistantId, { metadata: { ...assistantMsg.metadata, state: 'routing' } }), 300);
      setTimeout(() => updateMessage(assistantId, { metadata: { ...assistantMsg.metadata, state: 'executing', nodeId: `node-${Math.floor(Math.random() * 1000)}` } }), 800);

      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: input }],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      updateMessage(assistantId, { metadata: { ...assistantMsg.metadata, state: 'streaming' } });

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              fullContent += content;
              updateMessage(assistantId, { content: fullContent });
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      const latency = Date.now() - startTime;
      updateMessage(assistantId, {
        content: fullContent,
        metadata: { state: 'completed', model: selectedModel, nodeId: assistantMsg.metadata?.nodeId, latency },
      });

    } catch (error) {
      updateMessage(assistantId, {
        content: 'I encountered an error processing your request. Please try again.',
        metadata: { state: 'error' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          // Empty State - Matching Lander Aesthetic
          <div className="h-full flex flex-col items-center justify-center px-6">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 mb-4">
              <Terminal size={32} className="text-[#00ff88]" />
              <span className="text-3xl font-semibold tracking-tight text-[#e0e0e0]">
                &gt; Synapse
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-[#666] text-sm mb-8 text-center max-w-md">
              Decentralized AI Inference Network
              <br />
              <span className="text-[#444]">
                {stats.nodes_online} nodes online · {stats.avg_latency}ms avg latency
              </span>
            </p>

            {/* Suggestion Pills */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {[
                'Explain quantum computing',
                'Write a Python function',
                'Help me debug an error',
                'Create a workout plan',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-[#111] border border-[#222] rounded-full text-sm text-[#666] hover:text-[#e0e0e0] hover:border-[#333] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 px-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-[#1a1a1a] border border-[#333]' 
                    : 'bg-[#00ff88]/10 border border-[#00ff88]/30'
                }`}>
                  {message.role === 'user' ? (
                    <span className="text-xs text-[#888]">You</span>
                  ) : (
                    <Terminal size={14} className="text-[#00ff88]" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 max-w-[85%] ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  {/* Message Bubble */}
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#1a1a1a] border border-[#333] text-[#e0e0e0]'
                      : 'bg-transparent text-[#e0e0e0]'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content || (message.metadata?.state === 'streaming' ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
                          <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse delay-100" />
                          <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse delay-200" />
                        </span>
                      ) : null)}
                    </p>
                  </div>

                  {/* Status Chips - Only for assistant */}
                  {message.role === 'assistant' && message.metadata?.state && message.metadata.state !== 'completed' && (
                    <div className="flex items-center gap-2 mt-2">
                      <StatusChip 
                        state={message.metadata.state} 
                        nodeId={message.metadata.nodeId}
                        latency={message.metadata.latency}
                      />
                    </div>
                  )}

                  {/* Completed Metadata */}
                  {message.role === 'assistant' && message.metadata?.state === 'completed' && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#444]">
                      {message.metadata.nodeId && (
                        <span className="flex items-center gap-1">
                          <Server size={10} />
                          {message.metadata.nodeId}
                        </span>
                      )}
                      {message.metadata.latency && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {message.metadata.latency}ms
                        </span>
                      )}
                      <span>{message.metadata.model}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[#222] bg-[#0a0a0a] p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-[#111] border border-[#222] rounded-2xl p-2 focus-within:border-[#00ff88]/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEmpty ? "Message Synapse..." : "Continue conversation..."}
              className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-[#e0e0e0] placeholder-[#444] focus:outline-none max-h-32"
              rows={1}
              disabled={isLoading}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="mb-1 mr-1 p-2 rounded-xl bg-[#00ff88] text-[#0a0a0a] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          
          <p className="text-center text-xs text-[#444] mt-2">
            Synapse can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

// Status Chip Component
function StatusChip({ state, nodeId, latency }: { state: string; nodeId?: string; latency?: number }) {
  const icons = {
    queued: <Activity size={10} className="animate-pulse" />,
    routing: <Activity size={10} className="animate-pulse text-[#ffaa00]" />,
    executing: <Server size={10} className="text-[#00ff88]" />,
    streaming: <Activity size={10} className="text-[#00ff88] animate-pulse" />,
    error: <Activity size={10} className="text-[#ff4444]" />,
    completed: <Activity size={10} className="text-[#00ff88]" />,
  };

  const labels: Record<string, string> = {
    queued: 'Queued',
    routing: 'Routing',
    executing: nodeId ? `Executing on ${nodeId}` : 'Executing',
    streaming: 'Streaming',
    error: 'Error',
    completed: latency ? `Completed · ${latency}ms` : 'Completed',
  };

  const colors: Record<string, string> = {
    queued: 'text-[#888] border-[#333]',
    routing: 'text-[#ffaa00] border-[#ffaa00]/30',
    executing: 'text-[#00ff88] border-[#00ff88]/30',
    streaming: 'text-[#00ff88] border-[#00ff88]/30',
    error: 'text-[#ff4444] border-[#ff4444]/30',
    completed: 'text-[#444] border-[#333]',
  };

  return (
    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${colors[state] || colors.queued}`}>
      {icons[state as keyof typeof icons] || icons.queued}
      {labels[state] || state}
    </span>
  );
}
