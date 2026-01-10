import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Download, 
  Trash2, 
  Key,
  XCircle,
  AlertTriangle,
  Flame,
  Heart
} from 'lucide-react';
import { loadEntries, clearAllData } from '../utils/storage';
import { logAction } from '../utils/audit';

const MOODS = {
  great: { emoji: '😊', label: 'Great', color: '#10b981' },
  good: { emoji: '🙂', label: 'Good', color: '#3b82f6' },
  okay: { emoji: '😐', label: 'Okay', color: '#6b7280' },
  down: { emoji: '😔', label: 'Down', color: '#a855f7' },
  stressed: { emoji: '😰', label: 'Stressed', color: '#f97316' },
};

export default function InsightsDashboard({ onClose, onChangePassphrase, onDataDeleted }) {
  const [entries, setEntries] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    avgLength: 0,
    moodDistribution: {},
    bestWritingTime: '',
    mostProductiveDay: '',
  });

  useEffect(() => {
    const loadedEntries = loadEntries();
    setEntries(loadedEntries);
    calculateStats(loadedEntries);
  }, []);

  const calculateStats = (entries) => {
    if (entries.length === 0) {
      setStats({
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgLength: 0,
        moodDistribution: {},
        bestWritingTime: 'N/A',
        mostProductiveDay: 'N/A',
      });
      return;
    }

    // Calculate streak
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
      } else {
        break;
      }
    }
    
    longestStreak = Math.max(currentStreak, tempStreak);

    // Mood distribution
    const moodCount = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
      }
    });

    // Best writing time (hour of day)
    const hourCounts = {};
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const bestHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, 0
    );
    const bestWritingTime = bestHour ? `${bestHour}:00 - ${parseInt(bestHour) + 1}:00` : 'N/A';

    // Most productive day
    const dayCounts = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    entries.forEach(entry => {
      const day = new Date(entry.timestamp).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const bestDay = Object.keys(dayCounts).reduce((a, b) => 
      dayCounts[a] > dayCounts[b] ? a : b, 0
    );
    const mostProductiveDay = bestDay !== undefined ? dayNames[bestDay] : 'N/A';

    // Average length (would need decryption - placeholder for now)
    const avgLength = Math.floor(Math.random() * 200) + 100; // Placeholder

    setStats({
      totalEntries: entries.length,
      currentStreak,
      longestStreak,
      avgLength,
      moodDistribution: moodCount,
      bestWritingTime,
      mostProductiveDay,
    });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reflect-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logAction('data_exported', `Exported ${entries.length} encrypted entries`);
  };

  const handleDeleteAll = () => {
    clearAllData();
    setShowDeleteConfirm(false);
    onDataDeleted();
  };

  const getMoodPercentage = (mood) => {
    const total = Object.values(stats.moodDistribution).reduce((a, b) => a + b, 0);
    return total > 0 ? ((stats.moodDistribution[mood] || 0) / total * 100).toFixed(0) : 0;
  };

  return (
    <div className="fixed inset-0 bg-[#f7f6f3]/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-effect rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 glass-effect border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#37352f] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#37352f]">Your Insights</h2>
              <p className="text-sm text-[#5a5956]">Discover patterns in your journaling journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 smooth-transition"
          >
            <XCircle className="w-6 h-6 text-[#5a5956]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Statistics */}
          <section>
            <h3 className="text-lg font-semibold text-[#37352f] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Your Journaling Journey
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-5 border border-[#e9e9e7]">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-700">{stats.totalEntries}</span>
                </div>
                <div className="text-sm font-medium text-[#37352f]">Total Entries</div>
                <div className="text-xs text-[#5a5956] mt-1">Keep writing!</div>
              </div>
              
              <div className="bg-white rounded-lg p-5 border border-[#e9e9e7]">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-700">{stats.currentStreak}</span>
                </div>
                <div className="text-sm font-medium text-[#37352f]">Day Streak</div>
                <div className="text-xs text-[#5a5956] mt-1">Longest: {stats.longestStreak} days</div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-[#e9e9e7]">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-lg font-bold text-purple-700">{stats.bestWritingTime}</span>
                </div>
                <div className="text-sm font-medium text-[#37352f]">Best Time to Write</div>
                <div className="text-xs text-[#5a5956] mt-1">Peak productivity</div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-[#e9e9e7]">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-bold text-blue-700">{stats.mostProductiveDay}</span>
                </div>
                <div className="text-sm font-medium text-gray-700">Most Active Day</div>
                <div className="text-xs text-gray-500 mt-1">Your favorite day</div>
              </div>
            </div>
          </section>

          {/* Mood Trends */}
          <section className="bg-white/50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mood Distribution</h3>
            
            {Object.keys(stats.moodDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(MOODS).map(([moodKey, moodData]) => {
                  const percentage = getMoodPercentage(moodKey);
                  const count = stats.moodDistribution[moodKey] || 0;
                  
                  return (
                    <div key={moodKey} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{moodData.emoji}</span>
                          <span className="font-medium text-gray-700">{moodData.label}</span>
                        </div>
                        <span className="text-gray-600">{count} entries ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full smooth-transition"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: moodData.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Start tracking your moods to see patterns!</p>
              </div>
            )}
          </section>

          {/* Writing Insights */}
          <section className="bg-[#fafafa] rounded-lg p-6 border border-[#e9e9e7]">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">✨ Insights</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {stats.currentStreak >= 3 && (
                <p>🔥 Amazing! You've journaled {stats.currentStreak} days in a row. Keep it up!</p>
              )}
              {stats.totalEntries >= 10 && (
                <p>📝 You've written {stats.totalEntries} entries. You're building a meaningful habit!</p>
              )}
              {stats.mostProductiveDay !== 'N/A' && (
                <p>📅 You tend to write most on {stats.mostProductiveDay}s. Consider setting that as your dedicated journaling time.</p>
              )}
              {stats.totalEntries === 0 && (
                <p>👋 Welcome! Start your first entry to begin tracking your emotional journey.</p>
              )}
            </div>
          </section>

          {/* Settings Section (Collapsed by default) */}
          <section className="bg-white rounded-lg border border-[#e9e9e7]">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#fafafa] smooth-transition rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#5a5956]" />
                <span className="font-medium text-[#37352f]">Settings & Data Management</span>
              </div>
              <svg 
                className={`w-5 h-5 text-[#787774] smooth-transition ${showSettings ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSettings && (
              <div className="p-4 pt-0 space-y-3 border-t border-[#e9e9e7]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <button
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#37352f] text-white rounded-md hover:bg-[#000] smooth-transition font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </button>
                  
                  <button
                    onClick={onChangePassphrase}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#37352f] text-white rounded-md hover:bg-[#000] smooth-transition font-medium text-sm"
                  >
                    <Key className="w-4 h-4" />
                    Change Passphrase
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#ef4444] text-white rounded-md hover:bg-[#dc2626] smooth-transition font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All Data
                  </button>
                </div>
                
                <div className="bg-[#fafafa] border border-[#e9e9e7] rounded-md p-3 text-xs text-[#37352f]">
                  <p>🔒 All your entries are encrypted with AES-256-GCM encryption and stored locally on your device.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="glass-effect rounded-2xl p-6 max-w-md w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Delete All Data?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                <li>All {stats.totalEntries} journal entries</li>
                <li>Your passphrase</li>
                <li>All insights and statistics</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 smooth-transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 smooth-transition font-medium"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
