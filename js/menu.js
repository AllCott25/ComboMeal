// Menu System for Combo Meal
// Created by APlasker

class HamburgerMenu {
  constructor() {
    this.initialized = true; // Always initialized since we draw directly
    this.menuButton = null; // Will be set up dynamically in draw()
  }

  draw() {
    // Only show on title and win screens, not during gameplay
    if (gameStarted && !gameWon) return;

    // Calculate Bomi character dimensions (4:3 aspect ratio, twice the original size)
    const originalSize = Math.max(playAreaWidth * 0.032, 20); // Original hamburger size
    const bomiWidth = originalSize * 2; // Twice the size
    const bomiHeight = bomiWidth * 0.75; // 4:3 aspect ratio (height = width * 3/4)
    
    // Position in top-right (93% of play area width)
    const bomiX = playAreaX + (playAreaWidth * 0.93) - bomiWidth/2; // Center the rectangle
    const bomiY = playAreaY + (playAreaHeight * 0.0225); // 2.25% from top
    
    // Check if mouse is hovering over Bomi
    const isHovered = mouseX >= bomiX && mouseX <= bomiX + bomiWidth && 
                     mouseY >= bomiY && mouseY <= bomiY + bomiHeight;
    
    // Update button hitbox for click detection
    if (!this.menuButton) {
      this.menuButton = { 
        isInside: (x, y) => x >= bomiX && x <= bomiX + bomiWidth && y >= bomiY && y <= bomiY + bomiHeight 
      };
    } else {
      this.menuButton.isInside = (x, y) => x >= bomiX && x <= bomiX + bomiWidth && y >= bomiY && y <= bomiY + bomiHeight;
    }
    
    // Draw Bomi Recipe Box Character
    push();
    
    // Calculate grid dimensions (3x3 grid)
    const gridWidth = bomiWidth / 3;
    const gridHeight = bomiHeight / 3;
    
    // Calculate stroke weights - match COMBO MEAL title outer outline (2px visible)
    const outlineStrokeW = 2; // Fixed 2px to match COMBO MEAL title outer outline
    const eyeStrokeW = Math.max(bomiWidth * 0.08, 4); // 8% of width, min 4px (keep eyes thick)
    
    // Main orange rectangle with thick outline
    fill(isHovered ? lerpColor(color(COLORS.peach), color(255), 0.2) : COLORS.peach);
    stroke(0);
    strokeWeight(outlineStrokeW);
    rect(bomiX, bomiY, bomiWidth, bomiHeight);
    
    // Horizontal divider line between row A & B
    line(bomiX, bomiY + gridHeight, bomiX + bomiWidth, bomiY + gridHeight);
    
    // Calculate eye positions (66% from top instead of 50%)
    // Left eye: positioned at 66% from top
    const leftEyeX = bomiX + gridWidth;
    const leftEyeY = bomiY + bomiHeight * 0.66; // 66% from top
    
    // Right eye: positioned at 66% from top
    const rightEyeX = bomiX + gridWidth * 2;
    const rightEyeY = bomiY + bomiHeight * 0.66; // 66% from top
    
    // Eye size (keep thick for eyes)
    const eyeSize = eyeStrokeW;
    
    // Draw eyes (black circles)
    fill(0);
    noStroke();
    circle(leftEyeX, leftEyeY, eyeSize);
    circle(rightEyeX, rightEyeY, eyeSize);
    
    // Draw smile in center of C2 box (same curve as recipe box)
    const smileX = bomiX + gridWidth * 1.5; // Center of column 2
    const smileY = bomiY + gridHeight * 2.5; // Center of row C
    const smileWidth = gridWidth * 0.4; // 40% of grid width
    const smileHeight = gridHeight * 0.2; // 20% of grid height
    
    // Draw curved smile using bezier curve (keep thick like eyes)
    strokeWeight(Math.max(eyeStrokeW * 0.6, 2)); // Slightly thinner than eyes, but keep thick
    strokeCap(ROUND);
    stroke(0);
    noFill();
    
    const smileStartX = smileX - smileWidth/2;
    const smileEndX = smileX + smileWidth/2;
    const smileStartY = smileY - smileHeight/4;
    const controlYOffset = smileHeight * 0.8;
    
    bezier(
      smileStartX, smileStartY, // Start point
      smileStartX + smileWidth * 0.2, smileStartY + controlYOffset, // First control point
      smileEndX - smileWidth * 0.2, smileStartY + controlYOffset, // Second control point
      smileEndX, smileStartY // End point
    );
    
    // Draw pink cheeks in centers of C1 and C3 boxes
    const leftCheekX = bomiX + gridWidth * 0.5; // Center of column 1
    const leftCheekY = bomiY + gridHeight * 2.5; // Center of row C
    const rightCheekX = bomiX + gridWidth * 2.5; // Center of column 3
    const rightCheekY = bomiY + gridHeight * 2.5; // Center of row C
    
    // Cheek size (2x larger than eyes)
    const cheekSize = eyeSize * 2;
    
    fill(COLORS.secondary); // Pink color
    noStroke();
    circle(leftCheekX, leftCheekY, cheekSize);
    circle(rightCheekX, rightCheekY, cheekSize);
    
    pop();
    
    // Change cursor when hovering
    if (isHovered) {
      cursor(HAND);
    }
  }

  handleClick(x, y) {
    if (!this.menuButton || !this.menuButton.isInside(x, y)) {
      return false;
    }
    
    console.log('Hamburger menu clicked');
    console.log('Current auth state:', {
      authState: window.authState,
      isAuthenticated: window.authState?.isAuthenticated,
      isAnonymous: window.authState?.isAnonymous,
      gameWon: gameWon,
      gameStarted: gameStarted
    });
    
    // Check authentication state and route accordingly
    if (window.authState?.isAuthenticated && !window.authState?.isAnonymous) {
      // User is authenticated with email - show profile
      console.log('User authenticated with email - showing profile');
      
      // Clear profile data cache for fresh load when entering profile
      if (!window.profileActive) {
        window.profileData = null;
        profileDataLoaded = false; // Reset animation flag so bounce can trigger again - APlasker
      }
      
      // Set profile state and track where we came from
      window.profileActive = true;
      window.previousProfileState = gameWon ? 'win' : 'title';
      console.log('Profile activated, previousState set to:', window.previousProfileState);
      
    } else {
      // User is anonymous or not authenticated - show sign in/up modal
      console.log('Anonymous user - showing auth modal');
      showAuthModal(); // This will show the sign in/up options
    }
    
    return true;
  }
}

// Create global menu instance
let hamburgerMenu;

// Initialize menu when everything is ready
function initializeHamburgerMenu() {
  // Only initialize if we have the required dependencies
  if (typeof playAreaWidth !== 'undefined' && typeof playAreaX !== 'undefined' && 
      typeof COLORS !== 'undefined' && typeof Button !== 'undefined') {
    hamburgerMenu = new HamburgerMenu();
    console.log("Hamburger menu initialized");
  } else {
    console.log("Waiting for dependencies to initialize hamburger menu");
    // Try again after a short delay
    setTimeout(initializeHamburgerMenu, 100);
  }
}

// Initialize menu when window loads, but also try earlier
window.addEventListener('load', initializeHamburgerMenu);

// Also try to initialize when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHamburgerMenu);
} else {
  // DOM is already loaded
  initializeHamburgerMenu();
}

// Calculate star score for profiles - APlasker (updated for time parameter)
function calculateStarScore(mistakes, hints, timeSeconds = null) {
  let starScore = Math.max(0, 5 - mistakes); // 0-5 stars based on mistakes
  
  // Add 6th bonus star for perfect games (no mistakes, no hints)
  if (mistakes === 0 && hints === 0) {
    starScore = 6;
  }
  
  // Future enhancement: could factor in time for scoring
  // For now, time parameter is accepted but not used in calculation
  
  return starScore;
} 