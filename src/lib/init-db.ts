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

    `CREATE TABLE IF NOT EXISTS soc_training_halt_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      training_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (training_id) REFERENCES soc_trainings(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_halts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      training_id INT NOT NULL,
      category_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      bild VARCHAR(500) DEFAULT NULL,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (training_id) REFERENCES soc_trainings(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES soc_training_halt_categories(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_exams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      training_id INT NOT NULL,
      candidate_name VARCHAR(255) NOT NULL,
      examiner_id INT DEFAULT NULL,
      examiner_name VARCHAR(255) NOT NULL,
      examiner2_name VARCHAR(255) DEFAULT '',
      examiner3_name VARCHAR(255) DEFAULT '',
      status VARCHAR(30) DEFAULT 'in_bearbeitung',
      notes TEXT DEFAULT '',
      total_points INT DEFAULT 0,
      max_points INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (training_id) REFERENCES soc_trainings(id) ON DELETE CASCADE,
      FOREIGN KEY (examiner_id) REFERENCES soc_users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_exam_halts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      halt_id INT DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      bild VARCHAR(500) DEFAULT NULL,
      gefunden TINYINT DEFAULT 0,
      schnellste_route TINYINT DEFAULT 0,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES soc_training_exams(id) ON DELETE CASCADE,
      FOREIGN KEY (halt_id) REFERENCES soc_training_halts(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS soc_training_exam_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      exam_halt_id INT DEFAULT NULL,
      question_id INT DEFAULT NULL,
      frage TEXT NOT NULL,
      antwort TEXT DEFAULT '',
      max_punkte INT DEFAULT 1,
      punkte_erreicht INT DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES soc_training_exams(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_halt_id) REFERENCES soc_training_exam_halts(id) ON DELETE CASCADE,
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

    try {
      await query("ALTER TABLE soc_training_exam_answers ADD COLUMN antwort TEXT DEFAULT ''");
    } catch { /* column already exists */ }

    for (const col of ['examiner2_name', 'examiner3_name']) {
      try {
        await query(`ALTER TABLE soc_training_exams ADD COLUMN ${col} VARCHAR(255) DEFAULT ''`);
      } catch { /* column already exists */ }
    }

    try {
      await query('ALTER TABLE soc_training_exam_answers ADD COLUMN exam_halt_id INT DEFAULT NULL');
    } catch { /* column already exists */ }

    // Superseded by soc_training_halt_categories / soc_training_halts / soc_training_exam_halts —
    // drop the old fixed-3-stop columns and route table from an earlier schema version.
    for (const col of ['strecke_nr', 'halt1_gefunden', 'halt1_schnellste', 'halt2_gefunden', 'halt2_schnellste', 'halt3_gefunden', 'halt3_schnellste']) {
      try {
        await query(`ALTER TABLE soc_training_exams DROP COLUMN ${col}`);
      } catch { /* column doesn't exist */ }
    }

    await migrateRoutesToHaltCategories();

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
    await seedFahrenDienstFragen();
    await seedDienstvorschriften();
  } catch (error) {
    console.error('Failed to initialize tables:', error);
  }
}

// Migrates the old fixed-3-stop "soc_training_routes" table (Strecke -> Halt1/2/3) from an
// earlier schema version into the new soc_training_halt_categories / soc_training_halts
// structure: each stop position becomes its own category ("Kategorie 1/2/3"), preserving
// every previously seeded location name and image. Then drops the now-unused route table.
async function migrateRoutesToHaltCategories() {
  let routes: any;
  try {
    routes = await query('SELECT * FROM soc_training_routes');
  } catch {
    return; // table doesn't exist — fresh install, nothing to migrate
  }
  if (!routes || routes.length === 0) {
    try { await query('DROP TABLE IF EXISTS soc_training_routes'); } catch { /* ignore */ }
    return;
  }

  const trainingIds = [...new Set(routes.map((r: any) => r.training_id))] as number[];
  for (const trainingId of trainingIds) {
    const existingCats: any = await query('SELECT id FROM soc_training_halt_categories WHERE training_id = ?', [trainingId]);
    if (existingCats && existingCats.length > 0) continue;

    const categoryIds: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const catResult: any = await query(
        'INSERT INTO soc_training_halt_categories (training_id, name, sort_order) VALUES (?, ?, ?)',
        [trainingId, `Kategorie ${i}`, i]
      );
      categoryIds.push(catResult.insertId);
    }

    const trainingRoutes = routes.filter((r: any) => r.training_id === trainingId);
    let sortOrder = 0;
    for (const r of trainingRoutes) {
      sortOrder++;
      await query('INSERT INTO soc_training_halts (training_id, category_id, name, bild, sort_order) VALUES (?, ?, ?, ?, ?)', [trainingId, categoryIds[0], r.halt1, r.halt1_bild, sortOrder]);
      await query('INSERT INTO soc_training_halts (training_id, category_id, name, bild, sort_order) VALUES (?, ?, ?, ?, ?)', [trainingId, categoryIds[1], r.halt2, r.halt2_bild, sortOrder]);
      await query('INSERT INTO soc_training_halts (training_id, category_id, name, bild, sort_order) VALUES (?, ?, ?, ?, ?)', [trainingId, categoryIds[2], r.halt3, r.halt3_bild, sortOrder]);
    }
    console.log(`Migrated ${trainingRoutes.length} Strecken zu 3 Halt-Kategorien für Training ID ${trainingId}.`);
  }

  try { await query('DROP TABLE IF EXISTS soc_training_routes'); } catch { /* ignore */ }
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

  // 3 Halt-Kategorien mit je 5 möglichen Standorten. Pro Prüfung werden später 3 Halte je
  // Kategorie zufällig gezogen (9 Standorte insgesamt).
  const haltGroups: string[][] = [
    ['Wellendach', 'Vinewood Fernseher', 'Altes Bennys', 'ICA Tower', 'Gerichtsgebäude'],
    ['Papierfabrik', 'Arcadius Tower', 'LCN Preset Kreuzung', 'Alte SWAT Garage', 'Little Tokyo'],
    ['Taxi Zentrale', 'Schleife', 'Vinewood Plaza', 'Fleischerei', 'Altes DPOS'],
  ];
  for (let g = 0; g < haltGroups.length; g++) {
    const catResult: any = await query(
      'INSERT INTO soc_training_halt_categories (training_id, name, sort_order) VALUES (?, ?, ?)',
      [fahrenId, `Kategorie ${g + 1}`, g + 1]
    );
    const categoryId = catResult.insertId;
    for (let i = 0; i < haltGroups[g].length; i++) {
      await query(
        'INSERT INTO soc_training_halts (training_id, category_id, name, sort_order) VALUES (?, ?, ?, ?)',
        [fahrenId, categoryId, haltGroups[g][i], i + 1]
      );
    }
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

// Zusätzliche Theoriefragen (Kategorie "Dienst") für "Fahren – Theorie – Ortskunde" —
// ergänzt den bestehenden Fragenkatalog, ohne die ursprünglichen 12 Fragen anzutasten.
async function seedFahrenDienstFragen() {
  const rows: any = await query("SELECT id FROM soc_trainings WHERE slug = 'fahren-theorie-ortskunde'");
  if (!rows || rows.length === 0) return;
  const trainingId = rows[0].id;

  const existing: any = await query("SELECT COUNT(*) as c FROM soc_training_questions WHERE training_id = ? AND kategorie = 'Dienst'", [trainingId]);
  if (existing[0].c > 0) return;

  const fragen: [string, string][] = [
    ['Was tust du bei einem 11-99?', 'SAHP einbesetzen und mich in den Einsatz eintragen.'],
    ['Wie ist dein Vorgehen wenn eine Staatsbank gemeldet wird?', 'SAHP einbesetzen, in den Einsatz eintragen und EL/VF abklären.'],
    ['Wann darf aus einem Fahrzeug geschossen werden?', 'Wenn Rang 7+ die Schussfreigabe erteilt.'],
    ['Wann sollte man einen 11-99 Einsatz machen?', 'Bei hohem Risiko oder hoher Bedrohungslage.'],
    ['Was ist der Unterschied zwischen einem 11-90 und einem 11-99?', '11-90 = Officer in Bedrängnis, 11-99 = Officer unter Beschuss.'],
    ['Wodurch darf die Dienstfähigkeit nicht beeinträchtigt sein?', 'Alkohol, Drogen oder schwere Medikamente.'],
    ['Wann beginnt die reguläre Dienstpflicht?', 'Um 16:00 Uhr.'],
    ['Wann endet die reguläre Dienstpflicht?', 'Um 23:59 Uhr.'],
    ['Wann müssen sich alle Beamten unabhängig von der Uhrzeit in den Dienst begeben?', 'Bei Defcon 1 oder 2.'],
    ['Wer kann Beamte zwischen 16:00 und 23:59 Uhr in den Dienst rufen?', 'Ein Beamter Rang 8 oder höher.'],
    ['Wie musst du im Dienst erreichbar sein?', 'Per Funk und Telefon.'],
    ['Wie musst du außerhalb des Dienstes zwischen 16:00 und 23:59 Uhr erreichbar sein?', 'Telefonisch.'],
    ['Was musst du im Dienst immer tragen?', 'Dienstkleidung und vorgeschriebene Bewaffnung.'],
    ['Woran muss die Ausrüstung angepasst werden?', 'Dienstgrad und Gefahrenlage.'],
    ['Welche Kurzwaffe gehört zur Pflichtausrüstung?', 'Heavy Pistol.'],
    ['Wie viele Magazine für die Heavy Pistol musst du mitführen?', 'Mindestens 10.'],
    ['Wie viele Magazine für die SMG musst du mitführen?', 'Mindestens 12.'],
    ['Wie viele Magazine für die Langwaffe musst du mitführen?', 'Mindestens 25.'],
    ['Wie viele Flare-Magazine musst du mitführen?', 'Mindestens 10.'],
    ['Wie viele Verbandskits musst du mitführen?', 'Mindestens 7, maximal 10.'],
    ['Wie viele Westen musst du mindestens mitführen?', 'Mindestens 7.'],
    ['Dürfen nicht freigegebene Ausrüstungsgegenstände genutzt werden?', 'Nein.'],
    ['Wann dürfen Dienstwaffen offen getragen werden?', 'Wenn die Lage es erfordert oder angeordnet wird.'],
    ['Was passiert mit der Dienstausrüstung nach Dienstende?', 'Sie wird im Spind verstaut.'],
    ['Dürfen Dienstwaffen außer Dienst mitgeführt werden?', 'Nein.'],
    ['Wie viele Nagelbänder dürfen regulär mitgeführt werden?', 'Zwei.'],
    ['Wie viele Pfeilabsperrungen dürfen regulär mitgeführt werden?', 'Zwei.'],
    ['Wie viele Werkzeugkästen dürfen regulär mitgeführt werden?', 'Einer.'],
    ['Wer darf zusätzliche Ausrüstung genehmigen?', 'Rang 8+ oder die Einsatzleitung.'],
    ['Ab welchem Rang darf ein Fingerabdrucksensor genutzt werden?', 'Ab Rang 3.'],
    ['Ab welchem Rang ist ein Nagelband Pflicht?', 'Ab Rang 5.'],
    ['Ab welchem Rang darf ein Störsender genutzt werden?', 'Ab Rang 9.'],
    ['Was ist der erste Schritt der Beschwerdekette?', 'Klärendes Gespräch.'],
    ['Wohin geht eine Beschwerde nach dem Gespräch?', 'An das Detective Bureau.'],
    ['Wer wird bei Hochverrat sofort informiert?', 'Die Behördenleitung.'],
    ['Wer darf eigene Blitzer bezahlen?', 'Jeder Beamte.'],
    ['Ab welcher Geschwindigkeit wird der Führerschein entzogen?', 'Ab 100 km/h unter Beachtung der Toleranz.'],
    ['Wie hoch ist die Toleranz beim Führerscheinentzug?', '15 km/h.'],
    ['Wann darf ein Führerschein nach einem Blitzer frühestens entzogen werden?', 'Nach 12 Stunden.'],
    ['Wer muss nichtdienstliche Tätigkeiten genehmigen?', 'Die Direktion (Rang 10+).'],
    ['Ist Slotspielen im Casino während des Dienstes erlaubt?', 'Nein.'],
    ['Wann dürfen Ausbildungen begonnen werden?', 'Nach erfolgreichem EST.'],
    ['Wann muss ein geplanter Großeinsatz dokumentiert werden?', 'Nach Code 4.'],
    ['Wer dokumentiert spontane 11-99-Einsätze?', 'Der höchstrangige Beamte bis Rang 9 vor Ort.'],
    ['Wer muss an einer Dienstbesprechung teilnehmen?', 'Jeder Beamte, der sich im Dienst befindet.'],
  ];

  const maxOrder: any = await query('SELECT MAX(sort_order) as m FROM soc_training_questions WHERE training_id = ?', [trainingId]);
  let sortOrder = maxOrder[0]?.m || 0;

  for (const [frage, antwort] of fragen) {
    sortOrder++;
    await query(
      'INSERT INTO soc_training_questions (training_id, kategorie, frage, antwort, punkte, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [trainingId, 'Dienst', frage, antwort, 1, sortOrder]
    );
  }

  console.log(`${fragen.length} "Dienst"-Fragen für "Fahren – Theorie – Ortskunde" angelegt.`);
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
