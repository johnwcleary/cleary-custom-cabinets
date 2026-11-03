/**
 * Serve dist/ the way a static host would (clean URLs, 404.html for misses).
 *
 *   node scripts/serve.ts [port]
 */
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('serve-handler') as (req: unknown, res: unknown, opts: Record<string, unknown>) => Promise<void>;

const ROOT = path.resolve(import.meta.dirname, '..');

export function serve(port: number) {
  const server = http.createServer((req, res) => handler(req, res, { public: path.join(ROOT, 'dist'), cleanUrls: true, trailingSlash: false }));
  return new Promise<http.Server>((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2] ?? 4321);
  await serve(port);
  console.log(`Serving dist/ at http://127.0.0.1:${port}`);
}
