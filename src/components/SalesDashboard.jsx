import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { pesoCents, formatPeso } from '../utils/money';

export function SalesDashboard() {
  const [filter, setFilter] = useState('today'); // 'today' or 'all'

  // Query Sales Data
  const salesData = useLiveQuery(async () => {
    let collection = db.sales.orderBy('date').reverse();

    // Filter for "Today"
    if (filter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      // We filter items where date is greater than start of today
      return await collection.filter(s => s.date >= startOfDay).toArray();
    }
    
    return await collection.toArray();
  }, [filter]);

  // Calculate Totals using integer arithmetic for financial precision
  const totalRevenueCents = salesData?.reduce((sum, sale) => sum + pesoCents(sale.total), 0) || 0;
  const transactionCount = salesData?.length || 0;

  return (
    <div className="p-4 pb-24 relative">
      <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white drop-shadow-sm">Sales Dashboard</h2>

      {/* Filter Toggles */}
      <div className="flex glass-card p-1 mb-6 shadow-md border border-neutral-200 dark:border-gray-700">
        <button 
          onClick={() => setFilter('today')}
          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'today' ? 'gradient-bg shadow-md' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          aria-label="Filter sales for today"
        >
          Today
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'all' ? 'gradient-bg shadow-md' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          aria-label="Filter sales for all time"
        >
          All Time
        </button>
      </div>

      {/* BIG METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Sales Card */}
        <div className="gradient-bg p-5 rounded-2xl">
          <div className="text-white/80 text-sm font-medium mb-1">Total Sales</div>
          <div className="text-3xl font-black">{formatPeso(totalRevenueCents)}</div>
        </div>

        {/* Transactions Card */}
        <div className="glass-card p-5">
          <div className="text-neutral-500 text-sm font-medium mb-1">Transactions</div>
          <div className="text-3xl font-black text-neutral-800 dark:text-white">{transactionCount}</div>
        </div>
      </div>

      {/* Transaction History List */}
      <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-3 drop-shadow-sm">Recent Transactions</h3>
      <div className="space-y-3">
        {salesData?.map(sale => (
          <div key={sale.id} className="glass-card p-4 flex justify-between items-center shadow-sm">
            <div>
              <div className="font-bold text-neutral-800 dark:text-white text-sm">{sale.items}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="font-bold text-success-600 dark:text-success-400 text-lg drop-shadow-sm">
              +{formatPeso(pesoCents(sale.total))}
            </div>
          </div>
        ))}

        {salesData?.length === 0 && (
          <div className="text-center py-10 glass-card">
            <p className="text-neutral-400">No sales found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}