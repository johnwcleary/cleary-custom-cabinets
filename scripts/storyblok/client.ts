/**
 * Storyblok connection settings, read from .env (never committed). See docs/storyblok.md.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import StoryblokClient from 'storyblok-js-client';
import { ROOT } from './model.ts';

const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export const region = process.env.STORYBLOK_REGION || 'us';

function need(name: string, hint: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name} in .env — ${hint} See docs/storyblok.md.`);
  return v;
}

/** Content Delivery API: reads stories. The preview token can read drafts; the public token cannot. */
export function delivery() {
  const accessToken = need('STORYBLOK_TOKEN', 'the Preview (or Public) access token from Settings → Access Tokens.');
  return new StoryblokClient({ accessToken, region, cache: { type: 'none' } });
}

/** Management API: creates components, uploads photos, writes stories. Only the one-time push uses it. */
export function management() {
  const oauthToken = need('STORYBLOK_PERSONAL_TOKEN', 'a Personal access token from My Account → Personal access tokens.');
  const spaceId = need('STORYBLOK_SPACE_ID', 'the number shown under Settings → Space.');
  return { client: new StoryblokClient({ oauthToken, region, rateLimit: 3 }), spaceId };
}
