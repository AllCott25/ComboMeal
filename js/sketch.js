/*
 * Culinary Logic Puzzle v0.0505.03
 * Created by APlasker
 * Last Updated: May 5, 2025 (00:03 EDT) by APlasker
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
  
  // Flag to track if an Easter egg was found (prevents invalid combination handling)
  let eggFound = false;
  
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
  let lastHintTime = 0; // Track when the last hint was requested
  let hintCooldown = 500; // 0.5 second cooldown between hints (in milliseconds)
  let hintButton;
  let isMobile = false;
  let hintButtonY; // Position of the hint button 
  let initialHintButtonY; // New variable to store the initial hint button position
  let preferredVessel = null;
  let highlightedVessel = null;
  let flowerRotation = 0;
  let eggModals = [];
  let persistentFlowerAnimation = null; // New global variable for persistent flower animation
  let activePartialCombo = null; // Track the currently active partial combination
  let partialCombinations = []; // Track all partial combinations that have been started
  let autoFinalCombination = false; // Flag for automatic final combination sequence - APlasker
  let autoFinalCombinationStarted = false; // Flag to track if sequence has started - APlasker
  let autoFinalCombinationTimer = 0; // Timer for sequencing combinations - APlasker
  let autoFinalCombinationState = "WAITING"; // State machine for enhanced auto combination - APlasker
  let finalCombinationVessels = []; // Track vessels that are part of the final combination - APlasker
  let autoFinalCombinationCenter = {x: 0, y: 0}; // Center point for vessels to move toward - APlasker
  let autoFinalCombinationShakeDuration = 30; // 0.5 seconds at 60fps for shake animation - APlasker
  
  // Byline state variables - APlasker
  let currentByline = "Drop one ingredient on to another to combine!"; // Updated default byline - APlasker
  let nextByline = ""; // Store the upcoming byline message
  let bylineTimer = 0; // Timer for temporary bylines, counts down frames
  let bylineHintDuration = 210; // 7 seconds at 30fps - temporary byline display duration
  let lastAction = 0; // Track the last time the player took an action
  let inactivityReminderCount = 0; // Track how many inactivity reminders have been shown
  let baseInactivityThreshold = 300; // 10 seconds at 30fps - base inactivity threshold (reduced from 600)
  let bylineTransitionState = "stable"; // "stable", "fading-out", "changing", "fading-in"
  let bylineOpacity = 255; // Opacity for fade effect
  let bylineFadeFrames = 8; // Number of frames for fade transition at 30fps (reduced from 15)
  let isTransitioning = false; // Flag to prevent interrupting transitions
  let transitionDuration = 0; // Duration to display message after transition
  
  // Success messages to display when combinations are created - APlasker
  const successMessages = [
    "Smells good!", 
    "It's almost dinner time!", 
    "I could eat", 
    "Ooh whatcha makin?",
    "The secret ingredient is love"
  ];
  
  // Partial combo messages to display when yellow vessels are created - APlasker
  const partialComboMessages = [
    "Classic combination!",
    "Those definitely go together",
    "Ok now I'm getting hungry",
    "Chop chop!",
    "Aww they like each other"
  ];
  // Track if first partial combo has been created and which messages have been used
  let firstPartialComboCreated = false;
  let usedPartialComboMessages = [];
  
  // Error messages to display when incorrect combinations are attempted - APlasker
  const errorMessages = [
    "Something doesn't taste right",
    "Yum but no",
    "Need a peek at the recipe? Try a hint!",
    "Keep combo and carry onbo",
    "So close!",
    "Oopsy daisy",
    "What else can you add?"
  ];
  // Track error message state
  let firstErrorOccurred = false;
  let usedErrorMessages = [];
  
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
  let recipeImage; // Global variable to store the loaded recipe image
  let isLoadingImage = false; // Track if we're in the process of loading an image
  
  // Global variables for score display and interaction
  let scoreX, scoreY, scoreWidth, scoreHeight;
  let isMouseOverLetterScore = false;
  let recipe_data; // Global variable for recipe data
  
  // Global flag to track if any modal is currently active
  let modalActive = false;
  
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
      this.duration = 15; // 0.5 seconds at 30fps (reduced from 30)
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
  
  // Animation class for vessel movement during final combination
  class VesselMovementAnimation {
    constructor(vessel, targetX, targetY) {
      this.vessel = vessel;
      this.startX = vessel.x;
      this.startY = vessel.y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.progress = 0;
      this.duration = 20; // 0.67 seconds at 30fps (reduced from 30)
      this.active = true;
      this.completed = false;
      
      // Store original position for restoration if needed
      vessel.originalX = vessel.x;
      vessel.originalY = vessel.y;
      
      console.log(`Created vessel movement animation from (${this.startX}, ${this.startY}) to (${this.targetX}, ${this.targetY})`);
    }
    
    update() {
      if (this.completed) return true;
      
      this.progress += 1 / this.duration;
      
      // Prevent progress from exceeding 1
      this.progress = Math.min(this.progress, 1);
      
      // Use cubic easing for smooth movement
      const t = this.progress;
      const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Update vessel position
      this.vessel.x = lerp(this.startX, this.targetX, easedT);
      this.vessel.y = lerp(this.startY, this.targetY, easedT);
      
      // Check if animation is complete
      if (this.progress >= 1) {
        this.completed = true;
        this.active = false;
        console.log(`Vessel movement complete for ${this.vessel.name || "unnamed vessel"}`);
        
        // Ensure the vessel is exactly at the target position
        this.vessel.x = this.targetX;
        this.vessel.y = this.targetY;
        
        return true;
      }
      
      return false;
    }
    
    draw() {
      // No drawing needed - the vessel itself will be drawn separately
      // This animation only updates the vessel's position
    }
  }
  
  // Animation class for dramatic verb reveals
  class VerbAnimation {
    constructor(verb, x, y, vesselRef) {
      // Transform verb to uppercase and add exclamation mark
      this.verb = verb.toUpperCase() + "!";
      this.startX = x; // Starting position (over vessel)
      this.startY = y;
      
      // Calculate halfway point between vessel and center
      const centerX = playAreaX + playAreaWidth/2;
      const centerY = playAreaY + playAreaHeight/2;
      this.targetX = lerp(this.startX, centerX, 0.5); // Go halfway to center
      this.targetY = lerp(this.startY, centerY, 0.5); // Go halfway to center
      
      this.x = this.startX; // Current position
      this.y = this.startY;
      this.progress = 0;
      this.duration = 45; // 1.5 seconds at 30fps (reduced from 60)
      this.maxSize = playAreaWidth * 0.9; // 90% of play area width
      this.active = true;
      this.opacity = 255; // Track opacity separately 
      this.cloudPoints = [];
      this.vesselRef = vesselRef; // Reference to the vessel to update its text
      this.hasTriggeredTextReveal = false; // Flag to track if we've triggered the text reveal
      
      // Start at 75% of vessel size if we have a vessel reference
      this.initialSize = this.vesselRef ? Math.max(this.vesselRef.w, this.vesselRef.h) * 0.75 : 10;
      
      // Store the original vessel name and temporarily clear it
      if (this.vesselRef) {
        this.vesselName = this.vesselRef.name;
        this.vesselRef.displayName = null; // Add a displayName property that starts as null
      }
      
      // Debug log to confirm animation creation
      console.log("Creating VerbAnimation for verb:", this.verb, "for vessel:", this.vesselName);
      
      // Generate cloud edge points - increased number of points for smoother outline
      const numPoints = 36; // Increased from 20 for smoother outline
      for (let i = 0; i < numPoints; i++) {
        const angle = (TWO_PI / numPoints) * i;
        const noiseOffset = random(0, 100);
        this.cloudPoints.push({
          angle: angle,
          noiseOffset: noiseOffset,
          variationAmount: random(0.12, 0.18) // More consistent variation (was 0.1, 0.25)
        });
      }
    }
    
    update() {
      // Animation phases - adjust for speed
      const growPhase = 0.3; // First 30% of animation is growth
      const holdPhase = 0.7; // Hold until 70% of animation
      const peakRevealPoint = 0.5; // At 50% of animation, reveal the vessel name
      const fadeOutPoint = 0.8; // Start fading out at 80% 
      
      // Adjust progress speed: 25% faster during growth, 50% faster during fade
      let progressIncrement;
      if (this.progress < growPhase) {
        // 25% faster during growth
        progressIncrement = (1 / this.duration) * 1.25;
      } else if (this.progress > fadeOutPoint) {
        // 50% faster during fade out
        progressIncrement = (1 / this.duration) * 1.5;
      } else {
        // Normal speed during hold phase
        progressIncrement = 1 / this.duration;
      }
      
      // Update progress
      this.progress += progressIncrement;
      
      // Move position from start to center as the animation progresses during growth phase
      if (this.progress <= growPhase) {
        const moveT = this.progress / growPhase;
        const easedMoveT = moveT * moveT * (3 - 2 * moveT); // Cubic easing
        this.x = lerp(this.startX, this.targetX, easedMoveT);
        this.y = lerp(this.startY, this.targetY, easedMoveT);
      }
      
      // When we hit the peak, reveal the vessel name
      if (!this.hasTriggeredTextReveal && this.progress >= peakRevealPoint && this.vesselRef) {
        console.log("Revealing vessel name:", this.vesselName);
        this.vesselRef.displayName = this.vesselName;
        this.hasTriggeredTextReveal = true;
      }
      
      // Handle fade out 
      if (this.progress > fadeOutPoint) {
        // Quick fade out calculation - map from fadeOutPoint->1.0 to 255->0
        this.opacity = map(this.progress, fadeOutPoint, 1.0, 255, 0);
      }
      
      // Log progress at certain points for debugging
      if (this.progress === 0.1 || this.progress === 0.3 || this.progress === 0.5 || 
          this.progress === 0.7 || this.progress === 0.9) {
        console.log(`VerbAnimation at ${(this.progress * 100).toFixed(0)}%: ${this.verb}`);
      }
      
      // Return true when animation is complete to remove it
      if (this.progress >= 1) {
        console.log(`VerbAnimation complete: ${this.verb}`);
        // Ensure vessel name is revealed at the end
        if (this.vesselRef && !this.vesselRef.displayName) {
          this.vesselRef.displayName = this.vesselName;
        }
        this.active = false;
        return true;
      }
      
      return false;
    }
    
    draw() {
      if (!this.active) return;
      
      // Calculate animation phases
      const growPhase = 0.3; // First 30% of animation is growth
      const holdPhase = 0.7; // Hold until 70% of animation
      
      // Calculate size based on animation phase, but start at initialSize rather than 0
      let currentSize;
      if (this.progress < growPhase) {
        // Growing phase - ease in with cubic function, but start at initialSize
        const t = this.progress / growPhase;
        const easedT = t * t * (3 - 2 * t); // Smooth step function
        // Start at initialSize and grow to maxSize
        currentSize = map(easedT, 0, 1, this.initialSize, this.maxSize);
      } else if (this.progress < holdPhase) {
        // Hold phase - maintain full size
        currentSize = this.maxSize;
      } else {
        // No shrinking, maintain size but fade out
        currentSize = this.maxSize;
      }
      
      // Begin shape
      push();
      
      // Draw cloud background
      noStroke();
      
      // Draw main cloud with higher opacity (255 → 255+20% = ~300, capped at 255)
      let cloudOpacity = min(255, this.opacity * 1.2); // Increase opacity by 20%
      fill(255, 255, 255, cloudOpacity);
      
      beginShape();
      for (let i = 0; i < this.cloudPoints.length; i++) {
        const point = this.cloudPoints[i];
        
        // Calculate variation using noise for organic cloud shape
        // Add angle-based phase to ensure more consistent wobbliness around the entire perimeter
        const phaseOffset = point.angle * 0.3; // Use angle as part of noise input for more consistent variation
        const noiseVal = noise(point.noiseOffset + frameCount * 0.01, phaseOffset);
        const variation = map(noiseVal, 0, 1, -point.variationAmount, point.variationAmount);
        
        // Calculate radius with variation
        const radius = (currentSize / 2) * (1 + variation);
        
        // Calculate point position
        const px = this.x + cos(point.angle) * radius;
        const py = this.y + sin(point.angle) * radius;
        
        curveVertex(px, py);
        
        // Add extra vertices at the beginning and end for smooth curves
        if (i === 0) {
          curveVertex(px, py);
        } else if (i === this.cloudPoints.length - 1) {
          curveVertex(px, py);
          curveVertex(this.x + cos(this.cloudPoints[0].angle) * radius, 
                    this.y + sin(this.cloudPoints[0].angle) * radius);
        }
      }
      endShape(CLOSE);
      
      // Always draw verb text when the cloud is visible (improved visibility)
      if (currentSize > this.maxSize * 0.1) { // As long as the cloud is at least 10% visible
        // Calculate text opacity based on progress
        let textOpacity = this.opacity; // Use the global opacity we're tracking
        
        // Calculate font size (proportional to cloud size), with minimum size
        const fontSize = max(min(currentSize * 0.2, 70), 20);
        
        // Draw text
        textAlign(CENTER, CENTER);
        textSize(fontSize);
        textStyle(BOLD);
        
        // Draw text shadow for better visibility
        fill(0, 0, 0, textOpacity * 0.4);
        text(this.verb, this.x + 4, this.y + 4);
        
        // Draw main text with stronger color
        let secondaryColor = color(COLORS.secondary);
        secondaryColor.setAlpha(textOpacity);
        fill(secondaryColor);
        text(this.verb, this.x, this.y);
      }
      
      pop();
    }
  }
  
  // Button class for UI elements
  class Button {
    constructor(x, y, w, h, label, action, color = COLORS.primary, textColor = 'white', borderColor = null) {
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
      this.borderColor = borderColor; // New property for custom border color
      this.textBold = false; // New property for bold text
      this.isCircular = false; // New property to determine if button is circular
      this.textSizeMultiplier = 1.0; // New property to adjust text size (default: normal size)
    }
    
    draw() {
      // Isolate drawing context for the button
      push();
      
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
      
      // Use borderColor if specified, otherwise use default subtle border
      if (this.borderColor) {
        stroke(this.borderColor);
        strokeWeight(strokeW); // Relative stroke weight
      } else {
      stroke(0, 50);
      strokeWeight(strokeW); // Relative stroke weight
      }
      
      // Draw either a circle or rounded rectangle based on isCircular property
      if (this.isCircular) {
        // For circular buttons, use the width as diameter
        circle(this.x, this.y, this.w);
      } else {
        // For rectangular buttons, use the standard rectangle
      rect(this.x, this.y, this.w, this.h, cornerRadius);
      }
      
      // Calculate font size relative to button height, applying the text size multiplier
      const fontSize = Math.max(this.h * 0.3 * this.textSizeMultiplier, 7); // 30% of button height * multiplier, minimum 7px
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
      
      // Apply bold text style if specified
      if (this.textBold) {
        textStyle(BOLD);
      } else {
        textStyle(NORMAL);
      }
      
      text(this.label, this.x, this.y);
      
      // Restore drawing context
      pop();
    }
    
    isInside(x, y) {
      if (this.disabled) return false;
      
      if (this.isCircular) {
        // For circular buttons, check if point is within circle
        const distance = dist(x, y, this.x, this.y);
        return distance <= this.w / 2;
      } else {
        // For rectangular buttons, use the standard boundary check
        return x > this.x - this.w/2 && x < this.x + this.w/2 && 
             y > this.y - this.h/2 && y < this.y + this.h/2;
      }
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
  
  class Vessel {
    constructor(ingredients, complete_combinations, name, color, x, y, w, h) {
      this.ingredients = ingredients;
      this.complete_combinations = complete_combinations;
      this.name = name;
      this.displayName = null; // Start with no displayed name
      
      // Map color string names to our color palette values
      if (color === 'white') {
        this.color = COLORS.vesselBase;
      } else if (color === 'yellow') {
        this.color = COLORS.vesselYellow;
      } else if (color === 'green') {
        this.color = COLORS.green;
      } else if (color === '#FF5252') {
        this.color = COLORS.vesselHint;
      } else {
        this.color = color; // Use provided color if it doesn't match any of our mappings
      }
      
      this.x = x;
      this.y = y;
      this.w = w || 150; // Default width
      this.h = h || 50; // Default height
      
      // Legacy scale property - kept for backward compatibility
      this.scale = 1;
      this.targetScale = 1;
      
      // New separate scaling properties for body and text as mentioned in 20250413updates_final.txt
      this.bodyScale = 1;
      this.targetBodyScale = 1;
      this.textScale = 1;
      this.targetTextScale = 1;
      
      this.textMargin = 0.7; // Default text margin as percentage of vessel width - APlasker
      this.isAdvanced = false; // Default to basic vessel
      this.preferredRow = -1; // No preferred row by default
      this.verb = null; // Store the verb that describes this combination
      this.verbDisplayTime = 0; // Don't display verbs by default until explicitly triggered
      
      // ENHANCEMENT - APlasker - Position Persistence Properties
      this.positionStrength = 0;     // Strength of position preference (0-1)
      this.homeRow = -1;             // Established home row
      this.homeColumn = -1;          // Established home column
      this.positionHistory = 0;      // Turns spent in current position
      
      // Shake animation properties
      this.shaking = false;
      this.shakeTime = 0;
      this.shakeDuration = 15; // frames
      this.shakeAmount = 0;
      
      // Determine if this is an advanced vessel based on mapped color
      if (this.color === COLORS.vesselYellow || this.color === COLORS.green || 
          this.color === COLORS.vesselGreen || this.color === COLORS.primary ||
          this.color === COLORS.vesselHint) {
        this.isAdvanced = true;
      }
      
      this.isTutorial = false; // New property to identify tutorial vessels
    }
  
    getDisplayText() {
      // If displayName is set, use that (for animation control)
      if (this.displayName !== null) return this.displayName;
      // Otherwise fall back to regular name or ingredients logic
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
    shake(intensity = 1) {
      this.shaking = true;
      this.shakeTime = 0;
      // Use intensity parameter to scale the shake effect
      this.shakeAmount = 5 * intensity; // Base amount scaled by intensity
      this.shakeDuration = 15 * intensity; // Base duration scaled by intensity
    }
    
    update() {
      // Legacy scale animation - kept for backward compatibility
      this.scale = lerp(this.scale, this.targetScale, 0.2);
      
      // New separate scale animations for body and text
      this.bodyScale = lerp(this.bodyScale, this.targetBodyScale, 0.2);
      this.textScale = lerp(this.textScale, this.targetTextScale, 0.2);
      
      // Update text margin based on scale - APlasker
      // When vessel is being dragged or returning from being dragged,
      // ensure margin transitions smoothly
      if (this.targetTextScale === 1 && this.textMargin > 0.7) {
        // If we're returning to normal size, gradually reduce margin
        this.textMargin = lerp(this.textMargin, 0.7, 0.1);
      } else if (this.textMargin === 0.85) {
        // If margin was set to expanded (0.85) directly, maintain it during dragging
        this.textMargin = 0.85;
      } else {
        // Default transition based on text scale
        this.textMargin = map(this.textScale, 1, 1.1, 0.7, 0.85);
      }
      
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
      
      // Use bodyScale for the vessel body
      scale(this.bodyScale);
      
      // Update color for base vessels to be pure white
      let vesselColor = this.color;
      if (vesselColor === COLORS.vesselBase) {
        vesselColor = 'white'; // Use pure white instead of cream for base vessels
      }
      
      // MODIFIED - Use screen height as reference for stroke weight
      // Calculate stroke weight as a percentage of screen height with minimum value
      const strokeW = Math.max(windowHeight * 0.0025, 2);
      
      // Draw vessel body with bodyScale
      if (this.isAdvanced) {
        // Advanced vessel (pot or pan based on color)
        
        if (this.color === COLORS.green || this.color === COLORS.vesselGreen || this.color === COLORS.primary) {
          // Green vessel now using two circular handles like yellow vessels - APlasker
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke(0, 50); // Use the same subtle border as buttons
          strokeWeight(strokeW);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          const handleSize = this.h * 0.2;
          circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
          circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
        } else if (this.color === COLORS.vesselYellow || this.color === COLORS.vesselHint) {
          // Yellow or Red vessel (pot with two handles) - UNIFIED IMPLEMENTATION
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke(0, 50); // Use the same subtle border as buttons
          strokeWeight(strokeW);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          const handleSize = this.h * 0.2;
          circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
          circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
        }
        
        // Draw vessel body
        fill(vesselColor);
        stroke(0, 50); // Use the same subtle border as buttons
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
        stroke(0, 50); // Use the same subtle border as buttons
        strokeWeight(strokeW);
        
        // Calculate border radius relative to vessel height
        const topCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px
        const bottomCornerRadius = Math.max(this.h * 0.3, 15); // 30% of height, min 15px
        
        // Draw rounded rectangle
        rectMode(CENTER);
        rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
      }
      
      // Reset scale to apply textScale for text
      // This is done by scaling down by bodyScale and then scaling up by textScale
      scale(1/this.bodyScale * this.textScale);
      
      // Draw text inside the vessel
      fill('black');
      noStroke();
      textAlign(CENTER, CENTER);
      
      // MODIFIED - Use screen height as reference for font size
      // Calculate text size as a percentage of screen height with minimum value
      const fontSize = Math.max(windowHeight * 0.015, 10); // 1.5% of screen height, minimum 10px
      textSize(fontSize);
      textStyle(BOLD); // Make text bold
      
      // Split text into lines if needed - use dynamic text margin based on scale - APlasker
      let lines = splitTextIntoLines(this.getDisplayText(), this.w * this.textMargin);
      
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
    
    pulse(duration = 150) {
      console.log(`Pulse method called for vessel: ${this.name || "unnamed"}`);
      
      // Update to use separate scaling for body and text as per 20250413updates_final.txt
      // Body scales to 120% while text only scales to 110%
      this.targetBodyScale = 1.2;
      this.targetTextScale = 1.1;
      
      // Keep legacy targetScale for backward compatibility
      this.targetScale = 1.2;
      
      // Reset all scales after duration
      setTimeout(() => { 
        this.targetBodyScale = 1;
        this.targetTextScale = 1;
        this.targetScale = 1;
      }, duration);
      
      // Log for debugging
      console.log(`Pulsing vessel ${this.name || "unnamed"} with bodyScale=${this.targetBodyScale}, textScale=${this.targetTextScale}, duration=${duration}ms`);
    }
    
    // New method for double pulse animation - used for special completions
    doublePulse(firstDuration = 1000, secondDuration = 800, delay = 200) {
      console.log(`Double pulse animation started for vessel: ${this.name || "unnamed"}`);
      
      // First pulse uses standard scaling
      this.pulse(firstDuration);
      
      // Schedule second pulse after first one completes (plus a small delay)
      setTimeout(() => {
        // Only do second pulse if vessel still exists and isn't being dragged
        if (vessels.includes(this) && this !== draggedVessel) {
          console.log(`Second pulse for vessel: ${this.name || "unnamed"}`);
          
          // Use slightly larger scales for second pulse to make it distinct
          this.targetBodyScale = 1.25;
          this.targetTextScale = 1.15;
          this.targetScale = 1.25; // Legacy support
          
          // Reset scales after second duration
          setTimeout(() => {
            this.targetBodyScale = 1;
            this.targetTextScale = 1;
            this.targetScale = 1;
          }, secondDuration);
        } else {
          console.log(`Skipped second pulse for vessel: ${this.name || "unnamed"} - vessel no longer valid`);
        }
      }, firstDuration + delay);
    }
    
    // New bounce pulse animation - creates a bouncing effect with diminishing pulses
    bouncePulse() {
      console.log(`Bounce pulse animation started for vessel: ${this.name || "unnamed"}`);
      
      // Initial bounce magnitudes and durations - 3 bounces total
      const bounces = [
        { bodyScale: 1.25, textScale: 1.15, duration: 600 },  // First bounce - largest
        { bodyScale: 1.15, textScale: 1.08, duration: 450 },  // Second bounce - medium
        { bodyScale: 1.08, textScale: 1.04, duration: 300 }   // Third bounce - small
      ];
      
      // Function to execute a single bounce with specified parameters
      const executeBounce = (index) => {
        // Skip if we've finished all bounces or vessel is no longer valid
        if (index >= bounces.length || !vessels.includes(this) || this === draggedVessel) {
          return;
        }
        
        const bounce = bounces[index];
        
        // Set target scales for this bounce
        this.targetBodyScale = bounce.bodyScale;
        this.targetTextScale = bounce.textScale;
        this.targetScale = bounce.bodyScale; // Legacy support
        
        console.log(`Bounce ${index+1} for vessel: ${this.name || "unnamed"} - magnitude: ${bounce.bodyScale.toFixed(2)}`);
        
        // Reset to normal size after duration
        setTimeout(() => {
          // Return to normal size
          this.targetBodyScale = 1;
          this.targetTextScale = 1;
          this.targetScale = 1;
          
          // Wait a brief moment before starting the next bounce
          setTimeout(() => {
            // Move to next bounce in sequence
            executeBounce(index + 1);
          }, 150); // 150ms gap between bounces
          
        }, bounce.duration);
      };
      
      // Start the bounce sequence
      executeBounce(0);
    }
    
    // Display the verb above the vessel
    displayVerb() {
      if (this.verb && this.verbDisplayTime > 0) {
        // Create a verb animation the first time
        if (this.verbDisplayTime === 120) { // If this is the first frame of the verb display
          // Debug log
          console.log("Displaying verb:", this.verb, "for vessel:", this.name);
          
          // Create a verb animation starting exactly at the vessel's center position
          animations.push(new VerbAnimation(this.verb, this.x, this.y, this));
        }
        
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
    
    // Set frame rate to 30fps for consistent animation timing across devices
    frameRate(30);
    
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
      
      // Store the recipe object globally for stats access
      recipe = recipeData;
      
      // Update game variables with recipe data
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      ingredients = recipeData.baseIngredients;
      base_ingredients = recipeData.baseIngredients; // Ensure base_ingredients is set for stats
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      
      // Get author information from the database if it exists
      recipeAuthor = recipeData.author || "";
      
      // Load the recipe image if URL is provided
      if (recipeData.imgUrl) {
        console.log("Loading recipe image from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        // Use loadImage with success and error callbacks
        loadImage(
          recipeData.imgUrl,
          // Success callback
          (img) => {
            console.log("Recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
            
            // Set flag that data is loaded for stats display
            recipeDataLoadedForStats = true;
          },
          // Error callback
          (err) => {
            console.error("Error loading recipe image:", err);
            recipeImage = null; // Set to null to indicate loading failed
            isLoadingImage = false;
            
            // Still set the flag even if image fails - we have the other data
            recipeDataLoadedForStats = true;
          }
        );
      } else {
        // No image to load, so mark data as ready immediately
        recipeDataLoadedForStats = true;
      }
      
      console.log("Recipe data loaded successfully");
      isLoadingRecipe = false;
    } catch (error) {
      console.error("Error loading recipe data:", error);
      loadingError = true;
      isLoadingRecipe = false;
      isLoadingImage = false;
      
      // Set data loaded flag to true even on error, so we can show the title screen
      // with fallback values for the stats
      recipeDataLoadedForStats = true;
    }
  }
  
  //draw was here 4-17

  function updateCursor() {
    let overInteractive = false;
    
    if (!gameStarted) {
      // Check start button
      if (startButton.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
      
      // Check tutorial Say hi link
      if (typeof isTutorialMouseOverSayHi !== 'undefined' && isTutorialMouseOverSayHi) {
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
    // Add safety check for initialization state
    if (vessels.length === 0 && !isLoadingRecipe) {
      console.log("Initialization issue detected - reinitializing game");
      initializeGame();
      return false;
    }
    
    // Check if a modal is active - selectively allow interactions with modal elements
    if (modalActive) {
      // Use helper function to check if interacting with a modal element
      if (isModalElement(mouseX, mouseY)) {
        // Allow the event to proceed to HTML elements
        console.log('Mouse interaction allowed for modal element');
        return true;
      }
      
      // Otherwise block the interaction
      console.log('Mouse interaction blocked - modal is active');
      return false;
    }
    
    // Prevent user interaction during auto-combination sequence
    if (autoFinalCombination) {
      return false;
    }
    
    // Check if any easter egg modal is active and handle the click  
    for (let i = eggModals.length - 1; i >= 0; i--) {
      if (eggModals[i].active && eggModals[i].checkClick(mouseX, mouseY)) {
        // Modal was clicked, don't process any other clicks
        return false;
      }
    }
    
    // Skip all interaction if the game has been won
    if (gameWon) {
      // Check if we're clicking on the random recipe hotspot
      if (!isLoadingRandomRecipe && isInRandomRecipeHotspot(mouseX, mouseY)) {
        console.log("Random recipe hotspot clicked at:", mouseX, mouseY);
        isLoadingRandomRecipe = true;
        loadRandomRecipe().finally(() => {
          isLoadingRandomRecipe = false;
        });
        return false;
      }
      
      // Debugging log to help track click coordinates
      console.log("Click on win screen:", mouseX, mouseY);
      
      // Check if the Say hi link was clicked - add this before other win screen clicks
      if (typeof handleSayHiLinkInteraction === 'function' && handleSayHiLinkInteraction(mouseX, mouseY)) {
        console.log("Say hi link handled");
        return false;
      }
      
      // Special handling for tutorial mode - APlasker
      if (isTutorialMode) {
        console.log("Tutorial win screen click detected, isMouseOverLetterScore:", isMouseOverLetterScore);
        
        // Check if recipe card area is clicked
        if (isMouseOverCard) {
          console.log("Tutorial recipe card clicked - opening recipe URL");
          viewRecipe(); // Allow recipe link functionality
          return false;
        }
        
        // Check if score card area is clicked
        if (isMouseOverLetterScore) {
          console.log("Tutorial score card clicked - loading today's recipe");
          
          // Reset tutorial mode
          isTutorialMode = false;
          
          // Reset game state
          gameStarted = false;
          gameWon = false;
          moveHistory = [];
          hintCount = 0;
          vessels = [];
          animations = [];
          
          // Reload the page to get the default recipe
          window.location.reload();
          
          return false;
        }
        
        return false;
      }
      
      // Regular (non-tutorial) win screen handling
      // Check if letter score area is clicked
      if (isMouseOverLetterScore) {
        console.log("Share Score triggered (win screen click)");
        shareScore();
        return false;
      } 
      // Check if recipe card is clicked
      else if (isMouseOverCard) {
        console.log("View Recipe triggered (win screen click)");
        viewRecipe();
        return false;
      }
      
      return;
    }
    
    // Tutorial screen - check if Say hi link was clicked
    if (!gameStarted && typeof tutorialSayHiLinkX !== 'undefined') {
      const isOverTutorialSayHi = (
        mouseX > tutorialSayHiLinkX - tutorialSayHiLinkWidth/2 && 
        mouseX < tutorialSayHiLinkX + tutorialSayHiLinkWidth/2 && 
        mouseY > tutorialSayHiLinkY - tutorialSayHiLinkHeight/2 && 
        mouseY < tutorialSayHiLinkY + tutorialSayHiLinkHeight/2
      );
      
      if (isOverTutorialSayHi) {
        console.log("Say hi link clicked in tutorial");
        if (typeof showFeedbackModal === 'function') {
          showFeedbackModal();
        }
        return false;
      }
    }
    
    if (!gameStarted) {
      // Check if start button was pressed
      if (startButton.isInside(mouseX, mouseY)) {
        startButton.handleClick();
        return;
      }
      
      // Add playtest date selector logic only in playtest mode
      if (typeof isPlaytestMode !== 'undefined' && isPlaytestMode) {
        // Check if date button was pressed
        if (dateButton && dateButton.isInside(mouseX, mouseY)) {
          showDatePicker();
          return;
        }
      }
    } else {
      // Check if hint button was clicked
      if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
        hintButton.handleClick();
        // Update lastAction when hint is used - APlasker
        lastAction = frameCount;
        return;
      }
      
      // Check if a vessel was clicked
      for (let v of vessels) {
        if (v.isInside(mouseX, mouseY)) {
          // Set initial vessel for dragging
          draggedVessel = v;
          // Store original position for proper snapback
          draggedVessel.originalX = v.x;
          draggedVessel.originalY = v.y;
          
          // Store offset to maintain relative mouse position
          offsetX = mouseX - v.x;
          offsetY = mouseY - v.y;
          
          // IMMEDIATELY expand text margin before scale animation starts - APlasker
          // This prevents visual glitching during the transition
          v.textMargin = 0.85;
          
          // Set target scales for body and text (this will happen gradually through update())
          // Body scales to 105% while text only scales to 102.5% as per 20250413updates_final.txt
          v.targetBodyScale = 1.05;
          v.targetTextScale = 1.025;
          
          // Keep legacy targetScale for backward compatibility
          v.targetScale = 1.05;
          
          // Update hover state for dragged vessel
          v.hovering = true;
          
          lastAction = frameCount;
          
          // Update cursor style for feedback
          lastMovedFrame = frameCount;
          break;
        }
      }
    }
    
    // Check for help icon click
    if (!gameWon && isHelpIconHovered) {
      if (typeof showHelpModal === 'function') {
        if (!gameStarted) {
          // On title screen, launch tutorial mode
          console.log("How to Play button clicked on title screen - launching tutorial");
          startTutorial();
        } else {
          // In game, show help modal
          console.log("Help button clicked in game - showing help modal");
        showHelpModal();
        }
        return false; // Prevent other click handling
      }
    }
    
    // Don't process other clicks if help modal is open
    if (typeof helpModal !== 'undefined' && helpModal !== null && helpModal.active) {
      return helpModal.checkClick(mouseX, mouseY);
    }
  }
  
  function mouseDragged() {
    // Check if a modal is active - selectively allow interactions with modal elements
    if (modalActive) {
      // Get the element being dragged over
      const target = document.elementFromPoint(mouseX, mouseY);
      
      // If the target is part of our modal (check parent chain)
      if (target && (
          target.closest('#feedback-modal') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'BUTTON')) {
        // Allow the event to proceed to HTML elements
        return true;
      }
      
      return false;
    }
    
    // Prevent dragging during auto-combination sequence
    if (autoFinalCombination) {
      return false;
    }
    
    if (draggedVessel) {
      draggedVessel.x = mouseX - offsetX;
      draggedVessel.y = mouseY - offsetY;
      // Update last action time
      lastAction = frameCount;
    }
  }
  
  function mouseReleased() {
    // Check if a modal is active - selectively allow interactions with modal elements
    if (modalActive) {
      // Get the element being released over
      const target = document.elementFromPoint(mouseX, mouseY);
      
      // If the target is part of our modal (check parent chain)
      if (target && (
          target.closest('#feedback-modal') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'BUTTON')) {
        // Allow the event to proceed to HTML elements
        return true;
      }
      
      return false;
    }
    
    // Check if help modal was active but is now inactive,
    // ensure HTML elements are properly cleaned up
    if (typeof helpModal !== 'undefined' && helpModal !== null && !helpModal.active && 
        helpModal.htmlElements && helpModal.htmlElements.length > 0) {
      helpModal.removeHTMLElements();
    }
    
    if (draggedVessel) {
      // Reset scales
      draggedVessel.targetScale = 1;
      draggedVessel.targetBodyScale = 1;
      draggedVessel.targetTextScale = 1;
      
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
      
      // Update last action time
      lastAction = frameCount;
      
      if (overHintVessel) {
        // Case 1: Dragged a vessel over the hint
        console.log("Vessel dragged over hint vessel");
        
        // Check if this vessel's ingredients can be added to the hint
        let canAddToHint = false;
        
        if (draggedVessel.ingredients.length > 0) {
          // Check if any of the ingredients in this vessel are required for the hint
          let matchingIngredients = draggedVessel.ingredients.filter(ing => 
            hintVessel.required.includes(ing) && !hintVessel.collected.includes(ing)
          );
          
          if (matchingIngredients.length > 0) {
            // Add ingredients to the hint vessel
            for (let ing of matchingIngredients) {
              hintVessel.addIngredient(ing);
              canAddToHint = true;
            }
          }
        } else if (draggedVessel.name) {
          // Check if the completed combination matches the hint
          if (hintVessel.name === draggedVessel.name) {
            // This is the exact combination the hint is for
            // Add all ingredients directly
            for (let ing of hintVessel.required) {
              if (!hintVessel.collected.includes(ing)) {
                hintVessel.addIngredient(ing);
                canAddToHint = true;
              }
            }
          }
        }
        
        if (canAddToHint) {
          // Create animation
          // ENHANCEMENT - APlasker - Use hint vessel color for animations going to hint vessel
          createCombineAnimation(draggedVessel.x, draggedVessel.y, COLORS.vesselHint, hintVessel.x, hintVessel.y);
          
          // Remove the vessel
          vessels = vessels.filter(v => v !== draggedVessel);
          arrangeVessels();
          
          // Check if hint is complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            
            // ENHANCEMENT - APlasker - Mark newly created vessels from hints
            newVessel.isNewlyCombined = true;
            
            // Set position strength based on vessel type - always advanced for hint vessels
            newVessel.positionStrength = 1.0;
            
            vessels.push(newVessel);
            
            // ENHANCEMENT - APlasker - Assign position based on hint vessel location
            assignPreferredRow(newVessel, hintVessel.y, hintVessel.x);
            
            arrangeVessels();
            
            // Create verb animation for the newly created vessel
            createVerbAnimationForVessel(newVessel);
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
            
            // Check win condition
            if (vessels.length === 1 && vessels[0].name === final_combination.name) {
              // Get the verb from the final combination
              const finalVerb = vessels[0].verb || final_combination.verb || "Complete!";
              
              // Create the final animation instead of immediately setting gameWon
              createFinalVerbAnimation(finalVerb);
              
              // gameWon will be set by the animation when it completes
            }
          }
        } else {
          // Can't add to hint vessel, return to original position with a small shake
          draggedVessel.x = draggedVessel.originalX;
          draggedVessel.y = draggedVessel.originalY;
          draggedVessel.shake();
          
          // BUGFIX - APlasker - Add black counter to move history for invalid hint combination
          moveHistory.push('black');
          turnCounter++; // Increment turn counter for invalid move
          
          // Display a random error message for invalid combination
          showRandomErrorMessage();
          
          console.log("Invalid combination with hint vessel!");
        }
      }
      else if (overVessel) {
        // Case 2: Dragged a vessel over another vessel (potential combination)
        console.log("Vessel dragged over another vessel");
        
        // Check if this is a valid combination
        const new_v = combineVessels(draggedVessel, overVessel);
        
        if (new_v) {
          // Create animation particles
          if (new_v.color === COLORS.green || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary) {
            // Check if this is the final combination
            const isFinalCombination = (vessels.length === 1 || vessels.length - 2 + 1 === 1) && new_v.name === final_combination.name;
            
            // For green vessels (completed combinations), prioritize verb animation
            // But skip creating regular VerbAnimation if this is the final combo (we'll use FinalVerbAnimation instead)
            if (!isFinalCombination) {
              console.log("Completed combination - using verb animation directly");
              
              // Check if the vessel has a verb
              if (new_v.verb) {
                console.log("Creating immediate verb animation for:", new_v.verb);
                // Create verb animation starting exactly at the vessel's center
                animations.push(new VerbAnimation(new_v.verb, new_v.x, new_v.y, new_v));
                // Reset the verbDisplayTime to prevent duplicate animations
                new_v.verbDisplayTime = 119; // Set to 119 instead of 120 to prevent creating another animation
              } else {
                // If no verb is set, use a default verb
                console.log("No verb found, using default verb");
                new_v.verb = "Mix";
                new_v.verbDisplayTime = 119;
                animations.push(new VerbAnimation(new_v.verb, new_v.x, new_v.y, new_v));
              }
            } else {
              console.log("Final combination detected - skipping regular verb animation");
              // Still set verbDisplayTime to prevent auto-animation
              new_v.verbDisplayTime = 119;
            }
          } else {
            // For non-green vessels, use the regular combine animation
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, new_v.x, new_v.y);
          createCombineAnimation(overVessel.x, overVessel.y, overVessel.color, new_v.x, new_v.y);
          }
          
          // Get the index of the dragged vessel
          let draggedIndex = vessels.indexOf(draggedVessel);
          
          // Remove old vessels
          vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
          
          // Mark the new vessel as newly combined for positioning
          new_v.isNewlyCombined = true;
          
          // Set position strength based on vessel type
          if (new_v.isAdvanced) {
            // Advanced vessels (yellow/green) get maximum strength
            new_v.positionStrength = 1.0;
          } else {
            // Base vessels are capped at 0.5
            new_v.positionStrength = 0.5;
          }
          
          // Insert the new vessel at the position of the target vessel
          // This ensures the new vessel appears close to where the user dropped it
          vessels.splice(overVesselIndex, 0, new_v);
          
          // IMPORTANT: Use appropriate pulse animation based on vessel type
          console.log("Triggering pulse animation for newly created vessel");
          
          // Use bouncePulse for green vessels (completed combinations)
          if (new_v.color === COLORS.green || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary) {
            console.log("Using bounce pulse for completed green combination");
            new_v.bouncePulse(); // Use new bounce pulse animation
          } else {
            // Use regular pulse for yellow vessels (intermediate combinations)
            console.log("Using regular pulse for yellow intermediate combination");
            new_v.pulse(500); // Changed from 1000ms to 500ms (2x faster)
          }
          
          // Debug log to verify flow before assigning preferred row
          console.log("MOUSE RELEASED: About to assign preferred row to new vessel");
          
          // Assign preferred row based on both vessels' positions
          const avgY = (draggedVessel.y + overVessel.y) / 2;
          const avgX = (draggedVessel.x + overVessel.x) / 2;
          assignPreferredRow(new_v, avgY, avgX);
          
          // Re-arrange vessels with the new vessel in place
          arrangeVessels();
          
          // Check win condition
          if (vessels.length === 1 && vessels[0].name === final_combination.name) {
            // ENHANCEMENT - APlasker - Add increased version number to indicate this change was installed 
            console.log("Win condition met! Completed recipe:", final_combination.name, "- APlasker v2.0");
            
            // Get the verb from the final combination
            const finalVerb = vessels[0].verb || final_combination.verb || "Complete!";
            
            // Create the final animation
            createFinalVerbAnimation(finalVerb);
          }
          
          // Add this to the move history
          moveHistory.push(new_v.color === 'black' ? 'black' : 'white');
          
          // Add one red counter every 10 white counters - Easter Egg feature
          // APlasker - This is a "random bonus" feature that awards periodic Easter Eggs
          // The chance increases the longer they play without getting one
          if (moveHistory.filter(m => m === 'white').length % 10 === 0 && Math.random() < 0.2 + (turnCounter / 100)) {
            moveHistory.push({type: 'egg'});
          }
          
          // Increment the turn counter
          turnCounter += 2; // Combining generally counts as 2 turns
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
              
              // ENHANCEMENT - APlasker - Mark newly created vessels from hints
              newVessel.isNewlyCombined = true;
              
              // Set position strength based on vessel type - always advanced for hint vessels
              newVessel.positionStrength = 1.0;
              
              vessels.push(newVessel);
              
              // ENHANCEMENT - APlasker - Assign position based on hint vessel location
              assignPreferredRow(newVessel, hintVessel.y, hintVessel.x);
              
              arrangeVessels();
              
              // Create verb animation for the newly created vessel
              createVerbAnimationForVessel(newVessel);
              
              // Reset hint
              hintVessel = null;
              showingHint = false;
            }
          } else {
            // APlasker - Check if this was an Easter egg combination
            const isEasterEgg = typeof eggFound !== 'undefined' && eggFound === true;
            
            if (isEasterEgg) {
              // This was an Easter egg combination, reset the flag
              console.log("Easter egg was found, not counting as an invalid combination");
              eggFound = false;
              
              // Let vessels snap back to their original positions (handled by the egg modal)
              // Do not add black counter or show error message
            } else {
              // Combination failed - shake both vessels
              draggedVessel.x = draggedVessel.originalX;
              draggedVessel.y = draggedVessel.originalY;
              draggedVessel.shake();
              overVessel.shake();
              
              // Add black counter to move history for invalid combination
              moveHistory.push('black');
              turnCounter++; // Increment turn counter for invalid move
              
              console.log("Invalid combination!");
              
              // Display a random error message for invalid combination
              showRandomErrorMessage();
            }
          }
        }
      } else {
        // Case 3: Dragged a vessel but not over another vessel or hint
        console.log("Vessel dragged but not combined - returning to original position");
        
        // Return the vessel to its original position
        draggedVessel.snapBack();
      }
      
      // Reset dragged vessel
      draggedVessel = null;
      offsetX = 0;
      offsetY = 0;
    }
    
    // Reset eggFound flag at the end of mouseReleased to ensure it's not carried over to next interaction
    // This fixes the issue where the first drag after an egg combination doesn't work correctly
    if (eggFound) {
      console.log("Resetting eggFound flag at end of mouseReleased()");
      eggFound = false;
    }
    
    // Reset hover states for all vessels
    for (let v of vessels) {
      v.hovering = false;
    }
    
    // Update cursor style
    lastMovedFrame = frameCount;
  }
  
  function createCombineAnimation(startX, startY, color, targetX, targetY) {
    for (let i = 0; i < 5; i++) {
      animations.push(new CombineAnimation(startX, startY, color, targetX, targetY));
    }
  }
  
  function startGame() {
    // Ensure all necessary initialization has happened before starting game
    if (vessels.length === 0 || isLoadingRecipe) {
      console.log("Cannot start game yet - initialization incomplete");
      return;
    }
    
    gameStarted = true;
    
    // Trigger help button animation from rectangular to circular
    helpButtonAnimating = true;
    helpButtonAnimationProgress = 0;
    
    // Initialize lastAction to current frame count when game starts - APlasker
    lastAction = frameCount;
    
    // Reset inactivity reminder count when game starts
    inactivityReminderCount = 0;
    
    // Reset partial combo message tracking - APlasker
    firstPartialComboCreated = false;
    usedPartialComboMessages = [];
    
    // Reset error message tracking - APlasker
    firstErrorOccurred = false;
    usedErrorMessages = [];
    
    // Reset byline to default - APlasker
    currentByline = "Drop one ingredient on to another to combine!"; // Updated default byline - APlasker
    nextByline = "";
    bylineTimer = 0;
    bylineTransitionState = "stable";
    bylineOpacity = 255;
    isTransitioning = false;
    
    // Force a re-arrangement of vessels to ensure proper positioning
    console.log("Ensuring vessels are properly arranged");
    arrangeVessels();
  }
  
  // Function to start tutorial mode - APlasker
  function startTutorial() {
    console.log("Starting tutorial mode with recipe from date:", tutorialRecipeDate);
    
    // Set tutorial mode flag
    isTutorialMode = true;
    
    // Reset game state
    gameWon = false;
    turnCounter = 0;
    moveHistory = [];
    animations = [];
    vessels = [];
    
    // Reset tutorial-specific variables
    tutorialErrorCount = 0;
    
    // Reset all tutorial message flags - APlasker
    tutorialMessagesShown = {
      startShown: false,
      inactivityShown: false,
      firstErrorShown: false,
      subsequentErrorsShown: false,
      firstSuccessShown: false,
      firstComboCompletedShown: false
    };
    
    // Clear any existing recipe data
    intermediate_combinations = [];
    final_combination = {};
    ingredients = [];
    
    // Set loading state
    isLoadingRecipe = true;
    
    // Load the tutorial recipe
    loadTutorialRecipe().then(() => {
      // Once recipe is loaded, start the game
      gameStarted = true;
      
      // Trigger help button animation from rectangular to circular
      helpButtonAnimating = true;
      helpButtonAnimationProgress = 0;
      
      // Initialize lastAction to current frame count
      lastAction = frameCount;
      
      // Reset message tracking
      firstPartialComboCreated = false;
      usedPartialComboMessages = [];
      firstErrorOccurred = false;
      usedErrorMessages = [];
      
      // Set tutorial-specific byline
      currentByline = tutorialBylines.start;
      tutorialMessagesShown.startShown = true; // Mark start message as shown
      nextByline = "";
      bylineTimer = 0;
      bylineTransitionState = "stable";
      bylineOpacity = 255;
      isTransitioning = false;
      
      // Arrange vessels for tutorial
      console.log("Arranging vessels for tutorial");
      arrangeVessels();
      
      // Automatically show help modal after a short delay to ensure everything is loaded
      setTimeout(() => {
        console.log("Automatically showing help modal for tutorial");
        if (typeof showHelpModal === 'function') {
          showHelpModal();
        }
      }, 500); // 500ms delay to ensure the game is fully initialized
    }).catch(error => {
      console.error("Error loading tutorial recipe:", error);
      isLoadingRecipe = false;
      loadingError = true;
    });
  }
  
  // Function to load the tutorial recipe - APlasker
  async function loadTutorialRecipe() {
    try {
      console.log("Loading tutorial recipe from date:", tutorialRecipeDate);
      
      // Use the existing fetchRecipeByDate function with our tutorial date
      const recipeData = await fetchRecipeByDate(tutorialRecipeDate);
      
      if (!recipeData) {
        console.error("No tutorial recipe data found");
        throw new Error("Tutorial recipe not found");
      }
      
      console.log("Tutorial recipe data loaded successfully");
      
      // Store recipe data in the global variable
      recipe_data = recipeData;
      
      // Store the recipe object globally for stats access
      recipe = recipeData;
      
      // Update game variables with recipe data
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      ingredients = recipeData.baseIngredients;
      base_ingredients = recipeData.baseIngredients;
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A tutorial recipe to help you learn the game!";
      recipeAuthor = recipeData.author || "Tutorial";
      
      // Load the recipe image if URL is provided
      if (recipeData.imgUrl) {
        console.log("Loading tutorial recipe image from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        // Use loadImage with success and error callbacks
        loadImage(
          recipeData.imgUrl,
          // Success callback
          (img) => {
            console.log("Tutorial recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
            recipeDataLoadedForStats = true;
          },
          // Error callback
          (err) => {
            console.error("Error loading tutorial recipe image:", err);
            recipeImage = null;
            isLoadingImage = false;
            recipeDataLoadedForStats = true;
          }
        );
      } else {
        recipeDataLoadedForStats = true;
      }
      
      // Initialize game with the tutorial recipe
      initializeGame();
      
      // Set loading state to false
      isLoadingRecipe = false;
      
    } catch (error) {
      console.error("Error loading tutorial recipe:", error);
      loadingError = true;
      isLoadingRecipe = false;
      isLoadingImage = false;
      recipeDataLoadedForStats = true;
      throw error;
    }
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
    // Add safety check for initialization state
    if (vessels.length === 0 && !isLoadingRecipe) {
      console.log("Initialization issue detected - reinitializing game");
      initializeGame();
      return false;
    }
    
    // Check if a modal is active - selectively allow interactions with modal elements
    if (modalActive) {
      // Use helper function to check if interacting with a modal element
      if (isModalElement(touches[0].x, touches[0].y)) {
        // Allow the event to proceed to HTML elements
        console.log('Touch interaction allowed for modal element');
        return true;
      }
      
      // Otherwise block the interaction
      console.log('Touch interaction blocked - modal is active');
      return false;
    }
    
    // Prevent user interaction during auto-combination sequence
    if (autoFinalCombination) {
      return false;
    }
    
    // Update mouse coordinates to match touch position first
    if (touches.length > 0) {
      mouseX = touches[0].x;
      mouseY = touches[0].y;
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
        
        // Tutorial screen - check if Say hi link was touched
        if (typeof tutorialSayHiLinkX !== 'undefined') {
          const isOverTutorialSayHi = (
            touchX > tutorialSayHiLinkX - tutorialSayHiLinkWidth/2 && 
            touchX < tutorialSayHiLinkX + tutorialSayHiLinkWidth/2 && 
            touchY > tutorialSayHiLinkY - tutorialSayHiLinkHeight/2 && 
            touchY < tutorialSayHiLinkY + tutorialSayHiLinkHeight/2
          );
          
          if (isOverTutorialSayHi) {
            console.log("Say hi link touched in tutorial");
            if (typeof showFeedbackModal === 'function') {
              showFeedbackModal();
              touchHandled = true;
              return false;
            }
          }
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
        
        // Check if the Say hi link was touched (in win screen)
        if (typeof handleSayHiLinkInteraction === 'function' && handleSayHiLinkInteraction(touchX, touchY)) {
          console.log("Say hi link handled in win screen");
          touchHandled = true;
          return false;
        }
        
        // Special handling for tutorial mode - APlasker
        if (isTutorialMode) {
          console.log("Tutorial win screen touch detected");
          
          // Use simplified hover detection based on screen position
          isMouseOverLetterScore = (touchY >= height/2);
          isMouseOverCard = (touchY < height/2);
          
          // Handle recipe card clicks in tutorial mode
          if (isMouseOverCard) {
            console.log("Tutorial recipe card touched - opening recipe URL");
            viewRecipe(); // Allow recipe link functionality
            touchHandled = true;
            return false;
          }
          
          // Handle score card click
          if (isMouseOverLetterScore) {
            console.log("Tutorial score card touched - loading today's recipe");
            
            // Reset tutorial mode
            isTutorialMode = false;
            
            // Reset game state
            gameStarted = false;
            gameWon = false;
            moveHistory = [];
            hintCount = 0;
            vessels = [];
            animations = [];
            
            // Reload the page to get the default recipe
            window.location.reload();
            
            touchHandled = true;
            return false;
          }
          
          touchHandled = true;
          return false;
        }
        
        // Regular (non-tutorial) win screen handling
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
            
            // IMMEDIATELY expand text margin before scale animation starts - APlasker
            // This prevents visual glitching during the transition
            v.textMargin = 0.85;
            
            // Set target scales for body and text (this will happen gradually through update())
            // Body scales to 105% while text only scales to 102.5% as per 20250413updates_final.txt
            v.targetBodyScale = 1.05;
            v.targetTextScale = 1.025;
            
            // Keep legacy targetScale for backward compatibility
            v.targetScale = 1.05; // MODIFIED - Reduced scale up when dragging from 1.1 to 1.05
            
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
      
      // Check for help icon touch
      if (!gameWon) {
        // Check if touch is on help icon - adapt to current shape
        const progress = helpButtonAnimationProgress;
        
        // Define dimensions for rectangular button mode 
        const rectWidth = Math.max(playAreaWidth * 0.15, 90); // Width for "First Time?" text
        const rectHeight = helpIconSize; // Same height as circle
        
        // Calculate the 90% horizontal position in the play area
        const finalCircleX = playAreaX + (playAreaWidth * 0.9);
        const circleX = finalCircleX; // Circle is always at the 90% mark
        
        // Calculate the rectangle center position to align right edges
        const rectX = circleX + helpIconSize/2 - rectWidth/2;
        
        // Calculate interpolated width based on animation progress
        const currentWidth = rectWidth - (rectWidth - helpIconSize) * progress;
        
        // Calculate current center X position (transitions from rectangle center to circle center)
        const currentCenterX = rectX + (circleX - rectX) * progress;
        
        // Different hit detection based on shape
        let touchedHelpButton = false;
        
        if (progress < 0.5) {
          // More rectangular - use rectangle hit detection
          touchedHelpButton = (
            touchX > currentCenterX - currentWidth/2 &&
            touchX < currentCenterX + currentWidth/2 &&
            touchY > helpIconY - rectHeight/2 &&
            touchY < helpIconY + rectHeight/2
          );
        } else {
          // More circular - use circle hit detection
          touchedHelpButton = dist(touchX, touchY, circleX, helpIconY) < helpIconSize/2;
        }
        
        if (touchedHelpButton) {
          if (typeof showHelpModal === 'function') {
            if (!gameStarted) {
              // On title screen, launch tutorial mode
              console.log("How to Play button touched on title screen - launching tutorial");
              startTutorial();
            } else {
              // In game, show help modal
              console.log("Help button touched in game - showing help modal");
            showHelpModal();
            }
            touchHandled = true;
            return false; // Prevent other touch handling
          }
        }
        
        // Don't process other touches if help modal is open
        if (typeof helpModal !== 'undefined' && helpModal !== null && helpModal.active) {
          touchHandled = helpModal.checkClick(touchX, touchY);
          return false;
        }
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
    
    // Initialize byline transition variables - APlasker
    nextByline = "";
    bylineTransitionState = "stable";
    bylineOpacity = 255;
    isTransitioning = false;
    
    // Randomize the order of vessels
    shuffleArray(vessels);
    
    // Initial arrangement of vessels
    arrangeVessels();
    
    // Set hint button at a fixed position from bottom of screen
    hintButtonY = height - 150; // 150px from bottom of screen
    
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
    
    // Create hint button with white background and black border (changed from grey outline)
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
    
    // Set text to bold
    hintButton.textBold = true;
    
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
    
    // Set text to bold for Cook! button
    startButton.textBold = true;
    
    // Set tutorialButton to null (removed button)
    tutorialButton = null;
    
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
    partialCombinations = []; // Reset partial combinations
    hintedCombos = []; // Track which combos have been hinted
    hintedCombo = null; // Currently highlighted combo for recipe card
    lastHintTime = 0; // Track when the last hint was requested
    hintCooldown = 500; // 0.5 second cooldown between hints (in milliseconds)
    
    // Reset byline state
    currentByline = "Drop one ingredient on to another to combine!"; // Updated default byline - APlasker
    nextByline = "";
    bylineTimer = 0;
    bylineTransitionState = "stable";
    bylineOpacity = 255;
    isTransitioning = false;
    
    // Reset message tracking
    firstErrorOccurred = false;
    firstPartialComboCreated = false;
    usedPartialComboMessages = [];
    usedErrorMessages = [];
    firstInactivityMessageShown = false; // Added to track first inactivity message - APlasker
    inactivityReminderCount = 0;
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
  
  
  
  
  // Add touch release support for mobile devices
  function touchEnded() {
    // Check if a modal is active - selectively allow interactions with modal elements
    if (modalActive) {
      // Get touch coordinates
      const touchX = touches.length > 0 ? touches[0].x : mouseX;
      const touchY = touches.length > 0 ? touches[0].y : mouseY;
      
      // Get the element being touched
      const target = document.elementFromPoint(touchX, touchY);
      
      // If the target is part of our modal (check parent chain)
      if (target && (
          target.closest('#feedback-modal') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'BUTTON' ||
          target.tagName === 'A')) { // Add support for anchor tags - APlasker
        // Allow the event to proceed to HTML elements
        console.log('Touch event allowed for modal element: ' + (target.tagName || 'unknown'));
        
        // Special handling for anchor tags - APlasker
        if (target.tagName === 'A') {
          console.log('Anchor tag detected, allowing default browser behavior');
          
          // For maximum compatibility, add a small timeout before allowing the event
          // This helps ensure the default browser behavior works properly
          setTimeout(() => {
            // Attempt to programmatically click the link as a fallback (for older browsers)
            target.click();
          }, 10);
        }
        
        return true; // Allow default behavior for the browser
      }
      
      return false;
    }
    
    // Check if help modal was active but is now inactive,
    // ensure HTML elements are properly cleaned up
    if (typeof helpModal !== 'undefined' && helpModal !== null && !helpModal.active && helpModal.htmlElements && helpModal.htmlElements.length > 0) {
      helpModal.removeHTMLElements();
    }
    
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
    // Check if a modal is active - selectively allow interactions with modal elements
    if (modalActive) {
      // Get touch coordinates
      const touchX = touches.length > 0 ? touches[0].x : mouseX;
      const touchY = touches.length > 0 ? touches[0].y : mouseY;
      
      // Get the element being touched
      const target = document.elementFromPoint(touchX, touchY);
      
      // If the target is part of our modal (check parent chain)
      if (target && (
          target.closest('#feedback-modal') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'BUTTON')) {
        // Allow the event to proceed to HTML elements
        return true;
      }
      
      return false;
    }
    
    // Get the touch coordinates
    const touchX = touches.length > 0 ? touches[0].x : mouseX;
    const touchY = touches.length > 0 ? touches[0].y : mouseY;
    
    // Prevent dragging during auto-combination sequence
    if (autoFinalCombination) {
      return false;
    }
    
    // Update drag position if we have a dragged vessel
    if (draggedVessel) {
      draggedVessel.x = touchX - offsetX;
      draggedVessel.y = touchY - offsetY;
      
      // Ensure vessel scale is maintained during dragging - APlasker
      draggedVessel.targetScale = 1.05;
      
      // Update cursor style for feedback
      lastMovedFrame = frameCount;
      
      // Check for vessels that are overlapping
      overVessel = null;
      for (let vessel of vessels) {
        if (vessel !== draggedVessel && vessel.isInside(touchX, touchY)) {
          overVessel = vessel;
          break;
        }
      }
      
      // Update last action time
      lastAction = frameCount;
    }
    
    // If help modal is open, allow it to handle touch movement
    if (typeof helpModal !== 'undefined' && helpModal !== null && helpModal.active) {
      return false;
    }
    
    // Prevent default touch behavior (prevents scrolling etc.)
    return false;
  }
  

  
  // Global variable for card hover state
  let isMouseOverCard = false;
  
  
  
  // Function to transition to a new byline message with fade effect
  function updateBylineWithTransition(newMessage, duration = bylineHintDuration) {
    // Prevent interrupting ongoing transitions
    if (isTransitioning) return;
    
    // Don't transition if the message is the same
    if (currentByline === newMessage) return;
    
    // Set transition flag
    isTransitioning = true;
    
    // Store the new message for after fadeout
    nextByline = newMessage;
    
    // Store the duration for the message
    transitionDuration = duration;
    
    // Start fadeout
    bylineTransitionState = "fading-out";
    bylineOpacity = 255;
  }
  
  // Function to handle showing random error messages - APlasker
  function showRandomErrorMessage() {
    // For tutorial mode, use specific tutorial bylines
    if (isTutorialMode) {
      tutorialErrorCount++;
      
      if (tutorialErrorCount === 1 && !tutorialMessagesShown.firstErrorShown) {
        // First error in tutorial - show message if it hasn't been shown yet
        updateBylineWithTransition(tutorialBylines.firstError, bylineHintDuration);
        tutorialMessagesShown.firstErrorShown = true;
      } else if (tutorialErrorCount > 1 && !tutorialMessagesShown.subsequentErrorsShown) {
        // Second or subsequent errors in tutorial - show message if it hasn't been shown yet
        updateBylineWithTransition(tutorialBylines.subsequentErrors, bylineHintDuration);
        tutorialMessagesShown.subsequentErrorsShown = true;
      }
      
      // Update last action timestamp
      lastAction = frameCount;
      return;
    }
    
    // Standard game error message logic (existing code)
    let probability = firstErrorOccurred ? 0.33 : 0.75;
    
    // Mark first error as occurred
    if (!firstErrorOccurred) {
      firstErrorOccurred = true;
    }
    
    // Random chance to show message based on probability
    if (Math.random() < probability) {
      // Find messages that haven't been used yet
      const unusedMessages = errorMessages.filter(msg => !usedErrorMessages.includes(msg));
      
      // If all messages have been used, reset the tracking
      if (unusedMessages.length === 0) {
        usedErrorMessages = [];
        // Now all messages are unused
        const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        usedErrorMessages.push(randomMessage);
        updateBylineWithTransition(randomMessage, bylineHintDuration);
      } else {
        // Select a random unused message
        const randomMessage = unusedMessages[Math.floor(Math.random() * unusedMessages.length)];
        // Track this message as used
        usedErrorMessages.push(randomMessage);
        // Display the message
        updateBylineWithTransition(randomMessage, bylineHintDuration);
      }
    }
    
    // Update last action timestamp
    lastAction = frameCount;
  }
  
  // Variables for the help icon
  let helpIconX, helpIconY, helpIconSize;
  let isHelpIconHovered = false;
  let helpButtonAnimationProgress = 0; // 0 = rectangular, 1 = circular
  let helpButtonAnimating = false;
  let helpButtonAnimationDuration = 7; // Animation duration in frames (reduced for 4x speed)
  
  // Variable to track if recipe data is fully loaded for stats display
  let recipeDataLoadedForStats = false;
  
  // Function to draw the help icon
  function drawHelpIcon() {
    // Calculate the 93% horizontal position in the play area (moved from 90% to 93%)
    const finalCircleX = playAreaX + (playAreaWidth * 0.93);
    
    // Position vertically at 2.25% of play area height from the top (updated from 1.5%)
    helpIconSize = Math.max(playAreaWidth * 0.04, 25); // 4% of play area width, minimum 25px
    
    // Set helpIconX to be the final circle position
    helpIconX = finalCircleX;
    helpIconY = playAreaY + (playAreaHeight * 0.0225); // 2.25% of play area height from the top (updated from 1.5%)
    
    // Update animation progress if animating
    if (helpButtonAnimating) {
      helpButtonAnimationProgress += 1 / helpButtonAnimationDuration;
      if (helpButtonAnimationProgress >= 1) {
        helpButtonAnimationProgress = 1;
        helpButtonAnimating = false;
      }
    }
    
    // Calculate interpolated values for animation
    const progress = helpButtonAnimationProgress;
    
    // Define dimensions for rectangular button mode
    const rectWidth = Math.max(playAreaWidth * 0.15, 90); // Width for "How to Play" text (updated from 15% to 18%)
    const rectHeight = helpIconSize; // Same height as circle
    const cornerRadius = rectHeight / 2;
    
    // Calculate the position for the circle
    const circleX = finalCircleX; // Circle is always at the 90% mark
    
    // Calculate the rectangle center position
    // For right edges to align: rectangle's right edge (rectX + rectWidth/2) = circle's right edge (circleX + circleSize/2)
    // So rectX = circleX + circleSize/2 - rectWidth/2
    const rectX = circleX + helpIconSize/2 - rectWidth/2;
    
    // Calculate interpolated width based on animation progress
    const currentWidth = rectWidth - (rectWidth - helpIconSize) * progress;
    
    // Calculate current center X position (transitions from rectangle center to circle center)
    const currentCenterX = rectX + (circleX - rectX) * progress;
    
    // Check if mouse is over the button - different hit detection based on shape
    if (progress < 0.5) {
      // More rectangular - use rectangle hit detection
      isHelpIconHovered = (
        mouseX > currentCenterX - currentWidth/2 &&
        mouseX < currentCenterX + currentWidth/2 &&
        mouseY > helpIconY - rectHeight/2 &&
        mouseY < helpIconY + rectHeight/2
      );
    } else {
      // More circular - use circle hit detection
      isHelpIconHovered = dist(mouseX, mouseY, circleX, helpIconY) < helpIconSize/2;
    }
    
    // Get the appropriate color (green normally, red when hovered)
    const buttonColor = isHelpIconHovered ? COLORS.secondary : COLORS.primary;
    
    // Draw the button shape
    fill('white'); // Use white fill like base vessels
    strokeWeight(2);
    stroke(buttonColor);
    
    if (progress < 0.001) {
      // Fully rectangular button
      rectMode(CENTER);
      rect(rectX, helpIconY, currentWidth, rectHeight, cornerRadius);
    } else if (progress > 0.999) {
      // Fully circular button
      circle(circleX, helpIconY, helpIconSize);
    } else {
      // Transitioning - draw rounded rectangle with animated width and position
      rectMode(CENTER);
      rect(currentCenterX, helpIconY, currentWidth, rectHeight, cornerRadius);
    }
    
    // Draw the text with proper fade effect - no outline for better legibility
    if (progress < 0.5) {
      // Show "First Time?" text with fadeout
      const textOpacity = 1 - (progress * 2); // Fade out from 1 to 0 during first half
      fill(red(buttonColor), green(buttonColor), blue(buttonColor), 255 * textOpacity);
      noStroke(); // Remove outline for better legibility
      textAlign(CENTER, CENTER);
      textSize(Math.max(helpIconSize * 0.3, 12)); // Smaller text size for "First Time?"
      textStyle(NORMAL);
      text("First Time?", currentCenterX, helpIconY);
    } 
    
    if (progress > 0.5) {
      // Show "?" with fadein
      const textOpacity = (progress - 0.5) * 2; // Fade in from 0 to 1 during second half
      fill(red(buttonColor), green(buttonColor), blue(buttonColor), 255 * textOpacity);
      noStroke(); // Remove outline for better legibility
      textAlign(CENTER, CENTER);
      textSize(helpIconSize * 0.6);
      textStyle(NORMAL);
      text("?", circleX, helpIconY + helpIconSize * 0.05);
    }
    
    // Reset text style
    textStyle(NORMAL);
    
    // Change cursor when hovering over the button
    if (isHelpIconHovered) {
      cursor(HAND);
    }
  }
  
  
  // Update the move history when a new vessel is created
  function checkAddToMoveHistory(new_v) {
    // Ensure we're using the COLORS object for consistency
    if (new_v.color === COLORS.vesselYellow) {
      moveHistory.push(COLORS.vesselYellow);
    } else if (new_v.color === COLORS.green || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary) {
      moveHistory.push(COLORS.green); // Use our explicit green color for all green vessels
    } else if (new_v.color === COLORS.vesselBase) {
      moveHistory.push(COLORS.vesselBase);
    } else if (new_v.color === COLORS.vesselHint) {
      // Count hint vessels in move history
      moveHistory.push(COLORS.vesselHint);
    } else {
      // Default to white for any other colors
      moveHistory.push('white');
    }
  }
  
  // Draw a vessel for the tutorial with a specific color
  function drawSimpleTutorialVessel(x, y, size, color, isShaking = false) {
    const handleWidth = size * 0.3;
    const handleHeight = size * 0.25;
    const bodyWidth = size * 0.8;
    const bodyHeight = size * 0.65;
    const cornerRadius = size * 0.12;
    
    push();
    
    // Determine the vessel outline color based on the fill color - now using subtle border for all
    let outlineColor = color === COLORS.vesselYellow || color === COLORS.vesselHint ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    
    // Set the stroke properties
    stroke(outlineColor);
    strokeWeight(size * 0.05); // Scale stroke weight with size
    
    // Draw the vessel handle
    fill(color);
    rect(
      x - handleWidth / 2,
      y - bodyHeight / 2 - handleHeight,
      handleWidth,
      handleHeight,
      cornerRadius, cornerRadius, 0, 0
    );
    
    // Draw the vessel body
    rect(
      x - bodyWidth / 2,
      y - bodyHeight / 2,
      bodyWidth,
      bodyHeight,
      cornerRadius
    );
    
    pop();
  }
  
  // Helper function to check if a point is interacting with a modal element
  function isModalElement(x, y) {
    // Get the element at the specified coordinates
    const target = document.elementFromPoint(x, y);
    
    // Check if the target is part of our modal (check parent chain)
    return target && (
      target.closest('#feedback-modal') || 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' // Add support for anchor tags - APlasker
    );
  }
  
  // Create a tutorial vessel with the same appearance as a game vessel
  function createTutorialVessel(name, colorType, x, y, width, height) {
    // Map color types to appropriate vessel configurations
    let ingredients = [name]; // Use the name as the only ingredient
    let complete_combinations = [];
    let color;
    let isComplete = false;
    
    // Configure vessel based on color type
    if (colorType === "white") {
      // Basic ingredient
      color = "white";
    } else if (colorType === "yellow") {
      // Partial combination
      color = COLORS.vesselYellow;
      isComplete = false;
    } else if (colorType === "green") {
      // Complete combination
      color = COLORS.green;
      isComplete = true;
    } else if (colorType === "red" || colorType === "#FF5252") {
      // Hint vessel
      color = COLORS.vesselHint;
    }
    
    // Create a standard vessel with the right configuration
    const vessel = new Vessel(ingredients, complete_combinations, name, color, x, y, width, height);
    
    // Configure for tutorial context
    vessel.isTutorial = true;
    vessel.isComplete = isComplete;
    
    // Ensure text formatting is consistent with game vessels
    vessel.getDisplayText = function() {
      return this.name;
    };
    
    // Set proper text margin for correct text wrapping
    vessel.textMargin = 0.75; // Use 75% of vessel width for text
    
    // Scale down both vessel body and text to 66% of normal size
    vessel.bodyScale = 0.66;
    vessel.textScale = 0.66;
    
    return vessel;
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
    
    // Position title at 5% from top of play area (instead of fixed 40px)
    const titleY = playAreaY + (playAreaHeight * 0.05);
    
    // Draw each letter with alternating colors
  }
  
  // Tutorial mode variables - Added by APlasker
  let tutorialButton; // Button for launching tutorial mode
  let isTutorialMode = false; // Flag to track if we're in tutorial mode
  let tutorialRecipeDate = "01/01/2001"; // Date to use for the tutorial recipe
  let tutorialBylines = {
    start: "Try combining the Tomato with the Garlic!",
    inactivity: "Tap the question mark up top for the rules!",
    firstError: "Hmm those don't go together. Try a hint!",
    subsequentErrors: "Hmm... Flour, tomatos, cheese... could be a pizza?",
    firstSuccess: "Perfect! What else does it need?",
    firstComboCompleted: "Nice job! On to the next step!"
  }; // Object to store tutorial-specific bylines
  // Flags to track which tutorial messages have been shown - APlasker
  let tutorialMessagesShown = {
    startShown: false,
    inactivityShown: false,
    firstErrorShown: false,
    subsequentErrorsShown: false,
    firstSuccessShown: false,
    firstComboCompletedShown: false
  }; // Tracking which messages have been shown
  let tutorialErrorCount = 0; // Track incorrect combination attempts in tutorial
  
  