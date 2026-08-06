"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, LogOut, Settings, ChevronRight, Crosshair,
    Menu, X, GraduationCap, BookOpen, Terminal
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '@/app/actions';

export default function Sidebar() {
    const pathname = usePathname();
    // Start at null on both server and client so the first client render matches the SSR
    // output; sessionStorage is only readable client-side, so seeding state from it here
    // would cause a hydration mismatch whenever a stale cached user differs from `null`.
    const [user, setUser] = useState<any>(null);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        try {
            const cached = sessionStorage.getItem('soc_user');
            if (cached) setUser(JSON.parse(cached));
        } catch { /* ignore */ }

        getCurrentUser().then(u => {
            setUser(u);
            try { sessionStorage.setItem('soc_user', JSON.stringify(u)); } catch {}
        });
    }, []);

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setMobileOpen(false);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const topItems = [
        { name: 'Startseite', path: '/', icon: Home },
    ];
    const menuItems = [
        { name: 'Ausbildungen', path: '/ausbildungen', icon: GraduationCap },
        { name: 'Dienstvorschriften', path: '/dienstvorschriften', icon: BookOpen },
    ];

    const displayName = user?.displayName || 'Laden...';
    const role = user?.role || '';
    const isAdmin = role === 'admin';
    const canManageAdmin = role === 'admin' || role === 'leitung';
    const roleLabel = role === 'admin' ? 'Administrator' : role === 'leitung' ? 'Leitung' : role === 'anwaerter' ? 'Anwärter' : 'Member';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarUrl = user?.avatarUrl || null;

    return (
        <>
        {isMobile && (
            <button
                onClick={() => setMobileOpen(o => !o)}
                style={{
                    position: 'fixed', top: '12px', left: '12px', zIndex: 1001,
                    width: '40px', height: '40px',
                    background: 'linear-gradient(135deg, #0d1017 0%, #111827 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#94a3b8',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
            >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
        )}

        {isMobile && mobileOpen && (
            <div
                onClick={() => setMobileOpen(false)}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    zIndex: 999,
                    backdropFilter: 'blur(2px)',
                }}
            />
        )}

        <div style={{
            width: '260px', display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(180deg, #0d1017 0%, #111827 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0, height: '100vh', overflow: 'hidden',
            ...(isMobile ? {
                position: 'fixed', top: 0,
                left: mobileOpen ? '0' : '-280px',
                zIndex: 1000,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.6)' : 'none',
            } : { position: 'relative' })
        }}>
            <div style={{
                position: 'absolute', top: '-60px', left: '-60px',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div style={{
                padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'relative'
            }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))',
                    border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(239,68,68,0.15)'
                }}>
                    <Crosshair size={18} style={{ color: '#f87171' }} />
                </div>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', letterSpacing: '0.5px' }}>
                        LSPD
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#f87171', letterSpacing: '1.5px' }}>
                        SPECIAL OPS
                    </div>
                </div>
            </div>

            <div style={{
                padding: '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <Link href="/account" style={{ textDecoration: 'none' }}>
                <div style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    padding: '12px', borderRadius: '10px',
                    background: pathname === '/account' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${pathname === '/account' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer', transition: 'all 0.15s'
                }}>
                    <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: `linear-gradient(135deg, ${isAdmin ? 'rgba(239,68,68,0.3), rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.3), rgba(148,163,184,0.1)'})`,
                            border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '700', color: 'white',
                            letterSpacing: '0.5px', overflow: 'hidden'
                        }}>
                            {avatarUrl
                                ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : initials}
                        </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                boxShadow: '0 0 6px #22c55e'
                            }} />
                            <span style={{
                                fontSize: '11px', fontWeight: '500',
                                color: isAdmin ? '#f87171' : '#94a3b8'
                            }}>
                                {roleLabel}
                            </span>
                        </div>
                    </div>
                </div>
                </Link>
            </div>

            <div style={{
                flexGrow: 1, overflowY: 'auto', padding: '8px 12px',
                display: 'flex', flexDirection: 'column', gap: '2px'
            }}>
                {topItems.map((item) => {
                    const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
                    const isHovered = hoveredItem === item.path;
                    return (
                        <Link href={item.path} key={item.path} style={{ textDecoration: 'none' }}>
                            <div
                                onMouseEnter={() => setHoveredItem(item.path)}
                                onMouseLeave={() => setHoveredItem(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px',
                                    borderRadius: '8px', cursor: 'pointer',
                                    color: isActive ? 'white' : isHovered ? '#e2e8f0' : '#94a3b8',
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))'
                                        : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    border: isActive ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                                    transition: 'all 0.15s ease',
                                    position: 'relative'
                                }}
                            >
                                {isActive && (
                                    <div style={{
                                        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)',
                                        width: '3px', height: '18px', borderRadius: '0 3px 3px 0',
                                        background: '#ef4444',
                                        boxShadow: '0 0 8px rgba(239,68,68,0.5)'
                                    }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <item.icon size={16} style={{
                                        color: isActive ? '#f87171' : 'inherit', transition: 'color 0.15s'
                                    }} />
                                    <span style={{ fontSize: '13px', fontWeight: isActive ? '600' : '400' }}>
                                        {item.name}
                                    </span>
                                </div>
                                {isActive && <ChevronRight size={14} style={{ color: '#f87171', opacity: 0.7 }} />}
                            </div>
                        </Link>
                    );
                })}

                <div style={{
                    fontSize: '10px', fontWeight: '600', color: '#4b5563',
                    letterSpacing: '1.5px', padding: '14px 12px 6px',
                    textTransform: 'uppercase'
                }}>
                    ALLGEMEIN
                </div>

                {menuItems.map((item) => {
                    const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
                    const isHovered = hoveredItem === item.path;
                    return (
                        <Link href={item.path} key={item.path} style={{ textDecoration: 'none' }}>
                            <div
                                onMouseEnter={() => setHoveredItem(item.path)}
                                onMouseLeave={() => setHoveredItem(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px',
                                    borderRadius: '8px', cursor: 'pointer',
                                    color: isActive ? 'white' : isHovered ? '#e2e8f0' : '#94a3b8',
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))'
                                        : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    border: isActive ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                                    transition: 'all 0.15s ease',
                                    position: 'relative'
                                }}
                            >
                                {isActive && (
                                    <div style={{
                                        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)',
                                        width: '3px', height: '18px', borderRadius: '0 3px 3px 0',
                                        background: '#ef4444',
                                        boxShadow: '0 0 8px rgba(239,68,68,0.5)'
                                    }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <item.icon size={16} style={{
                                        color: isActive ? '#f87171' : 'inherit', transition: 'color 0.15s'
                                    }} />
                                    <span style={{ fontSize: '13px', fontWeight: isActive ? '600' : '400' }}>
                                        {item.name}
                                    </span>
                                </div>
                                {isActive && <ChevronRight size={14} style={{ color: '#f87171', opacity: 0.7 }} />}
                            </div>
                        </Link>
                    );
                })}

                {canManageAdmin && (
                    <>
                        <div style={{
                            fontSize: '10px', fontWeight: '600', color: '#4b5563',
                            letterSpacing: '1.5px', padding: '14px 12px 6px',
                            textTransform: 'uppercase'
                        }}>
                            SYSTEM
                        </div>

                        <Link href="/admin" style={{ textDecoration: 'none' }}>
                            <div
                                onMouseEnter={() => setHoveredItem('/admin')}
                                onMouseLeave={() => setHoveredItem(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                                    color: pathname === '/admin' ? 'white' : hoveredItem === '/admin' ? '#e2e8f0' : '#94a3b8',
                                    background: pathname === '/admin'
                                        ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))'
                                        : hoveredItem === '/admin' ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    border: pathname === '/admin' ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                                    transition: 'all 0.15s ease', position: 'relative'
                                }}
                            >
                                {pathname === '/admin' && (
                                    <div style={{
                                        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)',
                                        width: '3px', height: '18px', borderRadius: '0 3px 3px 0',
                                        background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)'
                                    }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Settings size={16} style={{ color: pathname === '/admin' ? '#f87171' : 'inherit' }} />
                                    <span style={{ fontSize: '13px', fontWeight: pathname === '/admin' ? '600' : '400' }}>Admin Panel</span>
                                </div>
                                {pathname === '/admin' && <ChevronRight size={14} style={{ color: '#f87171', opacity: 0.7 }} />}
                            </div>
                        </Link>

                        <Link href="/admin/logs" style={{ textDecoration: 'none' }}>
                            <div
                                onMouseEnter={() => setHoveredItem('/admin/logs')}
                                onMouseLeave={() => setHoveredItem(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                                    color: pathname === '/admin/logs' ? 'white' : hoveredItem === '/admin/logs' ? '#e2e8f0' : '#94a3b8',
                                    background: pathname === '/admin/logs'
                                        ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))'
                                        : hoveredItem === '/admin/logs' ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    border: pathname === '/admin/logs' ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                                    transition: 'all 0.15s ease', position: 'relative'
                                }}
                            >
                                {pathname === '/admin/logs' && (
                                    <div style={{
                                        position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)',
                                        width: '3px', height: '18px', borderRadius: '0 3px 3px 0',
                                        background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)'
                                    }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Terminal size={16} style={{ color: pathname === '/admin/logs' ? '#f87171' : 'inherit' }} />
                                    <span style={{ fontSize: '13px', fontWeight: pathname === '/admin/logs' ? '600' : '400' }}>Systemprotokoll</span>
                                </div>
                                {pathname === '/admin/logs' && <ChevronRight size={14} style={{ color: '#f87171', opacity: 0.7 }} />}
                            </div>
                        </Link>
                    </>
                )}
            </div>

            <div style={{
                padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <form action={logoutUser}>
                    <button type="submit"
                        onMouseEnter={() => setHoveredItem('logout')}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '10px', borderRadius: '8px', cursor: 'pointer', width: '100%',
                            color: hoveredItem === 'logout' ? '#f87171' : '#6b7280',
                            background: hoveredItem === 'logout' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                            border: hoveredItem === 'logout' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
                            fontSize: '12px', fontWeight: '500', transition: 'all 0.2s ease'
                        }}
                    >
                        <LogOut size={14} />
                        Abmelden
                    </button>
                </form>
            </div>
        </div>
        </>
    );
}
