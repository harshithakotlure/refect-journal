import { useState } from 'react';
import { Key, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { verifyPassphrase } from '../utils/storage';

export default function ChangePassphraseModal({ onClose, onChangePassphrase }) {
  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCurrentPassphrase, setShowCurrentPassphrase] = useState(false);
  const [showNewPassphrase, setShowNewPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verify current passphrase
    const isValid = await verifyPassphrase(currentPassphrase);
    if (!isValid) {
      setError('Current passphrase is incorrect');
      return;
    }

    // Validate new passphrase
    if (newPassphrase.length < 8) {
      setError('New passphrase must be at least 8 characters long');
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setError('New passphrases do not match');
      return;
    }

    if (newPassphrase === currentPassphrase) {
      setError('New passphrase must be different from current passphrase');
      return;
    }

    setIsProcessing(true);
    
    // Call the parent handler to re-encrypt all entries
    await onChangePassphrase(currentPassphrase, newPassphrase);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="glass-effect rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Change Passphrase</h3>
            <p className="text-sm text-gray-600">Update your encryption passphrase</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            All your entries will be re-encrypted with the new passphrase. This may take a moment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassphrase" className="block text-sm font-medium text-gray-700 mb-1">
              Current Passphrase
            </label>
            <div className="relative">
              <input
                type={showCurrentPassphrase ? "text" : "password"}
                id="currentPassphrase"
                value={currentPassphrase}
                onChange={(e) => setCurrentPassphrase(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none smooth-transition"
                placeholder="Enter current passphrase"
                autoFocus
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassphrase(!showCurrentPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition disabled:opacity-50"
                disabled={isProcessing}
                tabIndex={-1}
              >
                {showCurrentPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassphrase" className="block text-sm font-medium text-gray-700 mb-1">
              New Passphrase
            </label>
            <div className="relative">
              <input
                type={showNewPassphrase ? "text" : "password"}
                id="newPassphrase"
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none smooth-transition"
                placeholder="Enter new passphrase"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowNewPassphrase(!showNewPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition disabled:opacity-50"
                disabled={isProcessing}
                tabIndex={-1}
              >
                {showNewPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassphrase" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Passphrase
            </label>
            <div className="relative">
              <input
                type={showConfirmPassphrase ? "text" : "password"}
                id="confirmPassphrase"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none smooth-transition"
                placeholder="Confirm new passphrase"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition disabled:opacity-50"
                disabled={isProcessing}
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 smooth-transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 smooth-transition font-medium disabled:opacity-50"
            >
              {isProcessing ? 'Re-encrypting...' : 'Change Passphrase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
