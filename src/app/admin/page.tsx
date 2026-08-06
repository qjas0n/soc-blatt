"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserCog, Pencil, KeyRound } from 'lucide-react';
import Modal from '@/components/Modal';
import { getUsers, createUser, deleteUser, updateUserRole, updateUserProfile, getDefaultPasswordUserIds } from '@/app/actions';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [defaultPwdIds, setDefaultPwdIds] = useState<Set<number>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [editUser, setEditUser] = useState<any | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editRang, setEditRang] = useState('');
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    const loadUsers = async () => {
        const [res, ids] = await Promise.all([getUsers(), getDefaultPasswordUserIds()]);
        setUsers(res);
        setDefaultPwdIds(new Set(ids));
    };

    useEffect(() => { loadUsers(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Benutzer wirklich löschen?')) return;
        await deleteUser(id);
        loadUsers();
    };

    const handleRoleChange = async (id: number, newRole: string) => {
        await updateUserRole(id, newRole);
        loadUsers();
    };

    const openEditModal = (user: any) => {
        setEditUser(user);
        setEditUsername(user.username);
        setEditDisplayName(user.display_name);
        setEditRang(user.rang || 'SOC-Mitglied');
        setEditError('');
    };

    const handleSaveProfile = async () => {
        if (!editUser || editSaving) return;
        setEditSaving(true);
        const result = await updateUserProfile(editUser.id, editUsername, editDisplayName, editRang);
        setEditSaving(false);
        if (result && 'error' in result) { setEditError(result.error as string); return; }
        setEditUser(null);
        loadUsers();
    };

    return (
        <div className="dashboard-content" style={{ height: '100vh', overflow: 'hidden', paddingBottom: '0' }}>
            <div className="top-header" style={{ border: 'none', padding: '0 0 20px 0', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Benutzerverwaltung</h1>
                        <div className="page-subtitle">ADMIN • ACCOUNTS & ROLLEN</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setError(''); setIsModalOpen(true); }}>
                        <Plus size={14} /> Neuer Benutzer
                    </button>
                </div>
            </div>

            <div className="card" style={{ flexGrow: 1, overflow: 'auto', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                <table className="data-table">
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 1, boxShadow: '0 1px 0 var(--border-color)' }}>
                        <tr>
                            <th style={{ width: '22%' }}>Benutzername</th>
                            <th style={{ width: '20%' }}>Anzeigename</th>
                            <th style={{ width: '15%' }}>Rang</th>
                            <th className="text-center" style={{ width: '16%' }}>Rolle</th>
                            <th className="text-center" style={{ width: '13%' }}>Erstellt</th>
                            <th className="text-center" style={{ width: '14%' }}>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td style={{ fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <UserCog size={16} style={{ color: user.role === 'admin' ? 'var(--color-accent)' : 'var(--text-secondary)' }} />
                                        {user.username}
                                        {defaultPwdIds.has(user.id) && (
                                            <span title="Benutzer hat noch das Standard-Passwort 12345" style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                padding: '2px 7px', borderRadius: '8px', fontSize: '10px', fontWeight: '700',
                                                backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171',
                                                border: '1px solid rgba(239,68,68,0.3)',
                                            }}>
                                                <KeyRound size={9} /> Standard-PW
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{user.display_name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{user.rang || 'SOC-Mitglied'}</td>
                                <td className="text-center">
                                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} style={{
                                        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                                        color: user.role === 'admin' ? 'var(--color-accent)' : 'var(--text-primary)',
                                        fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                    }}>
                                        <option value="admin">Admin</option>
                                        <option value="leitung">Leitung</option>
                                        <option value="member">Member</option>
                                        <option value="anwaerter">Anwärter</option>
                                    </select>
                                </td>
                                <td className="text-center" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                    {new Date(user.created_at).toLocaleDateString('de-DE')}
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <button onClick={() => openEditModal(user)} style={{
                                            background: 'none', border: 'none', color: '#60a5fa',
                                            cursor: 'pointer', padding: '6px', borderRadius: 'var(--radius-sm)',
                                            transition: 'background 0.2s'
                                        }} title="Namen bearbeiten">
                                            <Pencil size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} style={{
                                            background: 'none', border: 'none', color: 'var(--color-red)',
                                            cursor: 'pointer', padding: '6px', borderRadius: 'var(--radius-sm)',
                                            transition: 'background 0.2s'
                                        }} title="Löschen">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Neuen Benutzer Erstellen">
                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px',
                        color: 'var(--color-red)', fontSize: '13px'
                    }}>{error}</div>
                )}
                <form action={async (formData) => {
                    const result = await createUser(formData);
                    if (result?.error) { setError(result.error); return; }
                    setIsModalOpen(false);
                    loadUsers();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Benutzername *</label>
                        <input required name="username" type="text" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
                        color: 'var(--color-yellow)', fontSize: '12px'
                    }}>
                        <KeyRound size={13} /> Passwort wird fest auf <strong>12345</strong> gesetzt — Änderung ist beim ersten Login Pflicht.
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Anzeigename *</label>
                            <input required name="display_name" type="text" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rolle *</label>
                            <select required name="role" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}>
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                                <option value="leitung">Leitung</option>
                                <option value="anwaerter">Anwärter</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rang</label>
                        <input name="rang" type="text" placeholder="Standard: SOC-Mitglied" style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Abbrechen</button>
                        <button type="submit" className="btn btn-primary">Erstellen</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Benutzer bearbeiten" maxWidth="420px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {editError && (
                        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--color-red)', fontSize: '13px' }}>
                            {editError}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Anmeldename (Login)</label>
                        <input
                            value={editUsername}
                            onChange={e => setEditUsername(e.target.value)}
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Anzeigename</label>
                        <input
                            value={editDisplayName}
                            onChange={e => setEditDisplayName(e.target.value)}
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rang</label>
                        <input
                            value={editRang}
                            onChange={e => setEditRang(e.target.value)}
                            style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                        <button onClick={() => setEditUser(null)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSaveProfile}
                            disabled={editSaving}
                            className="btn btn-primary"
                        >
                            {editSaving ? 'Speichern…' : 'Speichern'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
