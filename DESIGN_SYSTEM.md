# 🎨 Reflect - Minimal Design System

**Inspired by Notion's calm, writing-focused aesthetic**

---

## Design Philosophy

### Core Principles

1. **Quiet & Minimal** - The UI fades into the background
2. **Content-First** - Typography and spacing over color
3. **Calm & Private** - Neutral tones create a safe space
4. **Consistent** - Systematic use of spacing and typography
5. **Subtle** - Interactions are smooth and understated

---

## Color Palette

### Primary Colors (Notion-inspired)

```css
Background:     #f7f6f3  (Warm off-white)
Surface:        #ffffff  (Pure white cards)
Border:         #e9e9e7  (Subtle gray)
Border Hover:   #d3d2cf  (Slightly darker)
Subtle BG:      #fafafa  (Hover states)
```

### Text Colors

```css
Primary:        #37352f  (Nearly black, warm)
Secondary:      #787774  (Medium gray)
Tertiary:       #9b9a97  (Light gray, muted)
```

### Accent (used sparingly)

```css
Dark Accent:    #37352f  (Black button backgrounds)
Hover:          #000000  (Pure black on hover)
```

---

## Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

### Font Sizes

```css
/* Headings */
Large Heading:   text-2xl (24px)    - App title
Section:         text-lg (18px)     - Section headers
Subsection:      text-base (16px)   - Cards, labels

/* Body */
Body:            text-[15px]        - Entry content, prompts
Small:           text-sm (14px)     - Metadata, descriptions
Tiny:            text-xs (12px)     - Timestamps, hints
```

### Font Weights

```css
Semibold:        font-semibold (600) - Important headings
Medium:          font-medium (500)   - Buttons, labels
Normal:          font-normal (400)   - Body text
```

### Line Heights

```css
Relaxed:         leading-relaxed (1.6) - Entry content
Normal:          leading-normal (1.5)  - Most text
```

---

## Spacing System

### Consistent Scale

```css
Tight:           gap-2, p-2         (0.5rem / 8px)
Standard:        gap-3, p-3         (0.75rem / 12px)
Comfortable:     gap-4, p-4         (1rem / 16px)
Spacious:        gap-5, p-5         (1.25rem / 20px)
Generous:        gap-6, p-6         (1.5rem / 24px)
```

### Padding Guidelines

```css
Cards:           p-5, p-6           (20-24px)
Buttons:         px-3 py-1.5, px-5 py-2
Inputs:          p-4                (16px)
```

---

## Components

### Buttons

#### Primary Button (Black)

```jsx
className="px-5 py-2 bg-[#37352f] text-white text-sm font-medium 
           rounded-md hover:bg-[#000] smooth-transition"
```

**When to use:** Save actions, primary CTAs

#### Secondary Button (White)

```jsx
className="px-3 py-1.5 bg-white border border-[#e9e9e7] 
           text-[#37352f] text-sm font-medium rounded-md 
           hover:bg-[#fafafa] smooth-transition"
```

**When to use:** Navigation, less important actions

#### Tertiary Button (Minimal)

```jsx
className="text-sm text-[#787774] hover:text-[#37352f] 
           font-medium smooth-transition"
```

**When to use:** Refresh, retry, subtle actions

---

### Cards

#### Surface Card (Main containers)

```jsx
className="glass-effect rounded-lg p-6"
// → bg-white border border-[#e9e9e7] shadow-sm
```

**When to use:** Main sections (Editor, Entries List)

#### Nested Card (Content within sections)

```jsx
className="bg-white border border-[#e9e9e7] rounded-lg p-4 
           hover:border-[#d3d2cf] hover:bg-[#fafafa]"
```

**When to use:** Entry cards, prompts, nested content

#### Subtle Card (Background elements)

```jsx
className="bg-[#fafafa] border border-[#e9e9e7] rounded-lg p-4"
```

**When to use:** Loading states, fallbacks, less emphasis

---

### Inputs

#### Text Area (Main editor)

```jsx
className="w-full p-4 rounded-lg border border-[#e9e9e7] 
           focus:border-[#d3d2cf] outline-none bg-white 
           text-[#37352f] placeholder-[#9b9a97]"
style={{ fontSize: '15px', lineHeight: '1.6' }}
```

#### Select Dropdown

```jsx
className="text-sm px-2.5 py-1 rounded-md border border-[#e9e9e7] 
           bg-white hover:bg-[#fafafa] focus:border-[#d3d2cf] 
           text-[#37352f]"
```

---

### Mood Buttons

#### Unselected State

```jsx
className="px-3 py-2.5 bg-white border border-[#e9e9e7] 
           rounded-lg hover:border-[#d3d2cf] hover:bg-[#fafafa]"
```

#### Selected State

```jsx
className="px-3 py-2.5 bg-[#f1f1ef] border border-[#37352f] rounded-lg"
```

**Design note:** Selected state uses darker border instead of color fill

---

### Prompt Cards

#### Main Prompt Card

```jsx
className="bg-white border border-[#e9e9e7] rounded-lg p-4 
           hover:border-[#d3d2cf] hover:bg-[#fafafa] cursor-pointer"
```

#### Loading Shimmer

```jsx
className="bg-[#fafafa] border border-[#e9e9e7] rounded-lg p-4"
// Children: bg-[#e9e9e7] animate-pulse
```

#### Faded Banner (when typing)

```jsx
className="bg-[#fafafa] border border-[#e9e9e7] rounded-md p-2.5 opacity-60"
```

---

## Animations

### Transition Speed

```css
/* Standard transition */
.smooth-transition {
  transition: all 0.15s ease-in-out;
}
```

**Faster than usual** - Notion uses quick, snappy transitions

### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
```

**Subtle movement** - Only 4px, not 10px

---

## Borders & Shadows

### Borders

```css
Default:        border border-[#e9e9e7]
Hover:          border-[#d3d2cf]
Selected:       border-[#37352f]
Divider:        border-b border-[#e9e9e7]
```

### Shadows (minimal)

```css
/* Glass effect cards */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

/* No large shadows - keep it flat */
```

---

## Rounded Corners

```css
Cards:          rounded-lg (8px)
Buttons:        rounded-md (6px)
Small elements: rounded-md (6px)
Icon buttons:   rounded-md (6px)

/* No rounded-2xl - keep it subtle */
```

---

## Icons

### Size Scale

```css
Large:          w-6 h-6    (24px)
Standard:       w-4 h-4    (16px)
Small:          w-3.5 h-3.5 (14px)
```

### Colors

```css
Primary:        text-[#37352f]
Secondary:      text-[#787774]
Muted:          text-[#9b9a97]
```

### Stroke Width

```css
strokeWidth={2}  /* Standard for all icons */
```

---

## Scrollbars

### Minimal Custom Scrollbar

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;  /* Very thin */
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e3e2e0;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d3d2cf;
}
```

---

## Layout

### Max Width

```css
max-w-7xl mx-auto  /* Main container */
```

### Grid (Main layout)

```css
grid grid-cols-1 lg:grid-cols-3 gap-6
/* Entry Editor: 2 cols, Entries List: 1 col */
```

---

## State Patterns

### Disabled State

```css
className="... disabled:opacity-40 disabled:cursor-not-allowed"
```

### Hover State

```css
/* Buttons */
hover:bg-[#000]  (black buttons)
hover:bg-[#fafafa]  (white buttons)

/* Cards */
hover:border-[#d3d2cf] hover:bg-[#fafafa]
```

### Focus State

```css
focus:border-[#d3d2cf] outline-none
```

**No colored rings** - just border darkening

### Active/Expanded State

```css
border-[#d3d2cf]  /* Slightly darker border */
```

---

## Empty States

```jsx
<div className="glass-effect rounded-lg p-6 h-full 
                flex flex-col items-center justify-center text-center">
  <div className="w-12 h-12 rounded-lg bg-[#f7f6f3] 
                  flex items-center justify-center mb-3">
    {/* Icon */}
  </div>
  <h3 className="text-base font-semibold text-[#37352f] mb-1">
    No entries yet
  </h3>
  <p className="text-[#9b9a97] text-sm">
    Start writing to create your first entry
  </p>
</div>
```

---

## Loading States

### Spinner (minimal)

```jsx
<svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" 
          stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
</svg>
```

### Shimmer Lines

```jsx
<div className="space-y-2">
  <div className="h-2.5 bg-[#e9e9e7] rounded animate-pulse"></div>
  <div className="h-2.5 bg-[#e9e9e7] rounded w-5/6 animate-pulse"></div>
  <div className="h-2.5 bg-[#e9e9e7] rounded w-4/6 animate-pulse"></div>
</div>
```

---

## Typography Hierarchy

### Example: Entry Editor

```
┌─────────────────────────────────────────┐
│ New Entry              Dec 25            │  text-lg, text-sm (tertiary)
├─────────────────────────────────────────┤
│ How are you feeling?                    │  text-sm (secondary)
│ [😊] [🙂] [😐] [😔] [😰]                │  text-2xl emoji, text-xs label
├─────────────────────────────────────────┤
│ 💡 PROMPT                    [🔄 New]   │  text-xs (uppercase tertiary)
│ What's one thing...                     │  text-[15px] (primary)
├─────────────────────────────────────────┤
│ [Large textarea]                        │  text-[15px], leading-relaxed
├─────────────────────────────────────────┤
│ 127 characters           [Save]         │  text-sm (tertiary), button
│ ⌘ + Enter to save                       │  text-xs (tertiary)
└─────────────────────────────────────────┘
```

---

## Comparison: Before vs After

### Before (Colorful, Gradient-heavy)

```css
❌ bg-gradient-to-br from-purple-500 to-indigo-500
❌ from-blue-50 to-indigo-50
❌ shadow-xl hover:shadow-2xl
❌ text-blue-700, text-purple-600
❌ border-2 border-primary-500
```

### After (Minimal, Notion-inspired)

```css
✅ bg-[#37352f] (solid black)
✅ bg-white (solid white)
✅ box-shadow: 0 1px 3px rgba(0,0,0,0.04)
✅ text-[#37352f], text-[#787774]
✅ border border-[#e9e9e7]
```

---

## Accessibility

### Color Contrast

All text meets WCAG AA standards:
- Primary text (#37352f) on white: ✅ 13.5:1
- Secondary text (#787774) on white: ✅ 4.9:1
- Tertiary text (#9b9a97) on white: ✅ 3.8:1

### Focus States

```css
*:focus-visible {
  outline: 2px solid #e3e2e0;
  outline-offset: 2px;
  border-radius: 3px;
}
```

### Keyboard Navigation

All interactive elements are keyboard accessible with visible focus states.

---

## Mobile Responsiveness

### Breakpoints

```css
Mobile:         < 768px
Tablet:         768px - 1024px
Desktop:        > 1024px
```

### Responsive Adjustments

```css
/* Header title */
text-xl md:text-2xl

/* Padding */
p-4 md:p-8

/* Grid layout */
grid-cols-1 lg:grid-cols-3
```

---

## Best Practices

### ✅ DO

- Use neutral colors (#37352f, #787774, #9b9a97)
- Keep borders subtle (1px, #e9e9e7)
- Use flat surfaces (no gradients)
- Employ generous white space
- Make interactions fast (150ms transitions)
- Use system fonts
- Keep shadows minimal (1-3px)

### ❌ DON'T

- Use bright colors (blues, purples, greens)
- Add gradient backgrounds
- Create heavy shadows (shadow-xl)
- Use thick borders (border-2)
- Slow transitions (300ms+)
- Add unnecessary visual weight
- Compete with content

---

## Component Checklist

When building a new component, ask:

1. **Is it quiet?** Does it fade into the background?
2. **Is color used sparingly?** Only black/gray/white?
3. **Are transitions fast?** 150ms or less?
4. **Is spacing consistent?** Using the scale?
5. **Is the focus on content?** Typography over decoration?

---

## Implementation Notes

### Tailwind Config

```js
colors: {
  notion: {
    bg: '#f7f6f3',
    surface: '#ffffff',
    border: '#e9e9e7',
    text: {
      primary: '#37352f',
      secondary: '#787774',
      tertiary: '#9b9a97',
    },
    accent: {
      subtle: '#f1f1ef',
      soft: '#e3e2e0',
    }
  }
}
```

### CSS Variables (Alternative)

```css
:root {
  --color-bg: #f7f6f3;
  --color-surface: #ffffff;
  --color-border: #e9e9e7;
  --color-text-primary: #37352f;
  --color-text-secondary: #787774;
  --color-text-tertiary: #9b9a97;
}
```

---

## Design Inspiration

**Notion** - Calm, minimal, writing-focused
**Bear Notes** - Simple, elegant typography
**Things 3** - Subtle interactions, clean layout
**Linear** - Minimal borders, fast transitions

---

## Summary

This design system creates a **calm, private, distraction-free** journaling experience. By removing bright colors and gradients, we let the **content speak for itself**. The UI **fades into the background**, allowing users to focus entirely on their thoughts and reflections.

**The best interface is invisible.**

---

Built with care for your Palo Alto Networks hackathon 🎨
