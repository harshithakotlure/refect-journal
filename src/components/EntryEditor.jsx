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

export default function EntryEditor({ onSave, isSaving, theme, currentTheme, onThemeChange }) {
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
      const result = await generateJournalPrompts({
        currentMood: selectedMood ? MOODS.find(m => m.value === selectedMood)?.label : undefined,
      });

      setCurrentPrompt(result.mainPrompt);
      setContrastPrompt(result.contrastPrompt);

      console.log('[Prompt] Generated:', {
        success: result.metadata.success,
        latency: `${result.metadata.latencyMs}ms`,
        fallback: result.metadata.fallbackUsed,
      });
    } catch (error) {
      setPromptError(error.message || 'Failed to generate prompt');
      console.error('[Prompt] Error:', error);
    } finally {
      setIsGeneratingPrompt(false);
    }
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
            <div className="bg-white border border-[#e9e9e7] rounded-md p-3 animate-fadeIn">
              <div className="space-y-2">
                <div className="h-2 bg-[#f1f1ef] rounded animate-pulse"></div>
                <div className="h-2 bg-[#f1f1ef] rounded w-5/6 animate-pulse"></div>
                <div className="h-2 bg-[#f1f1ef] rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Display Prompt Card - Minimal, flat */}
          {!isGeneratingPrompt && currentPrompt && (
            <div 
              className="bg-white border border-[#e9e9e7] rounded-md p-3 smooth-transition hover:border-[#d3d2cf] cursor-pointer group animate-fadeIn"
              onClick={() => setContent(currentPrompt)}
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-[#787774] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-[#9b9a97] uppercase tracking-wider">Prompt</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneratePrompt();
                      }}
                      disabled={isGeneratingPrompt}
                      className="text-xs text-[#5a5956] hover:text-[#37352f] font-medium flex items-center gap-1 disabled:opacity-50 smooth-transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      New
                    </button>
                  </div>
                  
                  {/* Main Prompt - Clickable */}
                  <p className="text-[#37352f] text-sm leading-relaxed">
                    {currentPrompt}
                  </p>
                  
                  {/* Contrast Prompt - Very subtle */}
                  {contrastPrompt && (
                    <p className="text-[#787774] text-xs mt-2 leading-relaxed border-l border-[#e9e9e7] pl-2">
                      {contrastPrompt}
                    </p>
                  )}
                  
                  {/* Click hint - minimal */}
                  <p className="text-[10px] text-[#9b9a97] mt-1.5 opacity-0 group-hover:opacity-100 smooth-transition">
                    Click to use
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State with Fallback - Minimal */}
          {!isGeneratingPrompt && promptError && (
            <div className="bg-white border border-[#e9e9e7] rounded-md p-3 animate-fadeIn">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-[#787774] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-[10px] font-medium text-[#9b9a97] uppercase tracking-wider block mb-1.5">
                    Prompt
                  </span>
                  
                  {/* Fallback Prompt */}
                  <p 
                    className="text-[#37352f] text-sm leading-relaxed mb-1.5 cursor-pointer hover:text-[#000]"
                    onClick={() => setContent("What's on your mind today?")}
                  >
                    What's on your mind today?
                  </p>
                  
                  {/* Error message + Retry */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#9b9a97]">Offline</p>
                    <button
                      onClick={handleGeneratePrompt}
                      className="text-xs text-[#5a5956] hover:text-[#37352f] font-medium flex items-center gap-1 smooth-transition"
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
              className="w-full px-3 py-2 bg-white border border-dashed border-[#e9e9e7] rounded-md hover:border-[#d3d2cf] smooth-transition flex items-center justify-center gap-2 text-[#787774] hover:text-[#37352f]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Get prompt</span>
            </button>
          )}
        </div>
      )}

      {/* Faded Prompt - Only for Guided style */}
      {content.trim() && currentPrompt && theme.behavior.showPrompts && (
        <div className="mb-3 bg-white border border-[#e9e9e7] rounded-md p-2 opacity-50 animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-[#9b9a97] flex-shrink-0" />
            <p className="text-[10px] text-[#787774] truncate flex-1">
              {currentPrompt}
            </p>
            <button
              onClick={() => {
                setCurrentPrompt(null);
                setContrastPrompt(null);
              }}
              className="text-[10px] text-[#9b9a97] hover:text-[#787774] smooth-transition px-1"
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
