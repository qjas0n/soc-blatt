import crypto from 'crypto';
import { cookies } from 'next/headers';
import { query } from './db';

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verify;
}

export async function createSession(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
        'INSERT INTO soc_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expires]
    );

    const cookieStore = await cookies();
    cookieStore.set('soc_session', token, {
        httpOnly: true,
        path: '/',
        expires: expires,
        sameSite: 'lax'
    });

    return token;
}

export async function getSession(): Promise<any | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('soc_session')?.value;
    if (!token) return null;

    const results: any = await query(
        `SELECT s.*, u.id as user_id, u.username, u.display_name, u.role, u.permissions, u.password_hash, u.avatar_url
         FROM soc_sessions s
         JOIN soc_users u ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > NOW()`,
        [token]
    );

    if (!results || results.length === 0) return null;

    const session = results[0];
    let perms = {};
    try {
        perms = typeof session.permissions === 'string' ? JSON.parse(session.permissions) : session.permissions || {};
    } catch { perms = {}; }

    return {
        userId: session.user_id,
        username: session.username,
        displayName: session.display_name,
        role: session.role,
        permissions: perms,
        avatarUrl: session.avatar_url || null,
        requiresPasswordChange: verifyPassword('12345', session.password_hash)
    };
}

export async function destroySession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('soc_session')?.value;
    if (token) {
        await query('DELETE FROM soc_sessions WHERE token = ?', [token]);
    }
    cookieStore.delete('soc_session');
}
