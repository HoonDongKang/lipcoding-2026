/**
 * Agent API — client for /agent/chat and /agent/stream endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/agent`
  : '/api/agent';

export interface ChatResponse {
  response: string;
  toolCalls: Array<{
    toolName: string;
    result: unknown;
  }>;
}

export interface AgentSettings {
  githubPat?: string;
  githubRepo?: string;
}

export const agentApi = {
  chat: async (message: string, date?: string, settings?: AgentSettings): Promise<ChatResponse> => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, date, ...settings }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json() as Promise<ChatResponse>;
  },

  streamUrl: (message: string, date?: string, settings?: AgentSettings): string => {
    const params = new URLSearchParams({ message });
    if (date) params.set('date', date);
    if (settings?.githubPat) params.set('githubPat', settings.githubPat);
    if (settings?.githubRepo) params.set('githubRepo', settings.githubRepo);
    return `${API_BASE}/stream?${params.toString()}`;
  },
};
