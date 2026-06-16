import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { pesoCents, centsToPeso, calculateTotal, calculateChange, formatPeso } from '../utils/money';
import { validateCustomerName, validateCashAmount } from '../utils/validation';

export function CreditLedger() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Modals State
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Data for Debt/Payment
  const [itemSearch, setItemSearch] = useState("");
  const [debtCart, setDebtCart] = useState([]); // Now stores { ...product, qty: 1 }
  
  // Payment Calculator State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // --- 1. QUERIES ---
  const customers = useLiveQuery(async () => db.customers.orderBy('balance').reverse().toArray());
  
  const searchResults = useLiveQuery(async () => {
    if (!itemSearch) return [];
    return await db.products
      .filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()))
      .limit(5)
      .toArray();
  }, [itemSearch]);

  const history = useLiveQuery(async () => {
    if (!selectedCustomer) return [];
    return await db.credit_logs
      .where('customerId').equals(selectedCustomer.id)
      .reverse()
      .toArray();
  }, [selectedCustomer]);

  // --- 2. CUSTOMER MANAGEMENT ---
  async function handleAddCustomer(e) {
    e.preventDefault();
    setValidationErrors({});

    const validation = validateCustomerName(newCustomerName);
    if (!validation.valid) {
      setValidationErrors({ name: validation.error });
      return;
    }

    try {
      await db.customers.add({ name: validation.value, balance: 0 });
      setNewCustomerName("");
      setShowAddCustomer(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Add customer error:', error);
      }
      setValidationErrors({ submit: "Error adding customer" });
    }
  }

  async function handleDeleteCustomer() {
    if (!selectedCustomer) return;
    if (confirm(`Are you sure you want to delete ${selectedCustomer.name}? This will delete their transaction history too.`)) {
      // 1. Delete logs
      await db.credit_logs.where('customerId').equals(selectedCustomer.id).delete();
      // 2. Delete customer
      await db.customers.delete(selectedCustomer.id);
      // 3. Close view
      setSelectedCustomer(null);
    }
  }

  // --- 3. DEBT CART LOGIC (With Quantity) ---
  function addToDebtCart(product) {
    setDebtCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setItemSearch(""); // Clear search after adding
  }

  function adjustQty(productId, delta) {
    setDebtCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          return { ...item, qty: Math.max(0, item.qty + delta) };
        }
        return item;
      }).filter(item => item.qty > 0); // Remove if 0
    });
  }

  async function handleConfirmDebt() {
    setValidationErrors({});

    try {
      // Calculate total using money utilities
      const totalCents = calculateTotal(
        debtCart.map(p => ({
          retailPrice: pesoCents(p.retailPrice),
          qty: p.qty
        }))
      );
      const totalPesos = centsToPeso(totalCents);
      const itemNames = debtCart.map(p => `${p.qty}x ${p.name}`).join(", ");

      // Use Dexie transaction for atomicity
      await db.transaction('rw', db.customers, db.credit_logs, db.products, async () => {
        // 1. Verify stock availability and cache products
        const productsToDeduct = [];
        for (const item of debtCart) {
          const product = await db.products.get(item.id);
          if (!product) {
            throw new Error(`Product ${item.name} not found`);
          }
          if (product.stock < item.qty) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.qty}`);
          }
          productsToDeduct.push({ id: item.id, qty: item.qty, currentStock: product.stock });
        }

        // 2. Update customer balance
        await db.customers.update(selectedCustomer.id, {
          balance: selectedCustomer.balance + totalPesos
        });

        // 3. Record transaction
        await db.credit_logs.add({
          customerId: selectedCustomer.id,
          items: itemNames,
          totalAmount: totalPesos,
          type: 'debt',
          date: new Date()
        });

        // 4. Deduct stock (using cached data)
        for (const { id, qty, currentStock } of productsToDeduct) {
          await db.products.update(id, {
            stock: currentStock - qty
          });
        }
      });

      setDebtCart([]);
      setShowDebtModal(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Debt confirmation error:', error);
      }
      setValidationErrors({ submit: error.message || "Error recording debt" });
    }
  }

  // --- 4. PAYMENT LOGIC ---
  async function handleConfirmPayment() {
    setValidationErrors({});

    const validation = validateCashAmount(paymentAmount);
    if (!validation.valid) {
      setValidationErrors({ amount: validation.error });
      return;
    }

    try {
      const amount = validation.value;

      await db.transaction('rw', db.customers, db.credit_logs, async () => {
        const customer = await db.customers.get(selectedCustomer.id);
        const newBalance = customer.balance - amount;

        if (newBalance < 0) {
          throw new Error(`Payment exceeds balance. Customer balance: ₱${customer.balance.toFixed(2)}`);
        }

        await db.customers.update(selectedCustomer.id, {
          balance: newBalance
        });

        await db.credit_logs.add({
          customerId: selectedCustomer.id,
          items: "Cash Payment",
          totalAmount: amount,
          type: 'payment',
          date: new Date()
        });
      });

      setPaymentAmount("");
      setCashReceived("");
      setShowPayModal(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Payment error:', error);
      }
      setValidationErrors({ submit: error.message || "Error processing payment" });
    }
  }

  // Helper: Calculate Change
  const changeCents = calculateChange(pesoCents(cashReceived), pesoCents(paymentAmount));
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name.trim().split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  const debtCartTotalCents = calculateTotal(
    debtCart.map(p => ({
      retailPrice: pesoCents(p.retailPrice),
      qty: p.qty
    }))
  );

  return (
    <div className="pb-24 relative">
      
      {/* ================= MAIN LIST VIEW ================= */}
      {!selectedCustomer && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-neutral-800">Listahan</h2>
              <p className="text-neutral-400 text-sm">Manage customer credit</p>
            </div>
            <button 
              onClick={() => setShowAddCustomer(true)}
              className="gradient-bg px-4 py-2 rounded-xl font-bold transition-all aria-label-add-person"
              aria-label="Add new customer"
            >
              + Add Person
            </button>
          </div>

          <div className="space-y-3">
             {customers?.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCustomer(c)} 
                className="flex items-center p-4 glass-card hover:bg-white/40 dark:hover:bg-gray-800/40 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mr-4 ${c.balance > 0 ? 'bg-accent-600' : 'bg-success-600'}`}>
                  {getInitials(c.name)}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-neutral-800 text-lg">{c.name}</h3>
                  <p className="text-xs text-neutral-400 font-bold uppercase">
                    {c.balance > 0 ? 'Has Unpaid Balance' : 'Fully Paid'}
                  </p>
                </div>
                <div className={`text-lg font-black ${c.balance > 0 ? 'text-accent-600' : 'text-success-600'}`}>
                  ₱{c.balance.toLocaleString()}
                </div>
              </div>
             ))}
             {customers?.length === 0 && (
               <div className="text-center py-20 opacity-50">
                 <div className="text-5xl mb-2">📒</div>
                 <p>No customers yet</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* ================= DETAIL VIEW ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-neutral-50/50 dark:bg-gray-950/80 backdrop-blur-md overflow-y-auto pb-20 animate-slide-up">
          <div className="glass-card bg-gray-900/90 dark:bg-gray-900/90 text-white p-6 rounded-b-3xl sticky top-0 z-10 border-t-0 rounded-t-none">
            <div className="flex justify-between items-start mb-6">
              <button onClick={() => setSelectedCustomer(null)} className="flex items-center text-neutral-300 hover:text-white font-bold text-sm transition-colors" aria-label="Go back">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              
              {/* DELETE BUTTON */}
              <button onClick={handleDeleteCustomer} className="text-accent-400 hover:text-accent-200 p-2 transition-colors" aria-label="Delete customer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-between items-end">
              <h1 className="text-2xl font-bold max-w-[60%] leading-tight">{selectedCustomer.name}</h1>
              <div className="text-right">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Balance</div>
                <div className="text-4xl font-black tracking-tight">₱{selectedCustomer.balance.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowDebtModal(true)}
                className="flex-1 bg-accent-600 hover:bg-accent-700 text-white py-3 rounded-xl font-bold shadow-elevation hover:shadow-elevation-lg flex justify-center items-center gap-2 active:scale-95 transition-all"
                aria-label="Add debt for customer"
              >
                <span>+ Add Utang</span>
              </button>
              <button 
                onClick={() => setShowPayModal(true)}
                className="flex-1 bg-success-600 hover:bg-success-700 text-white py-3 rounded-xl font-bold shadow-elevation hover:shadow-elevation-lg flex justify-center items-center gap-2 active:scale-95 transition-all"
                aria-label="Record payment from customer"
              >
                <span>✓ Pay / Bayad</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-bold text-neutral-400 text-xs uppercase tracking-wider mb-3 ml-1">Recent Activity</h3>
            <div className="space-y-0 relative border-l-2 border-neutral-200 ml-4 pl-6 py-2">
              {history?.map(log => (
                <div key={log.id} className="mb-6 relative">
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-neutral-50 dark:border-gray-800 ${log.type === 'payment' ? 'bg-success-600' : 'bg-accent-600'}`}></div>
                  <div className="flex justify-between items-start glass-card p-3 shadow-md">
                    <div>
                      <div className="font-bold text-neutral-700 text-sm">{log.items}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {new Date(log.date).toLocaleDateString()} • {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className={`font-black ${log.type === 'payment' ? 'text-success-600' : 'text-accent-600'}`}>
                      {log.type === 'payment' ? '-' : '+'}₱{log.totalAmount}
                    </div>
                  </div>
                </div>
              ))}
              {history?.length === 0 && <p className="text-neutral-400 text-sm italic">No history available.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOMER ================= */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm animate-slide-up p-6">
            <h3 className="font-bold text-lg mb-4 text-neutral-800 dark:text-white">New Customer</h3>

            {validationErrors.submit && (
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-2 text-xs text-accent-700 mb-4">
                {validationErrors.submit}
              </div>
            )}

            <input
              autoFocus type="text" placeholder="Name (e.g. Aling Nena)"
              className={`glass-input w-full p-4 font-bold mb-4 ${
                validationErrors.name ? 'border-accent-500' : ''
              }`}
              value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
              onFocus={() => setValidationErrors({})}
              aria-label="Customer name input"
            />
            {validationErrors.name && <p className="text-accent-600 text-xs mb-3 ml-1">{validationErrors.name}</p>}

            <div className="flex gap-2">
              <button onClick={() => {
                setShowAddCustomer(false);
                setValidationErrors({});
              }} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Cancel add customer">Cancel</button>
              <button onClick={handleAddCustomer} className="flex-1 gradient-bg rounded-xl font-bold transition-all" aria-label="Save new customer">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD UTANG (With Qty) ================= */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-gray-900/60 z-[60] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-md">
          <div className="glass-card w-full max-w-md mx-auto h-[85vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-slide-up border-b-0 rounded-b-none sm:rounded-b-2xl">
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-b border-white/30 dark:border-gray-700/50 flex justify-between items-center">
              <h3 className="font-bold text-accent-600">Add Utang Items</h3>
              <button onClick={() => setShowDebtModal(false)} className="font-bold text-neutral-400 hover:text-neutral-600 transition-colors" aria-label="Close debt modal">Close</button>
            </div>
            
            <div className="p-4 border-b border-white/30 dark:border-gray-700/50">
              <input 
                type="text" placeholder="Search item..." 
                className="glass-input w-full p-3 font-bold"
                value={itemSearch} onChange={e => setItemSearch(e.target.value)}
                aria-label="Search products"
              />
              {itemSearch && (
                <div className="absolute left-4 right-4 mt-2 bg-white shadow-elevation-lg rounded-xl border border-neutral-200 z-10 overflow-hidden">
                  {searchResults?.map(p => (
                    <div key={p.id} onClick={() => addToDebtCart(p)} 
                      className="p-3 border-b hover:bg-neutral-50 flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <span className="font-medium text-neutral-700">{p.name}</span>
                      <span className="font-bold text-brand-600">₱{p.retailPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {debtCart.map((item) => (
                <div key={item.id} className="flex justify-between items-center glass-card p-3 shadow-sm">
                  
                  {/* Name & Unit Price */}
                  <div className="flex-grow">
                    <div className="font-bold text-neutral-700">{item.name}</div>
                    <div className="text-xs text-neutral-400">₱{item.retailPrice} each</div>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center bg-neutral-100 rounded-lg mr-4">
                    <button onClick={() => adjustQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center font-bold text-accent-600 active:bg-neutral-200 rounded-l-lg hover:bg-neutral-200 transition-colors" aria-label="Decrease quantity">−</button>
                    <span className="w-6 text-center font-bold text-sm text-neutral-700">{item.qty}</span>
                    <button onClick={() => adjustQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center font-bold text-brand-600 active:bg-neutral-200 rounded-r-lg hover:bg-neutral-200 transition-colors" aria-label="Increase quantity">+</button>
                  </div>

                  {/* Subtotal */}
                  <div className="font-bold w-16 text-right text-neutral-800">₱{item.retailPrice * item.qty}</div>
                </div>
              ))}
              {debtCart.length === 0 && <p className="text-center text-neutral-400 mt-10">Search items to add to the list.</p>}
            </div>

            <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-t border-white/30 dark:border-gray-700/50">
              <div className="flex justify-between mb-4 text-xl font-bold text-neutral-800 dark:text-white">
                 <span>Total Utang</span>
                 <span className="text-accent-600">{formatPeso(debtCartTotalCents)}</span>
              </div>

              {validationErrors.submit && (
                <div className="bg-accent-50 border border-accent-200 rounded-lg p-2 text-xs text-accent-700 mb-3">
                  {validationErrors.submit}
                </div>
              )}

              <button
                onClick={handleConfirmDebt}
                disabled={debtCart.length === 0}
                className="w-full bg-accent-600 hover:bg-accent-700 text-white py-4 rounded-xl font-bold shadow-elevation hover:shadow-elevation-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Confirm adding debt"
              >
                Confirm Add Utang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PAY UTANG (Calculator) ================= */}
      {showPayModal && (
        <div className="fixed inset-0 bg-gray-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-card p-6 w-full max-w-sm animate-slide-up">

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-success-700">Record Payment</h3>
              <button
                onClick={() => {
                  setPaymentAmount(selectedCustomer.balance.toString());
                  setValidationErrors({});
                }}
                className="text-[10px] bg-success-100 text-success-700 px-2 py-1 rounded-lg font-bold uppercase hover:bg-success-200 transition-colors"
                aria-label="Auto-fill full balance"
              >
                Pay Full Balance
              </button>
            </div>

            {validationErrors.submit && (
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-2 text-xs text-accent-700 mb-4">
                {validationErrors.submit}
              </div>
            )}

             {/* Payment Input */}
            <div className="mb-4">
              <label className="text-xs font-bold text-neutral-400 uppercase" htmlFor="payment-amount">Amount to Pay</label>
              <div className="relative">
                 <input
                  id="payment-amount"
                  autoFocus type="number"
                  className={`glass-input w-full pl-8 p-3 font-black text-2xl ${
                    validationErrors.amount ? 'border-accent-500' : ''
                  }`}
                  value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                  onFocus={() => setValidationErrors({})}
                  aria-label="Payment amount"
                />
                <span className="absolute left-3 top-3.5 text-neutral-400 font-bold pointer-events-none z-10">₱</span>
              </div>
              {validationErrors.amount && <p className="text-accent-600 text-xs mt-1 ml-1">{validationErrors.amount}</p>}
            </div>

            {/* Cash Received Input */}
            <div className="mb-6">
              <label className="text-xs font-bold text-neutral-400 uppercase" htmlFor="cash-received">Cash Received (Optional)</label>
              <div className="relative">
                 <input
                  id="cash-received"
                  type="number"
                  placeholder="Enter bill amount..."
                  className="glass-input w-full pl-8 p-3 font-bold text-xl"
                  value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                  onFocus={() => setValidationErrors({})}
                  aria-label="Cash received amount"
                />
                <span className="absolute left-3 top-3.5 text-neutral-400 font-bold pointer-events-none z-10">₱</span>
              </div>
            </div>

            {/* Change Display */}
            {paymentAmount && cashReceived && (
              <div className={`p-4 rounded-xl mb-6 text-center border-2 ${changeCents < 0 ? 'bg-accent-50 border-accent-200' : 'bg-success-50 border-success-200'}`}>
                <div className="text-xs font-bold text-neutral-400 uppercase">Change (Sukli)</div>
                <div className={`text-3xl font-black ${changeCents < 0 ? 'text-accent-600' : 'text-success-600'}`}>
                  {changeCents < 0 ? 'Insufficient' : formatPeso(changeCents)}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => {
                setShowPayModal(false);
                setValidationErrors({});
              }} className="flex-1 py-3 font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Cancel payment">Cancel</button>
              <button onClick={handleConfirmPayment} className="flex-1 bg-success-600 hover:bg-success-700 text-white rounded-xl font-bold shadow-lg transition-all" aria-label="Confirm payment">Confirm Pay</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}