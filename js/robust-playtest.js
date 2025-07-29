// Robust Playtest Mode - Handles all edge cases and dependencies
// Usage: /robust-playtest.html?date=2025-04-11

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
    
    // Handle no date scenario
    if (!playtestDate) {
        document.addEventListener('DOMContentLoaded', () => {
            const errorMessage = document.getElementById('errorMessage');
            const loader = document.getElementById('loader');
            const loadingMessage = document.getElementById('loadingMessage');
            
            if (errorMessage) {
                errorMessage.innerHTML = 'No date specified. Use ?date=YYYY-MM-DD in the URL.<br><br>Example: /robust-playtest.html?date=2025-04-11';
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
    
    // Fix CORS issues with wallpaper loading by intercepting Image constructor
    const OriginalImage = window.Image;
    window.Image = function() {
        const img = new OriginalImage();
        
        // Store the original descriptor
        const originalSrc = Object.getOwnPropertyDescriptor(img, 'src') || 
                           Object.getOwnPropertyDescriptor(OriginalImage.prototype, 'src');
        
        // Override src property to handle wallpaper differently
        Object.defineProperty(img, 'src', {
            set: function(value) {
                // If it's a wallpaper SVG, handle it specially to avoid CORS issues
                if (value && value.includes('wallpaper') && value.endsWith('.svg')) {
                    console.log('🔧 Intercepted wallpaper SVG load, using fallback to avoid CORS');
                    
                    // Trigger immediate success with a simple canvas
                    setTimeout(() => {
                        // Set dimensions that sketch.js expects
                        Object.defineProperty(img, 'naturalWidth', { value: 221, writable: false });
                        Object.defineProperty(img, 'naturalHeight', { value: 150, writable: false });
                        Object.defineProperty(img, 'width', { value: 221, writable: false });
                        Object.defineProperty(img, 'height', { value: 150, writable: false });
                        
                        if (img.onload) {
                            img.onload(new Event('load'));
                        }
                    }, 10);
                    
                    // Don't actually load the SVG to avoid CORS
                    return;
                }
                // For other images, load normally
                originalSrc.set.call(this, value);
            },
            get: function() {
                return originalSrc.get.call(this);
            }
        });
        
        return img;
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.Image, OriginalImage);
    Object.setPrototypeOf(window.Image.prototype, OriginalImage.prototype);
    
    // Override canvas toDataURL to avoid tainted canvas error
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
        try {
            return originalToDataURL.apply(this, args);
        } catch (error) {
            if (error.name === 'SecurityError') {
                console.log('🔧 Bypassing tainted canvas error, returning blank data URL');
                // Return a simple 1x1 transparent PNG data URL
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            }
            throw error;
        }
    };
    
    // Store original fetchTodayRecipe function
    let originalFetchTodayRecipe;
    
    // Wait for dependencies and override fetch function
    const overrideFetchFunction = () => {
        if (typeof fetchTodayRecipe !== 'undefined' && 
            typeof processRecipeData !== 'undefined' &&
            typeof supabase !== 'undefined') {
            
            originalFetchTodayRecipe = fetchTodayRecipe;
            
            // Override fetchTodayRecipe to use our date
            window.fetchTodayRecipe = async function() {
                try {
                    console.log(`Robust playtest mode: Loading recipe for ${playtestDate}`);
                    
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
                    
                    // Process the recipe data
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
                        errorMessage.innerHTML = `Error: ${error.message}<br><br>Check console for details.`;
                    }
                    if (loader) loader.style.display = 'none';
                    
                    throw error;
                }
            };
            
            console.log('✅ Robust playtest mode initialized for date:', playtestDate);
            console.log('✅ All dependencies loaded successfully');
            
            // Also disable wallpaper animation to avoid issues
            if (typeof wallpaperImageReady !== 'undefined') {
                window.wallpaperImageReady = false;
            }
            
        } else {
            // Log what we're waiting for
            const missing = [];
            if (typeof fetchTodayRecipe === 'undefined') missing.push('fetchTodayRecipe');
            if (typeof processRecipeData === 'undefined') missing.push('processRecipeData');
            if (typeof supabase === 'undefined') missing.push('supabase');
            
            if (missing.length > 0) {
                console.log('⏳ Waiting for dependencies:', missing.join(', '));
            }
            
            // Try again in 100ms
            setTimeout(overrideFetchFunction, 100);
        }
    };
    
    // Start the override process
    overrideFetchFunction();
    
    // Set playtest flags
    window.isPlaytestMode = true;
    window.playtestDate = playtestDate;
    
    // Disable features that might cause issues in playtest
    window.disableWallpaperAnimation = true;
    window.disableGoogleFonts = true;
    
    // Log initialization
    console.log('🚀 Robust playtest mode starting...');
    console.log('📅 Target date:', playtestDate);
    console.log('🔧 CORS workarounds enabled');
    console.log('🔧 Canvas security bypasses enabled');
})();