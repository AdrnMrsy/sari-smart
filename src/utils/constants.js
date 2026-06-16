/**
 * Application-wide constants and enums
 * Centralized to prevent stringly-typed code and magic strings
 */

export const FORM_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const CREDIT_TRANSACTION_TYPE = {
  DEBT: 'debt',
  PAYMENT: 'payment',
};

export const PRODUCT_CATEGORIES = [
  'General',
  'Canned Goods',
  'Noodles',
  'Drinks',
  'Toiletries',
  'Snacks',
  'Load/Data',
  'Cigarettes',
  'Alcohol',
];
