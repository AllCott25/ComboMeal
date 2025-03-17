/*
* Culinary Logic Puzzle v0.0515.09
* Created: March 6, 2025
* Last Updated: May 15, 2025
*
* Fixed mobile touch interactions to properly handle vessel positioning, 
* combinations, easter eggs, and hint vessel interactions.
* Specifically fixed the ability to drag and drop single ingredients
* onto the hint vessel and resolved vessel "sticking" issue by ensuring
* all vessels properly snap back to grid positions.
* Added proper touch support for win screen interactions, including
* View Recipe and Share Score buttons with an ultra-simplified approach.
* Fixed persistent hover states on win screen CTAs after tapping them.
* Limited tutorial text width to ensure instructions remain readable on all screen sizes.
* Implemented dedicated Button objects for win screen CTAs to fix interaction issues.
*
* The following are intermediate combinations defined for testing.
* These will be replaced with data from Supabase.
*/
// Define intermediate combinations (will be replaced with data from Supabase)
let intermediate_combinations = [
    { name: "Fried Chicken Cutlet", required: ["Chicken Cutlet", "Flour", "Eggs", "Panko Bread Crumbs"] },
    { name: "Tomato Sauce", required: ["Garlic", "Red Chile Flakes", "Plum Tomatoes", "Basil"] },
    { name: "Mixed Cheeses", required: ["Parmesan", "Mozzarella"] }
  ];
  
  // Define the final combination (will be replaced with data from Supabase)
  let final_combination = { name: "Chicken Parm", required: ["Fried Chicken Cutlet", "Tomato Sauce", "Mixed Cheeses"] };
  
  // Define easter eggs (will be replaced with data from Supabase)
  let easter_eggs = [];
  
  // Extract all individual ingredients (will be replaced with data from Supabase)
  let ingredients = [...new Set(intermediate_combinations.flatMap(c => c.required))];
  
  // Global variables
  let vessels = [];
  let draggedVessel = null;
  let offsetX, offsetY;
  let gameWon = false;
  let turnCounter = 0;
  let moveHistory = []; // Array to store move history with colors
  let animations = []; // Array to store active animations
  let eggModals = []; // Array to store active easter egg modals
  let titleFont, bodyFont, buttonFont;
  let recipeUrl = "https://www.bonappetit.com/recipe/chicken-parm"; // Will be replaced with data from Supabase
  let hintButton;
  let hintVessel = null;
  let showingHint = false;
  let gameStarted = false; // New variable to track game state
  let startButton; // New button for start screen
  let hintButtonY;
  let isLoadingRecipe = true; // Flag to track if we're still loading recipe data
  let loadingError = false; // Flag to track if there was an error loading recipe data
  let recipeDescription = "A delicious recipe that's sure to please everyone at the table!"; // New variable to store recipe description
  let recipeAuthor = ""; // New variable to store recipe author
  let hintCount = 0; // Track number of hints used
  
  // Play area constraints
  let maxPlayWidth = 400; // Max width for the play area (phone-sized)
  let playAreaPadding = 20; // Padding around the play area
  let playAreaX, playAreaY, playAreaWidth, playAreaHeight; // Will be calculated in setup
  
  // Win screen buttons
  let shareButton, recipeButton;
  
  // Color palette
  const COLORS = {
    background: '#F5F1E8',    // Soft cream background
    primary: '#778F5D',       // Avocado green
    secondary: '#D96941',     // Burnt orange
    tertiary: '#E2B33C',      // Mustard yellow
    accent: '#7A9BB5',        // Dusty blue
    text: '#333333',          // Dark gray for text
    vesselBase: '#F9F5EB',    // Cream white for base ingredients
    vesselYellow: '#E2B33C',  // Mustard yellow for partial combinations
    vesselGreen: '#778F5D',   // Avocado green for complete combinations
    vesselHint: '#D96941'     // Burnt orange for hint vessels
  };
  
  // Animation class for combining ingredients
  class CombineAnimation {
    constructor(x, y, color, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.color = color;
      this.size = 30;
      this.alpha = 255;
      this.progress = 0;
      this.duration = 30; // frames
      this.sparkles = [];
      
      // Create sparkles
      for (let i = 0; i < 15; i++) {
        this.sparkles.push({
          x: random(-20, 20),
          y: random(-20, 20),
          size: random(3, 8),
          speed: random(0.5, 2),
          angle: random(TWO_PI)
        });
      }
    }
    
    update() {
      this.progress += 1 / this.duration;
      if (this.progress >= 1) {
        return true; // Animation complete
      }
      
      // Update sparkles
      for (let sparkle of this.sparkles) {
        sparkle.x += cos(sparkle.angle) * sparkle.speed;
        sparkle.y += sin(sparkle.angle) * sparkle.speed;
        sparkle.size *= 0.95;
      }
      
      return false;
    }
    
    draw() {
      // Easing function for smooth animation
      let t = this.progress;
      let easedT = t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
      
      // Calculate current position
      let currentX = lerp(this.x, this.targetX, easedT);
      let currentY = lerp(this.y, this.targetY, easedT);
      
      // Draw main particle
      noStroke();
      fill(this.color);
      ellipse(currentX, currentY, this.size * (1 - this.progress * 0.5));
      
      // Draw sparkles
      for (let sparkle of this.sparkles) {
        fill(this.color);
        ellipse(currentX + sparkle.x, currentY + sparkle.y, sparkle.size);
      }
    }
  }
  
  // Button class for UI elements
  class Button {
    constructor(x, y, w, h, label, action, color = COLORS.primary, textColor = 'white') {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.label = label;
      this.action = action;
      this.color = color;
      this.textColor = textColor;
      this.hovered = false;
      this.disabled = false; // Add disabled state
    }
    
    draw() {
      // Draw button
      rectMode(CENTER);
      if (this.disabled) {
        // Use 50% opacity for disabled state
        let buttonColor = color(this.color);
        buttonColor.setAlpha(128); // 128 is 50% opacity (0-255)
        fill(buttonColor);
      } else if (this.hovered) {
        fill(lerpColor(color(this.color), color(255), 0.2));
      } else {
        fill(this.color);
      }
      stroke(0, 50);
      strokeWeight(3); // Increased line width for cartoony look
      rect(this.x, this.y, this.w, this.h, 8);
      
      // Draw label
      if (this.disabled) {
        // Use 50% opacity for text too
        let textCol = color(this.textColor);
        textCol.setAlpha(128);
        fill(textCol);
      } else {
        fill(this.textColor);
      }
      noStroke();
      textAlign(CENTER, CENTER);
      textFont(buttonFont);
      textSize(16);
      text(this.label, this.x, this.y);
    }
    
    isInside(x, y) {
      return !this.disabled && x > this.x - this.w/2 && x < this.x + this.w/2 && 
             y > this.y - this.h/2 && y < this.y + this.h/2;
    }
    
    checkHover(x, y) {
      this.hovered = !this.disabled && this.isInside(x, y);
    }
    
    handleClick() {
      if (!this.disabled && this.hovered) {
        this.action();
        return true;
      }
      return false;
    }
  }
  
  // Hint Vessel class - extends Vessel with hint-specific functionality
  class HintVessel {
    constructor(combo) {
      this.name = combo.name;
      this.required = combo.required;
      this.collected = [];
      // Position the hint vessel exactly over the hint button
      this.x = width * 0.5; // Same x as hint button
      this.y = hintButtonY; // Exactly at the hint button's position
      this.w = 250;
      this.h = 120;
      this.color = COLORS.vesselHint;
      this.scale = 1;
      this.targetScale = 1;
    }
    
    update() {
      // Scale animation
      this.scale = lerp(this.scale, this.targetScale, 0.2);
    }
    
    draw() {
      push();
      translate(this.x, this.y);
      scale(this.scale);
      
      // Draw pot handles (small circles) BEHIND the main shape
      fill('#888888');
      stroke('black');
      strokeWeight(3);
      // Position handles slightly lower and half-overlapping with the main shape
      // Move handles a bit past the edge of the pot
      circle(-this.w * 0.4, -this.h * 0.15, this.h * 0.2);
      circle(this.w * 0.4, -this.h * 0.15, this.h * 0.2);
      
      // Draw vessel (pot body)
      fill(this.color);
      stroke('black');
      strokeWeight(3);
      
      // Draw pot body (3:2 rectangle with rounded corners ONLY at the bottom)
      rectMode(CENTER);
      rect(0, 0, this.w * 0.8, this.h * 0.6, 0, 0, 10, 10);
      
      // Draw combo name
      fill('white');
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text(this.name, 0, -this.h * 0.1);
      
      // Draw progress indicator
      textSize(16);
      text(`${this.collected.length}/${this.required.length}`, 0, this.h * 0.1);
      
      pop();
    }
    
    isInside(x, y) {
      return x > this.x - this.w / 2 && x < this.x + this.w / 2 && 
             y > this.y - this.h / 2 && y < this.y + this.h / 2;
    }
    
    addIngredient(ingredient) {
      if (this.required.includes(ingredient) && !this.collected.includes(ingredient)) {
        this.collected.push(ingredient);
        this.pulse();
        return true;
      }
      return false;
    }
    
    isComplete() {
      return this.collected.length === this.required.length && 
             this.required.every(ing => this.collected.includes(ing));
    }
    
    pulse() {
      this.targetScale = 1.2;
      setTimeout(() => { this.targetScale = 1; }, 300);
    }
    
    // Convert to a regular vessel when complete but keep it red
    toVessel() {
      let v = new Vessel([], [], this.name, COLORS.vesselHint, this.x, this.y, 200, 100);
      v.isAdvanced = true; // Mark as advanced for proper rendering
      v.pulse();
      return v;
    }
  }
  
  class Vessel {
    constructor(ingredients, complete_combinations, name, color, x, y, w, h) {
      this.ingredients = ingredients;
      this.complete_combinations = complete_combinations;
      this.name = name;
      this.verb = null; // Add verb property
      
      // Map color names to our new color palette
      if (color === 'white') this.color = COLORS.vesselBase;
      else if (color === 'yellow') this.color = COLORS.vesselYellow;
      else if (color === 'green') this.color = COLORS.primary; // Changed from COLORS.vesselGreen to COLORS.primary
      else if (color === '#FF5252') this.color = COLORS.vesselHint; // Hint vessel color
      else this.color = color; // Use provided color if it doesn't match any of our mappings
      
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.originalX = x;
      this.originalY = y;
      this.isAdvanced = color !== 'white'; // Yellow or green vessels are advanced
      this.scale = 1; // For animation
      this.targetScale = 1;
      this.verbDisplayTime = 0; // Time to display the verb (in frames)
      
      // Shake animation properties
      this.shaking = false;
      this.shakeTime = 0;
      this.shakeAmount = 0;
      this.shakeDuration = 30; // 0.5 seconds at 60fps
    }
  
    getDisplayText() {
      if (this.name != null) return this.name;
      else if (this.ingredients.length > 0) return this.ingredients.join(" + ");
      else return this.complete_combinations.join(" + ");
    }
  
    isInside(x, y) {
      return x > this.x - this.w / 2 && x < this.x + this.w / 2 && y > this.y - this.h / 2 && y < this.y + this.h / 2;
    }
  
    snapBack() {
      this.x = this.originalX;
      this.y = this.originalY;
    }
    
    // Add shake method
    shake() {
      this.shaking = true;
      this.shakeTime = 0;
    }
    
    update() {
      // Scale animation only (removed floating animation)
      this.scale = lerp(this.scale, this.targetScale, 0.2);
      
      // Update verb display time
      if (this.verbDisplayTime > 0) {
        this.verbDisplayTime--;
      }
      
      // Update shake animation
      if (this.shaking) {
        this.shakeTime++;
        if (this.shakeTime >= this.shakeDuration) {
          this.shaking = false;
          this.shakeTime = 0;
        }
      }
    }
    
    draw() {
      push();
      
      // Apply shake effect if shaking
      let shakeX = 0;
      let shakeY = 0;
      if (this.shaking) {
        // Calculate shake amount (decreases over time)
        this.shakeAmount = map(this.shakeTime, 0, this.shakeDuration, 5, 0);
        // Alternate direction based on frame count
        shakeX = sin(this.shakeTime * 1.5) * this.shakeAmount;
      }
      
      translate(this.x + shakeX, this.y + shakeY);
      scale(this.scale);
      
      // Update color for base vessels to be pure white
      let vesselColor = this.color;
      if (vesselColor === COLORS.vesselBase) {
        vesselColor = 'white'; // Use pure white instead of cream for base vessels
      }
      
      if (this.isAdvanced) {
        // Advanced vessel (pot or pan based on color)
        
        if (this.color === '#FF5252') {
          // Red vessel (pot with two handles)
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(3);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          circle(-this.w * 0.4, -this.h * 0.15, this.h * 0.2);
          circle(this.w * 0.4, -this.h * 0.15, this.h * 0.2);
        } else if (this.color === 'green' || this.color === COLORS.vesselGreen || this.color === COLORS.primary) {
          // Green vessel (pan with long handle) - standardized for all green vessels
          // Draw handle BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(3);
          rectMode(CENTER);
          // Draw handle as thin horizontal rectangle
          rect(this.w * 0.6, 0, this.w * 0.5, this.h * 0.15, 5);
        } else if (this.color === 'yellow') {
          // Yellow vessel (pot with two handles like the red vessel)
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(3);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          circle(-this.w * 0.4, -this.h * 0.15, this.h * 0.2);
          circle(this.w * 0.4, -this.h * 0.15, this.h * 0.2);
        }
        
        // Draw vessel body
        fill(vesselColor);
        stroke('black');
        strokeWeight(3);
        
        // Draw vessel body (3:2 rectangle with rounded corners ONLY at the bottom)
        rectMode(CENTER);
        rect(0, 0, this.w * 0.8, this.h * 0.6, 0, 0, 10, 10);
        
      } else {
        // Basic ingredient vessel (rectangle with extremely rounded bottom corners)
        fill(vesselColor);
        stroke('black');
        strokeWeight(3);
        
        // Draw rounded rectangle
        rectMode(CENTER);
        rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, 5, 5, 30, 30);
      }
      
      // Draw text inside the vessel
      fill('black');
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      
      // Set text style to bold
      textStyle(BOLD);
      
      // Calculate text position to be inside the vessel
      let displayText = this.getDisplayText();
      let lines = splitTextIntoLines(displayText, this.w * 0.7);
      
      for (let i = 0; i < lines.length; i++) {
        let yOffset = (i - (lines.length - 1) / 2) * 15;
        // Position text slightly higher in the vessel
        text(lines[i], 0, yOffset - this.h * 0.1);
      }
      
      // Reset text style
      textStyle(NORMAL);
      
      pop();
      
      // Display the verb above the vessel - AFTER pop() to use screen coordinates
      this.displayVerb();
    }
    
    pulse() {
      this.targetScale = 1.2;
      setTimeout(() => { this.targetScale = 1; }, 300);
    }
    
    // Display the verb above the vessel
    displayVerb() {
      if (this.verb && this.verbDisplayTime > 0) {
        // Important: Don't use push/translate here since we need to use the actual screen coordinates
        // The vessel's x/y are already in screen coordinates
        
        // Set text properties
        textAlign(CENTER);
        textSize(18);
        
        // Position the verb directly above the vessel
        // Use a smaller offset to keep it closer to the vessel
        let yPosition = this.y - this.h * 0.5;
        
        // Draw a small white background for better readability
        fill(255, 255, 255, 200);
        noStroke();
        rectMode(CENTER);
        let verbWidth = textWidth(this.verb);
        rect(this.x, yPosition, verbWidth + 20, 25, 5);
        
        // Draw the verb text
        fill('black');
        text(this.verb, this.x, yPosition + 6);
        
        // Decrement the display time
        this.verbDisplayTime--;
      }
    }
  }
  
  // Helper function to split text into lines that fit within a width
  function splitTextIntoLines(text, maxWidth) {
    let words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      let testLine = currentLine + ' ' + words[i];
      let testWidth = textWidth(testLine);
      
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }
  
  // Preload function to load assets before setup
  function preload() {
    console.log("Preloading assets...");
    
    // Use web-safe fonts directly instead of trying to load Google Fonts
    titleFont = 'Georgia';
    bodyFont = 'Arial';
    buttonFont = 'Verdana';
    
    console.log("Using web-safe fonts instead of Google Fonts");
  }
  
  function setup() {
    createCanvas(windowWidth, windowHeight); // Fullscreen canvas for mobile
    textFont(bodyFont);
    
    // Calculate play area dimensions
    playAreaWidth = min(maxPlayWidth, windowWidth - 2 * playAreaPadding);
    // Set a fixed aspect ratio for the play area (mobile phone-like)
    playAreaHeight = min(windowHeight - 2 * playAreaPadding, playAreaWidth * 1.8); // 16:9 aspect ratio
    
    // Center the play area both horizontally and vertically
    playAreaX = (windowWidth - playAreaWidth) / 2;
    playAreaY = (windowHeight - playAreaHeight) / 2;
    
    // The actual game initialization will happen in initializeGame()
    // after the recipe data is loaded
    
    // Load recipe data from Supabase if not in playtest mode
    if (typeof isPlaytestMode === 'undefined' || !isPlaytestMode) {
      loadRecipeData();
    } else {
      console.log("Playtest mode: waiting for date selection");
      isLoadingRecipe = false; // In playtest mode, we'll load the recipe after date selection
    }
  }
  
  // Function to load recipe data from Supabase
  async function loadRecipeData() {
    try {
      // Check if there's a date parameter in the URL for playtesting
      const urlParams = new URLSearchParams(window.location.search);
      const testDate = urlParams.get('date');
      
      let recipeData;
      if (testDate) {
        console.log(`Playtesting recipe for date: ${testDate}`);
        recipeData = await fetchRecipeByDate(testDate);
      } else {
        recipeData = await fetchTodayRecipe();
      }
      
      if (!recipeData) {
        console.error("No recipe data found");
        return;
      }
      
      console.log("Loading recipe data from Supabase...");
      
      // Update game variables with recipe data
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      ingredients = recipeData.baseIngredients;
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      
      // Get author information from the database if it exists
      recipeAuthor = recipeData.author || "";
      
      console.log("Recipe data loaded successfully");
      isLoadingRecipe = false;
    } catch (error) {
      console.error("Error loading recipe data:", error);
      loadingError = true;
      isLoadingRecipe = false;
    }
  }
  
  // Fisher-Yates shuffle algorithm to randomize vessel order
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  function arrangeVessels() {
    // Calculate vessel sizes based on play area width to ensure 3 base vessels per row
    // We need to fit 3 vessels plus margins in the play area width
    let margin = 10;
    let vertical_margin = 5; // Minimal vertical spacing between rows
    
    // Calculate basic vessel width to fit exactly 3 per row with margins
    let basic_w = (playAreaWidth - (4 * margin)) / 3; // 3 vessels with margin on both sides
    let basic_h = basic_w * 0.8; // Maintain aspect ratio
    
    // Advanced vessels are twice as wide
    let advanced_w = basic_w * 2 + margin;
    let advanced_h = basic_h * 1.2;
    
    // Adjust margins for very small screens
    if (playAreaWidth < 300) {
      margin = 5;
      vertical_margin = 2; // Even smaller vertical margin for small screens
      // Recalculate with smaller margins
      basic_w = (playAreaWidth - (4 * margin)) / 3;
      basic_h = basic_w * 0.8;
      advanced_w = basic_w * 2 + margin;
      advanced_h = basic_h * 1.2;
    }

    // First, separate vessels into advanced and basic
    let advancedVessels = vessels.filter(v => v.isAdvanced);
    let basicVessels = vessels.filter(v => !v.isAdvanced);

    // Create an array to hold our row arrangements
    let rowArrangements = [];

    // Create rows with optimal arrangements
    while (advancedVessels.length > 0 || basicVessels.length > 0) {
      let currentRow = [];
      
      // Try to create rows with 1 advanced vessel and 1 basic vessel when possible
      if (advancedVessels.length > 0 && basicVessels.length > 0) {
        currentRow.push(advancedVessels.shift()); // Add 1 advanced vessel (takes 2 slots)
        currentRow.push(basicVessels.shift()); // Add 1 basic vessel (takes 1 slot)
            rowArrangements.push(currentRow);
      }
      // If we only have advanced vessels left, add 1 per row
      else if (advancedVessels.length > 0) {
                currentRow.push(advancedVessels.shift());
        rowArrangements.push(currentRow);
      }
      // If we only have basic vessels left, add 3 per row (or fewer if that's all we have)
      else if (basicVessels.length > 0) {
        // Add up to 3 basic vessels
        for (let i = 0; i < 3 && basicVessels.length > 0; i++) {
                    currentRow.push(basicVessels.shift());
        }
            rowArrangements.push(currentRow);
      }
    }

    // Calculate the starting Y position
    let startY = playAreaY + playAreaHeight * 0.2; // Position relative to play area

    // Position all vessels based on row arrangements
    rowArrangements.forEach((row, rowIndex) => {
        // Calculate total width of this row
        let rowWidth = row.reduce((width, v) => {
            return width + (v.isAdvanced ? advanced_w : basic_w);
        }, 0) + (row.length - 1) * margin;

      // Calculate starting x position to center the row within the play area
      let startX = playAreaX + (playAreaWidth - rowWidth) / 2;
        let currentX = startX;

        // Position each vessel in the row
        row.forEach((v) => {
            // Update vessel dimensions
            if (v.isAdvanced) {
                v.w = advanced_w;
                v.h = advanced_h;
            } else {
                v.w = basic_w;
                v.h = basic_h;
            }

            // Set vessel position
            v.x = currentX + v.w / 2;
        v.y = startY + rowIndex * (basic_h + vertical_margin); // Use basic_h for consistent spacing
            v.originalX = v.x;
            v.originalY = v.y;

            // Move x position for next vessel
            currentX += v.w + margin;
        });
    });
    
    // Calculate the lowest vessel position for hint button placement
    let lowestY = startY;
    vessels.forEach(v => {
      lowestY = Math.max(lowestY, v.y + v.h/2);
    });
    
    // Set hint button position 40 pixels below the lowest vessel (increased from 20)
    hintButtonY = lowestY + 40;
    
    // Ensure the hint button stays within the play area
    hintButtonY = Math.min(hintButtonY, playAreaY + playAreaHeight - 60);
  }
  
  function draw() {
    // Set background color
    background(COLORS.background);
    
    // Draw floral pattern border if there's space
    drawFloralBorder();
    
    // Ensure no stroke for all text elements
    noStroke();
    
    // Check if we're still loading recipe data
    if (isLoadingRecipe) {
      // Draw loading screen
      textAlign(CENTER, CENTER);
      textSize(24);
      fill('#333');
      text("Loading today's recipe...", width/2, height/2);
      
      // Show current EST time for debugging
      textSize(14);
      const estTime = getCurrentESTTime();
      text(`Current time (EST): ${estTime}`, width/2, height/2 + 40);
      
      return;
    }
    
    // Check if there was an error loading recipe data
    if (loadingError) {
      textAlign(CENTER, CENTER);
      textSize(24);
      fill(255, 0, 0);
      text("Error loading recipe. Using default recipe.", width/2, height/2 - 30);
      textSize(16);
      text("Please check your internet connection and refresh the page.", width/2, height/2 + 10);
      
      // Display current time in EST for debugging
      textSize(14);
      const estTime = getCurrentESTTime();
      text(`Current time (EST): ${estTime}`, width/2, height/2 + 40);
      
      // After 3 seconds, continue with default recipe
      if (frameCount % 180 === 0) {
        loadingError = false;
        // Initialize the game with default recipe data
        initializeGame();
      }
      return;
    }
    
    // Check if we need to initialize the game after loading data
    if (vessels.length === 0) {
      initializeGame();
      return;
    }
    
    // Only draw title when not in win state
    if (!gameWon) {
    drawTitle();
    }
    
    if (!gameStarted) {
      // Draw start screen with animated demo
      drawStartScreen();
    } else if (gameWon) {
      // Draw win screen
      drawWinScreen();
    } else {
      // Draw game screen
      // Update all vessels
      vessels.forEach(v => {
        v.update();
      });
      
      // Sort vessels by type to ensure advanced vessels are drawn first (behind basic vessels)
      let sortedVessels = [...vessels].sort((a, b) => {
        if (a.isAdvanced && !b.isAdvanced) return -1;
        if (!a.isAdvanced && b.isAdvanced) return 1;
        return 0;
      });
      
      // Draw all vessels in sorted order
      sortedVessels.forEach(v => {
        v.draw();
      });
      
      // Check if only the final combination remains and disable hint button if so
      let onlyFinalComboRemains = isOnlyFinalComboRemaining();
      hintButton.disabled = onlyFinalComboRemains;
      
      // Draw hint button or hint vessel
      if (showingHint && hintVessel) {
        hintVessel.update();
        hintVessel.draw();
      } else {
        hintButton.draw();
      }
      
      // Draw animations
      for (let i = animations.length - 1; i >= 0; i--) {
        animations[i].draw();
        if (animations[i].update()) {
          animations.splice(i, 1);
        }
      }
      
      // Draw move history
      drawMoveHistory();
    }
    
    // Draw any active easter egg modals
    for (let i = 0; i < eggModals.length; i++) {
      if (eggModals[i].active) {
        eggModals[i].draw();
      }
    }
    
    // Update cursor if hovering over a vessel or button
    updateCursor();
  }
  
  function drawTitle() {
    // Set text properties
    textAlign(CENTER, CENTER);
    textSize(36);
    
    // Use a bold sans-serif font
    textStyle(BOLD);
    textFont('Arial, Helvetica, sans-serif');
    
    // Title text
    const title = "COMBO MEAL";
    
    // Calculate the total width of the title to center each letter
    let totalWidth = 0;
    let letterWidths = [];
    
    // First calculate individual letter widths
    for (let i = 0; i < title.length; i++) {
      let letterWidth = textWidth(title[i]);
      letterWidths.push(letterWidth);
      totalWidth += letterWidth;
    }
    
    // Add kerning (50% increase in spacing)
    const kerningFactor = 0.5; // 50% extra space
    let totalKerning = 0;
    
    // Calculate total kerning space (only between letters, not at the ends)
    for (let i = 0; i < title.length - 1; i++) {
      totalKerning += letterWidths[i] * kerningFactor;
    }
    
    // Starting x position (centered with kerning)
    let x = playAreaX + playAreaWidth/2 - (totalWidth + totalKerning)/2;
    
    // Draw each letter with alternating colors
    for (let i = 0; i < title.length; i++) {
      // Choose color based on position (cycle through green, yellow, red)
      let letterColor;
      switch (i % 3) {
        case 0:
          letterColor = COLORS.primary; // Green
          break;
        case 1:
          letterColor = COLORS.tertiary; // Yellow
          break;
        case 2:
          letterColor = COLORS.secondary; // Red
          break;
      }
      
      // Calculate letter position
      let letterX = x + letterWidths[i]/2;
      let letterY = playAreaY + 40;
      
      // Draw black outline by drawing the letter multiple times with slight offsets
      // This creates a smoother outline than using stroke
      fill('black');
      noStroke();
      
      // Draw the letter 8 times in different directions to create the outline
      const outlineWeight = 3;
      text(title[i], letterX - outlineWeight, letterY); // Left
      text(title[i], letterX + outlineWeight, letterY); // Right
      text(title[i], letterX, letterY - outlineWeight); // Top
      text(title[i], letterX, letterY + outlineWeight); // Bottom
      text(title[i], letterX - outlineWeight, letterY - outlineWeight); // Top-left
      text(title[i], letterX + outlineWeight, letterY - outlineWeight); // Top-right
      text(title[i], letterX - outlineWeight, letterY + outlineWeight); // Bottom-left
      text(title[i], letterX + outlineWeight, letterY + outlineWeight); // Bottom-right
      
      // Draw letter with color
      fill(letterColor);
      text(title[i], letterX, letterY);
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    
    // Reset text style
    textStyle(NORMAL);
  }
  
  function drawStartScreen() {
    // Adjust header size based on available space
    let headerSize = 28;
    let descriptionSize = 14;
    
    // Scale down based on play area width
    if (playAreaWidth < 380) {
      headerSize = 24;
      descriptionSize = 12;
    }
    if (playAreaWidth < 340) {
      headerSize = 20;
      descriptionSize = 10;
    }
    
    // Calculate a maximum width for tutorial text that ensures it fits within the play area
    const maxTutorialTextWidth = min(playAreaWidth * 0.85, 300);
    
    // Draw "How to play:" header - position relative to play area
    textAlign(CENTER);
    textSize(headerSize);
    fill('#333');
    text("How to play:", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.12);
    
    // New language with tutorial equations
    // First instruction
    textSize(descriptionSize);
    textAlign(CENTER, CENTER);
    textWrap(WORD);
    text("Drag & drop ingredients to combine them based on the steps of a recipe!", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.20, maxTutorialTextWidth);
    
    // First equation
    drawTutorialEquation(1, "Grapes", "white", "Sugar", "white", "Jelly", "green", 
                        "", // Empty description as we're using the text above
                        playAreaY + playAreaHeight * 0.30, false, descriptionSize);
    
    // Second instruction
    textSize(descriptionSize);
    text("Completed combos turn green. Yellow combos need more ingredients.", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.40, maxTutorialTextWidth);
    
    // Second equation
    drawTutorialEquation(2, "Jelly", "green", "Peanut Butter", "white", "Jelly + Peanut Butter", "yellow", 
                        "", // Empty description
                        playAreaY + playAreaHeight * 0.50, false, descriptionSize);
    
    // Third instruction
    textSize(descriptionSize);
    text("Complete the recipe with the fewest mistakes to make the grade.", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.60, maxTutorialTextWidth);
    
    // Third equation
    drawTutorialEquation(3, "Jelly + Peanut Butter", "yellow", "Potato Bread", "green", "PB&J Sandwich", "green", 
                        "", // Empty description
                        playAreaY + playAreaHeight * 0.70, true, descriptionSize);
    
    // Final instruction
    textSize(descriptionSize);
    text("New recipe everyday!", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.80, maxTutorialTextWidth);
    
    // Position start button relative to play area
    startButton.x = playAreaX + playAreaWidth/2;
    startButton.y = playAreaY + playAreaHeight * 0.88;
    startButton.draw();
    startButton.checkHover(mouseX, mouseY);
    
    // Draw version number at the very bottom
    push();
    textSize(8);
    fill(100, 100, 100, 180); // Semi-transparent gray
    text("v0.0515.07", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight - 5);
    pop();
  }
  
  // Function to draw tutorial equations
  function drawTutorialEquation(equationNum, leftName, leftColor, rightName, rightColor, resultName, resultColor, description, yPosition, showStarburst = false, descriptionSize = 16) {
    // Adjust vessel sizes based on play area width
    let vesselWidth = min(70, playAreaWidth * 0.15) * 1.15; // Increased by 15%
    let vesselHeight = vesselWidth * 0.6;
    let operatorSize = min(24, playAreaWidth * 0.06);
    
    // Calculate positions relative to play area
    const spacing = playAreaWidth * 0.2;
    const leftX = playAreaX + playAreaWidth * 0.25;
    const rightX = playAreaX + playAreaWidth * 0.5;
    const resultX = playAreaX + playAreaWidth * 0.75;
    
    // Operator positions
    const operatorX1 = (leftX + rightX) / 2;
    const operatorX2 = (rightX + resultX) / 2;
    
    // Adjust y position for green vessels (raise them 12px higher)
    let adjustedY = yPosition;
    if (leftColor === "green" || rightColor === "green" || resultColor === "green") {
        adjustedY = yPosition - 12;
    }
    
    // Draw left vessel
    drawTutorialVessel(leftX, adjustedY, leftName, leftColor, vesselWidth, vesselHeight);
    
    // Draw plus sign
    textAlign(CENTER, CENTER);
    textSize(operatorSize);
    fill('#333');
    noStroke();
    text("+", operatorX1, yPosition);
    
    // Draw right vessel
    drawTutorialVessel(rightX, adjustedY, rightName, rightColor, vesselWidth, vesselHeight);
    
    // Draw equals sign
    textAlign(CENTER, CENTER);
    textSize(operatorSize);
    fill('#333');
    noStroke();
    text("=", operatorX2, yPosition);
    
    // Draw result vessel with optional starburst
    if (showStarburst) {
      drawStarburst(resultX, adjustedY);
    }
    drawTutorialVessel(resultX, adjustedY, resultName, resultColor, vesselWidth, vesselHeight);
    
    // Draw description with improved spacing
    textAlign(CENTER); // Center align all descriptions for better fit
    textSize(descriptionSize);
    fill('#333');
    
    // Position description below the equation
    text(description, playAreaX + playAreaWidth/2, yPosition + vesselHeight * 0.9);
  }
  
  // New function to draw tutorial vessels
  function drawTutorialVessel(x, y, name, color, vesselWidth, vesselHeight) {
    push();
    translate(x, y);
    
    // Draw vessel
    if (color === "white") {
      // Basic ingredient vessel (white)
      fill('white'); // Pure white for base vessels
        stroke('black');
      strokeWeight(2);
      
      // Draw rounded rectangle
      rectMode(CENTER);
      rect(0, 0, vesselWidth, vesselHeight, 5, 5, 30, 30);
    } else if (color === "yellow") {
      // Draw handles behind the vessel
        fill('#888888');
        stroke('black');
      strokeWeight(2);
      circle(-vesselWidth * 0.4, -5, 15);
      circle(vesselWidth * 0.4, -5, 15);
      
      // Yellow vessel (partial combination)
      fill(COLORS.vesselYellow); // Use the exact vessel color
        stroke('black');
      strokeWeight(2);
        
      // Draw rectangle with rounded corners
        rectMode(CENTER);
      rect(0, 0, vesselWidth, vesselHeight, 0, 0, 10, 10);
    } else if (color === "green") {
      // Draw handle behind the vessel
        fill('#888888');
        stroke('black');
      strokeWeight(2);
      rectMode(CENTER);
      rect(vesselWidth * 0.6, 0, vesselWidth * 0.5, vesselHeight * 0.15, 5);
      
      // Green vessel (complete combination)
      fill(COLORS.primary); // Changed from COLORS.vesselGreen to COLORS.primary for consistency
        stroke('black');
      strokeWeight(2);
        
      // Draw rectangle with rounded corners
        rectMode(CENTER);
      rect(0, 0, vesselWidth, vesselHeight, 0, 0, 10, 10);
      }
      
      // Draw text
      fill('black');
      noStroke();
      textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD); // Make text bold
    
    // Split text into lines if needed
    let lines = splitTextIntoLines(name, vesselWidth * 0.8);
    
    for (let i = 0; i < lines.length; i++) {
      let yOffset = (i - (lines.length - 1) / 2) * 15;
      text(lines[i], 0, yOffset);
    }
    
    // Reset text style
    textStyle(NORMAL);
    
    pop();
  }
  
  // New function to draw starburst behind final vessel
  function drawStarburst(x, y) {
    push();
    translate(x, y);
    
    // Draw subtle yellow starburst
    fill(COLORS.tertiary + '80'); // Mustard yellow with 50% opacity
    noStroke();
    
    // Draw an 8-point star
    beginShape();
    for (let i = 0; i < 16; i++) {
      let radius = i % 2 === 0 ? 70 : 50;
      let angle = TWO_PI * i / 16 - PI/16;
      let px = cos(angle) * radius;
      let py = sin(angle) * radius;
      vertex(px, py);
    }
    endShape(CLOSE);
    
    pop();
  }
  
  function drawWinScreen() {
    // Don't draw title on win screen
    // drawTitle();
    
    // Center all content within the play area
    textAlign(CENTER, CENTER);
    
    // ===== TOP HALF: RECIPE SECTION =====
    
    // Calculate positions for the Recipe Card
    const cardWidth = playAreaWidth * 0.8 + 70; // Increased by 70px total
    const cardHeight = playAreaHeight * 0.35 + 20; // Increased by 20px
    // Adjust cardX and cardY to account for rectMode(CENTER)
    // Instead of representing the top-left corner, these now represent the center
    const cardX = playAreaX + playAreaWidth/2;
    // Move everything up to fill the void left by removing the header
    const cardY = playAreaY + playAreaHeight * 0.10 + cardHeight/2; // Moved up from 0.15 to 0.10
    
    // Draw reward message with multicolor treatment (like COMBO MEAL)
    const rewardMessage = "YOU MADE IT!";
    textSize(32);
    textStyle(BOLD);
    
    // Calculate the total width of the title to center each letter
    let totalWidth = 0;
    let letterWidths = [];
    
    // First calculate individual letter widths
    for (let i = 0; i < rewardMessage.length; i++) {
      let letterWidth = textWidth(rewardMessage[i]);
      letterWidths.push(letterWidth);
      totalWidth += letterWidth;
    }
    
    // Add kerning (50% increase in spacing)
    const kerningFactor = 0.5; // 50% extra space
    let totalKerning = 0;
    
    // Calculate total kerning space (only between letters, not at the ends)
    for (let i = 0; i < rewardMessage.length - 1; i++) {
      totalKerning += letterWidths[i] * kerningFactor;
    }
    
    // Starting x position (centered with kerning)
    let x = playAreaX + playAreaWidth/2 - (totalWidth + totalKerning)/2;
    
    // Draw each letter with alternating colors
    for (let i = 0; i < rewardMessage.length; i++) {
      // Choose color based on position (cycle through green, yellow, red)
      let letterColor;
      switch (i % 3) {
        case 0:
          letterColor = COLORS.primary; // Green
          break;
        case 1:
          letterColor = COLORS.tertiary; // Yellow
          break;
        case 2:
          letterColor = COLORS.secondary; // Red
          break;
      }
      
      // Calculate letter position
      let letterX = x + letterWidths[i]/2;
      let letterY = cardY - cardHeight/2 - 40;
      
      // Draw black outline by drawing the letter multiple times with slight offsets
      fill('black');
      noStroke();
      
      // Draw the letter 8 times in different directions to create the outline
      const outlineWeight = 3;
      text(rewardMessage[i], letterX - outlineWeight, letterY); // Left
      text(rewardMessage[i], letterX + outlineWeight, letterY); // Right
      text(rewardMessage[i], letterX, letterY - outlineWeight); // Top
      text(rewardMessage[i], letterX, letterY + outlineWeight); // Bottom
      text(rewardMessage[i], letterX - outlineWeight, letterY - outlineWeight); // Top-left
      text(rewardMessage[i], letterX + outlineWeight, letterY - outlineWeight); // Top-right
      text(rewardMessage[i], letterX - outlineWeight, letterY + outlineWeight); // Bottom-left
      text(rewardMessage[i], letterX + outlineWeight, letterY + outlineWeight); // Bottom-right
      
      // Draw letter with color
      fill(letterColor);
      text(rewardMessage[i], letterX, letterY);
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    
    textStyle(NORMAL);
    
    // Draw Recipe Card with drop shadow
    // Shadow
    fill(0, 0, 0, 30);
    noStroke();
    rect(cardX + 5, cardY + 5, cardWidth, cardHeight, 8);
    
    // Card - make it look slightly interactive with a subtle hover effect
    if (isMouseOverCard) {
      fill(255); // Keep white background
      // Add a green outline when hovered, matching the letter score hover effect
      stroke(COLORS.primary); // Green outline when hovered
      strokeWeight(3); // Thicker stroke to match letter score hover effect
    } else {
      fill(255);
      stroke(220);
      strokeWeight(1);
    }
    rect(cardX, cardY, cardWidth, cardHeight, 8);
    
    // Draw flowers in the corners of the recipe card (in front of white rectangle, behind content)
    const flowerSize = 8; // Size of flower petals
    const cornerOffset = 25; // Increased from 15 to 25 to move flowers more towards center
    
    // Draw flowers in each corner
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary); // Top-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.secondary); // Top-right
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.tertiary); // Bottom-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
    
    // Draw recipe name (now bold and raised up by 5px)
    textSize(24);
    fill(COLORS.secondary);
    textStyle(BOLD); // Make recipe name bold
    text(final_combination.name, playAreaX + playAreaWidth/2, cardY - cardHeight/2 + 25); // Raised from 30 to 25
    textStyle(NORMAL);
    
    // Add author information if it exists (also raised up by 5px)
    if (recipeAuthor && recipeAuthor.trim() !== "") {
      textSize(10);
      fill('#333333');
      text(`By ${recipeAuthor}`, playAreaX + playAreaWidth/2, cardY - cardHeight/2 + 45); // Raised from 50 to 45
    }
    
    // Calculate positions for the recipe image placeholder and description
    const imageWidth = 175; // Fixed 175px square
    const imageHeight = 175; // Fixed 175px square
    // Adjust imageX to be relative to the card's center
    const imageX = cardX - cardWidth/2 + cardWidth * 0.2 + imageWidth/2 - 60; // Moved 60px left
    const imageY = cardY - cardHeight/2 + 60 + imageHeight/2;
    
    // Draw recipe image placeholder (square)
    fill(240);
    stroke(220);
    strokeWeight(1);
    rect(imageX, imageY, imageWidth, imageHeight);
    
    // Draw placeholder text
    fill(180);
    textSize(14);
    text("Recipe Image", imageX, imageY);
    
    // Draw recipe description (smaller text size)
    // Since we're using textAlign(LEFT, TOP), we need to adjust the position
    const descriptionX = imageX + imageWidth/2 + 40 + 45; // Moved right by 45px more
    const descriptionWidth = cardWidth * 0.35;
    
    textAlign(LEFT, TOP);
    textSize(10); // Reduced from 12 to 10 (2pts smaller)
    fill('#666');
    
    // Calculate the height of the description text
    const descriptionY = imageY - imageHeight/2 + 110 - 15; // Moved up by 15px
    const descriptionText = recipeDescription;
    
    // Draw the description with a limited height container
    text(descriptionText, descriptionX, descriptionY, descriptionWidth, 100); // Limit height to 100px
    
    // Position ingredients at a fixed distance from description start
    const ingredientsY = descriptionY + 80; // Fixed 80px from description start
    const ingredientsX = descriptionX - 70; // Moved left 70px
    
    // Draw "Ingredients:" header
    textSize(10);
    textStyle(BOLD);
    fill('#444');
    text("Ingredients:", ingredientsX, ingredientsY);
    textStyle(NORMAL);
    
    // Calculate columns for ingredients
    const numIngredients = ingredients.length;
    const numColumns = 2; // Always use 2 columns regardless of ingredient count
    const itemsPerColumn = Math.ceil(numIngredients / numColumns);
    const columnWidth = descriptionWidth / numColumns;
    
    // Draw ingredients in columns
    textSize(9);
    fill('#666');
    // Recalculate the layout for ingredients to avoid overlaps and gaps
    const lineHeight = 12; // Height of a single line of text
    const ingredientSpacing = 2; // Space between ingredients
    
    // First pass: calculate ingredient lengths and store original indices
    let ingredientData = [];
    for (let i = 0; i < numIngredients; i++) {
      ingredientData.push({
        index: i,
        text: ingredients[i],
        totalLength: ingredients[i].length
      });
    }
    
    // Sort ingredients by length (longest first)
    ingredientData.sort((a, b) => b.totalLength - a.totalLength);
    
    // Assign first half of sorted ingredients to right column, second half to left
    let rightColumnIngredients = [];
    let leftColumnIngredients = [];
    
    // Distribute ingredients to columns (longer ones to the right)
    for (let i = 0; i < ingredientData.length; i++) {
      if (i < Math.ceil(ingredientData.length / 2)) {
        rightColumnIngredients.push(ingredients[ingredientData[i].index]);
      } else {
        leftColumnIngredients.push(ingredients[ingredientData[i].index]);
      }
    }
    
    // Character limits for each column
    const leftCharLimit = 12;
    const rightCharLimit = 18;
    
    // Function to process ingredients for a column with a specific character limit
    function processIngredientsForColumn(ingredientsList, charLimit) {
      let processedIngredients = [];
      
      for (let i = 0; i < ingredientsList.length; i++) {
        let ingredient = ingredientsList[i];
        let words = ingredient.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (let j = 0; j < words.length; j++) {
          let word = words[j];
          
          // If adding this word would exceed the character limit
          if (currentLine.length + word.length + (currentLine.length > 0 ? 1 : 0) > charLimit) {
            // Push the current line and start a new one
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Add the word to the current line
            if (currentLine.length > 0) {
              currentLine += ' ' + word;
            } else {
              currentLine = word;
            }
          }
        }
        
        // Push the last line
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        
        processedIngredients.push({
          original: ingredient,
          lines: lines
        });
      }
      
      return processedIngredients;
    }
    
    // Process ingredients for both columns
    const leftColumnProcessed = processIngredientsForColumn(leftColumnIngredients, leftCharLimit);
    const rightColumnProcessed = processIngredientsForColumn(rightColumnIngredients, rightCharLimit);
    
    // Calculate total height needed for ingredients
    let leftColumnHeight = 0;
    for (let i = 0; i < leftColumnProcessed.length; i++) {
      leftColumnHeight += leftColumnProcessed[i].lines.length * lineHeight + ingredientSpacing;
    }
    
    let rightColumnHeight = 0;
    for (let i = 0; i < rightColumnProcessed.length; i++) {
      rightColumnHeight += rightColumnProcessed[i].lines.length * lineHeight + ingredientSpacing;
    }
    
    // Check if ingredients list would overflow the card
    const maxAvailableHeight = cardY + cardHeight/2 - 30 - ingredientsY;
    const totalIngredientsHeight = Math.max(leftColumnHeight, rightColumnHeight);
    
    // If ingredients would overflow, only show what fits
    const showAllIngredients = totalIngredientsHeight <= maxAvailableHeight;
    
    // Draw left column
    let leftYOffset = ingredientsY + 15;
    for (let i = 0; i < leftColumnProcessed.length; i++) {
      // Check if we've run out of space
      if (!showAllIngredients && leftYOffset + leftColumnProcessed[i].lines.length * lineHeight > ingredientsY + maxAvailableHeight) {
        break;
      }
      
      const lines = leftColumnProcessed[i].lines;
      const x = ingredientsX;
      
      // Draw each line of this ingredient
      for (let j = 0; j < lines.length; j++) {
        if (j === 0) {
          // Only add bullet to the first line of each ingredient
          text("• " + lines[j], x, leftYOffset);
        } else {
          // Indent subsequent lines to align with text after bullet
          text("  " + lines[j], x, leftYOffset);
        }
        leftYOffset += lineHeight;
      }
      
      // Add spacing between ingredients
      leftYOffset += ingredientSpacing;
    }
    
    // Draw right column
    let rightYOffset = ingredientsY + 15;
    for (let i = 0; i < rightColumnProcessed.length; i++) {
      // Check if we've run out of space
      if (!showAllIngredients && rightYOffset + rightColumnProcessed[i].lines.length * lineHeight > ingredientsY + maxAvailableHeight) {
        break;
      }
      
      const lines = rightColumnProcessed[i].lines;
      const x = ingredientsX + columnWidth;
      
      // Draw each line of this ingredient
      for (let j = 0; j < lines.length; j++) {
        if (j === 0) {
          // Only add bullet to the first line of each ingredient
          text("• " + lines[j], x, rightYOffset);
        } else {
          // Indent subsequent lines to align with text after bullet
          text("  " + lines[j], x, rightYOffset);
        }
        rightYOffset += lineHeight;
      }
      
      // Add spacing between ingredients
      rightYOffset += ingredientSpacing;
    }
    
    // Add "View Full Recipe" text at the bottom of the card
    textAlign(CENTER, CENTER);
    textSize(12);
    if (isMouseOverCard) {
      fill(COLORS.primary); // Green text when hovered
    } else {
      fill('#666'); // Gray text normally
    }
    text("View Full Recipe →", cardX, cardY + cardHeight/2 - 15);
    
    // Reset text alignment
    textAlign(LEFT, TOP);
    
    // ===== BOTTOM HALF: SCORE SECTION =====
    
    // Move the bottom section up by removing the divider and adjusting the position
    const dividerY = playAreaY + playAreaHeight * 0.55; // Moved up from 0.60 to 0.55
    
    // Decrease padding between View Recipe button and Letter Score by 5px
    // Calculate positions for the letter score (vertical printer paper)
    // Increase the letter score by another 10% from its current size
    const scoreWidth = playAreaWidth * 0.25 * 1.25 * 1.25 * 0.75 * 1.5 * 1.25 * 1.1; // Increased by another 10%
    const scoreHeight = scoreWidth * 1.414;
    // Adjust scoreX and scoreY to account for rectMode(CENTER)
    const scoreX = playAreaX + playAreaWidth/2; // Centered in the play area
    const scoreY = dividerY + 25 + scoreHeight/2 - 15 - 10; // Raised by 10px
    
    // Draw letter score with drop shadow
    // Shadow
    fill(0, 0, 0, 30);
    noStroke();
    rect(scoreX + 5, scoreY + 5, scoreWidth, scoreHeight, 5);
    
    // Paper
    fill(255);
    stroke(220);
    strokeWeight(1);
    rect(scoreX, scoreY, scoreWidth, scoreHeight, 5);
    
    // Check if mouse is over the letter score area
    isMouseOverLetterScore = mouseX > scoreX - scoreWidth/2 && mouseX < scoreX + scoreWidth/2 && 
                           mouseY > scoreY - scoreHeight/2 && mouseY < scoreY + scoreHeight/2;
    
    // Highlight the letter score area when hovered, similar to recipe card
    if (isMouseOverLetterScore) {
      // Add a subtle highlight effect
      noFill();
      stroke(COLORS.primary); // Green highlight
      strokeWeight(3);
      rect(scoreX, scoreY, scoreWidth, scoreHeight, 5);
    }
    
    // Count black moves (incorrect attempts)
    let blackMoves = 0;
    
    // Count black moves
    for (let move of moveHistory) {
      if (move === 'black' || move === '#333333') {
        blackMoves++;
      }
    }
    
    // Count red hint moves
    let redHintMoves = 0;
    for (let move of moveHistory) {
      if (move === '#FF5252') {
        redHintMoves++;
      }
    }
    
    // Calculate total score (only counting red hint and black moves)
    const totalScore = blackMoves + redHintMoves;
    
    // Determine letter grade and color based on total score
    let letterGrade;
    let letterColor;
    let isAPlus = false;
    
    if (totalScore === 0) {
      letterGrade = "A";
      letterColor = color(0, 120, 255); // Blue
      isAPlus = true; // Mark as A+ for diamond decoration
    } else if (totalScore === 1) {
      letterGrade = "A";
      letterColor = color(0, 120, 255); // Blue
    } else if (totalScore >= 2 && totalScore <= 3) {
      letterGrade = "B";
      letterColor = COLORS.primary; // Green from vessels
    } else if (totalScore >= 4 && totalScore <= 7) {
      letterGrade = "C";
      letterColor = COLORS.tertiary; // Yellow from vessels
    } else { // totalScore >= 8
      letterGrade = "X";
      letterColor = COLORS.secondary; // Red from vessels
    }
    
    // Draw circle with the same color as the letter but with 30% opacity
    const circleSize = 140 * 0.75 * 1.5 * 1.25 * 1.1; // Increased by another 10% to match the paper size
    noStroke();
    
    // Create a copy of the letter color with 30% opacity
    let circleBgColor = color(red(letterColor), green(letterColor), blue(letterColor), 76); // 76 is 30% of 255
    fill(circleBgColor);
    circle(scoreX, scoreY, circleSize);
    
    // Add "COMBO MEAL" header above the letter grade (30px above the circle)
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(0); // Black text
    textStyle(BOLD);
    
    // Apply kerning to "COMBO MEAL" text
    const comboMealText = "COMBO MEAL";
    let comboMealWidth = 0;
    let comboMealLetterWidths = [];
    
    // Calculate letter widths
    for (let i = 0; i < comboMealText.length; i++) {
      let letterWidth = textWidth(comboMealText[i]);
      comboMealLetterWidths.push(letterWidth);
      comboMealWidth += letterWidth;
    }
    
    // Increase kerning by 70% (more than the 50% used for "YOU MADE IT!")
    const comboMealKerningFactor = 0.7;
    let comboMealTotalKerning = 0;
    
    // Calculate total kerning space
    for (let i = 0; i < comboMealText.length - 1; i++) {
      comboMealTotalKerning += comboMealLetterWidths[i] * comboMealKerningFactor;
    }
    
    // Starting x position (centered with kerning)
    let comboMealX = scoreX - (comboMealWidth + comboMealTotalKerning)/2;
    
    // Draw each letter with increased spacing
    for (let i = 0; i < comboMealText.length; i++) {
      // Calculate letter position
      let letterX = comboMealX + comboMealLetterWidths[i]/2;
      let letterY = scoreY - circleSize/2 - 30; // 30px above the circle
      
      // Draw letter
      text(comboMealText[i], letterX, letterY);
      
      // Move to the next letter position with kerning
      comboMealX += comboMealLetterWidths[i] * (1 + comboMealKerningFactor);
    }
    
    // Draw letter grade
    textAlign(CENTER, CENTER);
    // Increase letter size by 20% and use regular weight instead of bold
    textSize(((letterGrade === ":" ? scoreWidth * 0.3 * 2 : scoreWidth * 0.4 * 1.5 * 2) * 0.75) * 1.3 * 1.2); // Increased by 20%
    fill(letterColor);
    textStyle(NORMAL); // Changed from BOLD to NORMAL
    text(letterGrade, scoreX, scoreY);
    
    // Check if Easter Egg was found
    let eggFound = moveHistory.some(move => 
      typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
    );
    
    // Draw sunny-side-up egg indicator if an Easter egg was found
    if (eggFound) {
      push();
      // Position the egg in the top left corner of the letter grade
      // Move up 14px and left 30px, increase size by 25%
      const eggX = scoreX - circleSize * 0.3 - 50 + 65 - 30;
      const eggY = scoreY - circleSize * 0.3 - 100 + 40 - 14;
      const sizeMultiplier = 1.25; // Increase size by 25%
      
      // Draw drop shadow for the entire egg
      fill(0, 0, 0, 40);
      noStroke();
      // Offset shadow by 4px
      translate(4, 4);
      
      // Draw egg white (soft blob shape from Design 3)
      beginShape();
      vertex(eggX - 30 * sizeMultiplier, eggY * sizeMultiplier);
      bezierVertex(
          eggX - 45 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX - 20 * sizeMultiplier, eggY - 45 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY - 30 * sizeMultiplier  // end point
      );
      bezierVertex(
          eggX + 40 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX + 30 * sizeMultiplier, eggY + 20 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY + 30 * sizeMultiplier  // end point
      );
      // Create a soft, rounded blob shape with no pointiness
      bezierVertex(
          eggX - 5 * sizeMultiplier, eggY + 35 * sizeMultiplier,  // control point 1 (moved inward and up)
          eggX - 20 * sizeMultiplier, eggY + 15 * sizeMultiplier, // control point 2 (moved significantly upward)
          eggX - 30 * sizeMultiplier, eggY * sizeMultiplier       // end point (connects to start)
      );
      endShape(CLOSE);
      
      // Reset translation for the actual egg
      translate(-4, -4);
      
      // Draw the egg white (soft blob shape)
      fill(255, 255, 255); // Pure white
      noStroke();
      
      beginShape();
      vertex(eggX - 30 * sizeMultiplier, eggY * sizeMultiplier);
      bezierVertex(
          eggX - 45 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX - 20 * sizeMultiplier, eggY - 45 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY - 30 * sizeMultiplier  // end point
      );
      bezierVertex(
          eggX + 40 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX + 30 * sizeMultiplier, eggY + 20 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY + 30 * sizeMultiplier  // end point
      );
      // Create a soft, rounded blob shape with no pointiness
      bezierVertex(
          eggX - 5 * sizeMultiplier, eggY + 35 * sizeMultiplier,  // control point 1 (moved inward and up)
          eggX - 20 * sizeMultiplier, eggY + 15 * sizeMultiplier, // control point 2 (moved significantly upward)
          eggX - 30 * sizeMultiplier, eggY * sizeMultiplier       // end point (connects to start)
      );
      endShape(CLOSE);
      
      // Draw the yolk - positioned higher up and slightly to the left
      const yolkSize = 36 * sizeMultiplier;
      for (let i = 5; i >= 0; i--) {
        const currentYolkSize = yolkSize * (1 - i * 0.05);
        const alpha = 255 - i * 10;
        fill(255, 204, 0, alpha); // Bright egg yolk yellow with gradient
        noStroke();
        ellipse(eggX - 5 * sizeMultiplier, eggY - 20 * sizeMultiplier, currentYolkSize, currentYolkSize * 0.9); // Slightly oval
      }
      
      // Add highlight to the yolk
      fill(255, 255, 255, 100);
      noStroke();
      ellipse(eggX - 12 * sizeMultiplier, eggY - 25 * sizeMultiplier, yolkSize * 0.4, yolkSize * 0.3);
      
      // Add a thin outline to the yolk
      noFill();
      stroke(200, 150, 0, 100);
      strokeWeight(1);
      ellipse(eggX - 5 * sizeMultiplier, eggY - 20 * sizeMultiplier, yolkSize, yolkSize * 0.9);
      pop();
    }
    
    // Remove the old diamond drawing code and replace with the star stickers
    // Draw star stickers for A+ grade
    if (isAPlus) {
      // Star parameters
      const outerRadius = circleSize * 0.15;
      const innerRadius = outerRadius * 0.5; // Increased inner radius for rounder appearance
      const roundness = outerRadius * 0.25; // Increased roundness for more cartoonish look
      
      // Function to draw a star sticker
      const drawStarSticker = (x, y, size) => {
        push();
        translate(x, y);
        
        // Draw drop shadow
        fill(0, 0, 0, 40);
        noStroke();
        translate(2, 2);
        starWithRoundedPoints(0, 0, innerRadius * size, outerRadius * size, 5, roundness * size);
        
        // Draw white outline
        translate(-2, -2);
        fill(255);
        strokeWeight(3);
        stroke(255);
        starWithRoundedPoints(0, 0, innerRadius * size, outerRadius * size, 5, roundness * size);
        
        // Draw yellow star with yolk color (255, 204, 0) instead of COLORS.tertiary
        fill(255, 204, 0);
        strokeWeight(1);
        stroke(255, 255, 255, 200);
        starWithRoundedPoints(0, 0, innerRadius * size, outerRadius * size, 5, roundness * size);
        
        pop();
      };
      
      // Top right corner - two stars
      drawStarSticker(scoreX + circleSize * 0.35, scoreY - circleSize * 0.35, 1);
      drawStarSticker(scoreX + circleSize * 0.5, scoreY - circleSize * 0.2, 0.8);
      
      // Bottom left corner - two stars
      drawStarSticker(scoreX - circleSize * 0.35, scoreY + circleSize * 0.35, 1);
      drawStarSticker(scoreX - circleSize * 0.5, scoreY + circleSize * 0.2, 0.8);
    }
    
    // Draw hint indicators if hints were used
    if (hintCount > 0) {
      // Function to draw a hint indicator sticker
      const drawHintIndicator = (x, y, size) => {
        push();
        translate(x, y);
        
        // Draw drop shadow (doubled in size)
        fill(0, 0, 0, 40);
        noStroke();
        translate(4, 4); // Increased shadow offset for larger stickers
        ellipse(0, 0, 60 * size, 60 * size); // Doubled from 30 to 60
        
        // Draw white outline
        translate(-4, -4);
        fill(255);
        strokeWeight(4); // Increased from 3 to 4 for larger stickers
        stroke(255);
        ellipse(0, 0, 60 * size, 60 * size); // Doubled from 30 to 60
        
        // Draw white background
        fill(255);
        strokeWeight(1);
        stroke(255, 255, 255, 200);
        ellipse(0, 0, 60 * size, 60 * size); // Doubled from 30 to 60
        
        // Draw red circle outline (closer to the edge)
        noFill();
        strokeWeight(3); // Increased from 2 to 3 for larger stickers
        stroke('#FF5252');
        ellipse(0, 0, 48 * size, 48 * size); // Increased from 20 to 48 (80% of sticker size)
        
        // Draw red question mark using Helvetica font
        fill('#FF5252');
        noStroke();
        textSize(36 * size); // Larger font size for better visibility
        textFont('Helvetica, Arial, sans-serif'); // Using Helvetica for a classic look
        textStyle(NORMAL); // Normal weight instead of bold for a cleaner look
        textAlign(CENTER, CENTER);
        text("?", 0, 0); // Perfectly centered question mark (removed vertical offset)
        
        pop();
      };
      
      // Draw hint indicators based on hint count
      if (hintCount >= 1) {
        // First hint indicator - bottom right (adjusted position for larger size)
        drawHintIndicator(scoreX + circleSize * 0.4, scoreY + circleSize * 0.4, 1);
      }
      
      if (hintCount >= 2) {
        // Second hint indicator - top right (adjusted position for larger size)
        drawHintIndicator(scoreX + circleSize * 0.4, scoreY - circleSize * 0.4, 1);
      }
      
      if (hintCount >= 3) {
        // Third hint indicator - with minimal overlap (reduced from 25% to about 10%)
        drawHintIndicator(scoreX + circleSize * 0.4 + 25, scoreY + circleSize * 0.4 - 25, 1);
      }
    }
    
    textStyle(NORMAL);
    
    // Move the Letter Score to the right to fill the void
    // We'll adjust the position of the Share button directly without drawing the move history
    
    // Position the Share Score button so its bottom aligns with the Letter Score bottom
    const letterScoreBottom = scoreY + scoreHeight/2;
    
    // Remove the "Egg found!" text
    // (Removed the if(eggFound) block that displayed this text)
    
    // Create or update the share and recipe buttons
    shareButton = new Button(
      width * 0.35, 
      height * 0.82, 
      200, 
      50, 
      "SHARE SCORE", 
      shareScore,
      COLORS.primary
    );
    
    recipeButton = new Button(
      width * 0.65, 
      height * 0.82, 
      200, 
      50, 
      "VIEW RECIPE", 
      viewRecipe,
      COLORS.secondary
    );
    
    // Draw the buttons
    shareButton.draw();
    recipeButton.draw();
    
    // No longer need these text elements since we have actual buttons
    // text("Share Score →", scoreX, scoreY + scoreHeight/2 - 15);
    
    // Add "New Recipe Everyday!" text at the bottom
    textAlign(CENTER, CENTER);
    textSize(16);
    fill('#333');
    textStyle(BOLD);
    text("New Recipe Everyday!", playAreaX + playAreaWidth/2, scoreY + scoreHeight/2 + 80);
    textStyle(NORMAL);
    
    // Check if mouse is over the recipe card
    isMouseOverCard = mouseX > cardX - cardWidth/2 && mouseX < cardX + cardWidth/2 && 
                     mouseY > cardY - cardHeight/2 && mouseY < cardY + cardHeight/2;
    
    // Change cursor to pointer if over the card or letter score area or buttons
    if (isMouseOverCard || isMouseOverLetterScore || 
        (shareButton && shareButton.isInside(mouseX, mouseY)) || 
        (recipeButton && recipeButton.isInside(mouseX, mouseY))) {
      cursor(HAND);
    }
  }
  
  // Enhanced move history display for win screen
  function drawWinMoveHistory(x, y, width, height) {
    // This function is no longer called, but we'll keep it for future reference
    const circleSize = 18;
    const margin = 6;
    const maxPerRow = 8;
    const maxRows = 4;
    
    // Make these variables accessible to the parent function
    window.winMoveHistory = {
      circleSize: circleSize,
      margin: margin,
      maxRows: maxRows
    };
  }
  
  // Keep the regular move history for during gameplay
  function drawMoveHistory() {
    // Position at the bottom of the play area
    const historyY = playAreaY + playAreaHeight * 0.95;
    const circleSize = 15;
    const circleSpacing = 20;
    const maxCountersPerRow = 10;
    const rowSpacing = 20;
    const maxRows = 3; // Maximum 3 rows (30 counters total)
    
    // Filter moveHistory to only include red, black, and Easter Egg counters
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333' || move === '#FF5252' || 
      (typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')));
    
    // Limit the number of counters to display
    const displayCount = Math.min(filteredMoveHistory.length, maxCountersPerRow * maxRows);
    
    // Calculate the number of rows needed
    const rowsNeeded = Math.ceil(displayCount / maxCountersPerRow);
    
    // Move the starting Y position up to accommodate rows below
    const startY = historyY - ((rowsNeeded - 1) * rowSpacing);
    
    // Calculate starting X position to center the counters
    let startX = playAreaX + playAreaWidth / 2 - (Math.min(maxCountersPerRow, displayCount) * circleSpacing) / 2;
    
    // Draw move history circles
    for (let i = 0; i < displayCount; i++) {
      // Calculate row and position within row
      const row = Math.floor(i / maxCountersPerRow);
      const posInRow = i % maxCountersPerRow;
      
      // Calculate x and y positions
      const x = startX + posInRow * circleSpacing;
      const y = startY + (row * rowSpacing); // New rows appear below previous rows
      
      // Check if this is an Easter Egg counter
      if (typeof filteredMoveHistory[i] === 'object' && 
          (filteredMoveHistory[i].type === 'egg' || filteredMoveHistory[i].type === 'easterEgg')) {
        // Draw Easter Egg counter (nested oval and circle)
        // Outer white oval
        fill(255);
        stroke(0);
        strokeWeight(2); // Increased to 2px
        ellipse(x, y, circleSize * 1.1, circleSize * 1.5); // Vertical oval shape
        
        // Inner yellow circle
        fill(COLORS.tertiary); // Use the game's yellow color
        stroke(0);
        strokeWeight(1);
        circle(x, y, circleSize * 0.8);
        strokeWeight(1);
      } else {
        // Regular counter
        let moveColor = filteredMoveHistory[i];
        
        // Draw regular counter with 2px black outline
        fill(moveColor);
        stroke(0);
        strokeWeight(2); // Increased to 2px
        circle(x, y, circleSize);
      }
    }
  }
  
  function updateCursor() {
    let overInteractive = false;
    
    if (!gameStarted) {
      // Check start button
      if (startButton.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
    } else if (gameWon) {
      // Check buttons and recipe card
      if (isMouseOverLetterScore || isMouseOverCard) {
        overInteractive = true;
      }
    } else {
      // Check vessels
      for (let v of vessels) {
        if (v.isInside(mouseX, mouseY)) {
          overInteractive = true;
          break;
        }
      }
      
      // Check hint vessel
      if (showingHint && hintVessel && hintVessel.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
      
      // Check buttons
      if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
    }
    
    // Set cursor
    cursor(overInteractive ? HAND : ARROW);
  }
  
  function mousePressed() {
    // Check if any easter egg modal is active and handle the click
    for (let i = eggModals.length - 1; i >= 0; i--) {
      if (eggModals[i].active && eggModals[i].checkClick(mouseX, mouseY)) {
        // Modal was clicked, don't process any other clicks
        return;
      }
    }
    
    if (!gameStarted) {
      // Check if start button was clicked
      if (startButton.isInside(mouseX, mouseY)) {
        startButton.handleClick();
        return;
      }
    } else if (gameWon) {
      // Check if win screen buttons were clicked
      if (shareButton && shareButton.isInside(mouseX, mouseY)) {
        shareButton.handleClick();
        return;
      }
      
      if (recipeButton && recipeButton.isInside(mouseX, mouseY)) {
        recipeButton.handleClick();
        return;
      }
      
      // Check if recipe card was clicked
      if (isMouseOverCard) {
        viewRecipe();
        return;
      }
      
      // Check if letter score area was clicked
      if (isMouseOverLetterScore) {
        shareScore();
        return;
      }
    } else {
      // Check if hint button was clicked
      if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
        hintButton.handleClick();
        return;
      }
      
      // Check if a vessel was clicked
      for (let v of vessels) {
        if (v.isInside(mouseX, mouseY)) {
          draggedVessel = v;
          offsetX = mouseX - v.x;
          offsetY = mouseY - v.y;
          v.targetScale = 1.1; // Slight scale up when dragging
          triggerHapticFeedback('success'); // Haptic feedback on successful drag
          break;
        }
      }
    }
  }
  
  function mouseDragged() {
    if (draggedVessel) {
      draggedVessel.x = mouseX - offsetX;
      draggedVessel.y = mouseY - offsetY;
    }
  }
  
  function mouseReleased() {
    if (draggedVessel) {
      draggedVessel.targetScale = 1; // Reset scale
      
      let overVessel = null;
      let overVesselIndex = -1;
      let overHintVessel = false;
      
      // Check if dragged over another vessel
      for (let i = 0; i < vessels.length; i++) {
        let v = vessels[i];
        if (v !== draggedVessel && v.isInside(mouseX, mouseY)) {
          overVessel = v;
          overVesselIndex = i;
          break;
        }
      }
      
      // Check if dragged over hint vessel
      if (showingHint && hintVessel && hintVessel.isInside(mouseX, mouseY)) {
        overHintVessel = true;
      }
      
      if (overVessel) {
        // Regular vessel combination
        // Increment turn counter
        turnCounter++;
        
        // Check for easter eggs before combining
        const easterEgg = checkForEasterEgg([...new Set([...draggedVessel.ingredients, ...overVessel.ingredients])]);
        if (easterEgg) {
          // Easter egg was found
          // Add a special move to history with a marker to indicate it's an Easter Egg
          moveHistory.push({ type: 'egg', color: 'yellow' });
          
          // Trigger haptic feedback
          triggerHapticFeedback('completion');
          
          // Immediately snap vessels back to their original positions
          draggedVessel.snapBack();
          
          // Display the easter egg modal
          displayEasterEgg(easterEgg, draggedVessel, overVessel);
          
          // Set draggedVessel to null to prevent further interaction until modal is closed
          draggedVessel = null;
          return;
        }
        
        // If not an easter egg, proceed with normal combination
        let new_v = combineVessels(draggedVessel, overVessel);
        if (new_v) {
          // Create animation particles
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, new_v.x, new_v.y);
          createCombineAnimation(overVessel.x, overVessel.y, overVessel.color, new_v.x, new_v.y);
          
          // Get the index of the dragged vessel
          let draggedIndex = vessels.indexOf(draggedVessel);
          
          // Remove old vessels
          vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
          
          // Insert the new vessel at the position of the target vessel
          // This ensures the new vessel appears close to where the user dropped it
          vessels.splice(overVesselIndex, 0, new_v);
          
          // Re-arrange vessels with the new vessel in place
          arrangeVessels();
          
          // Pulse the new vessel
          new_v.pulse();
          
          // Store the current move history length to detect if checkForMatchingVessels adds moves
          let originalMoveHistoryLength = moveHistory.length;
          
          // Check if the new vessel matches the current hint
          if (showingHint && hintVessel) {
            // Check if this vessel matches the hint
            checkForMatchingVessels();
          }
          
          // Only add to move history if it wasn't already added by checkForMatchingVessels
          if (moveHistory.length === originalMoveHistoryLength) {
            // Add successful move to history with the color of the new vessel
            // Ensure we're using the COLORS object for consistency
            if (new_v.color === 'yellow') {
              moveHistory.push(COLORS.vesselYellow);
            } else if (new_v.color === 'green') {
              moveHistory.push(COLORS.vesselGreen);
            } else if (new_v.color === 'white') {
              moveHistory.push(COLORS.vesselBase);
            } else if (new_v.color === '#FF5252') {
              // Red counters have been removed
              // moveHistory.push(COLORS.vesselHint);
            } else {
              moveHistory.push(new_v.color); // Fallback to the actual color
            }
          }
          
          // Check if the game is won
          if (vessels.length === 1 && vessels[0].name === final_combination.name) {
            gameWon = true;
            triggerHapticFeedback('completion'); // Haptic feedback on game completion
          } else {
            // Trigger haptic feedback for successful combination
            triggerHapticFeedback('medium');
          }
        } else {
          // If new_v is null, it could mean one of two things:
          // 1. The combination failed
          // 2. The ingredients were added directly to the hint vessel
          
          // Check if the hint vessel has changed (ingredients were added)
          if (showingHint && hintVessel && hintVessel.collected.some(ing => 
              draggedVessel.ingredients.includes(ing) || overVessel.ingredients.includes(ing))) {
            // Ingredients were added to the hint vessel
            
            // Remove the vessels that were combined
            vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
            arrangeVessels();
            
            // Check if the hint is now complete
            if (hintVessel.isComplete()) {
              // Convert hint to regular vessel
              let newVessel = hintVessel.toVessel();
              vessels.push(newVessel);
              arrangeVessels();
              
              // Reset hint
              hintVessel = null;
              showingHint = false;
              
              // Check win condition
              if (vessels.length === 1 && vessels[0].name === final_combination.name) {
                gameWon = true;
                triggerHapticFeedback('completion'); // Haptic feedback on game completion
              }
            }
            
            // Trigger haptic feedback for successful combination
            triggerHapticFeedback('medium');
          } 
          // Check if this was an easter egg (we don't need to do anything special, just don't snap back)
          else if (checkForEasterEgg([...new Set([...draggedVessel.ingredients, ...overVessel.ingredients])])) {
            // Easter egg was found and displayed
            // Add a special move to history
            moveHistory.push({ type: 'egg', color: 'yellow' });
            
            // Don't snap back or remove vessels - they will be reset when the modal is closed
            // Just trigger haptic feedback
            triggerHapticFeedback('completion');
            
            // Set draggedVessel to null to prevent further interaction until modal is closed
            draggedVessel = null;
            return;
          }
          else {
            // Combination failed, snap back
          draggedVessel.snapBack();
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
          
          // Trigger shake animation on both vessels
          draggedVessel.shake();
          overVessel.shake();
          }
        }
      } else if (overHintVessel) {
        // Trying to add to the hint vessel
        turnCounter++;
        
        let canAddToHint = false;
        
        // Check if it's a single ingredient
        if (draggedVessel.ingredients.length === 1) {
          let ingredientName = draggedVessel.ingredients[0];
          canAddToHint = hintVessel.addIngredient(ingredientName);
        } 
        // Check if it's a partial combination that matches one of the required ingredients
        else if (draggedVessel.name && hintVessel.required.includes(draggedVessel.name)) {
          canAddToHint = hintVessel.addIngredient(draggedVessel.name);
        }
        // Check if it's a yellow vessel with multiple ingredients that are all part of the hint
        else if (draggedVessel.ingredients.length > 0 && draggedVessel.ingredients.every(ing => hintVessel.required.includes(ing))) {
          // Check if we can add all ingredients to the hint
          canAddToHint = true;
          for (let ing of draggedVessel.ingredients) {
            if (hintVessel.collected.includes(ing)) {
              canAddToHint = false;
              break;
            }
          }
          
          // If we can add all ingredients, do so
          if (canAddToHint) {
            for (let ing of draggedVessel.ingredients) {
              hintVessel.addIngredient(ing);
            }
          }
        }
        
        if (canAddToHint) {
          // Create animation
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, hintVessel.x, hintVessel.y);
          
          // Remove the vessel
          vessels = vessels.filter(v => v !== draggedVessel);
          arrangeVessels();
          
          // Check if hint is complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            vessels.push(newVessel);
            arrangeVessels();
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
            
            // Check win condition
            if (vessels.length === 1 && vessels[0].name === final_combination.name) {
              gameWon = true;
              triggerHapticFeedback('completion'); // Haptic feedback on game completion
            }
          }
        } else {
          draggedVessel.snapBack();
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
          
          // Trigger shake animation on both vessels
          draggedVessel.shake();
          hintVessel.shake();
        }
      } else {
        draggedVessel.snapBack();
        
        // Only add black counter and shake if the vessel was actually dragged
        // (not just clicked and released in the same spot)
        if (dist(draggedVessel.x, draggedVessel.y, draggedVessel.originalX, draggedVessel.originalY) > 10) {
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
          
          // Trigger shake animation on the dragged vessel
          draggedVessel.shake();
        }
      }
      
      // Reset draggedVessel
      draggedVessel = null;
    }
  }
  
  function createCombineAnimation(startX, startY, color, targetX, targetY) {
    for (let i = 0; i < 5; i++) {
      animations.push(new CombineAnimation(startX, startY, color, targetX, targetY));
    }
  }
  
  function combineVessels(v1, v2) {
    // Check if hint is active before creating any new vessels
    let hintActive = showingHint && hintVessel;
    
    // Case 1: Both vessels are base ingredients (white vessels)
    if (v1.ingredients.length > 0 && v2.ingredients.length > 0 && v1.complete_combinations.length === 0 && v2.complete_combinations.length === 0) {
      let U = [...new Set([...v1.ingredients, ...v2.ingredients])];
      
      // Special handling for hint: If all ingredients are part of the hint
        if (hintActive) {
          // Check if all ingredients are required for the hint
          let allIngredientsInHint = U.every(ing => hintVessel.required.includes(ing));
          
          // Check if any of these ingredients are already collected in the hint
          let anyAlreadyCollected = U.some(ing => hintVessel.collected.includes(ing));
          
          // If all ingredients are part of the hint and none are already collected,
        // we should add them directly to the hint vessel instead of creating a new vessel
          if (allIngredientsInHint && !anyAlreadyCollected) {
          console.log(`Adding ingredients directly to hint: ${U.join(', ')}`);
          
          // Add all ingredients to the hint vessel
          for (let ing of U) {
            hintVessel.addIngredient(ing);
          }
          
          // Create animations directly from each original vessel to the hint vessel
          createCombineAnimation(v1.x, v1.y, v1.color, hintVessel.x, hintVessel.y);
          createCombineAnimation(v2.x, v2.y, v2.color, hintVessel.x, hintVessel.y);
          
          // Add red moves to history - one for each ingredient (or at least one if it was a combination)
          // This ensures we count the proper number of turns when adding multiple ingredients at once
          let numIngredientsAdded = Math.max(1, U.length);
          // Red counters have been removed
          // for (let j = 0; j < numIngredientsAdded; j++) {
          //   moveHistory.push('#FF5252');
          // }
          
          // Check if hint is complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
            
            // Return the new vessel
            return newVessel;
          }
          
          // Return null to indicate no new vessel should be created
          // The ingredients were added directly to the hint vessel
          return null;
        }
      }
      
      // Check if this combination matches or partially matches any recipe
      let C_candidates = intermediate_combinations.filter(C => {
        // Check if there's any overlap between the required ingredients and our combined set
        let overlap = C.required.filter(ing => U.includes(ing));
        // Only consider it a match if ALL ingredients in U are part of the recipe
        // AND there's at least one ingredient from the recipe in U
        return overlap.length > 0 && U.every(ing => C.required.includes(ing));
      });
      
      // Only create a new vessel if we have valid recipe candidates
      if (C_candidates.length > 0) {
        // Create a new vessel (yellow or green)
        let new_v = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        
        let C = C_candidates[0];
        
        // Check if we have all required ingredients for this combination
        // Modified: Only check if all required ingredients are present, not requiring exact length match
        if (C.required.every(ing => U.includes(ing))) {
          // Only turn green if not part of an active hint
          if (!hintActive || C.name !== hintVessel.name) {
          new_v.name = C.name;
          new_v.color = 'green';
            new_v.ingredients = []; // Clear ingredients since this is now a complete combination
            
            // Set the verb from the combination and display it
            for (let combo of intermediate_combinations) {
              if (combo.name === C.name && combo.verb) {
                new_v.verb = combo.verb;
                new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
                break;
              }
            }
            
            console.log(`Created green vessel for ${C.name} with ingredients: ${U.join(', ')}`);
          }
        } else {
          console.log(`Created yellow vessel with ingredients: ${U.join(', ')}`);
          console.log(`Missing ingredients for ${C.name}: ${C.required.filter(ing => !U.includes(ing)).join(', ')}`);
        }
        
        return new_v;
      } else {
        // No matching recipe, don't create a vessel
        console.log(`Cannot combine unrelated ingredients: ${U.join(', ')}`);
        return null;
      }
    } 
    // Case 2: Both vessels are completed combinations (green vessels)
    else if ((v1.name || v1.complete_combinations.length > 0) && (v2.name || v2.complete_combinations.length > 0)) {
      // Handle combining completed combinations (green vessels)
      let set1 = v1.complete_combinations.length > 0 ? v1.complete_combinations : (v1.name ? [v1.name] : []);
      let set2 = v2.complete_combinations.length > 0 ? v2.complete_combinations : (v2.name ? [v2.name] : []);
      let U = [...new Set([...set1, ...set2])];
      
      console.log("Combining completed combinations:", U);
      
      // Find the combinations in our intermediate_combinations array
      let combo1 = null;
      let combo2 = null;
      
      // Find the combination objects for the vessels being combined
      for (let name of set1) {
        const found = intermediate_combinations.find(c => c.name === name);
        if (found) {
          combo1 = found;
          break;
        }
      }
      
      for (let name of set2) {
        const found = intermediate_combinations.find(c => c.name === name);
        if (found) {
          combo2 = found;
          break;
        }
      }
      
      console.log("Combo 1:", combo1);
      console.log("Combo 2:", combo2);
      
      // Check if both combinations have the same parent_combo
      if (combo1 && combo2 && combo1.parent_combo && combo2.parent_combo && 
          combo1.parent_combo === combo2.parent_combo) {
        
        console.log("Both combinations have the same parent:", combo1.parent_combo);
        
        // Find the parent combination
        const parentCombo = intermediate_combinations.find(c => c.combo_id === combo1.parent_combo) || 
                           (final_combination.combo_id === combo1.parent_combo ? final_combination : null);
        
        if (parentCombo) {
          console.log("Found parent combination:", parentCombo.name);
          
          // Create a new vessel for the parent combination
          let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
          
          // Check if we have all required components for the parent combination
          // Get all combinations that have this parent
          const requiredCombos = intermediate_combinations
            .filter(c => c.parent_combo === parentCombo.combo_id)
            .map(c => c.name);
            
          console.log("Required combinations for parent:", requiredCombos);
          
          // Check if we have all the required combinations
          const hasAllRequired = requiredCombos.every(name => U.includes(name));
          
          if (hasAllRequired) {
            new_v.name = parentCombo.name;
            new_v.color = COLORS.primary; // Use avocado green from color palette
            new_v.complete_combinations = []; // Clear since this is now a complete combination
            
            // Set the verb from the parent combination and display it
            if (parentCombo.verb) {
              new_v.verb = parentCombo.verb;
              new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
            }
            
            console.log(`Created green vessel for ${parentCombo.name}`);
          } else {
            console.log(`Created yellow vessel with combinations: ${U.join(', ')}`);
            console.log(`Missing combinations for ${parentCombo.name}: ${requiredCombos.filter(name => !U.includes(name)).join(', ')}`);
          }
          
          return new_v;
        }
      }
      
      // If we don't have parent_combo information or they don't match, check if they're part of the final recipe
      // Only allow combinations if they're part of the final recipe's required combinations
      let finalRecipeComponents = final_combination.required || [];
      
      // Check if both vessels contain combinations that are part of the final recipe
      let v1ContainsFinalComponent = set1.some(name => finalRecipeComponents.includes(name));
      let v2ContainsFinalComponent = set2.some(name => finalRecipeComponents.includes(name));
      
      if (v1ContainsFinalComponent && v2ContainsFinalComponent) {
        console.log("Both vessels contain components of the final recipe");
        
        // Create a new vessel for the combined components
        let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        
        // Check if we have all required components for the final combination
        if (finalRecipeComponents.every(name => U.includes(name))) {
          new_v.name = final_combination.name;
          new_v.color = COLORS.primary; // Use avocado green from color palette
          new_v.complete_combinations = []; // Clear since this is the final combination
          
          // Set the verb from the final combination and display it
          if (final_combination.verb) {
            new_v.verb = final_combination.verb;
            new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
          }
          
          console.log(`Created green vessel for final combination ${final_combination.name}`);
        } else {
          console.log(`Created yellow vessel with combinations: ${U.join(', ')}`);
          console.log(`Missing combinations for ${final_combination.name}: ${finalRecipeComponents.filter(name => !U.includes(name)).join(', ')}`);
        }
        
        return new_v;
      } else {
        // If the combinations don't have the same parent and aren't both part of the final recipe,
        // don't allow them to be combined
        console.log("Invalid combination: Combinations don't share the same parent and aren't both part of the final recipe");
        return null;
      }
    }
    // Case 3: Mixing a base ingredient (white vessel) with a completed combination (green/yellow vessel)
    else if ((v1.ingredients.length > 0 && (v2.name || v2.complete_combinations.length > 0)) || 
             (v2.ingredients.length > 0 && (v1.name || v1.complete_combinations.length > 0))) {
      
      // Determine which vessel is the base ingredient and which is the combination
      let baseVessel = v1.ingredients.length > 0 ? v1 : v2;
      let comboVessel = v1.ingredients.length > 0 ? v2 : v1;
      
      // Get the base ingredient name(s)
      let baseIngredients = baseVessel.ingredients;
      
      // Get the completed combinations
      let completedCombos = comboVessel.complete_combinations.length > 0 ? 
                            comboVessel.complete_combinations : 
                            (comboVessel.name ? [comboVessel.name] : []);
      
      // Check if this combination is valid for any recipe
      let validCombination = false;
      let targetRecipe = null;
      
      // First, check if this is a valid combination for the final recipe
      if (final_combination.required.some(req => completedCombos.includes(req))) {
        // This is a valid combination for the final recipe
        // Check if any of the base ingredients are also required for the final recipe
        if (baseIngredients.some(ing => final_combination.required.includes(ing))) {
          validCombination = true;
          targetRecipe = final_combination;
        }
      }
      
      // If not valid for the final recipe, check intermediate combinations
      if (!validCombination) {
        // Check each intermediate combination
        for (let combo of intermediate_combinations) {
          // Check if the base ingredients are part of this recipe
          if (baseIngredients.every(ing => combo.required.includes(ing))) {
            // Check if any of the completed combinations are also part of this recipe
            // This is a special case where a completed combination might be a component of another recipe
            if (completedCombos.some(c => {
              // Find the intermediate combination with this name
              let matchingCombo = intermediate_combinations.find(ic => ic.name === c);
              // Check if all ingredients of this combination are part of the target recipe
              return matchingCombo && matchingCombo.required.every(ing => combo.required.includes(ing));
            })) {
              validCombination = true;
              targetRecipe = combo;
              break;
            }
          }
        }
      }
      
      // Only proceed if this is a valid combination
      if (validCombination && targetRecipe) {
        // Create a combined set of all components
        let allComponents = [];
        
        // If we're building toward the final recipe, use the combination names
        if (targetRecipe === final_combination) {
          allComponents = [...baseIngredients, ...completedCombos];
        } else {
          // For intermediate recipes, we need to extract the ingredients
          let allIngredients = [...baseIngredients];
          
          // Add ingredients from completed combinations
          for (let combo of completedCombos) {
            let matchingCombo = intermediate_combinations.find(ic => ic.name === combo);
            if (matchingCombo) {
              allIngredients = [...allIngredients, ...matchingCombo.required];
            }
          }
          
          // Remove duplicates
          allIngredients = [...new Set(allIngredients)];
          
          // Only keep ingredients that are part of the target recipe
          allIngredients = allIngredients.filter(ing => targetRecipe.required.includes(ing));
          
          allComponents = allIngredients;
        }
        
        // Create a yellow vessel for the partial combination
        let new_v;
        
        if (targetRecipe === final_combination) {
          // For final recipe, store combination names
          new_v = new Vessel([], allComponents, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        } else {
          // For intermediate recipes, store ingredients
          new_v = new Vessel(allComponents, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        }
        
        // Check if we have all required components for the target recipe
        let hasAllRequired = false;
        
        if (targetRecipe === final_combination) {
          // For final recipe, check if all required combinations are present
          hasAllRequired = targetRecipe.required.every(req => allComponents.includes(req));
        } else {
          // For intermediate recipes, check if all required ingredients are present
          hasAllRequired = targetRecipe.required.length === allComponents.length && 
                           targetRecipe.required.every(req => allComponents.includes(req));
        }
        
        if (hasAllRequired) {
          new_v.name = targetRecipe.name;
          new_v.color = COLORS.primary; // Use avocado green from color palette
          
          if (targetRecipe === final_combination) {
            new_v.complete_combinations = []; // Clear since this is the final combination
            
            // Set the verb from the final combination and display it
            if (final_combination.verb) {
              new_v.verb = final_combination.verb;
              new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
            }
          } else {
            new_v.ingredients = []; // Clear ingredients since this is a complete intermediate combination
            
            // Set the verb from the intermediate combination and display it
            for (let combo of intermediate_combinations) {
              if (combo.name === targetRecipe.name && combo.verb) {
                new_v.verb = combo.verb;
                new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
                break;
              }
            }
          }
          
          console.log(`Created green vessel for ${targetRecipe.name}`);
        } else {
          if (targetRecipe === final_combination) {
            console.log(`Created yellow vessel with combinations for final recipe`);
            console.log(`Missing combinations: ${targetRecipe.required.filter(req => !allComponents.includes(req)).join(', ')}`);
          } else {
            console.log(`Created yellow vessel with ingredients for ${targetRecipe.name}`);
            console.log(`Missing ingredients: ${targetRecipe.required.filter(req => !allComponents.includes(req)).join(', ')}`);
          }
        }
        
        return new_v;
      } else {
        console.log("Invalid combination of base ingredient and completed combination");
        return null;
      }
    }
    
    return null;
  }
  
  function shareScore() {
    // Filter moveHistory to only include red and black counters
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333' || move === '#FF5252');
    
    // Create share text
    let shareText = `I made ${final_combination.name} in ${filteredMoveHistory.length} moves in Combo Meal! Can you beat my score?`;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Combo Meal Score',
        text: shareText,
        url: window.location.href
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
        .then(() => {
          alert('Score copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert(shareText);
        });
    }
    
    // Reset hover states to prevent persistent highlighting
    isMouseOverCard = false;
    isMouseOverLetterScore = false;
  }
  
  function viewRecipe() {
    window.open(recipeUrl, '_blank');
    
    // Reset hover states to prevent persistent highlighting
    isMouseOverCard = false;
    isMouseOverLetterScore = false;
  }
  
  function mouseMoved() {
    // Check if buttons exist before trying to use them
    if (!gameStarted && startButton) {
      startButton.checkHover(mouseX, mouseY);
    }
    
    if (gameStarted) {
      // Only check these buttons if they exist and the game has started
      if (hintButton) hintButton.checkHover(mouseX, mouseY);
      
      // Check win screen buttons
      if (gameWon) {
        if (shareButton) shareButton.checkHover(mouseX, mouseY);
        if (recipeButton) recipeButton.checkHover(mouseX, mouseY);
      }
    }
  }
  
  // Function to show a hint
  function showHint() {
    if (!showingHint && !gameWon) {
      // Check if only the final combination remains
      if (isOnlyFinalComboRemaining()) {
        console.log("Only final combination remains, hint disabled");
        return; // Exit early
      }
      
      hintCount++; // Increment hint counter
      
      // Add a bright blue counter for creating a hint vessel
      moveHistory.push('#FF5252'); // Red color for hint creation (matching hint vessels)
      turnCounter++; // Increment turn counter for hint creation
      
      
      // Find combinations that have been completed
      let completedCombos = vessels
        .filter(v => v.name !== null)
        .map(v => v.name);
      
      // Also check for combinations that are part of partial combinations
      // These are combinations that are in the complete_combinations array of any vessel
      let partialCompletedCombos = [];
      vessels.forEach(v => {
        if (v.complete_combinations && v.complete_combinations.length > 0) {
          partialCompletedCombos.push(...v.complete_combinations);
        }
      });
      
      // Combine both lists to get all combinations that shouldn't be offered as hints
      let allCompletedCombos = [...new Set([...completedCombos, ...partialCompletedCombos])];
      
      console.log("All completed combinations (including partial):", allCompletedCombos);
      
      // Get all ingredients currently visible on the board
      let visibleIngredients = [];
      vessels.forEach(v => {
        visibleIngredients.push(...v.ingredients);
      });
      
      console.log("Visible ingredients on board:", visibleIngredients);
      console.log("Completed combinations:", completedCombos);
      
      // Calculate which combinations can be made with visible ingredients
      let possibleCombos = [];
      
      // Check all intermediate combinations that aren't completed yet
      let availableCombos = intermediate_combinations.filter(combo => 
        !allCompletedCombos.includes(combo.name));
      
      // Filter out combinations that require completed combinations as ingredients
      availableCombos = availableCombos.filter(combo => {
        // Check if any of the required ingredients are completed combinations
        return !combo.required.some(ingredient => completedCombos.includes(ingredient));
      });
      
      console.log("Available combinations after filtering out those requiring completed combos:", 
        availableCombos.map(c => c.name));
      
      // If all intermediate combinations are done, check final combination
      if (availableCombos.length === 0 && !completedCombos.includes(final_combination.name)) {
        // For the final combination, we actually want to use completed combinations
        // But only if not all required combinations are completed yet
        let finalComboRequiredCount = final_combination.required.length;
        let finalComboCompletedCount = final_combination.required.filter(req => 
          completedCombos.includes(req)).length;
        
        if (finalComboCompletedCount > 0 && finalComboCompletedCount < finalComboRequiredCount) {
          availableCombos = [final_combination];
        }
      }
      
      // For each available combination, calculate what percentage of its ingredients are visible
      availableCombos.forEach(combo => {
        let requiredCount = combo.required.length;
        let availableCount = 0;
        
        // Count how many required ingredients are visible on the board
        combo.required.forEach(ing => {
          // For the final combination, completed combinations count as available
          if (combo === final_combination && completedCombos.includes(ing)) {
            availableCount++;
          } 
          // For other combinations, only count visible base ingredients
          else if (visibleIngredients.includes(ing)) {
            availableCount++;
          }
        });
        
        // Calculate percentage of available ingredients
        let percentage = availableCount / requiredCount;
        
        // Only consider combinations where at least one ingredient is available
        if (availableCount > 0) {
          possibleCombos.push({
            combo: combo,
            percentage: percentage,
            availableCount: availableCount
          });
        }
      });
      
      console.log("Possible combinations with percentages:", possibleCombos);
      
      // Sort by percentage (highest first), then by available count (highest first)
      possibleCombos.sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return b.availableCount - a.availableCount;
      });
      
      // If there are possible combinations, show a hint for the one with highest percentage
      if (possibleCombos.length > 0) {
        let selectedCombo = possibleCombos[0].combo;
        hintVessel = new HintVessel(selectedCombo);
        showingHint = true;
        
        console.log("Created hint vessel for:", selectedCombo.name);
        console.log("Required ingredients:", selectedCombo.required);
        console.log("Percentage of ingredients available:", possibleCombos[0].percentage * 100 + "%");
        
        // Find vessels that have ingredients needed for this hint
        let vesselsToAbsorb = [];
        
        // First pass: identify vessels with ingredients that match the hint
        for (let i = 0; i < vessels.length; i++) {
          let v = vessels[i];
          
          // Only consider yellow vessels (partial combinations)
          if (v.color === COLORS.vesselYellow && v.ingredients.length > 0) {
            // Find which ingredients in this vessel are part of the hint
            let matchingIngredients = v.ingredients.filter(ing => 
              hintVessel.required.includes(ing) && !hintVessel.collected.includes(ing)
            );
            
            // Only consider vessels where ALL ingredients are part of the hint
            if (matchingIngredients.length > 0 && matchingIngredients.length === v.ingredients.length) {
              console.log(`Found partial combination with ${matchingIngredients.length} matching ingredients:`, matchingIngredients);
              vesselsToAbsorb.push({
                vessel: v,
                index: i,
                matchingIngredients: matchingIngredients
              });
            }
          }
        }
        
        // Sort vessels by number of matching ingredients (descending)
        vesselsToAbsorb.sort((a, b) => b.matchingIngredients.length - a.matchingIngredients.length);
        
        console.log(`Found ${vesselsToAbsorb.length} partial combinations with matching ingredients`);
        
        // Now absorb the vessels
        let absorbedVessels = [];
        
        for (let i = 0; i < vesselsToAbsorb.length; i++) {
          let vesselInfo = vesselsToAbsorb[i];
          let v = vesselInfo.vessel;
          
          // Skip vessels that have already been absorbed
          if (absorbedVessels.includes(v)) continue;
          
          console.log("Absorbing partial combination with ingredients:", vesselInfo.matchingIngredients.join(', '));
          
          // Add matching ingredients to the hint vessel
          let ingredientsAdded = 0;
          for (let ing of vesselInfo.matchingIngredients) {
            if (!hintVessel.collected.includes(ing)) {
              hintVessel.addIngredient(ing);
              ingredientsAdded++;
            }
          }
          
          if (ingredientsAdded > 0) {
            // Create animation from the vessel to the hint vessel
            createCombineAnimation(v.x, v.y, v.color, hintVessel.x, hintVessel.y);
            
            // Add this vessel to the absorbed list
            absorbedVessels.push(v);
            
            // Mark for removal since all ingredients were absorbed
            v.markedForRemoval = true;
            
            // Add moves to history for each absorbed ingredient
            // Red counters have been removed
            // for (let j = 0; j < ingredientsAdded; j++) {
            //   // Use the string '#FF5252' instead of COLORS.vesselHint to ensure compatibility with drawMoveHistory
            //   moveHistory.push('#FF5252');
            // }
            
            // Increment turn counter for each absorbed ingredient
            turnCounter += ingredientsAdded;
          }
        }
        
        // Remove vessels marked for removal
        vessels = vessels.filter(v => !v.markedForRemoval);
        
        // Re-arrange vessels after potential removals
        arrangeVessels();
        
        // Check if hint is complete after absorbing vessels
        if (hintVessel && hintVessel.isComplete()) {
          // Convert hint to regular vessel
          let newVessel = hintVessel.toVessel();
          vessels.push(newVessel);
          arrangeVessels();
          
          // Reset hint
          hintVessel = null;
          showingHint = false;
        }
      } else {
        console.log("No possible combinations found with visible ingredients");
        
        // If no combinations can be made with visible ingredients, fall back to a random available combo
      if (availableCombos.length > 0) {
          let randomCombo = availableCombos[Math.floor(Math.random() * availableCombos.length)];
          hintVessel = new HintVessel(randomCombo);
        showingHint = true;
        
          console.log("Falling back to random hint for:", randomCombo.name);
        }
      }
    }
  }
  
  // Function to check if any yellow vessels match the current hint
  function checkForMatchingVessels() {
    if (!hintVessel) return;
    
    // Look for yellow vessels that match required ingredients for the hint
    for (let i = vessels.length - 1; i >= 0; i--) {
      let v = vessels[i];
      
      // Check if it's a yellow vessel with ingredients that match the hint
      if (v.color === 'yellow' && v.ingredients.length > 0) {
        let matchesHint = false;
        
        // Check if all ingredients in this vessel are required for the hint
        if (v.ingredients.every(ing => hintVessel.required.includes(ing))) {
          // Check if we can add all ingredients to the hint
          let canAddAll = true;
          for (let ing of v.ingredients) {
            if (hintVessel.collected.includes(ing)) {
              canAddAll = false;
              break;
            }
          }
          
          if (canAddAll) {
            matchesHint = true;
            console.log("Adding ingredients to hint: " + v.ingredients.join(', '));
            
            // Add all ingredients to the hint vessel
            for (let ing of v.ingredients) {
              hintVessel.addIngredient(ing);
            }
            
            // Create animation
            createCombineAnimation(v.x, v.y, v.color, hintVessel.x, hintVessel.y);
            
            // Remove the vessel
            vessels.splice(i, 1);
            
            // Add red moves to history - one for each ingredient (or at least two if it was a combination)
            // This ensures we count the proper number of turns when adding multiple ingredients at once
            let numIngredientsAdded = Math.max(2, v.ingredients.length);
            // Red counters have been removed
            // for (let j = 0; j < numIngredientsAdded; j++) {
            //   moveHistory.push('#FF5252');
            // }
            
            // Increment turn counter - add one more turn since the first turn was already counted
            // when the vessel was created in mouseReleased
            turnCounter += (numIngredientsAdded - 1);
          }
        }
      }
    }
    
    // Re-arrange vessels after potential removals
    arrangeVessels();
    
    // Check if hint is complete
    if (hintVessel && hintVessel.isComplete()) {
      // Convert hint to regular vessel
      let newVessel = hintVessel.toVessel();
      vessels.push(newVessel);
      arrangeVessels();
      
      // Reset hint
      hintVessel = null;
      showingHint = false;
    }
  }
  
  function startGame() {
    gameStarted = true;
  }
  
  function triggerHapticFeedback(type) {
    // Only trigger haptic feedback if the device supports it
    if (navigator.vibrate) {
      if (type === 'success') {
        navigator.vibrate(50);
      } else if (type === 'error') {
        navigator.vibrate([50, 30, 50]);
      } else if (type === 'complete') {
        navigator.vibrate([50, 30, 50, 30, 100]);
      }
    }
  }
  
  // Add touch support for mobile devices
  function touchStarted() {
    // Prevent default touch behavior to avoid scrolling
    if (touches.length > 0) {
      let touchX = touches[0].x;
      let touchY = touches[0].y;
      
      // Debug logging to see touch position
      if (gameWon) {
        console.log("Touch position:", touchX, touchY);
        console.log("Recipe card bounds:", cardX - cardWidth/2, cardX + cardWidth/2, cardY - cardHeight/2, cardY + cardHeight/2);
        console.log("Score area bounds:", scoreX - scoreWidth/2, scoreX + scoreWidth/2, scoreY - scoreHeight/2, scoreY + scoreHeight/2);
      }
      
      // Check if any easter egg modal is active
      for (let i = eggModals.length - 1; i >= 0; i--) {
        if (eggModals[i].active) {
          eggModals[i].checkClick(touchX, touchY);
          return false;
        }
      }
      
      // Handle the same logic as mousePressed but with touch coordinates
      if (!gameStarted) {
        // Check if start button was touched
        if (startButton.isInside(touchX, touchY)) {
          startGame();
          return false;
        }
      } else if (gameWon) {
        // Check if win screen buttons were touched
        if (shareButton && shareButton.isInside(touchX, touchY)) {
          shareScore();
          return false;
        }
        
        if (recipeButton && recipeButton.isInside(touchX, touchY)) {
          viewRecipe();
          return false;
        }
        
        // Fallback to the simplified half-screen approach if buttons missed
        // Top half of the screen trigger the recipe view
        if (touchY < height/2) {
          console.log("View Recipe triggered");
          viewRecipe();
          return false;
        }
        
        // Bottom half of the screen trigger the share score
        if (touchY >= height/2) {
          console.log("Share Score triggered");
          shareScore();
          return false;
        }
      } else {
        // Check if hint button was touched
        if (!showingHint && hintButton.isInside(touchX, touchY)) {
          showHint();
          return false;
        }
        
        // Check if a vessel was touched
        for (let v of vessels) {
          if (v.isInside(touchX, touchY)) {
            draggedVessel = v;
            // Store original position for proper snapback
            draggedVessel.originalX = v.x;
            draggedVessel.originalY = v.y;
            offsetX = touchX - v.x;
            offsetY = touchY - v.y;
            v.targetScale = 1.1; // Slight scale up when dragging
            triggerHapticFeedback('success'); // Haptic feedback on successful drag
            return false;
          }
        }
      }
    }
    return false; // Prevent default
  }
  
  // New function to initialize the game after data is loaded
  function initializeGame() {
    // Create vessels for each ingredient
    ingredients.forEach((ing) => {
      let v = new Vessel([ing], [], null, 'white', 0, 0, 0, 0); // Size will be set in arrangeVessels
      vessels.push(v);
    });
    
    // Randomize the order of vessels
    shuffleArray(vessels);
    
    // Initial arrangement of vessels
    arrangeVessels();
    
    // Calculate the lowest vessel position
    let lowestY = 0;
    vessels.forEach(v => {
      lowestY = Math.max(lowestY, v.y + v.h/2);
    });
    
    // Set hint button position 40 pixels below the lowest vessel (increased from 20)
    hintButtonY = lowestY + 40;
    
    // Adjust button sizes based on play area width
    let buttonWidth = min(120, playAreaWidth * 0.25);
    let buttonHeight = min(40, buttonWidth * 0.4);
    let startButtonWidth = min(180, playAreaWidth * 0.4);
    let startButtonHeight = min(60, startButtonWidth * 0.33);
    
    // Create hint button with white background and grey outline
    hintButton = new Button(
      playAreaX + playAreaWidth * 0.5, 
      hintButtonY, 
      buttonWidth, 
      buttonHeight, 
      "Hint", 
      showHint, 
      'white', 
      '#FF5252'
    );
    
    // Create start button
    startButton = new Button(
      playAreaX + playAreaWidth * 0.5, 
      playAreaY + playAreaHeight * 0.85, 
      startButtonWidth, 
      startButtonHeight, 
      "Let's Get Cooking!", 
      startGame, 
      COLORS.secondary, 
      'white'
    );
    
    // Reset game state
    gameWon = false;
    turnCounter = 0;
    moveHistory = [];
    animations = [];
    gameStarted = false;
    showingHint = false;
    hintVessel = null;
    hintCount = 0; // Reset hint count when game starts
  }
  
  // Function to get current time in EST for debugging
  function getCurrentESTTime() {
    const now = new Date();
    const options = {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return now.toLocaleString('en-US', options);
  }
  
  // Function to draw the floral pattern border
  function drawFloralBorder() {
    // Only draw the border if there's space around the play area
    if (windowWidth <= maxPlayWidth + 2 * playAreaPadding) return;
    
    // Draw flowers in a grid pattern only on the left and right sides of the play area
    const flowerSpacing = 40; // Spacing between flowers
    const petalSize = 6; // Size of flower petals
    
    // Calculate the available space on each side
    const leftSpace = playAreaX;
    const rightSpace = windowWidth - (playAreaX + playAreaWidth);
    
    // Calculate how many complete flowers can fit on each side
    const leftColumns = Math.floor(leftSpace / flowerSpacing);
    const rightColumns = Math.floor(rightSpace / flowerSpacing);
    
    // Calculate the buffer space to center the pattern on each side
    const leftBuffer = (leftSpace - (leftColumns * flowerSpacing)) / 2;
    const rightBuffer = (rightSpace - (rightColumns * flowerSpacing)) / 2;
    
    // Draw on the left side (from left edge to play area)
    for (let i = 0; i < leftColumns; i++) {
      const x = leftBuffer + i * flowerSpacing + flowerSpacing/2;
      for (let y = flowerSpacing/2; y < height - flowerSpacing/2; y += flowerSpacing) {
        // Alternate between different colors for variety
        const colorIndex = (i + Math.floor(y/flowerSpacing)) % 3;
        if (colorIndex === 0) {
          drawFlower(x, y, petalSize, COLORS.primary); // Green
        } else if (colorIndex === 1) {
          drawFlower(x, y, petalSize, COLORS.secondary); // Red/Orange
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary); // Yellow
        }
      }
    }
    
    // Draw on the right side (from play area to right edge)
    for (let i = 0; i < rightColumns; i++) {
      const x = playAreaX + playAreaWidth + rightBuffer + i * flowerSpacing + flowerSpacing/2;
      for (let y = flowerSpacing/2; y < height - flowerSpacing/2; y += flowerSpacing) {
        // Alternate between different colors for variety
        const colorIndex = (i + Math.floor(y/flowerSpacing)) % 3;
        if (colorIndex === 0) {
          drawFlower(x, y, petalSize, COLORS.primary); // Green
        } else if (colorIndex === 1) {
          drawFlower(x, y, petalSize, COLORS.secondary); // Red/Orange
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary); // Yellow
        }
      }
    }
  }
  
  // Function to draw a single flower
  function drawFlower(x, y, petalSize, color) {
    // Set the flower color
    fill(color);
    noStroke();
    
    // Draw petals
    for (let i = 0; i < 6; i++) {
      let angle = i * PI / 3;
      let px = x + cos(angle) * petalSize * 1.5;
      let py = y + sin(angle) * petalSize * 1.5;
      ellipse(px, py, petalSize * 1.2, petalSize * 1.2);
    }
    
    // Draw center with a slightly different shade
    fill(255, 255, 255, 100); // Semi-transparent white for a highlight
    ellipse(x, y, petalSize, petalSize);
  }
  
  // Function to check if a combination matches any easter egg
  function checkForEasterEgg(ingredients) {
    if (!easter_eggs || easter_eggs.length === 0) return null;
    
    console.log("Checking for easter eggs with ingredients:", ingredients);
    
    // Check each easter egg
    for (let egg of easter_eggs) {
      // Check if all required ingredients for this easter egg are present
      // and if the number of ingredients matches exactly
      if (egg.required.length === ingredients.length && 
          egg.required.every(ing => ingredients.includes(ing))) {
        console.log("Found easter egg:", egg.name);
        return egg;
      }
    }
    
    return null;
  }
  
  // Function to display an easter egg
  function displayEasterEgg(egg, draggedVesselRef, targetVesselRef) {
    console.log("Displaying easter egg:", egg.name);
    
    // Store references to the vessels that triggered the easter egg
    let draggedVesselCopy = null;
    let targetVesselCopy = null;
    
    if (draggedVesselRef) {
      // Store the original positions of the vessels
      draggedVesselCopy = {
        vessel: draggedVesselRef,
        originalX: draggedVesselRef.x,
        originalY: draggedVesselRef.y
      };
    }
    
    if (targetVesselRef) {
      targetVesselCopy = {
        vessel: targetVesselRef,
        originalX: targetVesselRef.x,
        originalY: targetVesselRef.y
      };
    }
    
    // Create a modal dialogue that stays until clicked
    let eggModal = {
      active: true,
      x: playAreaX + playAreaWidth / 2,
      y: playAreaY + playAreaHeight / 2,
      radius: min(playAreaWidth, playAreaHeight) * 0.2, // Half the previous size
      draggedVessel: draggedVesselCopy,
      targetVessel: targetVesselCopy,
      
      // Animation properties for the splat effect
      animating: true,
      animationStartTime: millis(),
      animationDuration: 100, // 100ms for the animation (reduced from 300ms)
      
      draw: function() {
        if (!this.active) return;
        
        push();
        // Semi-transparent overlay for the entire canvas
        rectMode(CORNER);
        fill(0, 0, 0, 100);
        noStroke();
        rect(0, 0, width, height);
        
        // Calculate animation scale factor if animating
        let scaleFactor = 1.0;
        if (this.animating) {
          const elapsed = millis() - this.animationStartTime;
          const progress = min(elapsed / this.animationDuration, 1.0);
          // Start at 2.0 scale and shrink to 1.0
          scaleFactor = 2.0 - progress;
          
          // End animation when complete
          if (progress >= 1.0) {
            this.animating = false;
          }
        }
        
        // Move to center position for the entire egg (white and yolk)
        push();
        translate(this.x, this.y);
        
        // Apply scale for animation to EVERYTHING (egg white, yolk, and text)
        scale(scaleFactor);
        
        // Draw egg white with new structured design
        fill(255, 255, 255); // 100% opacity
        noStroke();
        
        // 1. Main circular base (300px circle under the yolk)
        const baseRadius = 150; // 300px diameter (increased from 200px)
        noStroke();
        fill(255, 255, 255);
        circle(0, 0, baseRadius * 2);
        
        // 2. Two 150w x 275h rectangles with 75px rounded corners that touch each other
        const rectWidth = 150;
        const rectHeight = 275;
        const cornerRadius = 75;
        
        // Left rectangle (slightly higher)
        rectMode(CENTER);
        rect(-rectWidth/2, -20, rectWidth, rectHeight, cornerRadius);
        
        // Right rectangle
        rect(rectWidth/2, 0, rectWidth, rectHeight, cornerRadius);
        
        // New rectangle in between the two existing rectangles, 50px lower and 25px to the left
        rect(-25, 50, rectWidth, rectHeight, cornerRadius);
        
        // 3. 400w x 200h rounded rectangle with 75px corners centered under the yolk
        // Moved up by 100px (from rectHeight/2 - 50 to rectHeight/2 - 150)
        const bottomRectWidth = 400;
        const bottomRectHeight = 200;
        rect(0, rectHeight/2 - 150, bottomRectWidth, bottomRectHeight, cornerRadius);
        
        // Draw yellow yolk (circular dialogue) - now inside the scale transformation
        // Add a subtle gradient to the yolk
        for (let i = 10; i >= 0; i--) {
          const yolkSize = this.radius * 2 * (1 - i * 0.03);
          const alpha = 255 - i * 10;
          fill(255, 204, 0, alpha); // Bright egg yolk yellow with gradient
          noStroke();
          circle(0, 0, yolkSize);
        }
        
        // Add highlight to the yolk
        fill(255, 255, 255, 100);
        noStroke();
        ellipse(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.7, this.radius * 0.5);
        
        // Add a thin outline to the yolk
        noFill();
        stroke(200, 150, 0, 100);
        strokeWeight(1);
        circle(0, 0, this.radius * 2);
        
        // X mark (without circle)
        stroke(0);
        strokeWeight(2);
        const xOffset = 8;
        const xPos = this.radius * 0.7;
        const yPos = -this.radius * 0.7;
        line(xPos - xOffset, yPos - xOffset, xPos + xOffset, yPos + xOffset);
        line(xPos - xOffset, yPos + xOffset, xPos + xOffset, yPos - xOffset);
        
        // "You found the egg!" text
        fill(0);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12); // Smaller text
        textStyle(NORMAL);
        text("You found the egg!", 0, -this.radius * 0.4);
        
        // Easter egg name
        textSize(20); // Smaller text
        textStyle(BOLD);
        text(egg.name, 0, 0);
        
        // "Keep going!" text
        textSize(12); // Smaller text
        textStyle(NORMAL);
        text("Keep going!", 0, this.radius * 0.4);
        
        pop(); // End of scaled drawing
        pop();
      },
      
      checkClick: function(x, y) {
        // Check if click is inside the modal or close button
        if (this.active) {
          // Clicking anywhere closes the modal
          this.active = false;
          
          // Return vessels to their original positions
          if (this.draggedVessel && this.draggedVessel.vessel) {
            this.draggedVessel.vessel.x = this.draggedVessel.originalX;
            this.draggedVessel.vessel.y = this.draggedVessel.originalY;
          }
          
          if (this.targetVessel && this.targetVessel.vessel) {
            this.targetVessel.vessel.x = this.targetVessel.originalX;
            this.targetVessel.vessel.y = this.targetVessel.originalY;
          }
          
          return true;
        }
        return false;
      }
    };
    
    // Add the modal to a global array
    eggModals.push(eggModal);
    
    // Trigger haptic feedback
    triggerHapticFeedback('completion');
  }
  
  // Helper function to draw a star with very rounded points (cartoonish style)
  function starWithRoundedPoints(x, y, radius1, radius2, npoints, roundness) {
    // Create points for the star
    let points = [];
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    
    for (let a = 0; a < TWO_PI; a += angle) {
      // Outer point
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      points.push({x: sx, y: sy});
      
      // Inner point
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      points.push({x: sx, y: sy});
    }
    
    // Draw the rounded star using curves with much higher roundness
    beginShape();
    for (let i = 0; i < points.length; i++) {
      let p1 = points[i];
      let p2 = points[(i + 1) % points.length];
      
      // Calculate control points for the curve
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = sqrt(dx * dx + dy * dy);
      
      // Use much higher roundness for cartoonish look - at least 40% of the distance
      let r = min(roundness * 2.5, dist * 0.4);
      
      // Calculate direction vector
      let nx = dx / dist;
      let ny = dy / dist;
      
      // Calculate curve control points
      let cp1x = p1.x + nx * r;
      let cp1y = p1.y + ny * r;
      let cp2x = p2.x - nx * r;
      let cp2y = p2.y - ny * r;
      
      // If this is the first point, use vertex instead of bezierVertex
      if (i === 0) {
        vertex(p1.x, p1.y);
      }
      
      bezierVertex(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    endShape(CLOSE);
  }
  
  // Add touch release support for mobile devices
  function touchEnded() {
    // If we have a dragged vessel, handle the release
    if (draggedVessel) {
      draggedVessel.targetScale = 1; // Reset scale
      
      // Find the vessel under the touch point
      let touchX = touches.length > 0 ? touches[0].x : mouseX;
      let touchY = touches.length > 0 ? touches[0].y : mouseY;
      
      let overVessel = null;
      let overVesselIndex = -1;
      let overHintVessel = false;
      
      // Check if dragged over another vessel
      for (let i = 0; i < vessels.length; i++) {
        let v = vessels[i];
        if (v !== draggedVessel && v.isInside(touchX, touchY)) {
          overVessel = v;
          overVesselIndex = i;
          break;
        }
      }
      
      // Check if dragged over hint vessel
      if (showingHint && hintVessel && hintVessel.isInside(touchX, touchY)) {
        overHintVessel = true;
      }
      
      // Log for debugging
      console.log("Touch ended. Over vessel:", overVessel ? "Yes" : "No", "Over hint:", overHintVessel ? "Yes" : "No");
      
      let combinationAttempted = false;
      
      if (overVessel) {
        // Regular vessel combination
        combinationAttempted = true;
        // Increment turn counter
        turnCounter++;
        
        // Check for easter eggs before combining
        const easterEgg = checkForEasterEgg([...new Set([...draggedVessel.ingredients, ...overVessel.ingredients])]);
        if (easterEgg) {
          // Easter egg was found
          // Add a special move to history with a marker to indicate it's an Easter Egg
          moveHistory.push({ type: 'egg', color: 'yellow' });
          
          // Trigger haptic feedback
          triggerHapticFeedback('completion');
          
          // Immediately snap vessels back to their original positions
          draggedVessel.snapBack();
          
          // Display the easter egg modal
          displayEasterEgg(easterEgg, draggedVessel, overVessel);
          
          // Set draggedVessel to null to prevent further interaction until modal is closed
          draggedVessel = null;
          return false;
        }
        
        // If not an easter egg, proceed with normal combination
        let new_v = combineVessels(draggedVessel, overVessel);
        if (new_v) {
          // Create animation particles
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, new_v.x, new_v.y);
          createCombineAnimation(overVessel.x, overVessel.y, overVessel.color, new_v.x, new_v.y);
          
          // Get the index of the dragged vessel
          let draggedIndex = vessels.indexOf(draggedVessel);
          
          // Remove old vessels
          vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
          
          // Insert the new vessel at the position of the target vessel
          // This ensures the new vessel appears close to where the user dropped it
          vessels.splice(overVesselIndex, 0, new_v);
          
          // Re-arrange vessels with the new vessel in place
          arrangeVessels();
          
          // Pulse the new vessel
          new_v.pulse();
          
          // Store the current move history length to detect if checkForMatchingVessels adds moves
          let originalMoveHistoryLength = moveHistory.length;
          
          // Check if the new vessel matches the current hint
          if (showingHint && hintVessel) {
            // Check if this vessel matches the hint
            checkForMatchingVessels();
          }
          
          // Only add to move history if it wasn't already added by checkForMatchingVessels
          if (moveHistory.length === originalMoveHistoryLength) {
            // Add successful move to history with the color of the new vessel
            // Ensure we're using the COLORS object for consistency
            if (new_v.color === 'yellow') {
              moveHistory.push(COLORS.vesselYellow);
            } else if (new_v.color === 'green') {
              moveHistory.push(COLORS.vesselGreen);
            } else if (new_v.color === 'white') {
              moveHistory.push(COLORS.vesselBase);
            } else if (new_v.color === '#FF5252') {
              // Red counters have been removed
              // moveHistory.push(COLORS.vesselHint);
            } else {
              moveHistory.push(new_v.color); // Fallback to the actual color
            }
          }
          
          // Check if the game is won
          if (vessels.length === 1 && vessels[0].name === final_combination.name) {
            gameWon = true;
            triggerHapticFeedback('completion'); // Haptic feedback on game completion
          } else {
            // Trigger haptic feedback for successful combination
            triggerHapticFeedback('medium');
          }
        } else {
          // If new_v is null, it could mean one of two things:
          // 1. The combination failed
          // 2. The ingredients were added directly to the hint vessel
          
          // Check if the hint vessel has changed (ingredients were added)
          if (showingHint && hintVessel && hintVessel.collected.some(ing => 
              draggedVessel.ingredients.includes(ing) || overVessel.ingredients.includes(ing))) {
            // Ingredients were added to the hint vessel
            
            // Remove the vessels that were combined
            vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
            arrangeVessels();
            
            // Check if the hint is now complete
            if (hintVessel.isComplete()) {
              // Convert hint to regular vessel
              let newVessel = hintVessel.toVessel();
              vessels.push(newVessel);
              arrangeVessels();
              
              // Reset hint
              hintVessel = null;
              showingHint = false;
              
              // Check win condition
              if (vessels.length === 1 && vessels[0].name === final_combination.name) {
                gameWon = true;
                triggerHapticFeedback('completion'); // Haptic feedback on game completion
              }
            }
            
            // Trigger haptic feedback for successful combination
            triggerHapticFeedback('medium');
          } else {
            // Combination failed, snap back
            draggedVessel.snapBack();
            
            // Add unsuccessful move to history (black)
            moveHistory.push('black');
            triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
            
            // Trigger shake animation on both vessels
            draggedVessel.shake();
            overVessel.shake();
          }
        }
      } else if (overHintVessel) {
        combinationAttempted = true;
        // Trying to add to the hint vessel
        turnCounter++;
        
        let canAddToHint = false;
        
        // Check if it's a single ingredient
        if (draggedVessel.ingredients.length === 1) {
          let ingredientName = draggedVessel.ingredients[0];
          canAddToHint = hintVessel.addIngredient(ingredientName);
        } 
        // Check if it's a partial combination that matches one of the required ingredients
        else if (draggedVessel.name && hintVessel.required.includes(draggedVessel.name)) {
          canAddToHint = hintVessel.addIngredient(draggedVessel.name);
        }
        // Check if it's a yellow vessel with multiple ingredients that are all part of the hint
        else if (draggedVessel.ingredients.length > 0 && draggedVessel.ingredients.every(ing => hintVessel.required.includes(ing))) {
          // Check if we can add all ingredients to the hint
          canAddToHint = true;
          for (let ing of draggedVessel.ingredients) {
            if (hintVessel.collected.includes(ing)) {
              canAddToHint = false;
              break;
            }
          }
          
          // If we can add all ingredients, do so
          if (canAddToHint) {
            for (let ing of draggedVessel.ingredients) {
              hintVessel.addIngredient(ing);
            }
          }
        }
        
        if (canAddToHint) {
          // Create animation
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, hintVessel.x, hintVessel.y);
          
          // Remove the vessel
          vessels = vessels.filter(v => v !== draggedVessel);
          arrangeVessels();
          
          // Check if hint is complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            vessels.push(newVessel);
            arrangeVessels();
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
            
            // Check win condition
            if (vessels.length === 1 && vessels[0].name === final_combination.name) {
              gameWon = true;
              triggerHapticFeedback('completion'); // Haptic feedback on game completion
            }
          }
        } else {
          // Reset position if we can't add to hint
          draggedVessel.snapBack();
          
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
          
          // Trigger shake animation on both vessels
          draggedVessel.shake();
          hintVessel.shake();
        }
      }
      
      // If no combination was attempted at all, or if we're here for any other reason,
      // make sure the vessel snaps back to its original position
      if (!combinationAttempted) {
        // No vessel to combine with, snap back
        draggedVessel.snapBack();
        
        // Only add black counter and shake if the vessel was actually dragged
        // (not just clicked and released in the same spot)
        if (dist(draggedVessel.x, draggedVessel.y, draggedVessel.originalX, draggedVessel.originalY) > 10) {
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
          
          // Trigger shake animation on the dragged vessel
          draggedVessel.shake();
        }
      }
      
      // Ensure vessel is back in position and arrange vessels as a safety measure
      arrangeVessels();
      
      // Reset draggedVessel
      draggedVessel = null;
    }
    
    // Handle win screen touch interactions
    else if (gameWon && touches.length > 0) {
      let touchX = touches[0].x;
      let touchY = touches[0].y;
      
      // Check win screen buttons first
      if (shareButton && shareButton.isInside(touchX, touchY)) {
        shareScore();
        return false;
      }
      
      if (recipeButton && recipeButton.isInside(touchX, touchY)) {
        viewRecipe();
        return false;
      }
      
      // Fallback to the simplified approach
      // Top half of screen = recipe view
      if (touchY < height/2) {
        console.log("View Recipe triggered from touchEnded");
        viewRecipe();
        return false;
      }
      
      // Bottom half of screen = share score
      if (touchY >= height/2) {
        console.log("Share Score triggered from touchEnded");
        shareScore();
        return false;
      }
    }
    
    return false; // Prevent default
  }
  
  // Add touch move support for mobile devices
  function touchMoved() {
    // If we have a dragged vessel, update its position
    if (draggedVessel) {
      if (touches.length > 0) {
        let touchX = touches[0].x;
        let touchY = touches[0].y;
        
        // Update vessel position
        draggedVessel.x = touchX - offsetX;
        draggedVessel.y = touchY - offsetY;
        
        // Keep vessel within play area bounds
        draggedVessel.x = constrain(draggedVessel.x, playAreaX + draggedVessel.w/2, playAreaX + playAreaWidth - draggedVessel.w/2);
        draggedVessel.y = constrain(draggedVessel.y, playAreaY + draggedVessel.h/2, playAreaY + playAreaHeight - draggedVessel.h/2);
      }
    }
    // Update hover states for win screen elements
    else if (gameWon && touches.length > 0) {
      let touchX = touches[0].x;
      let touchY = touches[0].y;
      
      // Check win screen buttons
      if (shareButton) shareButton.checkHover(touchX, touchY);
      if (recipeButton) recipeButton.checkHover(touchX, touchY);
      
      // Top half of the screen = recipe card
      isMouseOverCard = (touchY < height/2);
      
      // Bottom half of the screen = letter score
      isMouseOverLetterScore = (touchY >= height/2);
      
      console.log("Updated hover states - card:", isMouseOverCard, "score:", isMouseOverLetterScore);
    }
    
    return false; // Prevent default
  }
  
  function isOnlyFinalComboRemaining() {
    // Case 1: Only the final dish remains
    if (vessels.length === 1 && vessels[0].name === final_combination.name) {
      return true;
    }
    
    // Case 2: All the required combinations for the final dish are present
    // Get all completed combinations
    let completedCombos = vessels
      .filter(v => v.name !== null)
      .map(v => v.name);
    
    // Also check for combinations that are part of partial combinations
    // These are combinations that are in the complete_combinations array of any vessel
    let partialCompletedCombos = [];
    vessels.forEach(v => {
      if (v.complete_combinations && v.complete_combinations.length > 0) {
        partialCompletedCombos.push(...v.complete_combinations);
      }
    });
    
    // Combine both lists to get all completed combinations
    let allCompletedCombos = [...new Set([...completedCombos, ...partialCompletedCombos])];
    
    // Check if all required combinations for the final dish are present
    // either as standalone vessels or as part of partial combinations
    let allFinalIngredientsPresent = final_combination.required.every(req => 
      allCompletedCombos.includes(req));
    
    // Check if only the required combinations for the final dish are present
    // (plus possibly some base ingredients that can't be used)
    let onlyFinalIngredientsRemain = true;
    for (let combo of completedCombos) {
      // If this is not a required ingredient for the final dish
      if (!final_combination.required.includes(combo)) {
        // And it's not a base ingredient (it's an intermediate combination)
        if (intermediate_combinations.some(ic => ic.name === combo)) {
          onlyFinalIngredientsRemain = false;
          break;
        }
      }
    }
    
    return allFinalIngredientsPresent && onlyFinalIngredientsRemain;
  }
  
  // Helper function to draw a star
  function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
  
  // Add isMouseOverCard variable at the top of the file with other global variables
  let isMouseOverCard = false;
  let isMouseOverLetterScore = false;
  