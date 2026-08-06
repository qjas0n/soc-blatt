"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Trash2 } from 'lucide-react';
import { deleteExam } from '@/app/actions';

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    bestanden: { label: 'Bestanden', bg: 'rgba(34,197,94,0.12)', color: 'var(--color-green)', border: 'rgba(34,197,94,0.3)' },
    nicht_bestanden: { label: 'Nicht bestanden', bg: 'rgba(239,68,68,0.12)', color: 'var(--color-red)', border: 'rgba(239,68,68,0.3)' },
    in_bearbeitung: { label: 'In Bearbeitung', bg: 'rgba(234,179,8,0.12)', color: 'var(--color-yellow)', border: 'rgba(234,179,8,0.3)' },
};

export default function AllExamsTable({ exams, canDelete }: { exams: any[]; canDelete: boolean }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const router = useRouter();

    const filtered = exams.filter(e => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (e.candidate_name && e.candidate_name.toLowerCase().includes(q)) ||
            (e.examiner_name && e.examiner_name.toLowerCase().includes(q)) ||
            (e.training_title && e.training_title.toLowerCase().includes(q))
        );
    });

    const handleDelete = async (id: number) => {
        if (!confirm('Diesen Prüfungseintrag wirklich löschen?')) return;
        setDeletingId(id);
        await deleteExam(id);
        router.refresh();
        setDeletingId(null);
    };

    return (
        <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0 10px', maxWidth: '320px'
                }}>
                    <Search size={14} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Prüfung durchsuchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '9px', outline: 'none', fontSize: '13px', width: '100%' }}
                    />
                </div>
            </div>
            <div style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Geprüfter</th>
                            <th>Ausbildung</th>
                            <th className="text-center">Punkte</th>
                            <th className="text-center">Status</th>
                            <th>Prüfer</th>
                            <th>Datum</th>
                            {canDelete && <th className="text-center">Aktionen</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((e: any) => {
                            const st = STATUS_STYLE[e.status] || STATUS_STYLE.in_bearbeitung;
                            const date = new Date(e.created_at);
                            return (
                                <tr key={e.id}>
                                    <td style={{ fontWeight: '600' }}>
                                        <Link href={`/ausbildungen/pruefungen/${e.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {e.candidate_name}
                                            <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                                        </Link>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{e.training_title}</td>
                                    <td className="text-center">{e.total_points} / {e.max_points}</td>
                                    <td className="text-center">
                                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{e.examiner_name}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{date.toLocaleDateString('de-DE')}</td>
                                    {canDelete && (
                                        <td className="text-center">
                                            <button
                                                onClick={() => handleDelete(e.id)}
                                                disabled={deletingId === e.id}
                                                className="btn"
                                                style={{
                                                    padding: '6px 10px', fontSize: '12px',
                                                    backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-red)', border: '1px solid rgba(239,68,68,0.3)',
                                                    cursor: deletingId === e.id ? 'wait' : 'pointer'
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={canDelete ? 7 : 6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                    {exams.length === 0 ? 'Noch keine Prüfungen durchgeführt.' : 'Keine Prüfungen gefunden.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
