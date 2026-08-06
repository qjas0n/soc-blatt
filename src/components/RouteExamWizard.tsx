"use client";

import React, { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, HelpCircle, Minus, Plus, Loader2, ImageOff, ChevronLeft, ChevronRight as ChevronRightIcon, CheckCircle2, Users } from 'lucide-react';
import { updateExamAnswer, updateExamHaltFlag, updateExamStep, getExamLiveState } from '@/app/actions';
import FinishExamCard from '@/components/FinishExamCard';

const POLL_INTERVAL_MS = 2500;

interface Answer {
    id: number;
    frage: string;
    antwort: string;
    max_punkte: number;
    punkte_erreicht: number;
}

interface Halt {
    id: number;
    name: string;
    bild: string | null;
    gefunden: boolean | number;
    schnellste_route: boolean | number;
    answers: Answer[];
}

interface Exam {
    id: number;
    current_step?: number;
    halts: Halt[];
}

function QuestionBlock({ answer, savingId, onFocus, onBlur, onChange }: { answer: Answer; savingId: number | null; onFocus: () => void; onBlur: () => void; onChange: (a: Answer, value: number) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{answer.frage}</div>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Musterantwort</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{answer.antwort}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Punkte:</span>
                <button type="button" onClick={() => onChange(answer, answer.punkte_erreicht - 0.5)} style={{
                    width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Minus size={13} />
                </button>
                <input
                    type="text" inputMode="decimal"
                    value={answer.punkte_erreicht}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onChange={e => onChange(answer, Number(e.target.value.replace(',', '.')) || 0)}
                    style={{
                        width: '54px', textAlign: 'center', padding: '5px', borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px'
                    }}
                />
                <button type="button" onClick={() => onChange(answer, answer.punkte_erreicht + 0.5)} style={{
                    width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Plus size={13} />
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    / {answer.max_punkte} {savingId === answer.id && <Loader2 size={11} className="spin" style={{ marginLeft: '4px', verticalAlign: 'middle' }} />}
                </span>
            </div>
        </div>
    );
}

export default function RouteExamWizard({ exam, bestehenProzent, memberNames }: { exam: Exam; bestehenProzent: number; memberNames: string[] }) {
    const [halts, setHalts] = useState<Halt[]>(exam.halts);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [stepIndex, setStepIndex] = useState(exam.current_step || 0);
    const [focusedAnswerId, setFocusedAnswerId] = useState<number | null>(null);
    const [, startTransition] = useTransition();
    const router = useRouter();
    const focusedAnswerIdRef = useRef<number | null>(null);
    focusedAnswerIdRef.current = focusedAnswerId;

    const totals = useMemo(() => {
        const allAnswers = halts.flatMap(h => h.answers);
        const max = allAnswers.reduce((s, a) => s + a.max_punkte, 0);
        const total = allAnswers.reduce((s, a) => s + a.punkte_erreicht, 0);
        return { total, max, pct: max > 0 ? Math.round((total / max) * 100) : 0 };
    }, [halts]);

    const suggestedStatus = totals.pct >= bestehenProzent ? 'bestanden' : 'nicht_bestanden';

    const commitAnswer = (answerId: number, value: number) => {
        setSavingId(answerId);
        startTransition(async () => {
            await updateExamAnswer(exam.id, answerId, value);
            setSavingId(null);
        });
    };

    const setAnswerValue = (haltId: number, a: Answer, value: number) => {
        const clamped = Math.max(0, Math.min(a.max_punkte, value));
        setHalts(prev => prev.map(h => h.id !== haltId ? h : {
            ...h, answers: h.answers.map(x => x.id === a.id ? { ...x, punkte_erreicht: clamped } : x)
        }));
        commitAnswer(a.id, clamped);
    };

    const toggleFlag = (haltId: number, field: 'gefunden' | 'schnellste_route') => {
        const halt = halts.find(h => h.id === haltId);
        if (!halt) return;
        const value = !halt[field];
        setHalts(prev => prev.map(h => h.id === haltId ? { ...h, [field]: value } : h));
        startTransition(async () => {
            await updateExamHaltFlag(haltId, field, value);
        });
    };

    const goToStep = (newIndex: number) => {
        const clamped = Math.max(0, Math.min(halts.length, newIndex));
        setStepIndex(clamped);
        startTransition(async () => {
            await updateExamStep(exam.id, clamped);
        });
    };

    // Poll so a second examiner scoring the same exam sees updates (points, flags,
    // current stop, finish status) live without needing to refresh the page.
    useEffect(() => {
        const interval = setInterval(async () => {
            const state: any = await getExamLiveState(exam.id);
            if (!state || state.error) return;

            if (state.exam.status !== 'in_bearbeitung') {
                router.push(`/ausbildungen/pruefungen/${exam.id}`);
                return;
            }

            setHalts(prev => prev.map(h => {
                const hs = state.halts.find((x: any) => x.id === h.id);
                if (!hs) return h;
                return {
                    ...h,
                    gefunden: hs.gefunden,
                    schnellste_route: hs.schnellste_route,
                    answers: h.answers.map(a => {
                        if (a.id === focusedAnswerIdRef.current) return a;
                        const as = state.answers.find((x: any) => x.id === a.id);
                        return as ? { ...a, punkte_erreicht: as.punkte_erreicht } : a;
                    }),
                };
            }));

            if (typeof state.exam.current_step === 'number') {
                setStepIndex(prev => prev === state.exam.current_step ? prev : state.exam.current_step);
            }
        }, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [exam.id, router]);

    const done = stepIndex >= halts.length;
    const current = !done ? halts[stepIndex] : null;

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Ortskunde — läuft gerade
                        <span title="Live synchronisiert mit anderen Prüfern" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Users size={11} /> Live
                        </span>
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: totals.pct >= bestehenProzent ? 'var(--color-green)' : 'var(--color-red)' }}>
                        {totals.total} / {totals.max} Punkte ({totals.pct}%)
                    </span>
                </div>
                <div style={{ padding: '10px 22px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {done ? 'Alle Standorte abgeschlossen' : `Standort ${stepIndex + 1} von ${halts.length}`} — Bestehensgrenze: {bestehenProzent}%
                </div>

                {current && (
                    <div className="card-content">
                        <div className="grid-container" style={{ gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MapPin size={18} style={{ color: 'var(--color-accent)' }} />
                                    <span style={{ fontSize: '16px', fontWeight: '700' }}>Standort {stepIndex + 1}: {current.name || '(kein Name hinterlegt)'}</span>
                                </div>

                                {current.bild ? (
                                    <img src={current.bild} alt={current.name} style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }} />
                                ) : (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '40px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)'
                                    }}>
                                        <ImageOff size={24} />
                                        <span style={{ fontSize: '12px' }}>Kein Bild für diesen Standort hinterlegt</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={!!current.gefunden} onChange={() => toggleFlag(current.id, 'gefunden')} style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
                                        Vom Geprüften gefunden
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={!!current.schnellste_route} onChange={() => toggleFlag(current.id, 'schnellste_route')} style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }} />
                                        Schnellste Route genommen
                                    </label>
                                </div>
                            </div>

                            {current.answers.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <HelpCircle size={18} style={{ color: 'var(--color-accent)' }} />
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Theoriefragen während der Fahrt ({current.answers.length})
                                        </span>
                                    </div>
                                    {current.answers.map(a => (
                                        <QuestionBlock
                                            key={a.id} answer={a} savingId={savingId}
                                            onFocus={() => setFocusedAnswerId(a.id)}
                                            onBlur={() => setFocusedAnswerId(prev => prev === a.id ? null : prev)}
                                            onChange={(ans, val) => setAnswerValue(current.id, ans, val)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {done && (
                    <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-green)' }}>
                        <CheckCircle2 size={18} />
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Alle Standorte und Fragen wurden durchlaufen. Prüfung kann abgeschlossen werden.</span>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 22px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        type="button"
                        disabled={stepIndex === 0}
                        onClick={() => goToStep(stepIndex - 1)}
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', opacity: stepIndex === 0 ? 0.4 : 1, cursor: stepIndex === 0 ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronLeft size={14} /> Zurück
                    </button>
                    {!done && (
                        <button type="button" onClick={() => goToStep(stepIndex + 1)} className="btn btn-primary">
                            Weiter <ChevronRightIcon size={14} />
                        </button>
                    )}
                </div>
            </div>

            {done && <FinishExamCard examId={exam.id} suggestedStatus={suggestedStatus} memberNames={memberNames} />}
        </>
    );
}
