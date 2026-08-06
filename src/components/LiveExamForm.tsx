"use client";

import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Loader2, Users } from 'lucide-react';
import { updateExamAnswer, getExamLiveState } from '@/app/actions';
import FinishExamCard from '@/components/FinishExamCard';

const POLL_INTERVAL_MS = 2500;

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

export default function LiveExamForm({ exam, bestehenProzent, memberNames }: { exam: Exam; bestehenProzent: number; memberNames: string[] }) {
    const [answers, setAnswers] = useState<Answer[]>(exam.answers);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [focusedAnswerId, setFocusedAnswerId] = useState<number | null>(null);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const focusedAnswerIdRef = useRef<number | null>(null);
    focusedAnswerIdRef.current = focusedAnswerId;

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

    // Poll so a second examiner scoring the same exam sees updates live without refreshing.
    useEffect(() => {
        const interval = setInterval(async () => {
            const state: any = await getExamLiveState(exam.id);
            if (!state || state.error) return;

            if (state.exam.status !== 'in_bearbeitung') {
                router.push(`/ausbildungen/pruefungen/${exam.id}`);
                return;
            }

            setAnswers(prev => prev.map(a => {
                if (a.id === focusedAnswerIdRef.current) return a;
                const as = state.answers.find((x: any) => x.id === a.id);
                return as ? { ...a, punkte_erreicht: as.punkte_erreicht } : a;
            }));
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [exam.id, router]);

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Bewertung — läuft gerade
                        <span title="Live synchronisiert mit anderen Prüfern" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Users size={11} /> Live
                        </span>
                    </span>
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
                                            <button type="button" onClick={() => setValue(a, a.punkte_erreicht - 0.5)} style={{
                                                width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border-color)',
                                                background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Minus size={12} />
                                            </button>
                                            <input
                                                type="text" inputMode="decimal"
                                                value={a.punkte_erreicht}
                                                onFocus={() => setFocusedAnswerId(a.id)}
                                                onBlur={() => setFocusedAnswerId(prev => prev === a.id ? null : prev)}
                                                onChange={e => setValue(a, Number(e.target.value.replace(',', '.')) || 0)}
                                                style={{
                                                    width: '50px', textAlign: 'center', padding: '4px', borderRadius: '6px',
                                                    backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px'
                                                }}
                                            />
                                            <button type="button" onClick={() => setValue(a, a.punkte_erreicht + 0.5)} style={{
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

            <FinishExamCard examId={exam.id} suggestedStatus={suggestedStatus} memberNames={memberNames} />
        </>
    );
}
