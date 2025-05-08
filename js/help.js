/*
 * Help Modal for Culinary Logic Puzzle
 * Created by APlasker
 * Last Updated: May 7, 2025 (22:34) - APlasker
 *
 * This file contains functionality for the help modal that allows players
 * to review the game instructions during gameplay.
 * 
 * Changes:
 * - Updated row 1 text to clarify dragging one ingredient onto another
 * - Updated row 2 text to reference the recipe card instead of combo icons
 * - Replaced red hint vessel with circular hint button to match current UI
 * - Fixed base vessel color to display properly as white
 * - Added underline to "How to Play" title (May 3, 2025)
 * - Adjusted Hint button text size to match in-game button (May 3, 2025)
 * - Added centered intro text with mission statement (May 7, 2025, 22:24) - APlasker
 * - Adjusted row spacing for better content visibility (May 7, 2025, 22:24) - APlasker
 * - Fine-tuned vertical spacing of title and content (May 7, 2025, 22:34) - APlasker
 */

// Global variable to track help modal state
window.helpModal = null;

// Array to store tutorial vessels for animations
window.tutorialVessels = [];

// Function to create and display the help modal
function showHelpModal() {
  // Clear any existing tutorial vessels
  window.tutorialVessels = [];

  // Create the help modal if it doesn't exist
  window.helpModal = {
    active: true,
    x: playAreaX + playAreaWidth / 2,
    y: playAreaY + playAreaHeight / 2, // Center vertically in play area
    width: playAreaWidth * 0.85,  // 85% of play area width
    height: playAreaHeight * 0.8, // 80% of play area height
    htmlElements: [], // Initialize as an empty array
    
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
      stroke(0, 50); // Use the same subtle border as buttons (50% opacity black)
      strokeWeight(2); // Match the buttons' stroke weight
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
      
      // "How to Play" title - LOWERED BY ADDITIONAL 5px (total 15px from original)
      fill(0); // Black text
      noStroke();
      textAlign(CENTER, TOP);
      textSize(this.width * 0.05); // 5% of modal width
      textStyle(BOLD);
      
      // Use different title text based on tutorial mode - APlasker
      const titleText = (typeof isTutorialMode !== 'undefined' && isTutorialMode) ? 
        "Tutorial Recipe" : "How to Play";
      text(titleText, this.x, this.y - this.height/2 + 30); // Title at top
      
      // Add underline to the title
      const titleWidth = textWidth(titleText);
      stroke(0); // Black line
      strokeWeight(1.5);
      line(this.x - titleWidth/2, this.y - this.height/2 + 45, this.x + titleWidth/2, this.y - this.height/2 + 45);
      
      // Calculate vertical shift for content (2% of modal height up)
      const contentShift = this.height * 0.02;
      
      // Define vessel and text properties - RAISED BY 2% OF MODAL HEIGHT
      const contentWidth = this.width * 0.9; // 90% of modal width
      const contentHeight = this.height * 0.85; // 85% of modal height
      const contentTop = this.y - this.height/2 + 75 - contentShift; // Adjusted to 75px from top with 2% shift
      
      // Calculate column widths
      const vesselColumnWidth = contentWidth * 0.30; // 30% of content width
      const textColumnWidth = contentWidth * 0.60; // 60% of content width
      
      // Calculate x-positions for columns
      const vesselColumnX = this.x - contentWidth/2 + vesselColumnWidth/2; // Left column
      const textColumnX = this.x + contentWidth/2 - textColumnWidth/2; // Right column
      
      // Calculate vessel sizes
      const vesselWidth = vesselColumnWidth * 1.7; // 170% of column width
      const vesselHeight = vesselWidth * 0.6; // Maintain aspect ratio
      
      // Calculate spacing between rows - ADJUSTED: reduced to 40% of original
      const rowCount = 5; // Five rows of content (intro text + 4 instruction rows)
      const rowSpacing = (contentHeight / rowCount) * 0.40; // Adjusted to 40% as requested
      
      // Calculate vertical offset for Column 1 (1% of modal height)
      const column1VerticalOffset = this.height * 0.01;
      
      // Draw intro text at the top of the content area
      this.drawIntroText(contentTop, contentWidth);
      
      // Vessel configurations for standard rows (now starts at index 0 since we removed the multi-vessel row)
      const vesselConfig = [
        { name: "Carrots", color: "vesselBase", text: "Drag & drop one ingredient on to another to combine them! Which ingredients go together?" },
        { name: "Carrots + Flour + Eggs", color: "yellow", text: "Yellow Combos need more ingredients in order to complete that step of the recipe. What else can you add?" },
        { name: "Carrot Sheet Cake", color: "green", text: "A completed Combo turns green and transforms. Keep combining until you make the final dish!" },
        { type: "hintButton", text: "Check the recipe card and use Hints to help you figure out what to make next." },
        { type: "star", text: "Combine everything together with as few mistakes as possible to make the grade!" }
      ];
      
      // Draw each regular row
      for (let i = 0; i < vesselConfig.length; i++) {
        const config = vesselConfig[i];
        // Calculate row Y positions with tighter spacing - add extra space after intro text
        const rowY = contentTop + rowSpacing + (rowSpacing * 2 * i) + rowSpacing;
        
        if (config.type === "star") {
          // Draw star icon for the last row - add vertical offset to Column 1
          drawStarIcon(vesselColumnX, rowY + column1VerticalOffset, vesselWidth * 0.5);
        } else if (config.type === "hintButton") {
          // Draw circular hint button for the hint row - add vertical offset to Column 1
          drawHintButtonIcon(vesselColumnX, rowY + column1VerticalOffset, vesselWidth * 0.4);
        } else {
          // Draw vessel for regular rows - add vertical offset to Column 1
          const vessel = createTutorialVessel(config.name, config.color, vesselColumnX, rowY + column1VerticalOffset, vesselWidth, vesselHeight);
          vessel.draw();
          
          // Store the vessel for future animation
          window.tutorialVessels.push(vessel);
        }
        
        // Draw explanation text - kept at original position (no offset for Column 2)
        fill(0); // Black text
        noStroke();
        textAlign(LEFT, CENTER);
        textSize(this.width * 0.035); // 3.5% of modal width
        textStyle(NORMAL);
        
        // Draw text with word wrapping
        const wrappedText = wrapTextToWidth(config.text, textColumnWidth);
        let lineHeight = this.width * 0.04; // 4% of modal width
        
        for (let j = 0; j < wrappedText.length; j++) {
          text(wrappedText[j], textColumnX - textColumnWidth/2, rowY - (wrappedText.length - 1) * lineHeight/2 + j * lineHeight);
        }
      }
      
      pop();
    },
    
    // New method to draw the intro text
    drawIntroText: function(startY, availableWidth) {
      const introText = "Solve the secret recipe by combining ingredients and using your noodle!";
      
      // Calculate text properties
      const textWidth = availableWidth * 0.8; // Use 80% of available width
      const fontSize = this.width * 0.04; // 4% of modal width
      const lineHeight = fontSize * 1.3; // 130% of font size
      
      // Style the text
      fill(COLORS.primary); // Use green for the intro text to make it stand out
      noStroke();
      textAlign(CENTER, TOP);
      textSize(fontSize);
      textStyle(BOLD);
      
      // Wrap the text
      const wrappedLines = wrapTextToWidth(introText, textWidth);
      
      // Draw each line
      for (let i = 0; i < wrappedLines.length; i++) {
        text(wrappedLines[i], this.x, startY + (i * lineHeight));
      }
    },
    
    hide: function() {
      this.active = false;
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
        return true;
      }
      
      // Close the modal when clicking anywhere on the screen
      this.active = false;
      return true;
    },
    
    removeHTMLElements: function() {
      // Implementation to remove HTML elements
      this.htmlElements = [];
    }
  };
}

// Function to draw a 5-pointed star icon in mustard yellow with black outline
function drawStarIcon(x, y, size) {
  push();
  
  // Use COLORS.tertiary for mustard yellow
  fill(COLORS.tertiary);
  
  // Add subtle outline with same visual weight as vessels
  stroke(0, 50); // Use the same subtle border as buttons
  strokeWeight(2);
  
  // Set parameters for a 5-pointed star
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  
  // Draw the star
  beginShape();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = TWO_PI * i / 10 - HALF_PI;
    const sx = x + cos(angle) * radius;
    const sy = y + sin(angle) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
  
  pop();
}

// Function to draw a circular hint button icon like the one in the game
function drawHintButtonIcon(x, y, size) {
  push();
  
  // Use COLORS.vesselHint for hint button fill (red)
  fill(COLORS.vesselHint);
  
  // Use the same subtle border as buttons
  stroke(0, 50);
  strokeWeight(2);
  
  // Draw circular button
  circle(x, y, size);
  
  // Draw "Hint" text
  fill('white');
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(size * 0.22); // Reduced from 0.30 to 0.22 to match the Recipe Card Hint button
  textStyle(BOLD);
  text("Hint", x, y);
  
  pop();
}

// Function to hide the help modal
function hideHelpModal() {
  if (window.helpModal) {
    window.helpModal.hide();
  }
}

// Helper function to wrap text to a specified width
function wrapTextToWidth(text, maxWidth) {
  // Split the original text by words
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';
  
  // Manually wrap text based on calculated width
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine.length === 0 ? words[i] : currentLine + ' ' + words[i];
    const testWidth = textWidth(testLine);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      // If we can't fit the current word on the line, push the current line and start a new one
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  
  // Push the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Create a tutorial vessel with the same appearance as a game vessel but ensuring correct colors
function createTutorialVessel(name, colorType, x, y, width, height) {
  // Map color types to appropriate vessel configurations
  let ingredients = [name]; // Use the name as the only ingredient
  let complete_combinations = [];
  let color;
  let isComplete = false;
  
  // Configure vessel based on color type
  if (colorType === "white" || colorType === "vesselBase") {
    // Basic ingredient - use pure white
    color = "white"; // We want pure white for better visibility in the help modal
  } else if (colorType === "yellow") {
    // Partial combination
    color = COLORS.vesselYellow;
    isComplete = false;
  } else if (colorType === "green") {
    // Complete combination
    color = COLORS.green;
    isComplete = true;
  } else if (colorType === "red" || colorType === "#FF5252") {
    // Hint vessel
    color = COLORS.vesselHint;
  }
  
  // Create a standard vessel with the right configuration
  const vessel = new Vessel(ingredients, complete_combinations, name, color, x, y, width, height);
  
  // Configure for tutorial context
  vessel.isTutorial = true;
  vessel.isComplete = isComplete;
  
  // Ensure text formatting is consistent with game vessels
  vessel.getDisplayText = function() {
    return this.name;
  };
  
  // Set proper text margin for correct text wrapping
  vessel.textMargin = 0.75; // Use 75% of vessel width for text
  
  // Scale down both vessel body and text to 66% of normal size
  vessel.bodyScale = 0.66;
  vessel.textScale = 0.66;
  
  return vessel;
}

// Animation function for tutorial vessels (to be implemented)
function animateTutorialVessels() {
  // This will be implemented in the future to enable animations
  // It will use the vessels stored in window.tutorialVessels
}

// Ensure showHelpModal is available globally
window.showHelpModal = showHelpModal; 