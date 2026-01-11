// Serverless Function: Generate Journal Writing Prompts
// Securely calls Claude API without exposing keys to client

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
    const systemPrompt = `You are an AI journaling guide.

Primary task: Generate 1 main reflective question based on the user's mood.

Secondary task (ONLY if past entries context is provided): Generate 1 optional reflective contrast prompt that helps the user notice patterns or changes compared to their past journaling.

Guidelines for contrast prompts:
- Keep it brief (1 sentence, under 50 words)
- Be empathetic and non-judgmental
- Help user notice trends or shifts in mood/patterns
- Open-ended, not yes/no
- Example: "How does today's stress compare to the calmer moments you experienced last week?"
- Return on a new line after the main prompt

Do NOT give advice or diagnose mental health conditions.`;

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
        model: 'claude-3-5-sonnet-20240620',
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
    const contrastPrompt = lines[1] || undefined;

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
