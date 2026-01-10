// Modal for setting OpenAI and Claude API keys

import React, { useState } from 'react';
import { Key, XCircle, ExternalLink, Eye, EyeOff, Sparkles, Brain } from 'lucide-react';
import { setOpenAIApiKey, getOpenAIApiKey } from '../../services/ai';
import { setClaudeApiKey, getClaudeApiKey } from '../../services/ai/claudePromptService';

interface ApiKeyModalProps {
  onClose: () => void;
}

export default function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const [activeTab, setActiveTab] = useState<'openai' | 'claude'>('claude'); // Default to Claude for prompts
  
  // OpenAI state
  const [openaiKey, setOpenaiKey] = useState(getOpenAIApiKey() || '');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  
  // Claude state
  const [claudeKey, setClaudeKey] = useState(getClaudeApiKey() || '');
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (activeTab === 'openai' && !openaiKey.trim()) {
      alert('Please enter a valid OpenAI API key');
      return;
    }
    if (activeTab === 'claude' && !claudeKey.trim()) {
      alert('Please enter a valid Claude API key');
      return;
    }

    setIsSaving(true);
    
    if (activeTab === 'openai') {
      setOpenAIApiKey(openaiKey.trim());
    } else {
      setClaudeApiKey(claudeKey.trim());
    }
    
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
      <div className="glass-effect rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">AI Companions Setup</h3>
              <p className="text-sm text-gray-600">Configure your AI services</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 smooth-transition"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('claude')}
            className={`flex-1 px-4 py-2.5 rounded-t-lg font-medium smooth-transition ${
              activeTab === 'claude'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Claude</span>
            </div>
            <p className="text-xs mt-0.5 opacity-90">Writing Prompts</p>
          </button>
          <button
            onClick={() => setActiveTab('openai')}
            className={`flex-1 px-4 py-2.5 rounded-t-lg font-medium smooth-transition ${
              activeTab === 'openai'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              <span>OpenAI</span>
            </div>
            <p className="text-xs mt-0.5 opacity-90">Wellness Support</p>
          </button>
        </div>

        {/* Claude Tab Content */}
        {activeTab === 'claude' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">
                    Writing Prompt Generator
                  </p>
                  <p className="text-xs text-purple-800">
                    Get personalized, reflective questions based on your mood using Claude 3.5 Sonnet. Perfect for starting your journaling practice!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-medium">
                📋 Get your Claude API key:
              </p>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Go to Anthropic Console</li>
                <li>Create account or sign in</li>
                <li>Navigate to API Keys section</li>
                <li>Create new key</li>
                <li>Copy and paste below</li>
              </ol>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium smooth-transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open Anthropic Console
              </a>
            </div>

            <div>
              <label htmlFor="claudeKey" className="block text-sm font-medium text-gray-700 mb-1">
                Claude API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showClaudeKey ? "text" : "password"}
                  id="claudeKey"
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none smooth-transition font-mono text-sm"
                  placeholder="sk-ant-api03-..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition"
                  tabIndex={-1}
                >
                  {showClaudeKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OpenAI Tab Content */}
        {activeTab === 'openai' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    AI Wellness Companion
                  </p>
                  <p className="text-xs text-blue-800">
                    Get empathetic responses with positive psychology, emotion insights, and cognitive reframing to support your mental wellness journey.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-medium">
                📋 Get your OpenAI API key:
              </p>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Go to OpenAI platform</li>
                <li>Create account or sign in</li>
                <li>Navigate to API Keys section</li>
                <li>Create new secret key</li>
                <li>Copy and paste below</li>
              </ol>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium smooth-transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open OpenAI Platform
              </a>
            </div>

            <div>
              <label htmlFor="openaiKey" className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOpenaiKey ? "text" : "password"}
                  id="openaiKey"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none smooth-transition font-mono text-sm"
                  placeholder="sk-..."
                  autoFocus={activeTab === 'openai'}
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 smooth-transition"
                  tabIndex={-1}
                >
                  {showOpenaiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 mt-4">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">🔒</span>
            <div>
              <p className="font-medium text-gray-700 mb-1">Privacy First</p>
              <p>Your API keys are stored <strong>locally in your browser only</strong>. They're never sent to our servers. Direct API calls are made from your device to {activeTab === 'claude' ? 'Anthropic' : 'OpenAI'}.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 smooth-transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              (activeTab === 'openai' && !openaiKey.trim()) ||
              (activeTab === 'claude' && !claudeKey.trim()) ||
              isSaving
            }
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 smooth-transition font-medium disabled:opacity-50 shadow-md disabled:cursor-not-allowed"
          >
            {isSaving ? '💾 Saving...' : '✨ Activate AI'}
          </button>
        </div>
      </div>
    </div>
  );
}
