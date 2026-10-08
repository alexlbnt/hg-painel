import { prisma } from './prisma';
import type { AuthUser } from './auth';

export const CHARACTER_INCLUDE = {
  spellSlots: { orderBy: { level: 'asc' } },
  spells: { orderBy: { level: 'asc' } },
  abilities: true,
  conditions: true,
  items: true,
  room: {
    select: { id: true, code: true, name: true, dmName: true, dmUsername: true },
  },
} as const;

export function isElevatedRole(role: string): boolean {
  return role === 'DM' || role === 'MECHANIC';
}

export function isCharacterOwner(
  character: { userId: string | null; username: string },
  user: AuthUser
): boolean {
  if (character.userId && character.userId === user.id) return true;
  return !!character.username && character.username.toLowerCase() === user.username.toLowerCase();
}

/** Dono da ficha, Mestre ou Mecânico podem editar. Fichas órfãs (sem dono) só os elevados. */
export function canEditCharacter(
  character: { userId: string | null; username: string },
  user: AuthUser
): boolean {
  return isElevatedRole(user.role) || isCharacterOwner(character, user);
}

export async function getUserDisplayName(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return u?.name || '';
}

export async function logCharacterEvent(entry: {
  characterId: string;
  kind: 'DAMAGE' | 'HEAL' | 'REST' | 'CONDITION' | 'NOTE';
  delta?: number;
  message: string;
  author?: AuthUser | null;
}) {
  const authorName = entry.author ? await getUserDisplayName(entry.author.id) : '';
  return prisma.characterLog.create({
    data: {
      characterId: entry.characterId,
      kind: entry.kind,
      delta: entry.delta ?? 0,
      message: entry.message.slice(0, 500),
      authorId: entry.author?.id ?? null,
      authorName,
    },
  });
}
