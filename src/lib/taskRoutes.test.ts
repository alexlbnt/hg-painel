import { beforeEach, describe, expect, it, vi } from 'vitest';

// Rotas de tasks com banco e autenticação simulados: valida que as regras valem no servidor.
const db = vi.hoisted(() => ({
  task: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  user: { findUnique: vi.fn() },
}));
const auth = vi.hoisted(() => ({ current: null as null | { id: string; username: string; role: string } }));

vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/eventBus', () => ({ broadcastEvent: vi.fn() }));
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  getAuthenticatedUser: async () => auth.current,
}));

import { GET, POST } from '@/app/api/tasks+api';
import { DELETE, PUT } from '@/app/api/tasks/[id]+api';

const req = (body?: unknown) =>
  new Request('http://local/api/tasks', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
  });

const player = { id: 'p-1', username: 'alex', role: 'PLAYER' };
const dm = { id: 'dm-1', username: 'mestre', role: 'DM' };

const finished = {
  id: 't-1',
  title: 'Mapa',
  description: 'D',
  category: 'ARTE',
  status: 'FINALIZADO',
  assignedTo: 'Alex',
  assignedToId: 'p-1',
  createdById: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.current = null;
  db.user.findUnique.mockResolvedValue({ name: 'Alex' });
});

describe('rotas de tasks', () => {
  it('GET exige login e não recria tasks de exemplo', async () => {
    expect((await GET(req())).status).toBe(401);
    auth.current = player;
    db.task.findMany.mockResolvedValue([]);
    const res = await GET(req());
    expect(await res.json()).toEqual([]);
    expect(db.task.create).not.toHaveBeenCalled();
  });

  it('POST de jogador vira sugestão com autoria do servidor, ignorando status enviado', async () => {
    auth.current = player;
    db.task.create.mockImplementation(async ({ data }) => ({ id: 'new', ...data }));
    const res = await POST(req({ title: 'T', description: 'D', status: 'APROVADO', assignedTo: 'Outro' }));
    expect(res.status).toBe(201);
    expect(db.task.create.mock.calls[0][0].data).toMatchObject({
      status: 'SUGERIDO',
      createdById: 'p-1',
      createdByName: 'Alex',
    });
    expect(db.task.create.mock.calls[0][0].data).not.toHaveProperty('assignedTo');
  });

  it('PUT de jogador tentando arquivar recebe 403', async () => {
    auth.current = player;
    db.task.findUnique.mockResolvedValue(finished);
    const res = await PUT(req({ action: 'ARCHIVE' }), { id: 't-1' });
    expect(res.status).toBe(403);
    expect(db.task.updateMany).not.toHaveBeenCalled();
  });

  it('PUT com status direto (cliente antigo) é recusado', async () => {
    auth.current = dm;
    db.task.findUnique.mockResolvedValue(finished);
    const res = await PUT(req({ status: 'APROVADO' }), { id: 't-1' });
    expect(res.status).toBe(400);
  });

  it('PUT devolve 409 quando outra pessoa mudou a task antes', async () => {
    auth.current = dm;
    db.task.findUnique.mockResolvedValue(finished);
    db.task.updateMany.mockResolvedValue({ count: 0 });
    const res = await PUT(req({ action: 'ARCHIVE' }), { id: 't-1' });
    expect(res.status).toBe(409);
    expect(db.task.updateMany.mock.calls[0][0].where).toEqual({ id: 't-1', status: 'FINALIZADO' });
  });

  it('Mestre arquiva com sucesso', async () => {
    auth.current = dm;
    db.task.findUnique.mockResolvedValueOnce(finished).mockResolvedValueOnce({ ...finished, status: 'APROVADO' });
    db.task.updateMany.mockResolvedValue({ count: 1 });
    const res = await PUT(req({ action: 'ARCHIVE' }), { id: 't-1' });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('APROVADO');
  });

  it('DELETE de jogador em task que não é sugestão dele recebe 403', async () => {
    auth.current = player;
    db.task.findUnique.mockResolvedValue(finished);
    const res = await DELETE(req(), { id: 't-1' });
    expect(res.status).toBe(403);
    expect(db.task.delete).not.toHaveBeenCalled();
  });
});
