import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, GraduationCap, Package, Users, ClipboardCheck, MapPin, HelpCircle, Lock, ClipboardList, ClipboardPlus } from 'lucide-react';
import { getTrainingBySlug, isTrainingInstructor, getExamsForTraining } from '@/app/actions';

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
    bestanden: { label: 'Bestanden', bg: 'rgba(34,197,94,0.12)', color: 'var(--color-green)', border: 'rgba(34,197,94,0.3)' },
    nicht_bestanden: { label: 'Nicht bestanden', bg: 'rgba(239,68,68,0.12)', color: 'var(--color-red)', border: 'rgba(239,68,68,0.3)' },
    in_bearbeitung: { label: 'In Bearbeitung', bg: 'rgba(234,179,8,0.12)', color: 'var(--color-yellow)', border: 'rgba(234,179,8,0.3)' },
};

function Paragraphs({ text }: { text: string }) {
    const parts = (text || '').split(/\n\s*\n/).filter(Boolean);
    if (parts.length === 0) return null;
    return (
        <>
            {parts.map((p, i) => (
                <p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '13px', whiteSpace: 'pre-line' }}>{p}</p>
            ))}
        </>
    );
}

export default async function TrainingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [training, canSeeAnswers] = await Promise.all([
        getTrainingBySlug(slug),
        isTrainingInstructor(),
    ]);

    if (!training) notFound();

    const exams = canSeeAnswers ? await getExamsForTraining(training.id) : [];
    const mittel = (training.benoetigte_mittel || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    return (
        <div className="dashboard-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Link href="/ausbildungen" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ausbildungen</Link>
                <ChevronRight size={12} />
                <span>{training.category_name}</span>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--text-secondary)' }}>{training.title}</span>
            </div>

            <div className="hero">
                <div className="hero-icon">
                    <GraduationCap size={26} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 className="page-title">{training.title}</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        {training.category_name}
                    </div>
                </div>
                {canSeeAnswers && (
                    <Link href={`/ausbildungen/${slug}/pruefung`} style={{ textDecoration: 'none' }}>
                        <button className="btn btn-primary">
                            <ClipboardPlus size={15} /> Prüfung durchführen
                        </button>
                    </Link>
                )}
            </div>

            {mittel.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span>Benötigte Mittel</span>
                        <Package size={16} className="icon" />
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {mittel.map((m: string, i: number) => (
                            <span key={i} className="badge badge-blue">{m}</span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid-container">
                <div className="card">
                    <div className="card-header">
                        <span>Informationen für den Geprüften</span>
                        <Users size={16} className="icon" />
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Paragraphs text={training.info_teilnehmer} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span>Informationen für den Prüfer</span>
                        <ClipboardCheck size={16} className="icon" />
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {canSeeAnswers ? (
                            training.info_pruefer
                                ? <Paragraphs text={training.info_pruefer} />
                                : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Keine zusätzlichen Prüferhinweise hinterlegt.</p>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <Lock size={14} /> Nur für Ausbilder (Leitung/Admin) sichtbar.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {training.haltCategories.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span>{training.strecken_titel || 'Standorte'}</span>
                        <MapPin size={16} className="icon" />
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            Pro Prüfung werden aus jeder Kategorie 3 Standorte zufällig ausgewählt.
                        </p>
                        {training.haltCategories.map((c: any) => (
                            <div key={c.id}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    {c.name} <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none' }}>({c.halts.length} Standorte)</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {c.halts.map((h: any) => (
                                        <span key={h.id} className="badge badge-blue">{h.name}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {training.questions.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span>{training.aufgaben_titel || 'Fragen / Aufgaben'}</span>
                        <HelpCircle size={16} className="icon" />
                    </div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th>Frage</th>
                                    {canSeeAnswers && <th>Antwort</th>}
                                    {canSeeAnswers && <th className="text-center" style={{ width: '70px' }}>Punkte</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {training.questions.map((q: any, i: number) => (
                                    <tr key={q.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td>{q.frage}</td>
                                        {canSeeAnswers && <td style={{ color: 'var(--text-secondary)' }}>{q.antwort}</td>}
                                        {canSeeAnswers && <td className="text-center">{q.punkte}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!canSeeAnswers && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '12px', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
                                <Lock size={13} /> Antworten und Punktevergabe sind nur für Ausbilder (Leitung/Admin) sichtbar.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {canSeeAnswers && (
                <div className="card">
                    <div className="card-header">
                        <span>Durchgeführte Prüfungen</span>
                        <ClipboardList size={16} className="icon" />
                    </div>
                    <div style={{ overflow: 'auto' }}>
                        {exams.length === 0 ? (
                            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                Für diese Ausbildung wurden noch keine Prüfungen erfasst.
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Geprüfter</th>
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
                                                    <Link href={`/ausbildungen/pruefungen/${e.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                        {e.candidate_name}
                                                    </Link>
                                                </td>
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
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
