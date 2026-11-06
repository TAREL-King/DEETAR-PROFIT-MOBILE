# DEETAR PROFIT Mobile Edition

**Know Your Numbers. Grow Your Business.**

A lightweight, mobile-first progressive web app bonus for the DEETAR PROFIT Excel product. It uses only HTML, CSS and JavaScript. It has no account sign-up, paid API, external library, payment gateway or analytics service. Calculator and sales data stay in the browser's local storage on the customer's device.

## What is included

- Product profit calculator and suggested selling price
- 200+ sale records stored locally, with edit and delete actions
- Revenue, expenses, profit, margin, top product and six-month chart
- Manual currency display selection for NGN, USD, GBP, EUR, GHS and CAD; no FX conversion
- CSV sales export, text calculation and dashboard summaries, and JSON backup/restore
- Installable PWA manifest and offline service worker
- Source tests and customer-facing guide

## Run locally

The app should be served over HTTP so the browser can use the PWA service worker. From this folder, run:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Stop the local server with `Ctrl+C` when finished. The app can also be opened as plain HTML, but install and offline caching require an HTTP or HTTPS origin.

## Run formula and data tests

Install no packages. With Node.js 18 or newer, run:

```powershell
npm test
```

Or run the built-in test runner directly:

```powershell
node --test tests/*.test.mjs
```

## Free hosting with GitHub Pages

1. Create a new GitHub repository and upload the contents of this folder to the repository root. Do not add customer backups or private data.
2. In the repository, open **Settings > Pages**.
3. Choose **Deploy from a branch**, select the `main` branch and `/ (root)`, then save.
4. Wait for the published site URL. Test the URL on a phone over HTTPS.
5. Customers can open the URL in a browser. On supported Android browsers use the browser menu's **Install app** or **Add to Home screen** action. On iPhone/iPad, open the link in Safari, tap **Share**, then **Add to Home Screen**.

GitHub Pages on GitHub Free requires a public repository. The app has no secrets and does not send customer entries to the repository or to a server. GitHub Pages serves static files; customer data remains in the customer's browser. See [GitHub's Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). PWA install prompts vary by browser and platform; see [MDN's installability guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Add the bonus to the Payhip product

The existing product link is [DEETAR PROFIT on Payhip](https://payhip.com/b/myhgX). After the app has a public HTTPS URL:

1. Sign in to Payhip and edit the existing DEETAR PROFIT digital product.
2. Add a short bonus note to the product download content with the hosted app URL and the installation steps above. If the content editor is unavailable, add a small PDF or text file containing that link to the product files.
3. Save the product and test the buyer download page with a test purchase or a no-cost test coupon before announcing the bonus.

Payhip's current documentation says a digital product can have multiple uploaded files, and its content editor can include a link to a digital product. See [Add a digital product](https://help.payhip.com/article/59-adding-a-digital-product).

This repository does not publish the site or change Payhip settings. Uploading this source folder to a public repository exposes the source code, but not customer data, because the app does not transmit that data.

## Privacy and support notes

- The calculator and sales list are saved in the browser on the current device. They are not synchronized between devices.
- Browser storage may be cleared by a device cleanup or browser setting. Customers should download a JSON backup periodically.
- Currency selection changes the display format only. It does not convert stored amounts. Keep records in one currency, or export and clear data before changing the currency display.
- The app is an estimate tool, not accounting or tax advice.
- This static app has no server-side recovery if a customer loses local data and their backup.

## Files

- `index.html`, `styles.css`, `app.js`, `core.js`: app interface and calculation logic
- `manifest.webmanifest`, `service-worker.js`, `icon.*`: PWA install and offline assets
- `tests/`: formula and data tests
- `USER_GUIDE.md`: customer instructions
- `FORMULA_QA_REPORT.md`: calculation and scenario verification
- `MOBILE_TEST_REPORT.md`: device-width and browser test record
