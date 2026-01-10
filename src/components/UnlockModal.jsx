import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function UnlockModal({ onUnlock }) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await onUnlock(passphrase);
    
    if (!success) {
      setError('Incorrect passphrase');
      setIsLoading(false);
      setPassphrase('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900/50 via-secondary-900/50 to-primary-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock Your Journal</h2>
          <p className="text-gray-600">Enter your passphrase to access your entries</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 mb-1">
              Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? "text" : "password"}
                id="passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none smooth-transition"
                placeholder="Enter your passphrase"
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition disabled:opacity-50"
                disabled={isLoading}
                tabIndex={-1}
              >
                {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold py-3 rounded-lg hover:from-primary-600 hover:to-secondary-600 smooth-transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
