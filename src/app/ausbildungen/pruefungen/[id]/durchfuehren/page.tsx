import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight, Radio, Lock } from 'lucide-react';
import { getExamDetail, isTrainingInstructor } from '@/app/actions';
import LiveExamForm from '@/components/LiveExamForm';

export default async function ConductExamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const canConduct = await isTrainingInstructor();

    if (!canConduct) {
        return (
            <div className="dashboard-content">
                <div className="card">
                    <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '30px' }}>
                        <Lock size={16} /> Nur Ausbilder (Leitung/Admin) können Prüfungen durchführen.
                    </div>
                </div>
            </div>
        );
    }

    const exam = await getExamDetail(Number(id));
    if (!exam) notFound();

    if (exam.status !== 'in_bearbeitung') {
        redirect(`/ausbildungen/pruefungen/${id}`);
    }

    return (
        <div className="dashboard-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Link href="/ausbildungen" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ausbildungen</Link>
                <ChevronRight size={12} />
                <Link href={`/ausbildungen/${exam.training_slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{exam.training_title}</Link>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--text-secondary)' }}>{exam.candidate_name}</span>
            </div>

            <div className="hero">
                <div className="hero-icon" style={{ color: 'var(--color-yellow)', background: 'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.05))', borderColor: 'rgba(234,179,8,0.25)' }}>
                    <Radio size={26} />
                </div>
                <div>
                    <h1 className="page-title">{exam.candidate_name}</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" style={{ background: 'var(--color-yellow)', boxShadow: '0 0 6px var(--color-yellow)' }} />
                        {exam.training_title} &nbsp;&middot;&nbsp; Prüfer: {exam.examiner_name}
                    </div>
                </div>
            </div>

            <LiveExamForm exam={exam} bestehenProzent={exam.training_bestehen_prozent ?? 80} />
        </div>
    );
}
