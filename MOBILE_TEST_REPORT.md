# Mobile Testing Report

## Target behavior

The interface is designed for narrow phone screens first, with touch-friendly input controls, a fixed bottom navigation bar on mobile, and larger multi-column layouts on tablets and desktop. It uses no external UI framework or network-loaded font.

## Test record

The static package checks and Node formula/data tests were run. A local browser test was attempted, but the available Windows browser automation blocked navigation to the local test URL before the app opened. Therefore, no live viewport, button, storage, browser export, service-worker installation, or phone-device check is claimed here.

| Check | Status | Evidence |
|---|---|---|
| 320 px narrow viewport | Not browser-verified | A 320 px CSS breakpoint is present; horizontal overflow still needs a real browser check. |
| 390 px phone viewport | Not browser-verified | Mobile layout and bottom navigation are implemented; visual fit still needs a real browser check. |
| Tablet and desktop layout | Not browser-verified | Responsive breakpoints are present; visual fit still needs a real browser check. |
| Calculator sample and edge cases | Passed in Node tests | Nine built-in tests cover the sample, zero sales, losses, fees, discount, stock and margin. |
| Sales record add/edit/delete | Not browser-verified | The UI handlers are present; actual browser interaction remains unverified. |
| Dashboard aggregation and multi-product ranking | Passed in Node tests | Shared calculation functions test aggregation, product ranking and month grouping. |
| Local persistence | Not browser-verified | App uses localStorage; reload persistence must be confirmed in a browser. |
| Backup parser | Passed in Node tests | Valid, malformed, wrong-version and invalid-record backups are covered. |
| CSV and summary download | Not browser-verified | Download handlers are implemented; actual browser downloads remain unverified. |
| Offline/PWA installation | Not browser-verified | Manifest and service worker files are present. HTTPS hosting and browser/platform behavior must be checked after deployment. |

## Manual phone checks for the product owner

After hosting the app at an HTTPS URL, complete these checks before promoting the bonus:

1. Open it on an Android phone and an iPhone. Check that labels and amount fields fit without horizontal scrolling.
2. Change a calculator value, close the app, reopen it and confirm the value remains.
3. Add a sale, edit it, delete it, then confirm dashboard totals change each time.
4. Export CSV and JSON backup. Restore the JSON backup and confirm the sales return.
5. Load the app once, switch the phone to airplane mode and reopen it to check offline cache behavior.
6. Use the browser's install or Add to Home Screen command and confirm the icon and standalone launch.

The application does not contact a backend. Local browser storage belongs to the device and browser origin; it does not synchronize to another phone.
