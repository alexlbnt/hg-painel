// @ts-ignore
import crypto from 'crypto';
import { prisma } from './prisma';

declare const Buffer: any;

const AUTH_SECRET = process.env.AUTH_SECRET || 'hg-painel-secret-salt-dnd5e-rpg-mesa-2026';

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

/**
 * Extrai e valida o usuário autenticado a partir dos cabeçalhos da requisição.
 * Suporta tanto `Authorization: Bearer <token>` quanto fallback retrocompatível de `x-user-id` validado no banco.
 */
export async function getAuthenticatedUser(req: Request): Promise<{
  id: string;
  username: string;
  role: 'PLAYER' | 'MECHANIC' | 'DM';
} | null> {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const verified = verifyAuthToken(token);
      if (verified) {
        return {
          id: verified.id,
          username: verified.username,
          role: verified.role,
        };
      }
    }

    // Fallback: se forneceu x-user-id, valida se o usuário realmente existe no banco
    const userId = req.headers.get('x-user-id');
    if (userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, role: true },
      });
      if (dbUser) {
        return dbUser as { id: string; username: string; role: 'PLAYER' | 'MECHANIC' | 'DM' };
      }
    }

    return null;
  } catch {
    return null;
  }
}
