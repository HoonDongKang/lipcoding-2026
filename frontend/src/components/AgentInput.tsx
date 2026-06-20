/**
 * AgentInput — AI chat interface in the popup footer
 *
 * Features:
 * - Collapsible section at the bottom of the popup
 * - Textarea (max 500 chars) with character counter
 * - Streaming response area with cursor animation
 * - Tool call indicators
 * - Disabled state during streaming
 */
import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useStream } from '../hooks/useStream';

interface AgentInputProps {
  selectedDate: string;
  onTaskCreated?: () => void;
}

const MAX_LENGTH = 500;

export function AgentInput({ selectedDate, onTaskCreated }: AgentInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const { response, streaming, error, toolCalls, startStream, reset } =
    useStream();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Notify parent when a createTask tool call fires
  useEffect(() => {
    const hasCreate = toolCalls.some((tc) => tc.toolName === 'createTask');
    if (hasCreate && onTaskCreated) {
      onTaskCreated();
    }
  }, [toolCalls, onTaskCreated]);

  // Auto-scroll response area to bottom as tokens arrive
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  // Focus textarea when panel expands
  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    startStream(trimmed, selectedDate);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    reset();
    setInput('');
    textareaRef.current?.focus();
  };

  const hasToolCalls = toolCalls.length > 0;
  const hasResponse = response.length > 0;
  const charsLeft = MAX_LENGTH - input.length;

  return (
    <div className="border-t border-gray-200 bg-white flex-shrink-0">
      {/* Toggle bar */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
        aria-expanded={expanded}
        aria-controls="agent-panel"
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true">✨</span>
          AI 어시스턴트
        </span>
        <span
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          ▲
        </span>
      </button>

      {/* Collapsible panel */}
      <div
        id="agent-panel"
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-72' : 'max-h-0'
        }`}
      >
        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* Gradient border input area */}
          <div className="p-[1px] rounded-lg bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
            <div className="bg-white rounded-[7px] flex flex-col">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                disabled={streaming}
                placeholder="자연어로 입력하세요 (예: 내일 PR 리뷰 추가해줘, 오늘 할 일 정리해줘)"
                rows={2}
                maxLength={MAX_LENGTH}
                className={[
                  'w-full px-3 pt-2.5 pb-1 text-sm rounded-t-[7px] resize-none',
                  'placeholder-gray-400 focus:outline-none bg-transparent',
                  streaming ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
                aria-label="AI에게 요청할 내용 입력"
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <span
                  className={`text-[10px] ${charsLeft < 50 ? 'text-red-500' : 'text-gray-400'}`}
                  aria-live="polite"
                  aria-label={`${charsLeft}자 남음`}
                >
                  {charsLeft}자 남음
                </span>
                <div className="flex gap-1.5">
                  {(hasResponse || hasToolCalls || error) && !streaming && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[10px] px-2 py-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label="응답 지우기"
                    >
                      지우기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={streaming || !input.trim()}
                    className={[
                      'text-xs px-3 py-1 rounded font-medium transition-colors',
                      streaming || !input.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
                    ].join(' ')}
                    aria-label="AI에게 물어보기"
                    title="Ctrl+Enter"
                  >
                    {streaming ? (
                      <span className="flex items-center gap-1">
                        <LoadingSpinner />
                        처리 중…
                      </span>
                    ) : (
                      'AI에게 물어보기'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tool call indicators */}
          {hasToolCalls && (
            <div className="flex flex-wrap gap-1" aria-live="polite" aria-label="실행된 도구">
              {toolCalls.map((tc, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 font-medium"
                >
                  ⚡ {tc.toolName}
                </span>
              ))}
            </div>
          )}

          {/* Streaming response area */}
          {(hasResponse || streaming) && !error && (
            <div
              ref={responseRef}
              className={[
                'rounded-lg bg-gray-50 border border-gray-200 px-3 py-2',
                'text-xs font-mono text-gray-700 leading-relaxed',
                'max-h-28 overflow-y-auto whitespace-pre-wrap',
              ].join(' ')}
              aria-live="polite"
              aria-label="AI 응답"
              aria-busy={streaming}
            >
              {response}
              {streaming && (
                <span
                  className="inline-block w-[2px] h-[13px] bg-blue-600 ml-[1px] align-middle animate-blink"
                  aria-hidden="true"
                />
              )}
            </div>
          )}

          {/* Error area */}
          {error && (
            <div
              className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="w-3 h-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );
}
