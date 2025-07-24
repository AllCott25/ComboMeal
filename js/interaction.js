// Cross-platform touch handling system - APlasker
let touchSystem = {
  // Track active touches and their states
  activeTouches: {},
  lastTouchId: null,
  isTouch: false,
  
  // Initialize the touch system
  init: function() {
    console.log("Initializing cross-platform touch system");
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect Android specifically
    this.isAndroid = /Android/i.test(navigator.userAgent);
    
    // Log platform detection results
    console.log(`Touch device detected: ${this.isTouch}, Android: ${this.isAndroid}`);
    
    // Add passive event listeners for better scroll performance on Android
    const touchOptions = { passive: false }; // Always non-passive
    
    // Add event listeners with the appropriate options
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), touchOptions);
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), touchOptions);
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), touchOptions);
    
    return this;
  },
  
  // Handle touch start events
  handleTouchStart: function(e) {
    // Convert touch to normalized format and store
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.lastTouchId = touch.identifier;
      this.activeTouches[touch.identifier] = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        target: e.target
      };
    }
  },
  
  // Handle touch move events
  handleTouchMove: function(e) {
    // Update stored touch data
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.activeTouches[touch.identifier]) {
        this.activeTouches[touch.identifier].currentX = touch.clientX;
        this.activeTouches[touch.identifier].currentY = touch.clientY;
      }
    }
  },
  
  // Handle touch end events
  handleTouchEnd: function(e) {
    // Process ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Clean up the touch data
      delete this.activeTouches[touch.identifier];
    }
    
    // Special handling for Android link clicks
    if (this.isAndroid && e.target.tagName.toLowerCase() === 'a') {
      // Don't prevent default for links on Android
      return true;
    }
  },
  
  // Get the current primary touch position (for mouse emulation)
  getCurrentTouchPos: function() {
    // If we have an active touch, return its position
    if (this.lastTouchId !== null && this.activeTouches[this.lastTouchId]) {
      return {
        x: this.activeTouches[this.lastTouchId].currentX,
        y: this.activeTouches[this.lastTouchId].currentY
      };
    }
    
    // Otherwise return null
    return null;
  },
  
  // Check if we're currently processing touch events
  isTouchActive: function() {
    return Object.keys(this.activeTouches).length > 0;
  }
};

// Replace the touchStarted function with our improved version
function touchStarted() {
  // Add safety check for initialization state
  // FIXED: Don't reinitialize when on win screen (gameWon = true)
  if (vessels.length === 0 && !isLoadingRecipe && !gameWon) {
    console.log("Initialization issue detected - reinitializing game");
    initializeGame();
    return false;
  }
  
  // Use the touch system to get touch position
  const touchPos = touchSystem.getCurrentTouchPos();
  if (!touchPos) {
    // Fall back to p5.js touch position if our system doesn't have data
    if (touches.length > 0) {
      touchX = touches[0].x;
      touchY = touches[0].y;
    } else {
      return false; // No touch data available
    }
  } else {
    // Use our normalized touch position
    touchX = touchPos.x;
    touchY = touchPos.y;
  }
  
  // Update mouse coordinates to match touch position
  mouseX = touchX;
  mouseY = touchY;
  
  // Check if touch is on Terms modal HTML elements - allow them to pass through
  if (isModalElement(touchX, touchY)) {
    console.log("Touch on Terms modal HTML element - allowing default behavior");
    return true; // Allow HTML elements to handle the touch
  }
  
      // Handle completion error modal FIRST
  if (showingCompletionError && completionErrorModal?.visible) {
    const modalWidth = Math.min(playAreaWidth * 0.8, 400);
    const modalHeight = Math.min(playAreaHeight * 0.4, 250);
    const modalX = playAreaX + playAreaWidth / 2;
    const modalY = playAreaY + playAreaHeight / 2;
    
    // Button interaction
    const buttonWidth = modalWidth * 0.3;
    const buttonHeight = 40;
    const buttonY = modalY + modalHeight * 0.2;
    
    if (dist(touchX, touchY, modalX, buttonY) < buttonWidth/2) {
      console.log("Completion error modal refresh button touched");
      completionErrorModal.action();
      return false;
    }
    
    return false; // Prevent other interactions when modal is active
  }

  // Terms modal is now handled by HTML - no need for p5.js interaction

  // Handle auth modal interactions (unified design system)
  if (typeof handleAuthModalClick === 'function' && window.authModal && window.authModal.active) {
    if (handleAuthModalClick(touchX, touchY)) {
      return false; // Auth modal handled the touch
    }
  }

    // Handle profile screen interactions FIRST (before hamburger menu)
  if (typeof window.profileActive !== 'undefined' && window.profileActive) {
    
    // NEW RECIPE BOX LAYOUT - Updated button positions - APlasker
    const headerHeight = playAreaHeight * 0.15;
    
    // Back button (top-left in header)
    const backButtonSize = Math.max(playAreaWidth * 0.08, 30);
    const backButtonX = playAreaX + backButtonSize / 2 + 10;
    const backButtonY = playAreaY + backButtonSize / 2 + 10;
    
    if (dist(touchX, touchY, backButtonX, backButtonY) < backButtonSize / 2) {
      console.log("Back button touched - returning to previous state");
      window.profileActive = false;
      return false;
    }
    
    // Sign Out button (top-right in header)
    const signOutButtonWidth = playAreaWidth * 0.2;
    const signOutButtonHeight = backButtonSize * 0.8;
    const signOutButtonX = playAreaX + playAreaWidth - signOutButtonWidth/2 - 10;
    const signOutButtonY = playAreaY + signOutButtonHeight/2 + 10;
    
    if (dist(touchX, touchY, signOutButtonX, signOutButtonY) < signOutButtonWidth/2) {
      console.log("Sign out button touched - showing confirmation modal");
      
      // Show sign out confirmation modal instead of immediately signing out
      showSignOutModal();
      return false;
    }
    
    // SIGN OUT MODAL INTERACTION HANDLING - APlasker
    if (signOutModalActive && signOutModalOpacity > 200) {
      const modalWidth = Math.min(playAreaWidth * 0.8, 300);
      const modalHeight = Math.min(playAreaHeight * 0.4, 200);
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight / 2;
          
      // Updated button positioning to match the improved modal layout
      const buttonWidth = modalWidth * 0.3;
      const buttonHeight = 35;
      const buttonY = modalY + modalHeight * 0.3; // Updated to match new button position
      const buttonSpacing = modalWidth * 0.25; // Updated spacing
      
      const cancelX = modalX - buttonSpacing; // Updated positioning
      const confirmX = modalX + buttonSpacing; // Updated positioning
      
      if (dist(touchX, touchY, cancelX, buttonY) < buttonWidth/2) {
        console.log("Cancel button touched - hiding modal");
        hideSignOutModal();
        return false;
      }
      
      if (dist(touchX, touchY, confirmX, buttonY) < buttonWidth/2) {
        console.log("Confirm sign out button touched");
        if (typeof signOut === 'function') {
          signOut();
        } else {
          console.log("signOut function not available");
        }
        hideSignOutModal();
        return false;
      }
      
      // Click outside modal to close
      const modalLeft = modalX - modalWidth/2;
      const modalRight = modalX + modalWidth/2;
      const modalTop = modalY - modalHeight/2;
      const modalBottom = modalY + modalHeight/2;
      
      if (touchX < modalLeft || touchX > modalRight || touchY < modalTop || touchY > modalBottom) {
        console.log("Clicked outside sign out modal - hiding modal");
        hideSignOutModal();
        return false;
      }
      
      return false; // Prevent other interactions when modal is active
    }
    
    // RECIPE CARD MODAL INTERACTION HANDLING - APlasker
    if (recipeModalActive && recipeModalOpacity > 200 && window.recipeModalButtons) {
      // Full Recipe button
      const fullRecipeBtn = window.recipeModalButtons.fullRecipe;
      if (dist(touchX, touchY, fullRecipeBtn.x, fullRecipeBtn.y) < fullRecipeBtn.w/2) {
        console.log("Full Recipe button touched");
        // Open recipe URL (using placeholder for now)
        window.open(fullRecipeBtn.url, '_blank');
        hideRecipeCardModal();
      return false;
      }
      
      // Close button removed - modal can be closed by tapping outside
      
      // Click outside modal to close
      const modalWidth = Math.min(playAreaWidth * 0.95, 600); // Match actual modal: min(playAreaWidth * 0.95, 600)
      const modalHeight = playAreaHeight * 0.45; // Match actual modal: playAreaHeight * 0.45
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight * 0.4; // Match new modal position: 40% from top
      const modalLeft = modalX - modalWidth/2;
      const modalRight = modalX + modalWidth/2;
      const modalTop = modalY - modalHeight/2;
      const modalBottom = modalY + modalHeight/2;
      
      if (touchX < modalLeft || touchX > modalRight || touchY < modalTop || touchY > modalBottom) {
        console.log("Clicked outside recipe modal - hiding modal");
        hideRecipeCardModal();
        return false;
      }
      
      return false; // Prevent other interactions when modal is active
    }
    
    // RECIPE CARD CLICK HANDLING - APlasker
    if (window.hoveredRecipeCard && !recipeModalActive && !signOutModalActive) {
      const cardBounds = window.hoveredRecipeCard.cardBounds;
      if (touchX >= cardBounds.x && touchX <= cardBounds.x + cardBounds.w &&
          touchY >= cardBounds.y && touchY <= cardBounds.y + cardBounds.h) {
        console.log("Recipe card clicked:", window.hoveredRecipeCard.recipeName);
        showRecipeCardModal(window.hoveredRecipeCard);
        return false;
      }
    }
    
    // RECIPE BOX SCROLLABLE AREA INTERACTION - APlasker  
    const statsY = playAreaY + headerHeight;
    const statsHeight = playAreaHeight * 0.20;
    const recipesY = statsY + statsHeight;
    const recipesHeight = playAreaHeight * 0.65;
    const stackStartY = recipesY + 20;
    
    // Define the entire scrollable area (cards + green box)
    const scrollableArea = {
      x: playAreaX,
      y: stackStartY,
      w: playAreaWidth,
      h: recipesHeight - 20 // Full recipe area minus top margin
    };
    
    const inScrollableArea = (
      touchX >= scrollableArea.x && 
      touchX <= scrollableArea.x + scrollableArea.w &&
      touchY >= scrollableArea.y && 
      touchY <= scrollableArea.y + scrollableArea.h
    );
    
    if (inScrollableArea) {
      console.log("Touch in scrollable recipe area - initializing scroll");
      
      // Initialize scrolling (don't handle card clicks on touchStart - wait for touchEnd)
      recipeListScrolling = true;
      recipeListTouchStartY = touchY;
      recipeListVelocity = 0;
      recipeListTotalScrollDistance = 0; // Track total scroll distance for better tap/scroll detection
      
      return false; // Prevent other interactions in scrollable area
    }
    
    // Handle recipe modal interactions
    if (recipeModalActive && recipeModalOpacity > 200 && window.recipeModalButtons) {
      // Close button removed - modal can be closed by tapping outside
      
      // Check recipe link click
      if (touchX > window.recipeModalButtons.fullRecipe.x - window.recipeModalButtons.fullRecipe.w/2 &&
          touchX < window.recipeModalButtons.fullRecipe.x + window.recipeModalButtons.fullRecipe.w/2 &&
          touchY > window.recipeModalButtons.fullRecipe.y - window.recipeModalButtons.fullRecipe.h/2 &&
          touchY < window.recipeModalButtons.fullRecipe.y + window.recipeModalButtons.fullRecipe.h/2) {
        console.log("Recipe link clicked");
        
        if (typeof trackRecipeClick === 'function') {
          trackRecipeClick();
        }
        
        if (window.recipeModalButtons.fullRecipe.url) {
          window.open(window.recipeModalButtons.fullRecipe.url, '_blank');
        }
        return false;
      }
    }
    
    // Handle sign out modal interactions
    if (signOutModalActive && signOutModalOpacity > 200) {
      const modalWidth = Math.min(playAreaWidth * 0.8, 300);
      const modalHeight = Math.min(playAreaHeight * 0.4, 200);
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight / 2;
      const buttonWidth = modalWidth * 0.3;
      const buttonHeight = 35;
      const buttonY = modalY + modalHeight * 0.3; // Updated to match new button position
      const buttonSpacing = modalWidth * 0.25;
      
      const cancelX = modalX - buttonSpacing;
      const confirmX = modalX + buttonSpacing;
      
      // Check cancel button
      if (dist(touchX, touchY, cancelX, buttonY) < buttonWidth/2) {
        console.log("Sign out cancelled");
        hideSignOutModal();
        return false;
      }
      
      // Check confirm button
      if (dist(touchX, touchY, confirmX, buttonY) < buttonWidth/2) {
        console.log("Sign out confirmed");
        hideSignOutModal();
        
        // Perform sign out after modal closes
        setTimeout(() => {
          if (typeof signOut === 'function') {
            signOut();
          } else {
            // Fallback if signOut function not available
            window.authState = { isAuthenticated: false, user: null, isAnonymous: false };
            window.profileActive = false;
            gameState = "start";
          }
        }, 200);
        return false;
      }
    }
    
    // Block other interactions while on profile screen
    return false;
  }

  // Check hamburger menu button (after profile screen check)
  // Note: menu only shows on title and win screens (when !gameStarted || gameWon)
  if (hamburgerMenu && (!gameStarted || gameWon)) {
    console.log("Checking hamburger menu click, gameStarted:", gameStarted, "gameWon:", gameWon);
    const menuHandled = hamburgerMenu.handleClick(mouseX, mouseY);
    if (menuHandled) {
      console.log("Hamburger menu button clicked");
      
      return false; // Prevent further processing
    }
  }

  // Check if auth modal is open and handle touches
  if (window.authModal && window.authModal.active) {
    // Check if touch is on the email input
    const emailInput = document.getElementById('auth-email-input');
    if (emailInput) {
      const rect = emailInput.getBoundingClientRect();
      const touchClientX = touches.length > 0 ? touches[0].clientX : touchX;
      const touchClientY = touches.length > 0 ? touches[0].clientY : touchY;
      
      if (touchClientX >= rect.left && touchClientX <= rect.right &&
          touchClientY >= rect.top && touchClientY <= rect.bottom) {
        emailInput.focus();
        return true; // Allow default behavior for input field
      }
    }
    
    // Handle auth modal clicks using the existing function
    if (typeof handleAuthModalClick === 'function') {
      if (handleAuthModalClick(touchX, touchY)) {
        return false; // Auth modal handled the touch
      }
    }
  }

  // Check if a modal is active - selectively allow interactions with modal elements
  if (modalActive) {
    const targetElement = document.elementFromPoint(touchX, touchY);
    if (isModalElement(touchX, touchY)) {
      console.log("Touch event allowed for modal element:", targetElement.tagName);
      if (targetElement && (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA')) {
        targetElement.focus(); // Explicitly focus
      }
      return true; // Allow default browser behavior
    }
    return false;
  }
  
  // Prevent user interaction during auto-combination sequence
  if (autoFinalCombination) {
    return false;
  }
  
  // Check if any easter egg modal is active and handle the click  
  for (let i = eggModals.length - 1; i >= 0; i--) {
    if (eggModals[i].active && eggModals[i].checkClick(touchX, touchY)) {
      // Modal was clicked, don't process any other clicks
      return false;
    }
  }
  
  // Prevent default touch behavior to avoid scrolling
  // Only do this if we're actually handling the touch
  let touchHandled = false;
  
  // Handle the same logic as mousePressed but with touch coordinates
  if (!gameStarted) {
    // Check if start button was touched
    if (startButton.isInside(touchX, touchY)) {
      startGame();
      touchHandled = true;
    }
    
    // Check if tutorial button was touched - APlasker
    if (tutorialButton.isInside(touchX, touchY)) {
      startTutorial();
      touchHandled = true;
    }
    
    // Tutorial screen - check if Say hi link was touched
    if (typeof tutorialSayHiLinkX !== 'undefined') {
      const isOverTutorialSayHi = (
        touchX > tutorialSayHiLinkX - tutorialSayHiLinkWidth/2 && 
        touchX < tutorialSayHiLinkX + tutorialSayHiLinkWidth/2 && 
        touchY > tutorialSayHiLinkY - tutorialSayHiLinkHeight/2 && 
        touchY < tutorialSayHiLinkY + tutorialSayHiLinkHeight/2
      );
      
      if (isOverTutorialSayHi) {
        if (typeof showFeedbackModal === 'function') {
          showFeedbackModal();
          touchHandled = true;
          return false;
        }
      }
    }
  } else if (gameWon) {
    // Check for random recipe hotspot first
    if (!isLoadingRandomRecipe && isInRandomRecipeHotspot(touchX, touchY)) {
      console.log("Random recipe hotspot touched at:", touchX, touchY);
      isLoadingRandomRecipe = true;
      loadRandomRecipe().finally(() => {
        isLoadingRandomRecipe = false;
      });
      touchHandled = true;
      return false;
    }
    
    // Debugging log to help track touch coordinates
    console.log("Touch on win screen:", touchX, touchY);
    
    // Check if the Say hi link was touched (in win screen)
    if (typeof handleSayHiLinkInteraction === 'function' && handleSayHiLinkInteraction(touchX, touchY)) {
      console.log("Say hi link handled in win screen");
      touchHandled = true;
      return false;
    }
    
    // Special handling for tutorial mode - APlasker
    if (isTutorialMode) {
      console.log("Tutorial win screen touch detected");
      
      // Use simplified hover detection based on screen position
      isMouseOverLetterScore = (touchY >= height/2);
      isMouseOverCard = (touchY < height/2);
      
      // Handle recipe card clicks in tutorial mode
      if (isMouseOverCard) {
        console.log("Tutorial recipe card touched - opening recipe URL");
        viewRecipe(); // Allow recipe link functionality
        touchHandled = true;
        return false;
      }
      
      // Handle score card click
      if (isMouseOverLetterScore) {
        console.log("Tutorial score card touched - loading today's recipe");
        
        // Reset tutorial mode
        isTutorialMode = false;
        
        // Reset game state
        gameStarted = false;
        gameWon = false;
        moveHistory = [];
        hintCount = 0;
        vessels = [];
        animations = [];
        
        // Set loading state
        isLoadingRecipe = true;
        
        // Load today's recipe and start the game
        console.log("Loading today's recipe after tutorial (direct touch)");
        loadRecipeData().then(() => {
          // Reset auto-combination flags to ensure final animation works properly
          autoFinalCombination = false;
          autoFinalCombinationStarted = false;
          autoFinalCombinationTimer = 0;
          autoFinalCombinationState = "WAITING";
          finalCombinationVessels = [];
          
          // Start the game automatically once recipe is loaded
          startGame();
        }).catch(error => {
          console.error("Error loading today's recipe:", error);
          isLoadingRecipe = false;
          loadingError = true;
        });
        
        touchHandled = true;
        return false;
      }
      
      touchHandled = true;
      return false;
    }
    
    // Regular (non-tutorial) win screen handling
    // Use simpler touch detection on win screen - top half shows recipe, bottom half shares score
    if (touchY < height/2) {
      // Top half = view recipe
      console.log("View Recipe triggered (win screen touch - top half)");
      viewRecipe();
      touchHandled = true;
    } else {
      // Bottom half = share score
      console.log("Share Score triggered (win screen touch - bottom half)");
      shareScore();
      touchHandled = true;
    }
  } else {
    // Check if hint button was touched
    if (!showingHint && hintButton.isInside(touchX, touchY)) {
      showHint();
      touchHandled = true;
    }
    
    // Check if a vessel was touched
    for (let v of vessels) {
      if (v.isInside(touchX, touchY)) {
        draggedVessel = v;
        // Store original position for proper snapback
        draggedVessel.originalX = v.x;
        draggedVessel.originalY = v.y;
        offsetX = touchX - v.x;
        offsetY = touchY - v.y;
        
        // IMMEDIATELY expand text margin before scale animation starts - APlasker
        // This prevents visual glitching during the transition
        v.textMargin = 0.85;
        
        // Set target scales for body and text (this will happen gradually through update())
        // Body scales to 105% while text only scales to 102.5% as per 20250413updates_final.txt
        v.targetBodyScale = 1.05;
        v.targetTextScale = 1.025;
        
        // Keep legacy targetScale for backward compatibility
        v.targetScale = 1.05;
        
        triggerHapticFeedback('success'); // Haptic feedback on successful drag
        touchHandled = true;
        break;
      }
    }
  }
  
  // Update the isMouseOverLetterScore flag for consistent hover state
  if (gameWon) {
    // Use simplified hover detection based on screen position
    isMouseOverLetterScore = (touchY >= height/2);
    isMouseOverCard = (touchY < height/2);
  }
  
  // Check for help icon touch
  if (!gameWon && gameStarted) { // Only check for help icon during gameplay
    // Always use circle hit detection now that we're always in circular mode
    const touchedHelpButton = dist(touchX, touchY, helpIconX, helpIconY) < helpIconSize/2;
    
    if (touchedHelpButton) {
      if (typeof showHelpModal === 'function') {
        // In game, show help modal
        console.log("Help button touched in game - showing help modal");
        showHelpModal();
        touchHandled = true;
        return false; // Prevent other touch handling
      }
    }
    
    // Don't process other touches if help modal is open
    if (typeof helpModal !== 'undefined' && helpModal !== null && helpModal.active) {
      touchHandled = helpModal.checkClick(touchX, touchY);
      return false;
    }
  }
  
  if (touchHandled) {
    return false; // Prevent default only if we handled the touch
  }
  
  // Check for random recipe hotspot last
  if (gameWon && !isLoadingRandomRecipe && isInRandomRecipeHotspot(touchX, touchY)) {
    console.log("Random recipe hotspot touched at:", touchX, touchY);
    isLoadingRandomRecipe = true;
    loadRandomRecipe().finally(() => {
      isLoadingRandomRecipe = false;
    });
  }
  
  return true; // Allow default behavior if not handled
}

// Replace touchEnded function with improved version
function touchEnded() {
  // Use the touch system to get touch position
  const touchPos = touchSystem.getCurrentTouchPos();
  if (!touchPos && touches.length > 0) {
    // Fall back to p5.js touch position if our system doesn't have data
    mouseX = touches[0].x;
    mouseY = touches[0].y;
  } else if (touchPos) {
    // Use our normalized touch position
    mouseX = touchPos.x;
    mouseY = touchPos.y;
  }
  
  // Handle Terms modal touch release
  // Terms modal is now handled by HTML - no need for p5.js interaction
  
  // PROFILE SCREEN SCROLLING END AND CARD CLICK HANDLING - APlasker
  if (typeof window.profileActive !== 'undefined' && window.profileActive && recipeListScrolling) {
    recipeListScrolling = false; // Stop active scrolling
    console.log("Scrolling ended, checking for card click. Velocity:", recipeListVelocity, "Total distance:", recipeListTotalScrollDistance);
    
    // Better tap vs scroll detection - use both velocity and total distance
    const isScrollGesture = Math.abs(recipeListVelocity) > 3 || recipeListTotalScrollDistance > 15;
    
    if (!isScrollGesture) {
      console.log("Minimal scroll movement - checking for card clicks");
      
      // Check for recipe card clicks using front-to-back hit testing
      if (window.clickableRecipeCards && window.clickableRecipeCards.length > 0) {
        // Use reverse order for front-to-back hit testing (last card drawn is on top)
        for (let i = window.clickableRecipeCards.length - 1; i >= 0; i--) {
          const card = window.clickableRecipeCards[i];
          if (mouseX >= card.bounds.x && mouseX <= card.bounds.x + card.bounds.w &&
              mouseY >= card.bounds.y && mouseY <= card.bounds.y + card.bounds.h) {
            
            console.log("Recipe card clicked on touchEnd:", card.recipeName);
            
            // Show recipe modal
            showRecipeCardModal(card);
            return false;
          }
        }
      }
    } else {
      console.log("Significant scroll movement - not handling card clicks");
    }
    
    return false;
  }
  
  // Check if a modal is active - selectively allow interactions with modal elements
  if (modalActive) {
    // Get the element being touched
    const target = document.elementFromPoint(mouseX, mouseY);
    
    // If the target is part of our modal (check parent chain)
    if (target && (
        target.closest('#feedback-modal') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A')) { // Add support for anchor tags
      
      // Special handling for Android links
      if (touchSystem.isAndroid && target.tagName === 'A') {
        console.log('Android link detected, using special handling');
        
        // For Android, we need to manually trigger the link
        setTimeout(() => {
          // Use a small timeout to ensure the touch event completes
          window.open(target.href, target.target || '_self');
        }, 50);
        
        return false; // Prevent default to avoid double-activation
      }
      
      // Allow the event to proceed to HTML elements
      console.log('Touch event allowed for modal element: ' + (target.tagName || 'unknown'));
      return true;
    }
    
    return false;
  }
  
  // Check if help modal was active but is now inactive,
  // ensure HTML elements are properly cleaned up
  if (typeof helpModal !== 'undefined' && helpModal !== null && !helpModal.active && 
      helpModal.htmlElements && helpModal.htmlElements.length > 0) {
    helpModal.removeHTMLElements();
  }
  
  // Call the mouse event handler
  mouseReleased();
  
  // Prevent default to avoid scrolling
  return false;
}

// Replace touchMoved function with improved version
function touchMoved() {
  // Use the touch system to get touch position
  const touchPos = touchSystem.getCurrentTouchPos();
  if (!touchPos && touches.length > 0) {
    // Fall back to p5.js touch position if our system doesn't have data
    touchX = touches[0].x;
    touchY = touches[0].y;
  } else if (touchPos) {
    // Use our normalized touch position
    touchX = touchPos.x;
    touchY = touchPos.y;
  } else {
    return false; // No touch data available
  }
  
  // Update mouse coordinates to match touch position
  mouseX = touchX;
  mouseY = touchY;
  
  // Terms modal is now handled by HTML - no need for p5.js interaction
  
  // PROFILE SCREEN SCROLLING - APlasker
  if (typeof window.profileActive !== 'undefined' && window.profileActive && recipeListScrolling) {
    // Calculate scroll delta - positive when moving finger up (should bring cards up)
    const scrollDelta = touchY - recipeListTouchStartY;
    // Track total scroll distance for tap vs scroll detection
    recipeListTotalScrollDistance += Math.abs(scrollDelta);
    // Update scroll position with proper constraints (negative brings cards up)
    recipeListScrollY = constrain(recipeListScrollY + scrollDelta, -recipeListMaxScroll, 0);
    recipeListTouchStartY = touchY; // Update for next movement
    recipeListVelocity = scrollDelta; // Store velocity for momentum
    return false; // Don't process other movements while scrolling
  }
  
  // Check if a modal is active - selectively allow interactions with modal elements
  if (modalActive) {
    // Get the element being touched
    const target = document.elementFromPoint(touchX, touchY);
    
    // If the target is part of our modal (check parent chain)
    if (target && (
        target.closest('#feedback-modal') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON')) {
      // Allow the event to proceed to HTML elements
      return true;
    }
    
    return false;
  }
  
  // Prevent dragging during auto-combination sequence
  if (autoFinalCombination) {
    return false;
  }
  
  // Update drag position if we have a dragged vessel
  if (draggedVessel) {
    draggedVessel.x = touchX - draggedVessel.dragOffsetX;
    draggedVessel.y = touchY - draggedVessel.dragOffsetY;
    
    // Ensure vessel scale is maintained during dragging
    draggedVessel.targetScale = 1.05;
    
    // Update cursor style for feedback
    lastMovedFrame = frameCount;
    
    // Check for vessels that are overlapping
    overVessel = null;
    for (let vessel of vessels) {
      if (vessel !== draggedVessel && vessel.isInside(touchX, touchY)) {
        overVessel = vessel;
        break;
      }
    }
    
    // Update last action time
    lastAction = frameCount;
  }
  
  // If help modal is open, allow it to handle touch movement
  if (typeof helpModal !== 'undefined' && helpModal !== null && helpModal.active) {
    return false;
  }
  
  // Prevent default touch behavior (prevents scrolling etc.)
  return false;
}

// Helper function to check if a point is interacting with a modal element
function isModalElement(x, y) {
  // Get the element at the given coordinates
  const element = document.elementFromPoint(x, y);
  
  if (!element) return false;
  
  // Check if the element is part of a modal
  return element.closest('#feedback-modal') || 
         element.closest('#auth-modal') || // Updated to recognize new auth modal
         element.closest('#terms-modal') || // Terms & Conditions modal
         element.id === 'auth-email-input' || // Add specific check for auth email input
         element.tagName === 'INPUT' || 
         element.tagName === 'TEXTAREA' || 
         element.tagName === 'BUTTON' ||
         element.tagName === 'A';
}

function updateCursor() {
  let overInteractive = false;
  
  // Check hamburger menu button if it exists and is initialized
  if (typeof hamburgerMenu !== 'undefined' && hamburgerMenu.initialized && hamburgerMenu.menuButton) {
    if (hamburgerMenu.menuButton.isInside(mouseX, mouseY)) {
      overInteractive = true;
    }
  }
  
  // Check auth modal buttons if modal is active (unified design system)
  if (window.authModal && window.authModal.active) {
    // Check Sign In button
    if (window.authModal.signInButton) {
      const btn = window.authModal.signInButton;
      if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 && 
          mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
        overInteractive = true;
      }
    }
    
    // Check Sign Up button
    if (window.authModal.signUpButton) {
      const btn = window.authModal.signUpButton;
      if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 && 
          mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
        overInteractive = true;
      }
    }
    
    // Check email field
    if (window.authModal.emailField) {
      const field = window.authModal.emailField;
      if (mouseX > field.x - field.w/2 && mouseX < field.x + field.w/2 && 
          mouseY > field.y - field.h/2 && mouseY < field.y + field.h/2) {
        overInteractive = true;
      }
    }
    
    // Check OK button (for success state)
    if (window.authModal.okButton) {
      const btn = window.authModal.okButton;
      if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 && 
          mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
        overInteractive = true;
      }
    }
    
    // Check close button
    if (window.authModal.closeButton) {
      const btn = window.authModal.closeButton;
      if (dist(mouseX, mouseY, btn.x, btn.y) < btn.size) {
        overInteractive = true;
      }
    }
  }
  
  if (!gameStarted) {
    // Check start button
    if (startButton.isInside(mouseX, mouseY)) {
      overInteractive = true;
    }
    
    // Check tutorial Say hi link
    if (typeof isTutorialMouseOverSayHi !== 'undefined' && isTutorialMouseOverSayHi) {
      overInteractive = true;
    }
  } else if (gameWon) {
    // Check buttons and recipe card
    if (isMouseOverScoreCard || isMouseOverCard) {
      overInteractive = true;
    }
  } else {
    // Check vessels
    for (let v of vessels) {
      if (v.isInside(mouseX, mouseY)) {
        overInteractive = true;
        break;
      }
    }
    
    // Check hint vessel
    if (showingHint && hintVessel && hintVessel.isInside(mouseX, mouseY)) {
      overInteractive = true;
    }
    
    // Check buttons
    if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
      overInteractive = true;
    }
  }
  
  // Set cursor
  cursor(overInteractive ? HAND : ARROW);
}

// Add new state variables for win screen touch handling
let winScreenTouchState = {
  startX: 0,
  startY: 0,
  element: null,
  touchMoved: false,
  processingTouch: false
};

// Update mousePressed function to track win screen interactions but don't execute them
function emousePressed() {
  // Update last action timestamp when user clicks
  lastAction = frameCount;

  // Check if click is on Terms modal HTML elements - allow them to pass through
  if (isModalElement(mouseX, mouseY)) {
    console.log("Click on Terms modal HTML element - allowing default behavior");
    return true; // Allow HTML elements to handle the click
  }

  // Handle completion error modal FIRST
  if (showingCompletionError && completionErrorModal?.visible) {
    const modalWidth = Math.min(playAreaWidth * 0.8, 400);
    const modalHeight = Math.min(playAreaHeight * 0.4, 250);
    const modalX = playAreaX + playAreaWidth / 2;
    const modalY = playAreaY + playAreaHeight / 2;
    
    // Button interaction
    const buttonWidth = modalWidth * 0.3;
    const buttonHeight = 40;
    const buttonY = modalY + modalHeight * 0.2;
    
    if (dist(mouseX, mouseY, modalX, buttonY) < buttonWidth/2) {
      console.log("Completion error modal refresh button clicked");
      completionErrorModal.action();
      return false;
    }
    
    return false; // Prevent other interactions when modal is active
  }

  // Terms modal is now handled by HTML - no need for p5.js interaction

  // Handle auth modal interactions (unified design system)
  if (typeof handleAuthModalClick === 'function' && window.authModal && window.authModal.active) {
    if (handleAuthModalClick(mouseX, mouseY)) {
      return false; // Auth modal handled the click
    }
  }

  // Handle profile screen interactions FIRST (before hamburger menu)
  if (typeof window.profileActive !== 'undefined' && window.profileActive) {
    
    // NEW RECIPE BOX LAYOUT - Updated button positions - APlasker
    const headerHeight = playAreaHeight * 0.15;
    
    // Back button (top-left in header)
    const backButtonSize = Math.max(playAreaWidth * 0.08, 30);
    const backButtonX = playAreaX + backButtonSize / 2 + 10;
    const backButtonY = playAreaY + backButtonSize / 2 + 10;
    
    if (dist(mouseX, mouseY, backButtonX, backButtonY) < backButtonSize / 2) {
      console.log("Back button clicked - returning to previous state");
      window.profileActive = false;
      return false;
    }
    
    // Sign Out button (top-right in header)
    const signOutButtonWidth = playAreaWidth * 0.2;
    const signOutButtonHeight = backButtonSize * 0.8;
    const signOutButtonX = playAreaX + playAreaWidth - signOutButtonWidth/2 - 10;
    const signOutButtonY = playAreaY + signOutButtonHeight/2 + 10;
    
    if (dist(mouseX, mouseY, signOutButtonX, signOutButtonY) < signOutButtonWidth/2) {
      console.log("Sign out button clicked - showing confirmation modal");
      
      // Show sign out confirmation modal instead of immediately signing out
      showSignOutModal();
      return false;
    }
    
    // SIGN OUT MODAL INTERACTION HANDLING - APlasker
    if (signOutModalActive && signOutModalOpacity > 200) {
      const modalWidth = Math.min(playAreaWidth * 0.8, 300);
      const modalHeight = Math.min(playAreaHeight * 0.4, 200);
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight / 2;
          
      // Updated button positioning to match the improved modal layout
      const buttonWidth = modalWidth * 0.3;
      const buttonHeight = 35;
      const buttonY = modalY + modalHeight * 0.3; // Updated to match new button position
      const buttonSpacing = modalWidth * 0.25; // Updated spacing
      
      const cancelX = modalX - buttonSpacing; // Updated positioning
      const confirmX = modalX + buttonSpacing; // Updated positioning
      
      if (dist(mouseX, mouseY, cancelX, buttonY) < buttonWidth/2) {
        console.log("Cancel button touched - hiding modal");
        hideSignOutModal();
        return false;
      }
      
      if (dist(mouseX, mouseY, confirmX, buttonY) < buttonWidth/2) {
        console.log("Confirm sign out button touched");
        if (typeof signOut === 'function') {
          signOut();
        } else {
          console.log("signOut function not available");
        }
        hideSignOutModal();
        return false;
      }
      
      // Click outside modal to close
      const modalLeft = modalX - modalWidth/2;
      const modalRight = modalX + modalWidth/2;
      const modalTop = modalY - modalHeight/2;
      const modalBottom = modalY + modalHeight/2;
      
      if (mouseX < modalLeft || mouseX > modalRight || mouseY < modalTop || mouseY > modalBottom) {
        console.log("Clicked outside sign out modal - hiding modal");
        hideSignOutModal();
        return false;
      }
      
      return false; // Prevent other interactions when modal is active
    }
    
    // RECIPE CARD MODAL INTERACTION HANDLING - APlasker
    if (recipeModalActive && recipeModalOpacity > 200 && window.recipeModalButtons) {
      // Full Recipe button
      const fullRecipeBtn = window.recipeModalButtons.fullRecipe;
      if (dist(mouseX, mouseY, fullRecipeBtn.x, fullRecipeBtn.y) < fullRecipeBtn.w/2) {
        console.log("Full Recipe button touched");
        // Open recipe URL (using placeholder for now)
        window.open(fullRecipeBtn.url, '_blank');
        hideRecipeCardModal();
      return false;
      }
      
      // Close button removed - modal can be closed by clicking outside (see below)
      
      // Click outside modal to close
      const modalWidth = Math.min(playAreaWidth * 0.95, 600); // Match actual modal: min(playAreaWidth * 0.95, 600)
      const modalHeight = playAreaHeight * 0.45; // Match actual modal: playAreaHeight * 0.45
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight * 0.4; // Match new modal position: 40% from top
      const modalLeft = modalX - modalWidth/2;
      const modalRight = modalX + modalWidth/2;
      const modalTop = modalY - modalHeight/2;
      const modalBottom = modalY + modalHeight/2;
      
      if (mouseX < modalLeft || mouseX > modalRight || mouseY < modalTop || mouseY > modalBottom) {
        console.log("Clicked outside recipe modal - hiding modal");
        hideRecipeCardModal();
        return false;
      }
      
      return false; // Prevent other interactions when modal is active
    }
    
    // RECIPE CARD CLICK HANDLING - APlasker
    if (window.hoveredRecipeCard && !recipeModalActive && !signOutModalActive) {
      const cardBounds = window.hoveredRecipeCard.cardBounds;
      if (mouseX >= cardBounds.x && mouseX <= cardBounds.x + cardBounds.w &&
          mouseY >= cardBounds.y && mouseY <= cardBounds.y + cardBounds.h) {
        console.log("Recipe card clicked:", window.hoveredRecipeCard.recipeName);
        showRecipeCardModal(window.hoveredRecipeCard);
        return false;
      }
    }
    
    // RECIPE BOX SCROLLABLE AREA INTERACTION - APlasker
    const statsY = playAreaY + headerHeight;
    const statsHeight = playAreaHeight * 0.20;
    const recipesY = statsY + statsHeight;
    const recipesHeight = playAreaHeight * 0.65;
    const stackStartY = recipesY + 20;
    
    // Define the entire scrollable area (cards + green box)
    const scrollableArea = {
      x: playAreaX,
      y: stackStartY,
      w: playAreaWidth,
      h: recipesHeight - 20 // Full recipe area minus top margin
    };
    
    const inScrollableArea = (
      mouseX >= scrollableArea.x && 
      mouseX <= scrollableArea.x + scrollableArea.w &&
      mouseY >= scrollableArea.y && 
      mouseY <= scrollableArea.y + scrollableArea.h
    );
    
    if (inScrollableArea) {
      console.log("Mouse in scrollable recipe area - initializing scroll");
      
      // Initialize scrolling (don't handle card clicks on mousePressed - wait for mouseReleased)
      recipeListScrolling = true;
      recipeListTouchStartY = mouseY;
      recipeListVelocity = 0;
      recipeListTotalScrollDistance = 0; // Track total scroll distance for better click/scroll detection
      
      return false; // Prevent other interactions in scrollable area
    }
    
    // Handle recipe modal interactions
    if (recipeModalActive && recipeModalOpacity > 200 && window.recipeModalButtons) {
      // Close button removed - modal can be closed by clicking outside
      
      // Check recipe link click
      if (mouseX > window.recipeModalButtons.fullRecipe.x - window.recipeModalButtons.fullRecipe.w/2 &&
          mouseX < window.recipeModalButtons.fullRecipe.x + window.recipeModalButtons.fullRecipe.w/2 &&
          mouseY > window.recipeModalButtons.fullRecipe.y - window.recipeModalButtons.fullRecipe.h/2 &&
          mouseY < window.recipeModalButtons.fullRecipe.y + window.recipeModalButtons.fullRecipe.h/2) {
        console.log("Recipe link clicked");
        
        if (typeof trackRecipeClick === 'function') {
          trackRecipeClick();
        }
        
        if (window.recipeModalButtons.fullRecipe.url) {
          window.open(window.recipeModalButtons.fullRecipe.url, '_blank');
        }
        return false;
      }
    }
    
    // Handle sign out modal interactions
    if (signOutModalActive && signOutModalOpacity > 200) {
      const modalWidth = Math.min(playAreaWidth * 0.8, 300);
      const modalHeight = Math.min(playAreaHeight * 0.4, 200);
      const modalX = playAreaX + playAreaWidth / 2;
      const modalY = playAreaY + playAreaHeight / 2;
      const buttonWidth = modalWidth * 0.3;
      const buttonHeight = 35;
      const buttonY = modalY + modalHeight * 0.3; // Updated to match new button position
      const buttonSpacing = modalWidth * 0.25;
      
      const cancelX = modalX - buttonSpacing;
      const confirmX = modalX + buttonSpacing;
      
      // Check cancel button
      if (dist(mouseX, mouseY, cancelX, buttonY) < buttonWidth/2) {
        console.log("Sign out cancelled");
        hideSignOutModal();
        return false;
      }
      
      // Check confirm button
      if (dist(mouseX, mouseY, confirmX, buttonY) < buttonWidth/2) {
        console.log("Sign out confirmed");
        hideSignOutModal();
        
        // Perform sign out after modal closes
        setTimeout(() => {
          if (typeof signOut === 'function') {
            signOut();
          } else {
            // Fallback if signOut function not available
            window.authState = { isAuthenticated: false, user: null, isAnonymous: false };
            window.profileActive = false;
            gameState = "start";
          }
        }, 200);
        return false;
      }
    }
    
    // Block other interactions while on profile screen
    return false;
  }

  // Check hamburger menu button (after profile screen check)
  // Note: menu only shows on title and win screens (when !gameStarted || gameWon)
  if (hamburgerMenu && (!gameStarted || gameWon)) {
    console.log("Checking hamburger menu click, gameStarted:", gameStarted, "gameWon:", gameWon);
    const menuHandled = hamburgerMenu.handleClick(mouseX, mouseY);
    if (menuHandled) {
      console.log("Hamburger menu button clicked");
      
      return false; // Prevent further processing
    }
  }

  // Check if we should handle authentication modal
  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    // Allow clicks to pass through to HTML elements in the auth modal
    return true;
  }

  // Early return if modal is active and click is not on a modal element
  if (modalActive) {
    const isModal = isModalElement(mouseX, mouseY);
    console.log("Modal active, checking element:", isModal);
    if (!isModal) {
      return false; // Block interaction with p5.js elements
    }
    return true; // Allow interaction with HTML modal elements
  }
  
  // Add safety check for initialization state
  // FIXED: Don't reinitialize when on win screen (gameWon = true)
  if (vessels.length === 0 && !isLoadingRecipe && !gameWon) {
    console.log("Initialization issue detected - reinitializing game");
    initializeGame();
    return false;
  }
  
  // Prevent user interaction during auto-combination sequence
  if (autoFinalCombination) {
    return false;
  }
  
  // Check if any easter egg modal is active and handle the click  
  for (let i = eggModals.length - 1; i >= 0; i--) {
    if (eggModals[i].active && eggModals[i].checkClick(mouseX, mouseY)) {
      // Modal was clicked, don't process any other clicks
      return false;
    }
  }
  
  // MODIFIED: Win screen handling - track but don't execute actions yet
  if (gameWon) {
    // Check if we're clicking on the random recipe hotspot
    if (!isLoadingRandomRecipe && isInRandomRecipeHotspot(mouseX, mouseY)) {
      console.log("Random recipe hotspot clicked at:", mouseX, mouseY);
      isLoadingRandomRecipe = true;
      loadRandomRecipe().finally(() => {
        isLoadingRandomRecipe = false;
      });
      return false;
    }
    
    // Debugging log to help track click coordinates
    console.log("Click on win screen:", mouseX, mouseY);
    
    // Check if the Say hi link was clicked - add this before other win screen clicks
    if (typeof handleSayHiLinkInteraction === 'function' && handleSayHiLinkInteraction(mouseX, mouseY)) {
      console.log("Say hi link handled");
      return false;
    }
    
    // Special handling for tutorial mode
    if (isTutorialMode) {
      console.log("Tutorial win screen click detected, isMouseOverLetterScore:", isMouseOverLetterScore);
      
      // MODIFIED: Just track the element but don't execute action yet
      // Set element in winScreenTouchState
      if (isMouseOverCard) {
        console.log("Tutorial recipe card clicked - tracking for release");
        winScreenTouchState.element = "tutorialRecipe";
        winScreenTouchState.startX = mouseX;
        winScreenTouchState.startY = mouseY;
        winScreenTouchState.touchMoved = false;
        winScreenTouchState.processingTouch = true;
      } else if (isMouseOverLetterScore) {
        console.log("Tutorial score card clicked - tracking for release");
        winScreenTouchState.element = "tutorialScore";
        winScreenTouchState.startX = mouseX;
        winScreenTouchState.startY = mouseY;
        winScreenTouchState.touchMoved = false;
        winScreenTouchState.processingTouch = true;
      }
      
      return false;
    }
    
    // Regular (non-tutorial) win screen handling
    // If the mouse is over the Score Card, set up for shareScore
    if (typeof isMouseOverScoreCard !== 'undefined' && isMouseOverScoreCard) {
      console.log("Share Score (full card) clicked - tracking for release");
      winScreenTouchState.element = "shareScore";
      winScreenTouchState.startX = mouseX;
      winScreenTouchState.startY = mouseY;
      winScreenTouchState.touchMoved = false;
      winScreenTouchState.processingTouch = true;
    } else if (isMouseOverCard) {
      // (Keep viewRecipe for recipe card if needed)
      winScreenTouchState.element = "viewRecipe";
      winScreenTouchState.startX = mouseX;
      winScreenTouchState.startY = mouseY;
      winScreenTouchState.touchMoved = false;
      winScreenTouchState.processingTouch = true;
    }
    return false;
  }
  
  // Tutorial screen - check if Say hi link was clicked
  if (!gameStarted && typeof tutorialSayHiLinkX !== 'undefined') {
    const isOverTutorialSayHi = (
      mouseX > tutorialSayHiLinkX - tutorialSayHiLinkWidth/2 && 
      mouseX < tutorialSayHiLinkX + tutorialSayHiLinkWidth/2 && 
      mouseY > tutorialSayHiLinkY - tutorialSayHiLinkHeight/2 && 
      mouseY < tutorialSayHiLinkY + tutorialSayHiLinkHeight/2
    );
    
    if (isOverTutorialSayHi) {
      if (typeof showFeedbackModal === 'function') {
        showFeedbackModal();
      }
      return false;
    }
  }
  
  if (!gameStarted) {
    // Check if start button was pressed
    if (startButton.isInside(mouseX, mouseY)) {
      startButton.handleClick();
      return;
    }
    
    // Check if tutorial button was pressed - APlasker
    if (tutorialButton.isInside(mouseX, mouseY)) {
      tutorialButton.handleClick();
      return;
    }
    
    // Add playtest date selector logic only in playtest mode
    if (typeof isPlaytestMode !== 'undefined' && isPlaytestMode) {
      // Check if date button was pressed
      if (dateButton && dateButton.isInside(mouseX, mouseY)) {
        showDatePicker();
        return;
      }
    }
  } else {
    // Check if hint button was clicked
    if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
      hintButton.handleClick();
      // Update lastAction when hint is used - APlasker
      lastAction = frameCount;
      return;
    }
    
    // Check if a vessel was clicked
    for (let v of vessels) {
            if (v.isInside(mouseX, mouseY)) {
      // Set initial vessel for dragging
      draggedVessel = v;
      // Store original position for proper snapback
      draggedVessel.originalX = v.x;
      draggedVessel.originalY = v.y;
      // Store drag offsets
      draggedVessel.dragOffsetX = mouseX - v.x;
      draggedVessel.dragOffsetY = mouseY - v.y;
        
        // Store offset to maintain relative mouse position
        draggedVessel.dragOffsetX = mouseX - v.x;
        draggedVessel.dragOffsetY = mouseY - v.y;
        
        // IMMEDIATELY expand text margin before scale animation starts - APlasker
        // This prevents visual glitching during the transition
        v.textMargin = 0.85;
        
        // Set target scales for body and text (this will happen gradually through update())
        // Body scales to 105% while text only scales to 102.5% as per 20250413updates_final.txt
        v.targetBodyScale = 1.05;
        v.targetTextScale = 1.025;
        
        // Keep legacy targetScale for backward compatibility
        v.targetScale = 1.05;
        
        // Update hover state for dragged vessel
        v.hovering = true;
        
        lastAction = frameCount;
        
        // Update cursor style for feedback
        lastMovedFrame = frameCount;
        break;
      }
    }
  }
  
  // Check for help icon click
  if (!gameWon && isHelpIconHovered) {
    if (typeof showHelpModal === 'function') {
      // Help icon is only visible during gameplay now
      console.log("Help button clicked in game - showing help modal");
      showHelpModal();
      return false; // Prevent other click handling
    }
  }
  
  // Don't process other clicks if help modal is open
  if (typeof helpModal !== 'undefined' && helpModal !== null && helpModal.active) {
    return helpModal.checkClick(mouseX, mouseY);
  }
}

// Update mouseDragged to track movement for win screen elements
function mouseDragged() {
  // Handle Terms modal scrolling
  if (typeof handleTermsModalDrag === 'function' && window.termsModal && window.termsModal.active) {
    if (handleTermsModalDrag(mouseX, mouseY)) {
      return false; // Terms modal handled the drag
    }
  }
  
  // PROFILE SCREEN SCROLLING - Desktop mouse drag support - APlasker
  if (typeof window.profileActive !== 'undefined' && window.profileActive && recipeListScrolling) {
    // Calculate scroll delta - positive when moving mouse up (should bring cards up)
    const scrollDelta = mouseY - recipeListTouchStartY;
    // Track total scroll distance for click vs scroll detection
    recipeListTotalScrollDistance += Math.abs(scrollDelta);
    // Update scroll position with proper constraints (negative brings cards up)
    recipeListScrollY = constrain(recipeListScrollY + scrollDelta, -recipeListMaxScroll, 0);
    recipeListTouchStartY = mouseY; // Update for next movement
    recipeListVelocity = scrollDelta; // Store velocity for momentum
    return false; // Don't process other movements while scrolling
  }

  // Update win screen touch state if we're tracking a touch
  if (gameWon && winScreenTouchState.processingTouch) {
    // Check if we've moved more than the threshold to consider it a drag not a tap
    const dragDistance = dist(mouseX, mouseY, winScreenTouchState.startX, winScreenTouchState.startY);
    if (dragDistance > 10) { // 10px threshold
      winScreenTouchState.touchMoved = true;
      console.log("Win screen touch moved - will not trigger action on release");
    }
  }
  
  // Check if a modal is active - selectively allow interactions with modal elements
  if (modalActive) {
    // Get the element being dragged over
    const target = document.elementFromPoint(mouseX, mouseY);
    
    // If the target is part of our modal (check parent chain)
    if (target && (
        target.closest('#feedback-modal') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON')) {
      // Allow the event to proceed to HTML elements
      return true;
    }
    
    return false;
  }
  
  // Prevent dragging during auto-combination sequence
  if (autoFinalCombination) {
    return false;
  }
  
  if (draggedVessel) {
    draggedVessel.x = mouseX - draggedVessel.dragOffsetX;
    draggedVessel.y = mouseY - draggedVessel.dragOffsetY;
    // Update last action time
    lastAction = frameCount;
  }
}

// Update mouseReleased to execute win screen actions on release if no movement
function mouseReleased() {
  // Terms modal is now handled by HTML - no need for p5.js interaction
  
  // PROFILE SCREEN SCROLL END AND CARD CLICK HANDLING - APlasker
  if (typeof window.profileActive !== 'undefined' && window.profileActive && recipeListScrolling) {
    recipeListScrolling = false; // Stop active scrolling
    console.log("Mouse scroll ended, checking for card click. Velocity:", recipeListVelocity, "Total distance:", recipeListTotalScrollDistance);
    
    // Better click vs scroll detection - use both velocity and total distance
    const isScrollGesture = Math.abs(recipeListVelocity) > 3 || recipeListTotalScrollDistance > 15;
    
    if (!isScrollGesture) {
      console.log("Minimal scroll movement - checking for card clicks");
      
      // Check for recipe card clicks using front-to-back hit testing
      if (window.clickableRecipeCards && window.clickableRecipeCards.length > 0) {
        // Use reverse order for front-to-back hit testing (last card drawn is on top)
        for (let i = window.clickableRecipeCards.length - 1; i >= 0; i--) {
          const card = window.clickableRecipeCards[i];
          if (mouseX >= card.bounds.x && mouseX <= card.bounds.x + card.bounds.w &&
              mouseY >= card.bounds.y && mouseY <= card.bounds.y + card.bounds.h) {
            
            console.log("Recipe card clicked on mouseReleased:", card.recipeName);
            
            // Show recipe modal
            showRecipeCardModal(card);
            return false;
          }
        }
      }
    } else {
      console.log("Significant scroll movement - not handling card clicks");
    }
    
    return false;
  }

  // Handle win screen touch state if we're tracking a touch
  if (gameWon && winScreenTouchState.processingTouch) {
    // Only execute the action if the touch didn't move much
    if (!winScreenTouchState.touchMoved) {
      console.log("Executing win screen action on release:", winScreenTouchState.element);
      
      // Execute the appropriate action based on element
      if (winScreenTouchState.element === "viewRecipe" || 
          winScreenTouchState.element === "tutorialRecipe") {
        // View recipe action
        console.log("View Recipe triggered (win screen release)");
        viewRecipe();
      } else if (winScreenTouchState.element === "shareScore") {
        // Share score action
        console.log("Share Score triggered (win screen release)");
        shareScore();
      } else if (winScreenTouchState.element === "tutorialScore") {
        // Tutorial score action - load today's recipe instead of reloading page
        console.log("Tutorial score action triggered (win screen release)");
        
        // Reset tutorial mode
        isTutorialMode = false;
        
        // Reset game state
        gameStarted = false;
        gameWon = false;
        moveHistory = [];
        hintCount = 0;
        vessels = [];
        animations = [];
        
        // Set loading state
        isLoadingRecipe = true;
        
        // Load today's recipe and start the game
        console.log("Loading today's recipe after tutorial");
        loadRecipeData().then(() => {
          // Reset auto-combination flags to ensure final animation works properly
          autoFinalCombination = false;
          autoFinalCombinationStarted = false;
          autoFinalCombinationTimer = 0;
          autoFinalCombinationState = "WAITING";
          finalCombinationVessels = [];
          
          // Start the game automatically once recipe is loaded
          startGame();
        }).catch(error => {
          console.error("Error loading today's recipe:", error);
          isLoadingRecipe = false;
          loadingError = true;
        });
      }
    }
    
    // Reset the touch state
    winScreenTouchState.processingTouch = false;
    winScreenTouchState.element = null;
    winScreenTouchState.touchMoved = false;
    
    return false; // Prevent other handling
  }
  
  // Check if a modal is active - selectively allow interactions with modal elements
  if (modalActive) {
    // Get the element being released over
    const target = document.elementFromPoint(mouseX, mouseY);
    
    // If the target is part of our modal (check parent chain)
    if (target && (
        target.closest('#feedback-modal') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON')) {
      // Allow the event to proceed to HTML elements
      return true;
    }
    
    return false;
  }
  
  // Check if help modal was active but is now inactive,
  // ensure HTML elements are properly cleaned up
  if (typeof helpModal !== 'undefined' && helpModal !== null && !helpModal.active && 
      helpModal.htmlElements && helpModal.htmlElements.length > 0) {
    helpModal.removeHTMLElements();
  }
  
  if (draggedVessel) {
    // Reset scales
    draggedVessel.targetScale = 1;
    draggedVessel.targetBodyScale = 1;
    draggedVessel.targetTextScale = 1;
    
    let overVessel = null;
    let overVesselIndex = -1;
    let overHintVessel = false;
    
    // Check if dragged over another vessel
    for (let i = 0; i < vessels.length; i++) {
      let v = vessels[i];
      if (v !== draggedVessel && v.isInside(mouseX, mouseY)) {
        overVessel = v;
        overVesselIndex = i;
        break;
      }
    }
    
    // Check if dragged over hint vessel
    if (showingHint && hintVessel && hintVessel.isInside(mouseX, mouseY)) {
      overHintVessel = true;
    }
    
    // Update last action time
    lastAction = frameCount;
    
    if (overHintVessel) {
      // Case 1: Dragged a vessel over the hint
      console.log("Vessel dragged over hint vessel");
      
      // Check if this vessel's ingredients can be added to the hint
      let canAddToHint = false;
      
      if (draggedVessel.ingredients.length > 0) {
        // Check if any of the ingredients in this vessel are required for the hint
        let matchingIngredients = draggedVessel.ingredients.filter(ing => 
          hintVessel.required.includes(ing) && !hintVessel.collected.includes(ing)
        );
        
        if (matchingIngredients.length > 0) {
          // Add ingredients to the hint vessel
          for (let ing of matchingIngredients) {
            hintVessel.addIngredient(ing);
            canAddToHint = true;
          }
        }
      } else if (draggedVessel.name) {
        // Check if the completed combination matches the hint
        if (hintVessel.name === draggedVessel.name) {
          // This is the exact combination the hint is for
          // Add all ingredients directly
          for (let ing of hintVessel.required) {
            if (!hintVessel.collected.includes(ing)) {
              hintVessel.addIngredient(ing);
              canAddToHint = true;
            }
          }
        }
      }
      
      if (canAddToHint) {
        // Create animation
        // ENHANCEMENT - APlasker - Use hint vessel color for animations going to hint vessel
        animations.push(new CombineAnimation(draggedVessel.x, draggedVessel.y, COLORS.vesselHint, hintVessel.x, hintVessel.y));
        
        // Remove the vessel
        vessels = vessels.filter(v => v !== draggedVessel);
        arrangeVessels();
        
        // Check if hint is complete
        if (hintVessel.isComplete()) {
          // Convert hint to regular vessel
          let newVessel = hintVessel.toVessel();
          
          // ENHANCEMENT - APlasker - Mark newly created vessels from hints
          newVessel.isNewlyCombined = true;
          
          // Set position strength based on vessel type - always advanced for hint vessels
          newVessel.positionStrength = 1.0;
          
          vessels.push(newVessel);
          
          // ENHANCEMENT - APlasker - Assign position based on hint vessel location
          assignPreferredRow(newVessel, hintVessel.y, hintVessel.x);
          
          arrangeVessels();
          
          // Create verb animation for the newly created vessel
          createVerbAnimationForVessel(newVessel);
          
          // Reset hint
          hintVessel = null;
          showingHint = false;
          
          // Check win condition
          if (vessels.length === 1 && vessels[0].name === final_combination.name) {
            // Get the verb from the final combination
            const finalVerb = vessels[0].verb || final_combination.verb || "Complete!";
            
            // Create the final animation instead of immediately setting gameWon
            createFinalVerbAnimation(finalVerb);
            
            // gameWon will be set by the animation when it completes
          }
        }
      } else {
        // Can't add to hint vessel, return to original position with a small shake
        draggedVessel.x = draggedVessel.originalX;
        draggedVessel.y = draggedVessel.originalY;
        draggedVessel.shake();
        
        // BUGFIX - APlasker - Add black counter to move history for invalid hint combination
        moveHistory.push('black');
        turnCounter++; // Increment turn counter for invalid move
        
        // Display a random error message for invalid combination
        showRandomErrorMessage();
        
        console.log("Invalid combination with hint vessel!");
      }
    }
    else if (overVessel) {
      // Case 2: Dragged a vessel over another vessel (potential combination)
      console.log("Vessel dragged over another vessel");
      
      // Check if this is a valid combination
      const new_v = combineVessels(draggedVessel, overVessel, mouseX, mouseY);
      
      if (new_v) {
        // Create animation particles
        if (new_v.color === COLORS.green || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary || COMPLETED_VESSEL_COLORS.includes(new_v.color)) {
          // Check if this is the final combination
          const isFinalCombination = (vessels.length === 1 || vessels.length - 2 + 1 === 1) && new_v.name === final_combination.name;
          
          // For green vessels (completed combinations), prioritize verb animation
          // But skip creating regular VerbAnimation if this is the final combo (we'll use FinalVerbAnimation instead)
          if (!isFinalCombination) {
            console.log("Completed combination - using verb animation directly");
            
            // Check if the vessel has a verb
            if (new_v.verb) {
              console.log("Creating immediate verb animation for:", new_v.verb);
              // Create verb animation starting exactly at the vessel's center
              animations.push(new VerbAnimation(new_v.verb, new_v.x, new_v.y, new_v));
              // Reset the verbDisplayTime to prevent duplicate animations
              new_v.verbDisplayTime = 119; // Set to 119 instead of 120 to prevent creating another animation
            } else {
              // If no verb is set, use a default verb
              console.log("No verb found, using default verb");
              new_v.verb = "Mix";
              new_v.verbDisplayTime = 119;
              animations.push(new VerbAnimation(new_v.verb, new_v.x, new_v.y, new_v));
            }
          } else {
            console.log("Final combination detected - skipping regular verb animation");
            // Still set verbDisplayTime to prevent auto-animation
            new_v.verbDisplayTime = 119;
          }
        } else {
          // For non-green vessels, use the regular combine animation
        animations.push(new CombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, new_v.x, new_v.y));
        animations.push(new CombineAnimation(overVessel.x, overVessel.y, overVessel.color, new_v.x, new_v.y));
        }
        
        // Get the index of the dragged vessel
        let draggedIndex = vessels.indexOf(draggedVessel);
        
        // Remove old vessels
        vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
        
        // Mark the new vessel as newly combined for positioning
        new_v.isNewlyCombined = true;
        
        // Set position strength based on vessel type
        if (new_v.isAdvanced) {
          // Advanced vessels (yellow/green) get maximum strength
          new_v.positionStrength = 1.0;
        } else {
          // Base vessels are capped at 0.5
          new_v.positionStrength = 0.5;
        }
        
        // Insert the new vessel at the position of the target vessel
        // This ensures the new vessel appears close to where the user dropped it
        vessels.splice(overVesselIndex, 0, new_v);
        
        // IMPORTANT: Use appropriate pulse animation based on vessel type
        console.log("Triggering pulse animation for newly created vessel");
        
        // Use bouncePulse for green vessels (completed combinations)
        if (new_v.color === COLORS.green || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary || COMPLETED_VESSEL_COLORS.includes(new_v.color)) {
          console.log("Using bounce pulse for completed combination");
          new_v.bouncePulse(); // Use new bounce pulse animation
        } else {
          // Use regular pulse for yellow vessels (intermediate combinations)
          console.log("Using regular pulse for intermediate combination");
          new_v.pulse(1000); // Increased from 500ms to 1000ms for consistency with auto-combination
        }
        
        // Debug log to verify flow before assigning preferred row
        console.log("MOUSE RELEASED: About to assign preferred row to new vessel");
        
        // Assign preferred row based on both vessels' positions
        const avgY = (draggedVessel.y + overVessel.y) / 2;
        const avgX = (draggedVessel.x + overVessel.x) / 2;
        assignPreferredRow(new_v, avgY, avgX);
        
        // Re-arrange vessels with the new vessel in place
        arrangeVessels();
        
        // NEW: Check for parent combination opportunities after successful combination
        // This implements Solution 2 for nested combinations
        setTimeout(() => {
          const parentVessel = checkForParentCombinations();
          if (parentVessel) {
            console.log("Auto-combination triggered after manual combination");
            // If a parent combination was created, check for additional parent opportunities
            // This handles deeply nested combinations
            setTimeout(() => {
              checkForParentCombinations();
            }, 100); // Small delay to let animations settle
          }
        }, 50); // Small delay to let the manual combination settle first
        
        // Check win condition
        if (vessels.length === 1 && vessels[0].name === final_combination.name) {
          // ENHANCEMENT - APlasker - Add increased version number to indicate this change was installed 
          console.log("Win condition met! Completed recipe:", final_combination.name, "- APlasker v2.0");
          
          // Get the verb from the final combination
          const finalVerb = vessels[0].verb || final_combination.verb || "Complete!";
          
          // Create the final animation
          createFinalVerbAnimation(finalVerb);
        }
        
        // Add this to the move history
        moveHistory.push(new_v.color === 'black' ? 'black' : 'white');
        
        // Add one red counter every 10 white counters - Easter Egg feature
        // APlasker - This is a "random bonus" feature that awards periodic Easter Eggs
        // The chance increases the longer they play without getting one
        if (moveHistory.filter(m => m === 'white').length % 10 === 0 && Math.random() < 0.2 + (turnCounter / 100)) {
          moveHistory.push({type: 'egg'});
        }
        
        // Increment the turn counter
        turnCounter += 2; // Combining generally counts as 2 turns
      } else {
        // If new_v is null, it could mean one of two things:
        // 1. The combination failed
        // 2. The ingredients were added directly to the hint vessel
        
        // Check if the hint vessel has changed (ingredients were added)
        if (showingHint && hintVessel && hintVessel.collected.some(ing => 
            draggedVessel.ingredients.includes(ing) || overVessel.ingredients.includes(ing))) {
          // Ingredients were added to the hint vessel
          
          // Remove the vessels that were combined
          vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
          arrangeVessels();
          
          // Check if the hint is now complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            
            // ENHANCEMENT - APlasker - Mark newly created vessels from hints
            newVessel.isNewlyCombined = true;
            
            // Set position strength based on vessel type - always advanced for hint vessels
            newVessel.positionStrength = 1.0;
            
            vessels.push(newVessel);
            
            // ENHANCEMENT - APlasker - Assign position based on hint vessel location
            assignPreferredRow(newVessel, hintVessel.y, hintVessel.x);
            
            arrangeVessels();
            
            // Create verb animation for the newly created vessel
            createVerbAnimationForVessel(newVessel);
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
          }
        } else {
          // APlasker - Check if this was an Easter egg combination
          const isEasterEgg = typeof eggFound !== 'undefined' && eggFound === true;
          
          if (isEasterEgg) {
            // This was an Easter egg combination, reset the flag
            console.log("Easter egg was found, not counting as an invalid combination");
            eggFound = false;
            
            // Let vessels snap back to their original positions (handled by the egg modal)
            // Do not add black counter or show error message
          } else {
            // Combination failed - shake both vessels
            draggedVessel.x = draggedVessel.originalX;
            draggedVessel.y = draggedVessel.originalY;
            draggedVessel.shake();
            overVessel.shake();
            
            // Add black counter to move history for invalid combination
            moveHistory.push('black');
            turnCounter++; // Increment turn counter for invalid move
            
            console.log("Invalid combination!");
            
            // Display a random error message for invalid combination
            showRandomErrorMessage();
          }
        }
      }
    } else {
      // Case 3: Dragged a vessel but not over another vessel or hint
      console.log("Vessel dragged but not combined - returning to original position");
      
      // Return the vessel to its original position
      draggedVessel.snapBack();
    }
    
    // Reset dragged vessel
    draggedVessel = null;
    offsetX = 0;
    offsetY = 0;
  }
  
  // Reset eggFound flag at the end of mouseReleased to ensure it's not carried over to next interaction
  // This fixes the issue where the first drag after an egg combination doesn't work correctly
  if (eggFound) {
    console.log("Resetting eggFound flag at end of mouseReleased()");
    eggFound = false;
  }
  
  // Reset hover states for all vessels
  for (let v of vessels) {
    v.hovering = false;
  }
  
  // Update cursor style
  lastMovedFrame = frameCount;
}

// Mouse wheel support for profile screen scrolling - APlasker
function mouseWheel(event) {
  // Terms modal is now handled by HTML - no need for p5.js interaction
  
  // Only handle wheel events on profile screen
  if (typeof window.profileActive !== 'undefined' && window.profileActive) {
    // Check if mouse is in recipe scroll area
    const recipesY = playAreaY + (playAreaHeight * 0.25); // Stats section is 25%
    const recipesHeight = playAreaHeight * 0.75;
    const cardScrollAreaHeight = recipesHeight - (recipesHeight * 0.33); // Minus green box
    
    if (mouseY >= recipesY && mouseY <= recipesY + cardScrollAreaHeight) {
      // Prevent default scroll behavior
      event.preventDefault();
      
      // Use wheel delta for smooth scrolling (negative delta = scroll up = cards up)
      const scrollAmount = event.delta * 2; // Multiply for faster scrolling
      recipeListScrollY = constrain(recipeListScrollY - scrollAmount, -recipeListMaxScroll, 0);
      
      console.log("Mouse wheel scroll:", event.delta, "New scroll position:", recipeListScrollY);
      return false;
    }
  }
  
  // Allow default wheel behavior for other areas
  return true;
}

// Ensure p5.js can find these event handlers in the global scope
window.mousePressed = emousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.mouseWheel = mouseWheel;
window.touchStarted = touchStarted;
window.touchEnded = touchEnded;
window.touchMoved = touchMoved;
