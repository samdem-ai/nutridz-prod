# NutriDz Admin — product collection website

Mobile-first website where NutriDz administrators build the food database the
mobile app reads:

1. **Scan** the barcode / QR code with the phone camera (EAN-13, EAN-8, UPC, Code 128, QR).
   The site checks right away whether the product is already in the app or waiting for review.
2. **Photograph the nutrition label** — free in-browser OCR (Tesseract.js, French / Arabic / English)
   reads energy, fat, carbs, sugars, fibre, protein and salt per 100 g.
3. **Complete the details** — name (FR/AR), brand, category, Nutri-Score (with a suggestion), serving sizes, product photo.
4. **Preview** exactly how it will look in the app, then send it for review.
5. **Review** — any admin opens the queue, compares the label photo with the values,
   edits if needed, then **approves** (published to the app instantly) or **rejects** with a reason.
6. **Products** — browse/search/filter every food in the app with full nutrition facts, edit, or mark verified.

Available in French, English and Arabic (RTL), light and dark themes, installable on a phone home screen.

## How it connects to the app

The site talks only to the existing Spring Boot API (`/api/admin/**`, admin role required).
Scanned products are stored in `product_submissions` and are **not visible in the app until approved**.
Approving writes the row into `foods` (`verified = 1`), so the mobile app's barcode scanner and
search find it immediately. Product photos are served from `/api/public/food-images/{id}`.

## Run locally

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the API is not on localhost:8080
npm run dev            # http://localhost:5173
```

```bash
npm test               # OCR label parser tests
npm run build          # type-check + production build into dist/
```

## Give someone admin access

Admins sign in with a normal NutriDz account whose role is `ADMIN`:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'someone@example.com';
```

## Deploy

The `admin-web` service in `apps/nutri-dz-backend/compose.yml` builds this site into an nginx image
on `127.0.0.1:8081`. Behind the HTTPS proxy, route `/api/*` to the backend and everything else to the site. Settings:

| Variable | Where | Example |
|---|---|---|
| `ADMIN_API_BASE_URL` | build arg for `admin-web` (default `/api`: site and API on the same domain) | `/api` |
| `ADMIN_WEB_ORIGINS` | backend env (CORS), only if the site is on another domain | `https://admin.example.com` |
| `APP_BASE_URL` | backend env — public API URL used in product image links | `https://api.example.com` |

**HTTPS is required**: phone browsers only allow camera access on secure pages.

## OCR notes

- Runs entirely in the browser — no API key, no cost, nothing leaves the device except the final submission.
  Language models (~10 MB) download once from the jsDelivr CDN and are cached.
- Each label is read twice (contrast-enhanced and original). The parser (`src/lib/nutritionParser.ts`)
  fixes common OCR mistakes (`g` read as `9`, dropped decimal commas, `042g` → 0.42 g, Arabic right-to-left rows),
  picks the reading whose macros add up to the printed calories, and flags those fields **"à vérifier"**.
- Best results: photograph only the table, flat, well lit, without glare.
