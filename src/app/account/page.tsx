"use client";

import React, { useState, useEffect } from 'react';
import { User, KeyRound, Image as ImageIcon, Check } from 'lucide-react';
import { getCurrentUser, updateDisplayName, updateAvatar, changePassword } from '@/app/actions';

export default function AccountPage() {
    const [user, setUser] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [savedMsg, setSavedMsg] = useState('');
    const [pwError, setPwError] = useState('');
    const [pwSaving, setPwSaving] = useState(false);

    useEffect(() => {
        getCurrentUser().then(u => {
            setUser(u);
            setDisplayName(u?.displayName || '');
            setAvatarUrl(u?.avatarUrl || '');
        });
    }, []);

    const handleSaveProfile = async () => {
        setSavedMsg('');
        const res1 = await updateDisplayName(displayName);
        const res2 = await updateAvatar(avatarUrl);
        if (res1?.error) { setSavedMsg(res1.error); return; }
        if (res2?.error) { setSavedMsg(res2.error); return; }
        setSavedMsg('Gespeichert.');
        try { sessionStorage.removeItem('soc_user'); } catch {}
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPwSaving(true);
        setPwError('');
        const formData = new FormData(e.currentTarget);
        const p1 = formData.get('new_password') as string;
        const p2 = formData.get('confirm_password') as string;
        if (p1 !== p2) {
            setPwError('Die Passwörter stimmen nicht überein.');
            setPwSaving(false);
            return;
        }
        const res = await changePassword(formData);
        setPwSaving(false);
        if (res?.error) { setPwError(res.error); return; }
        (e.target as HTMLFormElement).reset();
        setPwError('Passwort erfolgreich geändert.');
    };

    if (!user) {
        return <div className="dashboard-content"><p style={{ color: 'var(--text-secondary)' }}>Lade Profil...</p></div>;
    }

    return (
        <div className="dashboard-content">
            <div className="top-header" style={{ border: 'none', padding: '0', backgroundColor: 'transparent' }}>
                <h1 className="page-title">Mein Account</h1>
                <div className="page-subtitle">PROFIL & SICHERHEIT</div>
            </div>

            <div className="grid-container">
                <div className="card">
                    <div className="card-header">
                        <span>Profil</span>
                        <User size={16} className="icon" />
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Anzeigename</label>
                            <input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ImageIcon size={12} /> Avatar-URL
                            </label>
                            <input
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                                placeholder="https://..."
                                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button className="btn btn-primary" onClick={handleSaveProfile}>
                                <Check size={14} /> Speichern
                            </button>
                            {savedMsg && <span style={{ fontSize: '12px', color: 'var(--color-green)' }}>{savedMsg}</span>}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span>Passwort ändern</span>
                        <KeyRound size={16} className="icon" />
                    </div>
                    <div className="card-content">
                        {pwError && (
                            <div style={{
                                padding: '10px', borderRadius: 'var(--radius-sm)',
                                background: pwError.includes('erfolgreich') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                border: `1px solid ${pwError.includes('erfolgreich') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                color: pwError.includes('erfolgreich') ? 'var(--color-green)' : 'var(--color-red)',
                                fontSize: '13px', marginBottom: '14px'
                            }}>{pwError}</div>
                        )}
                        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Neues Passwort</label>
                                <input required type="password" name="new_password" minLength={5} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Passwort bestätigen</label>
                                <input required type="password" name="confirm_password" minLength={5} style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white' }} />
                            </div>
                            <button type="submit" disabled={pwSaving} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                                {pwSaving ? 'Wird gespeichert...' : 'Passwort ändern'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
