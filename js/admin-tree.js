// Recipe Tree Admin for Culinary Logic Puzzle

// Initialize Supabase client
const SUPABASE_URL = 'https://ovrvtfjejmhrflybslwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const recipeSelect = document.getElementById('recipe-select');
const loadRecipeBtn = document.getElementById('load-recipe-btn');
const playtestRecipeBtn = document.getElementById('playtest-recipe-btn');
const newRecipeBtn = document.getElementById('new-recipe-btn');
const newRecipeForm = document.getElementById('new-recipe-form');
const recipeForm = document.getElementById('recipe-form');
const cancelRecipeBtn = document.getElementById('cancel-recipe-btn');
const editRecipeForm = document.getElementById('edit-recipe-form');
const editRecipeFormElement = document.getElementById('edit-recipe-form-element');
const cancelEditRecipeBtn = document.getElementById('cancel-edit-recipe-btn');
const editComboForm = document.getElementById('edit-combo-form');
const editComboFormElement = document.getElementById('edit-combo-form-element');
const cancelEditComboBtn = document.getElementById('cancel-edit-combo-btn');
const editIngredientForm = document.getElementById('edit-ingredient-form');
const editIngredientFormElement = document.getElementById('edit-ingredient-form-element');
const cancelEditIngredientBtn = document.getElementById('cancel-edit-ingredient-btn');
const editEasterEggForm = document.getElementById('edit-easter-egg-form');
const editEasterEggFormElement = document.getElementById('edit-easter-egg-form-element');
const cancelEditEasterEggBtn = document.getElementById('cancel-edit-easter-egg-btn');
const easterEggsSection = document.getElementById('easter-eggs-section');
const easterEggForm = document.getElementById('easter-egg-form');
const easterEggsList = document.getElementById('easter-eggs-list');
const recipeTree = document.getElementById('recipe-tree');
const messageArea = document.getElementById('message-area');

// Current recipe data
let currentRecipe = null;
let currentCombinations = [];
let currentIngredients = [];
let currentEasterEggs = [];
let allIngredients = [];

// Check if user is already logged in
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    
    if (data.session) {
        showAdminPanel();
        await loadRecipes();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    // Login Form
    loginForm.addEventListener('submit', handleLogin);
    
    // Recipe Selection
    loadRecipeBtn.addEventListener('click', () => loadRecipeData(recipeSelect.value));
    
    // Add event listener for recipe dropdown change
    recipeSelect.addEventListener('change', function() {
        if (this.value) {
            loadRecipeData(this.value);
            playtestRecipeBtn.style.display = 'inline-block';
        } else {
            playtestRecipeBtn.style.display = 'none';
        }
    });
    
    // Playtest Recipe
    playtestRecipeBtn.addEventListener('click', handlePlaytestRecipe);
    
    // New Recipe
    newRecipeBtn.addEventListener('click', () => {
        newRecipeForm.style.display = 'block';
    });
    
    cancelRecipeBtn.addEventListener('click', () => {
        newRecipeForm.style.display = 'none';
        recipeForm.reset();
    });
    
    recipeForm.addEventListener('submit', handleRecipeSubmit);
    
    // Edit Recipe
    editRecipeFormElement.addEventListener('submit', handleEditRecipeSubmit);
    
    cancelEditRecipeBtn.addEventListener('click', () => {
        editRecipeForm.style.display = 'none';
    });
    
    // Edit Combination Form
    editComboFormElement.addEventListener('submit', handleEditComboSubmit);
    cancelEditComboBtn.addEventListener('click', () => {
        editComboForm.style.display = 'none';
    });
    
    // Edit Ingredient Form
    editIngredientFormElement.addEventListener('submit', handleEditIngredientSubmit);
    cancelEditIngredientBtn.addEventListener('click', () => {
        editIngredientForm.style.display = 'none';
    });
    
    // Edit Easter Egg Form
    editEasterEggFormElement.addEventListener('submit', handleEditEasterEggSubmit);
    cancelEditEasterEggBtn.addEventListener('click', () => {
        editEasterEggForm.style.display = 'none';
    });
    
    // Easter Egg Form
    easterEggForm.addEventListener('submit', handleEasterEggSubmit);
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
        await loadRecipes();
    } catch (error) {
        loginError.textContent = `Login failed: ${error.message}`;
    }
}

// Show Admin Panel
function showAdminPanel() {
    loginSection.classList.add('hidden');
    adminPanel.classList.remove('hidden');
}

// Load Recipes
async function loadRecipes() {
    try {
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        // Clear existing options except the first one
        while (recipeSelect.options.length > 1) {
            recipeSelect.remove(1);
        }
        
        // Add recipes to dropdown
        recipes.forEach(recipe => {
            const option = document.createElement('option');
            option.value = recipe.rec_id;
            option.textContent = `${recipe.name} (${recipe.date})`;
            recipeSelect.appendChild(option);
        });
    } catch (error) {
        showMessage(`Error loading recipes: ${error.message}`, 'error');
        console.error('Error loading recipes:', error);
    }
}

// Handle Recipe Submit
async function handleRecipeSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('recipe-name').value;
    const date = document.getElementById('recipe-date').value;
    const description = document.getElementById('recipe-description').value;
    const url = document.getElementById('recipe-url').value;
    
    try {
        const { data, error } = await supabase
            .from('recipes')
            .insert([
                { name, date: date, description, recipe_url: url }
            ])
            .select();
        
        if (error) throw error;
        
        showMessage('Recipe created successfully!', 'success');
        recipeForm.reset();
        newRecipeForm.style.display = 'none';
        await loadRecipes();
        
        // Select the newly created recipe
        if (data && data.length > 0) {
            recipeSelect.value = data[0].rec_id;
            await loadRecipeData(data[0].rec_id);
        }
    } catch (error) {
        showMessage(`Error creating recipe: ${error.message}`, 'error');
        console.error('Error creating recipe:', error);
    }
}

// Load Recipe Data
async function loadRecipeData(recipeId) {
    if (!recipeId) {
        recipeTree.innerHTML = '<p>Select a recipe to view its combination tree.</p>';
        playtestRecipeBtn.style.display = 'none';
        return;
    }
    
    recipeTree.innerHTML = '<p>Loading recipe data...</p>';
    console.log(`Loading recipe data for ID: ${recipeId}`);
    
    // Show playtest button when a recipe is selected
    playtestRecipeBtn.style.display = 'inline-block';
    
    try {
        // Load recipe
        const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('rec_id', recipeId)
            .single();
        
        if (recipeError) {
            console.error('Error loading recipe:', recipeError);
            throw recipeError;
        }
        
        console.log('Recipe loaded:', recipe);
        
        // Load combinations
        const { data: combinations, error: combosError } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipeId);
        
        if (combosError) {
            console.error('Error loading combinations:', combosError);
            throw combosError;
        }
        
        console.log('Combinations loaded:', combinations);
        
        // If no combinations found, show a message
        if (combinations.length === 0) {
            recipeTree.innerHTML = `
                <div class="tree-node">
                    <h3>No combinations found for ${recipe.name}</h3>
                    <p>Create a final combination to get started:</p>
                    <form id="final-combo-form">
                        <div class="form-group">
                            <label for="final-combo-name">Final Combination Name:</label>
                            <input type="text" id="final-combo-name" required>
                        </div>
                        <div class="form-group">
                            <label for="final-combo-verb">Verb (cooking action):</label>
                            <input type="text" id="final-combo-verb" placeholder="e.g., prepare, assemble">
                        </div>
                        <button type="submit">Create Final Combination</button>
                    </form>
                </div>
            `;
            
            // Add event listener for the form
            document.getElementById('final-combo-form').addEventListener('submit', handleFinalComboSubmit);
            
            // Store current recipe
            currentRecipe = recipe;
            currentCombinations = [];
            currentIngredients = [];
            
            return;
        }
        
        // Load ingredients
        let ingredients = [];
        if (combinations.length > 0) {
            const comboIds = combinations.map(c => c.combo_id);
            console.log('Loading ingredients for combo IDs:', comboIds);
            
            const { data: loadedIngredients, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*')
                .in('combo_id', comboIds);
            
            if (ingredientsError) {
                console.error('Error loading ingredients:', ingredientsError);
                throw ingredientsError;
            }
            
            ingredients = loadedIngredients || [];
            console.log('Ingredients loaded:', ingredients);
        }
        
        // Store current data
        currentRecipe = recipe;
        currentCombinations = combinations;
        currentIngredients = ingredients;
        
        // Load all ingredients for Easter Eggs
        const { data: allIngs, error: allIngsError } = await supabase
            .from('ingredients')
            .select('*')
            .eq('is_base', true);
        
        if (allIngsError) {
            console.error('Error loading all ingredients:', allIngsError);
        } else {
            allIngredients = allIngs || [];
        }
        
        // Load Easter Eggs
        const { data: easterEggs, error: easterEggsError } = await supabase
            .from('eastereggs')
            .select('*')
            .eq('rec_id', recipeId);
        
        if (easterEggsError) {
            console.error('Error loading Easter Eggs:', easterEggsError);
        } else {
            currentEasterEggs = easterEggs || [];
        }
        
        // Build and render the tree
        renderRecipeTree();
    } catch (error) {
        console.error('Error in loadRecipeData:', error);
        recipeTree.innerHTML = `<p>Error loading recipe data: ${error.message}</p>`;
    }
}

// Render Recipe Tree
function renderRecipeTree() {
    if (!currentRecipe || !currentCombinations.length) {
        recipeTree.innerHTML = '<p>No combinations found for this recipe.</p>';
        return;
    }
    
    // Find the final combination
    const finalCombo = currentCombinations.find(c => c.is_final === true);
    
    if (!finalCombo) {
        // If no final combination exists, show a form to create one
        recipeTree.innerHTML = `
            <div class="tree-node">
                <h3>Create Final Combination for ${currentRecipe.name}</h3>
                <form id="final-combo-form">
                    <div class="form-group">
                        <label for="final-combo-name">Final Combination Name:</label>
                        <input type="text" id="final-combo-name" required>
                    </div>
                    <div class="form-group">
                        <label for="final-combo-verb">Verb (cooking action):</label>
                        <input type="text" id="final-combo-verb" placeholder="e.g., prepare, assemble">
                    </div>
                    <button type="submit">Create Final Combination</button>
                </form>
            </div>
        `;
        
        // Add event listener for the form
        document.getElementById('final-combo-form').addEventListener('submit', handleFinalComboSubmit);
        return;
    }
    
    // Start building the tree with the final combination as the root
    let html = `
        <h3>${currentRecipe.name} Recipe Tree 
            <button id="edit-recipe-btn" class="edit-btn">Edit Recipe</button>
            <button id="easter-eggs-btn" class="edit-btn">Easter Eggs</button>
        </h3>
        <div class="tree-node final" data-id="${finalCombo.combo_id}">
            <div class="tree-node-header">
                <h4>${finalCombo.name} (Final Combination)</h4>
                <div class="tree-node-actions">
                    <button class="edit-combo-btn edit-btn" data-combo="${finalCombo.combo_id}">Edit</button>
                    <button class="add-child-btn" data-parent="${finalCombo.combo_id}">Add Child Combination</button>
                </div>
            </div>
            <div class="node-details">
                <p><strong>Verb:</strong> ${finalCombo.verb || 'N/A'}</p>
            </div>
            <div class="add-child-form" id="form-${finalCombo.combo_id}">
                <form class="child-combo-form" data-parent="${finalCombo.combo_id}">
                    <div class="form-group">
                        <label for="child-name-${finalCombo.combo_id}">Combination Name:</label>
                        <input type="text" id="child-name-${finalCombo.combo_id}" required>
                    </div>
                    <div class="form-group">
                        <label for="child-verb-${finalCombo.combo_id}">Verb:</label>
                        <input type="text" id="child-verb-${finalCombo.combo_id}" placeholder="e.g., mix, bake">
                    </div>
                    <button type="submit">Add Combination</button>
                    <button type="button" class="cancel-btn" data-parent="${finalCombo.combo_id}">Cancel</button>
                </form>
            </div>
    `;
    
    // Find direct children of the final combination
    const directChildren = currentCombinations.filter(c => c.parent_combo === finalCombo.combo_id);
    
    if (directChildren.length > 0) {
        html += '<div class="tree-children">';
        directChildren.forEach(child => {
            html += buildComboNode(child);
        });
        html += '</div>';
    } else {
        html += '<div class="tree-children"><p>No child combinations yet.</p></div>';
    }
    
    html += '</div>';
    
    recipeTree.innerHTML = html;
    
    // Add event listener for edit recipe button
    document.getElementById('edit-recipe-btn').addEventListener('click', () => {
        showEditRecipeForm(currentRecipe);
    });
    
    // Add event listener for Easter Eggs button
    document.getElementById('easter-eggs-btn').addEventListener('click', () => {
        showEasterEggsSection();
    });
    
    // Add event listeners for the add child buttons
    document.querySelectorAll('.add-child-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parentId = this.getAttribute('data-parent');
            const form = document.getElementById(`form-${parentId}`);
            form.classList.toggle('visible');
        });
    });
    
    // Add event listeners for the cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parentId = this.getAttribute('data-parent');
            const form = document.getElementById(`form-${parentId}`);
            form.classList.remove('visible');
        });
    });
    
    // Add event listeners for the child combo forms
    document.querySelectorAll('.child-combo-form').forEach(form => {
        form.addEventListener('submit', handleChildComboSubmit);
    });
    
    // Add event listeners for the add ingredient buttons
    document.querySelectorAll('.add-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const comboId = this.getAttribute('data-combo');
            const form = document.getElementById(`ing-form-${comboId}`);
            form.classList.toggle('visible');
        });
    });
    
    // Add event listeners for the cancel ingredient buttons
    document.querySelectorAll('.cancel-ing-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const comboId = this.getAttribute('data-combo');
            const form = document.getElementById(`ing-form-${comboId}`);
            form.classList.remove('visible');
        });
    });
    
    // Add event listeners for the ingredient forms
    document.querySelectorAll('.ingredient-form').forEach(form => {
        form.addEventListener('submit', handleIngredientSubmit);
    });
    
    // Add event listeners for edit combination buttons
    document.querySelectorAll('.edit-combo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const comboId = this.getAttribute('data-combo');
            const combo = currentCombinations.find(c => c.combo_id == comboId);
            if (combo) {
                showEditComboForm(combo);
            }
        });
    });
    
    // Add event listeners for edit ingredient buttons
    document.querySelectorAll('.edit-ing-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingId = this.getAttribute('data-ing-id');
            const ing = currentIngredients.find(i => i.ing_id == ingId);
            if (ing) {
                showEditIngredientForm(ing);
            }
        });
    });
}

// Build a combination node for the tree
function buildComboNode(combo) {
    // Get ingredients for this combination
    const comboIngredients = currentIngredients.filter(ing => ing.combo_id === combo.combo_id);
    
    // Find children of this combination
    const children = currentCombinations.filter(c => c.parent_combo === combo.combo_id);
    
    let html = `
        <div class="tree-node" data-id="${combo.combo_id}">
            <div class="tree-node-header">
                <h4>${combo.name}</h4>
                <div class="tree-node-actions">
                    <button class="edit-combo-btn edit-btn" data-combo="${combo.combo_id}">Edit</button>
                    <button class="add-child-btn" data-parent="${combo.combo_id}">Add Child</button>
                    <button class="add-ingredient-btn" data-combo="${combo.combo_id}">Add Ingredient</button>
                </div>
            </div>
            <div class="node-details">
                <p><strong>Verb:</strong> ${combo.verb || 'N/A'}</p>
            </div>
    `;
    
    // Add ingredients section
    if (comboIngredients.length > 0) {
        html += '<div class="node-ingredients"><strong>Ingredients:</strong> ';
        comboIngredients.forEach(ing => {
            html += `<span class="ingredient-item ${ing.is_base ? 'base' : ''}" data-ing-id="${ing.ing_id}">${ing.name} <button class="edit-ing-btn" data-ing-id="${ing.ing_id}">✎</button></span>`;
        });
        html += '</div>';
    } else {
        html += '<div class="node-ingredients">No ingredients yet.</div>';
    }
    
    // Add form for adding new ingredients
    html += `
        <div class="add-child-form" id="ing-form-${combo.combo_id}">
            <form class="ingredient-form" data-combo="${combo.combo_id}">
                <div class="form-group">
                    <label for="ing-name-${combo.combo_id}">Ingredient Name:</label>
                    <input type="text" id="ing-name-${combo.combo_id}" required>
                </div>
                <div class="form-group">
                    <label for="ing-is-base-${combo.combo_id}">Is Base Ingredient:</label>
                    <input type="checkbox" id="ing-is-base-${combo.combo_id}" checked>
                </div>
                <button type="submit">Add Ingredient</button>
                <button type="button" class="cancel-ing-btn" data-combo="${combo.combo_id}">Cancel</button>
            </form>
        </div>
    `;
    
    // Add form for adding child combinations
    html += `
        <div class="add-child-form" id="form-${combo.combo_id}">
            <form class="child-combo-form" data-parent="${combo.combo_id}">
                <div class="form-group">
                    <label for="child-name-${combo.combo_id}">Combination Name:</label>
                    <input type="text" id="child-name-${combo.combo_id}" required>
                </div>
                <div class="form-group">
                    <label for="child-verb-${combo.combo_id}">Verb:</label>
                    <input type="text" id="child-verb-${combo.combo_id}" placeholder="e.g., mix, bake">
                </div>
                <button type="submit">Add Combination</button>
                <button type="button" class="cancel-btn" data-parent="${combo.combo_id}">Cancel</button>
            </form>
        </div>
    `;
    
    // Add children recursively
    if (children.length > 0) {
        html += '<div class="tree-children">';
        children.forEach(child => {
            html += buildComboNode(child);
        });
        html += '</div>';
    }
    
    html += '</div>';
    
    return html;
}

// Handle Final Combination Submit
async function handleFinalComboSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('final-combo-name').value;
    const verb = document.getElementById('final-combo-verb').value;
    
    console.log('Creating final combination:', { 
        recipe_id: currentRecipe.rec_id, 
        name, 
        verb 
    });
    
    try {
        const { data, error } = await supabase
            .from('combinations')
            .insert([
                { 
                    rec_id: currentRecipe.rec_id, 
                    name, 
                    verb, 
                    is_final: true 
                }
            ])
            .select();
        
        if (error) {
            console.error('Error creating final combination:', error);
            throw error;
        }
        
        console.log('Final combination created successfully:', data);
        showMessage('Final combination created successfully!', 'success');
        await loadRecipeData(currentRecipe.rec_id);
    } catch (error) {
        console.error('Error in handleFinalComboSubmit:', error);
        showMessage(`Error creating final combination: ${error.message}`, 'error');
    }
}

// Handle Child Combination Submit
async function handleChildComboSubmit(e) {
    e.preventDefault();
    
    const parentId = this.getAttribute('data-parent');
    const name = document.getElementById(`child-name-${parentId}`).value;
    const verb = document.getElementById(`child-verb-${parentId}`).value;
    
    console.log('Creating child combination:', { 
        recipe_id: currentRecipe.rec_id, 
        parent_id: parentId,
        name, 
        verb 
    });
    
    try {
        const { data, error } = await supabase
            .from('combinations')
            .insert([
                { 
                    rec_id: currentRecipe.rec_id, 
                    name, 
                    verb, 
                    is_final: false,
                    parent_combo: parentId
                }
            ])
            .select();
        
        if (error) {
            console.error('Error creating child combination:', error);
            throw error;
        }
        
        console.log('Child combination created successfully:', data);
        showMessage('Child combination created successfully!', 'success');
        await loadRecipeData(currentRecipe.rec_id);
    } catch (error) {
        console.error('Error in handleChildComboSubmit:', error);
        showMessage(`Error creating child combination: ${error.message}`, 'error');
    }
}

// Handle Ingredient Submit
async function handleIngredientSubmit(e) {
    e.preventDefault();
    
    const comboId = this.getAttribute('data-combo');
    const name = document.getElementById(`ing-name-${comboId}`).value;
    const isBase = document.getElementById(`ing-is-base-${comboId}`).checked;
    
    console.log('Adding ingredient:', { 
        combo_id: comboId, 
        name, 
        is_base: isBase 
    });
    
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .insert([
                { 
                    combo_id: comboId, 
                    name, 
                    is_base: isBase
                }
            ])
            .select();
        
        if (error) {
            console.error('Error adding ingredient:', error);
            throw error;
        }
        
        console.log('Ingredient added successfully:', data);
        showMessage('Ingredient added successfully!', 'success');
        await loadRecipeData(currentRecipe.rec_id);
    } catch (error) {
        console.error('Error in handleIngredientSubmit:', error);
        showMessage(`Error adding ingredient: ${error.message}`, 'error');
    }
}

// Show Message
function showMessage(message, type = 'info') {
    messageArea.textContent = message;
    messageArea.className = `message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        messageArea.textContent = '';
        messageArea.className = 'message';
    }, 5000);
}

// Show Edit Recipe Form
function showEditRecipeForm(recipe) {
    document.getElementById('edit-recipe-id').value = recipe.rec_id;
    document.getElementById('edit-recipe-name').value = recipe.name;
    document.getElementById('edit-recipe-date').value = recipe.date;
    document.getElementById('edit-recipe-description').value = recipe.description || '';
    document.getElementById('edit-recipe-url').value = recipe.recipe_url || '';
    
    editRecipeForm.style.display = 'block';
}

// Handle Edit Recipe Submit
async function handleEditRecipeSubmit(e) {
    e.preventDefault();
    
    const recId = document.getElementById('edit-recipe-id').value;
    const name = document.getElementById('edit-recipe-name').value;
    const date = document.getElementById('edit-recipe-date').value;
    const description = document.getElementById('edit-recipe-description').value;
    const url = document.getElementById('edit-recipe-url').value;
    
    try {
        const { data, error } = await supabase
            .from('recipes')
            .update({ name, date, description, recipe_url: url })
            .eq('rec_id', recId)
            .select();
        
        if (error) throw error;
        
        showMessage('Recipe updated successfully!', 'success');
        editRecipeForm.style.display = 'none';
        
        // Reload recipes and current recipe
        await loadRecipes();
        await loadRecipeData(recId);
    } catch (error) {
        showMessage(`Error updating recipe: ${error.message}`, 'error');
        console.error('Error updating recipe:', error);
    }
}

// Show Easter Eggs Section
function showEasterEggsSection() {
    // Hide other forms
    editRecipeForm.style.display = 'none';
    
    // Update Easter Eggs section
    document.getElementById('easter-eggs-recipe-name').textContent = currentRecipe.name;
    document.getElementById('easter-egg-recipe-id').value = currentRecipe.rec_id;
    
    // Populate ingredient dropdowns
    const ing1Select = document.getElementById('easter-egg-ing1');
    const ing2Select = document.getElementById('easter-egg-ing2');
    
    // Clear existing options except the first one
    while (ing1Select.options.length > 1) ing1Select.remove(1);
    while (ing2Select.options.length > 1) ing2Select.remove(1);
    
    // Add ingredients to dropdowns
    allIngredients.forEach(ing => {
        const option1 = document.createElement('option');
        option1.value = ing.ing_id;
        option1.textContent = ing.name;
        ing1Select.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = ing.ing_id;
        option2.textContent = ing.name;
        ing2Select.appendChild(option2);
    });
    
    // Render existing Easter Eggs
    renderEasterEggs();
    
    // Show the section
    easterEggsSection.style.display = 'block';
}

// Render Easter Eggs
function renderEasterEggs() {
    if (!currentEasterEggs || currentEasterEggs.length === 0) {
        easterEggsList.innerHTML = '<p>No Easter Eggs found for this recipe.</p>';
        return;
    }
    
    let html = '';
    currentEasterEggs.forEach(egg => {
        // Find ingredient names
        const ing1 = allIngredients.find(i => i.ing_id === egg.ing_id_1);
        const ing2 = allIngredients.find(i => i.ing_id === egg.ing_id_2);
        
        html += `
            <div class="existing-item">
                <h4>${egg.name} <button class="edit-egg-btn edit-btn" data-egg-id="${egg.egg_id}">Edit</button></h4>
                <p><strong>Ingredients:</strong> ${ing1 ? ing1.name : 'Unknown'} + ${ing2 ? ing2.name : 'Unknown'}</p>
            </div>
        `;
    });
    
    easterEggsList.innerHTML = html;
    
    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-egg-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const eggId = this.getAttribute('data-egg-id');
            const egg = currentEasterEggs.find(e => e.egg_id == eggId);
            if (egg) {
                showEditEasterEggForm(egg);
            }
        });
    });
}

// Handle Easter Egg Submit
async function handleEasterEggSubmit(e) {
    e.preventDefault();
    
    const recId = document.getElementById('easter-egg-recipe-id').value;
    const name = document.getElementById('easter-egg-name').value;
    const ing1 = document.getElementById('easter-egg-ing1').value;
    const ing2 = document.getElementById('easter-egg-ing2').value;
    
    if (ing1 === ing2) {
        showMessage('Please select two different ingredients', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('eastereggs')
            .insert([
                { 
                    rec_id: recId, 
                    name, 
                    ing_id_1: ing1, 
                    ing_id_2: ing2 
                }
            ])
            .select();
        
        if (error) throw error;
        
        showMessage('Easter Egg added successfully!', 'success');
        document.getElementById('easter-egg-name').value = '';
        document.getElementById('easter-egg-ing1').selectedIndex = 0;
        document.getElementById('easter-egg-ing2').selectedIndex = 0;
        
        // Reload Easter Eggs
        const { data: easterEggs, error: easterEggsError } = await supabase
            .from('eastereggs')
            .select('*')
            .eq('rec_id', recId);
        
        if (easterEggsError) throw easterEggsError;
        
        currentEasterEggs = easterEggs || [];
        renderEasterEggs();
    } catch (error) {
        showMessage(`Error adding Easter Egg: ${error.message}`, 'error');
        console.error('Error adding Easter Egg:', error);
    }
}

// Show Edit Combo Form
function showEditComboForm(combo) {
    // Hide other forms
    editRecipeForm.style.display = 'none';
    editIngredientForm.style.display = 'none';
    editEasterEggForm.style.display = 'none';
    easterEggsSection.style.display = 'none';
    
    // Populate form fields
    document.getElementById('edit-combo-id').value = combo.combo_id;
    document.getElementById('edit-combo-name').value = combo.name;
    document.getElementById('edit-combo-verb').value = combo.verb || '';
    document.getElementById('edit-combo-is-final').checked = combo.is_final;
    
    // Populate parent combo dropdown
    const parentSelect = document.getElementById('edit-combo-parent');
    
    // Clear existing options except the first one
    while (parentSelect.options.length > 1) {
        parentSelect.remove(1);
    }
    
    // Add combinations as options (excluding the current one)
    currentCombinations.forEach(c => {
        if (c.combo_id !== combo.combo_id) {
            const option = document.createElement('option');
            option.value = c.combo_id;
            option.textContent = c.name;
            if (combo.parent_combo === c.combo_id) {
                option.selected = true;
            }
            parentSelect.appendChild(option);
        }
    });
    
    // Show the form
    editComboForm.style.display = 'block';
}

// Handle Edit Combo Submit
async function handleEditComboSubmit(e) {
    e.preventDefault();
    
    const comboId = document.getElementById('edit-combo-id').value;
    const name = document.getElementById('edit-combo-name').value;
    const verb = document.getElementById('edit-combo-verb').value;
    const isFinal = document.getElementById('edit-combo-is-final').checked;
    const parentCombo = document.getElementById('edit-combo-parent').value;
    
    try {
        const { data, error } = await supabase
            .from('combinations')
            .update({ 
                name, 
                verb, 
                is_final: isFinal,
                parent_combo: parentCombo || null
            })
            .eq('combo_id', comboId)
            .select();
        
        if (error) throw error;
        
        showMessage('Combination updated successfully!', 'success');
        editComboForm.style.display = 'none';
        
        // Reload current recipe
        await loadRecipeData(currentRecipe.rec_id);
    } catch (error) {
        showMessage(`Error updating combination: ${error.message}`, 'error');
        console.error('Error updating combination:', error);
    }
}

// Show Edit Ingredient Form
function showEditIngredientForm(ingredient) {
    // Hide other forms
    editRecipeForm.style.display = 'none';
    editComboForm.style.display = 'none';
    editEasterEggForm.style.display = 'none';
    easterEggsSection.style.display = 'none';
    
    // Populate form fields
    document.getElementById('edit-ingredient-id').value = ingredient.ing_id;
    document.getElementById('edit-ingredient-name').value = ingredient.name;
    document.getElementById('edit-ingredient-is-base').checked = ingredient.is_base;
    
    // Populate combo dropdown
    const comboSelect = document.getElementById('edit-ingredient-combo');
    
    // Clear existing options except the first one
    while (comboSelect.options.length > 1) {
        comboSelect.remove(1);
    }
    
    // Add combinations as options
    currentCombinations.forEach(combo => {
        const option = document.createElement('option');
        option.value = combo.combo_id;
        option.textContent = combo.name;
        if (ingredient.combo_id === combo.combo_id) {
            option.selected = true;
        }
        comboSelect.appendChild(option);
    });
    
    // Show the form
    editIngredientForm.style.display = 'block';
}

// Handle Edit Ingredient Submit
async function handleEditIngredientSubmit(e) {
    e.preventDefault();
    
    const ingId = document.getElementById('edit-ingredient-id').value;
    const name = document.getElementById('edit-ingredient-name').value;
    const isBase = document.getElementById('edit-ingredient-is-base').checked;
    const comboId = document.getElementById('edit-ingredient-combo').value;
    
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .update({ 
                name, 
                is_base: isBase,
                combo_id: comboId
            })
            .eq('ing_id', ingId)
            .select();
        
        if (error) throw error;
        
        showMessage('Ingredient updated successfully!', 'success');
        editIngredientForm.style.display = 'none';
        
        // Reload current recipe
        await loadRecipeData(currentRecipe.rec_id);
    } catch (error) {
        showMessage(`Error updating ingredient: ${error.message}`, 'error');
        console.error('Error updating ingredient:', error);
    }
}

// Show Edit Easter Egg Form
function showEditEasterEggForm(easterEgg) {
    // Hide other forms
    editRecipeForm.style.display = 'none';
    editComboForm.style.display = 'none';
    editIngredientForm.style.display = 'none';
    
    // Populate form fields
    document.getElementById('edit-easter-egg-id').value = easterEgg.egg_id;
    document.getElementById('edit-easter-egg-name').value = easterEgg.name;
    
    // Populate ingredient dropdowns
    const ing1Select = document.getElementById('edit-easter-egg-ing1');
    const ing2Select = document.getElementById('edit-easter-egg-ing2');
    
    // Clear existing options except the first one
    while (ing1Select.options.length > 1) ing1Select.remove(1);
    while (ing2Select.options.length > 1) ing2Select.remove(1);
    
    // Add ingredients to dropdowns
    allIngredients.forEach(ing => {
        const option1 = document.createElement('option');
        option1.value = ing.ing_id;
        option1.textContent = ing.name;
        if (easterEgg.ing_id_1 == ing.ing_id) {
            option1.selected = true;
        }
        ing1Select.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = ing.ing_id;
        option2.textContent = ing.name;
        if (easterEgg.ing_id_2 == ing.ing_id) {
            option2.selected = true;
        }
        ing2Select.appendChild(option2);
    });
    
    // Show the form
    editEasterEggForm.style.display = 'block';
}

// Handle Edit Easter Egg Submit
async function handleEditEasterEggSubmit(e) {
    e.preventDefault();
    
    const eggId = document.getElementById('edit-easter-egg-id').value;
    const name = document.getElementById('edit-easter-egg-name').value;
    const ing1 = document.getElementById('edit-easter-egg-ing1').value;
    const ing2 = document.getElementById('edit-easter-egg-ing2').value;
    
    if (ing1 === ing2) {
        showMessage('Please select two different ingredients', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('eastereggs')
            .update({ 
                name, 
                ing_id_1: ing1, 
                ing_id_2: ing2 
            })
            .eq('egg_id', eggId)
            .select();
        
        if (error) throw error;
        
        showMessage('Easter Egg updated successfully!', 'success');
        editEasterEggForm.style.display = 'none';
        
        // Reload Easter Eggs
        const { data: easterEggs, error: easterEggsError } = await supabase
            .from('eastereggs')
            .select('*')
            .eq('rec_id', currentRecipe.rec_id);
        
        if (easterEggsError) throw easterEggsError;
        
        currentEasterEggs = easterEggs || [];
        renderEasterEggs();
    } catch (error) {
        showMessage(`Error updating Easter Egg: ${error.message}`, 'error');
        console.error('Error updating Easter Egg:', error);
    }
}

// Handle Playtest Recipe
function handlePlaytestRecipe() {
    const recipeId = recipeSelect.value;
    if (!recipeId) {
        showMessage('Please select a recipe to playtest', 'error');
        return;
    }
    
    // Get the recipe date
    const recipe = currentRecipe;
    if (!recipe || !recipe.date) {
        showMessage('Recipe date not found', 'error');
        return;
    }
    
    // Create a URL with the recipe date as a parameter
    const gameUrl = `index.html?date=${recipe.date}`;
    
    // Open the game in a new tab
    window.open(gameUrl, '_blank');
} 