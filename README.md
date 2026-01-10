# Reflect - AI-Powered Journaling Companion

A mental wellness journaling app with mood tracking, insights, and client-side encryption built with React and Web Crypto API.

## ✨ Features

### 📊 Mental Wellness Insights
- **Mood Tracking**: Select from 5 moods (😊 Great, 🙂 Good, 😐 Okay, 😔 Down, 😰 Stressed) before each entry
- **Mood Trends Visualization**: See your emotional patterns with color-coded mood distribution charts
- **Journaling Statistics**: Track your writing streak, total entries, and consistency
- **Writing Patterns**: Discover your best time to write and most productive days
- **Insights Dashboard**: Get personalized feedback on your journaling habits

### 🔐 Privacy & Security
- **Client-Side Encryption**: All entries encrypted with AES-256-GCM before storage
- **Secure Key Derivation**: PBKDF2 with 100,000 iterations for passphrase protection
- **Privacy First**: No server, no tracking - your data stays on your device
- **Transparent Security**: View encrypted data in DevTools for verification

### 🎨 User Experience
- **Modern UI**: Calming blue/purple gradient design with glass morphism effects
- **Color-Coded Entries**: Each mood has its own color theme for visual context
- **Mood Filtering**: Filter entries by specific moods to review patterns
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Premium feel with optimized transitions

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🔐 Security Details

### Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000
- **Salt**: 16 bytes (randomly generated per entry)
- **IV**: 12 bytes (randomly generated per entry)

### Storage
- All encrypted data is stored in `localStorage`
- Passphrase is never stored - only a SHA-256 hash for verification
- Each entry has unique salt and IV for maximum security

### Demo Features
- Click "View encrypted data" on any entry to see the encrypted payload
- Check browser DevTools console when saving entries to see encryption details

## 🎯 Usage

1. **First Time Setup**: Create a secure passphrase (minimum 8 characters)
2. **Write Entries**: Use the text area to write your thoughts
3. **Save**: Click "Save Entry" or press Ctrl/Cmd + Enter
4. **View Past Entries**: Click any entry in the sidebar to decrypt and read
5. **Lock**: Click the lock button to secure your journal

⚠️ **Important**: Remember your passphrase! It cannot be recovered if lost.

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Web Crypto API** - Encryption

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ for privacy-conscious journaling
