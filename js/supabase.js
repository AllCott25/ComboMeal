// Supabase Integration for Culinary Logic Puzzle
// This file handles fetching recipe data from Supabase

// Initialize Supabase client
// SECURITY: These should be loaded from environment variables, not hardcoded
// The anon key is safe to expose as it only grants access based on Row Level Security policies
const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

// Validate that credentials are properly configured
if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.error('SECURITY WARNING: Supabase credentials not properly configured. Please set up environment variables.');
}

// Create a single supabase client for interacting with your database
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to get the current date in EST/EDT timezone
function getCurrentDateEST() {
  // Get current date and time
  const now = new Date();
  
  // Create a date string in ISO format with EST timezone specified
  // Format: YYYY-MM-DDT00:00:00-05:00 (for EST)
  const dateString = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse the date string to get MM/DD/YYYY format
  const [month, day, year] = dateString.split('/');
  
  // Format as YYYY-MM-DD for database query
  const formattedDate = `${year}-${month}-${day}`;
  
  console.log("Current date in EST/EDT timezone:", formattedDate);
  return formattedDate;
}

// Function to fetch recipe for the current day
async function fetchTodayRecipe() {
  try {
    const today = getCurrentDateEST();
    console.log(`Fetching recipe for today: ${today}`);
    
    // Fetch recipe for today's date
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('date', today)
      .limit(1);
    
    if (error) {
      console.error("Error fetching today's recipe:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error(`No recipe found for today: ${today}`);
      return null;
    }
    
    const recipe = recipes[0];
    console.log("Found today's recipe:", recipe);
    
    // Now fetch combinations, ingredients, and easter eggs
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchTodayRecipe:", error);
    return null;
  }
}

// Fetch Recipe Details (combinations, ingredients, easter eggs)
async function fetchRecipeDetails(recipe) {
  try {
    // Fetch combinations for this recipe
    const { data: combinations, error: combosError } = await supabase
      .from('combinations')
      .select('*')
      .eq('rec_id', recipe.rec_id);
    
    if (combosError) {
      console.error("Error fetching combinations:", combosError);
      return null;
    }
    
    // Fetch ingredients for all combinations
    const comboIds = combinations.map(c => c.combo_id);
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .in('combo_id', comboIds);
    
    if (ingredientsError) {
      console.error("Error fetching ingredients:", ingredientsError);
      return null;
    }
    
    // Fetch easter eggs for this recipe
    const easterEggs = await fetchEasterEggs(recipe.rec_id);
    
    // Process the data
    return processRecipeData(recipe, combinations, ingredients, easterEggs);
  } catch (error) {
    console.error("Error in fetchRecipeDetails:", error);
    return null;
  }
}

// Function to fetch easter eggs for a specific recipe
async function fetchEasterEggs(recipeId) {
  try {
    console.log("Fetching easter eggs for recipe ID:", recipeId);
    
    // Query the eastereggs table for this recipe
    const { data: easterEggs, error } = await supabase
      .from('eastereggs')
      .select('*')
      .eq('rec_id', recipeId);
    
    if (error) {
      console.error("Easter eggs error:", error);
      return [];
    }
    
    console.log("Easter eggs data:", easterEggs);
    
    // We need to get the ingredient names for ing_id_1 and ing_id_2
    if (easterEggs && easterEggs.length > 0) {
      // Collect all ingredient IDs
      const ingredientIds = [];
      easterEggs.forEach(egg => {
        if (egg.ing_id_1) ingredientIds.push(egg.ing_id_1);
        if (egg.ing_id_2) ingredientIds.push(egg.ing_id_2);
      });
      
      // Fetch the ingredient names for these IDs
      if (ingredientIds.length > 0) {
        const { data: ingredientData, error: ingredientError } = await supabase
          .from('ingredients')
          .select('ing_id, name')
          .in('ing_id', ingredientIds);
        
        if (ingredientError) {
          console.error("Error fetching ingredient names:", ingredientError);
        } else {
          console.log("Ingredient data for easter eggs:", ingredientData);
          
          // Create a map of ing_id to name
          const ingredientMap = {};
          ingredientData.forEach(ing => {
            ingredientMap[ing.ing_id] = ing.name;
          });
          
          // Format the easter eggs data with ingredient names
          const formattedEasterEggs = easterEggs.map(egg => {
            const required = [];
            if (egg.ing_id_1 && ingredientMap[egg.ing_id_1]) {
              required.push(ingredientMap[egg.ing_id_1]);
            }
            if (egg.ing_id_2 && ingredientMap[egg.ing_id_2]) {
              required.push(ingredientMap[egg.ing_id_2]);
            }
            
            return {
              id: egg.egg_id,
              name: egg.name || "Secret Combination",
              required: required
            };
          });
          
          console.log("Formatted easter eggs:", formattedEasterEggs);
          return formattedEasterEggs;
        }
      }
    }
    
    // If we couldn't get ingredient names, return a simplified version
    const simpleEasterEggs = easterEggs.map(egg => {
      return {
        id: egg.egg_id,
        name: egg.name || "Secret Combination",
        required: [] // Empty array since we couldn't get the ingredient names
      };
    });
    
    console.log("Simplified easter eggs:", simpleEasterEggs);
    return simpleEasterEggs;
  } catch (error) {
    console.error('Error fetching easter eggs:', error);
    return [];
  }
}

// Process the database data into the format expected by the game
function processRecipeData(recipe, combinations, ingredients, easterEggs = []) {
  console.log("Processing recipe data:", { recipe, combinations, ingredients, easterEggs });
  
  // Find the final combination
  const finalCombo = combinations.find(combo => combo.is_final === true);
  console.log("Final combination:", finalCombo);
  
  if (!finalCombo) {
    console.error("No final combination found!");
    return null;
  }
  
  // Find all intermediate combinations (not final)
  const intermediateCombos = combinations.filter(combo => combo.is_final === false);
  console.log("Intermediate combinations:", intermediateCombos);
  
  // Get all base ingredients - DUPLICATE INGREDIENT FIX: Preserve instances instead of deduplicating
  // Create an array of ingredient instances, each with name and metadata
  const baseIngredientInstances = ingredients
    .filter(ing => ing.is_base === true)
    .map(ing => ({
      name: ing.name,
      ing_id: ing.ing_id,
      combo_id: ing.combo_id,
      // Add instance tracking for duplicate ingredient support
      instanceId: `${ing.name}_${ing.ing_id}`, // Unique ID for this specific instance
      validCombos: [ing.combo_id] // This instance can contribute to this combo
    }));
  
  // Also create the deduplicated list for backward compatibility
  const baseIngredients = [...new Set(baseIngredientInstances.map(inst => inst.name))];
  console.log("Base ingredient instances:", baseIngredientInstances);
  console.log("Unique base ingredient names:", baseIngredients);
  
  // BUGFIX: Validate that we have ingredient instances before proceeding
  // If no instances exist, create fallback instances to prevent empty arrays
  let finalIngredientInstances = baseIngredientInstances;
  if (baseIngredientInstances.length === 0 && baseIngredients.length > 0) {
    console.log("⚠️ No ingredient instances found, creating fallback instances");
    finalIngredientInstances = baseIngredients.map((name, index) => ({
      name: name,
      ing_id: `fallback_${index}`,
      combo_id: null,
      instanceId: `${name}_fallback_${index}`,
      validCombos: [] // Will be populated by combination logic
    }));
  }
  
  // BUGFIX: Prevent duplicate ingredient processing
  // Ensure we only use instances OR ingredients, never both
  const useInstanceSystem = finalIngredientInstances.length > 0 && 
    finalIngredientInstances.some(inst => inst.ing_id && inst.ing_id !== `fallback_${finalIngredientInstances.indexOf(inst)}`);
  
  console.log(`Using ${useInstanceSystem ? 'instance' : 'fallback'} ingredient system`);
  console.log(`Final ingredient instances count: ${finalIngredientInstances.length}`);
  console.log(`Deduplicated ingredients count: ${baseIngredients.length}`);
  
  // Create maps for easier lookups
  const comboIdToName = {};
  const comboNameToId = {};
  combinations.forEach(combo => {
    comboIdToName[combo.combo_id] = combo.name;
    comboNameToId[combo.name] = combo.combo_id;
  });
  
  // Group ingredients by combination
  const ingredientsByCombo = {};
  ingredients.forEach(ing => {
    if (!ingredientsByCombo[ing.combo_id]) {
      ingredientsByCombo[ing.combo_id] = [];
    }
    
    // Add all ingredients (both base and non-base)
    ingredientsByCombo[ing.combo_id].push({
      name: ing.name,
      isBase: ing.is_base
    });
  });
  console.log("Ingredients by combo:", ingredientsByCombo);
  
  // Format intermediate combinations
  const intermediateCombinations = intermediateCombos.map(combo => {
    // Get all ingredients for this combo
    const comboIngredients = ingredientsByCombo[combo.combo_id] || [];
    
    // Separate base ingredients and combination ingredients
    const baseIngs = comboIngredients
      .filter(ing => ing.isBase)
      .map(ing => ing.name);
      
    const comboIngs = comboIngredients
      .filter(ing => !ing.isBase)
      .map(ing => ing.name);
    
    // For display purposes, we want to show all required ingredients
    const allRequired = [...baseIngs, ...comboIngs];
    
    return {
      name: combo.name,
      required: allRequired,
      verb: combo.verb || "mix", // Include the verb from the combinations table, with a default fallback
      combo_id: combo.combo_id,
      parent_combo: combo.parent_combo // Include the parent_combo information
    };
  });
  console.log("Formatted intermediate combinations:", intermediateCombinations);
  
  // For the final combination, we need to find which combinations are directly required
  // Get all ingredients for the final combination
  const finalComboIngredients = ingredientsByCombo[finalCombo.combo_id] || [];
  
  // Separate base ingredients and combination ingredients
  const finalBaseIngs = finalComboIngredients
    .filter(ing => ing.isBase)
    .map(ing => ing.name);
    
  const finalComboIngs = finalComboIngredients
    .filter(ing => !ing.isBase)
    .map(ing => ing.name);
  
  console.log("Final combination ingredients:", {
    base: finalBaseIngs,
    combinations: finalComboIngs
  });
  
  // Find combinations that have this final combo as their parent
  const childCombos = combinations
    .filter(combo => combo.parent_combo === finalCombo.combo_id)
    .map(combo => combo.name);
  
  console.log("Child combinations of final:", childCombos);
  
  // The required combinations for the final recipe are the direct children of the final combo
  let finalRequired = childCombos.length > 0 ? childCombos : finalComboIngs;
  
  // If we still don't have any required combinations, fall back to previous methods
  if (finalRequired.length === 0) {
    // Method 1: Check if intermediate combo names are in the final base ingredients
    const requiredCombos = [];
    for (const combo of intermediateCombos) {
      if (finalBaseIngs.includes(combo.name)) {
        requiredCombos.push(combo.name);
      }
    }
    
    // Method 2: If method 1 didn't work, check if any ingredients from the final combo
    // match the names of intermediate combinations
    if (requiredCombos.length === 0) {
      // Get all intermediate combo names
      const intermediateNames = intermediateCombos.map(combo => combo.name);
      
      // Check if any of the final combo ingredients match intermediate combo names
      for (const ing of finalBaseIngs) {
        if (intermediateNames.includes(ing)) {
          requiredCombos.push(ing);
        }
      }
    }
    
    // If we found any required combos, use them
    if (requiredCombos.length > 0) {
      finalRequired = requiredCombos;
    } else {
      // Last resort: use all intermediate combinations as a fallback
      finalRequired = intermediateCombos.map(combo => combo.name);
    }
  }
  
  console.log("Final required combinations:", finalRequired);
  
  // Format final combination
  const finalCombination = {
    name: finalCombo.name,
    required: finalRequired,
    verb: finalCombo.verb || "prepare", // Include the verb from the combinations table, with a default fallback
    combo_id: finalCombo.combo_id,
    parent_combo: finalCombo.parent_combo // Include the parent_combo information
  };
  
  const result = {
    rec_id: recipe.rec_id,
    recipeName: recipe.name,
    recipeUrl: recipe.recipe_url || "https://www.example.com/recipe",
    imgUrl: recipe.img_url || null,
    day_number: recipe.day_number || "###",
    date: recipe.date || "###",
    intermediateCombinations,
    finalCombination,
    baseIngredients: [...new Set(baseIngredients)], // Keep for backward compatibility
    baseIngredientInstances: finalIngredientInstances, // BUGFIX: Use validated instances
    useInstanceSystem, // BUGFIX: Add flag to indicate which system to use
    easterEggs: easterEggs || [],
    description: recipe.description,
    author: recipe.author
  };
  
  console.log("Processed result:", result);
  return result;
}

// Fetch Recipe by Specific Date (for playtesting)
async function fetchRecipeByDate(dateString) {
  try {
    console.log(`Fetching recipe for date: ${dateString}`);
    
    // Fetch recipe for the specified date
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('date', dateString)
      .limit(1);
    
    if (error) {
      console.error("Error fetching recipe by date:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error(`No recipe found for date: ${dateString}`);
      return null;
    }
    
    const recipe = recipes[0];
    console.log("Found recipe:", recipe);
    
    // Now fetch combinations, ingredients, and easter eggs
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchRecipeByDate:", error);
    return null;
  }
}

// Function to fetch a random recipe
async function fetchRandomRecipe() {
  try {
    console.log("Fetching random recipe data...");
    
    // Get all recipes from the database
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*');
    
    if (error) {
      console.error("Error fetching recipes:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error("No recipes found in database");
      return null;
    }
    
    // Get the current recipe date in EST
    const currentDate = getCurrentDateEST();
    
    // Filter out the current recipe (the one for today)
    const filteredRecipes = recipes.filter(recipe => recipe.date !== currentDate);
    
    if (filteredRecipes.length === 0) {
      console.error("No other recipes available besides today's recipe");
      return null;
    }
    
    // Select a random recipe from the filtered list
    const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
    const recipe = filteredRecipes[randomIndex];
    
    console.log("Found random recipe:", recipe);
    
    // Get full recipe details
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchRandomRecipe:", error);
    return null;
  }
}

// Function to fetch recipe details by rec_id
async function fetchRecipeByRecId(recId) {
  try {
    console.log(`Fetching recipe for rec_id: ${recId}`);
    
    // Fetch recipe for the specified rec_id
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('rec_id', recId)
      .limit(1);
    
    if (error) {
      console.error("Error fetching recipe by rec_id:", error);
      return null;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error(`No recipe found for rec_id: ${recId}`);
      return null;
    }
    
    const recipe = recipes[0];
    console.log("Found recipe:", recipe);
    
    // Now fetch combinations, ingredients, and easter eggs
    return await fetchRecipeDetails(recipe);
  } catch (error) {
    console.error("Error in fetchRecipeByRecId:", error);
    return null;
  }
}

// =============================================================================
// GAME ANALYTICS FUNCTIONS - APlasker
// =============================================================================

// Global variables for session tracking
let currentSessionId = null;
let gameStartTime = null;
let totalMistakes = 0;
let totalHintsUsed = 0;
let totalEasterEggsFound = 0;
let gotoRecipe = false;
let gotoShare = false;

// New session management variables - APlasker
let winScreenActive = false;
let winScreenStartTime = null;
let winScreenTimer = null;
let lastInteractionTime = null;
let sessionHeartbeatTimer = null; // NEW: Periodic session saving

// Constants for session management
const WIN_SCREEN_TIMEOUT = 60000; // 1 minute in milliseconds
const SESSION_STORAGE_KEY = 'comboMealSession';
const HEARTBEAT_INTERVAL = 10000; // Save session every 10 seconds during active play

// Function to save session state to localStorage
function saveSessionState() {
  if (!currentSessionId) return;
  
  const sessionState = {
    sessionId: currentSessionId,
    startTime: gameStartTime?.getTime(),
    mistakes: totalMistakes,
    hints: totalHintsUsed,
    easterEggs: totalEasterEggsFound,
    recipe: gotoRecipe,
    share: gotoShare,
    winScreenActive,
    winScreenStartTime: winScreenStartTime?.getTime(),
    lastInteraction: lastInteractionTime?.getTime(),
    lastSaved: Date.now() // NEW: Track when we last saved
  };
  
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    console.log('Session state saved to localStorage');
  } catch (error) {
    console.error("Error saving session state:", error);
  }
}

// Function to restore session state from localStorage
function restoreSessionState() {
  try {
    const savedState = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedState) return false;
    
    const state = JSON.parse(savedState);
    
    // Check if the saved session is recent (within last 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const sessionAge = Date.now() - (state.lastSaved || 0);
    
    if (sessionAge > maxAge) {
      console.log('Saved session too old, clearing');
      clearSessionState();
      return false;
    }
    
    // CRITICAL FIX: Check if stored session ID is valid UUID format - APlasker
    const sessionId = state.sessionId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!sessionId || !uuidRegex.test(sessionId)) {
      console.log('Stored session has invalid UUID format, clearing:', sessionId);
      clearSessionState();
      return false;
    }
    
    currentSessionId = state.sessionId;
    gameStartTime = state.startTime ? new Date(state.startTime) : null;
    totalMistakes = state.mistakes || 0;
    totalHintsUsed = state.hints || 0;
    totalEasterEggsFound = state.easterEggs || 0;
    gotoRecipe = state.recipe || false;
    gotoShare = state.share || false;
    winScreenActive = state.winScreenActive || false;
    winScreenStartTime = state.winScreenStartTime ? new Date(state.winScreenStartTime) : null;
    lastInteractionTime = state.lastInteraction ? new Date(state.lastInteraction) : null;
    
    console.log('Session state restored from localStorage:', {
      sessionId: currentSessionId,
      age: Math.round(sessionAge / 1000) + 's'
    });
    
    return true;
  } catch (error) {
    console.error("Error restoring session state:", error);
    clearSessionState();
    return false;
  }
}

// Function to clear session state from localStorage
function clearSessionState() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('Session state cleared from localStorage');
  } catch (error) {
    console.error("Error clearing session state:", error);
  }
}

// NEW: Start periodic session saving during active gameplay
function startSessionHeartbeat() {
  if (sessionHeartbeatTimer) {
    clearInterval(sessionHeartbeatTimer);
  }
  
  sessionHeartbeatTimer = setInterval(() => {
    if (currentSessionId && !winScreenActive) {
      saveSessionState();
      
      // Also update the session in the database periodically
      updateSessionInDatabase();
    }
  }, HEARTBEAT_INTERVAL);
  
  console.log('Session heartbeat started');
}

// NEW: Stop periodic session saving
function stopSessionHeartbeat() {
  if (sessionHeartbeatTimer) {
    clearInterval(sessionHeartbeatTimer);
    sessionHeartbeatTimer = null;
    console.log('Session heartbeat stopped');
  }
}

// NEW: Update session data in database without completing it
async function updateSessionInDatabase() {
  if (!currentSessionId) return;
  
  try {
    const currentTime = new Date().toISOString();
    const totalTimeSeconds = gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0;
    
    const { error } = await supabase
      .from('game_sessions')
      .update({
        updated_at: currentTime, // RESTORED: Column now exists in schema - APlasker
        total_time_seconds: totalTimeSeconds,
        mistakes_total: totalMistakes,
        hints_used: totalHintsUsed,
        easter_eggs_found: totalEasterEggsFound,
        goto_recipe: gotoRecipe,
        goto_share: gotoShare
      })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error('Error updating session in database:', error);
    }
  } catch (error) {
    console.error('Error in updateSessionInDatabase:', error);
  }
}

// Function to handle win screen timeout
function handleWinScreenTimeout() {
  if (!winScreenActive || !currentSessionId) return;
  
  const now = Date.now();
  const timeSinceLastInteraction = now - (lastInteractionTime?.getTime() || winScreenStartTime?.getTime() || now);
  
  if (timeSinceLastInteraction >= WIN_SCREEN_TIMEOUT) {
    // Session is already completed when win screen is shown, just log the timeout
    console.log("Win screen timed out after inactivity - session already completed");
    // Clear session data since user is inactive
    clearSessionState();
    stopSessionHeartbeat();
  }
}

// Function to reset win screen timer
function resetWinScreenTimer() {
  if (winScreenTimer) {
    clearTimeout(winScreenTimer);
  }
  
  lastInteractionTime = new Date();
  saveSessionState();
  
  winScreenTimer = setTimeout(handleWinScreenTimeout, WIN_SCREEN_TIMEOUT);
}

// Function to start win screen tracking
function startWinScreenTracking() {
  winScreenActive = true;
  winScreenStartTime = new Date();
  lastInteractionTime = winScreenStartTime;
  stopSessionHeartbeat(); // Stop heartbeat when game is completed
  saveSessionState();
  resetWinScreenTimer();
}

// Function to handle visibility change
function handleVisibilityChange() {
  if (document.hidden && currentSessionId) {
    if (winScreenActive) {
      // If they've reached the win screen, session is already completed - don't duplicate
      console.log("User left page during win screen - session already completed");
    } else {
      // Only mark as abandoned if they haven't reached the win screen
      completeGameSession('abandoned_during_game');
    }
  }
}

// Add visibility change listener
document.addEventListener('visibilitychange', handleVisibilityChange);

// Generate a unique session ID for analytics tracking - APlasker
function generateSessionId() {
  // Generate a proper UUID v4 for session_id (database expects UUID format)
  
  // Check if crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const sessionId = crypto.randomUUID();
    console.log('Generated UUID session ID:', sessionId);
    return sessionId;
  }
  
  // Fallback: Generate UUID v4 manually
  const sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  
  console.log('Generated fallback UUID session ID:', sessionId);
  return sessionId;
}

// Detect device type for analytics - APlasker
function detectDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  
  // Check for mobile devices
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  // Check for tablets
  if (/ipad|android(?!.*mobile)|tablet/i.test(userAgent) || screenWidth >= 768) {
    return 'tablet';
  }
  
  // Default to desktop
  return 'desktop';
}

// Generate device fingerprint for anonymous users - APlasker
async function getDeviceFingerprint() {
  // Create a device fingerprint for anonymous users
  const screenInfo = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userAgent = navigator.userAgent.substring(0, 50); // First 50 chars
  const language = navigator.language || 'en-US';
  const platform = navigator.platform || 'unknown';
  
  // Combine unique device characteristics
  const combined = `${screenInfo}-${timezone}-${userAgent}-${language}-${platform}`;
  
  // Simple hash function to create a unique ID
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const fingerprint = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  console.log('Generated device fingerprint:', fingerprint.substring(0, 20) + '...');
  return fingerprint;
}

// Generate a simple user identifier (hash of IP-like data)
// DEPRECATED: Now using Supabase Auth user IDs instead
function generateUserIdentifier() {
  // Fallback for when auth is not available
  const screenInfo = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userAgent = navigator.userAgent.substring(0, 50); // First 50 chars
  const combined = `${screenInfo}-${timezone}-${userAgent}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'fallback_' + Math.abs(hash).toString(36);
}

// Get current user ID from Supabase Auth
function getCurrentUserId() {
  // Try to get from auth state first
  if (window.authState?.user?.id) {
    return window.authState.user.id;
  }
  
  // Try to get from Supabase session
  const session = supabase.auth.getSession();
  if (session?.data?.session?.user?.id) {
    return session.data.session.user.id;
  }
  
  // Fallback to device fingerprinting
  console.warn('No authenticated user found, using fallback identifier');
  return generateUserIdentifier();
}

// Start a new game session
async function startGameSession(recipeId) {
  try {
    // Check if we already have an active session
    if (currentSessionId) {
      console.log("Session already active:", currentSessionId);
      return currentSessionId;
    }
    
    // Try to restore from localStorage first
    const restored = restoreSessionState();
    if (restored && currentSessionId) {
      console.log("Restored existing session:", currentSessionId);
      startSessionHeartbeat(); // Start heartbeat for restored session
      return currentSessionId;
    }
    
    // Get user ID with fallback
    let userId = null;
    if (window.authState?.isAuthenticated && window.authState?.user?.id) {
      userId = window.authState.user.id;
    } else {
      // Fallback to device fingerprinting for anonymous users
      userId = await getDeviceFingerprint();
    }
    
    if (!userId) {
      console.error("Could not determine user ID for session");
      return null;
    }
    
    const sessionData = {
      session_id: generateSessionId(),
      user_id: userId,
      rec_id: recipeId,
      started_at: new Date().toISOString(),
      play_url: window.location.href,
      user_agent: navigator.userAgent, // RESTORED: Column now exists in schema - APlasker
      screen_resolution: `${screen.width}x${screen.height}`,
      // device_type: detectDeviceType(), // REMOVED: Column doesn't exist in schema - APlasker
      is_tutorial: typeof isTutorialMode !== 'undefined' ? isTutorialMode : false
    };
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([sessionData])
      .select()
      .single();
      
    if (error) {
      console.error("Error starting game session:", error);
      return null;
    }
    
    // Store session info globally
    currentSessionId = sessionData.session_id;
    gameStartTime = new Date();
    totalMistakes = 0;
    totalHintsUsed = 0;
    totalEasterEggsFound = 0;
    gotoRecipe = false;
    gotoShare = false;
    winScreenActive = false;
    winScreenStartTime = null;
    lastInteractionTime = null;
    
    // Save initial state and start heartbeat
    saveSessionState();
    startSessionHeartbeat();
    
    console.log("✅ Game session started:", currentSessionId);
    return currentSessionId;
    
  } catch (error) {
    console.error("Error in startGameSession:", error);
    return null;
  }
}

// Track a mistake/failed combination attempt
async function trackMistake() {
  if (!currentSessionId) {
    console.warn("❌ No active session to track mistake");
    console.warn("🔍 Debug info:", {
      currentSessionId: currentSessionId,
      gameStartTime: gameStartTime,
      functionsAvailable: {
        startGameSession: typeof startGameSession,
        supabase: typeof supabase
      }
    });
    console.warn("💡 Try running: debugAnalytics() to diagnose the issue");
    return;
  }
  
  try {
    const newMistakeTotal = totalMistakes + 1;
    console.log("📊 Tracking mistake, new total would be:", newMistakeTotal);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ mistakes_total: newMistakeTotal })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking mistake:", error);
      console.error("Error details:", error.details, error.hint, error.message);
      // Don't increment local counter if database update failed
    } else {
      // Only increment local counter after successful database update
      totalMistakes = newMistakeTotal;
      console.log("✅ Mistake tracked successfully, total mistakes:", totalMistakes);
    }
  } catch (error) {
    console.error("Error in trackMistake:", error);
    // Don't increment local counter if there was an exception
  }
}

// Track hint usage
async function trackHintUsed() {
  if (!currentSessionId) {
    console.warn("❌ No active session to track hint");
    console.warn("🔍 Debug info:", {
      currentSessionId: currentSessionId,
      gameStartTime: gameStartTime
    });
    console.warn("💡 Try running: debugAnalytics() to diagnose the issue");
    return;
  }
  
  try {
    const newHintTotal = totalHintsUsed + 1;
    console.log("📊 Tracking hint used, new total would be:", newHintTotal);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ hints_used: newHintTotal })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking hint:", error);
      console.error("Error details:", error.details, error.hint, error.message);
      // Don't increment local counter if database update failed
    } else {
      // Only increment local counter after successful database update
      totalHintsUsed = newHintTotal;
      console.log("✅ Hint tracked successfully, total hints:", totalHintsUsed);
    }
  } catch (error) {
    console.error("Error in trackHintUsed:", error);
    // Don't increment local counter if there was an exception
  }
}

// Track Easter egg discovery
async function trackEasterEggFound() {
  if (!currentSessionId) {
    console.warn("No active session to track Easter egg");
    return;
  }
  
  try {
    totalEasterEggsFound++;
    console.log("Tracking Easter egg found, total found:", totalEasterEggsFound);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ easter_eggs_found: totalEasterEggsFound })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking Easter egg:", error);
      console.error("Error details:", error.details, error.hint, error.message);
    }
  } catch (error) {
    console.error("Error in trackEasterEggFound:", error);
  }
}

// Track recipe CTA click
async function trackRecipeClick() {
  if (!currentSessionId) {
    console.warn("No active session to track recipe click");
    
    // MAGIC LINK FIX: Try to create a session for completed games if user is authenticated
    if (window.authState?.isAuthenticated && !window.authState?.isAnonymous && 
        typeof gameWon !== 'undefined' && gameWon) {
      console.log("🔗 Magic link user on win screen - attempting to create retroactive session");
      
      // Get recipe ID for session creation
      let recipeId = null;
      if (typeof recipe_data !== 'undefined' && recipe_data?.rec_id) {
        recipeId = recipe_data.rec_id;
      } else if (typeof final_combination !== 'undefined' && final_combination?.rec_id) {
        recipeId = final_combination.rec_id;
      }
      
      if (recipeId && typeof startGameSession === 'function') {
        try {
          const sessionId = await startGameSession(recipeId);
          if (sessionId) {
            console.log("✅ Retroactive session created for magic link user:", sessionId);
            // Now track the recipe click
            await trackRecipeClick();
            return;
          }
        } catch (error) {
          console.error("Failed to create retroactive session:", error);
        }
      }
    }
    
    return;
  }
  
  try {
    gotoRecipe = true;
    console.log("Tracking recipe click");
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ goto_recipe: true })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking recipe click:", error);
      console.error("Error details:", error.details, error.hint, error.message);
    }
  } catch (error) {
    console.error("Error in trackRecipeClick:", error);
  }
}

// Track share CTA click
async function trackShareClick() {
  if (!currentSessionId) {
    console.warn("No active session to track share click");
    
    // MAGIC LINK FIX: Try to create a session for completed games if user is authenticated
    if (window.authState?.isAuthenticated && !window.authState?.isAnonymous && 
        typeof gameWon !== 'undefined' && gameWon) {
      console.log("🔗 Magic link user on win screen - attempting to create retroactive session");
      
      // Get recipe ID for session creation
      let recipeId = null;
      if (typeof recipe_data !== 'undefined' && recipe_data?.rec_id) {
        recipeId = recipe_data.rec_id;
      } else if (typeof final_combination !== 'undefined' && final_combination?.rec_id) {
        recipeId = final_combination.rec_id;
      }
      
      if (recipeId && typeof startGameSession === 'function') {
        try {
          const sessionId = await startGameSession(recipeId);
          if (sessionId) {
            console.log("✅ Retroactive session created for magic link user:", sessionId);
            // Now track the share click
            await trackShareClick();
            return;
          }
        } catch (error) {
          console.error("Failed to create retroactive session:", error);
        }
      }
    }
    
    return;
  }
  
  try {
    gotoShare = true;
    console.log("Tracking share click");
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ goto_share: true })
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error tracking share click:", error);
      console.error("Error details:", error.details, error.hint, error.message);
    }
  } catch (error) {
    console.error("Error in trackShareClick:", error);
  }
}

// Complete the current game session
async function completeGameSession(winCondition) {
  try {
    if (!currentSessionId) {
      console.log("No active session to complete");
      return;
    }
    
    // Stop the heartbeat immediately
    stopSessionHeartbeat();
    
    console.log(`Completing game session ${currentSessionId} with condition: ${winCondition}`);
    
    const currentTime = new Date().toISOString();
    const totalTimeSeconds = gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0;
    
    // Calculate star score if game was completed
    let starScore = null;
    if (winCondition === 'completed') {
      starScore = calculateStarScore(totalMistakes, totalHintsUsed, totalTimeSeconds);
      console.log(`Calculated star score: ${starScore} (${totalMistakes} mistakes, ${totalHintsUsed} hints, ${totalTimeSeconds}s)`);
    }
    
    const updateData = {
      completed_at: currentTime,
      total_time_seconds: totalTimeSeconds,
      mistakes_total: totalMistakes,
      hints_used: totalHintsUsed,
      easter_eggs_found: totalEasterEggsFound,
      goto_recipe: gotoRecipe,
      goto_share: gotoShare,
      win_condition: winCondition,
      star_score: starScore
    };
    
    const { error } = await supabase
      .from('game_sessions')
      .update(updateData)
      .eq('session_id', currentSessionId);
      
    if (error) {
      console.error("Error completing game session:", error);
      console.error("Error details:", error.details, error.hint, error.message);
    } else {
      console.log("✅ Game session completed successfully");
      
      // Update user profile stats if user is authenticated with email
      if (window.authState?.isAuthenticated && !window.authState?.isAnonymous) {
        try {
          console.log("Updating user profile stats...");
          const gameStats = {
            won: winCondition === 'completed',
            hints: totalHintsUsed,
            timeSeconds: totalTimeSeconds,
            mistakes: totalMistakes,
            easterEggs: totalEasterEggsFound,
            starScore: starScore // Pass star score to profile stats
          };
          
          if (typeof updateProfileStats === 'function') {
            const updatedProfile = await updateProfileStats(window.authState.user.id, gameStats);
            if (updatedProfile) {
              console.log("Profile stats updated successfully");
            }
          } else {
            console.warn('updateProfileStats function not available');
          }
        } catch (profileError) {
          console.error("Error updating profile stats:", profileError);
          // Don't fail session completion if profile update fails
        }
      }
      
      // Clear all session data
      currentSessionId = null;
      gameStartTime = null;
      totalMistakes = 0;
      totalHintsUsed = 0;
      totalEasterEggsFound = 0;
      gotoRecipe = false;
      gotoShare = false;
      winScreenActive = false;
      winScreenStartTime = null;
      lastInteractionTime = null;
      
      if (winScreenTimer) {
        clearTimeout(winScreenTimer);
        winScreenTimer = null;
      }
      
      clearSessionState();
    }
  } catch (error) {
    console.error("Error in completeGameSession:", error);
  }
}

// Get current session stats (for debugging or display)
function getCurrentSessionStats() {
  return {
    sessionId: currentSessionId,
    startTime: gameStartTime,
    mistakes: totalMistakes,
    hints: totalHintsUsed,
    easterEggs: totalEasterEggsFound,
    gotoRecipe: gotoRecipe,
    gotoShare: gotoShare,
    timeElapsed: gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0
  };
}

// APlasker - Debug function to test analytics connectivity
async function debugAnalytics() {
  console.log("=== ANALYTICS DEBUG REPORT ===");
  console.log("Current session ID:", currentSessionId);
  console.log("Supabase URL:", SUPABASE_URL);
  console.log("Supabase Key (first 10 chars):", SUPABASE_KEY ? SUPABASE_KEY.substring(0, 10) + "..." : "NOT SET");
  
  // Test basic Supabase connection
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_id')
      .limit(1);
      
    if (error) {
      console.error("❌ Supabase connection test failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
    } else {
      console.log("✅ Supabase connection test successful");
      console.log("Sample data:", data);
    }
  } catch (error) {
    console.error("❌ Supabase connection error:", error);
  }
  
  // Test insertion capability
  try {
    console.log("Testing analytics insertion...");
    const testData = {
      session_id: generateSessionId(), // Add session_id for test
      rec_id: 999, // Test recipe ID
      user_id: 'test_user_' + Date.now(),
      started_at: new Date().toISOString(),
      user_agent: 'Test User Agent', // Add user_agent for test
      play_url: 'https://test.example.com',
      screen_resolution: '1920x1080',
      is_tutorial: false,
      mistakes_total: 0,
      hints_used: 0,
      easter_eggs_found: 0,
      goto_recipe: false,
      goto_share: false
    };
    
    console.log("Test data:", testData);
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([testData])
      .select()
      .single();
      
    if (error) {
      console.error("❌ Analytics insertion test failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
    } else {
      console.log("✅ Analytics insertion test successful");
      console.log("Inserted data:", data);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('session_id', data.session_id);
        
      if (deleteError) {
        console.warn("⚠️ Could not clean up test data:", deleteError);
      } else {
        console.log("✅ Test data cleaned up successfully");
      }
    }
  } catch (error) {
    console.error("❌ Analytics insertion error:", error);
  }
  
  console.log("=== END DEBUG REPORT ===");
}

// APlasker - Track page unload to detect game abandonment
window.addEventListener('beforeunload', function() {
  // Only track abandonment if there's an active session and game hasn't been won
  if (currentSessionId && typeof gameWon !== 'undefined' && !gameWon) {
    console.log("Tracking game abandonment on page unload");
    // Use sendBeacon for reliable delivery during page unload
    const abandonmentData = {
      completed_at: new Date().toISOString(),
      total_time_seconds: gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0,
      mistakes_total: totalMistakes,
      hints_used: totalHintsUsed,
      easter_eggs_found: totalEasterEggsFound,
      goto_recipe: gotoRecipe,
      goto_share: gotoShare,
      win_condition: 'abandoned'
    };
    
    // Try to send abandonment data using fetch with keepalive
    try {
      fetch(`${SUPABASE_URL}/rest/v1/game_sessions?session_id=eq.${currentSessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(abandonmentData),
        keepalive: true // This helps ensure the request completes even if the page is closing
      });
    } catch (error) {
      console.error("Error tracking abandonment:", error);
    }
  }
});

// =============================================================================
// USER PROFILE MANAGEMENT FUNCTIONS - APlasker
// Updated to use game_sessions data as source of truth
// =============================================================================

// Get enhanced user profile stats using new streak system
async function getUserProfileStats(userId) {
  try {
    console.log('Fetching enhanced profile stats for user:', userId);
    
    // Get enhanced streak data
    const { data: streakData, error: streakError } = await supabase.rpc('calculate_user_streaks_v3', {
      target_user_id: userId
    });
    
    if (streakError) {
      console.error('Error fetching enhanced streak stats:', streakError);
      // Fall back to basic stats if enhanced streaks fail
    }
    
    // Get basic profile stats (for games/score data)
    const { data: profileData, error: profileError } = await supabase.rpc('get_user_profile_stats', {
      target_user_id: userId
    });
    
    if (profileError) {
      console.error('Error fetching basic profile stats:', profileError);
      console.error('Error details:', profileError.message, profileError.hint, profileError.details);
      return null;
    }
    
    console.log('Raw profile stats response:', profileData);
    console.log('Raw enhanced streak response:', streakData);
    
    // Combine the data
    const basicStats = Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : profileData || {};
    const enhancedStreaks = Array.isArray(streakData) && streakData.length > 0 ? streakData[0] : streakData || {};
    
    const result = {
      // Use recipe streaks for main display (day_number sequence)
      current_streak: enhancedStreaks.current_recipe_streak || 0,
      longest_streak: enhancedStreaks.longest_recipe_streak || 0,
      
      // Enhanced streak data (all 8 types available)
      enhanced_streaks: {
        current_recipe_streak: enhancedStreaks.current_recipe_streak || 0,
        longest_recipe_streak: enhancedStreaks.longest_recipe_streak || 0,
        current_calendar_streak: enhancedStreaks.current_calendar_streak || 0,
        longest_calendar_streak: enhancedStreaks.longest_calendar_streak || 0,
        current_quality_streak: enhancedStreaks.current_quality_streak || 0,
        longest_quality_streak: enhancedStreaks.longest_quality_streak || 0,
        current_perfect_streak: enhancedStreaks.current_perfect_streak || 0,
        longest_perfect_streak: enhancedStreaks.longest_perfect_streak || 0
      },
      
      // Basic stats (preserve existing field names)
      total_games_played: basicStats.total_games_played || 0,
      total_wins: basicStats.total_wins || 0,
      average_star_score: basicStats.average_star_score || 0,
      total_games: basicStats.total_games || basicStats.total_games_played || 0, // Alias for compatibility
      
      // Legacy streak fields (fallback to basic stats if enhanced not available)
      current_streak_legacy: basicStats.current_streak || 0,
      longest_streak_legacy: basicStats.longest_streak || 0
    };
    
    console.log('Enhanced profile stats processed:', result);
    return result;
    
  } catch (error) {
    console.error('Error in getUserProfileStats:', error);
    return null;
  }
}

// Get user's recipe completion history
async function getUserCompletions(userId, limit = 50) {
  try {
    console.log('Fetching user completions for user:', userId);
    
    const { data, error } = await supabase.rpc('get_user_completions', {
      target_user_id: userId,
      limit_count: limit
    });
    
    if (error) {
      console.error('Error fetching user completions:', error);
      return null;
    }
    
    console.log('User completions:', data);
    return data;
    
  } catch (error) {
    console.error('Error in getUserCompletions:', error);
    return null;
  }
}

// Get all unique recipes user has completed (for recipe box)
async function getUserUniqueRecipes(userId, offset = 0, limit = 20) {
  try {
    console.log(`Fetching unique recipes for user: ${userId}, offset: ${offset}, limit: ${limit}`);
    
    // Get all completed sessions for this user (only games that were completed successfully)
    // Exclude tutorial recipe by joining with recipes table and filtering out 2001-01-01
    const { data: allCompletions, error: allError } = await supabase
      .from('game_sessions')
      .select(`
        rec_id,
        completed_at,
        star_score,
        hints_used,
        total_time_seconds,
        mistakes_total,
        easter_eggs_found,
        recipes!inner(date)
      `)
      .eq('user_id', userId)
      .eq('win_condition', 'completed') // Only get successfully completed games
      .not('completed_at', 'is', null) // Ensure completed_at is not null
      .neq('recipes.date', '2001-01-01') // Exclude tutorial recipe (01/01/2001)
      .order('completed_at', { ascending: true }); // Order by completion time
    
    if (allError) {
      console.error('Error fetching all completions:', allError);
      return null;
    }
    
    if (!allCompletions || allCompletions.length === 0) {
      return [];
    }
    
    // Deduplicate by rec_id, keeping the first completion for each recipe
    const uniqueRecipesMap = new Map();
    const mostRecentCompletionMap = new Map();
    
    for (const completion of allCompletions) {
      // Keep track of first completion for each recipe (earliest completed_at)
      if (!uniqueRecipesMap.has(completion.rec_id)) {
        uniqueRecipesMap.set(completion.rec_id, {
          ...completion,
          // Map fields to match expected format
          egg_found: completion.easter_eggs_found > 0
        });
      }
      
      // Also track most recent completion date for sorting
      if (!mostRecentCompletionMap.has(completion.rec_id) || 
          new Date(completion.completed_at) > new Date(mostRecentCompletionMap.get(completion.rec_id))) {
        mostRecentCompletionMap.set(completion.rec_id, completion.completed_at);
      }
    }
    
    // Convert to array and add most recent completion date for sorting
    const uniqueRecipes = Array.from(uniqueRecipesMap.values()).map(recipe => ({
      ...recipe,
      most_recent_completion: mostRecentCompletionMap.get(recipe.rec_id)
    }));
    
    // Sort by most recent completion first
    uniqueRecipes.sort((a, b) => new Date(b.most_recent_completion) - new Date(a.most_recent_completion));
    
    // Apply pagination
    const paginatedRecipes = uniqueRecipes.slice(offset, offset + limit);
    
    console.log(`Found ${paginatedRecipes.length} unique recipes for user (offset: ${offset}, total unique: ${uniqueRecipes.length})`);
    return paginatedRecipes;
    
  } catch (error) {
    console.error('Error in getUserUniqueRecipes:', error);
    return null;
  }
}

// Get count of unique recipes user has completed
async function getUserUniqueRecipeCount(userId) {
  try {
    console.log('Fetching unique recipe count for user:', userId);
    
    // Count distinct rec_ids for this user from completed sessions only
    // Exclude tutorial recipe by joining with recipes table and filtering out 2001-01-01
    const { data, error } = await supabase
      .from('game_sessions')
      .select('rec_id, recipes!inner(date)')
      .eq('user_id', userId)
      .eq('win_condition', 'completed') // Only count successfully completed games
      .not('completed_at', 'is', null) // Ensure completed_at is not null
      .neq('recipes.date', '2001-01-01'); // Exclude tutorial recipe (01/01/2001)
    
    if (error) {
      console.error('Error fetching unique recipe count:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    // Count unique rec_ids
    const uniqueRecipeIds = new Set(data.map(completion => completion.rec_id));
    const count = uniqueRecipeIds.size;
    
    console.log(`User has completed ${count} unique recipes`);
    return count;
    
  } catch (error) {
    console.error('Error in getUserUniqueRecipeCount:', error);
    return 0;
  }
}

// Load more unique recipes for lazy loading (profile screen)
async function loadMoreUniqueRecipes(userId, offset = 0, limit = 20) {
  try {
    console.log(`Loading more unique recipes for user: ${userId}, offset: ${offset}, limit: ${limit}`);
    
    const moreRecipes = await getUserUniqueRecipes(userId, offset, limit);
    
    if (!moreRecipes) {
      return [];
    }
    
    console.log(`Loaded ${moreRecipes.length} more unique recipes`);
    return moreRecipes;
    
  } catch (error) {
    console.error('Error in loadMoreUniqueRecipes:', error);
    return [];
  }
}

// Create or update user profile when user authenticates with email
async function createOrUpdateProfile(user) {
  try {
    console.log('Creating/updating profile for user:', user.id);
    
    // Get live stats from game_sessions
    const liveStats = await getUserProfileStats(user.id);
    
    const profileData = {
      id: user.id, // Use auth user ID as primary key
      email: user.email,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Use live stats if available, otherwise defaults
      total_games_played: liveStats?.total_games_played || 0,
      total_wins: liveStats?.total_wins || 0,
      current_streak: liveStats?.current_streak || 0,
      longest_streak: liveStats?.longest_streak || 0,
      total_hints_used: liveStats?.total_hints_used || 0,
      total_time_played: liveStats?.total_time_played || 0,
      // favorite_recipes: [], // REMOVED: Column is int4, not jsonb array - APlasker
      settings: {
        notifications_enabled: true,
        preferred_difficulty: 'medium'
      }
    };
    
    // Use upsert to create or update
    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating/updating profile:', error);
      return null;
    }
    
    console.log('Profile created/updated successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
    return null;
  }
}

// Get user profile data (enhanced with live stats and unique recipes)
async function getUserProfile(userId) {
  try {
    // Get profile data, live stats, and unique recipe count
    const [profileResult, liveStats, uniqueRecipeCount, uniqueRecipes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      getUserProfileStats(userId),
      getUserUniqueRecipeCount(userId),
      getUserUniqueRecipes(userId, 0, 20) // Get first 20 unique recipes for recipe box
    ]);
    
    if (profileResult.error) {
      console.error('Error fetching user profile:', profileResult.error);
      return null;
    }
    
    // Merge profile data with live stats
    const profile = profileResult.data || {};
    
    // If we have live stats, use them instead of stored profile stats
    if (liveStats) {
      profile.total_games_played = liveStats.total_games_played;
      profile.total_wins = liveStats.total_wins;
      profile.current_streak = liveStats.current_streak;
      profile.longest_streak = liveStats.longest_streak;
      profile.total_hints_used = liveStats.total_hints_used;
      profile.total_time_played = liveStats.total_time_played;
      profile.total_easter_eggs = liveStats.total_easter_eggs;
      profile.average_star_score = liveStats.average_star_score;
      profile.perfect_games = liveStats.perfect_games;
    }
    
    // Override total_games_played with unique recipe count for "Recipes Made" stat
    profile.recipes_made = uniqueRecipeCount;
    
    // Add unique recipes for recipe box (these are first completions, sorted by most recent)
    profile.unique_recipes = uniqueRecipes || [];
    
    return profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

// DEPRECATED: Update profile stats after game completion
// This function is now deprecated because we calculate stats live from game_sessions
// Keeping it for backwards compatibility but it now just triggers a profile refresh
async function updateProfileStats(userId, gameStats) {
  try {
    console.log('updateProfileStats called (now deprecated) - using live calculation instead');
    
    // Just update the profile's updated_at timestamp to show activity
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating profile timestamp:', error);
      return null;
    }
    
    // Get the live profile data to return
    const liveProfile = await getUserProfile(userId);
    console.log('Profile refreshed with live stats:', liveProfile);
    return liveProfile;
    
  } catch (error) {
    console.error('Error in updateProfileStats:', error);
    return null;
  }
}

// Backfill profile stats from existing game_sessions (admin function)
async function backfillAllProfileStats() {
  try {
    console.log('Backfilling all profile stats from game_sessions...');
    
    const { data, error } = await supabase.rpc('backfill_profile_stats');
    
    if (error) {
      console.error('Error backfilling profile stats:', error);
      return null;
    }
    
    console.log('Backfilled profiles for', data, 'users');
    return data;
    
  } catch (error) {
    console.error('Error in backfillAllProfileStats:', error);
    return null;
  }
}

// Add favorite recipe - DISABLED: favorite_recipes is int4, not jsonb array - APlasker
async function addFavoriteRecipe(userId, recipeId) {
  console.warn('addFavoriteRecipe disabled: favorite_recipes column is int4, not jsonb array');
  return null;
  
  // ORIGINAL CODE COMMENTED OUT DUE TO SCHEMA MISMATCH:
  // try {
  //   const currentProfile = await getUserProfile(userId);
  //   if (!currentProfile) return null;
  //   
  //   const favorites = currentProfile.favorite_recipes || [];
  //   if (!favorites.includes(recipeId)) {
  //     favorites.push(recipeId);
  //     
  //     const { data, error } = await supabase
  //       .from('profiles')
  //       .update({ 
  //         favorite_recipes: favorites,
  //         updated_at: new Date().toISOString()
  //       })
  //       .eq('id', userId)
  //       .select()
  //       .single();
  //       
  //     if (error) {
  //       console.error('Error adding favorite recipe:', error);
  //       return null;
  //     }
  //     
  //     return data;
  //   }
  //   
  //   return currentProfile; // Recipe already favorited
  // } catch (error) {
  //   console.error('Error in addFavoriteRecipe:', error);
  //   return null;
  // }
}

// Get recipe names by their IDs for completion display
async function getRecipeNames(recipeIds) {
  try {
    if (!recipeIds || recipeIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('recipes')
      .select('rec_id, name, day_number, author, date')
      .in('rec_id', recipeIds);
    
    if (error) {
      console.error('Error fetching recipe names:', error);
      return {};
    }
    
    // Create a map of rec_id to recipe info
    const recipeMap = {};
    data.forEach(recipe => {
      recipeMap[recipe.rec_id] = {
        name: recipe.name,
        day_number: recipe.day_number,
        author: recipe.author,
        date: recipe.date
      };
    });
    
    return recipeMap;
  } catch (error) {
    console.error('Error in getRecipeNames:', error);
    return {};
  }
}

// Get recipe images by their IDs for completion display
async function getRecipeImages(recipeIds) {
  try {
    if (!recipeIds || recipeIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('recipes')
      .select('rec_id, img_url')
      .in('rec_id', recipeIds);
    
    if (error) {
      console.error('Error fetching recipe image URLs:', error);
      return {};
    }
    
    // Create a map of rec_id to image info with loading promises
    const imageMap = {};
    
    // Load all images in parallel
    const imageLoadPromises = data.map(recipe => {
      return new Promise((resolve) => {
        if (!recipe.img_url) {
          // No image URL - store as no image available
          imageMap[recipe.rec_id] = {
            url: null,
            loadedImage: null,
            loading: false,
            error: false
          };
          resolve();
          return;
        }
        
        // Initialize image info
        imageMap[recipe.rec_id] = {
          url: recipe.img_url,
          loadedImage: null,
          loading: true,
          error: false
        };
        
        // Use p5.js loadImage with callbacks
        const img = loadImage(
          recipe.img_url,
          // Success callback
          (loadedImg) => {
            console.log(`Recipe image loaded successfully for ${recipe.rec_id}`);
            imageMap[recipe.rec_id].loadedImage = loadedImg;
            imageMap[recipe.rec_id].loading = false;
            resolve();
          },
          // Error callback
          (err) => {
            console.error(`Error loading recipe image for ${recipe.rec_id}:`, err);
            imageMap[recipe.rec_id].error = true;
            imageMap[recipe.rec_id].loading = false;
            resolve(); // Still resolve to not block other images
          }
        );
      });
    });
    
    // Wait for all images to finish loading (or fail)
    await Promise.all(imageLoadPromises);
    
    console.log('All recipe images processed:', Object.keys(imageMap).length, 'recipes');
    return imageMap;
    
  } catch (error) {
    console.error('Error in getRecipeImages:', error);
    return {};
  }
}

// NEW: Check if we have a stable connection to Supabase
async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_id')
      .limit(1);
      
    return !error;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}

// NEW: Retry failed operations with exponential backoff
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      console.error(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait longer between each retry
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Enhanced session completion with retry logic
async function completeGameSessionWithRetry(winCondition) {
  try {
    // Check connection first
    const hasConnection = await checkConnection();
    if (!hasConnection) {
      console.warn('No connection to database, will retry completion later');
      // Save completion data to localStorage for later retry
      const completionData = {
        sessionId: currentSessionId,
        winCondition,
        completedAt: new Date().toISOString(),
        totalTimeSeconds: gameStartTime ? Math.floor((new Date() - gameStartTime) / 1000) : 0,
        mistakes: totalMistakes,
        hints: totalHintsUsed,
        easterEggs: totalEasterEggsFound,
        gotoRecipe,
        gotoShare
      };
      
      try {
        localStorage.setItem('pendingCompletion', JSON.stringify(completionData));
        console.log('Completion data saved for later retry');
      } catch (storageError) {
        console.error('Failed to save completion data to localStorage:', storageError);
      }
      
      return;
    }
    
    // Try to complete the session with retry logic
    await retryOperation(() => completeGameSession(winCondition));
    
    // Clear any pending completion data on success
    try {
      localStorage.removeItem('pendingCompletion');
    } catch (error) {
      console.error('Error clearing pending completion:', error);
    }
    
  } catch (error) {
    console.error('Failed to complete session after retries:', error);
    // Keep the completion data in localStorage for next app load
  }
}

// NEW: Check for and retry any pending completions on app start
async function retryPendingCompletions() {
  try {
    const pendingData = localStorage.getItem('pendingCompletion');
    if (!pendingData) return;
    
    const completion = JSON.parse(pendingData);
    console.log('Found pending completion, attempting to retry:', completion.sessionId);
    
    // Check if we have connection now
    const hasConnection = await checkConnection();
    if (!hasConnection) {
      console.log('Still no connection, will retry later');
      return;
    }
    
    // Try to complete the pending session
    const { error } = await supabase
      .from('game_sessions')
      .update({
        completed_at: completion.completedAt,
        total_time_seconds: completion.totalTimeSeconds,
        mistakes_total: completion.mistakes,
        hints_used: completion.hints,
        easter_eggs_found: completion.easterEggs,
        goto_recipe: completion.gotoRecipe,
        goto_share: completion.gotoShare,
        win_condition: completion.winCondition,
        star_score: completion.winCondition === 'completed' ? 
          calculateStarScore(completion.mistakes, completion.hints, completion.totalTimeSeconds) : null
      })
      .eq('session_id', completion.sessionId);
      
    if (error) {
      console.error('Failed to complete pending session:', error);
    } else {
      console.log('✅ Successfully completed pending session');
      localStorage.removeItem('pendingCompletion');
    }
    
  } catch (error) {
    console.error('Error retrying pending completion:', error);
  }
} 

// =============================================================================
// SESSION MIGRATION FUNCTIONS - APlasker
// Migrate anonymous sessions to authenticated user accounts
// =============================================================================

// Migrate sessions from device fingerprint to authenticated user ID
async function migrateSessions(authenticatedUserId, deviceFingerprint) {
  try {
    console.log('🔄 Starting session migration...', {
      authenticatedUserId: authenticatedUserId?.substring(0, 8) + '...',
      deviceFingerprint: deviceFingerprint?.substring(0, 20) + '...'
    });
    
    if (!authenticatedUserId || !deviceFingerprint) {
      console.warn('⚠️ Missing required parameters for session migration');
      return { success: false, error: 'Missing parameters' };
    }
    
    // Step 1: Find all sessions with user_id = deviceFingerprint
    const { data: sessionsToMigrate, error: findError } = await supabase
      .from('game_sessions')
      .select('session_id, rec_id, started_at, completed_at, win_condition')
      .eq('user_id', deviceFingerprint);
    
    if (findError) {
      console.error('❌ Error finding sessions to migrate:', findError);
      return { success: false, error: findError.message };
    }
    
    if (!sessionsToMigrate || sessionsToMigrate.length === 0) {
      console.log('ℹ️ No anonymous sessions found to migrate');
      return { success: true, migratedCount: 0 };
    }
    
    console.log(`📋 Found ${sessionsToMigrate.length} anonymous sessions to migrate:`, 
      sessionsToMigrate.map(s => ({
        session: s.session_id?.substring(0, 8) + '...',
        recipe: s.rec_id,
        status: s.completed_at ? s.win_condition : 'in_progress'
      }))
    );
    
    // Step 2: Update all anonymous sessions to use authenticated user ID
    const { data: updatedSessions, error: updateError } = await supabase
      .from('game_sessions')
      .update({ user_id: authenticatedUserId })
      .eq('user_id', deviceFingerprint)
      .select('session_id');
    
    if (updateError) {
      console.error('❌ Error updating sessions during migration:', updateError);
      return { success: false, error: updateError.message };
    }
    
    const migratedCount = updatedSessions?.length || 0;
    console.log(`✅ Successfully migrated ${migratedCount} sessions to authenticated user`);
    
    // Step 3: Update current session variables if current session was migrated
    if (currentSessionId) {
      const wasMigrated = sessionsToMigrate.some(s => s.session_id === currentSessionId);
      if (wasMigrated) {
        console.log('🎯 Current active session was migrated - session continues seamlessly');
        // No need to update currentSessionId since it's the same UUID
        // But the session is now owned by the authenticated user
      }
    }
    
    return { 
      success: true, 
      migratedCount,
      migratedSessions: sessionsToMigrate.map(s => s.session_id)
    };
    
  } catch (error) {
    console.error('❌ Unexpected error during session migration:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to get current device fingerprint for migration
async function getCurrentDeviceFingerprint() {
  try {
    // Use the same logic as getDeviceFingerprint() for consistency
    const fingerprint = await getDeviceFingerprint();
    console.log('🔍 Current device fingerprint for migration:', fingerprint?.substring(0, 20) + '...');
    return fingerprint;
  } catch (error) {
    console.error('❌ Error getting device fingerprint for migration:', error);
    return null;
  }
}

// Main migration function called during authentication
async function migrateUserSessions(authenticatedUserId) {
  try {
    console.log('🚀 Starting user session migration process...');
    
    // Get current device fingerprint
    const deviceFingerprint = await getCurrentDeviceFingerprint();
    
    if (!deviceFingerprint) {
      console.warn('⚠️ Could not get device fingerprint - skipping migration');
      return { success: false, error: 'No device fingerprint' };
    }
    
    // Check current localStorage session to see if it needs clearing
    const savedState = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        console.log('📱 Found localStorage session:', {
          sessionId: state.sessionId?.substring(0, 8) + '...',
          age: state.lastSaved ? Math.round((Date.now() - state.lastSaved) / 1000) + 's' : 'unknown'
        });
        
        // If the localStorage session belongs to the device fingerprint (anonymous)
        // we might need to clear it after migration to prevent conflicts
        if (currentSessionId === state.sessionId) {
          console.log('⚠️ Current session matches localStorage - will clear after migration');
        }
      } catch (error) {
        console.error('Error parsing localStorage session:', error);
      }
    }
    
    // Perform the migration
    const result = await migrateSessions(authenticatedUserId, deviceFingerprint);
    
    if (result.success) {
      console.log(`🎉 Session migration complete! Migrated ${result.migratedCount} sessions`);
      
      // Update analytics to track migration success
      if (result.migratedCount > 0) {
        console.log('📊 Migration analytics:', {
          userId: authenticatedUserId?.substring(0, 8) + '...',
          migratedCount: result.migratedCount,
          timestamp: new Date().toISOString()
        });
        
        // CRITICAL FIX: Clear localStorage session state to prevent conflicts
        // The migrated session is now owned by authenticated user, so old localStorage
        // state with device fingerprint as user_id could cause problems
        console.log('🧹 Clearing localStorage session state post-migration to prevent conflicts');
        clearSessionState();
        
        // Reset current session variables to force clean state
        currentSessionId = null;
        gameStartTime = null;
        totalMistakes = 0;
        totalHintsUsed = 0;
        totalEasterEggsFound = 0;
        gotoRecipe = false;
        gotoShare = false;
        winScreenActive = false;
        winScreenStartTime = null;
        lastInteractionTime = null;
        
        console.log('✅ Session state reset - next game start will create fresh session');
      }
    } else {
      console.warn('⚠️ Session migration failed but continuing with authentication:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in migrateUserSessions:', error);
    // Don't fail authentication if migration fails
    return { success: false, error: error.message };
  }
}

// DEBUG FUNCTION - Test session migration manually
async function testSessionMigration() {
  try {
    console.log('🧪 === SESSION MIGRATION TEST ===');
    
    // Get current device fingerprint
    const deviceFingerprint = await getCurrentDeviceFingerprint();
    console.log('Current device fingerprint:', deviceFingerprint?.substring(0, 20) + '...');
    
    // Check localStorage state
    const savedState = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        console.log('📱 localStorage session state:', {
          sessionId: state.sessionId?.substring(0, 8) + '...',
          age: state.lastSaved ? Math.round((Date.now() - state.lastSaved) / 1000) + 's' : 'unknown',
          currentSessionMatches: currentSessionId === state.sessionId
        });
      } catch (error) {
        console.error('Error parsing localStorage:', error);
      }
    } else {
      console.log('📱 No localStorage session state found');
    }
    
    // Check current session variables
    console.log('🎯 Current session variables:', {
      currentSessionId: currentSessionId?.substring(0, 8) + '...' || 'None',
      gameStartTime: gameStartTime || 'None',
      totalMistakes,
      totalHintsUsed,
      totalEasterEggsFound
    });
    
    // Check for anonymous sessions
    const { data: anonymousSessions, error: findError } = await supabase
      .from('game_sessions')
      .select('session_id, rec_id, started_at, completed_at, win_condition, user_id')
      .eq('user_id', deviceFingerprint);
    
    if (findError) {
      console.error('❌ Error finding anonymous sessions:', findError);
      return;
    }
    
    console.log(`Found ${anonymousSessions?.length || 0} anonymous sessions:`, anonymousSessions);
    
    // Check current auth state
    const currentUser = window.authState?.user;
    console.log('Current authenticated user:', {
      id: currentUser?.id?.substring(0, 8) + '...' || 'None',
      email: currentUser?.email || 'None',
      isAnonymous: window.authState?.isAnonymous,
      isAuthenticated: window.authState?.isAuthenticated
    });
    
    // Check if migration function is available
    console.log('Migration function availability:', {
      migrateUserSessions: typeof migrateUserSessions,
      migrateSessions: typeof migrateSessions,
      getCurrentDeviceFingerprint: typeof getCurrentDeviceFingerprint
    });
    
    // Check authenticated user's existing sessions
    if (currentUser && !window.authState?.isAnonymous) {
      const { data: authSessions, error: authError } = await supabase
        .from('game_sessions')
        .select('session_id, rec_id, started_at, completed_at, win_condition')
        .eq('user_id', currentUser.id)
        .order('started_at', { ascending: false })
        .limit(5);
        
      if (authError) {
        console.error('❌ Error fetching authenticated sessions:', authError);
      } else {
        console.log(`Authenticated user has ${authSessions?.length || 0} existing sessions:`, authSessions);
      }
    }
    
    if (currentUser && !window.authState?.isAnonymous && anonymousSessions?.length > 0) {
      console.log('🚀 Running test migration...');
      const result = await migrateUserSessions(currentUser.id);
      console.log('Migration result:', result);
    } else if (!anonymousSessions?.length) {
      console.log('ℹ️ No anonymous sessions to migrate');
    } else if (!currentUser || window.authState?.isAnonymous) {
      console.log('ℹ️ No authenticated user to migrate to');
    }
    
    console.log('🧪 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error in test migration:', error);
  }
}

// ... existing code ...