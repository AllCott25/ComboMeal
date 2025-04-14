# Culinary Logic Puzzle

A daily logic puzzle game where players combine ingredients to create culinary combinations and discover a new recipe each day.

## Game Overview

Culinary Logic Puzzle is a cooking-themed puzzle game inspired by games like SpaceChem and Little Alchemy. Players combine ingredients to create intermediate combinations, which can then be combined to create the final recipe of the day.

## Vessel Types and Visual Representation

The game uses different types of vessels to represent ingredients and combinations:

### 1. Base Ingredient Vessels (White)
- **Visual Appearance**: White rounded vessels with black text
- **Function**: Represent basic ingredients that cannot be broken down further
- **Interaction**: Can be combined with other base ingredients or with partial/complete combinations
- **Code Implementation**: 
  - Created as `Vessel` objects with `color = 'white'`
  - Stored in the `vessels` array
  - Have `ingredients` array containing a single ingredient name
  - Have empty `complete_combinations` array
  - Have `null` for the `name` property

### 2. Partial Combination Vessels (Yellow)
- **Visual Appearance**: Yellow rectangular vessels with black text and two circular handles
- **Function**: Represent combinations that are on the way to becoming a complete recipe but are missing ingredients
- **Interaction**: Can be combined with other vessels to create complete combinations
- **Code Implementation**:
  - Created as `Vessel` objects with `color = 'yellow'`
  - Have `ingredients` array containing multiple ingredient names
  - Have empty `complete_combinations` array
  - Have `null` for the `name` property
  - Created when ingredients match part of a recipe but not all required ingredients

### 3. Complete Combination Vessels (Green)
- **Visual Appearance**: Avocado green rectangular vessels with black text and a long rectangular handle
- **Function**: Represent completed intermediate recipes or combinations of combinations
- **Interaction**: Can be combined with other complete combinations or base ingredients to create more complex combinations or the final recipe
- **Code Implementation**:
  - Created as `Vessel` objects with `color = 'green'` or directly with `COLORS.primary`
  - Have empty `ingredients` array (for base ingredient combinations) or `complete_combinations` array (for combinations of combinations)
  - Have `name` property set to the name of the combination
  - Created when all required ingredients or combinations for a recipe are combined
  - All green vessels use the same avocado green color and rectangular handle design, regardless of whether they're made from base ingredients or other combinations

### 4. Hint Vessels (Red)
- **Visual Appearance**: Red vessels that appear when the hint button is clicked
- **Function**: Show players what combination they should be working toward
- **Interaction**: Players can add ingredients to the hint vessel to complete the combination
- **Code Implementation**:
  - Created as `HintVessel` objects with `color = '#FF5252'`
  - Have `required` array listing all needed ingredients
  - Have `collected` array tracking which ingredients have been added
  - Positioned at the same location as the hint button

### 5. Tutorial Vessels
- **Visual Appearance**: Similar to regular vessels but used in the tutorial screen
- **Function**: Demonstrate game mechanics to new players
- **Code Implementation**:
  - Drawn using the `drawTutorialVessel` function
  - Not interactive, purely visual
  - Show examples of combining ingredients in the "How to play" screen

## Vessel Dimensions and Scaling

Vessels are sized dynamically based on the play area width:

- **Base Vessels**: Width is calculated to fit exactly 3 per row with margins
- **Advanced Vessels** (yellow/green): Twice as wide as base vessels
- **Responsive Sizing**: All vessels scale down on smaller screens
- **Aspect Ratio**: Height is typically 80% of width for base vessels, slightly taller for advanced vessels

## Vessel Arrangement Logic

The game arranges vessels in rows according to these rules:

1. When both advanced (colored) and basic vessels are available:
   - Create rows with 1 advanced vessel and 1 basic vessel
2. When only advanced vessels remain:
   - Create rows with 1 advanced vessel per row
3. When only basic vessels remain:
   - Create rows with 3 basic vessels per row (or fewer if that's all that's left)

## Vessel Combination Rules

The game follows these rules when combining vessels:

1. **Base + Base Combinations**:
   - Two base ingredients can combine if they are part of a valid recipe
   - Creates a yellow vessel if it's a partial match
   - Creates a green vessel if it's a complete match

2. **Advanced + Advanced Combinations**:
   - Two completed combinations (green vessels) can combine
   - Creates a yellow vessel if it's a partial match for the final recipe
   - Creates a green vessel if it completes the final recipe

3. **Base + Advanced Combinations**:
   - Base ingredients can combine with completed combinations
   - Useful for recipes where the final combination requires both intermediate combinations and direct base ingredients

4. **Hint Combinations**:
   - Any vessel that contains ingredients required by the current hint can be added to the hint vessel
   - When all required ingredients are added, the hint vessel converts to a regular vessel

## Visual Design Elements

The vessels incorporate these design elements:

- **Handles**: Yellow vessels have two circular handles, green vessels have one rectangular handle
- **Rounded Corners**: All vessels have rounded corners for a friendly appearance
- **Text Display**: Ingredient names are displayed inside the vessels, automatically wrapping to fit
- **Scaling Animation**: Vessels pulse when successfully combined

## Project Structure

- `index.html` - Main HTML file
- `js/` - JavaScript files
  - `sketch.js` - Main game logic using p5.js
  - `supabase.js` - Database connectivity for daily recipes
- `css/` - Stylesheet files
  - `styles.css` - Main stylesheet
- `assets/` - Directory for images, sounds, and other assets

## Game Controls

- Click and drag vessels to combine them
- Click the hint button for suggestions
- Follow the visual cues to create new culinary combinations

## Dependencies

- [p5.js](https://p5js.org/) - JavaScript library for creative coding
- [Supabase](https://supabase.io/) - Backend database for daily recipes 