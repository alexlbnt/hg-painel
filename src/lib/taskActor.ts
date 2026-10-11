import { prisma } from './prisma';
import { getAuthenticatedUser } from './auth';
import type { TaskActor } from './taskRules';

/** Usuário autenticado com o nome de exibição atual, para gravar autoria e responsável. */
export async function getTaskActor(request: Request): Promise<TaskActor | null> {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { name: true },
  });
  return { id: authUser.id, role: authUser.role, name: dbUser?.name || authUser.username };
}
