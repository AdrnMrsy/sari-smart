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

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  // Apply dark mode to HTML tag
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      <div className="flex flex-col h-screen font-sans text-neutral-900 dark:text-neutral-50 bg-gradient-to-br from-brand-50 to-indigo-100 dark:from-gray-950 dark:to-indigo-950/30 bg-fixed transition-colors duration-500">

        {/* 1. HEADER (Only shows on tabs other than Search to keep search clean) */}
        {activeTab !== 'search' && (
          <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-white/40 dark:border-gray-700/50 p-4 z-20 sticky top-0 transition-colors duration-500">
            <div className="flex justify-between items-center max-w-md mx-auto w-full relative">
              <h1 className="font-black text-2xl tracking-tight flex items-center gap-2 drop-shadow-sm">
                <span>
                  <img className="h-11" src="../SariSmart.png"/>
                </span>
                <span className="text-brand-700 dark:text-brand-300">
                  Sari-Smart
                </span>
              </h1>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all text-neutral-600 dark:text-neutral-300 shadow-sm"
                  aria-label="Toggle Dark Mode"
                >
                  {theme === 'dark' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                {currentUser && currentUser.email ? (
                  <button
                    onClick={handleLogout}
                    disabled={authLoading}
                    aria-label="Sign out"
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border border-neutral-200 dark:border-gray-700 shadow-sm ${
                      authLoading
                        ? 'opacity-75 cursor-not-allowed'
                        : 'bg-white/80 dark:bg-gray-800/80 hover:bg-neutral-50 dark:hover:bg-gray-700 active:scale-95'
                    }`}
                  >
                    {authLoading ? 'Signing out...' : 'Sign Out'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthError("");
                      setAuthLoading(false);
                      setShowLoginModal(true);
                    }}
                    disabled={authLoading || !cloudConfigured}
                    aria-label="Login to sync"
                    className={`text-sm font-bold px-4 py-2 rounded-xl shadow-md transition-all border border-brand-200 dark:border-brand-800 ${
                      authLoading || !cloudConfigured
                        ? 'opacity-75 cursor-not-allowed bg-neutral-200 dark:bg-gray-800 text-neutral-500'
                        : 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-700 hover:to-indigo-700 active:scale-95 hover:shadow-lg dark:shadow-brand-500/20'
                    }`}
                  >
                    {authLoading ? '...' : 'Login'}
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mt-4 animate-slide-up bg-accent-50/90 dark:bg-accent-900/50 backdrop-blur-md border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-300 text-sm px-4 py-3 rounded-xl shadow-sm">
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

        {/* 4. BOTTOM NAVIGATION - Floating Pill Style */}
        <nav className="fixed bottom-4 left-0 right-0 w-full z-50 px-4">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-xl-soft dark:shadow-black/50 rounded-2xl transition-colors duration-500">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-label={`Navigate to ${tab.label}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex-1 flex flex-col items-center justify-center h-full relative transition-all duration-200 active:scale-95 ${
                    isActive ? "text-brand-600 dark:text-brand-400" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                >
                  <div className={`transition-all duration-300 ${isActive ? "-translate-y-1 scale-110 drop-shadow-md" : "scale-100"}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}>
                    {tab.label}
                  </span>
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute bottom-1.5 h-1 w-8 bg-gradient-to-r from-brand-400 to-indigo-500 rounded-full animate-fade-in shadow-sm dark:shadow-brand-500/50"></div>
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