import { useState } from 'react';
import { db } from '../db';
import { validateProductName, validatePrice, validateStock, validateBarcode } from '../utils/validation';

export function AddProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [barcode, setBarcode] = useState(''); // New Field
  const [category, setCategory] = useState('General');
  const [stock, setStock] = useState('');
  
  // UX State for button feedback
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'success' | 'error'
  const [errors, setErrors] = useState({}); // Validation errors

  const categories = ["General", "Canned Goods", "Noodles", "Drinks", "Toiletries", "Snacks", "Load/Data", "Cigarettes", "Alcohol"];

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // Validate all fields
    const nameValidation = validateProductName(name);
    const priceValidation = validatePrice(price);
    const stockValidation = validateStock(stock);
    const barcodeValidation = validateBarcode(barcode);

    const newErrors = {};
    if (!nameValidation.valid) newErrors.name = nameValidation.error;
    if (!priceValidation.valid) newErrors.price = priceValidation.error;
    if (!stockValidation.valid) newErrors.stock = stockValidation.error;
    if (!barcodeValidation.valid) newErrors.barcode = barcodeValidation.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus('idle');
      return;
    }

    setStatus('saving');

    try {
      await db.products.add({
        name: nameValidation.value,
        barcode: barcodeValidation.value,
        retailPrice: priceValidation.value,
        category: category,
        stock: stockValidation.value,
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
      // Log errors only in development
      if (import.meta.env.DEV) {
        console.error('Product save error:', error);
      }
      setStatus('idle');
      setErrors({ submit: "Error saving product. Please try again." });
    }
  }

  return (
    <div className="p-4 pb-24">
      
      <div className="max-w-md mx-auto">
        <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-1 drop-shadow-sm">New Item</h2>
        <p className="text-neutral-500 dark:text-neutral-300 text-sm mb-6">Add new inventory to your store</p>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">

          {/* Error Alert */}
          {errors.submit && (
            <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-4 text-sm text-accent-700 flex items-start gap-3 animate-slide-down">
              <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.submit}
            </div>
          )}
          
          {/* 1. Barcode Field (Optional but good for Scanner) */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Barcode (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Scan or type barcode"
                value={barcode} 
                onChange={e => setBarcode(e.target.value)}
                className="glass-input w-full pl-12 p-3 font-mono text-sm"
                aria-label="Product barcode"
              />
            </div>
            {errors.barcode && <p className="text-accent-600 text-xs mt-2 ml-1 font-medium">{errors.barcode}</p>}
          </div>

          {/* 2. Product Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Product Name</label>
            <input
              type="text"
              placeholder="e.g. Silver Swan Soy Sauce"
              value={name} 
              onChange={e => setName(e.target.value)}
              aria-label="Product name"
              className={`glass-input w-full p-4 font-bold placeholder:font-normal ${
                errors.name ? 'border-accent-400 focus:border-accent-400 focus:ring-accent-500/50' : ''
              }`}
            />
            {errors.name && <p className="text-accent-600 text-xs mt-2 ml-1 font-medium">{errors.name}</p>}
          </div>

          {/* 3. Row: Price & Stock */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-neutral-400 font-bold">₱</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={price} 
                  onChange={e => setPrice(e.target.value)}
                  aria-label="Product price"
                  className={`glass-input w-full pl-10 p-3 font-black text-brand-600 dark:text-brand-400 text-lg ${
                    errors.price ? 'border-accent-400 focus:border-accent-400 focus:ring-accent-500/50' : ''
                  }`}
                />
              </div>
              {errors.price && <p className="text-accent-600 text-xs mt-2 ml-1 font-medium">{errors.price}</p>}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Stock</label>
              <input
                type="number"
                placeholder="0"
                value={stock} 
                onChange={e => setStock(e.target.value)}
                aria-label="Product stock"
                className={`glass-input w-full p-3 font-bold ${
                  errors.stock ? 'border-accent-400 focus:border-accent-400 focus:ring-accent-500/50' : ''
                }`}
              />
              {errors.stock && <p className="text-accent-600 text-xs mt-2 ml-1 font-medium">{errors.stock}</p>}
            </div>
          </div>

          {/* 4. Category */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Category</label>
            <div className="relative">
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                aria-label="Product category"
                className="glass-input w-full p-3 font-medium appearance-none dark:bg-gray-800"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          {/* 5. Smart Submit Button */}
          <button
            type="submit"
            disabled={status !== 'idle' || Object.keys(errors).length > 0}
            aria-label="Save product"
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all duration-200 transform
              ${status === 'success' ? 'bg-success-600 text-white scale-105 animate-pulse-soft' : ''}
              ${status === 'idle' && Object.keys(errors).length === 0 ? 'gradient-bg' : ''}
              ${status === 'idle' && Object.keys(errors).length > 0 ? 'bg-neutral-300 dark:bg-gray-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed' : ''}
              ${status === 'saving' ? 'bg-gray-800 dark:bg-gray-600 text-white' : ''}
            `}
          >
            {status === 'idle' && "Save Product"}
            {status === 'saving' && (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </span>
            )}
            {status === 'success' && (
              <span className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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