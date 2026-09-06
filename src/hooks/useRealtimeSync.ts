import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export interface RealtimeEvent {
  type: string;
  id?: string;
  data?: any;
  timestamp?: number;
  [key: string]: any;
}

export function useRealtimeSync(onEvent: (event: RealtimeEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    let es: EventSource | null = null;
    let reconnectTimer: any = null;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) return;
      try {
        es = new EventSource('/api/events');

        es.onmessage = (e) => {
          try {
            if (!e.data) return;
            const data = JSON.parse(e.data);
            if (data && data.type !== 'CONNECTED') {
              onEventRef.current?.(data);
            }
          } catch (err) {
            console.warn('Erro ao processar evento SSE:', err);
          }
        };

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          if (!isCancelled) {
            // Reconectar após 3 segundos
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) {
        es.close();
        es = null;
      }
    };
  }, []);
}
