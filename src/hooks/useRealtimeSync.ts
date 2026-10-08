import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { authStorage, getApiBaseUrl } from '@/contexts/AuthContext';

export interface RealtimeEvent {
  type: string;
  id?: string;
  data?: any;
  timestamp?: number;
  [key: string]: any;
}

/** Intervalo do polling de segurança (ms). Só roda com a aba visível. */
const POLL_INTERVAL_MS = 8000;

/** Evento "genérico" (sem dados) que cada tela já sabe tratar recarregando o domínio correspondente. */
const DOMAIN_EVENTS: Record<string, string> = {
  characters: 'CHARACTER_UPDATED',
  tasks: 'TASK_UPDATED',
  journal: 'JOURNAL_NOTE_UPDATED',
  schedule: 'SCHEDULE_UPDATED',
};

/**
 * Sincronização em tempo real em duas camadas (somente web):
 *  1. SSE em /api/events — baixa latência, mas o barramento é em memória (por instância do servidor);
 *  2. Polling inteligente em /api/sync — compara assinaturas dos domínios no banco e só dispara
 *     recarga quando algo realmente mudou. Garante consistência em serverless (Vercel).
 */
export function useRealtimeSync(onEvent: (event: RealtimeEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    let es: EventSource | null = null;
    let reconnectTimer: any = null;
    let pollTimer: any = null;
    let isCancelled = false;
    let lastSignatures: Record<string, string> | null = null;
    let polling = false;

    const connect = () => {
      if (isCancelled || typeof EventSource === 'undefined') return;
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

    const poll = async () => {
      if (isCancelled || polling || document.hidden) return;
      const token = authStorage.get()?.token;
      if (!token) return;
      polling = true;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/sync`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const next: Record<string, string> = await res.json();
        const prev = lastSignatures;
        lastSignatures = next;
        if (!prev) return; // primeira leitura só define a linha de base
        for (const domain of Object.keys(DOMAIN_EVENTS)) {
          if (prev[domain] !== undefined && prev[domain] !== next[domain]) {
            onEventRef.current?.({ type: DOMAIN_EVENTS[domain], timestamp: Date.now(), source: 'poll' });
          }
        }
      } catch {
        // rede instável: tenta de novo no próximo ciclo
      } finally {
        polling = false;
      }
    };

    const onVisibility = () => {
      if (!document.hidden) poll();
    };

    connect();
    poll();
    pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      if (es) {
        es.close();
        es = null;
      }
    };
  }, []);
}
