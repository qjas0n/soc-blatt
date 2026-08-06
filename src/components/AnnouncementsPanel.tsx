"use client";

import React, { useState, useRef } from 'react';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { addAnnouncement, deleteAnnouncement, getAnnouncements } from '@/app/actions';
import { useLivePolling } from '@/lib/useLivePolling';

const POLL_INTERVAL_MS = 4000;

interface Announcement {
    id: number;
    text: string;
    author: string;
    date_str: string;
    type: string;
    badge_class: string;
}

export default function AnnouncementsPanel({ initial }: { initial: Announcement[] }) {
    const [announcements, setAnnouncements] = useState<Announcement[]>(initial);
    const [showForm, setShowForm] = useState(false);
    const [text, setText] = useState('');
    const [type, setType] = useState('Info');
    const [saving, setSaving] = useState(false);
    const deletedIdsRef = useRef<Set<number>>(new Set());

    useLivePolling(async () => {
        const fresh = await getAnnouncements();
        if (!fresh) return;
        setAnnouncements(fresh.filter((a: Announcement) => !deletedIdsRef.current.has(a.id)));
    }, POLL_INTERVAL_MS);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || saving) return;
        setSaving(true);
        const formData = new FormData();
        formData.set('text', text.trim());
        formData.set('type', type);
        await addAnnouncement(formData);
        const fresh = await getAnnouncements();
        setAnnouncements(fresh || []);
        setText('');
        setType('Info');
        setShowForm(false);
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Ankündigung wirklich löschen?')) return;
        deletedIdsRef.current.add(id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        await deleteAnnouncement(id);
    };

    return (
        <div className="card">
            <div className="card-header">
                <span>Ankündigungen</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setShowForm(s => !s)}>
                        <Plus size={12} /> Neu
                    </button>
                    <Megaphone size={16} className="icon" />
                </div>
            </div>

            {showForm && (
                <div className="card-content" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                            required
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Ankündigungstext..."
                            rows={3}
                            style={{
                                padding: '10px', borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                                color: 'white', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select value={type} onChange={e => setType(e.target.value)} style={{
                                padding: '8px', borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                                color: 'white', fontSize: '12px'
                            }}>
                                <option value="Info">Info</option>
                                <option value="Dringend">Dringend</option>
                            </select>
                            <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                                {saving ? 'Speichern...' : 'Veröffentlichen'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {announcements.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                        Noch keine Ankündigungen vorhanden.
                    </div>
                )}
                {announcements.map(a => (
                    <div key={a.id} style={{
                        padding: '12px', borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <span className={`badge ${a.badge_class}`}>{a.type}</span>
                            <button onClick={() => handleDelete(a.id)} style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                                padding: '2px'
                            }} title="Löschen">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.text}</p>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.author} • {a.date_str}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
