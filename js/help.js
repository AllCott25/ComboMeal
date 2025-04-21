/*
 * Help Modal for Culinary Logic Puzzle
 * Created by APlasker
 * Last Updated: April 20, 2025 (19:10 EDT)
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
    width: playAreaWidth * 0.85,  // 85% of play area width
    height: playAreaHeight * 0.8, // 80% of play area height
    
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
      
      // "How to Play" title - LOWERED BY ADDITIONAL 5px (total 15px from original)
      fill(0); // Black text
      noStroke();
      textAlign(CENTER, TOP);
      textSize(this.width * 0.05); // 5% of modal width
      textStyle(BOLD);
      text("How to Play", this.x, this.y - this.height/2 + 35); // Changed from 30 to 35
      
      // Calculate vertical shift for content (2% of modal height up)
      const contentShift = this.height * 0.02;
      
      // Define vessel and text properties - RAISED BY 2% OF MODAL HEIGHT
      const contentWidth = this.width * 0.9; // 90% of modal width
      const contentHeight = this.height * 0.85; // 85% of modal height
      const contentTop = this.y - this.height/2 + 70 - contentShift; // Raised by contentShift
      
      // Calculate column widths
      const vesselColumnWidth = contentWidth * 0.30; // 30% of content width
      const textColumnWidth = contentWidth * 0.60; // 60% of content width
      
      // Calculate x-positions for columns
      const vesselColumnX = this.x - contentWidth/2 + vesselColumnWidth/2; // Left column
      const textColumnX = this.x + contentWidth/2 - textColumnWidth/2; // Right column
      
      // Calculate vessel sizes
      const vesselWidth = vesselColumnWidth * 1.7; // 170% of column width
      const vesselHeight = vesselWidth * 0.6; // Maintain aspect ratio
      
      // Calculate spacing between rows
      const rowCount = 5; // Five rows of content including star row
      const rowSpacing = (contentHeight / rowCount)*.5; // Changed from (contentHeight / rowCount) * 0.5 to fix overlapping rows
      
      // Calculate vertical offset for Column 1 (1% of modal height)
      const column1VerticalOffset = this.height * 0.01;
      
      // Vessel configurations
      const vesselConfig = [
        { name: "Carrots", color: "white", text: "Drag & drop ingredients to combine them step-by-step into a mystery recipe." },
        { name: "Carrots + Flour + Eggs", color: "yellow", text: "Yellow combos need more ingredients. The Combos icons near the bottom provide clues to how many more." },
        { name: "Carrot Sheet Cake", color: "green", text: "Combos turn green & transform when you reach the next step. Keep combining until you've made the final dish!" },
        { name: "Cream Cheese Frosting", color: "red", text: "Use Hints to discover what to make next to help complete the dish." },
        { type: "star", text: "Combine everything together with as few mistakes as possible to make the grade!" }
      ];
      
      // Draw each row
      for (let i = 0; i < vesselConfig.length; i++) {
        const config = vesselConfig[i];
        // Calculate row Y positions with tighter spacing
        const rowY = contentTop + (rowSpacing * 2 * i) + rowSpacing;
        
        if (config.type === "star") {
          // Draw star icon for the 5th row - add vertical offset to Column 1
          drawStarIcon(vesselColumnX, rowY + column1VerticalOffset, vesselWidth * 0.5);
        } else {
          // Draw vessel for regular rows - add vertical offset to Column 1
          const vessel = createTutorialVessel(config.name, config.color, vesselColumnX, rowY + column1VerticalOffset, vesselWidth, vesselHeight);
          vessel.draw();
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
    }
  };
}

// Function to draw a 5-pointed star icon in mustard yellow with black outline
function drawStarIcon(x, y, size) {
  push();
  
  // Use COLORS.tertiary for mustard yellow
  fill(COLORS.tertiary);
  
  // Add black outline with same visual weight as vessels
  stroke(0);
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

// Ensure showHelpModal is available globally
window.showHelpModal = showHelpModal; 