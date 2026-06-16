import { useState } from 'react';
import { db } from '../db';

export function LoginModal({ onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      await db.cloud.login();
      onLoginSuccess?.();
      onClose();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Login error:', err);
      }
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-neutral-950/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-elevation-lg animate-slide-up">

        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-neutral-900 text-center mb-2">Sync Your Data</h2>
          <p className="text-center text-neutral-500 text-sm">Keep your store data safe and accessible</p>
        </div>

        {/* Benefits */}
        <div className="bg-brand-50 rounded-2xl p-4 mb-6 space-y-3 border border-brand-100">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-brand-600 bg-brand-100 p-2 rounded-lg">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">Automatic Backup</h4>
              <p className="text-xs text-neutral-600">Your data is safely backed up to the cloud</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-brand-600 bg-brand-100 p-2 rounded-lg">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">Multi-Device Sync</h4>
              <p className="text-xs text-neutral-600">Access your data from any device</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 text-brand-600 bg-brand-100 p-2 rounded-lg">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">Never Lose Data</h4>
              <p className="text-xs text-neutral-600">Work offline, sync when connected</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-3 text-sm text-accent-700 mb-6 flex items-start gap-2 animate-slide-down">
            <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-neutral-50 rounded-lg p-3 mb-6 text-xs text-neutral-600 border border-neutral-200">
          <p className="font-semibold text-neutral-900 mb-1">How it works:</p>
          <p>Click "Login with Dexie Cloud" to create a free account or sign in. Your store data will sync automatically.</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            disabled={loading}
            aria-label="Login with Dexie Cloud"
            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
              loading
                ? 'bg-blue-500 cursor-not-allowed opacity-75'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-elevation active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Connecting...
              </span>
            ) : (
              'Login with Dexie Cloud'
            )}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close login modal"
            className="w-full py-3 rounded-xl font-bold text-neutral-800 bg-neutral-200 hover:bg-neutral-300 transition-colors active:scale-95"
          >
            Cancel
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-4">
          Your data stays private and secure
        </p>
      </div>
    </div>
  );
}
