// Simple Playtest Mode - Reads date from URL parameter
// Usage: /simple-playtest.html?date=2025-04-11

(function() {
    // Get date from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const playtestDate = urlParams.get('date');
    const showBackLink = urlParams.get('admin') === 'true';
    
    // Show back link if coming from admin
    if (showBackLink) {
        document.addEventListener('DOMContentLoaded', () => {
            const backLink = document.getElementById('backLink');
            if (backLink) backLink.style.display = 'block';
        });
    }
    
    // If no date provided, show error
    if (!playtestDate) {
        document.addEventListener('DOMContentLoaded', () => {
            const errorMessage = document.getElementById('errorMessage');
            const loader = document.getElementById('loader');
            const loadingMessage = document.getElementById('loadingMessage');
            
            if (errorMessage) {
                errorMessage.textContent = 'No date specified. Use ?date=YYYY-MM-DD in the URL.';
                errorMessage.innerHTML += '<br><br>Example: /simple-playtest.html?date=2025-04-11';
            }
            if (loader) loader.style.display = 'none';
            if (loadingMessage) loadingMessage.style.display = 'none';
        });
        return;
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(playtestDate)) {
        document.addEventListener('DOMContentLoaded', () => {
            const errorMessage = document.getElementById('errorMessage');
            const loader = document.getElementById('loader');
            const loadingMessage = document.getElementById('loadingMessage');
            
            if (errorMessage) {
                errorMessage.textContent = `Invalid date format: ${playtestDate}. Use YYYY-MM-DD format.`;
            }
            if (loader) loader.style.display = 'none';
            if (loadingMessage) loadingMessage.style.display = 'none';
        });
        return;
    }
    
    // Update loading message with date
    document.addEventListener('DOMContentLoaded', () => {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.textContent = `Loading recipe for ${playtestDate}...`;
        }
    });
    
    // Store original fetchTodayRecipe function
    let originalFetchTodayRecipe;
    
    // Wait for the original function to be defined, then override it
    const overrideFetchFunction = () => {
        if (typeof fetchTodayRecipe !== 'undefined') {
            originalFetchTodayRecipe = fetchTodayRecipe;
            
            // Override fetchTodayRecipe to use our date
            window.fetchTodayRecipe = async function() {
                try {
                    console.log(`Playtest mode: Loading recipe for ${playtestDate}`);
                    
                    // Query the recipe for the specified date
                    const { data: recipes, error: recipeError } = await supabase
                        .from('recipes')
                        .select('*')
                        .eq('date', playtestDate);
                    
                    if (recipeError) throw recipeError;
                    
                    if (!recipes || recipes.length === 0) {
                        throw new Error(`No recipe found for date: ${playtestDate}`);
                    }
                    
                    const recipe = recipes[0];
                    console.log('Found recipe:', recipe.name);
                    
                    // Get combinations for this recipe
                    const { data: combinations, error: combosError } = await supabase
                        .from('combinations')
                        .select('*')
                        .eq('rec_id', recipe.rec_id);
                    
                    if (combosError) throw combosError;
                    
                    // Get ingredients for these combinations
                    const comboIds = combinations.map(combo => combo.combo_id);
                    const { data: ingredients, error: ingredientsError } = await supabase
                        .from('ingredients')
                        .select('*')
                        .in('combo_id', comboIds);
                    
                    if (ingredientsError) throw ingredientsError;
                    
                    // Get easter eggs for this recipe (optional)
                    const { data: easterEggs, error: easterEggsError } = await supabase
                        .from('eastereggs')
                        .select('*')
                        .eq('rec_id', recipe.rec_id);
                    
                    if (easterEggsError) {
                        console.warn('Error fetching easter eggs:', easterEggsError);
                    }
                    
                    // Process the recipe data (using the existing function)
                    const processedData = processRecipeData(recipe, combinations, ingredients, easterEggs || []);
                    
                    // Hide loading overlay once recipe is loaded
                    setTimeout(() => {
                        const overlay = document.getElementById('loadingOverlay');
                        if (overlay) overlay.classList.add('hidden');
                    }, 500);
                    
                    return processedData;
                    
                } catch (error) {
                    console.error('Error loading playtest recipe:', error);
                    
                    // Show error in UI
                    const errorMessage = document.getElementById('errorMessage');
                    const loader = document.getElementById('loader');
                    
                    if (errorMessage) {
                        errorMessage.textContent = `Error: ${error.message}`;
                    }
                    if (loader) loader.style.display = 'none';
                    
                    throw error;
                }
            };
            
            console.log('Playtest mode initialized for date:', playtestDate);
        } else {
            // Try again in 100ms if function not yet defined
            setTimeout(overrideFetchFunction, 100);
        }
    };
    
    // Start the override process
    overrideFetchFunction();
    
    // Also set a flag that can be checked by other scripts
    window.isPlaytestMode = true;
    window.playtestDate = playtestDate;
})();