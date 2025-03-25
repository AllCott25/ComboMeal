/*
 * Culinary Logic Puzzle v0.0323.10
 * Created by Ben Alpert
 * Last Updated: March 23, 2025 (13:45 EDT) by APlasker
 *
 * A daily culinary logic puzzle game where players combine ingredients
 * according to recipe logic to create a final dish.
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
  
  // Game state variables
  let gameState = "start"; // start, tutorial, playing, win
  let vessels = [];
  let columns = []; // All vessels in each column (for checking combinations)
  let draggedVessel = null;
  let offsetX = 0; 
  let offsetY = 0;
  let moveCount = 0;
  let moveHistory = [];
  let displayedVessels = []; // Track all vessels to display
  let usedIngredients = new Set(); // Track ingredients used in combinations
  let combine_animations = [];
  let playingTime = 0;
  let startTime = 0;
  let tutorialStep = 1;
  let tutorialVessels = [];
  let startButton;
  let continueButton;
  let skipTutorialButton;
  let showingHint = false;
  let hintVessel = null;
  let lastHintCombo = null;
  let hintButton;
  let isMobile = false;
  let hintButtonY; // Position of the hint button 
  let initialHintButtonY; // New variable to store the initial hint button position
  let preferredVessel = null;
  let highlightedVessel = null;
  let flowerRotation = 0;
  let eggModals = [];
  
  // Store these vessel dimensions globally for consistent calculations
  let basic_w, basic_h, vertical_margin;
  
  // Extract all individual ingredients (will be replaced with data from Supabase)
  let ingredients = [...new Set(intermediate_combinations.flatMap(c => c.required))];
  
  // Global variables
  let gameWon = false;
  let turnCounter = 0;
  let animations = []; // Array to store active animations
  let titleFont, bodyFont, buttonFont;
  let recipeUrl = "https://www.bonappetit.com/recipe/chicken-parm"; // Will be replaced with data from Supabase
  let isLoadingRecipe = true; // Flag to track if we're still loading recipe data
  let loadingError = false; // Flag to track if there was an error loading recipe data
  let recipeDescription = "A delicious recipe that's sure to please everyone at the table!"; // New variable to store recipe description
  let recipeAuthor = ""; // New variable to store recipe author
  let hintCount = 0; // Track number of hints used
  let isAPlus = false; // Whether the player earned an A+ grade
  let letterGrade; // Player's letter grade (A, B, C, X)
  
  // Global variables for score display and interaction
  let scoreX, scoreY, scoreWidth, scoreHeight;
  let isMouseOverLetterScore = false;
  let recipe_data; // Global variable for recipe data
  
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
    vesselHint: '#D96941',    // Burnt orange for hint vessels
    green: '#778F5D'          // Explicit avocado green for all green elements
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
      // Calculate relative values for visual elements
      const cornerRadius = Math.max(this.w * 0.06, 4); // Border radius as 6% of width, min 4px
      const strokeW = Math.max(this.w * 0.025, 2); // Stroke weight as 2.5% of width, min 2px
      
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
      strokeWeight(strokeW); // Relative stroke weight
      rect(this.x, this.y, this.w, this.h, cornerRadius);
      
      // Calculate font size relative to button height (smaller proportion)
      const fontSize = Math.max(this.h * 0.3, 14); // 30% of button height, minimum 14px
      textSize(fontSize);
      
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
      
      // Position the hint vessel at the same position as the hint button
      this.x = width * 0.5; // Center horizontally
      
      // Use the fixed initial hint button position
      this.y = initialHintButtonY;
      
      // Standard hint vessel dimensions
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
      // Calculate appropriate vessel dimensions based on play area size
      const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
      const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
      
      let v = new Vessel([], [], this.name, COLORS.vesselHint, this.x, this.y, vesselWidth, vesselHeight);
      v.isAdvanced = true; // Mark as advanced for proper rendering
      v.pulse();
      
      // Add to completedGreenVessels with isHint flag - APlasker
      if (!completedGreenVessels.some(vessel => vessel.name === this.name)) {
        completedGreenVessels.push({name: this.name, isHint: true});
      }
      
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
      else if (color === 'green') this.color = COLORS.green; // Use our explicit green color
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
      
      // Calculate stroke weight relative to vessel size, with minimum value
      const strokeW = Math.max(this.w * 0.015, 2); // 1.5% of width, minimum 2px
      
      if (this.isAdvanced) {
        // Advanced vessel (pot or pan based on color)
        
        if (this.color === '#FF5252') {
          // Red vessel (pot with two handles)
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(strokeW);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          const handleSize = this.h * 0.2;
          circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
          circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
        } else if (this.color === COLORS.green || this.color === 'green' || this.color === COLORS.vesselGreen || this.color === COLORS.primary) {
          // Green vessel (pan with long handle) - standardized for all green vessels
          // Draw handle BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(strokeW);
          rectMode(CENTER);
          // Draw handle as thin horizontal rectangle
          const handleCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px
          rect(this.w * 0.6, -this.h * 0.2, this.w * 0.5, this.h * 0.15, handleCornerRadius);
        } else if (this.color === 'yellow') {
          // Yellow vessel (pot with two handles like the red vessel)
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(strokeW);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          const handleSize = this.h * 0.2;
          circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
          circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
        }
        
        // Draw vessel body
        fill(vesselColor);
        stroke('black');
        strokeWeight(strokeW);
        
        // Calculate border radius to match basic vessels
        const topCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px for top corners
        const bottomCornerRadius = Math.max(this.h * 0.3, 15); // 30% of height, min 15px for bottom corners
        
        // Draw vessel body with rounded corners matching basic vessel style
        rectMode(CENTER);
        rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
        
      } else {
        // Basic ingredient vessel (rectangle with extremely rounded bottom corners)
        fill(vesselColor);
        stroke('black');
        strokeWeight(strokeW);
        
        // Calculate border radius relative to vessel height
        const topCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px
        const bottomCornerRadius = Math.max(this.h * 0.3, 15); // 30% of height, min 15px
        
        // Draw rounded rectangle
        rectMode(CENTER);
        rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
      }
      
      // Draw text inside the vessel
      fill('black');
      noStroke();
      textAlign(CENTER, CENTER);
      // Calculate text size relative to vessel height
      const fontSize = Math.max(this.h * 0.12, 10); // 12% of height, min 10px (reduced from 20%)
      textSize(fontSize);
      textStyle(BOLD); // Make text bold
      
      // Split text into lines if needed
      let lines = splitTextIntoLines(this.getDisplayText(), this.w * 0.7);
      
      for (let i = 0; i < lines.length; i++) {
        let yOffset = (i - (lines.length - 1) / 2) * (fontSize * 1.2); // Dynamic line spacing based on font size
        
        // Position text based on vessel type
        if (!this.isAdvanced) {
          // Basic ingredient vessel - position text slightly higher
          text(lines[i], 0, yOffset - this.h * 0.1);
        } else {
          // Advanced vessel (pots/pans) - center text properly in the shifted vessel body
          text(lines[i], 0, yOffset - this.h * 0.1);
        }
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
        const verbFontSize = Math.max(this.h * 0.14, 12); // 14% of height, min 12px (reduced from 18%)
        textSize(verbFontSize);
        
        // Position the verb directly above the vessel
        // Use a smaller offset to keep it closer to the vessel
        let yPosition = this.y - this.h * 0.5;
        
        // Draw a small white background for better readability
        fill(255, 255, 255, 200);
        noStroke();
        rectMode(CENTER);
        let verbWidth = textWidth(this.verb);
        const verbPadding = Math.max(this.w * 0.05, 10); // 5% of width, min 10px
        const verbHeight = Math.max(this.h * 0.25, 20); // 25% of height, min 20px
        const verbCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px
        rect(this.x, yPosition, verbWidth + verbPadding, verbHeight, verbCornerRadius);
        
        // Draw the verb text
        fill('black');
        text(this.verb, this.x, yPosition + verbFontSize * 0.3); // Adjust vertical centering
        
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
      
      // Store recipe data in the global variable
      recipe_data = recipeData;
      
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
  
  // Enhanced function to assign both preferred row and column based on drop position
  function assignPreferredRow(newVessel, dropY, dropX = mouseX) {
    // Calculate vessel sizes - must match the same calculations in arrangeVessels
    // Use relative margins exactly like in arrangeVessels
    const margin = Math.max(playAreaWidth * 0.0125, 3); // 1.25% of play area width, min 3px
    const vertical_margin = Math.max(playAreaHeight * 0.008, 2); // 0.8% of play area height, min 2px
    
    // Calculate basic vessel width and height using the exact same formula from arrangeVessels
    const basic_w = (playAreaWidth - (4 * margin)) / 3;
    const basic_h = basic_w * 0.8;
    
    // Calculate the row height using the same values as the actual arrangement
    const rowHeight = basic_h + vertical_margin;
    
    // Calculate the starting Y position - exactly matching arrangeVessels
    const startY = playAreaY + playAreaHeight * 0.2;
    
    // Calculate which row index the drop position corresponds to
    // Using Math.max to ensure we don't get negative values
    const relativeDropY = Math.max(0, dropY - startY);
    const dropRowIndex = Math.floor(relativeDropY / rowHeight);
    
    // Set preferred row, clamping to a reasonable range
    // We estimate the maximum number of rows based on vessel count
    const maxRows = Math.ceil(vessels.length / 3); // At most 3 basic vessels per row
    newVessel.preferredRow = Math.min(dropRowIndex, maxRows);
    
    // Determine preferred column based on drop X position
    // First calculate the potential column positions in a typical 3-column row
    const totalRowWidth = playAreaWidth - (2 * margin); // Width available for all vessels in a row
    const columnWidth = totalRowWidth / 3; // Width of each column
    
    // Calculate the starting X position for a standard row
    const startX = playAreaX + margin;
    
    // Calculate the relative drop X position
    const relativeDropX = dropX - startX;
    
    // Determine the column (0 = left, 1 = center, 2 = right)
    let preferredColumn = 0; // Default to left column
    
    if (relativeDropX >= 0 && relativeDropX <= totalRowWidth) {
      // Within the grid area
      preferredColumn = Math.floor(relativeDropX / columnWidth);
    } else if (relativeDropX > totalRowWidth) {
      // Beyond the right edge
      preferredColumn = 2; // Right column
    }
    
    // For advanced vessels, prevent them from being assigned to the center column (column 1)
    // This ensures they will span columns 0-1 or 1-2 instead of staying centered
    if (newVessel.isAdvanced && preferredColumn === 1) {
      // Calculate the center of the play area
      const centerX = playAreaX + playAreaWidth / 2;
      
      // Shift the vessel left or right based on which side of center it was dropped
      if (dropX < centerX) {
        // If dropped left of center, assign to column 0 (will span 0-1)
        newVessel.preferredColumn = 0;
        console.log("Advanced vessel shifted from center to left column (will span 0-1)");
      } else {
        // If dropped right of center, assign to column 2 (will span 1-2)
        newVessel.preferredColumn = 2;
        console.log("Advanced vessel shifted from center to right column (will span 1-2)");
      }
    } else {
      // For basic vessels or advanced vessels already in columns 0 or 2, keep the original column
      newVessel.preferredColumn = preferredColumn;
    }
    
    // Add column boundary information for better visualization
    const colBoundaries = [
      startX,                          // Left edge of left column
      startX + columnWidth,            // Left edge of center column
      startX + 2 * columnWidth,        // Left edge of right column
      startX + 3 * columnWidth         // Right edge of right column
    ];
    
    // Enhanced logging to verify function execution
    console.log("=== PREFERRED POSITION ASSIGNMENT ===");
    console.log(`Drop position: X=${dropX}, Y=${dropY}`);
    console.log(`Play area start: X=${startX}, Y=${startY}`);
    console.log(`Column width: ${columnWidth}, Row height: ${rowHeight}`);
    console.log(`Relative drop position: X=${relativeDropX}, Y=${relativeDropY}`);
    console.log(`Column boundaries: [${colBoundaries.join(', ')}]`);
    console.log(`Calculated position: Row=${dropRowIndex}, Column=${preferredColumn}`);
    console.log(`Assigned position: Row=${newVessel.preferredRow}, Column=${newVessel.preferredColumn}`);
    console.log(`New vessel properties:`, newVessel.name || "unnamed", newVessel.ingredients);
    console.log("====================================");
  }
  
  function arrangeVessels() {
    // Calculate vessel sizes based on play area width to ensure 3 base vessels per row
    // We need to fit 3 vessels plus margins in the play area width
    // Convert fixed margins to relative values based on play area dimensions
    let margin = playAreaWidth * 0.0125; // 1.25% of play area width (was 10px)
    let vertical_margin = playAreaHeight * 0.008; // 0.8% of play area height (was 5px)
    
    // Ensure minimum values for very small screens
    margin = Math.max(margin, 3); // Minimum 3px margin
    vertical_margin = Math.max(vertical_margin, 2); // Minimum 2px vertical margin
    
    // Calculate basic vessel width to fit exactly 3 per row with margins
    let basic_w = (playAreaWidth - (4 * margin)) / 3; // 3 vessels with margin on both sides
    let basic_h = basic_w * 0.8; // Maintain aspect ratio
    
    // Advanced vessels are twice as wide
    let advanced_w = basic_w * 2 + margin;
    let advanced_h = basic_h * 1.2;
    
    // Calculate column widths and positions for precise column preferences
    const columnWidth = (playAreaWidth - (4 * margin)) / 3;
    const columnPositions = [
      playAreaX + margin + columnWidth/2,                // Left column center
      playAreaX + margin + columnWidth + margin + columnWidth/2,  // Middle column center
      playAreaX + margin + 2 * (columnWidth + margin) + columnWidth/2 // Right column center
    ];

    // Calculate the starting Y position
    let startY = playAreaY + playAreaHeight * 0.2;
    
    // Find vessel with preferredRow (if any)
    const preferredVessel = vessels.find(v => v.hasOwnProperty('preferredRow'));
    
    // Log debugging information about the preferred vessel
    if (preferredVessel) {
      console.log("=== ARRANGE VESSELS ===");
      console.log("Found vessel with preferred position:", 
                  { row: preferredVessel.preferredRow, column: preferredVessel.preferredColumn || 'not set' });
      console.log("Vessel properties:", preferredVessel.name || "unnamed", preferredVessel.ingredients);
      console.log("======================");
    }
    
    // ENHANCEMENT 1: Sort vessels by priority - colored vessels should move less than base vessels
    // Sort order: 1) Advanced (colored) vessels first, 2) Basic (white) vessels
    // This ensures we position colored vessels first and move basic vessels around them
    let advancedVessels = vessels
      .filter(v => v.isAdvanced && v !== preferredVessel)
      .sort((a, b) => {
        // Sort by complexity (number of ingredients) in descending order
        return b.ingredients.length - a.ingredients.length;
      });
      
    let basicVessels = vessels
      .filter(v => !v.isAdvanced && v !== preferredVessel)
      .sort((a, b) => {
        // Sort by complexity (number of ingredients) in descending order
        return b.ingredients.length - a.ingredients.length;
      });
    
    // Create an array to hold our row arrangements
    let rowArrangements = [];
    
    // Handle preferred vessel placement logic
    if (preferredVessel) {
      const preferredRow = preferredVessel.preferredRow;
      
      // Helper function to create a standard row
      const createStandardRow = () => {
        let row = [];
        if (advancedVessels.length > 0 && basicVessels.length > 0) {
          row.push(advancedVessels.shift());
          row.push(basicVessels.shift());
        } else if (advancedVessels.length > 0) {
          row.push(advancedVessels.shift());
        } else if (basicVessels.length > 0) {
          for (let i = 0; i < 3 && basicVessels.length > 0; i++) {
            row.push(basicVessels.shift());
          }
        }
        return row;
      };
      
      // Fill rows until we reach the preferred row
      while (rowArrangements.length < preferredRow && 
            (advancedVessels.length > 0 || basicVessels.length > 0)) {
        rowArrangements.push(createStandardRow());
      }
      
      // Create the preferred row with the preferred vessel
      let preferredRowArr = [];
      
      // ENHANCEMENT 2: Honor column preference when placing the vessel
      if (preferredVessel.hasOwnProperty('preferredColumn')) {
        // We need to create a row that places the vessel in the correct column
        const preferredColumn = preferredVessel.preferredColumn;
        
        // For a vessel in column 0, it should be the first vessel in the row
        // For a vessel in column 1, it should be the second vessel (or first if it's advanced)
        // For a vessel in column 2, it should be the third vessel (or second if there's an advanced first)
        
        console.log(`Creating row with vessel in preferred column ${preferredColumn}`);
        
        // Initialize the row with null placeholders
        preferredRowArr = [null, null, null];
        
        // Place the preferred vessel at its column position
        preferredRowArr[preferredColumn] = preferredVessel;
        
        // Now fill the remaining positions with the most appropriate vessels
        if (preferredVessel.isAdvanced) {
          // Advanced vessel takes 2 slots, so we can only add one more basic vessel
          // If it's in column 0, we can add a basic vessel in column 2
          // If it's in column 1, we can't add any more vessels
          // If it's in column 2, we can add a basic vessel in column 0
          if (preferredColumn === 0 && basicVessels.length > 0) {
            preferredRowArr[2] = basicVessels.shift();
          } else if (preferredColumn === 2 && basicVessels.length > 0) {
            preferredRowArr[0] = basicVessels.shift();
          }
        } else {
          // Basic vessel takes 1 slot, so we can add more vessels
          if (preferredColumn === 0) {
            // We can add an advanced vessel in column 1 or two basic vessels in column 1 and 2
            if (advancedVessels.length > 0) {
              preferredRowArr[1] = advancedVessels.shift();
            } else {
              if (basicVessels.length > 0) preferredRowArr[1] = basicVessels.shift();
              if (basicVessels.length > 0) preferredRowArr[2] = basicVessels.shift();
            }
          } else if (preferredColumn === 1) {
            // We can add one basic vessel in column 0 and one in column 2
            if (basicVessels.length > 0) preferredRowArr[0] = basicVessels.shift();
            if (basicVessels.length > 0) preferredRowArr[2] = basicVessels.shift();
          } else if (preferredColumn === 2) {
            // We can add an advanced vessel in column 0 or two basic vessels in column 0 and 1
            if (advancedVessels.length > 0) {
              preferredRowArr[0] = advancedVessels.shift();
            } else {
              if (basicVessels.length > 0) preferredRowArr[0] = basicVessels.shift();
              if (basicVessels.length > 0) preferredRowArr[1] = basicVessels.shift();
            }
          }
        }
        
        // Filter out null placeholders
        preferredRowArr = preferredRowArr.filter(v => v !== null);
      } else {
        // No column preference, just place the vessel at the start of the row
        preferredRowArr = [preferredVessel];
        
        // Determine how many more slots we can fill in this row
        let slotsAvailable = preferredVessel.isAdvanced ? 1 : 2; // Advanced takes 2 slots, basic takes 1
        
        // Fill remaining slots in the preferred row
        if (slotsAvailable > 0) {
          if (slotsAvailable === 1) {
            // We can fit one basic vessel
            if (basicVessels.length > 0) {
              preferredRowArr.push(basicVessels.shift());
            }
          } else if (slotsAvailable === 2) {
            // We can fit either one advanced or up to two basic vessels
            if (advancedVessels.length > 0) {
              preferredRowArr.push(advancedVessels.shift());
            } else {
              for (let i = 0; i < 2 && basicVessels.length > 0; i++) {
                preferredRowArr.push(basicVessels.shift());
              }
            }
          }
        }
      }
      
      rowArrangements.push(preferredRowArr);
    }
    
    // Continue with regular arrangement for remaining vessels
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
      row.forEach((v, columnIndex) => {
        // Update vessel dimensions
        if (v.isAdvanced) {
          v.w = advanced_w;
          v.h = advanced_h;
        } else {
          v.w = basic_w;
          v.h = basic_h;
        }

        // ENHANCEMENT 3: For vessels with preferred column, try to honor that position
        if (v.hasOwnProperty('preferredColumn') && v === preferredVessel) {
          // Calculate the x-coordinate based on the column preference
          const preferredColumn = v.preferredColumn;
          
          // Determine the position for the vessel based on its type and preferred column
          let preferredX;
          
          if (v.isAdvanced) {
            // Check if this vessel is the only one in its row - if so, center it
            if (row.length === 1) {
              // For a single advanced vessel in a row, center it in the middle of the play area
              preferredX = playAreaX + playAreaWidth / 2;
              console.log("Single advanced vessel in row - centering in play area");
            } else {
              // Advanced vessels should span two columns
              if (preferredColumn === 0) {
                // Left column drop: position between columns 0 and 1
                preferredX = playAreaX + margin + columnWidth + margin/2;
              } else if (preferredColumn === 2) {
                // Right column drop: position between columns 1 and 2
                preferredX = playAreaX + margin + columnWidth + margin + columnWidth + margin/2;
              } else if (preferredColumn === 1) {
                // Center column drop: deterministically choose column based on position in row
                // Use columnIndex to alternate between spanning 0-1 and 1-2
                // This ensures a more balanced and predictable grid layout
                if (columnIndex % 2 === 0) {
                  // For first vessel in row or even indexed vessels, span columns 0-1
                  preferredX = playAreaX + margin + columnWidth + margin/2;
                  console.log("Center vessel positioned to span columns 0-1");
                } else {
                  // For odd indexed vessels, span columns 1-2
                  preferredX = playAreaX + margin + columnWidth + margin + columnWidth + margin/2;
                  console.log("Center vessel positioned to span columns 1-2");
                }
              }
            }
          } else {
            // Basic vessels still use the column centers
            preferredX = columnPositions[preferredColumn];
          }
          
          // Log that we're positioning at the preferred column
          console.log(`Positioning vessel at preferred column ${preferredColumn} (x=${preferredX})`);
          console.log(`Vessel is ${v.isAdvanced ? 'advanced' : 'basic'} and spans ${v.isAdvanced ? '2 columns' : '1 column'}`);
          
          // Set vessel position
          v.x = preferredX;
          v.y = startY + rowIndex * (basic_h + vertical_margin);
          v.originalX = v.x;
          v.originalY = v.y;
          
          // Adjust currentX to account for this vessel's placement
          currentX = v.x + v.w/2 + margin;
        } else {
          // For vessels without a specific column preference, just place them sequentially
          // Set vessel position
          v.x = currentX + v.w / 2;
          v.y = startY + rowIndex * (basic_h + vertical_margin); // Use basic_h for consistent spacing
          v.originalX = v.x;
          v.originalY = v.y;
          
          // Move x position for next vessel
          currentX += v.w + margin;
        }
      });
    });
    
    // Calculate the lowest vessel position for hint button placement
    let lowestY = startY;
    vessels.forEach(v => {
      lowestY = Math.max(lowestY, v.y + v.h/2);
    });
    
    // If initial hint button position is not set (first time), calculate it
    // Otherwise, use the stored position
    if (!initialHintButtonY) {
      // Set hint button at a fixed position 85% from top of play area
      hintButtonY = playAreaY + playAreaHeight * 0.85;
      
      // Store the initial hint button position
      initialHintButtonY = hintButtonY;
    } else {
      // Use the stored initial position
      hintButtonY = initialHintButtonY;
    }
    
    // Calculate button dimensions using relative values
    // Hint button - smaller action button
    let buttonWidth = playAreaWidth * 0.15; // 15% of play area width (was 120px)
    let buttonHeight = buttonWidth * 0.333; // Maintain aspect ratio
    // Ensure minimum sizes for usability
    buttonWidth = Math.max(buttonWidth, 80);
    buttonHeight = Math.max(buttonHeight, 30);
    
    // Start button - larger call to action
    let startButtonWidth = playAreaWidth * 0.2; // 20% of play area width (was 30%)
    let startButtonHeight = startButtonWidth * 0.4; // Maintain aspect ratio
    // Enforce minimum sizes
    startButtonWidth = Math.max(startButtonWidth, 100);
    startButtonHeight = Math.max(startButtonHeight, 40);
    
    // Create hint button with white background and grey outline
    hintButton = new Button(
      playAreaX + playAreaWidth * 0.5, // Center horizontally
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
      playAreaX + playAreaWidth * 0.5, // Center horizontally
      playAreaY + playAreaHeight * 0.85, // Position at 85% down the play area
      startButtonWidth, 
      startButtonHeight, 
      "Cook!", 
      startGame, 
      COLORS.secondary, 
      'white'
    );
    
    // After arrangement, log the final position of the preferred vessel
    if (preferredVessel) {
      // Calculate the grid column based on position
      const minX = playAreaX;
      const maxX = playAreaX + playAreaWidth;
      const columnWidth = (maxX - minX) / 3;
      
      // Determine which grid column the vessel ended up in
      let vesselColumn;
      if (preferredVessel.x < minX + columnWidth) {
        vesselColumn = 0; // Left column
      } else if (preferredVessel.x < minX + 2 * columnWidth) {
        vesselColumn = 1; // Center column
      } else {
        vesselColumn = 2; // Right column
      }
      
      // Check if we successfully honored the vessel's preferred position
      const preferredColumnHonored = !preferredVessel.hasOwnProperty('preferredColumn') || 
                                   vesselColumn === preferredVessel.preferredColumn;
      const preferredRowHonored = Math.floor((preferredVessel.y - startY) / (basic_h + vertical_margin)) === preferredVessel.preferredRow;
      
      console.log("=== VESSEL POSITIONED ===");
      console.log("Final position of vessel with preferred position:", {x: preferredVessel.x, y: preferredVessel.y});
      console.log("Grid position:", 
                  {row: Math.floor((preferredVessel.y - startY) / (basic_h + vertical_margin)), 
                   column: vesselColumn});
      console.log("Preferred position was:", 
                  {row: preferredVessel.preferredRow, column: preferredVessel.preferredColumn || 'not set'});
      console.log("Position honored:", {row: preferredRowHonored, column: preferredColumnHonored});
      console.log("========================");
      
      // Clear the preferences after using them
      delete preferredVessel.preferredRow;
      delete preferredVessel.preferredColumn;
    }
  }
  
  function draw() {
    // Set background color
    background(COLORS.background);
    
    // Draw floral pattern border if there's space
    drawFloralBorder();
    
    // Draw top and bottom flowers on narrow screens
    drawTopBottomFlowers();
    
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
      
      // Draw game counters (combo and error) - APlasker
      drawGameCounters();
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
    
    // Calculate title size relative to play area width
    const titleSize = Math.max(playAreaWidth * 0.055, 30); // 5.5% of play area width, min 30px
    textSize(titleSize);
    
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
    
    // Bubble Pop effect parameters
    const outlineWeight = 2; // Thinner outline for bubble style
    const bounceAmount = 2 * Math.sin(frameCount * 0.05); // Subtle bounce animation
    
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
      
      // Calculate letter position with bounce effect
      // Even and odd letters bounce in opposite directions for playful effect
      let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
      let letterX = x + letterWidths[i]/2;
      let letterY = playAreaY + 40 + offsetY;
      
      // Draw black outline - thinner for bubble style
      fill('black');
      noStroke();
      
      // Draw the letter with a thinner outline
      text(title[i], letterX - outlineWeight, letterY); // Left
      text(title[i], letterX + outlineWeight, letterY); // Right
      text(title[i], letterX, letterY - outlineWeight); // Top
      text(title[i], letterX, letterY + outlineWeight); // Bottom
      text(title[i], letterX - outlineWeight, letterY - outlineWeight); // Top-left
      text(title[i], letterX + outlineWeight, letterY - outlineWeight); // Top-right
      text(title[i], letterX - outlineWeight, letterY + outlineWeight); // Bottom-left
      text(title[i], letterX + outlineWeight, letterY + outlineWeight); // Bottom-right
      
      // Draw letter fill with color
      fill(letterColor);
      text(title[i], letterX, letterY);
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    
    // Reset text style
    textStyle(NORMAL);
  }
  
  function drawStartScreen() {
    // Calculate header and description sizes based on play area dimensions
    const headerSize = Math.max(playAreaWidth * 0.07, 20); // Increased from 0.055 to 0.07, min 20px
    const descriptionSize = Math.max(playAreaWidth * 0.035, 14); // Increased from 0.028 to 0.035, min 14px
    
    // Calculate a maximum width for tutorial text that ensures it fits within the play area
    const maxTutorialTextWidth = min(playAreaWidth * 0.85, 300);
    const titleTextWidth = min(playAreaWidth * 0.9, 320); // 90% width for title text
    
    // Draw main instruction with same size as other text but bold
    textAlign(CENTER, CENTER);
    textSize(descriptionSize);
    textStyle(BOLD);
    textWrap(WORD);
    fill('#333');
    text("Decode the dish by assembling all ingredients into recipe-based combos!", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.11, titleTextWidth);
    
    // Reset text style to normal for other text
    textStyle(NORMAL);
    
    // Updated first instruction - increased space from title text
    textSize(descriptionSize);
    textWrap(WORD);
    text("Drag & drop to combine ingredients into new components.", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.22, maxTutorialTextWidth);
    
    // First equation - decreased vertical spacing
    drawTutorialEquation(1, "Grapes", "white", "Sugar", "white", "Jelly", "green", 
                        "", // Empty description as we're using the text above
                        playAreaY + playAreaHeight * 0.32, false, descriptionSize);
    
    // Updated second instruction with non-breaking space
    textSize(descriptionSize);
    text("Yellow combos are partially complete. Add\u00A0more!", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.40, maxTutorialTextWidth);
    
    // Second equation - decreased vertical spacing
    drawTutorialEquation(2, "Jelly", "green", "Peanut Butter", "white", "Jelly + Peanut Butter", "yellow", 
                        "", // Empty description
                        playAreaY + playAreaHeight * 0.50, false, descriptionSize);
    
    // Third instruction
    textSize(descriptionSize);
    text("Complete the recipe with the fewest mistakes to make the grade.", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.58, maxTutorialTextWidth);
    
    // Third equation - decreased vertical spacing
    drawTutorialEquation(3, "Jelly + Peanut Butter", "yellow", "Potato Bread", "green", "PB&J Sandwich", "green", 
                        "", // Empty description
                        playAreaY + playAreaHeight * 0.68, true, descriptionSize);
    
    // Final instruction - changed text and made bold
    textSize(descriptionSize);
    textStyle(BOLD);
    text("New recipes daily!", 
         playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.80, maxTutorialTextWidth);
    
    // Reset text style to normal
    textStyle(NORMAL);
    
    // Calculate button sizes relative to play area
    const buttonWidth = Math.max(playAreaWidth * 0.3, 120);
    const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
    
    // Update start button dimensions
    startButton.w = buttonWidth;
    startButton.h = buttonHeight;
    
    // Position start button relative to play area
    startButton.x = playAreaX + playAreaWidth/2;
    startButton.y = playAreaY + playAreaHeight * 0.88;
    startButton.draw();
    startButton.checkHover(mouseX, mouseY);
    
    // Draw version number at the very bottom
    push();
    textSize(Math.max(playAreaWidth * 0.016, 8)); // 1.6% of width, min 8px
    fill(100, 100, 100, 180); // Semi-transparent gray
    text("v0.0324.13 - APlasker", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight - 5);
    pop();
  }
  
  // Function to draw tutorial equations
  function drawTutorialEquation(equationNum, leftName, leftColor, rightName, rightColor, resultName, resultColor, description, yPosition, showStarburst = false, descriptionSize = 16) {
    // Calculate vessel sizes based on play area dimensions with minimum sizes
    const vesselWidth = Math.max(playAreaWidth * 0.17, 60); // 17% of play area width, min 60px
    const vesselHeight = vesselWidth * 0.6; // Maintain aspect ratio
    
    // Calculate operator size relative to play area with minimum size
    const operatorSize = Math.max(playAreaWidth * 0.04, 16); // 4% of play area width, min 16px
    
    // Dynamic description text size based on play area width
    const descriptionFontSize = Math.max(playAreaWidth * 0.022, 14); // 2.2% of play area width, min 14px
    
    // Calculate positions relative to play area
    const leftX = playAreaX + playAreaWidth * 0.25;
    const rightX = playAreaX + playAreaWidth * 0.5;
    const resultX = playAreaX + playAreaWidth * 0.75;
    
    // Operator positions
    const operatorX1 = (leftX + rightX) / 2;
    const operatorX2 = (rightX + resultX) / 2;
    
    // Adjust y position for green vessels (raise them slightly)
    let adjustedY = yPosition;
    if (leftColor === "green" || rightColor === "green" || resultColor === "green") {
        adjustedY = yPosition - vesselHeight * 0.15; // 15% of vessel height instead of fixed 12px
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
    
    // Draw starburst behind the result vessel if requested
    if (showStarburst) {
      drawStarburst(resultX, adjustedY);
    }
    
    // Draw result vessel
    drawTutorialVessel(resultX, adjustedY, resultName, resultColor, vesselWidth, vesselHeight);
    
    // Draw description text below the equation
    fill('#333');
    textAlign(CENTER);
    textSize(descriptionFontSize); // Use the calculated description font size
    // Position description below the equation
    text(description, playAreaX + playAreaWidth/2, yPosition + vesselHeight * 0.9);
  }
  
  // New function to draw tutorial vessels
  function drawTutorialVessel(x, y, name, color, vesselWidth, vesselHeight) {
    push();
    translate(x, y);
    
    // Calculate relative stroke weight based on vessel size
    const strokeW = Math.max(vesselWidth * 0.03, 1.5); // 3% of vessel width, min 1.5px
    
    // Draw vessel
    if (color === "white") {
      // Basic ingredient vessel (white)
      fill('white'); // Pure white for base vessels
      stroke('black');
      strokeWeight(strokeW);
      
      // Calculate border radius relative to vessel dimensions
      const topRadius = Math.max(vesselHeight * 0.08, 3); // 8% of height, min 3px
      const bottomRadius = Math.max(vesselHeight * 0.5, 15); // 50% of height, min 15px
      
      // Draw rounded rectangle
      rectMode(CENTER);
      rect(0, 0, vesselWidth, vesselHeight, topRadius, topRadius, bottomRadius, bottomRadius);
    } else if (color === "yellow") {
      // Calculate handle sizes based on vessel dimensions
      const handleSize = Math.max(vesselHeight * 0.25, 12); // 25% of vessel height, min 12px
      
      // Draw handles behind the vessel
      fill('#888888');
      stroke('black');
      strokeWeight(strokeW);
      // Consistent positioning of handles across all vessels
      circle(-vesselWidth * 0.4, -vesselHeight * 0.1, handleSize);
      circle(vesselWidth * 0.4, -vesselHeight * 0.1, handleSize);
      
      // Yellow vessel (partial combination)
      fill(COLORS.vesselYellow); // Use the exact vessel color
      stroke('black');
      strokeWeight(strokeW);
      
      // Calculate border radius to match white vessels
      const topRadius = Math.max(vesselHeight * 0.08, 3); // 8% of height, min 3px
      const bottomRadius = Math.max(vesselHeight * 0.5, 15); // 50% of height, min 15px
      
      // Draw rectangle with rounded corners - consistent positioning
      rectMode(CENTER);
      rect(0, 0, vesselWidth, vesselHeight, topRadius, topRadius, bottomRadius, bottomRadius);
    } else if (color === "green") {
      // Calculate handle size based on vessel dimensions
      const handleWidth = vesselWidth * 0.5;
      const handleHeight = vesselHeight * 0.15;
      const handleRadius = Math.max(handleHeight * 0.3, 3); // 30% of handle height, min 3px
      
      // Draw handle behind the vessel
      fill('#888888');
      stroke('black');
      strokeWeight(strokeW);
      rectMode(CENTER);
      // Move handle up relative to the vessel
      rect(vesselWidth * 0.6, -vesselHeight * 0.25, handleWidth, handleHeight, handleRadius);
      
      // Green vessel (complete combination)
      fill(COLORS.green); // Use our explicit green color instead of COLORS.primary
      stroke('black');
      strokeWeight(strokeW);
      
      // Calculate border radius to match white vessels
      const topRadius = Math.max(vesselHeight * 0.08, 3); // 8% of height, min 3px
      const bottomRadius = Math.max(vesselHeight * 0.5, 15); // 50% of height, min 15px
      
      // Draw rectangle with rounded corners - consistent positioning
      rectMode(CENTER);
      rect(0, 0, vesselWidth, vesselHeight, topRadius, topRadius, bottomRadius, bottomRadius);
    }
    
    // Draw text - consistent for all vessel types
    fill('black');
    noStroke();
    textAlign(CENTER, CENTER);
    // Calculate text size relative to vessel height
    const fontSize = Math.max(vesselHeight * 0.12, 10); // 12% of vessel height, min 10px
    textSize(fontSize);
    textStyle(BOLD); // Make text bold
    
    // Split text into lines if needed
    let lines = splitTextIntoLines(name, vesselWidth * 0.8);
    
    // Calculate total text height to center vertically
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    // Draw each line of text, centered vertically in the vessel
    for (let i = 0; i < lines.length; i++) {
      const yOffset = (i - (lines.length - 1) / 2) * lineHeight;
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
    
    // Calculate star size based on play area dimensions
    const outerRadius = Math.max(playAreaWidth * 0.09, 55); // 9% of play area width, min 55px
    const innerRadius = outerRadius * 0.7; // Inner radius 70% of outer radius
    
    // Draw an 8-point star
    beginShape();
    for (let i = 0; i < 16; i++) {
      let radius = i % 2 === 0 ? outerRadius : innerRadius;
      let angle = TWO_PI * i / 16 - PI/16;
      let px = cos(angle) * radius;
      let py = sin(angle) * radius;
      vertex(px, py);
    }
    endShape(CLOSE);
    
    pop();
  }
  
  function drawWinScreen() {
    // Center all content within the play area
    textAlign(CENTER, CENTER);
    
    // Calculate responsive dimensions based on screen size
    const isMobile = width < 768;
    
    // Determine layout approach based on screen size
    const useVerticalLayout = isMobile;
    
    // Calculate the available space for content
    const contentWidth = playAreaWidth * 0.9;
    
    // ===== RECIPE CARD SECTION =====
    
    // Calculate recipe card size based on viewport dimensions
    const cardWidth = min(playAreaWidth, 600);  // Changed to 100% of play area width, max 600px
    const cardHeight = playAreaHeight * 0.38; // Increased to 38% of screen height
    
    // Position card based on adjusted spacing - header at 6%, recipe card at 10%
    const cardX = playAreaX + playAreaWidth / 2;
    let cardY = playAreaY + playAreaHeight * 0.10 + cardHeight / 2;
    
    // Draw reward message with multicolor treatment (like COMBO MEAL)
    const rewardMessage = "YOU MADE IT!";
    const rewardMessageSize = min(max(playAreaWidth * 0.08, 24), 36); // Changed from width to playAreaWidth with adjusted coefficient
    textSize(rewardMessageSize);
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
    
    // Bubble Pop effect parameters
    const outlineWeight = useVerticalLayout ? 1.5 : 2; // Thinner outline for bubble style
    const bounceAmount = 2 * Math.sin(frameCount * 0.05); // Subtle bounce animation
    
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
      
      // Calculate letter position with bounce effect
      // Even and odd letters bounce in opposite directions for playful effect
      let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
      let letterX = x + letterWidths[i]/2;
      let letterY = playAreaY + playAreaHeight * 0.06 + offsetY;
      
      // Draw black outline - thinner for bubble style
      fill('black');
      noStroke();
      
      // Draw the letter with a thinner outline
      text(rewardMessage[i], letterX - outlineWeight, letterY); // Left
      text(rewardMessage[i], letterX + outlineWeight, letterY); // Right
      text(rewardMessage[i], letterX, letterY - outlineWeight); // Top
      text(rewardMessage[i], letterX, letterY + outlineWeight); // Bottom
      text(rewardMessage[i], letterX - outlineWeight, letterY - outlineWeight); // Top-left
      text(rewardMessage[i], letterX + outlineWeight, letterY - outlineWeight); // Top-right
      text(rewardMessage[i], letterX - outlineWeight, letterY + outlineWeight); // Bottom-left
      text(rewardMessage[i], letterX + outlineWeight, letterY + outlineWeight); // Bottom-right
      
      // Draw letter fill with color
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
    rect(cardX + 5, cardY + 5, cardWidth, cardHeight, max(cardWidth * 0.02, 8)); // 2% of card width, min 8px
    
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
    rect(cardX, cardY, cardWidth, cardHeight, max(cardWidth * 0.02, 8)); // 2% of card width, min 8px
    
    // Draw flowers in the corners of the recipe card - reduced to 1.5% of card width
    const flowerSize = max(cardWidth * 0.015, 4); // 1.5% of card width, min 4px
    const cornerOffset = cardWidth * 0.07; // 7% of card width
    
    // Draw flowers in each corner
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary); // Top-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.secondary); // Top-right
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.tertiary); // Bottom-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
    
    // Draw recipe name
    const recipeNameSize = min(max(playAreaWidth * 0.06, 18), 28); // Changed from width to playAreaWidth with adjusted coefficient
    textSize(recipeNameSize);
    fill(COLORS.secondary);
    textStyle(BOLD);
    text(final_combination.name, cardX, cardY - cardHeight/2 + cardHeight * 0.09); // Adjusted to 9% of card height from top
    textStyle(NORMAL);
    
    // Add author information if it exists
    if (recipeAuthor && recipeAuthor.trim() !== "") {
      textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
      fill('#333333');
      text(`By ${recipeAuthor}`, cardX, cardY - cardHeight/2 + cardHeight * 0.16); // Adjusted to 16% of card height from top
    }
    
    // Resize image dimensions for responsive layout
    const imageWidth = min(cardWidth * 0.45, 220);  // 45% of card width, max 220px
    const imageHeight = imageWidth; // Keep square
    
    // Update image position based on new metrics
    let imageX = cardX - cardWidth/2 + cardWidth * 0.28; // 28% of card width from left edge
    let imageY = cardY - cardHeight/2 + cardHeight * 0.53; // 53% of card height from top (updated from 50%)
    
    // Draw recipe image placeholder (square)
    fill(240);
    stroke(220);
    strokeWeight(1);
    rect(imageX, imageY, imageWidth, imageHeight);
    
    // Draw placeholder text
    fill(180);
    textSize(min(max(playAreaWidth * 0.025, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    text("Recipe Image", imageX, imageY);
    
    // Only draw the image if it exists and has been loaded
    if (typeof recipeImage !== 'undefined' && recipeImage) {
      image(recipeImage, imageX, imageY, imageWidth, imageHeight);
    }

    // Draw recipe description - increased to 45% of card width
    const descriptionX = cardX - cardWidth/2 + cardWidth * 0.75; // 75% of card width from left edge (changed from 55%)
    const descriptionWidth = cardWidth * 0.45; // 45% of card width
    
    // Update description Y position to 38% of card height from top (changed from 35%)
    const descriptionY = cardY - cardHeight/2 + cardHeight * 0.38; // 38% of card height from top
    
    fill(0);
    textAlign(LEFT, TOP);
    textSize(min(max(playAreaWidth * 0.02, 8), 12)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#666');
    
    text(recipeDescription, descriptionX, descriptionY, descriptionWidth, cardHeight * 0.35); // 35% of card height max
    
    // Position ingredients - align with description's left edge and adjust spacing
    const ingredientsY = descriptionY + cardHeight * 0.05; // 5% of card height below description
    const ingredientsX = descriptionX; // Match description's left alignment
    
    // Draw "Ingredients:" header
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    textStyle(BOLD);
    fill('#444');
    textAlign(LEFT, TOP);
    text("Ingredients:", ingredientsX, ingredientsY, descriptionWidth); // Added width parameter to match description width
    textStyle(NORMAL);
    
    // Calculate columns for ingredients
    const numIngredients = ingredients.length;
    const numColumns = 2; // Always use 2 columns
    const itemsPerColumn = Math.ceil(numIngredients / numColumns);
    const columnWidth = (descriptionWidth / numColumns) * 0.85; // Reduced by 15% for better spacing
    
    // Draw ingredients in columns
    textSize(min(max(playAreaWidth * 0.018, 7), 9)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#666');
    
    // Function to process ingredients for display
    function processIngredientsForColumn(ingredientsList, charLimit) {
      return ingredientsList.map(ingredient => {
        let lines = [];
        let words = ingredient.split(' ');
        let currentLine = "";
        
        for (let word of words) {
          if (currentLine === "") {
            currentLine = word;
          } else if ((currentLine + " " + word).length <= charLimit) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        
        if (currentLine !== "") {
          lines.push(currentLine);
        }
        
        return {
          original: ingredient,
          lines: lines
        };
      });
    }
    
    // Character limit for ingredients, adjust for screen size
    const charLimit = useVerticalLayout ? 15 : 20;
    
    // Process ingredients for both columns
    const leftColumnIngredients = ingredients.slice(0, itemsPerColumn);
    const rightColumnIngredients = ingredients.slice(itemsPerColumn);
    
    const leftColumnProcessed = processIngredientsForColumn(leftColumnIngredients, charLimit);
    const rightColumnProcessed = processIngredientsForColumn(rightColumnIngredients, charLimit);
    
    // Calculate if all ingredients can fit in the available space
    const lineHeight = useVerticalLayout ? 8 : 10;
    const ingredientSpacing = useVerticalLayout ? 2 : 3;
    
    // Max available height for ingredients
    const maxAvailableHeight = cardY + cardHeight/2 - ingredientsY - 20;
    
    // Flag to track if we should show all ingredients or only a subset
    let showAllIngredients = true;
    
    // Draw left column
    let leftYOffset = ingredientsY + 20; // Increased from 15 to 20 to add more space below the header
    for (let i = 0; i < leftColumnProcessed.length; i++) {
      // Check if we've run out of space
      if (!showAllIngredients && leftYOffset + leftColumnProcessed[i].lines.length * lineHeight > ingredientsY + maxAvailableHeight) {
        break;
      }
      
      const lines = leftColumnProcessed[i].lines;
      const x = ingredientsX - (cardWidth * 0.11); // Increased to 11% negative offset to align properly
      
      // Draw each line of this ingredient
      for (let j = 0; j < lines.length; j++) {
        if (j === 0) {
          // Only add bullet to the first line of each ingredient
          text("• " + lines[j], x, leftYOffset, columnWidth); // Added width parameter for consistent alignment
        } else {
          // Indent subsequent lines to align with text after bullet
          text("  " + lines[j], x, leftYOffset, columnWidth); // Added width parameter for consistent alignment
        }
        leftYOffset += lineHeight;
      }
      
      // Add spacing between ingredients
      leftYOffset += ingredientSpacing;
    }
    
    // Draw right column
    let rightYOffset = ingredientsY + 20; // Increased from 15 to 20 to add more space below the header
    for (let i = 0; i < rightColumnProcessed.length; i++) {
      // Check if we've run out of space
      if (!showAllIngredients && rightYOffset + rightColumnProcessed[i].lines.length * lineHeight > ingredientsY + maxAvailableHeight) {
        break;
      }
      
      const lines = rightColumnProcessed[i].lines;
      const x = ingredientsX - (cardWidth * 0.11) + columnWidth; // Increased to 11% negative offset, keeping columnWidth for right column
      
      // Draw each line of this ingredient
      for (let j = 0; j < lines.length; j++) {
        if (j === 0) {
          // Only add bullet to the first line of each ingredient
          text("• " + lines[j], x, rightYOffset, columnWidth); // Added width parameter for consistent alignment
        } else {
          // Indent subsequent lines to align with text after bullet
          text("  " + lines[j], x, rightYOffset, columnWidth); // Added width parameter for consistent alignment
        }
        rightYOffset += lineHeight;
      }
      
      // Add spacing between ingredients
      rightYOffset += ingredientSpacing;
    }
    
    // Add "View Full Recipe" text at the bottom of the card
    textAlign(CENTER, CENTER);
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    if (isMouseOverCard) {
      fill(COLORS.primary); // Green text when hovered
    } else {
      fill('#666'); // Gray text normally
    }
    text("View Full Recipe →", cardX, cardY + cardHeight/2 - cardHeight * 0.07); // 7% of card height from bottom
    
    // Reset text alignment
    textAlign(LEFT, TOP);
    
    // ===== SCORE SECTION =====
    
    // Calculate responsive position for score section - 52% of screen height (adjusted)
    const scoreCardPositionY = playAreaY + playAreaHeight * 0.52;
    
    // Calculate score card size based on play area width - increased to 45% of play area width
    scoreWidth = min(max(playAreaWidth * 0.45, 180), 300);
    scoreHeight = scoreWidth * 1.414; // A4 paper ratio
    
    // Position score card
    scoreX = playAreaX + playAreaWidth/2; // Centered in the play area
    scoreY = scoreCardPositionY + scoreHeight/2; // Adjusted for vertical centering
    
    // Draw letter score with drop shadow
    // Shadow
    fill(0, 0, 0, 30);
    noStroke();
    rect(scoreX + 5, scoreY + 5, scoreWidth, scoreHeight, max(scoreWidth * 0.01, 4)); // Reduced to 1% of score width, min 4px
    
    // Paper
    fill(255);
    stroke(220);
    strokeWeight(1);
    rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.01, 4)); // Reduced to 1% of score width, min 4px
    
    // Check if mouse is over the letter score area
    isMouseOverLetterScore = mouseX > scoreX - scoreWidth/2 && mouseX < scoreX + scoreWidth/2 && 
                           mouseY > scoreY - scoreHeight/2 && mouseY < scoreY + scoreHeight/2;
    
    // Highlight the letter score area when hovered, similar to recipe card
    if (isMouseOverLetterScore) {
      // Add a subtle highlight effect
      noFill();
      stroke(COLORS.primary); // Green highlight
      strokeWeight(3);
      rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.01, 4)); // Reduced to 1% of score width, min 4px
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
    
    // Determine letter grade and color based on ONLY blackMoves (errors)
    // Using global letterGrade variable
    let letterColor;
    // Using the global isAPlus variable now
    isAPlus = false;
    
    if (blackMoves === 0) {
      letterGrade = "A";
      letterColor = color(0, 120, 255); // Blue
      // A+ is achieved with zero errors AND zero hints
      if (redHintMoves === 0) {
        isAPlus = true; // Mark as A+ for diamond decoration
      }
    } else if (blackMoves >= 1 && blackMoves <= 2) {
      letterGrade = "B";
      letterColor = COLORS.green; // Use our explicit green color
    } else if (blackMoves >= 3 && blackMoves <= 4) {
      letterGrade = "C";
      letterColor = COLORS.tertiary; // Yellow from vessels
    } else { // blackMoves >= 5
      letterGrade = "X";
      letterColor = COLORS.secondary; // Red from vessels
    }
    
    // Draw circle with the same color as the letter but with 30% opacity - increased to 90% of score width
    const circleSize = scoreWidth * 0.9; // 90% of score width
    noStroke();
    
    // Create a copy of the letter color with 30% opacity
    let circleBgColor = color(red(letterColor), green(letterColor), blue(letterColor), 76); // 76 is 30% of 255
    fill(circleBgColor);
    circle(scoreX, scoreY, circleSize);
    
    // Add "COMBO MEAL" header above the letter grade - positioned at 8% of score height from top
    textAlign(CENTER, CENTER);
    // Calculate font size that ensures COMBO MEAL text fits within 90% of score card width
    let maxComboMealSize = min(max(playAreaWidth * 0.04, 14), 18);
    // Temporarily set text size to check if it fits
    textSize(maxComboMealSize);
    
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
    
    // Calculate total width with kerning
    const totalComboMealWidth = comboMealWidth + comboMealTotalKerning;
    
    // Adjust font size if text is too wide (exceeds 90% of score card width)
    if (totalComboMealWidth > scoreWidth * 0.9) {
      maxComboMealSize *= (scoreWidth * 0.9) / totalComboMealWidth;
      textSize(maxComboMealSize);
      
      // Recalculate widths with new font size
      comboMealWidth = 0;
      comboMealLetterWidths = [];
      for (let i = 0; i < comboMealText.length; i++) {
        let letterWidth = textWidth(comboMealText[i]);
        comboMealLetterWidths.push(letterWidth);
        comboMealWidth += letterWidth;
      }
      
      // Recalculate kerning
      comboMealTotalKerning = 0;
      for (let i = 0; i < comboMealText.length - 1; i++) {
        comboMealTotalKerning += comboMealLetterWidths[i] * comboMealKerningFactor;
      }
    }
    
    fill(0); // Black text
    textStyle(BOLD);
    
    // Starting x position (centered with kerning)
    let comboMealX = scoreX - (comboMealWidth + comboMealTotalKerning)/2;
    
    // Position at 8% of score height from top (adjusted)
    const comboMealY = scoreY - scoreHeight/2 + scoreHeight * 0.08;
    
    // Draw each letter with increased spacing
    for (let i = 0; i < comboMealText.length; i++) {
      // Calculate letter position
      let letterX = comboMealX + comboMealLetterWidths[i]/2;
      
      // Draw letter
      text(comboMealText[i], letterX, comboMealY);
      
      // Move to the next letter position with kerning
      comboMealX += comboMealLetterWidths[i] * (1 + comboMealKerningFactor);
    }
    
    // Draw letter grade - with increased font size from 65% to 90% of circle size
    textAlign(CENTER, CENTER);
    textSize(circleSize * 0.9); // 90% of circle size for better proportion (updated from 65%)
    fill(letterColor);
    textStyle(NORMAL);
    text(letterGrade, scoreX, scoreY);
    
    // Check if Easter Egg was found
    let eggFound = moveHistory.some(move => 
      typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
    );
    
    // Draw sunny-side-up egg indicator if an Easter egg was found
    if (eggFound) {
      push();
      // Position the egg in the top left corner of the letter grade
      const eggSize = circleSize * 0.25; // 25% of circle size
      const eggX = scoreX - circleSize * 0.3;
      const eggY = scoreY - circleSize * 0.3;
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
    
    // Draw star stickers for A+ grade
    if (isAPlus) {
      // Star parameters
      const starLargeSize = circleSize * 0.3; // 30% of circle size for larger stars
      const starSmallSize = circleSize * 0.24; // 24% of circle size for smaller stars
      const outerRadius = starLargeSize * 0.5;
      const innerRadius = outerRadius * 0.5; // Increased inner radius for rounder appearance
      const roundness = outerRadius * 0.25; // Increased roundness for more cartoonish look
      
      // Function to draw a star sticker
      const drawStarSticker = (x, y, size) => {
        push();
        translate(x, y);
        
        // Calculate radius based on size (large or small)
        const currentOuterRadius = size === 'large' ? outerRadius : outerRadius * 0.8;
        const currentInnerRadius = size === 'large' ? innerRadius : innerRadius * 0.8;
        const currentRoundness = size === 'large' ? roundness : roundness * 0.8;
        
        // Draw drop shadow
        fill(0, 0, 0, 40);
        noStroke();
        translate(2, 2);
        starWithRoundedPoints(0, 0, currentInnerRadius, currentOuterRadius, 5, currentRoundness);
        
        // Draw white outline
        translate(-2, -2);
        fill(255);
        strokeWeight(3);
        stroke(255);
        starWithRoundedPoints(0, 0, currentInnerRadius, currentOuterRadius, 5, currentRoundness);
        
        // Draw yellow star with yolk color (255, 204, 0) instead of COLORS.tertiary
        fill(255, 204, 0);
        strokeWeight(1);
        stroke(255, 255, 255, 200);
        starWithRoundedPoints(0, 0, currentInnerRadius, currentOuterRadius, 5, currentRoundness);
        
        pop();
      };
      
      // Top right corner - two stars
      drawStarSticker(scoreX + circleSize * 0.35, scoreY - circleSize * 0.35, 'large');
      drawStarSticker(scoreX + circleSize * 0.5, scoreY - circleSize * 0.2, 'small');
      
      // Bottom left corner - two stars
      drawStarSticker(scoreX - circleSize * 0.35, scoreY + circleSize * 0.35, 'large');
      drawStarSticker(scoreX - circleSize * 0.5, scoreY + circleSize * 0.2, 'small');
    }
    
    // Draw hint indicators if hints were used
    if (hintCount > 0) {
      // Function to draw a hint indicator sticker
      const drawHintIndicator = (x, y, size) => {
        push();
        translate(x, y);
        
        // Calculate hint indicator size - 25% of circle size
        const hintSize = circleSize * 0.25 * size;
        
        // Draw drop shadow
        fill(0, 0, 0, 40);
        noStroke();
        translate(4, 4);
        ellipse(0, 0, hintSize, hintSize);
        
        // Draw white outline
        translate(-4, -4);
        fill(255);
        strokeWeight(4);
        stroke(255);
        ellipse(0, 0, hintSize, hintSize);
        
        // Draw white background
        fill(255);
        strokeWeight(1);
        stroke(255, 255, 255, 200);
        ellipse(0, 0, hintSize, hintSize);
        
        // Draw red circle outline (closer to the edge)
        noFill();
        strokeWeight(3);
        stroke('#FF5252');
        ellipse(0, 0, hintSize * 0.8, hintSize * 0.8);
        
        // Draw red question mark using Helvetica font
        fill('#FF5252');
        noStroke();
        textSize(hintSize * 0.6);
        textFont('Helvetica, Arial, sans-serif');
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        text("?", 0, 0);
        
        pop();
      };
      
      // Draw hint indicators based on hint count
      if (hintCount >= 1) {
        // First hint indicator - bottom right
        drawHintIndicator(scoreX + circleSize * 0.4, scoreY + circleSize * 0.4, 1);
      }
      
      if (hintCount >= 2) {
        // Second hint indicator - top right
        drawHintIndicator(scoreX + circleSize * 0.4, scoreY - circleSize * 0.4, 1);
      }
      
      if (hintCount >= 3) {
        // Third hint indicator - with minimal overlap
        drawHintIndicator(scoreX + circleSize * 0.4 + 25, scoreY + circleSize * 0.4 - 25, 1);
      }
    }
    
    textStyle(NORMAL);
    
    // Add "Share Score" text at the bottom of the letter score area
    textAlign(CENTER, CENTER);
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    if (isMouseOverLetterScore) {
      fill(COLORS.primary); // Green text when hovered
    } else {
      fill('#666'); // Gray text normally
    }
    text("Share Score →", scoreX, scoreY + scoreHeight/2 - scoreHeight * 0.07); // 7% of score height from bottom
    
    // Add "New Recipe Everyday!" text at the bottom - 5% from bottom of screen
    textAlign(CENTER, CENTER);
    textSize(min(max(playAreaWidth * 0.04, 14), 18)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#333');
    textStyle(BOLD);
    text("New Recipe Everyday!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.95);
    textStyle(NORMAL);
    
    // Check if mouse is over the recipe card
    isMouseOverCard = mouseX > cardX - cardWidth/2 && mouseX < cardX + cardWidth/2 && 
                     mouseY > cardY - cardHeight/2 && mouseY < cardY + cardHeight/2;
    
    // Change cursor to pointer if over the card or letter score area
    if (isMouseOverCard || isMouseOverLetterScore) {
      cursor(HAND);
    }
    
    // TEMPORARY - TEST BUTTON FOR LETTER SCORE INTERACTION
    // Add this at the very end of the function before the closing brace
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Only show test UI in local development
      push();
      fill(200, 50, 50);
      rect(playAreaX + 20, playAreaY + 20, 120, 30);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(12);
      text("Test Letter Score", playAreaX + 20 + 60, playAreaY + 20 + 15);
      pop();
      
      // Check if test button is clicked
      if (mouseIsPressed && 
          mouseX > playAreaX + 20 && mouseX < playAreaX + 20 + 120 &&
          mouseY > playAreaY + 20 && mouseY < playAreaY + 20 + 30) {
        console.log("Test button clicked - calling handleLetterScoreInteraction");
        // Call the handler with score coordinates instead of mouse coordinates
        if (scoreX && scoreY) {
          handleLetterScoreInteraction(scoreX, scoreY);
        }
      }
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
    // Position counters at a fixed position 92% from top of play area
    const historyY = playAreaY + playAreaHeight * 0.92;
    
    const circleSize = 15;
    const circleSpacing = 20;
    const maxCountersPerRow = 10;
    const rowSpacing = 20;
    const maxRows = 3; // Maximum 3 rows (30 counters total)
    
    // Filter moveHistory to only include red, black, and Easter Egg counters
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333' || move === COLORS.vesselHint || move === '#FF5252' || 
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
  
  // Draw combo counter showing progress toward completing all combinations - APlasker
  function drawComboCounter() {
    // Position to the left of move history
    const counterY = playAreaY + playAreaHeight * 0.92;
    const circleSize = 18;
    const circleSpacing = 25;
    const labelOffset = 20; // Reduced space for "Combos:" text to make it closer to circles
    
    // Get the total number of possible combinations (including final combination)
    const totalCombos = intermediate_combinations.length + 1; // +1 for final recipe - APlasker
    
    // Calculate starting position (from right side toward center)
    const startX = playAreaX + playAreaWidth * 0.25;
    
    // Draw "Combos:" label - match hint button text style
    fill('black');
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(14); // Match size with hint button
    textStyle(BOLD);
    text("Combos:", startX - 5, counterY); // Moved closer to circles
    
    // Draw combo circles
    for (let i = 0; i < totalCombos; i++) {
      const x = startX + (i * circleSpacing) + labelOffset;
      const y = counterY;
      
      // Get completed vessels count
      const completedCount = completedGreenVessels.length;
      
      // Instead of checking specific combos, just fill in from left to right - APlasker
      const isCompleted = i < completedCount;
      
      if (isCompleted) {
        // Check if this combo was completed with a hint - APlasker
        const isHintCombo = completedGreenVessels[i] && completedGreenVessels[i].isHint;
        
        // Completed combo: 100% opacity circle with white checkmark
        // Use hint color (red) if completed with hint, otherwise green
        fill(isHintCombo ? COLORS.vesselHint : COLORS.green);
        stroke('black');
        strokeWeight(2);
        circle(x, y, circleSize * 1.2);
        
        // Draw white checkmark
        stroke('white');
        strokeWeight(3);
        line(x - circleSize * 0.3, y, x - circleSize * 0.1, y + circleSize * 0.3);
        line(x - circleSize * 0.1, y + circleSize * 0.3, x + circleSize * 0.4, y - circleSize * 0.3);
      } else {
        // Incomplete combo: 50% opacity green circle
        fill(COLORS.green + '80'); // Add 80 for 50% opacity in hex
        stroke('black');
        strokeWeight(1.5);
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
    // Add debug logging to track clicks
    console.log("Mouse pressed at:", mouseX, mouseY);
    console.log("Game state - gameWon:", gameWon, "isMouseOverLetterScore:", isMouseOverLetterScore);
    
    // Check if any easter egg modal is active and handle the click
    for (let i = eggModals.length - 1; i >= 0; i--) {
      if (eggModals[i].active && eggModals[i].checkClick(mouseX, mouseY)) {
        // Modal was clicked, don't process any other clicks
        return;
      }
    }
    
    // Remove tutorial hotspot check
    
    if (!gameStarted) {
      // Check if start button was clicked
      if (startButton.isInside(mouseX, mouseY)) {
        startButton.handleClick();
        return;
      }
    } else if (gameWon) {
      // Check if recipe card was clicked
      if (isMouseOverCard) {
        console.log("View Recipe triggered (mouse)");
        viewRecipe();
        return;
      }
      
      // ENHANCED LETTER SCORE CLICK DETECTION:
      // Check both the hover flag and the coordinates for maximum reliability
      if (isMouseOverLetterScore || 
          (scoreX && scoreY && 
           mouseX > scoreX - scoreWidth/2 && mouseX < scoreX + scoreWidth/2 && 
           mouseY > scoreY - scoreHeight/2 && mouseY < scoreY + scoreHeight/2)) {
        
        console.log("Letter score clicked - attempting interaction");
        handleLetterScoreInteraction(mouseX, mouseY);
        return false; // Prevent default browser behavior
      }
      
      // Check for random recipe hotspot (moved from the end)
      if (!isLoadingRandomRecipe && isInRandomRecipeHotspot(mouseX, mouseY)) {
        console.log("Random recipe hotspot clicked at:", mouseX, mouseY);
        isLoadingRandomRecipe = true;
        loadRandomRecipe().finally(() => {
          isLoadingRandomRecipe = false;
        });
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
    
    // Remove the check for random recipe hotspot from the end
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
          
          // Debug log to verify flow before assigning preferred row
          console.log("MOUSE RELEASED: About to assign preferred row to new vessel");
          
          // Assign preferred row based on the target vessel's position (where the dragged vessel was dropped)
          // This ensures the new vessel appears at the position of the vessel it was combined with
          assignPreferredRow(new_v, overVessel.y, overVessel.x);
          
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
            } else if (new_v.color === 'green' || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary || new_v.color === COLORS.green) {
              moveHistory.push(COLORS.green); // Use our explicit green color for all green vessels
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
        // Calculate appropriate vessel dimensions based on play area size
        const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
        const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
        
        // Create a new vessel (yellow or green) with relative dimensions
        let new_v = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
        
        let C = C_candidates[0];
        
        // Check if we have all required ingredients for this combination
        // Modified: Only check if all required ingredients are present, not requiring exact length match
        if (C.required.every(ing => U.includes(ing))) {
          // Only turn green if not part of an active hint
          if (!hintActive || C.name !== hintVessel.name) {
          new_v.name = C.name;
          new_v.color = COLORS.green; // Use COLORS.green instead of string 'green'
            new_v.ingredients = []; // Clear ingredients since this is now a complete combination
            
            // Set the verb from the combination and display it
            for (let combo of intermediate_combinations) {
              if (combo.name === C.name && combo.verb) {
                new_v.verb = combo.verb;
                new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
                break;
              }
            }
            
            // Add to completedGreenVessels when creating a green vessel - APlasker
            if (!completedGreenVessels.some(vessel => vessel.name === C.name)) {
              completedGreenVessels.push({name: C.name});
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
          
          // Calculate appropriate vessel dimensions based on play area size
          const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
          const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
          
          // Create a new vessel for the parent combination with relative dimensions
          let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
          
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
            new_v.color = COLORS.green; // Use our explicit green color
            new_v.complete_combinations = []; // Clear since this is now a complete combination
            
            // Set the verb from the parent combination and display it
            if (parentCombo.verb) {
              new_v.verb = parentCombo.verb;
              new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
            }
            
            // Add parent combo to completed vessels - APlasker
            if (!completedGreenVessels.some(vessel => vessel.name === parentCombo.name)) {
              completedGreenVessels.push({name: parentCombo.name});
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
        
        // Calculate appropriate vessel dimensions based on play area size
        const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
        const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
        
        // Create a new vessel for the combined components with relative dimensions
        let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
        
        // Check if we have all required components for the final combination
        if (finalRecipeComponents.every(name => U.includes(name))) {
          new_v.name = final_combination.name;
          new_v.color = COLORS.green; // Use our explicit green color
          new_v.complete_combinations = []; // Clear since this is the final combination
          
          // Set the verb from the final combination and display it
          if (final_combination.verb) {
            new_v.verb = final_combination.verb;
            new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
          }
          
          // Add final combo to completedGreenVessels too - APlasker
          if (!completedGreenVessels.some(vessel => vessel.name === final_combination.name)) {
            completedGreenVessels.push({name: final_combination.name});
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
          // Calculate appropriate vessel dimensions based on play area size
          const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
          const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
          
          // For final recipe, store combination names with relative dimensions
          new_v = new Vessel([], allComponents, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
        } else {
          // Calculate appropriate vessel dimensions based on play area size
          const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
          const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
          
          // For intermediate recipes, store ingredients with relative dimensions
          new_v = new Vessel(allComponents, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
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
          new_v.color = COLORS.green; // Use our explicit green color
          
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
    try {
      console.log("shareScore called - letterGrade:", letterGrade, "isAPlus:", isAPlus);
      
      // More robust recipe number retrieval with fallbacks
      let recipeNumber = '?';
      
      // Try getting rec_id from final_combination first
      if (final_combination && final_combination.rec_id) {
        recipeNumber = final_combination.rec_id;
      } 
      // Then try getting it from recipe_data
      else if (recipe_data && recipe_data.rec_id) {
        recipeNumber = recipe_data.rec_id;
      }
      
      // Add fallbacks if global variables aren't set properly
      if (typeof isAPlus === 'undefined') {
        console.warn("isAPlus is undefined, defaulting to false");
        isAPlus = false;
      }
      
      if (typeof letterGrade === 'undefined') {
        console.warn("letterGrade is undefined, defaulting to 'X'");
        letterGrade = "X";
      }
      
      // Determine emoji markers based on letter grade
      let gradeEmojis;
      if (isAPlus) {
        gradeEmojis = `🌟A🌟`; // A+ score
      } else if (letterGrade === "A") {
        gradeEmojis = `🔵A🔵`; // A score
      } else if (letterGrade === "B") {
        gradeEmojis = `🟢B🟢`; // B score
      } else if (letterGrade === "C") {
        gradeEmojis = `🟠C🟠`; // C score
      } else { // X grade
        gradeEmojis = `❌`; // Failing score
      }
      
      // Determine egg emoji based on Easter egg found
      let eggEmoji = '';
      if (moveHistory.some(move => 
        typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
      )) {
        eggEmoji = '🍳';
      }
      
      // Count red hint moves from moveHistory
      // Add hint indicators (question mark emoji) based on how many hints were used
      let hintEmojis = '';
      for (let i = 0; i < hintCount; i++) {
        hintEmojis += '❓';
      }
      
      // Create the simplified emoji-based share text - WITHOUT the URL
      let shareText = `Combo Meal 🍴 Recipe ${recipeNumber}: ${gradeEmojis} ${hintEmojis} ${eggEmoji}`;
      const shareUrl = "https://allcott25.github.io/ComboMeal/";
      
      // Check if mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Use the native Web Share API directly if on mobile devices
      if (isMobile && navigator.share) {
        // On iOS, force a small delay on first share attempt to avoid browser init issues
        setTimeout(() => {
          navigator.share({
            title: 'My Combo Meal Score',
            text: shareText,
            url: shareUrl
          })
          .then(() => {
            console.log('Successfully shared using Web Share API');
          })
          .catch(error => {
            console.log('Error sharing:', error);
            
            // Fallback if Web Share API fails - combine text and URL for clipboard
            clipboardShareFallback(shareText + '\n\n' + shareUrl);
          });
        }, 100); // Short delay helps with first-time initialization on iOS
      } else {
        // Desktop or browsers without Web Share API
        clipboardShareFallback(shareText);
      }
      
      // Reset hover states to prevent persistent highlighting
      isMouseOverCard = false;
      isMouseOverLetterScore = false;
    } catch (error) {
      console.error("Error in shareScore function:", error);
      alert("Whoops! Something's broken. Let me know and I'll fix it ✌️");
    }
  }
  
  // Separate clipboard sharing function for fallback
  function clipboardShareFallback(text) {
    try {
      // On iOS, sometimes the toast works better than clipboard API
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isIOS) {
        // For iOS, try to copy to clipboard silently
        try {
          navigator.clipboard.writeText(text).then(() => {
            // Show a simpler toast notification
            const toast = document.createElement('div');
            toast.className = 'share-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(119, 143, 93, 0.9)'; // Avocado green
            toast.style.color = 'white';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '1000';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            toast.style.fontWeight = 'bold';
            toast.style.fontSize = '16px';
            toast.style.textAlign = 'center';
            toast.innerText = '🍽️ Score copied to clipboard! 🍽️';
            
            document.body.appendChild(toast);
            
            // Fade in
            setTimeout(() => {
              toast.style.opacity = '1';
            }, 50);
            
            // Fade out after 3 seconds
            setTimeout(() => {
              toast.style.opacity = '0';
              setTimeout(() => {
                if (toast.parentNode) {
                  document.body.removeChild(toast);
                }
              }, 500);
            }, 3000);
            
            console.log('Text copied to clipboard silently on iOS');
          });
        } catch (clipErr) {
          console.log('Silent clipboard copy failed on iOS, showing modal as fallback');
          // Last resort - show alert
          alert("Please copy this score manually:\n\n" + text);
        }
      } else {
        // For non-iOS, use clipboard API with toast
        navigator.clipboard.writeText(text)
          .then(() => {
            // Create and show toast
            const toast = document.createElement('div');
            toast.className = 'share-toast';
            toast.innerText = '🍽️ Score copied! Share your food! 🍽️';
            document.body.appendChild(toast);
            
            // Fade in with a small delay to ensure DOM update
            setTimeout(() => {
              toast.style.opacity = '1';
            }, 50);
            
            // Fade out and remove after 3 seconds
            setTimeout(() => {
              toast.style.opacity = '0';
              setTimeout(() => {
                if (toast.parentNode) {
                  document.body.removeChild(toast);
                }
              }, 500);
            }, 3000);
          })
          .catch(err => {
            console.error('Error copying to clipboard:', err);
            // Only show modal as absolute last resort
            alert("Please copy this score manually:\n\n" + text);
          });
      }
    } catch (error) {
      console.error('Fallback share error:', error);
      // Last resort
      alert("Please copy this score manually:\n\n" + text);
    }
  }
  
  function viewRecipe() {
    try {
      // Get the recipe ID safely with fallbacks
      let recipeId = '';
      
      if (final_combination && final_combination.id) {
        recipeId = final_combination.id;
      } else if (recipe_data && recipe_data.id) {
        recipeId = recipe_data.id;
      }
      
      // Use the recipeUrl from Supabase if available - APlasker
      let urlToOpen = 'https://www.google.com'; // Default fallback to Google
      
      if (recipeUrl) {
        urlToOpen = recipeUrl; // Use the URL loaded from Supabase
        console.log("Opening recipe URL from database:", urlToOpen);
      } else {
        console.warn("No recipe URL found in database, using fallback");
      }
      
      // Create anchor element with correct attributes for new tab
      const anchorEl = document.createElement('a');
      anchorEl.href = urlToOpen;
      anchorEl.target = '_blank'; // Force new tab
      anchorEl.rel = 'noopener noreferrer'; // Security best practice
      
      // iOS Safari needs the element to be in the DOM and clicked
      document.body.appendChild(anchorEl);
      
      // Programmatically trigger a click
      anchorEl.click();
      
      // Clean up the DOM
      setTimeout(() => {
        if (document.body.contains(anchorEl)) {
          document.body.removeChild(anchorEl);
        }
      }, 100);
      
      // Fallback in case the DOM approach doesn't work (older browsers)
      try {
        window.open(urlToOpen, '_blank');
      } catch (innerErr) {
        console.log('Anchor method should have worked, window.open fallback unnecessary');
      }
    } catch (e) {
      // Error handler for any unexpected issues
      console.error("Error opening recipe:", e);
      
      // Final fallback - try direct location change as last resort
      // This won't open in a new tab but is better than nothing
      try {
        window.location.href = "https://www.google.com"; // Changed to Google fallback - APlasker
      } catch (finalErr) {
        console.error("All attempts to open recipe failed:", finalErr);
        alert("Unable to open recipe. Please try visiting Google directly.");
      }
    }
  }
  
  function mouseMoved() {
    // Check if buttons exist before trying to use them
    if (!gameStarted && startButton) {
      startButton.checkHover(mouseX, mouseY);
    }
    
    if (gameStarted) {
      // Only check these buttons if they exist and the game has started
      if (hintButton) hintButton.checkHover(mouseX, mouseY);
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
      moveHistory.push(COLORS.vesselHint); // Red color for hint creation (matching hint vessels)
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
          
          // Debug log to verify flow before assigning preferred row
          console.log("SHOW HINT: About to assign preferred row to new vessel");
          
          // Assign the same row as the hint vessel was in
          assignPreferredRow(newVessel, hintVessel.y);
          
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
      
      // Debug log to verify flow before assigning preferred row
      console.log("CHECK MATCHING VESSELS: About to assign preferred row to new vessel");
      
      // Assign the same row as the hint vessel was in
      assignPreferredRow(newVessel, hintVessel.y);
      
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
    // Update mouse coordinates to match normalized touch position
    if (touches.length > 0) {
      const normalized = normalizeTouchCoordinates(touches[0].x, touches[0].y);
      mouseX = normalized.x;
      mouseY = normalized.y;
    }
    
    // Check if any easter egg modal is active and handle the click  
    for (let i = eggModals.length - 1; i >= 0; i--) {
      if (eggModals[i].active && eggModals[i].checkClick(mouseX, mouseY)) {
        // Modal was clicked, don't process any other clicks
        return false;
      }
    }
    
    // Prevent default touch behavior to avoid scrolling
    // Only do this if we're actually handling the touch
    let touchHandled = false;
    
    // Get the touch coordinates
    if (touches.length > 0) {
      let touchX = touches[0].x;
      let touchY = touches[0].y;
      
      // Handle the same logic as mousePressed but with touch coordinates
      if (!gameStarted) {
        // Check if start button was touched
        if (startButton.isInside(touchX, touchY)) {
          startGame();
          touchHandled = true;
        }
      } else if (gameWon) {
        // Check for random recipe hotspot first
        if (!isLoadingRandomRecipe && isInRandomRecipeHotspot(touchX, touchY)) {
          console.log("Random recipe hotspot touched at:", touchX, touchY);
          isLoadingRandomRecipe = true;
          loadRandomRecipe().finally(() => {
            isLoadingRandomRecipe = false;
          });
          touchHandled = true;
          return false;
        }
        
        // Debugging log to help track touch coordinates
        console.log("Touch on win screen:", touchX, touchY);
        
        // Use simpler touch detection on win screen - top half shows recipe, bottom half shares score
        if (touchY < height/2) {
          // Top half = view recipe
          console.log("View Recipe triggered (win screen touch - top half)");
          viewRecipe();
          touchHandled = true;
        } else {
          // Bottom half = share score
          console.log("Share Score triggered (win screen touch - bottom half)");
          shareScore();
          touchHandled = true;
        }
      } else {
        // Check if hint button was touched
        if (!showingHint && hintButton.isInside(touchX, touchY)) {
          showHint();
          touchHandled = true;
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
            touchHandled = true;
            break;
          }
        }
      }
      
      // Update the isMouseOverLetterScore flag for consistent hover state
      if (gameWon) {
        // Use simplified hover detection based on screen position
        isMouseOverLetterScore = (touchY >= height/2);
        isMouseOverCard = (touchY < height/2);
      }
      
      if (touchHandled) {
        return false; // Prevent default only if we handled the touch
      }
    }
    
    // Check for random recipe hotspot last
    if (gameWon && !isLoadingRandomRecipe && isInRandomRecipeHotspot(touchX, touchY)) {
      console.log("Random recipe hotspot touched at:", touchX, touchY);
      isLoadingRandomRecipe = true;
      loadRandomRecipe().finally(() => {
        isLoadingRandomRecipe = false;
      });
    }
    
    return true; // Allow default behavior if not handled
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
    
    // Set hint button at a fixed position 85% from top of play area
    hintButtonY = playAreaY + playAreaHeight * 0.85;
    
    // Store the initial hint button position
    initialHintButtonY = hintButtonY;
    
    // Calculate button dimensions using relative values
    // Hint button - smaller action button
    let buttonWidth = playAreaWidth * 0.15; // 15% of play area width
    let buttonHeight = buttonWidth * 0.333; // Maintain aspect ratio
    // Ensure minimum sizes for usability
    buttonWidth = Math.max(buttonWidth, 80);
    buttonHeight = Math.max(buttonHeight, 30);
    
    // Start button - larger call to action
    let startButtonWidth = playAreaWidth * 0.2; // 20% of play area width (was 30%)
    let startButtonHeight = startButtonWidth * 0.4; // Maintain aspect ratio
    // Enforce minimum sizes
    startButtonWidth = Math.max(startButtonWidth, 100);
    startButtonHeight = Math.max(startButtonHeight, 40);
    
    // Create hint button with white background and grey outline
    hintButton = new Button(
      playAreaX + playAreaWidth * 0.5, // Center horizontally
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
      playAreaX + playAreaWidth * 0.5, // Center horizontally
      playAreaY + playAreaHeight * 0.85, // Position at 85% down the play area
      startButtonWidth, 
      startButtonHeight, 
      "Cook!", 
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
    completedGreenVessels = []; // Reset completed green vessels - APlasker
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
    const safetyMargin = flowerSpacing; // Add a safety margin to prevent overlap with play area
    
    // Calculate the available space on each side
    const leftSpace = playAreaX - safetyMargin;
    const rightSpace = windowWidth - (playAreaX + playAreaWidth + safetyMargin);
    
    // Find the center points of left and right spaces
    const leftCenterX = leftSpace / 2;
    const rightCenterX = playAreaX + playAreaWidth + safetyMargin + rightSpace / 2;
    
    // Calculate how many flowers we need to fill each side (including off-screen flowers)
    const leftFlowersNeeded = Math.ceil(leftSpace / flowerSpacing) + 2; // Add extra to ensure coverage
    const rightFlowersNeeded = Math.ceil(rightSpace / flowerSpacing) + 2;
    
    // Draw on the left side, starting from center and working outward
    for (let i = -Math.floor(leftFlowersNeeded/2); i <= Math.ceil(leftFlowersNeeded/2); i++) {
      const x = leftCenterX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen or too close to play area
      if (x < -flowerSpacing || x > leftSpace) continue;
      
      for (let y = flowerSpacing/2; y < height; y += flowerSpacing) {
        // Alternate between different colors for variety
        const colorIndex = (i + Math.floor(y/flowerSpacing)) % 3;
        if (colorIndex === 0) {
          drawFlower(x, y, petalSize, COLORS.primary);
        } else if (colorIndex === 1) {
          drawFlower(x, y, petalSize, COLORS.secondary);
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary);
        }
      }
    }
    
    // Draw on the right side, starting from center and working outward
    for (let i = -Math.floor(rightFlowersNeeded/2); i <= Math.ceil(rightFlowersNeeded/2); i++) {
      const x = rightCenterX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen or too close to play area
      if (x < playAreaX + playAreaWidth + safetyMargin || x > windowWidth + flowerSpacing) continue;
      
      for (let y = flowerSpacing/2; y < height; y += flowerSpacing) {
        // Alternate between different colors for variety
        const colorIndex = (i + Math.floor(y/flowerSpacing)) % 3;
        if (colorIndex === 0) {
          drawFlower(x, y, petalSize, COLORS.primary);
        } else if (colorIndex === 1) {
          drawFlower(x, y, petalSize, COLORS.secondary);
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary);
        }
      }
    }
  }

  // Function to draw top and bottom flower borders for narrow screens
  function drawTopBottomFlowers() {
    // Only draw these borders when the screen is too narrow for side flowers
    if (windowWidth > maxPlayWidth + 2 * playAreaPadding) return;
    
    // Settings for the flowers
    const flowerSpacing = 40;
    const smallerPetalSize = 5; // Slightly smaller flowers for the mobile version
    const safetyMargin = flowerSpacing; // Add a safety margin to prevent overlap with play area
    
    // Calculate positions that are truly symmetrical around the play area
    const topMargin = playAreaY;
    const bottomMargin = windowHeight - (playAreaY + playAreaHeight);
    
    // Use the same distance from the play area for both top and bottom, with added safety margin
    const flowerDistance = min(topMargin, bottomMargin) * 0.5;
    // Ensure there's at least one full flower spacing between flowers and play area
    const adjustedFlowerDistance = max(flowerDistance, safetyMargin);
    
    // Find the center point of the screen
    const centerX = width / 2;
    
    // Calculate how many flowers we need to fill the width (including off-screen flowers)
    const flowersNeeded = Math.ceil(width / flowerSpacing) + 2; // Add extra to ensure coverage
    
    // Draw on the top (outside the play area, above the game)
    // Start from center and work outward
    for (let i = -Math.floor(flowersNeeded/2); i <= Math.ceil(flowersNeeded/2); i++) {
      // Calculate the x position centered around the middle of the screen
      const x = centerX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen
      if (x < -flowerSpacing || x > width + flowerSpacing) continue;
      
      // Position flowers at a consistent distance from the play area
      const y = playAreaY - adjustedFlowerDistance;
      // Only draw if there's enough room
      if (y >= smallerPetalSize * 2) {
        const colorIndex = Math.abs(i) % 3; // Use absolute value for symmetry
        if (colorIndex === 0) {
          drawFlower(x, y, smallerPetalSize, COLORS.primary); // Green
        } else if (colorIndex === 1) {
          drawFlower(x, y, smallerPetalSize, COLORS.secondary); // Red/Orange
        } else {
          drawFlower(x, y, smallerPetalSize, COLORS.tertiary); // Yellow
        }
      }
    }
    
    // Draw on the bottom (outside the play area, below the game)
    // Start from center and work outward
    for (let i = -Math.floor(flowersNeeded/2); i <= Math.ceil(flowersNeeded/2); i++) {
      // Calculate the x position centered around the middle of the screen
      const x = centerX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen
      if (x < -flowerSpacing || x > width + flowerSpacing) continue;
      
      // Position flowers at a consistent distance from the play area
      const y = playAreaY + playAreaHeight + adjustedFlowerDistance;
      // Only draw if there's enough room
      if (y <= windowHeight - smallerPetalSize * 2) {
        const colorIndex = Math.abs(i) % 3; // Use absolute value for symmetry
        if (colorIndex === 0) {
          drawFlower(x, y, smallerPetalSize, COLORS.tertiary); // Yellow (different order from top)
        } else if (colorIndex === 1) {
          drawFlower(x, y, smallerPetalSize, COLORS.primary); // Green
        } else {
          drawFlower(x, y, smallerPetalSize, COLORS.secondary); // Red/Orange
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
    // Update mouse coordinates to match touch position
    if (touches.length > 0) {
      mouseX = touches[0].x;
      mouseY = touches[0].y;
    }
    
    // Call the mouse event handler
    mouseReleased();
    
    // Prevent default to avoid scrolling
    return false;
  }
  
  // Add touch move support for mobile devices
  function touchMoved() {
    // Update mouse coordinates to match normalized touch position
    if (touches.length > 0) {
      const normalized = normalizeTouchCoordinates(touches[0].x, touches[0].y);
      mouseX = normalized.x;
      mouseY = normalized.y;
      
      // Update hover states for win screen
      if (gameWon) {
        // Use simplified hover detection based on screen position
        isMouseOverLetterScore = (mouseY >= height/2);
        isMouseOverCard = (mouseY < height/2);
      }
    }
    
    // Call the mouse event handler
    mouseDragged();
    
    // Prevent default to avoid scrolling
    return false;
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
  
  // Global variable for card hover state
  let isMouseOverCard = false;
  
  // Dedicated function to handle letter score interactions
  function handleLetterScoreInteraction(x, y) {
    // Extended debug logging to help diagnose issues
    console.log("handleLetterScoreInteraction called with coordinates:", x, y);
    console.log("Current game state:", gameState, "gameWon:", gameWon);
    
    // Only process in win state
    if (!gameWon) {
      console.log("Letter score interaction ignored - game not in win state");
      return false;
    }
    
    // Defensive check: if score coordinates haven't been initialized yet,
    // perhaps because drawWinScreen hasn't run, then can't handle interaction
    if (typeof scoreX === 'undefined' || typeof scoreY === 'undefined' || 
        typeof scoreWidth === 'undefined' || typeof scoreHeight === 'undefined') {
      console.error("Letter score interaction failed - score coordinates not initialized");
      console.log("Score variables:", {scoreX, scoreY, scoreWidth, scoreHeight});
      return false;
    }
    
    // More forgiving coordinate check - add a bit of padding for easier clicking
    const padding = 10; // 10px of extra clickable area
    const isOverLetterScore = (
      x > scoreX - scoreWidth/2 - padding && x < scoreX + scoreWidth/2 + padding && 
      y > scoreY - scoreHeight/2 - padding && y < scoreY + scoreHeight/2 + padding
    );
    
    console.log("Letter score interaction check:", 
      "x:", x, "y:", y,
      "scoreX:", scoreX, "scoreY:", scoreY, 
      "scoreWidth:", scoreWidth, "scoreHeight:", scoreHeight,
      "isOverLetterScore:", isOverLetterScore
    );
    
    // If coordinates are within letter score, trigger share action
    if (isOverLetterScore) {
      console.log("Letter score interaction handled - directly calling shareScore");
      
      // Directly call shareScore and catch any errors
      try {
        shareScore();
        console.log("shareScore executed successfully");
      } catch(e) {
        console.error("Error in shareScore:", e);
      }
      
      return true; // Interaction was handled
    }
    
    return false; // Interaction was not for letter score
  }
  
  // Function to check if a point is within the random recipe hotspot area
  function isInRandomRecipeHotspot(x, y) {
    // Calculate the position of the "!" in "YOU MADE IT!"
    const rewardMessage = "YOU MADE IT!";
    const rewardMessageSize = min(max(playAreaWidth * 0.08, 24), 36);
    textSize(rewardMessageSize);
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
    let startX = playAreaX + playAreaWidth/2 - (totalWidth + totalKerning)/2;
    
    // Calculate the position of the "!"
    let exclamationX = startX;
    for (let i = 0; i < rewardMessage.length - 1; i++) {
      exclamationX += letterWidths[i] * (1 + kerningFactor);
    }
    exclamationX += letterWidths[rewardMessage.length - 1]/2;
    
    let exclamationY = playAreaY + playAreaHeight * 0.06;
    
    // Create a 60x60 pixel hotspot around the "!"
    const isInHotspot = x >= exclamationX - 30 && x <= exclamationX + 30 && 
                        y >= exclamationY - 30 && y <= exclamationY + 30;
    
    // Debug visualization when hovering over hotspot
    if (isInHotspot) {
      noFill();
      stroke(255, 0, 0, 100); // Semi-transparent red for random recipe
      strokeWeight(2);
      rect(exclamationX - 30, exclamationY - 30, 60, 60);
      console.log("Hovering over random recipe hotspot at:", exclamationX, exclamationY);
    }
    
    return isInHotspot;
  }
  
  // Function to load a random recipe
  async function loadRandomRecipe() {
    try {
      console.log("Loading random recipe...");
      const recipeData = await fetchRandomRecipe();
      
      if (!recipeData) {
        console.error("No random recipe data found");
        isLoadingRandomRecipe = false;
        return;
      }
      
      // Update game variables with recipe data
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      ingredients = recipeData.baseIngredients;
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      
      // Get author information from the database if it exists
      recipeAuthor = recipeData.author || "";
      
      // Reset game state
      gameStarted = false;
      gameWon = false;
      moveHistory = [];
      hintCount = 0;
      vessels = [];
      animations = [];
      
      console.log("Random recipe loaded successfully");
    } catch (error) {
      console.error("Error loading random recipe:", error);
      isLoadingRandomRecipe = false;
    }
  }
  
  // Add loading state variable at the top with other game state variables
  let isLoadingRandomRecipe = false;
  
  // New function to show a custom modal for sharing
  function showShareModal(text) {
    // Create modal container
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    // Create modal content
    const content = document.createElement('div');
    content.style.backgroundColor = '#FFFFFF';
    content.style.padding = '20px';
    content.style.borderRadius = '10px';
    content.style.maxWidth = '90%';
    content.style.textAlign = 'center';
    
    // Create header
    const header = document.createElement('h3');
    header.innerText = 'Copy Your Score';
    header.style.marginTop = '0';
    header.style.color = '#778F5D'; // Avocado green
    
    // Create text field
    const textField = document.createElement('textarea');
    textField.value = text;
    textField.style.width = '100%';
    textField.style.padding = '10px';
    textField.style.marginTop = '10px';
    textField.style.marginBottom = '15px';
    textField.style.borderRadius = '5px';
    textField.style.border = '1px solid #ccc';
    textField.style.height = '80px';
    textField.readOnly = true;
    
    // Create instructions
    const instructions = document.createElement('p');
    instructions.innerText = 'Tap and hold the text above to select and copy';
    instructions.style.fontSize = '14px';
    instructions.style.color = '#333';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.backgroundColor = '#778F5D'; // Avocado green
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.padding = '10px 20px';
    closeButton.style.borderRadius = '5px';
    closeButton.style.marginTop = '15px';
    closeButton.style.cursor = 'pointer';
    
    // Add event listener to close modal
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Add event listener to select all text when tapped
    textField.addEventListener('focus', () => {
      textField.select();
    });
    
    // Assemble modal
    content.appendChild(header);
    content.appendChild(textField);
    content.appendChild(instructions);
    content.appendChild(closeButton);
    modal.appendChild(content);
    
    // Add to document
    document.body.appendChild(modal);
    
    // Focus the text field to make it easier to copy
    setTimeout(() => {
      textField.focus();
    }, 100);
  }
  
  // Combined function to draw both combo counter and move history in a single row - APlasker
  function drawGameCounters() {
    // Position counters lower in the play area
    const counterY = playAreaY + playAreaHeight * 0.95; // Moved down from 0.92
    
    // Center of the play area for overall positioning
    const centerX = playAreaX + playAreaWidth / 2;
    
    // Use a consistent circle size for all counters - APlasker
    const circleSize = 15;
    const comboSpacing = 22;
    const errorSpacing = 22; // Match combo spacing for visual consistency - APlasker
    
    // Get the total number of possible combinations (including final combination)
    const totalCombos = intermediate_combinations.length + 1;
    
    // --- ERROR COUNTER SECTION ---
    const totalErrorSlots = 4; // Show 4 slots for errors - APlasker
    
    // Filter moveHistory to only include error markers (black only) - APlasker
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333');
    
    // Limit the number of counters to display
    const displayCount = Math.min(filteredMoveHistory.length, totalErrorSlots);
    
    // Consistent label width for both sections
    const labelWidth = 65;
    
    // Calculate total width needed for combo counters
    const comboWidth = (totalCombos * comboSpacing) + labelWidth;
    
    // Calculate width needed for error counters
    const errorWidth = (totalErrorSlots * errorSpacing) + labelWidth;
    
    // Calculate divider width
    const dividerWidth = 40; // Space for divider symbol (🍴)
    
    // Calculate starting positions to center the entire counter display
    const totalWidth = comboWidth + dividerWidth + errorWidth;
    const startX = centerX - (totalWidth / 2);
    
    // --- RESET ALL TEXT PROPERTIES FOR CONSISTENCY - APlasker ---
    textFont(bodyFont);
    textStyle(NORMAL);
    
    // --- DRAW COMBO COUNTERS ---
    // Draw "Combos:" label
    fill('black');
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(14);
    textStyle(BOLD);
    const comboLabelX = startX + labelWidth; // Position for "Combos:" text
    text("Combos:", comboLabelX, counterY);
    
    // Draw combo circles
    for (let i = 0; i < totalCombos; i++) {
      const x = comboLabelX + 15 + (i * comboSpacing);
      const y = counterY;
      
      // Get completed vessels count
      const completedCount = completedGreenVessels.length;
      
      // Fill in from left to right
      const isCompleted = i < completedCount;
      
      if (isCompleted) {
        // Check if this combo was completed with a hint
        const isHintCombo = completedGreenVessels[i] && completedGreenVessels[i].isHint;
        
        // Completed combo: 100% opacity circle with white checkmark
        fill(isHintCombo ? COLORS.vesselHint : COLORS.green);
        stroke('black');
        strokeWeight(1.5);
        circle(x, y, circleSize);
        
        // Draw white checkmark
        stroke('white');
        strokeWeight(2.5);
        line(x - circleSize * 0.3, y, x - circleSize * 0.1, y + circleSize * 0.3);
        line(x - circleSize * 0.1, y + circleSize * 0.3, x + circleSize * 0.4, y - circleSize * 0.3);
      } else {
        // Incomplete combo: 50% opacity green circle
        fill(COLORS.green + '80'); // Add 80 for 50% opacity in hex
        stroke('black');
        strokeWeight(1);
        circle(x, y, circleSize);
      }
    }
    
    // --- DRAW DIVIDER ---
    const dividerX = startX + comboWidth + (dividerWidth / 2);
    fill('black');
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(NORMAL); // Reset text style for divider - APlasker
    text("🍴", dividerX, counterY);
    
    // --- DRAW ERROR COUNTERS ---
    // Reset text properties before drawing error counters - APlasker
    textFont(bodyFont);
    textSize(14);
    textStyle(BOLD);
    
    // Draw "Errors:" label 
    textAlign(LEFT, CENTER);
    const errorLabelX = dividerX + (dividerWidth / 2);
    text("Errors:", errorLabelX, counterY);
    
    // Draw error circles - both filled and empty placeholders
    for (let i = 0; i < totalErrorSlots; i++) {
      // Fix spacing to prevent overlap with label - APlasker
      const x = errorLabelX + labelWidth + (i * errorSpacing);
      const y = counterY;
      
      if (i < displayCount) {
        // Filled error counter (black)
        fill('black');
        stroke('black');
        strokeWeight(1.5);
        circle(x, y, circleSize);
        
        // If there are 5+ errors, add red X's to error counters - APlasker
        if (filteredMoveHistory.length >= 5) {
          stroke(COLORS.vesselHint); // Changed to burnt orange hint color - APlasker
          strokeWeight(2.5); // Made X's bolder - APlasker
          // Draw X
          line(x - circleSize/3, y - circleSize/3, x + circleSize/3, y + circleSize/3);
          line(x + circleSize/3, y - circleSize/3, x - circleSize/3, y + circleSize/3);
        }
      } else {
        // Empty error placeholder - 50% opacity black - APlasker
        fill('rgba(0, 0, 0, 0.5)');
        stroke('black');
        strokeWeight(1);
        circle(x, y, circleSize);
      }
    }
  }
  
  // Add after the existing utility functions, before setup()
  function normalizeTouchCoordinates(x, y) {
    // Get the device pixel ratio to handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Get the canvas's bounding rectangle to account for any scaling
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scale factors
    const scaleX = canvas.width / (rect.width * dpr);
    const scaleY = canvas.height / (rect.height * dpr);
    
    // Normalize the coordinates
    return {
      x: (x - rect.left) * scaleX,
      y: (y - rect.top) * scaleY
    };
  }
  
  