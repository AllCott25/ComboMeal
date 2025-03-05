# Culinary Logic Puzzle - Playtest Version

This is a special playtest version of the Culinary Logic Puzzle game that allows you to select any date and test the corresponding recipe.

## Features

- Select any date that has a recipe in the database
- Test recipes that may be incomplete or broken
- See error messages for problematic recipes
- View recipe names and counts per date

## How to Use

1. Open `playtest.html` in your web browser
2. You'll see a date selection screen with all available dates
3. Select a date from the list (dates with multiple recipes will show the count)
4. Click "Load Selected Recipe" to start the game with that recipe
5. If the recipe is incomplete or broken, you'll see an error message

## Troubleshooting

If you encounter issues:

- Check the browser console for detailed error messages
- Use the "Refresh Dates" button to reload the date list
- For broken recipes, you can examine the data structure in the Supabase dashboard

## Development Notes

This playtest version is designed to help test and debug recipes in the database. It intentionally allows loading incomplete or broken recipes to help identify issues.

The date selector shows all dates that have recipes, even if they're incomplete or broken, to facilitate testing. 