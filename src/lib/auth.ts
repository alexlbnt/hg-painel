// @ts-ignore
import crypto from 'crypto';
import { prisma } from './prisma';

declare const Buffer: any;

const DEV_FALLBACK_SECRET = 'hg-painel-dev-only-secret-do-not-use-in-production';

function resolveAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET não configurado (mínimo 16 caracteres) — defina a variável de ambiente em produção.');
  }
  return DEV_FALLBACK_SECRET;
}

const AUTH_SECRET = resolveAuthSecret();

export interface AuthPayload {
  id: string;
  username: string;
  role: 'PLAYER' | 'MECHANIC' | 'DM';
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function createAuthToken(user: { id: string; username: string; role: string }): string {
  // Validade de 30 dias
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload: AuthPayload = {
    id: user.id,
    username: user.username,
    role: user.role as any,
    exp,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadEncoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${payloadEncoded}.${signature}`;
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadEncoded, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadEncoded)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Validação de assinatura em tempo constante
    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    const payload: AuthPayload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expirado
    }

    return payload;
  } catch {
    return null;
  }
}

export type AuthUser = {
  id: string;
  username: string;
  role: 'PLAYER' | 'MECHANIC' | 'DM';
};

/**
 * Extrai e valida o usuário autenticado a partir do cabeçalho `Authorization: Bearer <token>`.
 * O cargo é sempre relido do banco, para que mudanças de permissão valham imediatamente
 * (e usuários excluídos percam o acesso mesmo com token ainda válido).
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const verified = verifyAuthToken(authHeader.slice(7).trim());
    if (!verified) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: verified.id },
      select: { id: true, username: true, role: true },
    });
    return dbUser ? (dbUser as AuthUser) : null;
  } catch {
    return null;
  }
}

export function unauthorized(message = 'Autenticação necessária') {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Sem permissão para esta ação') {
  return Response.json({ error: message }, { status: 403 });
}

/**
 * Garante que o id informado no corpo da requisição pertence ao usuário autenticado
 * (impede agir em nome de outro usuário). Retorna uma Response de erro, ou null se válido.
 */
export async function assertSelf(req: Request, claimedId: unknown): Promise<Response | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();
  if (claimedId !== user.id) return forbidden('Identidade da requisição não confere com o usuário autenticado');
  return null;
}
