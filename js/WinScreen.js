function showWinScreen() {
  gameWon = true;
  triggerHapticFeedback('completion');
  
  // APlasker - Complete analytics session with win condition
  if (typeof completeGameSession === 'function') {
    completeGameSession('completed');
  }
  
  // APlasker - Record streak completion if StreakSystem is available
  if (typeof StreakSystem !== 'undefined' && typeof recipe !== 'undefined' && recipe && recipe.day_number) {
    // Calculate the letter grade first (this logic is duplicated from drawWinScreen but needed here)
    let blackMoves = 0;
    for (let move of moveHistory) {
      if (move === 'black' || move === '#333333') {
        blackMoves++;
      }
    }
    
    let calculatedGrade;
    if (blackMoves === 0) {
      calculatedGrade = "A";
    } else if (blackMoves >= 1 && blackMoves <= 2) {
      calculatedGrade = "B";
    } else if (blackMoves >= 3 && blackMoves <= 4) {
      calculatedGrade = "C";
    } else {
      calculatedGrade = "X";
    }
    
    // Get game time in seconds
    const timeInSeconds = typeof gameTimer !== 'undefined' ? gameTimer : 0;
    
    // Record the completion in the streak system
    const streakUpdated = StreakSystem.recordCompletion(recipe.day_number, calculatedGrade, timeInSeconds);
    
    if (streakUpdated) {
      console.log('Streak updated for recipe day', recipe.day_number, 'with grade', calculatedGrade);
    }
  }
}

function drawWinScreen() {
  // Check if we should render the win screen
  if (!showWinScreen) return;
  
  // Add special case for tutorial win screen - APlasker
  if (isTutorialMode) {
    drawTutorialWinScreen();
    return;
  }
  
  // Helper function to draw a stat line with label, underline, and value
  function drawStatLine(label, value, x, y, width, labelSize, valueSize) {
    // Calculate line heights and spacing
    const lineHeight = valueSize * 2.5; // Height of the entire line
    const underlineY = y + valueSize * 1.0; // Position underline below label
    const valueY = underlineY + valueSize * 0.9; // Position value centered under underline
    
    // Draw label (smaller, normal weight)
    textAlign(LEFT, TOP);
    textSize(labelSize);
    textStyle(NORMAL);
    fill(0);
    text(label, x, y);
    
    // Draw underline
    stroke(0);
    strokeWeight(1);
    const underlineWidth = width * 0.8; // 80% of available width
    const underlineStartX = x + label.length * (labelSize * 0.5); // Start after label text
    line(underlineStartX, underlineY, x + width, underlineY);
    
    // Draw value (larger, bold)
    textAlign(CENTER, CENTER);
    textSize(valueSize);
    textStyle(BOLD);
    // Center value under the underline
    const valueX = underlineStartX + (x + width - underlineStartX) / 2;
    text(value, valueX, valueY);
    
    return lineHeight; // Return the height used by this line
  }
  
  // Calculate the play area dimensions and position (if not already set)
  if (!playAreaWidth) {
    calculatePlayAreaDimensions();
  }
  
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
  const cardHeight = playAreaHeight * 0.45; // Updated to 45% of screen height
  
  // Position card based on adjusted spacing - header at 6%, recipe card at 10%
  const cardX = playAreaX + playAreaWidth / 2;
  let cardY = playAreaY + playAreaHeight * 0.10 + cardHeight / 2;
  
  // RESET TEXT ALIGNMENT FOR REWARD MESSAGE - Ensure consistent centered text
  textAlign(CENTER, CENTER);
  
  // Draw reward message with multicolor treatment (like COMBO MEAL)
  const rewardMessage = "WOW DELICIOUS!";
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
        letterColor = '#cfc23f'; // Changed from COLORS.primary to mustard yellow to match COMBO MEAL
        break;
      case 1:
        letterColor = '#f7dc30'; // Changed from COLORS.peach to bright yellow to match COMBO MEAL
        break;
      case 2:
        letterColor = COLORS.secondary; // Pink
        break;
    }
    
    // Calculate letter position with bounce effect
    // Even and odd letters bounce in opposite directions for playful effect
    let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
    let letterX = x + letterWidths[i]/2;
    let letterY = playAreaY + playAreaHeight * 0.06 + offsetY;
    
    // SOLID OUTLINE APPROACH - Create smooth solid outlines with multiple text copies - Updated to match COMBO MEAL title
    push(); // Save drawing state
    
    // Set text properties for all layers
    textAlign(CENTER, CENTER);
    textSize(rewardMessageSize);
    
    // Calculate outline sizes
    const outerSize = 6;  // Outer black outline thickness
    const middleSize = 4; // Middle peach outline thickness
    const innerSize = 2;  // Inner black outline thickness
    
    // 1. Draw outer black outline (largest) using multiple offset copies
    fill('black');
    // Create a circular pattern of offsets for smooth round outline
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let offsetX = cos(angle) * outerSize;
      let offsetY = sin(angle) * outerSize;
      text(rewardMessage[i], letterX + offsetX, letterY + offsetY);
    }
    
    // 2. Draw middle peach layer using multiple offset copies
    fill(COLORS.peach);
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let offsetX = cos(angle) * middleSize;
      let offsetY = sin(angle) * middleSize;
      text(rewardMessage[i], letterX + offsetX, letterY + offsetY);
    }
    
    // 3. Draw inner black layer using multiple offset copies
    fill('black');
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let offsetX = cos(angle) * innerSize;
      let offsetY = sin(angle) * innerSize;
      text(rewardMessage[i], letterX + offsetX, letterY + offsetY);
    }
    
    // 4. Draw the final colored letter in the center
    fill(letterColor);
    text(rewardMessage[i], letterX, letterY);
    
    pop(); // Restore drawing state
    
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
  
  // Check if mouse is over the recipe card area - Added by APlasker to fix recipe link functionality
  isMouseOverCard = mouseX > cardX - cardWidth/2 && mouseX < cardX + cardWidth/2 && 
                   mouseY > cardY - cardHeight/2 && mouseY < cardY + cardHeight/2;
  
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
  
  // Draw flowers in the corners of the recipe card - 1% of card width, min 2px
  const flowerSize = max(cardWidth * 0.01, 2); // Updated to 1% of card width, min 2px
  const cornerOffset = cardWidth * 0.04; // Updated to 4% of card width
  
  // Draw flowers in each corner
  drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary); // Top-left
  drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.peach); // Top-right (was COLORS.secondary)
  drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.peach); // Bottom-left
  drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
  
  // RESET TEXT ALIGNMENT FOR RECIPE NAME - Ensure centered text
  textAlign(CENTER, CENTER);
  
  // Draw recipe name with scaling to fit within 95% of card width - increased max font size to 32px
  const recipeNameSize = min(max(playAreaWidth * 0.06, 18), 32); // Updated max size to 32px
  const maxTitleWidth = cardWidth * 0.95; // Updated to 95% of card width
  
  // Measure the title width at the default font size
  textSize(recipeNameSize);
  fill(COLORS.secondary);
  textStyle(BOLD);
  
  // Calculate how wide the title would be at the default size
  const titleWidth = textWidth(final_combination.name);
  
  // Calculate a scaling factor if the title exceeds max width
  let scaleFactor = 1.0;
  if (titleWidth > maxTitleWidth) {
    scaleFactor = maxTitleWidth / titleWidth;
    
    // Apply the calculated scale factor to the font size
    const scaledFontSize = recipeNameSize * scaleFactor;
    textSize(scaledFontSize);
  }
  
  // Now draw the title with appropriate scaling
  text(final_combination.name, cardX, cardY - cardHeight/2 + cardHeight * 0.09); // Adjusted to 9% of card height from top
  textStyle(NORMAL);
  
  // RESET TEXT ALIGNMENT FOR AUTHOR - Ensure centered text
  textAlign(CENTER, CENTER);
  
  // Add author information if it exists
  if (recipeAuthor && recipeAuthor.trim() !== "") {
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#333333');
    textStyle(BOLD); // Make author text bold
    text(`By ${recipeAuthor}`, cardX, cardY - cardHeight/2 + cardHeight * 0.16); // Adjusted to 16% of card height from top
    textStyle(NORMAL); // Reset text style
  }
  
  // Resize image dimensions for responsive layout
  const imageWidth = cardWidth * 0.60;  // Updated to 60% of card width, no max size limit
  const imageHeight = imageWidth; // Keep square
  
  // Update image position based on new metrics - 35% from left edge, 56% from top
  let imageX = cardX - cardWidth/2 + cardWidth * 0.35; // 35% of card width from left edge
  let imageY = cardY - cardHeight/2 + cardHeight * 0.56; // Updated to 56% of card height from top
  
  // Isolate drawing context for the image section
  push();
  // Set modes specifically for image rendering
  rectMode(CENTER);
  imageMode(CENTER);
  // RESET TEXT ALIGNMENT FOR IMAGE PLACEHOLDER - Ensure centered text
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
  
  // Draw recipe description - updated position and width
  // Move description right by using 67% of card width from left (changed from 66%)
  const descriptionX = cardX - cardWidth/2 + cardWidth * 0.67; // Changed from 66% to 67% of card width from left
  const descriptionWidth = cardWidth * 0.3; // 30% of card width
  
  // Update description Y position - 25% card height from top
  const descriptionY = cardY - cardHeight/2 + cardHeight * 0.25; // 25% of card height from top
  
  // Isolate text context for description
  push();
  fill(0);
  // RESET TEXT ALIGNMENT FOR DESCRIPTION - Ensure left-aligned text
  textAlign(LEFT, TOP);
  textSize(min(max(playAreaWidth * 0.03, 11), 14)); // Increased font size to 3% (min 11px, max 14px)
  fill('#666');
  
  // Limit description height to 60% of card height (increased from 33%)
  const maxDescriptionHeight = cardHeight * 0.60;
  
  text(recipeDescription, descriptionX, descriptionY, descriptionWidth, maxDescriptionHeight); // Added max height constraint
  pop(); // End description text context
  
  // Add "Make this recipe for real!" text at the bottom of the card - updated position and text
  push(); // Isolate text context for Recipe Details
  // Position at 67% of card width from left (changed from 66%), 15% of card height from bottom
  const recipeDetailsX = cardX - cardWidth/2 + cardWidth * 0.67; // Changed from 66% to 67% from left
  const recipeDetailsY = cardY + cardHeight/2 - cardHeight * 0.15; // 15% from bottom
  
  textAlign(LEFT, CENTER);
  textSize(min(max(playAreaWidth * 0.035, 12), 16)); // Increased font size to 3.5% (min 12px, max 16px)
  textStyle(BOLD); // Make the text bold
  if (isMouseOverCard) {
    fill(COLORS.primary); // Green text when hovered
  } else {
    fill('#666'); // Gray text normally
  }
  text("Make this recipe for real! →", recipeDetailsX, recipeDetailsY, cardWidth * 0.3); // Decreased width from 32% to 30% of card width
  textStyle(NORMAL); // Reset text style
  pop(); // End Recipe Details context
  
  // ===== SCORE SECTION =====
  
  // RESET TEXT ALIGNMENT FOR SCORE SECTION - Ensure centered text
  textAlign(CENTER, CENTER);
  
  // Calculate responsive position for score section - updated to 60% of screen height
  const scoreCardPositionY = playAreaY + playAreaHeight * 0.60; // Changed back to 0.60 from 0.65
  
  // Calculate score card size based on play area width - updated dimensions
  scoreWidth = min(playAreaWidth, 600); // Same max width as recipe card
  scoreHeight = playAreaHeight * 0.28; // 28% of play area height
  
  // Position score card
  scoreX = playAreaX + playAreaWidth/2; // Centered in the play area
  scoreY = scoreCardPositionY + scoreHeight/2; // Adjusted for vertical centering
  
  // Draw letter score with drop shadow
  push(); // Isolate drawing context for the score card
  rectMode(CENTER); // Explicitly set CENTER mode for score card
  
  // Shadow
  fill(0, 0, 0, 30);
  noStroke();
  rect(scoreX + 5, scoreY + 5, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8)); // Updated to 2% of score width, min 8px
  
  // Paper
  fill(255);
  stroke(220);
  strokeWeight(1);
  rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8)); // Updated to 2% of score width, min 8px
  
  // Check if mouse is over the letter score area
  isMouseOverLetterScore = mouseX > scoreX - scoreWidth/2 && mouseX < scoreX + scoreWidth/2 && 
                         mouseY > scoreY - scoreHeight/2 && mouseY < scoreY + scoreHeight/2;
  
  // Highlight the letter score area when hovered, similar to recipe card
  if (isMouseOverLetterScore) {
    // Add a subtle highlight effect
    noFill();
    stroke(COLORS.primary); // Green highlight
    strokeWeight(3);
    rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8)); // Updated to 2% of score width, min 8px
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
    letterColor = '#f7dc30'; // Yellow - updated from COLORS.tertiary
  } else { // blackMoves >= 5
    letterGrade = "X";
    letterColor = COLORS.secondary; // Red from vessels
  }
  
  // Updated circle position and dimensions
  // Position: Centered horizontally at 28% from left edge, 55% from top of score card
  const circleX = scoreX - scoreWidth/2 + scoreWidth * 0.28;
  const circleY = scoreY - scoreHeight/2 + scoreHeight * 0.55; // Updated to 55% from top of score card
  
  // Height: 80% of score height (updated from 85%)
  const circleSize = scoreHeight * 0.8;
  
  // Create a copy of the letter color with 30% opacity
  let circleBgColor = color(red(letterColor), green(letterColor), blue(letterColor), 76); // 76 is 30% of 255
  
  // Draw the circle with the same color as the letter but with 30% opacity
  noStroke();
  fill(circleBgColor);
  circle(circleX, circleY, circleSize);
  
  // Add "COMBO MEAL SCORE" header above the letter grade - positioned at 8% of score height from top
  textAlign(CENTER, CENTER);
  // Calculate font size that ensures text fits within 90% of score card width
  let maxComboMealSize = min(max(playAreaWidth * 0.04, 14), 18);
  // Temporarily set text size to check if it fits
  textSize(maxComboMealSize);
  
  // Apply kerning to "COMBO MEAL SCORE" text
  const comboMealText = "COMBO MEAL SCORE";
  let comboMealWidth = 0;
  let comboMealLetterWidths = [];
  
  // Calculate letter widths
  for (let i = 0; i < comboMealText.length; i++) {
    let letterWidth = textWidth(comboMealText[i]);
    comboMealLetterWidths.push(letterWidth);
    comboMealWidth += letterWidth;
  }
  
  // Increase kerning by 70%
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
  
  // Position at 8% of score height from top
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
  
  // Draw letter grade - with 95% of circle size (updated from 85%)
  // Position 10% lower in Score card height than center of the circle background
  const letterGradeY = circleY + scoreHeight * 0.1; // 10% lower than circle center
  
  textAlign(CENTER, CENTER);
  textSize(circleSize * 1.1); // Updated from 0.95 to 1.1 for larger display
  fill(letterColor);
  textStyle(NORMAL);
  text(letterGrade, circleX, letterGradeY); // Updated position to be 10% lower than circle
  
  // ------------------------------
  // NEW SECTION: SCORE STATISTICS
  // ------------------------------
  
  // Position stats block on the right side of the score card
  const statsX = scoreX - scoreWidth/2 + scoreWidth * 0.55; // 55% from left edge
  const statsY = scoreY - scoreHeight/2 + scoreHeight * 0.30; // 30% from top (changed from 37% to move stats up)
  const statsWidth = scoreWidth * 0.38; // 38% of score card width
  
  // Calculate font sizes for stats
  const labelSize = min(max(playAreaWidth * 0.025, 10), 14); // Increased from 0.02/9/12 to 0.025/10/14
  const valueSize = min(max(playAreaWidth * 0.03, 12), 16); // Increased from 0.025/11/14 to 0.03/12/16
  
  // Get recipe information
  let recipeNumber = "###";
  let formattedDate = "##/##/##";
  
  // Extract recipe number and date from recipe data
  if (typeof recipe !== 'undefined' && recipe) {
    if (recipe.day_number) recipeNumber = recipe.day_number;
    
    // Format the date if available
    if (recipe.date) {
      try {
        const dateParts = recipe.date.split('-');
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0].substring(2)}`;
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }
  }
  
  // Format recipe value with recipe number and date
  const recipeValue = `${recipeNumber} (${formattedDate})`;
  
  // Draw the three stat lines
  let lineY = statsY;
  
  // Recipe number line
  const recipeLineHeight = drawStatLine("Recipe No.", recipeValue, statsX, lineY, statsWidth, labelSize, valueSize);
  lineY += recipeLineHeight;
  
  // Mistakes line
  const mistakesLineHeight = drawStatLine("Mistakes:", blackMoves.toString(), statsX, lineY, statsWidth, labelSize, valueSize);
  lineY += mistakesLineHeight;
  
  // Hints used line
  const hintsLineHeight = drawStatLine("Hints Used:", hintCount.toString(), statsX, lineY, statsWidth, labelSize, valueSize);
  lineY += hintsLineHeight;
  
  // Time line - APlasker
  const timeValue = typeof gameTimer !== 'undefined' ? formatTime(gameTimer) : "00:00";
  const timeLineHeight = drawStatLine("Time:", timeValue, statsX, lineY, statsWidth, labelSize, valueSize);
  lineY += timeLineHeight;
  
  // Streak line - APlasker
  const streakValue = typeof StreakSystem !== 'undefined' ? StreakSystem.getStreakDisplayText() : "0";
  const streakLineHeight = drawStatLine("Streak:", streakValue, statsX, lineY, statsWidth, labelSize, valueSize);
  lineY += streakLineHeight;
  
  // Center Share Score text under the stats block
  const shareScoreY = lineY + valueSize * 1.5; // Add some space after the last stat line
  
  // Draw Share Score link
  textAlign(CENTER, CENTER);
  textSize(min(max(playAreaWidth * 0.03, 10), 14));
  if (isMouseOverLetterScore) {
    fill(COLORS.primary); // Green text when hovered
  } else {
    fill('#666'); // Gray text normally
  }
  // Center it under the stats block
  text("Share Score →", statsX + statsWidth/2, shareScoreY);
  
  // Check if Easter Egg was found
  let eggFound = moveHistory.some(move => 
    typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
  );
  
  // Draw sunny-side-up egg indicator if an Easter egg was found
  if (eggFound) {
    push();
    // Position the egg in the top left corner of the letter grade
    const eggSize = circleSize * 0.25; // 25% of circle size
    const eggX = circleX - circleSize * 0.3; // Updated to use circleX
    const eggY = circleY - circleSize * 0.3;
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
    
    // Top right corner - two stars (updated positions to use circleX and circleY)
    drawStarSticker(circleX + circleSize * 0.35, circleY - circleSize * 0.35, 'large');
    drawStarSticker(circleX + circleSize * 0.5, circleY - circleSize * 0.2, 'small');
    
    // Bottom left corner - two stars (updated positions to use circleX and circleY)
    drawStarSticker(circleX - circleSize * 0.35, circleY + circleSize * 0.35, 'large');
    drawStarSticker(circleX - circleSize * 0.5, circleY + circleSize * 0.2, 'small');
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
    
    // HINT INDICATORS TEMPORARILY DISABLED
    /*
    // Draw hint indicators based on hint count (updated positions to use circleX and circleY)
    if (hintCount >= 1) {
      // First hint indicator - bottom right
      drawHintIndicator(circleX + circleSize * 0.4, circleY + circleSize * 0.4, 1);
    }
    
    if (hintCount >= 2) {
      // Second hint indicator - top right
      drawHintIndicator(circleX + circleSize * 0.4, circleY - circleSize * 0.4, 1);
    }
    
    if (hintCount >= 3) {
      // Third hint indicator - with minimal overlap
      drawHintIndicator(circleX + circleSize * 0.4 + 25, circleY + circleSize * 0.4 - 25, 1);
    }
    */
  }
  
  textStyle(NORMAL);
  
  // Add "Share Score" text at the bottom of the letter score area
  // REMOVED AS REQUESTED - Removing "Share Score" language at the bottom
  /*
  textAlign(CENTER, CENTER);
  textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Same size as before
  if (isMouseOverLetterScore) {
    fill(COLORS.primary); // Green text when hovered
  } else {
    fill('#666'); // Gray text normally
  }
  text("Share Score →", scoreX, scoreY + scoreHeight/2 - scoreHeight * 0.07); // 7% of score height from bottom
  */
  
  // Helper function to draw a stat line with label and value
  function drawStatLine(label, value, x, y, width, labelSize, valueSize) {
    push();
    
    // Calculate line height and spacing
    const lineHeight = valueSize * 1.2;
    const underlineWidth = width * 0.7; // 70% of provided width
    
    // Draw label (smaller, normal weight)
    textAlign(LEFT, CENTER);
    textSize(labelSize);
    textStyle(NORMAL);
    fill('#333');
    text(label, x, y);
    
    // Draw underline
    const labelWidth = textWidth(label) + 5; // Add a small space after the label
    const underlineY = y + lineHeight * 0.2; // Slightly below the text baseline
    stroke('#666');
    strokeWeight(1);
    line(x + labelWidth, underlineY, x + labelWidth + underlineWidth, underlineY);
    
    // Draw value (larger, bold)
    textAlign(CENTER, CENTER);
    textSize(valueSize);
    textStyle(BOLD);
    fill('#333');
    // Position value in the center of the underline
    const valueX = x + labelWidth + underlineWidth / 2;
    text(value, valueX, y);
    
    // Reset text style
    textStyle(NORMAL);
    pop();
    
    // Return height of line for positioning subsequent elements
    return lineHeight * 1.5; // Add some extra space between lines
  }
  
  // Add "NEW RECIPE DAILY" text at the bottom - updated to 94% from bottom of screen
  textAlign(CENTER, CENTER);
  textSize(min(max(playAreaWidth * 0.04, 14), 18)); // Same size as before
  fill('#333');
  textStyle(BOLD);
  text("NEW RECIPE DAILY – COME BACK SOON!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.94);
  textStyle(NORMAL);
  
  // Add "Say hi!" link text below the main text - updated to 97.5% from bottom of screen
  textSize(min(max(playAreaWidth * 0.025, 10), 14)); // Same size as before
  fill(COLORS.primary); // Green color for the link
  text("Say hi!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.975); // Updated to 97.5%
  
  // Store position and dimensions for hit detection
  sayHiLinkX = playAreaX + playAreaWidth/2;
  sayHiLinkY = playAreaY + playAreaHeight * 0.975; // Updated to 97.5%
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

// New function to draw the tutorial-specific win screen - APlasker
function drawTutorialWinScreen() {
  // Isolate drawing context for the entire win screen
  push();
  
  // Calculate the play area dimensions and position (if not already set)
  if (!playAreaWidth) {
    calculatePlayAreaDimensions();
  }
  
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
  const cardHeight = playAreaHeight * 0.45; // Updated to 45% of screen height
  
  // Position card based on adjusted spacing - header at 6%, recipe card at 10%
  const cardX = playAreaX + playAreaWidth / 2;
  let cardY = playAreaY + playAreaHeight * 0.10 + cardHeight / 2;
  
  // RESET TEXT ALIGNMENT FOR REWARD MESSAGE - Ensure consistent centered text
  textAlign(CENTER, CENTER);
  
  // Draw reward message with multicolor treatment (like COMBO MEAL)
  const rewardMessage = "WOW DELICIOUS!";
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
        letterColor = '#cfc23f'; // Changed from COLORS.primary to mustard yellow to match COMBO MEAL
        break;
      case 1:
        letterColor = '#f7dc30'; // Changed from COLORS.peach to bright yellow to match COMBO MEAL
        break;
      case 2:
        letterColor = COLORS.secondary; // Pink
        break;
    }
    
    // Calculate letter position with bounce effect
    // Even and odd letters bounce in opposite directions for playful effect
    let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
    let letterX = x + letterWidths[i]/2;
    let letterY = playAreaY + playAreaHeight * 0.06 + offsetY;
    
    // SOLID OUTLINE APPROACH - Create smooth solid outlines with multiple text copies - Updated to match COMBO MEAL title
    push(); // Save drawing state
    
    // Set text properties for all layers
    textAlign(CENTER, CENTER);
    textSize(rewardMessageSize);
    
    // Calculate outline sizes
    const outerSize = 6;  // Outer black outline thickness
    const middleSize = 4; // Middle peach outline thickness
    const innerSize = 2;  // Inner black outline thickness
    
    // 1. Draw outer black outline (largest) using multiple offset copies
    fill('black');
    // Create a circular pattern of offsets for smooth round outline
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let offsetX = cos(angle) * outerSize;
      let offsetY = sin(angle) * outerSize;
      text(rewardMessage[i], letterX + offsetX, letterY + offsetY);
    }
    
    // 2. Draw middle peach layer using multiple offset copies
    fill(COLORS.peach);
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let offsetX = cos(angle) * middleSize;
      let offsetY = sin(angle) * middleSize;
      text(rewardMessage[i], letterX + offsetX, letterY + offsetY);
    }
    
    // 3. Draw inner black layer using multiple offset copies
    fill('black');
    for (let angle = 0; angle < TWO_PI; angle += PI/8) {
      let offsetX = cos(angle) * innerSize;
      let offsetY = sin(angle) * innerSize;
      text(rewardMessage[i], letterX + offsetX, letterY + offsetY);
    }
    
    // 4. Draw the final colored letter in the center
    fill(letterColor);
    text(rewardMessage[i], letterX, letterY);
    
    pop(); // Restore drawing state
    
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
  
  // Check if mouse is over the recipe card area - Added by APlasker to fix recipe link functionality
  isMouseOverCard = mouseX > cardX - cardWidth/2 && mouseX < cardX + cardWidth/2 && 
                   mouseY > cardY - cardHeight/2 && mouseY < cardY + cardHeight/2;
  
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
  
  // Draw flowers in the corners of the recipe card - 1% of card width, min 2px
  const flowerSize = max(cardWidth * 0.01, 2); // Updated to 1% of card width, min 2px
  const cornerOffset = cardWidth * 0.04; // Updated to 4% of card width
  
  // Draw flowers in each corner
  drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary); // Top-left
  drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.peach); // Top-right (was COLORS.secondary)
  drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.peach); // Bottom-left
  drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
  
  // RESET TEXT ALIGNMENT FOR RECIPE NAME - Ensure centered text
  textAlign(CENTER, CENTER);
  
  // Draw recipe name with scaling to fit within 95% of card width - increased max font size to 32px
  const recipeNameSize = min(max(playAreaWidth * 0.06, 18), 32); // Updated max size to 32px
  const maxTitleWidth = cardWidth * 0.95; // Updated to 95% of card width
  
  // Measure the title width at the default font size
  textSize(recipeNameSize);
  fill(COLORS.secondary);
  textStyle(BOLD);
  
  // Calculate how wide the title would be at the default size
  const titleWidth = textWidth(final_combination.name);
  
  // Calculate a scaling factor if the title exceeds max width
  let scaleFactor = 1.0;
  if (titleWidth > maxTitleWidth) {
    scaleFactor = maxTitleWidth / titleWidth;
    
    // Apply the calculated scale factor to the font size
    const scaledFontSize = recipeNameSize * scaleFactor;
    textSize(scaledFontSize);
  }
  
  // Now draw the title with appropriate scaling
  text(final_combination.name, cardX, cardY - cardHeight/2 + cardHeight * 0.09); // Adjusted to 9% of card height from top
  textStyle(NORMAL);
  
  // RESET TEXT ALIGNMENT FOR AUTHOR - Ensure centered text
  textAlign(CENTER, CENTER);
  
  // Add author information if it exists
  if (recipeAuthor && recipeAuthor.trim() !== "") {
    textSize(min(max(playAreaWidth * 0.03, 10), 14)); // Changed from width to playAreaWidth with adjusted coefficient
    fill('#333333');
    textStyle(BOLD); // Make author text bold
    text(`By ${recipeAuthor}`, cardX, cardY - cardHeight/2 + cardHeight * 0.16); // Adjusted to 16% of card height from top
    textStyle(NORMAL); // Reset text style
  }
  
  // Resize image dimensions for responsive layout
  const imageWidth = cardWidth * 0.60;  // Updated to 60% of card width, no max size limit
  const imageHeight = imageWidth; // Keep square
  
  // Update image position based on new metrics - 35% from left edge, 56% from top
  let imageX = cardX - cardWidth/2 + cardWidth * 0.35; // 35% of card width from left edge
  let imageY = cardY - cardHeight/2 + cardHeight * 0.56; // Updated to 56% of card height from top
  
  // Isolate drawing context for the image section
  push();
  // Set modes specifically for image rendering
  rectMode(CENTER);
  imageMode(CENTER);
  // RESET TEXT ALIGNMENT FOR IMAGE PLACEHOLDER - Ensure centered text
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
  
  // Draw recipe description - updated position and width
  // Move description right by using 67% of card width from left (changed from 66%)
  const descriptionX = cardX - cardWidth/2 + cardWidth * 0.67; // Changed from 66% to 67% of card width from left
  const descriptionWidth = cardWidth * 0.3; // 30% of card width
  
  // Update description Y position - 25% card height from top
  const descriptionY = cardY - cardHeight/2 + cardHeight * 0.25; // 25% of card height from top
  
  // Isolate text context for description
  push();
  fill(0);
  // RESET TEXT ALIGNMENT FOR DESCRIPTION - Ensure left-aligned text
  textAlign(LEFT, TOP);
  textSize(min(max(playAreaWidth * 0.03, 11), 14)); // Increased font size to 3% (min 11px, max 14px)
  fill('#666');
  
  // Limit description height to 60% of card height (increased from 33%)
  const maxDescriptionHeight = cardHeight * 0.60;
  
  text(recipeDescription, descriptionX, descriptionY, descriptionWidth, maxDescriptionHeight); // Added max height constraint
  pop(); // End description text context
  
  // Add "Make this recipe for real!" text at the bottom of the card - updated position and text
  push(); // Isolate text context for Recipe Details
  // Position at 67% of card width from left (changed from 66%), 15% of card height from bottom
  const recipeDetailsX = cardX - cardWidth/2 + cardWidth * 0.67; // Changed from 66% to 67% from left
  const recipeDetailsY = cardY + cardHeight/2 - cardHeight * 0.15; // 15% from bottom
  
  textAlign(LEFT, CENTER);
  textSize(min(max(playAreaWidth * 0.035, 12), 16)); // Increased font size to 3.5% (min 12px, max 16px)
  textStyle(BOLD); // Make the text bold
  if (isMouseOverCard) {
    fill(COLORS.primary); // Green text when hovered
  } else {
    fill('#666'); // Gray text normally
  }
  text("Make this recipe for real! →", recipeDetailsX, recipeDetailsY, cardWidth * 0.3); // Decreased width from 32% to 30% of card width
  textStyle(NORMAL); // Reset text style
  pop(); // End Recipe Details context
  
  // ===== SCORE SECTION (Tutorial Version) =====
  
  // RESET TEXT ALIGNMENT FOR SCORE SECTION - Ensure centered text
  textAlign(CENTER, CENTER);
  
  // Calculate responsive position for score section - updated to 60% of screen height
  const scoreCardPositionY = playAreaY + playAreaHeight * 0.60; // Changed back to 0.60 from 0.65
  
  // Calculate score card size based on play area width - updated dimensions
  scoreWidth = min(playAreaWidth, 600); // Same max width as recipe card
  scoreHeight = playAreaHeight * 0.28; // 28% of play area height
  
  // Position score card
  scoreX = playAreaX + playAreaWidth/2; // Centered in the play area
  scoreY = scoreCardPositionY + scoreHeight/2; // Adjusted for vertical centering
  
  // Draw score card with drop shadow
  push(); // Isolate drawing context for the score card
  rectMode(CENTER); // Explicitly set CENTER mode for score card
  
  // Shadow
  fill(0, 0, 0, 30);
  noStroke();
  rect(scoreX + 5, scoreY + 5, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8)); // Updated to 2% of score width, min 8px
  
  // Paper
  fill(255);
  stroke(220);
  strokeWeight(1);
  rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8)); // Updated to 2% of score width, min 8px
  
  // Check if mouse is over the score card area
  isMouseOverLetterScore = mouseX > scoreX - scoreWidth/2 && mouseX < scoreX + scoreWidth/2 && 
                         mouseY > scoreY - scoreHeight/2 && mouseY < scoreY + scoreHeight/2;
  
  // Highlight the score card area when hovered
  if (isMouseOverLetterScore) {
    // Add a subtle highlight effect
    noFill();
    stroke(COLORS.primary); // Green highlight
    strokeWeight(3);
    rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8)); // Updated to 2% of score width, min 8px
    
    // Change cursor to hand when hovering
    cursor(HAND);
  }
  
  pop(); // Restore the drawing context
  
  // Draw flowers in the corners of the score card
  const scoreFlowerSize = max(scoreWidth * 0.01, 2); // Size of flowers: 1% of card width, min 2px
  const scoreCornerOffset = scoreWidth * 0.04; // Position of flowers: 4% of card width from edges
  
  // Draw flowers in each corner
  drawFlower(scoreX - scoreWidth/2 + scoreCornerOffset, scoreY - scoreHeight/2 + scoreCornerOffset, scoreFlowerSize, COLORS.primary); // Top-left
  drawFlower(scoreX + scoreWidth/2 - scoreCornerOffset, scoreY - scoreHeight/2 + scoreCornerOffset, scoreFlowerSize, COLORS.secondary); // Top-right
  drawFlower(scoreX - scoreWidth/2 + scoreCornerOffset, scoreY + scoreHeight/2 - scoreCornerOffset, scoreFlowerSize, COLORS.tertiary); // Bottom-left
  drawFlower(scoreX + scoreWidth/2 - scoreCornerOffset, scoreY + scoreHeight/2 - scoreCornerOffset, scoreFlowerSize, COLORS.primary); // Bottom-right
  
  // Draw the tutorial success message on the left side
  const messageX = scoreX - scoreWidth/2 + scoreWidth * 0.33; // Positioned at 33% from left edge
  const messageY = scoreY;
  const messageWidth = scoreWidth * 0.5; // 50% of score card width
  
  // Draw the title "Well cooked!"
  textAlign(LEFT, CENTER);
  textSize(min(max(playAreaWidth * 0.05, 18), 24)); // Larger font for title
  textStyle(BOLD);
  fill('#333'); // Dark gray text
  text("Well cooked!", messageX, messageY - 15, messageWidth);
  
  // Draw the body text - Updated message text - APlasker
  textSize(min(max(playAreaWidth * 0.03, 12), 16)); // Smaller font for body
  textStyle(NORMAL);
  text("Now that you made a pizza, you're ready to make anything! Put your skills to the test!", messageX, messageY + 15, messageWidth);
  
  // Replace the circular button with a pink rounded rectangle - APlasker
  const ctaWidth = scoreWidth; // Match the score card width exactly
  const ctaHeight = scoreHeight; // Match the score card height exactly
  const ctaX = scoreX; // Center horizontally to match score card
  const ctaY = scoreY; // Center vertically to match score card
  const ctaRadius = max(scoreWidth * 0.02, 8); // Match the score card corner radius
  
  // Draw pink rounded rectangle matching the score card exactly
  rectMode(CENTER);
  fill(COLORS.secondary); // Pink color from COLORS.secondary (#cf6d88)
  stroke(0, 50); // Added black outline with 50 opacity to match hint button style
  strokeWeight(2); // Match strokeWeight used in vessels and hint button
  rect(ctaX, ctaY, ctaWidth, ctaHeight, ctaRadius);
  
  // Add the single line of text
  textAlign(CENTER, CENTER);
  
  // Single line text - sized to fit within 90% of the card width
  textSize(min(max(playAreaWidth * 0.055, 18), 28)); // Same size as before for consistency
  textStyle(BOLD);
  fill(255); // White text
  noStroke(); // Remove stroke for text
  
  // Calculate text width to ensure it fits 90% of the card width
  const ctaText = "COOK TODAY'S RECIPE! →";
  const maxCtaTextWidth = ctaWidth * 0.9; // 90% of the CTA width
  const ctaTextWidth = textWidth(ctaText);
  
  // Scale text if needed to fit 90% of width
  if (ctaTextWidth > maxCtaTextWidth) {
    const scaleFactor = maxCtaTextWidth / ctaTextWidth;
    const scaledFontSize = textSize() * scaleFactor;
    textSize(scaledFontSize);
  }
  
  // Draw the text centered in the button
  text(ctaText, ctaX, ctaY);
  
  // Restore the drawing context
  pop();
}

function shareScore() {
  // APlasker - Track share CTA click in analytics
  if (typeof trackShareClick === 'function') {
    trackShareClick();
  }
  
  try {
    console.log("shareScore called - letterGrade:", letterGrade, "isAPlus:", isAPlus);
    
    // More robust recipe number retrieval with fallbacks
    let recipeNumber = '?';
    
    // First try getting day_number from the recipe object (used in the title screen stats)
    if (typeof recipe !== 'undefined' && recipe && recipe.day_number) {
      recipeNumber = recipe.day_number;
    }
    // Then try getting rec_id from final_combination
    else if (final_combination && final_combination.rec_id) {
      recipeNumber = final_combination.rec_id;
    } 
    // Then try getting it from recipe_data
    else if (recipe_data && recipe_data.rec_id) {
      recipeNumber = recipe_data.rec_id;
    }
    
    // Get formatted date in MM/DD/YY format
    let formattedDate = "##/##/##";
    if (typeof recipe !== 'undefined' && recipe && recipe.date) {
      try {
        const dateParts = recipe.date.split('-');
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0].substring(2)}`;
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }
    
    // Get timer value
    const timeValue = typeof gameTimer !== 'undefined' ? formatTime(gameTimer) : "00:00";
    
    // Add fallbacks if global variables aren't set properly
    if (typeof isAPlus === 'undefined') {
      console.warn("isAPlus is undefined, defaulting to false");
      isAPlus = false;
    }
    
    if (typeof letterGrade === 'undefined') {
      console.warn("letterGrade is undefined, defaulting to 'X'");
      letterGrade = "X";
    }
    
    // Check if Easter Egg was found
    const eggFound = moveHistory.some(move => 
      typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')
    );
    
    // Choose emoji based on Easter egg status
    const mainEmoji = eggFound ? '🍳' : '🍴';
    
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
    
    // Create the share text in the requested format:
    // COMBO MEAL 🍴 
    // Recipe ### 🍴 MM/DD/YY
    // 🌟A🌟 🍴 ##:## 🍴 # Hints
    
    // Handle hints text
    const hintsText = hintCount === 0 ? "No Hints" : `${hintCount} Hints`;
    
    let shareText = `COMBO MEAL ${mainEmoji}\nRecipe ${recipeNumber} ${mainEmoji} ${formattedDate}\n${gradeEmojis} ${mainEmoji} ${timeValue} ${mainEmoji} ${hintsText}`;
    
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
        // Removed the manual copy alert message
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
          // Removed the manual copy alert message
        });
    }
  } catch (error) {
    console.error('Fallback share error:', error);
    // Removed the manual copy alert message
  }
}

// New function to show a recipe link modal - APlasker
function showRecipeModal() {
  try {
    console.log("Showing recipe link modal");
    
    // Get recipe URL with fallbacks
    let urlToOpen = 'https://www.google.com'; // Default fallback
    let recipeName = "this recipe";
    
    // Get the proper URL
    if (recipeUrl) {
      urlToOpen = recipeUrl;
      console.log("Using recipe URL from database:", urlToOpen);
    } else {
      console.warn("No recipe URL found in database, using fallback");
    }
    
    // Get recipe name if available
    if (final_combination && final_combination.name) {
      recipeName = final_combination.name;
    }
    
    // Set the modal active flag if it exists
    if (typeof window.modalActive !== 'undefined') {
      window.modalActive = true;
    } else if (typeof modalActive !== 'undefined') {
      modalActive = true;
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'recipe-modal'; // Add ID for easier debugging and targeting
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
    modal.style.pointerEvents = 'auto';
    
    // Helper function to close modal - APlasker
    const closeModal = () => {
      console.log("Closing recipe modal via background click");
      // Reset modal active flag
      if (typeof window.modalActive !== 'undefined') {
        window.modalActive = false;
      } else if (typeof modalActive !== 'undefined') {
        modalActive = false;
      }
      // Remove from DOM
      document.body.removeChild(modal);
    };
    
    // Close modal when clicking outside content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        e.stopPropagation();
        closeModal();
      }
    });
    
    // Additional touch event for mobile - APlasker
    modal.addEventListener('touchend', (e) => {
      if (e.target === modal) {
        e.stopPropagation();
        closeModal();
      }
    });
    
    // Create modal content
    const content = document.createElement('div');
    content.style.backgroundColor = '#FFFFFF';
    content.style.padding = '25px';
    content.style.borderRadius = '10px';
    content.style.maxWidth = '90%';
    content.style.width = '350px';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    
    // Prevent events from bubbling through content
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Create header
    const header = document.createElement('h3');
    header.innerText = 'Now leaving Combo Meal...';
    header.style.marginTop = '0';
    header.style.color = '#778F5D'; // Avocado green
    header.style.fontFamily = 'Arial, sans-serif';
    header.style.marginBottom = '25px'; // Added margin to maintain spacing after removing recipe name
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.width = '100%';
    
    // Create open recipe button (as a direct link)
    const openButton = document.createElement('a');
    openButton.href = urlToOpen;
    openButton.target = '_blank'; // Open in new tab
    openButton.rel = 'noopener noreferrer'; // Security best practice
    openButton.innerText = 'Go to Recipe';
    openButton.style.backgroundColor = '#778F5D'; // Avocado green
    openButton.style.color = 'white';
    openButton.style.border = 'none';
    openButton.style.padding = '12px 20px';
    openButton.style.borderRadius = '5px';
    openButton.style.cursor = 'pointer';
    openButton.style.fontWeight = 'bold';
    openButton.style.textDecoration = 'none';
    openButton.style.display = 'inline-block';
    openButton.style.textAlign = 'center';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Cancel';
    closeButton.style.backgroundColor = '#f5f5f5';
    closeButton.style.color = '#333';
    closeButton.style.border = '1px solid #ddd';
    closeButton.style.padding = '12px 20px';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'normal';
    
    // Add event listener to close modal
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
    
    // Assemble modal
    buttonContainer.appendChild(openButton);
    buttonContainer.appendChild(closeButton);
    content.appendChild(header);
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    
    // Add to document
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error("Error showing recipe modal:", error);
    alert("Unable to open recipe link. Please try again later.");
  }
}

function viewRecipe() {
  // APlasker - Track recipe CTA click in analytics
  if (typeof trackRecipeClick === 'function') {
    trackRecipeClick();
  }
  
  // Use the new modal approach for a consistent experience on all platforms
  showRecipeModal();
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
  // Calculate the position of the "!" in "WOW DELICIOUS!"
  const rewardMessage = "WOW DELICIOUS!";
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
  console.log("Current game state:", gameState, "gameWon:", gameWon, "isTutorialMode:", isTutorialMode);
  
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
  
  // Special handling for tutorial mode - APlasker
  if (isTutorialMode) {
    // Check if click is within the overall score card
    const isOverScoreCard = (
      x > scoreX - scoreWidth/2 && 
      x < scoreX + scoreWidth/2 && 
      y > scoreY - scoreHeight/2 && 
      y < scoreY + scoreHeight/2
    );
    
    if (isOverScoreCard) {
      console.log("Tutorial score card clicked - loading today's recipe");
      
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
      console.log("Loading today's recipe from tutorial (handleLetterScoreInteraction)");
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
      
      return true; // Interaction was handled
    }
    
    return false; // Tutorial interaction was not handled
  }
  
  // Regular score card handling for non-tutorial mode
  // Calculate the circle position (same calculation as in drawWinScreen)
  const circleX = scoreX - scoreWidth/2 + scoreWidth * 0.28;
  const circleY = scoreY - scoreHeight/2 + scoreHeight * 0.55; // Updated to 55% from top
  const circleSize = scoreHeight * 0.8; // Updated to 80% to match drawWinScreen
  
  // Calculate letter grade position
  const letterGradeY = circleY + scoreHeight * 0.1; // 10% lower than circle center
  
  // Check if click is within the circle area with padding
  const padding = 20; // 20px of extra clickable area
  const isOverCircle = (
    x > circleX - circleSize/2 - padding && 
    x < circleX + circleSize/2 + padding && 
    y > circleY - circleSize/2 - padding && 
    y < circleY + circleSize/2 + padding
  );
  
  // Also check if click is within letter grade area
  const letterGradeSize = circleSize * 0.95;
  const isOverLetterGrade = (
    x > circleX - letterGradeSize/2 - padding &&
    x < circleX + letterGradeSize/2 + padding &&
    y > letterGradeY - letterGradeSize/2 - padding &&
    y < letterGradeY + letterGradeSize/2 + padding
  );
  
  // Also check if click is within the overall score card
  const isOverLetterScore = (
    x > scoreX - scoreWidth/2 - padding && 
    x < scoreX + scoreWidth/2 + padding && 
    y > scoreY - scoreHeight/2 - padding && 
    y < scoreY + scoreHeight/2 + padding
  );
  
  console.log("Letter score interaction check:", 
    "x:", x, "y:", y,
    "scoreX:", scoreX, "scoreY:", scoreY, 
    "scoreWidth:", scoreWidth, "scoreHeight:", scoreHeight,
    "circleX:", circleX, "circleY:", circleY, "circleSize:", circleSize,
    "letterGradeY:", letterGradeY, "letterGradeSize:", letterGradeSize,
    "isOverCircle:", isOverCircle,
    "isOverLetterGrade:", isOverLetterGrade,
    "isOverLetterScore:", isOverLetterScore
  );
  
  // If coordinates are within circle, letter grade, or letter score, trigger share action
  if (isOverCircle || isOverLetterGrade || isOverLetterScore) {
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


