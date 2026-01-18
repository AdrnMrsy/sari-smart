import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

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

  // Calculate Totals
  const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
  const transactionCount = salesData?.length || 0;

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Sales Dashboard</h2>

      {/* Filter Toggles */}
      <div className="flex bg-white rounded-lg p-1 mb-6 shadow-sm border">
        <button 
          onClick={() => setFilter('today')}
          className={`flex-1 py-2 rounded-md font-bold text-sm ${filter === 'today' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
        >
          Today
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-md font-bold text-sm ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
        >
          All Time
        </button>
      </div>

      {/* BIG METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Sales Card */}
        <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg">
          <div className="text-blue-100 text-sm font-medium mb-1">Total Sales</div>
          <div className="text-3xl font-black">₱{totalRevenue.toLocaleString()}</div>
        </div>

        {/* Transactions Card */}
        <div className="bg-white p-5 rounded-2xl shadow border border-gray-200">
          <div className="text-gray-500 text-sm font-medium mb-1">Transactions</div>
          <div className="text-3xl font-black text-gray-800">{transactionCount}</div>
        </div>
      </div>

      {/* Transaction History List */}
      <h3 className="font-bold text-gray-700 mb-3">Recent Transactions</h3>
      <div className="space-y-3">
        {salesData?.map(sale => (
          <div key={sale.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <div className="font-bold text-gray-800 text-sm">{sale.items}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="font-bold text-green-600">
              +₱{sale.total}
            </div>
          </div>
        ))}

        {salesData?.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400">No sales found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}