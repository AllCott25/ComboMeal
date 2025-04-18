function showWinScreen() {
  gameWon = true;
  triggerHapticFeedback('completion');
}

function drawWinScreen() {
    // Isolate drawing context for the entire win screen
    push();
    
    // Center all content within the play area
    textAlign(CENTER, CENTER);
    textFont(bodyFont);
    textStyle(NORMAL);
    
    // Calculate responsive dimensions based on screen size
    const isMobile = width < 768;
    
    // Determine layout approach based on screen size
    const useVerticalLayout = isMobile;
    
    // Calculate the available space for content
    const contentWidth = playAreaWidth * 0.9;
    
    // ===== RECIPE CARD SECTION =====
    
    // Calculate recipe card size based on viewport dimensions
    const cardWidth = min(playAreaWidth, 600);  // Changed to 100% of play area width, max 600px
    const cardHeight = playAreaHeight * 0.38; // Increased to 38% of screen height
    
    // Position card based on adjusted spacing - header at 6%, recipe card at 10%
    const cardX = playAreaX + playAreaWidth / 2;
    let cardY = playAreaY + playAreaHeight * 0.10 + cardHeight / 2;
    
    // Draw reward message with multicolor treatment (like COMBO MEAL)
    const rewardMessage = "YOU MADE IT!";
    const rewardMessageSize = min(max(playAreaWidth * 0.08, 24), 36); // Changed from width to playAreaWidth with adjusted coefficient
    textSize(rewardMessageSize);
    textStyle(BOLD);
    
    // Calculate the total width of the title to center each letter
    let totalWidth = 0;
    let letterWidths = [];
    
    // First calculate individual letter widths
    for (let i = 0; i < rewardMessage.length; i++) {
      let letterWidth = textWidth(rewardMessage[i]);
      letterWidths.push(letterWidth);
      totalWidth += letterWidth;
    }
    
    // Add kerning (50% increase in spacing)
    const kerningFactor = 0.5; // 50% extra space
    let totalKerning = 0;
    
    // Calculate total kerning space (only between letters, not at the ends)
    for (let i = 0; i < rewardMessage.length - 1; i++) {
      totalKerning += letterWidths[i] * kerningFactor;
    }
    
    // Starting x position (centered with kerning)
    let x = playAreaX + playAreaWidth/2 - (totalWidth + totalKerning)/2;
    
    // Bubble Pop effect parameters
    const outlineWeight = useVerticalLayout ? 1.5 : 2; // Thinner outline for bubble style
    const bounceAmount = 2 * Math.sin(frameCount * 0.05); // Subtle bounce animation
    
    // Draw each letter with alternating colors
    for (let i = 0; i < rewardMessage.length; i++) {
      // Choose color based on position (cycle through green, yellow, red)
      let letterColor;
      switch (i % 3) {
        case 0:
          letterColor = COLORS.primary; // Green
          break;
        case 1:
          letterColor = COLORS.tertiary; // Yellow
          break;
        case 2:
          letterColor = COLORS.secondary; // Red
          break;
      }
      
      // Calculate letter position with bounce effect
      // Even and odd letters bounce in opposite directions for playful effect
      let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
      let letterX = x + letterWidths[i]/2;
      let letterY = playAreaY + playAreaHeight * 0.06 + offsetY;
      
      // Draw black outline - thinner for bubble style
      fill('black');
      noStroke();
      
      // Draw the letter with a thinner outline
      text(rewardMessage[i], letterX - outlineWeight, letterY); // Left
      text(rewardMessage[i], letterX + outlineWeight, letterY); // Right
      text(rewardMessage[i], letterX, letterY - outlineWeight); // Top
      text(rewardMessage[i], letterX, letterY + outlineWeight); // Bottom
      text(rewardMessage[i], letterX - outlineWeight, letterY - outlineWeight); // Top-left
      text(rewardMessage[i], letterX + outlineWeight, letterY - outlineWeight); // Top-right
      text(rewardMessage[i], letterX - outlineWeight, letterY + outlineWeight); // Bottom-left
      text(rewardMessage[i], letterX + outlineWeight, letterY + outlineWeight); // Bottom-right
      
      // Draw letter fill with color
      fill(letterColor);
      text(rewardMessage[i], letterX, letterY);
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    
    textStyle(NORMAL);
    
    // Draw Recipe Card with drop shadow
    // Shadow
    push(); // Isolate drawing context for the recipe card
    rectMode(CENTER); // Explicitly set CENTER mode for recipe card
    fill(0, 0, 0, 30);
    noStroke();
    rect(cardX + 5, cardY + 5, cardWidth, cardHeight, max(cardWidth * 0.02, 8)); // 2% of card width, min 8px
    
    // Card - make it look slightly interactive with a subtle hover effect
    if (isMouseOverCard) {
      fill(255); // Keep white background
      // Add a green outline when hovered, matching the letter score hover effect
      stroke(COLORS.primary); // Green outline when hovered
      strokeWeight(3); // Thicker stroke to match letter score hover effect
    } else {
      fill(255);
      stroke(220);
      strokeWeight(1);
    }
    rect(cardX, cardY, cardWidth, cardHeight, max(cardWidth * 0.02, 8)); // 2% of card width, min 8px
    pop(); // Restore the drawing context
    
    // Draw flowers in the corners of the recipe card - reduced to 1.5% of card width
    const flowerSize = max(cardWidth * 0.015, 4); // 1.5% of card width, min 4px
    const cornerOffset = cardWidth * 0.07; // 7% of card width
    
    // Draw flowers in each corner
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary); // Top-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.secondary); // Top-right
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.tertiary); // Bottom-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
    
    // Draw recipe name
    const recipeNameSize = min(max(playAreaWidth * 0.06, 18), 28); // Changed from width to playAreaWidth with adjusted coefficient
    textSize(recipeNameSize);
    fill(COLORS.secondary);
    textStyle(BOLD);
    text(final_combination.name, cardX, cardY - cardHeight/2 + cardHeight * 0.09); // Adjusted to 9% of card height from top
    textStyle(NORMAL);
    
    // Add author information if it exists
    if (recipeAuthor && recipeAuthor.trim() !== "") {
      textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
      fill('#333333');
      text(`By ${recipeAuthor}`, cardX, cardY - cardHeight/2 + cardHeight * 0.16); // Adjusted to 16% of card height from top
    }
    
    // Resize image dimensions for responsive layout
    const imageWidth = min(cardWidth * 0.45, 220);  // 45% of card width, max 220px
    const imageHeight = imageWidth; // Keep square
    
    // Update image position based on new metrics
    let imageX = cardX - cardWidth/2 + cardWidth * 0.28; // 28% of card width from left edge
    let imageY = cardY - cardHeight/2 + cardHeight * 0.53; // 53% of card height from top (updated from 50%)
    
    // Isolate drawing context for the image section
    push();
    // Set modes specifically for image rendering
    rectMode(CENTER);
    imageMode(CENTER);
    textAlign(CENTER, CENTER);
    
    // Only draw the placeholder if there's no image to display
    if (typeof recipeImage === 'undefined' || !recipeImage) {
      // Draw recipe image placeholder (square)
      fill(240);
      stroke(220);
      strokeWeight(1);
      rect(imageX, imageY, imageWidth, imageHeight, max(cardWidth * 0.02, 8)); // Add rounded corners matching the card
      
      // Draw placeholder text
      fill(180);
      textSize(min(max(playAreaWidth * 0.025, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
      text("Recipe Image", imageX, imageY);
    } else {
      // Image exists - draw it directly in place of the placeholder
      // Calculate scaling factors for "crop to fill" approach
      const imgRatio = recipeImage.width / recipeImage.height;
      const boxRatio = imageWidth / imageHeight;
      
      // Variables for the source (original image) rectangle
      let sx = 0, sy = 0, sw = recipeImage.width, sh = recipeImage.height;
      
      // Crop to fill approach
      if (imgRatio > boxRatio) {
        // Image is wider than box - crop sides
        sw = recipeImage.height * boxRatio;
        sx = (recipeImage.width - sw) / 2; // Center horizontally
      } else if (imgRatio < boxRatio) {
        // Image is taller than box - crop top/bottom
        sh = recipeImage.width / boxRatio;
        sy = (recipeImage.height - sh) / 2; // Center vertically
      }
      
      // Create rounded corners using a clipping region
      // The corner radius matches the card's corner radius
      const cornerRadius = max(cardWidth * 0.02, 8);
      
      // Save the drawing state before creating the clip
      push();
      // Draw a rounded rectangle as a mask
      noStroke();
      fill(255);
      rect(imageX, imageY, imageWidth, imageHeight, cornerRadius);
      // Enable clipping to this shape
      drawingContext.clip();
      
      // Draw the image using the calculated crop area in place of the placeholder
      image(recipeImage, imageX, imageY, imageWidth, imageHeight, sx, sy, sw, sh);
      
      // Restore drawing state after clipped drawing
      pop();
      
      // Draw a border around the image to match the placeholder style
      noFill();
      stroke(220);
      strokeWeight(1);
      rect(imageX, imageY, imageWidth, imageHeight, cornerRadius);
    }
    
    // Restore the previous drawing context
    pop();
    
    // Draw recipe description - increased to 45% of card width
    const descriptionX = cardX - cardWidth/2 + cardWidth * 0.55; // Changed from 0.75 to 0.55 to position correctly with LEFT alignment
    const descriptionWidth = cardWidth * 0.40; // 45% of card width
    
    // Update description Y position to align with the top of the recipe image
    // Calculate the top edge of the image (image is positioned at center, so subtract half height)
    const imageTopEdge = (cardY - cardHeight/2 + cardHeight * 0.53) - (imageHeight/2);
    // Add one line of text height worth of spacing (approximately one textSize worth)
    const textLineHeight = min(max(playAreaWidth * 0.02, 8), 12); // Same size used for description text
    const descriptionY = imageTopEdge + textLineHeight; // Add one line of spacing
    
    // Isolate text context for description - APlasker
    push();
    fill(0);
    textAlign(LEFT, TOP);
    textSize(min(max(playAreaWidth * 0.02, 8), 12)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#666');
    
    text(recipeDescription, descriptionX, descriptionY, descriptionWidth, cardHeight * 0.35); // 35% of card height max
    pop(); // End description text context
    
    // Position ingredients - align with description's left edge and adjust spacing
    const ingredientsY = descriptionY + cardHeight * 0.2; // Use a fixed percentage of card height for spacing below description
    const ingredientsX = descriptionX; // Match description's left alignment
    
    // Isolate text context for ingredients section - APlasker
    push();
    
    // Draw "Ingredients:" header
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    textStyle(BOLD);
    fill('#444');
    textAlign(LEFT, TOP);
    text("Ingredients:", ingredientsX, ingredientsY, descriptionWidth); // Added width parameter to match description width
    textStyle(NORMAL);
    
    // Sort ingredients by length (shortest to longest)
    const sortedIngredients = [...ingredients].sort((a, b) => a.length - b.length);
    
    // Calculate columns for ingredients
    const numIngredients = sortedIngredients.length;
    const numColumns = 2; // Always use 2 columns
    const itemsPerColumn = Math.ceil(numIngredients / numColumns);
    const columnWidth = (descriptionWidth / numColumns) * 0.85; // Reduced by 15% for better spacing
    
    // Draw ingredients in columns
    textSize(min(max(playAreaWidth * 0.018, 7), 9)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#666');
    
    // Function to process ingredients for display
    function processIngredientsForColumn(ingredientsList, charLimit) {
      return ingredientsList.map(ingredient => {
        let lines = [];
        let words = ingredient.split(' ');
        let currentLine = "";
        
        for (let word of words) {
          if (currentLine === "") {
            currentLine = word;
          } else if ((currentLine + " " + word).length <= charLimit) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        
        if (currentLine !== "") {
          lines.push(currentLine);
        }
        
        return {
          original: ingredient,
          lines: lines
        };
      });
    }
    
    // Character limit for ingredients, adjust for screen size
    const charLimit = useVerticalLayout ? 15 : 20;
    
    // Process ingredients for both columns
    const leftColumnIngredients = sortedIngredients.slice(0, itemsPerColumn);
    const rightColumnIngredients = sortedIngredients.slice(itemsPerColumn);
    
    const leftColumnProcessed = processIngredientsForColumn(leftColumnIngredients, charLimit);
    const rightColumnProcessed = processIngredientsForColumn(rightColumnIngredients, charLimit);
    
    // Calculate if all ingredients can fit in the available space
    const lineHeight = useVerticalLayout ? 8 : 10;
    const ingredientSpacing = useVerticalLayout ? 2 : 3;
    
    // Max available height for ingredients
    const maxAvailableHeight = cardY + cardHeight/2 - ingredientsY - 20;
    
    // Flag to track if we should show all ingredients or only a subset
    let showAllIngredients = true;
    
    // Explicitly maintain LEFT alignment for ingredients - APlasker
    textAlign(LEFT, TOP);
    
    // Draw left column
    let leftYOffset = ingredientsY + 20; // Increased from 15 to 20 to add more space below the header
    for (let i = 0; i < leftColumnProcessed.length; i++) {
      // Check if we've run out of space
      if (!showAllIngredients && leftYOffset + leftColumnProcessed[i].lines.length * lineHeight > ingredientsY + maxAvailableHeight) {
        break;
      }
      
      const lines = leftColumnProcessed[i].lines;
      // Properly calculate left column x position - no need for negative offset with LEFT alignment
      const x = ingredientsX; // Removed negative offset that was compensating for CENTER alignment
      
      // Draw each line of this ingredient
      for (let j = 0; j < lines.length; j++) {
        if (j === 0) {
          // Only add bullet to the first line of each ingredient
          text("• " + lines[j], x, leftYOffset, columnWidth); // Added width parameter for consistent alignment
        } else {
          // Indent subsequent lines to align with text after bullet
          text("  " + lines[j], x, leftYOffset, columnWidth); // Added width parameter for consistent alignment
        }
        leftYOffset += lineHeight;
      }
      
      // Add spacing between ingredients
      leftYOffset += ingredientSpacing;
    }
    
    // Draw right column
    let rightYOffset = ingredientsY + 20; // Increased from 15 to 20 to add more space below the header
    for (let i = 0; i < rightColumnProcessed.length; i++) {
      // Check if we've run out of space
      if (!showAllIngredients && rightYOffset + rightColumnProcessed[i].lines.length * lineHeight > ingredientsY + maxAvailableHeight) {
        break;
      }
      
      const lines = rightColumnProcessed[i].lines;
      // Properly calculate right column x position based on the LEFT alignment
      const x = ingredientsX + columnWidth * 1.15; // Set spacing between columns to 15% of column width
      
      // Draw each line of this ingredient
      for (let j = 0; j < lines.length; j++) {
        if (j === 0) {
          // Only add bullet to the first line of each ingredient
          text("• " + lines[j], x, rightYOffset, columnWidth); // Added width parameter for consistent alignment
        } else {
          // Indent subsequent lines to align with text after bullet
          text("  " + lines[j], x, rightYOffset, columnWidth); // Added width parameter for consistent alignment
        }
        rightYOffset += lineHeight;
      }
      
      // Add spacing between ingredients
      rightYOffset += ingredientSpacing;
    }
    
    pop(); // End ingredients section context
    
    // Add "View Full Recipe" text at the bottom of the card
    push(); // Isolate text context for View Full Recipe
    textAlign(CENTER, CENTER);
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    if (isMouseOverCard) {
      fill(COLORS.primary); // Green text when hovered
    } else {
      fill('#666'); // Gray text normally
    }
    text("View Full Recipe →", cardX, cardY + cardHeight/2 - cardHeight * 0.07); // 7% of card height from bottom
    pop(); // End View Full Recipe context
    
    // ===== SCORE SECTION =====
    
    // Calculate responsive position for score section - 52% of screen height (adjusted)
    const scoreCardPositionY = playAreaY + playAreaHeight * 0.52;
    
    // Calculate score card size based on play area width - increased to 45% of play area width
    scoreWidth = min(max(playAreaWidth * 0.45, 180), 300);
    scoreHeight = scoreWidth * 1.414; // A4 paper ratio
    
    // Position score card
    scoreX = playAreaX + playAreaWidth/2; // Centered in the play area
    scoreY = scoreCardPositionY + scoreHeight/2; // Adjusted for vertical centering
    
    // Draw letter score with drop shadow
    push(); // Isolate drawing context for the score card
    rectMode(CENTER); // Explicitly set CENTER mode for score card
    
    // Shadow
    fill(0, 0, 0, 30);
    noStroke();
    rect(scoreX + 5, scoreY + 5, scoreWidth, scoreHeight, max(scoreWidth * 0.01, 4)); // Reduced to 1% of score width, min 4px
    
    // Paper
    fill(255);
    stroke(220);
    strokeWeight(1);
    rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.01, 4)); // Reduced to 1% of score width, min 4px
    
    // Check if mouse is over the letter score area
    isMouseOverLetterScore = mouseX > scoreX - scoreWidth/2 && mouseX < scoreX + scoreWidth/2 && 
                           mouseY > scoreY - scoreHeight/2 && mouseY < scoreY + scoreHeight/2;
    
    // Highlight the letter score area when hovered, similar to recipe card
    if (isMouseOverLetterScore) {
      // Add a subtle highlight effect
      noFill();
      stroke(COLORS.primary); // Green highlight
      strokeWeight(3);
      rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.01, 4)); // Reduced to 1% of score width, min 4px
    }
    
    pop(); // Restore the drawing context
    
    // Count black moves (incorrect attempts)
    let blackMoves = 0;
    
    // Count black moves
    for (let move of moveHistory) {
      if (move === 'black' || move === '#333333') {
        blackMoves++;
      }
    }
    
    // Count red hint moves
    let redHintMoves = 0;
    for (let move of moveHistory) {
      if (move === '#FF5252') {
        redHintMoves++;
      }
    }
    
    // Calculate total score (only counting red hint and black moves)
    const totalScore = blackMoves + redHintMoves;
    
    // Determine letter grade and color based on ONLY blackMoves (errors)
    // Using global letterGrade variable
    let letterColor;
    // Using the global isAPlus variable now
    isAPlus = false;
    
    if (blackMoves === 0) {
      letterGrade = "A";
      letterColor = color(0, 120, 255); // Blue
      // A+ is achieved with zero errors AND zero hints
      // Check both redHintMoves and hintCount to ensure no hints were used
      if (redHintMoves === 0 && hintCount === 0) {
        isAPlus = true; // Mark as A+ for diamond decoration
      }
    } else if (blackMoves >= 1 && blackMoves <= 2) {
      letterGrade = "B";
      letterColor = COLORS.green; // Use our explicit green color
    } else if (blackMoves >= 3 && blackMoves <= 4) {
      letterGrade = "C";
      letterColor = COLORS.tertiary; // Yellow from vessels
    } else { // blackMoves >= 5
      letterGrade = "X";
      letterColor = COLORS.secondary; // Red from vessels
    }
    
    // Draw circle with the same color as the letter but with 30% opacity - increased to 90% of score width
    const circleSize = scoreWidth * 0.9; // 90% of score width
    noStroke();
    
    // Create a copy of the letter color with 30% opacity
    let circleBgColor = color(red(letterColor), green(letterColor), blue(letterColor), 76); // 76 is 30% of 255
    fill(circleBgColor);
    circle(scoreX, scoreY, circleSize);
    
    // Add "COMBO MEAL" header above the letter grade - positioned at 8% of score height from top
    textAlign(CENTER, CENTER);
    // Calculate font size that ensures COMBO MEAL text fits within 90% of score card width
    let maxComboMealSize = min(max(playAreaWidth * 0.04, 14), 18);
    // Temporarily set text size to check if it fits
    textSize(maxComboMealSize);
    
    // Apply kerning to "COMBO MEAL" text
    const comboMealText = "COMBO MEAL";
    let comboMealWidth = 0;
    let comboMealLetterWidths = [];
    
    // Calculate letter widths
    for (let i = 0; i < comboMealText.length; i++) {
      let letterWidth = textWidth(comboMealText[i]);
      comboMealLetterWidths.push(letterWidth);
      comboMealWidth += letterWidth;
    }
    
    // Increase kerning by 70% (more than the 50% used for "YOU MADE IT!")
    const comboMealKerningFactor = 0.7;
    let comboMealTotalKerning = 0;
    
    // Calculate total kerning space
    for (let i = 0; i < comboMealText.length - 1; i++) {
      comboMealTotalKerning += comboMealLetterWidths[i] * comboMealKerningFactor;
    }
    
    // Calculate total width with kerning
    const totalComboMealWidth = comboMealWidth + comboMealTotalKerning;
    
    // Adjust font size if text is too wide (exceeds 90% of score card width)
    if (totalComboMealWidth > scoreWidth * 0.9) {
      maxComboMealSize *= (scoreWidth * 0.9) / totalComboMealWidth;
      textSize(maxComboMealSize);
      
      // Recalculate widths with new font size
      comboMealWidth = 0;
      comboMealLetterWidths = [];
      for (let i = 0; i < comboMealText.length; i++) {
        let letterWidth = textWidth(comboMealText[i]);
        comboMealLetterWidths.push(letterWidth);
        comboMealWidth += letterWidth;
      }
      
      // Recalculate kerning
      comboMealTotalKerning = 0;
      for (let i = 0; i < comboMealText.length - 1; i++) {
        comboMealTotalKerning += comboMealLetterWidths[i] * comboMealKerningFactor;
      }
    }
    
    fill(0); // Black text
    textStyle(BOLD);
    
    // Starting x position (centered with kerning)
    let comboMealX = scoreX - (comboMealWidth + comboMealTotalKerning)/2;
    
    // Position at 8% of score height from top (adjusted)
    const comboMealY = scoreY - scoreHeight/2 + scoreHeight * 0.08;
    
    // Draw each letter with increased spacing
    for (let i = 0; i < comboMealText.length; i++) {
      // Calculate letter position
      let letterX = comboMealX + comboMealLetterWidths[i]/2;
      
      // Draw letter
      text(comboMealText[i], letterX, comboMealY);
      
      // Move to the next letter position with kerning
      comboMealX += comboMealLetterWidths[i] * (1 + comboMealKerningFactor);
    }
    
    // Draw letter grade - with increased font size from 65% to 90% of circle size
    textAlign(CENTER, CENTER);
    textSize(circleSize * 0.9); // 90% of circle size for better proportion (updated from 65%)
    fill(letterColor);
    textStyle(NORMAL);
    text(letterGrade, scoreX, scoreY);
    
    // Check if Easter Egg was found
    let eggFound = moveHistory.some(move => 
      typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
    );
    
    // Draw sunny-side-up egg indicator if an Easter egg was found
    if (eggFound) {
      push();
      // Position the egg in the top left corner of the letter grade
      const eggSize = circleSize * 0.25; // 25% of circle size
      const eggX = scoreX - circleSize * 0.3;
      const eggY = scoreY - circleSize * 0.3;
      const sizeMultiplier = 1.25; // Increase size by 25%
      
      // Draw drop shadow for the entire egg
      fill(0, 0, 0, 40);
      noStroke();
      // Offset shadow by 4px
      translate(4, 4);
      
      // Draw egg white (soft blob shape from Design 3)
      beginShape();
      vertex(eggX - 30 * sizeMultiplier, eggY * sizeMultiplier);
      bezierVertex(
          eggX - 45 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX - 20 * sizeMultiplier, eggY - 45 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY - 30 * sizeMultiplier  // end point
      );
      bezierVertex(
          eggX + 40 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX + 30 * sizeMultiplier, eggY + 20 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY + 30 * sizeMultiplier  // end point
      );
      // Create a soft, rounded blob shape with no pointiness
      bezierVertex(
          eggX - 5 * sizeMultiplier, eggY + 35 * sizeMultiplier,  // control point 1 (moved inward and up)
          eggX - 20 * sizeMultiplier, eggY + 15 * sizeMultiplier, // control point 2 (moved significantly upward)
          eggX - 30 * sizeMultiplier, eggY * sizeMultiplier       // end point (connects to start)
      );
      endShape(CLOSE);
      
      // Reset translation for the actual egg
      translate(-4, -4);
      
      // Draw the egg white (soft blob shape)
      fill(255, 255, 255); // Pure white
      noStroke();
      
      beginShape();
      vertex(eggX - 30 * sizeMultiplier, eggY * sizeMultiplier);
      bezierVertex(
          eggX - 45 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX - 20 * sizeMultiplier, eggY - 45 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY - 30 * sizeMultiplier  // end point
      );
      bezierVertex(
          eggX + 40 * sizeMultiplier, eggY - 20 * sizeMultiplier, // control point 1
          eggX + 30 * sizeMultiplier, eggY + 20 * sizeMultiplier, // control point 2
          eggX + 10 * sizeMultiplier, eggY + 30 * sizeMultiplier  // end point
      );
      // Create a soft, rounded blob shape with no pointiness
      bezierVertex(
          eggX - 5 * sizeMultiplier, eggY + 35 * sizeMultiplier,  // control point 1 (moved inward and up)
          eggX - 20 * sizeMultiplier, eggY + 15 * sizeMultiplier, // control point 2 (moved significantly upward)
          eggX - 30 * sizeMultiplier, eggY * sizeMultiplier       // end point (connects to start)
      );
      endShape(CLOSE);
      
      // Draw the yolk - positioned higher up and slightly to the left
      const yolkSize = 36 * sizeMultiplier;
      for (let i = 5; i >= 0; i--) {
        const currentYolkSize = yolkSize * (1 - i * 0.05);
        const alpha = 255 - i * 10;
        fill(255, 204, 0, alpha); // Bright egg yolk yellow with gradient
        noStroke();
        ellipse(eggX - 5 * sizeMultiplier, eggY - 20 * sizeMultiplier, currentYolkSize, currentYolkSize * 0.9); // Slightly oval
      }
      
      // Add highlight to the yolk
      fill(255, 255, 255, 100);
      noStroke();
      ellipse(eggX - 12 * sizeMultiplier, eggY - 25 * sizeMultiplier, yolkSize * 0.4, yolkSize * 0.3);
      
      // Add a thin outline to the yolk
      noFill();
      stroke(200, 150, 0, 100);
      strokeWeight(1);
      ellipse(eggX - 5 * sizeMultiplier, eggY - 20 * sizeMultiplier, yolkSize, yolkSize * 0.9);
      pop();
    }
    
    // Draw star stickers for A+ grade
    if (isAPlus) {
      // Star parameters
      const starLargeSize = circleSize * 0.3; // 30% of circle size for larger stars
      const starSmallSize = circleSize * 0.24; // 24% of circle size for smaller stars
      const outerRadius = starLargeSize * 0.5;
      const innerRadius = outerRadius * 0.5; // Increased inner radius for rounder appearance
      const roundness = outerRadius * 0.25; // Increased roundness for more cartoonish look
      
      // Function to draw a star sticker
      const drawStarSticker = (x, y, size) => {
        push();
        translate(x, y);
        
        // Calculate radius based on size (large or small)
        const currentOuterRadius = size === 'large' ? outerRadius : outerRadius * 0.8;
        const currentInnerRadius = size === 'large' ? innerRadius : innerRadius * 0.8;
        const currentRoundness = size === 'large' ? roundness : roundness * 0.8;
        
        // Draw drop shadow
        fill(0, 0, 0, 40);
        noStroke();
        translate(2, 2);
        starWithRoundedPoints(0, 0, currentInnerRadius, currentOuterRadius, 5, currentRoundness);
        
        // Draw white outline
        translate(-2, -2);
        fill(255);
        strokeWeight(3);
        stroke(255);
        starWithRoundedPoints(0, 0, currentInnerRadius, currentOuterRadius, 5, currentRoundness);
        
        // Draw yellow star with yolk color (255, 204, 0) instead of COLORS.tertiary
        fill(255, 204, 0);
        strokeWeight(1);
        stroke(255, 255, 255, 200);
        starWithRoundedPoints(0, 0, currentInnerRadius, currentOuterRadius, 5, currentRoundness);
        
        pop();
      };
      
      // Top right corner - two stars
      drawStarSticker(scoreX + circleSize * 0.35, scoreY - circleSize * 0.35, 'large');
      drawStarSticker(scoreX + circleSize * 0.5, scoreY - circleSize * 0.2, 'small');
      
      // Bottom left corner - two stars
      drawStarSticker(scoreX - circleSize * 0.35, scoreY + circleSize * 0.35, 'large');
      drawStarSticker(scoreX - circleSize * 0.5, scoreY + circleSize * 0.2, 'small');
    }
    
    // Draw hint indicators if hints were used
    if (hintCount > 0) {
      // Function to draw a hint indicator sticker
      const drawHintIndicator = (x, y, size) => {
        push();
        translate(x, y);
        
        // Calculate hint indicator size - 25% of circle size
        const hintSize = circleSize * 0.25 * size;
        
        // Draw drop shadow
        fill(0, 0, 0, 40);
        noStroke();
        translate(4, 4);
        ellipse(0, 0, hintSize, hintSize);
        
        // Draw white outline
        translate(-4, -4);
        fill(255);
        strokeWeight(4);
        stroke(255);
        ellipse(0, 0, hintSize, hintSize);
        
        // Draw white background
        fill(255);
        strokeWeight(1);
        stroke(255, 255, 255, 200);
        ellipse(0, 0, hintSize, hintSize);
        
        // Draw red circle outline (closer to the edge)
        noFill();
        strokeWeight(3);
        stroke('#FF5252');
        ellipse(0, 0, hintSize * 0.8, hintSize * 0.8);
        
        // Draw red question mark using Helvetica font
        fill('#FF5252');
        noStroke();
        textSize(hintSize * 0.6);
        textFont('Helvetica, Arial, sans-serif');
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        text("?", 0, 0);
        
        pop();
      };
      
      // Draw hint indicators based on hint count
      if (hintCount >= 1) {
        // First hint indicator - bottom right
        drawHintIndicator(scoreX + circleSize * 0.4, scoreY + circleSize * 0.4, 1);
      }
      
      if (hintCount >= 2) {
        // Second hint indicator - top right
        drawHintIndicator(scoreX + circleSize * 0.4, scoreY - circleSize * 0.4, 1);
      }
      
      if (hintCount >= 3) {
        // Third hint indicator - with minimal overlap
        drawHintIndicator(scoreX + circleSize * 0.4 + 25, scoreY + circleSize * 0.4 - 25, 1);
      }
    }
    
    textStyle(NORMAL);
    
    // Add "Share Score" text at the bottom of the letter score area
    textAlign(CENTER, CENTER);
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    if (isMouseOverLetterScore) {
      fill(COLORS.primary); // Green text when hovered
    } else {
      fill('#666'); // Gray text normally
    }
    text("Share Score →", scoreX, scoreY + scoreHeight/2 - scoreHeight * 0.07); // 7% of score height from bottom
    
    // Add "New Recipe Daily" text at the bottom - 5% from bottom of screen
    textAlign(CENTER, CENTER);
    textSize(min(max(playAreaWidth * 0.04, 14), 18)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#333');
    textStyle(BOLD);
    text("New Recipe Daily", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.95);
    textStyle(NORMAL);
    
    // Add "Say hi!" link text below the main text
    textSize(min(max(playAreaWidth * 0.025, 10), 14)); // Smaller size for the link text
    fill(COLORS.primary); // Green color for the link
    text("Say hi!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.98); // Changed from 0.97 to 0.98
    
    // Store position and dimensions for hit detection
    sayHiLinkX = playAreaX + playAreaWidth/2;
    sayHiLinkY = playAreaY + playAreaHeight * 0.98; // Changed from 0.97 to 0.98
    sayHiLinkWidth = textWidth("Say hi!") * 1.2; // Add some padding
    sayHiLinkHeight = textAscent() + textDescent();
    
    // Check if mouse is over the Say hi link
    isMouseOverSayHi = mouseX > sayHiLinkX - sayHiLinkWidth/2 && 
                       mouseX < sayHiLinkX + sayHiLinkWidth/2 && 
                       mouseY > sayHiLinkY - sayHiLinkHeight/2 && 
                       mouseY < sayHiLinkY + sayHiLinkHeight/2;
    
    // Change cursor to pointer if over the link
    if (isMouseOverSayHi) {
      cursor(HAND);
    }
    
    // Check if mouse is over the recipe card
    isMouseOverCard = mouseX > cardX - cardWidth/2 && mouseX < cardX + cardWidth/2 && 
                     mouseY > cardY - cardHeight/2 && mouseY < cardY + cardHeight/2;
    
    // Change cursor to pointer if over the card or letter score area
    if (isMouseOverCard || isMouseOverLetterScore) {
      cursor(HAND);
    }
    
    // TEMPORARY - TEST BUTTON FOR LETTER SCORE INTERACTION
    // Add this at the very end of the function before the closing brace
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Only show test UI in local development
      push();
      fill(200, 50, 50);
      rect(playAreaX + 20, playAreaY + 20, 120, 30);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(12);
      text("Test Letter Score", playAreaX + 20 + 60, playAreaY + 20 + 15);
      pop();
      
      // Check if test button is clicked
      if (mouseIsPressed && 
          mouseX > playAreaX + 20 && mouseX < playAreaX + 20 + 120 &&
          mouseY > playAreaY + 20 && mouseY < playAreaY + 20 + 30) {
        console.log("Test button clicked - calling handleLetterScoreInteraction");
        // Call the handler with score coordinates instead of mouse coordinates
        if (scoreX && scoreY) {
          handleLetterScoreInteraction(scoreX, scoreY);
        }
      }
    }
    
    // After drawing all win screen content, draw the flower animation on top if it's active
    if (persistentFlowerAnimation && persistentFlowerAnimation.active) {
      persistentFlowerAnimation.draw();
      persistentFlowerAnimation.update();
    }
    
    // At the end of the drawWinScreen function, restore the drawing context
    pop();
  }


  function shareScore() {
    try {
      console.log("shareScore called - letterGrade:", letterGrade, "isAPlus:", isAPlus);
      
      // More robust recipe number retrieval with fallbacks
      let recipeNumber = '?';
      
      // Try getting rec_id from final_combination first
      if (final_combination && final_combination.rec_id) {
        recipeNumber = final_combination.rec_id;
      } 
      // Then try getting it from recipe_data
      else if (recipe_data && recipe_data.rec_id) {
        recipeNumber = recipe_data.rec_id;
      }
      
      // Add fallbacks if global variables aren't set properly
      if (typeof isAPlus === 'undefined') {
        console.warn("isAPlus is undefined, defaulting to false");
        isAPlus = false;
      }
      
      if (typeof letterGrade === 'undefined') {
        console.warn("letterGrade is undefined, defaulting to 'X'");
        letterGrade = "X";
      }
      
      // Determine emoji markers based on letter grade
      let gradeEmojis;
      if (isAPlus) {
        gradeEmojis = `🌟A🌟`; // A+ score
      } else if (letterGrade === "A") {
        gradeEmojis = `🔵A🔵`; // A score
      } else if (letterGrade === "B") {
        gradeEmojis = `🟢B🟢`; // B score
      } else if (letterGrade === "C") {
        gradeEmojis = `🟠C🟠`; // C score
      } else { // X grade
        gradeEmojis = `❌`; // Failing score
      }
      
      // Determine egg emoji based on Easter egg found
      let eggEmoji = '';
      if (moveHistory.some(move => 
        typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
      )) {
        eggEmoji = '🍳';
      }
      
      // Count red hint moves from moveHistory
      // Add hint indicators (question mark emoji) based on how many hints were used
      let hintEmojis = '';
      for (let i = 0; i < hintCount; i++) {
        hintEmojis += '❓';
      }
      
      // Create the simplified emoji-based share text - WITHOUT the URL
      let shareText = `Combo Meal 🍴 Recipe ${recipeNumber}: ${gradeEmojis} ${hintEmojis} ${eggEmoji}`;
      const shareUrl = "https://allcott25.github.io/ComboMeal/";
      
      // Check if mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Use the native Web Share API directly if on mobile devices
      if (isMobile && navigator.share) {
        // On iOS, force a small delay on first share attempt to avoid browser init issues
        setTimeout(() => {
          navigator.share({
            title: 'My Combo Meal Score',
            text: shareText,
            url: shareUrl
          })
          .then(() => {
            console.log('Successfully shared using Web Share API');
          })
          .catch(error => {
            console.log('Error sharing:', error);
            
            // Fallback if Web Share API fails - combine text and URL for clipboard
            clipboardShareFallback(shareText + '\n\n' + shareUrl);
          });
        }, 100); // Short delay helps with first-time initialization on iOS
      } else {
        // Desktop or browsers without Web Share API
        clipboardShareFallback(shareText);
      }
      
      // Reset hover states to prevent persistent highlighting
      isMouseOverCard = false;
      isMouseOverLetterScore = false;
    } catch (error) {
      console.error("Error in shareScore function:", error);
      alert("Whoops! Something's broken. Let me know and I'll fix it ✌️");
    }
  }
  
  // Separate clipboard sharing function for fallback
  function clipboardShareFallback(text) {
    try {
      // On iOS, sometimes the toast works better than clipboard API
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isIOS) {
        // For iOS, try to copy to clipboard silently
        try {
          navigator.clipboard.writeText(text).then(() => {
            // Show a simpler toast notification
            const toast = document.createElement('div');
            toast.className = 'share-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.backgroundColor = 'rgba(119, 143, 93, 0.9)'; // Avocado green
            toast.style.color = 'white';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '8px';
            toast.style.zIndex = '1000';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            toast.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            toast.style.fontWeight = 'bold';
            toast.style.fontSize = '16px';
            toast.style.textAlign = 'center';
            toast.innerText = '🍽️ Score copied to clipboard! 🍽️';
            
            document.body.appendChild(toast);
            
            // Fade in
            setTimeout(() => {
              toast.style.opacity = '1';
            }, 50);
            
            // Fade out after 3 seconds
            setTimeout(() => {
              toast.style.opacity = '0';
              setTimeout(() => {
                if (toast.parentNode) {
                  document.body.removeChild(toast);
                }
              }, 500);
            }, 3000);
            
            console.log('Text copied to clipboard silently on iOS');
          });
        } catch (clipErr) {
          console.log('Silent clipboard copy failed on iOS, showing modal as fallback');
          // Last resort - show alert
          alert("Please copy this score manually:\n\n" + text);
        }
      } else {
        // For non-iOS, use clipboard API with toast
        navigator.clipboard.writeText(text)
          .then(() => {
            // Create and show toast
            const toast = document.createElement('div');
            toast.className = 'share-toast';
            toast.innerText = '🍽️ Score copied! Share your food! 🍽️';
            document.body.appendChild(toast);
            
            // Fade in with a small delay to ensure DOM update
            setTimeout(() => {
              toast.style.opacity = '1';
            }, 50);
            
            // Fade out and remove after 3 seconds
            setTimeout(() => {
              toast.style.opacity = '0';
              setTimeout(() => {
                if (toast.parentNode) {
                  document.body.removeChild(toast);
                }
              }, 500);
            }, 3000);
          })
          .catch(err => {
            console.error('Error copying to clipboard:', err);
            // Only show modal as absolute last resort
            alert("Please copy this score manually:\n\n" + text);
          });
      }
    } catch (error) {
      console.error('Fallback share error:', error);
      // Last resort
      alert("Please copy this score manually:\n\n" + text);
    }
  }
  
  function viewRecipe() {
    try {
      // Get the recipe ID safely with fallbacks
      let recipeId = '';
      
      if (final_combination && final_combination.id) {
        recipeId = final_combination.id;
      } else if (recipe_data && recipe_data.id) {
        recipeId = recipe_data.id;
      }
      
      // Use the recipeUrl from Supabase if available - APlasker
      let urlToOpen = 'https://www.google.com'; // Default fallback to Google
      
      if (recipeUrl) {
        urlToOpen = recipeUrl; // Use the URL loaded from Supabase
        console.log("Opening recipe URL from database:", urlToOpen);
      } else {
        console.warn("No recipe URL found in database, using fallback");
      }
      
      // Create anchor element with correct attributes for new tab
      const anchorEl = document.createElement('a');
      anchorEl.href = urlToOpen;
      anchorEl.target = '_blank'; // Force new tab
      anchorEl.rel = 'noopener noreferrer'; // Security best practice
      
      // iOS Safari needs the element to be in the DOM and clicked
      document.body.appendChild(anchorEl);
      
      // Programmatically trigger a click
      anchorEl.click();
      
      // Clean up the DOM
      setTimeout(() => {
        if (document.body.contains(anchorEl)) {
          document.body.removeChild(anchorEl);
        }
      }, 100);
      
      // Fallback in case the DOM approach doesn't work (older browsers)
      try {
        window.open(urlToOpen, '_blank');
      } catch (innerErr) {
        console.log('Anchor method should have worked, window.open fallback unnecessary');
      }
    } catch (e) {
      // Error handler for any unexpected issues
      console.error("Error opening recipe:", e);
      
      // Final fallback - try direct location change as last resort
      // This won't open in a new tab but is better than nothing
      try {
        window.location.href = "https://www.google.com"; // Changed to Google fallback - APlasker
      } catch (finalErr) {
        console.error("All attempts to open recipe failed:", finalErr);
        alert("Unable to open recipe. Please try visiting Google directly.");
      }
    }
  }
  
  function mouseMoved() {
    // Check if buttons exist before trying to use them
    if (!gameStarted && startButton) {
      startButton.checkHover(mouseX, mouseY);
    }
    
    if (gameStarted) {
      // Only check these buttons if they exist and the game has started
      if (hintButton) hintButton.checkHover(mouseX, mouseY);
    }
  }
  // Function to check if a point is within the random recipe hotspot area
  function isInRandomRecipeHotspot(x, y) {
    // Calculate the position of the "!" in "YOU MADE IT!"
    const rewardMessage = "YOU MADE IT!";
    const rewardMessageSize = min(max(playAreaWidth * 0.08, 24), 36);
    textSize(rewardMessageSize);
    textStyle(BOLD);
    
    // Calculate the total width of the title to center each letter
    let totalWidth = 0;
    let letterWidths = [];
    
    // First calculate individual letter widths
    for (let i = 0; i < rewardMessage.length; i++) {
      let letterWidth = textWidth(rewardMessage[i]);
      letterWidths.push(letterWidth);
      totalWidth += letterWidth;
    }
    
    // Add kerning (50% increase in spacing)
    const kerningFactor = 0.5; // 50% extra space
    let totalKerning = 0;
    
    // Calculate total kerning space (only between letters, not at the ends)
    for (let i = 0; i < rewardMessage.length - 1; i++) {
      totalKerning += letterWidths[i] * kerningFactor;
    }
    
    // Starting x position (centered with kerning)
    let startX = playAreaX + playAreaWidth/2 - (totalWidth + totalKerning)/2;
    
    // Calculate the position of the "!"
    let exclamationX = startX;
    for (let i = 0; i < rewardMessage.length - 1; i++) {
      exclamationX += letterWidths[i] * (1 + kerningFactor);
    }
    exclamationX += letterWidths[rewardMessage.length - 1]/2;
    
    let exclamationY = playAreaY + playAreaHeight * 0.06;
    
    // Create a 60x60 pixel hotspot around the "!"
    const isInHotspot = x >= exclamationX - 30 && x <= exclamationX + 30 && 
                        y >= exclamationY - 30 && y <= exclamationY + 30;
    
    // Debug visualization when hovering over hotspot
    if (isInHotspot) {
      noFill();
      stroke(255, 0, 0, 100); // Semi-transparent red for random recipe
      strokeWeight(2);
      rect(exclamationX - 30, exclamationY - 30, 60, 60);
      console.log("Hovering over random recipe hotspot at:", exclamationX, exclamationY);
    }
    
    return isInHotspot;
  }
  
  // Function to load a random recipe
  async function loadRandomRecipe() {
    try {
      console.log("Loading random recipe...");
      const recipeData = await fetchRandomRecipe();
      
      if (!recipeData) {
        console.error("No random recipe data found");
        isLoadingRandomRecipe = false;
        return;
      }
      
      // Update game variables with recipe data
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      ingredients = recipeData.baseIngredients;
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      
      // Get author information from the database if it exists
      recipeAuthor = recipeData.author || "";
      
      // Reset game state
      gameStarted = false;
      gameWon = false;
      moveHistory = [];
      hintCount = 0;
      vessels = [];
      animations = [];
      
      console.log("Random recipe loaded successfully");
    } catch (error) {
      console.error("Error loading random recipe:", error);
      isLoadingRandomRecipe = false;
    }
  }
  
  // Add loading state variable at the top with other game state variables
  let isLoadingRandomRecipe = false;
  
  // New function to show a custom modal for sharing
  function showShareModal(text) {
    // Create modal container
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    // Create modal content
    const content = document.createElement('div');
    content.style.backgroundColor = '#FFFFFF';
    content.style.padding = '20px';
    content.style.borderRadius = '10px';
    content.style.maxWidth = '90%';
    content.style.textAlign = 'center';
    
    // Create header
    const header = document.createElement('h3');
    header.innerText = 'Copy Your Score';
    header.style.marginTop = '0';
    header.style.color = '#778F5D'; // Avocado green
    
    // Create text field
    const textField = document.createElement('textarea');
    textField.value = text;
    textField.style.width = '100%';
    textField.style.padding = '10px';
    textField.style.marginTop = '10px';
    textField.style.marginBottom = '15px';
    textField.style.borderRadius = '5px';
    textField.style.border = '1px solid #ccc';
    textField.style.height = '80px';
    textField.readOnly = true;
    
    // Create instructions
    const instructions = document.createElement('p');
    instructions.innerText = 'Tap and hold the text above to select and copy';
    instructions.style.fontSize = '14px';
    instructions.style.color = '#333';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.backgroundColor = '#778F5D'; // Avocado green
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.padding = '10px 20px';
    closeButton.style.borderRadius = '5px';
    closeButton.style.marginTop = '15px';
    closeButton.style.cursor = 'pointer';
    
    // Add event listener to close modal
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling
      // Reset modal active flag
      if (typeof window.modalActive !== 'undefined') {
        window.modalActive = false;
        console.log('Modal active flag reset (close button)');
      } else if (typeof modalActive !== 'undefined') {
        modalActive = false;
        console.log('Modal active flag reset (close button)');
      }
      // Clear the safety timeout
      clearTimeout(safetyTimeout);
      document.body.removeChild(modal);
    });
    
    // Add event listener to select all text when tapped
    textField.addEventListener('focus', () => {
      textField.select();
    });
    
    // Assemble modal
    content.appendChild(header);
    content.appendChild(textField);
    content.appendChild(instructions);
    content.appendChild(closeButton);
    modal.appendChild(content);
    
    // Add to document
    document.body.appendChild(modal);
    
    // Focus the text field to make it easier to copy
    setTimeout(() => {
      textField.focus();
    }, 100);
  }

  // Function to show the feedback modal
  function showFeedbackModal() {
    try {
      // Set global modal active flag
      if (typeof window.modalActive !== 'undefined') {
        window.modalActive = true;
        console.log('Modal active flag set to true');
      } else if (typeof modalActive !== 'undefined') {
        modalActive = true;
        console.log('Modal active flag set to true');
      }

      // Create modal container
      const modal = document.createElement('div');
      modal.id = 'feedback-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '1000';
      modal.style.pointerEvents = 'auto'; // Ensure clicks are captured by the modal

      // Add event listener to prevent click-through
      modal.addEventListener('click', (e) => {
        // Only stop propagation if clicking directly on the modal background (not its children)
        if (e.target === modal) {
          e.stopPropagation();
          // Reset modal active flag
          if (typeof window.modalActive !== 'undefined') {
            window.modalActive = false;
            console.log('Modal active flag reset (background click)');
          } else if (typeof modalActive !== 'undefined') {
            modalActive = false;
            console.log('Modal active flag reset (background click)');
          }
          document.body.removeChild(modal);
        }
      });
      
      // Create modal content
      const content = document.createElement('div');
      content.style.backgroundColor = '#FFFFFF';
      content.style.padding = '20px';
      content.style.borderRadius = '10px';
      content.style.maxWidth = '90%';
      content.style.width = '400px';
      content.style.maxHeight = '90%';
      content.style.overflowY = 'auto';
      content.style.textAlign = 'center';
      content.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
      
      // Prevent event bubbling from content to modal
      content.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // Create header
      const header = document.createElement('h3');
      header.innerText = 'How\'s our cooking?';
      header.style.marginTop = '0';
      header.style.color = '#778F5D'; // Avocado green
      header.style.fontFamily = 'Arial, sans-serif';
      
      // Create subheader
      const subheader = document.createElement('p');
      subheader.innerText = 'Let us know your thoughts, feelings, glitchy bugs, or favorite recipes!';
      subheader.style.fontSize = '14px';
      subheader.style.color = '#555';
      subheader.style.marginBottom = '20px';
      
      // Create form
      const form = document.createElement('form');
      form.id = 'feedback-form';
      form.style.display = 'flex';
      form.style.flexDirection = 'column';
      form.style.alignItems = 'stretch';
      form.style.width = '100%';
      
      // Create email field (without label)
      const emailInput = document.createElement('input');
      emailInput.type = 'email';
      emailInput.id = 'feedback-email';
      emailInput.placeholder = 'email@example.com';
      emailInput.style.width = '100%';
      emailInput.style.padding = '10px';
      emailInput.style.marginBottom = '15px';
      emailInput.style.borderRadius = '5px';
      emailInput.style.border = '1px solid #ccc';
      emailInput.style.boxSizing = 'border-box';
      
      // Create comment field (without label)
      const commentInput = document.createElement('textarea');
      commentInput.id = 'feedback-comment';
      commentInput.placeholder = 'Tell us what you think about Combo Meal or report any bugs!';
      commentInput.style.width = '100%';
      commentInput.style.padding = '10px';
      commentInput.style.marginBottom = '5px'; // Reduced from 15px to make room for note
      commentInput.style.borderRadius = '5px';
      commentInput.style.border = '1px solid #ccc';
      commentInput.style.minHeight = '120px';
      commentInput.style.boxSizing = 'border-box';
      commentInput.required = true;
      
      // Create note under comment box
      const commentNote = document.createElement('p');
      commentNote.innerText = 'If you give us your email, we may hit you up 🍴';
      commentNote.style.fontSize = '12px';
      commentNote.style.color = '#888';
      commentNote.style.margin = '0 0 15px 0';
      commentNote.style.textAlign = 'left';
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between';
      buttonContainer.style.marginTop = '10px';
      
      // Create submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.innerText = 'Send Feedback';
      submitButton.style.backgroundColor = '#778F5D'; // Avocado green
      submitButton.style.color = 'white';
      submitButton.style.border = 'none';
      submitButton.style.padding = '10px 20px';
      submitButton.style.borderRadius = '5px';
      submitButton.style.cursor = 'pointer';
      submitButton.style.fontWeight = 'bold';
      submitButton.style.flex = '1';
      submitButton.style.marginRight = '10px';
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.innerText = 'Close';
      closeButton.style.backgroundColor = '#f5f5f5';
      closeButton.style.color = '#333';
      closeButton.style.border = '1px solid #ddd';
      closeButton.style.padding = '10px 20px';
      closeButton.style.borderRadius = '5px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.flex = '1';
      
      // Add event listener to close modal
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling
        // Reset modal active flag
        if (typeof window.modalActive !== 'undefined') {
          window.modalActive = false;
          console.log('Modal active flag reset (close button)');
        } else if (typeof modalActive !== 'undefined') {
          modalActive = false;
          console.log('Modal active flag reset (close button)');
        }
        document.body.removeChild(modal);
      });
      
      // Add event listener for form submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling
        
        const email = emailInput.value.trim();
        const comment = commentInput.value.trim();
        
        if (comment) {
          console.log('Feedback submitted:', { email, comment });
          
          // Get the current recipe name
          let recipeName = "Unknown Recipe";
          
          // Try getting recipe name from final_combination
          if (typeof final_combination !== 'undefined' && final_combination && final_combination.name) {
            recipeName = final_combination.name;
          } 
          // Then try getting it from recipe_data
          else if (typeof recipe_data !== 'undefined' && recipe_data && recipe_data.name) {
            recipeName = recipe_data.name;
          }
          
          try {
            // Submit to Supabase SayHi table
            const { data, error } = await supabase
              .from('SayHi')
              .insert([
                { 
                  email_hi: email, 
                  comment_hi: comment,
                  recipe_hi: recipeName,
                  created_at: new Date().toISOString()
                }
              ]);
            
            if (error) {
              console.error('Error submitting feedback to Supabase:', error);
            } else {
              console.log('Feedback successfully saved to Supabase:', data);
            }
          } catch (submitError) {
            console.error('Exception when submitting feedback:', submitError);
          }
          
          // Show thank you message
          content.innerHTML = '';
          
          const thankYouHeader = document.createElement('h3');
          thankYouHeader.innerText = 'Thank You!';
          thankYouHeader.style.color = '#778F5D';
          thankYouHeader.style.marginTop = '0';
          
          const thankYouMessage = document.createElement('p');
          thankYouMessage.innerText = 'Your feedback has been received. We appreciate your input!';
          thankYouMessage.style.marginBottom = '20px';
          
          const okButton = document.createElement('button');
          okButton.innerText = 'OK';
          okButton.style.backgroundColor = '#778F5D';
          okButton.style.color = 'white';
          okButton.style.border = 'none';
          okButton.style.padding = '10px 20px';
          okButton.style.borderRadius = '5px';
          okButton.style.cursor = 'pointer';
          okButton.style.fontWeight = 'bold';
          
          okButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling
            // Reset modal active flag
            if (typeof window.modalActive !== 'undefined') {
              window.modalActive = false;
              console.log('Modal active flag reset (ok button)');
            } else if (typeof modalActive !== 'undefined') {
              modalActive = false;
              console.log('Modal active flag reset (ok button)');
            }
            document.body.removeChild(modal);
          });
          
          content.appendChild(thankYouHeader);
          content.appendChild(thankYouMessage);
          content.appendChild(okButton);
          
          // Automatically close after 3 seconds
          setTimeout(() => {
            if (document.body.contains(modal)) {
              // Reset modal active flag
              if (typeof window.modalActive !== 'undefined') {
                window.modalActive = false;
                console.log('Modal active flag reset (auto timeout)');
              } else if (typeof modalActive !== 'undefined') {
                modalActive = false;
                console.log('Modal active flag reset (auto timeout)');
              }
              document.body.removeChild(modal);
            }
          }, 3000);
        }
      });
      
      // Add elements to form
      form.appendChild(emailInput);
      form.appendChild(commentInput);
      form.appendChild(commentNote);
      buttonContainer.appendChild(submitButton);
      buttonContainer.appendChild(closeButton);
      form.appendChild(buttonContainer);
      
      // Assemble modal
      content.appendChild(header);
      content.appendChild(subheader);
      content.appendChild(form);
      modal.appendChild(content);
      
      // Add to document
      document.body.appendChild(modal);
      
      // Focus the comment field
      setTimeout(() => {
        commentInput.focus();
      }, 100);
      
    } catch (error) {
      console.error("Error showing feedback modal:", error);
    }
  }

  // Dedicated function to handle letter score interactions
  function handleLetterScoreInteraction(x, y) {
    // Extended debug logging to help diagnose issues
    console.log("handleLetterScoreInteraction called with coordinates:", x, y);
    console.log("Current game state:", gameState, "gameWon:", gameWon);
    
    // Only process in win state
    if (!gameWon) {
      console.log("Letter score interaction ignored - game not in win state");
      return false;
    }
    
    // Defensive check: if score coordinates haven't been initialized yet,
    // perhaps because drawWinScreen hasn't run, then can't handle interaction
    if (typeof scoreX === 'undefined' || typeof scoreY === 'undefined' || 
        typeof scoreWidth === 'undefined' || typeof scoreHeight === 'undefined') {
      console.error("Letter score interaction failed - score coordinates not initialized");
      console.log("Score variables:", {scoreX, scoreY, scoreWidth, scoreHeight});
      return false;
    }
    
    // More forgiving coordinate check - add a bit of padding for easier clicking
    const padding = 10; // 10px of extra clickable area
    const isOverLetterScore = (
      x > scoreX - scoreWidth/2 - padding && x < scoreX + scoreWidth/2 + padding && 
      y > scoreY - scoreHeight/2 - padding && y < scoreY + scoreHeight/2 + padding
    );
    
    console.log("Letter score interaction check:", 
      "x:", x, "y:", y,
      "scoreX:", scoreX, "scoreY:", scoreY, 
      "scoreWidth:", scoreWidth, "scoreHeight:", scoreHeight,
      "isOverLetterScore:", isOverLetterScore
    );
    
    // If coordinates are within letter score, trigger share action
    if (isOverLetterScore) {
      console.log("Letter score interaction handled - directly calling shareScore");
      
      // Directly call shareScore and catch any errors
      try {
        shareScore();
        console.log("shareScore executed successfully");
      } catch(e) {
        console.error("Error in shareScore:", e);
      }
      
      return true; // Interaction was handled
    }
    
    return false; // Interaction was not for letter score
  }
  
  // Function to handle clicks on the Say hi link in the win screen
  function handleSayHiLinkInteraction(x, y) {
    // Only check if the variables are defined
    if (typeof sayHiLinkX === 'undefined' || typeof sayHiLinkY === 'undefined' || 
        typeof sayHiLinkWidth === 'undefined' || typeof sayHiLinkHeight === 'undefined') {
      return false;
    }
    
    // Check if click is within the Say hi link area
    const isOverSayHiLink = (
      x > sayHiLinkX - sayHiLinkWidth/2 && 
      x < sayHiLinkX + sayHiLinkWidth/2 && 
      y > sayHiLinkY - sayHiLinkHeight/2 && 
      y < sayHiLinkY + sayHiLinkHeight/2
    );
    
    if (isOverSayHiLink) {
      console.log("Say hi link clicked, showing feedback modal");
      showFeedbackModal();
      return true;
    }
    
    return false;
  }


  // Function to load a random recipe
  async function loadRandomRecipe() {
    try {
      console.log("Loading random recipe...");
      const recipeData = await fetchRandomRecipe();
      
      if (!recipeData) {
        console.error("No random recipe data found");
        isLoadingRandomRecipe = false;
        return;
      }
      
      // Update game variables with recipe data
      intermediate_combinations = recipeData.intermediateCombinations;
      final_combination = recipeData.finalCombination;
      easter_eggs = recipeData.easterEggs;
      ingredients = recipeData.baseIngredients;
      recipeUrl = recipeData.recipeUrl;
      recipeDescription = recipeData.description || "A delicious recipe that's sure to please everyone at the table!";
      
      // Get author information from the database if it exists
      recipeAuthor = recipeData.author || "";
      
      // Load the recipe image if URL is provided
      if (recipeData.imgUrl) {
        console.log("Loading random recipe image from URL:", recipeData.imgUrl);
        isLoadingImage = true;
        
        // Use loadImage with success and error callbacks
        loadImage(
          recipeData.imgUrl,
          // Success callback
          (img) => {
            console.log("Random recipe image loaded successfully");
            recipeImage = img;
            isLoadingImage = false;
          },
          // Error callback
          (err) => {
            console.error("Error loading random recipe image:", err);
            recipeImage = null; // Set to null to indicate loading failed
            isLoadingImage = false;
          }
        );
      } else {
        // Clear previous image if no URL is provided
        recipeImage = null;
      }
      
      // Reset game state
      gameStarted = false;
      gameWon = false;
      moveHistory = [];
      hintCount = 0;
      vessels = [];
      animations = [];
      
      console.log("Random recipe loaded successfully");
    } catch (error) {
      console.error("Error loading random recipe:", error);
      isLoadingRandomRecipe = false;
      isLoadingImage = false;
    }
  }
  
  
  