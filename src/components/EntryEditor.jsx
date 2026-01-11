import { useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb, MoreHorizontal } from 'lucide-react';
import { generateJournalPrompts, hasClaudeApiKey } from '../services/ai/claudePromptService';
import { THEMES } from '../themes';

const MOODS = [
  { emoji: '😊', label: 'Great', value: 'great', color: 'green' },
  { emoji: '🙂', label: 'Good', value: 'good', color: 'blue' },
  { emoji: '😐', label: 'Okay', value: 'okay', color: 'gray' },
  { emoji: '😔', label: 'Down', value: 'down', color: 'purple' },
  { emoji: '😰', label: 'Stressed', value: 'stressed', color: 'orange' },
];

export default function EntryEditor({ onSave, isSaving, entries = [], theme, currentTheme, onThemeChange }) {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [contrastPrompt, setContrastPrompt] = useState(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptError, setPromptError] = useState(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const handleSave = () => {
    if (content.trim() && selectedMood) {
      onSave({ content, mood: selectedMood });
      setContent('');
      setSelectedMood(null);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setPromptError(null);

    try {
      // Calculate aggregated summary from past entries (privacy-safe)
      const pastEntriesSummary = generatePastEntriesSummary(entries, selectedMood);

      const result = await generateJournalPrompts({
        currentMood: selectedMood ? MOODS.find(m => m.value === selectedMood)?.label : undefined,
        pastEntriesSummary, // Now sending aggregated data for contrast prompts
      });

      setCurrentPrompt(result.mainPrompt);
      setContrastPrompt(result.contrastPrompt);

      console.log('[Prompt] Generated:', {
        success: result.metadata.success,
        latency: `${result.metadata.latencyMs}ms`,
        fallback: result.metadata.fallbackUsed,
        hasContrast: !!result.contrastPrompt,
      });
      
      if (result.contrastPrompt) {
        console.log('[Prompt] 🔄 Contrast prompt generated (comparing with past patterns)');
      }
    } catch (error) {
      setPromptError(error.message || 'Failed to generate prompt');
      console.error('[Prompt] Error:', error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Generate privacy-safe summary of past entries (aggregated stats only)
  const generatePastEntriesSummary = (entries, currentMood) => {
    if (!entries || entries.length === 0) return undefined;

    // Only analyze last 14 days for relevant context
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(e => e.timestamp >= twoWeeksAgo);
    
    if (recentEntries.length === 0) return undefined;

    // Count mood distribution (aggregated, no content)
    const moodCounts = {};
    recentEntries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    // Calculate dominant mood
    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 
      Object.keys(moodCounts)[0]
    );

    // Build privacy-safe summary (only aggregated stats)
    const totalRecent = recentEntries.length;
    const moodList = Object.entries(moodCounts)
      .map(([mood, count]) => `${mood} (${count})`)
      .join(', ');

    let summary = `Past 2 weeks: ${totalRecent} entries. Moods: ${moodList}.`;
    
    // Add trend context if current mood differs from dominant
    if (currentMood && dominantMood && currentMood !== dominantMood) {
      summary += ` Today's ${currentMood} mood differs from recent ${dominantMood} pattern.`;
    }

    return summary;
  };

  return (
    <div 
      className="rounded-lg p-5 h-full flex flex-col border transition-colors duration-200"
      style={{ 
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <div 
        className="flex items-center justify-between mb-4 pb-3 border-b transition-colors duration-200"
        style={{ borderColor: theme.colors.border }}
      >
        <h2 
          className="text-base font-semibold transition-colors duration-200"
          style={{ color: theme.colors.textPrimary }}
        >
          New Entry
        </h2>
        <div className="flex items-center gap-2">
          <div 
            className="text-xs transition-colors duration-200"
            style={{ color: theme.colors.textSecondary }}
          >
            {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          
          {/* Subtle style selector - overflow menu */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="p-1 rounded transition-colors duration-200"
              style={{ color: theme.colors.textTertiary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textTertiary}
              title="Writing style"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            
            {showStyleMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStyleMenu(false)}
                />
                
                {/* Style menu */}
                <div 
                  className="absolute right-0 top-full mt-1 rounded-md border shadow-sm z-20 overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    minWidth: '140px'
                  }}
                >
                  <div 
                    className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{ 
                      color: theme.colors.textTertiary,
                      borderBottom: `1px solid ${theme.colors.border}`
                    }}
                  >
                    Writing Style
                  </div>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => {
                        onThemeChange(key);
                        setShowStyleMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs transition-colors duration-150 flex items-center justify-between"
                      style={{
                        backgroundColor: currentTheme === key ? theme.colors.surfaceActive : 'transparent',
                        color: currentTheme === key ? theme.colors.textPrimary : theme.colors.textSecondary
                      }}
                      onMouseEnter={(e) => {
                        if (currentTheme !== key) {
                          e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentTheme !== key) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span>{t.name}</span>
                      {currentTheme === key && (
                        <span className="text-[10px]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mood Selection - Minimal, flat */}
      <div className="mb-4">
        <label 
          className="block text-xs font-medium uppercase tracking-wide mb-2 transition-colors duration-200"
          style={{ color: theme.colors.textSecondary }}
        >
          How are you feeling?
        </label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setSelectedMood(mood.value)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-md smooth-transition border transition-colors duration-200"
              style={{
                backgroundColor: selectedMood === mood.value ? theme.colors.surfaceActive : theme.colors.surface,
                borderColor: selectedMood === mood.value ? theme.colors.borderActive : theme.colors.border
              }}
              onMouseEnter={(e) => {
                if (selectedMood !== mood.value) {
                  e.currentTarget.style.borderColor = theme.colors.borderHover;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMood !== mood.value) {
                  e.currentTarget.style.borderColor = theme.colors.border;
                }
              }}
            >
              <span className="text-xl">{mood.emoji}</span>
              <span 
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: theme.colors.textSecondary }}
              >
                {mood.label}
              </span>
            </button>
          ))}
        </div>
        {!selectedMood && content.trim() && (
          <p 
            className="text-xs mt-2 transition-colors duration-200"
            style={{ color: theme.colors.textSecondary }}
          >
            Select a mood to save
          </p>
        )}
      </div>

      {/* AI Prompt Card - Only for Guided style */}
      {!content.trim() && theme.behavior.showPrompts && (
        <div className="mb-4">
          {/* Loading Shimmer - Minimal */}
          {isGeneratingPrompt && (
            <div 
              className="rounded-md p-3 animate-fadeIn border transition-colors duration-200"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }}
            >
              <div className="space-y-2">
                <div 
                  className="h-2 rounded animate-pulse"
                  style={{ backgroundColor: theme.colors.surfaceActive }}
                ></div>
                <div 
                  className="h-2 rounded w-5/6 animate-pulse"
                  style={{ backgroundColor: theme.colors.surfaceActive }}
                ></div>
                <div 
                  className="h-2 rounded w-3/4 animate-pulse"
                  style={{ backgroundColor: theme.colors.surfaceActive }}
                ></div>
              </div>
            </div>
          )}

          {/* Main Prompt - Auto-displayed inline */}
          {!isGeneratingPrompt && currentPrompt && !promptError && (
            <div className="space-y-2 mb-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles 
                    className="w-3 h-3 transition-colors duration-200" 
                    style={{ color: theme.colors.textTertiary }}
                  />
                  <span 
                    className="text-[10px] font-medium uppercase tracking-wider transition-colors duration-200"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    Writing Prompt
                  </span>
                </div>
                <button
                  onClick={handleGeneratePrompt}
                  disabled={isGeneratingPrompt}
                  className="text-[10px] font-medium flex items-center gap-1 disabled:opacity-50 smooth-transition transition-colors duration-200"
                  style={{ color: theme.colors.textTertiary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textTertiary}
                >
                  <RefreshCw className="w-3 h-3" />
                  New
                </button>
              </div>
              
              <p 
                className="text-sm leading-relaxed italic transition-colors duration-200"
                style={{ color: theme.colors.textSecondary }}
              >
                {currentPrompt}
              </p>
              
              {/* Contrast Prompt - Auto-displayed inline */}
              {contrastPrompt && (
                <div className="mt-2 pt-2 animate-fadeIn" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <p 
                    className="text-[10px] font-medium uppercase tracking-wider mb-1 transition-colors duration-200"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    Reflection
                  </p>
                  <p 
                    className="text-xs leading-relaxed italic transition-colors duration-200"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    {contrastPrompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error State with Fallback - Minimal */}
          {!isGeneratingPrompt && promptError && (
            <div 
              className="rounded-md p-3 animate-fadeIn border transition-colors duration-200"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }}
            >
              <div className="flex items-start gap-2">
                <Lightbulb 
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors duration-200" 
                  style={{ color: theme.colors.textSecondary }}
                />
                <div className="flex-1">
                  <span 
                    className="text-[10px] font-medium uppercase tracking-wider block mb-1.5 transition-colors duration-200"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    Prompt
                  </span>
                  
                  {/* Fallback Prompt */}
                  <p 
                    className="text-sm leading-relaxed mb-1.5 cursor-pointer smooth-transition transition-colors duration-200"
                    style={{ color: theme.colors.textPrimary }}
                    onClick={() => setContent("What's on your mind today?")}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
                  >
                    What's on your mind today?
                  </p>
                  
                  {/* Error message + Retry */}
                  <div className="flex items-center justify-between">
                    <p 
                      className="text-[10px] transition-colors duration-200"
                      style={{ color: theme.colors.textTertiary }}
                    >
                      Offline
                    </p>
                    <button
                      onClick={handleGeneratePrompt}
                      className="text-xs font-medium flex items-center gap-1 smooth-transition transition-colors duration-200"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textPrimary}
                      onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button - Minimal flat design */}
          {!isGeneratingPrompt && !currentPrompt && !promptError && (
            <button
              onClick={handleGeneratePrompt}
              className="w-full px-3 py-2 border border-dashed rounded-md smooth-transition flex items-center justify-center gap-2 text-xs font-medium transition-colors duration-200"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.textSecondary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.borderHover;
                e.currentTarget.style.color = theme.colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get prompt</span>
            </button>
          )}
        </div>
      )}

      {/* Faded Prompt Reference - Shows after typing starts */}
      {content.trim() && currentPrompt && theme.behavior.showPrompts && (
        <div 
          className="mb-2 p-1.5 opacity-40 animate-fadeIn transition-colors duration-200"
          style={{
            borderLeft: `2px solid ${theme.colors.border}`
          }}
        >
          <div className="flex items-center gap-1.5">
            <Lightbulb 
              className="w-3 h-3 flex-shrink-0 transition-colors duration-200" 
              style={{ color: theme.colors.textTertiary }}
            />
            <p 
              className="text-[10px] truncate flex-1 transition-colors duration-200"
              style={{ color: theme.colors.textSecondary }}
            >
              {currentPrompt}
            </p>
            <button
              onClick={() => {
                setCurrentPrompt(null);
                setContrastPrompt(null);
              }}
              className="text-[10px] smooth-transition px-1 transition-colors duration-200"
              style={{ color: theme.colors.textTertiary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textTertiary}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={theme.behavior.placeholder}
        className="flex-1 w-full rounded-md border outline-none resize-none smooth-transition transition-colors duration-200"
        style={{ 
          minHeight: '340px', 
          fontSize: '14px', 
          lineHeight: theme.behavior.lineHeight,
          padding: theme.behavior.textareaPadding,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary
        }}
        onFocus={(e) => e.target.style.borderColor = theme.colors.borderHover}
        onBlur={(e) => e.target.style.borderColor = theme.colors.border}
      />

      <div 
        className="flex items-center justify-between mt-3 pt-3 border-t transition-colors duration-200"
        style={{ borderColor: theme.colors.border }}
      >
        <div 
          className="text-xs transition-colors duration-200"
          style={{ color: theme.colors.textTertiary }}
        >
          {content.length} chars
        </div>
        <button
          onClick={handleSave}
          disabled={!content.trim() || !selectedMood || isSaving}
          className="px-4 py-1.5 text-white text-xs font-medium rounded-md smooth-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors duration-200"
          style={{
            backgroundColor: theme.colors.accent
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = theme.colors.accentHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = theme.colors.accent;
            }
          }}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
