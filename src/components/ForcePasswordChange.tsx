"use client";

import React, { useState } from 'react';
import { Lock, AlertTriangle, KeyRound } from 'lucide-react';
import { changePassword } from '@/app/actions';

export default function ForcePasswordChange() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const p1 = formData.get('new_password') as string;
        const p2 = formData.get('confirm_password') as string;

        if (p1 !== p2) {
            setError('Die Passwörter stimmen nicht überein.');
            setLoading(false);
            return;
        }

        const res = await changePassword(formData);
        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            window.location.reload();
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '400px',
                background: 'linear-gradient(180deg, #161925 0%, #0d1117 100%)',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>Sicherheitswarnung</h2>
                            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Standard-Passwort erkannt</p>
                        </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5', marginTop: '16px', marginBottom: 0 }}>
                        Dein Account nutzt aktuell noch das Standard-Passwort (12345). Aus Sicherheitsgründen musst du ein neues, sicheres Passwort festlegen, bevor du das Dashboard betreten kannst.
                    </p>
                </div>

                <div style={{ padding: '24px' }}>
                    {error && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px', marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Neues Passwort</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Lock size={14} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                                <input required type="password" name="new_password" minLength={5} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '14px', outline: 'none' }} placeholder="Mindestens 5 Zeichen" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passwort bestätigen</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <KeyRound size={14} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
                                <input required type="password" name="confirm_password" minLength={5} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '14px', outline: 'none' }} placeholder="Passwort wiederholen" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{
                            marginTop: '8px', padding: '12px', borderRadius: '8px', border: 'none',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white', fontSize: '14px', fontWeight: '600', cursor: loading ? 'wait' : 'pointer',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 15px rgba(239,68,68,0.2)'
                        }}>
                            {loading ? 'Wird gespeichert...' : 'Passwort ändern & Weiter'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
