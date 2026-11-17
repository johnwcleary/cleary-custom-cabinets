/**
 * The site's Cloudflare Worker. The built pages in dist/ are served as static assets (wrangler.jsonc); the Worker
 * itself only runs for /api/*, where it answers the contact form. Anything else under /api/ is not found.
 */
import { handleContact, type ContactEnv } from './contact.ts';

interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact' || pathname === '/api/contact/') {
      if (request.method === 'POST') return handleContact(request, env);
      return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
    }
    return env.ASSETS.fetch(request);
  },
};
