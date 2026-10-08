import { describe, expect, it } from 'vitest';
import { createAuthToken, verifyAuthToken } from './auth';

const user = { id: 'u-1', username: 'alex.g', role: 'DM' };

describe('token de autenticação', () => {
  it('gera um token que é verificado com os dados do usuário', () => {
    const payload = verifyAuthToken(createAuthToken(user));
    expect(payload).toMatchObject({ id: 'u-1', username: 'alex.g', role: 'DM' });
  });

  it('rejeita token adulterado (payload alterado mantendo a assinatura)', () => {
    const [, signature] = createAuthToken(user).split('.');
    const forged = Buffer.from(JSON.stringify({ ...user, role: 'DM', id: 'outro', exp: Date.now() + 1e9 }))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    expect(verifyAuthToken(`${forged}.${signature}`)).toBeNull();
  });

  it('rejeita entradas inválidas', () => {
    expect(verifyAuthToken('')).toBeNull();
    expect(verifyAuthToken('abc')).toBeNull();
    expect(verifyAuthToken('a.b.c')).toBeNull();
  });
});
