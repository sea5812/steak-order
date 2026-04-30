import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSSEOptions {
  url: string;
  onEvent: (event: { type: string; data: unknown }) => void;
  enabled?: boolean;
}

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

export function useSSE({ url, onEvent, enabled = true }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);

  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('adminToken') || localStorage.getItem('tableToken');
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = token ? `${url}${separator}token=${token}` : url;

    const eventSource = new EventSource(fullUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      retryCount.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string);
        onEventRef.current(parsed);
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsConnected(false);

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        setTimeout(connect, RETRY_INTERVAL);
      } else {
        setError('연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
      }
    };
  }, [url]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect, enabled]);

  const reconnect = useCallback(() => {
    retryCount.current = 0;
    setError(null);
    connect();
  }, [connect]);

  return { isConnected, error, reconnect };
}
