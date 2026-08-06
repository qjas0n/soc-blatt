"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import { getOngoingExams } from '@/app/actions';
import { useLivePolling } from '@/lib/useLivePolling';

const POLL_INTERVAL_MS = 4000;

export default function OngoingExamsPanel({ initial }: { initial: any[] }) {
    const [ongoing, setOngoing] = useState<any[]>(initial);

    useLivePolling(async () => {
        const fresh = await getOngoingExams();
        if (fresh) setOngoing(fresh);
    }, POLL_INTERVAL_MS);

    if (ongoing.length === 0) return null;

    return (
        <div className="card" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={16} style={{ color: 'var(--color-yellow)' }} />
                    <span>Laufende Prüfungen</span>
                </div>
                <span style={{
                    backgroundColor: 'rgba(234,179,8,0.15)', color: 'var(--color-yellow)',
                    padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600'
                }}>{ongoing.length} aktiv</span>
            </div>
            <div style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Prüfling</th>
                            <th>Ausbildung</th>
                            <th className="text-center">Punkte (bisher)</th>
                            <th>Gestartet von</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {ongoing.map((e: any) => (
                            <tr key={e.id}>
                                <td style={{ fontWeight: '600' }}>{e.candidate_name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{e.training_title}</td>
                                <td className="text-center" style={{ fontWeight: '600', color: 'var(--color-yellow)' }}>{e.total_points} / {e.max_points}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{e.examiner_name}</td>
                                <td className="text-center">
                                    <Link href={`/ausbildungen/pruefungen/${e.id}/durchfuehren`} style={{ textDecoration: 'none' }}>
                                        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }}>Öffnen</button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
