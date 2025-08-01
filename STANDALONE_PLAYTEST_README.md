# Standalone Recipe Playtest System

## Overview

The Standalone Playtest System is a completely independent, simplified version of the Culinary Logic Puzzle game designed specifically for reliable recipe testing. It implements only the core game mechanics without any of the complex features that caused issues in previous playtest attempts.

## Key Design Principles

### 1. **Complete Independence**
- No dependencies on main game files (`GameLogic.js`, `sketch.js`, etc.)
- Own Supabase connection and query logic
- Self-contained CSS and JavaScript
- Won't break when main game is updated

### 2. **Minimal Dependencies**
- Only external dependency: Supabase client library
- No p5.js, no complex animation systems
- Pure vanilla JavaScript and CSS
- No module loading or timing issues

### 3. **Core Mechanics Only**
- Drag and drop ingredients
- Combination checking
- Win condition detection
- Move counting and timer
- That's it!

### 4. **Reliability First**
- No canvas rendering (uses DOM elements)
- No CORS issues with images
- No complex state management
- Clear error messages

## Features

### Recipe Selection
- Browse all recipes in a clean, searchable list
- Search by recipe name, date, or day number
- Random recipe selection
- Shows recipe structure preview

### Gameplay
- Drag and drop vessels to combine
- Visual feedback for valid/invalid combinations
- Combination tracking sidebar
- Move counter and timer
- Clean win screen with stats

### Mobile Support
- Touch-enabled drag and drop
- Responsive design
- Works on phones and tablets

## How to Use

1. **Access the playtest**: Navigate to `/standalone-playtest.html`
2. **Select a recipe**: 
   - Browse the list or use search
   - Click any recipe to test it
   - Or use "Random Recipe" button
3. **Play the game**:
   - Drag ingredients onto each other
   - Create intermediate combinations
   - Combine everything into the final dish
4. **Review results**: See moves and time taken

## Technical Architecture

### Files
- `standalone-playtest.html` - Simple HTML structure
- `standalone-playtest.js` - Self-contained game logic
- `standalone-playtest.css` - Clean, modern styling

### Data Flow
1. Loads recipes directly from Supabase
2. Processes into consistent format
3. No caching or complex state
4. Each game session is independent

### Key Differences from Main Game

| Feature | Main Game | Standalone Playtest |
|---------|-----------|-------------------|
| Rendering | p5.js Canvas | DOM Elements |
| Dependencies | 20+ JS files | 1 JS file |
| Animations | Complex particle systems | Simple CSS transitions |
| State Management | Global variables | Single state object |
| Error Handling | Console logs | User-friendly modals |
| Loading | Multi-stage with dependencies | Direct and simple |

## Advantages

### For Testing
- **Fast Loading**: No complex initialization
- **Reliable**: Same behavior every time
- **Clear Feedback**: See exactly what's happening
- **No Side Effects**: Doesn't interfere with main game

### For Maintenance
- **Easy to Update**: Modify without breaking main game
- **Simple Debugging**: All logic in one file
- **Future Proof**: Minimal external dependencies
- **Clear Code**: Easy to understand and modify

## Configuration

The system uses hardcoded configuration at the top of `standalone-playtest.js`:

```javascript
const CONFIG = {
    SUPABASE_URL: 'your-supabase-url',
    SUPABASE_ANON_KEY: 'your-anon-key',
    VESSEL_COLORS: {
        base: '#FFFFFF',
        partial: '#FFD700',
        complete: '#778F5D'
    }
};
```

Update these values if your Supabase instance changes.

## Troubleshooting

### Recipes Not Loading
1. Check browser console for errors
2. Verify Supabase credentials in CONFIG
3. Ensure you have network connectivity

### Drag and Drop Not Working
1. Check if JavaScript is enabled
2. Try refreshing the page
3. Test in a different browser

### Visual Issues
1. Clear browser cache
2. Check for CSS loading errors
3. Verify viewport meta tag for mobile

## Future Enhancements

While keeping the core simple, these could be added:
- Recipe difficulty indicators
- Hint system (simplified)
- Score tracking
- Batch testing mode
- Export test results

## Why This Approach Works

1. **No Timing Issues**: Everything loads synchronously
2. **No Dependencies**: Can't have missing dependencies
3. **No Overrides**: Doesn't modify any global functions
4. **No Canvas**: Avoids all CORS and rendering issues
5. **Simple State**: Easy to track and debug

This standalone system provides a reliable way to test recipes without the complexity and fragility of trying to integrate with the main game code.