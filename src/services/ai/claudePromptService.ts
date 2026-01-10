// Claude AI Service for Generating Reflective Journal Prompts
// Senior Backend Engineer Implementation

import { logAction } from '../../utils/audit';

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

interface ClaudeApiResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  id: string;
  model: string;
  stop_reason: string;
}

// ==================== Configuration ====================

const CLAUDE_CONFIG = {
  MODEL: 'claude-3-5-sonnet-20240620',
  API_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',
  MAX_TOKENS: 150,
  TEMPERATURE: 0.8, // Higher for creative prompts
  TIMEOUT_MS: 10000, // 10 second timeout
} as const;

const SYSTEM_PROMPT = `You are an AI journaling guide.
Generate 1 main reflective question based on the user's mood.
Occasionally generate 1 optional contrast prompt comparing today with past entries.
Keep prompts open-ended, non-judgmental, and under 60 words.
Do NOT give advice or diagnose mental health conditions.`;

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
  contrast: [
    "How does today compare to how you felt a week ago?",
    "What patterns do you notice when you look back?",
    "How has your perspective shifted recently?",
  ],
};

// ==================== Helper Functions ====================

/**
 * Get Claude API key from storage or environment
 */
function getClaudeApiKey(): string | null {
  // Try localStorage first (client-side)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('claude_api_key');
    if (stored) return stored;
  }
  
  // Try environment variable (server-side)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.CLAUDE_API_KEY || null;
  }
  
  return null;
}

/**
 * Set Claude API key in storage
 */
export function setClaudeApiKey(apiKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('claude_api_key', apiKey);
  }
}

/**
 * Check if API key is configured
 */
export function hasClaudeApiKey(): boolean {
  return getClaudeApiKey() !== null;
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

/**
 * Parse Claude's response to extract main and contrast prompts
 */
function parseClaudeResponse(responseText: string): { main: string; contrast?: string } {
  // Look for patterns like "Main:" or "Contrast:" or numbered prompts
  const lines = responseText.split('\n').filter(line => line.trim());
  
  let mainPrompt = '';
  let contrastPrompt: string | undefined;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines or very short lines
    if (trimmed.length < 10) continue;
    
    // Check for explicit labels
    if (/^(main|primary|question|1\.):/i.test(trimmed)) {
      mainPrompt = trimmed.replace(/^(main|primary|question|1\.):\s*/i, '').trim();
    } else if (/^(contrast|compare|optional|2\.):/i.test(trimmed)) {
      contrastPrompt = trimmed.replace(/^(contrast|compare|optional|2\.):\s*/i, '').trim();
    } else if (!mainPrompt) {
      // First substantial line becomes main prompt
      mainPrompt = trimmed;
    } else if (!contrastPrompt && trimmed.length > 20) {
      // Second substantial line becomes contrast prompt
      contrastPrompt = trimmed;
    }
  }
  
  // Fallback: use entire response as main prompt if parsing fails
  if (!mainPrompt) {
    mainPrompt = responseText.trim();
  }
  
  return { main: mainPrompt, contrast: contrastPrompt };
}

// ==================== Main Service Function ====================

/**
 * Generate reflective journal prompts using Claude API
 * 
 * @param input - User's current mood and past entries summary
 * @returns Promise with main prompt, optional contrast prompt, and metadata
 */
export async function generateJournalPrompts(
  input: PromptGenerationInput
): Promise<PromptGenerationResult> {
  const startTime = Date.now();
  const metadata: PromptMetadata = {
    timestamp: startTime,
    success: false,
    latencyMs: 0,
    model: CLAUDE_CONFIG.MODEL,
    fallbackUsed: false,
  };

  try {
    // ========== Validation ==========
    const apiKey = getClaudeApiKey();
    if (!apiKey) {
      throw new Error('Claude API key not configured');
    }

    // ========== Build User Message ==========
    let userMessage = 'Generate a reflective journal prompt for me.';
    
    if (input.currentMood) {
      userMessage += `\n\nCurrent mood: ${input.currentMood}`;
    }
    
    if (input.pastEntriesSummary) {
      userMessage += `\n\nContext from past entries: ${input.pastEntriesSummary}`;
    }

    // ========== API Request with Timeout ==========
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLAUDE_CONFIG.TIMEOUT_MS);

    const response = await fetch(CLAUDE_CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_CONFIG.API_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_CONFIG.MODEL,
        max_tokens: CLAUDE_CONFIG.MAX_TOKENS,
        temperature: CLAUDE_CONFIG.TEMPERATURE,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ========== Handle API Errors ==========
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Specific error handling
      if (response.status === 401) {
        throw new Error('Invalid Claude API key');
      } else if (response.status === 429) {
        throw new Error('Claude API rate limit exceeded');
      } else if (response.status === 400) {
        throw new Error(`Claude API validation error: ${errorData.error?.message || 'Invalid request'}`);
      } else {
        throw new Error(`Claude API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    // ========== Parse Response ==========
    const data: ClaudeApiResponse = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid Claude API response format');
    }

    const responseText = data.content[0].text;
    const { main, contrast } = parseClaudeResponse(responseText);

    // ========== Calculate Latency ==========
    const endTime = Date.now();
    metadata.latencyMs = endTime - startTime;
    metadata.success = true;

    // ========== Log Success ==========
    logAction('ai_called', `Claude prompt generated (${metadata.latencyMs}ms, mood: ${input.currentMood || 'none'})`);

    console.log('[Claude Prompt Service] ✅ Success', {
      latency: `${metadata.latencyMs}ms`,
      mood: input.currentMood,
      mainPromptLength: main.length,
      hasContrast: !!contrast,
    });

    return {
      mainPrompt: main,
      contrastPrompt: contrast,
      metadata,
    };

  } catch (error) {
    // ========== Error Handling & Fallback ==========
    const endTime = Date.now();
    metadata.latencyMs = endTime - startTime;
    metadata.success = false;
    metadata.fallbackUsed = true;
    metadata.error = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    logAction('ai_called', `Claude prompt failed: ${metadata.error} - using fallback`);

    console.error('[Claude Prompt Service] ❌ Error', {
      error: metadata.error,
      latency: `${metadata.latencyMs}ms`,
      mood: input.currentMood,
    });

    // Return fallback prompts
    const mainPrompt = selectFallbackPrompt(input.currentMood);
    const contrastPrompt = input.pastEntriesSummary 
      ? FALLBACK_PROMPTS.contrast[Math.floor(Math.random() * FALLBACK_PROMPTS.contrast.length)]
      : undefined;

    return {
      mainPrompt,
      contrastPrompt,
      metadata,
    };
  }
}

// ==================== Batch Prompt Generation ====================

/**
 * Generate multiple prompts for different moods (useful for pre-caching)
 */
export async function generateBatchPrompts(
  moods: string[],
  pastEntriesSummary?: string
): Promise<Map<string, PromptGenerationResult>> {
  const results = new Map<string, PromptGenerationResult>();
  
  // Generate prompts sequentially to avoid rate limits
  for (const mood of moods) {
    const result = await generateJournalPrompts({
      currentMood: mood,
      pastEntriesSummary,
    });
    results.set(mood, result);
    
    // Small delay between requests to be respectful of API limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// ==================== Utilities ====================

/**
 * Create a summary of past entries for context
 * (Call this before generateJournalPrompts)
 */
export function summarizePastEntries(entries: Array<{ content: string; mood?: string }>, limit = 5): string {
  if (!entries || entries.length === 0) {
    return '';
  }
  
  const recentEntries = entries.slice(0, limit);
  const moodCounts: Record<string, number> = {};
  
  recentEntries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });
  
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const avgLength = Math.round(
    recentEntries.reduce((sum, e) => sum + e.content.length, 0) / recentEntries.length
  );
  
  return `Recent patterns: ${recentEntries.length} entries, most common mood: ${dominantMood || 'varied'}, avg length: ${avgLength} chars`;
}

/**
 * Validate prompt quality (word count, questions, etc.)
 */
export function validatePrompt(prompt: string): boolean {
  const wordCount = prompt.split(/\s+/).length;
  const hasQuestion = /\?/.test(prompt);
  const notTooShort = wordCount >= 5;
  const notTooLong = wordCount <= 60;
  
  return notTooShort && notTooLong && hasQuestion;
}
