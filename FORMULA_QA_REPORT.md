# Formula and Calculation QA Report

## Status

**Passed:** all nine calculation/data tests pass with Node's built-in test runner. The sample values reproduce the supplied DEETAR PROFIT workbook results. No third-party package is required.

## Formula logic

- Net selling price per unit = list price × (1 - discount rate).
- Payment fee per unit = net selling price × payment-fee rate. Fees are applied after discount.
- Variable cost per sold unit = unit product cost + packaging + delivery subsidy + advertising + other variable cost + payment fee.
- Total net revenue = net selling price × units sold.
- Total variable expenses = product cost for units sold + other variable expenses for sold units.
- Estimated batch profit = total net revenue - total variable expenses - batch fixed expenses.
- Profit margin = estimated batch profit ÷ total net revenue; zero revenue returns 0% to avoid a divide-by-zero error.
- Break-even selling price allocates fixed expenses over the entered quantity sold and adjusts for payment fee and discount.
- Break-even quantity = ceiling(fixed expenses ÷ contribution per unit) when contribution is positive; otherwise it is reported as not reached.
- Suggested list price solves for the entered target profit margin after variable costs, discount, payment fees and fixed expenses allocated across units sold.
- Unsold product cost is displayed as a separate inventory-cost figure and is not subtracted from profit for sold units.

## Supplied sample

| Output | Expected | Result |
|---|---:|---|
| Net selling price per unit | NGN 23,750 | Pass |
| Payment fee per unit | NGN 475 | Pass |
| Contribution per unit | NGN 8,775 | Pass |
| Total net revenue | NGN 475,000 | Pass |
| Total variable expenses | NGN 299,500 | Pass |
| Batch profit after fixed expenses | NGN 170,500 | Pass |
| Profit margin | 35.8947% (35.89% displayed) | Pass |
| Break-even selling price | NGN 15,843.18 | Pass |
| Suggested list price at 30% target profit margin | NGN 22,832.82 | Pass |

Sample inputs: quantity produced/purchased 20; quantity sold 20; list price NGN 25,000; unit product cost NGN 12,000; packaging NGN 500; delivery subsidy NGN 1,000; advertising NGN 750; other variable cost NGN 250; discount 5%; payment fee 2%; fixed expenses NGN 5,000; target profit margin 30% after fixed costs.

## Source formula clarification

The workbook's suggested-price formula includes fixed batch expenses divided by units sold, while its cell note says fixed expenses are excluded. Those instructions conflict. The mobile edition follows the formula and the requested profit-margin meaning: it allocates fixed expenses per sold unit and calculates the target margin after that allocation. The interface and guide now state this explicitly.

## Automated scenario coverage

- Discount is applied before payment fee; expected payment fee on a NGN 90 discounted price at 2% is NGN 1.80.
- Zero sales returns finite results and avoids division errors.
- A loss remains negative and a non-positive contribution does not claim a break-even quantity.
- Unsold stock cost is separated from sold-unit cost.
- Multiple products aggregate correctly, and the best-product result is based on recorded profit.
- Monthly grouping uses the transaction date.
- Currency selection changes formatting but does not change calculation values.
- Valid backup data is accepted; malformed JSON, wrong versions and invalid records are rejected.
- A stock warning is produced when units sold exceed units produced or purchased.

Run the tests with `npm test` or `node --test tests/*.test.mjs` from this folder.

## Scope and limits

Automated tests exercise the shared calculation and data functions. Browser persistence, import/export buttons and responsive layout are documented separately in `MOBILE_TEST_REPORT.md`. Native app-store packaging and access to customer devices are outside this static web app. All amounts are estimates; no FX conversion, taxes, or omitted costs are inferred.
