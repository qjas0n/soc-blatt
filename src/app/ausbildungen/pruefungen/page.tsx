import { ClipboardList, Lock } from 'lucide-react';
import { getAllExams, isTrainingInstructor } from '@/app/actions';
import { getSession } from '@/lib/auth';
import AllExamsTable from '@/components/AllExamsTable';

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

    const [exams, session] = await Promise.all([getAllExams(), getSession()]);
    const canDelete = !!session && (session.role === 'admin' || session.role === 'leitung');

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

            <AllExamsTable exams={exams} canDelete={canDelete} />
        </div>
    );
}
