import { Users, UserCheck } from 'lucide-react';

interface Member {
    id: number;
    name: string;
    role: string;
    rang: string;
    avatar_url: string | null;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administration',
    leitung: 'Stv./Leitung',
    member: 'Beamter',
    anwaerter: 'Anwärter',
};

function positionStyle(role: string) {
    if (role === 'admin') {
        return { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.25)' };
    }
    if (role === 'leitung') {
        return { bg: 'rgba(234,179,8,0.1)', color: 'var(--color-yellow)', border: 'rgba(234,179,8,0.2)' };
    }
    return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'var(--border-color)' };
}

function initialsOf(name: string) {
    return name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function DivisionMembers({ initial }: { initial: Member[] }) {
    const members = initial || [];

    return (
        <div className="card">
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <UserCheck size={14} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <span style={{ fontSize: '15px' }}>Divisionmitglieder</span>
                    <span style={{
                        backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--color-green)',
                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600'
                    }}>{members.length} aktiv</span>
                </div>
            </div>
            <div style={{ overflow: 'auto' }}>
                {members.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#4b5563', fontSize: '13px' }}>
                        Keine Mitglieder vorhanden
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Users size={13} /> Mitarbeiter
                                    </div>
                                </th>
                                <th>Position</th>
                                <th>Rang</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m) => {
                                const style = positionStyle(m.role);
                                const positionLabel = ROLE_LABELS[m.role] || 'Beamter';
                                return (
                                    <tr key={m.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '9px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)',
                                                    overflow: 'hidden', flexShrink: 0
                                                }}>
                                                    {m.avatar_url
                                                        ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : initialsOf(m.name)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{m.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{positionLabel}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                                                backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`
                                            }}>
                                                {positionLabel}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{m.rang || 'SOC-Mitglied'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
