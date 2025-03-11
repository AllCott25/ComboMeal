// Culinary Logic Puzzle - Version v0.0603.01
// Created: March 6, 2025
// Last Updated: March 6, 2025

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
  
  // Play area constraints
  let maxPlayWidth = 400; // Max width for the play area (phone-sized)
  let playAreaPadding = 20; // Padding around the play area
  let playAreaX, playAreaY, playAreaWidth, playAreaHeight; // Will be calculated in setup
  
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
    }
    
    draw() {
      // Draw button
      rectMode(CENTER);
      if (this.hovered) {
        fill(lerpColor(color(this.color), color(255), 0.2));
      } else {
        fill(this.color);
      }
      stroke(0, 50);
      strokeWeight(3); // Increased line width for cartoony look
      rect(this.x, this.y, this.w, this.h, 8);
      
      // Draw label
      fill(this.textColor);
      noStroke();
      textAlign(CENTER, CENTER);
      textFont(buttonFont);
      textSize(16);
      text(this.label, this.x, this.y);
    }
    
    isInside(x, y) {
      return x > this.x - this.w/2 && x < this.x + this.w/2 && 
             y > this.y - this.h/2 && y < this.y + this.h/2;
    }
    
    checkHover(x, y) {
      this.hovered = this.isInside(x, y);
    }
    
    handleClick() {
      if (this.hovered) {
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
      else if (color === 'green') this.color = COLORS.vesselGreen;
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
    
    update() {
      // Scale animation only (removed floating animation)
      this.scale = lerp(this.scale, this.targetScale, 0.2);
      
      // Update verb display time
      if (this.verbDisplayTime > 0) {
        this.verbDisplayTime--;
      }
    }
    
    draw() {
      push();
      translate(this.x, this.y);
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
        } else if (this.color === 'green') {
          // Green vessel (pan with long handle)
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
    let vertical_margin = 10;
    
    // Calculate basic vessel width to fit exactly 3 per row with margins
    let basic_w = (playAreaWidth - (4 * margin)) / 3; // 3 vessels with margin on both sides
    let basic_h = basic_w * 0.8; // Maintain aspect ratio
    
    // Advanced vessels are twice as wide
    let advanced_w = basic_w * 2 + margin;
    let advanced_h = basic_h * 1.2;
    
    // Adjust margins for very small screens
    if (playAreaWidth < 300) {
      margin = 5;
      vertical_margin = 5;
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
            v.y = startY + rowIndex * (advanced_h + vertical_margin);
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
    
    // Set hint button position 20 pixels below the lowest vessel
    hintButtonY = lowestY + 20;
    
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
    
    // Draw title
    drawTitle();
    
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
    push();
    textFont(titleFont);
    textSize(48);
    textAlign(CENTER, CENTER);
    fill(COLORS.primary);
    noStroke(); // Ensure no stroke is applied to the text
    text("Combo Meal", width / 2, 60);
    
    textFont(bodyFont);
    textSize(16);
    fill(COLORS.text);
    noStroke(); // Ensure no stroke is applied to the text
    text("Reveal a new recipe every day!", width / 2, 100);
    pop();
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
    
    // Draw "How to play:" header - position relative to play area
    textAlign(CENTER);
    textSize(headerSize);
    fill('#333');
    text("How to play:", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.12);
    
    // Draw the three equations with more compact spacing
    // Position relative to play area
    drawTutorialEquation(1, "Grapes", "white", "Sugar", "white", "Jelly", "green", 
                        "Combine ingredients to make new ones!", 
                        playAreaY + playAreaHeight * 0.25, false, descriptionSize);
    
    drawTutorialEquation(2, "Jelly", "green", "Peanut Butter", "white", "Jelly + Peanut Butter", "yellow", 
                        "Partial combos turn yellow. Add more ingredients!", 
                        playAreaY + playAreaHeight * 0.45, false, descriptionSize);
    
    drawTutorialEquation(3, "Jelly + Peanut Butter", "yellow", "Potato Bread", "green", "PB&J Sandwich", "green", 
                        "Solve the recipe in as few moves as you can!", 
                        playAreaY + playAreaHeight * 0.65, true, descriptionSize);
    
    // Position start button relative to play area
    startButton.x = playAreaX + playAreaWidth/2;
    startButton.y = playAreaY + playAreaHeight * 0.85;
    startButton.draw();
    startButton.checkHover(mouseX, mouseY);
    
    // Draw version number at the very bottom
    push();
    textSize(8);
    fill(100, 100, 100, 180); // Semi-transparent gray
    text("v0.0603.01", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight - 5);
    pop();
  }
  
  // Function to draw tutorial equations
  function drawTutorialEquation(equationNum, leftName, leftColor, rightName, rightColor, resultName, resultColor, description, yPosition, showStarburst = false, descriptionSize = 16) {
    // Adjust vessel sizes based on play area width
    let vesselWidth = min(70, playAreaWidth * 0.15);
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
    
    // Draw left vessel
    drawTutorialVessel(leftX, yPosition, leftName, leftColor, vesselWidth, vesselHeight);
    
    // Draw plus sign
    textAlign(CENTER, CENTER);
    textSize(operatorSize);
    fill('#333');
    noStroke();
    text("+", operatorX1, yPosition);
    
    // Draw right vessel
    drawTutorialVessel(rightX, yPosition, rightName, rightColor, vesselWidth, vesselHeight);
    
    // Draw equals sign
    textAlign(CENTER, CENTER);
    textSize(operatorSize);
    fill('#333');
    noStroke();
    text("=", operatorX2, yPosition);
    
    // Draw result vessel with optional starburst
    if (showStarburst) {
      drawStarburst(resultX, yPosition);
    }
    drawTutorialVessel(resultX, yPosition, resultName, resultColor, vesselWidth, vesselHeight);
    
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
      fill(COLORS.vesselGreen); // Use the exact vessel color
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
    // Draw title
    drawTitle();
    
    // Center all content within the play area
    textAlign(CENTER, CENTER);
    
    // Draw "YOU MADE IT!" text
    textSize(36);
    fill('#333');
    text("YOU MADE IT!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.15);
    
    // Draw recipe name
    textSize(32);
    fill(COLORS.secondary);
    text(final_combination.name, playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.25);
    
    // Draw turn count with larger, more prominent display
    textSize(24);
    fill('#666');
    text("Completed in", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.35);
    
    // Draw turn counter in a circle
    let turnCircleSize = 70;
    fill(COLORS.primary);
    noStroke();
    circle(playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.45, turnCircleSize);
    
    // Draw turn number
    fill('white');
    textSize(32);
    text(turnCounter, playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.45);
    textSize(16);
    text("turns", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.45 + 25);
    
    // Draw move history with larger circles
    drawWinMoveHistory();
    
    // Position buttons at the bottom of the play area with proper spacing
    const buttonSpacing = 20;
    const buttonY = playAreaY + playAreaHeight * 0.9;
    
    // Update button positions
    shareButton.x = playAreaX + playAreaWidth/2 - shareButton.w - buttonSpacing/2;
    shareButton.y = buttonY;
    recipeButton.x = playAreaX + playAreaWidth/2 + buttonSpacing/2;
    recipeButton.y = buttonY;
    
    // Draw buttons
    shareButton.draw();
    recipeButton.draw();
    
    // Check button hover
    shareButton.checkHover(mouseX, mouseY);
    recipeButton.checkHover(mouseX, mouseY);
  }
  
  // Enhanced move history display for win screen
  function drawWinMoveHistory() {
    textAlign(CENTER);
    textSize(16);
    fill('black');
    text(`You solved it in ${moveHistory.length} moves!`, 
         playAreaX + playAreaWidth/2, 
         playAreaY + playAreaHeight * 0.55);
    
    const circleSize = 20; // Slightly smaller circles
    const margin = 8;
    const maxPerRow = Math.min(10, Math.floor(playAreaWidth / (circleSize + margin))); // Limit based on play area width
    const rowWidth = Math.min(moveHistory.length, maxPerRow) * (circleSize + margin) - margin;
    const startX = playAreaX + playAreaWidth/2 - rowWidth / 2;
    const startY = playAreaY + playAreaHeight * 0.6;
    
    // Calculate how many rows we need
    const numRows = Math.ceil(moveHistory.length / maxPerRow);
    
    // Ensure we don't overlap with buttons
    if (startY + numRows * (circleSize + margin) > playAreaY + playAreaHeight * 0.85) {
      // If we would overlap, reduce the circle size
      const reducedCircleSize = 15;
      const reducedMargin = 6;
      
      // Recalculate with smaller circles
      const reducedMaxPerRow = Math.min(12, Math.floor(playAreaWidth / (reducedCircleSize + reducedMargin)));
      const reducedRowWidth = Math.min(moveHistory.length, reducedMaxPerRow) * (reducedCircleSize + reducedMargin) - reducedMargin;
      const reducedStartX = playAreaX + playAreaWidth/2 - reducedRowWidth / 2;
      
      // Draw smaller circles
      for (let i = 0; i < moveHistory.length; i++) {
        const row = Math.floor(i / reducedMaxPerRow);
        const col = i % reducedMaxPerRow;
        const x = reducedStartX + col * (reducedCircleSize + reducedMargin);
        const y = startY + row * (reducedCircleSize + reducedMargin);
        
        // Check if this is an Easter Egg counter
        if (moveHistory[i] && typeof moveHistory[i] === 'object' && moveHistory[i].type === 'easterEgg') {
          // Draw the larger white circle first
          fill('white');
          stroke('black');
          strokeWeight(1);
          circle(x, y, reducedCircleSize * 1.3); // 30% larger than normal
          
          // Draw the inner yellow circle
          fill(moveHistory[i].color);
          stroke('black');
          strokeWeight(0.5);
          circle(x, y, reducedCircleSize * 0.8); // 80% of normal size
        } else {
          // Regular counter - Map color names to the exact COLORS values
          let circleColor;
          switch(moveHistory[i]) {
            case 'yellow':
              circleColor = COLORS.vesselYellow;
              break;
            case 'green':
              circleColor = COLORS.vesselGreen;
              break;
            case 'red':
            case '#FF5252':
              circleColor = COLORS.vesselHint;
              break;
            case 'white':
              circleColor = COLORS.vesselBase;
              break;
            case 'black':
              circleColor = '#333333'; // Keep black for unsuccessful moves
              break;
            default:
              circleColor = moveHistory[i]; // Use the original color if not matched
          }
          
          fill(circleColor);
          stroke('black');
          strokeWeight(1);
          circle(x, y, reducedCircleSize);
        }
      }
    } else {
      // Draw regular sized circles
    for (let i = 0; i < moveHistory.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const x = startX + col * (circleSize + margin);
      const y = startY + row * (circleSize + margin);
      
        // Check if this is an Easter Egg counter
        if (moveHistory[i] && typeof moveHistory[i] === 'object' && moveHistory[i].type === 'easterEgg') {
          // Draw the larger white circle first
          fill('white');
      stroke('black');
          strokeWeight(1);
          circle(x, y, circleSize * 1.3); // 30% larger than normal
          
          // Draw the inner yellow circle
          fill(moveHistory[i].color);
          stroke('black');
          strokeWeight(0.5);
          circle(x, y, circleSize * 0.8); // 80% of normal size
        } else {
          // Regular counter - Map color names to the exact COLORS values
          let circleColor;
          switch(moveHistory[i]) {
            case 'yellow':
              circleColor = COLORS.vesselYellow;
              break;
            case 'green':
              circleColor = COLORS.vesselGreen;
              break;
            case 'red':
            case '#FF5252':
              circleColor = COLORS.vesselHint;
              break;
            case 'white':
              circleColor = COLORS.vesselBase;
              break;
            case 'black':
              circleColor = '#333333'; // Keep black for unsuccessful moves
              break;
            default:
              circleColor = moveHistory[i]; // Use the original color if not matched
          }
          
          fill(circleColor);
          stroke('black');
          strokeWeight(1);
      circle(x, y, circleSize);
        }
      }
    }
  }
  
  // Keep the regular move history for during gameplay
  function drawMoveHistory() {
    if (moveHistory.length === 0) return;
    
    // Position the move history at the bottom of the play area
    const circleSize = 15;
    const margin = 8;
    const maxPerRow = 10; // Reduced from 15 to allow more rows
    const rowWidth = Math.min(moveHistory.length, maxPerRow) * (circleSize + margin) - margin;
    
    // Center horizontally within the play area
    const startX = playAreaX + (playAreaWidth / 2) - (rowWidth / 2);
    
    // Position the move history as a footer at the very bottom of the play area
    // This ensures it's well below the hint button and any vessels
    const moveHistoryY = playAreaY + playAreaHeight * 0.95;
    
    // Calculate how many rows we need
    const numRows = Math.ceil(moveHistory.length / maxPerRow);
    const totalHeight = numRows * (circleSize + margin) - margin;
    
    // Ensure we're within the play area
    if (moveHistoryY + totalHeight > playAreaY + playAreaHeight - 5) return;
    
    // Draw a subtle background for the move history
    fill(240, 240, 240, 100);
    noStroke();
    rectMode(CENTER);
    rect(playAreaX + playAreaWidth/2, moveHistoryY + totalHeight/2, 
         rowWidth + margin*2, totalHeight + margin*2, 5);
    
    for (let i = 0; i < moveHistory.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      
      const x = startX + col * (circleSize + margin);
      const y = moveHistoryY + row * (circleSize + margin);
      
      // Check if this is an Easter Egg counter (object with type property)
      if (moveHistory[i] && typeof moveHistory[i] === 'object' && moveHistory[i].type === 'easterEgg') {
        // Draw the larger white circle first
        fill('white');
      stroke('black');
      strokeWeight(1);
        circle(x, y, circleSize * 1.3); // 30% larger than normal
        
        // Draw the inner yellow circle
        fill(moveHistory[i].color);
        stroke('black');
        strokeWeight(0.5);
        circle(x, y, circleSize * 0.8); // 80% of normal size
      } else {
        // Regular counter - Map color names to the exact COLORS values
        let circleColor;
        switch(moveHistory[i]) {
          case 'yellow':
            circleColor = COLORS.vesselYellow;
            break;
          case 'green':
            circleColor = COLORS.vesselGreen;
            break;
          case 'red':
          case '#FF5252':
            circleColor = COLORS.vesselHint;
            break;
          case 'white':
            circleColor = COLORS.vesselBase;
            break;
          case 'black':
            circleColor = '#333333'; // Keep black for unsuccessful moves
            break;
          default:
            circleColor = moveHistory[i]; // Use the original color if not matched
        }
        
        fill(circleColor);
        stroke('black');
        strokeWeight(1);
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
      // Check buttons
      if (shareButton.isInside(mouseX, mouseY) || recipeButton.isInside(mouseX, mouseY)) {
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
      // Check if share button was clicked
      if (shareButton.isInside(mouseX, mouseY)) {
        shareButton.handleClick();
        return;
      }
      
      // Check if recipe button was clicked
      if (recipeButton.isInside(mouseX, mouseY)) {
        recipeButton.handleClick();
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
          moveHistory.push({ type: 'easterEgg', color: COLORS.vesselYellow });
          
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
              moveHistory.push(COLORS.vesselHint);
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
            moveHistory.push(COLORS.vesselYellow);
            
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
          
          // Add red move to history (not the original vessel color)
          moveHistory.push('#FF5252');
          
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
        }
      } else {
        draggedVessel.snapBack();
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
          
          // Create a temporary vessel just for the animation
          let tempVessel = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
          
          // Add all ingredients to the hint vessel
          for (let ing of U) {
            hintVessel.addIngredient(ing);
          }
          
          // Create animation from the temp vessel to the hint vessel
          createCombineAnimation(tempVessel.x, tempVessel.y, tempVessel.color, hintVessel.x, hintVessel.y);
          
          // Add red moves to history - one for each ingredient (or at least one if it was a combination)
          // This ensures we count the proper number of turns when adding multiple ingredients at once
          let numIngredientsAdded = Math.max(1, U.length);
          for (let j = 0; j < numIngredientsAdded; j++) {
            moveHistory.push('#FF5252');
          }
          
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
        // Only turn green if we have exactly the required ingredients (no extras)
        if (U.length === C.required.length && C.required.every(ing => U.includes(ing))) {
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
            new_v.color = 'green';
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
          new_v.color = 'green';
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
          new_v.color = 'green';
          
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
    // Create share text
    let shareText = `I made ${final_combination.name} in ${turnCounter} turns in Combo Meal! Can you beat my score?`;
    
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
  }
  
  function viewRecipe() {
    window.open(recipeUrl, '_blank');
  }
  
  function mouseMoved() {
    // Check if buttons exist before trying to use them
    if (!gameStarted && startButton) {
      startButton.checkHover(mouseX, mouseY);
    }
    
    if (gameStarted) {
      // Only check these buttons if they exist and the game has started
      if (shareButton) shareButton.checkHover(mouseX, mouseY);
      if (recipeButton) recipeButton.checkHover(mouseX, mouseY);
      if (hintButton) hintButton.checkHover(mouseX, mouseY);
    }
  }
  
  // Function to show a hint
  function showHint() {
    if (!showingHint && !gameWon) {
      // Find combinations that haven't been completed yet
      let completedCombos = vessels
        .filter(v => v.name !== null)
        .map(v => v.name);
      
      // Get all ingredients currently visible on the board
      let visibleIngredients = [];
      vessels.forEach(v => {
        visibleIngredients.push(...v.ingredients);
      });
      
      console.log("Visible ingredients on board:", visibleIngredients);
      
      // Calculate which combinations can be made with visible ingredients
      let possibleCombos = [];
      
      // Check all intermediate combinations that aren't completed yet
      let availableCombos = intermediate_combinations.filter(combo => 
        !completedCombos.includes(combo.name));
      
      // If all intermediate combinations are done, check final combination
      if (availableCombos.length === 0 && !completedCombos.includes(final_combination.name)) {
        availableCombos = [final_combination];
      }
      
      // For each available combination, calculate what percentage of its ingredients are visible
      availableCombos.forEach(combo => {
        let requiredCount = combo.required.length;
        let availableCount = 0;
        
        // Count how many required ingredients are visible on the board
        combo.required.forEach(ing => {
          if (visibleIngredients.includes(ing)) {
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
            for (let j = 0; j < ingredientsAdded; j++) {
              // Use the string '#FF5252' instead of COLORS.vesselHint to ensure compatibility with drawMoveHistory
              moveHistory.push('#FF5252');
            }
            
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
            for (let j = 0; j < numIngredientsAdded; j++) {
              moveHistory.push('#FF5252');
            }
            
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
        // Check if buttons were touched
        if (shareButton.isInside(touchX, touchY)) {
          shareScore();
          return false;
        }
        if (recipeButton.isInside(touchX, touchY)) {
          viewRecipe();
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
    
    // Set hint button position 20 pixels below the lowest vessel
    hintButtonY = lowestY + 20;
    
    // Adjust button sizes based on play area width
    let buttonWidth = min(120, playAreaWidth * 0.25);
    let buttonHeight = min(40, buttonWidth * 0.4);
    let startButtonWidth = min(180, playAreaWidth * 0.4);
    let startButtonHeight = min(60, startButtonWidth * 0.33);
    
    // Create share and recipe buttons - position relative to play area
    shareButton = new Button(
      playAreaX + playAreaWidth * 0.35, 
      playAreaY + playAreaHeight * 0.85, 
      buttonWidth, 
      buttonHeight, 
      "Share Score", 
      shareScore
    );
    
    recipeButton = new Button(
      playAreaX + playAreaWidth * 0.65, 
      playAreaY + playAreaHeight * 0.85, 
      buttonWidth, 
      buttonHeight, 
      "View Recipe", 
      viewRecipe
    );
    
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
    const flowerSpacing = 40; // Increased from 30 for larger pattern
    const petalSize = 6; // Increased from 4 for larger flowers
    
    // Calculate the available space on each side
    const leftSpace = playAreaX;
    const rightSpace = windowWidth - (playAreaX + playAreaWidth);
    
    // Calculate how many flowers can fit on each side
    const leftColumns = Math.floor(leftSpace / flowerSpacing);
    const rightColumns = Math.floor(rightSpace / flowerSpacing);
    
    // Calculate starting positions to center the pattern on each side
    const leftStart = playAreaX - (leftColumns * flowerSpacing);
    const rightStart = playAreaX + playAreaWidth;
    
    // Draw on the left side (from left edge to play area)
    for (let x = leftStart + flowerSpacing/2; x < playAreaX; x += flowerSpacing) {
      for (let y = flowerSpacing/2; y < height - flowerSpacing/2; y += flowerSpacing) {
        // Alternate between different colors for variety
        if ((x + y) % (flowerSpacing * 3) < flowerSpacing) {
          drawFlower(x, y, petalSize, COLORS.primary); // Green
        } else if ((x + y) % (flowerSpacing * 3) < flowerSpacing * 2) {
          drawFlower(x, y, petalSize, COLORS.secondary); // Red/Orange
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary); // Yellow
        }
      }
    }
    
    // Draw on the right side (from play area to right edge)
    for (let x = rightStart; x < rightStart + (rightColumns * flowerSpacing); x += flowerSpacing) {
      for (let y = flowerSpacing/2; y < height - flowerSpacing/2; y += flowerSpacing) {
        // Alternate between different colors for variety
        if ((x + y) % (flowerSpacing * 3) < flowerSpacing) {
          drawFlower(x, y, petalSize, COLORS.primary); // Green
        } else if ((x + y) % (flowerSpacing * 3) < flowerSpacing * 2) {
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
      
      // Define small splatter droplets
      splatters: [
        { x: random(-0.8, 0.8), y: random(-0.8, 0.8), size: random(8, 15) },
        { x: random(-0.8, 0.8), y: random(-0.8, 0.8), size: random(8, 15) },
        { x: random(-0.8, 0.8), y: random(-0.8, 0.8), size: random(8, 15) },
        { x: random(-0.8, 0.8), y: random(-0.8, 0.8), size: random(5, 10) },
        { x: random(-0.8, 0.8), y: random(-0.8, 0.8), size: random(5, 10) }
      ],
      
      draw: function() {
        if (!this.active) return;
        
        push();
        // Semi-transparent overlay for the entire canvas
        rectMode(CORNER);
        fill(0, 0, 0, 100);
        noStroke();
        rect(0, 0, width, height);
        
        // Draw egg white (simple, rounded splat shape)
        fill(255, 255, 255, 240);
        noStroke();
        
        // Draw the main egg white blob (simple, rounded shape)
        push();
        translate(this.x, this.y);
        
        // Main circular base
        const baseRadius = this.radius * 1.8;
        ellipse(0, 0, baseRadius * 2, baseRadius * 2);
        
        // Add 5-7 rounded gloops around the main circle
        // Bottom drip (longer)
        const bottomDripWidth = baseRadius * 0.7;
        const bottomDripHeight = baseRadius * 1.5;
        const bottomDripY = baseRadius * 0.8;
        
        // Draw the bottom drip with rounded corners
        rectMode(CENTER);
        rect(0, bottomDripY, bottomDripWidth, bottomDripHeight, 
             bottomDripWidth/2, bottomDripWidth/2, bottomDripWidth/2, bottomDripWidth/2);
        
        // Add a circle at the bottom of the drip for a rounded end
        ellipse(0, bottomDripY + bottomDripHeight/2, bottomDripWidth, bottomDripWidth);
        
        // Add 4-6 more rounded gloops around the circle
        // Top-right gloop
        const tr = {
          x: baseRadius * 0.6,
          y: -baseRadius * 0.6,
          width: baseRadius * 0.6,
          height: baseRadius * 0.8
        };
        push();
        translate(tr.x, tr.y);
        rotate(PI/4); // Rotate to point outward
        rect(0, 0, tr.width, tr.height, tr.width/2);
        ellipse(0, tr.height/2 - tr.width/4, tr.width, tr.width);
        pop();
        
        // Top-left gloop
        const tl = {
          x: -baseRadius * 0.6,
          y: -baseRadius * 0.6,
          width: baseRadius * 0.5,
          height: baseRadius * 0.7
        };
        push();
        translate(tl.x, tl.y);
        rotate(-PI/4); // Rotate to point outward
        rect(0, 0, tl.width, tl.height, tl.width/2);
        ellipse(0, tl.height/2 - tl.width/4, tl.width, tl.width);
        pop();
        
        // Right gloop
        const right = {
          x: baseRadius * 0.8,
          y: baseRadius * 0.1,
          width: baseRadius * 0.5,
          height: baseRadius * 0.6
        };
        push();
        translate(right.x, right.y);
        rotate(PI/2.5); // Rotate to point outward
        rect(0, 0, right.width, right.height, right.width/2);
        ellipse(0, right.height/2 - right.width/4, right.width, right.width);
        pop();
        
        // Left gloop
        const left = {
          x: -baseRadius * 0.8,
          y: baseRadius * 0.1,
          width: baseRadius * 0.5,
          height: baseRadius * 0.6
        };
        push();
        translate(left.x, left.y);
        rotate(-PI/2.5); // Rotate to point outward
        rect(0, 0, left.width, left.height, left.width/2);
        ellipse(0, left.height/2 - left.width/4, left.width, left.width);
        pop();
        
        // Bottom-right small gloop
        const br = {
          x: baseRadius * 0.4,
          y: baseRadius * 0.7,
          size: baseRadius * 0.4
        };
        ellipse(br.x, br.y, br.size, br.size);
        
        // Bottom-left small gloop
        const bl = {
          x: -baseRadius * 0.4,
          y: baseRadius * 0.7,
          size: baseRadius * 0.4
        };
        ellipse(bl.x, bl.y, bl.size, bl.size);
        
        pop(); // End of egg white drawing
        
        // Draw small splatter droplets
        fill(255, 255, 255, 240);
        noStroke();
        for (let splat of this.splatters) {
          const x = this.x + this.radius * 3 * splat.x;
          const y = this.y + this.radius * 3 * splat.y;
          circle(x, y, splat.size);
        }
        
        // Draw yellow yolk (circular dialogue)
        // Add a subtle gradient to the yolk
        for (let i = 10; i >= 0; i--) {
          const yolkSize = this.radius * 2 * (1 - i * 0.03);
          const alpha = 255 - i * 10;
          fill(255, 204, 0, alpha); // Bright egg yolk yellow with gradient
          noStroke();
          circle(this.x, this.y, yolkSize);
        }
        
        // Add highlight to the yolk
        fill(255, 255, 255, 100);
        noStroke();
        ellipse(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.7, this.radius * 0.5);
        
        // Add a thin outline to the yolk
        noFill();
        stroke(200, 150, 0, 100);
        strokeWeight(1);
        circle(this.x, this.y, this.radius * 2);
        
        // Close button (x)
        fill(255);
        stroke(0);
        strokeWeight(1);
        const closeButtonSize = 20; // Smaller close button
        circle(this.x + this.radius * 0.7, this.y - this.radius * 0.7, closeButtonSize);
        
        // X mark
        stroke(0);
        strokeWeight(1.5);
        const xOffset = 6; // Smaller x mark
        line(this.x + this.radius * 0.7 - xOffset, this.y - this.radius * 0.7 - xOffset, 
             this.x + this.radius * 0.7 + xOffset, this.y - this.radius * 0.7 + xOffset);
        line(this.x + this.radius * 0.7 - xOffset, this.y - this.radius * 0.7 + xOffset, 
             this.x + this.radius * 0.7 + xOffset, this.y - this.radius * 0.7 - xOffset);
        
        // "You found the egg!" text
        fill(0);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12); // Smaller text
        textStyle(NORMAL);
        text("You found the egg!", this.x, this.y - this.radius * 0.4);
        
        // Easter egg name
        textSize(20); // Smaller text
        textStyle(BOLD);
        text(egg.name, this.x, this.y);
        
        // "Keep going!" text
        textSize(12); // Smaller text
        textStyle(NORMAL);
        text("Keep going!", this.x, this.y + this.radius * 0.4);
        
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
  
  // Add touch release support for mobile devices
  function touchEnded() {
    // If we have a dragged vessel, handle the release
    if (draggedVessel) {
      // Find the vessel under the touch point
      let touchX = touches.length > 0 ? touches[0].x : mouseX;
      let touchY = touches.length > 0 ? touches[0].y : mouseY;
      
      let overVessel = null;
      for (let v of vessels) {
        if (v !== draggedVessel && v.isInside(touchX, touchY)) {
          overVessel = v;
          break;
        }
      }
      
      // If we found a vessel to combine with
      if (overVessel) {
        // Check for easter eggs before combining
        const easterEgg = checkForEasterEgg([...new Set([...draggedVessel.ingredients, ...overVessel.ingredients])]);
        if (easterEgg) {
          // Easter egg was found
          // Add a special move to history with a marker to indicate it's an Easter Egg
          moveHistory.push({ type: 'easterEgg', color: COLORS.vesselYellow });
          
          // Update the turn counter
          updateTurnCounter();
          
          // Play sound
          playSound('easterEgg');
          
          // Display the easter egg modal
          displayEasterEgg(easterEgg, draggedVessel, overVessel);
          
          // Set draggedVessel to null to prevent further interaction until modal is closed
          draggedVessel = null;
          return false;
        }
        
        // If not an easter egg, proceed with normal combination
        let newVessel = combineVessels(draggedVessel, overVessel);
        
        if (newVessel) {
          // Remove the original vessels
          vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
          
          // Add the new vessel
          vessels.push(newVessel);
          
          // Add a move to history
          moveHistory.push(1);
          
          // Update the turn counter
          updateTurnCounter();
          
          // Play sound
          playSound('combine');
          
          // Check if we've won
          if (newVessel.isFinalDish) {
            gameWon = true;
            playSound('win');
          }
          
          // Rearrange vessels
          arrangeVessels();
        } else {
          // Snap back to original position
          draggedVessel.x = draggedVessel.originalX;
          draggedVessel.y = draggedVessel.originalY;
          
          // Play error sound
          playSound('error');
        }
      } else {
        // Snap back to original position
        draggedVessel.x = draggedVessel.originalX;
        draggedVessel.y = draggedVessel.originalY;
      }
      
      // Reset scale
      draggedVessel.targetScale = 1.0;
      
      // Clear dragged vessel
      draggedVessel = null;
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
    
    return false; // Prevent default
  }
  