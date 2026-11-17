# Hosting on Cloudflare Workers

The site is static files in `dist/` plus one small server-side piece: a Cloudflare Worker
(`worker/index.ts`) that answers the contact form at `/api/contact` (`worker/contact.ts`) and emails each
enquiry to the shop through [Resend](https://resend.com). Every other address is served straight from the
static files. `wrangler.jsonc` holds the settings; with it in the repository Cloudflare deploys exactly that,
rather than setting the project up on its own.

## 1. The Worker project

The project is `cleary-custom-cabinets` under **Workers & Pages**, connected to
`johnwcleary/cleary-custom-cabinets` on GitHub.

- Production branch: `main`. Every push to `main` builds and deploys the live site.
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The Worker also answers Storyblok's publish webhook at `/api/storyblok`; see [storyblok.md](storyblok.md#publishing)
for its two secrets.

The `workers.dev` address (`cleary-custom-cabinets.johnwilliamcleary.workers.dev`) works for testing and is
kept out of Google by `public/_headers`. Old Squarespace addresses redirect through `public/_redirects`.

To run the Worker on your own machine, with the real form handler: `npm run build`, then
`npx wrangler dev`, with the settings below in a `.dev.vars` file (git ignores it).

## 2. Set up sending in Resend

1. Make a Resend account and add the domain `clearycustomcabinets.com` under **Domains**.
2. Add the DNS records Resend shows (they let it send as the domain without landing in spam), wherever
   the domain's DNS is managed. Wait for Resend to show the domain as verified.
3. Under **API Keys**, create a key with sending access only.

The free plan covers 3,000 emails a month (100 a day), far more than the form needs.

## 3. Give the Worker its settings

In the Worker: **Settings → Variables and Secrets**:

| Name | Value | |
|---|---|---|
| `RESEND_API_KEY` | the key from Resend | Type **Secret** |
| `CONTACT_TO` | where enquiries go | Optional. Defaults to `info@clearycustomcabinets.com` |
| `CONTACT_FROM` | the sender shown in the inbox | Optional. Defaults to `Cleary Custom Cabinets website <website@clearycustomcabinets.com>`; must be on the verified domain |

Secrets take effect straight away; `keep_vars` in `wrangler.jsonc` keeps them when the site redeploys.

## 4. Test it

On the `workers.dev` or live address, send an enquiry from the contact page with your own email and check that:

- the form shows "Thanks, we got your message" in place of the fields;
- the email arrives at `CONTACT_TO`, with the subject "Website enquiry from …";
- pressing Reply addresses the email you typed.

If it does not arrive, **Workers & Pages → the project → Logs** (turn on real-time logs) shows the reason
(lines starting `contact:`). Visitors see a message asking them to call instead.

## What the form handler does

- Accepts posts only from the site itself.
- Requires a name and a phone number or email; the project description is optional.
- Throws away anything that fills in the hidden "company" field, which only bots see, while telling
  them it worked.
- Answers in JSON for the form's script. A visitor without JavaScript goes to `/thanks/` (kept out of
  search results and the sitemap), or to a short page explaining what went wrong.

