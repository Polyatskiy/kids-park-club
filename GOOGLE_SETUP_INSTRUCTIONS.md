# Google Analytics 4 & Search Console Setup Guide

This guide will help you set up Google Analytics 4 (GA4) and Google Search Console (GSC) for kids-park.club.

## ✅ What's Already Done

The code is already set up and ready:
- ✅ GA4 tracking component created (`components/analytics.tsx` and `components/gtag-script.tsx`)
- ✅ GA4 script added to root layout
- ✅ Client-side navigation tracking configured
- ✅ `robots.txt` updated with sitemap reference
- ✅ `sitemap.xml` generated with all locales and routes

---

## 1. Google Analytics 4 (GA4) Setup

### Step 1: Get Your GA4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing one) for `kids-park.club`
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your **kids-park-club** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:
   - **Name**: `NEXT_PUBLIC_GA_ID`
   - **Value**: `G-BZG7RNLBN0` (your GA4 Measurement ID)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### Step 4: Verify GA4 is Working

1. Visit your site: https://kids-park.club
2. Open browser DevTools (F12) → **Network** tab
3. Filter by "gtag" or "collect"
4. You should see requests to `google-analytics.com` and `googletagmanager.com`
5. In GA4 dashboard, go to **Reports** → **Realtime** to see live visitors

### How It Works

- **Page views** are tracked automatically on every page load
- **Client-side navigation** (Next.js router) is tracked when users navigate between pages
- Tracking works across all locales (`/en/`, `/pl/`, `/ru/`, `/uk/`)

---

## 2. Google Search Console (GSC) Setup

### Step 1: Create GSC Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Select **Domain** property type (not URL prefix)
4. Enter: `kids-park.club`
5. Click **Continue**

### Step 2: Get DNS TXT Record from Google

Google will show you a **TXT record** that looks like:
```
google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Copy this entire value** (including `google-site-verification=`)

### Step 3: Add TXT Record in Porkbun

1. Log in to [Porkbun](https://porkbun.com/)
2. Go to **Domain Management** → Select **kids-park.club**
3. Click on **DNS** or **DNS Records** tab
4. Click **Add Record** or **+ Add**
5. Fill in:
   - **Type**: `TXT`
   - **Host**: `@` (or leave blank, or use root domain)
   - **Answer**: Paste the **entire TXT value** from Google (including `google-site-verification=...`)
   - **TTL**: `600` (or default)
6. Click **Save** or **Add Record**

### Step 4: Verify in Google Search Console

1. Go back to Google Search Console
2. Click **Verify**
3. Wait 1-5 minutes for DNS propagation
4. If verification fails, wait a bit longer (DNS can take up to 48 hours, but usually works within minutes)

### Important Notes

- The TXT record must be at the **root domain** (`@` or blank host field)
- DNS changes can take a few minutes to propagate
- Keep the TXT record even after verification (Google may re-verify periodically)

---

## 3. Submit Sitemap to Google Search Console

### Step 1: Access Sitemap

Your sitemap is available at:
```
https://kids-park.club/sitemap.xml
```

Visit this URL to verify it's working (you should see XML with all your routes).

### Step 2: Submit in GSC

1. In Google Search Console, select your **kids-park.club** property
2. Go to **Sitemaps** in the left sidebar (under **Indexing**)
3. In the "Add a new sitemap" field, enter:
   ```
   sitemap.xml
   ```
   (Don't include the full URL, just `sitemap.xml`)
4. Click **Submit**

### Step 3: Check Sitemap Status

- **Status** should show "Success" (may take a few minutes)
- **Discovered URLs** will show the number of pages found
- **Submitted** will show the number of URLs you submitted

### Step 4: Monitor Indexing

1. Go to **Pages** (under **Indexing**) to see:
   - **Valid** pages (indexed)
   - **Valid with warnings** (indexed but has issues)
   - **Excluded** pages (not indexed, with reasons)

2. Check **Coverage** report to see:
   - Pages indexed successfully
   - Pages with errors
   - Pages excluded from indexing

### What's in Your Sitemap

Your sitemap includes:
- All locales: `/en/`, `/pl/`, `/ru/`, `/uk/`
- Main pages: home, coloring, games, audio-stories, books, popular
- Game pages: jigsaw gallery, reaction, puzzle
- All routes are set with appropriate priorities and change frequencies

---

## Troubleshooting

### GA4 Not Tracking

- ✅ Check `NEXT_PUBLIC_GA_ID` is set in Vercel environment variables
- ✅ Verify the value starts with `G-` (not `UA-` which is Universal Analytics)
- ✅ Check browser console for errors
- ✅ Use GA4 DebugView: In GA4, go to **Admin** → **DebugView** to see real-time events

### GSC Verification Fails

- ✅ Wait 5-10 minutes after adding TXT record (DNS propagation)
- ✅ Verify TXT record is at root domain (`@` or blank host)
- ✅ Check TXT record value matches exactly (including `google-site-verification=`)
- ✅ Use DNS checker tools to verify the record is live

### Sitemap Not Found

- ✅ Visit `https://kids-park.club/sitemap.xml` directly to verify it's accessible
- ✅ Check `robots.txt` includes sitemap reference
- ✅ Ensure sitemap is submitted as `sitemap.xml` (not full URL)

---

## Next Steps

After setup is complete:

1. **Monitor GA4** for traffic and user behavior
2. **Check GSC** regularly for indexing issues
3. **Review Search Performance** in GSC to see search queries
4. **Fix any indexing errors** reported in GSC Coverage report

---

## Support

If you encounter issues:
- GA4: Check [Google Analytics Help](https://support.google.com/analytics)
- GSC: Check [Search Console Help](https://support.google.com/webmasters)
- DNS: Contact Porkbun support if DNS records aren't working
