/**
 * POST /api/storyblok: Storyblok's webhook. When a page is published, unpublished, moved or deleted in Storyblok, it
 * posts here; the Worker checks the request is really from Storyblok and starts the "Storyblok publish" GitHub job
 * (.github/workflows/storyblok-publish.yml), which pulls the content, commits it and so redeploys the site.
 *
 * Settings, as secrets on the Worker (see docs/storyblok.md):
 *   STORYBLOK_WEBHOOK_SECRET  the secret typed into the webhook in Storyblok (Settings → Webhooks)
 *   GITHUB_DISPATCH_TOKEN     a GitHub fine-grained token for this repository with "Actions: read and write"
 */

export interface StoryblokEnv {
  STORYBLOK_WEBHOOK_SECRET?: string;
  GITHUB_DISPATCH_TOKEN?: string;
}

const WORKFLOW = 'https://api.github.com/repos/johnwcleary/cleary-custom-cabinets/actions/workflows/storyblok-publish.yml/dispatches';

export async function handleStoryblok(request: Request, env: StoryblokEnv): Promise<Response> {
  if (!env.STORYBLOK_WEBHOOK_SECRET || !env.GITHUB_DISPATCH_TOKEN) {
    console.error('storyblok: STORYBLOK_WEBHOOK_SECRET or GITHUB_DISPATCH_TOKEN is not set');
    return new Response('Not configured', { status: 503 });
  }

  // Storyblok signs the body with the webhook secret (HMAC-SHA1, hex) in the webhook-signature header.
  const body = await request.text();
  const expected = await hmacSha1Hex(env.STORYBLOK_WEBHOOK_SECRET, body);
  if (!sameText(request.headers.get('webhook-signature') ?? '', expected)) return new Response('Bad signature', { status: 401 });

  let event: { action?: string; full_slug?: string } = {};
  try {
    event = JSON.parse(body);
  } catch {
    /* Storyblok's "test" button can send an empty body; treat it like any other change. */
  }

  const res = await fetch(WORKFLOW, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'cleary-custom-cabinets-worker',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main' }),
  });
  if (!res.ok) {
    console.error('storyblok: GitHub replied', res.status, await res.text());
    return new Response('Could not start the publish job', { status: 502 });
  }
  console.log('storyblok: publish job started for', event.action ?? 'change', event.full_slug ?? '');
  return new Response('Publishing', { status: 202 });
}

async function hmacSha1Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compares without stopping at the first difference, so the timing gives nothing away. */
function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
