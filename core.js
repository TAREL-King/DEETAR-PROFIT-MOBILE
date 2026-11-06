export const DEFAULT_CALCULATOR = Object.freeze({
  productName: 'Sample product', quantityProduced: 20, quantitySold: 20,
  unitCost: 12000, sellingPrice: 25000, packaging: 500, delivery: 1000,
  advertising: 750, otherCost: 250, feePercent: 2, discountPercent: 5,
  fixedExpenses: 5000, targetMarginPercent: 30,
});

export const CURRENCIES = Object.freeze({
  NGN: { locale: 'en-NG', currency: 'NGN' }, USD: { locale: 'en-US', currency: 'USD' },
  GBP: { locale: 'en-GB', currency: 'GBP' }, EUR: { locale: 'en-IE', currency: 'EUR' },
  GHS: { locale: 'en-GH', currency: 'GHS' }, CAD: { locale: 'en-CA', currency: 'CAD' },
});

const n = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};
const pct = value => Math.min(99.99, n(value)) / 100;

export function calculateProduct(input) {
  const quantityProduced = n(input.quantityProduced);
  const quantitySold = n(input.quantitySold);
  const unitCost = n(input.unitCost);
  const sellingPrice = n(input.sellingPrice);
  const packaging = n(input.packaging);
  const delivery = n(input.delivery);
  const advertising = n(input.advertising);
  const otherCost = n(input.otherCost);
  const fixedExpenses = n(input.fixedExpenses);
  const feeRate = pct(input.feePercent);
  const discountRate = pct(input.discountPercent);
  const targetMargin = pct(input.targetMarginPercent);

  const netSellingPrice = sellingPrice * (1 - discountRate);
  const paymentFeePerUnit = netSellingPrice * feeRate;
  const nonProductVariablePerUnit = packaging + delivery + advertising + otherCost + paymentFeePerUnit;
  const variableCostPerSoldUnit = unitCost + nonProductVariablePerUnit;
  const contributionPerUnit = netSellingPrice - variableCostPerSoldUnit;
  const netRevenue = netSellingPrice * quantitySold;
  const productCostForUnitsSold = unitCost * quantitySold;
  const otherVariableExpenses = nonProductVariablePerUnit * quantitySold;
  const totalVariableExpenses = productCostForUnitsSold + otherVariableExpenses;
  const totalExpenses = totalVariableExpenses + fixedExpenses;
  const totalProfit = netRevenue - totalExpenses;
  const profitMargin = netRevenue > 0 ? totalProfit / netRevenue : 0;
  const totalProductCostProduced = unitCost * quantityProduced;
  const breakEvenPrice = quantitySold > 0 && feeRate < 1 && discountRate < 1
    ? ((unitCost + packaging + delivery + advertising + otherCost + fixedExpenses / quantitySold) / (1 - feeRate)) / (1 - discountRate)
    : null;
  const breakEvenQuantity = contributionPerUnit > 0 ? Math.ceil(fixedExpenses / contributionPerUnit) : null;
  const targetFixedCostPerUnit = quantitySold > 0 ? fixedExpenses / quantitySold : null;
  const priceDenominator = 1 - feeRate - targetMargin;
  const suggestedListPrice = targetFixedCostPerUnit !== null && priceDenominator > 0 && discountRate < 1
    ? ((unitCost + packaging + delivery + advertising + otherCost + targetFixedCostPerUnit) / priceDenominator) / (1 - discountRate)
    : null;

  return {
    quantityProduced, quantitySold, netSellingPrice, paymentFeePerUnit,
    nonProductVariablePerUnit, variableCostPerSoldUnit, contributionPerUnit,
    netRevenue, productCostForUnitsSold, otherVariableExpenses,
    totalVariableExpenses, totalExpenses, totalProfit, profitMargin,
    totalProductCostProduced, breakEvenPrice, breakEvenQuantity,
    suggestedListPrice, stockShortfall: quantitySold > quantityProduced,
  };
}

export function calculateSale(record) {
  const quantity = Math.floor(n(record.quantity));
  const unitPrice = n(record.unitPrice);
  const discountRate = pct(record.discountPercent);
  const unitCost = n(record.unitCost);
  const otherCost = n(record.otherCost);
  const feeRate = pct(record.feePercent);
  const fixedExpenses = n(record.fixedExpenses);
  const netUnitPrice = unitPrice * (1 - discountRate);
  const revenue = netUnitPrice * quantity;
  const paymentFee = revenue * feeRate;
  const expenses = quantity * (unitCost + otherCost) + paymentFee + fixedExpenses;
  const profit = revenue - expenses;
  return { quantity, revenue, paymentFee, expenses, profit, margin: revenue > 0 ? profit / revenue : 0 };
}

export function summarizeSales(records) {
  const rows = records.map(record => ({ record, result: calculateSale(record) }));
  const revenue = rows.reduce((sum, row) => sum + row.result.revenue, 0);
  const expenses = rows.reduce((sum, row) => sum + row.result.expenses, 0);
  const profit = revenue - expenses;
  const products = new Map();
  for (const { record, result } of rows) {
    const key = String(record.product || 'Unnamed product').trim() || 'Unnamed product';
    const item = products.get(key) || { name: key, sales: 0, revenue: 0, expenses: 0, profit: 0 };
    item.sales += 1;
    item.revenue += result.revenue;
    item.expenses += result.expenses;
    item.profit += result.profit;
    products.set(key, item);
  }
  const bestProduct = [...products.values()].sort((a, b) => b.profit - a.profit || b.revenue - a.revenue)[0] || null;
  return { count: records.length, revenue, expenses, profit, margin: revenue > 0 ? profit / revenue : 0, bestProduct, products: [...products.values()] };
}

export function monthlySeries(records, now = new Date(), monthCount = 6) {
  const anchor = new Date(now.getFullYear(), now.getMonth(), 1);
  const months = [];
  for (let back = monthCount - 1; back >= 0; back -= 1) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - back, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const matching = records.filter(record => String(record.date || '').slice(0, 7) === key);
    const summary = summarizeSales(matching);
    months.push({ key, label: new Intl.DateTimeFormat('en', { month: 'short' }).format(date), ...summary });
  }
  return months;
}

export function parseBackup(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('The backup is not valid JSON.'); }
  if (parsed?.version !== 1 || !parsed.settings || !Array.isArray(parsed.sales) || !parsed.calculator) {
    throw new Error('That file is not a valid DEETAR PROFIT Mobile backup.');
  }
  if (parsed.sales.length > 50000 || parsed.sales.some(row => !row || typeof row !== 'object' || typeof row.date !== 'string')) {
    throw new Error('The backup contains invalid or unsupported sales records.');
  }
  return parsed;
}

export function formatMoney(value, currencyCode = 'NGN') {
  const setting = CURRENCIES[currencyCode] || CURRENCIES.NGN;
  try {
    return new Intl.NumberFormat(setting.locale, {
      style: 'currency', currency: setting.currency, currencyDisplay: 'symbol',
      maximumFractionDigits: 2, minimumFractionDigits: 0,
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  } catch {
    return `${currencyCode} ${Number(value || 0).toLocaleString('en', { maximumFractionDigits: 2 })}`;
  }
}

export function formatPercent(value) {
  return `${(Number.isFinite(Number(value)) ? Number(value) * 100 : 0).toFixed(2)}%`;
}

export function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `sale-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
