// Playtest mode functionality
let selectedDate = null;
let isPlaytestMode = true;
let recipeLoadError = null;

// Store the original fetchTodayRecipe function
const originalFetchTodayRecipe = fetchTodayRecipe;

// Override the fetchTodayRecipe function to use the selected date
fetchTodayRecipe = async function() {
    if (!selectedDate) {
        throw new Error('No date selected');
    }
    
    try {
        console.log("Playtest: Fetching recipe for date:", selectedDate);
        
        // Query the recipes table for the selected date
        const { data: recipes, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('date', selectedDate);
        
        console.log("Playtest: Recipes data:", recipes);
        if (recipeError) {
            console.error("Playtest: Recipe error:", recipeError);
            throw recipeError;
        }
        
        if (!recipes || recipes.length === 0) {
            console.error("Playtest: No recipe found for selected date");
            throw new Error('No recipe found for selected date');
        }
        
        // Select the first recipe if multiple exist
        const recipe = recipes[0];
        console.log("Playtest: Selected recipe:", recipe);
        
        // Query combinations for this recipe
        const { data: combinations, error: combosError } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipe.rec_id);
        
        console.log("Playtest: Combinations data:", combinations);
        if (combosError) {
            console.error("Playtest: Combinations error:", combosError);
            throw combosError;
        }
        
        // Query ingredients for these combinations
        const comboIds = combinations.map(combo => combo.combo_id);
        const { data: ingredients, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .in('combo_id', comboIds);
        
        console.log("Playtest: Ingredients data:", ingredients);
        if (ingredientsError) {
            console.error("Playtest: Ingredients error:", ingredientsError);
            throw ingredientsError;
        }
        
        // Process the recipe data
        return processRecipeData(recipe, combinations, ingredients);
    } catch (error) {
        console.error("Playtest: Error fetching recipe:", error);
        recipeLoadError = error.message;
        throw error;
    }
};

// Function to load available dates from Supabase
async function loadAvailableDates() {
    try {
        document.getElementById('dateList').innerHTML = '<div class="date-item">Loading available dates...</div>';
        document.getElementById('errorMessage').textContent = '';
        
        // Query all recipes to get available dates
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('date, name, rec_id')
            .order('date', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (!recipes || recipes.length === 0) {
            document.getElementById('dateList').innerHTML = '<div class="date-item">No recipes found</div>';
            return;
        }
        
        // Group recipes by date
        const recipesByDate = {};
        recipes.forEach(recipe => {
            if (!recipesByDate[recipe.date]) {
                recipesByDate[recipe.date] = [];
            }
            recipesByDate[recipe.date].push(recipe);
        });
        
        // Create date items
        let dateListHTML = '';
        Object.keys(recipesByDate).sort().reverse().forEach(date => {
            const recipes = recipesByDate[date];
            const recipeNames = recipes.map(r => r.name).join(', ');
            dateListHTML += `
                <div class="date-item" data-date="${date}" title="${recipeNames}">
                    ${date} (${recipes.length})
                </div>
            `;
        });
        
        document.getElementById('dateList').innerHTML = dateListHTML;
        
        // Add click event listeners to date items
        document.querySelectorAll('.date-item').forEach(item => {
            item.addEventListener('click', function() {
                // Remove selected class from all items
                document.querySelectorAll('.date-item').forEach(i => i.classList.remove('selected'));
                // Add selected class to clicked item
                this.classList.add('selected');
                // Store selected date
                selectedDate = this.getAttribute('data-date');
                // Enable load button
                document.getElementById('loadButton').disabled = false;
            });
        });
        
    } catch (error) {
        console.error("Error loading available dates:", error);
        document.getElementById('dateList').innerHTML = '<div class="date-item">Error loading dates</div>';
        document.getElementById('errorMessage').textContent = error.message;
    }
}

// Function to start the game with the selected date
async function startPlaytest() {
    if (!selectedDate) {
        document.getElementById('errorMessage').textContent = 'Please select a date first';
        return;
    }
    
    try {
        // Show loading message
        document.getElementById('errorMessage').textContent = 'Loading recipe data...';
        document.getElementById('loadButton').disabled = true;
        
        // Reset error state
        recipeLoadError = null;
        
        // Load recipe data for the selected date
        console.log("Playtest: Loading recipe data for date:", selectedDate);
        isLoadingRecipe = true;
        
        // Fetch recipe data
        const recipeData = await fetchTodayRecipe();
        
        console.log("Playtest: Recipe data received:", recipeData);
        console.log("Playtest: Intermediate combinations:", recipeData?.intermediateCombinations);
        console.log("Playtest: Final combination:", recipeData?.finalCombination);
        console.log("Playtest: Base ingredients:", recipeData?.baseIngredients);
        
        if (recipeData && recipeData.intermediateCombinations && recipeData.finalCombination && recipeData.baseIngredients) {
            // Update game variables with recipe data
            console.log("Playtest: Successfully loaded recipe data:", recipeData);
            intermediate_combinations = recipeData.intermediateCombinations;
            final_combination = recipeData.finalCombination;
            ingredients = recipeData.baseIngredients;
            recipeUrl = recipeData.recipeUrl || "https://www.example.com/recipe";
            
            // Reset game state
            vessels = [];
            gameWon = false;
            turnCounter = 0;
            moveHistory = [];
            animations = [];
            hintVessel = null;
            showingHint = false;
            
            // Hide date selector
            document.getElementById('dateSelector').style.display = 'none';
            
            // Initialize the game with the loaded recipe data
            isLoadingRecipe = false;
            initializeGame();
            startGame();
        } else {
            throw new Error("Invalid recipe data format. Check the console for details.");
        }
    } catch (error) {
        console.error("Playtest: Error starting game:", error);
        recipeLoadError = error.message;
        document.getElementById('errorMessage').textContent = `Error: ${error.message}`;
        document.getElementById('loadButton').disabled = false;
    }
}

// Function to debug the selected date
async function debugSelectedDate() {
    if (!selectedDate) {
        document.getElementById('errorMessage').textContent = 'Please select a date first';
        return;
    }
    
    try {
        // Show loading message
        document.getElementById('errorMessage').textContent = 'Debugging recipe data...';
        document.getElementById('debugButton').disabled = true;
        
        // Get the debug output element
        const debugOutput = document.getElementById('debugOutput');
        debugOutput.style.display = 'block';
        debugOutput.innerHTML = '<p>Loading data...</p>';
        
        // Query the recipes table for the selected date
        const { data: recipes, error: recipeError } = await supabase
            .from('recipes')
            .select('*')
            .eq('date', selectedDate);
        
        if (recipeError) {
            throw recipeError;
        }
        
        if (!recipes || recipes.length === 0) {
            debugOutput.innerHTML = '<p>No recipes found for this date.</p>';
            return;
        }
        
        // Select the first recipe
        const recipe = recipes[0];
        
        // Query combinations for this recipe
        const { data: combinations, error: combosError } = await supabase
            .from('combinations')
            .select('*')
            .eq('rec_id', recipe.rec_id);
        
        if (combosError) {
            throw combosError;
        }
        
        // Query ingredients for these combinations
        const comboIds = combinations.map(combo => combo.combo_id);
        const { data: ingredients, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .in('combo_id', comboIds);
        
        if (ingredientsError) {
            throw ingredientsError;
        }
        
        // Process the data
        const processedData = processRecipeData(recipe, combinations, ingredients);
        
        // Display the debug information
        let html = `
            <h3>Recipe Data for ${selectedDate}</h3>
            <h4>Raw Data</h4>
            <p><strong>Recipe:</strong> ${recipe.name} (ID: ${recipe.rec_id})</p>
            <p><strong>Combinations:</strong> ${combinations.length}</p>
            <p><strong>Ingredients:</strong> ${ingredients.length}</p>
            
            <h4>Processed Data</h4>
            <p><strong>Recipe Name:</strong> ${processedData?.recipeName || 'N/A'}</p>
            <p><strong>Recipe URL:</strong> ${processedData?.recipeUrl || 'N/A'}</p>
            <p><strong>Intermediate Combinations:</strong> ${processedData?.intermediateCombinations?.length || 0}</p>
            <p><strong>Final Combination:</strong> ${processedData?.finalCombination?.name || 'N/A'}</p>
            <p><strong>Base Ingredients:</strong> ${processedData?.baseIngredients?.length || 0}</p>
            
            <h4>Detailed Information</h4>
            <details>
                <summary>Intermediate Combinations</summary>
                <pre>${JSON.stringify(processedData?.intermediateCombinations || [], null, 2)}</pre>
            </details>
            <details>
                <summary>Final Combination</summary>
                <pre>${JSON.stringify(processedData?.finalCombination || {}, null, 2)}</pre>
            </details>
            <details>
                <summary>Base Ingredients</summary>
                <pre>${JSON.stringify(processedData?.baseIngredients || [], null, 2)}</pre>
            </details>
        `;
        
        debugOutput.innerHTML = html;
    } catch (error) {
        console.error("Debug error:", error);
        document.getElementById('debugOutput').innerHTML = `<p>Error: ${error.message}</p>`;
    } finally {
        document.getElementById('debugButton').disabled = false;
        document.getElementById('errorMessage').textContent = '';
    }
}

// Initialize playtest mode when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load available dates
    loadAvailableDates();
    
    // Add event listener to load button
    document.getElementById('loadButton').addEventListener('click', startPlaytest);
    
    // Add event listener to refresh button
    document.getElementById('refreshButton').addEventListener('click', loadAvailableDates);
    
    // Add event listener to debug button
    document.getElementById('debugButton').addEventListener('click', debugSelectedDate);
});

// Override the setup function to not start the game automatically
const originalSetup = window.setup;
window.setup = function() {
    // Call the original setup but don't start the game yet
    originalSetup();
    // Don't call startGame() here, we'll call it after date selection
}; 