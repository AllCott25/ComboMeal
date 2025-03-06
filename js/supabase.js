// Supabase Integration for Culinary Logic Puzzle
// This file handles fetching recipe data from Supabase

// Initialize Supabase client
const SUPABASE_URL = 'https://ovrvtfjejmhrflybslwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk';

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
    // Get current date in EST
    const today = getCurrentDateEST();
    console.log("Fetching recipe for date:", today);
    
    // Query the recipes table for today's recipe
    const { data: recipes, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('date', today);
    
    console.log("Recipes data:", recipes);
    if (recipeError) {
      console.error("Recipe error:", recipeError);
      throw recipeError;
    }
    
    if (!recipes || recipes.length === 0) {
      console.error("No recipe found for today");
      throw new Error('No recipe found for today');
    }
    
    // Get the first recipe (in case there are multiple for the same date)
    const recipe = recipes[0];
    console.log("Selected recipe:", recipe);
    
    // Get all combinations for this recipe
    const { data: combinations, error: combosError } = await supabase
      .from('combinations')
      .select('*')
      .eq('rec_id', recipe.rec_id);
    
    console.log("Combinations data:", combinations);
    if (combosError) {
      console.error("Combinations error:", combosError);
      throw combosError;
    }
    
    // Get all ingredients for these combinations
    const comboIds = combinations.map(combo => combo.combo_id);
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .in('combo_id', comboIds);
    
    console.log("Ingredients data:", ingredients);
    if (ingredientsError) {
      console.error("Ingredients error:", ingredientsError);
      throw ingredientsError;
    }
    
    // Process the data into the format expected by the game
    return processRecipeData(recipe, combinations, ingredients);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    // Return the default recipe as fallback
    return null;
  }
}

// Process the database data into the format expected by the game
function processRecipeData(recipe, combinations, ingredients) {
  console.log("Processing recipe data:", { recipe, combinations, ingredients });
  
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
  
  // Get all base ingredients
  const baseIngredients = ingredients
    .filter(ing => ing.is_base === true)
    .map(ing => ing.name);
  console.log("All base ingredients:", baseIngredients);
  
  // Group ingredients by combination
  const ingredientsByCombo = {};
  ingredients.forEach(ing => {
    if (!ingredientsByCombo[ing.combo_id]) {
      ingredientsByCombo[ing.combo_id] = [];
    }
    
    // Only add the ingredient if it's a base ingredient
    if (ing.is_base === true) {
      ingredientsByCombo[ing.combo_id].push(ing.name);
    }
  });
  console.log("Ingredients by combo:", ingredientsByCombo);
  
  // Format intermediate combinations
  const intermediateCombinations = intermediateCombos.map(combo => {
    // Get the base ingredients for this combo
    const comboIngredients = ingredientsByCombo[combo.combo_id] || [];
    
    return {
      name: combo.name,
      required: comboIngredients
    };
  });
  console.log("Formatted intermediate combinations:", intermediateCombinations);
  
  // For the final combination, we need to find which intermediate combinations are required
  // Get all ingredients for the final combination
  const finalComboIngredients = ingredients
    .filter(ing => ing.combo_id === finalCombo.combo_id)
    .map(ing => ing.name);
  console.log("Final combo ingredients:", finalComboIngredients);
  
  // Find which intermediate combinations are required for the final combination
  // Method 1: Check if intermediate combo names are in the final combo ingredients
  const requiredCombos = [];
  for (const combo of intermediateCombos) {
    if (finalComboIngredients.includes(combo.name)) {
      requiredCombos.push(combo.name);
    }
  }
  
  // Method 2: If method 1 didn't work, check if any ingredients from the final combo
  // match the names of intermediate combinations
  if (requiredCombos.length === 0) {
    // Get all intermediate combo names
    const intermediateNames = intermediateCombos.map(combo => combo.name);
    
    // Check if any of the final combo ingredients match intermediate combo names
    for (const ing of finalComboIngredients) {
      if (intermediateNames.includes(ing)) {
        requiredCombos.push(ing);
      }
    }
  }
  
  console.log("Required intermediate combos for final:", requiredCombos);
  
  // If we still couldn't find the required combinations, use all intermediate combinations as a fallback
  const finalRequired = requiredCombos.length > 0 
    ? requiredCombos 
    : intermediateCombos.map(combo => combo.name);
  console.log("Final required combinations:", finalRequired);
  
  // Format final combination
  const finalCombination = {
    name: finalCombo.name,
    required: finalRequired
  };
  
  const result = {
    recipeName: recipe.name,
    recipeUrl: recipe.recipe_url || "https://www.example.com/recipe",
    intermediateCombinations,
    finalCombination,
    baseIngredients: [...new Set(baseIngredients)]
  };
  
  console.log("Processed result:", result);
  return result;
} 