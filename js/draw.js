// Enhanced move history display for win screen
function drawWinMoveHistory(x, y, width, height) {
    // This function is no longer called, but we'll keep it for future reference
    const circleSize = 18;
    const margin = 6;
    const maxPerRow = 8;
    const maxRows = 4;
    
    // Make these variables accessible to the parent function
    window.winMoveHistory = {
      circleSize: circleSize,
      margin: margin,
      maxRows: maxRows
    };
  }
  
  // Keep the regular move history for during gameplay
  function drawMoveHistory() {
    // Isolate drawing context for move history
    push();
    
    // Position counters at a fixed position 92% from top of play area
    const historyY = playAreaY + playAreaHeight * 0.92;
    
    const circleSize = 15;
    const circleSpacing = 20;
    const maxCountersPerRow = 10;
    const rowSpacing = 20;
    const maxRows = 3; // Maximum 3 rows (30 counters total)
    
    // Filter moveHistory to only include red, black, and Easter Egg counters
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333' || move === COLORS.vesselHint || move === '#FF5252' || 
      (typeof move === 'object' && (move.type === 'egg' || move.type === 'easterEgg')));
    
    // Limit the number of counters to display
    const displayCount = Math.min(filteredMoveHistory.length, maxCountersPerRow * maxRows);
    
    // Calculate the number of rows needed
    const rowsNeeded = Math.ceil(displayCount / maxCountersPerRow);
    
    // Move the starting Y position up to accommodate rows below
    const startY = historyY - ((rowsNeeded - 1) * rowSpacing);
    
    // Calculate starting X position to center the counters
    let startX = playAreaX + playAreaWidth / 2 - (Math.min(maxCountersPerRow, displayCount) * circleSpacing) / 2;
    
    // Draw move history circles
    for (let i = 0; i < displayCount; i++) {
      // Calculate row and position within row
      const row = Math.floor(i / maxCountersPerRow);
      const posInRow = i % maxCountersPerRow;
      
      // Calculate x and y positions
      const x = startX + posInRow * circleSpacing;
      const y = startY + (row * rowSpacing); // New rows appear below previous rows
      
      // Check if this is an Easter Egg counter
      if (typeof filteredMoveHistory[i] === 'object' && 
          (filteredMoveHistory[i].type === 'egg' || filteredMoveHistory[i].type === 'easterEgg')) {
        // Draw Easter Egg counter (nested oval and circle)
        // Outer white oval
        fill(255);
        stroke(0);
        strokeWeight(2); // Increased to 2px
        ellipse(x, y, circleSize * 1.1, circleSize * 1.5); // Vertical oval shape
        
        // Inner yellow circle
        fill(COLORS.tertiary); // Use the game's yellow color
        stroke(0);
        strokeWeight(1);
        circle(x, y, circleSize * 0.8);
        strokeWeight(1);
      } else {
        // Regular counter
        let moveColor = filteredMoveHistory[i];
        
        // Draw regular counter with 2px black outline
        fill(moveColor);
        stroke(0);
        strokeWeight(2); // Increased to 2px
        circle(x, y, circleSize);
      }
    }
    
    // Restore the drawing context
    pop();
  }
  
  // Draw combo counter showing progress toward completing all combinations - APlasker
  function drawComboCounter() {
    // Isolate drawing context for combo counter
    push();
    
    // Position to the left of move history
    const counterY = playAreaY + playAreaHeight * 0.92;
    const circleSize = 18;
    const circleSpacing = 25;
    const labelOffset = 20; // Reduced space for "Combos:" text to make it closer to circles
    
    // Get the total number of possible combinations (including final combination)
    const totalCombos = intermediate_combinations.length + 1; // +1 for final recipe - APlasker
    
    // Calculate starting position (from right side toward center)
    const startX = playAreaX + playAreaWidth * 0.25;
    
    // Draw "Combos:" label - match hint button text style
    fill('black');
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(14); // Match size with hint button
    textStyle(BOLD);
    text("Combos:", startX - 5, counterY); // Moved closer to circles
    
    // Draw combo circles
    for (let i = 0; i < totalCombos; i++) {
      const x = startX + (i * circleSpacing) + labelOffset;
      const y = counterY;
      
      // Get completed vessels count
      const completedCount = completedGreenVessels.length;
      
      // Instead of checking specific combos, just fill in from left to right - APlasker
      const isCompleted = i < completedCount;
      
      if (isCompleted) {
        // Check if this combo was completed with a hint - APlasker
        const isHintCombo = completedGreenVessels[i] && completedGreenVessels[i].isHint;
        
        // Completed combo: 100% opacity circle with white checkmark
        // Use hint color (red) if completed with hint, otherwise green
        fill(isHintCombo ? COLORS.vesselHint : COLORS.green);
        stroke('black');
        strokeWeight(2);
        circle(x, y, circleSize * 1.2);
        
        // Draw white checkmark
        stroke('white');
        strokeWeight(3);
        line(x - circleSize * 0.3, y, x - circleSize * 0.1, y + circleSize * 0.3);
        line(x - circleSize * 0.1, y + circleSize * 0.3, x + circleSize * 0.4, y - circleSize * 0.3);
      } else {
        // Incomplete combo: 50% opacity green circle
        fill(COLORS.green + '80'); // Add 80 for 50% opacity in hex
        stroke('black');
        strokeWeight(1.5);
        circle(x, y, circleSize);
      }
    }
    
    // Restore the drawing context
    pop();
  }
  // Helper function to draw a star with very rounded points (cartoonish style)
  function starWithRoundedPoints(x, y, radius1, radius2, npoints, roundness) {
    // Create points for the star
    let points = [];
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    
    for (let a = 0; a < TWO_PI; a += angle) {
      // Outer point
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      points.push({x: sx, y: sy});
      
      // Inner point
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      points.push({x: sx, y: sy});
    }
    
    // Draw the rounded star using curves with much higher roundness
    beginShape();
    for (let i = 0; i < points.length; i++) {
      let p1 = points[i];
      let p2 = points[(i + 1) % points.length];
      
      // Calculate control points for the curve
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = sqrt(dx * dx + dy * dy);
      
      // Use much higher roundness for cartoonish look - at least 40% of the distance
      let r = min(roundness * 2.5, dist * 0.4);
      
      // Calculate direction vector
      let nx = dx / dist;
      let ny = dy / dist;
      
      // Calculate curve control points
      let cp1x = p1.x + nx * r;
      let cp1y = p1.y + ny * r;
      let cp2x = p2.x - nx * r;
      let cp2y = p2.y - ny * r;
      
      // If this is the first point, use vertex instead of bezierVertex
      if (i === 0) {
        vertex(p1.x, p1.y);
      }
      
      bezierVertex(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    endShape(CLOSE);
  }
  
  // Combined function to draw both combo counter and move history in a single row - APlasker
  function drawGameCounters() {
    // Isolate drawing context for game counters
    push();
    
    // Position counters lower in the play area - move up by 5% of screen height
    const counterY = playAreaY + playAreaHeight * 0.87; // Moved up from 0.92 (5% of play area height)
    
    // Center of the play area for overall positioning
    const centerX = playAreaX + playAreaWidth / 2;
    
    // Get the total number of possible combinations (including final combination)
    const totalCombos = intermediate_combinations.length + 1;
    
    // --- WRONGO COUNTER SECTION ---
    const totalErrorSlots = 4; // Show 4 slots for wrongos - APlasker
    
    // Filter moveHistory to only include error markers (black only) - APlasker
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333');
    
    // Limit the number of counters to display
    const displayCount = Math.min(filteredMoveHistory.length, totalErrorSlots);
    
    // --- CALCULATE RESPONSIVE SIZING BASED ON AVAILABLE SPACE - APlasker ---
    // Use playAreaWidth to calculate responsive sizes
    // First determine the maximum possible size based on container width and element count
    
    // Calculate minimum width needed for all elements with default spacing
    const minLabelWidth = Math.max(playAreaWidth * 0.04, 50); // Min 50px for label width
    const minDividerWidth = Math.max(playAreaWidth * 0.025, 30); // Min 30px for divider
    const minWrongoLabelWidth = Math.max(playAreaWidth * 0.06, 70); // Increased from 0.05/60px to prevent overlap
    
    // Calculate available width for circles
    const labelsAndDividerWidth = minLabelWidth + minDividerWidth + minWrongoLabelWidth;
    const availableWidthForCircles = playAreaWidth * 0.95 - labelsAndDividerWidth; // Use 95% of play area width
    
    // Calculate how many circles we need to fit (combo counters + error slots)
    const totalCircles = totalCombos + totalErrorSlots;
    
    // Calculate responsive circle size and spacing based on available width
    // Maximum circle size is 30px, minimum is 15px
    const circleSize = Math.min(Math.max(availableWidthForCircles / (totalCircles * 1.4), 15), 30);
    
    // Circle spacing is 1.4x circle size
    const comboSpacing = circleSize * 1.4;
    const errorSpacing = comboSpacing;
    
    // Scale label widths based on available space
    const labelWidth = Math.max(minLabelWidth, playAreaWidth * 0.05);
    const wrongoLabelWidth = Math.max(minWrongoLabelWidth, playAreaWidth * 0.07); // Increased from 0.06 to create more space
    const dividerWidth = minDividerWidth;
    
    // Calculate total width needed for combo counters
    const comboWidth = (totalCombos * comboSpacing) + labelWidth;
    
    // Calculate width needed for wrongo counters
    const errorWidth = (totalErrorSlots * errorSpacing) + wrongoLabelWidth;
    
    // Calculate starting positions to center the entire counter display
    const totalWidth = comboWidth + dividerWidth + errorWidth;
    const startX = centerX - (totalWidth / 2);
    
    // --- RESET ALL TEXT PROPERTIES FOR CONSISTENCY - APlasker ---
    textFont(bodyFont);
    textStyle(NORMAL);
    
    // --- DRAW COMBO COUNTERS ---
    // Draw "Combos:" label
    fill('black');
    noStroke();
    textAlign(RIGHT, CENTER);
    textSize(Math.max(circleSize * 0.5, 12)); // Relative text size based on circle size, min 12px
    textStyle(BOLD);
    const comboLabelX = startX + labelWidth; // Position for "Combos:" text
    text("Combos:", comboLabelX, counterY);
    
    // Create an array of combo information objects with ingredient counts
    const comboInfo = [];
    
    // Add intermediate combinations
    for (let i = 0; i < intermediate_combinations.length; i++) {
      // Check how many of the required ingredients are base ingredients
      const combo = intermediate_combinations[i];
      
      // Calculate if this is a base-ingredients-only combo
      const isBaseIngredientsOnly = !combo.required.some(ing => 
        intermediate_combinations.some(ic => ic.name === ing));
      
      // Count base ingredients in this combo
      const baseIngredientCount = combo.required.filter(ing => 
        !intermediate_combinations.some(ic => ic.name === ing)).length;
      
      // Calculate base ingredient percentage
      const baseIngredientPercentage = baseIngredientCount / combo.required.length;
      
      comboInfo.push({
        name: combo.name,
        requiredCount: combo.required.length,
        isCompleted: completedGreenVessels.some(v => v.name === combo.name),
        isHint: completedGreenVessels.some(v => v.name === combo.name && v.isHint),
        isBaseIngredientsOnly,
        baseIngredientCount,
        baseIngredientPercentage
      });
    }
    
    // Add final combination
    comboInfo.push({
      name: final_combination.name,
      requiredCount: final_combination.required.length,
      isCompleted: completedGreenVessels.some(v => v.name === final_combination.name),
      isHint: completedGreenVessels.some(v => v.name === final_combination.name && v.isHint),
      isBaseIngredientsOnly: false,
      baseIngredientCount: 0,
      baseIngredientPercentage: 0,
      isFinalCombo: true
    });
    
    // --- IMPLEMENT SORTING LOGIC FOR COMBOS - APlasker ---
    // Step 1: Sort base ingredient combinations (furthest left, highest ingredient count leftmost)
    // Step 2: Sort other combinations (to the right, highest percentage of base ingredients rightmost)
    // Step 3: Ensure final combo is all the way on the right
    
    comboInfo.sort((a, b) => {
      // Final combo always goes last (furthest right)
      if (a.isFinalCombo) return 1;
      if (b.isFinalCombo) return -1;
      
      // Sort base-ingredients-only combos to the left (instead of right)
      if (a.isBaseIngredientsOnly && !b.isBaseIngredientsOnly) return -1;
      if (!a.isBaseIngredientsOnly && b.isBaseIngredientsOnly) return 1;
      
      // For base-ingredients-only combos, sort by ingredient count (highest count leftmost)
      if (a.isBaseIngredientsOnly && b.isBaseIngredientsOnly) {
        return b.requiredCount - a.requiredCount;
      }
      
      // For other combos, sort by percentage of base ingredients (highest percentage rightmost)
      return a.baseIngredientPercentage - b.baseIngredientPercentage;
    });
    
    // Draw combo circles with ingredient counts or checkmarks
    for (let i = 0; i < comboInfo.length; i++) {
      const x = comboLabelX + 15 + (i * comboSpacing);
      const y = counterY;
      
      // Get combo information
      const combo = comboInfo[i];
      
      if (combo.isCompleted) {
        // Completed combo: 100% opacity circle with white checkmark
        fill(combo.isHint ? COLORS.vesselHint : COLORS.green);
        stroke('black');
        strokeWeight(1.5);
        circle(x, y, circleSize);
        
        // Draw white checkmark (scaled relative to circle size)
        stroke('white');
        strokeWeight(Math.max(circleSize * 0.1, 2)); // Relative stroke weight, min 2px
        line(x - circleSize * 0.3, y, x - circleSize * 0.1, y + circleSize * 0.3);
        line(x - circleSize * 0.1, y + circleSize * 0.3, x + circleSize * 0.4, y - circleSize * 0.3);
      } else {
        // Check if this is a partial combination
        const isPartial = partialCombinations.includes(combo.name);
        
        // Check if this is the hinted combination
        const isHinted = hintedCombo === combo.name;
        
        // Determine the appropriate fill color:
        // 1. Red for hinted combinations (highest priority)
        // 2. Yellow for partial combinations
        // 3. Semi-transparent green for others
        let fillColor;
        if (isHinted) {
          fillColor = COLORS.vesselHint; // Red for hinted combinations
        } else if (isPartial) {
          fillColor = COLORS.vesselYellow; // Yellow for partial combinations
        } else {
          fillColor = COLORS.green + '80'; // 50% opacity green for others
        }
        
        // Use yellow for partial combinations, semi-transparent green for others
        fill(fillColor);
        stroke('black');
        strokeWeight(1);
        circle(x, y, circleSize);
        
        // Draw ingredient count
        fill('white');
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(Math.max(circleSize * 0.8, 14)); // Increased from 0.5 to 0.8 (80% of circle size), minimum 14px
        textStyle(BOLD);
        // Add a small vertical offset (approx 5% of circle size) to visually center the text
        const textOffsetY = circleSize * 0.05; // Reduced from 0.1 to 0.05 (split the difference)
        text(combo.requiredCount, x, y + textOffsetY);
      }
    }
    
    // --- DRAW DIVIDER ---
    const dividerX = startX + comboWidth + (dividerWidth / 2);
    fill('black');
    noStroke();
    textAlign(CENTER, CENTER);
    // Increase emoji size to better match counter size
    textSize(Math.max(circleSize * 0.8, 16)); // Increased from 0.6 to 0.8 for larger emoji, min 16px
    textStyle(NORMAL); // Reset text style for divider - APlasker
    text("🍴", dividerX, counterY);
    
    // --- DRAW WRONGO COUNTERS ---
    // Reset text properties before drawing wrongo counters - APlasker
    textFont(bodyFont);
    textSize(Math.max(circleSize * 0.5, 12)); // Relative text size, min 12px
    textStyle(BOLD);
    
    // Draw "Wrongos:" label -- now called "Mistakes:"
    textAlign(LEFT, CENTER);
    const errorLabelX = dividerX + (dividerWidth / 2);
    text("Mistakes:", errorLabelX, counterY);
    
    // Draw error circles - both filled and empty placeholders
    for (let i = 0; i < totalErrorSlots; i++) {
      // Fixed spacing using the wider wrongoLabelWidth to prevent overlap - APlasker
      const x = errorLabelX + wrongoLabelWidth + (i * errorSpacing);
      const y = counterY;
      
      if (i < displayCount) {
        // Filled error counter (black)
        fill('black');
        stroke('black');
        strokeWeight(1.5);
        circle(x, y, circleSize);
        
        // If there are 5+ wrongos, add red X's to wrongo counters - APlasker
        if (filteredMoveHistory.length >= 5) {
          stroke(COLORS.vesselHint); // Changed to burnt orange hint color - APlasker
          strokeWeight(Math.max(circleSize * 0.1, 2)); // Relative stroke weight, min 2px
          // Draw X with the same vertical adjustment as the combo numbers
          const offsetY = circleSize * 0.05; // Reduced from 0.1 to 0.05 (split the difference)
          line(x - circleSize/3, y - circleSize/3 + offsetY, x + circleSize/3, y + circleSize/3 + offsetY);
          line(x + circleSize/3, y - circleSize/3 + offsetY, x - circleSize/3, y + circleSize/3 + offsetY);
        }
      } else {
        // Empty error placeholder - 50% opacity black - APlasker
        fill('rgba(0, 0, 0, 0.5)');
        stroke('black');
        strokeWeight(1);
        circle(x, y, circleSize);
      }
    }
    
    // --- UPDATE HINT BUTTON POSITION TO APPEAR BELOW COUNTERS - APlasker ---
    if (hintButton) {
      // Position hint button below counters with more spacing from bottom of screen
      const newHintButtonY = counterY + circleSize + Math.max(playAreaHeight * 0.05, 30); // Increased from fixed 20px to 5% of play area height (min 30px)
      hintButton.y = newHintButtonY;
      
      // Update global hintButtonY variable for other references
      hintButtonY = newHintButtonY;
      // Also update initialHintButtonY for the HintVessel positioning
      initialHintButtonY = newHintButtonY;
      
      // Update hint button styling - make border black and text bold
      hintButton.borderColor = 'black'; // Add black border
      hintButton.textBold = true; // Make text bold
    }
    
    // Restore drawing context
    pop();
  }

  // Function to draw the floral pattern border
  function drawFloralBorder() {
    // Only draw the border if there's space around the play area
    if (windowWidth <= maxPlayWidth + 2 * playAreaPadding) return;
    
    // Draw flowers in a grid pattern only on the left and right sides of the play area
    const flowerSpacing = 40; // Spacing between flowers
    const petalSize = 6; // Size of flower petals
    const safetyMargin = flowerSpacing; // Add a safety margin to prevent overlap with play area
    
    // Calculate the available space on each side
    const leftSpace = playAreaX - safetyMargin;
    const rightSpace = windowWidth - (playAreaX + playAreaWidth + safetyMargin);
    
    // Find the center points of left and right spaces
    const leftCenterX = leftSpace / 2;
    const rightCenterX = playAreaX + playAreaWidth + safetyMargin + rightSpace / 2;
    
    // Calculate how many flowers we need to fill each side (including off-screen flowers)
    const leftFlowersNeeded = Math.ceil(leftSpace / flowerSpacing) + 2; // Add extra to ensure coverage
    const rightFlowersNeeded = Math.ceil(rightSpace / flowerSpacing) + 2;
    
    // Draw on the left side, starting from center and working outward
    for (let i = -Math.floor(leftFlowersNeeded/2); i <= Math.ceil(leftFlowersNeeded/2); i++) {
      const x = leftCenterX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen or too close to play area
      if (x < -flowerSpacing || x > leftSpace) continue;
      
      for (let y = flowerSpacing/2; y < height; y += flowerSpacing) {
        // Alternate between different colors for variety
        const colorIndex = (i + Math.floor(y/flowerSpacing)) % 3;
        if (colorIndex === 0) {
          drawFlower(x, y, petalSize, COLORS.primary);
        } else if (colorIndex === 1) {
          drawFlower(x, y, petalSize, COLORS.secondary);
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary);
        }
      }
    }
    
    // Draw on the right side, starting from center and working outward
    for (let i = -Math.floor(rightFlowersNeeded/2); i <= Math.ceil(rightFlowersNeeded/2); i++) {
      const x = rightCenterX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen or too close to play area
      if (x < playAreaX + playAreaWidth + safetyMargin || x > windowWidth + flowerSpacing) continue;
      
      for (let y = flowerSpacing/2; y < height; y += flowerSpacing) {
        // Alternate between different colors for variety
        const colorIndex = (i + Math.floor(y/flowerSpacing)) % 3;
        if (colorIndex === 0) {
          drawFlower(x, y, petalSize, COLORS.primary);
        } else if (colorIndex === 1) {
          drawFlower(x, y, petalSize, COLORS.secondary);
        } else {
          drawFlower(x, y, petalSize, COLORS.tertiary);
        }
      }
    }
  }

  // Function to draw top and bottom flower borders for narrow screens
  function drawTopBottomFlowers() {
    // Only draw these borders when the screen is too narrow for side flowers
    if (windowWidth > maxPlayWidth + 2 * playAreaPadding) return;
    
    // Settings for the flowers
    const flowerSpacing = 40;
    const smallerPetalSize = 5; // Slightly smaller flowers for the mobile version
    const safetyMargin = 10; // Reduced safety margin for edge positioning
    
    // Find the center point of the screen
    const centerX = width / 2;
    
    // Calculate how many flowers we need to fill the width (including off-screen flowers)
    const flowersNeeded = Math.ceil(width / flowerSpacing) + 2; // Add extra to ensure coverage
    
    // Calculate y positions for top and bottom rows
    // Position flowers at the very top with just enough space to not be cut off
    const topY = smallerPetalSize * 1.5; // Just enough space from the top edge
    // Position flowers at the very bottom with just enough space to not be cut off
    const bottomY = windowHeight - (smallerPetalSize * 1.5); // Just enough space from the bottom edge
    
    // Draw on the top edge of the screen
    // Start from center and work outward
    for (let i = -Math.floor(flowersNeeded/2); i <= Math.ceil(flowersNeeded/2); i++) {
      // Calculate the x position centered around the middle of the screen
      const x = centerX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen
      if (x < -flowerSpacing || x > width + flowerSpacing) continue;
      
      // Only draw if there's enough room (avoid drawing over play area)
      if (topY + smallerPetalSize * 2 < playAreaY) {
        const colorIndex = Math.abs(i) % 3; // Use absolute value for symmetry
        if (colorIndex === 0) {
          drawFlower(x, topY, smallerPetalSize, COLORS.primary); // Green
        } else if (colorIndex === 1) {
          drawFlower(x, topY, smallerPetalSize, COLORS.secondary); // Red/Orange
        } else {
          drawFlower(x, topY, smallerPetalSize, COLORS.tertiary); // Yellow
        }
      }
    }
    
    // Draw on the bottom edge of the screen
    // Start from center and work outward
    for (let i = -Math.floor(flowersNeeded/2); i <= Math.ceil(flowersNeeded/2); i++) {
      // Calculate the x position centered around the middle of the screen
      const x = centerX + i * flowerSpacing;
      // Skip if the flower would be completely off-screen
      if (x < -flowerSpacing || x > width + flowerSpacing) continue;
      
      // Only draw if there's enough room (avoid drawing over play area)
      if (bottomY - smallerPetalSize * 2 > playAreaY + playAreaHeight) {
        const colorIndex = Math.abs(i) % 3; // Use absolute value for symmetry
        if (colorIndex === 0) {
          drawFlower(x, bottomY, smallerPetalSize, COLORS.tertiary); // Yellow (different order from top)
        } else if (colorIndex === 1) {
          drawFlower(x, bottomY, smallerPetalSize, COLORS.primary); // Green
        } else {
          drawFlower(x, bottomY, smallerPetalSize, COLORS.secondary); // Red/Orange
        }
      }
    }
  }
  
  // Function to draw a single flower
  function drawFlower(x, y, petalSize, color) {
    // Set the flower color
    fill(color);
    noStroke();
    
    // Draw petals
    for (let i = 0; i < 6; i++) {
      let angle = i * PI / 3;
      let px = x + cos(angle) * petalSize * 1.5;
      let py = y + sin(angle) * petalSize * 1.5;
      ellipse(px, py, petalSize * 1.2, petalSize * 1.2);
    }
    
    // Draw center with a slightly different shade
    fill(255, 255, 255, 100); // Semi-transparent white for a highlight
    ellipse(x, y, petalSize, petalSize);
  }

  function draw() {
    // Set background color
    background(COLORS.background);
    
    // Draw floral pattern border if there's space
    drawFloralBorder();
    
    // Draw top and bottom flowers on narrow screens
    drawTopBottomFlowers();
    
    // Ensure no stroke for all text elements
    noStroke();
    
    // Check if we're still loading recipe data
    if (isLoadingRecipe) {
      // Draw loading screen
      textAlign(CENTER, CENTER);
      textSize(24);
      fill('#333');
      text("Loading today's recipe...", width/2, height/2);
      
      // Show current EST time for debugging
      textSize(14);
      const estTime = getCurrentESTTime();
      text(`Current time (EST): ${estTime}`, width/2, height/2 + 40);
      
      return;
    }
    
    // Check if there was an error loading recipe data
    if (loadingError) {
      textAlign(CENTER, CENTER);
      textSize(24);
      fill(255, 0, 0);
      text("Error loading recipe. Using default recipe.", width/2, height/2 - 30);
      textSize(16);
      text("Please check your internet connection and refresh the page.", width/2, height/2 + 10);
      
      // Display current time in EST for debugging
      textSize(14);
      const estTime = getCurrentESTTime();
      text(`Current time (EST): ${estTime}`, width/2, height/2 + 40);
      
      // After 3 seconds, continue with default recipe
      if (frameCount % 90 === 0) { // 3 seconds at 30fps (reduced from 180)
        loadingError = false;
        // Initialize the game with default recipe data
        initializeGame();
      }
      return;
    }
    
    // Check if we need to initialize the game after loading data
    if (vessels.length === 0) {
      initializeGame();
      return;
    }
    
    // Check if there's an active final animation
    let finalAnimationInProgress = false;
    let finalAnimationProgress = 0;
    
    for (let i = 0; i < animations.length; i++) {
      if (animations[i] instanceof FinalVerbAnimation && animations[i].active) {
        finalAnimationInProgress = true;
        finalAnimationProgress = animations[i].progress;
        break;
      }
    }
    
    // Only draw title when not in win state and no final animation is in progress
    if (!gameWon && !finalAnimationInProgress) {
      drawTitle();
      
      // Manage byline timers for active game
      if (gameStarted && !gameWon) {
        // Handle byline transitions
        if (bylineTransitionState === "fading-out") {
          // Reduce opacity gradually
          bylineOpacity = max(0, bylineOpacity - (255 / bylineFadeFrames));
          
          // When fully transparent, switch to changing state
          if (bylineOpacity <= 0) {
            bylineTransitionState = "changing";
          }
        }
        else if (bylineTransitionState === "changing") {
          // Update the message and immediately start fading in
          currentByline = nextByline;
          bylineTransitionState = "fading-in";
          bylineOpacity = 0;
          
          // Set the timer for how long to show this message
          bylineTimer = transitionDuration;
        }
        else if (bylineTransitionState === "fading-in") {
          // Increase opacity gradually
          bylineOpacity = min(255, bylineOpacity + (255 / bylineFadeFrames));
          
          // When fully visible, finish transition
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
            updateBylineWithTransition("Drag & drop to combine ingredients!");
          }
        }
        
        // Check for inactivity when not transitioning and not showing a temporary byline
        if (!isTransitioning && bylineTimer === 0) {
          // Calculate progressive inactivity threshold based on how many reminders have been shown
          // First reminder at 10s, then 20s, 30s, etc.
          const currentInactivityThreshold = baseInactivityThreshold * (inactivityReminderCount + 1);
          
          if (frameCount - lastAction > currentInactivityThreshold) {
            // Set hint byline with transition
            updateBylineWithTransition("Stuck? Use a Hint!", bylineHintDuration);
            // Update lastAction to prevent repeated triggers
            lastAction = frameCount;
            // Increment the reminder count for next time
            inactivityReminderCount++;
          }
        }
      }
    }
    
    if (!gameStarted) {
      // Draw start screen with animated demo
      drawStartScreen();
    } else if (gameWon) {
      // Draw win screen
      drawWinScreen();
    } else {
      // If there's a final animation in progress, don't show any transitional win screen
      // The transition will now only be handled by the tan circle and verb animation
      
      // Draw game screen
      // Update all vessels
      vessels.forEach(v => {
        v.update();
      });
      
      // Sort vessels by type to ensure advanced vessels are drawn first (behind basic vessels)
      let sortedVessels = [...vessels].sort((a, b) => {
        // Dragged vessel should always be drawn last (on top)
        if (a === draggedVessel) return 1;
        if (b === draggedVessel) return -1;
        
        // Existing sorting logic for advanced vs basic vessels
        if (a.isAdvanced && !b.isAdvanced) return -1;
        if (!a.isAdvanced && b.isAdvanced) return 1;
        return 0;
      });
      
      // Draw all vessels in sorted order - no fading, just show them until the animation is complete
      sortedVessels.forEach(v => {
        v.draw();
      });
      
      // Draw game counters (combo and error) - APlasker
      // This updates the hint button position, so call it BEFORE drawing the hint button
      drawGameCounters();
      
      // Check if only the final combination remains and disable hint button if so
      let onlyFinalComboRemains = isOnlyFinalComboRemaining();
      hintButton.disabled = onlyFinalComboRemains;
      
      // Check for auto final combination sequence
      if (onlyFinalComboRemains && !autoFinalCombinationStarted && !finalAnimationInProgress) {
        // Only start the auto sequence if there are at least 2 vessels
        // (otherwise there's nothing to auto-combine)
        if (vessels.length >= 2) {
          console.log("STARTING AUTO FINAL COMBINATION SEQUENCE");
          autoFinalCombination = true;
          autoFinalCombinationStarted = true;
          autoFinalCombinationTimer = 60; // Wait 1 second before starting the sequence
          // Initialize state machine
          autoFinalCombinationState = "WAITING";
          // Reset vessels array to ensure clean state
          finalCombinationVessels = [];
          // Disable user interaction during auto sequence
          draggedVessel = null;
        }
      }
      
      // Process auto final combination
      if (autoFinalCombination) {
        // Check for active verb animations
        const hasActiveVerbAnimation = animations.some(anim => 
          (anim instanceof VerbAnimation || anim instanceof FinalVerbAnimation) && anim.active);
          
        // Check for active vessel movement animations
        const hasActiveMovementAnimation = animations.some(anim => 
          anim instanceof VesselMovementAnimation && anim.active);
        
        // Only decrement the timer if there are no active animations that would affect timing
        if (autoFinalCombinationTimer > 0 && !hasActiveVerbAnimation && !hasActiveMovementAnimation) {
          autoFinalCombinationTimer--;
        } else if (autoFinalCombinationTimer <= 0 && !hasActiveVerbAnimation && !hasActiveMovementAnimation) {
          // Only trigger the next step in the sequence if there are no active animations
          processAutoFinalCombination();
        }
      }
      
      // Draw hint button or hint vessel
      if (showingHint && hintVessel) {
        hintVessel.update();
        hintVessel.draw();
      } else {
        // Draw the hint button
        hintButton.draw();
      }
      
      // Separate animations by type for proper layering
      let regularAnimations = [];
      let flowerAnimations = [];
      
      // Sort animations by type
      for (let i = 0; i < animations.length; i++) {
        if (animations[i] instanceof FlowerBurstAnimation) {
          flowerAnimations.push(animations[i]);
        } else {
          regularAnimations.push(animations[i]);
        }
      }
      
      // First draw regular animations (verb, combine, etc.)
      for (let i = regularAnimations.length - 1; i >= 0; i--) {
        regularAnimations[i].draw();
      }
      
      // Then draw flower animations on top (should be none, as they're now in persistentFlowerAnimation)
      for (let i = flowerAnimations.length - 1; i >= 0; i--) {
        flowerAnimations[i].draw();
      }
      
      // Draw the persistent flower animation if it exists
      if (persistentFlowerAnimation && persistentFlowerAnimation.active) {
        persistentFlowerAnimation.draw();
      }
      
      // Update all animations
      for (let i = animations.length - 1; i >= 0; i--) {
        if (animations[i].update()) {
          animations.splice(i, 1);
        }
      }
      
      // Update persistent flower animation separately - don't remove it when it's complete
      if (persistentFlowerAnimation) {
        persistentFlowerAnimation.update();
      }
    }
    
    // Draw any active easter egg modals
    for (let i = 0; i < eggModals.length; i++) {
      if (eggModals[i].active) {
        eggModals[i].draw();
      }
    }
    
    // Update cursor if hovering over a vessel or button
    updateCursor();
    
    // Draw the help icon if in gameplay state
    if (gameStarted && !gameWon) {
      drawHelpIcon();
    }
    
    // Draw help modal if active
    if (helpModal && helpModal.active) {
      helpModal.draw();
    }
    
    // Draw the dragged vessel at the very end to ensure it's on top of everything
    if (draggedVessel && gameStarted && !gameWon) {
      draggedVessel.draw();
    }
  }
  
  function drawTitle() {
    // Set text properties
    textAlign(CENTER, CENTER);
    
    // Calculate title size relative to play area width
    const titleSize = Math.max(playAreaWidth * 0.055, 30); // 5.5% of play area width, min 30px
    textSize(titleSize);
    
    // Use a bold sans-serif font
    textStyle(BOLD);
    textFont('Arial, Helvetica, sans-serif');
    
    // Title text
    const title = "COMBO MEAL";
    
    // Calculate the total width of the title to center each letter
    let totalWidth = 0;
    let letterWidths = [];
    
    // First calculate individual letter widths
    for (let i = 0; i < title.length; i++) {
      let letterWidth = textWidth(title[i]);
      letterWidths.push(letterWidth);
      totalWidth += letterWidth;
    }
    
    // Add kerning (50% increase in spacing)
    const kerningFactor = 0.5; // 50% extra space
    let totalKerning = 0;
    
    // Calculate total kerning space (only between letters, not at the ends)
    for (let i = 0; i < title.length - 1; i++) {
      totalKerning += letterWidths[i] * kerningFactor;
    }
    
    // Starting x position (centered with kerning)
    let x = playAreaX + playAreaWidth/2 - (totalWidth + totalKerning)/2;
    
    // Bubble Pop effect parameters
    const outlineWeight = 2; // Thinner outline for bubble style
    const bounceAmount = 2 * Math.sin(frameCount * 0.05); // Subtle bounce animation
    
    // Draw each letter with alternating colors
    for (let i = 0; i < title.length; i++) {
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
      let letterY = playAreaY + 40 + offsetY;
      
      // Draw black outline - thinner for bubble style
      fill('black');
      noStroke();
      
      // Draw the letter with a thinner outline
      text(title[i], letterX - outlineWeight, letterY); // Left
      text(title[i], letterX + outlineWeight, letterY); // Right
      text(title[i], letterX, letterY - outlineWeight); // Top
      text(title[i], letterX, letterY + outlineWeight); // Bottom
      text(title[i], letterX - outlineWeight, letterY - outlineWeight); // Top-left
      text(title[i], letterX + outlineWeight, letterY - outlineWeight); // Top-right
      text(title[i], letterX - outlineWeight, letterY + outlineWeight); // Bottom-left
      text(title[i], letterX + outlineWeight, letterY + outlineWeight); // Bottom-right
      
      // Draw letter fill with color
      fill(letterColor);
      text(title[i], letterX, letterY);
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    
    // Reset text style
    textStyle(NORMAL);
    
    // Draw the byline
    drawByline();
  }
  
  // Function to draw the byline - APlasker
  function drawByline() {
    // Only draw byline on game screen (not tutorial or win screens)
    if (!gameStarted || gameWon) return;
    
    // Position byline below the title
    const bylineY = playAreaY + 70; // Position below title
    
    // Calculate byline size based on play area dimensions - match tutorial text
    const bylineSize = Math.max(playAreaWidth * 0.035, 14); // Same as description size in tutorial
    
    // Style the byline text to match tutorial style
    textAlign(CENTER, CENTER);
    textSize(bylineSize);
    textStyle(BOLD); // Match the tutorial "Decode the dish..." text style
    textFont('Arial, Helvetica, sans-serif');
    
    // Apply appropriate opacity based on transition state
    fill(51, 51, 51, bylineOpacity); // #333 with alpha
    
    // Always draw the current message with current opacity
    text(currentByline, playAreaX + playAreaWidth/2, bylineY);
    
    // Reset text style
    textStyle(NORMAL);
  }
  
  function drawStartScreen() {
    // Isolate drawing context for start screen
    push();
    
    // Calculate header and description sizes based on play area dimensions
    const headerSize = Math.max(playAreaWidth * 0.07, 20); // Increased from 0.055 to 0.07, min 20px
    const descriptionSize = Math.max(playAreaWidth * 0.035, 14); // Increased from 0.028 to 0.035, min 14px
    
    // Calculate a maximum width for tutorial text that ensures it fits within the play area
    const maxTutorialTextWidth = min(playAreaWidth * 0.85, 300);
    const titleTextWidth = min(playAreaWidth * 0.9, 320); // 90% width for title text
    
    // Apply correction factor to compensate for rightward shift
    // This compensates for the 25% rightward offset observed in the tutorial text
    const xCorrectionFactor = playAreaWidth * 0.37; // 25% of play area width
    const correctedCenterX = playAreaX + playAreaWidth/2 - xCorrectionFactor;
    
    // Set default text properties for consistent rendering
    textFont(bodyFont);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    
    // Draw main instruction with same size as other text but bold
    textSize(descriptionSize);
    textStyle(BOLD);
    textWrap(WORD);
    fill('#333');
    text("Decode the dish by assembling all ingredients into recipe-based combos!", 
         correctedCenterX, playAreaY + playAreaHeight * 0.11, titleTextWidth);
    
    // Reset text style to normal for other text
    textStyle(NORMAL);
    
    // Updated first instruction - increased space from title text
    textSize(descriptionSize);
    textWrap(WORD);
    text("Drag & drop to combine ingredients into new components.", 
         correctedCenterX, playAreaY + playAreaHeight * 0.20, maxTutorialTextWidth);
    
    // First equation - adjust vertical position to accommodate larger vessels
    drawTutorialEquation(1, "Grapes", "white", "Sugar", "white", "Jelly", "green", 
                        "", // Empty description as we're using the text above
                        playAreaY + playAreaHeight * 0.28, false, descriptionSize);
    
    // Updated second instruction with non-breaking space - adjust vertical position
    textSize(descriptionSize);
    text("Yellow combos are partially complete. Add\u00A0more!", 
         correctedCenterX, playAreaY + playAreaHeight * 0.38, maxTutorialTextWidth);
    
    // Second equation - adjust vertical position to accommodate larger vessels
    drawTutorialEquation(2, "Jelly", "green", "Peanut Butter", "white", "Jelly + Peanut Butter", "yellow", 
                        "", // Empty description
                        playAreaY + playAreaHeight * 0.46, false, descriptionSize);
    
    // Third instruction - adjust vertical position
    textSize(descriptionSize);
    text("Complete the recipe with the fewest mistakes to make the grade.", 
         correctedCenterX, playAreaY + playAreaHeight * 0.56, maxTutorialTextWidth);
    
    // Third equation - adjust vertical position to accommodate larger vessels
    drawTutorialEquation(3, "Jelly + Peanut Butter", "yellow", "Potato Bread", "green", "PB&J Sandwich", "green", 
                        "", // Empty description
                        playAreaY + playAreaHeight * 0.64, true, descriptionSize);
    
    // Final instruction - changed text and made bold - adjust vertical position
    textSize(descriptionSize);
    textStyle(BOLD);
    text("New Recipe Daily", 
         correctedCenterX, playAreaY + playAreaHeight * 0.76, maxTutorialTextWidth);
    
    // Reset text style to normal
    textStyle(NORMAL);
    
    // Calculate button sizes relative to play area
    const buttonWidth = Math.max(playAreaWidth * 0.3, 120);
    const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
    
    // Update start button dimensions
    startButton.w = buttonWidth;
    startButton.h = buttonHeight;
    
    // Position start button relative to play area - move down to accommodate larger vessels
    startButton.x = playAreaX + playAreaWidth/2;
    startButton.y = playAreaY + playAreaHeight * 0.88;
    startButton.draw();
    startButton.checkHover(mouseX, mouseY);
    
    // Draw version number and Say hi link at the very bottom - use the original center X position
    push();
    const versionTextSize = Math.max(playAreaWidth * 0.016, 8); // 1.6% of width, min 8px
    textSize(versionTextSize);
    fill(100, 100, 100, 180); // Semi-transparent gray
    
    // Calculate the width of the version text and separator
    const versionText = "v0.0605.1345 - APlasker";
    const separatorText = " | ";
    const sayHiText = "Say hi!";
    
    const versionWidth = textWidth(versionText);
    const separatorWidth = textWidth(separatorText);
    const sayHiWidth = textWidth(sayHiText);
    
    const totalWidth = versionWidth + separatorWidth + sayHiWidth;
    const startX = playAreaX + playAreaWidth/2 - totalWidth/2;
    
    // Draw version number
    text(versionText, startX + versionWidth/2, playAreaY + playAreaHeight - 10);
    
    // Draw separator
    text(separatorText, startX + versionWidth + separatorWidth/2, playAreaY + playAreaHeight - 10);
    
    // Draw Say hi link (in green)
    fill(COLORS.primary); // Green color for the link
    text(sayHiText, startX + versionWidth + separatorWidth + sayHiWidth/2, playAreaY + playAreaHeight - 10);
    
    // Store position and dimensions of Say hi link for hit detection
    tutorialSayHiLinkX = startX + versionWidth + separatorWidth + sayHiWidth/2;
    tutorialSayHiLinkY = playAreaY + playAreaHeight - 10;
    tutorialSayHiLinkWidth = sayHiWidth * 1.2; // Add some padding
    tutorialSayHiLinkHeight = textAscent() + textDescent();
    
    pop();
    
    // Restore drawing context
    pop();
  }
  
  // Function to draw tutorial equations
  function drawTutorialEquation(equationNum, leftName, leftColor, rightName, rightColor, resultName, resultColor, description, yPosition, showStarburst = false, descriptionSize = 16) {
    // Isolate drawing context for the tutorial equation
    push();
    
    // Explicitly set all context properties for consistent behavior
    textAlign(CENTER, CENTER);
    textFont(bodyFont);
    textStyle(NORMAL);
    rectMode(CENTER); // Ensure rectMode is CENTER for vessel positioning
    
    // Calculate vessel sizes based on play area dimensions with minimum sizes
    // Double the size of vessels compared to previous implementation
    const vesselWidth = Math.max(playAreaWidth * 0.34, 120); // Doubled from 0.17/60 to 0.34/120
    const vesselHeight = vesselWidth * 0.6; // Maintain aspect ratio
    
    // Calculate operator size relative to play area with minimum size
    // Increase operator size to match larger vessels
    const operatorSize = Math.max(playAreaWidth * 0.06, 24); // Increased from 0.04/16 to 0.06/24
    
    // Dynamic description text size based on play area width
    // Increase description text size to match larger vessels
    const descriptionFontSize = Math.max(playAreaWidth * 0.03, 18); // Increased from 0.022/14 to 0.03/18
    
    // Calculate positions relative to play area, but spread them out more for larger vessels
    // Keep the same proportional positioning, but with more space between vessels
    const leftX = playAreaX + playAreaWidth * 0.2; // Moved from 0.25 to 0.2
    const rightX = playAreaX + playAreaWidth * 0.5; // Keep at center
    const resultX = playAreaX + playAreaWidth * 0.8; // Moved from 0.75 to 0.8
    
    // Operator positions
    const operatorX1 = (leftX + rightX) / 2;
    const operatorX2 = (rightX + resultX) / 2;
    
    // Adjust y position for green vessels (raise them slightly)
    let adjustedY = yPosition;
    if (leftColor === "green" || rightColor === "green" || resultColor === "green") {
        adjustedY = yPosition - vesselHeight * 0.15; // 15% of vessel height instead of fixed 12px
    }
    
    // Create tutorial vessels using the new createTutorialVessel function
    const leftVessel = createTutorialVessel(leftName, leftColor, leftX, adjustedY, vesselWidth, vesselHeight);
    const rightVessel = createTutorialVessel(rightName, rightColor, rightX, adjustedY, vesselWidth, vesselHeight);
    const resultVessel = createTutorialVessel(resultName, resultColor, resultX, adjustedY, vesselWidth, vesselHeight);
    
    // Draw starburst behind the result vessel if requested
    if (showStarburst) {
      // Double the size of the starburst to match larger vessels
      drawStarburst(resultX, adjustedY, true);
    }
    
    // Draw the vessels
    leftVessel.draw();
    
    // Draw plus sign between vessels
    push();
    textAlign(CENTER, CENTER);
    textSize(operatorSize);
    fill('#333');
    noStroke();
    text("+", operatorX1, adjustedY);
    pop();
    
    // Draw right vessel
    rightVessel.draw();
    
    // Draw equals sign
    push();
    textAlign(CENTER, CENTER);
    textSize(operatorSize);
    fill('#333');
    noStroke();
    text("=", operatorX2, adjustedY);
    pop();
    
    // Draw result vessel
    resultVessel.draw();
    
    // Draw description text below the equation if provided
    if (description && description.trim() !== "") {
      push();
      fill('#333');
      textAlign(CENTER, CENTER);
      textSize(descriptionFontSize);
      textStyle(NORMAL);
      // Position description further below the equation to account for larger vessels
      text(description, playAreaX + playAreaWidth/2, yPosition + vesselHeight * 0.9);
      pop();
    }
    
    // Restore drawing context
    pop();
  }
  
  // We can keep the original drawTutorialVessel function for reference or remove it
  // if we're confident the new approach works perfectly

  // New function to draw starburst behind final vessel
  function drawStarburst(x, y, doubleSize = false) {
    push();
    translate(x, y);
    
    // Draw subtle yellow starburst
    fill(COLORS.tertiary + '80'); // Mustard yellow with 50% opacity
    noStroke();
    
    // Calculate star size based on play area dimensions
    // If doubleSize is true, make the starburst twice as large
    const sizeMultiplier = doubleSize ? 2 : 1;
    const outerRadius = Math.max(playAreaWidth * 0.09 * sizeMultiplier, 55 * sizeMultiplier); // 9% of play area width, min 55px
    const innerRadius = outerRadius * 0.7; // Inner radius 70% of outer radius
    
    // Draw an 8-point star
    beginShape();
    for (let i = 0; i < 16; i++) {
      let radius = i % 2 === 0 ? outerRadius : innerRadius;
      let angle = TWO_PI * i / 16 - PI/16;
      let px = cos(angle) * radius;
      let py = sin(angle) * radius;
      vertex(px, py);
    }
    endShape(CLOSE);
    
    pop();
  }
  
  