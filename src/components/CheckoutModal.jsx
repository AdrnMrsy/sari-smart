import { useState } from 'react';
import { db } from '../db';
import { pesoCents, centsToPeso, calculateTotal, calculateChange, isPaymentSufficient, formatPeso } from '../utils/money';
import { validateCashAmount } from '../utils/validation';

export function CheckoutModal({ cart, onClose, onClearCart }) {
  const [cashGiven, setCashGiven] = useState("");
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'success'
  const [error, setError] = useState("");

  // Calculate total in cents using the money utility
  const totalCents = calculateTotal(
    cart.map(item => ({
      retailPrice: pesoCents(item.retailPrice),
      qty: item.qty
    }))
  );

  const cashGivenCents = cashGiven ? pesoCents(cashGiven) : 0;
  const changeCents = calculateChange(cashGivenCents, totalCents);

  // Quick Cash Denominations
  const bills = [20, 50, 100, 200, 500, 1000];

  async function handleFinalize() {
    // Validate cash input
    const validation = validateCashAmount(cashGiven);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (!isPaymentSufficient(validation.value, centsToPeso(totalCents))) {
      setError("Payment is insufficient");
      return;
    }

    setError("");
    setStatus('saving');

    try {
      const itemNames = cart.map(i => `${i.qty}x ${i.name}`).join(", ");

      // Use Dexie transaction for atomic operation
      // This prevents race conditions from concurrent sales
      await db.transaction('rw', db.products, db.sales, async () => {
        // 1. Verify stock availability before deducting
        for (const item of cart) {
          const product = await db.products.get(item.id);
          if (!product) {
            throw new Error(`Product ${item.name} not found`);
          }
          if (product.stock < item.qty) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.qty}`);
          }
        }

        // 2. Record Sale
        await db.sales.add({
          total: centsToPeso(totalCents),
          items: itemNames,
          date: new Date()
        });

        // 3. Deduct Stock (happens after sale is recorded)
        for (const item of cart) {
          const product = await db.products.get(item.id);
          if (product && product.stock >= item.qty) {
            await db.products.update(item.id, {
              stock: product.stock - item.qty
            });
          }
        }
      });

      // 4. Show Success Screen
      setStatus('success');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Checkout error:', err);
      }
      setError(err.message || "Error processing sale. Please try again.");
      setStatus('idle');
    }
  }

  function handleClose() {
    onClearCart();
    onClose();
  }

  // --- SUCCESS VIEW ---
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-neutral-950/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center animate-slide-up shadow-elevation-lg">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-success-100 text-success-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-neutral-800 mb-2">Payment Received!</h2>
          <p className="text-neutral-500 font-medium mb-6">Transaction completed successfully.</p>
          
          <div className="bg-gradient-to-br from-success-50 to-success-100/50 p-6 rounded-2xl border-2 border-success-200 mb-6">
            <div className="text-xs font-bold text-success-600 uppercase tracking-wider mb-2">Change (Sukli)</div>
            <div className="text-5xl font-black text-success-700 tracking-tight">{formatPeso(changeCents)}</div>
          </div>

          <button 
            onClick={handleClose} 
            aria-label="Start new transaction"
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-elevation hover:shadow-elevation-lg active:scale-95 transition-all hover:bg-blue-700"
          >
            Start New Transaction
          </button>
        </div>
      </div>
    );
  }

  // --- CHECKOUT VIEW ---
  return (
    <div className="fixed inset-0 bg-neutral-950/40 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-50 w-full max-w-md rounded-t-3xl sm:rounded-2xl h-[90vh] sm:h-[85vh] flex flex-col animate-slide-up shadow-elevation-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-4 border-b border-neutral-200 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-xl text-neutral-800">Checkout</h2>
            <p className="text-xs text-neutral-500">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close checkout"
            className="w-8 h-8 bg-neutral-200 hover:bg-neutral-300 rounded-full text-neutral-700 font-bold flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable List (Receipt Style) */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {cart.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200 shadow-base hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.qty}x
                </div>
                <div className="font-medium text-neutral-700">{item.name}</div>
              </div>
              <div className="font-bold text-neutral-900">{formatPeso(pesoCents(item.retailPrice * item.qty))}</div>
            </div>
          ))}
        </div>

        {/* Footer Calculation Area */}
        <div className="bg-white p-5 border-t border-neutral-200 rounded-t-3xl shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] sticky bottom-0 z-20">
          
          {/* Total Display */}
          <div className="flex justify-between items-end mb-6">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Amount</span>
            <span className="text-4xl font-black bg-gradient-to-r from-brand-600 to-brand-700 text-transparent bg-clip-text">{formatPeso(totalCents)}</span>
          </div>
          
          {/* Payment Input */}
          <div className="space-y-4 mb-6">
            {error && (
              <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-3 flex items-start gap-2 animate-slide-down">
                <svg className="h-5 w-5 text-accent-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-accent-700 font-medium">{error}</span>
              </div>
            )}

            <div className="relative">
              <span className="absolute left-4 top-4 text-neutral-400 font-bold text-xl">₱</span>
              <input
                type="number"
                placeholder="Enter cash amount"
                autoFocus
                aria-label="Cash amount"
                className={`w-full pl-10 p-4 bg-neutral-100 border-2 rounded-xl font-black text-2xl text-neutral-800 outline-none transition-all focus:bg-white ${
                  error ? 'border-accent-400 focus:border-accent-400' : 'border-neutral-200 focus:border-brand-500'
                }`}
                value={cashGiven}
                onChange={e => {
                  setCashGiven(e.target.value);
                  setError("");
                }}
              />
              {/* Exact Amount Button */}
              <button
                onClick={() => {
                  setCashGiven(centsToPeso(totalCents));
                  setError("");
                }}
                aria-label="Set cash to exact amount"
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase transition-colors"
              >
                Exact
              </button>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {bills.map(bill => (
                <button
                  key={bill}
                  onClick={() => {
                    setCashGiven(bill);
                    setError("");
                  }}
                  aria-label={`Set cash to ₱${bill}`}
                  className="flex-shrink-0 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-lg border border-neutral-200 hover:border-neutral-300 active:bg-blue-600 active:text-white transition-all"
                >
                  ₱{bill}
                </button>
              ))}
            </div>
          </div>

          {/* Change Indicator */}
          {cashGiven && (
             <div className="flex justify-between items-center mb-4 px-2 py-2 bg-neutral-100 rounded-lg">
                <span className="font-bold text-neutral-600 text-sm">Change</span>
                <span className={`font-black text-lg tracking-tight ${changeCents < 0 ? 'text-accent-600' : 'text-success-600'}`}>
                  {changeCents < 0 ? 'Insufficient' : formatPeso(changeCents)}
                </span>
             </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleFinalize}
            disabled={!cashGiven || changeCents < 0 || status === 'saving'}
            aria-label="Confirm sale"
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-md transition-all ${
              (!cashGiven || changeCents < 0 || status === 'saving')
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-elevation active:scale-95'
            }`}
          >
            {status === 'saving' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              'Confirm Sale'
            )}
          </button>

        </div>
      </div>
    </div>
  );
}