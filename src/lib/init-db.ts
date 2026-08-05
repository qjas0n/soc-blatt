import { query } from './db';

async function ensureDatabaseExists() {
  const mysql = require('mysql2/promise');
  const dbName = process.env.DB_NAME || 'soc';
  const tempPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database \`${dbName}\` ensured.`);
  } catch (err) {
    console.error('Error ensuring database exists:', err);
  } finally {
    await tempPool.end();
  }
}

export async function initDb() {
  await ensureDatabaseExists();

  const tables = [
    `CREATE TABLE IF NOT EXISTS soc_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      rang VARCHAR(255) DEFAULT 'SOC-Mitglied',
      permissions JSON,
      avatar_url VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS soc_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES soc_users(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS soc_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS soc_announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text TEXT NOT NULL,
      author VARCHAR(255) NOT NULL,
      date_str VARCHAR(50) NOT NULL,
      type VARCHAR(50) NOT NULL,
      badge_class VARCHAR(50) DEFAULT 'badge-blue',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS soc_trainings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      benoetigte_mittel TEXT DEFAULT '',
      info_teilnehmer LONGTEXT DEFAULT '',
      info_pruefer LONGTEXT DEFAULT '',
      bestehen_prozent INT DEFAULT 80,
      aufgaben_titel VARCHAR(255) DEFAULT 'Fragen / Aufgaben',
      strecken_titel VARCHAR(255) DEFAULT 'Strecken',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES soc_training_categories(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      training_id INT NOT NULL,
      kategorie VARCHAR(255) DEFAULT '',
      frage TEXT NOT NULL,
      antwort TEXT NOT NULL,
      punkte INT DEFAULT 1,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (training_id) REFERENCES soc_trainings(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_routes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      training_id INT NOT NULL,
      strecke_nr INT NOT NULL,
      halt1 VARCHAR(255) DEFAULT '',
      halt2 VARCHAR(255) DEFAULT '',
      halt3 VARCHAR(255) DEFAULT '',
      FOREIGN KEY (training_id) REFERENCES soc_trainings(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_exams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      training_id INT NOT NULL,
      candidate_name VARCHAR(255) NOT NULL,
      examiner_id INT DEFAULT NULL,
      examiner_name VARCHAR(255) NOT NULL,
      strecke_nr INT DEFAULT NULL,
      status VARCHAR(30) DEFAULT 'in_bearbeitung',
      notes TEXT DEFAULT '',
      total_points INT DEFAULT 0,
      max_points INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (training_id) REFERENCES soc_trainings(id) ON DELETE CASCADE,
      FOREIGN KEY (examiner_id) REFERENCES soc_users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_exam_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      question_id INT DEFAULT NULL,
      frage TEXT NOT NULL,
      max_punkte INT DEFAULT 1,
      punkte_erreicht INT DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES soc_training_exams(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES soc_training_questions(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_locks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_name VARCHAR(255) NOT NULL,
      ausbilder VARCHAR(255) DEFAULT '',
      bis_datum DATE NOT NULL,
      bis_uhrzeit TIME NOT NULL,
      aussteller VARCHAR(255) NOT NULL,
      grund TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS soc_dienstvorschriften (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(255) DEFAULT 'SOC Interne Vorschriften',
      title VARCHAR(255) DEFAULT '',
      content LONGTEXT NOT NULL,
      is_signature TINYINT DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const sql of tables) {
      await query(sql);
    }
    console.log('Database tables initialized successfully.');

    // Migrations — add columns to existing tables if not present
    try {
      await query("ALTER TABLE soc_users ADD COLUMN rang VARCHAR(255) DEFAULT 'SOC-Mitglied'");
    } catch { /* column already exists */ }

    // Superseded by soc_users.rang — drop leftover table from an earlier schema version
    try {
      await query('DROP TABLE IF EXISTS soc_members');
    } catch { /* ignore */ }

    try {
      await query('ALTER TABLE soc_trainings ADD COLUMN bestehen_prozent INT DEFAULT 80');
    } catch { /* column already exists */ }

    try {
      await query("ALTER TABLE soc_trainings ADD COLUMN aufgaben_titel VARCHAR(255) DEFAULT 'Fragen / Aufgaben'");
    } catch { /* column already exists */ }

    try {
      await query("ALTER TABLE soc_trainings ADD COLUMN strecken_titel VARCHAR(255) DEFAULT 'Strecken'");
    } catch { /* column already exists */ }

    // Backfill for installs seeded before aufgaben_titel existed
    try {
      await query("UPDATE soc_trainings SET aufgaben_titel = 'Bewertungskriterien' WHERE slug = 'schiessen-praxis' AND aufgaben_titel = 'Fragen / Aufgaben'");
    } catch { /* ignore */ }

    const existing: any = await query('SELECT id FROM soc_users WHERE username = ?', ['admin']);
    if (!existing || existing.length === 0) {
      const { hashPassword } = await import('./auth');
      const hash = hashPassword('admin123');
      const defaultPerms = JSON.stringify({ admin: true });
      await query(
        'INSERT INTO soc_users (username, password_hash, display_name, role, permissions) VALUES (?, ?, ?, ?, ?)',
        ['admin', hash, 'Administrator', 'admin', defaultPerms]
      );
      console.log('Default admin account created (admin / admin123)');
    }

    await seedTrainings();
    await seedSchiessenCriteria();
    await seedDienstvorschriften();
  } catch (error) {
    console.error('Failed to initialize tables:', error);
  }
}

async function seedTrainings() {
  const existing: any = await query('SELECT id FROM soc_training_categories WHERE slug = ?', ['soc-pruefung']);
  if (existing && existing.length > 0) return;

  const catResult: any = await query(
    'INSERT INTO soc_training_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)',
    [
      'SOC Prüfung',
      'soc-pruefung',
      'In den einzelnen Bereichen wird genau erklärt, welche Inhalte vermittelt werden, was die Teilnehmer wissen müssen und wie die jeweiligen Prüfungen durchgeführt und bewertet werden. Bitte achten Sie darauf, sich regelmäßig über Änderungen und neue Informationen zu informieren.',
      1
    ]
  );
  const categoryId = catResult.insertId;

  const fahrenResult: any = await query(
    `INSERT INTO soc_trainings (category_id, title, slug, benoetigte_mittel, info_teilnehmer, info_pruefer, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      'Fahren – Theorie – Ortskunde',
      'fahren-theorie-ortskunde',
      'Buffalo S LSPD',
      'Dieses Modul besteht aus Theorie, Ortskunde und einem anschließenden 10-80.\n\nZuerst werden die Theorie und die Ortskunde während einer gemeinsamen Fahrt durchgeführt. Der Prüfer sitzt neben dem Teilnehmer und nennt ihm verschiedene Orte, die er selbstständig anfahren muss. Während der Fahrt stellt der Prüfer zusätzlich Theoriefragen, die direkt beantwortet werden müssen.\n\nNachdem die Theorie und Ortskunde abgeschlossen sind, wird das 10-80 durchgeführt. Dabei muss der Teilnehmer zeigen, dass er sein Fahrzeug kontrollieren und eine Verfolgung richtig durchführen kann.\n\nDas Ziel ist, dass jeder Teilnehmer sich gut in der Stadt auskennt, das nötige Grundwissen besitzt und ein 10-80 sicher durchführen kann.',
      'Pro genanntem Ort werden 2-3 Theoriefragen gestellt.\n\nEs werden nur Straßen benutzt! (nicht Offroad)',
      1
    ]
  );
  const fahrenId = fahrenResult.insertId;

  const questions: [string, string, string, number][] = [
    ['', 'Wann werden non-letale Waffen eingesetzt?', 'Wenn der TV keine öffentliche Bedrohung darstellt.', 1],
    ['', 'Ab wann darf man scharfe Munition einsetzen?', 'Wenn mein Leben oder das Leben 3ter in Gefahr ist.', 1],
    ['', 'Was muss bei der Benutzung eines Tazers beachtet werden?', 'Eine Ankündigung für den Tazer sowie die Reichweite.', 1],
    ['', 'Was sind non-lethale Waffen?', 'Waffen die keine scharfe Munition besitzen, zb. SMG, Tazer.', 1],
    ['', 'Nenne mir 3 Lethale Waffen, die du bei dir tragen darfst im Streifendienst.', 'Advancedrifle, Bullpuprifle, HeavyPistol', 1],
    ['', 'Was tust du bei einem 11-99?', 'SAHP einzelbesetzen und mich in den Einsatz eintragen.', 1],
    ['', 'Wie ist dein Vorgehen wenn eine Staatsbank gemeldet wird?', 'SAHP einzelbesetzen, in den Einsatz eintragen, Informieren lassen ob EL/VF benötigt wird.', 1],
    ['', 'Welche Fahrzeuge darfst du bei einem Einsatz (11-99, Staatsbank, Juwe) auspacken?', 'Ranggerechtes Fahrzeug, SAHP, S.', 1],
    ['', 'Wann darf aus einem Fahrzeug geschossen werden?', 'Wenn Rang 7+ die Schussfreigabe, auf andere Fahrzeuge erteilt.', 1],
    ['', 'Warum ist es wichtig die gegnerische Masse zu Flankieren? (Team)', 'Um die gegnerische Masse ins Kreuzfeuer zu nehmen und bessere Positionen zu erhalten.', 1],
    ['', 'Wann sollte man einen 11-99 Einsatz auf machen?', 'Bei hoch Risiko Einsätzen sowie einer hohen Bedrohungslage.', 1],
    ['', 'Was ist der unterschied zwischen einem 11-90 und einem 11-99?', '11-90 Officer in Bedrängniss, 11-99 Officer unter Beschuss.', 1],
  ];
  for (let i = 0; i < questions.length; i++) {
    const [kategorie, frage, antwort, punkte] = questions[i];
    await query(
      'INSERT INTO soc_training_questions (training_id, kategorie, frage, antwort, punkte, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [fahrenId, kategorie, frage, antwort, punkte, i + 1]
    );
  }

  const routes: [number, string, string, string][] = [
    [1, 'Wellendach', 'Papierfabrik', 'Taxi Zentrale'],
    [2, 'Vinewood Fernseher', 'Arcadius Tower', 'Schleife'],
    [3, 'Altes Bennys', 'LCN Preset Kreuzung', 'Vinewood Plaza'],
    [4, 'ICA Tower', 'Alte SWAT Garage', 'Fleischerei'],
    [5, 'Gerichtsgebäude', 'Little Tokyo', 'Altes DPOS'],
  ];
  for (const [strecke, h1, h2, h3] of routes) {
    await query(
      'INSERT INTO soc_training_routes (training_id, strecke_nr, halt1, halt2, halt3) VALUES (?, ?, ?, ?, ?)',
      [fahrenId, strecke, h1, h2, h3]
    );
  }

  await query(
    `INSERT INTO soc_trainings (category_id, title, slug, benoetigte_mittel, info_teilnehmer, info_pruefer, sort_order, aufgaben_titel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      'Schießen – Praxis',
      'schiessen-praxis',
      '',
      'Das komplette Modul findet in der Arena statt.\n\nDem Teilnehmer wird gezeigt, wie Deckungen richtig benutzt werden. Dabei wird darauf geachtet, dass er nicht unnötig offen steht, möglichst wenig Angriffsfläche bietet und seine Position sinnvoll wählt.\n\nAußerdem werden der Right Peek und der Left Peek erklärt. Der Teilnehmer lernt, wie beide Seiten einer Deckung richtig benutzt werden und welche Seite sich in der jeweiligen Situation besser eignet.\n\nZusätzlich wird der Weapon Switch trainiert. Dabei wird gezeigt, wie schnell und sinnvoll zwischen den verschiedenen Waffen gewechselt wird.\n\nAuch die Waffenregularien werden erklärt. Der Teilnehmer muss wissen, welche Waffen er mit seinem Rang benutzen darf und wann nicht-tödliche oder tödliche Waffen eingesetzt werden dürfen.\n\nZum Abschluss wird ein 10-80 mit Beschuss durchgeführt. Dabei muss der Teilnehmer zeigen, dass er auch während einer Verfolgung unter Beschuss sein Fahrzeug kontrollieren, die Situation richtig einschätzen und angemessen reagieren kann.\n\nDas Ziel ist, dass der Teilnehmer Deckungen richtig benutzt, Right Peek und Left Peek versteht, sicher zwischen seinen Waffen wechseln kann, die Waffenregularien kennt und auch bei einem 10-80 mit Beschuss richtig handelt.',
      'Der praktische Teil findet komplett in der Arena statt.',
      2,
      'Bewertungskriterien'
    ]
  );

  await query(
    `INSERT INTO soc_trainings (category_id, title, slug, benoetigte_mittel, info_teilnehmer, info_pruefer, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      'Waffenregelungen',
      'waffenregelungen',
      '',
      'Inhalte werden in Kürze ergänzt.',
      '',
      3
    ]
  );

  await query(
    `INSERT INTO soc_trainings (category_id, title, slug, benoetigte_mittel, info_teilnehmer, info_pruefer, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      'Gamesense und grundlegendes Einsatzverhalten',
      'gamesense-einsatzverhalten',
      '',
      'Inhalte werden in Kürze ergänzt.',
      '',
      4
    ]
  );

  console.log('Ausbildungs-Grunddaten (SOC Prüfung) angelegt.');
}

// Bewertungskriterien für den praktischen Teil "Schießen – Praxis" — als Fragenkatalog
// modelliert, damit derselbe Punktevergabe-Mechanismus wie bei Theoriefragen genutzt werden kann.
async function seedSchiessenCriteria() {
  const rows: any = await query("SELECT id FROM soc_trainings WHERE slug = 'schiessen-praxis'");
  if (!rows || rows.length === 0) return;
  const trainingId = rows[0].id;

  const existing: any = await query('SELECT COUNT(*) as c FROM soc_training_questions WHERE training_id = ?', [trainingId]);
  if (existing[0].c > 0) return;

  const criteria: [string, string][] = [
    ['Deckung – Position & Nutzung', 'Steht nicht unnötig offen, bietet möglichst wenig Angriffsfläche und wählt seine Position sinnvoll.'],
    ['Right Peek', 'Nutzt die rechte Seite einer Deckung korrekt in den dafür geeigneten Situationen.'],
    ['Left Peek', 'Nutzt die linke Seite einer Deckung korrekt in den dafür geeigneten Situationen.'],
    ['Weapon Switch', 'Wechselt schnell und sinnvoll zwischen seinen Waffen.'],
    ['Waffenregularien', 'Kennt die für seinen Rang erlaubten Waffen sowie den Unterschied zwischen non-lethal und lethal.'],
    ['10-80 mit Beschuss', 'Kontrolliert das Fahrzeug auch unter Beschuss, schätzt die Lage richtig ein und reagiert angemessen.'],
  ];

  for (let i = 0; i < criteria.length; i++) {
    const [frage, antwort] = criteria[i];
    await query(
      'INSERT INTO soc_training_questions (training_id, kategorie, frage, antwort, punkte, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [trainingId, 'Praxis', frage, antwort, 1, i + 1]
    );
  }

  console.log('Bewertungskriterien für "Schießen – Praxis" angelegt.');
}

type DvBlock = { type: 'p' | 'li'; text: string; highlight?: boolean; children?: { text: string; highlight?: boolean }[] };

async function seedDienstvorschriften() {
  const existing: any = await query("SELECT COUNT(*) as c FROM soc_dienstvorschriften WHERE category = 'SOC Interne Vorschriften'");
  if (existing[0].c > 0) return;

  const sections: { title: string; blocks: DvBlock[] }[] = [
    {
      title: 'Allgemeine Richtlinien',
      blocks: [
        { type: 'p', text: 'Diese Vorschriften regeln die Arbeitsweise und Aufgabenbereiche der Special Operations Command (SOC) innerhalb des Los Santos Police Department.' },
        { type: 'li', text: 'SOC-Mitglieder sind dazu verpflichtet, den jeweils für sie im Dienstblatt hinterlegten Aufgabenbereichen eigenständig und zuverlässig nachzukommen.' },
        { type: 'li', text: 'Bei Änderungs- oder Anpassungsbedarf der zugewiesenen Aufgaben ist eigenständig die SOC-Leitung zu kontaktieren.' },
        { type: 'li', text: 'Das interne Cap der SOC liegt bei 10 Mitgliedern, ausgenommen der Leitungsebene.' },
      ],
    },
    {
      title: 'Einsatzleitung & Koordination',
      blocks: [
        { type: 'li', text: 'SOC-Mitglieder übernehmen vorrangig die Einsatzleitung sowie die Einsatzkoordination.' },
        { type: 'li', text: 'Zentrale Positionen wie die Einsatzleitung (EL), Taktikführung (TKF) sowie weitere einsatzrelevante Führungs- und Unterstützungsfunktionen sind durch geeignete Kräfte zu besetzen.' },
        { type: 'li', text: 'Die Verhandlungsführung (VHF) entfällt als feste Aufgabe innerhalb der SOC. Diese Aufgabe ist grundsätzlich durch geeignete Kräfte des LSPD zu übernehmen. Findet sich kein Freiwilliger, entscheidet die jeweilige Einsatzleitung über die Besetzung.' },
        { type: 'li', text: 'Ab 18:00 Uhr ist durch die SOC-Leitung oder, sofern diese nicht verfügbar ist, durch ein SOC-Mitglied zu kommunizieren, welche Kräfte die relevanten Positionen übernehmen. Die Streifen sind entsprechend ihrer Funktion zu benennen.' },
        {
          type: 'li', text: 'Folgende Rollen sind hierbei nach Möglichkeit zu besetzen und in der Streifen App entsprechend kenntlich zu machen:',
          children: [
            { text: 'Main Caller, z. B. „Davis 1 - TKF“' },
            { text: 'Second Caller, z. B. „Davis 1 - Second TKF“' },
            { text: 'Main Heli, z. B. „Air Support 1 - SOC“' },
            { text: 'Second Heli, z. B. „Davis 1 - Second Heli“' },
            { text: 'Einsatzleitung, z. B. „Davis 1 - EL“' },
          ],
        },
        { type: 'li', text: 'Ab 18:00 Uhr ist zusätzlich eine EL-Streife zu bilden. Diese ist für spontane Einsatzlagen, beispielsweise bei kurzfristigen Eingriffen in laufende Einsatzsituationen, direkt zuständig. Bei geplanten Szenarien hat die EL-Streife zu prüfen, ob eine andere geeignete Person die Einsatzleitung übernehmen möchte oder diese für den Einsatz benötigt wird. Ist dies nicht der Fall, übernimmt die EL-Streife selbständig die Einsatzleitung.' },
        { type: 'li', text: 'Wird die Einsatzleitung nicht durch ein SOC-Mitglied übernommen, ist sicherzustellen, dass diese den Einsatz korrekt und nach den geltenden Vorgaben durchführt.' },
        { type: 'li', text: 'Im Bedarfsfall kann die ausführende Einsatzleitung durch ein SOC-Mitglied unterstützt werden.' },
        { type: 'li', text: 'Sollte es jedoch zu erheblichen Fehlentscheidungen oder massiven Mängeln in der Einsatzführung kommen, ist ein SOC-Mitglied berechtigt, die Einsatzleitung abzusetzen und zu übernehmen, sofern es sich nicht um ein Supervisor- oder Direktionsmitglied bzw. ein Mitglied des FIB handelt.' },
        { type: 'li', text: 'Einsätze sind korrekt und eindeutig zu benennen. Einsätze dürfen nicht pauschal als 11-99 erstellt werden, sofern es sich nicht tatsächlich um einen 11-90/99 handelt. Die Einsatzbezeichnung hat dem tatsächlichen Einsatzgrund zu entsprechen.' },
        { type: 'li', text: 'Gebiete sind, solange der Fight noch nicht begonnen hat, zugunsten eines 11-99 oder auf Anweisung der SOC-Leitung bzw. Direktion fallen zu lassen. Das Leben der Kollegen sowie die Priorität eines 11-99 stehen hierbei über dem Gebiet. Die jeweilige Einsatzleitung des Gebietes hat sich vorab im 1000er Funk entsprechend zu erkundigen.' },
        { type: 'li', text: 'Ziel ist eine klare Struktur, schnelle Entscheidungsfindung sowie eine effektive Kommunikation während des gesamten Einsatzverlaufs.' },
      ],
    },
    {
      title: 'Einsatzbereitschaft & Präsenz',
      blocks: [
        { type: 'li', text: 'Mitglieder der SOC sind verpflichtet, ihre Straßenbezeichnung in der Streifen App den jeweils zugewiesenen Funktionen entsprechend anzupassen.' },
        { type: 'li', text: 'Der Zusatz „- SOC“ ist grundsätzlich der SOC-Leitung vorbehalten, z. B. „Davis 1 - SOC“. Andere SOC-Mitglieder nutzen diesen Zusatz nicht mehr eigenständig, sondern führen stattdessen ausschließlich den ihrer Aufgabe entsprechenden Funktion Zusatz, beispielsweise „- TKF“, „- Second TKF“, „- EL“ oder „- Second Heli“.' },
        { type: 'li', text: 'Während der Zeit von 18:00 Uhr bis 00:00 Uhr soll nach Möglichkeit dauerhaft ein Air Support durch ein SOC-Mitglied besetzt und einsatzbereit gehalten werden. Die Besetzung kann je nach Lage eigenständig oder zu zweit erfolgen.' },
        { type: 'li', text: 'Der Main Heli ist entsprechend in der Streifen App zu benennen, beispielsweise „Air Support 1 - SOC“. Ein möglicher Second Heli ist ebenfalls entsprechend seiner Funktion zu kennzeichnen.' },
        { type: 'li', text: 'SOC-Mitglieder haben ihre zugewiesenen Aufgaben aktiv wahrzunehmen und eigenständig zu verfolgen. Hierzu wählt jedes Mitglied eine Hauptaufgabe sowie eine Nebenaufgabe.' },
        {
          type: 'li', text: 'Verfügbare Aufgaben innerhalb der SOC sind insbesondere:',
          children: [
            { text: 'Taktikführung' },
            { text: 'Air Support' },
            { text: 'Einsatzleitung' },
          ],
        },
        { type: 'li', text: 'Die gewählten Haupt- und Nebenaufgaben sind aktiv auszuführen. Sollte die SOC-Leitung feststellen, dass Aufgaben nicht oder nicht ausreichend verfolgt werden, können entsprechende Maßnahmen bis hin zum Ausschluss aus der SOC erfolgen.' },
        { type: 'li', text: 'SOC-Mitglieder sollten mindestens zwei der genannten Aufgabenbereiche sinnvoll abdecken können. Sollte dies dauerhaft nicht der Fall sein, ist eigenständig zu prüfen, ob die SOC weiterhin die passende Abteilung ist.' },
      ],
    },
    {
      title: 'Dokumentation & Nachverfolgung',
      blocks: [
        { type: 'li', text: 'Alle Einsätze sind verpflichtend im 11-99-Tracking im Discord zu erfassen.' },
        { type: 'li', text: 'Zusätzlich müssen Großeinsätze in der Einsatzzentrale im Dienstblatt dokumentiert werden.' },
        { type: 'li', text: 'Jedes Mitglied der SOC ist unabhängig von seiner Rolle (Einsatzleitung) dazu verpflichtet, Einsätze entsprechend zu dokumentieren. Befinden sich mehrere SOC-Mitglieder im Einsatz, ist im Vorfeld eine Absprache zu treffen, um doppelte oder fehlerhafte Einträge zu vermeiden und eine korrekte Dokumentation sicherzustellen.' },
        { type: 'li', text: 'Eine lückenlose Dokumentation ist essentiell für Nachbereitung und interne Abläufe.' },
      ],
    },
    {
      title: 'Sonderfreigaben',
      blocks: [
        { type: 'li', text: 'SOC-Mitglieder sind berechtigt, spezielle Maskierungen sowie dienstliche Bekleidung, Schutzausrüstung und unter Umständen auch gewisse Fahrzeuge zu nutzen.' },
        {
          type: 'li', text: 'Die TKF welche die SOC stellt, ist dazu berechtigt, den E-GT als TKF Fahrzeug zu nutzen.', highlight: true,
          children: [
            { text: 'Eine dauerhafte Streifendienst Freigabe für den EGT ist ausgeschlossen!', highlight: true },
          ],
        },
        { type: 'li', text: 'Zugelassen ist die sogenannte „Schlauchtuch Schwarz“ Maske als Teil der taktischen Ausstattung.' },
        { type: 'li', text: 'Im regulären Streifendienst dürfen SOC-Mitglieder zudem graue Kleidung, insbesondere die graue Anzugshose sowie den grauen Rollkragenpullover, ausschließlich in Kombination tragen. Ebenfalls freigegeben ist hierbei das Oberteil „Triluroprotex Schwarz/Grau“.' },
        { type: 'li', text: 'Des Weiteren sind SOC-Mitglieder berechtigt, die SOC-Schutzweste aus dem Waffenschrank zu entnehmen und im Dienst zu tragen.' },
      ],
    },
  ];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    await query(
      'INSERT INTO soc_dienstvorschriften (category, title, content, is_signature, sort_order) VALUES (?, ?, ?, ?, ?)',
      ['SOC Interne Vorschriften', s.title, JSON.stringify(s.blocks), 0, i + 1]
    );
  }

  await query(
    'INSERT INTO soc_dienstvorschriften (category, title, content, is_signature, sort_order) VALUES (?, ?, ?, ?, ?)',
    [
      'SOC Interne Vorschriften',
      '',
      JSON.stringify([{ type: 'p', text: 'Stand 12.06.2026 - Daniel Hebel-Jameson / Sean Laguno-Pulsfort' }]),
      1,
      sections.length + 1,
    ]
  );

  console.log('SOC Interne Vorschriften (Dienstvorschriften) angelegt.');
}
