"use server";

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { verifyPassword, hashPassword, createSession, destroySession, getSession } from '@/lib/auth';
import { checkRateLimit, recordFailure, clearFailures } from '@/lib/rateLimit';

export async function loginUser(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const key = username?.toLowerCase().trim() ?? '';

    const { blocked } = checkRateLimit(key);
    if (blocked) {
        return { error: 'Benutzername oder Passwort falsch...' };
    }

    const results: any = await query('SELECT * FROM soc_users WHERE username = ?', [username]);
    if (!results || results.length === 0) {
        recordFailure(key);
        return { error: 'Benutzername oder Passwort falsch...' };
    }

    const user = results[0];
    if (!verifyPassword(password, user.password_hash)) {
        recordFailure(key);
        return { error: 'Benutzername oder Passwort falsch...' };
    }

    clearFailures(key);
    await createSession(user.id);
    await addLog('Login', `Benutzer ${user.display_name} hat sich eingeloggt.`);
    redirect('/');
}

export async function logoutUser() {
    await addLog('Logout', 'Benutzer hat sich ausgeloggt.');
    await destroySession();
    redirect('/login');
}

export async function addLog(action: string, details?: string) {
    try {
        const session = await getSession();
        const user_name = session?.displayName || 'System';
        await query('INSERT INTO soc_logs (user_name, action, details) VALUES (?, ?, ?)', [user_name, action, details || '']);
    } catch (e) {
        console.error("Log error", e);
    }
}

export async function getCurrentUser() {
    return await getSession();
}

export async function getUsers() {
    return await query('SELECT id, username, display_name, role, rang, permissions, avatar_url, created_at FROM soc_users ORDER BY created_at ASC') as any[];
}

export async function getMembers() {
    return await query('SELECT id, display_name AS name, role, rang, avatar_url FROM soc_users ORDER BY id ASC') as any[];
}

export async function getDefaultPasswordUserIds(): Promise<number[]> {
    const session = await getSession();
    if (!session || session.role !== 'admin') return [];
    const users = await query('SELECT id, password_hash FROM soc_users') as any[];
    return users.filter(u => verifyPassword('12345', u.password_hash)).map(u => u.id);
}

export async function createUser(formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { error: 'Keine Berechtigung.' };

    const username = formData.get('username') as string;
    const password = (formData.get('password') as string) || '12345';
    const display_name = formData.get('display_name') as string;
    const role = formData.get('role') as string;
    const rang = (formData.get('rang') as string) || 'SOC-Mitglied';

    const existing: any = await query('SELECT id FROM soc_users WHERE username = ?', [username]);
    if (existing && existing.length > 0) return { error: 'Benutzername existiert bereits.' };

    const hash = hashPassword(password);
    await query(
        'INSERT INTO soc_users (username, password_hash, display_name, role, rang, permissions) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hash, display_name, role, rang, JSON.stringify({})]
    );
    await addLog('User Erstellt', `Neuer Benutzer: ${display_name} (${username}) - Rolle: ${role}`);
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteUser(id: number) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return;
    if (session.userId === id) return;
    await query('DELETE FROM soc_users WHERE id = ?', [id]);
    await addLog('User Gelöscht', `Benutzer ID ${id} wurde gelöscht.`);
    revalidatePath('/admin');
}

export async function updateUserRole(id: number, role: string) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return;
    await query('UPDATE soc_users SET role = ? WHERE id = ?', [role, id]);
    await addLog('Rolle Aktualisiert', `Rolle für User ID ${id} wurde auf "${role}" geändert.`);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateUserProfile(id: number, username: string, displayName: string, rang: string) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return { error: 'Keine Berechtigung.' };
    const u = username.trim();
    const d = displayName.trim();
    const r = rang.trim() || 'SOC-Mitglied';
    if (!u || !d) return { error: 'Benutzername und Anzeigename sind erforderlich.' };
    const existing: any = await query('SELECT id FROM soc_users WHERE username = ? AND id != ?', [u, id]);
    if (existing && existing.length > 0) return { error: 'Benutzername ist bereits vergeben.' };
    await query('UPDATE soc_users SET username = ?, display_name = ?, rang = ? WHERE id = ?', [u, d, r, id]);
    await addLog('Benutzer Aktualisiert', `User ID ${id}: Login="${u}", Anzeigename="${d}", Rang="${r}"`);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function updateDisplayName(displayName: string) {
    const session = await getSession();
    if (!session) return { error: 'Nicht angemeldet.' };
    if (!displayName || displayName.trim().length < 2) return { error: 'Name zu kurz.' };
    await query('UPDATE soc_users SET display_name = ? WHERE id = ?', [displayName.trim(), session.userId]);
    await addLog('Profil Aktualisiert', `Anzeigename geändert zu "${displayName.trim()}".`);
    return { success: true };
}

export async function updateAvatar(avatarUrl: string) {
    const session = await getSession();
    if (!session) return { error: 'Nicht angemeldet.' };
    await query('UPDATE soc_users SET avatar_url = ? WHERE id = ?', [avatarUrl || null, session.userId]);
    await addLog('Avatar Aktualisiert', 'Profilbild wurde geändert.');
    return { success: true };
}

export async function changePassword(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: 'Nicht angemeldet.' };

    const newPassword = formData.get('new_password') as string;
    if (!newPassword || newPassword.length < 5) return { error: 'Passwort zu kurz (min. 5 Zeichen).' };
    if (newPassword === '12345') return { error: 'Passwort darf nicht "12345" sein.' };

    const hash = hashPassword(newPassword);
    await query('UPDATE soc_users SET password_hash = ? WHERE id = ?', [hash, session.userId]);
    await addLog('Passwort Geändert', `Benutzer mit ID ${session.userId} hat sein Passwort geändert.`);
    return { success: true };
}

export async function getAnnouncements() {
    return await query('SELECT * FROM soc_announcements ORDER BY created_at DESC') as any[];
}

export async function addAnnouncement(formData: FormData) {
    const session = await getSession();
    if (!session) return;
    const text = formData.get('text') as string;
    const type = formData.get('type') as string;
    const date_str = new Date().toLocaleDateString('de-DE');
    const badge_class = type === 'Dringend' ? 'badge-red' : 'badge-blue';

    await query(
        `INSERT INTO soc_announcements (text, author, date_str, type, badge_class) VALUES (?, ?, ?, ?, ?)`,
        [text, session.displayName, date_str, type, badge_class]
    );
    await addLog('Ankündigung Erstellt', `Eine neue Ankündigung (Typ: ${type}) wurde erstellt.`);
    revalidatePath('/');
}

export async function deleteAnnouncement(id: number) {
    const session = await getSession();
    if (!session) return;
    await query(`DELETE FROM soc_announcements WHERE id = ?`, [id]);
    await addLog('Ankündigung Gelöscht', `Ankündigung ID ${id} wurde entfernt.`);
    revalidatePath('/');
}

export async function getUserCount(): Promise<number> {
    const result: any = await query('SELECT COUNT(*) as cnt FROM soc_users');
    return result[0]?.cnt || 0;
}

export async function getRecentLogs(limit: number = 8) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return [];
    return await query('SELECT * FROM soc_logs ORDER BY created_at DESC LIMIT ?', [limit]) as any[];
}

export async function getLogs() {
    const session = await getSession();
    if (!session || session.role !== 'admin') return [];
    return await query('SELECT * FROM soc_logs ORDER BY created_at DESC') as any[];
}

export async function isTrainingInstructor(): Promise<boolean> {
    const session = await getSession();
    return !!session && (session.role === 'admin' || session.role === 'leitung');
}

export async function getTrainingCategories() {
    const categories = await query('SELECT * FROM soc_training_categories ORDER BY sort_order ASC, id ASC') as any[];
    const trainings = await query('SELECT id, category_id, title, slug, sort_order FROM soc_trainings ORDER BY sort_order ASC, id ASC') as any[];
    return categories.map(c => ({ ...c, trainings: trainings.filter(t => t.category_id === c.id) }));
}

export async function getTrainingBySlug(slug: string) {
    const rows: any = await query(
        `SELECT t.*, c.name AS category_name, c.slug AS category_slug
         FROM soc_trainings t
         JOIN soc_training_categories c ON c.id = t.category_id
         WHERE t.slug = ?`,
        [slug]
    );
    if (!rows || rows.length === 0) return null;
    const training = rows[0];
    const [questions, haltCategories] = await Promise.all([
        query('SELECT * FROM soc_training_questions WHERE training_id = ? ORDER BY sort_order ASC, id ASC', [training.id]) as Promise<any[]>,
        getHaltCategoriesForTraining(training.id),
    ]);
    return { ...training, questions, haltCategories };
}

export async function getHaltCategoriesForTraining(trainingId: number) {
    const categories = await query('SELECT * FROM soc_training_halt_categories WHERE training_id = ? ORDER BY sort_order ASC, id ASC', [trainingId]) as any[];
    const halts = await query('SELECT * FROM soc_training_halts WHERE training_id = ? ORDER BY sort_order ASC, id ASC', [trainingId]) as any[];
    return categories.map(c => ({ ...c, halts: halts.filter(h => h.category_id === c.id) }));
}

export async function getMemberNames(): Promise<string[]> {
    const rows = await query('SELECT display_name FROM soc_users ORDER BY display_name ASC') as any[];
    return rows.map(r => r.display_name);
}

function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export async function startExam(formData: FormData) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };

    const trainingId = Number(formData.get('training_id'));
    const candidateName = (formData.get('candidate_name') as string || '').trim();

    if (!candidateName) return { error: 'Name des Geprüften ist erforderlich.' };

    const activeLock: any = await query(
        `SELECT * FROM soc_training_locks
         WHERE LOWER(candidate_name) = LOWER(?) AND TIMESTAMP(bis_datum, bis_uhrzeit) > NOW()
         ORDER BY bis_datum DESC, bis_uhrzeit DESC LIMIT 1`,
        [candidateName]
    );
    if (activeLock && activeLock.length > 0) {
        const lock = activeLock[0];
        const bis = new Date(lock.bis_datum);
        return { error: `Ausbildungssperre aktiv für "${candidateName}" bis ${bis.toLocaleDateString('de-DE')} ${String(lock.bis_uhrzeit).slice(0, 5)} Uhr (Grund: ${lock.grund || '-'}). Es kann keine Prüfung gestartet werden.` };
    }

    const trainingRows: any = await query('SELECT id, slug FROM soc_trainings WHERE id = ?', [trainingId]);
    if (!trainingRows || trainingRows.length === 0) return { error: 'Ausbildung nicht gefunden.' };
    const slug = trainingRows[0].slug;

    const [allQuestions, haltCategories] = await Promise.all([
        query('SELECT id, frage, antwort, punkte FROM soc_training_questions WHERE training_id = ? ORDER BY sort_order ASC, id ASC', [trainingId]) as Promise<any[]>,
        getHaltCategoriesForTraining(trainingId),
    ]);

    // Trainings with Halt-Kategorien (Ortskunde-style) draw 3 random stops from each
    // category (9 total) and 3 random questions per stop. Trainings without any
    // categories keep the flat, full question catalog with no stops.
    const chosenHalts: any[] = haltCategories.flatMap((c: any) => pickRandom(c.halts, Math.min(3, c.halts.length)));

    let maxPoints = 0;
    const examResult: any = await query(
        `INSERT INTO soc_training_exams (training_id, candidate_name, examiner_id, examiner_name, status, notes, total_points, max_points)
         VALUES (?, ?, ?, ?, 'in_bearbeitung', '', 0, 0)`,
        [trainingId, candidateName, session.userId, session.displayName]
    );
    const examId = examResult.insertId;

    if (chosenHalts.length > 0) {
        let sortOrder = 0;
        for (const halt of chosenHalts) {
            sortOrder++;
            const haltResult: any = await query(
                'INSERT INTO soc_training_exam_halts (exam_id, halt_id, name, bild, sort_order) VALUES (?, ?, ?, ?, ?)',
                [examId, halt.id, halt.name, halt.bild, sortOrder]
            );
            const examHaltId = haltResult.insertId;
            const haltQuestions = pickRandom(allQuestions, Math.min(3, allQuestions.length));
            for (const q of haltQuestions) {
                maxPoints += q.punkte;
                await query(
                    'INSERT INTO soc_training_exam_answers (exam_id, exam_halt_id, question_id, frage, antwort, max_punkte, punkte_erreicht) VALUES (?, ?, ?, ?, ?, ?, 0)',
                    [examId, examHaltId, q.id, q.frage, q.antwort, q.punkte]
                );
            }
        }
    } else {
        for (const q of allQuestions) {
            maxPoints += q.punkte;
            await query(
                'INSERT INTO soc_training_exam_answers (exam_id, question_id, frage, antwort, max_punkte, punkte_erreicht) VALUES (?, ?, ?, ?, ?, 0)',
                [examId, q.id, q.frage, q.antwort, q.punkte]
            );
        }
    }

    await query('UPDATE soc_training_exams SET max_points = ? WHERE id = ?', [maxPoints, examId]);

    await addLog('Prüfung Gestartet', `${session.displayName} hat eine Prüfung für "${candidateName}" gestartet.`);
    revalidatePath(`/ausbildungen/${slug}`);
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/pruefungen');

    redirect(`/ausbildungen/pruefungen/${examId}/durchfuehren`);
}

export async function updateExamAnswer(examId: number, answerId: number, punkte: number) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };

    const answerRows: any = await query('SELECT max_punkte FROM soc_training_exam_answers WHERE id = ? AND exam_id = ?', [answerId, examId]);
    if (!answerRows || answerRows.length === 0) return { error: 'Antwort nicht gefunden.' };
    const clamped = Math.max(0, Math.min(answerRows[0].max_punkte, punkte));

    await query('UPDATE soc_training_exam_answers SET punkte_erreicht = ? WHERE id = ?', [clamped, answerId]);

    const totalRows: any = await query('SELECT SUM(punkte_erreicht) as total FROM soc_training_exam_answers WHERE exam_id = ?', [examId]);
    const total = Number(totalRows[0]?.total || 0);
    await query('UPDATE soc_training_exams SET total_points = ? WHERE id = ?', [total, examId]);

    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/pruefungen');

    return { success: true, total };
}

const HALT_FLAG_COLUMNS = ['gefunden', 'schnellste_route'] as const;

export async function updateExamHaltFlag(examHaltId: number, field: string, value: boolean) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };
    if (!HALT_FLAG_COLUMNS.includes(field as any)) return { error: 'Ungültiges Feld.' };

    await query(`UPDATE soc_training_exam_halts SET ?? = ? WHERE id = ?`, [field, value ? 1 : 0, examHaltId]);
    revalidatePath('/ausbildungen/pruefungen');
    return { success: true };
}

export async function finishExam(formData: FormData) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };

    const examId = Number(formData.get('exam_id'));
    const notes = (formData.get('notes') as string) || '';
    const examiner2Name = (formData.get('examiner2_name') as string || '').trim();
    const examiner3Name = (formData.get('examiner3_name') as string || '').trim();

    const examRows: any = await query(
        `SELECT e.*, t.slug AS training_slug, t.bestehen_prozent AS bestehen_prozent
         FROM soc_training_exams e JOIN soc_trainings t ON t.id = e.training_id WHERE e.id = ?`,
        [examId]
    );
    if (!examRows || examRows.length === 0) return { error: 'Prüfung nicht gefunden.' };
    const exam = examRows[0];

    const totalRows: any = await query('SELECT SUM(punkte_erreicht) as total FROM soc_training_exam_answers WHERE exam_id = ?', [examId]);
    const total = Number(totalRows[0]?.total || 0);
    const maxPoints = exam.max_points || 0;
    const pct = maxPoints > 0 ? (total / maxPoints) * 100 : 0;
    const bestehenProzent = exam.bestehen_prozent ?? 80;
    const status = pct >= bestehenProzent ? 'bestanden' : 'nicht_bestanden';

    await query(
        'UPDATE soc_training_exams SET status = ?, notes = ?, total_points = ?, examiner2_name = ?, examiner3_name = ? WHERE id = ?',
        [status, notes, total, examiner2Name, examiner3Name, examId]
    );
    await addLog(
        'Prüfung Abgeschlossen',
        `${session.displayName} hat die Prüfung von "${exam.candidate_name}" abgeschlossen (${total}/${maxPoints} Punkte = ${Math.round(pct)}%, Bestehensgrenze ${bestehenProzent}%, Status: ${status}).`
    );

    revalidatePath(`/ausbildungen/${exam.training_slug}`);
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/pruefungen');
    revalidatePath(`/ausbildungen/pruefungen/${examId}`);

    redirect(`/ausbildungen/pruefungen/${examId}`);
}

export async function getOngoingExams() {
    return await query(
        `SELECT e.*, t.title AS training_title, t.slug AS training_slug
         FROM soc_training_exams e
         JOIN soc_trainings t ON t.id = e.training_id
         WHERE e.status = 'in_bearbeitung'
         ORDER BY e.created_at DESC`
    ) as any[];
}

export async function deleteExam(id: number) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_training_exams WHERE id = ?', [id]);
    await addLog('Prüfung Gelöscht', `Prüfungseintrag ID ${id} wurde gelöscht.`);
    revalidatePath('/ausbildungen/pruefungen');
    return { success: true };
}

export async function getExamsForTraining(trainingId: number) {
    return await query('SELECT * FROM soc_training_exams WHERE training_id = ? ORDER BY created_at DESC', [trainingId]) as any[];
}

export async function getAllExams() {
    return await query(
        `SELECT e.*, t.title AS training_title, t.slug AS training_slug
         FROM soc_training_exams e
         JOIN soc_trainings t ON t.id = e.training_id
         ORDER BY e.created_at DESC`
    ) as any[];
}

export async function getExamDetail(id: number) {
    const rows: any = await query(
        `SELECT e.*, t.title AS training_title, t.slug AS training_slug, t.bestehen_prozent AS training_bestehen_prozent
         FROM soc_training_exams e
         JOIN soc_trainings t ON t.id = e.training_id
         WHERE e.id = ?`,
        [id]
    );
    if (!rows || rows.length === 0) return null;
    const exam = rows[0];
    const [answers, halts] = await Promise.all([
        query('SELECT * FROM soc_training_exam_answers WHERE exam_id = ? ORDER BY id ASC', [id]) as Promise<any[]>,
        query('SELECT * FROM soc_training_exam_halts WHERE exam_id = ? ORDER BY sort_order ASC, id ASC', [id]) as Promise<any[]>,
    ]);

    const haltsWithAnswers = halts.map(h => ({ ...h, answers: answers.filter(a => a.exam_halt_id === h.id) }));

    return { ...exam, answers, halts: haltsWithAnswers };
}

export async function getTrainingLocks() {
    const rows = await query(
        `SELECT *, (TIMESTAMP(bis_datum, bis_uhrzeit) > NOW()) AS active
         FROM soc_training_locks
         ORDER BY active DESC, bis_datum DESC, bis_uhrzeit DESC`
    ) as any[];
    return rows.map(r => ({ ...r, active: !!r.active }));
}

export async function addTrainingLock(formData: FormData) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };

    const candidateName = (formData.get('candidate_name') as string || '').trim();
    const ausbilder = (formData.get('ausbilder') as string || '').trim();
    const bisDatum = formData.get('bis_datum') as string;
    const bisUhrzeit = formData.get('bis_uhrzeit') as string;
    const aussteller = (formData.get('aussteller') as string || session.displayName).trim();
    const grund = (formData.get('grund') as string || '').trim();

    if (!candidateName) return { error: 'Name ist erforderlich.' };
    if (!bisDatum || !bisUhrzeit) return { error: 'Bis-Datum und Bis-Uhrzeit sind erforderlich.' };

    await query(
        'INSERT INTO soc_training_locks (candidate_name, ausbilder, bis_datum, bis_uhrzeit, aussteller, grund) VALUES (?, ?, ?, ?, ?, ?)',
        [candidateName, ausbilder, bisDatum, bisUhrzeit, aussteller, grund]
    );
    await addLog('Ausbildungssperre Vergeben', `"${candidateName}" wurde bis ${bisDatum} ${bisUhrzeit} gesperrt (Aussteller: ${aussteller}, Grund: ${grund || '-'}).`);
    revalidatePath('/ausbildungen');
    return { success: true };
}

export async function deleteTrainingLock(id: number) {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'leitung')) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_training_locks WHERE id = ?', [id]);
    await addLog('Ausbildungssperre Aufgehoben', `Sperre ID ${id} wurde entfernt.`);
    revalidatePath('/ausbildungen');
    return { success: true };
}

export async function getDienstvorschriften() {
    return await query(
        "SELECT * FROM soc_dienstvorschriften WHERE category = 'SOC Interne Vorschriften' ORDER BY sort_order ASC, id ASC"
    ) as any[];
}

function slugify(text: string): string {
    const withoutUmlauts = text
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    const withoutDiacritics = withoutUmlauts.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return withoutDiacritics
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function addTrainingCategory(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const name = (formData.get('name') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    if (!name) return { error: 'Name ist erforderlich.' };

    let slug = slugify(name);
    const existing: any = await query('SELECT id FROM soc_training_categories WHERE slug = ?', [slug]);
    if (existing && existing.length > 0) slug = `${slug}-${Date.now()}`;

    const maxOrder: any = await query('SELECT MAX(sort_order) as m FROM soc_training_categories');
    const sortOrder = (maxOrder[0]?.m || 0) + 1;

    await query('INSERT INTO soc_training_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)', [name, slug, description, sortOrder]);
    await addLog('Ausbildungskategorie Erstellt', `Kategorie "${name}" wurde angelegt.`);
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/verwaltung');
    return { success: true };
}

export async function deleteTrainingCategory(id: number) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_training_categories WHERE id = ?', [id]);
    await addLog('Ausbildungskategorie Gelöscht', `Kategorie ID ${id} wurde inkl. aller zugehörigen Ausbildungen gelöscht.`);
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/verwaltung');
    return { success: true };
}

export async function createTraining(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const categoryId = Number(formData.get('category_id'));
    const title = (formData.get('title') as string || '').trim();
    const benoetigteMittel = (formData.get('benoetigte_mittel') as string || '').trim();
    const bestehenProzent = Math.max(0, Math.min(100, Number(formData.get('bestehen_prozent')) || 80));
    const aufgabenTitel = (formData.get('aufgaben_titel') as string || '').trim() || 'Fragen / Aufgaben';
    const streckenTitel = (formData.get('strecken_titel') as string || '').trim() || 'Strecken';

    if (!categoryId) return { error: 'Kategorie ist erforderlich.' };
    if (!title) return { error: 'Titel ist erforderlich.' };

    let slug = slugify(title);
    const existing: any = await query('SELECT id FROM soc_trainings WHERE slug = ?', [slug]);
    if (existing && existing.length > 0) slug = `${slug}-${Date.now()}`;

    const maxOrder: any = await query('SELECT MAX(sort_order) as m FROM soc_trainings WHERE category_id = ?', [categoryId]);
    const sortOrder = (maxOrder[0]?.m || 0) + 1;

    const result: any = await query(
        `INSERT INTO soc_trainings (category_id, title, slug, benoetigte_mittel, info_teilnehmer, info_pruefer, bestehen_prozent, aufgaben_titel, strecken_titel, sort_order)
         VALUES (?, ?, ?, ?, '', '', ?, ?, ?, ?)`,
        [categoryId, title, slug, benoetigteMittel, bestehenProzent, aufgabenTitel, streckenTitel, sortOrder]
    );
    await addLog('Ausbildung Erstellt', `Ausbildung "${title}" wurde angelegt.`);
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/verwaltung');
    return { success: true, id: result.insertId, slug };
}

export async function getTrainingForEdit(id: number) {
    if (!(await isTrainingInstructor())) return null;
    const rows: any = await query('SELECT * FROM soc_trainings WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return null;
    const training = rows[0];
    const [questions, haltCategories, categories] = await Promise.all([
        query('SELECT * FROM soc_training_questions WHERE training_id = ? ORDER BY sort_order ASC, id ASC', [id]) as Promise<any[]>,
        getHaltCategoriesForTraining(id),
        query('SELECT id, name FROM soc_training_categories ORDER BY sort_order ASC, id ASC') as Promise<any[]>,
    ]);
    return { ...training, questions, haltCategories, categories };
}

export async function updateTraining(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const id = Number(formData.get('id'));
    const categoryId = Number(formData.get('category_id'));
    const title = (formData.get('title') as string || '').trim();
    const benoetigteMittel = (formData.get('benoetigte_mittel') as string || '').trim();
    const infoTeilnehmer = (formData.get('info_teilnehmer') as string || '').trim();
    const infoPruefer = (formData.get('info_pruefer') as string || '').trim();
    const bestehenProzent = Math.max(0, Math.min(100, Number(formData.get('bestehen_prozent')) || 80));
    const aufgabenTitel = (formData.get('aufgaben_titel') as string || '').trim() || 'Fragen / Aufgaben';
    const streckenTitel = (formData.get('strecken_titel') as string || '').trim() || 'Strecken';

    if (!title) return { error: 'Titel ist erforderlich.' };

    await query(
        `UPDATE soc_trainings SET category_id = ?, title = ?, benoetigte_mittel = ?, info_teilnehmer = ?, info_pruefer = ?, bestehen_prozent = ?, aufgaben_titel = ?, strecken_titel = ? WHERE id = ?`,
        [categoryId, title, benoetigteMittel, infoTeilnehmer, infoPruefer, bestehenProzent, aufgabenTitel, streckenTitel, id]
    );
    await addLog('Ausbildung Aktualisiert', `Ausbildung "${title}" (ID ${id}) wurde bearbeitet.`);

    const slugRows: any = await query('SELECT slug FROM soc_trainings WHERE id = ?', [id]);
    const slug = slugRows[0]?.slug;
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${id}`);
    if (slug) revalidatePath(`/ausbildungen/${slug}`);
    return { success: true };
}

export async function deleteTraining(id: number) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_trainings WHERE id = ?', [id]);
    await addLog('Ausbildung Gelöscht', `Ausbildung ID ${id} wurde gelöscht.`);
    revalidatePath('/ausbildungen');
    revalidatePath('/ausbildungen/verwaltung');
    return { success: true };
}

export async function addQuestion(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const trainingId = Number(formData.get('training_id'));
    const kategorie = (formData.get('kategorie') as string || '').trim();
    const frage = (formData.get('frage') as string || '').trim();
    const antwort = (formData.get('antwort') as string || '').trim();
    const punkte = Math.max(1, Number(formData.get('punkte')) || 1);

    if (!frage || !antwort) return { error: 'Frage und Antwort sind erforderlich.' };

    const maxOrder: any = await query('SELECT MAX(sort_order) as m FROM soc_training_questions WHERE training_id = ?', [trainingId]);
    const sortOrder = (maxOrder[0]?.m || 0) + 1;

    await query(
        'INSERT INTO soc_training_questions (training_id, kategorie, frage, antwort, punkte, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [trainingId, kategorie, frage, antwort, punkte, sortOrder]
    );
    await addLog('Prüfungsfrage Hinzugefügt', `Frage "${frage}" wurde hinzugefügt.`);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function updateQuestion(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const id = Number(formData.get('id'));
    const trainingId = Number(formData.get('training_id'));
    const kategorie = (formData.get('kategorie') as string || '').trim();
    const frage = (formData.get('frage') as string || '').trim();
    const antwort = (formData.get('antwort') as string || '').trim();
    const punkte = Math.max(1, Number(formData.get('punkte')) || 1);

    if (!frage || !antwort) return { error: 'Frage und Antwort sind erforderlich.' };

    await query('UPDATE soc_training_questions SET kategorie = ?, frage = ?, antwort = ?, punkte = ? WHERE id = ?', [kategorie, frage, antwort, punkte, id]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function deleteQuestion(id: number, trainingId: number) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_training_questions WHERE id = ?', [id]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function addHaltCategory(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const trainingId = Number(formData.get('training_id'));
    const name = (formData.get('name') as string || '').trim();
    if (!name) return { error: 'Name ist erforderlich.' };

    const maxOrder: any = await query('SELECT MAX(sort_order) as m FROM soc_training_halt_categories WHERE training_id = ?', [trainingId]);
    const sortOrder = (maxOrder[0]?.m || 0) + 1;

    await query('INSERT INTO soc_training_halt_categories (training_id, name, sort_order) VALUES (?, ?, ?)', [trainingId, name, sortOrder]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function updateHaltCategory(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const id = Number(formData.get('id'));
    const trainingId = Number(formData.get('training_id'));
    const name = (formData.get('name') as string || '').trim();
    if (!name) return { error: 'Name ist erforderlich.' };

    await query('UPDATE soc_training_halt_categories SET name = ? WHERE id = ?', [name, id]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function deleteHaltCategory(id: number, trainingId: number) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_training_halt_categories WHERE id = ?', [id]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function addHalt(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const trainingId = Number(formData.get('training_id'));
    const categoryId = Number(formData.get('category_id'));
    const name = (formData.get('name') as string || '').trim();
    const bild = (formData.get('bild') as string || '').trim() || null;

    if (!categoryId) return { error: 'Kategorie ist erforderlich.' };
    if (!name) return { error: 'Name ist erforderlich.' };

    const maxOrder: any = await query('SELECT MAX(sort_order) as m FROM soc_training_halts WHERE category_id = ?', [categoryId]);
    const sortOrder = (maxOrder[0]?.m || 0) + 1;

    await query('INSERT INTO soc_training_halts (training_id, category_id, name, bild, sort_order) VALUES (?, ?, ?, ?, ?)', [trainingId, categoryId, name, bild, sortOrder]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function updateHalt(formData: FormData) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    const id = Number(formData.get('id'));
    const trainingId = Number(formData.get('training_id'));
    const categoryId = Number(formData.get('category_id'));
    const name = (formData.get('name') as string || '').trim();
    const bild = (formData.get('bild') as string || '').trim() || null;

    if (!name) return { error: 'Name ist erforderlich.' };

    await query('UPDATE soc_training_halts SET category_id = ?, name = ?, bild = ? WHERE id = ?', [categoryId, name, bild, id]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}

export async function deleteHalt(id: number, trainingId: number) {
    if (!(await isTrainingInstructor())) return { error: 'Keine Berechtigung.' };
    await query('DELETE FROM soc_training_halts WHERE id = ?', [id]);
    revalidatePath('/ausbildungen/verwaltung');
    revalidatePath(`/ausbildungen/verwaltung/${trainingId}`);
    return { success: true };
}
