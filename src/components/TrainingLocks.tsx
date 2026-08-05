"use client";

import React, { useState } from 'react';
import { ShieldOff, Plus, Trash2, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import { addTrainingLock, deleteTrainingLock } from '@/app/actions';

interface Lock {
    id: number;
    candidate_name: string;
    ausbilder: string;
    bis_datum: string;
    bis_uhrzeit: string;
    aussteller: string;
    grund: string;
    active: boolean;
}

export default function TrainingLocks({ initial, canManage, currentUserName, memberNames }: {
    initial: Lock[]; canManage: boolean; currentUserName: string; memberNames: string[];
}) {
    const [locks, setLocks] = useState<Lock[]>(initial);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setSaving(true);
        setError('');
        const result = await addTrainingLock(formData);
        setSaving(false);
        if (result?.error) { setError(result.error); return; }
        setIsModalOpen(false);
        window.location.reload();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Diese Ausbildungssperre wirklich aufheben?')) return;
        setLocks(prev => prev.filter(l => l.id !== id));
        await deleteTrainingLock(id);
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE');
    const formatTime = (t: string) => String(t).slice(0, 5);

    return (
        <div className="card">
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ShieldOff size={14} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <span style={{ fontSize: '15px' }}>Ausbildungssperren</span>
                    {locks.some(l => l.active) && (
                        <span style={{
                            backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--color-red)',
                            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600'
                        }}>{locks.filter(l => l.active).length} aktiv</span>
                    )}
                </div>
                {canManage && (
                    <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => { setError(''); setIsModalOpen(true); }}>
                        <Plus size={13} /> Sperre vergeben
                    </button>
                )}
            </div>

            <div style={{ overflow: 'auto' }}>
                {locks.length === 0 ? (
                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        Keine Ausbildungssperren vorhanden.
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Bis</th>
                                <th>Ausbilder</th>
                                <th>Aussteller</th>
                                <th>Grund</th>
                                <th className="text-center" style={{ width: '90px' }}>Status</th>
                                {canManage && <th className="text-center" style={{ width: '50px' }} />}
                            </tr>
                        </thead>
                        <tbody>
                            {locks.map(l => (
                                <tr key={l.id} style={{ opacity: l.active ? 1 : 0.5 }}>
                                    <td style={{ fontWeight: '600' }}>{l.candidate_name}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{formatDate(l.bis_datum)} · {formatTime(l.bis_uhrzeit)} Uhr</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{l.ausbilder || '-'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{l.aussteller}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{l.grund || '-'}</td>
                                    <td className="text-center">
                                        <span className={`badge ${l.active ? 'badge-red' : 'badge-blue'}`}>{l.active ? 'Aktiv' : 'Abgelaufen'}</span>
                                    </td>
                                    {canManage && (
                                        <td className="text-center">
                                            <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: '5px' }} title="Aufheben">
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ausbildungssperre vergeben" maxWidth="480px">
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px',
                        color: 'var(--color-red)', fontSize: '13px'
                    }}><AlertCircle size={14} /> {error}</div>
                )}
                <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Name *</label>
                        <input required name="candidate_name" list="lock-member-names" placeholder="Vor- und Nachname" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <datalist id="lock-member-names">
                            {memberNames.map(n => <option key={n} value={n} />)}
                        </datalist>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bis Datum *</label>
                            <input required type="date" name="bis_datum" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bis Uhrzeit *</label>
                            <input required type="time" name="bis_uhrzeit" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ausbilder</label>
                            <input name="ausbilder" placeholder="Zuständiger Ausbilder" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aussteller</label>
                            <input name="aussteller" defaultValue={currentUserName} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Grund</label>
                        <textarea name="grund" rows={2} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Abbrechen</button>
                        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Speichern…' : 'Sperre vergeben'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
