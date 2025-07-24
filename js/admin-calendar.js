// Recipe Calendar for Culinary Logic Puzzle Admin
// Created by APlasker

// Calendar-specific variables
let currentStartDate = null;
let calendarRecipes = [];
let allRecipes = []; // Store all recipes for quick access

// DOM Elements for Calendar
const calendarViewSection = document.getElementById('calendar-view-section');
const calendarStartDate = document.getElementById('calendar-start-date');
const loadCalendarBtn = document.getElementById('load-calendar-btn');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');
const calendarRange = document.getElementById('calendar-range');
const calendarGrid = document.getElementById('calendar-grid');
const viewCalendarBtn = document.getElementById('view-calendar-btn');

// Initialize Calendar
function initCalendar() {
    // Set default start date to today
    const today = new Date();
    calendarStartDate.value = formatDateForInput(today);
    
    // Add event listeners
    loadCalendarBtn.addEventListener('click', loadCalendarView);
    prevWeekBtn.addEventListener('click', navigatePrevWeek);
    nextWeekBtn.addEventListener('click', navigateNextWeek);
    viewCalendarBtn.addEventListener('click', showCalendarView);
}

// Show Calendar View
function showCalendarView() {
    // Hide other sections
    if (document.getElementById('new-recipe-form')) {
        document.getElementById('new-recipe-form').style.display = 'none';
    }
    if (document.getElementById('recipe-tree')) {
        document.getElementById('recipe-tree').style.display = 'none';
    }
    if (document.getElementById('edit-recipe-form')) {
        document.getElementById('edit-recipe-form').style.display = 'none';
    }
    if (document.getElementById('easter-eggs-section')) {
        document.getElementById('easter-eggs-section').style.display = 'none';
    }
    
    // Show calendar view
    calendarViewSection.style.display = 'block';
    
    // Load calendar data if we have a start date
    if (calendarStartDate.value) {
        loadCalendarView();
    }
}

// Load Calendar View
async function loadCalendarView() {
    const startDate = calendarStartDate.value;
    if (!startDate) {
        showMessage('Please select a start date', 'error');
        return;
    }
    
    currentStartDate = new Date(startDate);
    
    // Load all recipes first
    await loadAllRecipes();
    
    // Now load the calendar for the selected date range
    await loadCalendarData(currentStartDate);
    
    // Update the calendar range display
    updateCalendarRange();
}

// Load All Recipes
async function loadAllRecipes() {
    try {
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        allRecipes = recipes || [];
        console.log('All recipes loaded:', allRecipes.length);
    } catch (error) {
        console.error('Error loading all recipes:', error);
        showMessage(`Error loading recipes: ${error.message}`, 'error');
    }
}

// Load Calendar Data
async function loadCalendarData(startDate) {
    try {
        calendarGrid.innerHTML = '<p>Loading calendar data...</p>';
        
        // Calculate the end date (7 days from start date)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // 7 days total (0-6)
        
        // Format dates for query
        const startDateStr = formatDateForDB(startDate);
        const endDateStr = formatDateForDB(endDate);
        
        // Load recipes in the date range
        const { data: recipes, error } = await supabase
            .from('recipes')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', endDateStr)
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        calendarRecipes = recipes || [];
        
        // Render the calendar grid
        renderCalendarGrid(startDate, calendarRecipes);
    } catch (error) {
        console.error('Error loading calendar data:', error);
        showMessage(`Error loading calendar data: ${error.message}`, 'error');
        calendarGrid.innerHTML = `<p>Error loading calendar: ${error.message}</p>`;
    }
}

// Render Calendar Grid
function renderCalendarGrid(startDate, recipes) {
    // Clear existing grid
    calendarGrid.innerHTML = '';
    
    // Debug info
    console.log('Rendering calendar grid with recipes:', recipes);
    
    // Create a grid with 7 days (1 week)
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // Format the date for display
        const formattedDate = formatDateForDisplay(currentDate);
        const dayName = getDayName(currentDate);
        const currentDateStr = formatDateForDB(currentDate);
        
        console.log(`Calendar day ${i}: ${currentDateStr} (${dayName})`);
        
        // Find recipe for this date by exact date match
        // Use normalized date strings to avoid timezone issues
        const recipe = recipes.find(r => {
            const normalizedRecipeDate = normalizeDate(r.date);
            console.log(`Comparing recipe date: ${r.date} -> normalized: ${normalizedRecipeDate} with calendar date: ${currentDateStr}`);
            return normalizedRecipeDate === currentDateStr;
        });
        
        if (recipe) {
            console.log(`Found recipe for ${currentDateStr}: ${recipe.name}`);
        }
        
        // Create the day element
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.date = currentDateStr;
        
        // Create the day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.innerHTML = `
            <span>${dayName}</span>
            <span>${formattedDate}</span>
        `;
        
        dayElement.appendChild(dayHeader);
        
        // Add recipe or empty slot
        if (recipe) {
            const recipeElement = createRecipeElement(recipe);
            dayElement.appendChild(recipeElement);
        } else {
            // Calculate day number for this date (for suggestions)
            const dayNumber = getDayNumber(null, currentDate);
            
            // Find a recipe with matching day_number that isn't already in the calendar
            const dayRecipe = allRecipes.find(r => 
                r.day_number === dayNumber && 
                !calendarRecipes.some(cr => cr.rec_id === r.rec_id)
            );
            
            if (dayRecipe) {
                // Create a suggestion element
                const suggestionElement = createSuggestionElement(dayRecipe, currentDate, dayNumber);
                dayElement.appendChild(suggestionElement);
            } else {
                // Create empty slot element with option to create or schedule
                const emptyElement = document.createElement('div');
                emptyElement.className = 'calendar-empty-slot';
                emptyElement.innerHTML = `
                    <p>No recipe scheduled</p>
                    <div class="calendar-recipe-actions">
                        <button class="schedule-recipe-btn" data-date="${currentDateStr}" data-day="${dayNumber}">
                            Schedule Recipe
                        </button>
                    </div>
                `;
                dayElement.appendChild(emptyElement);
            }
        }
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Add event listeners for buttons
    addCalendarEventListeners();
}

// Create Recipe Element
function createRecipeElement(recipe) {
    const recipeElement = document.createElement('div');
    recipeElement.className = 'calendar-recipe';
    recipeElement.dataset.recipeId = recipe.rec_id;
    
    // Calculate day number if not set
    let dayNumber = recipe.day_number;
    if (!dayNumber) {
        const recipeDate = new Date(recipe.date);
        dayNumber = getDayNumber(null, recipeDate);
    }
    
    // Create recipe content
    let recipeContent = `
        <div class="calendar-recipe-title">${recipe.name}</div>
        <div class="calendar-recipe-meta">
            <span>Day #${dayNumber || 'N/A'}</span>
            <span>${recipe.date}</span>
        </div>
    `;
    
    // Add image if available
    if (recipe.img_url) {
        recipeContent += `<img src="${recipe.img_url}" alt="${recipe.name}" loading="lazy">`;
    }
    
    // === NEW: Add edit icon overlay ===
    recipeContent += `
        <span class="calendar-edit-icon" title="Edit Recipe" data-recipe-id="${recipe.rec_id}">🖉</span>
    `;
    
    // Add actions
    recipeContent += `
        <div class="calendar-recipe-actions">
            <button class="quick-edit-btn" data-recipe-id="${recipe.rec_id}">Quick Edit</button>
            <button class="view-recipe-btn" data-recipe-id="${recipe.rec_id}">View Details</button>
        </div>
        <div class="calendar-recipe-edit-form" id="edit-form-${recipe.rec_id}">
            <form class="quick-edit-form" data-recipe-id="${recipe.rec_id}">
                <div class="form-group">
                    <label for="quick-date-${recipe.rec_id}">Date:</label>
                    <input type="date" id="quick-date-${recipe.rec_id}" value="${recipe.date}" required>
                </div>
                <div class="form-group">
                    <label for="quick-day-${recipe.rec_id}">Day Number:</label>
                    <input type="number" id="quick-day-${recipe.rec_id}" value="${recipe.day_number || ''}" min="1">
                </div>
                <div class="form-group">
                    <button type="submit" class="quick-save-btn">Save</button>
                    <button type="button" class="quick-cancel-btn" data-recipe-id="${recipe.rec_id}">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    recipeElement.innerHTML = recipeContent;
    return recipeElement;
}

// Create Suggestion Element
function createSuggestionElement(recipe, currentDate, dayNumber) {
    const suggestionElement = document.createElement('div');
    suggestionElement.className = 'calendar-recipe';
    suggestionElement.classList.add('suggestion');
    suggestionElement.dataset.recipeId = recipe.rec_id;
    suggestionElement.dataset.date = formatDateForDB(currentDate);
    
    // Create suggestion content
    let suggestionContent = `
        <div class="calendar-recipe-title">${recipe.name}</div>
        <div class="calendar-recipe-meta">
            <span>Current date: ${recipe.date}</span>
            <span>Day #${recipe.day_number}</span>
        </div>
        <p class="suggestion-note">This recipe matches day number ${dayNumber} for this date. You can schedule it here.</p>
    `;
    
    // Add image if available
    if (recipe.img_url) {
        suggestionContent += `<img src="${recipe.img_url}" alt="${recipe.name}" loading="lazy">`;
    }
    
    // Add actions
    suggestionContent += `
        <div class="calendar-recipe-actions">
            <button class="schedule-suggestion-btn" data-recipe-id="${recipe.rec_id}" data-date="${formatDateForDB(currentDate)}" data-day="${dayNumber}">
                Schedule Here
            </button>
            <button class="view-recipe-btn" data-recipe-id="${recipe.rec_id}">View Details</button>
        </div>
    `;
    
    suggestionElement.innerHTML = suggestionContent;
    return suggestionElement;
}

// Add Calendar Event Listeners
function addCalendarEventListeners() {
    // Quick Edit buttons
    document.querySelectorAll('.quick-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const form = document.getElementById(`edit-form-${recipeId}`);
            form.classList.toggle('visible');
        });
    });
    
    // Quick Edit Cancel buttons
    document.querySelectorAll('.quick-cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const form = document.getElementById(`edit-form-${recipeId}`);
            form.classList.remove('visible');
        });
    });
    
    // Quick Edit Forms
    document.querySelectorAll('.quick-edit-form').forEach(form => {
        form.addEventListener('submit', handleQuickEditSubmit);
    });
    
    // View Recipe buttons
    document.querySelectorAll('.view-recipe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            viewRecipeDetails(recipeId);
        });
    });
    
    // Schedule Recipe buttons
    document.querySelectorAll('.schedule-recipe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            const dayNumber = this.getAttribute('data-day');
            showScheduleRecipeDialog(date, dayNumber);
        });
    });
    
    // Schedule Suggestion buttons
    document.querySelectorAll('.schedule-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const date = this.getAttribute('data-date');
            const dayNumber = this.getAttribute('data-day');
            scheduleRecipe(recipeId, date, dayNumber);
        });
    });

    // === NEW: Calendar Recipe Click for Edit Modal ===
    document.querySelectorAll('.calendar-recipe').forEach(el => {
        el.addEventListener('click', function(e) {
            // Only trigger if not clicking a button inside the recipe element
            if (e.target.closest('button')) return;
            const recipeId = this.dataset.recipeId;
            if (window.openRecipeModal && recipeId) {
                window.openRecipeModal(recipeId);
            }
        });
    });

    // === NEW: Edit icon click handler ===
    document.querySelectorAll('.calendar-edit-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            const recipeId = this.getAttribute('data-recipe-id');
            if (window.openRecipeModal && recipeId) {
                window.openRecipeModal(recipeId);
            }
        });
    });
}

// Handle Quick Edit Submit
async function handleQuickEditSubmit(e) {
    e.preventDefault();
    
    const recipeId = this.getAttribute('data-recipe-id');
    const date = document.getElementById(`quick-date-${recipeId}`).value;
    const dayNumber = document.getElementById(`quick-day-${recipeId}`).value;
    
    // Make sure the date is in the correct format
    const normalizedDate = normalizeDate(date);
    
    try {
        const { data, error } = await supabase
            .from('recipes')
            .update({ 
                date: normalizedDate,
                day_number: dayNumber ? parseInt(dayNumber) : null
            })
            .eq('rec_id', recipeId)
            .select();
        
        if (error) throw error;
        
        showMessage('Recipe updated successfully!', 'success');
        
        // Reload calendar data
        await loadCalendarView();
    } catch (error) {
        console.error('Error updating recipe:', error);
        showMessage(`Error updating recipe: ${error.message}`, 'error');
    }
}

// View Recipe Details
function viewRecipeDetails(recipeId) {
    // Hide calendar view
    calendarViewSection.style.display = 'none';
    
    // Show recipe tree view
    document.getElementById('recipe-tree').style.display = 'block';
    
    // Set the recipe select value and trigger loading
    document.getElementById('recipe-select').value = recipeId;
    
    // Manually trigger the recipe data loading
    loadRecipeData(recipeId);
}

// Show Schedule Recipe Dialog
function showScheduleRecipeDialog(date, dayNumber) {
    // Create modal for recipe selection
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = 'schedule-modal';
    
    // Filter recipes to exclude those already in the calendar
    const availableRecipes = allRecipes.filter(recipe => 
        !calendarRecipes.some(r => r.rec_id === recipe.rec_id)
    );
    
    let modalContent = `
        <div class="modal-content">
            <h3>Schedule Recipe for ${date}</h3>
            <div class="form-group">
                <label for="schedule-recipe-select">Select Recipe:</label>
                <select id="schedule-recipe-select">
                    <option value="">-- Select a Recipe --</option>
    `;
    
    availableRecipes.forEach(recipe => {
        modalContent += `<option value="${recipe.rec_id}">${recipe.name} (Day #${recipe.day_number || 'N/A'})</option>`;
    });
    
    modalContent += `
                </select>
            </div>
            <div class="form-group">
                <label for="schedule-day-number">Day Number:</label>
                <input type="number" id="schedule-day-number" value="${dayNumber}" min="1">
            </div>
            <div class="modal-actions">
                <button id="schedule-confirm-btn">Schedule</button>
                <button id="schedule-cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    modalContainer.innerHTML = modalContent;
    document.body.appendChild(modalContainer);
    
    // Add event listeners for modal buttons
    document.getElementById('schedule-confirm-btn').addEventListener('click', function() {
        const selectedRecipeId = document.getElementById('schedule-recipe-select').value;
        const selectedDayNumber = document.getElementById('schedule-day-number').value;
        
        if (!selectedRecipeId) {
            showMessage('Please select a recipe', 'error');
            return;
        }
        
        scheduleRecipe(selectedRecipeId, date, selectedDayNumber);
        document.body.removeChild(modalContainer);
    });
    
    document.getElementById('schedule-cancel-btn').addEventListener('click', function() {
        document.body.removeChild(modalContainer);
    });
}

// Schedule Recipe
async function scheduleRecipe(recipeId, date, dayNumber) {
    try {
        // Make sure the date is in the correct format
        const normalizedDate = normalizeDate(date);
        
        const { data, error } = await supabase
            .from('recipes')
            .update({ 
                date: normalizedDate,
                day_number: dayNumber ? parseInt(dayNumber) : null
            })
            .eq('rec_id', recipeId)
            .select();
        
        if (error) throw error;
        
        showMessage('Recipe scheduled successfully!', 'success');
        
        // Reload calendar data
        await loadCalendarView();
    } catch (error) {
        console.error('Error scheduling recipe:', error);
        showMessage(`Error scheduling recipe: ${error.message}`, 'error');
    }
}

// Navigate to Previous Week
function navigatePrevWeek() {
    if (!currentStartDate) return;
    
    const newStartDate = new Date(currentStartDate);
    newStartDate.setDate(newStartDate.getDate() - 7);
    
    // Update the date input
    calendarStartDate.value = formatDateForInput(newStartDate);
    
    // Load the new calendar data
    loadCalendarView();
}

// Navigate to Next Week
function navigateNextWeek() {
    if (!currentStartDate) return;
    
    const newStartDate = new Date(currentStartDate);
    newStartDate.setDate(newStartDate.getDate() + 7);
    
    // Update the date input
    calendarStartDate.value = formatDateForInput(newStartDate);
    
    // Load the new calendar data
    loadCalendarView();
}

// Update Calendar Range Display
function updateCalendarRange() {
    if (!currentStartDate) return;
    
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + 6);
    
    calendarRange.textContent = `${formatDateForDisplay(currentStartDate)} - ${formatDateForDisplay(endDate)}`;
}

// Helper Functions
function formatDateForDB(date) {
    // Ensure we're using UTC date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForInput(date) {
    return formatDateForDB(date);
}

// Normalize dates for comparison to avoid timezone issues
function normalizeDate(dateStr) {
    if (!dateStr) return '';
    
    // If it's already a YYYY-MM-DD format string, just ensure we're not manipulating it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Otherwise create a date object and format it
    // Use the date constructor with explicit year, month, day to avoid timezone issues
    try {
        // Split the date string
        let parts;
        if (dateStr.includes('-')) {
            parts = dateStr.split('-');
        } else if (dateStr.includes('/')) {
            parts = dateStr.split('/');
        } else {
            // Just use the Date object if we can't parse it manually
            const date = new Date(dateStr);
            return formatDateForDB(date);
        }
        
        // Handle various date formats
        let year, month, day;
        if (parts.length === 3) {
            // Determine the format based on the parts
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
                day = parseInt(parts[2], 10);
            } else {
                // MM-DD-YYYY or DD-MM-YYYY
                // Assume MM-DD-YYYY for simplicity
                year = parseInt(parts[2], 10);
                month = parseInt(parts[0], 10) - 1;
                day = parseInt(parts[1], 10);
            }
            
            // Create a date with specific values (will use local timezone)
            const date = new Date(year, month, day);
            
            // Format as YYYY-MM-DD
            const formattedYear = date.getFullYear();
            const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
            const formattedDay = String(date.getDate()).padStart(2, '0');
            
            return `${formattedYear}-${formattedMonth}-${formattedDay}`;
        }
    } catch (e) {
        console.error("Error normalizing date:", e);
    }
    
    // Fallback to simple format
    const date = new Date(dateStr);
    return formatDateForDB(date);
}

function formatDateForDisplay(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getDayNumber(startDate, currentDate) {
    // Base the day number on days since Jan 1, 2025
    const baseDate = new Date('2025-01-01');
    return Math.floor((currentDate - baseDate) / (24 * 60 * 60 * 1000)) + 1;
}

// Export functions for use in admin-tree.js
window.Calendar = {
    init: initCalendar,
    show: showCalendarView
}; 