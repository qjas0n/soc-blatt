import Link from 'next/link';
import { ClipboardList, Lock, ChevronRight } from 'lucide-react';
import { getAllExams, isTrainingInstructor } from '@/app/actions';

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    bestanden: { label: 'Bestanden', bg: 'rgba(34,197,94,0.12)', color: 'var(--color-green)', border: 'rgba(34,197,94,0.3)' },
    nicht_bestanden: { label: 'Nicht bestanden', bg: 'rgba(239,68,68,0.12)', color: 'var(--color-red)', border: 'rgba(239,68,68,0.3)' },
    in_bearbeitung: { label: 'In Bearbeitung', bg: 'rgba(234,179,8,0.12)', color: 'var(--color-yellow)', border: 'rgba(234,179,8,0.3)' },
};

export default async function AllExamsPage() {
    const canConduct = await isTrainingInstructor();

    if (!canConduct) {
        return (
            <div className="dashboard-content">
                <div className="card">
                    <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '30px' }}>
                        <Lock size={16} /> Nur Ausbilder (Leitung/Admin) haben Zugriff auf die Prüfungsübersicht.
                    </div>
                </div>
            </div>
        );
    }

    const exams = await getAllExams();

    return (
        <div className="dashboard-content">
            <div className="hero">
                <div className="hero-icon">
                    <ClipboardList size={26} />
                </div>
                <div>
                    <h1 className="page-title">Prüfungsübersicht</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        Alle durchgeführten Prüfungen &nbsp;&middot;&nbsp; {exams.length} Einträge
                    </div>
                </div>
            </div>

            <div className="card">
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
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map((e: any) => {
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
                                    </tr>
                                );
                            })}
                            {exams.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Noch keine Prüfungen durchgeführt.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
