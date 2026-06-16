# Security Policy - Sari-Smart

## Overview

Sari-Smart is a Progressive Web App for offline-capable inventory and POS management for Philippine sari-sari stores. This document outlines the security practices, policies, and incident response procedures.

## Security Architecture

### Layers of Defense

1. **Authentication Layer**: Dexie Cloud handles user authentication and session management
2. **Data Validation Layer**: Input validation utilities prevent malicious/invalid data entry
3. **Database Layer**: Dexie IndexedDB with transaction support for data integrity
4. **Presentation Layer**: React with auto-escaping prevents XSS attacks

## Credential Management

### Environment Secrets

**CRITICAL**: Never commit sensitive credentials to the repository.

#### Files to Keep Secret

- `dexie-cloud.key` - Contains Dexie Cloud API credentials
- `.env` files - Environment variables with API keys
- Any personal access tokens or API keys

#### What to Do

1. Add all sensitive files to `.gitignore`:
   ```
   dexie-cloud.key
   dexie-cloud.json
   .env
   .env.local
   ```

2. Store credentials securely using:
   - Environment variables in deployment platforms (Vercel, Netlify, etc.)
   - Secure vaults (AWS Secrets Manager, Azure Key Vault, etc.)
   - Local `.env.local` files (never committed)

3. Rotate credentials if exposed:
   - Log into Dexie Cloud dashboard
   - Generate new API credentials
   - Update `.env` or deployment platform variables
   - Remove old credentials from all locations

## Input Validation & Sanitization

### Validation Framework

All user inputs are validated using the centralized validation module at `/src/utils/validation.js`.

#### Validation Rules

**Product Form**
- Name: 1-100 characters, alphanumeric + common punctuation
- Price: ₱0.01 - ₱999,999, exactly 2 decimal places
- Stock: 0-999,999 units, non-negative integers
- Barcode: Optional, 0-50 alphanumeric characters

**Customer Form**
- Name: 1-50 characters, letters/spaces/hyphens/apostrophes only
- Payment Amount: ₱0.01 - ₱999,999, exactly 2 decimal places

**Checkout Form**
- Cash Given: ₱0.01 - ₱999,999, exactly 2 decimal places

### How to Add New Validations

1. Add validator function to `/src/utils/validation.js`:
   ```javascript
   export const validateFieldName = (value) => {
     // validation logic
     if (!valid) {
       return { valid: false, error: 'Error message' };
     }
     return { valid: true, value: cleanedValue };
   };
   ```

2. Import in component:
   ```javascript
   import { validateFieldName } from '../utils/validation';
   ```

3. Use before database writes:
   ```javascript
   const validation = validateFieldName(userInput);
   if (!validation.valid) {
     setErrors({ field: validation.error });
     return;
   }
   // Use validation.value for database
   ```

## Financial Calculations

### Precision & Accuracy

All currency calculations use **integer arithmetic in cents** to prevent floating-point errors.

#### Why Integer Arithmetic?

JavaScript floating-point errors:
```javascript
0.1 + 0.2  // Returns 0.30000000000000004 ❌
```

Instead, we use cents (integers):
```javascript
pesoCents("0.10") + pesoCents("0.20")  // Returns 30 (cents) ✓
centsToPeso(30)  // Returns 0.30 (exact) ✓
```

#### Money Utility Functions

Located in `/src/utils/money.js`:

- `pesoCents(pesos)` - Convert pesos to cents
- `centsToPeso(cents)` - Convert cents to pesos
- `formatPeso(cents)` - Format for display "₱X.XX"
- `addCents(c1, c2)` - Add amounts
- `subtractCents(min, sub)` - Subtract amounts
- `calculateTotal(items)` - Sum cart items
- `calculateChange(given, total)` - Calculate change

#### Example Usage

```javascript
import { pesoCents, calculateTotal, formatPeso } from '../utils/money';

const cart = [
  { retailPrice: 10.50, qty: 2 },
  { retailPrice: 5.25, qty: 1 }
];

const totalCents = calculateTotal(
  cart.map(item => ({
    retailPrice: pesoCents(item.retailPrice),
    qty: item.qty
  }))
);

console.log(formatPeso(totalCents));  // "₱26.25"
```

## Database Integrity

### Atomic Transactions

Critical operations use Dexie transactions to prevent race conditions.

#### Protected Operations

- **Sales/Checkout**: Record sale AND deduct stock atomically
- **Credit Debt**: Update customer balance AND record transaction AND deduct stock atomically
- **Payments**: Update balance AND record payment atomically

#### Example: Atomic Checkout

```javascript
await db.transaction('rw', db.products, db.sales, async () => {
  // 1. Verify stock availability
  for (const item of cart) {
    const product = await db.products.get(item.id);
    if (product.stock < item.qty) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
  }

  // 2. Record sale
  await db.sales.add({ total, items, date: new Date() });

  // 3. Deduct stock
  for (const item of cart) {
    const product = await db.products.get(item.id);
    await db.products.update(item.id, {
      stock: product.stock - item.qty
    });
  }
  // If ANY step fails, entire transaction rolls back ✓
});
```

### Null Safety

All functions check for null/undefined before property access:

```javascript
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '??';
  // Safe to call string methods
  return name.trim().split(' ')...
};
```

## Error Handling & Logging

### Production vs Development

Console logs are only shown in development mode:

```javascript
if (import.meta.env.DEV) {
  console.error('Debug info:', error);
}
```

No sensitive error messages are shown to users:

```javascript
// ✗ DON'T
alert(error.message);  // May leak database structure

// ✓ DO
setError("Error processing request. Please try again.");
```

### User Feedback

- Validation errors: Specific, actionable messages
- System errors: Generic messages with offer to retry
- Success messages: Clear confirmation

## Offline Security

### Local Storage

All data is stored locally in IndexedDB:
- No data is sent anywhere until explicitly synced to Dexie Cloud
- Users have full control over their data

### Cloud Sync

When syncing to Dexie Cloud:
- Authentication required
- HTTPS encryption in transit
- Dexie Cloud handles encryption at rest
- User data isolated per authenticated user

## XSS Prevention

React auto-escapes all output by default:

```javascript
// ✓ SAFE (auto-escaped)
<div>{userInputData}</div>

// ✓ SAFE (sanitized)
<div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />

// ✗ UNSAFE (never use)
eval(userInput)
new Function(userInput)
```

## Regular Security Practices

### Code Review

- All changes reviewed before merge
- Security implications assessed
- Validation requirements verified

### Dependency Updates

- Regular npm audits: `npm audit`
- Security patches applied promptly
- Breaking changes tested

### Testing

- Input validation tests
- Financial calculation tests
- Race condition tests
- Null safety tests

## Incident Response

### If Credentials Are Exposed

1. **Immediately revoke** in Dexie Cloud dashboard
2. **Generate new credentials**
3. **Update all environments** with new credentials
4. **Review logs** for unauthorized access
5. **Clean Git history** if credentials were committed
6. **Notify users** if their data may be affected

### If Data Corruption Is Detected

1. **Stop using app**
2. **Create backup** of current IndexedDB
3. **Identify root cause**
4. **Restore from backup** if available
5. **Fix underlying issue**
6. **Verify data integrity**

### If XSS/Injection Attack Occurs

1. **Isolate** the vulnerable code
2. **Deploy patch** immediately
3. **Clear user caches** (service worker)
4. **Audit** user data for compromise

## Security Checklist

- ✅ All inputs validated before database writes
- ✅ All financial calculations use integer arithmetic
- ✅ All critical operations use atomic transactions
- ✅ All null/undefined accesses protected
- ✅ No console errors in production
- ✅ All credentials in .gitignore
- ✅ No hardcoded secrets in code
- ✅ React auto-escaping for XSS prevention
- ✅ Service worker for offline integrity
- ✅ Regular dependency audits

## For Developers

### When Adding Features

1. **Validate all inputs** using validation utilities
2. **Use formatPeso()** for currency formatting
3. **Use db.transaction()** for multi-step operations
4. **Check for null/undefined** before property access
5. **Never log sensitive data** in production
6. **Review security implications** before committing

### When Troubleshooting

- ❌ Don't remove validation checks
- ❌ Don't hardcode API keys
- ❌ Don't bypass Dexie transactions
- ❌ Don't log full errors to users
- ✅ Do use dev mode for debugging
- ✅ Do create test cases for edge cases
- ✅ Do review security changes

## Questions?

Contact the security team or create an issue on GitHub with `security` label.

---

**Last Updated**: 2026-03-20
**Version**: 1.0
**Owner**: Security Team
