// ================================================
// COMBO MEAL - Comprehensive Game Testing Suite
// ================================================

// Global testing state
let testState = {
    selectedRecipe: null,
    availableRecipes: [],
    currentUser: null,
    testMode: 'development',
    debugMode: false,
    gameFrame: null,
    lastTestResult: null,
    scenarios: {}
};

// Testing configuration
const TEST_CONFIG = {
    DEFAULT_TEST_USER: {
        email: 'test-user@combomeal.test',
        password: 'CHANGE_THIS_PASSWORD' // Security: Update this in your local environment
    },
    TEST_ANONYMOUS_ID: 'anonymous-test-user',
    COMPLETION_SCENARIOS: [
        'anonymous-fresh',
        'anonymous-completed', 
        'verified-fresh',
        'verified-completed',
        'historical-date',
        'future-date'
    ]
};

// ================================================
// INITIALIZATION AND UTILITY FUNCTIONS
// ================================================

// Initialize the testing suite
document.addEventListener('DOMContentLoaded', function() {
    log('info', 'Initializing COMBO MEAL Testing Suite...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize state
    initializeTestingSuite();
    
    // Check initial states
    checkDatabaseConnection();
    checkAuthenticationState();
    loadAvailableRecipes();
    
    log('success', 'Testing suite initialized successfully!');
});

// Set up all event listeners
function setupEventListeners() {
    // Toggle sections
    document.querySelectorAll('.test-section-header').forEach(header => {
        header.addEventListener('click', function() {
            const section = this.parentElement;
            section.classList.toggle('active');
        });
    });
    
    // Today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('targetDate').value = today;
}

// Initialize the testing suite state
async function initializeTestingSuite() {
    try {
        // Check if supabase is available
        if (typeof supabase === 'undefined') {
            log('error', 'Supabase not available. Please check configuration.');
            updateStatus('dbStatus', 'offline', 'Not Connected');
            return;
        }
        
        log('info', 'Supabase client available');
        updateStatus('dbStatus', 'online', 'Connected');
        
        // Initialize auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
            log('info', `Auth state changed: ${event}`);
            updateAuthenticationDisplay(session);
        });
        
    } catch (error) {
        log('error', `Initialization error: ${error.message}`);
    }
}

// ================================================
// AUTHENTICATION TESTING FUNCTIONS
// ================================================

// Set user as anonymous
async function setAnonymousUser() {
    try {
        log('info', 'Setting user as anonymous...');
        
        // Sign out first
        await supabase.auth.signOut();
        
        // Create anonymous session
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            throw error;
        }
        
        log('success', 'User set as anonymous');
        updateAuthenticationDisplay(data.session);
        
    } catch (error) {
        log('error', `Failed to set anonymous user: ${error.message}`);
    }
}

// Login test user
async function loginTestUser() {
    try {
        log('info', 'Logging in test user...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: TEST_CONFIG.DEFAULT_TEST_USER.email,
            password: TEST_CONFIG.DEFAULT_TEST_USER.password
        });
        
        if (error) {
            throw error;
        }
        
        log('success', 'Test user logged in successfully');
        updateAuthenticationDisplay(data.session);
        
    } catch (error) {
        log('error', `Failed to login test user: ${error.message}`);
        
        // Try to create the test user if login failed
        log('info', 'Attempting to create test user...');
        await createNewTestUser();
    }
}

// Create new test user
async function createNewTestUser() {
    try {
        log('info', 'Creating new test user...');
        
        const { data, error } = await supabase.auth.signUp({
            email: TEST_CONFIG.DEFAULT_TEST_USER.email,
            password: TEST_CONFIG.DEFAULT_TEST_USER.password
        });
        
        if (error) {
            throw error;
        }
        
        log('success', 'Test user created successfully');
        log('info', 'Please check email for confirmation if required');
        updateAuthenticationDisplay(data.session);
        
    } catch (error) {
        log('error', `Failed to create test user: ${error.message}`);
    }
}

// Login custom user
async function loginCustomUser() {
    try {
        const email = document.getElementById('testUserEmail').value;
        const password = document.getElementById('testUserPassword').value;
        
        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }
        
        log('info', `Logging in custom user: ${email}`);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        log('success', `Custom user logged in: ${email}`);
        updateAuthenticationDisplay(data.session);
        
    } catch (error) {
        log('error', `Failed to login custom user: ${error.message}`);
    }
}

// Logout user
async function logoutUser() {
    try {
        log('info', 'Logging out user...');
        
        await supabase.auth.signOut();
        
        log('success', 'User logged out successfully');
        updateAuthenticationDisplay(null);
        
    } catch (error) {
        log('error', `Failed to logout user: ${error.message}`);
    }
}

// Update authentication display
function updateAuthenticationDisplay(session) {
    if (session && session.user) {
        const user = session.user;
        const isAnonymous = user.is_anonymous || false;
        
        updateStatus('authStatus', 'online', 'Authenticated');
        updateStatus('userType', '', isAnonymous ? 'Anonymous' : 'Verified');
        
        testState.currentUser = {
            id: user.id,
            email: user.email,
            isAnonymous: isAnonymous
        };
        
        log('info', `User authenticated: ${isAnonymous ? 'Anonymous' : user.email}`);
        
    } else {
        updateStatus('authStatus', 'offline', 'Not Authenticated');
        updateStatus('userType', '', 'None');
        testState.currentUser = null;
        
        log('info', 'No user authenticated');
    }
    
    // Check completion state after auth change
    checkUserCompletionState();
}

// Check current authentication state
async function checkAuthenticationState() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        updateAuthenticationDisplay(session);
    } catch (error) {
        log('error', `Failed to check auth state: ${error.message}`);
    }
}

// ================================================
// RECIPE SELECTION FUNCTIONS
// ================================================

// Load available recipes
async function loadAvailableRecipes() {
    try {
        log('info', 'Loading available recipes...');
        
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('rec_id, name, date, description, author')
            .order('date', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        testState.availableRecipes = recipes || [];
        updateRecipeSelector(testState.availableRecipes);
        updateStatus('recipeCount', '', `${testState.availableRecipes.length} recipes`);
        
        log('success', `Loaded ${testState.availableRecipes.length} recipes`);
        
    } catch (error) {
        log('error', `Failed to load recipes: ${error.message}`);
        updateStatus('recipeCount', '', 'Error loading');
    }
}

// Update recipe selector display
function updateRecipeSelector(recipes) {
    const selector = document.getElementById('recipeSelector');
    
    if (!recipes || recipes.length === 0) {
        selector.innerHTML = '<div class="recipe-item">No recipes available</div>';
        return;
    }
    
    selector.innerHTML = recipes.map(recipe => `
        <div class="recipe-item" onclick="selectRecipe('${recipe.rec_id}')">
            <div>
                <strong>${recipe.name}</strong>
                <div class="recipe-meta">${recipe.date} ${recipe.author ? `• ${recipe.author}` : ''}</div>
            </div>
        </div>
    `).join('');
}

// Select a specific recipe
function selectRecipe(recipeId) {
    const recipe = testState.availableRecipes.find(r => r.rec_id === recipeId);
    
    if (!recipe) {
        log('error', 'Recipe not found');
        return;
    }
    
    testState.selectedRecipe = recipe;
    
    // Update UI
    document.querySelectorAll('.recipe-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    event.target.closest('.recipe-item').classList.add('selected');
    
    updateStatus('selectedRecipe', '', `${recipe.name} (${recipe.date})`);
    log('info', `Selected recipe: ${recipe.name} (${recipe.date})`);
    
    // Check completion for this recipe
    checkUserCompletionState();
}

// Load recipe by date
async function loadRecipeByDate() {
    try {
        const targetDate = document.getElementById('targetDate').value;
        
        if (!targetDate) {
            throw new Error('Please select a target date');
        }
        
        log('info', `Loading recipe for date: ${targetDate}`);
        
        const recipe = testState.availableRecipes.find(r => r.date === targetDate);
        
        if (!recipe) {
            throw new Error(`No recipe found for date: ${targetDate}`);
        }
        
        selectRecipe(recipe.rec_id);
        
    } catch (error) {
        log('error', `Failed to load recipe by date: ${error.message}`);
    }
}

// Load today's recipe
async function loadTodayRecipe() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('targetDate').value = today;
    await loadRecipeByDate();
}

// Load random recipe
async function loadRandomRecipe() {
    if (testState.availableRecipes.length === 0) {
        log('error', 'No recipes available');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * testState.availableRecipes.length);
    const randomRecipe = testState.availableRecipes[randomIndex];
    
    selectRecipe(randomRecipe.rec_id);
    document.getElementById('targetDate').value = randomRecipe.date;
}

// Refresh recipe list
function refreshRecipeList() {
    loadAvailableRecipes();
}

// ================================================
// COMPLETION STATE TESTING FUNCTIONS
// ================================================

// Check user completion state for selected recipe
async function checkUserCompletionState() {
    if (!testState.currentUser || !testState.selectedRecipe) {
        updateStatus('completionState', '', 'Unknown');
        return;
    }
    
    try {
        log('info', 'Checking user completion state...');
        
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', testState.currentUser.id)
            .eq('rec_id', testState.selectedRecipe.rec_id);
        
        if (error) {
            throw error;
        }
        
        const completedSession = sessions?.find(s => s.session_status === 'completed');
        
        if (completedSession) {
            updateStatus('completionState', '', 'Completed');
            log('success', 'User has completed this recipe');
        } else {
            updateStatus('completionState', '', 'Not Completed');
            log('info', 'User has not completed this recipe');
        }
        
    } catch (error) {
        log('error', `Failed to check completion state: ${error.message}`);
        updateStatus('completionState', '', 'Error');
    }
}

// Simulate game completion
async function simulateGameCompletion() {
    if (!testState.currentUser || !testState.selectedRecipe) {
        log('error', 'Please select a recipe and authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Simulating game completion...');
        
        // Create a completed session
        const { data, error } = await supabase
            .from('user_sessions')
            .insert({
                user_id: testState.currentUser.id,
                rec_id: testState.selectedRecipe.rec_id,
                session_status: 'completed',
                hints_used: Math.floor(Math.random() * 3), // Random hints 0-2
                time_taken: Math.floor(Math.random() * 600) + 120, // Random time 2-12 minutes
                star_score: Math.floor(Math.random() * 3) + 1, // Random stars 1-3
                completed_at: new Date().toISOString()
            });
        
        if (error) {
            throw error;
        }
        
        log('success', 'Game completion simulated successfully');
        checkUserCompletionState();
        
    } catch (error) {
        log('error', `Failed to simulate completion: ${error.message}`);
    }
}

// Simulate partial progress
async function simulatePartialProgress() {
    if (!testState.currentUser || !testState.selectedRecipe) {
        log('error', 'Please select a recipe and authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Simulating partial progress...');
        
        // Create an in-progress session
        const { data, error } = await supabase
            .from('user_sessions')
            .insert({
                user_id: testState.currentUser.id,
                rec_id: testState.selectedRecipe.rec_id,
                session_status: 'in_progress',
                hints_used: Math.floor(Math.random() * 2), // Random hints 0-1
                time_taken: Math.floor(Math.random() * 300) + 60, // Random time 1-6 minutes
                star_score: null,
                completed_at: null
            });
        
        if (error) {
            throw error;
        }
        
        log('success', 'Partial progress simulated successfully');
        checkUserCompletionState();
        
    } catch (error) {
        log('error', `Failed to simulate partial progress: ${error.message}`);
    }
}

// Clear all user progress
async function clearUserProgress() {
    if (!testState.currentUser) {
        log('error', 'Please authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Clearing all user progress...');
        
        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', testState.currentUser.id);
        
        if (error) {
            throw error;
        }
        
        log('success', 'All user progress cleared');
        checkUserCompletionState();
        
    } catch (error) {
        log('error', `Failed to clear progress: ${error.message}`);
    }
}

// Check current progress
async function checkCurrentProgress() {
    if (!testState.currentUser) {
        log('error', 'Please authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Checking current user progress...');
        
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select(`
                *,
                recipes(name, date)
            `)
            .eq('user_id', testState.currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const completedCount = sessions?.filter(s => s.session_status === 'completed').length || 0;
        const inProgressCount = sessions?.filter(s => s.session_status === 'in_progress').length || 0;
        
        log('success', `Progress check complete:`);
        log('info', `- Completed sessions: ${completedCount}`);
        log('info', `- In progress sessions: ${inProgressCount}`);
        log('info', `- Total sessions: ${sessions?.length || 0}`);
        
        if (sessions && sessions.length > 0) {
            log('info', 'Recent sessions:');
            sessions.slice(0, 5).forEach(session => {
                log('info', `  - ${session.recipes?.name || 'Unknown'} (${session.recipes?.date || 'No date'}): ${session.session_status}`);
            });
        }
        
    } catch (error) {
        log('error', `Failed to check progress: ${error.message}`);
    }
}

// ================================================
// SESSION MANAGEMENT FUNCTIONS
// ================================================

// Start new session
async function startNewSession() {
    if (!testState.currentUser || !testState.selectedRecipe) {
        log('error', 'Please select a recipe and authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Starting new game session...');
        
        const { data, error } = await supabase
            .from('user_sessions')
            .insert({
                user_id: testState.currentUser.id,
                rec_id: testState.selectedRecipe.rec_id,
                session_status: 'in_progress',
                hints_used: 0,
                time_taken: 0,
                star_score: null,
                completed_at: null
            });
        
        if (error) {
            throw error;
        }
        
        log('success', 'New game session started');
        checkUserCompletionState();
        
    } catch (error) {
        log('error', `Failed to start new session: ${error.message}`);
    }
}

// Complete current session
async function completeCurrentSession() {
    if (!testState.currentUser || !testState.selectedRecipe) {
        log('error', 'Please select a recipe and authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Completing current session...');
        
        // Find the most recent in-progress session
        const { data: sessions, error: fetchError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', testState.currentUser.id)
            .eq('rec_id', testState.selectedRecipe.rec_id)
            .eq('session_status', 'in_progress')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (fetchError) {
            throw fetchError;
        }
        
        if (!sessions || sessions.length === 0) {
            throw new Error('No in-progress session found');
        }
        
        const session = sessions[0];
        
        // Update the session to completed
        const { error: updateError } = await supabase
            .from('user_sessions')
            .update({
                session_status: 'completed',
                time_taken: session.time_taken + Math.floor(Math.random() * 300) + 60,
                star_score: Math.floor(Math.random() * 3) + 1,
                completed_at: new Date().toISOString()
            })
            .eq('session_id', session.session_id);
        
        if (updateError) {
            throw updateError;
        }
        
        log('success', 'Current session completed');
        checkUserCompletionState();
        
    } catch (error) {
        log('error', `Failed to complete session: ${error.message}`);
    }
}

// Abandon current session
async function abandonCurrentSession() {
    if (!testState.currentUser || !testState.selectedRecipe) {
        log('error', 'Please select a recipe and authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Abandoning current session...');
        
        const { error } = await supabase
            .from('user_sessions')
            .update({
                session_status: 'abandoned'
            })
            .eq('user_id', testState.currentUser.id)
            .eq('rec_id', testState.selectedRecipe.rec_id)
            .eq('session_status', 'in_progress');
        
        if (error) {
            throw error;
        }
        
        log('success', 'Current session abandoned');
        checkUserCompletionState();
        
    } catch (error) {
        log('error', `Failed to abandon session: ${error.message}`);
    }
}

// View session history
async function viewSessionHistory() {
    if (!testState.currentUser) {
        log('error', 'Please authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Loading session history...');
        
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select(`
                *,
                recipes(name, date)
            `)
            .eq('user_id', testState.currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            throw error;
        }
        
        log('success', `Session history loaded (${sessions?.length || 0} sessions):`);
        
        if (sessions && sessions.length > 0) {
            sessions.forEach((session, index) => {
                const recipeName = session.recipes?.name || 'Unknown Recipe';
                const recipeDate = session.recipes?.date || 'No date';
                const status = session.session_status;
                const timeFormatted = session.time_taken ? `${Math.floor(session.time_taken / 60)}:${(session.time_taken % 60).toString().padStart(2, '0')}` : 'N/A';
                
                log('info', `${index + 1}. ${recipeName} (${recipeDate}) - ${status} - ${timeFormatted}`);
            });
        } else {
            log('info', 'No session history found');
        }
        
    } catch (error) {
        log('error', `Failed to load session history: ${error.message}`);
    }
}

// ================================================
// SCENARIO SETUP FUNCTIONS
// ================================================

// Setup specific test scenarios
async function setupScenario(scenarioType) {
    log('info', `Setting up scenario: ${scenarioType}`);
    
    switch (scenarioType) {
        case 'anonymous-fresh':
            await setAnonymousUser();
            await clearUserProgress();
            await loadTodayRecipe();
            log('success', 'Anonymous fresh user scenario ready');
            break;
            
        case 'anonymous-completed':
            await setAnonymousUser();
            await loadTodayRecipe();
            await simulateGameCompletion();
            log('success', 'Anonymous completed user scenario ready');
            break;
            
        case 'verified-fresh':
            await loginTestUser();
            await clearUserProgress();
            await loadTodayRecipe();
            log('success', 'Verified fresh user scenario ready');
            break;
            
        case 'verified-completed':
            await loginTestUser();
            await loadTodayRecipe();
            await simulateGameCompletion();
            log('success', 'Verified completed user scenario ready');
            break;
            
        case 'historical-date':
            // Find an older recipe
            const historicalRecipe = testState.availableRecipes
                .filter(r => new Date(r.date) < new Date())
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
            if (historicalRecipe) {
                selectRecipe(historicalRecipe.rec_id);
                document.getElementById('targetDate').value = historicalRecipe.date;
                log('success', `Historical recipe scenario ready: ${historicalRecipe.name} (${historicalRecipe.date})`);
            } else {
                log('error', 'No historical recipes available');
            }
            break;
            
        case 'future-date':
            // Find a future recipe
            const futureRecipe = testState.availableRecipes
                .filter(r => new Date(r.date) > new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            
            if (futureRecipe) {
                selectRecipe(futureRecipe.rec_id);
                document.getElementById('targetDate').value = futureRecipe.date;
                log('success', `Future recipe scenario ready: ${futureRecipe.name} (${futureRecipe.date})`);
            } else {
                log('error', 'No future recipes available');
            }
            break;
            
        default:
            log('error', `Unknown scenario type: ${scenarioType}`);
    }
}

// ================================================
// GAME LAUNCH FUNCTIONS
// ================================================

// Launch game in iframe
function launchGameInFrame() {
    if (!testState.selectedRecipe) {
        log('error', 'Please select a recipe first');
        return;
    }
    
    log('info', 'Launching game in frame...');
    
    const gameFrame = document.getElementById('gameFrame');
    const params = new URLSearchParams({
        testMode: 'true',
        recipeId: testState.selectedRecipe.rec_id,
        selectedDate: testState.selectedRecipe.date
    });
    
    gameFrame.src = `index.html?${params.toString()}`;
    gameFrame.classList.add('active');
    
    log('success', 'Game launched in frame');
}

// Launch game in new tab
function launchGameNewTab() {
    if (!testState.selectedRecipe) {
        log('error', 'Please select a recipe first');
        return;
    }
    
    log('info', 'Launching game in new tab...');
    
    const params = new URLSearchParams({
        testMode: 'true',
        recipeId: testState.selectedRecipe.rec_id,
        selectedDate: testState.selectedRecipe.date
    });
    
    window.open(`index.html?${params.toString()}`, '_blank');
    
    log('success', 'Game launched in new tab');
}

// Launch playtest mode
function launchPlaytest() {
    log('info', 'Launching playtest mode...');
    window.open('playtest.html', '_blank');
    log('success', 'Playtest mode launched');
}

// ================================================
// DEBUG AND MONITORING FUNCTIONS
// ================================================

// Enable debug mode
function enableDebugMode() {
    testState.debugMode = !testState.debugMode;
    
    if (testState.debugMode) {
        log('warning', 'Debug mode enabled');
        // Enable console logging
        window.addEventListener('error', function(e) {
            log('error', `JavaScript Error: ${e.error?.message || e.message}`);
        });
    } else {
        log('info', 'Debug mode disabled');
    }
}

// Monitor game events
function monitorGameEvents() {
    if (testState.debugMode) {
        log('info', 'Monitoring game events...');
        
        // Listen for messages from game iframe
        window.addEventListener('message', function(event) {
            if (event.origin !== window.location.origin) return;
            
            log('info', `Game Event: ${JSON.stringify(event.data)}`);
        });
        
        log('success', 'Game event monitoring enabled');
    } else {
        log('warning', 'Please enable debug mode first');
    }
}

// ================================================
// DATABASE TESTING FUNCTIONS
// ================================================

// Test database connection
async function testDatabaseConnection() {
    try {
        log('info', 'Testing database connection...');
        
        const { data, error } = await supabase
            .from('recipes')
            .select('count')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        updateStatus('dbStatus', 'online', 'Connected');
        log('success', 'Database connection successful');
        
    } catch (error) {
        updateStatus('dbStatus', 'offline', 'Error');
        log('error', `Database connection failed: ${error.message}`);
    }
}

// Check recipe data integrity
async function checkRecipeData() {
    try {
        log('info', 'Checking recipe data integrity...');
        
        // Check recipes
        const { data: recipes, error: recipeError } = await supabase
            .from('recipes')
            .select('rec_id, name, date');
        
        if (recipeError) throw recipeError;
        
        // Check combinations for each recipe
        let totalCombinations = 0;
        let totalIngredients = 0;
        
        for (const recipe of recipes) {
            const { data: combinations, error: comboError } = await supabase
                .from('combinations')
                .select('combo_id')
                .eq('rec_id', recipe.rec_id);
            
            if (comboError) throw comboError;
            
            totalCombinations += combinations.length;
            
            // Check ingredients for each combination
            for (const combo of combinations) {
                const { data: ingredients, error: ingError } = await supabase
                    .from('ingredients')
                    .select('ing_id')
                    .eq('combo_id', combo.combo_id);
                
                if (ingError) throw ingError;
                totalIngredients += ingredients.length;
            }
        }
        
        log('success', 'Recipe data integrity check complete:');
        log('info', `- Recipes: ${recipes.length}`);
        log('info', `- Combinations: ${totalCombinations}`);
        log('info', `- Ingredients: ${totalIngredients}`);
        
    } catch (error) {
        log('error', `Recipe data integrity check failed: ${error.message}`);
    }
}

// Validate user data
async function validateUserData() {
    if (!testState.currentUser) {
        log('error', 'Please authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Validating user data...');
        
        // Check user sessions
        const { data: sessions, error: sessionError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', testState.currentUser.id);
        
        if (sessionError) throw sessionError;
        
        // Validate session data
        const issues = [];
        
        sessions.forEach(session => {
            if (!session.rec_id) issues.push('Missing recipe ID');
            if (!session.session_status) issues.push('Missing session status');
            if (session.session_status === 'completed' && !session.completed_at) {
                issues.push('Completed session missing completion time');
            }
        });
        
        if (issues.length > 0) {
            log('warning', 'User data validation issues found:');
            issues.forEach(issue => log('warning', `- ${issue}`));
        } else {
            log('success', 'User data validation passed');
        }
        
        log('info', `User has ${sessions.length} sessions`);
        
    } catch (error) {
        log('error', `User data validation failed: ${error.message}`);
    }
}

// Run data integrity check
async function runDataIntegrityCheck() {
    log('info', 'Running comprehensive data integrity check...');
    
    await testDatabaseConnection();
    await checkRecipeData();
    
    if (testState.currentUser) {
        await validateUserData();
    }
    
    log('success', 'Data integrity check complete');
}

// View user stats
async function viewUserStats() {
    if (!testState.currentUser) {
        log('error', 'Please authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Loading user statistics...');
        
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', testState.currentUser.id);
        
        if (error) throw error;
        
        const completed = sessions.filter(s => s.session_status === 'completed');
        const inProgress = sessions.filter(s => s.session_status === 'in_progress');
        const abandoned = sessions.filter(s => s.session_status === 'abandoned');
        
        const totalTime = completed.reduce((sum, s) => sum + (s.time_taken || 0), 0);
        const avgTime = completed.length > 0 ? totalTime / completed.length : 0;
        const totalHints = completed.reduce((sum, s) => sum + (s.hints_used || 0), 0);
        const avgHints = completed.length > 0 ? totalHints / completed.length : 0;
        
        log('success', 'User statistics:');
        log('info', `- Total sessions: ${sessions.length}`);
        log('info', `- Completed: ${completed.length}`);
        log('info', `- In progress: ${inProgress.length}`);
        log('info', `- Abandoned: ${abandoned.length}`);
        log('info', `- Average time: ${Math.round(avgTime)}s`);
        log('info', `- Average hints: ${avgHints.toFixed(1)}`);
        
    } catch (error) {
        log('error', `Failed to load user stats: ${error.message}`);
    }
}

// Check completion data
async function checkCompletionData() {
    try {
        log('info', 'Checking completion data...');
        
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select(`
                *,
                recipes(name, date)
            `)
            .eq('session_status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        log('success', `Found ${sessions.length} completed sessions`);
        
        // Group by date
        const byDate = {};
        sessions.forEach(session => {
            const date = session.recipes?.date || 'Unknown';
            if (!byDate[date]) byDate[date] = 0;
            byDate[date]++;
        });
        
        log('info', 'Completions by date:');
        Object.entries(byDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 10)
            .forEach(([date, count]) => {
                log('info', `- ${date}: ${count} completions`);
            });
        
    } catch (error) {
        log('error', `Failed to check completion data: ${error.message}`);
    }
}

// Export test data
async function exportTestData() {
    if (!testState.currentUser) {
        log('error', 'Please authenticate a user first');
        return;
    }
    
    try {
        log('info', 'Exporting test data...');
        
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select(`
                *,
                recipes(*)
            `)
            .eq('user_id', testState.currentUser.id);
        
        if (error) throw error;
        
        const exportData = {
            user: testState.currentUser,
            sessions: sessions,
            exportTime: new Date().toISOString(),
            testState: testState
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `combo-meal-test-data-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        log('success', 'Test data exported successfully');
        
    } catch (error) {
        log('error', `Failed to export test data: ${error.message}`);
    }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

// Log messages to the debug console
function log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    const debugLog = document.getElementById('debugLog');
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
    
    // Also log to browser console
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](`[TEST] ${message}`);
}

// Clear debug log
function clearDebugLog() {
    const debugLog = document.getElementById('debugLog');
    debugLog.innerHTML = '<div class="log-entry info">Debug log cleared</div>';
    log('info', 'Debug log cleared');
}

// Export debug log
function exportDebugLog() {
    const debugLog = document.getElementById('debugLog');
    const logContent = debugLog.textContent;
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combo-meal-debug-log-${Date.now()}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    log('success', 'Debug log exported');
}

// Update status indicators
function updateStatus(elementId, statusClass, statusText) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Update status indicator if present
    const indicator = element.querySelector('.status-indicator');
    if (indicator) {
        indicator.className = `status-indicator ${statusClass || 'unknown'}`;
        element.innerHTML = `<span class="status-indicator ${statusClass || 'unknown'}"></span>${statusText}`;
    } else {
        element.textContent = statusText;
    }
}