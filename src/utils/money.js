/**
 * Money/Currency utilities for Philippine Pesos
 * Uses integer arithmetic (cents) to avoid floating-point precision errors
 *
 * All amounts are stored as integers representing cents (sentimo)
 * Example: ₱100.50 = 10050 cents
 * This prevents floating-point errors like 0.1 + 0.2 ≠ 0.3
 */

/**
 * Convert Philippine Pesos string/number to cents
 * @param {string|number} pesos - Amount in pesos
 * @returns {number} Amount in cents
 * @example
 * pesoCents("100.50") => 10050
 * pesoCents(100) => 10000
 */
export const pesoCents = (pesos) => {
  const num = Number(pesos);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

/**
 * Convert cents to Philippine Pesos string for display
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted as "₱X.XX"
 * @example
 * formatPeso(10050) => "₱100.50"
 * formatPeso(1000) => "₱10.00"
 */
export const formatPeso = (cents) => {
  const pesos = (Math.abs(cents) / 100).toFixed(2);
  const symbol = cents < 0 ? '-₱' : '₱';
  return `${symbol}${pesos}`;
};

/**
 * Convert cents to numeric pesos
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in pesos
 * @example
 * centsToPeso(10050) => 100.50
 */
export const centsToPeso = (cents) => {
  return Math.round(cents) / 100;
};

/**
 * Add two amounts in cents
 * @param {number} cents1 - First amount in cents
 * @param {number} cents2 - Second amount in cents
 * @returns {number} Sum in cents
 * @example
 * addCents(1000, 500) => 1500
 */
export const addCents = (cents1, cents2) => {
  if (isNaN(cents1)) cents1 = 0;
  if (isNaN(cents2)) cents2 = 0;
  return Math.round(cents1) + Math.round(cents2);
};

/**
 * Subtract two amounts in cents
 * @param {number} minuend - First amount in cents
 * @param {number} subtrahend - Second amount in cents
 * @returns {number} Difference in cents
 * @example
 * subtractCents(2000, 500) => 1500
 */
export const subtractCents = (minuend, subtrahend) => {
  if (isNaN(minuend)) minuend = 0;
  if (isNaN(subtrahend)) subtrahend = 0;
  return Math.round(minuend) - Math.round(subtrahend);
};

/**
 * Multiply amount by quantity
 * @param {number} cents - Amount in cents
 * @param {number} qty - Quantity (integer)
 * @returns {number} Product in cents
 * @example
 * multiplyCents(1000, 3) => 3000
 */
export const multiplyCents = (cents, qty) => {
  if (isNaN(cents)) cents = 0;
  if (isNaN(qty)) qty = 0;
  return Math.round(cents) * Math.round(qty);
};

/**
 * Calculate total from array of items
 * @param {Array} items - Array of items with price (cents) and qty
 * @returns {number} Total in cents
 * @example
 * const items = [
 *   { retailPrice: 1000, qty: 2 },  // ₱10.00 x 2
 *   { retailPrice: 500, qty: 1 }    // ₱5.00 x 1
 * ];
 * calculateTotal(items) => 2500
 */
export const calculateTotal = (items) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const itemTotal = multiplyCents(item.retailPrice || 0, item.qty || 0);
    return addCents(sum, itemTotal);
  }, 0);
};

/**
 * Calculate change (sukli)
 * @param {number} cashGiven - Cash given in cents
 * @param {number} total - Total due in cents
 * @returns {number} Change in cents
 * @example
 * calculateChange(50000, 35000) => 15000 (₱150 given, ₱350 total = ₱150 change)
 */
export const calculateChange = (cashGiven, total) => {
  return subtractCents(cashGiven, total);
};

/**
 * Validate if cash given is sufficient for total
 * @param {number} cashGiven - Cash given in cents
 * @param {number} total - Total due in cents
 * @returns {boolean}
 * @example
 * isPaymentSufficient(50000, 35000) => true
 * isPaymentSufficient(30000, 35000) => false
 */
export const isPaymentSufficient = (cashGiven, total) => {
  return Math.round(cashGiven) >= Math.round(total);
};

/**
 * Format amount as item display (price x qty = total)
 * @param {string|number} price - Price in pesos
 * @param {number} qty - Quantity
 * @returns {string} Formatted display
 * @example
 * formatLineItem(10, 2) => "₱10.00 x 2 = ₱20.00"
 */
export const formatLineItem = (price, qty) => {
  const priceCents = pesoCents(price);
  const total = multiplyCents(priceCents, qty);
  return `${formatPeso(priceCents)} x ${qty} = ${formatPeso(total)}`;
};
