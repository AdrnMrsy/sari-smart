import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useObservable } from 'dexie-react-hooks';
import { db } from '../db';
import { calculateTotal, formatPeso, pesoCents } from '../utils/money';
import { CheckoutModal } from './CheckoutModal';
import { ProductCard } from './ProductCard';

export function PriceSearch({ onSyncClick }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState(null);
  const categories = ["General", "Canned Goods", "Noodles", "Drinks", "Toiletries", "Snacks", "Load/Data", "Cigarettes", "Alcohol"];

  // Check user login status
  const currentUser = useObservable(db.cloud.currentUser);
  const cloudConfigured = !!import.meta.env.VITE_DEXIE_CLOUD_URL;

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

  // Calculate Totals using money utilities
  const cartTotalCents = calculateTotal(
    cart.map(item => ({
      retailPrice: pesoCents(item.retailPrice),
      qty: item.qty
    }))
  );
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="bg-neutral-50 min-h-screen relative pb-32">

      {/* 1. STICKY SEARCH HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-neutral-200 shadow-base px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              aria-label="Search products"
              className="w-full pl-10 pr-4 py-3 bg-neutral-100 border-2 border-neutral-200 rounded-xl text-neutral-800 font-medium focus:border-brand-500 focus:bg-white transition-all placeholder:text-neutral-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sync Button (only show if cloud configured) */}
          {cloudConfigured && (
            <button
              onClick={currentUser ? undefined : onSyncClick}
              aria-label={currentUser ? `Synced as ${currentUser.email || 'user'}` : 'Enable cloud sync'}
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                currentUser
                  ? 'bg-success-100 text-success-600'
                  : 'bg-brand-100 text-brand-600 hover:bg-brand-200 active:scale-95'
              }`}
            >
              {currentUser ? (
                // Synced icon (cloud with checkmark)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              ) : (
                // Not synced icon (cloud with arrow)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
            </button>
          )}
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
            <p className="font-bold text-neutral-600">No items found</p>
            <p className="text-sm text-neutral-400 mb-4">Try a different search term</p>
          </div>
        )}
      </div>

      {/* 3. FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-40 animate-slide-up">
          <button 
            onClick={() => setShowCheckout(true)}
            aria-label="Open checkout"
            className="w-full bg-gradient-to-r from-neutral-800 to-neutral-900 text-white p-1 rounded-2xl shadow-elevation-lg flex items-center pr-6 overflow-hidden active:scale-[0.98] transition-all hover:shadow-elevation"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 w-16 h-14 flex flex-col items-center justify-center rounded-xl mr-4 shadow-base">
              <span className="font-black text-lg leading-none">{cartCount}</span>
              <span className="text-[10px] uppercase opacity-90 font-bold">Items</span>
            </div>
            
            <div className="flex-grow text-left">
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Total</div>
              <div className="text-2xl font-black text-white leading-none">{formatPeso(cartTotalCents)}</div>
            </div>
            
            <div className="flex items-center gap-1 font-bold text-brand-300 text-sm uppercase tracking-wider">
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
        <div className="fixed inset-0 bg-neutral-950/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-elevation-lg w-full max-w-sm overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">Edit Item</h3>
                <p className="text-xs text-neutral-500">Update inventory details</p>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                aria-label="Close edit modal"
                className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-600 font-bold transition-colors flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Product Name</label>
                <input 
                  type="text" 
                  value={editingItem.name}
                  aria-label="Edit product name"
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full p-3 bg-neutral-100 border-2 border-neutral-200 rounded-xl font-bold text-neutral-800 focus:border-brand-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="flex gap-4">
                {/* Price */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-neutral-400 font-bold">₱</span>
                    <input 
                      type="number" 
                      value={editingItem.retailPrice}
                      aria-label="Edit product price"
                      onChange={e => setEditingItem({...editingItem, retailPrice: e.target.value})}
                      className="w-full pl-10 p-3 bg-neutral-100 border-2 border-neutral-200 rounded-xl font-bold text-brand-600 focus:border-brand-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="flex-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Stock</label>
                  <input 
                    type="number" 
                    value={editingItem.stock}
                    aria-label="Edit product stock"
                    onChange={e => setEditingItem({...editingItem, stock: e.target.value})}
                    className={`w-full p-3 bg-neutral-100 border-2 border-neutral-200 rounded-xl font-bold focus:bg-white outline-none transition-all ${editingItem.stock <= 5 ? 'text-warning-600 border-warning-200 focus:border-warning-500' : 'text-neutral-800 focus:border-brand-500'}`}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Category</label>
                <div className="relative">
                  <select 
                    value={editingItem.category} 
                    aria-label="Edit product category"
                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                    className="w-full p-3 bg-neutral-100 border-2 border-neutral-200 rounded-xl font-medium appearance-none focus:border-brand-500 focus:bg-white outline-none transition-all"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3 border-t mt-2">
                 {/* Delete Button */}
                 <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="px-4 py-3 text-white font-bold bg-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
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