import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

/** Every route on the site (plus /404, which is served with a 404 status). */
export function routes(): { path: string; name: string }[] {
  const dir = path.join(ROOT, 'src/content/services');
  const services = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => readFileSync(path.join(dir, f), 'utf8').match(/^slug:\s*(.+)$/m)![1].trim());
  const blog = path.join(ROOT, 'src/content/blog');
  const posts = readdirSync(blog)
    .filter((f) => f.endsWith('.md') && !/^draft:\s*true\s*$/m.test(readFileSync(path.join(blog, f), 'utf8')))
    .sort()
    .map((f) => f.replace(/\.md$/, ''));
  return [
    { path: '/', name: 'home' },
    ...services.map((s) => ({ path: `/cabinets/${s}`, name: `cabinets-${s}` })),
    { path: '/blog', name: 'blog' },
    ...posts.map((p) => ({ path: `/blog/${p}`, name: `blog-${p}` })),
    { path: '/about', name: 'about' },
    { path: '/contact', name: 'contact' },
  ];
}
