import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ClipboardCheck, Lock } from 'lucide-react';
import { getTrainingBySlug, isTrainingInstructor, getMemberNames } from '@/app/actions';
import StartExamForm from '@/components/StartExamForm';

export default async function NewExamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [training, canConduct, memberNames] = await Promise.all([
        getTrainingBySlug(slug),
        isTrainingInstructor(),
        getMemberNames(),
    ]);

    if (!training) notFound();

    return (
        <div className="dashboard-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Link href="/ausbildungen" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ausbildungen</Link>
                <ChevronRight size={12} />
                <Link href={`/ausbildungen/${slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{training.title}</Link>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--text-secondary)' }}>Neue Prüfung</span>
            </div>

            <div className="hero">
                <div className="hero-icon">
                    <ClipboardCheck size={26} />
                </div>
                <div>
                    <h1 className="page-title">Prüfung durchführen</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        {training.title}
                    </div>
                </div>
            </div>

            {canConduct ? (
                <StartExamForm trainingId={training.id} haltCategories={training.haltCategories} memberNames={memberNames} />
            ) : (
                <div className="card">
                    <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '30px' }}>
                        <Lock size={16} /> Nur Ausbilder (Leitung/Admin) können Prüfungen durchführen.
                    </div>
                </div>
            )}
        </div>
    );
}
