# Hosting on Cloudflare Pages

The site is static files in `dist/` plus one small server-side piece: the contact form's handler in
`functions/api/contact.ts`, which Cloudflare Pages runs at `/api/contact`. It emails each enquiry to
the shop through [Resend](https://resend.com).

## 1. Create the Pages project

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick
   `johnwcleary/cleary-custom-cabinets`.
2. Production branch: `main`.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Under **Environment variables**, add `NODE_VERSION` = `22`.
5. Save and deploy. Cloudflare picks up the `functions/` folder by itself; there is nothing to switch on.

Every push to `main` deploys the live site, and every other branch gets its own preview address.

## 2. Set up sending in Resend

1. Make a Resend account and add the domain `clearycustomcabinets.com` under **Domains**.
2. Add the DNS records Resend shows (they let it send as the domain without landing in spam), wherever
   the domain's DNS is managed. Wait for Resend to show the domain as verified.
3. Under **API Keys**, create a key with sending access only.

The free plan covers 3,000 emails a month (100 a day), far more than the form needs.

## 3. Give the function its settings

In the Pages project: **Settings → Variables and Secrets**, for Production (and Preview, to test there):

| Name | Value | |
|---|---|---|
| `RESEND_API_KEY` | the key from Resend | Type **Secret** |
| `CONTACT_TO` | where enquiries go | Optional. Defaults to `info@clearycustomcabinets.com` |
| `CONTACT_FROM` | the sender shown in the inbox | Optional. Defaults to `Cleary Custom Cabinets website <website@clearycustomcabinets.com>`; must be on the verified domain |

Then redeploy (**Deployments → … → Retry deployment**) so the function sees them.

## 4. Test it

On the preview or live address, send an enquiry from the contact page with your own email and check that:

- the form shows "Thanks, we got your message" in place of the fields;
- the email arrives at `CONTACT_TO`, with the subject "Website enquiry from …";
- pressing Reply addresses the email you typed.

If it does not arrive, **Workers & Pages → the project → Functions → Real-time logs** shows the reason
(lines starting `contact:`). Visitors see a message asking them to call instead.

## What the function does

- Accepts posts only from the site itself.
- Requires a name and a phone number or email; the project description is optional.
- Throws away anything that fills in the hidden "company" field, which only bots see, while telling
  them it worked.
- Answers in JSON for the form's script. A visitor without JavaScript goes to `/thanks/` (kept out of
  search results and the sitemap), or to a short page explaining what went wrong.

To run it on your own machine with the real function: `npm run build`, then
`npx wrangler pages dev dist`, with the settings above in a `.dev.vars` file (git ignores it).
