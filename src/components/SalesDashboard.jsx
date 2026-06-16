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
    <div className="p-4 pb-24 bg-neutral-50 min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-neutral-800">Sales Dashboard</h2>

      {/* Filter Toggles */}
      <div className="flex bg-white rounded-lg p-1 mb-6 shadow-md border border-neutral-200">
        <button 
          onClick={() => setFilter('today')}
          className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${filter === 'today' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
          aria-label="Filter sales for today"
        >
          Today
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
          aria-label="Filter sales for all time"
        >
          All Time
        </button>
      </div>

      {/* BIG METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Sales Card */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 rounded-2xl shadow-elevation hover:shadow-elevation-lg transition-all">
          <div className="text-brand-100 text-sm font-medium mb-1">Total Sales</div>
          <div className="text-3xl font-black">{formatPeso(totalRevenueCents)}</div>
        </div>

        {/* Transactions Card */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-neutral-200 hover:shadow-elevation transition-all">
          <div className="text-neutral-500 text-sm font-medium mb-1">Transactions</div>
          <div className="text-3xl font-black text-neutral-800">{transactionCount}</div>
        </div>
      </div>

      {/* Transaction History List */}
      <h3 className="font-bold text-neutral-700 mb-3">Recent Transactions</h3>
      <div className="space-y-3">
        {salesData?.map(sale => (
          <div key={sale.id} className="bg-white p-4 rounded-xl shadow-md border border-neutral-200 flex justify-between items-center hover:shadow-elevation transition-all">
            <div>
              <div className="font-bold text-neutral-800 text-sm">{sale.items}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="font-bold text-success-600">
              +{formatPeso(pesoCents(sale.total))}
            </div>
          </div>
        ))}

        {salesData?.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-neutral-200">
            <p className="text-neutral-400">No sales found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}