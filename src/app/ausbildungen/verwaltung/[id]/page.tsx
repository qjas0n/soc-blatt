"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronRight, Save, Plus, Trash2, Pencil, HelpCircle, MapPin, Lock } from 'lucide-react';
import Modal from '@/components/Modal';
import {
    getTrainingForEdit, updateTraining, addQuestion, updateQuestion, deleteQuestion,
    addRoute, updateRoute, deleteRoute, isTrainingInstructor
} from '@/app/actions';

export default function EditTrainingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const trainingId = Number(id);

    const [training, setTraining] = useState<any>(null);
    const [canManage, setCanManage] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');

    const [qModalOpen, setQModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
    const [rModalOpen, setRModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<any | null>(null);
    const [error, setError] = useState('');

    const load = async () => {
        const [t, instructor] = await Promise.all([getTrainingForEdit(trainingId), isTrainingInstructor()]);
        setTraining(t);
        setCanManage(instructor);
    };

    useEffect(() => { load(); }, [trainingId]);

    if (canManage === false) {
        return (
            <div className="dashboard-content">
                <div className="card">
                    <div className="card-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '30px' }}>
                        <Lock size={16} /> Nur Ausbilder (Leitung/Admin) haben Zugriff auf die Ausbildungsverwaltung.
                    </div>
                </div>
            </div>
        );
    }

    if (!training) {
        return <div className="dashboard-content"><p style={{ color: 'var(--text-secondary)' }}>Lade Ausbildung...</p></div>;
    }

    const handleSave = async (formData: FormData) => {
        setSaving(true);
        setSavedMsg('');
        formData.set('id', String(trainingId));
        const res = await updateTraining(formData);
        setSaving(false);
        if (res?.error) { setSavedMsg(res.error); return; }
        setSavedMsg('Gespeichert.');
        load();
    };

    const openNewQuestion = () => { setEditingQuestion(null); setError(''); setQModalOpen(true); };
    const openEditQuestion = (q: any) => { setEditingQuestion(q); setError(''); setQModalOpen(true); };

    const handleSaveQuestion = async (formData: FormData) => {
        setError('');
        formData.set('training_id', String(trainingId));
        let res;
        if (editingQuestion) {
            formData.set('id', String(editingQuestion.id));
            res = await updateQuestion(formData);
        } else {
            res = await addQuestion(formData);
        }
        if (res?.error) { setError(res.error); return; }
        setQModalOpen(false);
        load();
    };

    const handleDeleteQuestion = async (qid: number) => {
        if (!confirm('Diese Frage wirklich löschen?')) return;
        await deleteQuestion(qid, trainingId);
        load();
    };

    const openNewRoute = () => { setEditingRoute(null); setError(''); setRModalOpen(true); };
    const openEditRoute = (r: any) => { setEditingRoute(r); setError(''); setRModalOpen(true); };

    const handleSaveRoute = async (formData: FormData) => {
        setError('');
        formData.set('training_id', String(trainingId));
        let res;
        if (editingRoute) {
            formData.set('id', String(editingRoute.id));
            res = await updateRoute(formData);
        } else {
            res = await addRoute(formData);
        }
        if (res?.error) { setError(res.error); return; }
        setRModalOpen(false);
        load();
    };

    const handleDeleteRoute = async (rid: number) => {
        if (!confirm('Diese Strecke wirklich löschen?')) return;
        await deleteRoute(rid, trainingId);
        load();
    };

    return (
        <div className="dashboard-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Link href="/ausbildungen/verwaltung" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ausbildungsverwaltung</Link>
                <ChevronRight size={12} />
                <span style={{ color: 'var(--text-secondary)' }}>{training.title}</span>
            </div>

            <div className="hero">
                <div>
                    <h1 className="page-title">{training.title}</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        Ausbildung bearbeiten
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><span>Grunddaten</span></div>
                <div className="card-content">
                    <form action={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flex: '1 1 240px', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Titel *</label>
                                <input required name="title" defaultValue={training.title} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flex: '1 1 200px', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kategorie</label>
                                <select name="category_id" defaultValue={training.category_id} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}>
                                    {training.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flex: '1 1 140px', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bestehensgrenze (%)</label>
                                <input name="bestehen_prozent" type="number" min={0} max={100} defaultValue={training.bestehen_prozent ?? 80} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Benötigte Mittel (mit Komma trennen)</label>
                            <input name="benoetigte_mittel" defaultValue={training.benoetigte_mittel} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flex: '1 1 240px', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Titel des Fragen/Aufgaben-Abschnitts</label>
                                <input name="aufgaben_titel" placeholder="Fragen / Aufgaben" defaultValue={training.aufgaben_titel} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flex: '1 1 240px', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Titel des Strecken-Abschnitts</label>
                                <input name="strecken_titel" placeholder="Strecken" defaultValue={training.strecken_titel} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Informationen für den Geprüften</label>
                            <textarea name="info_teilnehmer" defaultValue={training.info_teilnehmer} rows={6} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Informationen für den Prüfer</label>
                            <textarea name="info_pruefer" defaultValue={training.info_pruefer} rows={4} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button type="submit" disabled={saving} className="btn btn-primary"><Save size={14} /> {saving ? 'Speichern...' : 'Speichern'}</button>
                            {savedMsg && <span style={{ fontSize: '12px', color: savedMsg === 'Gespeichert.' ? 'var(--color-green)' : 'var(--color-red)' }}>{savedMsg}</span>}
                        </div>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span>{training.aufgaben_titel || 'Fragen / Aufgaben'}</span>
                    <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={openNewQuestion}>
                        <Plus size={13} /> Frage hinzufügen
                    </button>
                </div>
                <div style={{ overflow: 'auto' }}>
                    {training.questions.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Noch keine Fragen hinterlegt.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Kategorie</th>
                                    <th>Frage</th>
                                    <th>Antwort</th>
                                    <th className="text-center" style={{ width: '70px' }}>Punkte</th>
                                    <th className="text-center" style={{ width: '90px' }}>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {training.questions.map((q: any) => (
                                    <tr key={q.id}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{q.kategorie || '-'}</td>
                                        <td>{q.frage}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{q.antwort}</td>
                                        <td className="text-center">{q.punkte}</td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <button onClick={() => openEditQuestion(q)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '5px' }}><Pencil size={14} /></button>
                                                <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: '5px' }}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span>{training.strecken_titel || 'Strecken'}</span>
                    <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={openNewRoute}>
                        <Plus size={13} /> Strecke hinzufügen
                    </button>
                </div>
                <div style={{ overflow: 'auto' }}>
                    {training.routes.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Noch keine Strecken hinterlegt.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Strecke</th>
                                    <th>Halt 1</th>
                                    <th>Halt 2</th>
                                    <th>Halt 3</th>
                                    <th className="text-center" style={{ width: '90px' }}>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {training.routes.map((r: any) => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{r.strecke_nr}</td>
                                        <td>{r.halt1}</td>
                                        <td>{r.halt2}</td>
                                        <td>{r.halt3}</td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <button onClick={() => openEditRoute(r)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '5px' }}><Pencil size={14} /></button>
                                                <button onClick={() => handleDeleteRoute(r.id)} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: '5px' }}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal isOpen={qModalOpen} onClose={() => setQModalOpen(false)} title={editingQuestion ? 'Frage bearbeiten' : 'Frage hinzufügen'}>
                {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px', color: 'var(--color-red)', fontSize: '13px' }}>{error}</div>}
                <form action={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kategorie</label>
                            <input name="kategorie" defaultValue={editingQuestion?.kategorie || ''} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Punkte</label>
                            <input name="punkte" type="number" min={1} defaultValue={editingQuestion?.punkte || 1} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Frage / Kriterium *</label>
                        <textarea required name="frage" defaultValue={editingQuestion?.frage || ''} rows={2} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Antwort / Erwartung *</label>
                        <textarea required name="antwort" defaultValue={editingQuestion?.antwort || ''} rows={2} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setQModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Abbrechen</button>
                        <button type="submit" className="btn btn-primary">{editingQuestion ? 'Speichern' : 'Hinzufügen'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={rModalOpen} onClose={() => setRModalOpen(false)} title={editingRoute ? 'Strecke bearbeiten' : 'Strecke hinzufügen'} maxWidth="420px">
                {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px', color: 'var(--color-red)', fontSize: '13px' }}>{error}</div>}
                <form action={handleSaveRoute} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Streckennummer *</label>
                        <input required name="strecke_nr" type="number" min={1} defaultValue={editingRoute?.strecke_nr || ''} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Halt 1</label>
                        <input name="halt1" defaultValue={editingRoute?.halt1 || ''} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Halt 2</label>
                        <input name="halt2" defaultValue={editingRoute?.halt2 || ''} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Halt 3</label>
                        <input name="halt3" defaultValue={editingRoute?.halt3 || ''} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setRModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Abbrechen</button>
                        <button type="submit" className="btn btn-primary">{editingRoute ? 'Speichern' : 'Hinzufügen'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
