// Serverless Function: Generate Journal Writing Prompts
// Securely calls Claude API without exposing keys to client

import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const requestId = `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { mood, pastEntriesSummary } = req.body;

    // Validate input
    if (!mood || typeof mood !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: mood is required',
        fallback: true,
        mainPrompt: "What's one thing you noticed about yourself today?",
        metadata: { success: false, error: 'Invalid input', latencyMs: Date.now() - startTime }
      });
    }

    // Get API key from environment
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error(`[${requestId}] Claude API key not configured`);
      return res.status(200).json({
        fallback: true,
        mainPrompt: getFallbackPrompt(mood),
        metadata: { 
          success: false, 
          error: 'API key not configured', 
          latencyMs: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }

    // Build prompt for Claude
    const systemPrompt = `You are an AI journaling guide that generates reflective prompts based on REAL user data.

Generate prompts in this EXACT format:

Line 1: ONE main reflective question based on the user's current mood (open-ended, empathetic, under 60 words)

Line 2 (ONLY if past entries context is provided AND contains clear patterns):
- ONE contrast prompt that EXPLICITLY references the past patterns provided
- Must mention specific moods, themes, or keywords from the past data
- Example: "In earlier entries, work stress came up often. How does today's stress compare?"
- If past data is vague or insufficient, DO NOT generate a contrast prompt

CRITICAL RULES:
- Return ONLY the questions themselves, NO labels, NO headers, NO explanations
- Each question on its own line
- Questions must end with "?"
- Be empathetic and non-judgmental
- NEVER invent or fabricate past emotions/events not in the provided data
- If you cannot confidently reference past patterns, skip the contrast prompt entirely
- Do NOT give advice or diagnose mental health conditions

Example with clear past patterns:
What is causing you the most stress right now, and how can you take a small step to address it?
Your recent entries mentioned work deadlines repeatedly. How does today's stress relate to those earlier concerns?`;

    const userMessage = pastEntriesSummary 
      ? `Current mood: ${mood}\nContext from past entries: ${pastEntriesSummary}\n\nGenerate a main prompt and an optional reflective contrast prompt (on separate lines).`
      : `Current mood: ${mood}\n\nGenerate a thoughtful journaling prompt.`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error(`[${requestId}] Claude API error:`, claudeResponse.status, errorText);
      
      return res.status(200).json({
        fallback: true,
        mainPrompt: getFallbackPrompt(mood),
        metadata: {
          success: false,
          error: 'AI service unavailable',
          latencyMs: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }

    const data = await claudeResponse.json();
    const promptText = data.content[0]?.text || '';

    // Parse main and contrast prompts
    const lines = promptText.split('\n').filter(line => line.trim());
    const mainPrompt = lines[0] || getFallbackPrompt(mood);
    let contrastPrompt = lines[1] || undefined;

    // Validate contrast prompt - must reference past data
    if (contrastPrompt && pastEntriesSummary) {
      // Check if contrast prompt actually references past patterns
      const hasReference = /earlier|previous|recent|past|last|before|compared|pattern|trend|shift|differ|change/i.test(contrastPrompt);
      
      if (!hasReference) {
        // AI didn't ground the prompt in past data - discard it
        console.log(`[${requestId}] Contrast prompt not grounded in past data, discarding`);
        contrastPrompt = undefined;
      }
    }

    // If no past summary provided, ensure no contrast prompt
    if (!pastEntriesSummary) {
      contrastPrompt = undefined;
    }

    // Log metadata (no user content)
    console.log(`[${requestId}] Success - Mood: ${mood}, Latency: ${Date.now() - startTime}ms, Model: ${data.model}`);

    return res.status(200).json({
      mainPrompt,
      contrastPrompt,
      metadata: {
        success: true,
        latencyMs: Date.now() - startTime,
        model: data.model,
        fallbackUsed: false
      }
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error.message);
    
    return res.status(200).json({
      fallback: true,
      mainPrompt: "What's on your mind today?",
      metadata: {
        success: false,
        error: 'Internal error',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true
      }
    });
  }
}

// Fallback prompts based on mood
function getFallbackPrompt(mood) {
  const fallbacks = {
    great: "What brought you joy today, and why do you think that is?",
    good: "What's one thing you're grateful for today?",
    okay: "What's one thing you noticed about yourself today?",
    down: "If you could be kind to yourself right now, what would you say?",
    stressed: "What's one small thing that felt manageable today?"
  };
  
  return fallbacks[mood] || "What's on your mind today?";
}

// Present-focused fallback prompts (when insufficient past data)
function getPresentFocusedFallback() {
  const fallbacks = [
    "As you write today, notice what feels most present for you right now — even small moments can be worth capturing.",
    "Today's entry can stand on its own. What feels most important to put into words right now?",
    "You're starting a new thread here. What feels worth remembering from today?"
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
