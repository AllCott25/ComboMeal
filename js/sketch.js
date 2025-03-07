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
    }
    
    draw() {
      push();
      translate(this.x, this.y);
      scale(this.scale);
      
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
        fill(this.color);
        stroke('black');
        strokeWeight(3);
        
        // Draw vessel body (3:2 rectangle with rounded corners ONLY at the bottom)
        rectMode(CENTER);
        rect(0, 0, this.w * 0.8, this.h * 0.6, 0, 0, 10, 10);
        
      } else {
        // Basic ingredient vessel (rectangle with extremely rounded bottom corners)
        fill(this.color);
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
      
      // Calculate text position to be inside the vessel
      let displayText = this.getDisplayText();
      let lines = splitTextIntoLines(displayText, this.w * 0.7);
      
      for (let i = 0; i < lines.length; i++) {
        let yOffset = (i - (lines.length - 1) / 2) * 15;
        // Position text slightly higher in the vessel
        text(lines[i], 0, yOffset - this.h * 0.1);
      }
      
      pop();
    }
    
    pulse() {
      this.targetScale = 1.2;
      setTimeout(() => { this.targetScale = 1; }, 300);
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
      console.log("Loading recipe data from Supabase...");
      const recipeData = await fetchTodayRecipe();
      
      if (recipeData) {
        // Update game variables with recipe data
        intermediate_combinations = recipeData.intermediateCombinations;
        final_combination = recipeData.finalCombination;
        ingredients = recipeData.baseIngredients;
        recipeUrl = recipeData.recipeUrl;
        
        console.log("Recipe data loaded successfully");
        isLoadingRecipe = false;
      } else {
        throw new Error("Failed to process recipe data");
      }
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
    background(COLORS.background);
    
    // Draw the floral pattern border
    drawFloralBorder();
    
    // Ensure no stroke for all text elements
    noStroke();
    
    // Check if we're still loading recipe data
    if (isLoadingRecipe) {
      // Display loading screen
      textAlign(CENTER, CENTER);
      textSize(24);
      fill(0);
      text("Loading today's recipe...", width/2, height/2);
      
      // Display current time in EST for debugging
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
      fill('white');
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
      fill(COLORS.tertiary); // Mustard yellow
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
      fill(COLORS.primary); // Avocado green
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
    
    // Split text into lines if needed
    let lines = splitTextIntoLines(name, vesselWidth * 0.7);
    for (let i = 0; i < lines.length; i++) {
      let yOffset = (i - (lines.length - 1) / 2) * 15;
      text(lines[i], 0, yOffset);
    }
    
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
        
        // Use the exact same colors as the vessels
        let circleColor;
        if (moveHistory[i] === 'white') {
          circleColor = COLORS.vesselBase; // Use vesselBase instead of white
        } else if (moveHistory[i] === 'yellow') {
          circleColor = COLORS.tertiary; // Use tertiary (mustard yellow) instead of yellow
        } else if (moveHistory[i] === 'green') {
          circleColor = COLORS.primary; // Use primary (avocado green) instead of green
        } else if (moveHistory[i] === 'black') {
          circleColor = COLORS.text; // Use text color instead of black
        } else {
          circleColor = moveHistory[i]; // Use the original color if it's not one of the above
        }
        
        fill(circleColor);
        noStroke();
        circle(x, y, reducedCircleSize);
      }
    } else {
      // Draw regular sized circles
      for (let i = 0; i < moveHistory.length; i++) {
        const row = Math.floor(i / maxPerRow);
        const col = i % maxPerRow;
        const x = startX + col * (circleSize + margin);
        const y = startY + row * (circleSize + margin);
        
        // Use the exact same colors as the vessels
        let circleColor;
        if (moveHistory[i] === 'white') {
          circleColor = COLORS.vesselBase; // Use vesselBase instead of white
        } else if (moveHistory[i] === 'yellow') {
          circleColor = COLORS.tertiary; // Use tertiary (mustard yellow) instead of yellow
        } else if (moveHistory[i] === 'green') {
          circleColor = COLORS.primary; // Use primary (avocado green) instead of green
        } else if (moveHistory[i] === 'black') {
          circleColor = COLORS.text; // Use text color instead of black
        } else {
          circleColor = moveHistory[i]; // Use the original color if it's not one of the above
        }
        
        fill(circleColor);
        noStroke();
        circle(x, y, circleSize);
      }
    }
  }
  
  // Keep the regular move history for during gameplay
  function drawMoveHistory() {
    if (moveHistory.length === 0) return;
    
    // Position the move history as a footer at the very bottom of the play area
    const circleSize = 15;
    const margin = 8;
    const maxPerRow = 10; // Reduced from 15 to allow more rows
    const rowWidth = Math.min(moveHistory.length, maxPerRow) * (circleSize + margin) - margin;
    
    // Center horizontally within the play area
    const startX = playAreaX + (playAreaWidth / 2) - (rowWidth / 2);
    
    // Position the move history at the very bottom of the play area (footer)
    // Leave just enough space for the circles and a small margin
    const moveHistoryY = playAreaY + playAreaHeight - (Math.ceil(moveHistory.length / maxPerRow) * (circleSize + margin)) - 10;
    
    // Calculate how many rows we need
    const numRows = Math.ceil(moveHistory.length / maxPerRow);
    const totalHeight = numRows * (circleSize + margin) - margin;
    
    // Ensure we're within the play area
    if (moveHistoryY < playAreaY) return;
    
    for (let i = 0; i < moveHistory.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      
      const x = startX + col * (circleSize + margin);
      const y = moveHistoryY + row * (circleSize + margin);
      
      // Use the exact same colors as the vessels
      let circleColor;
      if (moveHistory[i] === 'white') {
        circleColor = COLORS.vesselBase; // Use vesselBase instead of white
      } else if (moveHistory[i] === 'yellow') {
        circleColor = COLORS.tertiary; // Use tertiary (mustard yellow) instead of yellow
      } else if (moveHistory[i] === 'green') {
        circleColor = COLORS.primary; // Use primary (avocado green) instead of green
      } else if (moveHistory[i] === 'black') {
        circleColor = COLORS.text; // Use text color instead of black
      } else {
        circleColor = moveHistory[i]; // Use the original color if it's not one of the above
      }
      
      fill(circleColor);
      noStroke();
      circle(x, y, circleSize);
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
    if (!gameStarted) {
      // Check if start button was clicked
      if (startButton.isInside(mouseX, mouseY)) {
        startButton.handleClick();
        return;
      }
    } else if (gameWon) {
      // Check if buttons were clicked
      if (shareButton.handleClick() || recipeButton.handleClick()) {
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
            moveHistory.push(new_v.color);
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
          // Combination failed, snap back
          draggedVessel.snapBack();
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
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
    
    // Log the vessels being combined for debugging
    console.log(`Combining vessels: 
      Vessel 1: ${v1.name || 'unnamed'} (${v1.color}), 
      ingredients: [${v1.ingredients.join(', ')}], 
      combinations: [${v1.complete_combinations.join(', ')}]
      Vessel 2: ${v2.name || 'unnamed'} (${v2.color}), 
      ingredients: [${v2.ingredients.join(', ')}], 
      combinations: [${v2.complete_combinations.join(', ')}]`);
    
    // Case 1: Both vessels are base ingredients (white vessels)
    if (v1.ingredients.length > 0 && v2.ingredients.length > 0 && v1.complete_combinations.length === 0 && v2.complete_combinations.length === 0) {
      let U = [...new Set([...v1.ingredients, ...v2.ingredients])];
      
      // Special handling for hint: If all ingredients are part of the hint, create a yellow vessel
      // This will be detected by checkForMatchingVessels and added to the hint vessel
      if (hintActive) {
        // Check if all ingredients are required for the hint
        let allIngredientsInHint = U.every(ing => hintVessel.required.includes(ing));
        
        // Check if any of these ingredients are already collected in the hint
        let anyAlreadyCollected = U.some(ing => hintVessel.collected.includes(ing));
        
        // If all ingredients are part of the hint and none are already collected,
        // create a yellow vessel that will be detected by checkForMatchingVessels
        if (allIngredientsInHint && !anyAlreadyCollected) {
          console.log(`Creating yellow vessel for hint with ingredients: ${U.join(', ')}`);
          let new_v = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
          return new_v;
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
      
      console.log(`Combining completed combinations: ${U.join(', ')}`);
      console.log(`Final combination requires: ${final_combination.required.join(', ')}`);
      
      // Check if the combined set contains valid components for the final combination
      let validComponents = U.filter(name => final_combination.required.includes(name));
      console.log(`Valid components found: ${validComponents.join(', ')}`);
      
      if (validComponents.length > 0) {
        let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        
        // Check if we have all required components for the final combination
        let hasAllComponents = final_combination.required.every(name => U.includes(name));
        console.log(`Has all components for final recipe: ${hasAllComponents}`);
        
        if (hasAllComponents) {
          new_v.name = final_combination.name;
          new_v.color = 'green';
          new_v.complete_combinations = []; // Clear since this is the final combination
          console.log(`Created green vessel for final combination ${final_combination.name}`);
        } else {
          console.log(`Created yellow vessel with combinations: ${U.join(', ')}`);
          console.log(`Missing combinations for ${final_combination.name}: ${final_combination.required.filter(name => !U.includes(name)).join(', ')}`);
        }
        return new_v;
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
      
      console.log(`Mixing base ingredients [${baseIngredients.join(', ')}] with combinations [${completedCombos.join(', ')}]`);
      
      // Check if any base ingredient is directly required in the final combination
      let baseInFinal = baseIngredients.some(ing => final_combination.required.includes(ing));
      
      // Check if any completed combo is required in the final combination
      let comboInFinal = completedCombos.some(combo => final_combination.required.includes(combo));
      
      console.log(`Base in final: ${baseInFinal}, Combo in final: ${comboInFinal}`);
      
      // If either the base ingredient or the combo is part of the final recipe, proceed
      if (baseInFinal || comboInFinal) {
        // Create a combined set of all components (both base ingredients and completed combos)
        let allComponents = [...baseIngredients, ...completedCombos];
        
        // Create a yellow vessel for the partial combination
        let new_v = new Vessel([], allComponents, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        
        // Check if we have all required components for the final combination
        let hasAllComponents = final_combination.required.every(name => allComponents.includes(name));
        console.log(`Has all components for final recipe: ${hasAllComponents}`);
        
        if (hasAllComponents) {
          new_v.name = final_combination.name;
          new_v.color = 'green';
          console.log(`Created green vessel for final combination ${final_combination.name}`);
        } else {
          console.log(`Created yellow vessel with mixed components: ${allComponents.join(', ')}`);
          console.log(`Missing components for ${final_combination.name}: ${final_combination.required.filter(name => !allComponents.includes(name)).join(', ')}`);
        }
        
        return new_v;
      }
    }
    
    // If we reach here, the combination is not valid
    console.log("Invalid combination, no vessel created");
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
      
      // Find partial combinations that exist in vessels
      let partialCombos = [];
      for (let v of vessels) {
        if (v.ingredients.length > 0 && v.name === null) {
          // This is a partial combination (yellow vessel without a name)
          for (let combo of intermediate_combinations) {
            // Check if this partial combination is working toward a specific combo
            if (v.ingredients.every(ing => combo.required.includes(ing))) {
              partialCombos.push(combo.name);
            }
          }
        }
      }
      
      // First check intermediate combinations that aren't partial or completed
      let availableCombos = intermediate_combinations.filter(combo => 
        !completedCombos.includes(combo.name) && !partialCombos.includes(combo.name));
      
      // If no non-partial combos are available, then allow partial combos
      if (availableCombos.length === 0) {
        availableCombos = intermediate_combinations.filter(combo => 
          !completedCombos.includes(combo.name));
      }
      
      // If all intermediate combinations are done, check final combination
      if (availableCombos.length === 0 && !completedCombos.includes(final_combination.name)) {
        availableCombos = [final_combination];
      }
      
      // If there are available combinations, show a hint
      if (availableCombos.length > 0) {
        // Choose a random combination to hint
        let combo = availableCombos[Math.floor(Math.random() * availableCombos.length)];
        hintVessel = new HintVessel(combo);
        showingHint = true;
        
        // Check if any existing yellow vessels match ingredients needed for this hint
        checkForMatchingVessels();
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
      
      console.log(`Touch started at ${touchX}, ${touchY}`);
      
      // Handle the same logic as mousePressed but with touch coordinates
      if (!gameStarted) {
        // Check if start button was touched
        if (startButton.isInside(touchX, touchY)) {
          startButton.handleClick();
          return false;
        }
      } else if (gameWon) {
        // Check if buttons were touched
        if (shareButton.isInside(touchX, touchY)) {
          shareButton.handleClick();
          return false;
        }
        if (recipeButton.isInside(touchX, touchY)) {
          recipeButton.handleClick();
          return false;
        }
      } else {
        // Check if hint button was touched
        if (!showingHint && hintButton && hintButton.isInside(touchX, touchY)) {
          console.log("Hint button touched");
          showHint(); // Directly call showHint instead of using handleClick
          triggerHapticFeedback('success');
          return false;
        }
        
        // Check if a vessel was touched
        for (let v of vessels) {
          if (v.isInside(touchX, touchY)) {
            draggedVessel = v;
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
  
  // Add touch moved handler for dragging vessels
  function touchMoved() {
    if (draggedVessel) {
      if (touches.length > 0) {
        let touchX = touches[0].x;
        let touchY = touches[0].y;
        
        draggedVessel.x = touchX - offsetX;
        draggedVessel.y = touchY - offsetY;
      }
      return false; // Prevent default
    }
    return true;
  }
  
  // Add touch ended handler for dropping vessels
  function touchEnded() {
    if (draggedVessel) {
      draggedVessel.targetScale = 1; // Reset scale
      
      let overVessel = null;
      let overVesselIndex = -1;
      let overHintVessel = false;
      
      if (touches.length > 0) {
        let touchX = touches[0].x;
        let touchY = touches[0].y;
        
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
      }
      
      // Process the same logic as mouseReleased
      if (overVessel) {
        // Regular vessel combination
        // Increment turn counter
        turnCounter++;
        
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
            moveHistory.push(new_v.color);
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
          // Combination failed, snap back
          draggedVessel.snapBack();
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
        }
      } else if (overHintVessel) {
        // Try to add the dragged vessel to the hint
        if (hintVessel.addIngredient(draggedVessel)) {
          // Successfully added to hint
          // Remove the vessel that was added to the hint
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
      
      draggedVessel = null;
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
