export function ProductCard({ product, qtyInCart, onAdd, onRemove, onEdit }) {
  return (
    <div 
      onClick={onEdit} // Tapping the white space opens Edit
      className={`
        relative overflow-hidden transition-all duration-200 cursor-pointer
        bg-white rounded-2xl p-4 border-2
        hover:shadow-elevation active:scale-[0.98]
        ${qtyInCart > 0 
          ? 'border-brand-300 shadow-elevation bg-brand-50/30' 
          : 'border-neutral-200 shadow-base hover:border-neutral-300'
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
          
          <h3 className="font-bold text-neutral-800 text-lg leading-tight mb-2">
            {product.name}
          </h3>
          
          <div className="inline-flex items-baseline gap-1">
            <span className="font-black text-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-transparent bg-clip-text">
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
            <div className="flex flex-col items-center bg-brand-50 rounded-xl overflow-hidden shadow-base border-2 border-brand-200 animate-scale-in">
              <button 
                onClick={() => onAdd(product)}
                aria-label={`Add more ${product.name}`}
                className="w-11 h-10 flex items-center justify-center text-brand-600 font-bold hover:bg-brand-100 active:bg-brand-200 transition-colors"
              >
                +
              </button>
              <div className="w-11 h-9 flex items-center justify-center font-bold text-brand-800 text-sm bg-blue-100 border-t border-b border-brand-200">
                {qtyInCart}
              </div>
              <button 
                onClick={() => onRemove(product)}
                aria-label={`Remove ${product.name}`}
                className="w-11 h-10 flex items-center justify-center text-accent-500 hover:text-accent-600 font-bold hover:bg-accent-50 active:bg-accent-100 transition-all"
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
                  ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-100 text-brand-600 hover:bg-brand-50 hover:scale-110 shadow-sm border-2 border-neutral-200 hover:border-brand-300'
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