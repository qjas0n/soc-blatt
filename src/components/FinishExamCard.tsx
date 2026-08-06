"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { finishExam } from '@/app/actions';

export default function FinishExamCard({ examId, suggestedStatus, memberNames = [] }: {
    examId: number; suggestedStatus: 'bestanden' | 'nicht_bestanden'; memberNames?: string[];
}) {
    const [finishing, setFinishing] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleFinish = async (formData: FormData) => {
        setFinishing(true);
        setError('');
        const result = await finishExam(formData);
        if (result?.error) {
            setError(result.error);
            setFinishing(false);
            return;
        }
        if (result?.success) {
            router.push(`/ausbildungen/pruefungen/${result.examId}`);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <span>Prüfung abschließen</span>
                <ClipboardCheck size={16} className="icon" />
            </div>
            <div className="card-content">
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        fontSize: '13px', color: 'var(--color-red)'
                    }}>
                        <AlertCircle size={15} /> {error}
                    </div>
                )}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: suggestedStatus === 'bestanden' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${suggestedStatus === 'bestanden' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    fontSize: '13px', color: suggestedStatus === 'bestanden' ? 'var(--color-green)' : 'var(--color-red)', fontWeight: '600'
                }}>
                    Ergebnis wird automatisch aus dem Punktestand berechnet: {suggestedStatus === 'bestanden' ? 'Bestanden' : 'Nicht bestanden'}
                </div>

                <form action={handleFinish} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <input type="hidden" name="exam_id" value={examId} />

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flex: '1 1 200px', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Zweitprüfer (optional)</label>
                            <input name="examiner2_name" list="finish-member-names" placeholder="Name" style={{ padding: '9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flex: '1 1 200px', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Drittprüfer (optional)</label>
                            <input name="examiner3_name" list="finish-member-names" placeholder="Name" style={{ padding: '9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                        <datalist id="finish-member-names">
                            {memberNames.map(n => <option key={n} value={n} />)}
                        </datalist>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Notizen (z. B. Auffälligkeiten, Verlauf des 10-80)</label>
                        <textarea name="notes" rows={3} style={{ padding: '9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={finishing} className="btn btn-primary" style={{ padding: '11px 24px' }}>
                            <CheckCircle2 size={15} /> {finishing ? 'Wird abgeschlossen...' : 'Prüfung abschließen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
