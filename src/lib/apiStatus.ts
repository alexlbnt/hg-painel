import { useSyncExternalStore } from 'react';

/**
 * Estado global simples de saúde da API. O ApiService marca falha quando precisa recorrer
 * ao armazenamento local (dados possivelmente desatualizados) e sucesso quando o servidor responde.
 */
type Listener = () => void;

let offline = false;
const listeners = new Set<Listener>();

function set(next: boolean) {
  if (offline === next) return;
  offline = next;
  listeners.forEach((l) => l());
}

export const apiStatus = {
  reportFailure: () => set(true),
  reportOk: () => set(false),
  isOffline: () => offline,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useApiOffline(): boolean {
  return useSyncExternalStore(apiStatus.subscribe, apiStatus.isOffline, () => false);
}
