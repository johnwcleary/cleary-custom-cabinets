# Redirects

Old Squarespace URLs → new Astro routes. To be added as a `public/_redirects` file (301s) at launch. The new site uses `/cabinets/<slug>` for product pages.

| Old (Squarespace) | New | Note |
|---|---|---|
| `/` | `/` | |
| `/about` | `/about` | |
| `/contact` | `/contact` | |
| `/cabinets-products` | `/#services` | Squarespace folder URL; "Cabinets and Products" nav item pointed at `/` |
| `/cabinets-products/custom-kitchens-baths` | `/cabinets/custom-kitchens-baths` | |
| `/cabinets-products/stock-kitchens-baths` | `/cabinets/stock-kitchens-baths` | |
| `/cabinets-products/wall-units-furniture` | `/cabinets/wall-units-furniture` | |
| `/cabinets-products/medical-retail` | `/cabinets/medical-commercial` | slug renamed to match the page title |
| `/cabinets-products/countertops` | `/cabinets/countertops` | |
| `/cabinets-products/hardware-plumbing` | `/cabinets/hardware-plumbing` | |
| `/cabinets-products/quick-ship-vanity-cabinets` | `/cabinets/quick-ship-vanities` | slug shortened |

Draft `public/_redirects`:

```
/cabinets-products                                 /#services                         301
/cabinets-products/custom-kitchens-baths           /cabinets/custom-kitchens-baths    301
/cabinets-products/stock-kitchens-baths            /cabinets/stock-kitchens-baths     301
/cabinets-products/wall-units-furniture            /cabinets/wall-units-furniture     301
/cabinets-products/medical-retail                  /cabinets/medical-commercial       301
/cabinets-products/countertops                     /cabinets/countertops              301
/cabinets-products/hardware-plumbing               /cabinets/hardware-plumbing        301
/cabinets-products/quick-ship-vanity-cabinets      /cabinets/quick-ship-vanities      301
```

Each service entry in `src/content/services/*.md` also records its `legacyPath`, so this table can be generated rather than maintained by hand.
