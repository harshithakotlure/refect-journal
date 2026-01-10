// Analytics service for calculating journaling statistics

import type { JournalEntry, JournalingStats, MoodType } from '../../types';

/**
 * Calculate comprehensive journaling statistics
 */
export function calculateStats(entries: JournalEntry[]): JournalingStats {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      avgLength: 0,
      moodDistribution: {} as Record<MoodType, number>,
      bestWritingTime: 'N/A',
      mostProductiveDay: 'N/A',
    };
  }

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(entries);

  // Calculate mood distribution
  const moodDistribution = calculateMoodDistribution(entries);

  // Calculate best writing time
  const bestWritingTime = calculateBestWritingTime(entries);

  // Calculate most productive day
  const mostProductiveDay = calculateMostProductiveDay(entries);

  return {
    totalEntries: entries.length,
    currentStreak,
    longestStreak,
    avgLength: 150, // Placeholder - would need decryption
    moodDistribution,
    bestWritingTime,
    mostProductiveDay,
  };
}

/**
 * Calculate current and longest writing streaks
 */
function calculateStreaks(entries: JournalEntry[]): { currentStreak: number; longestStreak: number } {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].timestamp);
    entryDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (entryDate.getTime() === expectedDate.getTime()) {
      tempStreak++;
      currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      break;
    }
  }
  
  return { currentStreak, longestStreak };
}

/**
 * Calculate mood distribution
 */
function calculateMoodDistribution(entries: JournalEntry[]): Record<MoodType, number> {
  const distribution: Record<string, number> = {};
  
  entries.forEach(entry => {
    if (entry.mood) {
      distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
    }
  });
  
  return distribution as Record<MoodType, number>;
}

/**
 * Calculate best writing time (hour of day)
 */
function calculateBestWritingTime(entries: JournalEntry[]): string {
  const hourCounts: Record<number, number> = {};
  
  entries.forEach(entry => {
    const hour = new Date(entry.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  if (Object.keys(hourCounts).length === 0) return 'N/A';
  
  const bestHour = Object.keys(hourCounts).reduce((a, b) => 
    hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b
  );
  
  const hour = parseInt(bestHour);
  return `${hour}:00 - ${hour + 1}:00`;
}

/**
 * Calculate most productive day of the week
 */
function calculateMostProductiveDay(entries: JournalEntry[]): string {
  const dayCounts: Record<number, number> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  entries.forEach(entry => {
    const day = new Date(entry.timestamp).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  if (Object.keys(dayCounts).length === 0) return 'N/A';
  
  const bestDay = Object.keys(dayCounts).reduce((a, b) => 
    dayCounts[parseInt(a)] > dayCounts[parseInt(b)] ? a : b
  );
  
  return dayNames[parseInt(bestDay)];
}

/**
 * Get mood percentage in distribution
 */
export function getMoodPercentage(mood: MoodType, distribution: Record<MoodType, number>): number {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  return total > 0 ? ((distribution[mood] || 0) / total * 100) : 0;
}
