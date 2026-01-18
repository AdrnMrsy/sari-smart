export function ProductCard({ product, qtyInCart, onAdd, onRemove, onEdit }) {
  return (
    <div 
      onClick={onEdit} // Tapping the white space opens Edit
      className={`
        relative overflow-hidden transition-all duration-200
        bg-white rounded-2xl p-4 border
        ${qtyInCart > 0 ? 'border-blue-500 shadow-md ring-1 ring-blue-100' : 'border-slate-100 shadow-sm'}
      `}
    >
      <div className="flex justify-between items-start">
        
        {/* Left Side: Info */}
        <div className="flex-grow pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              {product.category || 'General'}
            </span>
            {product.stock <= 5 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
                {product.stock === 0 ? 'NO STOCK' : `${product.stock} left`}
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">
            {product.name}
          </h3>
          
          <div className="font-black text-2xl text-blue-600 tracking-tight">
            ₱{product.retailPrice}
          </div>
        </div>

        {/* Right Side: Action Button */}
        <div onClick={(e) => e.stopPropagation()}> {/* Prevent triggering Edit when clicking buttons */}
          {qtyInCart > 0 ? (
            <div className="flex flex-col items-center bg-blue-50 rounded-xl overflow-hidden shadow-inner border border-blue-100">
              <button 
                onClick={() => onAdd(product)}
                className="w-10 h-9 flex items-center justify-center text-blue-600 font-bold active:bg-blue-200 transition-colors"
              >
                +
              </button>
              <div className="w-10 h-8 flex items-center justify-center font-bold text-blue-900 text-sm bg-blue-100/50">
                {qtyInCart}
              </div>
              <button 
                onClick={() => onRemove(product)}
                className="w-10 h-9 flex items-center justify-center text-red-400 font-bold active:bg-red-100 transition-colors"
              >
                −
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAdd(product)}
              className="w-12 h-12 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-200"
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