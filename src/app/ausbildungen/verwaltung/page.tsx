"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Plus, Trash2, Pencil, FolderPlus, GraduationCap, Lock } from 'lucide-react';
import Modal from '@/components/Modal';
import {
    getTrainingCategories, isTrainingInstructor, addTrainingCategory, deleteTrainingCategory,
    createTraining, deleteTraining
} from '@/app/actions';

export default function TrainingAdminPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [canManage, setCanManage] = useState<boolean | null>(null);
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [trainingModalOpen, setTrainingModalOpen] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        const [cats, instructor] = await Promise.all([getTrainingCategories(), isTrainingInstructor()]);
        setCategories(cats);
        setCanManage(instructor);
    };

    useEffect(() => { load(); }, []);

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

    const handleAddCategory = async (formData: FormData) => {
        setError('');
        const res = await addTrainingCategory(formData);
        if (res?.error) { setError(res.error); return; }
        setCatModalOpen(false);
        load();
    };

    const handleAddTraining = async (formData: FormData) => {
        setError('');
        const res = await createTraining(formData);
        if (res?.error) { setError(res.error); return; }
        setTrainingModalOpen(false);
        load();
    };

    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Kategorie "${name}" wirklich löschen? Alle zugehörigen Ausbildungen, Fragen und Strecken werden ebenfalls gelöscht.`)) return;
        await deleteTrainingCategory(id);
        load();
    };

    const handleDeleteTraining = async (id: number, title: string) => {
        if (!confirm(`Ausbildung "${title}" wirklich löschen? Zugehörige Fragen, Strecken und Prüfungen werden ebenfalls gelöscht.`)) return;
        await deleteTraining(id);
        load();
    };

    return (
        <div className="dashboard-content">
            <div className="hero">
                <div className="hero-icon">
                    <Settings size={26} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 className="page-title">Ausbildungsverwaltung</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        Kategorien, Ausbildungen, Bestehensgrenzen
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => { setError(''); setCatModalOpen(true); }}>
                        <FolderPlus size={14} /> Neue Kategorie
                    </button>
                    <button className="btn btn-primary" onClick={() => { setError(''); setTrainingModalOpen(true); }}>
                        <Plus size={14} /> Neue Ausbildung
                    </button>
                </div>
            </div>

            {categories.map((cat: any) => (
                <div className="card" key={cat.id}>
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GraduationCap size={16} className="icon" />
                            <span>{cat.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: '4px' }} title="Kategorie löschen">
                            <Trash2 size={15} />
                        </button>
                    </div>
                    <div style={{ overflow: 'auto' }}>
                        {cat.trainings.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Noch keine Ausbildungen in dieser Kategorie.</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Titel</th>
                                        <th>Slug</th>
                                        <th className="text-center" style={{ width: '110px' }}>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cat.trainings.map((t: any) => (
                                        <tr key={t.id}>
                                            <td style={{ fontWeight: '600' }}>{t.title}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t.slug}</td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    <Link href={`/ausbildungen/verwaltung/${t.id}`}>
                                                        <button style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '5px' }} title="Bearbeiten">
                                                            <Pencil size={15} />
                                                        </button>
                                                    </Link>
                                                    <button onClick={() => handleDeleteTraining(t.id, t.title)} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: '5px' }} title="Löschen">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ))}

            <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title="Neue Kategorie">
                {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px', color: 'var(--color-red)', fontSize: '13px' }}>{error}</div>}
                <form action={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Name *</label>
                        <input required name="name" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Beschreibung</label>
                        <textarea name="description" rows={3} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setCatModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Abbrechen</button>
                        <button type="submit" className="btn btn-primary">Erstellen</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={trainingModalOpen} onClose={() => setTrainingModalOpen(false)} title="Neue Ausbildung">
                {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px', color: 'var(--color-red)', fontSize: '13px' }}>{error}</div>}
                <form action={handleAddTraining} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kategorie *</label>
                        <select required name="category_id" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Titel *</label>
                        <input required name="title" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Benötigte Mittel</label>
                        <input name="benoetigte_mittel" placeholder="z. B. Buffalo S LSPD" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bestehensgrenze (%)</label>
                        <input name="bestehen_prozent" type="number" min={0} max={100} defaultValue={80} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setTrainingModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Abbrechen</button>
                        <button type="submit" className="btn btn-primary">Erstellen</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
