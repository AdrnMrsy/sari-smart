import { useState } from 'react';
import { db } from '../db';

export function AddProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [barcode, setBarcode] = useState(''); // New Field
  const [category, setCategory] = useState('General');
  const [stock, setStock] = useState('');
  
  // UX State for button feedback
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'success'

  const categories = ["General", "Canned Goods", "Noodles", "Drinks", "Toiletries", "Snacks", "Load/Data", "Cigarettes", "Alcohol"];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !price) return;

    setStatus('saving');

    try {
      await db.products.add({
        name: name,
        barcode: barcode, // Save the barcode
        retailPrice: Number(price),
        category: category,
        stock: Number(stock) || 0,
        createdAt: new Date()
      });

      // Show Success State
      setStatus('success');
      
      // Reset Form
      setName('');
      setPrice('');
      setBarcode('');
      setStock('');
      
      // Reset Button after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);

    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert("Error saving. Please try again.");
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 pb-24">
      
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-black text-slate-800 mb-1">New Item</h2>
        <p className="text-slate-400 text-sm mb-6">Add new inventory to your store</p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          
          {/* 1. Barcode Field (Optional but good for Scanner) */}
          {/* <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Barcode (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Scan or type barcode"
                value={barcode} onChange={e => setBarcode(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div> */}

          {/* 2. Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Silver Swan Soy Sauce"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal"
            />
          </div>

          {/* 3. Row: Price & Stock */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400 font-bold">₱</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full pl-8 p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-600 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Stock</label>
              <input 
                type="number" 
                placeholder="0"
                value={stock} onChange={e => setStock(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* 4. Category */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Category</label>
            <div className="relative">
              <select 
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          {/* 5. Smart Submit Button */}
          <button 
            type="submit" 
            disabled={status !== 'idle'}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform
              ${status === 'success' ? 'bg-green-500 text-white scale-105' : 'bg-blue-600 text-white active:scale-95 hover:bg-blue-700'}
            `}
          >
            {status === 'idle' && "Save Product"}
            {status === 'saving' && "Saving..."}
            {status === 'success' && (
              <span className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Item Saved!
              </span>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}