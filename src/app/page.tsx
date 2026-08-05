import Link from 'next/link';
import { Crosshair, Users, Megaphone, GraduationCap, BookOpen, ClipboardList, Settings, Terminal, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getAnnouncements, getUserCount, getMembers, getTrainingCategories, isTrainingInstructor } from '@/app/actions';
import AnnouncementsPanel from '@/components/AnnouncementsPanel';
import DivisionMembers from '@/components/DivisionMembers';

export default async function HomePage() {
    const [session, announcements, userCount, members, categories, canManage] = await Promise.all([
        getSession(),
        getAnnouncements(),
        getUserCount(),
        getMembers(),
        getTrainingCategories(),
        isTrainingInstructor(),
    ]);

    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
    const trainingCount = categories.reduce((sum: number, c: any) => sum + c.trainings.length, 0);
    const isAdmin = session?.role === 'admin';

    const quickLinks = [
        { name: 'Ausbildungen', href: '/ausbildungen', icon: GraduationCap, show: true },
        { name: 'Dienstvorschriften', href: '/dienstvorschriften', icon: BookOpen, show: true },
        { name: 'Alle Prüfungen', href: '/ausbildungen/pruefungen', icon: ClipboardList, show: canManage },
        { name: 'Ausbildungsverwaltung', href: '/ausbildungen/verwaltung', icon: Settings, show: canManage },
        { name: 'Systemprotokoll', href: '/admin/logs', icon: Terminal, show: isAdmin },
    ].filter(l => l.show);

    return (
        <div className="dashboard-content">
            <div className="hero">
                <div className="hero-icon">
                    <Crosshair size={26} />
                </div>
                <div>
                    <h1 className="page-title">{greeting}, <span className="accent-text">{session?.displayName || ''}</span></h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        Special Operations Command &nbsp;&middot;&nbsp; Dienstblatt
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header"><Crosshair size={16} /> Einheit</div>
                    <div className="stat-value" style={{ fontSize: '22px' }}>SOC</div>
                    <div className="stat-sub">Special Operations Command</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header"><Users size={16} /> Registrierte Accounts</div>
                    <div className="stat-value">{userCount}</div>
                    <div className="stat-sub">Systemweite Benutzer</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header"><Megaphone size={16} /> Ankündigungen</div>
                    <div className="stat-value">{announcements.length}</div>
                    <div className="stat-sub">Aktuelle Meldungen</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header"><GraduationCap size={16} /> Ausbildungen</div>
                    <div className="stat-value">{trainingCount}</div>
                    <div className="stat-sub">Verfügbare Prüfungsbereiche</div>
                </div>
            </div>

            <div className="grid-container">
                <AnnouncementsPanel initial={announcements} />

                <div className="card">
                    <div className="card-header">
                        <span>Schnellzugriff</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {quickLinks.map((link, i) => (
                            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 20px',
                                    borderBottom: i < quickLinks.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    color: 'var(--text-primary)', transition: 'background 0.15s'
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)'
                                    }}>
                                        <link.icon size={16} />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>{link.name}</span>
                                    <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <DivisionMembers initial={members} />
        </div>
    );
}
