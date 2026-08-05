import mysql from 'mysql2/promise';

// In dev mode, Next.js re-evaluates this module on every hot-reload. Without caching the
// pool on `globalThis`, each reload would open a fresh set of connections without closing
// the old ones, eventually exhausting MySQL's max_connections.
const globalForDb = globalThis as unknown as { socDbPool?: mysql.Pool };

const pool = globalForDb.socDbPool ?? mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'soc',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

if (process.env.NODE_ENV !== 'production') {
    globalForDb.socDbPool = pool;
}

export async function query(sql: string, values?: any[]) {
    try {
        const [results] = await pool.query(sql, values);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export default pool;
