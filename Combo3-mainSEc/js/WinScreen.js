// ... existing code ...
// Add to the top of the file with other global state variables:
// Last Updated: May 31, 2025 (05:43 PM EDT) by APlasker - Added bonus 6th star to Win Screen score card for perfect (0 mistakes, 0 hints) games.
let isMouseOverScoreCard = false;
// ... existing code ...

function showWinScreen() {
  gameWon = true;
  triggerHapticFeedback('completion');
  
  // Complete the game session immediately when win screen is shown - APlasker
  // This ensures star scores are calculated and stored right away
  // Use enhanced completion with retry logic for better reliability
  if (typeof completeGameSessionWithRetry === 'function') {
    console.log("Completing game session with retry logic on win");
    completeGameSessionWithRetry('completed');
  } else if (typeof completeGameSession === 'function') {
    console.log("Completing game session immediately on win");
    completeGameSession('completed');
  }
  
  // Start win screen tracking for timeout management
  if (typeof startWinScreenTracking === 'function') {
    startWinScreenTracking();
  }
  
  // APlasker - Record streak completion if StreakSystem is available
  // Exclude tutorial mode completions from streak tracking
  if (typeof StreakSystem !== 'undefined' && typeof recipe !== 'undefined' && recipe && recipe.day_number && !isTutorialMode) {
    // Use actual mistakes from analytics system instead of calculating grades
    const currentMistakes = typeof totalMistakes !== 'undefined' ? totalMistakes : 0;
    const validForStreak = currentMistakes < 5; // Less than 5 mistakes counts for streak
    
    // Get game time in seconds
    const timeInSeconds = typeof gameTimer !== 'undefined' ? gameTimer : 0;
    
    // Record the completion in the streak system
    const streakUpdated = StreakSystem.recordCompletion(recipe.day_number, validForStreak, timeInSeconds);
    
    if (streakUpdated) {
      console.log('Streak updated for recipe day', recipe.day_number, 'with', currentMistakes, 'mistakes (valid:', validForStreak, ')');
    }
  } else if (isTutorialMode) {
    console.log('Tutorial mode completion - not recorded in streak system');
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
  const rewardMessage = "DELICIOUS";
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
  
  // Add kerning (25% increase in spacing)
  const kerningFactor = 0.25; // 25% extra space
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
  
  // Calculate outline sizes
  const outerSize = 3.5;  // Outer black outline thickness
  const middleSize = 2.5; // Middle peach outline thickness
  const innerSize = 1;    // Inner black outline thickness
  
  // IMPROVED OUTLINE APPROACH - Draw outlines for each letter that connect smoothly with bounce
  // First pass: Draw all outline layers for all letters
  for (let layer = 0; layer < 3; layer++) {
    let currentX = x; // Reset x position for each layer
    
    let layerSize, layerColor;
    switch (layer) {
      case 0: // Outer black outline
        layerSize = outerSize;
        layerColor = 'black';
        break;
      case 1: // Middle peach outline
        layerSize = middleSize;
        layerColor = COLORS.peach;
        break;
      case 2: // Inner black outline
        layerSize = innerSize;
        layerColor = 'black';
        break;
    }
    
      push();
  fill(layerColor);
  textAlign(CENTER, CENTER);
  textSize(rewardMessageSize);
  textFont(titleFont); // Use title font for win screen titles
    
    for (let i = 0; i < rewardMessage.length; i++) {
      // Calculate letter position with bounce effect
      let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
      let letterX = currentX + letterWidths[i]/2;
      let letterY = playAreaY + playAreaHeight * 0.06 + offsetY;
      
      // Draw outline for this letter
      for (let angle = 0; angle < TWO_PI; angle += PI/16) {
        let outlineOffsetX = cos(angle) * layerSize;
        let outlineOffsetY = sin(angle) * layerSize;
        text(rewardMessage[i], letterX + outlineOffsetX, letterY + outlineOffsetY);
      }
      
      // Move to next letter position (using kerning factor)
      currentX += letterWidths[i] * (1 + kerningFactor);
    }
    pop();
  }
  
  // Second pass: Draw colored letters on top
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
    
    // Draw the colored letter
    push();
    textAlign(CENTER, CENTER);
    textSize(rewardMessageSize);
    textFont(titleFont); // Use title font for win screen titles
    fill(letterColor);
    text(rewardMessage[i], letterX, letterY);
    pop();
    
    // Move to the next letter position with kerning factor
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
  textFont(titleFont); // Use Courier font for recipe card titles
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
  
  // Calculate blackMoves (mistakes) - APlasker - Moved here as it was removed with Letter Score section
  let blackMoves = 0;
  for (let move of moveHistory) {
    if (move === 'black' || move === '#333333') {
      blackMoves++;
    }
  }

  // ===== SCORE SECTION (TALLER, NARROWER STATS) =====
  scoreWidth = min(playAreaWidth, 600);
  scoreHeight = playAreaHeight * 0.20;
  scoreX = playAreaX + playAreaWidth/2;
  scoreY = playAreaY + playAreaHeight * 0.60 + scoreHeight/2;

  // Card background and shadow
  push();
  rectMode(CENTER);
  fill(0, 0, 0, 30);
  noStroke();
  rect(scoreX + 5, scoreY + 5, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8));
  fill(255);
  stroke(220);
  strokeWeight(1);
  rect(scoreX, scoreY, scoreWidth, scoreHeight, max(scoreWidth * 0.02, 8));
  pop();

  // New 3x2 Grid Layout for Score Card (APlasker)
  const numCols = 3;
  const numRows = 2;
  const gap = scoreWidth * 0.02; // 2% gap, adjust as needed

  // Calculate usable width and height after accounting for gaps AND increased outer margins
  const outerPadding = gap * 2; // Double the gap for outer padding
  const totalGapWidth = gap * (numCols - 1) + outerPadding * 2; // Gaps between cols + outer L/R padding
  const totalGapHeight = gap * (numRows - 1) + outerPadding * 2; // Gaps between rows + outer T/B padding

  const usableWidth = scoreWidth - totalGapWidth;
  const usableHeight = scoreHeight - totalGapHeight;

  // Define column widths based on percentages of usableWidth
  const colWidth1 = usableWidth * 0.20;
  const colWidth2 = usableWidth * 0.46667;
  const colWidth3 = usableWidth * 0.33333; // Remaining width

  const rowHeight = usableHeight / numRows;

  // Define cell start positions (top-left of each cell), accounting for outerPadding
  const cellAX1 = scoreX - scoreWidth / 2 + outerPadding;
  const cellAY = scoreY - scoreHeight / 2 + outerPadding;

  const cellAX2 = cellAX1 + colWidth1 + gap;
  const cellAX3 = cellAX2 + colWidth2 + gap;

  const cellBY = cellAY + rowHeight + gap;

  // --- Stars (A1+A2) ---
  let actualTotalStarsToDisplay = 5;
  const baseStars = 5;
  const mistakes = blackMoves; // Assumes blackMoves is calculated earlier
  // console.log("DEBUG WINSCREEN STARS: Mistakes=", mistakes, "HintCount=", hintCount);

  let showBonusStar = false;
  if (mistakes === 0 && hintCount === 0) {
    showBonusStar = true;
    actualTotalStarsToDisplay = 6;
  }
  // console.log("DEBUG WINSCREEN STARS: showBonusStar=", showBonusStar, "actualTotalStarsToDisplay=", actualTotalStarsToDisplay);
  
  const starSize = Math.min(Math.max(rowHeight * 0.3, 8), 15); // Size relative to row height
  const starSpacing = starSize * 1.5;
  const starsAreaWidth = colWidth1 + colWidth2; // Stars span first two columns
  const totalStarLayoutWidth = (starSize * actualTotalStarsToDisplay) + (starSpacing * (actualTotalStarsToDisplay - 1));
  
  const starsGroupStartX = cellAX1 + (starsAreaWidth - totalStarLayoutWidth) / 2;
  // let starsYPosition = cellAY + rowHeight / 2 + gap * 0.5; // Original position before message

  // --- Add message above stars (APlasker) ---
  let starMessage = "";
  let effectiveStars = showBonusStar ? actualTotalStarsToDisplay : (baseStars - mistakes);
  if (effectiveStars === 6) starMessage = "Flawless! No Hints!";
  else if (effectiveStars === 5) starMessage = "Perfect!";
  else if (effectiveStars === 4) starMessage = "Delish!";
  else if (effectiveStars === 3) starMessage = "Tasty!";
  else if (effectiveStars === 2) starMessage = "Sloppy but yummy!";
  else if (effectiveStars === 1) starMessage = "Just made it!";
  else if (effectiveStars <= 0) starMessage = "It's all mixed up :("; // 5 or more mistakes

  let messageTextSize = Math.min(max(colWidth1 * 0.8 * 0.2, 8), 12); // Same as streakLabelSize approx (colWidth1*0.8 is streakRectWidth)
  textSize(messageTextSize);
  let messageTextHeight = textAscent() + textDescent();
  
  // Adjust stars Y position to make room for the message above them
  let starsYPosition = cellAY + rowHeight / 2 + messageTextHeight * 0.5 + gap * 0.5; // Scootched down

  if (starMessage) {
    push();
    textAlign(CENTER, BOTTOM);
    textStyle(NORMAL);
    fill('#333');
    textSize(messageTextSize);
    let messageX = cellAX1 + starsAreaWidth / 2;
    let messageY = starsYPosition - starSize / 2 - gap * 0.5; // Original position
    messageY -= scoreHeight * 0.05; // Move message up by 5% of score card height
    text(starMessage, messageX, messageY);
    pop();
  }

  for (let i = 0; i < actualTotalStarsToDisplay; i++) {
    const starX = starsGroupStartX + (i * (starSize + starSpacing)) + starSize / 2;
    // if (actualTotalStarsToDisplay === 6 && i === 5) {
    //   console.log("DEBUG WINSCREEN STARS: Drawing BONUS 6th star at x=", starX, "y=", starsYPosition);
    // }
    let starFillColor;
    if (showBonusStar && i === baseStars) {
      starFillColor = COLORS.vesselHint;
    } else {
      if (mistakes === 0 || i < baseStars - mistakes) {
        starFillColor = COLORS.vesselHint;
      } else {
        starFillColor = STAR_GREY;
      }
    }
    drawStar(starX, starsYPosition, starSize * 0.475, starSize, 5, starFillColor, STAR_OUTLINE);
  }

  // --- Streak (B1) ---
  const streakCellX = cellAX1; // Base X for the cell column
  const streakCellY = cellBY;
  // Shift Streak content to the right by 5% of scoreWidth
  const streakCenterX = (streakCellX + colWidth1 / 2) + (scoreWidth * 0.05);
  const streakCenterY = streakCellY + rowHeight / 2;
  const streakRectWidth = colWidth1 * 0.8; // Use 80% of cell width
  // Increase height of Streak holding shape by 10%
  const streakRectHeight = rowHeight * (0.7 * 1.1); // Increased height

  push();
  rectMode(CENTER);
  fill(255);
  stroke(COLORS.primary);
  strokeWeight(2);
  rect(streakCenterX, streakCenterY, streakRectWidth, streakRectHeight, 14);
  textAlign(CENTER, CENTER);
  noStroke();
  
  let streakLabelSize = Math.min(max(streakRectWidth * 0.2, 8), 12);
  let streakValueSize = Math.min(max(streakRectWidth * 0.35, 14), 24);
  // Increase spacing between Streak label and value
  let streakLabelY = streakCenterY - streakRectHeight * 0.25; // Pushed label up more
  let streakValueY = streakCenterY + streakRectHeight * 0.20; // Pushed value down more

  textSize(streakLabelSize);
  fill('#333');
  textStyle(NORMAL);
  text('Streak', streakCenterX, streakLabelY);
  
  textStyle(BOLD);
  textSize(streakValueSize);
  fill(COLORS.primary);
      // Calculate display streak using enhanced server-side streak system - APlasker
    async function getDisplayStreak() {
      const currentMistakes = typeof totalMistakes !== 'undefined' ? totalMistakes : 0;
      
      // If too many mistakes, streak is broken
      if (currentMistakes >= 5) {
        return 0;
      }
      
      // Get enhanced streak data from server
      if (window.authState?.user?.id && typeof getUserProfileStats === 'function') {
        try {
          const profileStats = await getUserProfileStats(window.authState.user.id);
          if (profileStats?.enhanced_streaks) {
            // Return the current recipe streak + 1 (for this completion)
            return (profileStats.enhanced_streaks.current_recipe_streak || 0) + 1;
          }
        } catch (error) {
          console.error('Error fetching enhanced streak for display:', error);
        }
      }
      
      // Fallback to localStorage-based calculation
      const sessionStart = typeof sessionStartStreak !== 'undefined' ? sessionStartStreak : 0;
      return sessionStart + 1;
    }
    
    // Handle async streak calculation
    if (typeof window.displayStreakValue === 'undefined') {
      // Initialize streak value calculation
      window.displayStreakValue = 'Loading...';
      getDisplayStreak().then(streak => {
        window.displayStreakValue = streak.toString();
      }).catch(error => {
        console.error('Error getting display streak:', error);
        window.displayStreakValue = '0';
      });
    }
    
    text(window.displayStreakValue, streakCenterX, streakValueY);
  pop();

  // --- Timer (B2) ---
  const timerCellX = cellAX2;
  const timerCellY = cellBY;
  const timerCenterX = timerCellX + colWidth2 / 2;
  const timerCenterY = timerCellY + rowHeight / 2;
  const timerRectWidth = colWidth2 * 0.9; // Use 90% of cell width
  const timerRectHeight = rowHeight * 0.7; // Use 70% of cell height

  push();
  // rectMode(CENTER); // No rectangle for timer
  // fill(255);
  // stroke(COLORS.primary);
  // strokeWeight(2);
  // rect(timerCenterX, timerCenterY, timerRectWidth, timerRectHeight, 14);
  textAlign(CENTER, CENTER);
  noStroke();
  
  // let timerLabelSize = Math.min(max(timerRectWidth * 0.15, 8), 12); // No label for timer
  let timerValueSize = Math.min(max(timerRectWidth * 0.375, 21), 36); // Increased font size by 50%
  // let timerLabelY = timerCenterY - timerRectHeight * 0.20; // No label
  // let timerValueY = timerCenterY + timerRectHeight * 0.15; // Value will be centered in cell

  // textSize(timerLabelSize);
  // fill('#333');
  // textStyle(NORMAL);
  // text('Total Time', timerCenterX, timerLabelY); // No label
  
  textStyle(BOLD);
  textSize(timerValueSize);
  fill(COLORS.primary);
  let timeValue = typeof gameTimer !== 'undefined' ? formatTime(gameTimer) : '00:00';
  text(timeValue, timerCenterX, timerCenterY); // Draw time centered in B2 cell
  pop();

  // --- Share Score Button (A3+B3) ---
  const shareButtonX = cellAX3;
  const shareButtonY = cellAY; // Top-left Y of the A3 cell
  const shareButtonWidth = colWidth3;
  const shareButtonHeight = scoreHeight - (totalGapHeight / 2) ; // Full height of score card, minus half a gap to prevent going outside bounds.

  const shareButtonCenterX = shareButtonX + shareButtonWidth / 2;
  const shareButtonCenterY = shareButtonY + shareButtonHeight / 2;
  
  push();
  rectMode(CORNER); // Draw from top-left
  // fill(isMouseOverScoreCard ? lerpColor(color(COLORS.secondary), color(255), 0.2) : COLORS.secondary); // Pinkish, hover effect
  // stroke(0, 50); // Subtle black outline
  // strokeWeight(2);
  // // Rounded rectangle for the button
  // rect(shareButtonX, shareButtonY, shareButtonWidth, shareButtonHeight, 14); // Use corner rounding

  // APlasker: Adjust Share Score button for internal margins
  const shareButtonActualWidth = colWidth3 * 0.9; // e.g., 90% of the cell width
  const shareButtonActualHeight = (rowHeight * 2) * 0.9; // e.g., 90% of the combined row height for this column

  const shareButtonActualX = cellAX3 + (colWidth3 - shareButtonActualWidth) / 2;
  const shareButtonActualY = cellAY + ( (rowHeight * 2 + gap) - shareButtonActualHeight) / 2; // Center in the full A3+B3 space

  fill(isMouseOverScoreCard ? lerpColor(color(COLORS.secondary), color(255), 0.2) : COLORS.secondary);
  stroke(0,50);
  strokeWeight(2);
  rect(shareButtonActualX, shareButtonActualY, shareButtonActualWidth, shareButtonActualHeight, 14);

  textAlign(CENTER, CENTER);
  // Increase Share Score font size and stack text, remove arrow
  let shareTextSize = Math.min(max(shareButtonActualWidth * 0.21, 17), 28); // Slightly reduced font size (1pt from .22, 18, 30)
  textSize(shareTextSize);
  textStyle(BOLD);
  fill(255); // White text
  noStroke();
  text('Share\nScore', shareButtonActualX + shareButtonActualWidth / 2, shareButtonActualY + shareButtonActualHeight / 2);
  pop();

  // Update isMouseOverScoreCard for the new Share Button area
  isMouseOverScoreCard = mouseX > shareButtonActualX && mouseX < shareButtonActualX + shareButtonActualWidth &&
                         mouseY > shareButtonActualY && mouseY < shareButtonActualY + shareButtonActualHeight;

  if (isMouseOverScoreCard) {
    cursor(HAND);
  }
  
  // --- Easter Egg (Positioned over Share Score Button A3/B3) ---
  // (Code for calculating blackMoves, letterGrade, circleSize etc. for egg was removed as letter grade is gone)
  // We need to recalculate blackMoves if it's not available globally or passed to drawWinScreen
  // For now, assuming 'mistakes' (which is blackMoves) is available from star calculation section.
  // Also, 'circleSize' was tied to letter grade circle. We need a new reference for egg size.
  // Let's make egg size relative to the share button's width or height.

  let eggFound = moveHistory.some(move => typeof move === 'object' && move.type === 'easterEgg');

  if (eggFound) {
    push();
    const eggContainerWidth = shareButtonWidth; // Egg is over the share button
    const eggBaseSize = eggContainerWidth * 0.25; // Egg base size 25% of share button width
    
    // Position egg at top-right corner of Score Card - APlasker: Updated for doubled size and new position
    // Calculate the score card boundaries (not the recipe card)
    const scoreCardRight = scoreX + scoreWidth/2;
    const scoreCardTop = scoreY - scoreHeight/2;
    
    // Position egg so its right side aligns with the top-right corner of the score card
    // The egg extends approximately 20 units to the right from center, so we offset by that amount
    const sizeMultiplier = 2.0; // Double the size - APlasker
    const eggRightExtent = 20 * sizeMultiplier; // Right extent of the egg from its center point
    const eggX = scoreCardRight - eggRightExtent;
    const eggY = scoreCardTop + (15 * sizeMultiplier); // Offset down slightly to avoid cutting off the top

    fill(0, 0, 0, 40); noStroke(); translate(2, 2); // Shadow offset
    beginShape();
    vertex(eggX - 15 * sizeMultiplier, eggY);
    bezierVertex(eggX - 22.5 * sizeMultiplier, eggY - 10 * sizeMultiplier, eggX - 10 * sizeMultiplier, eggY - 22.5 * sizeMultiplier, eggX + 5 * sizeMultiplier, eggY - 15 * sizeMultiplier);
    bezierVertex(eggX + 20 * sizeMultiplier, eggY - 10 * sizeMultiplier, eggX + 15 * sizeMultiplier, eggY + 10 * sizeMultiplier, eggX + 5 * sizeMultiplier, eggY + 15 * sizeMultiplier);
    bezierVertex(eggX - 2.5 * sizeMultiplier, eggY + 17.5 * sizeMultiplier, eggX - 10 * sizeMultiplier, eggY + 7.5 * sizeMultiplier, eggX - 15 * sizeMultiplier, eggY);
    endShape(CLOSE);
    translate(-2, -2); // Reset shadow offset

    fill(255, 255, 255); noStroke(); // Egg white
    beginShape();
    vertex(eggX - 15 * sizeMultiplier, eggY);
    bezierVertex(eggX - 22.5 * sizeMultiplier, eggY - 10 * sizeMultiplier, eggX - 10 * sizeMultiplier, eggY - 22.5 * sizeMultiplier, eggX + 5 * sizeMultiplier, eggY - 15 * sizeMultiplier);
    bezierVertex(eggX + 20 * sizeMultiplier, eggY - 10 * sizeMultiplier, eggX + 15 * sizeMultiplier, eggY + 10 * sizeMultiplier, eggX + 5 * sizeMultiplier, eggY + 15 * sizeMultiplier);
    bezierVertex(eggX - 2.5 * sizeMultiplier, eggY + 17.5 * sizeMultiplier, eggX - 10 * sizeMultiplier, eggY + 7.5 * sizeMultiplier, eggX - 15 * sizeMultiplier, eggY);
    endShape(CLOSE);

    const yolkSize = 18 * sizeMultiplier; // Yolk
    for (let i = 5; i >= 0; i--) {
      const currentYolkSize = yolkSize * (1 - i * 0.05); fill(255, 204, 0, 255 - i * 10); noStroke();
      ellipse(eggX - 2.5 * sizeMultiplier, eggY - 10 * sizeMultiplier, currentYolkSize, currentYolkSize * 0.9);
    }
    fill(255, 255, 255, 100); noStroke(); // Highlight
    ellipse(eggX - 6 * sizeMultiplier, eggY - 12.5 * sizeMultiplier, yolkSize * 0.4, yolkSize * 0.3);
    noFill(); stroke(200, 150, 0, 100); strokeWeight(1); // Yolk outline
    ellipse(eggX - 2.5 * sizeMultiplier, eggY - 10 * sizeMultiplier, yolkSize, yolkSize * 0.9);
    pop();
  }
  
  // REMOVE OLD STATS DRAWING (Streak, Hints, Letter Score, Total Time, old Share Score text)
  // The sections for --- Streak ---, --- Hints ---, --- Letter Score ---, --- Total Time ---, 
  // and the old "Share Score" text drawing are now replaced by the grid layout above.
  // The mistake stars drawing logic is also integrated into the new grid (Stars A1+A2).
  
  // --- A+ Stars and Hint Indicators are removed as they were tied to Letter Grade display ---

  textStyle(NORMAL); // Reset text style just in case
  
  // After drawing all win screen content, draw the flower animation on top if it's active
  if (persistentFlowerAnimation && persistentFlowerAnimation.active) {
    persistentFlowerAnimation.draw();
    persistentFlowerAnimation.update();
  }
  
  // Add "NEW RECIPE DAILY" text at the bottom - APlasker - Restored
  textAlign(CENTER, CENTER);
  textSize(min(max(playAreaWidth * 0.04, 14), 18)); 
  fill('#333');
  textStyle(BOLD);
  text("NEW RECIPE DAILY – COME BACK SOON!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.94);
  textStyle(NORMAL);
  
  // Add "Say hi!" link text below the main text - APlasker - Restored
  textSize(min(max(playAreaWidth * 0.025, 10), 14)); 
  fill(COLORS.primary); // Green color for the link
  text("Say hi!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.975); 
  
  // Store position and dimensions for hit detection - APlasker - Restored
  sayHiLinkX = playAreaX + playAreaWidth/2;
  sayHiLinkY = playAreaY + playAreaHeight * 0.975; 
  sayHiLinkWidth = textWidth("Say hi!") * 1.2; // Add some padding
  sayHiLinkHeight = textAscent() + textDescent();
  
  // Check if mouse is over the Say hi link - APlasker - Restored
  isMouseOverSayHi = mouseX > sayHiLinkX - sayHiLinkWidth/2 && 
                     mouseX < sayHiLinkX + sayHiLinkWidth/2 && 
                     mouseY > sayHiLinkY - sayHiLinkHeight/2 && 
                     mouseY < sayHiLinkY + sayHiLinkHeight/2;
  
  // Change cursor to pointer if over the link - APlasker - Restored
  if (isMouseOverSayHi) {
    cursor(HAND);
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
  const rewardMessage = "DELICIOUS";
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
  try {
    console.log("shareScore called - old letterGrade:", letterGrade, "isAPlus:", isAPlus); // Old log
    
    // Reset win screen timer on share attempt
    if (typeof resetWinScreenTimer === 'function') {
      resetWinScreenTimer();
    }
    
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
    
    const timeValue = typeof gameTimer !== 'undefined' ? formatTime(gameTimer) : "00:00";
    
    // Calculate mistakes (blackMoves) for star count - APlasker
    let blackMoves = 0;
    for (let move of moveHistory) {
      if (move === 'black' || move === '#333333') {
        blackMoves++;
      }
    }

    const baseStars = 5; // Standard number of mistake stars
    let actualTotalStarsToDisplay = baseStars; // Initialize
    let showBonusStar = false;
    if (blackMoves === 0 && hintCount === 0) {
      showBonusStar = true;
      actualTotalStarsToDisplay = 6;
    }

    let yellowStarsCount = showBonusStar ? actualTotalStarsToDisplay : (baseStars - blackMoves);
    if (yellowStarsCount < 0) yellowStarsCount = 0; // Ensure it doesn't go negative

    let starsDisplay = '⭐'.repeat(yellowStarsCount);
    if (yellowStarsCount === 0) starsDisplay = "0⭐"; // Or your preferred display for 0 stars

    // APlasker: Update hint display for 0 hints
    let hintsDisplay;
    if (hintCount === 0) {
      hintsDisplay = '🧑‍🍳'; // Chef emoji for 0 hints
    } else {
      hintsDisplay = '🔍'.repeat(hintCount);
    }

    // APlasker: Add diagnostic logging for Easter egg detection
    let foundEggMoveDebug = null;
    const eggFound = moveHistory.some(move => {
      if (typeof move === 'object' && move && move.type === 'easterEgg') {
        foundEggMoveDebug = move;
        return true;
      }
      return false;
    });
    const eggIcon = eggFound ? '🍳' : '';

    console.log(`[shareScore Debug] moveHistory: ${JSON.stringify(moveHistory)}`);
    console.log(`[shareScore Debug] eggFound: ${eggFound}, Triggering move: ${JSON.stringify(foundEggMoveDebug)}`);
    console.log(`[shareScore Debug] hintCount: ${hintCount}`);

    // Construct new share text - APlasker
    // COMBO MEAL 🍴Recipe ### (Date)
    // Star Count | Timer | Hint Count | Egg Found
    let shareText = `COMBO MEAL 🍴Recipe ${recipeNumber} (${formattedDate})\n${starsDisplay} | ${timeValue} | ${hintsDisplay}`;
    if (eggFound) {
      shareText += ` | ${eggIcon}`;
    }

    console.log("New Share Text:", shareText);

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
          // Track successful share
          if (typeof trackShareClick === 'function') {
            trackShareClick();
          }
        })
        .catch(error => {
          console.log('Error sharing:', error);
          
          // Fallback if Web Share API fails - combine text and URL for clipboard
          clipboardShareFallback(shareText + '\n\n' + shareUrl);
        });
      }, 100);
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
    // Reset win screen timer on clipboard share attempt
    if (typeof resetWinScreenTimer === 'function') {
      resetWinScreenTimer();
    }
    
    // On iOS, sometimes the toast works better than clipboard API
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
      // For iOS, try to copy to clipboard silently
      try {
        navigator.clipboard.writeText(text).then(() => {
          // Track successful copy
          if (typeof trackShareClick === 'function') {
            trackShareClick();
          }
          
          // Show success toast
          showShareToast('🍽️ Score copied to clipboard! 🍽️');
        });
      } catch (clipErr) {
        console.log('Silent clipboard copy failed on iOS, showing modal as fallback');
        showShareModal(text);
      }
    } else {
      // For non-iOS, use clipboard API with toast
      navigator.clipboard.writeText(text)
        .then(() => {
          // Track successful copy
          if (typeof trackShareClick === 'function') {
            trackShareClick();
          }
          
          // Show success toast
          showShareToast('🍽️ Score copied! Share your food! 🍽️');
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
          showShareModal(text);
        });
    }
  } catch (error) {
    console.error('Fallback share error:', error);
    showShareModal(text);
  }
}

// Helper function to show share toast
function showShareToast(message) {
  const toast = document.createElement('div');
  toast.className = 'share-toast';
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(119, 143, 93, 0.9)';
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
  toast.style.fontFamily = 'Courier, "Courier New", monospace';
  toast.innerText = message;
  
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
    modal.id = 'recipe-modal';
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
    header.style.marginBottom = '25px';
    
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
    
    // Add click tracking to the recipe link with proper tracking before navigation
    openButton.addEventListener('click', async (e) => {
      e.preventDefault(); // Prevent immediate navigation
      
      // Track the recipe click first
      if (typeof trackRecipeClick === 'function') {
        console.log("Tracking recipe click before navigation");
        await trackRecipeClick();
      }
      
      // Session is already completed when win screen is shown - no need to complete again
      console.log("Opening recipe URL (session already completed)");
      
      // Small delay to ensure tracking completes
      setTimeout(() => {
        console.log("Opening recipe URL after tracking");
        window.open(urlToOpen, '_blank');
        closeModal();
      }, 50);
    });
    
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
  // Check if we have a URL to open
  if (!recipeUrl) {
    console.log("No recipe URL available");
    return;
  }
  
  console.log("Opening recipe URL:", recipeUrl);
  
  // Reset win screen timer on recipe view
  if (typeof resetWinScreenTimer === 'function') {
    resetWinScreenTimer();
  }
  
  // Create and show the recipe modal
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
  // Calculate the position of the "E" in "DELICIOUS"
  const rewardMessage = "DELICIOUS";
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
  
  // Calculate the position of the "E" (second-to-last letter, index 7 in "DELICIOUS")
  const targetLetterIndex = 7; // "E" is at position 7 (0-indexed)
  let targetLetterX = startX;
  for (let i = 0; i < targetLetterIndex; i++) {
    targetLetterX += letterWidths[i] * (1 + kerningFactor);
  }
  targetLetterX += letterWidths[targetLetterIndex]/2;
  
  let targetLetterY = playAreaY + playAreaHeight * 0.06;
  
  // Create a 60x60 pixel hotspot around the "E"
  const isInHotspot = x >= targetLetterX - 30 && x <= targetLetterX + 30 && 
                      y >= targetLetterY - 30 && y <= targetLetterY + 30;
  
  // Debug visualization when hovering over hotspot
  if (isInHotspot) {
    noFill();
    stroke(255, 0, 0, 100); // Semi-transparent red for random recipe
    strokeWeight(2);
    rect(targetLetterX - 30, targetLetterY - 30, 60, 60);
    console.log("Hovering over random recipe hotspot at:", targetLetterX, targetLetterY);
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
      e.stopPropagation(); // Temporarily commented out to test input field focus
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
          // Get the current recipe UUID
          let recipeUuid = null;
          
          // Try getting recipe UUID from recipe_data
          if (typeof recipe_data !== 'undefined' && recipe_data && recipe_data.rec_id) {
            recipeUuid = recipe_data.rec_id;
          }
          
          // Submit to Supabase SayHi table
          const { data, error } = await supabase
            .from('SayHi')
            .insert([
              { 
                email_hi: email, 
                comment_hi: comment,
                recipe_uuid: recipeUuid,
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
  const letterGradeY = circleY + scoreHeight * 0.1;
  
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
    console.log("Letter score interaction handled - tracking share click");
    
    // Track share click immediately when they interact with the score card
    if (typeof trackShareClick === 'function') {
      trackShareClick();
    }
    
    // Then try to execute the share action
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


