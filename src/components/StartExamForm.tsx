"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Play, Shuffle } from 'lucide-react';
import { startExam } from '@/app/actions';

interface HaltCategory {
    id: number;
    halts: { id: number }[];
}

export default function StartExamForm({ trainingId, haltCategories, memberNames }: {
    trainingId: number; haltCategories: HaltCategory[]; memberNames: string[];
}) {
    const totalHalts = haltCategories.reduce((s, c) => s + Math.min(3, c.halts.length), 0);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setSaving(true);
        setError('');
        const result = await startExam(formData);
        if (result?.error) {
            setError(result.error);
            setSaving(false);
            return;
        }
        if (result?.success) {
            router.push(`/ausbildungen/pruefungen/${result.examId}/durchfuehren`);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <span>Prüfung starten</span>
            </div>
            <div className="card-content">
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px', color: 'var(--color-red)', fontSize: '13px'
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <input type="hidden" name="training_id" value={trainingId} />

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flex: '1 1 220px', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Name des Geprüften *</label>
                            <input required name="candidate_name" list="member-names" placeholder="Vor- und Nachname" style={{ padding: '9px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            <datalist id="member-names">
                                {memberNames.map(n => <option key={n} value={n} />)}
                            </datalist>
                        </div>

                    </div>

                    {haltCategories.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <Shuffle size={13} />
                            Standorte und Theoriefragen werden beim Start zufällig ausgewählt ({totalHalts} Standorte aus {haltCategories.length} Kategorien).
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '11px 24px' }}>
                            <Play size={14} /> {saving ? 'Wird gestartet...' : 'Prüfung starten'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
