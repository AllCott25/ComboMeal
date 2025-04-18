/*
 * Help Modal for Culinary Logic Puzzle
 * Created by APlasker
 * Last Updated: April 10, 2025 (14:20 EDT)
 *
 * This file contains functionality for the help modal that allows players
 * to review the game instructions during gameplay.
 */

// Global variable to track help modal state
window.helpModal = null;

// Function to create and display the help modal
function showHelpModal() {
  // Create the help modal if it doesn't exist
  window.helpModal = {
    active: true,
    x: playAreaX + playAreaWidth / 2,
    y: playAreaY + playAreaHeight / 2,
    width: playAreaWidth * 0.85,  // Increased from 0.8 to 0.85 (5% wider)
    height: playAreaHeight * 0.8, // 80% of play area height
    htmlElements: [], // Array to store HTML elements
    
    draw: function() {
      if (!this.active) return;
      
      push();
      // Semi-transparent overlay for the entire canvas
      rectMode(CORNER);
      fill(0, 0, 0, 100);
      noStroke();
      rect(0, 0, width, height);
      
      // Draw modal container with white background and red border
      rectMode(CENTER);
      fill(255); // White background
      stroke(COLORS.secondary); // Red border (using game's secondary color)
      strokeWeight(3);
      rect(this.x, this.y, this.width, this.height, 10); // Rounded corners (10px radius)
      
      // Draw X button in top-left corner
      const xPosX = this.x - this.width/2 + 25;
      const xPosY = this.y - this.height/2 + 25;
      const xSize = 15;
      
      // X button circle background
      noStroke();
      fill(COLORS.secondary); // Red background for X
      circle(xPosX, xPosY, xSize * 2); // Circle with diameter of 30px
      
      // X mark
      stroke(255); // White X
      strokeWeight(2);
      line(xPosX - xSize/2, xPosY - xSize/2, xPosX + xSize/2, xPosY + xSize/2);
      line(xPosX - xSize/2, xPosY + xSize/2, xPosX + xSize/2, xPosY - xSize/2);
      
      // "How to Play" title
      fill(0); // Black text
      noStroke();
      textAlign(CENTER, TOP);
      textSize(this.width * 0.05); // 5% of modal width
      textStyle(BOLD);
      text("How to Play", this.x, this.y - this.height/2 + 20);
      
      // Calculate sizes for tutorial elements
      const contentWidth = this.width * 0.9; // 90% of modal width
      const contentArea = this.height - 80; // Height minus title and padding
      const sectionHeight = contentArea / 3; // Divide remaining area into 3 sections
      
      // Calculate positions for the three description sentences
      const y1 = this.y - this.height/2 + 70; // 70px from top for first instruction
      const y2 = y1 + sectionHeight;
      const y3 = y2 + sectionHeight;
      
      // Draw equations
      drawHelpEquation(1, "Grapes", "white", "Sugar", "white", "Jelly", "green", 
                     this.x, y1 + 50, contentWidth * 0.8, sectionHeight * 0.5);
      
      drawHelpEquation(2, "Jelly", "green", "Peanut Butter", "white", "Jelly + Peanut Butter", "yellow", 
                     this.x, y2 + 50, contentWidth * 0.8, sectionHeight * 0.5);
      
      drawHelpEquation(3, "Jelly + Peanut Butter", "yellow", "Potato Bread", "green", "PB&J Sandwich", "green", 
                     this.x, y3 + 50, contentWidth * 0.8, sectionHeight * 0.5, true);
      
      pop();
      
      // Create or update HTML elements for the three description sentences
      this.updateHTMLElements(y1, y2, y3);
    },
    
    updateHTMLElements: function(y1, y2, y3) {
      // Remove existing HTML elements
      this.removeHTMLElements();
      
      // Create container for HTML elements
      const container = document.createElement('div');
      container.id = 'help-modal-text';
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none'; // Allow clicks to pass through to canvas
      container.style.zIndex = '1000'; // Ensure it's above the canvas
      document.body.appendChild(container);
      this.htmlElements.push(container);
      
      // Common text style
      const textStyle = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${this.width * 0.03}px`,
        textAlign: 'center',
        width: `${this.width * 0.8}px`,
        pointerEvents: 'none',
        zIndex: '1000'
      };
      
      // Create HTML elements for the three description sentences
      const texts = [
        "Drag & drop to combine ingredients into new components.",
        "Yellow combos are partially complete. Add more!",
        "Complete the recipe with the fewest mistakes to make the grade."
      ];
      
      const yPositions = [y1, y2, y3];
      
      texts.forEach((text, index) => {
        const element = document.createElement('div');
        element.textContent = text;
        Object.assign(element.style, textStyle);
        element.style.top = `${yPositions[index]}px`;
        container.appendChild(element);
        this.htmlElements.push(element);
      });
    },
    
    removeHTMLElements: function() {
      // Remove all HTML elements
      this.htmlElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      this.htmlElements = [];
    },
    
    hide: function() {
      this.active = false;
      this.removeHTMLElements();
    },
    
    checkClick: function(x, y) {
      // Check if click is on the X button
      const xPosX = this.x - this.width/2 + 25;
      const xPosY = this.y - this.height/2 + 25;
      const xSize = 15;
      
      // Calculate distance from click to X button center
      const distanceToX = dist(x, y, xPosX, xPosY);
      
      // If click is on the X button, close the modal
      if (distanceToX < xSize) {
        this.active = false;
        this.removeHTMLElements();
        return true;
      }
      
      // Close the modal when clicking anywhere on the screen
      this.active = false;
      this.removeHTMLElements();
      return true;
    }
  };
}

// Function to hide the help modal
function hideHelpModal() {
  if (window.helpModal) {
    window.helpModal.hide();
  }
}

// Ensure showHelpModal is available globally
window.showHelpModal = showHelpModal;

// Helper function to draw tutorial equations within the help modal
function drawHelpEquation(equationNum, leftName, leftColor, rightName, rightColor, resultName, resultColor, x, y, width, height, showStarburst = false) {
  // Isolate drawing context for the entire equation
  push();
  
  // Explicitly set text alignment at the beginning to ensure consistent behavior
  textAlign(CENTER, CENTER);
  textFont(bodyFont);
  textStyle(NORMAL);
  
  // Calculate vessel sizes based on modal width (doubled for larger vessels) - APlasker
  const vesselWidth = width * 0.56; // Doubled from 0.28 to 0.56
  const vesselHeight = vesselWidth * 0.6; // Maintain aspect ratio
  
  // Calculate spacing between vessels - increased to accommodate larger vessels
  const spacing = width * 0.48; // Increased from 0.32 to 0.48 (50% more)
  
  // Calculate positions for left, right, and result vessels
  // With rectMode(CENTER), these are the centers of each vessel
  const leftX = x - spacing;
  const rightX = x;
  const resultX = x + spacing;
  
  // Ensure rectMode is set to CENTER for consistent vessel positioning
  rectMode(CENTER);
  
  // Create vessels using the createTutorialVessel function for consistency with tutorial - APlasker
  const leftVessel = createTutorialVessel(leftName, leftColor, leftX, y, vesselWidth, vesselHeight);
  const rightVessel = createTutorialVessel(rightName, rightColor, rightX, y, vesselWidth, vesselHeight);
  const resultVessel = createTutorialVessel(resultName, resultColor, resultX, y, vesselWidth, vesselHeight);
  
  // Ensure vessel scaling for help modal matches tutorial vessels - APlasker
  leftVessel.bodyScale = 0.66;   // Reduced back to 0.66 to match tutorial vessels
  leftVessel.textScale = 0.66;   // Reduced back to 0.66 to match tutorial vessels
  rightVessel.bodyScale = 0.66;  // Reduced back to 0.66 to match tutorial vessels
  rightVessel.textScale = 0.66;  // Reduced back to 0.66 to match tutorial vessels
  resultVessel.bodyScale = 0.66; // Reduced back to 0.66 to match tutorial vessels
  resultVessel.textScale = 0.66; // Reduced back to 0.66 to match tutorial vessels
  
  // Draw starburst behind the result vessel if requested
  if (showStarburst) {
    push();
    // Scale down the starburst to fit in the modal
    const scaleFactor = vesselWidth / 100;
    translate(resultX, y);
    scale(scaleFactor);
    drawStarburst(0, 0);
    pop();
  }
  
  // Draw the vessels
  leftVessel.draw();
  
  // Draw plus sign - use push/pop to isolate text context
  push();
  textAlign(CENTER, CENTER);
  // Larger operator size for bigger vessels - APlasker
  textSize(vesselHeight * 0.4);
  fill(0);
  // Operators centered at the same height as vessels - APlasker
  text("+", (leftX + rightX) / 2, y);
  pop();
  
  // Draw right vessel
  rightVessel.draw();
  
  // Draw equals sign - use push/pop to isolate text context
  push();
  textAlign(CENTER, CENTER);
  // Larger operator size for bigger vessels - APlasker
  textSize(vesselHeight * 0.4);
  fill(0);
  // Operators centered at the same height as vessels - APlasker
  text("=", (rightX + resultX) / 2, y);
  pop();
  
  // Draw result vessel
  resultVessel.draw();
  
  // Restore drawing context - ensures all settings are properly reset
  pop();
}

// The drawHelpVessel function has been removed as we now use createTutorialVessel
// from sketch.js for consistency with the tutorial vessels - APlasker 