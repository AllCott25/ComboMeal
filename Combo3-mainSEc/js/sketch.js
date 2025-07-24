/*
 * Culinary Logic Puzzle v20250623.1930PM.EDT
 * Created by APlasker
 * Last Updated: June 23, 2025 (7:30 PM EDT) by APlasker - Future-proofed enhanced streak system with complete migration support.
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
  let playingTime = 0; // Total time played in seconds
  let startTime = 0; // Timestamp when game started
  let gameTimer = 0; // Current game time in seconds
  let gameTimerActive = false; // Whether the timer is currently running
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
  let startedCombinations = []; // Track all combos that have ever been started (partial or completed) - APlasker
  
  // Profile state variables - APlasker
  window.profileActive = false; // Whether profile screen is currently active - made global
  window.previousProfileState = 'title'; // Track where user came from: 'title' or 'win' - made global
  
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
  
  // APlasker: Define star colors
  const STAR_YELLOW = '#FFD700'; // Gold-ish yellow
  const STAR_GREY = '#808080';   // Standard grey
  const STAR_OUTLINE = '#000000'; // Black
  
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
  
  // Session streak tracking - APlasker
  let sessionStartStreak = 0;
  
  // Extract all individual ingredients (will be replaced with data from Supabase)
  let ingredients = [...new Set(intermediate_combinations.flatMap(c => c.required))];
  
  // DUPLICATE INGREDIENT FIX: Global variable to track ingredient instances
  let base_ingredient_instances = []; // Will store ingredient instances with metadata
  
  // Global variables
  let gameWon = false;
  let gameStarted = false; // Missing variable declaration - APlasker
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
  
  // Global variable for wallpaper SVG - APlasker
  let wallpaperSVG;
  let wallpaperSVGHighRes; // High-resolution version for crisp rendering - APlasker
  let wallpaperAnimation; // Global wallpaper animation instance - APlasker
  let wallpaperHighResImage; // Final p5.js compatible image - APlasker
  let wallpaperImageReady = false; // Track when wallpaper image is truly loaded - APlasker
  let wallpaperAnimationActive = false; // Track if wallpaper animation is running - APlasker
  let wallpaperLoadingStartTime = null; // Track wallpaper loading timeout - BUGFIX
  let loadingComplete = false; // Track when loading is complete for split reveal - APlasker
  
  // Completion check state variables - APlasker
  let completionCheckInProgress = false;
  let completionCheckStartTime = 0;
  let completionCheckTimeout = 5000; // 5 seconds
  let showingCompletionError = false;
  let completionErrorModal = null;
  
  // Play area constraints
  let maxPlayWidth = 400; // Max width for the play area (phone-sized)
  let playAreaPadding = 20; // Padding around the play area
  let playAreaX, playAreaY, playAreaWidth, playAreaHeight; // Will be calculated in setup
  
  // Color palette
  const COLORS = {
    background: '#f8f5f2',    // New unified background color
    primary: '#9a9832',       // Changed from avocado green to olive green - APlasker
    secondary: '#cf6d88',     // Changed from burnt orange to bright yellow - APlasker
    tertiary: '#FFFFFF',      // White (previously changed from mustard yellow)
    accent: '#7A9BB5',        // Dusty blue
    text: '#333333',          // Dark gray for text
    vesselBase: '#F9F5EB',    // Cream white for base ingredients
    vesselYellow: '#FFFFFF',  // White for partial combinations
    vesselGreen: '#9a9832',   // Updated to match new primary color - APlasker
    vesselHint: '#f7dc30',    // Changed from burnt orange to bright yellow - APlasker
    green: '#9a9832',         // Updated to match new primary color - APlasker
    peach: '#da9356',          // Updated orange color to #da9356 - APlasker
    HintPink: '#cf6d88' 
  };
  
  // Array of colors for completed vessels - APlasker
  const COMPLETED_VESSEL_COLORS = [
    '#f3a9b2', // Light pink
    '#cfc23f', // Mustard yellow
    '#f7dc30', // Bright yellow
    '#cf6d88', // Pink
    '#dd9866'  // Peach/orange - Updated to be tertiary color - APlasker
  ];
  
  // Track which colors have been used for completed vessels - APlasker
  let usedCompletedVesselColors = [];
  
  // Track completed green vessels for combo counter - APlasker
  let completedGreenVessels = [];
  
  // Function to get the next available color for completed vessels - APlasker
  function getNextCompletedVesselColor(comboName) {
    // Position-based color assignment: Find the position of this combo in the recipe steps
    if (comboName) {
      let position = -1;
      
      // Find position in intermediate combinations
      for (let i = 0; i < intermediate_combinations.length; i++) {
        if (intermediate_combinations[i].name === comboName) {
          position = i;
          break;
        }
      }
      
      // If it's the final combination, use the last position
      if (comboName === final_combination.name) {
        position = intermediate_combinations.length;
      }
      
      // Use position to select the color if found
      if (position >= 0) {
        const color = COMPLETED_VESSEL_COLORS[position % COMPLETED_VESSEL_COLORS.length];
        
        // Don't log or modify usedCompletedVesselColors when called for highlight lookups
        // This function can be called either for:
        // 1. Creating a new vessel (where we track used colors)
        // 2. Just getting the color for recipe card highlight (where we don't track)
        
        // Check if this is a direct vessel creation call or just a preview/highlight call
        if (typeof gameWon !== 'undefined' && gameStarted && !gameWon) {
          // Only track used colors when game is actively running and we're creating actual vessels
          if (!usedCompletedVesselColors.includes(color)) {
            // Only add to used colors during actual vessel creation, not for highlights
            console.log(`Assigned position-based color for ${comboName}: ${color} (position ${position})`);
          }
        }
        
        return color;
      }
    }
    
    // Fallback to original color cycling behavior if no combo name provided or position not found
    // If all colors have been used, reset the used colors array
    if (usedCompletedVesselColors.length >= COMPLETED_VESSEL_COLORS.length) {
      console.log("All vessel colors have been used, recycling colors");
      usedCompletedVesselColors = [];
    }
    
    // Find the first unused color
    for (let color of COMPLETED_VESSEL_COLORS) {
      if (!usedCompletedVesselColors.includes(color)) {
        // Mark this color as used
        usedCompletedVesselColors.push(color);
        console.log(`Assigned vessel color (fallback method): ${color}`);
        return color;
      }
    }
    
    // Fallback to the first color if something goes wrong
    console.log("Fallback to first color in vessel color array");
    return COMPLETED_VESSEL_COLORS[0];
  }
  
  // Animation class for combining ingredients
  // CLASS DEFINITIONS FOR CombineAnimation, VesselMovementAnimation, VerbAnimation REMOVED FROM HERE
  
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
      this.disabled = false;
      this.borderColor = null; // Always null by default now
      this.textBold = false;
      this.isCircular = false; // Default to false for consistent rounded rectangle shape
      this.textSizeMultiplier = 1.0;
      this.useVesselStyle = false;
      this.simplifiedOutline = false;
      this.outlineColor = COLORS.peach;
      this.customCornerRadius = null;
    }
    
    draw() {
      // Isolate drawing context for the button
      push();
      
      // Calculate relative values for visual elements
      const cornerRadius = this.customCornerRadius !== null ? this.customCornerRadius : Math.max(this.w * 0.15, 10);
      const strokeW = Math.max(this.w * 0.025, 2);
      
      rectMode(CENTER);
      if (this.disabled) {
        let buttonColor = color(this.color);
        buttonColor.setAlpha(128);
        fill(buttonColor);
      } else if (this.hovered) {
        fill(lerpColor(color(this.color), color(255), 0.2));
      } else {
        fill(this.color);
      }
      
      // Handle outline based on borderColor
      if (this.borderColor) {
        stroke(this.borderColor);
        strokeWeight(Math.max(this.h * 0.04, 1.5)); // Match text weight, min 1.5px
      } else {
        noStroke();
      }
      
      // Draw either a circle or rounded rectangle based on isCircular property
      if (this.isCircular) {
        circle(this.x, this.y, this.w);
      } else {
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
  
  // Vessel class has been moved to js/modules/VesselSystem.js
  // splitTextIntoLines function has been moved to js/modules/VesselSystem.js
  
  // Preload function to load assets before setup
  function preload() {
    console.log("Preloading assets...");
    
    // Load wallpaper SVG using HTML5 Canvas for high-quality rendering - APlasker
    console.log("🚀 Loading wallpaper SVG via HTML5 Canvas...");
    loadWallpaperSVGHighRes();
    
    // Use web-safe fonts directly instead of trying to load Google Fonts
  titleFont = 'Courier, "Courier New", monospace';
  bodyFont = 'Helvetica, Arial, sans-serif';
  buttonFont = 'Helvetica, Arial, sans-serif';
    
    console.log("Using web-safe fonts instead of Google Fonts");
  }
  
  // Function to load SVG at high resolution using HTML5 Canvas - APlasker
  function loadWallpaperSVGHighRes() {
    console.log("📐 Loading SVG via HTML5 Canvas for maximum quality...");
    
    // Set a timeout to prevent infinite loading - APlasker
    const loadingTimeout = setTimeout(() => {
      console.warn("⚠️ Wallpaper loading timeout - proceeding without animation");
      wallpaperImageReady = false;
      loadingComplete = true; // Allow game to continue
    }, 5000); // 5 second timeout
    
    // Create an image element to load the SVG
    const img = new Image();
    
    img.onload = function() {
      clearTimeout(loadingTimeout); // Cancel timeout since loading succeeded
      console.log("✅ SVG loaded as DOM image");
      console.log(`📊 Natural SVG dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
      
      // Validate image dimensions before proceeding
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        console.warn("⚠️ Invalid SVG dimensions detected - using fallback");
        wallpaperImageReady = false;
        loadingComplete = true;
        return;
      }
      
      // Create high-resolution canvas (4x natural size for crisp quality)
      const hiResScale = 4;
      const canvasWidth = Math.max(img.naturalWidth * hiResScale, 800); // Minimum 800px width
      const canvasHeight = Math.max(img.naturalHeight * hiResScale, 600); // Minimum 600px height
      
      console.log(`🎯 Creating HTML5 canvas: ${canvasWidth}x${canvasHeight} (${hiResScale}x scale)`);
      
      try {
        // Create native HTML5 canvas
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw SVG to canvas at high resolution
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        
        console.log("✅ SVG rendered to HTML5 canvas at high quality");
        
        // Convert canvas to p5.js compatible image
        const dataURL = canvas.toDataURL('image/png');
        
        // Load the high-quality canvas as p5.js image
        wallpaperHighResImage = loadImage(dataURL, 
          function() {
            console.log("🎨 High-resolution wallpaper converted to p5.js image successfully!");
            console.log(`📐 Final p5.js image dimensions: ${wallpaperHighResImage.width}x${wallpaperHighResImage.height}`);
            wallpaperImageReady = true; // Mark image as truly ready - APlasker
            console.log("✅ Wallpaper image is now ready for animation");
          },
          function() {
            console.log("❌ Failed to convert canvas to p5.js image - proceeding without animation");
            wallpaperImageReady = false;
            loadingComplete = true; // Allow game to continue
          }
        );
      } catch (error) {
        console.error("❌ Error creating canvas or converting image:", error);
        wallpaperImageReady = false;
        loadingComplete = true; // Allow game to continue
      }
    };
    
    img.onerror = function() {
      clearTimeout(loadingTimeout); // Cancel timeout since we got an error
      console.log("❌ Failed to load SVG as DOM image - proceeding without animation");
      wallpaperImageReady = false;
      loadingComplete = true; // Allow game to continue without wallpaper
    };
    
    // Start loading the appropriate image based on device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log("📱 Mobile device detected - using optimized PNG wallpaper");
      img.src = 'assets/wallpaper1-2.png'; // Use smaller PNG for mobile
    } else {
      console.log("🖥️ Desktop device - using high-quality SVG wallpaper");
      img.src = 'assets/wallpaper1.svg'; // Use original SVG for desktop
    }
  }
  
  function setup() {
    createCanvas(windowWidth, windowHeight); // Fullscreen canvas for mobile
    textFont(bodyFont);
    
    // BUGFIX: Add canvas initialization validation
    if (!canvas || width === 0 || height === 0) {
      console.error("❌ Canvas initialization failed - retrying...");
      setTimeout(() => {
        try {
          createCanvas(windowWidth, windowHeight);
          console.log("✅ Canvas retry successful");
        } catch (error) {
          console.error("❌ Canvas retry failed:", error);
          // Continue anyway with minimal functionality
        }
      }, 100);
    } else {
      console.log("✅ Canvas initialized successfully:", width, "x", height);
    }
    
    // Initialize the touch system
    touchSystem.init(); // MOVED to interaction.js
    
    // Explicitly assign p5.js mouse event handlers from interaction.js
    // window.mousePressed = mousePressed; // Causing: mousePressed is not defined
    // window.mouseDragged = mouseDragged;
    // window.mouseReleased = mouseReleased;
    
    // Set frame rate to 30fps for consistent animation timing across devices
    frameRate(30);
    
    // BUGFIX: Validate window dimensions before calculating play area
    const safeWindowWidth = windowWidth || window.innerWidth || 800;
    const safeWindowHeight = windowHeight || window.innerHeight || 600;
    
    // Calculate play area dimensions
    playAreaWidth = min(maxPlayWidth, safeWindowWidth - 2 * playAreaPadding);
    // Set a fixed aspect ratio for the play area (mobile phone-like)
    playAreaHeight = min(safeWindowHeight - 2 * playAreaPadding, playAreaWidth * 1.8); // 16:9 aspect ratio
    
    // Center the play area both horizontally and vertically
    playAreaX = (safeWindowWidth - playAreaWidth) / 2;
    playAreaY = (safeWindowHeight - playAreaHeight) / 2;
    
    console.log("✅ Play area calculated:", playAreaX, playAreaY, playAreaWidth, playAreaHeight);
    
    // Initialize anonymous authentication automatically, then check completion
    initializeAuth().then(() => {
      // Check for any pending completion retries first
      if (typeof retryPendingCompletions === 'function') {
        retryPendingCompletions().catch(error => {
          console.error('Error retrying pending completions:', error);
        });
      }
      
      // Small delay to ensure auth state is fully set
      setTimeout(() => {
        checkTodayCompletion();
      }, 100);
    }).catch((error) => {
      console.error("Auth initialization failed:", error);
      // Proceed with normal flow if auth fails
      proceedWithNormalFlow();
    });
  }
  
  // Function to initialize authentication automatically
  async function initializeAuth() {
    try {
      console.log('Initializing authentication...');
      
      // Check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is already authenticated
        window.authState.user = session.user;
        window.authState.isAnonymous = session.user.is_anonymous || false;
        window.authState.isAuthenticated = true;
        
        console.log('Existing session found:', {
          email: session.user.email,
          isAnonymous: window.authState.isAnonymous
        });
        
      } else {
        // No existing session - sign in anonymously
        console.log('No existing session, signing in anonymously...');
        
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
          console.error('Anonymous sign-in failed:', error);
          // Continue without auth - fallback mode
          window.authState.user = null;
          window.authState.isAnonymous = false;
          window.authState.isAuthenticated = false;
        } else {
          // Anonymous sign-in successful
          window.authState.user = data.user;
          window.authState.isAnonymous = true;
          window.authState.isAuthenticated = true;
          
          console.log('Anonymous sign-in successful:', data.user.id);
        }
      }
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Continue without auth - fallback mode
      window.authState.user = null;
      window.authState.isAnonymous = false;
      window.authState.isAuthenticated = false;
    }
  }
  
  // Function to load recipe data from Supabase
  async function loadRecipeData() {
    try {
      // Add mobile-specific loading delay to prevent race conditions
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log("Mobile device detected - adding loading delay");
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay for mobile
      }
      
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
        // Don't set loadingError immediately - try again with retry logic
        if (typeof loadRecipeRetryCount === 'undefined') {
          window.loadRecipeRetryCount = 0;
        }
        
        if (window.loadRecipeRetryCount < 3) {
          window.loadRecipeRetryCount++;
          console.log(`Recipe load failed, retrying (${window.loadRecipeRetryCount}/3)...`);
          setTimeout(() => loadRecipeData(), 1000); // Retry after 1 second
          return;
        } else {
          console.error("Recipe loading failed after 3 retries");
          loadingError = true;
          isLoadingRecipe = false;
          loadingComplete = true;
          return;
        }
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
      
      // BUGFIX: Use validated ingredient system based on server flag
      // Prevents duplicate vessel creation and ensures proper fallback behavior
      if (recipeData.useInstanceSystem && recipeData.baseIngredientInstances && recipeData.baseIngredientInstances.length > 0) {
        // Use the multi-instance system for recipes with duplicate ingredients
        ingredients = recipeData.baseIngredientInstances.map(inst => inst.name);
        base_ingredient_instances = recipeData.baseIngredientInstances;
        console.log("✅ Using MULTI-INSTANCE system:", base_ingredient_instances.length, "ingredient instances");
        console.log("Instance details:", base_ingredient_instances.map(inst => `${inst.name} (${inst.instanceId})`));
      } else {
        // Use the traditional system for simple recipes
        ingredients = recipeData.baseIngredients || [];
        base_ingredient_instances = ingredients.map((name, index) => ({
          name: name,
          instanceId: `${name}_traditional_${index}`,
          validCombos: [] // Will be populated by combination logic
        }));
        console.log("✅ Using TRADITIONAL system:", ingredients.length, "unique ingredients");
        console.log("Ingredient list:", ingredients);
      }
      
      base_ingredients = recipeData.baseIngredients; // Ensure base_ingredients is set for stats
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      
      // Get author information from the database if it exists
      recipeAuthor = recipeData.author || "";
      
      console.log("Recipe data loaded successfully");
      isLoadingRecipe = false;
      loadingComplete = true; // Trigger split reveal - APlasker
      
      // Clean up wallpaper animation now that loading is complete - APlasker
      if (typeof cleanupWallpaperAnimation === 'function') {
        cleanupWallpaperAnimation();
      }
      
      // Set data loaded flag to true for stats display
      recipeDataLoadedForStats = true;
      
      // Initialize the game immediately with the essential data
      initializeGame();
      
      // MODIFIED BY APLASKER: Load the image in the background AFTER game is initialized
      if (recipeData.imgUrl) {
        console.log("Loading recipe image in background from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        // Use loadImage with success and error callbacks
        loadImage(
          recipeData.imgUrl,
          // Success callback
          (img) => {
            console.log("Recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
          },
          // Error callback
          (err) => {
            console.error("Error loading recipe image:", err);
            recipeImage = null; // Set to null to indicate loading failed
            isLoadingImage = false;
          }
        );
      }
    } catch (error) {
      console.error("Error loading recipe data:", error);
      
      // Enhanced error handling for mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile && error.message && error.message.includes('network')) {
        console.log("Mobile network error detected - retrying...");
        setTimeout(() => loadRecipeData(), 2000); // Retry after 2 seconds on mobile
        return;
      }
      
      loadingError = true;
      isLoadingRecipe = false;
      loadingComplete = true; // Trigger split reveal even on error - APlasker
      isLoadingImage = false;
      
      // Clean up wallpaper animation - APlasker
      if (typeof cleanupWallpaperAnimation === 'function') {
        cleanupWallpaperAnimation();
      }
      
      // Set data loaded flag to true even on error, so we can show the title screen
      // with fallback values for the stats
      recipeDataLoadedForStats = true;
    }
  }
  
  //draw was here 4-17

  // function createCombineAnimation(startX, startY, color, targetX, targetY) { ... }
  // This is defined in animation.js
  
  function startGame() {
    // Ensure all necessary initialization has happened before starting game
    if (vessels.length === 0 || isLoadingRecipe) {
      console.log("Cannot start game yet - initialization incomplete");
      return;
    }
    
    // Start cook transition if wallpaper animation exists
    if (wallpaperAnimation) {
      console.log("🍳 Starting cook transition with wallpaper animation");
      wallpaperAnimationActive = true;
      wallpaperAnimation.startCookTransition();
      return; // Don't start game immediately, wait for animation
    }
    
    // Fallback: start game immediately if no wallpaper animation
    console.log("🍳 Starting game immediately (no wallpaper animation)");
    actuallyStartGame();
  }
  
  function actuallyStartGame() {
    console.log("🎮 Actually starting the game now!");
    
    // Reset loading state for new game - APlasker
    loadingComplete = false;
    gameStarted = true;
    
    // Capture current streak at start of session - APlasker
    if (typeof StreakSystem !== 'undefined') {
      const streakInfo = StreakSystem.getStreakInfo();
      sessionStartStreak = streakInfo.currentStreak || 0;
      console.log('Session started with streak:', sessionStartStreak);
    }
    
    // Initialize timer
    startTime = Date.now();
    gameTimer = 0;
    gameTimerActive = true;
    
    // APlasker - Start analytics session tracking with improved error handling
    if (typeof startGameSession === 'function') {
      // Get recipe ID with multiple fallbacks
      let recipeId = null;
      
      if (recipe_data && recipe_data.rec_id) {
        recipeId = recipe_data.rec_id;
      } else if (final_combination && final_combination.rec_id) {
        recipeId = final_combination.rec_id;
      } else if (recipe && recipe.rec_id) {
        recipeId = recipe.rec_id;
      }
      
      if (recipeId && recipeId !== null && recipeId !== undefined) {
        console.log("🚀 Starting analytics session for recipe:", recipeId);
        
        // MAGIC LINK FIX: Enhanced logging for magic link users
        if (window.authState?.isAuthenticated && !window.authState?.isAnonymous) {
          console.log("🔗 Magic link user starting game session");
          console.log("Auth state:", {
            isAuthenticated: window.authState.isAuthenticated,
            isAnonymous: window.authState.isAnonymous,
            userEmail: window.authState.user?.email
          });
        }
        
        startGameSession(recipeId).then(sessionId => {
          if (sessionId) {
            console.log("✅ Analytics session started successfully:", sessionId);
            
            // MAGIC LINK FIX: Confirm session creation for magic link users
            if (window.authState?.isAuthenticated && !window.authState?.isAnonymous) {
              console.log("🔗 Magic link user session confirmed - tracking should now work");
            }
          } else {
            console.warn("⚠️ Analytics session creation returned null - check Supabase");
          }
        }).catch(error => {
          console.error("❌ Analytics session creation failed:", error);
        });
      } else {
        console.warn("⚠️ No valid recipe ID found for analytics - session not created");
      }
    } else {
      console.warn("⚠️ startGameSession function not available");
    }
    
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
    
    // Reset loading state for tutorial - APlasker
    loadingComplete = false;
    
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
      
      // Capture current streak at start of tutorial session - APlasker
      if (typeof StreakSystem !== 'undefined') {
        const streakInfo = StreakSystem.getStreakInfo();
        sessionStartStreak = streakInfo.currentStreak || 0;
        console.log('Tutorial session started with streak:', sessionStartStreak);
      }
      
      // Initialize timer for tutorial mode - APlasker
      startTime = Date.now();
      gameTimer = 0;
      gameTimerActive = true;
      
      // APlasker - Start analytics session tracking for tutorial with improved error handling
      if (typeof startGameSession === 'function') {
        // Get recipe ID with multiple fallbacks
        let recipeId = null;
        
        if (recipe_data && recipe_data.rec_id) {
          recipeId = recipe_data.rec_id;
        } else if (final_combination && final_combination.rec_id) {
          recipeId = final_combination.rec_id;
        } else if (recipe && recipe.rec_id) {
          recipeId = recipe.rec_id;
        }
        
        console.log("Tutorial Recipe ID for analytics:", recipeId);
        console.log("Available tutorial recipe data:", {
          recipe_data: recipe_data,
          final_combination: final_combination,
          recipe: typeof recipe !== 'undefined' ? recipe : 'undefined'
        });
        
        if (recipeId && recipeId !== null && recipeId !== undefined) {
          console.log("Starting analytics session for tutorial recipe:", recipeId);
          startGameSession(recipeId).then(sessionId => {
            if (sessionId) {
              console.log("✅ Tutorial analytics session started successfully:", sessionId);
            } else {
              console.warn("⚠️ Tutorial analytics session creation returned null - check Supabase");
            }
          }).catch(error => {
            console.error("❌ Tutorial analytics session creation failed:", error);
          });
        } else {
          console.warn("⚠️ No valid recipe ID found for tutorial analytics - session not created");
          console.log("tutorial recipe_data:", recipe_data);
        }
      } else {
        console.warn("⚠️ startGameSession function not available for tutorial");
      }
      
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
      
      // BUGFIX: Use validated ingredient system based on server flag
      // Prevents duplicate vessel creation and ensures proper fallback behavior
      if (recipeData.useInstanceSystem && recipeData.baseIngredientInstances && recipeData.baseIngredientInstances.length > 0) {
        // Use the multi-instance system for recipes with duplicate ingredients
        ingredients = recipeData.baseIngredientInstances.map(inst => inst.name);
        base_ingredient_instances = recipeData.baseIngredientInstances;
        console.log("✅ Using MULTI-INSTANCE system:", base_ingredient_instances.length, "ingredient instances");
        console.log("Instance details:", base_ingredient_instances.map(inst => `${inst.name} (${inst.instanceId})`));
      } else {
        // Use the traditional system for simple recipes
        ingredients = recipeData.baseIngredients || [];
        base_ingredient_instances = ingredients.map((name, index) => ({
          name: name,
          instanceId: `${name}_traditional_${index}`,
          validCombos: [] // Will be populated by combination logic
        }));
        console.log("✅ Using TRADITIONAL system:", ingredients.length, "unique ingredients");
        console.log("Ingredient list:", ingredients);
      }
      
      base_ingredients = recipeData.baseIngredients; // Ensure base_ingredients is set for stats
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A tutorial recipe to help you learn the game!";
      recipeAuthor = recipeData.author || "Tutorial";
      
      // Initialize game with the tutorial recipe
      initializeGame();
      
      // Set loading state to false
      isLoadingRecipe = false;
      recipeDataLoadedForStats = true;
      
      // MODIFIED BY APLASKER: Load the image in the background AFTER game is initialized
      if (recipeData.imgUrl) {
        console.log("Loading tutorial recipe image in background from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        // Use loadImage with success and error callbacks
        loadImage(
          recipeData.imgUrl,
          // Success callback
          (img) => {
            console.log("Tutorial recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
          },
          // Error callback
          (err) => {
            console.error("Error loading tutorial recipe image:", err);
            recipeImage = null;
            isLoadingImage = false;
          }
        );
      }
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
  
  // function touchStarted() { ... } // MOVED to interaction.js
  
  // Function to check if user has completed today's recipe - APlasker
  async function checkTodayCompletion() {
    try {
      console.log("Checking if user has completed today's recipe...");
      completionCheckInProgress = true;
      completionCheckStartTime = Date.now();
      
      // Wait for auth to be ready - more robust waiting
      let authAttempts = 0;
      while ((!window.authState || !window.authState.hasOwnProperty('isAuthenticated')) && authAttempts < 20) {
        console.log(`Waiting for auth state to initialize... attempt ${authAttempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        authAttempts++;
      }
      
      if (!window.authState) {
        console.log("Auth state never initialized, proceeding with normal flow");
        completionCheckInProgress = false;
        proceedWithNormalFlow();
        return;
      }
      
      // If user is not authenticated, proceed with normal flow
      console.log("Auth state when checking:", {
        authState: window.authState,
        isAuthenticated: window.authState?.isAuthenticated,
        hasUserId: !!window.authState?.user?.id,
        isAnonymous: window.authState?.isAnonymous
      });
      
      if (!window.authState?.isAuthenticated || !window.authState?.user?.id) {
        console.log("User not authenticated, proceeding with normal flow");
        completionCheckInProgress = false;
        proceedWithNormalFlow();
        return;
      }
      
      const userId = window.authState.user.id;
      console.log("Checking completions for authenticated user:", userId.substring(0, 8) + '...');
      
      // Get today's recipe and user's recent completions in parallel
      const [todayRecipe, userCompletions] = await Promise.all([
        fetchTodayRecipe(),
        getUserCompletions(userId, 10) // Get last 10 completions to be safe
      ]);
      
      // Check for timeout
      if (Date.now() - completionCheckStartTime > completionCheckTimeout) {
        throw new Error("Completion check timed out");
      }
      
      if (!todayRecipe) {
        console.log("Could not load today's recipe, proceeding with normal flow");
        completionCheckInProgress = false;
        proceedWithNormalFlow();
        return;
      }
      
      if (!userCompletions || userCompletions.length === 0) {
        console.log("No completions found, proceeding with normal flow");
        completionCheckInProgress = false;
        proceedWithNormalFlow(todayRecipe);
        return;
      }
      
      // Check if user completed today's recipe
      const todayCompletion = userCompletions.find(completion => 
        completion.rec_id === todayRecipe.rec_id
      );
      
      if (todayCompletion) {
        console.log("Found completion for today's recipe, loading win screen");
        loadWinScreenFromCompletion(todayRecipe, todayCompletion);
      } else {
        console.log("No completion for today's recipe, proceeding with normal flow");
        completionCheckInProgress = false;
        proceedWithNormalFlow(todayRecipe);
      }
      
    } catch (error) {
      console.error("Error checking today's completion:", error);
      
      // Check if we timed out
      if (Date.now() - completionCheckStartTime > completionCheckTimeout) {
        showCompletionErrorModal();
      } else {
        // Other error, proceed with normal flow
        completionCheckInProgress = false;
        proceedWithNormalFlow();
      }
    }
  }
  
  // Function to proceed with normal game flow (title screen then recipe loading) - APlasker
  function proceedWithNormalFlow(recipeData = null) {
    if (recipeData) {
      // We already have today's recipe data, use it
      recipe_data = recipeData;
      recipe = recipeData;
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      
      // BUGFIX: Use validated ingredient system based on server flag
      // Prevents duplicate vessel creation and ensures proper fallback behavior
      if (recipeData.useInstanceSystem && recipeData.baseIngredientInstances && recipeData.baseIngredientInstances.length > 0) {
        // Use the multi-instance system for recipes with duplicate ingredients
        ingredients = recipeData.baseIngredientInstances.map(inst => inst.name);
        base_ingredient_instances = recipeData.baseIngredientInstances;
        console.log("✅ Using MULTI-INSTANCE system:", base_ingredient_instances.length, "ingredient instances");
        console.log("Instance details:", base_ingredient_instances.map(inst => `${inst.name} (${inst.instanceId})`));
      } else {
        // Use the traditional system for simple recipes
        ingredients = recipeData.baseIngredients || [];
        base_ingredient_instances = ingredients.map((name, index) => ({
          name: name,
          instanceId: `${name}_traditional_${index}`,
          validCombos: [] // Will be populated by combination logic
        }));
        console.log("✅ Using TRADITIONAL system:", ingredients.length, "unique ingredients");
        console.log("Ingredient list:", ingredients);
      }
      
      base_ingredients = recipeData.baseIngredients; // Ensure base_ingredients is set for stats
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      recipeAuthor = recipeData.author || "";
      
      isLoadingRecipe = false;
      loadingComplete = true; // Trigger split reveal - APlasker
      console.log("🎯 Loading complete flag set to true - split reveal should trigger");
      recipeDataLoadedForStats = true;
      
      initializeGame();
      
      // Load image in background
      if (recipeData.imgUrl) {
        console.log("Loading recipe image in background from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        loadImage(
          recipeData.imgUrl,
          (img) => {
            console.log("Recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
          },
          (err) => {
            console.error("Error loading recipe image:", err);
            recipeImage = null;
            isLoadingImage = false;
          }
        );
      }
    } else {
      // Load recipe data normally
      if (typeof isPlaytestMode === 'undefined' || !isPlaytestMode) {
        loadRecipeData();
      } else {
        console.log("Playtest mode: waiting for date selection");
        isLoadingRecipe = false;
      }
    }
  }
  
  // Function to load win screen from completion data - APlasker
  function loadWinScreenFromCompletion(recipeData, completionData) {
    try {
      console.log("Loading win screen from completion data:", completionData);
      
      // FIXED: Ensure user is not considered anonymous if we have completion data
      // If we have completion data, the user must be authenticated with a real account
      if (window.authState && window.authState.isAuthenticated) {
        window.authState.isAnonymous = false;
        console.log("User auth state updated - not anonymous since completion data exists");
      }
      
      // Set recipe data
      recipe_data = recipeData;
      recipe = recipeData;
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      
      // BUGFIX: Use validated ingredient system based on server flag
      // Prevents duplicate vessel creation and ensures proper fallback behavior
      if (recipeData.useInstanceSystem && recipeData.baseIngredientInstances && recipeData.baseIngredientInstances.length > 0) {
        // Use the multi-instance system for recipes with duplicate ingredients
        ingredients = recipeData.baseIngredientInstances.map(inst => inst.name);
        base_ingredient_instances = recipeData.baseIngredientInstances;
        console.log("✅ Using MULTI-INSTANCE system:", base_ingredient_instances.length, "ingredient instances");
        console.log("Instance details:", base_ingredient_instances.map(inst => `${inst.name} (${inst.instanceId})`));
      } else {
        // Use the traditional system for simple recipes
        ingredients = recipeData.baseIngredients || [];
        base_ingredient_instances = ingredients.map((name, index) => ({
          name: name,
          instanceId: `${name}_traditional_${index}`,
          validCombos: [] // Will be populated by combination logic
        }));
        console.log("✅ Using TRADITIONAL system:", ingredients.length, "unique ingredients");
        console.log("Ingredient list:", ingredients);
      }
      
      base_ingredients = recipeData.baseIngredients; // Ensure base_ingredients is set for stats
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      recipeAuthor = recipeData.author || "";
      
      // Set game state to won
      gameWon = true;
      gameStarted = true;
      gameTimerActive = false;
      
      // Reconstruct game stats from completion data
      gameTimer = completionData.total_time_seconds || 0;
      hintCount = completionData.hints_used || 0;
      moveCount = completionData.mistakes_total || 0; // Assuming mistakes correlate with move count
      
      // Reconstruct move history for star calculation
      moveHistory = [];
      for (let i = 0; i < completionData.mistakes_total; i++) {
        moveHistory.push('black'); // Add mistake markers
      }
      
      // Set grades and scores
      const starScore = completionData.star_score || 0;
      isAPlus = starScore >= 6;
      
      // Calculate letter grade from star score
      if (starScore >= 6) {
        letterGrade = 'A+';
      } else if (starScore >= 5) {
        letterGrade = 'A';
      } else if (starScore >= 4) {
        letterGrade = 'B';
      } else if (starScore >= 3) {
        letterGrade = 'C';
      } else {
        letterGrade = 'X';
      }
      
      // Initialize other necessary game variables
      vessels = [];
      displayedVessels = [];
      usedIngredients = new Set();
      combine_animations = [];
      animations = [];
      eggModals = [];
      
      // Set loading states
      isLoadingRecipe = false;
      recipeDataLoadedForStats = true;
      completionCheckInProgress = false;
      
      // CRITICAL: Disable wallpaper animation for win screen to prevent title screen overlap
      loadingComplete = true;
      wallpaperAnimationActive = false;
      if (wallpaperAnimation) {
        wallpaperAnimation = null; // Clear wallpaper animation entirely
      }
      
      console.log("Win screen state loaded successfully");
      
      // Load image in background
      if (recipeData.imgUrl) {
        console.log("Loading recipe image in background from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        loadImage(
          recipeData.imgUrl,
          (img) => {
            console.log("Recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
          },
          (err) => {
            console.error("Error loading recipe image:", err);
            recipeImage = null;
            isLoadingImage = false;
          }
        );
      }
      
    } catch (error) {
      console.error("Error loading win screen from completion:", error);
      // Fall back to normal flow
      completionCheckInProgress = false;
      proceedWithNormalFlow();
    }
  }
  
  // Function to show completion error modal - APlasker
  function showCompletionErrorModal() {
    showingCompletionError = true;
    completionCheckInProgress = false;
    modalActive = true;
    
    // Create error modal
    completionErrorModal = {
      visible: true,
      title: "Loading Error",
      message: "Your dish is taking longer to prep than we anticipated. Please try ordering again",
      buttonText: "Refresh",
      action: () => {
        window.location.reload();
      }
    };
  }
  
  // Function to draw completion error modal - APlasker
  function drawCompletionErrorModal() {
    if (!showingCompletionError || !completionErrorModal?.visible) return;
    
    // Draw modal overlay
    push();
    fill(0, 0, 0, 150);
    noStroke();
    rect(0, 0, windowWidth, windowHeight);
    pop();
    
    // Calculate modal dimensions
    const modalWidth = Math.min(playAreaWidth * 0.8, 400);
    const modalHeight = Math.min(playAreaHeight * 0.4, 250);
    const modalX = playAreaX + playAreaWidth / 2;
    const modalY = playAreaY + playAreaHeight / 2;
    
    // Draw modal background
    push();
    rectMode(CENTER);
    fill(255);
    stroke(COLORS.primary);
    strokeWeight(2);
    rect(modalX, modalY, modalWidth, modalHeight, 12);
    pop();
    
    // Draw modal content
    push();
    
    // Title
    textAlign(CENTER, CENTER);
    textSize(Math.max(modalWidth * 0.06, 18));
    textStyle(BOLD);
    fill(COLORS.text);
    text(completionErrorModal.title, modalX, modalY - modalHeight * 0.25);
    
    // Message
    textSize(Math.max(modalWidth * 0.04, 14));
    textStyle(NORMAL);
    text(completionErrorModal.message, modalX, modalY - modalHeight * 0.05, modalWidth * 0.8);
    
    // Button
    const buttonWidth = modalWidth * 0.3;
    const buttonHeight = 40;
    const buttonY = modalY + modalHeight * 0.2;
    
    const buttonHovered = dist(mouseX, mouseY, modalX, buttonY) < buttonWidth/2;
    
    rectMode(CENTER);
    fill(buttonHovered ? lerpColor(color(COLORS.primary), color(255), 0.2) : COLORS.primary);
    stroke(COLORS.primary); // Match stroke to fill color for consistency
    strokeWeight(3); // Standardized stroke weight
    rect(modalX, buttonY, buttonWidth, buttonHeight, 8);
    
    fill('white');
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(buttonHeight * 0.25, 12));
    textStyle(BOLD);
    text(completionErrorModal.buttonText, modalX, buttonY);
    
    pop();
    
    // Handle button click
    if (buttonHovered) {
      cursor(HAND);
    }
  }
  
  // New function to initialize the game after data is loaded
  function initializeGame() {
    // Determine layout type based on number of ingredients
    // Use small layout for recipes with 12 or fewer ingredients
    currentLayoutType = ingredients.length <= 12 ? 'small' : 'big';
    console.log(`Setting layout type to ${currentLayoutType} based on ${ingredients.length} ingredients`);

    // Create vessels for each ingredient
    // DUPLICATE INGREDIENT FIX: Create vessels with instance tracking
    if (base_ingredient_instances && base_ingredient_instances.length > 0) {
      // Create one vessel per ingredient instance
      base_ingredient_instances.forEach((instance, index) => {
        let v = new Vessel([instance.name], [], null, 'white', 0, 0, 0, 0); // Size will be set in arrangeVessels
        
        // DUPLICATE INGREDIENT FIX: Add instance tracking to vessel
        v.ingredientInstance = instance; // Store the full instance data
        v.instanceId = instance.instanceId; // Quick access to instance ID
        v.validCombos = [...instance.validCombos]; // Which combos this vessel can participate in
        
        vessels.push(v);
      });
      console.log("Created", vessels.length, "vessels with instance tracking");
    } else {
      // Fallback to old method for backward compatibility
      ingredients.forEach((ing) => {
        let v = new Vessel([ing], [], null, 'white', 0, 0, 0, 0); // Size will be set in arrangeVessels
        vessels.push(v);
      });
      console.log("Created", vessels.length, "vessels without instance tracking (fallback)");
    }
    
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
    let startButtonWidth = playAreaWidth * 0.25; // 25% of play area width (increased from 20%)
    let startButtonHeight = startButtonWidth * 0.4; // Maintain aspect ratio
    // Enforce minimum sizes
    startButtonWidth = Math.max(startButtonWidth, 100);
    startButtonHeight = Math.max(startButtonHeight, 40);
    
    // Create hint button with white background and no border
    hintButton = new Button(
      playAreaX + playAreaWidth * 0.5, // Center horizontally
      hintButtonY, 
      buttonWidth, 
      buttonHeight, 
      "Hint", 
      showHint, 
      'white', 
      '#FF5252',
      null // No border color
    );
    
    // Set text to bold and ensure it's not circular
    hintButton.textBold = true;
    hintButton.isCircular = false;
    
    // Create start button - positioned in the center
    startButton = new Button(
      playAreaX + playAreaWidth * 0.5, // Position at 50% of play area width (center)
      playAreaY + playAreaHeight * 0.88, // Position at 88% down the play area
      startButtonWidth, 
      startButtonHeight, 
      "Cook!", 
      startGame, 
      COLORS.primary, // Green background (swapped from white)
      'white', // White text (swapped from green)
      null // No border color needed as we're using vessel style
    );
    
    // Set text to bold for Cook! button
    startButton.textBold = true;
    // Enable vessel-style outline - APlasker
    startButton.useVesselStyle = true;
    startButton.outlineColor = COLORS.peach; // Use peach color for outline
    startButton.simplifiedOutline = true; // Use simplified outline with only inner black line - APlasker
    
    // Calculate corner radius for Cook button
    const cookButtonCornerRadius = Math.max(startButtonWidth * 0.15, 10);
    
    // Create tutorial button - APlasker - AFTER creating the start button so we can reference its position
    // Calculate tutorial button position to be to the left of the start button with appropriate spacing
    const tutorialButtonWidth = startButtonWidth * 0.5; // Half the width of the start button
    const tutorialButtonX = startButton.x - startButtonWidth/2 - tutorialButtonWidth/2 - 20; // Position to the left with 20px gap
    
    tutorialButton = new Button(
      tutorialButtonX, // Position to the left of the Cook button with spacing
      playAreaY + playAreaHeight * 0.88, // Same vertical position as Cook button
      tutorialButtonWidth, // Half the width of the start button
      startButtonHeight, // Same height as start button
      "First\nTime?", // Stack text on two lines
      startTutorial, 
      'white', // White background 
      COLORS.primary, // Green text
      COLORS.primary // Green outline to match text
    );
    
    // Set text to NOT bold for Tutorial button
    tutorialButton.textBold = false;
    // Enable vessel-style outline - APlasker
    tutorialButton.useVesselStyle = true;
    tutorialButton.outlineColor = COLORS.peach; // Use peach color for outline
    tutorialButton.simplifiedOutline = true; // Use simplified outline with only inner black line - APlasker
    // Reduce text size for the stacked text
    tutorialButton.textSizeMultiplier = 0.8;
    // Use the same corner radius as the Cook button for visual consistency - APlasker
    tutorialButton.customCornerRadius = cookButtonCornerRadius;
    
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
    startedCombinations = []; // Reset started combinations tracking - APlasker
    hintedCombos = []; // Track which combos have been hinted
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
  
  // function touchEnded() { ... } // MOVED to interaction.js
  
  // function touchMoved() { ... } // MOVED to interaction.js
  
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
    // APlasker - Track mistake in analytics
    if (typeof trackMistake === 'function') {
      trackMistake();
    }

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
    // Don't show the help icon on the title screen at all
    if (!gameStarted) {
      return;
    }
    
    // Calculate the 93% horizontal position in the play area
    const finalCircleX = playAreaX + (playAreaWidth * 0.93);
    
    // Position vertically at 2.25% of play area height from the top
    helpIconSize = Math.max(playAreaWidth * 0.032, 20); // 3.2% of play area width, min 20px
    
    // Set helpIconX to be the final circle position
    helpIconX = finalCircleX;
    helpIconY = playAreaY + (playAreaHeight * 0.0225); // 2.25% of play area height from the top
    
    // Always use circle hit detection
    isHelpIconHovered = dist(mouseX, mouseY, helpIconX, helpIconY) < helpIconSize/2;
    
    // Get the appropriate color (pink when hovered, green normally) - same as hint button
    const buttonColor = isHelpIconHovered ? COLORS.secondary : COLORS.primary;
    
    // Draw the button shape with simple green fill (matching hint button style)
    fill(buttonColor);
    noStroke();
    circle(helpIconX, helpIconY, helpIconSize);
    
    // Draw the "?" text in white (matching hint button text)
    fill('white');
    noStroke();
    textAlign(CENTER, CENTER);
    
    // Use the same font size calculation as vessels (1.8% of screen height)
    const fontSize = Math.max(windowHeight * 0.018, 10);
    textSize(fontSize);
    textStyle(BOLD);
    
    // Draw the question mark with optimal centering
    text("?", helpIconX, helpIconY);
    
    // Reset text style
    textStyle(NORMAL);
    
    // Change cursor when hovering
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
    } else if (COMPLETED_VESSEL_COLORS.includes(new_v.color)) {
      // For our new colored vessels, add the actual color - APlasker
      moveHistory.push(new_v.color);
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
  
  // function isModalElement(x, y) { ... } // MOVED to interaction.js
  
  function drawTitle() {
    // Set text properties
    textAlign(CENTER, CENTER);
    
    // Calculate title size relative to play area width
    const titleSize = Math.max(playAreaWidth * 0.055, 30); // 5.5% of play area width, min 30px
    textSize(titleSize);
    
    // Use a bold sans-serif font
    textStyle(BOLD);
    textFont('Helvetica, Arial, sans-serif');
    
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
  
  // Function to format time as MM:SS
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  function draw() {
    // Set background color
    background(COLORS.background);
    
    // Draw the play area
    push(); // Isolate play area drawing
    fill(COLORS.background); // Use the new unified background color
    stroke(200); // Light grey border for the play area
    strokeWeight(1);
    rect(playAreaX, playAreaY, playAreaWidth, playAreaHeight, 10); // Rounded corners for play area
    pop(); // End play area drawing

    // Handle different game states
    if (completionCheckInProgress) {
      // Draw loading screen for completion check - use the existing floral loading pattern
      textAlign(CENTER, CENTER);
      textSize(Math.max(playAreaWidth * 0.05, 18)); // Responsive text size
      fill(COLORS.text);
      text("Checking your kitchen...", playAreaX + playAreaWidth / 2, playAreaY + playAreaHeight / 2);
    } else if (showingCompletionError) {
      // Draw completion error modal
      drawCompletionErrorModal();
    } else if (window.profileActive) {
      // Handle profile screen - APlasker
      if (typeof drawProfileScreen === 'function') {
        drawProfileScreen();
      }
      
      // Update animations for profile screen (like bounce animation)
      for (let i = animations.length - 1; i >= 0; i--) {
        if (animations[i].update()) {
          animations.splice(i, 1);
        } else {
          animations[i].draw();
        }
      }
    } else if (isLoadingRecipe) {
      // Draw loading screen centered in the play area
      textAlign(CENTER, CENTER);
      textSize(Math.max(playAreaWidth * 0.05, 18)); // Responsive text size
      fill(COLORS.text);
      text("Stirring up today's recipe...", playAreaX + playAreaWidth / 2, playAreaY + playAreaHeight / 2);
    } else if (loadingError) {
      // Draw error message centered in the play area
      textAlign(CENTER, CENTER);
      textSize(Math.max(playAreaWidth * 0.05, 18));
      fill(COLORS.secondary); // Use secondary color (pinkish) for error
      text(`Whoops! Couldn't fetch the recipe.\nTry refreshing?`, playAreaX + playAreaWidth / 2, playAreaY + playAreaHeight / 2);
    } else if (gameWon) {
      if (typeof drawWinScreen === 'function') {
        drawWinScreen();
      }
    } else if (!gameStarted) {
      // Draw title screen elements
      drawTitleScreen();
    } else {
      // Game is active - draw game elements

      // Draw byline message - APlasker
      // Position byline at the top of the play area
      const bylineX = playAreaX + playAreaWidth / 2;
      const bylineY = playAreaY + playAreaHeight * 0.05; // 5% from top of play area
      const bylineSize = Math.max(playAreaWidth * 0.035, 14); // Responsive text size, min 14px

      textAlign(CENTER, CENTER);
      textSize(bylineSize);
      textFont(bodyFont); // Ensure bodyFont is used for byline
      textStyle(NORMAL);

      // Handle byline transition
      if (bylineTransitionState === "fading-out") {
        bylineOpacity -= 255 / bylineFadeFrames;
        if (bylineOpacity <= 0) {
          bylineOpacity = 0;
          currentByline = nextByline;
          bylineTimer = transitionDuration > 0 ? transitionDuration : (isTutorialMode ? bylineHintDuration * 2 : bylineHintDuration) ; // Use longer duration for tutorial messages
          bylineTransitionState = "fading-in";
        }
      } else if (bylineTransitionState === "fading-in") {
        bylineOpacity += 255 / bylineFadeFrames;
        if (bylineOpacity >= 255) {
          bylineOpacity = 255;
          bylineTransitionState = "stable";
          isTransitioning = false; // End transition
          nextByline = ""; // Clear queued message
        }
      } else if (bylineTimer > 0) {
        bylineTimer--;
        if (bylineTimer === 0 && !isTutorialMode) { // Don't revert tutorial messages automatically
          // Revert to default byline if timer runs out and not in tutorial
          updateBylineWithTransition("Drop one ingredient on to another to combine!");
        }
      }

      // Apply opacity and draw byline
      fill(0, 0, 0, bylineOpacity);
      text(currentByline, bylineX, bylineY, playAreaWidth * 0.9); // Constrain width

      // Draw game timer - APlasker
      // Position timer below the byline
      const timerX = playAreaX + playAreaWidth / 2;
      const timerY = bylineY + bylineSize * 1.5; // Position below byline with spacing
      const timerTextSize = Math.max(playAreaWidth * 0.027, 11); // Increased from 2.5% to 2.7%, min 11px (up from 10px)

      textAlign(CENTER, CENTER);
      textSize(timerTextSize);
      fill(COLORS.text);
      if (gameTimerActive) {
        gameTimer = Math.floor((Date.now() - startTime) / 1000);
      }
      text(formatTime(gameTimer), timerX, timerY);
      
      // APlasker: Draw mistake stars
      let mistakes = moveHistory.filter(move => move === 'black').length;
      const maxStars = 5;
      const starSize = Math.max(playAreaWidth * 0.025, 10); // Responsive star size
      const starSpacing = starSize * 1.8; // Spacing between stars
      const totalStarWidth = (maxStars * starSize) + ((maxStars - 1) * (starSpacing - starSize));
      let starsX = playAreaX + playAreaWidth * 0.07; // Position stars on the left
      let starsY = timerY + timerTextSize * 1.0;    // Position stars below the timer

      for (let i = 0; i < maxStars; i++) {
        let starFillColor = (i >= mistakes) ? STAR_YELLOW : STAR_GREY;
        // Star points outwards, so use starSize for outer radius and starSize*0.4 for inner
        drawStar(starsX + i * starSpacing, starsY, starSize * 0.4, starSize, 5, starFillColor, STAR_OUTLINE);
      }

      // Draw vessels
      for (let v of vessels) {
        v.update(); // Update scale and position
        v.draw();
      }

      // Draw dragged vessel on top
      if (draggedVessel) {
        draggedVessel.update(); // Ensure dragged vessel also updates its scale
        draggedVessel.draw();
      }
      
      // Draw hint button if not showing hint
      if (!showingHint && hintButton) {
        hintButton.draw();
        hintButton.checkHover(mouseX, mouseY);
      }

      // Draw hint vessel if showing hint
      if (showingHint && hintVessel) {
        hintVessel.draw();
      }
      
      // Draw help icon - APlasker
      if (gameStarted && !gameWon) {
          drawHelpIcon();
      }

      // Draw animations
      for (let i = animations.length - 1; i >= 0; i--) {
        if (animations[i].update()) {
          animations.splice(i, 1);
        } else {
          animations[i].draw();
        }
      }
      
      // Draw Easter egg modals on top of everything else
      for (let i = eggModals.length - 1; i >= 0; i--) {
        eggModals[i].update();
        if (eggModals[i].active) {
          eggModals[i].draw();
        } else {
          // Remove inactive modals
          eggModals.splice(i, 1);
        }
      }
      
      // Handle inactivity reminder - APlasker
      if (gameStarted && !gameWon && !draggedVessel && !modalActive && !isTransitioning) {
        // Dynamic inactivity threshold based on reminders shown
        const currentInactivityThreshold = baseInactivityThreshold + (inactivityReminderCount * baseInactivityThreshold * 0.5);
        
        if (frameCount - lastAction > currentInactivityThreshold) {
          if (isTutorialMode && !tutorialMessagesShown.inactivityShown) {
            // Show tutorial inactivity message once
            updateBylineWithTransition(tutorialBylines.inactivity, bylineHintDuration * 2); // Longer display for tutorial
            tutorialMessagesShown.inactivityShown = true;
          } else if (!isTutorialMode) {
            // Standard game inactivity message (can repeat)
            updateBylineWithTransition("Need a hand? Try a hint or check the recipe!", bylineHintDuration);
          }
          lastAction = frameCount; // Reset inactivity timer
          inactivityReminderCount++; // Increment reminder count
        }
      }
    }
    
    // After drawing all win screen content, draw the flower animation on top if it's active
    // This was previously in drawWinScreen but needs to be global for other screens
    if (persistentFlowerAnimation && persistentFlowerAnimation.active) {
      persistentFlowerAnimation.draw();
      persistentFlowerAnimation.update();
    }
    
    // Auth modal and terms modal are now drawn in draw.js for consistency
  }
  
  // Function to draw a single star - APlasker
  function drawStar(x, y, radius1, radius2, npoints, fillColor, outlineColor) {
    push();
    fill(fillColor);
    stroke(outlineColor);
    strokeWeight(max(1.5, radius1 * 0.2)); // Responsive stroke weight, made thicker
    strokeJoin(ROUND); // Added to round the points of the star
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = -PI/2; a < TWO_PI - PI/2; a += angle) { // Start from -PI/2 to make stars point upwards
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
    pop();
  }
  
  // Function to get a random color from COMPLETED_VESSEL_COLORS - APlasker
  function getRandomOutlineColor() {
    // Always return peach color instead of random color
    return COLORS.peach;
  }

  // Add a function to fix recipe card link for Android
  function viewRecipe() {
    // Check if we have a URL to open
    if (!recipeUrl) {
      console.log("No recipe URL available");
      return;
    }
    
    console.log("Opening recipe URL:", recipeUrl);
    
    // Special handling for Android
    if (typeof touchSystem !== 'undefined' && touchSystem.isAndroid) { // Check touchSystem exists
      console.log("Using Android-specific recipe link handling");
      
      // Create and trigger a temporary link element
      const tempLink = document.createElement('a');
      tempLink.href = recipeUrl;
      tempLink.target = '_blank';
      tempLink.rel = 'noopener noreferrer';
      
      // Add to DOM temporarily
      document.body.appendChild(tempLink);
      
      // Trigger with small delay to ensure proper handling
      setTimeout(() => {
        tempLink.click();
        // Remove after click
        document.body.removeChild(tempLink);
      }, 50);
    } else {
      // Standard approach for iOS and other platforms
      window.open(recipeUrl, '_blank');
    }
  }

  // Add a function to fix sharing for Android
  function shareScore() {
    // Generate the score text
    const scoreText = generateScoreText();
    
    console.log("Sharing score:", scoreText);
    
    // Check if Web Share API is available (preferred method)
    if (navigator.share) {
      console.log("Using Web Share API");
      navigator.share({
        title: 'Combo Meal Score',
        text: scoreText
      }).catch(err => {
        console.error("Error sharing:", err);
        // Fallback to clipboard
        copyToClipboard(scoreText);
      });
    } else {
      // Fallback for platforms without Web Share API
      console.log("Web Share API not available, using clipboard fallback");
      copyToClipboard(scoreText);
    }
  }

  // Helper function to copy text to clipboard with Android compatibility
  function copyToClipboard(text) {
    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Make it invisible but part of the DOM
    textarea.style.position = 'fixed';
    textarea.style.opacity = 0;
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.select();
    
    try {
      // Execute copy command
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('Score copied to clipboard');
        alert('Score copied to clipboard!');
      } else {
        console.error('Failed to copy score');
        // Removed the manual copy alert message
      }
    } catch (err) {
      console.error('Error copying score:', err);
      // Removed the manual copy alert message
    }
    
    // Clean up
    document.body.removeChild(textarea);
  }

  // Helper function to generate score text
  function generateScoreText() {
    // Format based on game state
    const recipeName = final_combination ? final_combination.name : "Unknown Recipe";
    const moves = moveHistory.length;
    const hints = hintCount;
    const time = formatTime(gameTimer);
    
    return `Combo Meal: ${recipeName}\nMoves: ${moves} | Hints: ${hints} | Time: ${time}\nPlay at combomeal.app`;
  }
  
  // Helper: Truncate text with ellipsis in the middle if too long for a given width
  function fitTextWithMiddleEllipsis(text, maxWidth, fontSize, minFontSize = 10) {
    textSize(fontSize);
    if (textWidth(text) <= maxWidth) return text;

    // Reduce font size if needed
    let currentFontSize = fontSize;
    while (textWidth(text) > maxWidth && currentFontSize > minFontSize) {
      currentFontSize -= 1;
      textSize(currentFontSize);
    }
    if (textWidth(text) <= maxWidth) return text;

    // If still too long at min font size, use ellipsis in the middle
    let left = 0;
    let right = text.length - 1;
    let result = text;
    // Always keep at least 2 chars on each side
    while (right - left > 4) { // Ensure we have enough characters for "L...R"
      const mid = Math.floor((left + right) / 2);
      // Try to keep first two and last two characters
      const attemptLeft = text.slice(0, 2);
      const attemptRight = text.slice(text.length - 2, text.length);
      
      result = attemptLeft + "..." + attemptRight;
      textSize(currentFontSize); // Ensure correct font size for width check
      if (textWidth(result) <= maxWidth) return result;

      // If still too long, shorten by removing one from the right side of the left part
      // This part needs more robust logic for middle ellipsis
      // For now, if the "L...R" approach fails, we'll take what we have or just truncate.
      // A simple approach: if "AA...ZZ" is too long, try "A...Z"
      if (attemptLeft.length > 1 && attemptRight.length > 1) {
        result = text.slice(0,1) + "..." + text.slice(text.length-1, text.length);
        if (textWidth(result) <= maxWidth) return result;
      }
      
      // Fallback: if all else fails, just truncate with ellipsis at end
      result = text;
      while (textWidth(result + "...") > maxWidth && result.length > 0) {
        result = result.slice(0, -1);
      }
      return result + "...";
    }
    // Fallback if text is very short but still too wide (e.g. "WWWW" at small font)
    result = text;
    while (textWidth(result + "...") > maxWidth && result.length > 0) {
        result = result.slice(0, -1);
    }
    return result.length > 0 ? result + "..." : "...";
  }


  // Function to split text into lines, ensuring it fits within a max width,
  // and if it exceeds maxLines, truncates the last line with an ellipsis.
  // Also ensures single words that are too long are handled gracefully.
  function splitTextToLinesWithEllipsis(text, maxWidth, maxLines, fontSize, minFontSize = 10) {
    let lines = [];
      let currentLine = "";
      let words = text.split(' ');

      textSize(fontSize);

      for (let i = 0; i < words.length; i++) {
          let word = words[i];
          let testLine = currentLine + (currentLine === "" ? "" : " ") + word;
          
          // Check if the word itself is too long
          if (textWidth(word) > maxWidth) {
              // Word is too long, try to fit it by reducing font or truncating
              if (currentLine !== "") {
                  lines.push(currentLine);
                  currentLine = "";
              }

              let fittedWord = fitTextWithMiddleEllipsis(word, maxWidth, fontSize, minFontSize);
              lines.push(fittedWord);

              if (lines.length >= maxLines) {
                  if (i < words.length -1 || textWidth(fittedWord) > maxWidth) { // more words or current word truncated
                     lines[maxLines-1] = fitTextWithMiddleEllipsis(lines[maxLines-1], maxWidth, fontSize, minFontSize);
                     if (!lines[maxLines-1].endsWith("...")) lines[maxLines-1] += "...";
                  }
                  return lines.slice(0, maxLines);
              }
              currentLine = ""; // Reset current line after handling a very long word
              continue; 
          }


          if (textWidth(testLine) <= maxWidth) {
              currentLine = testLine;
          } else {
                lines.push(currentLine);
              currentLine = word;
          }

          if (lines.length >= maxLines -1 && currentLine !== "") { // If we are about to fill the last allowed line
              if (i < words.length -1 || textWidth(currentLine) > maxWidth ) { // Check if there are more words OR current line itself is too long
                  // If so, and we are on the last possible line, truncate currentLine with ellipsis
                  if (lines.length === maxLines -1) {
                      currentLine = fitTextWithMiddleEllipsis(currentLine, maxWidth, fontSize, minFontSize);
                       if (!currentLine.endsWith("...")) currentLine += "...";
                  }
              }
          }
           if (lines.length >= maxLines) break; // Stop if we have enough lines
      }

      if (currentLine !== "") {
        lines.push(currentLine);
    }

      // Final check if total lines exceed maxLines
    if (lines.length > maxLines) {
          let lastLine = lines[maxLines - 1];
          // Ensure the last line has an ellipsis if it was truncated or if there were more lines
          lines[maxLines-1] = fitTextWithMiddleEllipsis(lastLine, maxWidth, fontSize, minFontSize);
          if (!lines[maxLines-1].endsWith("...")) lines[maxLines-1] += "...";
          return lines.slice(0, maxLines);
    }

    return lines;
  }

  // Placeholder for p5.js keyPressed function if needed later
  function keyPressed() {
    // Check if the currently focused element is an input or textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      // If it is, allow the default browser action (typing into the field)
      return true;
    }

    // Handle auth modal keyboard input (unified design system)
    if (typeof handleAuthModalKeyboard === 'function' && window.authModal && window.authModal.active) {
      if (handleAuthModalKeyboard(key, keyCode)) {
        return false; // Auth modal handled the key
      }
    }

    // This function can be used for keyboard interactions if desired.
    // For example, pressing a key to show a hint or reset the game.
    // Currently, it's not used for core game mechanics.

    // Example: Press 'h' for a hint
    // if (gameStarted && !gameWon && !showingHint) {
    //   showHint();
    // }

    // Example: Press 'r' to reset the game (after win or during play)
    // if (gameStarted || gameWon) {
    //   // Reset game state and re-initialize
    //   // This would involve calling initializeGame() or a similar reset function
    // }
    return false; // Prevent default browser action for other key presses
  }
  
  // Function to draw the profile screen - APlasker
  function drawProfileScreen() {
    // Use same background as rest of game
    background(COLORS.background);
    
    // Draw floral pattern around the entire screen, outside the play area
    try {
      if (typeof drawFloralBorder !== 'undefined') {
        drawFloralBorder();
      }
    } catch (error) {
      console.log("Error calling drawFloralBorder:", error);
    }
    
    // Play area border removed for cleaner profile screen appearance
    
    // =============================================================================
    // STATS SECTION (25% of screen height)
    // =============================================================================
    const statsHeight = playAreaHeight * 0.25;
    const statsY = playAreaY;
    
    // Back button (top-left)
    const backButtonSize = Math.max(playAreaWidth * 0.08, 30);
    const backButtonX = playAreaX + backButtonSize / 2 + 10;
    const backButtonY = statsY + 10 + backButtonSize / 2;
    
    // Check if back button is hovered
    const backButtonHovered = dist(mouseX, mouseY, backButtonX, backButtonY) < backButtonSize / 2;
    
    // Draw back button
    push();
    fill(backButtonHovered ? COLORS.secondary : COLORS.primary);
    noStroke(); // No outline to match Cook/Hint buttons
    circle(backButtonX, backButtonY, backButtonSize);
    
    // Draw back arrow
    fill('white');
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(backButtonSize * 0.4);
    textFont('Helvetica, Arial, sans-serif'); // Sans serif font to match Cook/Hint buttons
    textStyle(BOLD);
    text("←", backButtonX, backButtonY);
    pop();
    
    // Sign Out button (top-right)
    const signOutButtonWidth = playAreaWidth * 0.2;
    const signOutButtonHeight = backButtonSize * 0.8;
    const signOutButtonX = playAreaX + playAreaWidth - signOutButtonWidth/2 - 10;
    const signOutButtonY = statsY + 10 + signOutButtonHeight/2;
    
    // Check if sign out button is hovered
    const signOutHovered = dist(mouseX, mouseY, signOutButtonX, signOutButtonY) < signOutButtonWidth/2;
    
    // Draw sign out button
    push();
    rectMode(CENTER);
    fill(signOutHovered ? lerpColor(color(COLORS.secondary), color(255), 0.2) : COLORS.secondary); // Dark pink button to match game colors
    noStroke(); // No outline to match Cook/Hint buttons
    rect(signOutButtonX, signOutButtonY, signOutButtonWidth, signOutButtonHeight, 8);
    
    // Sign out button text
    fill('white');
    noStroke();
      textAlign(CENTER, CENTER);
    textSize(Math.max(signOutButtonHeight * 0.25, 10));
    textFont('Helvetica, Arial, sans-serif'); // Sans serif font to match Cook/Hint buttons
    textStyle(BOLD);
    text("Sign Out", signOutButtonX, signOutButtonY);
    pop();
    
    // "COMBO MEAL" title (enlarged for profile screen prominence)
    const titleY = statsY + statsHeight * 0.4;
    const titleText = "COMBO MEAL";
    const titleSize = Math.max(playAreaWidth * 0.0825, 30); // Increased by 50% from 0.055 to 0.0825, min from 20 to 30
    
    push();
    textAlign(CENTER, CENTER);
    textSize(titleSize);
    textStyle(BOLD);
    textFont(titleFont); // Use Courier font like game screen
    
    // Calculate letter spacing for kerning effect
    let titleX = playAreaX + playAreaWidth / 2;
    let totalWidth = 0;
    let letterWidths = [];
    
    // Calculate individual letter widths
    for (let i = 0; i < titleText.length; i++) {
      let letterWidth = textWidth(titleText[i]);
      letterWidths.push(letterWidth);
      totalWidth += letterWidth;
    }
    
    // Add kerning (0% increase in spacing like game screen)
    const kerningFactor = 0; // 0% extra space like game screen
    let totalKerning = 0;
    for (let i = 0; i < titleText.length - 1; i++) {
      totalKerning += letterWidths[i] * kerningFactor;
    }
    
    // Starting position
    let x = titleX - (totalWidth + totalKerning) / 2;
    
    // Bubble Pop effect parameters (exact copy from game screen)
    const bounceAmount = 2 * Math.sin(frameCount * 0.05); // Subtle bounce animation
    
    // Calculate outline sizes (scaled proportionally with larger title)
    const outerSize = Math.max(titleSize * 0.1, 3);   // Scale with title size, min 3px
    const middleSize = Math.max(titleSize * 0.067, 2);  // Scale with title size, min 2px  
    const innerSize = Math.max(titleSize * 0.017, 0.5); // Scale with title size, min 0.5px
    
    // IMPROVED OUTLINE APPROACH - Draw outlines for each letter (exact copy from game screen)
    // First pass: Draw all outline layers for all letters
    for (let layer = 0; layer < 3; layer++) {
      let currentX = x; // Reset x position for each layer
      
      let layerSize, layerColor;
      switch (layer) {
        case 0: // Outer black outline
          layerSize = outerSize;
          layerColor = 'black';
          break;
        case 1: // Middle peach outline
          layerSize = middleSize;
          layerColor = COLORS.peach;
          break;
        case 2: // Inner black outline
          layerSize = innerSize;
          layerColor = 'black';
          break;
      }
      
      push();
      fill(layerColor);
      textAlign(CENTER, CENTER);
      textSize(titleSize);
      
      for (let i = 0; i < titleText.length; i++) {
        // Calculate letter position with alternating bounce effect (exact copy from game screen)
        let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
        let letterX = currentX + letterWidths[i]/2;
        let letterY = titleY + offsetY;
        
        // Draw outline for this letter
        for (let angle = 0; angle < TWO_PI; angle += PI/16) {
          let outlineOffsetX = cos(angle) * layerSize;
          let outlineOffsetY = sin(angle) * layerSize;
          text(titleText[i], letterX + outlineOffsetX, letterY + outlineOffsetY);
        }
        
        // Move to next letter position
        currentX += letterWidths[i] * (1 + kerningFactor);
      }
      pop();
    }
    
    // Second pass: Draw colored letters on top (exact copy from game screen)
    for (let i = 0; i < titleText.length; i++) {
      // Choose color based on position (exact copy from game screen)
      let letterColor;
      switch (i % 3) {
        case 0:
          letterColor = '#cfc23f'; // Mustard yellow from game screen
          break;
        case 1:
          letterColor = '#f7dc30'; // Bright yellow from game screen
          break;
        case 2:
          letterColor = COLORS.secondary; // Pink from game screen
          break;
      }
      
      // Calculate letter position with alternating bounce effect (exact copy from game screen)
      let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
      let letterX = x + letterWidths[i]/2;
      let letterY = titleY + offsetY;
      
      // Draw the colored letter
      push();
      textAlign(CENTER, CENTER);
      textSize(titleSize);
      fill(letterColor);
      text(titleText[i], letterX, letterY);
      pop();
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    pop();
    
    // Draw 4-card stats grid in lower part of stats section
    const userId = window.authState?.user?.id;
    if (userId && typeof getUserProfile === 'function') {
      if (!window.profileData || window.profileData.loading) {
        // Show loading state
        textAlign(CENTER, CENTER);
        textSize(Math.max(playAreaWidth * 0.04, 16));
        textStyle(NORMAL);
        fill(COLORS.text);
        text("Loading your stats...", playAreaX + playAreaWidth / 2, statsY + statsHeight * 0.7);
        
        // Load profile data
        if (!window.profileData) {
          window.profileData = { loading: true };
          window.recipeNamesCache = null;
          window.recipeImagesCache = null;
          window.loadingRecipeNames = false;
          window.loadingRecipeImages = false;
          
          getUserProfile(userId).then(profile => {
            if (profile) {
          console.log("Profile loaded with unique recipes:", profile.unique_recipes?.length || 0);
              window.profileData = profile;
          
          // Initialize lazy loading with first batch of recipes
          allUniqueRecipes = profile.unique_recipes || [];
          hasMoreRecipes = allUniqueRecipes.length >= recipesPerPage;
          
          // Note: Animation will be triggered when recipe names/images are loaded, not here
            } else {
              window.profileData = { error: true };
            }
          }).catch(error => {
            console.error("Error loading profile:", error);
            window.profileData = { error: true };
          });
        }
      } else if (window.profileData.error) {
        // Show error state
        textAlign(CENTER, CENTER);
        textSize(Math.max(playAreaWidth * 0.035, 14));
        textStyle(NORMAL);
        fill(COLORS.secondary);
        text("Error loading stats", playAreaX + playAreaWidth / 2, statsY + statsHeight * 0.7);
      } else {
        // Draw 4-card stats grid
        const cardHeight = statsHeight * 0.4;
        const cardWidth = playAreaWidth * 0.18;
        const cardSpacing = playAreaWidth * 0.04;
        const totalCardsWidth = (cardWidth * 4) + (cardSpacing * 3);
        const cardsStartX = playAreaX + (playAreaWidth - totalCardsWidth) / 2;
        const cardsY = statsY + statsHeight * 0.55;
        
        const metrics = [
          { 
            label: "Current\nStreak", 
            value: window.profileData.current_streak || 0,
            x: cardsStartX 
          },
          { 
            label: "Best\nStreak", 
            value: window.profileData.longest_streak || 0,
            x: cardsStartX + cardWidth + cardSpacing
          },
          { 
            label: "Recipes\nMade", 
            value: window.profileData.recipes_made || 0,
            x: cardsStartX + (cardWidth + cardSpacing) * 2
          },
          { 
            label: "Average\nScore", 
            value: (window.profileData.average_star_score || 0).toFixed(1),
            x: cardsStartX + (cardWidth + cardSpacing) * 3,
            suffix: "⭐"
          }
        ];
        
        push();
        rectMode(CORNER);
        
        metrics.forEach(metric => {
          // Draw card background
          fill(255); // Pure white background
          stroke(COLORS.primary);
          strokeWeight(1);
          rect(metric.x, cardsY, cardWidth, cardHeight, 8);
          
          // Draw label
          fill(COLORS.text);
          noStroke();
          textAlign(CENTER, TOP);
          textSize(Math.max(cardWidth * 0.1, 10));
          textStyle(NORMAL);
          text(metric.label, metric.x + cardWidth/2, cardsY + cardHeight * 0.15);
          
          // Draw value
          textAlign(CENTER, BOTTOM);
          textSize(Math.max(cardWidth * 0.22, 16));
          textStyle(BOLD);
          fill(COLORS.primary);
          const displayValue = metric.value + (metric.suffix || "");
          text(displayValue, metric.x + cardWidth/2, cardsY + cardHeight * 0.85);
        });
        
        pop();
      }
    }
    
    // =============================================================================
    // RECIPE SECTION (75% of screen height)
    // =============================================================================
    const recipesY = statsY + statsHeight;
    const recipesHeight = playAreaHeight * 0.75;
    
    // Recipe box (bottom third of recipe section)
    const greenBoxHeight = recipesHeight * 0.33;
    const greenBoxY = recipesY + recipesHeight - greenBoxHeight;
    const greenBoxWidth = playAreaWidth * 0.95;
    const greenBoxX = playAreaX + (playAreaWidth - greenBoxWidth) / 2;
    
    // Cards scroll area (top two-thirds of recipe section)
    const cardScrollAreaHeight = recipesHeight - greenBoxHeight;
    
    // =============================================================================
    // 3D RECIPE BOX CHARACTER (drawn behind Recipe CardTops)
    // =============================================================================
    
    push();
    rectMode(CORNER);
    
    // Calculate dimensions for 3D lid effect
    const lidTopHeight = greenBoxHeight / 3; // Lid top is 1/3 of box height
    const trapezoidHeight = greenBoxHeight * 0.4; // Trapezoid height for good proportion
    const trapezoidBottomWidth = greenBoxWidth * 0.75; // Bottom is 75% of box width
    const trapezoidTopWidth = greenBoxWidth; // Top matches box width
    
    // Calculate positions for each layer
    const lidTopY = greenBoxY - lidTopHeight - trapezoidHeight;
    const trapezoidY = greenBoxY - trapezoidHeight;
    const trapezoidBottomX = greenBoxX + (greenBoxWidth - trapezoidBottomWidth) / 2; // Center the trapezoid bottom
    
    // LAYER 1: Base Recipe Box (bottom, right angles)
    // Draw shadow for base box
    fill(0, 0, 0, 40);
    noStroke();
    rect(greenBoxX + 4, greenBoxY + 4, greenBoxWidth, greenBoxHeight); // No rounded corners
    
    // Store orange recipe box coordinates to draw AFTER cards (so cards go behind it)
    window.orangeRecipeBox = {
      x: greenBoxX,
      y: greenBoxY,
      w: greenBoxWidth,
      h: greenBoxHeight,
      squareWidth: greenBoxWidth / 3,
      squareHeight: greenBoxHeight / 2
    };
    
    // =============================================================================
    // CUTE RECIPE BOX FACE - APlasker
    // =============================================================================
    
    // Store face coordinates to draw later with the box
    window.recipeBoxFace = {
      leftEyeX: greenBoxX + (greenBoxWidth / 3),
      rightEyeX: greenBoxX + (greenBoxWidth / 3) * 2,
      eyeY: greenBoxY + (greenBoxHeight / 2),
      eyeSize: Math.min(greenBoxWidth / 3, greenBoxHeight / 2) * 0.22,
      mouthX: greenBoxX + (greenBoxWidth / 3) * 1.5,
      mouthY: greenBoxY + (greenBoxHeight / 2) * 1.5,
      mouthWidth: (greenBoxWidth / 3) * 0.25,
      mouthHeight: (greenBoxHeight / 2) * 0.15,
      leftCheekX: greenBoxX + (greenBoxWidth / 3) * 0.5,
      leftCheekY: greenBoxY + (greenBoxHeight / 2) * 1.5,
      rightCheekX: greenBoxX + (greenBoxWidth / 3) * 2.5,
      rightCheekY: greenBoxY + (greenBoxHeight / 2) * 1.5,
      cheekFlowerSize: Math.min(greenBoxWidth / 3, greenBoxHeight / 2) * 0.12
    };

    // LAYER 2: Trapezoid Lid (middle, light green)
    // Draw light green trapezoid lid (no shadow)
    fill(COLORS.primary); // Light green color
    stroke(0);
    strokeWeight(3); // Increased from 2 for bolder outline
    quad(
      trapezoidBottomX, greenBoxY, // Bottom left (shares border with box top)
      trapezoidBottomX + trapezoidBottomWidth, greenBoxY, // Bottom right
      greenBoxX + greenBoxWidth, trapezoidY, // Top right
      greenBoxX, trapezoidY // Top left
    );
    
    // LAYER 3: Lid Top Rectangle (top, orange)
    // Draw lid top shadow
    fill(0, 0, 0, 40);
    noStroke();
    rect(greenBoxX + 4, lidTopY + 4, greenBoxWidth, lidTopHeight); // Shadow offset
    
    // Draw orange lid top (shares border with trapezoid top)
    fill(COLORS.peach); // Same orange as recipe box
    stroke(0);
    strokeWeight(3); // Increased from 2 for bolder outline
    rect(greenBoxX, lidTopY, greenBoxWidth, lidTopHeight);
    
    pop();
    
    // Handle recipe completions with simplified card design
    if (window.profileData && !window.profileData.loading && !window.profileData.error) {
        if (window.profileData.unique_recipes && window.profileData.unique_recipes.length > 0) {
        
        // Show loading state if either names or images are not loaded
        if (!window.recipeNamesCache || !window.recipeImagesCache) {
          // Initialize loading flags if they don't exist
          if (typeof window.loadingRecipeNames === 'undefined') {
            window.loadingRecipeNames = false;
          }
          if (typeof window.loadingRecipeImages === 'undefined') {
            window.loadingRecipeImages = false;
          }
          
          // Fetch recipe names if not cached and not currently loading
          if (!window.recipeNamesCache && !window.loadingRecipeNames) {
            console.log("Fetching recipe names for unique recipes...");
            window.loadingRecipeNames = true;
            const recipeIds = allUniqueRecipes.map(comp => comp.rec_id);
            getRecipeNames(recipeIds).then(recipeMap => {
              console.log("Recipe names fetched:", recipeMap);
              window.recipeNamesCache = recipeMap;
              window.loadingRecipeNames = false;
              
              // Check if both names and images are now loaded to trigger animation
              if (window.recipeImagesCache && !profileDataLoaded) {
                console.log("Both recipe names and images loaded - triggering bounce animation");
                animations.push(new RecipeBounceAnimation());
                profileDataLoaded = true;
              }
            }).catch(error => {
              console.error("Error fetching recipe names:", error);
            window.recipeNamesCache = {};
              window.loadingRecipeNames = false;
          });
          }
          
          // Also fetch recipe images for modal display if not cached and not currently loading
          if (!window.recipeImagesCache && !window.loadingRecipeImages) {
            console.log("Fetching recipe images for unique recipes...");
            window.loadingRecipeImages = true;
            const recipeIds = allUniqueRecipes.map(comp => comp.rec_id);
            getRecipeImages(recipeIds).then(imageMap => {
              console.log("Recipe images fetched:", imageMap);
              window.recipeImagesCache = imageMap;
              window.loadingRecipeImages = false;
              
              // Check if both names and images are now loaded to trigger animation
              if (window.recipeNamesCache && !profileDataLoaded) {
                console.log("Both recipe names and images loaded - triggering bounce animation");
                animations.push(new RecipeBounceAnimation());
                profileDataLoaded = true;
              }
            }).catch(error => {
              console.error("Error fetching recipe images:", error);
              window.recipeImagesCache = {};
              window.loadingRecipeImages = false;
            });
          }
          
          // Show loading state while either is loading
          push();
          textAlign(CENTER, CENTER);
            textSize(Math.max(playAreaWidth * 0.035, 14));
            textStyle(NORMAL);
            fill(COLORS.text);
          text("Loading recipe details...", playAreaX + playAreaWidth / 2, recipesY + cardScrollAreaHeight / 2);
          pop();
          } else {
          // Display simplified recipe cards using lazy loaded data
          const recipes = allUniqueRecipes;
          
          // Recipe CardTop dimensions - overlapping design (reduced by 2% to fit inside box)
          const cardWidth = greenBoxWidth * 0.98;
          const cardHeight = 80; // Fixed height for recipe card tops
          const cardOverlap = cardHeight * 0.05; // 5% overlap
          const cardX = greenBoxX + (greenBoxWidth - cardWidth) / 2; // Center the narrower cards
          
          // Initialize scroll position
          if (typeof recipeListScrollY === 'undefined') {
            recipeListScrollY = 0;
          }
          
          // FIXED: Calculate scroll limits to allow proper stacking behavior
          const totalContentHeight = recipes.length * (cardHeight - cardOverlap);
          // Allow much more scrolling to enable stacking at the top
          recipeListMaxScroll = totalContentHeight + cardScrollAreaHeight;
          
          // Constrain scroll position - negative values bring cards up
          recipeListScrollY = constrain(recipeListScrollY, -recipeListMaxScroll, 0);
          
          // Apply momentum scrolling
          if (!recipeListScrolling && Math.abs(recipeListVelocity) > 0.1) {
            recipeListScrollY += recipeListVelocity;
            recipeListVelocity *= recipeListFriction;
            recipeListScrollY = constrain(recipeListScrollY, -recipeListMaxScroll, 0);
          }
          
          // Check if we need to load more recipes (lazy loading)
          // Trigger when user has scrolled near the bottom
          const scrolledNearBottom = Math.abs(recipeListScrollY) > recipeListMaxScroll * 0.8;
          if (scrolledNearBottom && hasMoreRecipes && !recipesLoading && window.profileData) {
            loadMoreRecipes();
          }
          
          // Store clickable cards for interaction
          let clickableCards = [];
          
          // Draw recipe card tops in forward order so earlier cards go behind later cards when stacked
          for (let recipeIndex = 0; recipeIndex < recipes.length; recipeIndex++) {
            const completion = recipes[recipeIndex];
          
                        // Calculate base card position with scroll and overlap - cards start 12px ABOVE the recipe box
            let baseCardY = greenBoxY - 12 + (recipeIndex * (cardHeight - cardOverlap)) - Math.abs(recipeListScrollY);
            
            // STACKING BEHAVIOR: Clamp cards that hit the top edge of viewing area
            const topEdge = recipesY;
            let cardY = Math.max(baseCardY, topEdge);
            
            // BOUNCE ANIMATION: Apply bounce offset to the first recipe card - APlasker
            if (recipeIndex === 0) {
              // Find active RecipeBounceAnimation
              for (let anim of animations) {
                if (anim instanceof RecipeBounceAnimation && anim.active) {
                  cardY += anim.getBounceOffset();
                  break;
                }
              }
            }
            
            // RECIPE BOX BOUNDARY: Prevent last 5 cards from going too far above the recipe box
            // This makes it look like the rest of the cards are still close to the box!
            const cardsFromEnd = recipes.length - 1 - recipeIndex; // 0 = last card, 1 = second to last, etc.
            const isInLastGroup = cardsFromEnd < 5; // Last 5 cards move together
            
            if (isInLastGroup) {
              // Calculate where the absolute last card would be
              const lastCardIndex = recipes.length - 1;
              const lastCardBaseY = greenBoxY - 12 + (lastCardIndex * (cardHeight - cardOverlap)) - Math.abs(recipeListScrollY);
              const lastCardY = Math.max(lastCardBaseY, topEdge);
              
              // Check if the last card would go too far above the recipe box
              // We want the final position to be right at the recipe box edge when fully scrolled
              const maxDistanceAboveBox = 0; // Keep cards at the recipe box edge when fully scrolled
              const lastCardBottom = lastCardY + cardHeight;
              if (lastCardBottom < greenBoxY - maxDistanceAboveBox) {
                // Calculate the offset needed to keep last card's bottom at the ideal position
                const boundaryOffset = (greenBoxY - maxDistanceAboveBox - cardHeight) - lastCardY;
                
                // Apply this same offset to the current card in the group
                cardY += boundaryOffset;
              }
            }
            
            // Skip cards that are completely below the visible area
            if (cardY > recipesY + cardScrollAreaHeight) {
              continue;
            }
            
            // Get recipe info with proper null checking
            const recipeInfo = window.recipeNamesCache && window.recipeNamesCache[completion.rec_id] ? window.recipeNamesCache[completion.rec_id] : null;
              const recipeName = recipeInfo?.name || `Recipe #${completion.rec_id.slice(0, 8)}`;
              const dayNumber = recipeInfo?.day_number || '?';
              
            // Format completion date
            const completionDate = new Date(completion.completed_at);
            const completionDateStr = completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Get recipe date from cache if available
            const recipeDate = recipeInfo?.date || null;
            let recipeDateStr = '';
            if (recipeDate) {
              const date = new Date(recipeDate);
              recipeDateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            
            // Since cards are now clamped to stay within viewing area, they're always fully visible
            const visibleCardTop = cardY;
            const visibleCardBottom = cardY + cardHeight;
            const visibleHeight = cardHeight;
            
            // Add to clickable cards for interaction
            clickableCards.push({
              completion: completion,
              recipeName: recipeName,
              dayNumber: dayNumber,
              completionDateStr: completionDateStr,
              recipeDateStr: recipeDateStr,
              starScore: completion.star_score || 0,
              bounds: {
                x: cardX,
                y: visibleCardTop,
                w: cardWidth,
                h: visibleHeight
              },
              fullBounds: {
                x: cardX,
                y: cardY,
                w: cardWidth,
                h: cardHeight
              }
            });
              
                        // Draw card (now always fully visible due to stacking behavior)
              push();
              rectMode(CORNER);
            
            // Card background with shadow - rounded top, flat bottom (more rounded to match recipe cards)
            fill(0, 0, 0, 30);
            noStroke();
            // Draw shadow with rounded top corners only - increased radius to match recipe cards
            drawRoundedTopRect(cardX + 3, cardY + 3, cardWidth, cardHeight, Math.max(cardWidth * 0.02, 8));
            
                        fill(255, 255, 255, 255); // Changed to 100% opacity (was 240)
                stroke(COLORS.primary);
                strokeWeight(2);
            // Draw card with rounded top corners only - increased radius to match recipe cards
            drawRoundedTopRect(cardX, cardY, cardWidth, cardHeight, Math.max(cardWidth * 0.02, 8));
              
            // Draw flowers in the corners of the card tops (match recipe cards)
            const flowerSize = Math.max(cardWidth * 0.01, 2); // 1% of card width, min 2px
            const cornerOffset = cardWidth * 0.04; // 4% of card width from edges
            
            // Draw flowers in each corner (only top corners for card tops)
            drawFlower(cardX + cornerOffset, cardY + cornerOffset, flowerSize, COLORS.primary); // Top-left
            drawFlower(cardX + cardWidth - cornerOffset, cardY + cornerOffset, flowerSize, COLORS.peach); // Top-right
            
            // === RECIPE NAME (optimized sizing for CardTops) ===
              textAlign(CENTER, CENTER);
            const recipeNameSize = min(max(cardWidth * 0.08, 12), 18); // Optimized: 8% of card width, min 12px, max 18px
            const maxTitleWidth = cardWidth * 0.9;
            
            textSize(recipeNameSize);
            fill(COLORS.secondary); // Pink color like recipe cards
              textStyle(BOLD);
            textFont('Courier, "Courier New", monospace'); // Courier font like recipe cards
            
            let displayName = recipeName;
            const titleWidth = textWidth(displayName);
            
            // Use scale factor for dynamic sizing
            let scaleFactor = 1.0;
            if (titleWidth > maxTitleWidth) {
              scaleFactor = maxTitleWidth / titleWidth;
              textSize(recipeNameSize * scaleFactor);
            }
            
            text(displayName, cardX + cardWidth/2, cardY + cardHeight * 0.25);
            textStyle(NORMAL);
            
            // === AUTHOR (optimized sizing for CardTops) ===
            if (recipeInfo?.author) {
              textAlign(CENTER, CENTER);
              textSize(min(max(cardWidth * 0.04, 6), 8)); // Optimized: 4% of card width, min 6px, max 8px
              fill('#333333'); // Match win screen color
              textStyle(BOLD); // Match win screen style
              textFont('Courier, "Courier New", monospace'); // Match win screen font (same as recipe name)
              
              let authorText = `By ${recipeInfo.author}`;
              text(authorText, cardX + cardWidth/2, cardY + cardHeight * 0.45);
              textStyle(NORMAL);
            }
                
            // === DATE AND STARS (bottom row) ===
            const bottomRowY = cardY + cardHeight * 0.75;
            textFont('Helvetica, Arial, sans-serif'); // Standard font for date/stars
            textStyle(NORMAL);
            
            // Recipe date (left side)
            if (recipeDateStr) {
              textAlign(LEFT, CENTER);
              let dateTextSize = Math.max(cardWidth * 0.025, 10);
              textSize(dateTextSize);
              fill(120, 120, 120); // Gray color for date
              
              // Scale date text to fit left half
              const maxDateWidth = cardWidth * 0.4;
              while (textWidth(recipeDateStr) > maxDateWidth && dateTextSize > 8) {
                dateTextSize *= 0.95;
                textSize(dateTextSize);
              }
              
              text(recipeDateStr, cardX + 15, bottomRowY);
              }
              
            // Star rating (right side)
            textAlign(RIGHT, CENTER);
            let starTextSize = Math.max(cardWidth * 0.025, 10);
            textSize(starTextSize);
            fill(255, 215, 0); // Gold color for stars
            
            const starScore = completion.star_score || 0;
            const starsText = "⭐".repeat(Math.max(0, starScore));
            
            // Scale star text to fit right half
            const maxStarWidth = cardWidth * 0.4;
            while (textWidth(starsText) > maxStarWidth && starTextSize > 8) {
              starTextSize *= 0.95;
              textSize(starTextSize);
            }
            
            text(starsText, cardX + cardWidth - 15, bottomRowY);
            
            pop(); // End card drawing
          }
          
          // Store clickable cards globally for interaction
          window.clickableRecipeCards = clickableCards;
          
          // Show loading indicator if loading more recipes
          if (recipesLoading) {
            push();
                textAlign(CENTER, CENTER);
            textSize(Math.max(playAreaWidth * 0.03, 12));
              textStyle(NORMAL);
            fill(COLORS.primary);
            text("Loading more recipes...", playAreaX + playAreaWidth / 2, recipesY + cardScrollAreaHeight - 30);
              pop();
          }
          
          // Draw recipe box top line over the cards so it's not cut off
          if (window.recipeBoxTopLine) {
              push();
              stroke(0);
            strokeWeight(3); // Same as recipe box outline
            line(window.recipeBoxTopLine.x1, window.recipeBoxTopLine.y1, 
                 window.recipeBoxTopLine.x2, window.recipeBoxTopLine.y2);
              pop();
          }
        }
                } else {
        // No completed recipes - show message
              push();
                textAlign(CENTER, CENTER);
        textSize(Math.max(playAreaWidth * 0.04, 16));
              textStyle(NORMAL);
        fill(COLORS.text);
        text("Complete recipes to fill your box!", playAreaX + playAreaWidth / 2, recipesY + cardScrollAreaHeight / 2);
              pop();
      }
    }
    
    // =============================================================================
    // DRAW ORANGE RECIPE BOX AFTER CARDS (so cards appear behind it) - APlasker
    // =============================================================================
    if (window.orangeRecipeBox) {
              push();
      rectMode(CORNER);
      
      // Draw main orange recipe box base (right angles, no rounded corners)
      fill(COLORS.peach); // Use peach/orange color for recipe box
              stroke(0);
      strokeWeight(3); // Increased from 2 for bolder outline
      rect(window.orangeRecipeBox.x, window.orangeRecipeBox.y, window.orangeRecipeBox.w, window.orangeRecipeBox.h); // No rounded corners
      
      // Draw the cute recipe box face if face data exists
      if (window.recipeBoxFace) {
        const face = window.recipeBoxFace;
              
        // Draw eyes (medium circles)
        fill('black');
        noStroke();
        circle(face.leftEyeX, face.eyeY, face.eyeSize);
        circle(face.rightEyeX, face.eyeY, face.eyeSize);
        
        // Draw cute teacup-style smile (smooth bezier curve for natural appearance)
        strokeWeight(Math.max(5, face.mouthWidth * 0.2)); // Extra thick stroke weight
        strokeCap(ROUND); // Round line caps for smoother appearance
        stroke('black');
        noFill();
        
        // Use bezier curve for smooth, gradual smile instead of simple arc
        const smileStartX = face.mouthX - face.mouthWidth/2;
        const smileEndX = face.mouthX + face.mouthWidth/2;
        const smileY = face.mouthY - face.mouthHeight/4; // Adjust Y position for bezier curve
        const controlYOffset = face.mouthHeight * 0.6; // Control point offset for smooth curve
        
        bezier(
          smileStartX, smileY, // Start point
          smileStartX + face.mouthWidth * 0.2, smileY + controlYOffset, // First control point (gentle curve)
          smileEndX - face.mouthWidth * 0.2, smileY + controlYOffset, // Second control point (gentle curve) 
          smileEndX, smileY // End point
        );
        
        // Draw rosy cheeks with floral pattern (bottom left and bottom right)
        drawFlower(face.leftCheekX, face.leftCheekY, face.cheekFlowerSize, COLORS.secondary); // Pink floral pattern
        drawFlower(face.rightCheekX, face.rightCheekY, face.cheekFlowerSize, COLORS.secondary); // Pink floral pattern
      }
      
              pop();
    }
    
    // =============================================================================
    // RECIPE BOX TABS - Yellow index card tabs (drawn in front of cards) - APlasker
    // =============================================================================
    
    // Tab dimensions
    const tabWidth = greenBoxWidth / 6; // 1/6th as wide as recipe box
    const tabHeight = greenBoxHeight / 8; // 1/8th as tall as recipe box
    const tabY = greenBoxY - tabHeight; // Bottom of tab shares border with top of box
    const tabCornerRadius = Math.max(tabWidth * 0.15, 5); // Rounded top corners
    
    // First tab - starts 10% from left side
    const tab1X = greenBoxX + (greenBoxWidth * 0.1);
    
    // Second tab - starts 25% from left side  
    const tab2X = greenBoxX + (greenBoxWidth * 0.25);
            
    // Draw tab shadows
            push();
            fill(0, 0, 0, 30);
            noStroke();
    drawRoundedTopRect(tab1X + 2, tabY + 2, tabWidth, tabHeight, tabCornerRadius); // Tab 1 shadow
    drawRoundedTopRect(tab2X + 2, tabY + 2, tabWidth, tabHeight, tabCornerRadius); // Tab 2 shadow
    
    // Draw yellow tabs with rounded top corners
    fill('#f7dc30'); // Bright yellow color (same as COMBO MEAL title)
    stroke(0);
    strokeWeight(3); // Increased from 2 for bolder outline
    drawRoundedTopRect(tab1X, tabY, tabWidth, tabHeight, tabCornerRadius); // Tab 1
    drawRoundedTopRect(tab2X, tabY, tabWidth, tabHeight, tabCornerRadius); // Tab 2
            pop();
    

    
    // =============================================================================
    // RECIPE CARD MODAL - APlasker - UPDATED to be exact replica of win screen recipe card
    // =============================================================================
    if (recipeModalActive || recipeModalAnimating) {
      // Handle modal opacity animation
      if (recipeModalAnimating) {
        if (recipeModalActive) {
          // Fade in
          recipeModalOpacity += 51; // Fast fade in
          if (recipeModalOpacity >= 255) {
            recipeModalOpacity = 255;
            recipeModalAnimating = false;
          }
        } else {
          // Fade out
          recipeModalOpacity -= 51; // Fast fade out
          if (recipeModalOpacity <= 0) {
            recipeModalOpacity = 0;
            recipeModalAnimating = false;
            selectedRecipeCard = null; // Clear selected card data
            window.selectedRecipeFullData = null; // Clear full recipe data
          }
        }
      }
      
      if (recipeModalOpacity > 0 && selectedRecipeCard) {
        // Draw modal overlay
        push();
        fill(0, 0, 0, recipeModalOpacity * 0.6); // Semi-transparent overlay
        noStroke();
        rect(0, 0, windowWidth, windowHeight);
        pop();
        
        // Calculate recipe card size to match win screen exactly
        const cardWidth = min(playAreaWidth * 0.95, 600); // Match win screen: min(playAreaWidth, 600) but allow 95% of play area
        const cardHeight = playAreaHeight * 0.45; // Match win screen: playAreaHeight * 0.45
        
        // Position card slightly above center for better visual balance
        const cardX = playAreaX + playAreaWidth / 2;
        const cardY = playAreaY + playAreaHeight * 0.4; // Raised from 50% to 40% from top
        
        // Draw modal content - just the recipe card itself (no modal background container)
        if (recipeModalOpacity > 200) { // Only show content when mostly opaque
          
          // Fetch full recipe data if not already loaded
          if (!window.selectedRecipeFullData && selectedRecipeCard.completion) {
            console.log("Fetching full recipe data for rec_id:", selectedRecipeCard.completion.rec_id);
            
            // Initialize loading state
            window.selectedRecipeFullData = { loading: true };
            
            // Fetch the full recipe details
            fetchRecipeByRecId(selectedRecipeCard.completion.rec_id).then(fullRecipeData => {
              if (fullRecipeData) {
                console.log("Full recipe data loaded:", fullRecipeData);
                window.selectedRecipeFullData = fullRecipeData;
              } else {
                console.error("Failed to load recipe data");
                window.selectedRecipeFullData = { error: true };
              }
            }).catch(error => {
              console.error("Error loading recipe data:", error);
              window.selectedRecipeFullData = { error: true };
            });
          }
          
          push();
          
          if (window.selectedRecipeFullData && window.selectedRecipeFullData.loading) {
            // Show loading state on the card
            // Draw card background for loading state
            push();
            rectMode(CENTER);
            fill(255, 255, 255, recipeModalOpacity);
            stroke(COLORS.primary);
            strokeWeight(2);
            rect(cardX, cardY, cardWidth, cardHeight, max(cardWidth * 0.02, 8));
            pop();
            
            textAlign(CENTER, CENTER);
            textSize(Math.max(cardWidth * 0.04, 16));
            textStyle(NORMAL);
            fill(COLORS.text);
            text("Loading recipe details...", cardX, cardY);
            
          } else if (window.selectedRecipeFullData && window.selectedRecipeFullData.error) {
            // Show error state on the card
            // Draw card background for error state
            push();
            rectMode(CENTER);
            fill(255, 255, 255, recipeModalOpacity);
            stroke(COLORS.primary);
            strokeWeight(2);
            rect(cardX, cardY, cardWidth, cardHeight, max(cardWidth * 0.02, 8));
            pop();
            
            textAlign(CENTER, CENTER);
            textSize(Math.max(cardWidth * 0.035, 14));
            textStyle(NORMAL);
            fill(COLORS.secondary);
            text("Error loading recipe details", cardX, cardY);
            
          } else if (window.selectedRecipeFullData && !window.selectedRecipeFullData.loading) {
            // Draw the complete recipe card - exact replica of win screen
            const recipeData = window.selectedRecipeFullData;
            
            // === RECIPE CARD (Direct replica of win screen, no container) ===
            
            // Draw Recipe Card with drop shadow (exactly like win screen)
            push();
            rectMode(CENTER);
            fill(0, 0, 0, 30);
            noStroke();
            rect(cardX + 5, cardY + 5, cardWidth, cardHeight, max(cardWidth * 0.02, 8));
            
            // Card background (exactly like win screen)
            fill(255);
            stroke(220);
            strokeWeight(1);
            rect(cardX, cardY, cardWidth, cardHeight, max(cardWidth * 0.02, 8));
            pop();
            
            // Draw flowers in the corners of the recipe card (exactly like win screen)
            const flowerSize = max(cardWidth * 0.01, 2);
            const cornerOffset = cardWidth * 0.04;
            
            drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary);
            drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.peach);
            drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.peach);
            drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary);
            
            // === RECIPE NAME (adjusted for 5:4 ratio) ===
            textAlign(CENTER, CENTER);
            const recipeNameSize = min(max(cardWidth * 0.08, 16), 28); // Size relative to card width
            const maxTitleWidth = cardWidth * 0.9;
            
            textSize(recipeNameSize);
            fill(COLORS.secondary);
            textStyle(BOLD);
            
            const recipeName = recipeData.recipeName || selectedRecipeCard.recipeName;
            const titleWidth = textWidth(recipeName);
            
            let scaleFactor = 1.0;
            if (titleWidth > maxTitleWidth) {
              scaleFactor = maxTitleWidth / titleWidth;
              textSize(recipeNameSize * scaleFactor);
            }
            
            text(recipeName, cardX, cardY - cardHeight/2 + cardHeight * 0.12); // Adjusted position
            textStyle(NORMAL);
            
            // === AUTHOR (adjusted for 5:4 ratio) ===
            textAlign(CENTER, CENTER);
            if (recipeData.author && recipeData.author.trim() !== "") {
              // Use original sizing rule but ensure recipe name is always larger
              const originalAuthorSize = min(max(cardWidth * 0.04, 8), 10); // Updated rule: 4% of card width, min 8px, max 10px
              const actualRecipeNameSize = min(max(cardWidth * 0.08, 16), 28);
              const scaledRecipeNameSize = scaleFactor < 1.0 ? actualRecipeNameSize * scaleFactor : actualRecipeNameSize;
              
              // Ensure recipe name is at least 2px larger than author (safeguard for edge cases)
              const authorSize = min(originalAuthorSize, scaledRecipeNameSize - 2);
              const finalAuthorSize = max(authorSize, 8); // Minimum 8px
              
              textSize(finalAuthorSize);
              fill('#333333');
              textStyle(BOLD);
              text(`By ${recipeData.author}`, cardX, cardY - cardHeight/2 + cardHeight * 0.20); // Adjusted position
              textStyle(NORMAL);
            }
            
            // === RECIPE IMAGE (reduced by 10% from win screen) ===
            const imageWidth = cardWidth * 0.54; // Reduced from 60% to 54% (10% smaller)
            const imageHeight = imageWidth; // Keep square
            let imageX = cardX - cardWidth/2 + cardWidth * 0.35; // Match win screen: 35% from left edge
            let imageY = cardY - cardHeight/2 + cardHeight * 0.62; // Lowered from 56% to 62% from top
            
            push();
            rectMode(CENTER);
            imageMode(CENTER);
            textAlign(CENTER, CENTER);
            
            // Check if we have the loaded image from cache
            const recipeImageInfo = window.recipeImagesCache?.[selectedRecipeCard.completion.rec_id];
            const hasLoadedImage = recipeImageInfo && recipeImageInfo.loadedImage;
            
            if (!hasLoadedImage || !recipeImageInfo.loadedImage) {
              // Draw recipe image placeholder (exactly like win screen)
              fill(240);
              stroke(220);
              strokeWeight(1);
              rect(imageX, imageY, imageWidth, imageHeight, max(cardWidth * 0.02, 8));
              
              fill(180);
              textSize(min(max(playAreaWidth * 0.025, 10), 14));
              text("Recipe Image", imageX, imageY);
            } else {
              // Draw the actual recipe image (exactly like win screen)
              const img = recipeImageInfo.loadedImage;
              const imgRatio = img.width / img.height;
              const boxRatio = imageWidth / imageHeight;
              
              let sx = 0, sy = 0, sw = img.width, sh = img.height;
              
              if (imgRatio > boxRatio) {
                sw = img.height * boxRatio;
                sx = (img.width - sw) / 2;
              } else if (imgRatio < boxRatio) {
                sh = img.width / boxRatio;
                sy = (img.height - sh) / 2;
              }
              
              const cornerRadius = max(cardWidth * 0.02, 8);
              
              push();
              noStroke();
              fill(255);
              rect(imageX, imageY, imageWidth, imageHeight, cornerRadius);
              drawingContext.clip();
              
              image(img, imageX, imageY, imageWidth, imageHeight, sx, sy, sw, sh);
              
              pop();
              
              noFill();
              stroke(220);
              strokeWeight(1);
              rect(imageX, imageY, imageWidth, imageHeight, cornerRadius);
            }
            
            pop();
            
            // === RECIPE DESCRIPTION (match win screen exactly) ===
            const descriptionX = cardX - cardWidth/2 + cardWidth * 0.67; // Match win screen: 67% from left
            const descriptionWidth = cardWidth * 0.3; // Match win screen: 30% of card width
            const descriptionY = cardY - cardHeight/2 + cardHeight * 0.25; // Match win screen: 25% from top
            
            push();
            fill('#666');
            textAlign(LEFT, TOP);
            textSize(min(max(playAreaWidth * 0.03, 10), 12)); // Updated: 3% of play area width, min 10px, max 12px
            
            const maxDescriptionHeight = cardHeight * 0.60; // Match win screen: 60% of card height
            const description = recipeData.description || "A delicious recipe from your collection!";
            
            text(description, descriptionX, descriptionY, descriptionWidth, maxDescriptionHeight);
            pop();
            
            // === "VIEW FULL RECIPE" LINK (match win screen exactly) ===
            const recipeDetailsX = cardX - cardWidth/2 + cardWidth * 0.67; // Match win screen: 67% from left
            const recipeDetailsY = cardY + cardHeight/2 - cardHeight * 0.15; // Match win screen: 15% from bottom
            
            // Check if mouse is over the recipe details link
            const linkHovered = mouseX > recipeDetailsX && mouseX < recipeDetailsX + descriptionWidth &&
                                mouseY > recipeDetailsY - 10 && mouseY < recipeDetailsY + 20;
            
            push();
            textAlign(LEFT, CENTER);
            textSize(min(max(playAreaWidth * 0.035, 12), 14)); // Updated: 3.5% of play area width, min 12px, max 14px
            textStyle(BOLD);
            fill(linkHovered ? COLORS.primary : '#666');
            text("Make this recipe for real! →", recipeDetailsX, recipeDetailsY, descriptionWidth);
            textStyle(NORMAL);
            pop();
            
            // Store button data for click handling
            window.recipeModalButtons = {
              fullRecipe: {
                x: recipeDetailsX + descriptionWidth/2, 
                y: recipeDetailsY, 
                w: descriptionWidth, 
                h: 30,
                url: recipeData.recipeUrl || "https://www.example.com/recipe"
              }
              // Close button removed - modal can be closed by tapping outside
            };
            
            // === STATS SECTION BELOW RECIPE CARD ===
            const statsY = cardY + cardHeight/2 + 30; // 30px gap below recipe card
            const statsHeight = 45; // Reduced height since no headers
            
            // Determine if Easter egg was found from completion data
            const eggFound = selectedRecipeCard.completion?.egg_found || false;
            
            // Calculate grid dimensions based on whether egg was found
            const numStats = eggFound ? 4 : 3; // 4 stats if egg found, 3 otherwise
            const statCardWidth = cardWidth / numStats - 10; // Divide width evenly with 10px spacing
            const statCardHeight = statsHeight;
            
            // Draw stats grid
            push();
            rectMode(CORNER);
            
            const hintsUsed = selectedRecipeCard.completion?.hints_used || 0;
            const starCount = Math.max(0, selectedRecipeCard.starScore);
            
            const stats = [
              {
                value: "⭐".repeat(starCount),
                color: "#FFD700"
              },
              {
                value: formatTime(selectedRecipeCard.completion?.total_time_seconds || 0),
                color: COLORS.primary
              },
              {
                value: `${hintsUsed} Hint${hintsUsed === 1 ? '' : 's'}`,
                color: COLORS.secondary
              }
            ];
            
            // Only add egg stat if egg was found
            if (eggFound) {
              stats.push({
                value: "🍳🥚", // Egg-in-pan emoji
                color: "#FFA500"
              });
            }
            
            // Draw each stat card
            for (let i = 0; i < stats.length; i++) {
              const stat = stats[i];
              const statX = cardX - cardWidth/2 + i * (statCardWidth + 10) + 5; // 5px left margin
              
              // Draw stat card background - white instead of grey
              fill(255); // Pure white background
              stroke(stat.color);
              strokeWeight(2);
              rect(statX, statsY, statCardWidth, statCardHeight, 8);
              
              // Draw value centered in the card
              fill(stat.color);
              noStroke();
              textAlign(CENTER, CENTER);
              
              // Adjust text size for stars to ensure they fit
              if (i === 0) { // Stars
                let starTextSize = Math.max(statCardWidth * 0.15, 12);
                textSize(starTextSize);
                // Check if stars fit, reduce size if needed
                while (textWidth(stat.value) > statCardWidth - 10 && starTextSize > 8) {
                  starTextSize *= 0.9;
                  textSize(starTextSize);
                }
              } else {
                textSize(Math.max(statCardWidth * 0.18, 14));
              }
              
              textStyle(BOLD);
              text(stat.value, statX + statCardWidth/2, statsY + statCardHeight/2);
            }
            
            pop();
            
            if (linkHovered) {
              cursor(HAND);
            }
          }
          
          pop();
        }
      }
    }
    
    // =============================================================================
    // SIGN OUT CONFIRMATION MODAL - APlasker
    // =============================================================================
    if (signOutModalActive || signOutModalAnimating) {
      // Handle modal opacity animation - FIXED: Faster animation
      if (signOutModalAnimating) {
        if (signOutModalActive) {
          // Fade in - much faster
          signOutModalOpacity += 51; // Increased from 15 to 51 for faster fade in (5 frames instead of 17)
          if (signOutModalOpacity >= 255) {
            signOutModalOpacity = 255;
            signOutModalAnimating = false;
          }
        } else {
          // Fade out - much faster
          signOutModalOpacity -= 51; // Increased from 15 to 51 for faster fade out
          if (signOutModalOpacity <= 0) {
            signOutModalOpacity = 0;
            signOutModalAnimating = false;
            // Modal is now fully hidden
          }
        }
      }
      
      if (signOutModalOpacity > 0) {
        // Draw modal overlay
    push();
        fill(0, 0, 0, signOutModalOpacity * 0.5); // Semi-transparent overlay
        noStroke();
        rect(0, 0, windowWidth, windowHeight);
        pop();
        
        // Draw modal box
        const modalWidth = Math.min(playAreaWidth * 0.8, 300);
        const modalHeight = Math.min(playAreaHeight * 0.4, 200);
        const modalX = playAreaX + playAreaWidth / 2;
        const modalY = playAreaY + playAreaHeight / 2;
        
        push();
        rectMode(CENTER);
        fill(255, 255, 255, signOutModalOpacity);
        stroke(COLORS.primary);
    strokeWeight(2);
        rect(modalX, modalY, modalWidth, modalHeight, 12);
        pop();
        
        // Draw modal content
        if (signOutModalOpacity > 200) { // Only show text when mostly opaque
          push();
          
          // Title - Updated text and improved spacing
          textAlign(CENTER, CENTER);
          textSize(Math.max(modalWidth * 0.06, 14));
          textStyle(BOLD);
          fill(COLORS.text);
          text("Sign Out?", modalX, modalY - modalHeight * 0.3); // More space from top
          
          // User email - Better vertical spacing
          textSize(Math.max(modalWidth * 0.045, 12));
          textStyle(NORMAL);
          fill(COLORS.text);
          const userEmail = window.authState?.user?.email || "Current User";
          text(`Currently signed in as:`, modalX, modalY - modalHeight * 0.1); // More even spacing
          text(userEmail, modalX, modalY + modalHeight * 0.05); // Keep same position
          
          // Improved button positioning with better spacing
          const buttonWidth = modalWidth * 0.3;
          const buttonHeight = 35;
          const buttonY = modalY + modalHeight * 0.3; // Moved down for more even spacing
          const buttonSpacing = modalWidth * 0.25;
          
          // Cancel button - Use standard secondary button styling
          const cancelX = modalX - buttonSpacing;
          const cancelHovered = dist(mouseX, mouseY, cancelX, buttonY) < buttonWidth/2;
          
          rectMode(CENTER);
          fill(cancelHovered ? lerpColor(color(255), color(COLORS.primary), 0.1) : 255);
          stroke(COLORS.primary); // Standard secondary button stroke
          strokeWeight(3); // Standardized stroke weight
          rect(cancelX, buttonY, buttonWidth, buttonHeight, 8);
          
              fill(COLORS.primary); // Standard secondary button text color
          noStroke();
          textAlign(CENTER, CENTER);
          textSize(Math.max(buttonHeight * 0.25, 12));
          textStyle(BOLD);
          text("Cancel", cancelX, buttonY);
          
          // Sign Out button - Using same pink as Sign Out button
          const confirmX = modalX + buttonSpacing;
          const confirmHovered = dist(mouseX, mouseY, confirmX, buttonY) < buttonWidth/2;
          
          fill(confirmHovered ? lerpColor(color(COLORS.secondary), color(255), 0.2) : COLORS.secondary);
          stroke(COLORS.secondary); // Match stroke to fill color for consistency
          strokeWeight(3); // Standardized stroke weight
          rect(confirmX, buttonY, buttonWidth, buttonHeight, 8);
          
          fill('white');
          noStroke();
          textAlign(CENTER, CENTER);
          textSize(Math.max(buttonHeight * 0.25, 12));
          textStyle(BOLD);
          text("Sign Out", confirmX, buttonY);
          
    pop();
        }
      }
    }
    
    // Handle cursor changes
    if (backButtonHovered || signOutHovered) {
      cursor(HAND);
    } else if (signOutModalActive && signOutModalOpacity > 200) {
      // Check modal button hovers - Updated coordinates for new spacing
      const modalWidth = Math.min(playAreaWidth * 0.8, 300);
      const modalHeight = Math.min(playAreaHeight * 0.4, 200);
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight / 2;
      const buttonWidth = modalWidth * 0.3;
      const buttonY = modalY + modalHeight * 0.3; // Updated to match new button position
      const buttonSpacing = modalWidth * 0.25;
      
      const cancelX = modalX - buttonSpacing; // Updated positioning
      const confirmX = modalX + buttonSpacing; // Updated positioning
      
      if (dist(mouseX, mouseY, cancelX, buttonY) < buttonWidth/2 || 
          dist(mouseX, mouseY, confirmX, buttonY) < buttonWidth/2) {
      cursor(HAND);
      } else {
        cursor(ARROW);
      }
    } else {
      cursor(ARROW);
    }
  }
  
  // Profile screen state variables for scrolling - APlasker
  let recipeListScrollY = 0; // Current scroll position
  let recipeListMaxScroll = 0; // Maximum scroll distance
  let recipeListScrolling = false; // Whether user is actively scrolling
  let recipeListTouchStartY = 0; // Touch start position for scrolling
  let recipeListVelocity = 0; // Scroll velocity for momentum
  let recipeListFriction = 0.9; // Friction for momentum decay
  let recipeListTotalScrollDistance = 0; // Track total scroll distance for tap/scroll detection
  let profileDataLoaded = false; // Track if profile data has finished loading for the first time - APlasker
  
  // Lazy loading state variables - APlasker
  let allUniqueRecipes = []; // All loaded unique recipes
  let recipesLoading = false; // Whether we're currently loading more recipes
  let hasMoreRecipes = true; // Whether there are more recipes to load
  let recipesPerPage = 20; // How many recipes to load at once
  
  // Sign out modal state variables - APlasker
  let signOutModalActive = false;
  let signOutModalOpacity = 0;
  let signOutModalAnimating = false;
  let signOutModalButtons = { cancel: null, confirm: null };
  
  // Function to show sign out confirmation modal - APlasker
  function showSignOutModal() {
    signOutModalActive = true;
    signOutModalAnimating = true;
    signOutModalOpacity = 0;
    
    // Create modal buttons
    const modalWidth = Math.min(playAreaWidth * 0.8, 300);
    const modalHeight = Math.min(playAreaHeight * 0.4, 200);
    const modalX = playAreaX + playAreaWidth / 2;
    const modalY = playAreaY + playAreaHeight / 2;
    
    const buttonWidth = modalWidth * 0.35;
    const buttonHeight = 40;
    const buttonY = modalY + modalHeight * 0.15;
    
    signOutModalButtons.cancel = {
      x: modalX - modalWidth * 0.15,
      y: buttonY,
      w: buttonWidth,
      h: buttonHeight,
      label: "Cancel"
    };
    
    signOutModalButtons.confirm = {
      x: modalX + modalWidth * 0.15,
      y: buttonY,
      w: buttonWidth,
      h: buttonHeight,
      label: "Sign Out"
    };
  }
  
  // Function to hide sign out modal - APlasker
  function hideSignOutModal() {
    signOutModalActive = false; // Immediately set to false so fade out works
    signOutModalAnimating = true;
    // Modal will be fully hidden when opacity reaches 0
  }
  
  // Recipe modal state variables - APlasker
  let recipeModalActive = false;
  let recipeModalOpacity = 0;
  let recipeModalAnimating = false;
  let selectedRecipeCard = null; // Stores the recipe data for the selected card
  
  // Function to show recipe card modal - APlasker
  function showRecipeCardModal(recipeData) {
    selectedRecipeCard = recipeData;
    recipeModalActive = true;
    recipeModalAnimating = true;
    recipeModalOpacity = 0;
  }
  
  // Function to hide recipe card modal - APlasker
  function hideRecipeCardModal() {
    recipeModalActive = false;
    recipeModalAnimating = true;
    // Modal will fade out and be fully hidden when opacity reaches 0
  }
  
  // Function to load more recipes for lazy loading - APlasker
  async function loadMoreRecipes() {
    if (recipesLoading || !hasMoreRecipes || !window.authState?.user?.id) {
      return;
    }
    
    console.log("Loading more recipes...");
    recipesLoading = true;
    
    try {
      const userId = window.authState.user.id;
      const currentCount = allUniqueRecipes.length;
      
      // Load more recipes from the current offset
      const moreRecipes = await loadMoreUniqueRecipes(userId, currentCount, recipesPerPage);
      
      if (moreRecipes && moreRecipes.length > 0) {
        // Add new recipes to our collection
        allUniqueRecipes.push(...moreRecipes);
        
        // Update names and images caches for new recipes
        const newRecipeIds = moreRecipes.map(comp => comp.rec_id);
        
        // Load recipe names for new recipes
        const [newRecipeNames, newRecipeImages] = await Promise.all([
          getRecipeNames(newRecipeIds),
          getRecipeImages(newRecipeIds)
        ]);
        
        // Merge with existing caches
        if (newRecipeNames) {
          window.recipeNamesCache = { ...window.recipeNamesCache, ...newRecipeNames };
        }
        if (newRecipeImages) {
          window.recipeImagesCache = { ...window.recipeImagesCache, ...newRecipeImages };
        }
        
        // Check if we have more recipes to load
        hasMoreRecipes = moreRecipes.length >= recipesPerPage;
        
        console.log(`Loaded ${moreRecipes.length} more recipes. Total: ${allUniqueRecipes.length}, Has more: ${hasMoreRecipes}`);
      } else {
        // No more recipes to load
        hasMoreRecipes = false;
        console.log("No more recipes to load");
      }
    } catch (error) {
      console.error("Error loading more recipes:", error);
    } finally {
      recipesLoading = false;
    }
  }

  // Helper function to draw rectangle with only top corners rounded
  function drawRoundedTopRect(x, y, w, h, radius) {
    push();
    beginShape();
    // Start from bottom left
    vertex(x, y + h);
    // Bottom right
    vertex(x + w, y + h);
    // Top right with curve
    vertex(x + w, y + radius);
    quadraticVertex(x + w, y, x + w - radius, y);
    // Top edge
    vertex(x + radius, y);
    // Top left with curve
    quadraticVertex(x, y, x, y + radius);
    // Left edge back to start
    vertex(x, y + h);
    endShape(CLOSE);
    pop();
  }
  
  // Helper function for security monitoring
  // Note: Actual monitoring functions are implemented in Supabase SQL
  
  function windowResized() {
    // Existing resize code...
    
    // Update auth modal HTML input positions if active
    if (typeof window.authModal !== 'undefined' && 
        window.authModal.active && 
        typeof updateHtmlInputPositions === 'function') {
      updateHtmlInputPositions();
    }
  }
  
  