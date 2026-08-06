"use server";

import { initDb } from '@/lib/init-db';

export async function runDatabaseInit(key: string) {
    if (!process.env.DEBUG_KEY || key !== process.env.DEBUG_KEY) {
        return { error: 'Ungültiger Key.' };
    }

    try {
        await initDb();
        return { success: true };
    } catch (e: any) {
        return { error: e?.message || 'Unbekannter Fehler beim Initialisieren.' };
    }
}
