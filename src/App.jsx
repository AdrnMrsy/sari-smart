import { useEffect } from "react";
 
import { useState } from "react";
import { useObservable } from "dexie-react-hooks";
import { db } from "./db";

// Components
import { PriceSearch } from "./components/PriceSearch";
import { AddProduct } from "./components/AddProduct";
import { CreditLedger } from "./components/CreditLedger";
import { SalesDashboard } from "./components/SalesDashboard";
import { LoginModal } from "./components/LoginModal";
import { PwaUpdatePrompt } from "./components/PwaUpdatePrompt";
import { SyncBanner } from "./components/SyncBanner";


function App() {
  const currentUser = useObservable(db.cloud.currentUser);
  const [activeTab, setActiveTab] = useState("search");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [transitionTab, setTransitionTab] = useState("search");

   // Always reset authLoading when user changes or on mount
  useEffect(() => {
    setAuthLoading(false);
  }, [currentUser]);
  // Check if cloud sync is configured
  const cloudConfigured = !!import.meta.env.VITE_DEXIE_CLOUD_URL;

  // Handle tab change with smooth transition
  function handleTabChange(tabId) {
    setTransitionTab(tabId);
    setTimeout(() => setActiveTab(tabId), 150);
  }

  // Handle logout with error handling
  async function handleLogout() {
    setAuthLoading(true);
    setAuthError("");
    try {
      await db.cloud.logout();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', error);
      }
      setAuthError("Logout failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

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
    <>
      <div className="flex flex-col h-screen bg-neutral-50 font-sans text-neutral-900">

        {/* 1. HEADER (Only shows on tabs other than Search to keep search clean) */}
        {activeTab !== 'search' && (
          <header className="bg-blue-800 text-white p-4 shadow-elevation z-20 sticky top-0 overflow-hidden">
            <div className="absolute inset-0 bg-brand-900/10 [mask-image:radial-gradient(100%_100%_at_100%_0,white,transparent)]"></div>
            <div className="flex justify-between items-center max-w-md mx-auto w-full relative">
              <h1 className="font-black text-2xl tracking-tight flex items-center gap-2 text-white drop-shadow-lg">
                <span className="bg-white text-brand-600 p-1.5 rounded-lg shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </span>
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Sari-Smart</span>
              </h1>

              {currentUser && currentUser.email ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs opacity-85 hidden sm:inline-block">
                    {currentUser.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={authLoading}
                    aria-label="Sign out"
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition-all border-2 ${
                      authLoading
                        ? 'bg-blue-800 text-blue-300 opacity-75 cursor-not-allowed border-blue-700'
                        : 'bg-white text-blue-900 border-white hover:bg-blue-50 active:scale-95 hover:shadow-lg'
                    }`}
                  >
                    {authLoading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthError("");
                    setAuthLoading(false);
                    setShowLoginModal(true);
                  }}
                  disabled={authLoading || !cloudConfigured}
                  aria-label="Login to sync"
                  className={`text-sm font-bold px-4 py-2 rounded-lg shadow-md transition-all border-2 ${
                    authLoading || !cloudConfigured
                      ? 'bg-blue-800 text-blue-300 border-blue-700 cursor-not-allowed opacity-75'
                      : 'bg-white text-blue-900 border-white hover:bg-blue-50 active:scale-95 hover:shadow-lg'
                  }`}
                  title={!cloudConfigured ? 'Cloud sync not configured' : 'Login to sync with cloud'}
                >
                  {authLoading ? '...' : 'Login'}
                </button>
              )}
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mt-4 animate-slide-up bg-accent-50 border border-accent-200 text-accent-700 text-sm px-4 py-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {authError}
                </div>
              </div>
            )}
          </header>
        )}

        {/* 2. SYNC BANNER (if not logged in and cloud is configured) */}
        {!currentUser && cloudConfigured && (
          <SyncBanner onLoginClick={() => setShowLoginModal(true)} />
        )}

        {/* 3. MAIN CONTENT AREA (always available) */}
        <main className="flex-grow overflow-y-auto no-scrollbar pb-24">
          <div className={`max-w-md mx-auto w-full h-full transition-opacity duration-150 ${transitionTab !== activeTab ? 'opacity-0' : 'opacity-100'}`}>
            {activeTab === "search" && <PriceSearch onSyncClick={() => setShowLoginModal(true)} />}
            {activeTab === "add" && <AddProduct />}
            {activeTab === "credit" && <CreditLedger />}
            {activeTab === "dashboard" && <SalesDashboard />}
          </div>
        </main>

        {/* 4. BOTTOM NAVIGATION */}
        <nav className="fixed bottom-0 w-full bg-white border-t border-neutral-200 shadow-[0_-2px_8px_-1px_rgba(0,0,0,0.08)] pb-safe z-50">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-label={`Navigate to ${tab.label}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex-1 flex flex-col items-center justify-center h-full relative transition-all duration-200 active:scale-95 ${
                    isActive ? "text-brand-600" : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <div className={`transition-all duration-300 ${isActive ? "-translate-y-1 scale-110" : "scale-100"}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}>
                    {tab.label}
                  </span>
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute bottom-1.5 h-0.5 w-6 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full animate-fade-in"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* 5. LOGIN MODAL (for sync actions) */}
        {showLoginModal && cloudConfigured && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={() => setShowLoginModal(false)}
          />
        )}

      </div>
      <PwaUpdatePrompt />
    </>
  );
}

export default App;