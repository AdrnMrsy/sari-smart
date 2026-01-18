import { useState } from "react";
import { useObservable } from "dexie-react-hooks";
import { db } from "./db";

// Components
import { PriceSearch } from "./components/PriceSearch";
import { AddProduct } from "./components/AddProduct";
import { CreditLedger } from "./components/CreditLedger";
import { SalesDashboard } from "./components/SalesDashboard";

function App() {
  const currentUser = useObservable(db.cloud.currentUser);
  const [activeTab, setActiveTab] = useState("search");

  // Tab Configuration (Easy to add more later)
  const tabs = [
    { 
      id: 'search', 
      label: 'Store', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    { 
      id: 'add', 
      label: 'Add Item', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    { 
      id: 'credit', 
      label: 'Listahan', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      id: 'dashboard', 
      label: 'Sales', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. HEADER (Only shows on tabs other than Search to keep search clean) */}
      {activeTab !== 'search' && (
        <header className="bg-blue-600 text-white p-4 shadow-lg z-20 sticky top-0">
          <div className="flex justify-between items-center max-w-md mx-auto w-full">
            <h1 className="font-black text-xl tracking-wider flex items-center gap-2">
              <span className="bg-white text-blue-600 px-2 rounded text-sm">S</span>
              SARI-SMART
            </h1>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] opacity-80 uppercase tracking-widest hidden sm:inline-block">Logged In</span>
                <button
                  onClick={() => db.cloud.logout()}
                  className="bg-blue-700 hover:bg-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-blue-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => db.cloud.login()}
                className="bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Login to Sync
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-grow overflow-y-auto no-scrollbar pb-24">
        <div className="max-w-md mx-auto w-full h-full">
          {activeTab === "search" && <PriceSearch />}
          {activeTab === "add" && <AddProduct />}
          {activeTab === "credit" && <CreditLedger />}
          {activeTab === "dashboard" && <SalesDashboard />}
        </div>
      </main>

      {/* 3. BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-200 active:scale-95 ${
                  isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? "-translate-y-1 scale-110" : ""}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-bold mt-0.5 ${isActive ? "opacity-100" : "opacity-0"}`}>
                  {tab.label}
                </span>
                
                {/* Active Dot Indicator */}
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

export default App;