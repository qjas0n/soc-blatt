"use client";

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteExam } from '@/app/actions';

export default function DeleteExamButton({ id }: { id: number }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Diesen Prüfungseintrag wirklich löschen?')) return;
        await deleteExam(id);
        router.push('/ausbildungen/pruefungen');
    };

    return (
        <button onClick={handleDelete} className="btn" style={{
            backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-red)', border: '1px solid rgba(239,68,68,0.3)'
        }}>
            <Trash2 size={14} /> Löschen
        </button>
    );
}
