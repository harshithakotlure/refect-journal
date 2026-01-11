// Claude AI Service for Generating Reflective Journal Prompts
// Uses serverless proxy for secure API key management

// ==================== Types ====================

interface PromptGenerationInput {
  currentMood?: string;
  pastEntriesSummary?: string;
}

interface PromptGenerationResult {
  mainPrompt: string;
  contrastPrompt?: string;
  metadata: PromptMetadata;
}

interface PromptMetadata {
  timestamp: number;
  success: boolean;
  latencyMs: number;
  error?: string;
  model: string;
  fallbackUsed: boolean;
}

// ==================== Configuration ====================

const CLAUDE_CONFIG = {
  MODEL: 'claude-3-5-sonnet-20240620',
  TIMEOUT_MS: 10000, // 10 second timeout
} as const;

// ==================== Fallback Prompts ====================

const FALLBACK_PROMPTS = {
  neutral: [
    "What's one thing you noticed about yourself today?",
    "How did you show up for yourself today?",
    "What deserves your attention right now?",
  ],
  positive: [
    "What brought you joy today, and why do you think that is?",
    "What strength did you discover or use today?",
    "What moment today would you like to revisit?",
  ],
  negative: [
    "What's one small thing that felt manageable today?",
    "If you could be kind to yourself right now, what would you say?",
    "What would tomorrow look like if one thing felt lighter?",
  ],
};

// ==================== Helper Functions ====================

/**
 * Check if Claude API is available (always true - serverless handles it)
 */
export function hasClaudeApiKey(): boolean {
  return true; // Serverless function handles API key
}

/**
 * Select appropriate fallback prompt based on mood
 */
function selectFallbackPrompt(mood?: string): string {
  const moodLower = mood?.toLowerCase() || 'neutral';
  
  let category: keyof typeof FALLBACK_PROMPTS = 'neutral';
  if (['great', 'good', 'happy', 'excited'].some(m => moodLower.includes(m))) {
    category = 'positive';
  } else if (['down', 'sad', 'stressed', 'anxious', 'overwhelmed'].some(m => moodLower.includes(m))) {
    category = 'negative';
  }
  
  const prompts = FALLBACK_PROMPTS[category];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Audit logging helper
const logAction = (action: string, details: string) => {
  try {
    const audit = (window as any).__audit_log;
    if (audit && typeof audit.logAction === 'function') {
      audit.logAction(action, details);
    }
  } catch {
    // Silently fail if audit logging not available
  }
};

// ==================== Main Service Function ====================

/**
 * Generate reflective journal prompts via serverless function
 * 
 * @param input - User's current mood and past entries summary
 * @returns Promise with main prompt, optional contrast prompt, and metadata
 */
export async function generateJournalPrompts(
  input: PromptGenerationInput
): Promise<PromptGenerationResult> {
  const startTime = Date.now();

  try {
    // Call serverless function instead of Claude API directly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLAUDE_CONFIG.TIMEOUT_MS);

    const response = await fetch('/api/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mood: input.currentMood,
        pastEntriesSummary: input.pastEntriesSummary
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[Claude] Serverless function error:', response.status);
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    // Log success (metadata only, no content)
    if (data.metadata?.success) {
      logAction('ai_prompt_generated', `Latency: ${data.metadata.latencyMs}ms, Mood: ${input.currentMood || 'unspecified'}`);
    }

    return {
      mainPrompt: data.mainPrompt,
      contrastPrompt: data.contrastPrompt,
      metadata: {
        timestamp: startTime,
        success: data.metadata?.success || false,
        latencyMs: Math.round(latency),
        model: data.metadata?.model || 'unknown',
        fallbackUsed: data.fallback || false,
        error: data.metadata?.error
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const latency = Date.now() - startTime;
    console.error('[Claude] Error generating prompts:', errorMessage);
    
    // Log the failure (no user content)
    logAction('ai_prompt_failed', `Error: ${errorMessage}, Mood: ${input.currentMood || 'unspecified'}`);

    // Return fallback prompt
    return {
      mainPrompt: selectFallbackPrompt(input.currentMood),
      contrastPrompt: undefined,
      metadata: {
        timestamp: startTime,
        success: false,
        latencyMs: Math.round(latency),
        model: CLAUDE_CONFIG.MODEL,
        fallbackUsed: true,
        error: errorMessage
      },
    };
  }
}
