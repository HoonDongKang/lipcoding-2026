/**
 * useStream hook — Vitest unit tests
 *
 * EventSource is mocked so no real network calls are made.
 * We simulate token, tool_call, error, and done events.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStream } from '../useStream';

// ─── EventSource mock ────────────────────────────────────────────────────────

type ESHandler = (event: MessageEvent<string>) => void;
type ESErrorHandler = (event: Event) => void;

let mockESInstance: MockEventSource | null = null;
let esCallCount = 0;
let esLastUrl = '';

class MockEventSource {
  url: string;
  onmessage: ESHandler | null = null;
  onerror: ESErrorHandler | null = null;
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    esCallCount += 1;
    esLastUrl = url;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockESInstance = this;
  }

  /** Helper: push a serialised object as a message event */
  emit(data: object) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent<string>);
    }
  }

  /** Helper: trigger the onerror handler */
  emitError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  mockESInstance = null;
  esCallCount = 0;
  esLastUrl = '';
  vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useStream', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useStream());

    expect(result.current.response).toBe('');
    expect(result.current.streaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.toolCalls).toHaveLength(0);
  });

  it('sets streaming=true and opens EventSource when startStream is called', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('오늘 할 일 추가', '2026-06-20');
    });

    expect(result.current.streaming).toBe(true);
    expect(esCallCount).toBe(1);
    expect(esLastUrl).toContain('message=');
    expect(esLastUrl).toContain('date=');
  });

  it('accumulates token events into response', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    act(() => {
      mockESInstance!.emit({ type: 'token', content: 'Hello' });
      mockESInstance!.emit({ type: 'token', content: ', world' });
    });

    expect(result.current.response).toBe('Hello, world');
    expect(result.current.streaming).toBe(true);
  });

  it('records tool_call events', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('할 일 추가해줘', '2026-06-20');
    });

    act(() => {
      mockESInstance!.emit({
        type: 'tool_call',
        toolName: 'createTask',
        toolResult: { id: 'abc', title: '새 태스크' },
      });
    });

    expect(result.current.toolCalls).toHaveLength(1);
    expect(result.current.toolCalls[0].toolName).toBe('createTask');
    expect(result.current.toolCalls[0].toolResult).toEqual({
      id: 'abc',
      title: '새 태스크',
    });
  });

  it('sets streaming=false and closes EventSource on done event', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    const es = mockESInstance!;

    act(() => {
      es.emit({ type: 'token', content: 'Done text' });
      es.emit({ type: 'done' });
    });

    expect(result.current.streaming).toBe(false);
    expect(es.close).toHaveBeenCalled();
    expect(result.current.response).toBe('Done text');
  });

  it('sets error state on error event', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    act(() => {
      mockESInstance!.emit({ type: 'error', content: 'AI 오류가 발생했습니다.' });
    });

    expect(result.current.error).toBe('AI 오류가 발생했습니다.');
    expect(result.current.streaming).toBe(false);
  });

  it('sets error state on EventSource onerror', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    act(() => {
      mockESInstance!.emitError();
    });

    expect(result.current.error).toBe('스트리밍 연결에 실패했습니다.');
    expect(result.current.streaming).toBe(false);
  });

  it('stopStream aborts an active stream', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    const es = mockESInstance!;

    act(() => {
      result.current.stopStream();
    });

    expect(result.current.streaming).toBe(false);
    expect(es.close).toHaveBeenCalled();
  });

  it('reset clears response, error and toolCalls', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    act(() => {
      mockESInstance!.emit({ type: 'token', content: 'some text' });
      mockESInstance!.emit({ type: 'tool_call', toolName: 'createTask' });
      mockESInstance!.emit({ type: 'done' });
    });

    expect(result.current.response).toBe('some text');
    expect(result.current.toolCalls).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.response).toBe('');
    expect(result.current.toolCalls).toHaveLength(0);
    expect(result.current.error).toBeNull();
    expect(result.current.streaming).toBe(false);
  });

  it('starting a new stream replaces the previous one', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('first', '2026-06-20');
    });

    const firstES = mockESInstance!;

    act(() => {
      firstES.emit({ type: 'token', content: 'first token' });
    });

    act(() => {
      result.current.startStream('second', '2026-06-20');
    });

    // First connection should be closed
    expect(firstES.close).toHaveBeenCalled();
    // Response should be reset
    expect(result.current.response).toBe('');
    expect(result.current.streaming).toBe(true);
    expect(esCallCount).toBe(2);
  });

  it('ignores malformed SSE data without throwing', () => {
    const { result } = renderHook(() => useStream());

    act(() => {
      result.current.startStream('test', '2026-06-20');
    });

    act(() => {
      // Send raw non-JSON string — should not throw
      if (mockESInstance?.onmessage) {
        mockESInstance.onmessage({
          data: 'not-json-at-all',
        } as MessageEvent<string>);
      }
    });

    // Hook should remain stable with no accumulated response
    expect(result.current.response).toBe('');
    expect(result.current.streaming).toBe(true);
  });
});

