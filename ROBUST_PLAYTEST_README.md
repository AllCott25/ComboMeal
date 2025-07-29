# Robust Playtest Solution

## Overview

The robust playtest solution (`robust-playtest.html` and `robust-playtest.js`) is a comprehensive testing environment that addresses all the issues found in previous playtest implementations:

1. **Missing Dependencies**: Includes all necessary JavaScript modules in the correct loading order
2. **touchSystem Error**: Properly loads the `interaction.js` module that defines touchSystem
3. **CORS/Canvas Tainted Error**: Implements workarounds for SVG loading issues
4. **Module Loading Order**: Ensures all dependencies are loaded before use

## How to Use

### Basic Usage

Access the playtest by navigating to:
```
/robust-playtest.html?date=YYYY-MM-DD
```

Example:
```
/robust-playtest.html?date=2025-04-11
```

### With Admin Back Link

If accessing from the admin panel:
```
/robust-playtest.html?date=2025-04-11&admin=true
```

## Features

### 1. Complete Dependency Loading
- Loads all required JavaScript modules in the correct order
- Includes design system, interaction handlers, animation, and game logic
- Ensures touchSystem and other dependencies are available

### 2. CORS/Security Workarounds
- Intercepts Image constructor to handle wallpaper SVG loading
- Overrides canvas.toDataURL to prevent tainted canvas errors
- Provides fallback mechanisms for problematic assets

### 3. Error Handling
- Clear error messages for missing or invalid dates
- Console logging for debugging
- Graceful fallbacks for missing features

### 4. Performance Optimizations
- Disables wallpaper animations in playtest mode
- Uses web-safe fonts instead of Google Fonts
- Minimal loading overlay for better UX

## Technical Details

### Module Loading Order

1. **External Libraries**
   - Supabase Client
   - P5.js

2. **Configuration**
   - `config.js` - Environment settings

3. **Core Systems**
   - `design-system.js` - UI design constants
   - `supabase.js` - Database integration
   - `streak.js` - Streak tracking
   - `user-migration.js` - User data handling

4. **Game Modules**
   - `VesselSystem.js` - Vessel rendering
   - `animation.js` - Animation handlers
   - `interaction.js` - Touch/mouse handlers (defines touchSystem)
   - `menu.js` - Menu system
   - `auth-modal.js` - Authentication UI

5. **Playtest Override**
   - `robust-playtest.js` - Date override logic

6. **Main Game**
   - `sketch.js` - Main game loop
   - `GameLogic.js` - Game mechanics
   - `draw.js` - Rendering functions
   - `WinScreen.js` - Win state handling
   - `egg.js` - Easter egg system
   - `help.js` - Help system

### Security Workarounds

The robust playtest implements several workarounds for common security issues:

1. **Image Loading**: Intercepts wallpaper SVG loads to prevent CORS errors
2. **Canvas Export**: Catches SecurityError on toDataURL and returns safe fallback
3. **Asset Loading**: Provides mock dimensions for problematic assets

## Troubleshooting

### Common Issues

1. **"No recipe found for date"**
   - Ensure the date has a recipe in the database
   - Check date format (YYYY-MM-DD)

2. **Loading stuck**
   - Check browser console for errors
   - Verify all assets are accessible
   - Try refreshing the page

3. **Visual glitches**
   - Wallpaper animations are disabled in playtest mode
   - This is intentional to avoid CORS issues

### Debug Mode

The playtest logs detailed information to the console:
- Dependency loading status
- Recipe loading progress
- Any errors or warnings

## Advantages Over Previous Solutions

1. **simple-playtest.html**: Fixed missing `interaction.js` dependency
2. **supereasyplaytest.html**: More elegant CORS handling without blocking all images
3. **playtest.html**: Simpler URL-based interface instead of date picker

## Future Improvements

- Add query parameter for disabling specific features
- Support for testing specific game states
- Integration with automated testing frameworks