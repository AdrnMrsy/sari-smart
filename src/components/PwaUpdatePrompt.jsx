import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) {
    return null;
  }

  function dismissNotice() {
    setNeedRefresh(false);
    setOfflineReady(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-[70] px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <p className="text-sm font-bold text-slate-900">
          {needRefresh ? 'A new version is available' : 'App is ready for offline use'}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {needRefresh
            ? 'Refresh now to load the latest security and login updates.'
            : 'You can continue using the app even without internet.'}
        </p>

        <div className="mt-3 flex gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 rounded-lg bg-black px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Refresh Now
            </button>
          )}

          <button
            onClick={dismissNotice}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            {needRefresh ? 'Later' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
