import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist-pages');
const base = process.env.PAGES_BASE || '/Mockup-ERP/';
const port = Number(process.env.PORT || 4174);
if (!/^\/[^?#]*\/$/.test(base)) throw new Error('PAGES_BASE debe tener la forma /repositorio/.');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido.');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) return response.writeHead(404).end('No encontrado');
    const relative = pathname.slice(base.length);
    let file = path.resolve(root, relative || '.');
    if (file !== root && !file.startsWith(`${root}${path.sep}`))
      return response.writeHead(403).end('Prohibido');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end('No encontrado');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Vista previa de Pages: http://127.0.0.1:${port}${base}`);
});
