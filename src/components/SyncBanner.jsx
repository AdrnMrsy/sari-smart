import { useState, useEffect } from 'react';

export function SyncBanner({ onLoginClick }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this banner
    const lastDismissed = localStorage.getItem('syncBannerDismissed');
    const now = Date.now();

    if (lastDismissed) {
      const daysSinceDismissed = (now - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem('syncBannerDismissed', Date.now().toString());
    setDismissed(true);
  }

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-info-50 via-info-50 to-info-100 border-b-2 border-info-200 px-4 py-4 animate-slide-down">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0 text-info-600 p-2 bg-info-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-neutral-900">Keep your store data synced</p>
            <p className="text-xs text-neutral-600">Never lose inventory or customer data</p>
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <button
            onClick={onLoginClick}
            aria-label="Enable cloud sync"
            className="bg-info-600 hover:bg-info-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
          >
            Enable
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss sync banner"
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors"
            title="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
