/*
 * Streak System for Combo Meal Game
 * Created by APlasker
 * 
 * This file handles tracking consecutive recipe completions using localStorage.
 * Streaks are based on consecutive day_number completions with better than "X" grade.
 */

// Streak System Module
const StreakSystem = (function() {
  // Private variables
  const STORAGE_KEY = 'comboMealStreak';
  
  // Default streak data structure
  const defaultStreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDayNumber: null,
    lastCompletionDate: null,
    completedRecipes: [], // Array of {dayNumber, date, grade, time}
    totalCompletions: 0
  };
  
  // Private functions
  function loadStreakData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all required properties exist
        return {
          ...defaultStreakData,
          ...parsed
        };
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
    return { ...defaultStreakData };
  }
  
  function saveStreakData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Streak data saved:', data);
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  }
  
  function isValidForStreak(validForStreak) {
    // Valid for streak if mistakes < 5 (passed as boolean)
    return validForStreak === true;
  }
  
  // Public API
  return {
    // Get current streak information
    getStreakInfo() {
      return loadStreakData();
    },
    
    // Record a recipe completion
    recordCompletion(dayNumber, validForStreak, timeInSeconds) {
      if (!dayNumber || !isValidForStreak(validForStreak)) {
        console.log('Streak not updated - invalid day number or not valid for streak:', { dayNumber, validForStreak });
        return false;
      }
      
      // Check if this is the tutorial recipe - don't count it for streaks
      if (typeof isTutorialMode !== 'undefined' && isTutorialMode) {
        console.log('Streak not updated - tutorial mode completion does not count for streaks');
        return false;
      }
      
      const streakData = loadStreakData();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if this recipe was already completed today
      const alreadyCompleted = streakData.completedRecipes.some(completion => 
        completion.dayNumber === dayNumber && completion.date === today
      );
      
      if (alreadyCompleted) {
        console.log('Recipe already completed today - streak unchanged');
        return false;
      }
      
      // Record the completion
      const completion = {
        dayNumber: dayNumber,
        date: today,
        validForStreak: validForStreak,
        time: timeInSeconds || 0
      };
      
      streakData.completedRecipes.push(completion);
      streakData.totalCompletions++;
      streakData.lastCompletionDate = today;
      
      // Update streak logic
      if (streakData.lastCompletedDayNumber === null) {
        // First completion ever
        streakData.currentStreak = 1;
        streakData.longestStreak = 1;
      } else if (streakData.lastCompletedDayNumber === dayNumber - 1) {
        // Consecutive day number - increment streak
        streakData.currentStreak++;
        streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
      } else if (streakData.lastCompletedDayNumber === dayNumber) {
        // Same day completion - don't change streak, just update longest if current is higher
        streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
      } else {
        // Non-consecutive - reset streak
        streakData.currentStreak = 1;
      }
      
      streakData.lastCompletedDayNumber = dayNumber;
      
      // Save updated data
      saveStreakData(streakData);
      
      console.log('Streak updated:', {
        dayNumber,
        validForStreak,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak
      });
      
      return true;
    },
    
    // Get formatted streak text for display
    getStreakDisplayText() {
      const data = loadStreakData();
      if (data.currentStreak === 0) {
        return "0";
      }
      return data.currentStreak.toString();
    },
    
    // Get longest streak for display
    getLongestStreakText() {
      const data = loadStreakData();
      return data.longestStreak.toString();
    },
    
    // Reset streak data (for debugging/admin)
    resetStreak() {
      saveStreakData({ ...defaultStreakData });
      console.log('Streak data reset');
    },
    
    // Export streak data (for backup/sharing)
    exportData() {
      return loadStreakData();
    },
    
    // Import streak data (for restore)
    importData(data) {
      if (data && typeof data === 'object') {
        const mergedData = {
          ...defaultStreakData,
          ...data
        };
        saveStreakData(mergedData);
        return true;
      }
      return false;
    }
  };
})();

// Make it globally available
window.StreakSystem = StreakSystem; 