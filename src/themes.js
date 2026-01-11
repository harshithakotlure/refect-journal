// Writing Styles
// Each style has distinct behavior, tone, and visual treatment

export const THEMES = {
  focus: {
    name: 'Focus',
    description: 'Quick clarity',
    purpose: 'Fast emotional unloading',
    
    // Behavioral flags
    behavior: {
      showPrompts: false,        // No prompts - just write
      showMoodFirst: true,       // Get to writing faster
      lineHeight: '1.5',         // Compact
      textareaPadding: '12px',   // Tight
      placeholder: 'Write...',   // Minimal
    },
    
    colors: {
      page: '#fafafa',
      surface: '#ffffff',
      surfaceHover: '#f5f5f5',
      surfaceActive: '#eeeeee',
      textPrimary: '#1a1a1a',
      textSecondary: '#4a4a4a',
      textTertiary: '#7a7a7a',
      border: '#e0e0e0',
      borderHover: '#c0c0c0',
      borderActive: '#1a1a1a',
      accent: '#1a1a1a',
      accentHover: '#000000',
    }
  },
  
  paper: {
    name: 'Paper',
    description: 'Reflective space',
    purpose: 'Long-form contemplation',
    
    // Behavioral flags
    behavior: {
      showPrompts: true,         // Show prompts (available but not forced)
      showMoodFirst: false,      // Mood comes after writing
      lineHeight: '1.75',        // Spacious for long reads
      textareaPadding: '16px',   // Generous margins
      placeholder: 'Begin...',   // Quiet invitation
    },
    
    colors: {
      page: '#ffffff',
      surface: '#ffffff',
      surfaceHover: '#fafafa',
      surfaceActive: '#f5f5f5',
      textPrimary: '#2d2d2d',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#eeeeee',
      borderHover: '#dddddd',
      borderActive: '#2d2d2d',
      accent: '#2d2d2d',
      accentHover: '#000000',
    }
  },
  
  guided: {
    name: 'Guided',
    description: 'AI support',
    purpose: 'Reflection with guidance',
    
    // Behavioral flags
    behavior: {
      showPrompts: true,         // Show AI prompts
      showMoodFirst: true,       // Mood selection first
      lineHeight: '1.6',         // Balanced
      textareaPadding: '12px',   // Standard
      placeholder: 'Start writing...', // Encouraging
    },
    
    colors: {
      page: '#f7f6f3',
      surface: '#ffffff',
      surfaceHover: '#fafafa',
      surfaceActive: '#f1f1ef',
      textPrimary: '#37352f',
      textSecondary: '#787774',
      textTertiary: '#9b9a97',
      border: '#e9e9e7',
      borderHover: '#d3d2cf',
      borderActive: '#37352f',
      accent: '#37352f',
      accentHover: '#000000',
    }
  }
};

export const getTheme = (themeName) => {
  return THEMES[themeName] || THEMES.calm;
};

export const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem('journal-theme');
    // Migrate old 'calm' to 'guided'
    if (stored === 'calm') return 'guided';
    return stored || 'guided';
  } catch {
    return 'guided';
  }
};

export const setStoredTheme = (themeName) => {
  try {
    localStorage.setItem('journal-theme', themeName);
  } catch {
    console.error('Failed to save theme preference');
  }
};
