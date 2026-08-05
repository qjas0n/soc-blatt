"use client";

import React, { useState } from 'react';
import { Crosshair, Eye, EyeOff, LogIn, AlertCircle, Lock, User } from 'lucide-react';
import { loginUser } from '@/app/actions';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError('');
        const result = await loginUser(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '440px', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0.05) 100%)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(239,68,68,0.15), 0 0 120px rgba(239,68,68,0.05)',
                    position: 'relative'
                }}>
                    <Crosshair size={36} style={{ color: '#f87171' }} />
                    <div style={{
                        position: 'absolute', inset: '-1px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.4), transparent, rgba(234,179,8,0.15))',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude', WebkitMaskComposite: 'xor',
                        padding: '1px'
                    }} />
                </div>

                <h1 style={{
                    fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '6px',
                    letterSpacing: '-0.5px'
                }}>
                    LSPD
                </h1>
                <div style={{
                    fontSize: '12px', fontWeight: '600', color: '#f87171',
                    letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px'
                }}>
                    SPECIAL OPERATIONS COMMAND
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                    Melde dich an um auf das Dienstblatt zuzugreifen
                </p>
            </div>

            <div style={{
                background: 'linear-gradient(180deg, rgba(17,24,39,0.8) 0%, rgba(17,24,39,0.6) 100%)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '32px',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset'
            }}>
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05))',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
                        color: '#f87171', fontSize: '13px', fontWeight: '500'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                    </div>
                )}

                <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                            fontSize: '11px', color: '#9ca3af', fontWeight: '600',
                            textTransform: 'uppercase', letterSpacing: '1px'
                        }}>Benutzername</label>
                        <div style={{
                            position: 'relative', display: 'flex', alignItems: 'center',
                            borderRadius: '10px', overflow: 'hidden',
                            background: focused === 'user' ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${focused === 'user' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.2s ease',
                            boxShadow: focused === 'user' ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
                        }}>
                            <div style={{
                                padding: '0 14px', display: 'flex', alignItems: 'center',
                                color: focused === 'user' ? '#f87171' : '#4b5563'
                            }}>
                                <User size={16} />
                            </div>
                            <input
                                required name="username" type="text" autoComplete="username" autoFocus
                                placeholder="Benutzername eingeben..."
                                onFocus={() => setFocused('user')} onBlur={() => setFocused(null)}
                                style={{
                                    flex: 1, padding: '14px 14px 14px 0', background: 'transparent',
                                    border: 'none', color: 'white', fontSize: '14px', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{
                            fontSize: '11px', color: '#9ca3af', fontWeight: '600',
                            textTransform: 'uppercase', letterSpacing: '1px'
                        }}>Passwort</label>
                        <div style={{
                            position: 'relative', display: 'flex', alignItems: 'center',
                            borderRadius: '10px', overflow: 'hidden',
                            background: focused === 'pass' ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${focused === 'pass' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.2s ease',
                            boxShadow: focused === 'pass' ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
                        }}>
                            <div style={{
                                padding: '0 14px', display: 'flex', alignItems: 'center',
                                color: focused === 'pass' ? '#f87171' : '#4b5563'
                            }}>
                                <Lock size={16} />
                            </div>
                            <input
                                required name="password" type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password" placeholder="Passwort eingeben..."
                                onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                                style={{
                                    flex: 1, padding: '14px 0', background: 'transparent',
                                    border: 'none', color: 'white', fontSize: '14px', outline: 'none'
                                }}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                padding: '0 14px', background: 'none', border: 'none',
                                color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                transition: 'color 0.2s'
                            }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        padding: '14px', fontSize: '14px', fontWeight: '600', marginTop: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        width: '100%', borderRadius: '10px', border: 'none', cursor: loading ? 'wait' : 'pointer',
                        background: loading
                            ? 'rgba(239,68,68,0.4)'
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white', transition: 'all 0.2s ease', letterSpacing: '0.3px',
                        boxShadow: loading ? 'none' : '0 4px 20px rgba(239,68,68,0.3), 0 0 0 1px rgba(239,68,68,0.1) inset'
                    }}>
                        <LogIn size={18} />
                        {loading ? 'Wird angemeldet...' : 'Anmelden'}
                    </button>
                </form>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    fontSize: '11px', color: '#374151'
                }}>
                    <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.06)' }} />
                    Los Santos Police Department
                    <div style={{ height: '1px', width: '40px', background: 'rgba(255,255,255,0.06)' }} />
                </div>
            </div>
        </div>
    );
}
