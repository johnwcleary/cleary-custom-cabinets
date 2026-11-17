# Storyblok

Storyblok is where the customer edits the site's words, photos, hours and brand lists. The site itself
does not change: a **pull** step copies the content from Storyblok into `src/content/` and `src/assets/`
in exactly the format the site already reads, then Astro builds as before.

```
Storyblok  ──cms:pull──▶  src/content/*.md|json + src/assets/**  ──astro build──▶  static site
```

## What the customer sees

| In Storyblok | Edits | Becomes |
|---|---|---|
| **Business details** | announcement bar (optional promotion), footer tagline, name, phone, email, address, showroom hours, services, clients, social links | `src/content/site.json` |
| **Home** | every section in page order: top (headline, photo), About us, Cabinets & products label, Materials lists, Showroom, Contact; plus button labels | `pages/home.md` |
| **About** | about-us text, photos with captions | `pages/about.md` |
| **Contact** | introduction, note under the message box | `pages/contact.md` |
| **Cabinet pages** (folder, 7 pages) | title, short name (home tiles and menu), sentences, main photo, photos (drag to reorder, "Show large" toggle), video | `services/*.md`, `gallery/<page>/*.json` |
| **Lines we distribute** | groups and brands with links | `brands/brands.json` |

Fields a customer should not need (Google titles, old-site addresses, menu order) are on a separate
**Search engines** tab. The phone link and the map link are worked out from the phone and address, so
there is nothing technical to keep in sync.

## Setting up a space from scratch

1. Sign up at [storyblok.com](https://www.storyblok.com) and create a space on the free **Starter** plan
   (Visual Editor included; one seat, up to two: you and the customer). Name it *Cleary Custom Cabinets*
   and pick a server location; set `STORYBLOK_REGION` to match (`eu`, `us`, `ca` or `ap`).
2. Copy `.env.example` to `.env` and fill in:
   - **Space ID**: Settings → Space.
   - **Preview token**: Settings → Access Tokens.
   - **Personal access token**: My Account → Personal access tokens → Generate. Used once for the
     migration below; delete it in Storyblok afterwards.
3. Migrate the current content (creates the editing screens, uploads 173 photos, creates 12 pages, publishes):
   ```bash
   npm run cms:push -- --dry-run   # what it will do
   npm run cms:push
   ```
4. Pull it back and confirm nothing changed:
   ```bash
   npm run cms:pull && git status --short
   ```
   Only `.storyblok/assets.json` (the record of which photo came from where) should be new.

## Editing with the Visual Editor (local, for now)

```bash
npm run cms:preview
```

Open <https://localhost:4322> once in your browser and accept the certificate warning (the certificate
is generated locally and is not installed anywhere). Then open any page in Storyblok: the site appears
beside the form. Changes show on the page shortly after you stop typing, and again when you save.
Saved changes go live only when you press **Publish** and the site is rebuilt.

The preview runs on port 4322 so it can sit beside the normal `npm run dev` on 4321. Restart it after changing anything in `scripts/storyblok/`.

## Day-to-day commands

| Command | Does |
|---|---|
| `npm run cms:pull` | Writes the **published** content into `src/content/` |
| `npm run cms:pull -- --draft` | Includes saved-but-unpublished changes |
| `npm run cms:preview` | Visual Editor preview at https://localhost:4322 |
| `npm run cms:check` | Offline test that the mapping reproduces `src/content/` exactly (no account needed) |

Once Storyblok is in use, **content is edited there, not in `src/content/`**: the next pull overwrites
hand edits. Code and design changes are unaffected.

## Publishing

Pressing **Publish** in Storyblok updates the live site in a few minutes:

```
Storyblok ──webhook──▶ Worker /api/storyblok ──▶ GitHub job "Storyblok publish" ──commit──▶ main ──▶ Cloudflare deploy
```

The Worker (`worker/storyblok.ts`) checks the webhook's signature and starts the GitHub job
(`.github/workflows/storyblok-publish.yml`). The job runs `cms:pull`, checks the site still builds, and commits the
changes to `main` as "Storyblok: content published …". If the build fails nothing is committed and the live site keeps
its last version; GitHub emails the repository owner. The job can also be run by hand: GitHub → Actions → Storyblok
publish → Run workflow.

One-time setup, three secrets:

1. **GitHub token for the Worker.** GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
   tokens → Generate. Repository access: only `johnwcleary/cleary-custom-cabinets`. Permissions: **Actions: Read and
   write** (nothing else). Add it to the Worker as a secret named `GITHUB_DISPATCH_TOKEN` (Workers & Pages →
   cleary-custom-cabinets → Settings → Variables and Secrets).
2. **Storyblok token for the job.** Storyblok → Settings → Access Tokens: the *Public* token (or the Preview token).
   Add it to GitHub as a repository secret named `STORYBLOK_TOKEN` (repository → Settings → Secrets and variables →
   Actions → New repository secret).
3. **The webhook.** Make up a long random secret (`openssl rand -hex 32`) and add it to the Worker as a secret named
   `STORYBLOK_WEBHOOK_SECRET`. Then Storyblok → Settings → Webhooks → New webhook: endpoint
   `https://www.clearycustomcabinets.com/api/storyblok`, the same secret, and the story triggers *published*,
   *unpublished*, *deleted* and *moved*.

Publish any page to test it; a run appears under GitHub → Actions within a few seconds.

Code changes and Storyblok publishes both land on `main`, so pull before committing code
(`git pull`) to pick up content commits made by the job.

## Not set up yet
- **The customer's preview:** `cms:preview` runs on your Mac, so only you can use it. For the customer
  the Visual Editor needs a preview address on the internet: either an always-on preview server
  running the same code, or a preview build that refreshes on save (slower, about a minute per change).
  To be decided with the host.
- **Click-to-select on the page:** clicking a photo or heading in the preview to jump to its field needs
  small markers in the chosen design's templates.
- Invite the customer as the second seat (Settings → Collaborators).
