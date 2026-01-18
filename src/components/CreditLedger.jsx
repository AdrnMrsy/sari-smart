import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

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
    if (!newCustomerName) return;
    await db.customers.add({ name: newCustomerName, balance: 0 });
    setNewCustomerName("");
    setShowAddCustomer(false);
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
    const total = debtCart.reduce((sum, p) => sum + (p.retailPrice * p.qty), 0);
    const itemNames = debtCart.map(p => `${p.qty}x ${p.name}`).join(", ");

    await db.customers.update(selectedCustomer.id, {
      balance: selectedCustomer.balance + total
    });

    await db.credit_logs.add({
      customerId: selectedCustomer.id,
      items: itemNames,
      totalAmount: total,
      type: 'debt',
      date: new Date()
    });

    // Deduct Stock
    for (const item of debtCart) {
      if(item.id && item.stock) {
         await db.products.update(item.id, { stock: item.stock - item.qty });
      }
    }

    setDebtCart([]);
    setShowDebtModal(false);
  }

  // --- 4. PAYMENT LOGIC ---
  async function handleConfirmPayment() {
    const amount = Number(paymentAmount);
    if (!amount) return;

    await db.customers.update(selectedCustomer.id, {
      balance: selectedCustomer.balance - amount
    });

    await db.credit_logs.add({
      customerId: selectedCustomer.id,
      items: "Cash Payment",
      totalAmount: amount,
      type: 'payment',
      date: new Date()
    });

    setPaymentAmount("");
    setCashReceived("");
    setShowPayModal(false);
  }

  // Helper: Calculate Change
  const change = (Number(cashReceived) || 0) - (Number(paymentAmount) || 0);
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const debtCartTotal = debtCart.reduce((sum, p) => sum + (p.retailPrice * p.qty), 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-24 relative">
      
      {/* ================= MAIN LIST VIEW ================= */}
      {!selectedCustomer && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Listahan</h2>
              <p className="text-slate-400 text-sm">Manage customer credit</p>
            </div>
            <button 
              onClick={() => setShowAddCustomer(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              + Add Person
            </button>
          </div>

          <div className="space-y-3">
             {customers?.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCustomer(c)} 
                className="flex items-center p-4 bg-white shadow-sm border border-slate-100 rounded-2xl active:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mr-4 ${c.balance > 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                  {getInitials(c.name)}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-slate-800 text-lg">{c.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    {c.balance > 0 ? 'Has Unpaid Balance' : 'Fully Paid'}
                  </p>
                </div>
                <div className={`text-lg font-black ${c.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
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
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto pb-20 animate-slide-up">
          <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl sticky top-0 z-10">
            <div className="flex justify-between items-start mb-6">
              <button onClick={() => setSelectedCustomer(null)} className="flex items-center text-slate-300 hover:text-white font-bold text-sm">
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              
              {/* DELETE BUTTON */}
              <button onClick={handleDeleteCustomer} className="text-red-400 hover:text-red-200 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-between items-end">
              <h1 className="text-2xl font-bold max-w-[60%] leading-tight">{selectedCustomer.name}</h1>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</div>
                <div className="text-4xl font-black tracking-tight">₱{selectedCustomer.balance.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowDebtModal(true)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform"
              >
                <span>+ Add Utang</span>
              </button>
              <button 
                onClick={() => setShowPayModal(true)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform"
              >
                <span>✓ Pay / Bayad</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3 ml-1">Recent Activity</h3>
            <div className="space-y-0 relative border-l-2 border-slate-200 ml-4 pl-6 py-2">
              {history?.map(log => (
                <div key={log.id} className="mb-6 relative">
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-50 ${log.type === 'payment' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex justify-between items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{log.items}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(log.date).toLocaleDateString()} • {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className={`font-black ${log.type === 'payment' ? 'text-green-600' : 'text-red-500'}`}>
                      {log.type === 'payment' ? '-' : '+'}₱{log.totalAmount}
                    </div>
                  </div>
                </div>
              ))}
              {history?.length === 0 && <p className="text-slate-400 text-sm italic">No history available.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOMER ================= */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm animate-slide-up">
            <h3 className="font-bold text-lg mb-4">New Customer</h3>
            <input 
              autoFocus type="text" placeholder="Name (e.g. Aling Nena)"
              className="w-full p-4 bg-slate-50 border rounded-xl font-bold mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowAddCustomer(false)} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
              <button onClick={handleAddCustomer} className="flex-1 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD UTANG (With Qty) ================= */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md mx-auto h-[85vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-red-600">Add Utang Items</h3>
              <button onClick={() => setShowDebtModal(false)} className="font-bold text-slate-400">Close</button>
            </div>
            
            <div className="p-4 border-b">
              <input 
                type="text" placeholder="Search item..." 
                className="w-full p-3 bg-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-500"
                value={itemSearch} onChange={e => setItemSearch(e.target.value)}
              />
              {itemSearch && (
                <div className="absolute left-4 right-4 mt-2 bg-white shadow-xl rounded-xl border border-slate-100 z-10 overflow-hidden">
                  {searchResults?.map(p => (
                    <div key={p.id} onClick={() => addToDebtCart(p)} 
                      className="p-3 border-b hover:bg-slate-50 flex justify-between items-center cursor-pointer"
                    >
                      <span className="font-medium text-slate-700">{p.name}</span>
                      <span className="font-bold text-blue-600">₱{p.retailPrice}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {debtCart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-3 border rounded-xl shadow-sm">
                  
                  {/* Name & Unit Price */}
                  <div className="flex-grow">
                    <div className="font-bold text-slate-700">{item.name}</div>
                    <div className="text-xs text-slate-400">₱{item.retailPrice} each</div>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center bg-slate-100 rounded-lg mr-4">
                    <button onClick={() => adjustQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center font-bold text-red-500 active:bg-slate-200 rounded-l-lg">−</button>
                    <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                    <button onClick={() => adjustQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center font-bold text-blue-600 active:bg-slate-200 rounded-r-lg">+</button>
                  </div>

                  {/* Subtotal */}
                  <div className="font-bold w-16 text-right">₱{item.retailPrice * item.qty}</div>
                </div>
              ))}
              {debtCart.length === 0 && <p className="text-center text-slate-400 mt-10">Search items to add to the list.</p>}
            </div>

            <div className="p-4 bg-slate-50 border-t">
              <div className="flex justify-between mb-4 text-xl font-bold">
                 <span>Total Utang</span>
                 <span className="text-red-600">₱{debtCartTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleConfirmDebt} 
                disabled={debtCart.length === 0}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
              >
                Confirm Add Utang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PAY UTANG (Calculator) ================= */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm animate-slide-up">
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-green-700">Record Payment</h3>
              <button 
                onClick={() => setPaymentAmount(selectedCustomer.balance)}
                className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold uppercase"
              >
                Pay Full Balance
              </button>
            </div>

            {/* Payment Input */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase">Amount to Pay</label>
              <div className="relative">
                 <span className="absolute left-3 top-3.5 text-slate-400 font-bold">₱</span>
                 <input 
                  autoFocus type="number" 
                  className="w-full pl-8 p-3 bg-slate-50 border rounded-xl font-black text-2xl text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
                  value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Cash Received Input */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase">Cash Received (Optional)</label>
              <div className="relative">
                 <span className="absolute left-3 top-3.5 text-slate-400 font-bold">₱</span>
                 <input 
                  type="number" 
                  placeholder="Enter bill amount..."
                  className="w-full pl-8 p-3 bg-slate-50 border rounded-xl font-bold text-xl text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                  value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                />
              </div>
            </div>

            {/* Change Display */}
            {paymentAmount && cashReceived && (
              <div className={`p-4 rounded-xl mb-6 text-center border-2 ${change < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className="text-xs font-bold text-slate-400 uppercase">Change (Sukli)</div>
                <div className={`text-3xl font-black ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {change < 0 ? 'Insufficient' : `₱${change.toLocaleString()}`}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
              <button onClick={handleConfirmPayment} className="flex-1 bg-green-600 text-white rounded-xl font-bold shadow-lg">Confirm Pay</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}