export function ProductCard({ product, qtyInCart, onAdd, onRemove, onEdit }) {
  return (
    <div 
      onClick={onEdit} // Tapping the white space opens Edit
      className={`
        relative overflow-hidden transition-all duration-200 cursor-pointer
        glass-card p-4 
        hover:shadow-elevation active:scale-[0.98]
        ${qtyInCart > 0 
          ? 'border-brand-300 dark:border-brand-600 shadow-elevation bg-brand-50/30 dark:bg-brand-900/30' 
          : 'hover:border-neutral-300 dark:hover:border-neutral-500'
        }
      `}
    >
      {/* Gradient overlay for in-cart items */}
      {qtyInCart > 0 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-100/40 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start relative z-10">
        
        {/* Left Side: Info */}
        <div className="flex-grow pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">
              {product.category || 'General'}
            </span>
            {product.stock <= 5 && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${
                product.stock === 0 
                  ? 'bg-accent-100 text-accent-700' 
                  : 'bg-warning-100 text-warning-700'
              }`}>
                {product.stock === 0 ? 'OUT OF STOCK' : `${product.stock} left`}
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-neutral-800 dark:text-white text-lg leading-tight mb-2">
            {product.name}
          </h3>
          
          <div className="inline-flex items-baseline gap-1">
            <span className="font-black text-2xl text-brand-700 dark:text-brand-300">
              ₱{product.retailPrice}
            </span>
            {product.costPrice && (
              <span className="text-xs text-neutral-400 line-through">
                ₱{product.costPrice}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Action Button */}
        <div onClick={(e) => e.stopPropagation()}> {/* Prevent triggering Edit when clicking buttons */}
          {qtyInCart > 0 ? (
            <div className="flex flex-col items-center bg-brand-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-base border border-brand-200 dark:border-gray-700 animate-scale-in">
              <button 
                onClick={() => onAdd(product)}
                aria-label={`Add more ${product.name}`}
                className="w-11 h-10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-100 dark:hover:bg-gray-700 active:bg-brand-200 transition-colors"
              >
                +
              </button>
              <div className="w-11 h-9 flex items-center justify-center font-bold text-brand-800 dark:text-brand-200 text-sm bg-black/10 dark:bg-black/30 border-y border-brand-200 dark:border-gray-700">
                {qtyInCart}
              </div>
              <button 
                onClick={() => onRemove(product)}
                aria-label={`Remove ${product.name}`}
                className="w-11 h-10 flex items-center justify-center text-accent-500 hover:text-accent-600 font-bold hover:bg-accent-50 dark:hover:bg-gray-700 active:bg-accent-100 transition-all"
              >
                −
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to cart`}
              disabled={product.stock === 0}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 font-bold ${
                product.stock === 0
                  ? 'bg-neutral-100 dark:bg-gray-800 text-neutral-300 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white/50 dark:bg-gray-800 text-brand-600 dark:text-brand-400 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 shadow-sm border border-neutral-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}