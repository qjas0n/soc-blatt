import Link from 'next/link';
import { GraduationCap, ChevronRight, Car, Target, Scale, Brain, FileQuestion, ClipboardList, Radio, Settings } from 'lucide-react';
import { getTrainingCategories, isTrainingInstructor, getTrainingLocks, getMemberNames, getCurrentUser, getOngoingExams } from '@/app/actions';
import TrainingLocks from '@/components/TrainingLocks';

const TRAINING_ICONS: Record<string, any> = {
    'fahren-theorie-ortskunde': Car,
    'schiessen-praxis': Target,
    'waffenregelungen': Scale,
    'gamesense-einsatzverhalten': Brain,
};

export default async function AusbildungenPage() {
    const [categories, canManage, locks, memberNames, currentUser] = await Promise.all([
        getTrainingCategories(),
        isTrainingInstructor(),
        getTrainingLocks(),
        getMemberNames(),
        getCurrentUser(),
    ]);
    const ongoing = canManage ? await getOngoingExams() : [];

    return (
        <div className="dashboard-content">
            <div className="hero">
                <div className="hero-icon">
                    <GraduationCap size={26} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 className="page-title">Ausbildungen</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        Special Operations Command &nbsp;&middot;&nbsp; Schulungswesen
                    </div>
                </div>
                {canManage && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/ausbildungen/verwaltung" style={{ textDecoration: 'none' }}>
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                                <Settings size={14} /> Verwaltung
                            </button>
                        </Link>
                        <Link href="/ausbildungen/pruefungen" style={{ textDecoration: 'none' }}>
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                                <ClipboardList size={14} /> Alle Prüfungen
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {canManage && ongoing.length > 0 && (
                <div className="card" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Radio size={16} style={{ color: 'var(--color-yellow)' }} />
                            <span>Laufende Prüfungen</span>
                        </div>
                        <span style={{
                            backgroundColor: 'rgba(234,179,8,0.15)', color: 'var(--color-yellow)',
                            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600'
                        }}>{ongoing.length} aktiv</span>
                    </div>
                    <div style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Prüfling</th>
                                    <th>Ausbildung</th>
                                    <th className="text-center">Punkte (bisher)</th>
                                    <th>Gestartet von</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {ongoing.map((e: any) => (
                                    <tr key={e.id}>
                                        <td style={{ fontWeight: '600' }}>{e.candidate_name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{e.training_title}</td>
                                        <td className="text-center" style={{ fontWeight: '600', color: 'var(--color-yellow)' }}>{e.total_points} / {e.max_points}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{e.examiner_name}</td>
                                        <td className="text-center">
                                            <Link href={`/ausbildungen/pruefungen/${e.id}/durchfuehren`} style={{ textDecoration: 'none' }}>
                                                <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }}>Öffnen</button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <TrainingLocks initial={locks} canManage={canManage} currentUserName={currentUser?.displayName || ''} memberNames={memberNames} />

            {categories.length === 0 && (
                <div className="card">
                    <div className="card-content" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                        Noch keine Ausbildungskategorien vorhanden.
                    </div>
                </div>
            )}

            {categories.map((cat: any) => (
                <div className="card" key={cat.id}>
                    <div className="card-header">
                        <span>{cat.name}</span>
                        <GraduationCap size={16} className="icon" />
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {cat.description && (
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '13px' }}>{cat.description}</p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                            {cat.trainings.map((t: any) => {
                                const Icon = TRAINING_ICONS[t.slug] || FileQuestion;
                                return (
                                    <Link key={t.id} href={`/ausbildungen/${t.slug}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            padding: '16px', borderRadius: 'var(--radius-md)',
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            transition: 'all 0.15s', cursor: 'pointer', height: '100%'
                                        }}
                                        className="training-card"
                                        >
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)'
                                            }}>
                                                <Icon size={18} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{t.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Prüfungsbereich ansehen</div>
                                            </div>
                                            <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
