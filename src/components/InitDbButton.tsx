"use client";

import { useState } from 'react';
import { PlayCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { runDatabaseInit } from '@/app/debug/actions';

export default function InitDbButton({ debugKey }: { debugKey: string }) {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

    const handleClick = async () => {
        if (!confirm('Datenbank initialisieren? Legt fehlende Tabellen an und füllt sie mit Standard-Daten (Admin-Account, Ausbildungen, Dienstvorschriften usw.), sofern noch nicht vorhanden. Bestehende Daten werden nicht verändert.')) return;

        setRunning(true);
        setResult(null);
        const res = await runDatabaseInit(debugKey);
        setRunning(false);
        setResult(res);
        if (res?.success) {
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
                onClick={handleClick}
                disabled={running}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start',
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)',
                    background: running ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.15)',
                    color: '#60a5fa', fontSize: '12.5px', fontWeight: 600, cursor: running ? 'wait' : 'pointer'
                }}
            >
                {running ? <Loader2 size={14} className="spin" /> : <PlayCircle size={14} />}
                {running ? 'Initialisiere Datenbank...' : 'Datenbank initialisieren (fehlende Tabellen & Daten anlegen)'}
            </button>

            {result?.success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '12px' }}>
                    <CheckCircle2 size={13} /> Erfolgreich abgeschlossen. Seite wird aktualisiert...
                </div>
            )}
            {result?.error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '12px', fontFamily: 'monospace' }}>
                    <AlertCircle size={13} /> {result.error}
                </div>
            )}
        </div>
    );
}
