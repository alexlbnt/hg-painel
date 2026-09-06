import { eventBus } from '@/lib/eventBus';

export function GET(request: Request) {
  let isClosed = false;
  let heartbeatInterval: any = null;
  let onEvent: ((event: any) => void) | null = null;

  const cleanup = (controller?: ReadableStreamDefaultController) => {
    if (isClosed) return;
    isClosed = true;
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (onEvent) {
      eventBus.off('change', onEvent);
      onEvent = null;
    }
    if (controller) {
      try {
        controller.close();
      } catch {}
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Confirmação imediata de conexão ativa
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`
          )
        );
      } catch {
        cleanup(controller);
        return;
      }

      // Ouvinte de eventos emitidos pelas rotas de mutação
      onEvent = (event: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          cleanup(controller);
        }
      };

      eventBus.on('change', onEvent);

      // Heartbeat a cada 20 segundos para manter a conexão aberta em proxies e mobile
      heartbeatInterval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup(controller);
        }
      }, 20000);

      // Limpeza ao encerrar / abortar conexão
      request.signal?.addEventListener('abort', () => {
        cleanup(controller);
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
