/**
 * Super Easy Playtest System
 * A simplified, robust approach to testing recipes in Combo Meal
 * 
 * Key principles:
 * 1. Minimal dependencies - only what's absolutely necessary
 * 2. No complex overrides - work WITH the existing system
 * 3. Clear separation of concerns
 * 4. Fail gracefully with helpful error messages
 */

// Global state for the playtest system
window.SuperEasyPlaytest = {
    recipes: [],
    selectedRecipe: null,
    gameInstance: null,
    isActive: false,
    originalFunctions: {}
};

// Supabase configuration (read from config.js if available)
const SUPABASE_URL = window.SUPABASE_URL || 'https://ovrvtfjejmhrflybslwi.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Initialize the playtest system
 */
async function initializePlaytest() {
    console.log('🚀 Initializing Super Easy Playtest System');
    
    try {
        // Load all recipes
        await loadRecipes();
        
        // Set up search functionality
        setupSearch();
        
        // Initialize UI event handlers
        setupEventHandlers();
        
        console.log('✅ Playtest system ready!');
    } catch (error) {
        console.error('❌ Failed to initialize playtest:', error);
        showError('Failed to initialize playtest system: ' + error.message);
    }
}

/**
 * Load all recipes from the database
 */
async function loadRecipes() {
    console.log('📚 Loading recipes from database...');
    
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = '<div class="loading-message">Loading recipes...</div>';
    
    try {
        // Fetch recipes from Supabase
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        window.SuperEasyPlaytest.recipes = recipes;
        console.log(`✅ Loaded ${recipes.length} recipes`);
        
        // Display recipes
        displayRecipes(recipes);
        
    } catch (error) {
        console.error('❌ Error loading recipes:', error);
        recipeList.innerHTML = '<div class="error-message">Failed to load recipes. Please refresh the page.</div>';
        throw error;
    }
}

/**
 * Display recipes in the list
 */
function displayRecipes(recipes) {
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = '';
    
    if (recipes.length === 0) {
        recipeList.innerHTML = '<div class="loading-message">No recipes found</div>';
        return;
    }
    
    recipes.forEach(recipe => {
        const item = document.createElement('div');
        item.className = 'recipe-item';
        item.dataset.recipeId = recipe.id;
        item.dataset.date = recipe.date;
        
        item.innerHTML = `
            <div class="recipe-date">${formatDate(recipe.date)}</div>
            <div class="recipe-name">${recipe.name}</div>
            <div class="recipe-day">Day ${recipe.day_number}</div>
        `;
        
        item.addEventListener('click', () => selectRecipe(recipe));
        recipeList.appendChild(item);
    });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Set up search functionality
 */
function setupSearch() {
    const searchBox = document.getElementById('recipe-search');
    
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = window.SuperEasyPlaytest.recipes.filter(recipe => {
            return recipe.name.toLowerCase().includes(searchTerm) ||
                   recipe.date.includes(searchTerm) ||
                   recipe.day_number.toString().includes(searchTerm);
        });
        
        displayRecipes(filtered);
    });
}

/**
 * Set up event handlers
 */
function setupEventHandlers() {
    // Handle escape key to exit playtest
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.SuperEasyPlaytest.isActive) {
            exitPlaytest();
        }
    });
}

/**
 * Select a recipe
 */
function selectRecipe(recipe) {
    // Remove previous selection
    document.querySelectorAll('.recipe-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    const selectedItem = document.querySelector(`[data-recipe-id="${recipe.id}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Store selected recipe
    window.SuperEasyPlaytest.selectedRecipe = recipe;
    
    // Enable start button
    document.getElementById('start-btn').disabled = false;
    
    console.log('📝 Selected recipe:', recipe.name);
}

/**
 * Select a random recipe
 */
function selectRandomRecipe() {
    const recipes = window.SuperEasyPlaytest.recipes;
    if (recipes.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[randomIndex];
    
    selectRecipe(randomRecipe);
    
    // Scroll to the selected recipe
    const selectedItem = document.querySelector(`[data-recipe-id="${randomRecipe.id}"]`);
    if (selectedItem) {
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Start the playtest with the selected recipe
 */
async function startPlaytest() {
    const recipe = window.SuperEasyPlaytest.selectedRecipe;
    if (!recipe) {
        alert('Please select a recipe first');
        return;
    }
    
    console.log('🎮 Starting playtest with recipe:', recipe.name);
    
    try {
        // Hide selector panel
        document.getElementById('selector-panel').classList.add('hidden');
        
        // Show game container
        document.getElementById('game-container').classList.add('active');
        
        // Show playtest controls
        document.getElementById('playtest-controls').classList.add('active');
        document.getElementById('info-panel').classList.add('active');
        
        // Update info panel
        document.getElementById('recipe-info').innerHTML = `
            <strong>${recipe.name}</strong><br>
            Day ${recipe.day_number} - ${formatDate(recipe.date)}
        `;
        
        // Mark playtest as active
        window.SuperEasyPlaytest.isActive = true;
        
        // Load and start the game
        await loadGameWithRecipe(recipe);
        
    } catch (error) {
        console.error('❌ Error starting playtest:', error);
        showError('Failed to start playtest: ' + error.message);
        exitPlaytest();
    }
}

/**
 * Load the game with the selected recipe
 */
async function loadGameWithRecipe(recipe) {
    console.log('🎮 Loading game with recipe data...');
    
    // First, we need to load all the game scripts
    await loadGameScripts();
    
    // Wait for scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch the full recipe data
    const recipeData = await fetchRecipeData(recipe.date);
    
    // Set up the game environment
    setupGameEnvironment(recipeData);
    
    // Initialize p5 with our custom setup
    initializeGame();
}

/**
 * Load all necessary game scripts
 */
async function loadGameScripts() {
    console.log('📦 Loading game scripts...');
    
    const scripts = [
        'js/config.js',
        'js/design-system.js',
        'js/supabase.js',
        'js/streak.js',
        'js/user-migration.js',
        'js/modules/VesselSystem.js',
        'js/animation.js',
        'js/interaction.js',
        'js/menu.js',
        'js/auth-modal.js',
        'js/sketch.js',
        'js/GameLogic.js',
        'js/draw.js',
        'js/WinScreen.js',
        'js/egg.js',
        'js/help.js'
    ];
    
    // Check if scripts are already loaded
    if (window.gameScriptsLoaded) {
        console.log('✅ Game scripts already loaded');
        return;
    }
    
    // Load scripts sequentially
    for (const scriptPath of scripts) {
        await loadScript(scriptPath);
    }
    
    window.gameScriptsLoaded = true;
    console.log('✅ All game scripts loaded');
}

/**
 * Load a single script
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
            console.log(`✓ Script already loaded: ${src}`);
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`✓ Loaded: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`✗ Failed to load: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        
        document.body.appendChild(script);
    });
}

/**
 * Fetch full recipe data including combinations
 */
async function fetchRecipeData(date) {
    console.log('📊 Fetching recipe data for date:', date);
    
    // Use the existing fetchRecipeByDate function if available
    if (window.fetchRecipeByDate) {
        return await window.fetchRecipeByDate(date);
    }
    
    // Otherwise, fetch directly
    try {
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('date', date)
            .single();
        
        if (recipeError) throw recipeError;
        
        // Fetch combinations
        const { data: combinations, error: comboError } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipe.id);
        
        if (comboError) throw comboError;
        
        // Return in expected format
        return {
            rec_id: recipe.id,
            recipeName: recipe.name,
            recipeUrl: recipe.recipe_url,
            imgUrl: recipe.img_url,
            day_number: recipe.day_number,
            date: recipe.date,
            finalCombination: combinations.find(c => c.is_final),
            intermediateCombinations: combinations.filter(c => !c.is_final),
            ingredients: [], // Would need to fetch these too
            ingredientsByCombination: {}
        };
        
    } catch (error) {
        console.error('❌ Error fetching recipe data:', error);
        throw error;
    }
}

/**
 * Set up the game environment with our recipe
 */
function setupGameEnvironment(recipeData) {
    console.log('🔧 Setting up game environment...');
    
    // Store original functions
    if (window.getCurrentDateEST) {
        window.SuperEasyPlaytest.originalFunctions.getCurrentDateEST = window.getCurrentDateEST;
    }
    if (window.fetchTodayRecipe) {
        window.SuperEasyPlaytest.originalFunctions.fetchTodayRecipe = window.fetchTodayRecipe;
    }
    if (window.checkTodayCompletion) {
        window.SuperEasyPlaytest.originalFunctions.checkTodayCompletion = window.checkTodayCompletion;
    }
    
    // Override date function to return our recipe's date
    window.getCurrentDateEST = function() {
        if (window.SuperEasyPlaytest.isActive && window.SuperEasyPlaytest.selectedRecipe) {
            return window.SuperEasyPlaytest.selectedRecipe.date;
        }
        return new Date().toISOString().split('T')[0];
    };
    
    // Override recipe fetching to return our data
    window.fetchTodayRecipe = async function() {
        if (window.SuperEasyPlaytest.isActive) {
            return recipeData;
        }
        return null;
    };
    
    // Override completion check to skip in playtest mode
    window.checkTodayCompletion = async function() {
        if (window.SuperEasyPlaytest.isActive) {
            console.log('🎮 Skipping completion check in playtest mode');
            // Just proceed with the game
            if (window.proceedWithNormalFlow) {
                window.proceedWithNormalFlow(recipeData);
            }
            return;
        }
        // Call original if not in playtest
        if (window.SuperEasyPlaytest.originalFunctions.checkTodayCompletion) {
            return window.SuperEasyPlaytest.originalFunctions.checkTodayCompletion();
        }
    };
    
    // Set the recipe data globally
    window.recipeData = recipeData;
    
    // Disable animations for better performance
    window.skipWallpaperAnimation = true;
    window.loadingComplete = true;
    
    // Skip authentication
    window.isPlaytestMode = true;
    
    console.log('✅ Game environment ready');
}

/**
 * Initialize the game
 */
function initializeGame() {
    console.log('🎮 Initializing game...');
    
    // Remove any existing canvas
    const existingCanvas = document.querySelector('canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Create a new p5 instance in the game container
    new p5((p) => {
        // Store p5 instance
        window.p = p;
        
        // Expose p5 functions globally (needed by the game code)
        const p5Functions = ['createCanvas', 'background', 'fill', 'stroke', 'strokeWeight',
            'rect', 'ellipse', 'line', 'text', 'textSize', 'textAlign',
            'push', 'pop', 'translate', 'rotate', 'scale', 'loadImage',
            'image', 'tint', 'noTint', 'color', 'loadFont', 'textFont',
            'noStroke', 'noFill', 'smooth', 'noSmooth', 'cursor', 'noCursor',
            'frameRate', 'frameCount', 'millis', 'resizeCanvas',
            'pixelDensity', 'displayDensity', 'windowWidth', 'windowHeight',
            'width', 'height', 'mouseX', 'mouseY', 'pmouseX', 'pmouseY',
            'mouseIsPressed', 'keyIsPressed', 'key', 'keyCode'
        ];
        
        // Expose functions to window
        p5Functions.forEach(fn => {
            if (typeof p[fn] !== 'undefined') {
                window[fn] = function() {
                    return p[fn].apply(p, arguments);
                };
            }
        });
        
        // Expose p5 constants
        const p5Constants = ['PI', 'TWO_PI', 'HALF_PI', 'QUARTER_PI',
            'CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'BASELINE',
            'RADIANS', 'DEGREES', 'CORNER', 'CORNERS', 'RADIUS',
            'RGB', 'HSB', 'HSL', 'BLEND', 'ADD', 'MULTIPLY'
        ];
        
        p5Constants.forEach(constant => {
            if (typeof p[constant] !== 'undefined') {
                window[constant] = p[constant];
            }
        });
        
        // Run preload
        p.preload = function() {
            if (window.preload) {
                window.preload();
            }
        };
        
        // Run setup
        p.setup = function() {
            // Ensure window dimensions are available
            window.windowWidth = p.windowWidth;
            window.windowHeight = p.windowHeight;
            
            // Create canvas in the game container
            const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
            canvas.parent('game-container');
            
            // Store canvas globally (some game code expects this)
            window.canvas = canvas;
            
            // Run original setup
            if (window.setup) {
                window.setup();
            }
        };
        
        // Run draw
        p.draw = function() {
            if (window.draw) {
                window.draw();
            }
        };
        
        // Handle mouse events
        p.mousePressed = function() {
            if (window.mousePressed) {
                return window.mousePressed();
            }
        };
        
        p.mouseReleased = function() {
            if (window.mouseReleased) {
                return window.mouseReleased();
            }
        };
        
        p.touchStarted = function() {
            if (window.touchStarted) {
                return window.touchStarted();
            }
        };
        
        p.touchEnded = function() {
            if (window.touchEnded) {
                return window.touchEnded();
            }
        };
        
        // Handle window resize
        p.windowResized = function() {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            if (window.windowResized) {
                window.windowResized();
            }
        };
    });
    
    console.log('✅ Game initialized');
}

/**
 * Exit playtest mode
 */
function exitPlaytest() {
    console.log('🚪 Exiting playtest mode...');
    
    // Mark as inactive
    window.SuperEasyPlaytest.isActive = false;
    
    // Restore original functions
    Object.keys(window.SuperEasyPlaytest.originalFunctions).forEach(funcName => {
        window[funcName] = window.SuperEasyPlaytest.originalFunctions[funcName];
    });
    
    // Remove p5 instance
    if (window.p && window.p.remove) {
        window.p.remove();
    }
    
    // Clear game container
    document.getElementById('game-container').innerHTML = '';
    document.getElementById('game-container').classList.remove('active');
    
    // Hide controls
    document.getElementById('playtest-controls').classList.remove('active');
    document.getElementById('info-panel').classList.remove('active');
    
    // Show selector panel
    document.getElementById('selector-panel').classList.remove('hidden');
    
    // Reset game state
    window.recipeData = null;
    window.gameStarted = false;
    window.gameWon = false;
    
    console.log('✅ Returned to recipe selector');
}

/**
 * Show error message
 */
function showError(message) {
    const recipeList = document.getElementById('recipe-list');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    recipeList.prepend(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePlaytest);