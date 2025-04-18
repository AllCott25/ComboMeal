/*
 * Byline System for Culinary Logic Puzzle
 * Created by APlasker
 * Last Updated: April 10, 2025 (14:06 EDT)
 *
 * This file contains all functionality related to the byline messaging system
 * that appears below the game title. It handles transitioning between messages,
 * timing for automatic message changes, and drawing.
 */

// Byline Module - Encapsulates all byline functionality
const Byline = (function() {
  // Private variables
  // ----------------
  // Text content
  let currentByline = "Drag & drop to combine ingredients!"; // Default byline
  let nextByline = ""; // Store the upcoming byline message
  
  // Default messages and durations
  const DEFAULT_MESSAGE = "Drag & drop to combine ingredients!";
  const INACTIVITY_MESSAGE = "Stuck? Use a Hint!";
  
  // Timing variables
  let bylineTimer = 0; // Timer to track when to revert to default
  const bylineDefaultDuration = 900; // 15 seconds at 60fps
  const bylineHintDuration = 210; // 3.5 seconds at 60fps for non-default messages
  
  // Transition state variables
  let bylineTransitionState = "stable"; // "stable", "fading-out", "changing", "fading-in"
  let bylineOpacity = 255; // Opacity for fade effect
  const bylineFadeFrames = 15; // Number of frames for fade transition (0.25 seconds)
  let isTransitioning = false; // Flag to prevent interrupting transitions
  let transitionDuration = 0; // Duration to display message after transition
  
  // Inactivity tracking
  let lastAction = 0; // Track when the last action occurred (in frame count)
  let inactivityReminderCount = 0; // Track how many inactivity reminders have been shown
  const baseInactivityThreshold = 600; // 10 seconds at 60fps - base inactivity threshold
  
  // Message collections
  const successMessages = [
    "Smells good! Whatcha making?", 
    "It's almost dinner time!"
  ];
  
  const partialComboMessages = [
    "Classic combination!",
    "Those definitely go together",
    "Ok now I'm getting hungry",
    "Chop chop!"
  ];
  
  const errorMessages = [
    "Sounds tasty, but not quite right",
    "That's not exactly how you cook this dish",
    "Need a peek at the recipe? Try a hint!",
    "Keep combo and carry onbo",
    "So close! What else sounds good?",
    "That'd work in a different recipe"
  ];
  
  // Tracking which messages have been used
  let usedPartialComboMessages = [];
  let usedErrorMessages = [];
  let firstErrorOccurred = false;
  let firstPartialComboCreated = false;
  
  // Public functions
  // ----------------
  /**
   * Initialize the byline system
   */
  function initialize() {
    currentByline = DEFAULT_MESSAGE;
    nextByline = "";
    bylineTimer = 0;
    bylineTransitionState = "stable";
    bylineOpacity = 255;
    isTransitioning = false;
    inactivityReminderCount = 0;
    lastAction = 0; // Will be set to current frameCount when game starts
    
    // Reset message tracking
    firstErrorOccurred = false;
    firstPartialComboCreated = false;
    usedPartialComboMessages = [];
    usedErrorMessages = [];
  }
  
  /**
   * Update byline state based on game state
   * @param {number} frameCount - Current frame count from the game
   */
  function update(frameCount) {
    // Only update byline during active gameplay
    if (!window.gameStarted || window.gameWon) return;
    
    // Handle byline transitions
    if (bylineTransitionState === "fading-out") {
      // Fade out current byline
      bylineOpacity = Math.max(0, bylineOpacity - (255 / bylineFadeFrames));
      
      // When fully faded out, change the text
      if (bylineOpacity <= 0) {
        bylineTransitionState = "changing";
      }
    }
    else if (bylineTransitionState === "changing") {
      // Change the byline text
      currentByline = nextByline;
      bylineTransitionState = "fading-in";
      bylineOpacity = 0;
      
      // Set the timer for how long to display this message
      bylineTimer = transitionDuration;
    }
    else if (bylineTransitionState === "fading-in") {
      // Fade in the new byline
      bylineOpacity = Math.min(255, bylineOpacity + (255 / bylineFadeFrames));
      
      // When fully faded in, mark as stable
      if (bylineOpacity >= 255) {
        bylineTransitionState = "stable";
        bylineOpacity = 255;
        isTransitioning = false;
      }
    }
    // Regular timer handling for bylines
    else if (bylineTimer > 0) {
      bylineTimer--;
      if (bylineTimer === 0 && bylineTransitionState === "stable") {
        // Reset to default byline when timer expires with fade transition
        updateWithTransition(DEFAULT_MESSAGE);
      }
    }
    
    // Check for inactivity when not transitioning and not showing a temporary byline
    if (!isTransitioning && bylineTimer === 0) {
      // Calculate the progressive inactivity threshold based on how many reminders have been shown
      const currentInactivityThreshold = baseInactivityThreshold * (inactivityReminderCount + 1);
      
      // If the player has been inactive for the threshold duration, show the hint message
      if (frameCount - lastAction > currentInactivityThreshold) {
        // Set hint byline with transition
        updateWithTransition(INACTIVITY_MESSAGE, bylineHintDuration);
        // Increment the reminder count for progressive timing
        inactivityReminderCount++;
        // Update last action to reset the timer
        lastAction = frameCount;
      }
    }
  }
  
  /**
   * Draw the byline on screen
   * @param {number} playAreaX - X coordinate of the play area
   * @param {number} playAreaY - Y coordinate of the play area
   * @param {number} playAreaWidth - Width of the play area
   */
  function draw(playAreaX, playAreaY, playAreaWidth) {
    // Only draw byline on game screen (not tutorial or win screens)
    if (!window.gameStarted || window.gameWon) return;
    
    // Position byline below the title
    const bylineY = playAreaY + 70; // Position below title
    
    // Calculate byline size based on play area dimensions - match tutorial text
    const bylineSize = Math.max(playAreaWidth * 0.035, 14); // Same as description size in tutorial
    
    // Style the byline text to match tutorial style
    textAlign(CENTER, CENTER);
    textSize(bylineSize);
    textFont(window.bodyFont);
    textStyle(NORMAL);
    
    // Draw with current opacity for fade effect
    fill(51, 51, 51, bylineOpacity); // #333 with alpha
    noStroke();
    
    // Draw the text
    text(currentByline, playAreaX + playAreaWidth/2, bylineY);
  }
  
  /**
   * Transition to a new byline message with fade effect
   * @param {string} newMessage - The new byline message to display
   * @param {number} duration - How long to display the message in frames, defaults to bylineHintDuration
   */
  function updateWithTransition(newMessage, duration = bylineHintDuration) {
    // Prevent interrupting ongoing transitions
    if (isTransitioning) return;
    
    // Don't transition if the message is the same
    if (currentByline === newMessage) return;
    
    // Set transition flag
    isTransitioning = true;
    
    // Store the new message for after fadeout
    nextByline = newMessage;
    
    // Store the duration for the message
    transitionDuration = duration;
    
    // Start fadeout
    bylineTransitionState = "fading-out";
    bylineOpacity = 255;
  }
  
  /**
   * Update the last action timestamp to reset inactivity timer
   * @param {number} frameCount - Current frame count from the game
   */
  function updateLastAction(frameCount) {
    lastAction = frameCount;
  }
  
  /**
   * Reset the inactivity reminder count
   */
  function resetInactivityCount() {
    inactivityReminderCount = 0;
  }
  
  /**
   * Show a random message when the player creates a successful combination
   */
  function showSuccessMessage() {
    // 50% chance of showing a success message
    if (Math.random() < 0.5) {
      // Pick a random message from the array
      const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      updateWithTransition(randomMessage, bylineHintDuration);
    }
    
    // Always reset inactivity counter when player successfully creates a combination
    resetInactivityCount();
    // Update last action timestamp handled by caller
  }
  
  /**
   * Show a message for partial combinations (yellow vessels)
   */
  function showPartialComboMessage() {
    // If this is the first partial combo, always show a message
    if (!firstPartialComboCreated) {
      firstPartialComboCreated = true;
      
      // Select a random message for the first partial combo
      const randomMessage = partialComboMessages[Math.floor(Math.random() * partialComboMessages.length)];
      // Track this message as used
      usedPartialComboMessages.push(randomMessage);
      // Display the message
      updateWithTransition(randomMessage, bylineHintDuration);
    } 
    // For subsequent partial combos, 25% chance of showing a message
    else if (Math.random() < 0.25) {
      // Find messages that haven't been used yet
      const unusedMessages = partialComboMessages.filter(msg => !usedPartialComboMessages.includes(msg));
      
      // If all messages have been used, reset the tracking
      if (unusedMessages.length === 0) {
        usedPartialComboMessages = [];
        // Now all messages are unused
        const randomMessage = partialComboMessages[Math.floor(Math.random() * partialComboMessages.length)];
        usedPartialComboMessages.push(randomMessage);
        updateWithTransition(randomMessage, bylineHintDuration);
      } else {
        // Select a random unused message
        const randomMessage = unusedMessages[Math.floor(Math.random() * unusedMessages.length)];
        // Track this message as used
        usedPartialComboMessages.push(randomMessage);
        // Display the message
        updateWithTransition(randomMessage, bylineHintDuration);
      }
    }
  }
  
  /**
   * Show a random error message when the player makes an incorrect combination
   */
  function showRandomErrorMessage() {
    // Determine probability based on whether this is the first error
    let probability = firstErrorOccurred ? 0.33 : 0.75;
    
    // Mark first error as occurred
    if (!firstErrorOccurred) {
      firstErrorOccurred = true;
    }
    
    // Random chance to show message based on probability
    if (Math.random() < probability) {
      // Find messages that haven't been used yet
      const unusedMessages = errorMessages.filter(msg => !usedErrorMessages.includes(msg));
      
      // If all messages have been used, reset the tracking
      if (unusedMessages.length === 0) {
        usedErrorMessages = [];
        // Now all messages are unused
        const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        usedErrorMessages.push(randomMessage);
        updateWithTransition(randomMessage, bylineHintDuration);
      } else {
        // Select a random unused message
        const randomMessage = unusedMessages[Math.floor(Math.random() * unusedMessages.length)];
        // Track this message as used
        usedErrorMessages.push(randomMessage);
        // Display the message
        updateWithTransition(randomMessage, bylineHintDuration);
      }
    } else {
      // No byline update if we don't show a random message
    }
  }
  
  // Public API
  return {
    initialize,
    update,
    draw,
    updateWithTransition,
    updateLastAction,
    resetInactivityCount,
    showSuccessMessage,
    showPartialComboMessage,
    showRandomErrorMessage
  };
})();

// Export the module
window.Byline = Byline; 