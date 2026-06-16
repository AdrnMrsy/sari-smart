# Sari-Smart 🏪

A Progressive Web App (PWA) for offline-capable inventory and POS management designed specifically for Philippine sari-sari stores.

## Features ✨

- **Offline-First**: Works completely offline with full data persistence
- **Real-time Sync**: Optional cloud sync via Dexie Cloud
- **Product Management**: Add, search, and manage inventory
- **Sales Dashboard**: Real-time sales analytics and insights
- **Credit System**: Track customer credit (on-account sales)
- **Input Validation**: Comprehensive validation for all business data
- **Precise Money Handling**: Integer arithmetic to prevent floating-point errors
- **Mobile-Optimized**: Touch-friendly interface for mobile devices
- **Secure**: Encryption, atomic transactions, XSS protection

## Quick Start 🚀

### Prerequisites
- Node.js 18+ and npm 9+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd sari-smart

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your Dexie Cloud credentials
```

### Development

```bash
# Start development server (HMR enabled)
npm run dev

# Open http://localhost:5173 in your browser
```

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Deploy the dist/ folder to your hosting
```

## Project Structure 📁

```
sari-smart/
├── src/
│   ├── components/          # React components
│   │   ├── AddProduct.jsx      # Add new products
│   │   ├── PriceSearch.jsx     # Search & sell products
│   │   ├── CheckoutModal.jsx   # Transaction processing
│   │   ├── CreditLedger.jsx    # Customer credit system
│   │   └── SalesDashboard.jsx  # Sales analytics
│   ├── utils/               # Utility functions
│   │   ├── money.js            # Currency calculations (₱)
│   │   └── validation.js       # Input validation rules
│   ├── db.js                # Dexie database setup
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
└── SECURITY.md             # Security policies
```

## Key Technologies 🛠️

- **React 19** - UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Dexie** - IndexedDB wrapper
- **Dexie Cloud** - Sync & authentication (optional)
- **Vite PWA Plugin** - Progressive Web App support

## Data Model 📊

### Products Table
```javascript
{
  id: Number,              // Auto-increment
  name: String,            // Product name (1-100 chars)
  retailPrice: Number,     // Price in ₱ (₱0.01 - ₱999,999)
  category: String,        // Predefined categories
  stock: Number,           // Units in inventory (0-999,999)
  barcode: String,         // Optional barcode (alphanumeric)
  createdAt: Date          // Timestamp
}
```

### Sales Table
```javascript
{
  id: Number,              // Auto-increment
  total: Number,           // Sale total in ₱
  items: String,           // "2x Item A, 1x Item B"
  date: Date               // Transaction timestamp
}
```

### Credit Ledger Table
```javascript
{
  id: Number,              // Auto-increment
  customerName: String,    // Customer name (1-50 chars)
  balance: Number,         // Total credit owed in ₱
  transactions: Array,     // Transaction history
  lastUpdated: Date        // Last activity timestamp
}
```

## Security Features 🔒

### Data Protection
- ✅ All inputs validated before database writes
- ✅ Integer arithmetic for financial calculations (no floating-point errors)
- ✅ Atomic transactions for critical operations
- ✅ XSS prevention via React auto-escaping
- ✅ Null-safety checks throughout

### Credentials & Secrets
- ✅ Dexie Cloud credentials in `.env.local` (never committed)
- ✅ `.gitignore` protects sensitive files
- ✅ See `SECURITY.md` for detailed policies

### Offline Storage
- ✅ All data stored locally in IndexedDB
- ✅ Optional cloud sync only when explicitly initiated
- ✅ Users maintain full data control

See `SECURITY.md` for comprehensive security documentation.

## Development Guidelines 💡

### Adding New Products
```javascript
// ✓ Always validate inputs
import { validateProductName, validatePrice } from '../utils/validation';

const nameVal = validateProductName(userInput);
if (!nameVal.valid) {
  // Handle error
  return;
}

// ✓ Use validated value for database
await db.products.add({
  name: nameVal.value,
  retailPrice: priceVal.value,
  // ... other fields
});
```

### Working with Money
```javascript
// ✓ Always use money utilities
import { pesoCents, formatPeso, calculateTotal } from '../utils/money';

const priceCents = pesoCents("100.50");  // 10050
const display = formatPeso(priceCents);   // "₱100.50"

// ✓ Add amounts in cents, display in pesos
const total = calculateTotal(cartItems);
console.log(formatPeso(total));
```

### Critical Operations
```javascript
// ✓ Use atomic transactions
await db.transaction('rw', db.products, db.sales, async () => {
  // All operations here are atomic
  // If any step fails, entire transaction rolls back
  await db.products.update(...);
  await db.sales.add(...);
});
```

### Error Handling
```javascript
// ✓ Generic messages to users
setError("Error processing request. Please try again.");

// ✗ Don't expose internal details
// setError(error.stack);

// ✓ Dev mode for detailed logging
if (import.meta.env.DEV) {
  console.error('Details:', error);
}
```

## Common Tasks 📝

### Enable/Disable Cloud Sync
Edit `src/App.jsx` where it shows login/logout buttons to launch Dexie Cloud authentication.

### Add New Category
Edit the `categories` array in `src/components/AddProduct.jsx`:
```javascript
const categories = [
  "General", "Canned Goods", "Noodles", "Drinks",
  "Your New Category"  // ← Add here
];
```

### Change Currency
The app uses Philippine Pesos (₱) by default. To change, search for:
- `formatPeso` in `src/utils/money.js`
- Currency symbol in money utility functions
- SECURITY.md validation rules

### Enable Barcode Scanning
The barcode field is ready in `AddProduct.jsx` - uncomment to enable.

## Testing 🧪

Currently using React development environment.

Future: Set up with Vitest and React Testing Library
```bash
npm install -D vitest @testing-library/react @testing-library/user-event
npm run test
npm run test:coverage
```

## Debugging 🐛

### Enable Debug Mode
```bash
# Add to .env.local
VITE_DEBUG=true

# Then reload app
```

### Browser DevTools
- **Application Tab**: View IndexedDB data
- **Network Tab**: Monitor cloud sync requests
- **Console**: See dev-mode error logs

### Common Issues

**Data not syncing to cloud?**
- Check login status in header
- Verify Dexie Cloud credentials in `.env.local`
- Check browser DevTools > Application > IndexedDB

**Validation errors?**
- See `SECURITY.md` for validation rules
- Check `src/utils/validation.js` for exact requirements

## Contributing 🤝

1. Read `SECURITY.md` for security guidelines
2. Validate all inputs using utilities
3. Use integer arithmetic for money
4. Test with actual data before committing
5. Never commit secrets

## Deployment 🚀

### Netlify / Vercel
```bash
# Build command
npm run build

# Publish directory
dist/
```

Set environment variables in deployment settings:
- `VITE_DEXIE_CLOUD_URL`
- `VITE_DEXIE_CLOUD_DATABASE_ID`

### Self-Hosted
1. Build: `npm run build`
2. Serve `dist/` folder as static site
3. Enable HTTPS (required for PWA, IndexedDB)
4. Set CORS headers if API on different domain

## License 📄

[Your License Here]

## Support 💬

For issues, questions, or security concerns:
- 💬 GitHub Issues: [your-repo/issues](https://github.com/yourusername/sari-smart/issues)
- 🔒 Security: See SECURITY.md for incident reporting

---

**Built with ❤️ for Philippine sari-sari store owners**
