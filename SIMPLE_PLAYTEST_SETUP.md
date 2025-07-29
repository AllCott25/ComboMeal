# Simple Playtest Setup Guide

## Overview
The simple playtest functionality allows you to test specific recipes by date without going through the normal daily recipe system. This is useful for QA testing and debugging specific recipes.

## Configuration Complete ✅
The Supabase connection has been configured and the simple playtest is now connected to the database.

### What was done:
1. Updated `/js/config.js` with the Supabase credentials
2. Added config.js script loading to `simple-playtest.html`
3. Fixed the easter eggs fetching in the simple-playtest.js

## How to Use

### Basic Usage
Access a specific recipe by date using the URL parameter:
```
/simple-playtest.html?date=YYYY-MM-DD
```

Example:
```
/simple-playtest.html?date=2025-04-11
```

### With Admin Back Link
Add the admin parameter to show a back link to the admin panel:
```
/simple-playtest.html?date=2025-04-11&admin=true
```

### Test Page
A test page has been created at `/test-simple-playtest.html` with pre-built links to:
- Valid recipe dates
- Error cases (no date, invalid format, non-existent dates)
- Admin mode with back link

## Features

1. **Date-based Recipe Loading**: Loads any recipe from the database by its date
2. **Error Handling**: Shows appropriate error messages for:
   - Missing date parameter
   - Invalid date format
   - Non-existent recipes
3. **Loading Indicator**: Shows a loading screen while fetching the recipe
4. **Admin Integration**: Optional back link to admin panel
5. **Full Game Functionality**: Once loaded, plays exactly like the normal game

## Technical Details

### Files Involved
- `/simple-playtest.html` - Main HTML file
- `/js/simple-playtest.js` - Playtest logic that overrides the date
- `/js/config.js` - Supabase configuration
- `/js/supabase.js` - Database connection and queries
- `/js/sketch.js` - Main game logic

### How It Works
1. URL parameter `date` is read on page load
2. The `fetchTodayRecipe` function is overridden to use the specified date
3. Recipe data is fetched from Supabase for that date
4. Game initializes normally with the fetched recipe

### Database Tables Used
- `recipes` - Main recipe information
- `combinations` - Recipe combinations
- `ingredients` - Ingredients for combinations
- `eastereggs` - Optional easter eggs for recipes

## Troubleshooting

### Recipe Not Loading
1. Check browser console for errors
2. Verify the date format is YYYY-MM-DD
3. Confirm a recipe exists for that date in the database

### Supabase Connection Issues
1. Check that config.js is loaded before supabase.js
2. Verify Supabase credentials are correct in config.js
3. Check browser console for connection errors

### Game Not Starting
1. Ensure all required scripts are loaded in correct order
2. Check for JavaScript errors in console
3. Verify P5.js library is loading correctly