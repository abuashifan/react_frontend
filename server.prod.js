/**
 * Production server — serves built frontend and proxies /api to Laravel.
 *
 * Zero external dependencies. Menggantikan Vite dev server yang tidak bisa
 * diandalkan untuk production (HMR WebSocket gagal via Cloudflare Tunnel).
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

const PORT = parseInt(process.env.PORT || '5173', 10);
const DIST = resolve('dist');
const BACKEND = new URL(process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000');
const INDEX_HTML = join(DIST, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function serveFile(res, filePath) {
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

function proxyApi(req, res) {
  const opts = {
    hostname: BACKEND.hostname,
    port: BACKEND.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: BACKEND.host },
  };

  const backendReq = http.request(opts, (backendRes) => {
    res.writeHead(backendRes.statusCode, backendRes.headers);
    backendRes.pipe(res);
  });

  backendReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Backend tidak terjangkau.' }));
  });

  req.pipe(backendReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api')) {
    proxyApi(req, res);
    return;
  }

  const filePath = join(DIST, url.pathname);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  // SPA fallback
  serveFile(res, INDEX_HTML);
});

server.listen(PORT, () => {
  console.log(`Production server on http://0.0.0.0:${PORT}  →  API: ${BACKEND.href}`);
});
