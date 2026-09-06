import { eventBus } from '@/lib/eventBus';

export function GET(request: Request) {
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
      } catch {}

      // Ouvinte de eventos emitidos pelas rotas de mutação
      const onEvent = (event: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Conexão fechada
        }
      };

      eventBus.on('change', onEvent);

      // Heartbeat a cada 20 segundos para manter a conexão aberta em proxies e mobile
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      // Limpeza ao encerrar / abortar conexão
      request.signal?.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        eventBus.off('change', onEvent);
        try {
          controller.close();
        } catch {}
      });
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
