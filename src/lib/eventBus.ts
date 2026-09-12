export interface AppRealtimeEvent {
  type: string;
  id?: string;
  timestamp?: number;
  data?: any;
  [key: string]: any;
}

type Listener = (event: AppRealtimeEvent) => void;

class UniversalEventBus {
  private listeners: Set<Listener> = new Set();

  on(_channel: string, listener: Listener): void {
    this.listeners.add(listener);
  }

  off(_channel: string, listener: Listener): void {
    this.listeners.delete(listener);
  }

  listenerCount(): number {
    return this.listeners.size;
  }

  emit(_channel: string, event: AppRealtimeEvent): void {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(event);
      } catch (err) {
        console.warn('Erro ao disparar listener:', err);
      }
    }
  }
}

const globalStore = (typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : {}) as unknown as { __hg_event_bus__?: UniversalEventBus };

export const eventBus: UniversalEventBus =
  globalStore.__hg_event_bus__ || new UniversalEventBus();

globalStore.__hg_event_bus__ = eventBus;

export function broadcastEvent(event: { type: string; id?: string; [key: string]: any }) {
  try {
    eventBus.emit('change', {
      ...event,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('Erro ao emitir evento no eventBus:', err);
  }
}
