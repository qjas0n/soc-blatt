import Link from 'next/link';
import { GraduationCap, ChevronRight, Car, Target, Scale, Brain, FileQuestion, ClipboardList, Settings } from 'lucide-react';
import { getTrainingCategories, isTrainingInstructor, getTrainingLocks, getMemberNames, getCurrentUser, getOngoingExams } from '@/app/actions';
import TrainingLocks from '@/components/TrainingLocks';
import OngoingExamsPanel from '@/components/OngoingExamsPanel';

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

            {canManage && <OngoingExamsPanel initial={ongoing} />}

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
