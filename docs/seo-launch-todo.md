# SEO to-do list for going live

Draft, 10 November 2026. The background for each item is in [seo-audit.md](seo-audit.md). The site moves from Squarespace to the new build on the same domain, so the main job is to make the switch without losing what the old pages rank for, then to build on it.

## Before the switch

Content, in Storyblok:

- [ ] Enter the new page titles and the shorter site description from the tables in the audit.
- [ ] Change "Kraftmaid" to "KraftMaid" in the brand list. The announcement bar takes its spelling from that list.
- [ ] Have someone from the shop read the four blog posts and correct anything that is wrong for how you work.

Site:

- [ ] Add the redirects from `docs/redirects.md` in the format the host uses. The old site's sitemap lists ten addresses and the table covers all of them.
- [ ] Give the contact form its Resend key on Cloudflare Pages ([hosting.md](hosting.md)) and send a test enquiry to info@clearycustomcabinets.com.
- [ ] Choose one form of address, with or without the trailing slash, and have the host redirect the other to it.
- [ ] Check on the host's preview address that a missing page returns a 404 status, and that each old `/cabinets-products/...` address redirects in one step.
- [ ] Keep the preview address out of Google, with a password or a `noindex` header, so it is not indexed as a copy of the real site.

Measuring:

- [ ] Verify the domain in Google Search Console with a DNS record. A DNS record keeps working after the move, where Squarespace's own connection will not.
- [ ] Export the last three months of Search Console data (queries and pages) as the baseline.
- [ ] Write down where the site ranks today for a handful of searches, such as "custom cabinets Hicksville", "kitchen cabinets Long Island" and "Corian countertops Nassau County", and whether the business shows in the map results.

Domain:

- [ ] Find out where the domain is registered. If it is registered through Squarespace, the registration has to stay active or be transferred before the site plan is cancelled.
- [ ] Lower the DNS record's time to live a day ahead, so the switch takes effect quickly.

## Launch day

- [ ] Point the domain at the new host. `clearycustomcabinets.com` already redirects to `www`, and that has to keep working, with HTTPS on both.
- [ ] Open the home page, one cabinet page and one blog post on the live domain. Each should load, and its canonical link should start with `https://www.clearycustomcabinets.com/`.
- [ ] Open every old address in the redirects table and confirm it lands on the right new page.
- [ ] Confirm `/robots.txt` and `/sitemap-index.xml` load.
- [ ] In Search Console, submit `/sitemap-index.xml` and remove the old Squarespace sitemap.
- [ ] In Search Console's URL Inspection, request indexing for the home page, `/blog` and the four posts. Google limits these to about ten a day, so do the cabinet pages the next day.
- [ ] Run the home page and one post through Google's Rich Results Test and confirm it finds the business entry and the blog post entry.
- [ ] Send one more test enquiry through the live form.
- [ ] Check that the Google Business Profile hours match the site, including Thursday until 8:00 PM, and that its website link opens the new home page.

## First week

- [ ] Look at the Pages report in Search Console every couple of days. Add a redirect for any old address that shows up as "Not found (404)".
- [ ] Search Google for `site:clearycustomcabinets.com` and note any Squarespace addresses that are still listed. They should drop out as Google recrawls.
- [ ] Run the home page and one cabinet page through PageSpeed Insights on mobile.
- [ ] Set up Bing Webmaster Tools (it can import the Search Console settings) and claim the listing in Apple Business Connect.
- [ ] Keep the Squarespace plan until a week has passed with no problems, then cancel it.

## First month

- [ ] Compare clicks and impressions in Search Console with the baseline. Rankings often move around for a few weeks after a change of platform.
- [ ] Make the name, address and phone number read the same on Google, Houzz, Facebook, Yelp, Bing and Apple as they do on the site.
- [ ] Ask each manufacturer you distribute to list the showroom in its dealer locator with a link to the site.
- [ ] Start asking finished customers for a Google review, and reply to the ones that come in.
- [ ] Write 150 to 300 words for each cabinet page. This needs a longer text field in Storyblok, which is a small code change.
- [ ] Publish the first write-up of a finished job, naming the town, with the customer's permission.
- [ ] Add the showroom's map coordinates to the structured data in `src/lib/seo.ts`.

## Every month after that

- [ ] Publish one or two blog posts. The audit lists topics.
- [ ] Read the Search Console queries report. Searches that show the site but get few clicks are the next posts to write or the next titles to improve.
- [ ] Add new photos to the Google Business Profile, and keep its hours right around holidays.
