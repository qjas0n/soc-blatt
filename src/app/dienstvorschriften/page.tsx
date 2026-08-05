import { BookOpen } from 'lucide-react';
import { getDienstvorschriften } from '@/app/actions';

interface Block {
    type: 'p' | 'li';
    text: string;
    highlight?: boolean;
    children?: { text: string; highlight?: boolean }[];
}

function parseBlocks(content: string): Block[] {
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function SectionContent({ content }: { content: string }) {
    const blocks = parseBlocks(content);
    const paragraphs = blocks.filter(b => b.type === 'p');
    const items = blocks.filter(b => b.type === 'li');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paragraphs.map((p, i) => (
                <p key={`p-${i}`} style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '13px' }}>{p.text}</p>
            ))}
            {items.length > 0 && (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map((item, i) => (
                        <li key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <span style={{
                                    marginTop: '7px', width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                                    background: item.highlight ? 'var(--color-green)' : 'var(--color-accent)'
                                }} />
                                <span style={{
                                    fontSize: '13px', lineHeight: 1.6,
                                    color: item.highlight ? 'var(--color-green)' : 'var(--text-secondary)',
                                    fontWeight: item.highlight ? 600 : 400
                                }}>
                                    {item.text}
                                </span>
                            </div>
                            {item.children && item.children.length > 0 && (
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '30px' }}>
                                    {item.children.map((child, j) => (
                                        <li key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <span style={{
                                                marginTop: '6px', width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0,
                                                background: child.highlight ? 'var(--color-green)' : 'var(--text-muted)'
                                            }} />
                                            <span style={{
                                                fontSize: '12.5px', lineHeight: 1.6,
                                                color: child.highlight ? 'var(--color-green)' : 'var(--text-muted)',
                                                fontWeight: child.highlight ? 600 : 400
                                            }}>
                                                {child.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default async function DienstvorschriftenPage() {
    const entries = await getDienstvorschriften();
    const sections = entries.filter((e: any) => !e.is_signature);
    const signature = entries.find((e: any) => e.is_signature);
    const signatureBlocks = signature ? parseBlocks(signature.content) : [];

    return (
        <div className="dashboard-content">
            <div className="hero">
                <div className="hero-icon">
                    <BookOpen size={26} />
                </div>
                <div>
                    <h1 className="page-title">Dienstvorschriften</h1>
                    <div className="page-subtitle-pill">
                        <span className="pill-dot" />
                        SOC Interne Vorschriften
                    </div>
                </div>
            </div>

            {sections.length === 0 && (
                <div className="card">
                    <div className="card-content" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                        Noch keine Dienstvorschriften hinterlegt.
                    </div>
                </div>
            )}

            {sections.map((s: any) => (
                <div className="card" key={s.id}>
                    <div className="card-header">
                        <span>{s.title}</span>
                    </div>
                    <div className="card-content">
                        <SectionContent content={s.content} />
                    </div>
                </div>
            ))}

            {signatureBlocks.length > 0 && (
                <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', paddingRight: '4px' }}>
                    {signatureBlocks.map((b, i) => <div key={i}>{b.text}</div>)}
                </div>
            )}
        </div>
    );
}
