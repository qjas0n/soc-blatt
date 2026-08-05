interface Attempt {
    count: number;
    lastAttempt: number;
    lockedUntil?: number;
}

const store = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkRateLimit(key: string): { blocked: boolean; retryAfterMin?: number } {
    const now = Date.now();
    const rec = store.get(key);
    if (rec?.lockedUntil && now < rec.lockedUntil) {
        return { blocked: true, retryAfterMin: Math.ceil((rec.lockedUntil - now) / 60_000) };
    }
    return { blocked: false };
}

export function recordFailure(key: string): void {
    const now = Date.now();
    const rec = store.get(key) ?? { count: 0, lastAttempt: 0 };
    if (now - rec.lastAttempt > LOCKOUT_MS) rec.count = 0;
    rec.count++;
    rec.lastAttempt = now;
    if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = now + LOCKOUT_MS;
    store.set(key, rec);
}

export function clearFailures(key: string): void {
    store.delete(key);
}
