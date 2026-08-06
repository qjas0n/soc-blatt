import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ClipboardCheck, Lock, User, Calendar, MapPin, Radio, CheckCircle2, XCircle } from 'lucide-react';
import { getExamDetail, isTrainingInstructor } from '@/app/actions';
import DeleteExamButton from '@/components/DeleteExamButton';

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    bestanden: { label: 'Bestanden', bg: 'rgba(34,197,94,0.12)', color: 'var(--color-green)', border: 'rgba(34,197,94,0.3)' },
    nicht_bestanden: { label: 'Nicht bestanden', bg: 'rgba(239,68,68,0.12)', color: 'var(--color-red)', border: 'rgba(239,68,68,0.3)' },
    in_bearbeitung: { label: 'In Bearbeitung', bg: 'rgba(234,179,8,0.12)', color: 'var(--color-yellow)', border: 'rgba(234,179,8,0.3)' },
};

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const canConduct = await isTrainingInstructor();

    if (!canConduct) {
        return (
            <div className="dashboard-content">
                <div className="card">
                    <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '30px' }}>
                        <Lock size={16} /> Nur Ausbilder (Leitung/Admin) haben Zugriff auf Prüfungsdetails.
                    </div>
                </div>
            </div>
        );
    }

    const exam = await getExamDetail(Number(id));
    if (!exam) notFound();

    const st = STATUS_STYLE[exam.status] || STATUS_STYLE.in_bearbeitung;
    const date = new Date(exam.created_at);
    const pct = exam.max_points > 0 ? Math.round((exam.total_points / exam.max_points) * 100) : 0;

    return (
        <div className="dashboard-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Link href="/ausbildungen" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ausbildungen</Link>
                <ChevronRight size={12} />
                <Link href="/ausbildungen/pruefungen" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Prüfungsübersicht</Link>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--text-secondary)' }}>{exam.candidate_name}</span>
            </div>

            <div className="hero">
                <div className="hero-icon">
                    <ClipboardCheck size={26} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <h1 className="page-title">{exam.candidate_name}</h1>
                        <span style={{ padding: '4px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '700', backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {st.label}
                        </span>
                    </div>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        {exam.training_title}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {exam.status === 'in_bearbeitung' && (
                        <Link href={`/ausbildungen/pruefungen/${exam.id}/durchfuehren`} style={{ textDecoration: 'none' }}>
                            <button className="btn btn-primary">
                                <Radio size={14} /> Fortsetzen
                            </button>
                        </Link>
                    )}
                    <DeleteExamButton id={exam.id} />
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header"><User size={16} /> Prüfer</div>
                    <div className="stat-value" style={{ fontSize: '18px' }}>{exam.examiner_name}</div>
                    {(exam.examiner2_name || exam.examiner3_name) && (
                        <div className="stat-sub">
                            {[exam.examiner2_name, exam.examiner3_name].filter(Boolean).join(', ')}
                        </div>
                    )}
                </div>
                <div className="stat-card">
                    <div className="stat-header"><Calendar size={16} /> Datum</div>
                    <div className="stat-value" style={{ fontSize: '18px' }}>{date.toLocaleDateString('de-DE')}</div>
                    <div className="stat-sub">{date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</div>
                </div>
                {exam.halts.length > 0 && (
                    <div className="stat-card">
                        <div className="stat-header"><MapPin size={16} /> Standorte</div>
                        <div className="stat-value" style={{ fontSize: '18px' }}>{exam.halts.length}</div>
                        <div className="stat-sub">{exam.halts.filter((h: any) => h.gefunden).length} gefunden</div>
                    </div>
                )}
                <div className="stat-card">
                    <div className="stat-header"><ClipboardCheck size={16} /> Ergebnis</div>
                    <div className="stat-value" style={{ color: pct >= 80 ? 'var(--color-green)' : pct >= 50 ? 'var(--color-yellow)' : 'var(--color-red)' }}>
                        {exam.total_points} / {exam.max_points}
                    </div>
                    <div className="stat-sub">{pct}%</div>
                </div>
            </div>

            {exam.notes && (
                <div className="card">
                    <div className="card-header"><span>Notizen</span></div>
                    <div className="card-content">
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{exam.notes}</p>
                    </div>
                </div>
            )}

            {exam.halts.length > 0 ? (
                exam.halts.map((h: any, i: number) => (
                    <div className="card" key={h.id}>
                        <div className="card-header">
                            <span>Standort {i + 1}: {h.name}</span>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: h.gefunden ? 'var(--color-green)' : 'var(--text-muted)' }}>
                                    {h.gefunden ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Gefunden
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: h.schnellste_route ? 'var(--color-green)' : 'var(--text-muted)' }}>
                                    {h.schnellste_route ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Schnellste Route
                                </span>
                            </div>
                        </div>
                        {h.answers.length > 0 && (
                            <div style={{ overflow: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Frage</th>
                                            <th className="text-center" style={{ width: '110px' }}>Punkte</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {h.answers.map((a: any) => (
                                            <tr key={a.id}>
                                                <td>{a.frage}</td>
                                                <td className="text-center" style={{ color: a.punkte_erreicht === a.max_punkte ? 'var(--color-green)' : a.punkte_erreicht === 0 ? 'var(--color-red)' : 'var(--color-yellow)', fontWeight: '600' }}>
                                                    {a.punkte_erreicht} / {a.max_punkte}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))
            ) : exam.answers.length > 0 && (
                <div className="card">
                    <div className="card-header"><span>Bewertung im Detail</span></div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Frage / Kriterium</th>
                                    <th className="text-center" style={{ width: '110px' }}>Punkte</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exam.answers.map((a: any) => (
                                    <tr key={a.id}>
                                        <td>{a.frage}</td>
                                        <td className="text-center" style={{ color: a.punkte_erreicht === a.max_punkte ? 'var(--color-green)' : a.punkte_erreicht === 0 ? 'var(--color-red)' : 'var(--color-yellow)', fontWeight: '600' }}>
                                            {a.punkte_erreicht} / {a.max_punkte}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
