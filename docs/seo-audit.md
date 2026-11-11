# SEO audit

10 November 2026. Goal: local search on Long Island for custom and stock cabinets and countertops.

The domain still serves the old Squarespace site (its response header says `server: Squarespace`), so this audit covers the new Astro site as it builds from this repository, plus what has to happen at launch so the switch does not cost rankings. Findings come from the built HTML in `dist/`. I could not check anything that lives outside the repository, such as the Google Business Profile or Search Console.

## What was wrong and is now fixed

| Finding | Fix in this change |
|---|---|
| No structured data. The Squarespace site prints a `LocalBusiness` entry and the new site printed none, so launch would have removed it. | Every page now carries a `HomeAndConstructionBusiness` entry with the name, address, phone, hours, service area and social profiles, built from `site.json` (`src/lib/seo.ts`). |
| All 10 pages shared one 420-character description. Google shows about 155 characters and tends to ignore duplicates. | Cabinet pages use their own intro sentence and the contact page uses its lead. Home, About and Quick Ship still use the site-wide one (see below). |
| "Long Island" appeared on no page. "Nassau" and "Suffolk" appeared only in the hidden description, because the announcement bar replaces the service-area line whenever a promotion is set. | The closing line of the footer now reads "Serving Nassau County, Suffolk County, New York City & beyond" on every page, and the blog uses the place names in its text. |
| No articles. Every page was a gallery with one or two sentences, so the site could only rank for searches that name the business or a product. | A blog at `/blog` with four posts, linked from the matching cabinet pages. It is not in the menu or on the home page. Each post has its own description, share image and `BlogPosting` entry, and is in the sitemap. |

The sitemap, `robots.txt`, canonical links, one `h1` per page, image alt text and Open Graph tags were already right.

## Titles and the site description (edit in Storyblok)

These fields live on the Search engines tab in Storyblok, and `cms:pull` overwrites local edits, so I left them alone. The current titles run 90 to 128 characters with the suffix, repeat the business name, and none names a place. Google shows about 60 characters. The layout adds " — Cleary Custom Cabinets" (25 characters) to whatever is entered.

| Page | Current title | Proposed |
|---|---|---|
| Home | Stock and Custom Cabinets for the quality and service you deserve | Custom & Stock Cabinets, Hicksville, Long Island |
| About | About Cleary Custom Cabinets. Cleary Custom Cabinets Showroom. Links for Cleary Custom Cabinets. | About Our Family Cabinet Shop in Hicksville, NY |
| Contact | Contact Cleary Custom Cabinets. Follow Cleary Custom Cabinets. Directions to Cleary Custom Cabinets. | Contact, Directions and Showroom Hours |
| Custom kitchens and baths | Custom Kitchen & Bath Cabinets in Wood, Thermofoil or Formica. Frameless, Framed or Inset Cabinets. | Custom Kitchen & Bath Cabinets on Long Island |
| Stock kitchens and baths | Stock Kitchen and Bath Cabinets. Some cabinets ready for quick delivery. | Stock Kitchen & Bath Cabinets, Quick Delivery |
| Wall units and furniture | Custom Cabinetry in wood, thermofoil or formica for any room in your home or business. | Custom Wall Units & Built-In Furniture |
| Medical and commercial | Custom laminate, thermofoil or wood cabinets made for any business to any specification. | Custom Medical & Commercial Cabinets, Long Island |
| Countertops | Countertops in Quartz, Granite, Corian, Formica or Butcher Block for any application. | Quartz, Granite & Corian Countertops, Long Island |
| Hardware and plumbing | Handles, knobs, sinks, faucets, cabinet accessories for organization. | Cabinet Hardware, Sinks & Faucets |
| Quick ship vanities | Quick Ship Vanity Cabinets | Quick Ship Bathroom Vanities |

With the suffix the proposed titles come to 53 to 74 characters. On the longer ones Google cuts the business name off the end, which costs nothing.

Site description (Business details, "Description shown in Google results"), now 420 characters. Proposed, 161 characters:

> Custom and stock cabinets and countertops from a family shop in Hicksville, open since 1993. Serving Nassau, Suffolk and New York City. Free design consultation.

## Thin pages

Counting the menu and footer, the cabinet pages have 180 to 390 words. Most have one sentence above the photos and one below, and the countertops and hardware pages add a line about each brand. Quick Ship Vanities has no text of its own.

Each cabinet page should have 150 to 300 words of its own: what you make or sell, in which materials, how a job goes from measurement to installation, and the towns you work in. The Storyblok fields are single sentences today, so this needs a longer text field on the cabinet page. That is a small code change once the copy exists, and the copy has to come from the shop because it describes how you work.

Smaller items:

- Brand list: "Kraftmaid" should be "KraftMaid".
- Photo captions double as alt text, and some repeat ("Semi Custom Kitchen Cabinets" and "Our Showroom at 794 South Broadway" four times each). Captions that say what is different about each photo would help image search.
- The home page headline, "Custom & Stock Cabinetry", names no place. Adding "Hicksville, Long Island" to the line under it would put the location in the first screen of text.

## Before launch

1. Redirects. `docs/redirects.md` has the list of old Squarespace addresses, but `public/_redirects` does not exist yet. Without it every old `/cabinets-products/...` address returns a 404 on launch day and the rankings those pages hold are lost. The file format depends on the host.
2. The contact form posts nowhere (`data-form-backend="todo-phase-2"` in `ContactForm.astro`). It is the only call to action on the blog and the cabinet pages.
3. Trailing slashes. Canonical links and the sitemap say `/about/` while menu links say `/about`. Both load. Set the host to redirect one form to the other so Google sees a single address per page.
4. Search Console. Verify the domain, submit `/sitemap-index.xml` after launch, and watch the Pages report for 404s over the first few weeks. Search Console also shows which searches the blog brings in, with no script on the site.
5. Run a blog post and the home page through Google's Rich Results Test once they are live.

Two limits of the structured data: it has no map coordinates, because I had no verified pair to enter, and it reads hours written as "Mon, Tue, Wed, Fri". A row written as a range, such as "Mon to Fri", would still show on the page but drop out of the structured data.

## Outside the website

For searches like "cabinet maker near me" or "kitchen cabinets Hicksville", the map results come from the Google Business Profile more than from the website. I could not see the profile, so check these:

- It is claimed and verified, with "Cabinet maker" as the primary category and others such as "Kitchen remodeler" and "Countertop store" as secondary ones.
- Hours match the site, including Thursday until 8:00 PM.
- The name, address and phone are written the same way on Google, Houzz, Facebook, Yelp, Bing Places and Apple Business Connect as on the site.
- It has recent photos, and reviews get a reply. Asking each finished customer for a review is the cheapest ranking work there is.

Links from other sites matter too. The manufacturers you distribute (KraftMaid, Merillat, Wolf, Cambria, Caesarstone and the rest) have dealer locators. Ask each one to list the showroom with a link to the site.

## The blog

Posts are Markdown files in `src/content/blog/`. They are not in Storyblok, and `cms:pull` does not touch them. The file name becomes the address: `choosing-a-countertop.md` is served at `/blog/choosing-a-countertop`.

```yaml
---
title: "Custom or stock cabinets: how to choose"
description: "One or two sentences, 170 characters at most."
date: 2026-11-10
image: "../../assets/gallery/stock-kitchens-baths/04-two-tone-painted-cabinets-with-quartz-counters.jpg"
imageAlt: "Two-tone painted stock cabinets with quartz counters"
services: ["custom-kitchens-baths", "stock-kitchens-baths"]   # these cabinet pages link back to the post
draft: false                                                   # true keeps it out of the built site
---
```

The four starter posts:

- Custom or stock cabinets: how to choose
- Framed, frameless or inset: three ways to build a cabinet
- Wood, thermofoil or Formica: cabinet materials compared
- Quartz, granite, Corian or butcher block: choosing a countertop

I wrote them from general cabinetmaking knowledge and from what the site already says about the business. Someone from the shop should read them before they go live. Check these claims in particular: that thermofoil generally costs less than painted wood, that some stock lines arrive in a few days, that the shop builds framed, frameless and inset cabinets, and that the brands named in each post are current.

### What to write next

One or two posts a month is enough. In rough order of value for local search:

| Topic | Searches it answers |
|---|---|
| Write-ups of finished jobs, one per post, naming the town ("A walnut inset vanity in Garden City") | custom cabinets + town name. This is the strongest local signal a blog can give. It needs real job details and the customer's permission. |
| Small kitchens in capes, ranches and split-levels | kitchen ideas for the house types most common in Nassau and Suffolk |
| How to measure a kitchen before a design consultation | kitchen design consultation, how to measure for cabinets |
| KraftMaid Vantage, Merillat and Wolf Classic compared | brand comparisons, dealer searches |
| Custom or quick-ship vanity: sizes and lead times | bathroom vanity sizes, vanity near me |
| Built-ins and wall units: what to decide before ordering | custom built-ins Long Island, wall unit ideas |
| Cabinets for medical and dental offices | medical office casework, laminate cabinets for offices |
| Painted or stained cabinets | painted vs stained kitchen cabinets |
| Knobs, pulls and soft-close hardware | cabinet hardware questions, which lead to the hardware page |
