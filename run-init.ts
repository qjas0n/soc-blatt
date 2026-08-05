import { initDb } from './src/lib/init-db';

initDb().then(() => {
    console.log('Done.');
    process.exit(0);
}).catch((err: any) => {
    console.error(err);
    process.exit(1);
});
