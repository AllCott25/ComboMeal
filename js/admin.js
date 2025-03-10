// Admin Panel for Culinary Logic Puzzle

// Initialize Supabase client
const SUPABASE_URL = 'https://ovrvtfjejmhrflybslwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Form Elements
const recipeForm = document.getElementById('recipe-form-element');
const combinationsForm = document.getElementById('combinations-form-element');
const ingredientsForm = document.getElementById('ingredients-form-element');
const bulkIngredientsForm = document.getElementById('bulk-ingredients-form');
const eastereggsForm = document.getElementById('eastereggs-form-element');

// Message Elements
const recipeMessage = document.getElementById('recipe-message');
const combinationsMessage = document.getElementById('combinations-message');
const ingredientsMessage = document.getElementById('ingredients-message');
const bulkIngredientsMessage = document.getElementById('bulk-ingredients-message');
const eastereggsMessage = document.getElementById('eastereggs-message');

// Test Elements
const testRecipeSelect = document.getElementById('test-recipe');
const testButton = document.getElementById('test-button');
const testOutput = document.getElementById('test-output');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Check if user is already logged in
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (data.session) {
        showAdminPanel();
        loadFormData();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    // Login Form
    loginForm.addEventListener('submit', handleLogin);
    
    // Tab Navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Recipe dropdown change event for combinations
    document.getElementById('combo-recipe').addEventListener('change', function() {
        loadExistingCombinations(this.value);
    });
    
    // Forms
    recipeForm.addEventListener('submit', handleRecipeSubmit);
    combinationsForm.addEventListener('submit', handleCombinationSubmit);
    ingredientsForm.addEventListener('submit', handleIngredientSubmit);
    bulkIngredientsForm.addEventListener('submit', handleBulkIngredientsSubmit);
    eastereggsForm.addEventListener('submit', handleEasterEggSubmit);
    
    // Test Button
    testButton.addEventListener('click', handleTestRecipe);
});

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showAdminPanel();
        loadFormData();
    } catch (error) {
        loginError.textContent = `Login failed: ${error.message}`;
    }
}

// Show Admin Panel
function showAdminPanel() {
    loginSection.classList.add('hidden');
    adminPanel.classList.remove('hidden');
}

// Switch Tab
function switchTab(tabId) {
    // Update active tab button
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Show active tab content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Load Form Data
async function loadFormData() {
    await loadRecipes();
    await loadCombinations();
    await loadIngredients();
}

// Load Recipes
async function loadRecipes() {
    try {
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        // Populate recipe dropdowns
        const recipeDropdowns = [
            document.getElementById('combo-recipe'),
            document.getElementById('egg-recipe'),
            document.getElementById('test-recipe')
        ];
        
        recipeDropdowns.forEach(dropdown => {
            dropdown.innerHTML = '';
            recipes.forEach(recipe => {
                const option = document.createElement('option');
                option.value = recipe.rec_id;
                option.textContent = `${recipe.name} (${recipe.date})`;
                dropdown.appendChild(option);
            });
        });
        
        // Load existing combinations for the first recipe
        if (recipes.length > 0) {
            loadExistingCombinations(recipes[0].rec_id);
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

// Load Combinations
async function loadCombinations() {
    try {
        // Get all recipes for reference
        const { data: recipes, error: recipesError } = await supabase
            .from('recipes')
            .select('rec_id, name');
        
        if (recipesError) throw recipesError;
        
        // Create a map of recipe IDs to names
        const recipeMap = {};
        recipes.forEach(recipe => {
            recipeMap[recipe.rec_id] = recipe.name;
        });
        
        // Get combinations ordered by created_at
        const { data: combinations, error } = await supabase
            .from('combinations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Populate combination dropdowns
        const comboDropdowns = [
            document.getElementById('ing-combo'),
            document.getElementById('bulk-ing-combo')
        ];
        
        comboDropdowns.forEach(dropdown => {
            dropdown.innerHTML = '';
            combinations.forEach(combo => {
                const option = document.createElement('option');
                option.value = combo.combo_id;
                // Include recipe name in the option text
                const recipeName = recipeMap[combo.rec_id] || 'Unknown Recipe';
                option.textContent = `${recipeName} - ${combo.name}`;
                dropdown.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading combinations:', error);
    }
}

// Load Existing Combinations for a Recipe
async function loadExistingCombinations(recipeId) {
    const existingCombinationsDiv = document.getElementById('existing-combinations');
    
    if (!recipeId) {
        existingCombinationsDiv.innerHTML = '<p>Select a recipe to view its combinations.</p>';
        return;
    }
    
    existingCombinationsDiv.innerHTML = '<p>Loading combinations...</p>';
    
    try {
        const { data: combinations, error } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipeId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (combinations.length === 0) {
            existingCombinationsDiv.innerHTML = '<p>No combinations found for this recipe.</p>';
            return;
        }
        
        let html = '';
        combinations.forEach(combo => {
            html += `
                <div class="existing-item ${combo.is_final ? 'final-combination' : ''}">
                    <h4>${combo.name}</h4>
                    <p><strong>Verb:</strong> ${combo.verb || 'N/A'}</p>
                    <p><strong>Type:</strong> ${combo.is_final ? 'Final Combination' : 'Intermediate Combination'}</p>
                </div>
            `;
        });
        
        existingCombinationsDiv.innerHTML = html;
    } catch (error) {
        existingCombinationsDiv.innerHTML = `<p>Error loading combinations: ${error.message}</p>`;
    }
}

// Load Ingredients
async function loadIngredients() {
    try {
        const { data: ingredients, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('is_base', true)
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        // Populate ingredient dropdowns
        const ingredientDropdowns = [
            document.getElementById('egg-ing1'),
            document.getElementById('egg-ing2')
        ];
        
        ingredientDropdowns.forEach(dropdown => {
            dropdown.innerHTML = '';
            ingredients.forEach(ing => {
                const option = document.createElement('option');
                option.value = ing.ing_id;
                option.textContent = ing.name;
                dropdown.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading ingredients:', error);
    }
}

// Handle Recipe Submit
async function handleRecipeSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('recipe-name').value;
    const date = document.getElementById('recipe-date').value;
    const recipeUrl = document.getElementById('recipe-url').value;
    
    try {
        const { data, error } = await supabase
            .from('recipes')
            .insert([
                { name, date, recipe_url: recipeUrl }
            ])
            .select();
        
        if (error) throw error;
        
        showMessage(recipeMessage, 'Recipe added successfully!', 'success');
        recipeForm.reset();
        await loadRecipes();
    } catch (error) {
        showMessage(recipeMessage, `Error adding recipe: ${error.message}`, 'error');
    }
}

// Handle Combination Submit
async function handleCombinationSubmit(e) {
    e.preventDefault();
    
    const recId = document.getElementById('combo-recipe').value;
    const name = document.getElementById('combo-name').value;
    const verb = document.getElementById('combo-verb').value;
    const isFinal = document.getElementById('combo-is-final').checked;
    
    try {
        const { data, error } = await supabase
            .from('combinations')
            .insert([
                { rec_id: recId, name, verb, is_final: isFinal }
            ])
            .select();
        
        if (error) throw error;
        
        showMessage(combinationsMessage, 'Combination added successfully!', 'success');
        combinationsForm.reset();
        await loadCombinations();
    } catch (error) {
        showMessage(combinationsMessage, `Error adding combination: ${error.message}`, 'error');
    }
}

// Handle Ingredient Submit
async function handleIngredientSubmit(e) {
    e.preventDefault();
    
    const comboId = document.getElementById('ing-combo').value;
    const name = document.getElementById('ing-name').value;
    const isBase = document.getElementById('ing-is-base').checked;
    
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .insert([
                { combo_id: comboId, name, is_base: isBase }
            ])
            .select();
        
        if (error) throw error;
        
        showMessage(ingredientsMessage, 'Ingredient added successfully!', 'success');
        ingredientsForm.reset();
        await loadIngredients();
    } catch (error) {
        showMessage(ingredientsMessage, `Error adding ingredient: ${error.message}`, 'error');
    }
}

// Handle Bulk Ingredients Submit
async function handleBulkIngredientsSubmit(e) {
    e.preventDefault();
    
    const comboId = document.getElementById('bulk-ing-combo').value;
    const ingredientsText = document.getElementById('bulk-ingredients').value;
    const isBase = document.getElementById('bulk-ing-is-base').checked;
    
    // Split ingredients by line
    const ingredientNames = ingredientsText.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    if (ingredientNames.length === 0) {
        showMessage(bulkIngredientsMessage, 'No ingredients provided', 'error');
        return;
    }
    
    try {
        // Create array of ingredient objects
        const ingredients = ingredientNames.map(name => ({
            combo_id: comboId,
            name,
            is_base: isBase
        }));
        
        const { data, error } = await supabase
            .from('ingredients')
            .insert(ingredients)
            .select();
        
        if (error) throw error;
        
        showMessage(bulkIngredientsMessage, `${ingredientNames.length} ingredients added successfully!`, 'success');
        bulkIngredientsForm.reset();
        await loadIngredients();
    } catch (error) {
        showMessage(bulkIngredientsMessage, `Error adding ingredients: ${error.message}`, 'error');
    }
}

// Handle Easter Egg Submit
async function handleEasterEggSubmit(e) {
    e.preventDefault();
    
    const recId = document.getElementById('egg-recipe').value;
    const name = document.getElementById('egg-name').value;
    const ingId1 = document.getElementById('egg-ing1').value;
    const ingId2 = document.getElementById('egg-ing2').value;
    
    try {
        const { data, error } = await supabase
            .from('eastereggs')
            .insert([
                { rec_id: recId, name, ing_id_1: ingId1, ing_id_2: ingId2 }
            ])
            .select();
        
        if (error) throw error;
        
        showMessage(eastereggsMessage, 'Easter Egg added successfully!', 'success');
        eastereggsForm.reset();
    } catch (error) {
        showMessage(eastereggsMessage, `Error adding Easter Egg: ${error.message}`, 'error');
    }
}

// Handle Test Recipe
async function handleTestRecipe() {
    const recipeId = testRecipeSelect.value;
    
    if (!recipeId) {
        testOutput.textContent = 'Please select a recipe to test';
        return;
    }
    
    testOutput.textContent = 'Loading recipe data...';
    
    try {
        // Get recipe
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('rec_id', recipeId)
            .single();
        
        if (recipeError) throw recipeError;
        
        // Get combinations
        const { data: combinations, error: combosError } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipeId);
        
        if (combosError) throw combosError;
        
        // Get ingredients
        const comboIds = combinations.map(combo => combo.combo_id);
        const { data: ingredients, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .in('combo_id', comboIds);
        
        if (ingredientsError) throw ingredientsError;
        
        // Get easter eggs
        const { data: easterEggs, error: easterEggsError } = await supabase
            .from('eastereggs')
            .select('*')
            .eq('rec_id', recipeId);
        
        if (easterEggsError) throw easterEggsError;
        
        // Process the data
        const processedData = processRecipeData(recipe, combinations, ingredients, easterEggs);
        
        // Create a map to track which combinations are used in other combinations
        const comboUsageMap = {};
        ingredients.forEach(ing => {
            if (!ing.is_base) {
                if (!comboUsageMap[ing.name]) {
                    comboUsageMap[ing.name] = [];
                }
                
                // Find the combination name for this combo_id
                const parentCombo = combinations.find(c => c.combo_id === ing.combo_id);
                if (parentCombo) {
                    comboUsageMap[ing.name].push(parentCombo.name);
                }
            }
        });
        
        // Display the results
        testOutput.innerHTML = `
            <h4>Recipe: ${recipe.name}</h4>
            <p><strong>Date:</strong> ${recipe.date}</p>
            <p><strong>URL:</strong> ${recipe.recipe_url || 'N/A'}</p>
            
            <h4>Base Ingredients (${processedData.baseIngredients.length}):</h4>
            <ul>
                ${processedData.baseIngredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
            
            <h4>Intermediate Combinations (${processedData.intermediateCombinations.length}):</h4>
            <ul>
                ${processedData.intermediateCombinations.map(combo => {
                    // Check if this combo is used in another combo
                    const usedIn = comboUsageMap[combo.name] || [];
                    const usedInText = usedIn.length > 0 
                        ? `<span class="used-in">(Used in: ${usedIn.join(', ')})</span>` 
                        : '';
                    
                    return `
                        <li>
                            <strong>${combo.name}</strong> ${usedInText}
                            <br><strong>Verb:</strong> ${combo.verb || 'N/A'}
                            <br><strong>Required:</strong> ${combo.required.join(', ')}
                        </li>
                    `;
                }).join('')}
            </ul>
            
            <h4>Final Combination:</h4>
            <p><strong>${processedData.finalCombination.name}</strong> (${processedData.finalCombination.verb || 'N/A'})</p>
            <p><strong>Required:</strong> ${processedData.finalCombination.required.join(', ')}</p>
            
            <h4>Easter Eggs (${processedData.easterEggs.length}):</h4>
            <ul>
                ${processedData.easterEggs.map(egg => `
                    <li>
                        <strong>${egg.name}</strong>
                        <br>Required: ${egg.required.join(' + ')}
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (error) {
        testOutput.textContent = `Error testing recipe: ${error.message}`;
    }
}

// Process Recipe Data (similar to the function in supabase.js)
function processRecipeData(recipe, combinations, ingredients, easterEggs = []) {
    console.log("Processing recipe data:", { recipe, combinations, ingredients, easterEggs });
    
    // Find the final combination
    const finalCombo = combinations.find(combo => combo.is_final === true);
    
    if (!finalCombo) {
        throw new Error('No final combination found!');
    }
    
    // Find all intermediate combinations (not final)
    const intermediateCombos = combinations.filter(combo => combo.is_final === false);
    
    // Get all base ingredients
    const baseIngredients = ingredients
        .filter(ing => ing.is_base === true)
        .map(ing => ing.name);
    
    // Create maps for easier lookups
    const comboIdToName = {};
    const comboNameToId = {};
    combinations.forEach(combo => {
        comboIdToName[combo.combo_id] = combo.name;
        comboNameToId[combo.name] = combo.combo_id;
    });
    
    // Map to track which combinations are used as ingredients in other combinations
    const comboUsageMap = {};
    
    // Group ingredients by combination
    const ingredientsByCombo = {};
    ingredients.forEach(ing => {
        if (!ingredientsByCombo[ing.combo_id]) {
            ingredientsByCombo[ing.combo_id] = [];
        }
        
        // Track if this is a base ingredient or another combination
        if (ing.is_base) {
            ingredientsByCombo[ing.combo_id].push({
                name: ing.name,
                isBase: true
            });
        } else {
            // This is a combination used as an ingredient
            ingredientsByCombo[ing.combo_id].push({
                name: ing.name,
                isBase: false
            });
            
            // Track that this combination is used in another combination
            if (!comboUsageMap[ing.name]) {
                comboUsageMap[ing.name] = [];
            }
            comboUsageMap[ing.name].push(comboIdToName[ing.combo_id]);
        }
    });
    
    console.log("Ingredients by combo:", ingredientsByCombo);
    console.log("Combination usage map:", comboUsageMap);
    
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
            verb: combo.verb
        };
    });
    
    // For the final combination, we need to find which combinations are directly required
    // These are combinations that aren't used as ingredients in other combinations
    // that are themselves used in the final combination
    
    // First, get all ingredients for the final combination
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
    
    // The required combinations for the final recipe are the direct combination ingredients
    let finalRequired = finalComboIngs;
    
    // If we don't have any direct combination ingredients, fall back to previous methods
    if (finalRequired.length === 0) {
        // Try to match by name
        const intermediateNames = intermediateCombos.map(combo => combo.name);
        finalRequired = finalBaseIngs.filter(ing => intermediateNames.includes(ing));
        
        // If still empty, use all intermediate combinations as a fallback
        if (finalRequired.length === 0) {
            finalRequired = intermediateCombos.map(combo => combo.name);
        }
    }
    
    console.log("Final required combinations:", finalRequired);
    
    // Format final combination
    const finalCombination = {
        name: finalCombo.name,
        required: finalRequired,
        verb: finalCombo.verb
    };
    
    // Format easter eggs
    const formattedEasterEggs = [];
    
    if (easterEggs && easterEggs.length > 0) {
        // Create a map of ing_id to name
        const ingredientMap = {};
        ingredients.forEach(ing => {
            ingredientMap[ing.ing_id] = ing.name;
        });
        
        // Format the easter eggs data with ingredient names
        easterEggs.forEach(egg => {
            const required = [];
            if (egg.ing_id_1 && ingredientMap[egg.ing_id_1]) {
                required.push(ingredientMap[egg.ing_id_1]);
            }
            if (egg.ing_id_2 && ingredientMap[egg.ing_id_2]) {
                required.push(ingredientMap[egg.ing_id_2]);
            }
            
            formattedEasterEggs.push({
                id: egg.egg_id,
                name: egg.name || "Secret Combination",
                required: required
            });
        });
    }
    
    return {
        recipeName: recipe.name,
        recipeUrl: recipe.recipe_url || "https://www.example.com/recipe",
        intermediateCombinations,
        finalCombination,
        baseIngredients: [...new Set(baseIngredients)],
        easterEggs: formattedEasterEggs
    };
}

// Show Message
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
} 