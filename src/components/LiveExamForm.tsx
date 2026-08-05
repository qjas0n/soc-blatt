"use client";

import React, { useState, useMemo, useTransition } from 'react';
import { ClipboardCheck, Minus, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { updateExamAnswer, finishExam } from '@/app/actions';

interface Answer {
    id: number;
    frage: string;
    max_punkte: number;
    punkte_erreicht: number;
}

interface Exam {
    id: number;
    candidate_name: string;
    examiner_name: string;
    answers: Answer[];
}

export default function LiveExamForm({ exam, bestehenProzent }: { exam: Exam; bestehenProzent: number }) {
    const [answers, setAnswers] = useState<Answer[]>(exam.answers);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [finishing, setFinishing] = useState(false);
    const [, startTransition] = useTransition();

    const totals = useMemo(() => {
        const max = answers.reduce((s, a) => s + a.max_punkte, 0);
        const total = answers.reduce((s, a) => s + a.punkte_erreicht, 0);
        return { total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0 };
    }, [answers]);

    const suggestedStatus = totals.pct >= bestehenProzent ? 'bestanden' : 'nicht_bestanden';

    const commit = (answerId: number, value: number) => {
        setSavingId(answerId);
        startTransition(async () => {
            await updateExamAnswer(exam.id, answerId, value);
            setSavingId(null);
        });
    };

    const setValue = (a: Answer, value: number) => {
        const clamped = Math.max(0, Math.min(a.max_punkte, value));
        setAnswers(prev => prev.map(x => x.id === a.id ? { ...x, punkte_erreicht: clamped } : x));
        commit(a.id, clamped);
    };

    const handleFinish = async (formData: FormData) => {
        setFinishing(true);
        await finishExam(formData);
        setFinishing(false);
    };

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <span>Bewertung — läuft gerade</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: totals.pct >= bestehenProzent ? 'var(--color-green)' : 'var(--color-red)' }}>
                        {totals.total} / {totals.max} Punkte ({totals.pct}%)
                    </span>
                </div>
                <div style={{ padding: '10px 22px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Bestehensgrenze: {bestehenProzent}% — aktueller Stand entspricht {suggestedStatus === 'bestanden' ? 'Bestanden' : 'Nicht bestanden'}
                </div>
                <div style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Frage / Kriterium</th>
                                <th className="text-center" style={{ width: '180px' }}>Punkte</th>
                            </tr>
                        </thead>
                        <tbody>
                            {answers.map(a => (
                                <tr key={a.id}>
                                    <td>{a.frage}</td>
                                    <td className="text-center">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <button type="button" onClick={() => setValue(a, a.punkte_erreicht - 1)} style={{
                                                width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-color)',
                                                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Minus size={12} />
                                            </button>
                                            <input
                                                type="number" min={0} max={a.max_punkte}
                                                value={a.punkte_erreicht}
                                                onChange={e => setValue(a, Number(e.target.value) || 0)}
                                                style={{
                                                    width: '40px', textAlign: 'center', padding: '4px', borderRadius: '6px',
                                                    backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px'
                                                }}
                                            />
                                            <button type="button" onClick={() => setValue(a, a.punkte_erreicht + 1)} style={{
                                                width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-color)',
                                                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Plus size={12} />
                                            </button>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '34px', textAlign: 'left' }}>
                                                {savingId === a.id ? <Loader2 size={12} className="spin" /> : `/ ${a.max_punkte}`}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span>Prüfung abschließen</span>
                    <ClipboardCheck size={16} className="icon" />
                </div>
                <div className="card-content">
                    <form action={handleFinish} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input type="hidden" name="exam_id" value={exam.id} />

                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flex: '1 1 200px', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ergebnis</label>
                                <select name="status" defaultValue={suggestedStatus} key={suggestedStatus} style={{ padding: '9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}>
                                    <option value="bestanden">Bestanden</option>
                                    <option value="nicht_bestanden">Nicht bestanden</option>
                                </select>
                            </div>
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
        </>
    );
}
