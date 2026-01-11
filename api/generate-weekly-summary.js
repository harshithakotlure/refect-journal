// Serverless Function: Generate Weekly Insights Summary
// Securely calls OpenAI API without exposing keys to client

import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const requestId = `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { 
      totalEntries,
      weeklyEntries,
      moodDistribution,
      currentStreak,
      mostProductiveDay 
    } = req.body;

    // Validate input
    if (typeof totalEntries !== 'number' || typeof weeklyEntries !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid request: entry counts required',
        fallback: true,
        summary: "You're building a meaningful journaling practice. Keep writing to discover more patterns.",
        metadata: { success: false, error: 'Invalid input', latencyMs: Date.now() - startTime }
      });
    }

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error(`[${requestId}] OpenAI API key not configured`);
      return res.status(200).json({
        fallback: true,
        summary: getFallbackSummary(totalEntries, weeklyEntries, moodDistribution),
        metadata: { 
          success: false, 
          error: 'API key not configured', 
          latencyMs: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }

    // Build aggregated stats message (NO raw entry content)
    const statsMessage = buildStatsMessage({
      totalEntries,
      weeklyEntries,
      moodDistribution,
      currentStreak,
      mostProductiveDay
    });

    // System prompt for empathetic, reflective summaries
    const systemPrompt = `You are a compassionate journaling companion. Generate a brief 2-3 sentence weekly reflection based ONLY on the aggregated statistics provided (never mention specific entries or content).

Guidelines:
- Be warm, non-judgmental, and empathetic
- Focus on patterns and progress
- Acknowledge emotions reflected in mood data
- Keep it under 60 words
- Use "you" language (e.g., "You journaled X times")
- Avoid diagnosis or medical advice
- Be encouraging and supportive

Example: "You've been showing up for yourself this week with 5 entries. There's a balance between calm and stressed moments—that's completely natural. Keep exploring these feelings through writing."`;

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
            content: statsMessage
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[${requestId}] OpenAI API error:`, openaiResponse.status, errorText);
      
      return res.status(200).json({
        fallback: true,
        summary: getFallbackSummary(totalEntries, weeklyEntries, moodDistribution),
        metadata: {
          success: false,
          error: 'AI service unavailable',
          latencyMs: Date.now() - startTime,
          fallbackUsed: true
        }
      });
    }

    const data = await openaiResponse.json();
    const summary = data.choices[0]?.message?.content || getFallbackSummary(totalEntries, weeklyEntries, moodDistribution);

    // Log metadata (no user content)
    console.log(`[${requestId}] Success - Weekly entries: ${weeklyEntries}, Total: ${totalEntries}, Latency: ${Date.now() - startTime}ms`);

    return res.status(200).json({
      summary,
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
      summary: "You're building a meaningful journaling practice. Keep writing to discover more patterns.",
      metadata: {
        success: false,
        error: 'Internal error',
        latencyMs: Date.now() - startTime,
        fallbackUsed: true
      }
    });
  }
}

// Build aggregated statistics message (NO raw content)
function buildStatsMessage(stats) {
  const { totalEntries, weeklyEntries, moodDistribution, currentStreak, mostProductiveDay } = stats;
  
  let message = `Weekly journaling stats:\n`;
  message += `- Entries this week: ${weeklyEntries}\n`;
  message += `- Total lifetime entries: ${totalEntries}\n`;
  message += `- Current streak: ${currentStreak} days\n`;
  
  if (mostProductiveDay) {
    message += `- Most active day: ${mostProductiveDay}\n`;
  }
  
  if (moodDistribution && Object.keys(moodDistribution).length > 0) {
    message += `\nMood distribution this week:\n`;
    Object.entries(moodDistribution).forEach(([mood, count]) => {
      message += `- ${mood}: ${count} entries\n`;
    });
  }
  
  message += `\nGenerate a warm, empathetic 2-3 sentence reflection on these patterns.`;
  
  return message;
}

// Fallback summaries based on stats
function getFallbackSummary(totalEntries, weeklyEntries, moodDistribution) {
  if (weeklyEntries === 0) {
    return "It's been a quiet week. When you're ready, your journal will be here to welcome your thoughts.";
  }
  
  if (weeklyEntries === 1) {
    return "You showed up for yourself this week. Even one entry is a meaningful step in building self-awareness.";
  }
  
  // Check for mood patterns
  const moods = Object.keys(moodDistribution || {});
  const hasMixedMoods = moods.length > 2;
  
  if (hasMixedMoods) {
    return `You've journaled ${weeklyEntries} times this week, exploring a range of emotions. That variety shows you're processing life as it unfolds.`;
  }
  
  if (weeklyEntries >= 5) {
    return `${weeklyEntries} entries this week—you're building a strong practice! Consistency like this deepens self-understanding over time.`;
  }
  
  return `You've written ${weeklyEntries} times this week. Each entry is a conversation with yourself—keep going.`;
}
