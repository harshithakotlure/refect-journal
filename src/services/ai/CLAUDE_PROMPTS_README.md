# 🧠 Claude Prompt Service - Backend Documentation

## Overview

Production-ready backend service for generating reflective journal prompts using Claude 3.5 Sonnet.

**Senior Engineer Implementation Features:**
- ✅ Type-safe TypeScript
- ✅ Graceful error handling with fallbacks
- ✅ Comprehensive logging & audit trail
- ✅ Latency tracking
- ✅ Rate limit awareness
- ✅ Timeout protection
- ✅ Intelligent prompt parsing
- ✅ Batch processing capability

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { generateJournalPrompts } from '@/services/ai/claudePromptService';

// Generate prompts
const result = await generateJournalPrompts({
  currentMood: 'stressed',
  pastEntriesSummary: 'Recent patterns: 5 entries, most common mood: overwhelmed'
});

console.log('Main Prompt:', result.mainPrompt);
// "What's one small thing that might feel more manageable if you gave yourself permission to let it go?"

console.log('Contrast Prompt:', result.contrastPrompt);
// "How does your stress today compare to what you felt last week?"

console.log('Metadata:', result.metadata);
// { timestamp: 1234567890, success: true, latencyMs: 856, ... }
```

---

## 📋 API Reference

### `generateJournalPrompts(input)`

**Main function for generating prompts.**

#### Parameters

```typescript
interface PromptGenerationInput {
  currentMood?: string;        // Optional: "stressed", "happy", etc.
  pastEntriesSummary?: string; // Optional: context from past entries
}
```

#### Returns

```typescript
interface PromptGenerationResult {
  mainPrompt: string;          // Always present (fallback if API fails)
  contrastPrompt?: string;     // Optional comparison prompt
  metadata: {
    timestamp: number;         // Unix timestamp
    success: boolean;          // API call succeeded?
    latencyMs: number;         // Response time
    error?: string;            // Error message if failed
    model: string;             // Claude model used
    fallbackUsed: boolean;     // Used fallback prompt?
  };
}
```

#### Example

```typescript
const result = await generateJournalPrompts({
  currentMood: 'anxious',
});

if (result.metadata.success) {
  console.log('✅ API call succeeded');
  console.log(`⚡ Latency: ${result.metadata.latencyMs}ms`);
} else {
  console.warn('⚠️ Used fallback:', result.metadata.error);
}
```

---

## 🔧 Configuration

### Set API Key

```typescript
import { setClaudeApiKey, hasClaudeApiKey } from '@/services/ai/claudePromptService';

// Client-side (localStorage)
setClaudeApiKey('sk-ant-api03-...');

// Check if configured
if (hasClaudeApiKey()) {
  console.log('✅ API key configured');
}

// Server-side (environment variable)
// Set CLAUDE_API_KEY in .env or process.env
```

### Advanced Configuration

```typescript
// Located in claudePromptService.ts

const CLAUDE_CONFIG = {
  MODEL: 'claude-3-5-sonnet-20240620',
  API_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  MAX_TOKENS: 150,
  TEMPERATURE: 0.8,        // Higher = more creative
  TIMEOUT_MS: 10000,       // 10 second timeout
};
```

---

## 🎯 Advanced Usage

### 1. With Past Context

```typescript
import { summarizePastEntries, generateJournalPrompts } from '@/services/ai/claudePromptService';

// Prepare context from past entries
const pastEntries = [
  { content: 'Today was tough...', mood: 'down' },
  { content: 'Feeling better now...', mood: 'okay' },
  { content: 'Great day!', mood: 'happy' },
];

const summary = summarizePastEntries(pastEntries, 5);
// "Recent patterns: 3 entries, most common mood: okay, avg length: 78 chars"

// Generate prompt with context
const result = await generateJournalPrompts({
  currentMood: 'happy',
  pastEntriesSummary: summary,
});

console.log(result.contrastPrompt);
// "How does today's happiness compare to the challenges you faced earlier this week?"
```

### 2. Batch Generation (Pre-caching)

```typescript
import { generateBatchPrompts } from '@/services/ai/claudePromptService';

// Generate prompts for multiple moods at once
const moods = ['happy', 'sad', 'anxious', 'stressed', 'calm'];
const results = await generateBatchPrompts(moods, pastSummary);

// Access individual results
results.get('anxious');
// { mainPrompt: "...", contrastPrompt: "...", metadata: {...} }

// Cache for offline use
localStorage.setItem('cached_prompts', JSON.stringify(Array.from(results)));
```

### 3. Error Handling Patterns

```typescript
try {
  const result = await generateJournalPrompts({ currentMood: 'stressed' });
  
  if (!result.metadata.success) {
    // API failed but fallback worked
    console.warn('Using fallback prompt:', result.metadata.error);
    
    // Show user notification
    showToast('Using offline prompt - AI unavailable', 'warning');
  } else if (result.metadata.latencyMs > 3000) {
    // Slow response
    console.warn('Slow API response');
  }
  
  // Always have a prompt (fallback guaranteed)
  displayPrompt(result.mainPrompt);
  
} catch (error) {
  // Should never happen - fallbacks handle all errors
  console.error('Unexpected error:', error);
}
```

---

## 📊 Metadata & Logging

### Automatic Audit Logging

Every API call is automatically logged:

```typescript
// Success
logAction('ai_called', 'Claude prompt generated (856ms, mood: stressed)');

// Failure
logAction('ai_called', 'Claude prompt failed: Rate limit exceeded - using fallback');
```

### Console Logging

```typescript
// Success
[Claude Prompt Service] ✅ Success {
  latency: '856ms',
  mood: 'stressed',
  mainPromptLength: 67,
  hasContrast: true
}

// Error
[Claude Prompt Service] ❌ Error {
  error: 'Claude API rate limit exceeded',
  latency: '423ms',
  mood: 'stressed'
}
```

---

## 🛡️ Error Handling Strategy

### Graceful Degradation

1. **API Key Missing** → Use fallback prompts
2. **Rate Limit** → Use fallback prompts
3. **Network Timeout** → Use fallback prompts (10s)
4. **Invalid Response** → Parse fallback or use defaults
5. **Unknown Error** → Fallback prompts

**Result:** User ALWAYS gets a prompt, even if API is down.

### Fallback Prompt Categories

```typescript
const FALLBACK_PROMPTS = {
  neutral: [
    "What's one thing you noticed about yourself today?",
    "How did you show up for yourself today?",
  ],
  positive: [
    "What brought you joy today, and why do you think that is?",
    "What strength did you discover or use today?",
  ],
  negative: [
    "What's one small thing that felt manageable today?",
    "If you could be kind to yourself right now, what would you say?",
  ],
  contrast: [
    "How does today compare to how you felt a week ago?",
    "What patterns do you notice when you look back?",
  ],
};
```

---

## 🧪 Testing

### Manual Testing

```typescript
// Test with mood
const result1 = await generateJournalPrompts({ currentMood: 'stressed' });
console.assert(result1.mainPrompt.length > 0, 'Main prompt should exist');
console.assert(result1.mainPrompt.includes('?'), 'Should be a question');

// Test without mood
const result2 = await generateJournalPrompts({});
console.assert(result2.mainPrompt.length > 0, 'Should work without mood');

// Test with context
const result3 = await generateJournalPrompts({
  currentMood: 'happy',
  pastEntriesSummary: 'Recent patterns: mostly stressed',
});
console.assert(result3.contrastPrompt, 'Should include contrast prompt');
```

### Validate Prompt Quality

```typescript
import { validatePrompt } from '@/services/ai/claudePromptService';

const isGood = validatePrompt(result.mainPrompt);
// true if: 5-60 words, contains '?', not empty
```

---

## 🔒 Security Considerations

### API Key Storage

**Client-Side:**
- Stored in `localStorage` (user's device only)
- Never sent to your backend
- Direct API calls to Anthropic

**Server-Side:**
- Use environment variable: `CLAUDE_API_KEY`
- Never log API keys
- Rotate keys regularly

### Rate Limiting

Claude API limits (as of 2024):
- **Free tier:** ~5 requests/min
- **Paid tier:** ~50 requests/min

**Mitigation strategies:**
1. Use batch generation sparingly
2. Cache prompts in localStorage
3. Show retry button on rate limit
4. Implement exponential backoff

---

## 📈 Performance Optimization

### Caching Strategy

```typescript
// Cache prompts for each mood
const cacheKey = `cached_prompt_${mood}_${Date.now()}`;
localStorage.setItem(cacheKey, JSON.stringify(result));

// Use cached prompt if < 1 hour old
const cached = localStorage.getItem(cacheKey);
if (cached) {
  const { timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < 3600000) {
    return JSON.parse(cached);
  }
}
```

### Lazy Loading

```typescript
// Only call API when user actually needs a prompt
const showPromptButton = async () => {
  const result = await generateJournalPrompts({ currentMood });
  displayPrompt(result.mainPrompt);
};
```

---

## 🎤 Production Deployment

### Backend (Node.js/Express)

```typescript
import express from 'express';
import { generateJournalPrompts } from './services/claudePromptService';

const app = express();

app.post('/api/prompts/generate', async (req, res) => {
  const { mood, pastEntriesSummary } = req.body;
  
  const result = await generateJournalPrompts({
    currentMood: mood,
    pastEntriesSummary,
  });
  
  res.json(result);
});
```

### Frontend Usage

```typescript
const response = await fetch('/api/prompts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mood: 'stressed',
    pastEntriesSummary: summaryText,
  }),
});

const result = await response.json();
displayPrompt(result.mainPrompt);
```

---

## 📋 Best Practices

1. **Always check `metadata.success`** before showing "AI-generated" badge
2. **Show fallback indicator** when `metadata.fallbackUsed === true`
3. **Log latency** for monitoring API performance
4. **Cache prompts** to reduce API calls
5. **Handle rate limits** gracefully with user feedback
6. **Validate prompts** before display (length, question marks)
7. **Summarize past entries** intelligently (don't send full text)

---

## 🐛 Troubleshooting

### "Invalid Claude API key"
- Check key format: starts with `sk-ant-api03-`
- Verify key is active in Anthropic console
- Check environment variable: `process.env.CLAUDE_API_KEY`

### "Rate limit exceeded"
- Wait 1 minute between requests
- Use batch generation sparingly
- Implement caching layer
- Upgrade to paid tier

### Slow responses (> 3s)
- Check network connection
- Verify API endpoint is correct
- Reduce `MAX_TOKENS` if needed
- Increase `TIMEOUT_MS` for slower connections

---

## 📚 Further Reading

- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference/messages)
- [System Prompts Best Practices](https://docs.anthropic.com/claude/docs/system-prompts)
- [Rate Limits & Quotas](https://docs.anthropic.com/claude/reference/rate-limits)

---

**Built with ❤️ by Senior Backend Engineers**
