/**
 * Input validation utilities for Sari-Smart
 * Ensures all user inputs meet business and security requirements
 */

/**
 * Validates product name
 * Rules: 1-100 characters, trimmed, no leading/trailing spaces
 */
export const validateProductName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Product name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Product name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Product name must be 100 characters or less' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validates monetary amounts (price, cash, payments, etc.)
 * Rules: > 0, max ₱999,999, up to 2 decimal places
 * @private Helper function - use validatePrice, validateCashAmount instead
 */
const validateMonetaryAmount = (amount, fieldLabel) => {
  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: `${fieldLabel} must be a valid number` };
  }

  if (numAmount <= 0) {
    return { valid: false, error: `${fieldLabel} must be greater than 0` };
  }

  if (numAmount > 999999) {
    return { valid: false, error: `${fieldLabel} cannot exceed ₱999,999` };
  }

  // Check decimal places using numeric comparison (more efficient)
  if (numAmount !== Math.round(numAmount * 100) / 100) {
    return { valid: false, error: `${fieldLabel} can have up to 2 decimal places` };
  }

  return { valid: true, value: parseFloat(numAmount.toFixed(2)) };
};

/**
 * Validates price (in Philippine Pesos)
 * Rules: > 0, max ₱999,999, up to 2 decimal places
 */
export const validatePrice = (price) => {
  return validateMonetaryAmount(price, 'Price');
};

/**
 * Validates stock quantity
 * Rules: Integer >= 0, max 999,999
 */
export const validateStock = (stock) => {
  // Check for decimals before parsing
  if (typeof stock === 'string' && stock.includes('.')) {
    return { valid: false, error: 'Stock must be a whole number' };
  }

  const numStock = parseInt(stock, 10);

  if (isNaN(numStock)) {
    return { valid: false, error: 'Stock must be a valid number' };
  }

  if (numStock < 0) {
    return { valid: false, error: 'Stock cannot be negative' };
  }

  if (numStock > 999999) {
    return { valid: false, error: 'Stock cannot exceed 999,999' };
  }

  return { valid: true, value: numStock };
};

/**
 * Validates barcode
 * Rules: Optional, alphanumeric, max 50 characters
 */
export const validateBarcode = (barcode) => {
  if (!barcode || barcode.trim().length === 0) {
    // Barcode is optional
    return { valid: true, value: '' };
  }

  const trimmed = barcode.trim();

  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Barcode must contain only letters and numbers' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Barcode must be 50 characters or less' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validates customer name
 * Rules: 1-50 characters, letters/spaces/hyphens only
 */
export const validateCustomerName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Customer name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Customer name cannot be empty' };
  }

  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { valid: false, error: 'Customer name must contain only letters, spaces, hyphens, and apostrophes' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Customer name must be 50 characters or less' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validates cash amount
 * Rules: > 0, max ₱999,999, up to 2 decimal places
 */
export const validateCashAmount = (amount) => {
  return validateMonetaryAmount(amount, 'Amount');
};

/**
 * Validates quantity in cart/transaction
 * Rules: Integer > 0, max 999,999
 */
export const validateQuantity = (qty) => {
  const numQty = parseInt(qty, 10);

  if (isNaN(numQty)) {
    return { valid: false, error: 'Quantity must be a valid number' };
  }

  if (numQty <= 0) {
    return { valid: false, error: 'Quantity must be greater than 0' };
  }

  if (numQty > 999999) {
    return { valid: false, error: 'Quantity cannot exceed 999,999' };
  }

  return { valid: true, value: numQty };
};
