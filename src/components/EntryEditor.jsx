import { useState } from 'react';

const MOODS = [
  { emoji: '😊', label: 'Great', value: 'great', color: 'green' },
  { emoji: '🙂', label: 'Good', value: 'good', color: 'blue' },
  { emoji: '😐', label: 'Okay', value: 'okay', color: 'gray' },
  { emoji: '😔', label: 'Down', value: 'down', color: 'purple' },
  { emoji: '😰', label: 'Stressed', value: 'stressed', color: 'orange' },
];

export default function EntryEditor({ onSave, isSaving }) {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);

  const handleSave = () => {
    if (content.trim() && selectedMood) {
      onSave({ content, mood: selectedMood });
      setContent('');
      setSelectedMood(null);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">New Entry</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Mood Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How are you feeling?
        </label>
        <div className="flex gap-3 flex-wrap">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl smooth-transition ${
                selectedMood === mood.value
                  ? 'bg-gradient-to-br from-primary-100 to-secondary-100 border-2 border-primary-500 shadow-md scale-105'
                  : 'bg-white/50 border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs font-medium text-gray-700">{mood.label}</span>
            </button>
          ))}
        </div>
        {!selectedMood && content.trim() && (
          <p className="text-xs text-orange-600 mt-2">Please select a mood before saving</p>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind today? Your thoughts are encrypted and secure..."
        className="flex-1 w-full p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none smooth-transition bg-white/50"
        style={{ minHeight: '300px' }}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {content.length} characters
        </div>
        <button
          onClick={handleSave}
          disabled={!content.trim() || !selectedMood || isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 smooth-transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Save Entry
            </>
          )}
        </button>
      </div>

      <div className="text-xs text-gray-400 mt-2 text-right">
        Press Ctrl/Cmd + Enter to save
      </div>
    </div>
  );
}
