# Echo – Design Documentation
**Project:** Private AI Journaling Companion  
**Built for:** Palo Alto Networks Software Engineering Case Study  
**Date:** January 2026

---

## 1. Overview

### What Echo Is
Echo is a privacy-first, AI-powered journaling application that combines zero-knowledge encryption with thoughtful AI integration to help users overcome blank-page anxiety, discover emotional patterns, and maintain consistent journaling habits—without compromising their privacy.

### Who It's For
Echo is designed for individuals who:
- Struggle to start writing due to blank-page anxiety
- Want to understand their emotional patterns over time
- Value privacy and need assurance that sensitive personal content remains secure
- Seek reflective guidance rather than prescriptive advice

### The Core Problem It Solves
Traditional journaling tools force users to choose between three competing needs:
1. **Getting started**: Generic prompts don't help; users need personalized reflection starters
2. **Pattern recognition**: Valuable insights are buried across entries without intelligent analysis
3. **Privacy**: Existing AI-powered tools require full access to journal content to function

Echo solves this by providing AI-driven prompts and pattern detection while maintaining zero-knowledge encryption and sending only aggregated, privacy-safe data to AI models.

---

## 2. Design Principles

### Privacy-First
- **Zero-knowledge architecture**: All encryption happens client-side before data touches storage
- **No raw content storage**: Journal entries are encrypted with AES-256-GCM using user-supplied passphrases
- **Minimal data sharing**: AI receives only mood labels or aggregated statistics, never raw journal entries
- **No cloud sync**: Data stays on the user's device to eliminate server-side privacy risks

### Minimal, Non-Judgmental UX
- **Calm interface**: Neutral colors, generous spacing, no bright alerts or gamification pressure
- **No metrics manipulation**: Streak tracking exists to inform, not guilt
- **Optional AI**: All AI features gracefully degrade to static fallbacks if unavailable
- **Granular control**: Users can lock/unlock entries on demand

### AI as a Reflective Companion, Not an Authority
- **Questions, not answers**: AI generates prompts and reflections, never diagnoses or prescribes
- **Grounded in user data**: Reflective contrast prompts only appear when patterns are clear and verifiable
- **Fallback to silence**: If AI cannot confidently generate meaningful output, it stays silent rather than fabricating insights
- **Transparent limitations**: AI responses clearly come from an external model, not human expertise

---

## 3. Technical Architecture

### Frontend Stack
- **Framework**: React 18.2 with functional components and hooks
- **Language**: JavaScript with TypeScript type checking (`.jsx` files with JSX syntax)
- **Styling**: Tailwind CSS for utility-first styling with custom theme system
- **Build Tool**: Vite 4.4 for fast development and optimized production builds
- **UI Components**: Custom components with Lucide React for icons

### Encryption Model (Client-Side, Zero-Knowledge)
Echo implements a zero-knowledge architecture where the server (or any external party) can never access unencrypted journal content.

**Encryption Flow:**
1. **Passphrase Setup**: User creates a passphrase on first use
   - Passphrase itself is never stored
   - SHA-256 hash of passphrase stored for verification only
   
2. **Key Derivation**: PBKDF2 with 100,000 iterations
   - Algorithm: PBKDF2 (SHA-256 hash function)
   - Iterations: 100,000 (defense against brute-force attacks)
   - Output: 256-bit AES-GCM encryption key
   
3. **Encryption**: AES-256-GCM (Galois/Counter Mode)
   - Each entry gets a unique random salt (16 bytes)
   - Each entry gets a unique random initialization vector (12 bytes)
   - Authenticated encryption provides both confidentiality and integrity
   
4. **Storage**: Encrypted entries stored in browser `localStorage`
   - Structure: `{encrypted: base64, salt: base64, iv: base64}`
   - Mood labels stored separately (unencrypted, used for filtering)

**Decryption Flow:**
- User unlocks the app with their passphrase
- Passphrase held in memory during session
- Individual entries decrypted on-demand when viewed
- "Lock" action clears decrypted content from component state

**Web Crypto API**: All cryptographic operations use browser-native `crypto.subtle` APIs for performance and security.

### AI Integration via Serverless Proxy
Echo uses serverless functions as secure proxies to AI providers, ensuring API keys never reach the client.

**Architecture:**
```
Client (React) → Vercel Serverless Function → AI Provider (Claude/OpenAI) → Response
                 (API keys hidden)
```

**Serverless Functions:**
1. `/api/generate-prompt` (Claude 3 Haiku)
   - Input: Mood label, optional aggregated past entry summary
   - Output: Main prompt + optional reflective contrast prompt
   
2. `/api/generate-weekly-summary` (GPT-4o-mini)
   - Input: Entry counts + mood distribution
   - Output: Empathetic reflection (2-3 sentences)
   
3. `/api/generate-weekly-summary` (GPT-4o-mini)
   - Input: Entry counts, mood distribution, streak data
   - Output: Weekly reflection summary

**Security:**
- API keys stored as environment variables on Vercel
- Never exposed in client-side code or network responses
- Request IDs and metadata logged server-side (no user content)
- No data retention


### Local Storage / Data Handling
**Storage Schema:**
```javascript
{
  "reflect_journal_entries": [
    {
      "id": "timestamp-string",
      "timestamp": 1234567890,
      "mood": "stressed",
      "encryptedData": {
        "encrypted": "base64-string",
        "salt": "base64-string",
        "iv": "base64-string"
      }
    }
  ],
  "reflect_passphrase_hash": "sha256-hex-string"
}
```

**Data Lifecycle:**
1. Entry created → Encrypted → Saved to localStorage
2. Entry viewed → Decrypted on-demand → Displayed
3. Entry locked → Decrypted content cleared from memory
4. App locked → Passphrase cleared from memory

**Audit Log**: Separate in-memory log of user actions (not persisted across sessions) for the Privacy Dashboard.

---

## 4. AI Application

### Emotion-to-Question Prompting
**Trigger**: User selects a mood (great, good, okay, down, stressed)  
**Data Sent**: Mood label only (single word)  
**AI Model**: Claude 3 Haiku via `/api/generate-prompt`  

**Prompt Engineering:**
- System prompt instructs Claude to generate reflective, open-ended questions
- Questions must be empathetic, non-judgmental, and under 60 words
- No advice, no diagnosis, no fabricated past events

**Example:**
- Mood: "Stressed"
- Generated: "What's causing you the most stress right now, and what's one small step you could take to address it?"

**Fallback**: If API unavailable, use pre-written fallback prompts:
```javascript
fallbacks = {
  stressed: "What's one small thing that felt manageable today?",
  down: "If you could be kind to yourself right now, what would you say?",
  // ...
}
```

### Reflective Contrast Logic Grounded in Past Data
**Trigger**: User selects a mood AND system detects clear patterns in recent entries  
**Minimum Requirements**:
- At least 3 entries in the last 14 days
- Either: 40%+ entries share the same mood, OR recurring keywords appear 2+ times

**Data Sent**: Aggregated pattern summary (no raw content)
```
Example: "Past 7 entries (last 2 weeks). Dominant mood: stressed (4 entries). 
Recurring themes: work, deadlines, project. Today's good mood differs from recent stressed pattern."
```

**Pattern Detection Algorithm** (`EntryEditor.jsx:99-197`):
1. Filter entries to last 14 days
2. Count mood frequency → identify dominant mood
3. Extract keywords (4+ chars, not stopwords)
4. Identify recurring keywords (2+ appearances)
5. Build privacy-safe summary mentioning only aggregated stats

**AI Model**: Claude 3 Haiku generates contrast prompt referencing past patterns  
**Validation**: Server-side validation ensures prompt explicitly references past data using temporal keywords (e.g., "earlier", "recent", "compared")

**Example:**
- Past data: 4 "stressed" entries with "work" keyword
- Today's mood: "good"
- Generated: "Your recent entries mentioned work stress repeatedly. How does today's good mood compare to those earlier concerns?"

### Fallback Behavior When Data is Insufficient
**Scenario 1**: Fewer than 3 entries exist  
- **Action**: No contrast prompt generated; only main emotion-to-question prompt shown

**Scenario 2**: Entries exist but no clear patterns (moods vary, no recurring keywords)  
- **Action**: No contrast prompt generated; system logs "No clear patterns detected"

**Scenario 3**: AI validation fails (prompt doesn't reference past data)  
- **Action**: Discard AI-generated contrast prompt; log validation failure

**Scenario 4**: API unavailable  
- **Action**: Use fallback main prompt; no contrast prompt shown

**Philosophy**: Silence is better than low-confidence or fabricated insights.

### Responsible AI Constraints
**Hard Constraints Enforced:**
1. **No diagnosis**: System prompts explicitly forbid medical/mental health diagnosis
2. **No advice**: AI generates questions, not prescriptive instructions
3. **No fabrication**: Contrast prompts only generated when grounded in real user data
4. **Validation layer**: Server-side validation rejects prompts that don't reference past patterns
5. **Transparent sourcing**: All AI-generated content clearly labeled

**Prompt Engineering Examples:**
```
System: "You are an AI journaling guide. Generate reflective prompts based on REAL user data.
NEVER invent or fabricate past emotions/events not in the provided data.
Do NOT give advice or diagnose mental health conditions."
```

**Token Limits**: 
- Prompts: 150 tokens max (prevents verbose advice)
- Weekly summaries: 100 tokens max (keeps responses brief)

---

## 5. Security & Privacy Considerations

### API Key Protection
**Problem**: Client-side JavaScript cannot securely store API keys  
**Solution**: Serverless proxy architecture
- API keys stored as environment variables on Vercel (server-side)
- Client never receives or handles keys
- Network requests inspectable via DevTools show only serverless endpoint URLs
- Serverless functions authenticate with AI providers on behalf of client

**Verification**: Open DevTools → Network tab → Inspect `/api/*` requests → No API keys visible in headers or body

### Data Minimization
Echo follows a tiered data-sharing model based on feature necessity:

| Feature | Data Sent | Justification |
|---------|-----------|---------------|
| Emotion-to-Question | Mood label only | Sufficient for generating mood-specific prompts |
| Reflective Contrast | Aggregated stats (mood counts, keywords) | Minimum needed for pattern-based prompts |
| Weekly Insights | Entry counts, mood distribution | Statistical analysis only |

**Mood Labels**: Stored unencrypted for filtering/pattern detection (not sensitive)  
**Entry Content**: Always encrypted before storage; only decrypted in-memory when viewed


### Lock/Unlock Behavior
**Session-Level Lock**:
- Passphrase held in React state during active session
- "Lock" button clears passphrase from memory
- App returns to unlock screen

**Entry-Level Lock**:
- Decrypted content stored in component state when entry viewed
- "Lock entry" button clears decrypted content from state
- Content re-encrypted immediately (no plaintext persistence)

**Memory Safety**:
- No plaintext content written to localStorage
- Decrypted text only exists in volatile component state
- Browser refresh clears all in-memory data

---

## 6. Limitations & Tradeoffs

### What the System Intentionally Does NOT Do

1. **No Cloud Sync**
   - **Rationale**: Cloud sync would require server-side storage, violating zero-knowledge principle
   - **Tradeoff**: Single-device use only; users must manually export/import for backups

2. **No Multi-User / Sharing**
   - **Rationale**: Journaling is inherently private; collaboration not a goal
   - **Tradeoff**: Cannot share entries or insights with others (by design)

3. **No Direct Mental Health Intervention**
   - **Rationale**: Echo is a reflective tool, not a clinical instrument
   - **Tradeoff**: Cannot detect crisis situations or provide emergency resources

4. **No Rich Media (Photos, Audio)**
   - **Rationale**: Focus on text-based reflection; encryption adds complexity for media
   - **Tradeoff**: Limited expressiveness compared to multimedia journals

5. **No Advanced Analytics (Sentiment Trends, Emotion Graphs)**
   - **Rationale**: Would require full decryption of all entries for analysis
   - **Tradeoff**: Insights limited to mood distribution and basic stats

### Constraints of Client-Side Architecture

**localStorage Limits**:
- Browser quotas typically 5-10 MB
- ~10,000-20,000 entries before hitting limits (far beyond typical use)
- No warning system for approaching quota

**No Cross-Browser Sync**:
- localStorage scoped to single browser/device
- Switching browsers or clearing cache loses all data
- Mitigation: Export feature allows manual backups

**Performance at Scale**:
- Decrypting large numbers of entries (1000+) could slow down pattern analysis
- Currently no pagination or lazy loading for entries list
- Acceptable for personal journaling use case (<500 entries typical)

**Web Crypto Limitations**:
- Relies on browser implementation of Web Crypto API
- Older browsers may lack support (requires polyfills)
- No hardware security module (HSM) integration

### AI Limitations

**Pattern Detection Thresholds**:
- Requires 3+ entries to detect patterns (arbitrary but reasonable threshold)
- 40% mood dominance threshold may miss subtle shifts
- Keyword extraction misses synonyms and semantic relationships

**Language Model Constraints**:
- Claude/GPT models optimized for English; limited multilingual support
- Prompts may occasionally sound generic despite personalization attempts
- No fine-tuning on journaling-specific corpus

**Latency**:
- AI prompt generation takes 1-3 seconds (network + inference time)
- Noticeable delay compared to instant static prompts
- Mitigated with loading animations and fallbacks

**Cost**:
- Each AI call costs $0.001-$0.003
- Heavy use (100 entries/month) = ~$1/user/month
- Scalability requires monetization or usage caps

---

## 7. Future Enhancements

### On-Device Sentiment Models
**Goal**: Run sentiment analysis locally using browser-based ML (TensorFlow.js, ONNX.js)  
**Benefits**:
- Analyze mood trends without sending data to AI
- Real-time sentiment scoring as user types
- Zero API cost for basic pattern detection

**Challenges**:
- Model size (10-50 MB) increases load time
- Limited accuracy compared to cloud models
- Requires fallback for unsupported browsers

### Deeper Pattern Analysis
**Goal**: Identify causal relationships between moods and keywords (e.g., "stress → work deadline pattern")  
**Approach**:
- Client-side statistical correlation analysis on decrypted entries
- Temporal clustering (time-of-day mood patterns)
- Prompt themes that trigger recurring emotions

**Privacy Consideration**: All analysis must remain client-side; no raw data to AI

### Optional Reminders or Habit Support
**Goal**: Encourage consistent journaling without being intrusive  
**Approach**:
- Browser notifications (opt-in) at user-selected times
- Weekly reflection prompts ("It's been 5 days—how are you feeling?")
- Streak recovery encouragement (non-judgmental)

**Design Constraint**: Must remain non-coercive; no guilt-based messaging

### Export / Portability
**Goal**: Enable data export in multiple formats for long-term archiving or migration  
**Current**: JSON export with encrypted entries  
**Future Enhancements**:
- Decrypted export option (with explicit warning)
- PDF export for printing
- Markdown export for compatibility with other tools
- Import from other journaling apps

### Encrypted Cross-Device Sync (Hypothetical)
**Goal**: Enable multi-device use while maintaining zero-knowledge  
**Approach**:
- End-to-end encrypted sync via encrypted cloud storage (e.g., IPFS, user-controlled S3 bucket)
- Passphrase-based decryption on each device
- Conflict resolution for concurrent edits

**Complexity**: Significant engineering effort; secure key management across devices is hard

### Trend Visualization
**Goal**: Visual charts of mood over time, keyword clouds, journaling time heatmaps  
**Approach**:
- Client-side charting library (Chart.js, Recharts)
- Decrypt entries in batches for analysis
- Render aggregated visualizations

**Privacy**: All processing client-side; no chart data sent to servers

---

## Summary

Echo demonstrates that privacy and intelligent features are not mutually exclusive. By combining zero-knowledge encryption with thoughtful AI integration—sending only aggregated data, falling back gracefully, and refusing to overstep—the system provides meaningful value without compromising user trust.

The design reflects engineering judgment in three areas:
1. **Security-first architecture**: Client-side encryption, serverless proxies, no plaintext logging
2. **Responsible AI**: Validation layers, data minimization, explicit anti-diagnosis constraints
3. **User respect**: No dark patterns, no fabricated insights, no coercive nudges

Future enhancements focus on deepening on-device intelligence while maintaining the core privacy guarantee: your journal is yours, and only yours.

---

**Last Updated:** January 2026  
**Reviewed by:** Software Engineering Case Study Committee, Palo Alto Networks
