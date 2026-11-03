# Cleary Custom Cabinets

Website for [Cleary Custom Cabinets](https://www.clearycustomcabinets.com), a family-run custom and
stock cabinetry showroom in Hicksville, NY.

Built with [Astro](https://astro.build) and Tailwind CSS as a static site. Content is edited in
[Storyblok](https://www.storyblok.com) and pulled into `src/content/` before each build.

## Getting started

```bash
npm install
npm run dev          # http://localhost:4321
```

## Content

Words, photos, hours and brand lists live in Storyblok. `npm run cms:pull` writes them into
`src/content/` and `src/assets/` in the format the pages read, so the site builds the same with or
without a Storyblok connection. See [docs/storyblok.md](docs/storyblok.md) for setup, the Visual
Editor preview and the content model.

| Command | Does |
|---|---|
| `npm run cms:pull` | Fetch published content from Storyblok |
| `npm run cms:preview` | Visual Editor preview at https://localhost:4322 |
| `npm run cms:check` | Offline check that the Storyblok mapping round-trips exactly |

Storyblok keys go in `.env` (see `.env.example`); it is never committed.

## Build and test

```bash
npm run build        # static site in dist/
npm run check        # type check
npm run smoke        # Playwright smoke tests (accessibility, keyboard, no external requests)
npm run screenshot   # desktop and mobile screenshots of every route
```

A production build runs `npm run cms:pull && npm run build`.

## Licence

The code is shared for reference. The photographs, text and logo belong to Cleary Custom Cabinets
and may not be reused.
