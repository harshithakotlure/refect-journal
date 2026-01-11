# Echo – Private AI Journaling

A privacy-first mental wellness journaling app with AI-powered insights, built for the Palo Alto Networks Hackathon.

## 🎯 Problem Statement

People struggle to maintain consistent journaling habits due to blank-page anxiety, lack of meaningful reflection, and difficulty identifying emotional patterns over time.

## ✨ Solution

Echo combines **zero-knowledge encryption** with **thoughtful AI integration** to create a secure, empathetic journaling experience that helps users:
- Overcome writer's block with mood-based prompts
- Notice patterns through reflective contrast questions
- Gain weekly insights without compromising privacy

---

## 🏗️ Architecture

### **Client-Side (React + TypeScript)**
- AES-256-GCM encryption (all entries encrypted before storage)
- PBKDF2 key derivation (100k iterations)
- localStorage only - no server-side data storage
- Web Crypto API for security

### **Serverless Functions (Node.js)**
- `/api/generate-prompt` - Claude 3 Haiku for writing prompts
- `/api/generate-weekly-summary` - GPT-4o-mini for pattern insights
- API keys stored as environment variables (never exposed to client)

### **Privacy-First AI**
- **Pre-write prompts**: Only mood + aggregated patterns sent to AI
- **Reflective contrast**: Only aggregated stats (e.g., "stressed: 3, great: 2")
- **Weekly summaries**: Only entry counts and mood distribution
- **Zero raw text exposure**: No journal content sent to AI - only metadata

---

## 🚀 Quick Start

### **Local Development**

```bash
# Install dependencies
npm install

# Run without AI (uses fallback prompts)
npm run dev

# Run with AI features
npx vercel dev
```

### **With AI Features**

1. Create `.env.local`:
```bash
CLAUDE_API_KEY=sk-ant-api03-your-key
OPENAI_API_KEY=sk-your-key
```

2. Run: `npx vercel dev`
3. Open: http://localhost:3000

---

## 🧪 Testing

### **Test AI Prompts**
1. Select a mood (e.g., "Stressed")
2. AI prompt appears automatically above editor
3. If you have past entries, a "Reflection" prompt compares today with past patterns

### **Test Weekly Insights**
```javascript
// Paste in browser console to create test data
function createTestEntries() {
  const entries = [];
  for (let i = 1; i <= 7; i++) {
    entries.push({
      id: `test-${Date.now() - i * 86400000}`,
      timestamp: Date.now() - (i * 86400000),
      mood: ['great', 'good', 'stressed', 'down', 'okay'][i % 5],
      encryptedData: { encrypted: btoa(`Test entry ${i}`), salt: 'test', iv: 'test' }
    });
  }
  localStorage.setItem('reflect_journal_entries', JSON.stringify(entries));
  location.reload();
}
createTestEntries();
```

Then open Insights Dashboard - weekly summary appears at top.

---

## 🔐 Security Features

### **Encryption**
- All entries encrypted client-side before storage
- Passphrase never stored (only SHA-256 hash for verification)
- Unique salt + IV per entry
- View encrypted data in DevTools (demo feature)

### **API Key Protection**
- Keys stored server-side as environment variables
- Serverless functions proxy all AI calls
- No keys visible in browser network requests
- Check DevTools → Network → `/api/generate-prompt` to verify

### **Privacy Guarantees**
- ✅ Journal content stays local (localStorage)
- ✅ AI receives only aggregated stats for insights
- ✅ No user tracking or analytics
- ✅ Export all data anytime (encrypted JSON)

---

## 🎨 Features

### **Core**
- Mood tracking (5 moods: Great, Good, Okay, Down, Stressed)
- Client-side AES-256-GCM encryption
- Passphrase management with re-encryption
- Entry filtering by mood
- Data export/import

### **AI-Powered**
1. **Pre-Write Prompts** - Mood-based reflective questions (Claude)
2. **Reflective Contrast** - Compares today with past patterns (Claude)
3. **Wellness Responses** - Empathetic feedback with positive psychology (OpenAI)
4. **Weekly Insights** - AI-generated summaries of journaling patterns (OpenAI)

### **Insights Dashboard**
- Journaling streak tracking
- Mood distribution charts
- Best writing time analysis
- Most productive day detection
- AI-generated weekly reflections

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Encryption** | Web Crypto API (AES-256-GCM, PBKDF2) |
| **Storage** | localStorage (client-side only) |
| **Serverless** | Node.js, Vercel Functions |
| **AI** | Claude 3.5 Sonnet, OpenAI GPT-4o-mini |
| **Deployment** | Vercel (auto-scaling, global CDN) |

---

## 🚀 Deployment

### **Deploy to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add environment variables (via dashboard or CLI)
vercel env add CLAUDE_API_KEY
vercel env add OPENAI_API_KEY

# Redeploy with keys
vercel --prod
```

### **Environment Variables**
- `CLAUDE_API_KEY` - Get from https://console.anthropic.com/settings/keys
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys

---

## 🎯 Key Differentiators

1. **Privacy-First AI** - Aggregated stats only, never raw content
2. **Zero-Knowledge Architecture** - All encryption client-side
3. **Serverless Security** - API keys never exposed to browser
4. **Graceful Degradation** - Works with fallback prompts if AI fails
5. **Production-Ready** - Error handling, rate limiting, monitoring

---

## 📝 Project Structure

```
refect-journal/
├── api/                    # Serverless functions
│   ├── generate-prompt.js          # Claude prompts
│   └── generate-weekly-summary.js  # Weekly insights
├── src/
│   ├── components/         # React components
│   ├── services/
│   │   ├── encryption/     # AES-256-GCM encryption
│   │   ├── ai/             # AI service clients
│   │   ├── storage/        # localStorage management
│   │   └── analytics/      # Mood tracking
│   ├── context/            # React Context (Auth, Journal)
│   └── types/              # TypeScript interfaces
├── vercel.json             # Serverless config
└── README.md               # This file
```

---


## 🔍 For Reviewers

### **What Makes This Special**
- **Security Awareness**: Identified API key exposure risk, refactored to serverless
- **Privacy Design**: AI gets aggregated stats, not raw journal content
- **Production Quality**: Error handling, fallbacks, comprehensive logging
- **Scalability**: Serverless auto-scaling, <$50/month for 1000 users

### **Try These**
1. Create 5+ entries with different moods
2. Open Insights → See AI weekly summary
3. Select "Stressed" mood → Notice contrast prompt comparing with past
4. Open DevTools → Network → Verify no API keys in requests

---

