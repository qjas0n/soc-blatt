"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Search, AlertCircle } from 'lucide-react';
import { getLogs, getCurrentUser } from '@/app/actions';

export default function LoggingPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedUser, setSelectedUser] = useState('');

    useEffect(() => {
        getCurrentUser().then(user => {
            setCurrentUser(user);
            if (user && user.role === 'admin') {
                getLogs().then(res => setLogs(res || []));
            }
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="dashboard-content"><p style={{ color: 'var(--text-secondary)' }}>Lade Systemprotokoll...</p></div>;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                <AlertCircle size={40} style={{ color: 'var(--color-red)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Zugriff verweigert</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Du hast keine Berechtigung, das Systemprotokoll einzusehen.</p>
            </div>
        );
    }

    const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort() as string[];
    const uniqueUsers = Array.from(new Set(logs.map(l => l.user_name))).sort() as string[];

    const filtered = logs.filter(l => {
        const matchesSearch = !searchQuery ||
            l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesAction = !selectedAction || l.action === selectedAction;
        const matchesUser = !selectedUser || l.user_name === selectedUser;
        return matchesSearch && matchesAction && matchesUser;
    });

    return (
        <div className="dashboard-content" style={{ height: '100vh', overflow: 'hidden', paddingBottom: '0' }}>
            <div className="top-header" style={{ border: 'none', padding: '0 0 20px 0', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div className="hero-icon" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
                            <Terminal size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h1 className="page-title" style={{ fontSize: '22px' }}>Systemprotokoll</h1>
                                <span className="badge badge-red">{logs.length}</span>
                            </div>
                            <div className="page-subtitle" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '11px' }}>Globales Audit-Log</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={selectedUser}
                            onChange={e => setSelectedUser(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px' }}
                        >
                            <option value="">Alle Benutzer</option>
                            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>

                        <select
                            value={selectedAction}
                            onChange={e => setSelectedAction(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '13px' }}
                        >
                            <option value="">Alle Aktionen</option>
                            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>

                        <div style={{
                            display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '0 10px', width: '200px'
                        }}>
                            <Search size={14} style={{ color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Durchsuchen..." onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', padding: '9px', outline: 'none', fontSize: '13px', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ flexGrow: 1, overflow: 'auto', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                <table className="data-table">
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 1, boxShadow: '0 1px 0 var(--border-color)' }}>
                        <tr>
                            <th style={{ width: '18%' }}>Zeitstempel</th>
                            <th className="text-center" style={{ width: '20%' }}>Akteur</th>
                            <th className="text-center" style={{ width: '20%' }}>Aktion</th>
                            <th style={{ width: '42%' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((log) => {
                            const date = new Date(log.created_at);
                            return (
                                <tr key={log.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                        {date.toLocaleDateString('de-DE')} {date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="text-center" style={{ fontWeight: '500', color: 'white' }}>{log.user_name}</td>
                                    <td className="text-center">
                                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{log.details || '-'}</td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Keine Einträge gefunden.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
