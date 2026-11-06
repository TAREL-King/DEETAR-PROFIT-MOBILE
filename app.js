import { CURRENCIES, DEFAULT_CALCULATOR, calculateProduct, calculateSale, formatMoney, formatPercent, makeId, monthlySeries, parseBackup, summarizeSales } from './core.js';

const STORAGE_KEY = 'deetar-profit-mobile-v1';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const fallbackState = () => ({ version: 1, settings: { currency: 'NGN' }, calculator: { ...DEFAULT_CALCULATOR }, sales: [] });
let state = loadState();
let noticeTimer;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || parsed.version !== 1 || !parsed.settings || !Array.isArray(parsed.sales)) return fallbackState();
    return {
      ...fallbackState(), ...parsed,
      settings: { currency: CURRENCIES[parsed.settings.currency] ? parsed.settings.currency : 'NGN' },
      calculator: { ...DEFAULT_CALCULATOR, ...(parsed.calculator || {}) },
      sales: parsed.sales.filter(item => item && typeof item === 'object' && item.id && item.date),
    };
  } catch {
    return fallbackState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    showNotice('This browser could not save the latest changes. Export a backup and check available device storage.', true);
    return false;
  }
}

function showNotice(message, isError = false) {
  const box = $('#notice');
  box.textContent = message;
  box.hidden = false;
  box.classList.toggle('error', isError);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { box.hidden = true; }, 5200);
}

function money(value) { return formatMoney(value, state.settings.currency); }
function numberFrom(form, key) { return Number(form.elements.namedItem(key)?.value || 0); }
function setOutput(id, text, negative = false) {
  const element = document.getElementById(id);
  element.textContent = text;
  element.classList.toggle('negative', negative);
}
function getCalculatorInput() {
  const form = $('#calculator-form');
  return {
    productName: form.elements.productName.value.trim(),
    quantityProduced: numberFrom(form, 'quantityProduced'), quantitySold: numberFrom(form, 'quantitySold'),
    unitCost: numberFrom(form, 'unitCost'), sellingPrice: numberFrom(form, 'sellingPrice'),
    packaging: numberFrom(form, 'packaging'), delivery: numberFrom(form, 'delivery'),
    advertising: numberFrom(form, 'advertising'), otherCost: numberFrom(form, 'otherCost'),
    feePercent: numberFrom(form, 'feePercent'), discountPercent: numberFrom(form, 'discountPercent'),
    fixedExpenses: numberFrom(form, 'fixedExpenses'), targetMarginPercent: numberFrom(form, 'targetMarginPercent'),
  };
}
function fillCalculator(input) {
  const form = $('#calculator-form');
  for (const [key, value] of Object.entries(input)) if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value;
}
function updateCalculator() {
  const input = getCalculatorInput();
  state.calculator = input;
  saveState();
  const result = calculateProduct(input);
  setOutput('profit-total', money(result.totalProfit), result.totalProfit < 0);
  $('#profit-caption').textContent = `After ${money(result.totalExpenses)} total expenses`;
  setOutput('net-price', money(result.netSellingPrice));
  setOutput('contribution', money(result.contributionPerUnit), result.contributionPerUnit < 0);
  setOutput('net-revenue', money(result.netRevenue));
  setOutput('profit-margin', formatPercent(result.profitMargin), result.profitMargin < 0);
  setOutput('sold-product-cost', money(result.productCostForUnitsSold));
  setOutput('other-variable-total', money(result.otherVariableExpenses));
  setOutput('total-variable-expenses', money(result.totalVariableExpenses));
  setOutput('produced-product-cost', money(result.totalProductCostProduced));
  setOutput('break-even-quantity', result.breakEvenQuantity === null ? 'Not reached' : `${result.breakEvenQuantity.toLocaleString()} units`);
  setOutput('break-even-price', result.breakEvenPrice === null ? 'Not available' : money(result.breakEvenPrice));
  setOutput('suggested-price', result.suggestedListPrice === null ? 'Not available' : money(result.suggestedListPrice));
  const warning = $('#stock-warning');
  warning.hidden = !result.stockShortfall;
  warning.textContent = result.stockShortfall ? 'Quantity sold is greater than quantity produced or purchased. Check your stock figures.' : '';
}

function setView(name) {
  $$('.view').forEach(view => {
    const active = view.id === `view-${name}`;
    view.classList.toggle('active', active);
    view.hidden = !active;
  });
  $$('[data-view]').forEach(button => {
    const active = button.dataset.view === name;
    button.classList.toggle('active', active);
    if (button.classList.contains('nav-button')) {
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    }
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'sales') renderSales();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.hidden = true;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCalculation() {
  const input = getCalculatorInput();
  const result = calculateProduct(input);
  const lines = [
    'DEETAR PROFIT - PRODUCT CALCULATION',
    `Product: ${input.productName || 'Unnamed product'}`,
    `Currency display: ${state.settings.currency} (no currency conversion)`,
    `Quantity produced or purchased: ${input.quantityProduced}`,
    `Quantity sold: ${input.quantitySold}`,
    `Net selling price per unit: ${money(result.netSellingPrice)}`,
    `Contribution per unit: ${money(result.contributionPerUnit)}`,
    `Net revenue: ${money(result.netRevenue)}`,
    `Product cost for units sold: ${money(result.productCostForUnitsSold)}`,
    `Other variable expenses: ${money(result.otherVariableExpenses)}`,
    `Total variable expenses: ${money(result.totalVariableExpenses)}`,
    `Fixed expenses: ${money(input.fixedExpenses)}`,
    `Estimated total profit: ${money(result.totalProfit)}`,
    `Profit margin: ${formatPercent(result.profitMargin)}`,
    `Break-even selling price: ${result.breakEvenPrice === null ? 'Not available' : money(result.breakEvenPrice)}`,
    `Break-even quantity: ${result.breakEvenQuantity === null ? 'Not reached' : `${result.breakEvenQuantity} units`}`,
    `Suggested list price at target contribution margin: ${result.suggestedListPrice === null ? 'Not available' : money(result.suggestedListPrice)}`,
    '', 'Estimate only. Add all relevant costs. This is not tax or accounting advice.',
  ];
  downloadFile('DEETAR_Profit_Calculation.txt', lines.join('\r\n'), 'text/plain;charset=utf-8');
}

function getSaleFormData() {
  const form = $('#sale-form');
  return {
    id: form.elements.id.value || makeId(), date: form.elements.date.value,
    product: form.elements.product.value.trim(), quantity: numberFrom(form, 'quantity'),
    unitPrice: numberFrom(form, 'unitPrice'), discountPercent: numberFrom(form, 'discountPercent'),
    unitCost: numberFrom(form, 'unitCost'), otherCost: numberFrom(form, 'otherCost'),
    feePercent: numberFrom(form, 'feePercent'), fixedExpenses: numberFrom(form, 'fixedExpenses'),
  };
}
function clearSaleForm() {
  const form = $('#sale-form');
  form.reset(); form.elements.id.value = ''; form.elements.date.value = localDateString(new Date());
  form.elements.quantity.value = '1'; form.elements.unitPrice.value = '0'; form.elements.unitCost.value = '0';
  form.elements.otherCost.value = '0'; form.elements.fixedExpenses.value = '0';
  form.elements.discountPercent.value = '0'; form.elements.feePercent.value = '0';
  $('#sale-form-title').textContent = 'Add a sale'; $('#sale-submit').textContent = 'Save sale'; $('#cancel-edit').hidden = true;
}
function localDateString(date) {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function element(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function renderSales() {
  const list = $('#sales-list'); list.replaceChildren();
  const sorted = [...state.sales].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  $('#sales-count').textContent = `${state.sales.length} ${state.sales.length === 1 ? 'sale' : 'sales'} saved on this device.`;
  $('#clear-sales').hidden = state.sales.length === 0;
  if (!sorted.length) {
    list.append(element('div', 'empty-state', 'No sales recorded yet. Add your first sale above. Your dashboard will update automatically.'));
    return;
  }
  for (const record of sorted) {
    const totals = calculateSale(record);
    const card = element('article', 'sale-card');
    const top = element('div', 'sale-card-top');
    const detail = document.createElement('div');
    detail.append(element('h3', '', record.product || 'Unnamed product'));
    detail.append(element('p', 'sale-meta', `${record.date} · ${totals.quantity} ${totals.quantity === 1 ? 'unit' : 'units'} · ${money(record.unitPrice)} each`));
    top.append(detail);
    const profit = element('div', `sale-profit${totals.profit < 0 ? ' negative' : ''}`, money(totals.profit));
    profit.append(element('small', 'sale-meta', 'estimated profit'));
    top.append(profit); card.append(top);
    const nums = element('div', 'sale-numbers');
    for (const [label, value] of [['Revenue', money(totals.revenue)], ['Expenses', money(totals.expenses)], ['Margin', formatPercent(totals.margin)]]) {
      const cell = document.createElement('div'); cell.append(element('span', '', label), element('b', '', value)); nums.append(cell);
    }
    card.append(nums);
    const actions = element('div', 'sale-actions');
    const edit = element('button', 'small-button', 'Edit'); edit.type = 'button'; edit.dataset.action = 'edit'; edit.dataset.id = record.id;
    const del = element('button', 'small-button delete', 'Delete'); del.type = 'button'; del.dataset.action = 'delete'; del.dataset.id = record.id;
    actions.append(edit, del); card.append(actions); list.append(card);
  }
}

function editSale(id) {
  const record = state.sales.find(item => item.id === id);
  if (!record) return;
  const form = $('#sale-form');
  for (const key of ['id', 'date', 'product', 'quantity', 'unitPrice', 'discountPercent', 'unitCost', 'otherCost', 'feePercent', 'fixedExpenses']) {
    form.elements.namedItem(key).value = record[key] ?? '';
  }
  $('#sale-form-title').textContent = 'Edit sale'; $('#sale-submit').textContent = 'Save changes'; $('#cancel-edit').hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  form.elements.product.focus({ preventScroll: true });
}

function renderDashboard() {
  const summary = summarizeSales(state.sales);
  $('#dash-count').textContent = summary.count.toLocaleString();
  $('#dash-revenue').textContent = money(summary.revenue);
  $('#dash-expenses').textContent = money(summary.expenses);
  $('#dash-profit').textContent = money(summary.profit);
  $('#dash-profit').classList.toggle('negative', summary.profit < 0);
  $('#dash-margin').textContent = `${formatPercent(summary.margin)} margin`;
  const best = $('#best-product'); best.replaceChildren();
  const icon = element('span', 'best-icon', '★');
  const text = document.createElement('div');
  if (summary.bestProduct) {
    text.append(element('strong', '', summary.bestProduct.name));
    text.append(element('p', '', `${money(summary.bestProduct.profit)} profit · ${money(summary.bestProduct.revenue)} revenue`));
  } else {
    text.append(element('strong', '', 'No sales yet'));
    text.append(element('p', '', 'Add sales records to see product performance.'));
  }
  best.append(icon, text);
  const months = monthlySeries(state.sales);
  renderChart(months);
  renderMonthlyTable(months);
}

function renderChart(months) {
  const svg = $('#monthly-chart');
  svg.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg';
  const width = 600, height = 230, left = 44, right = 8, top = 10, bottom = 34;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const maxPositive = Math.max(1, ...months.flatMap(m => [m.revenue, m.profit, 0]));
  const maxNegative = Math.max(0, ...months.map(m => Math.abs(Math.min(0, m.profit))));
  const scale = maxPositive + maxNegative;
  const chartHeight = height - top - bottom;
  const baseline = top + (maxPositive / scale) * chartHeight;
  const grid = document.createElementNS(ns, 'line');
  grid.setAttribute('x1', left); grid.setAttribute('x2', width-right); grid.setAttribute('y1', baseline); grid.setAttribute('y2', baseline); grid.setAttribute('stroke', '#dce5de'); svg.append(grid);
  const yLabel = document.createElementNS(ns, 'text');
  yLabel.textContent = money(maxPositive); yLabel.setAttribute('x', '4'); yLabel.setAttribute('y', String(top+8)); yLabel.setAttribute('fill', '#65756d'); yLabel.setAttribute('font-size', '10'); svg.append(yLabel);
  if (maxNegative > 0) {
    const lowLabel = document.createElementNS(ns, 'text'); lowLabel.textContent = money(-maxNegative);
    lowLabel.setAttribute('x', '4'); lowLabel.setAttribute('y', String(height-4)); lowLabel.setAttribute('fill', '#65756d'); lowLabel.setAttribute('font-size', '9'); svg.append(lowLabel);
  }
  const groupWidth = (width-left-right) / months.length;
  const barWidth = Math.min(24, groupWidth * .26);
  months.forEach((month, index) => {
    const xCenter = left + groupWidth * index + groupWidth / 2;
    const values = [month.revenue, month.profit];
    values.forEach((value, barIndex) => {
      const barHeight = Math.max(value !== 0 ? 2 : 0, Math.abs(value) / scale * chartHeight);
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', String(xCenter + (barIndex ? 2 : -barWidth - 2)));
      rect.setAttribute('y', String(value >= 0 ? baseline - barHeight : baseline));
      rect.setAttribute('width', String(barWidth)); rect.setAttribute('height', String(barHeight));
      rect.setAttribute('rx', '4'); rect.setAttribute('fill', barIndex ? '#c99c38' : '#2f7653');
      rect.setAttribute('aria-label', `${month.label} ${barIndex ? 'profit' : 'revenue'} ${money(value)}`);
      svg.append(rect);
    });
    const label = document.createElementNS(ns, 'text'); label.textContent = month.label;
    label.setAttribute('x', String(xCenter)); label.setAttribute('y', String(height-11)); label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', '#65756d'); label.setAttribute('font-size', '10'); svg.append(label);
  });
}

function renderMonthlyTable(months) {
  const table = $('#monthly-table'); table.replaceChildren();
  const heading = element('div', 'month-row');
  heading.append(element('span', '', 'Month'), element('span', '', 'Revenue'), element('span', '', 'Profit')); table.append(heading);
  for (const month of [...months].reverse()) {
    const row = element('div', 'month-row');
    row.append(element('span', '', `${month.label} ${month.key.slice(0,4)}`), element('strong', '', money(month.revenue)), element('strong', '', money(month.profit)));
    table.append(row);
  }
}

function exportCsv() {
  const headers = ['Date', 'Product', 'Quantity', 'Currency display', 'Unit selling price', 'Discount percent', 'Revenue', 'Unit product cost', 'Other variable cost per unit', 'Payment fee percent', 'Fixed expenses', 'Total expenses', 'Estimated profit', 'Profit margin'];
  const rows = state.sales.map(record => {
    const totals = calculateSale(record);
    const safeProduct = /^[\u0000-\u0020]*[=+\-@]/.test(record.product) ? `'${record.product}` : record.product;
    return [record.date, safeProduct, totals.quantity, state.settings.currency, record.unitPrice, record.discountPercent, totals.revenue, record.unitCost, record.otherCost, record.feePercent, record.fixedExpenses, totals.expenses, totals.profit, formatPercent(totals.margin)];
  });
  const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  downloadFile('DEETAR_Profit_Sales.csv', `\uFEFF${[headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n')}`, 'text/csv;charset=utf-8');
}

function downloadSummary() {
  const summary = summarizeSales(state.sales);
  const rows = monthlySeries(state.sales).map(month => `${month.label} ${month.key.slice(0,4)}: revenue ${money(month.revenue)}, profit ${money(month.profit)}`);
  const lines = [
    'DEETAR PROFIT - BUSINESS SUMMARY', `Currency display: ${state.settings.currency} (no conversion)`,
    `Sales: ${summary.count}`, `Revenue: ${money(summary.revenue)}`, `Expenses: ${money(summary.expenses)}`,
    `Estimated profit: ${money(summary.profit)}`, `Profit margin: ${formatPercent(summary.margin)}`,
    `Best product by recorded profit: ${summary.bestProduct ? `${summary.bestProduct.name} (${money(summary.bestProduct.profit)})` : 'No sales recorded'}`,
    '', 'MONTHLY PERFORMANCE', ...rows, '', 'Estimate only. Based on records entered in this browser.',
  ];
  downloadFile('DEETAR_Profit_Business_Summary.txt', lines.join('\r\n'), 'text/plain;charset=utf-8');
}

function downloadBackup() {
  const backup = { ...state, exportedAt: new Date().toISOString(), app: 'DEETAR PROFIT Mobile Edition' };
  downloadFile('DEETAR_Profit_Backup.json', JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
}

async function restoreBackup(file) {
  const parsed = parseBackup(await file.text());
  if (!window.confirm(`Restore ${parsed.sales.length} sales record(s)? This replaces the data currently stored in this browser.`)) return;
  state = {
    version: 1,
    settings: { currency: CURRENCIES[parsed.settings.currency] ? parsed.settings.currency : 'NGN' },
    calculator: { ...DEFAULT_CALCULATOR, ...parsed.calculator },
    sales: parsed.sales.map(row => ({ ...row, id: String(row.id || makeId()) })),
  };
  fillCalculator(state.calculator); $('#currency-select').value = state.settings.currency;
  saveState(); updateCalculator(); renderSales(); renderDashboard(); showNotice('Backup restored to this device.');
}

function bindEvents() {
  $$('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  $('#currency-select').addEventListener('change', event => {
    state.settings.currency = CURRENCIES[event.target.value] ? event.target.value : 'NGN';
    saveState(); updateCalculator(); renderSales(); renderDashboard();
  });
  $('#calculator-form').addEventListener('input', updateCalculator);
  $('#reset-calculator').addEventListener('click', () => { fillCalculator(DEFAULT_CALCULATOR); updateCalculator(); showNotice('Sample values loaded.'); });
  $('#save-calculation').addEventListener('click', downloadCalculation);
  $('#sale-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const record = getSaleFormData();
    if (!record.product || !record.date || record.quantity < 1) { showNotice('Enter a product, date and quantity of at least one.', true); return; }
    const index = state.sales.findIndex(row => row.id === record.id);
    if (index >= 0) state.sales[index] = record; else state.sales.push(record);
    saveState(); clearSaleForm(); renderSales(); renderDashboard();
    showNotice(index >= 0 ? 'Sale updated.' : 'Sale saved.');
  });
  $('#cancel-edit').addEventListener('click', clearSaleForm);
  $('#sales-list').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === 'edit') editSale(id);
    if (button.dataset.action === 'delete' && window.confirm('Delete this sales record?')) {
      state.sales = state.sales.filter(row => row.id !== id); saveState(); renderSales(); renderDashboard(); showNotice('Sale deleted.');
    }
  });
  $('#clear-sales').addEventListener('click', () => {
    if (window.confirm('Delete all sales records saved in this browser? This cannot be undone unless you made a backup.')) {
      state.sales = []; saveState(); renderSales(); renderDashboard(); showNotice('All sales records cleared.');
    }
  });
  $('#export-csv').addEventListener('click', exportCsv);
  $('#download-summary').addEventListener('click', downloadSummary);
  $('#backup-json').addEventListener('click', downloadBackup);
  $('#restore-json').addEventListener('change', async event => {
    const [file] = event.target.files || [];
    if (!file) return;
    try { await restoreBackup(file); } catch (error) { showNotice(error.message || 'Could not restore this backup.', true); }
    event.target.value = '';
  });
}

function initialize() {
  $('#currency-select').value = state.settings.currency;
  fillCalculator(state.calculator);
  $('#sale-form').elements.date.value = localDateString(new Date());
  bindEvents(); updateCalculator(); renderSales(); renderDashboard();
  if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => showNotice('Offline installation is not available in this browser session. Online calculator features still work.'));
  }
}

initialize();
