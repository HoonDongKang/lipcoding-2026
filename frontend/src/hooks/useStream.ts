import { useState, useRef, useCallback } from 'react';
import { agentApi } from '../api/agent';
import type { AgentSettings } from '../api/agent';

export interface StreamToolCall {
  toolName: string;
  toolResult: unknown;
}

export interface UseStreamResult {
  response: string;
  streaming: boolean;
  error: string | null;
  toolCalls: StreamToolCall[];
  startStream: (message: string, date: string, settings?: AgentSettings) => void;
  stopStream: () => void;
  reset: () => void;
}

export function useStream(): UseStreamResult {
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<StreamToolCall[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const stopStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setResponse('');
    setError(null);
    setToolCalls([]);
  }, [stopStream]);

  const startStream = useCallback(
    (message: string, date: string, settings?: AgentSettings) => {
      stopStream();
      setResponse('');
      setError(null);
      setToolCalls([]);
      setStreaming(true);

      const url = agentApi.streamUrl(message, date, settings);
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            content?: string;
            toolName?: string;
            toolResult?: unknown;
          };

          switch (data.type) {
            case 'token':
              if (data.content) {
                setResponse((prev) => prev + data.content);
              }
              break;
            case 'tool_call':
              if (data.toolName) {
                setToolCalls((prev) => [
                  ...prev,
                  { toolName: data.toolName!, toolResult: data.toolResult },
                ]);
              }
              break;
            case 'error':
              setError(data.content ?? 'Unknown error');
              stopStream();
              break;
            case 'done':
              stopStream();
              break;
            default:
              break;
          }
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        setError('스트리밍 연결에 실패했습니다.');
        stopStream();
      };
    },
    [stopStream],
  );

  return { response, streaming, error, toolCalls, startStream, stopStream, reset };
}
