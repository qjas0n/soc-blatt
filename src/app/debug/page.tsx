import type { CSSProperties } from 'react';
import { query } from '@/lib/db';
import { Database, CheckCircle2, XCircle, Server, Clock, Table2 } from 'lucide-react';

interface TableInfo {
    name: string;
    rows: number | null;
    error?: string;
}

export default async function DebugPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
    const { key } = await searchParams;
    const expectedKey = process.env.DEBUG_KEY;

    // Fail closed: no key configured, or wrong/missing key -> look like nothing is here.
    if (!expectedKey || key !== expectedKey) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontFamily: 'monospace', fontSize: '13px' }}>
                404 — This page could not be found.
            </div>
        );
    }

    let dbOk = false;
    let dbError = '';
    let mysqlVersion = '';
    const tables: TableInfo[] = [];

    try {
        const versionRows: any = await query('SELECT VERSION() as v');
        mysqlVersion = versionRows?.[0]?.v || '';
        dbOk = true;
    } catch (e: any) {
        dbError = e?.message || 'Unbekannter Fehler';
    }

    if (dbOk) {
        try {
            const tableRows: any = await query('SHOW TABLES');
            const tableKey = tableRows.length > 0 ? Object.keys(tableRows[0])[0] : null;
            const tableNames: string[] = tableKey ? tableRows.map((r: any) => r[tableKey]) : [];
            tableNames.sort();

            for (const name of tableNames) {
                try {
                    const countRows: any = await query(`SELECT COUNT(*) as c FROM \`${name}\``);
                    tables.push({ name, rows: countRows?.[0]?.c ?? 0 });
                } catch (e: any) {
                    tables.push({ name, rows: null, error: e?.message || 'Fehler' });
                }
            }
        } catch (e: any) {
            dbError = e?.message || 'Unbekannter Fehler beim Auflisten der Tabellen';
        }
    }

    const checkedAt = new Date();
    const totalRows = tables.reduce((s, t) => s + (t.rows ?? 0), 0);

    const cardStyle: CSSProperties = {
        background: 'var(--panel-bg, #161925)',
        border: '1px solid var(--border-color, #23283b)',
        borderRadius: '10px',
        overflow: 'hidden',
    };
    const headerStyle: CSSProperties = {
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-color, #23283b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--text-primary, #f8fafc)',
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg-color, #0b0d14)', color: 'var(--text-primary, #f8fafc)',
            fontFamily: 'var(--font-main, Inter, sans-serif)', padding: '32px 20px'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        background: dbOk ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${dbOk ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: dbOk ? '#22c55e' : '#ef4444'
                    }}>
                        <Database size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>SOC — Debug</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Interner Diagnose-Endpunkt, nicht öffentlich verlinken</div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={headerStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {dbOk ? <CheckCircle2 size={15} color="#22c55e" /> : <XCircle size={15} color="#ef4444" />}
                            Datenbankverbindung
                        </span>
                        <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                            background: dbOk ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: dbOk ? '#22c55e' : '#ef4444'
                        }}>
                            {dbOk ? 'OK' : 'FEHLER'}
                        </span>
                    </div>
                    <div style={{ padding: '16px 18px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dbOk ? (
                            <>
                                <Row label="MySQL/MariaDB Version" value={mysqlVersion} />
                                <Row label="Host" value={`${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`} />
                                <Row label="Datenbank" value={process.env.DB_NAME || 'soc'} />
                                <Row label="Benutzer" value={process.env.DB_USER || 'root'} />
                            </>
                        ) : (
                            <div style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{dbError}</div>
                        )}
                    </div>
                </div>

                {dbOk && (
                    <div style={cardStyle}>
                        <div style={headerStyle}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Table2 size={15} /> Tabellen ({tables.length})
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{totalRows} Zeilen insgesamt</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Tabelle</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Zeilen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tables.map(t => (
                                        <tr key={t.name}>
                                            <td style={tdStyle}>
                                                <span style={{ fontFamily: 'monospace' }}>{t.name}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', color: t.error ? '#ef4444' : '#94a3b8' }}>
                                                {t.error ? 'Fehler' : t.rows}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div style={cardStyle}>
                    <div style={headerStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Server size={15} /> Umgebung</span>
                    </div>
                    <div style={{ padding: '16px 18px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Row label="NODE_ENV" value={process.env.NODE_ENV || 'unbekannt'} />
                        <Row label="Next.js" value="16.1.6" />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4b5563' }}>
                    <Clock size={12} /> Geprüft am {checkedAt.toLocaleDateString('de-DE')} um {checkedAt.toLocaleTimeString('de-DE')}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#6b7280' }}>{label}</span>
            <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{value}</span>
        </div>
    );
}

const thStyle: CSSProperties = {
    textAlign: 'left', padding: '8px 18px', fontSize: '11px', color: '#6b7280',
    borderBottom: '1px solid var(--border-color, #23283b)', fontWeight: 500,
};
const tdStyle: CSSProperties = {
    padding: '7px 18px', borderBottom: '1px solid var(--border-color, #23283b)',
};
