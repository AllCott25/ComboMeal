// Admin Panel for Culinary Logic Puzzle

// Add styles for messages
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    .messages-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background: #f9f9f9;
    }

    .message-item {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
        background: white;
        margin: 8px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .message-item:last-child {
        border-bottom: none;
    }

    .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.9em;
        color: #666;
    }

    .message-date {
        color: #888;
    }

    .message-email {
        color: #2196F3;
        font-weight: 500;
    }

    .message-content {
        color: #333;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .recipe-summary-stats span {
        margin-right: 12px;
        padding: 2px 8px;
        background: #f0f0f0;
        border-radius: 12px;
        font-size: 0.9em;
    }
`;
document.head.appendChild(messageStyles);

const nonInteractiveTextStyle = document.createElement('style');
nonInteractiveTextStyle.textContent = `
    .non-interactive-text {
        padding: 8px;
        background-color: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        min-height: 24px; /* Ensure it has some height even when empty */
        color: #333;
        font-size: 0.9em;
    }
`;
document.head.appendChild(nonInteractiveTextStyle);

// Initialize Supabase client
const SUPABASE_URL = 'https://ovrvtfjejmhrflybslwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-Ot4NABXzxSVHGtNYNFuLMWE1JDyjAk';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Test Elements
const testRecipeSelect = document.getElementById('test-recipe');
const testButton = document.getElementById('test-button');
const testOutput = document.getElementById('test-output');

// Analytics Elements - APlasker
const analyticsPeriodSelect = document.getElementById('analytics-period');
const refreshAnalyticsButton = document.getElementById('refresh-analytics');
const analyticsLoading = document.getElementById('analytics-loading');
const totalSessionsElement = document.getElementById('total-sessions');
const completionRateElement = document.getElementById('completion-rate');
const avgTimeElement = document.getElementById('avg-time');
const avgHintsElement = document.getElementById('avg-hints');
const calendarContainer = document.getElementById('calendar-container');
const recipeAnalyticsList = document.getElementById('recipe-analytics-list');

// Planning Elements - APlasker
const planningCalendarGrid = document.getElementById('planning-calendar-grid');
const recipeCardsContainer = document.getElementById('recipe-cards-container');
const recipeEditModal = document.getElementById('recipe-edit-modal');
const recipeEditForm = document.getElementById('recipe-edit-form');
const currentMonthYearElement = document.getElementById('current-month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const recipeSearchInput = document.getElementById('recipe-search');
const recipeSortSelect = document.getElementById('recipe-sort');
const closeModalButton = document.getElementById('close-modal');
const cancelEditButton = document.getElementById('cancel-edit');
const planningMessagesElement = document.getElementById('planning-messages');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Planning State Variables - APlasker  
let currentPlanningDate = new Date();
let allPlanningRecipes = [];
let filteredRecipes = [];
let draggedRecipe = null;
let pendingChanges = new Map(); // Store pending date changes
let originalDates = new Map(); // Store original dates for revert

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
    
    // Test Button
    testButton.addEventListener('click', handleTestRecipe);
    
    // Analytics - APlasker
    refreshAnalyticsButton.addEventListener('click', loadAnalyticsData);
    analyticsPeriodSelect.addEventListener('change', loadAnalyticsData);
    
    // Planning - APlasker
    prevMonthButton.addEventListener('click', () => navigateMonth(-1));
    nextMonthButton.addEventListener('click', () => navigateMonth(1));
    recipeSearchInput.addEventListener('input', filterRecipes);
    recipeSortSelect.addEventListener('change', filterRecipes);
    closeModalButton.addEventListener('click', closeRecipeModal);
    cancelEditButton.addEventListener('click', closeRecipeModal);
    recipeEditForm.addEventListener('submit', handleRecipeEdit);
    
    // Modal click outside to close
    recipeEditModal.addEventListener('click', (e) => {
        if (e.target === recipeEditModal) {
            closeRecipeModal();
        }
    });

    // Playtest button logic for recipe modal - APlasker
    const playtestBtn = document.getElementById('playtest-recipe-btn');
    const dateInput = document.getElementById('edit-recipe-date');
    function updatePlaytestBtn() {
        const date = dateInput.value;
        if (date) {
            playtestBtn.disabled = false;
            playtestBtn.onclick = () => {
                window.open(`index.html?date=${date}`, '_blank');
            };
        } else {
            playtestBtn.disabled = true;
            playtestBtn.onclick = null;
        }
    }
    if (playtestBtn && dateInput) {
        updatePlaytestBtn();
        dateInput.addEventListener('input', updatePlaytestBtn);
    }
});

// Handle Login with enhanced security
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Use AdminAuth for secure login
        const result = await AdminAuth.adminLogin(email, password);
        
        if (result.success) {
            showAdminPanel();
            loadFormData();
            loginError.textContent = '';
        }
    } catch (error) {
        loginError.textContent = `Login failed: ${error.message}`;
        console.error('Admin login error:', error);
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
    
    // Load analytics data when analytics tab is selected - APlasker
    if (tabId === 'analytics-section') {
        loadAnalyticsData();
    }
    
    // Load planning data when planning tab is selected - APlasker
    if (tabId === 'planning-section') {
        loadPlanningData();
    }
}

// Load Form Data
async function loadFormData() {
    await loadRecipes();
}

// Load Recipes
async function loadRecipes() {
    try {
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        // Populate test recipe dropdown
        const testRecipeDropdown = document.getElementById('test-recipe');
        testRecipeDropdown.innerHTML = '';
            recipes.forEach(recipe => {
                const option = document.createElement('option');
                option.value = recipe.rec_id;
                option.textContent = `${recipe.name} (${recipe.date})`;
            testRecipeDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading recipes:', error);
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

// ============================================================================
// ANALYTICS FUNCTIONS - APlasker
// ============================================================================

// Load Analytics Data
async function loadAnalyticsData() {
    console.log("Loading analytics data...");
    
    // Show loading state
    analyticsLoading.classList.remove('hidden');
    
    try {
        const period = analyticsPeriodSelect.value;
        
        // Load summary statistics
        await loadSummaryStats(period);
        
        // Load recipe analytics
        await loadRecipeAnalytics(period);
        
        // Load calendar view
        await loadCalendarView(period);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showMessage(document.querySelector('#analytics-section'), `Error loading analytics: ${error.message}`, 'error');
    } finally {
        // Hide loading state
        analyticsLoading.classList.add('hidden');
    }
}

// Load Summary Statistics
async function loadSummaryStats(period) {
    const dateFilter = getDateFilter(period);
    
    // Get total sessions
    const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('session_id, win_condition, total_time_seconds, hints_used, play_url')
        .gte('started_at', dateFilter.start)
        .lte('started_at', dateFilter.end);
    
    if (sessionsError) throw sessionsError;
    
    // Filter out local file testing sessions
    const filteredSessions = sessions.filter(s => !s.play_url || !s.play_url.startsWith('file://'));
    
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.win_condition === 'completed').length;
    const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;
    
    // Calculate averages for completed sessions only
    const completedSessionsData = filteredSessions.filter(s => s.win_condition === 'completed' && s.total_time_seconds);
    const avgTime = completedSessionsData.length > 0 
        ? Math.round(completedSessionsData.reduce((sum, s) => sum + s.total_time_seconds, 0) / completedSessionsData.length)
        : 0;
    const avgHints = totalSessions > 0 
        ? (filteredSessions.reduce((sum, s) => sum + (s.hints_used || 0), 0) / totalSessions).toFixed(1)
        : 0;
    
    // Update UI
    totalSessionsElement.textContent = totalSessions.toLocaleString();
    completionRateElement.textContent = `${completionRate}%`;
    avgTimeElement.textContent = formatDuration(avgTime);
    avgHintsElement.textContent = avgHints;
}

// Load Recipe Analytics
async function loadRecipeAnalytics(period) {
    const dateFilter = getDateFilter(period);
    
    // Get all recipes with their analytics and messages
    const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select(`
            rec_id,
            name,
            date,
            img_url,
            game_sessions!game_sessions_rec_id_fkey (
                session_id,
                win_condition,
                total_time_seconds,
                hints_used,
                easter_eggs_found,
                goto_recipe,
                goto_share,
                play_url,
                started_at,
                mistakes_total
            ),
            SayHi!recipe_uuid (
                created_at,
                email_hi,
                comment_hi
            )
        `)
        .gte('date', dateFilter.start)
        .lte('date', dateFilter.end)
        .order('date', { ascending: true });
    
    if (recipesError) throw recipesError;
    
    // Process and display recipe analytics
    recipeAnalyticsList.innerHTML = '';
    
    recipes.forEach(recipe => {
        const sessions = recipe.game_sessions || [];
        const messages = recipe.SayHi || [];
        const analytics = calculateRecipeAnalytics(sessions, messages);
        
        const recipeCard = createAnalyticsRecipeCard(recipe, analytics);
        recipeAnalyticsList.appendChild(recipeCard);
    });
}

// Calculate Recipe Analytics
function calculateRecipeAnalytics(sessions, messages) {
    // Filter out local file testing sessions
    const filteredSessions = sessions.filter(s => !s.play_url || !s.play_url.startsWith('file://'));
    
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(s => s.win_condition === 'completed');
    const abandonedSessions = filteredSessions.filter(s => s.win_condition === 'abandoned');
    
    const completionRate = totalSessions > 0 ? ((completedSessions.length / totalSessions) * 100).toFixed(1) : 0;
    
    // Calculate averages for completed sessions
    const completedWithTime = completedSessions.filter(s => s.total_time_seconds);
    const avgTime = completedWithTime.length > 0 
        ? Math.round(completedWithTime.reduce((sum, s) => sum + s.total_time_seconds, 0) / completedWithTime.length)
        : 0;
    
    const avgHints = totalSessions > 0 
        ? (filteredSessions.reduce((sum, s) => sum + (s.hints_used || 0), 0) / totalSessions).toFixed(1)
        : 0;
    
    const avgEasterEggs = totalSessions > 0 
        ? (filteredSessions.reduce((sum, s) => sum + (s.easter_eggs_found || 0), 0) / totalSessions).toFixed(1)
        : 0;
    
    const recipeClickRate = totalSessions > 0 
        ? ((filteredSessions.filter(s => s.goto_recipe).length / totalSessions) * 100).toFixed(1)
        : 0;
    
    const shareClickRate = totalSessions > 0 
        ? ((filteredSessions.filter(s => s.goto_share).length / totalSessions) * 100).toFixed(1)
        : 0;
    
    // Calculate mistake distribution and average
    const mistakeDistribution = {
        0: 0, 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0
    };
    
    let totalMistakes = 0;
    filteredSessions.forEach(session => {
        const mistakes = session.mistakes_total || 0;
        totalMistakes += mistakes;
        if (mistakes >= 5) {
            mistakeDistribution['5+']++;
        } else {
            mistakeDistribution[mistakes]++;
        }
    });
    
    const avgMistakes = totalSessions > 0 ? (totalMistakes / totalSessions).toFixed(1) : 0;
    
    // Calculate percentages for mistake distribution
    const mistakePercentages = {};
    Object.keys(mistakeDistribution).forEach(key => {
        mistakePercentages[key] = totalSessions > 0 
            ? ((mistakeDistribution[key] / totalSessions) * 100).toFixed(1)
            : 0;
    });
    
    // Analyze URL patterns (excluding local file testing URLs)
    const urlAnalysis = analyzeUrlPatterns(filteredSessions);
    
    // Process messages
    const processedMessages = messages
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(msg => ({
            date: new Date(msg.created_at),
            email: msg.email_hi,
            comment: msg.comment_hi
        }));

    return {
        totalSessions,
        completedSessions: completedSessions.length,
        abandonedSessions: abandonedSessions.length,
        completionRate,
        avgTime,
        avgHints,
        avgEasterEggs,
        recipeClickRate,
        shareClickRate,
        urlAnalysis,
        messages: processedMessages,
        totalMessages: processedMessages.length,
        mistakeDistribution,
        mistakePercentages,
        avgMistakes
    };
}

// Analyze URL patterns for sessions - APlasker
function analyzeUrlPatterns(sessions) {
    const urlCounts = {};
    const urlTypes = {
        main: 0,        // Main site (no query params)
        playtest: 0,    // Playtest URLs (with ?date= param)
        tutorial: 0,    // Tutorial URLs (with tutorial param)
        other: 0        // Other URLs
    };
    
    sessions.forEach(session => {
        const url = session.play_url;
        if (!url) return;
        
        // Count exact URLs
        urlCounts[url] = (urlCounts[url] || 0) + 1;
        
        // Categorize URL types
        if (url.includes('?date=')) {
            urlTypes.playtest++;
        } else if (url.includes('tutorial') || url.includes('?tutorial')) {
            urlTypes.tutorial++;
        } else if (url.includes('?') || url.includes('#')) {
            urlTypes.other++;
        } else {
            urlTypes.main++;
        }
    });
    
    // Get most common URLs (top 3)
    const topUrls = Object.entries(urlCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([url, count]) => ({ url, count }));
    
    return {
        urlTypes,
        topUrls,
        totalUrls: Object.keys(urlCounts).length
    };
}

// Create Recipe Card
function createAnalyticsRecipeCard(recipe, analytics) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const hasImage = recipe.img_url;
    const imageElement = hasImage 
        ? `<img src="${recipe.img_url}" alt="${recipe.name}" class="recipe-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="recipe-image placeholder" style="display:none;">🍽️</div>`
        : `<div class="recipe-image placeholder">🍽️</div>`;

    // Create mistake distribution graph with average
    const mistakeGraph = `
        <div class="metric-section">
            <div class="metric-section-title">Mistake Distribution</div>
            <div class="mistake-graph">
                <div class="mistake-bars">
                    ${Object.entries(analytics.mistakeDistribution).map(([mistakes, count]) => {
                        const percentage = analytics.mistakePercentages[mistakes];
                        const height = Math.max(percentage * 2, 4); // Scale percentage to pixels, minimum 4px
                        return `
                            <div class="mistake-bar-container">
                                <div class="mistake-bar" style="height: ${height}px"></div>
                                <div class="mistake-bar-label">${mistakes}</div>
                                <div class="mistake-bar-value">${count}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mistake-average">
                    Average Mistakes: <strong>${analytics.avgMistakes}</strong>
                </div>
            </div>
        </div>
    `;

    // Create messages section
    const messagesSection = analytics.messages.length > 0 ? `
        <div class="metric-section">
            <div class="metric-section-title">User Messages (${analytics.totalMessages})</div>
            <div class="messages-list">
                ${analytics.messages.map(msg => `
                    <div class="message-item">
                        <div class="message-header">
                            <span class="message-date">${formatMessageDate(msg.date)}</span>
                            <span class="message-email">${msg.email}</span>
                        </div>
                        <div class="message-content">${escapeHtml(msg.comment)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    // Merge Traffic Sources and Top URLs sections
    const trafficSection = `
        <div class="metric-section">
            <div class="metric-section-title">Traffic Analysis</div>
            <div class="traffic-stats">
                <div class="metric-item">
                    <div class="metric-label">Main Site</div>
                    <div class="metric-value">${analytics.urlAnalysis.urlTypes.main}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Playtest URLs</div>
                    <div class="metric-value">${analytics.urlAnalysis.urlTypes.playtest}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Tutorial Mode</div>
                    <div class="metric-value">${analytics.urlAnalysis.urlTypes.tutorial}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Other URLs</div>
                    <div class="metric-value">${analytics.urlAnalysis.urlTypes.other}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-label">Unique URLs</div>
                    <div class="metric-value">${analytics.urlAnalysis.totalUrls}</div>
                </div>
            </div>
            ${analytics.urlAnalysis.topUrls.length > 0 ? `
                <div class="top-urls">
                    <h4>Top Traffic Sources</h4>
                    ${analytics.urlAnalysis.topUrls.map(urlData => `
                        <div class="url-item">
                            <div class="url-path">${formatUrlForDisplay(urlData.url)}</div>
                            <div class="url-count">${urlData.count} plays</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;

    card.innerHTML = `
        <div class="recipe-header" onclick="toggleRecipeDetails(this)">
            ${imageElement}
            <div class="recipe-info">
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-date">${formatDate(recipe.date)}</div>
                <div class="recipe-summary-stats">
                    <span>${analytics.totalSessions} plays</span>
                    <span>${analytics.completionRate}% completion</span>
                    <span>Avg. ${analytics.avgMistakes} mistakes</span>
                    ${analytics.totalMessages > 0 ? `<span>${analytics.totalMessages} messages</span>` : ''}
                </div>
            </div>
            <div class="recipe-expand-icon">▼</div>
        </div>
        <div class="recipe-details">
            <div class="recipe-metrics">
                <div class="metric-section">
                    <div class="metric-section-title">Game Performance</div>
                    <div class="metric-item">
                        <div class="metric-label">Total Sessions</div>
                        <div class="metric-value">${analytics.totalSessions}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Completed</div>
                        <div class="metric-value">${analytics.completedSessions}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Abandoned</div>
                        <div class="metric-value">${analytics.abandonedSessions}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Completion Rate</div>
                        <div class="metric-value">${analytics.completionRate}%</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Avg. Time</div>
                        <div class="metric-value">${formatDuration(analytics.avgTime)}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Avg. Hints</div>
                        <div class="metric-value">${analytics.avgHints}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Avg. Easter Eggs</div>
                        <div class="metric-value">${analytics.avgEasterEggs}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Recipe Clicks</div>
                        <div class="metric-value">${analytics.recipeClickRate}%</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Share Clicks</div>
                        <div class="metric-value">${analytics.shareClickRate}%</div>
                    </div>
                </div>
                ${mistakeGraph}
                ${trafficSection}
                ${messagesSection}
            </div>
        </div>
    `;
    
    return card;
}

// Format Message Date
function formatMessageDate(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Use SecurityUtils for HTML escaping
const escapeHtml = SecurityUtils.escapeHtml;

// Toggle Recipe Details
function toggleRecipeDetails(headerElement) {
    const card = headerElement.closest('.recipe-card');
    card.classList.toggle('expanded');
}

// Load Calendar View
async function loadCalendarView(period) {
    const dateFilter = getDateFilter(period);
    
    // Get recipes and their session counts for the period
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
            rec_id,
            name,
            date,
            game_sessions!game_sessions_rec_id_fkey (
                session_id,
                win_condition
            )
        `)
        .gte('date', dateFilter.start)
        .lte('date', dateFilter.end)
        .order('date', { ascending: true });
    
    if (error) throw error;
    
    // Create calendar navigation controls
    const calendarNav = `
        <div class="calendar-header">
            <button class="calendar-nav-btn" onclick="navigateAnalyticsCalendar(-1)">←</button>
            <span id="analytics-current-period"></span>
            <button class="calendar-nav-btn" onclick="navigateAnalyticsCalendar(1)">→</button>
        </div>
    `;
    
    // Create calendar grid
    const calendar = createCalendarGrid(dateFilter, recipes);
    calendarContainer.innerHTML = calendarNav + calendar;
    
    // Update period display
    updateAnalyticsPeriodDisplay(dateFilter);
}

// Add navigation function for analytics calendar
let currentAnalyticsDate = new Date();

function navigateAnalyticsCalendar(direction) {
    const period = analyticsPeriodSelect.value;
    
    if (period === 'week') {
        // Move by weeks
        currentAnalyticsDate.setDate(currentAnalyticsDate.getDate() + (direction * 7));
    } else if (period === 'month') {
        // Move by months
        currentAnalyticsDate.setMonth(currentAnalyticsDate.getMonth() + direction);
    }
    
    loadAnalyticsData();
}

// Update period display
function updateAnalyticsPeriodDisplay(dateFilter) {
    const periodDisplay = document.getElementById('analytics-current-period');
    const period = analyticsPeriodSelect.value;
    
    if (period === 'week') {
        const start = new Date(dateFilter.start);
        const end = new Date(dateFilter.end);
        periodDisplay.textContent = `${formatDate(start)} - ${formatDate(end)}`;
    } else if (period === 'month') {
        const date = new Date(dateFilter.start);
        periodDisplay.textContent = date.toLocaleString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    } else {
        periodDisplay.textContent = 'All Time';
    }
}

// Update getDateFilter to use currentAnalyticsDate
function getDateFilter(period) {
    const now = currentAnalyticsDate;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
        case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
            return {
                start: startOfWeek.toISOString().split('T')[0],
                end: endOfWeek.toISOString().split('T')[0]
            };
            
        case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return {
                start: startOfMonth.toISOString().split('T')[0],
                end: endOfMonth.toISOString().split('T')[0]
            };
            
        case 'all':
        default:
            return {
                start: '2020-01-01', // Very early date
                end: '2030-12-31'    // Very late date
            };
    }
}

// Update createCalendarGrid to show pending changes
function createCalendarGrid(dateFilter, recipes) {
    const start = new Date(dateFilter.start);
    const end = new Date(dateFilter.end);
    const today = new Date();
    const period = analyticsPeriodSelect.value;
    
    // Create recipe map by date
    const recipeMap = {};
    recipes.forEach(recipe => {
        const sessions = recipe.game_sessions || [];
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.win_condition === 'completed').length;
        const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        
        // Calculate average mistakes
        const totalMistakes = sessions.reduce((sum, s) => sum + (s.mistakes_total || 0), 0);
        const avgMistakes = totalSessions > 0 ? (totalMistakes / totalSessions).toFixed(1) : 0;
        
        const date = pendingChanges.has(recipe.rec_id) ? pendingChanges.get(recipe.rec_id) : recipe.date;
        
        recipeMap[date] = {
            rec_id: recipe.rec_id,
            name: recipe.name,
            totalSessions,
            completionRate,
            avgMistakes,
            hasPendingChange: pendingChanges.has(recipe.rec_id)
        };
    });
    
    let calendarHtml = '<div class="calendar-grid">';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        calendarHtml += `<div class="calendar-header-cell">${day}</div>`;
    });
    
    if (period === 'week') {
        // For week view, just show the exact week (Sunday to Saturday)
        const current = new Date(start);
        
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const isToday = current.toDateString() === today.toDateString();
            const recipe = recipeMap[dateStr];
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (recipe) {
                dayClass += ' has-recipe';
                if (recipe.hasPendingChange) dayClass += ' has-pending-change';
            }
            
            calendarHtml += `
                <div class="${dayClass}">
                    <div class="calendar-date">${current.getDate()}</div>
                    ${recipe ? `
                        <div class="calendar-recipe">${recipe.name}</div>
                        <div class="calendar-stats">
                            ${recipe.totalSessions} plays • ${recipe.completionRate}%
                            <br>Avg. ${recipe.avgMistakes} mistakes
                        </div>
                    ` : ''}
                </div>
            `;
            
            current.setDate(current.getDate() + 1);
        }
    } else {
        // For month view, show the full month grid
        const firstDay = new Date(start);
        firstDay.setDate(1);
        const startingDayOfWeek = firstDay.getDay();
        
        // Get first day of the grid (last days of previous month if needed)
        const gridStart = new Date(firstDay);
        gridStart.setDate(1 - startingDayOfWeek);
        
        // Calculate last day to show
        const lastDay = new Date(end);
        const endingDayOfWeek = lastDay.getDay();
        const gridEnd = new Date(lastDay);
        gridEnd.setDate(lastDay.getDate() + (6 - endingDayOfWeek));
        
        const current = new Date(gridStart);
        
        while (current <= gridEnd) {
            const dateStr = current.toISOString().split('T')[0];
            const isToday = current.toDateString() === today.toDateString();
            const isCurrentMonth = current.getMonth() === start.getMonth();
            const recipe = recipeMap[dateStr];
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isToday) dayClass += ' today';
            if (recipe) {
                dayClass += ' has-recipe';
                if (recipe.hasPendingChange) dayClass += ' has-pending-change';
            }
            
            calendarHtml += `
                <div class="${dayClass}">
                    <div class="calendar-date">${current.getDate()}</div>
                    ${recipe ? `
                        <div class="calendar-recipe">${recipe.name}</div>
                        <div class="calendar-stats">
                            ${recipe.totalSessions} plays • ${recipe.completionRate}%
                            <br>Avg. ${recipe.avgMistakes} mistakes
                        </div>
                    ` : ''}
                </div>
            `;
            
            current.setDate(current.getDate() + 1);
        }
    }
    
    calendarHtml += '</div>';
    return calendarHtml;
}

// Format Duration (seconds to MM:SS)
function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format Date
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Utility function to show messages
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
} 

// ============================================================================
// PLANNING CALENDAR FUNCTIONS - APlasker
// ============================================================================

// Load Planning Data
async function loadPlanningData() {
    console.log("Loading planning data...");
    
    try {
        // Ensure planning section structure exists
        const planningSection = document.getElementById('planning-section');
        if (!planningSection.querySelector('.planning-container')) {
            planningSection.innerHTML = `
                <div class="planning-container">
                    <div class="planning-calendar">
                        <div class="calendar-header">
                            <button id="prev-month" class="calendar-nav-btn">←</button>
                            <h2 id="current-month-year"></h2>
                            <button id="next-month" class="calendar-nav-btn">→</button>
                        </div>
                        <div id="planning-calendar-grid" class="planning-calendar-grid"></div>
                    </div>
                    <div class="recipe-panel">
                        <div class="recipe-filter">
                            <input type="text" id="recipe-search" placeholder="Search recipes...">
                            <select id="recipe-sort">
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="author">Sort by Author</option>
                            </select>
                        </div>
                        <div id="recipe-cards-container" class="recipe-cards-container"></div>
                    </div>
                </div>
                <div id="planning-messages" class="message"></div>
            `;
            
            // Add event listeners for navigation
            document.getElementById('prev-month').addEventListener('click', () => navigateMonth(-1));
            document.getElementById('next-month').addEventListener('click', () => navigateMonth(1));
            document.getElementById('recipe-search').addEventListener('input', filterRecipes);
            document.getElementById('recipe-sort').addEventListener('change', filterRecipes);
        }
        
        // Load all recipes
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        allPlanningRecipes = recipes || [];
        filteredRecipes = [...allPlanningRecipes];
        
        // Clear pending changes and store original dates
        pendingChanges.clear();
        originalDates.clear();
        allPlanningRecipes.forEach(recipe => {
            if (recipe.date) {
                originalDates.set(recipe.rec_id, recipe.date);
            }
        });
        
        // Create planning controls
        createPlanningControls();
        
        // Update calendar and recipe panel
        updatePlanningCalendar();
        updateRecipePanel();
        
    } catch (error) {
        console.error('Error loading planning data:', error);
        showPlanningMessage(`Error loading planning data: ${error.message}`, 'error');
    }
}

// Navigate Calendar Month
function navigateMonth(direction) {
    currentPlanningDate.setMonth(currentPlanningDate.getMonth() + direction);
    updatePlanningCalendar();
}

// Update Planning Calendar
function updatePlanningCalendar() {
    const year = currentPlanningDate.getFullYear();
    const month = currentPlanningDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Calculate total cells needed (42 for 6 weeks)
    const totalCells = 42;
    
    // Clear calendar
    planningCalendarGrid.innerHTML = '';
    
    // Create calendar cells
    for (let i = 0; i < totalCells; i++) {
        const cellDate = new Date(year, month, i - startingDayOfWeek + 1);
        const dayNumber = cellDate.getDate();
        const isCurrentMonth = cellDate.getMonth() === month;
        const isToday = cellDate.toDateString() === new Date().toDateString();
        
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        if (!isCurrentMonth) cell.classList.add('other-month');
        if (isToday) cell.classList.add('today');
        
        const dateStr = cellDate.toISOString().split('T')[0];
        cell.dataset.date = dateStr;
        
        // Find recipe for this date
        const recipe = allPlanningRecipes.find(r => {
            const recipeDate = pendingChanges.has(r.rec_id) ? 
                pendingChanges.get(r.rec_id) : r.date;
            return recipeDate === dateStr;
        });

        if (recipe) {
            cell.classList.add('has-recipe');
            if (pendingChanges.has(recipe.rec_id)) {
                cell.classList.add('has-pending-change');
            }
        }
        
        cell.innerHTML = `
            <div class="calendar-date">${dayNumber}</div>
            ${recipe ? createCalendarRecipeElement(recipe) : ''}
        `;
        
        // Add drop zone event listeners
        setupDropZone(cell);
        
        // Add drag event listeners to calendar recipes
        if (recipe) {
            const recipeElement = cell.querySelector('.calendar-recipe');
            if (recipeElement) {
                recipeElement.addEventListener('dragstart', (e) => {
                    draggedRecipe = recipe;
                    recipeElement.classList.add('dragging');
                    e.stopPropagation();
                });
                
                recipeElement.addEventListener('dragend', (e) => {
                    recipeElement.classList.remove('dragging');
                    e.stopPropagation();
                });
            }
        }
        
        planningCalendarGrid.appendChild(cell);
    }
}

// Create Calendar Recipe Element
function createCalendarRecipeElement(recipe) {
    const imageElement = recipe.img_url 
        ? `<img src="${recipe.img_url}" alt="${recipe.name}" class="calendar-recipe-image" onerror="this.style.display='none';">`
        : '';
    
    return `
        <div class="calendar-recipe" 
             data-recipe-id="${recipe.rec_id}" 
             draggable="true"
             oncontextmenu="openRecipeModal('${recipe.rec_id}'); return false;">
            ${imageElement}
            <div class="calendar-recipe-name">${recipe.name}</div>
            <span class="calendar-edit-icon" title="Edit Recipe" onclick="openRecipeModal('${recipe.rec_id}')">🖉</span>
        </div>
    `;
}

// Setup Drop Zone
function setupDropZone(cell) {
    cell.addEventListener('dragover', handleDragOver);
    cell.addEventListener('drop', handleDrop);
    cell.addEventListener('dragleave', handleDragLeave);
}

// Handle Drag Over
function handleDragOver(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    const hasRecipe = cell.classList.contains('has-recipe');
    
    if (hasRecipe) {
        cell.classList.add('drag-over');
    } else {
        cell.classList.add('drag-over');
    }
}

// Handle Drag Leave
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

// Handle Drop
async function handleDrop(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    cell.classList.remove('drag-over');
    
    if (!draggedRecipe) {
        console.error('No dragged recipe found');
        return;
    }
    
    const targetDate = cell.dataset.date;
    const hasRecipe = cell.classList.contains('has-recipe');
    
    // Check if there's already a recipe on this date
    if (hasRecipe) {
        showPlanningMessage('Error: There is already a recipe scheduled for this date. Only one recipe per date is allowed.', 'error');
        return;
    }
    
    try {
        // Store the change in pendingChanges
        pendingChanges.set(draggedRecipe.rec_id, targetDate);
        
        // Update local data
        const recipeIndex = allPlanningRecipes.findIndex(r => r.rec_id === draggedRecipe.rec_id);
        if (recipeIndex !== -1) {
            allPlanningRecipes[recipeIndex].date = targetDate;
        }
        
        // Refresh UI
        updatePlanningCalendar();
        filterRecipes();
        createPlanningControls(); // Update controls to show pending changes
        
        showPlanningMessage(`Recipe "${draggedRecipe.name}" will be scheduled for ${formatDate(targetDate)}. Click "Save Changes" to confirm.`, 'info');
        
    } catch (error) {
        console.error('Error scheduling recipe:', error);
        showPlanningMessage(`Error scheduling recipe: ${error.message}`, 'error');
    }
    
    draggedRecipe = null;
}

// Update Recipe Panel
function updateRecipePanel() {
    recipeCardsContainer.innerHTML = '';
    
    filteredRecipes.forEach(recipe => {
        const card = createPlanningRecipeCard(recipe);
        recipeCardsContainer.appendChild(card);
    });
}

// Create Planning Recipe Card
function createPlanningRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'draggable-recipe-card';
    if (pendingChanges.has(recipe.rec_id)) {
        card.classList.add('has-pending-change');
    }
    card.draggable = true;
    card.dataset.recipeId = recipe.rec_id;
    
    // Check if recipe is on calendar
    const isOnCalendar = recipe.date && recipe.date !== '';
    if (isOnCalendar) {
        card.classList.add('on-calendar');
    }
    
    const imageElement = recipe.img_url 
        ? `<img src="${recipe.img_url}" alt="${recipe.name}" class="recipe-card-image" onerror="this.classList.add('placeholder'); this.innerHTML='🍽️';">`
        : `<div class="recipe-card-image placeholder">🍽️</div>`;
    
    card.innerHTML = `
        ${imageElement}
        <div class="recipe-card-content">
            <div class="recipe-card-title">${recipe.name}</div>
            <div class="recipe-card-meta">
                <span class="recipe-card-date">${recipe.date ? formatDate(recipe.date) : 'Not scheduled'}</span>
                ${recipe.author ? `<span class="recipe-card-author">by ${recipe.author}</span>` : ''}
            </div>
        </div>
        <div class="recipe-card-actions">
            <button class="edit-recipe-btn" onclick="openRecipeModal('${recipe.rec_id}')">Edit</button>
        </div>
    `;
    
    // Add drag event listeners
    card.addEventListener('dragstart', (e) => {
        draggedRecipe = recipe;
        card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
    });
    
    return card;
}

// Filter Recipes
function filterRecipes() {
    const searchTerm = recipeSearchInput.value.toLowerCase();
    const sortBy = recipeSortSelect.value;
    
    // Filter by search term
    filteredRecipes = allPlanningRecipes.filter(recipe => {
        return recipe.name.toLowerCase().includes(searchTerm) ||
               (recipe.author && recipe.author.toLowerCase().includes(searchTerm)) ||
               (recipe.description && recipe.description.toLowerCase().includes(searchTerm));
    });
    
    // Sort recipes
    filteredRecipes.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return new Date(a.date || '1900-01-01') - new Date(b.date || '1900-01-01');
            case 'author':
                return (a.author || '').localeCompare(b.author || '');
            default:
                return 0;
        }
    });
    
    updateRecipePanel();
}

// Open Recipe Modal
async function openRecipeModal(recipeId) {
    const recipe = allPlanningRecipes.find(r => r.rec_id === recipeId);
    if (!recipe) return;
    
    // Populate form
    document.getElementById('edit-recipe-id').value = recipe.rec_id;
    document.getElementById('edit-recipe-name').value = recipe.name || '';
    document.getElementById('edit-recipe-date').value = recipe.date || '';
    document.getElementById('edit-recipe-day-number').value = recipe.day_number || '';
    document.getElementById('edit-recipe-author').value = recipe.author || '';
    document.getElementById('edit-recipe-description').value = recipe.description || '';
    document.getElementById('edit-recipe-url').value = recipe.recipe_url || '';
    document.getElementById('edit-recipe-img-url').value = recipe.img_url || '';

    // Fetch and display Easter Egg info
    const easterEggInfoDiv = document.getElementById('edit-recipe-easter-egg-info');
    easterEggInfoDiv.textContent = 'Loading...'; // Placeholder while fetching
    try {
        const { data: easterEggs, error } = await supabase
            .from('eastereggs')
            .select('name')
            .eq('rec_id', recipe.rec_id);

        if (error) throw error;

        if (easterEggs && easterEggs.length > 0) {
            const eggNames = easterEggs.map(egg => `🍳 ${egg.name}`).join('<br>');
            easterEggInfoDiv.innerHTML = eggNames;
        } else {
            easterEggInfoDiv.textContent = 'No Easter Egg Found';
        }
    } catch (error) {
        console.error('Error fetching easter eggs:', error);
        easterEggInfoDiv.textContent = 'Error loading Easter Egg info';
    }
    
    // Update Playtest button state
    const playtestBtn = document.getElementById('playtest-recipe-btn');
    const dateInput = document.getElementById('edit-recipe-date');
    if (playtestBtn && dateInput) {
        if (dateInput.value) {
            playtestBtn.disabled = false;
            playtestBtn.onclick = () => {
                window.open(`index.html?date=${dateInput.value}`, '_blank');
            };
        } else {
            playtestBtn.disabled = true;
            playtestBtn.onclick = null;
        }
    }
    
    // Show modal
    recipeEditModal.classList.add('active');
}

// Close Recipe Modal
function closeRecipeModal() {
    recipeEditModal.classList.remove('active');
    recipeEditForm.reset();
    // Clear Easter Egg info
    const easterEggInfoDiv = document.getElementById('edit-recipe-easter-egg-info');
    if (easterEggInfoDiv) {
        easterEggInfoDiv.innerHTML = ''; // Clear the content
    }
}

// Handle Recipe Edit
async function handleRecipeEdit(e) {
    e.preventDefault();
    
    const recipeId = document.getElementById('edit-recipe-id').value;
    const formData = {
        name: document.getElementById('edit-recipe-name').value,
        date: document.getElementById('edit-recipe-date').value,
        day_number: document.getElementById('edit-recipe-day-number').value || null,
        author: document.getElementById('edit-recipe-author').value,
        description: document.getElementById('edit-recipe-description').value,
        recipe_url: document.getElementById('edit-recipe-url').value,
        img_url: document.getElementById('edit-recipe-img-url').value
    };
    
    // Check for date conflicts (excluding current recipe)
    const existingRecipe = allPlanningRecipes.find(r => 
        r.date === formData.date && r.rec_id !== recipeId
    );
    
    if (existingRecipe) {
        showPlanningMessage(`Error: Another recipe "${existingRecipe.name}" is already scheduled for ${formatDate(formData.date)}`, 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('recipes')
            .update(formData)
            .eq('rec_id', recipeId);
        
        if (error) throw error;
        
        // Update local data
        const recipeIndex = allPlanningRecipes.findIndex(r => r.rec_id === recipeId);
        if (recipeIndex !== -1) {
            allPlanningRecipes[recipeIndex] = { ...allPlanningRecipes[recipeIndex], ...formData };
        }
        
        // Refresh UI
        filterRecipes(); // This will update the recipe panel
        updatePlanningCalendar();
        closeRecipeModal();
        
        showPlanningMessage('Recipe updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating recipe:', error);
        showPlanningMessage(`Error updating recipe: ${error.message}`, 'error');
    }
}

function showPlanningMessage(message, type) {
    planningMessagesElement.textContent = message;
    planningMessagesElement.className = `message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        planningMessagesElement.textContent = '';
        planningMessagesElement.className = 'message';
    }, 5000);
}

// Format URL for display (truncate and clean up)
function formatUrlForDisplay(url) {
    try {
        // Try to parse the URL
        const urlObj = new URL(url);
        
        // Get pathname and search params
        let displayUrl = urlObj.pathname;
        
        // Add search params if they exist
        if (urlObj.search) {
            // Limit the length of search params
            const searchParams = urlObj.search.length > 30 
                ? urlObj.search.substring(0, 30) + '...' 
                : urlObj.search;
            displayUrl += searchParams;
        }
        
        // Truncate if too long
        if (displayUrl.length > 50) {
            displayUrl = displayUrl.substring(0, 47) + '...';
        }
        
        return displayUrl;
    } catch (e) {
        // If URL parsing fails, just truncate the raw string
        return url.length > 50 ? url.substring(0, 47) + '...' : url;
    }
}

// Create Planning Controls
function createPlanningControls() {
    // Remove existing controls if they exist
    const existingControls = document.getElementById('planning-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Create new controls
    const container = document.createElement('div');
    container.id = 'planning-controls';
    container.className = 'planning-controls';
    
    const hasChanges = pendingChanges.size > 0;
    
    container.innerHTML = `
        <button id="save-planning" class="save-planning-btn" ${!hasChanges ? 'disabled' : ''}>
            Save Changes (${pendingChanges.size})
        </button>
        <button id="revert-planning" class="revert-planning-btn" ${!hasChanges ? 'disabled' : ''}>
            Revert Changes
        </button>
    `;
    
    // Add after the calendar
    const planningCalendar = document.querySelector('.planning-calendar');
    if (planningCalendar) {
        planningCalendar.insertAdjacentElement('afterend', container);
        
        // Add event listeners
        document.getElementById('save-planning').addEventListener('click', savePlanningChanges);
        document.getElementById('revert-planning').addEventListener('click', revertPlanningChanges);
    }
}

// Save Planning Changes
async function savePlanningChanges() {
    if (pendingChanges.size === 0) return;
    
    try {
        // Create an array of updates
        const updates = Array.from(pendingChanges.entries()).map(([rec_id, date]) => {
            // Find the full recipe object
            const recipe = allPlanningRecipes.find(r => r.rec_id === rec_id);
            if (!recipe) {
                throw new Error(`Recipe with ID ${rec_id} not found`);
            }
            
            // Return all existing fields plus the new date
            return {
                ...recipe,
                date: date
            };
        });
        
        // Update all changed recipes in one batch
        const { error } = await supabase
            .from('recipes')
            .upsert(updates);
        
        if (error) throw error;
        
        // Clear pending changes and update original dates
        updates.forEach(update => {
            originalDates.set(update.rec_id, update.date);
        });
        pendingChanges.clear();
        
        // Refresh UI
        updatePlanningCalendar();
        filterRecipes();
        createPlanningControls();
        
        showPlanningMessage('All changes have been saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showPlanningMessage(`Error saving changes: ${error.message}`, 'error');
    }
}

// Revert Planning Changes
function revertPlanningChanges() {
    if (pendingChanges.size === 0) return;
    
    try {
        // Revert all recipes to their original dates
        allPlanningRecipes.forEach(recipe => {
            if (pendingChanges.has(recipe.rec_id)) {
                recipe.date = originalDates.get(recipe.rec_id) || null;
            }
        });
        
        // Clear pending changes
        pendingChanges.clear();
        
        // Refresh UI
        updatePlanningCalendar();
        filterRecipes();
        createPlanningControls();
        
        showPlanningMessage('All changes have been reverted.', 'info');
        
    } catch (error) {
        console.error('Error reverting changes:', error);
        showPlanningMessage(`Error reverting changes: ${error.message}`, 'error');
    }
}

// Make functions globally accessible
window.savePlanningChanges = savePlanningChanges;
window.revertPlanningChanges = revertPlanningChanges;
window.openRecipeModal = openRecipeModal;
window.closeRecipeModal = closeRecipeModal; 