import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CheckoutModal } from './CheckoutModal';
import { ProductCard } from './ProductCard'; 

export function PriceSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]); 
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Edit State
  const [editingItem, setEditingItem] = useState(null);
  const categories = ["General", "Canned Goods", "Noodles", "Drinks", "Toiletries", "Snacks", "Load/Data", "Cigarettes", "Alcohol"];

  // Query Products
  const products = useLiveQuery(async () => {
    if (!searchTerm) return await db.products.toArray();
    return await db.products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .toArray();
  }, [searchTerm]);

  // --- CART LOGIC ---
  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing.qty === 1) {
        return prev.filter(item => item.id !== product.id);
      }
      return prev.map(item => item.id === product.id ? { ...item, qty: item.qty - 1 } : item);
    });
  }

  function getCartQty(productId) {
    const item = cart.find(i => i.id === productId);
    return item ? item.qty : 0;
  }

  // --- EDIT & DELETE LOGIC ---
  async function handleSave(e) {
    e.preventDefault();
    if (!editingItem) return;
    await db.products.update(editingItem.id, {
      name: editingItem.name,
      retailPrice: Number(editingItem.retailPrice),
      stock: Number(editingItem.stock),
      category: editingItem.category
    });
    setEditingItem(null);
  }

  async function handleDelete() {
    if (confirm(`Are you sure you want to permanently delete "${editingItem.name}"?`)) {
      await db.products.delete(editingItem.id);
      // Also remove from cart if it's there
      setCart(prev => prev.filter(item => item.id !== editingItem.id));
      setEditingItem(null);
    }
  }

  // Calculate Totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.retailPrice * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="bg-slate-50 min-h-screen relative pb-32">
      
      {/* 1. STICKY SEARCH HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 pt-4 pb-3">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 2. PRODUCT LIST */}
      <div className="p-4 space-y-3">
        {products?.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            qtyInCart={getCartQty(product.id)}
            onAdd={() => addToCart(product)}
            onRemove={() => removeFromCart(product)}
            onEdit={() => setEditingItem(product)}
          />
        ))}

        {/* Empty State / No Results */}
        {products?.length === 0 && (
          <div className="text-center py-20 opacity-60">
            <div className="text-6xl mb-4 grayscale">📦</div>
            <p className="font-bold text-slate-600">No items found</p>
            <p className="text-sm text-slate-400 mb-4">Try a different search term</p>
          </div>
        )}
      </div>

      {/* 3. FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-40 animate-slide-up">
          <button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-slate-900 text-white p-1 rounded-2xl shadow-2xl flex items-center pr-6 overflow-hidden active:scale-[0.98] transition-transform"
          >
            <div className="bg-blue-500 w-16 h-14 flex flex-col items-center justify-center rounded-xl mr-4">
              <span className="font-bold text-lg leading-none">{cartCount}</span>
              <span className="text-[10px] uppercase opacity-80">Items</span>
            </div>
            
            <div className="flex-grow text-left">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total</div>
              <div className="text-2xl font-bold leading-none">₱{cartTotal.toLocaleString()}</div>
            </div>
            
            <div className="flex items-center gap-1 font-bold text-blue-300 text-sm uppercase tracking-wider">
              Checkout
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* 4. MODALS */}
      {showCheckout && (
        <CheckoutModal 
          cart={cart} 
          onClose={() => setShowCheckout(false)} 
          onClearCart={() => setCart([])} 
        />
      )}

      {/* EDIT & DELETE MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Edit Item</h3>
                <p className="text-xs text-slate-400">Update inventory details</p>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-bold hover:bg-slate-300 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Product Name</label>
                <input 
                  type="text" value={editingItem.name} 
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-4">
                {/* Price */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold">₱</span>
                    <input 
                      type="number" value={editingItem.retailPrice} 
                      onChange={e => setEditingItem({...editingItem, retailPrice: e.target.value})}
                      className="w-full pl-7 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Stock</label>
                  <input 
                    type="number" value={editingItem.stock} 
                    onChange={e => setEditingItem({...editingItem, stock: e.target.value})}
                    className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none ${editingItem.stock <= 5 ? 'text-orange-500' : 'text-slate-800'}`}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                <select 
                  value={editingItem.category} 
                  onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3 border-t mt-2">
                 {/* Delete Button */}
                 <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="px-4 py-3 text-red-500 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 </button>
                 
                 {/* Save Button */}
                 <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                 >
                   Save Changes
                 </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}