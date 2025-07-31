/**
 * Standalone Recipe Playtest System
 * 
 * A simplified, self-contained version of the game that:
 * - Has its own Supabase connection logic
 * - Implements core game mechanics independently
 * - Won't break when main game files are updated
 * - Focuses on reliability over feature completeness
 */

// ===== Configuration =====
const CONFIG = {
    // Copy these from your environment or config.js
    // This way updates to config.js won't affect this standalone version
    SUPABASE_URL: 'https://ovrvtfjejmhrflybslwi.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk',
    
    // Game configuration
    VESSEL_COLORS: {
        base: '#FFFFFF',
        partial: '#FFD700',
        complete: '#778F5D',
        hint: '#FF5252'
    },
    
    // Timing
    COMBINATION_DELAY: 500 // ms
};

// ===== Global State =====
const gameState = {
    // Recipe data
    recipes: [],
    currentRecipe: null,
    
    // Game state
    vessels: [],
    moves: 0,
    startTime: null,
    timerInterval: null,
    
    // UI state
    currentScreen: 'selector',
    draggedVessel: null,
    
    // Tracking
    usedCombinations: new Set(),
    completedSteps: []
};

// ===== Supabase Connection =====
let supabase;

function initializeSupabase() {
    try {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        showError('Failed to connect to database. Please check your connection.');
    }
}

// ===== Recipe Loading =====
async function loadRecipes() {
    showLoading(true);
    
    try {
        // First fetch all recipes
        const { data: recipes, error: recipesError } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: false });

        if (recipesError) throw recipesError;

        // Process each recipe to get its details
        const processedRecipes = [];
        
        for (const recipe of recipes) {
            try {
                // Fetch combinations for this recipe
                const { data: combinations, error: combosError } = await supabase
                    .from('combinations')
                    .select('*')
                    .eq('rec_id', recipe.rec_id);
                
                if (combosError) {
                    console.error(`Error loading combinations for recipe ${recipe.rec_id}:`, combosError);
                    continue;
                }
                
                // Fetch ingredients for all combinations
                const comboIds = combinations.map(c => c.combo_id);
                const { data: ingredients, error: ingredientsError } = await supabase
                    .from('ingredients')
                    .select('*')
                    .in('combo_id', comboIds);
                
                if (ingredientsError) {
                    console.error(`Error loading ingredients for recipe ${recipe.rec_id}:`, ingredientsError);
                    continue;
                }
                
                // Process the recipe data
                const processedRecipe = processRecipeData(recipe, combinations, ingredients);
                if (processedRecipe) {
                    processedRecipes.push(processedRecipe);
                }
            } catch (error) {
                console.error(`Error processing recipe ${recipe.rec_id}:`, error);
            }
        }
        
        // Store and display recipes
        gameState.recipes = processedRecipes;
        displayRecipes(gameState.recipes);
        
        console.log(`✅ Loaded ${gameState.recipes.length} recipes`);
    } catch (error) {
        console.error('❌ Failed to load recipes:', error);
        showError('Failed to load recipes. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Process recipe data into a consistent format
function processRecipeData(recipe, combinations, ingredients) {
    try {
        // Find the final combination
        const finalCombo = combinations.find(combo => combo.is_final === true);
        
        if (!finalCombo) {
            console.warn(`No final combination found for recipe ${recipe.rec_id}, skipping...`);
            return null;
        }
        
        // Find intermediate combinations
        const intermediateCombos = combinations.filter(combo => combo.is_final === false);
        
        // Get all base ingredients
        const baseIngredients = [...new Set(
            ingredients
                .filter(ing => ing.is_base === true)
                .map(ing => ing.name)
        )];
        
        // Group ingredients by combination
        const ingredientsByCombo = {};
        ingredients.forEach(ing => {
            if (!ingredientsByCombo[ing.combo_id]) {
                ingredientsByCombo[ing.combo_id] = [];
            }
            ingredientsByCombo[ing.combo_id].push(ing.name);
        });
        
        // Format intermediate combinations
        const intermediateCombinations = intermediateCombos.map(combo => {
            const comboIngredients = ingredientsByCombo[combo.combo_id] || [];
            return {
                name: combo.name,
                required: comboIngredients,
                verb: combo.verb || "mix"
            };
        });
        
        // Format final combination
        const finalIngredients = ingredientsByCombo[finalCombo.combo_id] || [];
        const finalCombination = {
            name: finalCombo.name,
            required: intermediateCombinations.map(c => c.name),
            verb: finalCombo.verb || "create"
        };
        
        return {
            ...recipe,
            baseIngredients,
            intermediateCombinations,
            finalCombination,
            dayNumber: calculateDayNumber(recipe.date)
        };
    } catch (error) {
        console.error('Error processing recipe data:', error);
        return null;
    }
}

// Calculate day number from date
function calculateDayNumber(dateStr) {
    const startDate = new Date('2025-03-10');
    const recipeDate = new Date(dateStr);
    const diffTime = Math.abs(recipeDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// ===== Recipe Display =====
function displayRecipes(recipes) {
    const listElement = document.getElementById('recipe-list');
    listElement.innerHTML = '';
    
    recipes.forEach(recipe => {
        const recipeElement = createRecipeElement(recipe);
        listElement.appendChild(recipeElement);
    });
}

function createRecipeElement(recipe) {
    const div = document.createElement('div');
    div.className = 'recipe-item';
    div.innerHTML = `
        <div class="recipe-header">
            <h3>${recipe.recipe_name || 'Unnamed Recipe'}</h3>
            <span class="recipe-date">Day ${recipe.dayNumber} - ${formatDate(recipe.date)}</span>
        </div>
        <div class="recipe-preview">
            ${recipe.baseIngredients.length} ingredients → 
            ${recipe.intermediateCombinations.length} combinations → 
            ${recipe.finalCombination?.name || '???'}
        </div>
    `;
    
    div.addEventListener('click', () => selectRecipe(recipe));
    return div;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// ===== Recipe Selection =====
function selectRecipe(recipe) {
    gameState.currentRecipe = recipe;
    startGame();
}

// ===== Game Logic =====
function startGame() {
    if (!gameState.currentRecipe) return;
    
    // Reset game state
    gameState.vessels = [];
    gameState.moves = 0;
    gameState.startTime = Date.now();
    gameState.usedCombinations.clear();
    gameState.completedSteps = [];
    
    // Update UI
    document.getElementById('recipe-name').textContent = gameState.currentRecipe.recipe_name;
    document.getElementById('recipe-date').textContent = `Day ${gameState.currentRecipe.dayNumber}`;
    document.getElementById('moves').textContent = '0';
    
    // Clear previous combinations list
    document.getElementById('combinations-list').innerHTML = '';
    
    // Create initial vessels
    createInitialVessels();
    
    // Switch screens
    showScreen('game');
    
    // Start timer
    startTimer();
    
    console.log('🎮 Game started:', gameState.currentRecipe.recipe_name);
    console.log('Recipe structure:', {
        baseIngredients: gameState.currentRecipe.baseIngredients,
        intermediateCombinations: gameState.currentRecipe.intermediateCombinations,
        finalCombination: gameState.currentRecipe.finalCombination
    });
}

function createInitialVessels() {
    const ingredientArea = document.getElementById('ingredient-area');
    ingredientArea.innerHTML = '';
    
    // Create vessels for base ingredients
    gameState.currentRecipe.baseIngredients.forEach((ingredient, index) => {
        const vessel = createVessel({
            id: `vessel-${Date.now()}-${index}`,
            type: 'base',
            contents: [ingredient],
            name: ingredient,
            x: 0,
            y: 0
        });
        
        gameState.vessels.push(vessel);
        ingredientArea.appendChild(vessel.element);
    });
    
    // Arrange vessels in a grid
    arrangeVessels();
}

function createVessel(data) {
    const vessel = {
        ...data,
        element: document.createElement('div')
    };
    
    vessel.element.className = `vessel vessel-${data.type}`;
    vessel.element.id = data.id;
    vessel.element.innerHTML = `
        <div class="vessel-content">
            <span class="vessel-name">${data.name}</span>
        </div>
    `;
    
    // Set initial position style
    vessel.element.style.position = 'absolute';
    
    // Make vessel draggable
    vessel.element.draggable = true;
    vessel.element.addEventListener('dragstart', (e) => handleDragStart(e, vessel));
    vessel.element.addEventListener('dragend', handleDragEnd);
    vessel.element.addEventListener('dragover', handleDragOver);
    vessel.element.addEventListener('drop', (e) => handleDrop(e, vessel));
    
    // Touch support
    vessel.element.addEventListener('touchstart', (e) => handleTouchStart(e, vessel));
    vessel.element.addEventListener('touchmove', handleTouchMove);
    vessel.element.addEventListener('touchend', handleTouchEnd);
    
    return vessel;
}

function arrangeVessels() {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        const container = document.getElementById('ingredient-area');
        const vessels = container.querySelectorAll('.vessel');
        const containerWidth = container.offsetWidth;
        const vesselWidth = 120;
        const vesselHeight = 80;
        const padding = 20;
        const vesselsPerRow = Math.max(1, Math.floor((containerWidth - padding) / (vesselWidth + padding)));
        
        vessels.forEach((vessel, index) => {
            const row = Math.floor(index / vesselsPerRow);
            const col = index % vesselsPerRow;
            
            vessel.style.position = 'absolute';
            vessel.style.left = `${col * (vesselWidth + padding) + padding}px`;
            vessel.style.top = `${row * (vesselHeight + padding) + padding}px`;
            vessel.style.width = `${vesselWidth}px`;
            vessel.style.height = `${vesselHeight}px`;
        });
        
        // Update container height to fit all vessels
        const rows = Math.ceil(vessels.length / vesselsPerRow);
        const minHeight = rows * (vesselHeight + padding) + padding;
        container.style.minHeight = `${minHeight}px`;
    }, 100);
}

// ===== Drag and Drop =====
function handleDragStart(e, vessel) {
    gameState.draggedVessel = vessel;
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, targetVessel) {
    e.preventDefault();
    
    if (gameState.draggedVessel && gameState.draggedVessel.id !== targetVessel.id) {
        attemptCombination(gameState.draggedVessel, targetVessel);
    }
    
    gameState.draggedVessel = null;
}

// ===== Touch Support =====
let touchedVessel = null;
let touchClone = null;

function handleTouchStart(e, vessel) {
    touchedVessel = vessel;
    const touch = e.touches[0];
    
    // Create a visual clone for dragging
    touchClone = vessel.element.cloneNode(true);
    touchClone.classList.add('touch-clone');
    touchClone.style.position = 'fixed';
    touchClone.style.left = `${touch.clientX - 60}px`;
    touchClone.style.top = `${touch.clientY - 40}px`;
    touchClone.style.pointerEvents = 'none';
    touchClone.style.zIndex = '1000';
    document.body.appendChild(touchClone);
    
    vessel.element.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!touchClone) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    touchClone.style.left = `${touch.clientX - 60}px`;
    touchClone.style.top = `${touch.clientY - 40}px`;
}

function handleTouchEnd(e) {
    if (!touchedVessel || !touchClone) return;
    
    const touch = e.changedTouches[0];
    
    // Remove clone
    touchClone.remove();
    touchClone = null;
    
    // Find element under touch point
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetVessel = elementBelow?.closest('.vessel');
    
    if (targetVessel && targetVessel.id !== touchedVessel.element.id) {
        const target = gameState.vessels.find(v => v.element.id === targetVessel.id);
        if (target) {
            attemptCombination(touchedVessel, target);
        }
    }
    
    touchedVessel.element.classList.remove('dragging');
    touchedVessel = null;
}

// ===== Combination Logic =====
function attemptCombination(vessel1, vessel2) {
    console.log('Attempting combination:', vessel1.contents, '+', vessel2.contents);
    
    // Increment move counter
    gameState.moves++;
    document.getElementById('moves').textContent = gameState.moves;
    
    // Combine all contents
    const allContents = [...vessel1.contents, ...vessel2.contents].sort();
    console.log('Combined contents:', allContents);
    
    // Check for valid combinations
    const result = checkCombination(allContents);
    
    if (result) {
        console.log('Valid combination found:', result);
        // Valid combination found
        performCombination(vessel1, vessel2, result);
    } else {
        console.log('Invalid combination');
        // Invalid combination - shake vessels
        shakeVessel(vessel1.element);
        shakeVessel(vessel2.element);
    }
}

function checkCombination(contents) {
    const recipe = gameState.currentRecipe;
    
    // First check if this matches the final combination
    if (recipe.finalCombination) {
        // Final combination uses intermediate combination names
        if (arraysEqual(contents, recipe.finalCombination.required.sort())) {
            return {
                type: 'final',
                name: recipe.finalCombination.name,
                isComplete: true
            };
        }
    }
    
    // Then check intermediate combinations
    for (const combo of recipe.intermediateCombinations) {
        if (arraysEqual(contents, combo.required.sort())) {
            return {
                type: 'intermediate',
                name: combo.name,
                isComplete: true
            };
        }
        
        // Check partial match
        if (isPartialMatch(contents, combo.required)) {
            return {
                type: 'intermediate',
                name: `Partial ${combo.name}`,
                isComplete: false,
                targetCombo: combo
            };
        }
    }
    
    return null;
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function isPartialMatch(contents, required) {
    // Check if contents are a subset of required
    return contents.length < required.length && 
           contents.every(item => required.includes(item));
}

function performCombination(vessel1, vessel2, result) {
    // Determine the contents for the new vessel
    let newContents;
    if (result.type === 'final') {
        // Final combination doesn't need contents
        newContents = [result.name];
    } else if (result.isComplete) {
        // Complete intermediate combination - the name becomes the content
        newContents = [result.name];
    } else {
        // Partial combination - keep individual ingredients
        newContents = [...vessel1.contents, ...vessel2.contents];
    }
    
    // Create new vessel
    const newVessel = createVessel({
        id: `vessel-${Date.now()}`,
        type: result.isComplete ? 'complete' : 'partial',
        contents: newContents,
        name: result.name,
        x: vessel1.x,
        y: vessel1.y
    });
    
    // Add to game state
    gameState.vessels.push(newVessel);
    
    // Remove old vessels
    removeVessel(vessel1);
    removeVessel(vessel2);
    
    // Add new vessel to appropriate area
    if (result.type === 'final') {
        // Game won!
        handleWin(result);
    } else {
        document.getElementById('ingredient-area').appendChild(newVessel.element);
        arrangeVessels();
        
        // Update combination list
        updateCombinationsList(result);
    }
    
    // Animate
    newVessel.element.classList.add('vessel-appear');
    setTimeout(() => {
        newVessel.element.classList.remove('vessel-appear');
    }, 500);
}

function removeVessel(vessel) {
    const index = gameState.vessels.indexOf(vessel);
    if (index > -1) {
        gameState.vessels.splice(index, 1);
    }
    vessel.element.remove();
}

function shakeVessel(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

function updateCombinationsList(result) {
    const list = document.getElementById('combinations-list');
    const item = document.createElement('div');
    item.className = 'combination-item';
    item.innerHTML = `✓ ${result.name}`;
    list.appendChild(item);
}

// ===== Win Handling =====
function handleWin(result) {
    // Stop timer
    clearInterval(gameState.timerInterval);
    
    // Calculate time
    const totalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    
    // Update win overlay
    document.getElementById('final-dish').textContent = result.name;
    document.getElementById('final-moves').textContent = gameState.moves;
    document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Show win overlay
    document.getElementById('win-overlay').classList.remove('hidden');
    
    console.log('🎉 Game won!', result.name);
}

// ===== Timer =====
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ===== Search Functionality =====
function setupSearch() {
    const searchInput = document.getElementById('recipe-search');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (!query) {
            displayRecipes(gameState.recipes);
            return;
        }
        
        const filtered = gameState.recipes.filter(recipe => {
            return recipe.recipe_name?.toLowerCase().includes(query) ||
                   recipe.date?.includes(query) ||
                   recipe.dayNumber?.toString().includes(query) ||
                   recipe.finalCombination?.name?.toLowerCase().includes(query);
        });
        
        displayRecipes(filtered);
    });
}

// ===== UI Helpers =====
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(`${screenName}-screen`).classList.add('active');
    gameState.currentScreen = screenName;
}

function showLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-modal').classList.add('hidden');
}

// ===== Event Handlers =====
function setupEventHandlers() {
    // Random recipe button
    document.getElementById('random-recipe').addEventListener('click', () => {
        if (gameState.recipes.length > 0) {
            const randomRecipe = gameState.recipes[Math.floor(Math.random() * gameState.recipes.length)];
            selectRecipe(randomRecipe);
        }
    });
    
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        clearInterval(gameState.timerInterval);
        showScreen('selector');
    });
    
    // Play again button
    document.getElementById('play-again').addEventListener('click', () => {
        document.getElementById('win-overlay').classList.add('hidden');
        showScreen('selector');
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        if (gameState.currentScreen === 'game') {
            arrangeVessels();
        }
    });
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Standalone Playtest System');
    
    // Initialize Supabase
    initializeSupabase();
    
    // Set up UI
    setupSearch();
    setupEventHandlers();
    
    // Load recipes
    loadRecipes();
});

// ===== Public API =====
// Expose minimal API for debugging
window.StandalonePlaytest = {
    gameState,
    reloadRecipes: loadRecipes,
    getCurrentRecipe: () => gameState.currentRecipe,
    getVessels: () => gameState.vessels
};