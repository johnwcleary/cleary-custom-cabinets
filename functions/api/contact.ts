/**
 * The contact form's backend: a Cloudflare Pages Function at /api/contact. It checks the three
 * questions, drops anything that filled in the hidden "company" field (only bots see it), and emails
 * the enquiry to the shop through Resend (https://resend.com).
 *
 * The form sends with JavaScript and asks for JSON, so the visitor stays on the page. Without
 * JavaScript the browser posts normally and is sent on to /thanks/, or shown a short error page.
 *
 * Settings, in Cloudflare Pages → Settings → Variables and Secrets (see docs/hosting.md):
 *   RESEND_API_KEY  required, a secret
 *   CONTACT_TO      where enquiries go; defaults to the shop's address
 *   CONTACT_FROM    the sender, on a domain verified in Resend
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}
type Context = { request: Request; env: Env };

const TO = 'info@clearycustomcabinets.com';
const FROM = 'Cleary Custom Cabinets website <website@clearycustomcabinets.com>';
const PHONE = '516.939.2475';
const LIMITS = { name: 200, contact: 200, message: 5000 };

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const reply = (ok: boolean, error = '') =>
    wantsJson
      ? Response.json(ok ? { ok } : { ok, error }, { status: ok ? 200 : 400 })
      : ok
        ? Response.redirect(new URL('/thanks/', request.url).href, 303)
        : errorPage(error);

  // Only the site's own pages may post here.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply(false, 'This form can only be sent from our website.');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(false, 'The form could not be read.');
  }
  const field = (k: string) => String(form.get(k) ?? '').trim();
  const name = field('name');
  const contact = field('contact');
  const message = field('message');

  // A bot filled in the hidden field: act as if it worked, and send nothing.
  if (field('company')) return reply(true);

  if (!name || !contact) return reply(false, 'Please add your name and a phone number or email.');
  if (name.length > LIMITS.name || contact.length > LIMITS.contact || message.length > LIMITS.message) return reply(false, 'That message is too long to send.');

  if (!env.RESEND_API_KEY) {
    console.error('contact: RESEND_API_KEY is not set');
    return reply(false, `Sorry, your message did not send. Please call us at ${PHONE}.`);
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const page = request.headers.get('referer') ?? '';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || FROM,
      to: [env.CONTACT_TO || TO],
      // Pressing Reply answers the visitor, when they gave an email.
      ...(isEmail ? { reply_to: contact } : {}),
      subject: `Website enquiry from ${name}`,
      text: [`Name: ${name}`, `${isEmail ? 'Email' : 'Phone or email'}: ${contact}`, '', message || '(No message)', ...(page ? ['', `Sent from ${page}`] : [])].join('\n'),
    }),
  });
  if (!res.ok) {
    console.error('contact: Resend replied', res.status, await res.text());
    return reply(false, `Sorry, your message did not send. Please try again, or call us at ${PHONE}.`);
  }
  return reply(true);
}

/** For a visitor without JavaScript whose message did not go: the reason, the phone number and a way back. */
function errorPage(error: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Message not sent — Cleary Custom Cabinets</title><style>body{font:1.125rem/1.5 system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;color:#1c1a19}a{color:#2c5d82}</style></head><body><h1>Your message was not sent</h1><p>${esc(error)}</p><p><a href="/contact/">Go to the contact form</a> or call us at <a href="tel:+15169392475">${PHONE}</a>.</p></body></html>`;
  return new Response(html, { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
