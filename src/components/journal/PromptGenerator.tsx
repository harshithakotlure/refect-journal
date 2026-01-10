// React Component - Journal Prompt Generator using Claude
// Example integration of claudePromptService

import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { generateJournalPrompts, summarizePastEntries } from '../../services/ai/claudePromptService';
import type { JournalEntry } from '../../types';

interface PromptGeneratorProps {
  currentMood?: string;
  pastEntries?: JournalEntry[];
}

export default function PromptGenerator({ currentMood, pastEntries = [] }: PromptGeneratorProps) {
  const [mainPrompt, setMainPrompt] = useState<string>('');
  const [contrastPrompt, setContrastPrompt] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleGeneratePrompt = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare context from past entries
      const pastSummary = pastEntries.length > 0
        ? summarizePastEntries(
            pastEntries.map(e => ({
              content: '', // Would need decrypted content here
              mood: e.mood,
            })),
            5
          )
        : undefined;

      // Call Claude API
      const result = await generateJournalPrompts({
        currentMood,
        pastEntriesSummary: pastSummary,
      });

      setMainPrompt(result.mainPrompt);
      setContrastPrompt(result.contrastPrompt);
      setMetadata(result.metadata);

      // Log for debugging
      console.log('[Prompt Generator] Result:', {
        success: result.metadata.success,
        latency: `${result.metadata.latencyMs}ms`,
        fallbackUsed: result.metadata.fallbackUsed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
      console.error('[Prompt Generator] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Generate Button */}
      <button
        onClick={handleGeneratePrompt}
        disabled={isLoading}
        className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 smooth-transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Generating prompt...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Get Writing Prompt
          </>
        )}
      </button>

      {/* Main Prompt Display */}
      {mainPrompt && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 mb-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-purple-900">Today's Reflection</p>
                {metadata?.fallbackUsed && (
                  <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full">
                    Offline
                  </span>
                )}
                {metadata?.success && (
                  <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    AI
                  </span>
                )}
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">{mainPrompt}</p>
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-700 flex items-center justify-between">
              <span>
                {metadata.success ? '✨ Claude 3.5 Sonnet' : '💾 Cached prompt'}
              </span>
              <span>{metadata.latencyMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Contrast Prompt (Optional) */}
      {contrastPrompt && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-4 animate-fadeIn">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 text-sm font-medium">💭 Compare:</div>
            <p className="text-gray-700 text-sm flex-1">{contrastPrompt}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Prompt generation failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Usage Hint */}
      {!mainPrompt && !isLoading && (
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Click above to get a personalized reflection prompt</p>
          {currentMood && (
            <p className="mt-1 text-xs">Based on your mood: <span className="font-medium">{currentMood}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== Usage Example ====================

/**
 * Example: Integrate in Entry Editor
 * 
 * <EntryEditor>
 *   <PromptGenerator
 *     currentMood="stressed"
 *     pastEntries={entries}
 *   />
 *   <textarea placeholder="Start writing..." />
 * </EntryEditor>
 */
