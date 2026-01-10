import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PassphraseModal({ onSetPassphrase }) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters long');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      onSetPassphrase(passphrase);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-[#f7f6f3] flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`glass-effect rounded-lg p-8 max-w-md w-full smooth-transition ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-[#787774] mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#37352f] mb-2">Welcome to Reflect</h2>
          <p className="text-[#5a5956]">Create a secure passphrase to encrypt your journal entries</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="passphrase" className="block text-sm font-medium text-[#37352f] mb-1">
              Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? "text" : "password"}
                id="passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-[#e9e9e7] focus:border-[#d3d2cf] outline-none smooth-transition bg-white text-[#37352f]"
                placeholder="Enter a secure passphrase"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition"
                tabIndex={-1}
              >
                {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassphrase" className="block text-sm font-medium text-[#37352f] mb-1">
              Confirm Passphrase
            </label>
            <div className="relative">
              <input
                type={showConfirmPassphrase ? "text" : "password"}
                id="confirmPassphrase"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-[#e9e9e7] focus:border-[#d3d2cf] outline-none smooth-transition bg-white text-[#37352f]"
                placeholder="Confirm your passphrase"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition"
                tabIndex={-1}
              >
                {showConfirmPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            className="w-full bg-[#5a5956] text-white font-medium py-3 rounded-lg hover:bg-[#787774] smooth-transition"
          >
            Set Passphrase
          </button>

          <p className="text-xs text-[#5a5956] text-center mt-4">
            ⚠️ Remember your passphrase! It cannot be recovered if lost.
          </p>
        </form>
      </div>
    </div>
  );
}
