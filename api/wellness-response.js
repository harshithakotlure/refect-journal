// Serverless Function: Generate AI Wellness Responses
// Securely calls OpenAI API without exposing keys to client

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const requestId = `wellness-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { entryContent, mood } = req.body;

    // Validate input
    if (!entryContent || typeof entryContent !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: entry content is required',
        fallback: true,
        response: "I'm here listening. Your entry is safely saved.",
        metadata: { success: false, error: 'Invalid input', latencyMs: Date.now() - startTime }
      });
    }

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error(`[${requestId}] OpenAI API key not configured`);
      return res.status(200).json({
        fallback: true,
        response: "I'm here listening. Your entry is safely saved.",
        metadata: { 
          success: false, 
          error: 'API key not configured', 
          latencyMs: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }

    // System prompt for wellness companion
    const systemPrompt = `You are a supportive mental wellness companion trained in positive psychology and cognitive behavioral therapy techniques.
When responding to journal entries:
1. Acknowledge the user's feelings with empathy.
2. Identify and validate key emotions expressed (e.g., "It sounds like you're feeling [emotion1], [emotion2], and [emotion3]").
3. If negative thoughts are present, gently offer a reframing or alternative perspective.
4. Highlight strengths, resilience, or positive aspects mentioned.
5. Ask a thought-provoking question to encourage reflection.
6. Keep responses brief (2-3 sentences), warm, and non-judgmental.
7. Never diagnose or give medical advice.
Your goal: Help users process emotions constructively and cultivate positive thinking patterns.`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Mood: ${mood || 'not specified'}\n\nJournal entry:\n${entryContent}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[${requestId}] OpenAI API error:`, openaiResponse.status, errorText);
      
      return res.status(200).json({
        fallback: true,
        response: "I'm here listening, even if I can't respond right now. Your entry is safely saved.",
        metadata: {
          success: false,
          error: 'AI service unavailable',
          latencyMs: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0]?.message?.content || "I'm here with you. Your thoughts are valued.";

    // Extract emotions if mentioned (simple parsing)
    const emotions = extractEmotions(aiResponse);

    // Log metadata (no user content)
    console.log(`[${requestId}] Success - Mood: ${mood || 'unspecified'}, Latency: ${Date.now() - startTime}ms, Model: ${data.model}, Tokens: ${data.usage?.total_tokens}`);

    return res.status(200).json({
      response: aiResponse,
      emotions,
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
      response: "I'm here listening. Your entry is safely saved.",
      metadata: {
        success: false,
        error: 'Internal error',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true
      }
    });
  }
}

// Simple emotion extraction from AI response
function extractEmotions(text) {
  const emotionKeywords = [
    'joy', 'happiness', 'gratitude', 'pride', 'contentment', 'calm',
    'sadness', 'grief', 'disappointment', 'loneliness',
    'anger', 'frustration', 'irritation',
    'fear', 'anxiety', 'worry', 'stress', 'overwhelm',
    'hope', 'optimism', 'resilience', 'strength'
  ];

  const found = [];
  const lowerText = text.toLowerCase();
  
  emotionKeywords.forEach(emotion => {
    if (lowerText.includes(emotion)) {
      found.push(emotion.charAt(0).toUpperCase() + emotion.slice(1));
    }
  });

  return found.slice(0, 5); // Return up to 5 emotions
}
