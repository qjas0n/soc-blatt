const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Force production mode for Plesk
process.env.NODE_ENV = 'production';

const dev = false; // Always production
const hostname = '0.0.0.0';
const port = 3069;

console.log('Starting Next.js server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', port);

// Delete lock file if exists
const lockPath = path.join(__dirname, '.next', 'dev', 'lock');
if (fs.existsSync(lockPath)) {
  console.log('Removing stale lock file...');
  fs.rmSync(path.join(__dirname, '.next', 'dev'), { recursive: true, force: true });
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('Next.js app prepared, creating server...');
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});
