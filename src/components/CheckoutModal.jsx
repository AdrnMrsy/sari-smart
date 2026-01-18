import { useState } from 'react';
import { db } from '../db';

export function CheckoutModal({ cart, onClose, onClearCart }) {
  const [cashGiven, setCashGiven] = useState("");
  const [status, setStatus] = useState('idle'); // 'idle' | 'success'
  
  const total = cart.reduce((sum, item) => sum + (item.retailPrice * item.qty), 0);
  const change = cashGiven ? Number(cashGiven) - total : 0;

  // Quick Cash Denominations
  const bills = [20, 50, 100, 200, 500, 1000];

  async function handleFinalize() {
    const itemNames = cart.map(i => `${i.qty}x ${i.name}`).join(", ");

    // 1. Record Sale
    await db.sales.add({
      total: total,
      items: itemNames,
      date: new Date()
    });

    // 2. Deduct Stock
    for (const item of cart) {
      const product = await db.products.get(item.id);
      if (product) {
        await db.products.update(item.id, {
          stock: product.stock - item.qty
        });
      }
    }
    
    // 3. Show Success Screen (No more alert!)
    setStatus('success');
  }

  function handleClose() {
    onClearCart();
    onClose();
  }

  // --- SUCCESS VIEW ---
  if (status === 'success') {
    return (
      <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center animate-slide-up shadow-2xl">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Payment Received!</h2>
          <p className="text-slate-400 font-medium mb-6">Don't forget the change.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Change (Sukli)</div>
            <div className="text-5xl font-black text-slate-800 tracking-tight">₱{change.toLocaleString()}</div>
          </div>

          <button onClick={handleClose} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
            Start New Transaction
          </button>
        </div>
      </div>
    );
  }

  // --- CHECKOUT VIEW ---
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm">
      <div className="bg-slate-50 w-full max-w-md rounded-t-3xl sm:rounded-2xl h-[90vh] sm:h-[85vh] flex flex-col animate-slide-up shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center z-10">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Checkout</h2>
            <p className="text-xs text-slate-400">{cart.length} items in cart</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full text-slate-500 font-bold flex items-center justify-center">×</button>
        </div>

        {/* Scrollable List (Receipt Style) */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  {item.qty}x
                </div>
                <div className="font-bold text-slate-700">{item.name}</div>
              </div>
              <div className="font-bold text-slate-900">₱{item.retailPrice * item.qty}</div>
            </div>
          ))}
        </div>

        {/* Footer Calculation Area */}
        <div className="bg-white p-5 border-t rounded-t-3xl shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-20">
          
          {/* Total Display */}
          <div className="flex justify-between items-end mb-6">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</span>
            <span className="text-4xl font-black text-slate-800 leading-none">₱{total.toLocaleString()}</span>
          </div>
          
          {/* Payment Input */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <span className="absolute left-4 top-4 text-slate-400 font-bold text-xl">₱</span>
              <input 
                type="number" 
                placeholder="Enter Cash Given"
                autoFocus
                className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
              />
              {/* Exact Amount Button */}
              <button 
                onClick={() => setCashGiven(total)}
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-100 text-blue-700 rounded-xl font-bold text-xs uppercase hover:bg-blue-200 transition-colors"
              >
                Exact
              </button>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {bills.map(bill => (
                <button
                  key={bill}
                  onClick={() => setCashGiven(bill)}
                  className="flex-shrink-0 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200 active:bg-blue-600 active:text-white transition-colors"
                >
                  ₱{bill}
                </button>
              ))}
            </div>
          </div>

          {/* Change Indicator */}
          {cashGiven && (
             <div className="flex justify-between items-center mb-4 px-2">
                <span className="font-bold text-slate-400 text-sm">Change</span>
                <span className={`font-black text-xl ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {change < 0 ? 'Insufficient' : `₱${change.toLocaleString()}`}
                </span>
             </div>
          )}

          {/* Confirm Button */}
          <button 
            onClick={handleFinalize}
            disabled={!cashGiven || change < 0}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
              (!cashGiven || change < 0) 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-blue-600 active:scale-95 hover:bg-blue-700'
            }`}
          >
            Confirm Sale
          </button>

        </div>
      </div>
    </div>
  );
}