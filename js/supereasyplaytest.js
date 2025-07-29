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
        
        // Log first recipe to see structure
        if (recipes.length > 0) {
            console.log('Sample recipe structure:', JSON.stringify(recipes[0], null, 2));
            console.log('Recipe keys:', Object.keys(recipes[0]));
        }
        
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
        item.dataset.recipeId = recipe.rec_id;
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
    const selectedItem = document.querySelector(`[data-recipe-id="${recipe.rec_id}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Store selected recipe
    window.SuperEasyPlaytest.selectedRecipe = recipe;
    
    // Enable start button
    document.getElementById('start-btn').disabled = false;
    
    console.log('📝 Selected recipe:', recipe.name, 'with ID:', recipe.rec_id);
    console.log('Full recipe object:', JSON.stringify(recipe, null, 2));
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
    
    console.log('🎮 Starting playtest with recipe:', recipe.name, 'ID:', recipe.rec_id, 'Full recipe object:', recipe);
    
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
    const recipeData = await fetchRecipeData(recipe.date, recipe.rec_id);
    
    // Set up the game environment
    setupGameEnvironment(recipeData);
    
    // Store recipe data for later use
    window.playtestRecipeData = recipeData;
    
    // Initialize p5 with our custom setup
    initializeP5Game();
}

/**
 * Load all necessary game scripts
 */
async function loadGameScripts() {
    console.log('📦 Loading game scripts...');
    
    // Set flags BEFORE loading any scripts to prevent wallpaper loading
    window.skipWallpaperAnimation = true;
    window.wallpaperImageReady = false;
    window.loadingComplete = true;
    
    // Store the original Image constructor
    window.OriginalImage = window.Image;
    
    // Override Image constructor to prevent wallpaper loading
    window.Image = function() {
        const img = new window.OriginalImage();
        const originalSrcSetter = Object.getOwnPropertyDescriptor(window.OriginalImage.prototype, 'src').set;
        
        Object.defineProperty(img, 'src', {
            set: function(value) {
                // Block wallpaper image loading
                if (value && (value.includes('wallpaper') || value.includes('assets/wallpaper'))) {
                    console.log('🚫 Blocked wallpaper loading:', value);
                    // Trigger error to skip wallpaper
                    setTimeout(() => {
                        if (img.onerror) img.onerror();
                    }, 0);
                    return;
                }
                // Allow other images
                originalSrcSetter.call(this, value);
            },
            get: function() {
                return this._src;
            }
        });
        
        return img;
    };
    
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
    
    // Restore original Image constructor after scripts are loaded
    if (window.OriginalImage) {
        window.Image = window.OriginalImage;
    }
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
        
        // Special check for supabase.js
        if (src.includes('supabase.js') && typeof window.SUPABASE_URL !== 'undefined') {
            console.log(`✓ Supabase already initialized, skipping: ${src}`);
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
async function fetchRecipeData(date, recipeId) {
    console.log('📊 Fetching recipe data for date:', date, 'with ID:', recipeId);
    
    // Use the existing fetchRecipeByDate function if available
    if (window.fetchRecipeByDate) {
        return await window.fetchRecipeByDate(date);
    }
    
    // Otherwise, fetch directly
    try {
        let recipe;
        
        // If we have the recipe ID, use it directly
        if (recipeId) {
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('rec_id', recipeId)
                .single();
            
            if (recipeError) throw recipeError;
            recipe = recipeData;
        } else {
            // Fallback to fetching by date
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('date', date)
                .single();
            
            if (recipeError) throw recipeError;
            recipe = recipeData;
        }
        
        // Fetch combinations
        const { data: combinations, error: comboError } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipe.rec_id);
        
        if (comboError) throw comboError;
        
        // Return in expected format
        return {
            rec_id: recipe.rec_id,
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
    
    // Override loadWallpaperImage BEFORE scripts load to prevent CORS issues
    window.loadWallpaperImage = function() {
        console.log('🖼️ Skipping wallpaper loading in playtest mode');
        window.wallpaperImageReady = false;
        window.loadingComplete = true;
    };
    
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
    
    // Disable wallpaper loading in playtest mode to avoid CORS issues
    window.wallpaperImageReady = false;
    
    // Skip authentication
    window.isPlaytestMode = true;
    
    // Override wallpaper loading to prevent CORS issues
    if (window.loadWallpaperImage) {
        window.loadWallpaperImage = function() {
            console.log('🖼️ Skipping wallpaper loading in playtest mode');
            window.wallpaperImageReady = false;
            window.loadingComplete = true;
        };
    }
    
    console.log('✅ Game environment ready');
}

/**
 * Initialize the p5 game instance
 */
function initializeP5Game() {
    console.log('🎮 Initializing p5 game...');
    
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
            'rect', 'ellipse', 'circle', 'line', 'text', 'textSize', 'textAlign',
            'push', 'pop', 'translate', 'rotate', 'scale', 'loadImage',
            'image', 'tint', 'noTint', 'color', 'loadFont', 'textFont',
            'noStroke', 'noFill', 'smooth', 'noSmooth', 'cursor', 'noCursor',
            'rectMode', 'ellipseMode', 'strokeCap', 'strokeJoin',
            'min', 'max', 'abs', 'constrain', 'dist', 'exp', 'floor', 'lerp',
            'log', 'mag', 'map', 'norm', 'pow', 'round', 'sq', 'sqrt',
            'random', 'randomSeed', 'noise', 'noiseSeed', 'noiseDetail',
            'frameRate', 'frameCount', 'millis', 'resizeCanvas',
            'pixelDensity', 'displayDensity', 'windowWidth', 'windowHeight',
            'width', 'height', 'mouseX', 'mouseY', 'pmouseX', 'pmouseY',
            'mouseIsPressed', 'keyIsPressed', 'key', 'keyCode',
            'touches', 'touchIsDown', 'touchStarted', 'touchMoved', 'touchEnded',
            'CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'BASELINE',
            'BOLD', 'ITALIC', 'NORMAL', 'PI', 'TWO_PI', 'HALF_PI', 'QUARTER_PI',
            'degrees', 'radians', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
            'angleMode', 'DEGREES', 'RADIANS', 'textWidth', 'textAscent', 'textDescent',
            'textLeading', 'textStyle', 'textWrap', 'WORD', 'CHAR',
            'blendMode', 'BLEND', 'ADD', 'DARKEST', 'LIGHTEST', 'DIFFERENCE',
            'EXCLUSION', 'MULTIPLY', 'SCREEN', 'REPLACE', 'OVERLAY', 'HARD_LIGHT',
            'SOFT_LIGHT', 'DODGE', 'BURN', 'SUBTRACT',
            'vertex', 'beginShape', 'endShape', 'CLOSE', 'bezier', 'bezierVertex',
            'quadraticVertex', 'curve', 'curveVertex', 'arc', 'triangle', 'quad',
            'mousePressed', 'mouseReleased', 'mouseMoved', 'mouseDragged',
            'mouseClicked', 'mouseWheel', 'keyPressed', 'keyReleased', 'keyTyped',
            'windowResized', 'deviceMoved', 'deviceTurned', 'deviceShaken'
        ];
        
        // Expose functions to window
        p5Functions.forEach(fn => {
            if (typeof p[fn] !== 'undefined') {
                window[fn] = function() {
                    return p[fn].apply(p, arguments);
                };
            }
        });
        
        // Also expose p5 constants and properties that aren't functions
        const p5Constants = ['PI', 'TWO_PI', 'HALF_PI', 'QUARTER_PI', 'TAU',
            'DEGREES', 'RADIANS', 'DEG_TO_RAD', 'RAD_TO_DEG',
            'CORNER', 'CORNERS', 'RADIUS', 'CENTER',
            'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'BASELINE',
            'POINTS', 'LINES', 'LINE_STRIP', 'LINE_LOOP', 'TRIANGLES',
            'TRIANGLE_FAN', 'TRIANGLE_STRIP', 'QUADS', 'QUAD_STRIP',
            'CLOSE', 'OPEN', 'CHORD', 'PIE', 'PROJECT', 'SQUARE', 'ROUND',
            'BEVEL', 'MITER', 'RGB', 'HSB', 'HSL', 'AUTO',
            'BLEND', 'ADD', 'DARKEST', 'LIGHTEST', 'DIFFERENCE',
            'EXCLUSION', 'MULTIPLY', 'SCREEN', 'REPLACE', 'OVERLAY',
            'HARD_LIGHT', 'SOFT_LIGHT', 'DODGE', 'BURN', 'SUBTRACT',
            'NORMAL', 'ITALIC', 'BOLD', 'BOLDITALIC',
            'WORD', 'CHAR', 'RGBA', 'HSBA', 'HSLA',
            'ARROW', 'CROSS', 'HAND', 'MOVE', 'TEXT', 'WAIT'];
            
        p5Constants.forEach(constant => {
            if (typeof p[constant] !== 'undefined') {
                window[constant] = p[constant];
            }
        });
        
        // Create a getter on window for any missing p5 properties
        // This is a dynamic fallback for any p5 properties we might have missed
        const windowProps = Object.getOwnPropertyNames(window);
        const p5Props = Object.getOwnPropertyNames(p);
        
        p5Props.forEach(prop => {
            // Skip if already defined on window or if it's a private property
            if (!windowProps.includes(prop) && !prop.startsWith('_')) {
                try {
                    Object.defineProperty(window, prop, {
                        get: function() {
                            return typeof p[prop] === 'function' 
                                ? p[prop].bind(p) 
                                : p[prop];
                        },
                        set: function(val) {
                            p[prop] = val;
                        },
                        configurable: true
                    });
                } catch (e) {
                    // Some properties might not be configurable
                }
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
            
            // Make height and width available globally
            window.width = p.width;
            window.height = p.height;
            
            // Update any p5 variables that might have changed after canvas creation
            const p5Variables = ['width', 'height', 'windowWidth', 'windowHeight', 
                'displayWidth', 'displayHeight', 'pixelDensity', 'displayDensity'];
            
            p5Variables.forEach(varName => {
                if (typeof p[varName] !== 'undefined') {
                    window[varName] = p[varName];
                }
            });
            
            // Skip wallpaper loading in playtest mode
            window.skipWallpaperAnimation = true;
            window.wallpaperImageReady = false;
            window.loadingComplete = true;
            
            // Run original setup if it exists
            if (window.setup) {
                window.setup();
            }
            
            // Now that canvas is ready, initialize the game
            if (window.initializeGame && window.playtestRecipeData) {
                // Make sure we have the recipe data
                window.recipeData = window.playtestRecipeData;
                window.initializeGame();
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