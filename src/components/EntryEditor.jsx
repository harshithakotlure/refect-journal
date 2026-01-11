import { useState, useEffect } from 'react';
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

  // Auto-generate prompts when mood changes
  useEffect(() => {
    if (selectedMood && theme.behavior.showPrompts) {
      console.log('[Prompt] Auto-generating for mood:', selectedMood);
      handleGeneratePrompt();
    }
  }, [selectedMood]);

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

  // Extract recurring themes and patterns from past entries
  const extractKeywordsFromText = (text) => {
    // Handle null/undefined text
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // Common words to ignore
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'my', 'me', 'i', 'you', 'it', 'this', 'that', 'from', 'about', 'just', 'so', 'very', 'not', 'like', 'what', 'when', 'how', 'why', 'today', 'feel', 'feeling', 'felt']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    return words;
  };

  // Generate pattern-based summary from past entries (only if clear patterns exist)
  const generatePastEntriesSummary = (entries, currentMood) => {
    console.log('[Pattern Detection] Starting analysis...');
    console.log('[Pattern Detection] Total entries:', entries?.length || 0);
    
    // Require at least 3 past entries for meaningful pattern detection
    if (!entries || entries.length < 3) {
      console.log('[Pattern Detection] ❌ Not enough entries (need 3+)');
      return null;
    }

    // Only analyze last 14 days for relevant context
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(e => e.timestamp >= twoWeeksAgo);
    
    console.log('[Pattern Detection] Recent entries (14 days):', recentEntries.length);
    
    if (recentEntries.length < 3) {
      console.log('[Pattern Detection] ❌ Not enough recent entries (need 3+)');
      return null;
    }

    // 1. Detect mood patterns
    const moodCounts = {};
    recentEntries.forEach(entry => {
      console.log('[Pattern Detection] Entry mood:', entry.mood, 'has mood:', !!entry.mood);
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    console.log('[Pattern Detection] Mood counts:', moodCounts);
    console.log('[Pattern Detection] Entries with moods:', Object.values(moodCounts).reduce((a, b) => a + b, 0));

    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 
      Object.keys(moodCounts)[0]
    );

    // Check if there's a clear mood pattern (at least 50% of entries)
    const dominantMoodCount = moodCounts[dominantMood] || 0;
    const hasMoodPattern = dominantMoodCount >= Math.ceil(recentEntries.length * 0.5);
    
    console.log('[Pattern Detection] Dominant mood:', dominantMood, 'count:', dominantMoodCount);
    console.log('[Pattern Detection] Has mood pattern:', hasMoodPattern);

    // 2. Extract recurring themes from entry content
    const allKeywords = [];
    recentEntries.forEach(entry => {
      // Only process entries with content
      if (entry && entry.content) {
        const keywords = extractKeywordsFromText(entry.content);
        allKeywords.push(...keywords);
      }
    });

    // Count keyword frequency
    const keywordFrequency = {};
    allKeywords.forEach(keyword => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });

    // Find recurring themes (appearing in at least 2 entries)
    const recurringThemes = Object.entries(keywordFrequency)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));

    console.log('[Pattern Detection] Recurring themes:', recurringThemes.length);
    
    // Only generate summary if we have clear patterns
    if (!hasMoodPattern && recurringThemes.length === 0) {
      console.log('[Pattern Detection] ❌ No clear patterns detected');
      return null; // No clear patterns detected
    }
    
    console.log('[Pattern Detection] ✅ Patterns found! Generating summary...');

    // Build privacy-safe pattern summary
    let summary = `Past ${recentEntries.length} entries (last 2 weeks). `;
    
    if (hasMoodPattern) {
      summary += `Dominant mood: ${dominantMood} (${dominantMoodCount} entries). `;
    } else {
      summary += `Mood varied: ${Object.entries(moodCounts).map(([m, c]) => `${m}(${c})`).join(', ')}. `;
    }

    if (recurringThemes.length > 0) {
      const topThemes = recurringThemes.slice(0, 3).map(t => t.keyword);
      summary += `Recurring themes: ${topThemes.join(', ')}. `;
    }

    // Add contrast context if mood changed
    if (currentMood && dominantMood && currentMood !== dominantMood) {
      summary += `Today's ${currentMood} mood differs from recent ${dominantMood} pattern.`;
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

      {/* AI Prompt Card - Always visible when prompts exist */}
      {theme.behavior.showPrompts && (
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
                <div className="mt-3 pt-3 animate-fadeIn" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <RefreshCw 
                      className="w-3 h-3 transition-colors duration-200" 
                      style={{ color: theme.colors.textTertiary }}
                    />
                    <p 
                      className="text-[10px] font-medium uppercase tracking-wider transition-colors duration-200"
                      style={{ color: theme.colors.textTertiary }}
                    >
                      Reflection Prompt
                    </p>
                  </div>
                  <p 
                    className="text-sm leading-relaxed italic transition-colors duration-200"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {contrastPrompt}
                  </p>
                </div>
              )}
            </div>
          )}


          {/* Generate Button - Only show if mood is selected */}
          {!isGeneratingPrompt && !currentPrompt && !promptError && selectedMood && (
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
