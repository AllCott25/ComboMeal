// Enhanced move history display for win screen
// Last Updated: July 10, 2025 (11:15 AM EDT) by APlasker - Converted from magic link to email/password authentication.

// Function to format time as MM:SS - APlasker
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Layout configuration for different recipe sizes
const LAYOUT = {
  small: {
    titlePosition: 0.08,      // 8% from top
    bylinePosition: 0.13,     // 13% from top (adjusted to match title drop)
    vesselsStart: 0.23,       // 23% from top (increased from 20%)
    mistakeCounter: 0.70,     // 70% from top
    recipeCard: 0.85,         // 85% from top
    vesselMarginMultiplier: 1.2 // 20% more vertical space between vessels
  },
  big: {
    titlePosition: 0.06,      // 6% from top (shifted up 2% total)
    bylinePosition: 0.11,     // 11% from top (shifted up 2% total)
    vesselsStart: 0.205,      // 20.5% from top (shifted up 2.5% total)
    mistakeCounter: 0.76,    // Adjusted from 0.77 to be more centered in the gap for big layout
    recipeCard: 0.905,        // 90.5% from top (maintained)
    vesselMarginMultiplier: 1.0 // Standard vessel spacing
  }
};

// Global variable to store current layout type
let currentLayoutType = 'big'; // Default to big layout

// Helper function to get current layout settings
function getCurrentLayout() {
  return LAYOUT[currentLayoutType];
}

// Declare the firstInactivityMessageShown variable as external reference - APlasker
// This is defined in sketch.js but referenced here
let firstInactivityMessageShown = false;
  
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
        // Outer white oval using design system
        fill(255);
        DesignSystem.applyStroke('standard', UI_COLORS.text);
        ellipse(x, y, circleSize * 1.1, circleSize * 1.5);
        
        // Inner yellow circle using design system
        fill(COLORS.tertiary);
        DesignSystem.applyStroke('light', UI_COLORS.text);
        circle(x, y, circleSize * 0.8);
        strokeWeight(1);
      } else {
        // Regular counter
        let moveColor = filteredMoveHistory[i];
        
        // Draw regular counter with standardized outline
        fill(moveColor);
        DesignSystem.applyStroke('standard', UI_COLORS.text);
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
        
        // Completed combo using design system
        fill(isHintCombo ? COLORS.vesselHint : COLORS.green);
        DesignSystem.applyStroke('standard', UI_COLORS.text);
        circle(x, y, circleSize * 1.2);
        
        // Draw white checkmark using design system
        DesignSystem.applyStroke('emphasis', '#ffffff');
        line(x - circleSize * 0.3, y, x - circleSize * 0.1, y + circleSize * 0.3);
        line(x - circleSize * 0.1, y + circleSize * 0.3, x + circleSize * 0.4, y - circleSize * 0.3);
      } else {
        // Incomplete combo using design system
        fill(COLORS.green + '80'); // 50% opacity
        DesignSystem.applyStroke('light', UI_COLORS.text);
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
  
  // Add a global variable to store the calculated smallest font size
  let recipeCardFontSize = null; 
  
  // Combined function to draw combo counter only - APlasker
  function drawGameCounters() {
    // Isolate drawing context for game counters
    push();
    
      // Position recipe card based on layout type
  const counterY = playAreaY + playAreaHeight * getCurrentLayout().recipeCard;
    
    // Position card horizontally at the center of the screen
    const centerX = playAreaX + playAreaWidth / 2;
    
    // Get the total number of possible combinations (including final combination)
    const totalCombos = intermediate_combinations.length + 1;
    
    // --- CALCULATE RESPONSIVE SIZING BASED ON AVAILABLE SPACE - APlasker ---
    // Use playAreaWidth to calculate responsive sizes
    
    // Calculate card dimensions with responsive layout
    const cardPadding = Math.max(playAreaWidth * 0.03, 15); // Padding inside card (3% of play area width, min 15px)
    const minCardWidth = 180; // Minimum width for recipe card
    const hintButtonWidthPercent = 0.25; // 25% of play area for hint button
    const gutterPercent = 0.05; // 5% gutter
    
    // Calculate available width for recipe card (remaining space after hint button and gutter)
    const standardCardWidth = playAreaWidth * (1 - hintButtonWidthPercent - gutterPercent); // Use remaining space
    const isNarrowScreen = standardCardWidth < minCardWidth;
    
    // Set card width based on screen size
    const cardWidth = isNarrowScreen ? 
        Math.max(playAreaWidth * 0.95, minCardWidth) : // Narrow screen: 95% width
        standardCardWidth; // Normal screen: use remaining space
    
    const cardHeight = playAreaHeight * 0.23; // 23% of play area height
    
    // Position card (adjusted horizontally for side-by-side layout)
    const cardX = isNarrowScreen ?
        centerX : // Centered on narrow screens
        playAreaX + (cardWidth / 2); // Align to left edge of play area
    const cardY = counterY;
    
    // Calculate margins for text (reduced to 3% for more text space)
    const textMarginPercent = 0.03; // 3% margin instead of 4%
    const textLeftMargin = cardX - cardWidth/2 + (cardWidth * textMarginPercent);
    const textRightMargin = cardX + cardWidth/2 - (cardWidth * textMarginPercent);
    
    // --- DRAW RECIPE CARD BACKGROUND ---
    // Draw card drop shadow
    rectMode(CENTER);
    fill(0, 0, 0, 30); // Translucent black shadow (30% opacity)
    noStroke();
    rect(cardX + 5, cardY + 5, cardWidth, cardHeight, max(cardWidth * 0.02, 8)); // 2% of card width, min 8px radius
    
    // Draw card background
    fill(255); // White background
    stroke(220); // Light gray border
    strokeWeight(1);
    rect(cardX, cardY, cardWidth, cardHeight, max(cardWidth * 0.02, 8)); // 2% of card width, min 8px radius
    
    // Draw flowers in the corners of the recipe card
    const flowerSize = max(cardWidth * 0.01, 2); // 1% of card width, min 2px
    const cornerOffset = cardWidth * 0.04; // 4% of card width
    
    // Draw flowers in each corner
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.primary); // Top-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.peach); // Top-right (was COLORS.secondary)
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.peach); // Bottom-left
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
    
    // Create an array of combo information objects with ingredient counts
    const comboInfo = [];
    
    // --- MOVE HINT BUTTON TO NEW POSITION ON TOP OF RECIPE CARD AND CHANGE TO CIRCLE ---
    if (hintButton) {
      // Calculate hint button dimensions based on screen size
      const hintButtonHeight = cardHeight; // Match recipe card height
      const hintButtonWidth = isNarrowScreen ?
          cardWidth : // Full width in narrow screen mode
          playAreaWidth * 0.25; // 25% of play area width in side-by-side mode
      
      // Position hint button based on layout
      const newHintButtonX = isNarrowScreen ?
          cardX : // Centered in narrow screen mode
          cardX + (cardWidth/2) + (playAreaWidth * 0.05) + (hintButtonWidth/2); // Side-by-side with 5% gutter
      
      const newHintButtonY = isNarrowScreen ?
          cardY + cardHeight + 10 : // Below card with 10px gap in narrow mode
          cardY; // Aligned with card in side-by-side mode
      
      // Update hint button position
      hintButton.x = newHintButtonX;
      hintButton.y = newHintButtonY;
    
      // Update hint button size
      hintButton.w = hintButtonWidth;
      hintButton.h = hintButtonHeight;
      // Ensure hint button remains a rounded rectangle
      hintButton.isCircular = false;
      
      // Set fixed corner radius of 12px
      hintButton.customCornerRadius = 12;
      
      // Use green color to match Cook button
      hintButton.color = COLORS.primary;
      hintButton.textColor = 'white';
      
      // Calculate text size for new button dimensions
      const verticalMargin = hintButtonHeight * 0.25; // 25% vertical margin for taller button
      const horizontalMargin = hintButtonWidth * 0.2; // 20% horizontal margin
      const availableHeight = hintButtonHeight - (verticalMargin * 2);
      const availableWidth = hintButtonWidth - (horizontalMargin * 2);
      
      // Set text size based on both width and height constraints
      textSize(availableHeight * 0.2); // Start with 20% of available height for larger button
      const widthBasedSize = (availableWidth / textWidth("Hint")) * (availableHeight * 0.2);
      const finalTextSize = Math.min(availableHeight * 0.2, widthBasedSize);
      
      // Convert to multiplier based on button height
      hintButton.textSizeMultiplier = finalTextSize / (hintButtonHeight * 0.3);
      
      // Update global hintButtonY variable for other references
      hintButtonY = newHintButtonY;
      // Also update initialHintButtonY for the HintVessel positioning
      initialHintButtonY = newHintButtonY;
    
      // Update hint button styling
      hintButton.borderColor = null; // Use default subtle border like Cook! button
      hintButton.textBold = true;

    }
    
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
        baseIngredientPercentage,
        isPartialCombo: partialCombinations.includes(combo.name) || startedCombinations.includes(combo.name) // Check both arrays - APlasker
      });
    }
    
    // Add final combination
    // Find base ingredients that are directly required in the final combination
    let finalBaseIngsCount = 0;
    
    // Modification by APlasker - count base ingredients in final combination
    // We'll examine the recipe_data structure to get the final base ingredients
    if (recipe_data && recipe_data.finalCombination) {
      // Get the combo_id from the final combination
      const finalComboId = recipe_data.finalCombination.combo_id;
      
      // Look for direct base ingredients in the supabase.js processed data
      if (typeof recipe_data._processingData !== 'undefined' && 
          recipe_data._processingData.ingredientsByCombo && 
          recipe_data._processingData.ingredientsByCombo[finalComboId]) {
        
        // Count how many of the ingredients are base ingredients
        finalBaseIngsCount = recipe_data._processingData.ingredientsByCombo[finalComboId]
          .filter(ing => ing.isBase).length;
          
      } else {
        // Fallback: Check if we have direct data about final base ingredients
        if (Array.isArray(recipe_data.finalBaseIngredients)) {
          finalBaseIngsCount = recipe_data.finalBaseIngredients.length;
        }
      }
    }
    
    // If we still can't find it, log a debug message and use a simpler approach
    if (finalBaseIngsCount === 0) {
      // Simple fallback: Count any base ingredients that aren't part of any intermediate combinations
      const allIntermediateIngredients = new Set();
      intermediate_combinations.forEach(combo => {
        combo.required.forEach(ing => allIntermediateIngredients.add(ing));
      });
      
      // Now count base ingredients not used in any intermediate combinations
      const unusedBaseIngredients = base_ingredients.filter(ing => !allIntermediateIngredients.has(ing));
      finalBaseIngsCount = unusedBaseIngredients.length;
      
      // Add debugging information if needed
      console.log("[APlasker Debug] Final combination counter using fallback method");
      console.log("[APlasker Debug] Estimated direct base ingredients:", finalBaseIngsCount);
    }
    
    // Calculate the total required count - include both combinations and direct base ingredients
    const totalFinalRequired = final_combination.required.length + finalBaseIngsCount;
    
    comboInfo.push({
      name: final_combination.name,
      requiredCount: totalFinalRequired, // Include both intermediate combinations and base ingredients
      isCompleted: completedGreenVessels.some(v => v.name === final_combination.name),
      isHint: completedGreenVessels.some(v => v.name === final_combination.name && v.isHint),
      isBaseIngredientsOnly: false,
      baseIngredientCount: finalBaseIngsCount, // Store the count of base ingredients
      baseIngredientPercentage: totalFinalRequired > 0 ? finalBaseIngsCount / totalFinalRequired : 0,
      isFinalCombo: true,
      isPartialCombo: partialCombinations.includes(final_combination.name) || startedCombinations.includes(final_combination.name) // Check both arrays - APlasker
    });
    
    // --- IMPLEMENT SORTING LOGIC FOR COMBOS - APlasker ---
    // Step 1: Sort base ingredient combinations (furthest left, highest ingredient count leftmost)
    // Step 2: Sort other combinations (to the right, highest percentage of base ingredients rightmost)
    // Step 3: Ensure final combo is all the way on the right
    
    // NEW PARENT-CHILD RELATIONSHIP LOGIC - APlasker - 2025-05-14
    // Create relationship maps to track which combos are used in other combos
    try {
      // Define relationship maps
      const comboRelationships = {}; // Parent → [children]
      const comboParents = {}; // Child → parent
      
      // Build the relationship maps
      intermediate_combinations.forEach(combo => {
        // For each combo, check its required ingredients
        combo.required.forEach(ingredient => {
          // Check if this ingredient is another combo (not a base ingredient)
          if (intermediate_combinations.some(ic => ic.name === ingredient)) {
            // This ingredient is a combo used in another combo
            if (!comboRelationships[combo.name]) {
              comboRelationships[combo.name] = [];
            }
            comboRelationships[combo.name].push(ingredient);
            
            // Also track the parent of each combo
            comboParents[ingredient] = combo.name;
          }
        });
      });
      
      // Add parent and child relationship data to comboInfo
      comboInfo.forEach(combo => {
        combo.children = comboRelationships[combo.name] || [];
        combo.parent = comboParents[combo.name] || null;
      });
      
      console.log("Built combo relationships:", {
        relationships: comboRelationships,
        parents: comboParents
      });
      
      // Keeping track of sibling groups (combos that share the same parent)
      const siblingGroups = {};
      
      // Group combos by their parent
      Object.keys(comboParents).forEach(child => {
        const parent = comboParents[child];
        if (!siblingGroups[parent]) {
          siblingGroups[parent] = [];
        }
        siblingGroups[parent].push(child);
      });
      
      // Sort the combos with the new parent-child logic
      comboInfo.sort((a, b) => {
        // Final combo always goes last (furthest right)
        if (a.isFinalCombo) return 1;
        if (b.isFinalCombo) return -1;
        
        // ENHANCED ORDERING LOGIC: Siblings first, then their parent, then independent combos
        const aHasParent = a.parent !== null;
        const bHasParent = b.parent !== null;
        const aHasChildren = a.children && a.children.length > 0;
        const bHasChildren = b.children && b.children.length > 0;
        
        // Step 1: Identify sibling groups and their parents
        // A sibling is a combo that has a parent AND that parent has multiple children
        const aIsSibling = aHasParent && siblingGroups[a.parent] && siblingGroups[a.parent].length > 1;
        const bIsSibling = bHasParent && siblingGroups[b.parent] && siblingGroups[b.parent].length > 1;
        
        // A parent-of-siblings is a combo that has children AND those children share the same parent (this combo)
        const aIsParentOfSiblings = aHasChildren && a.children.some(child => 
          siblingGroups[a.name] && siblingGroups[a.name].length > 1
        );
        const bIsParentOfSiblings = bHasChildren && b.children.some(child => 
          siblingGroups[b.name] && siblingGroups[b.name].length > 1
        );
        
        // Step 2: Prioritize siblings, then their parents, then independent combos
        
        // Case 1: Both are siblings of the same parent - sort alphabetically
        if (aIsSibling && bIsSibling && a.parent === b.parent) {
          return a.name.localeCompare(b.name);
        }
        
        // Case 2: One is a sibling, the other is its parent - sibling comes first
        if (aIsSibling && b.name === a.parent) {
          return -1; // a (sibling) comes before b (its parent)
        }
        if (bIsSibling && a.name === b.parent) {
          return 1; // b (sibling) comes before a (its parent)
        }
        
        // Case 3: Both are from different sibling groups - group by parent name
        if (aIsSibling && bIsSibling && a.parent !== b.parent) {
          return a.parent.localeCompare(b.parent);
        }
        
        // Case 4: One is a sibling group member, other is a parent-of-siblings from different group
        if (aIsSibling && bIsParentOfSiblings) {
          // Compare the sibling's parent with the parent-of-siblings
          return a.parent.localeCompare(b.name);
        }
        if (bIsSibling && aIsParentOfSiblings) {
          // Compare the sibling's parent with the parent-of-siblings
          return b.parent.localeCompare(a.name);
        }
        
        // Case 5: One is a sibling, other is independent - sibling groups come first
        if (aIsSibling && !bIsSibling && !bIsParentOfSiblings) {
          return -1; // Sibling groups come before independent combos
        }
        if (bIsSibling && !aIsSibling && !aIsParentOfSiblings) {
          return 1; // Sibling groups come before independent combos
        }
        
        // Case 6: One is a parent-of-siblings, other is independent - parent groups come first
        if (aIsParentOfSiblings && !bIsSibling && !bIsParentOfSiblings) {
          return -1; // Parent-of-siblings comes before independent combos
        }
        if (bIsParentOfSiblings && !aIsSibling && !aIsParentOfSiblings) {
          return 1; // Parent-of-siblings comes before independent combos
        }
        
        // Case 7: Both are independent combos (no parent, or parent with only one child)
        if (!aIsSibling && !bIsSibling && !aIsParentOfSiblings && !bIsParentOfSiblings) {
          // Sort base-ingredients-only combos to the left
          if (a.isBaseIngredientsOnly && !b.isBaseIngredientsOnly) return -1;
          if (!a.isBaseIngredientsOnly && b.isBaseIngredientsOnly) return 1;
          
          // For base-ingredients-only combos, sort by ingredient count (highest count leftmost)
          if (a.isBaseIngredientsOnly && b.isBaseIngredientsOnly) {
            return b.requiredCount - a.requiredCount;
          }
          
          // For other independent combos, sort by base ingredient percentage
          return a.baseIngredientPercentage - b.baseIngredientPercentage;
        }
        
        // Fallback: maintain original order
        return 0;
      });
    } catch (error) {
      // If there's any error in the new logic, log it and fall back to the original sorting
      console.error("Error in parent-child combo sorting, falling back to default:", error);
      
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
    }
    
    // --- SETUP VERTICAL LAYOUT FOR COMBOS ---
    // Calculate vertical layout - maintain original spacing but allow 2-line steps within allocated space
    const verticalMargin = cardHeight * 0.02; // 2% top margin (reduced from 3% by 33%)
    const bottomMargin = cardHeight * 0.05; // 5% bottom margin (unchanged)
    const availableHeight = cardHeight - (verticalMargin + bottomMargin); // Available height after margins
    const totalLines = comboInfo.length + 1; // +1 for the "Recipe" header
    
    // Check if we should allow 2-line steps (4 or fewer steps total)
    const allowTwoLineSteps = totalLines <= 5; // 4 combos + 1 header = 5 total lines
    
    // Use original line height calculation - each step gets equal vertical space
    const lineHeight = Math.max(availableHeight / totalLines, 20); // Original calculation, minimum 20px
    
    // Calculate the total available width for text
    const totalAvailableWidth = textRightMargin - textLeftMargin;
    
    // Default font size based on line height
    const defaultFontSize = Math.min(lineHeight * 0.4, 14);
    
    // Only calculate this once during the game session
    if (recipeCardFontSize === null) {
        console.log("Calculating smallest necessary font size for combinations");
        
        // Start with the default font size
        let smallestFontSize = defaultFontSize;
        const maxTextWidth = totalAvailableWidth; // Use full width between margins
        
        // Check intermediate combinations only
        const allPossibleCombos = [...intermediate_combinations];
        
        // Calculate scaling factor based on total number of steps
        const totalSteps = intermediate_combinations.length + 1; // +1 for final combo
        const scalingFactor = totalSteps <= 3 ? 0.8 : 1.0; // 20% reduction for small recipes
        
        // First pass: Check all combinations with their maximum possible text length
        for (let combo of allPossibleCombos) {
            // Find the verb
            let verb = combo.verb || "Mix"; // Use combo's verb or default to "Mix"
            let name = combo.name;
            
            // Format with standard text (verb + the + name)
            const capitalizedVerb = verb.charAt(0).toUpperCase() + verb.slice(1);
            const fullText = `Step 1: ${capitalizedVerb} the ${name}`; // Include step prefix in calculation
            
            // Set the font size for measurement
            const adjustedFontSize = defaultFontSize * scalingFactor;
            textSize(adjustedFontSize);
            
            // Check if this text would be too long with default font size
            if (textWidth(fullText) > maxTextWidth) {
                // Try 90% of default font size
                const ninetyPercentSize = Math.max(adjustedFontSize * 0.9, 8);
                textSize(ninetyPercentSize);
                
                if (textWidth(fullText) > maxTextWidth) {
                    // If still too long, try 80%
                    const eightyPercentSize = Math.max(adjustedFontSize * 0.8, 8);
                    smallestFontSize = Math.min(smallestFontSize, eightyPercentSize);
                } else {
                    // 90% works
                    smallestFontSize = Math.min(smallestFontSize, ninetyPercentSize);
                }
            }
        }
        
        // Store the calculated smallest font size
        recipeCardFontSize = smallestFontSize;
        console.log(`Smallest necessary font size for all combinations: ${recipeCardFontSize}px`);
    }
    
    // Calculate starting Y position (top margin + half line height for vertical centering)
    const startY = cardY - cardHeight/2 + verticalMargin + lineHeight/2;
    
    // --- RESET ALL TEXT PROPERTIES FOR CONSISTENCY - APlasker ---
    textFont(titleFont); // Use Courier font for recipe card content
    textStyle(NORMAL);
    
    // --- DRAW HEADER ---
    // Draw "Recipe" label at the top line - centered
    fill('black');
    noStroke();
    textAlign(CENTER, CENTER); // Center alignment for title
    textSize(Math.min(lineHeight * 0.4, 14)); // Reduced to match hint button text size
    textStyle(BOLD);
    text("Recipe", cardX, startY); // Position at card center for centered text
    
    // Draw underline below "Recipe" text - also centered
    const recipeTextWidth = textWidth("Recipe");
    stroke('black');
    strokeWeight(1);
    line(cardX - recipeTextWidth/2, startY + lineHeight/4, cardX + recipeTextWidth/2, startY + lineHeight/4);
    
    // --- DRAW COMBO ITEMS VERTICALLY ---
    // Replace circled number emojis with "Step N: " format
    const stepPrefixes = ["Step 1: ", "Step 2: ", "Step 3: ", "Step 4: ", "Step 5: "];
    
    // Reset alignment for the list items
    textAlign(LEFT, CENTER);
    
    // Apply the pre-calculated smallest font size to all combos
    textSize(recipeCardFontSize);
    
    for (let i = 0; i < comboInfo.length; i++) {
      // Calculate y position for this combo (back to original fixed spacing)
      const y = startY + ((i + 1) * lineHeight);
      
      // Get combo information
      const combo = comboInfo[i];
      
      // Determine text content
      let comboText;
      
      if (combo.isCompleted) {
        // For completed combos, find the verb and name
        let verb = "Mix"; // Default fallback verb
        let name = combo.name;
        
        // Find the verb for this combination
        if (combo.isFinalCombo && final_combination.verb) {
          verb = final_combination.verb;
        } else {
          // Search for the verb in intermediate combinations
          for (let c of intermediate_combinations) {
            if (c.name === combo.name && c.verb) {
              verb = c.verb;
              break;
            }
          }
        }
        
        // Format as "Verb the Name" - capitalize first letter of verb
        const capitalizedVerb = verb.charAt(0).toUpperCase() + verb.slice(1);
        comboText = `${capitalizedVerb} the ${name}`;
        
        // Calculate the actual available width (accounting for step prefix)
        const stepPrefixWidth = textWidth(stepPrefixes[i]);
        const actualAvailableWidth = textRightMargin - textLeftMargin - stepPrefixWidth;
        
        // Check if text needs truncation - but skip for small recipes that can use 2 lines
        if (textWidth(comboText) > actualAvailableWidth) {
          if (allowTwoLineSteps) {
            // For small recipes, don't truncate yet - let 2-line logic handle it
            // We'll check 2-line feasibility later and only truncate if 2 lines don't work
          } else {
            // For larger recipes, use original truncation logic
            // First try: Keep everything but remove "the"
            const withoutThe = `${capitalizedVerb} ${name}`;
            
            if (textWidth(withoutThe) <= actualAvailableWidth) {
              // Success! Use this version
              comboText = withoutThe;
            } else {
              // Still too long, we need to truncate
              let charIndex = name.length;
              const verbPlusSpace = `${capitalizedVerb} `;
              
              // Start from the full name and work backwards
              while (charIndex > 0 && textWidth(verbPlusSpace + name.slice(0, charIndex)) > actualAvailableWidth) {
                charIndex--;
              }
              
              // Use the truncated version
              comboText = `${capitalizedVerb} ${name.slice(0, charIndex)}`;
            }
          }
        }
      } else if (hintedCombos.includes(combo.name)) {
        // For hinted combos, show verb, name and progress counter with animation
        let verb = "Mix"; // Default fallback verb
        let name = combo.name;
        
        // Find the combination object to get the verb and track progress
        let comboObject;
        if (combo.isFinalCombo) {
          comboObject = final_combination;
          if (final_combination.verb) verb = final_combination.verb;
        } else {
          // Search in intermediate combinations
          for (let c of intermediate_combinations) {
            if (c.name === combo.name) {
              comboObject = c;
              if (c.verb) verb = c.verb;
              break;
            }
          }
        }
        
        // Calculate progress if we have the combo object
        let progressText = "(0/?)";
        if (comboObject) {
          const totalIngredients = comboObject.required.length;
          // Simplified to just show total required ingredients
          progressText = `(${totalIngredients})`;
        }
        
        // Format as "Verb the Name (N)" - capitalize first letter of verb
        const capitalizedVerb = verb.charAt(0).toUpperCase() + verb.slice(1);
        
        // Prepare the full text (what it will be when the animation completes)
        const fullText = `${capitalizedVerb} the ${name} ${progressText}`;
        
        // Calculate available width (using full width minus step prefix)
        const stepPrefixWidth = textWidth(stepPrefixes[i]);
        const maxTextWidth = totalAvailableWidth - stepPrefixWidth;
        let truncatedText = fullText;
        
        if (textWidth(fullText) > maxTextWidth) {
          if (allowTwoLineSteps) {
            // For small recipes, don't truncate yet - let 2-line logic handle it
            truncatedText = fullText;
          } else {
            // For larger recipes, use original truncation logic
            // First try removing "the" instead of using ellipsis
            truncatedText = `${capitalizedVerb} ${name} ${progressText}`;
            
            // If still too long, truncate the name
            if (textWidth(truncatedText) > maxTextWidth) {
                // Calculate how many characters of the name we can show
                let charIndex = name.length;
                const verbPlusSpace = `${capitalizedVerb} `;
                
                // Start from the end and remove characters until it fits
                while (charIndex > 0 && 
                       textWidth(`${verbPlusSpace}${name.slice(0, charIndex)} ${progressText}`) > maxTextWidth) {
                    charIndex--;
                }
                
                truncatedText = `${capitalizedVerb} ${name.slice(0, charIndex)} ${progressText}`;
            }
          }
        }
        
        // Check if this combo should be animated
        const isAnimationTarget = combo.name === hintAnimationTarget && hintAnimationActive;
        
        if (isAnimationTarget) {
          // Calculate how much of the text to show based on animation progress
          let textRevealProgress = Math.min(1, hintAnimationProgress / hintAnimationTextRevealDuration);
          let textLength = Math.floor(truncatedText.length * textRevealProgress);
          
          // Set the comboText based on animation progress
          comboText = truncatedText.substring(0, textLength);
          
          // Add cursor during typing animation
          if (textRevealProgress < 1) {
            comboText += "|"; // Add cursor character during typing
          } else if (hintAnimationProgress < 1) {
            // If text reveal is complete but color transition isn't, show full text with a cursor
            comboText = truncatedText + "|";
          } else {
            // Animation complete, show full text
            comboText = truncatedText;
          }
        } else {
          // No animation for this combo, show full text
          comboText = truncatedText;
        }
      } else {
        // For incomplete combos, show ingredient count or verb for final combo
        if (combo.isFinalCombo) {
          // For final combo, show its verb with an exclamation mark
          let verb = "Mix"; // Default fallback verb
          
          // Find the verb for the final combination
          if (final_combination.verb) {
            verb = final_combination.verb;
          }
          
          // Format as "Verb!" - capitalize first letter of verb
          const capitalizedVerb = verb.charAt(0).toUpperCase() + verb.slice(1);
          comboText = `${capitalizedVerb}!`;
        } else {
          // Add debugging to help identify issue with missing text
          console.log(`Generating question marks for combo step ${i+1}:`, {
            name: combo.name,
            requiredCount: combo.requiredCount,
            isPartialCombo: combo.isPartialCombo,
            isParent: combo.children && combo.children.length > 0,
            children: combo.children
          });
          
          // Make sure requiredCount is valid for parent combos too
          let ingredientCount = combo.requiredCount;
          
          // If requiredCount is missing or 0 for a parent combo, calculate it
          if ((!ingredientCount || ingredientCount === 0) && combo.children && combo.children.length > 0) {
            console.log(`Fixing missing requiredCount for parent combo: ${combo.name}`);
            // Find the original combo object to get required.length
            for (let ic of intermediate_combinations) {
              if (ic.name === combo.name) {
                ingredientCount = ic.required.length;
                console.log(`Found original required count: ${ingredientCount}`);
                break;
              }
            }
          }
          
          // If we still don't have a valid count, fallback to children count + 2 (estimation)
          if (!ingredientCount || ingredientCount === 0) {
            ingredientCount = (combo.children ? combo.children.length : 0) + 2;
            console.log(`Using fallback count for ${combo.name}: ${ingredientCount}`);
          }
          
          // For other incomplete combos, replace "# ingredients" with "?+?+?"
          // Generate a string of question marks with plus signs between them (no spaces)
          let questionMarks = Array(ingredientCount).fill("?").join("+");
          comboText = questionMarks;
        }
        // No need to set font size here as we're using the global smallest font size
      }
      
      // Add step prefix
      const stepPrefix = stepPrefixes[i] || `Step ${i+1}: `; // Fallback to "Step N: " if we exceed available prefixes
      
      // Check if we need to wrap text to 2 lines for this step
      let comboTextLines = [comboText]; // Default to single line
      let lineSpacing = 0; // Spacing between lines within the same step
      
      if (allowTwoLineSteps) {
        // Calculate available width for combo text (minus step prefix)
        textSize(recipeCardFontSize);
        const stepPrefixWidth = textWidth(stepPrefix);
        const availableTextWidth = totalAvailableWidth - stepPrefixWidth;
        
        // Check if text would benefit from wrapping
        if (textWidth(comboText) > availableTextWidth) {
          // Try to split the text intelligently at word boundaries
          const words = comboText.split(' ');
          let firstLine = '';
          let secondLine = '';
          
          // Start with as many words as possible on the first line, then move words to second line
          for (let split = words.length - 1; split >= 1; split--) {
            const testFirstLine = words.slice(0, split).join(' ');
            const testSecondLine = words.slice(split).join(' ');
            
            if (textWidth(testFirstLine) <= availableTextWidth && 
                textWidth(testSecondLine) <= availableTextWidth) {
              firstLine = testFirstLine;
              secondLine = testSecondLine;
              break;
            }
          }
          
          // If we found a good split, use 2 lines within the step's allocated space
          if (firstLine && secondLine) {
            comboTextLines = [firstLine, secondLine];
            lineSpacing = lineHeight * 0.4; // Increased from 30% to 40% for better spacing
          } else {
            // If 2-line wrapping failed, fall back to truncation
            console.log(`2-line wrapping failed for: ${comboText}, applying truncation`);
            
            // Apply the same truncation logic as larger recipes
            if (combo.isCompleted) {
              // First try: Keep everything but remove "the"
              const words = comboText.split(' ');
              const capitalizedVerb = words[0];
              const name = words.slice(2).join(' '); // Skip "the"
              const withoutThe = `${capitalizedVerb} ${name}`;
              
              if (textWidth(withoutThe) <= availableTextWidth) {
                comboText = withoutThe;
              } else {
                // Still too long, truncate the name
                let charIndex = name.length;
                const verbPlusSpace = `${capitalizedVerb} `;
                
                while (charIndex > 0 && textWidth(verbPlusSpace + name.slice(0, charIndex)) > availableTextWidth) {
                  charIndex--;
                }
                
                comboText = `${capitalizedVerb} ${name.slice(0, charIndex)}`;
              }
            } else if (hintedCombos.includes(combo.name)) {
              // For hinted combos, apply similar truncation
              const words = comboText.split(' ');
              const capitalizedVerb = words[0];
              const name = words.slice(2, -1).join(' '); // Skip "the" and progress
              const progressText = words[words.length - 1];
              
              // First try removing "the"
              let truncatedText = `${capitalizedVerb} ${name} ${progressText}`;
              
              if (textWidth(truncatedText) > availableTextWidth) {
                // Truncate the name
                let charIndex = name.length;
                const verbPlusSpace = `${capitalizedVerb} `;
                
                while (charIndex > 0 && 
                       textWidth(`${verbPlusSpace}${name.slice(0, charIndex)} ${progressText}`) > availableTextWidth) {
                  charIndex--;
                }
                
                truncatedText = `${capitalizedVerb} ${name.slice(0, charIndex)} ${progressText}`;
              }
              
              comboText = truncatedText;
            }
            
            // Update comboTextLines after truncation
            comboTextLines = [comboText];
          }
        }
      }
      
      const fullComboText = `${stepPrefix}${comboText}`;
      
      // Calculate step prefix width to position highlight correctly (avoiding the prefix)
      textAlign(LEFT, CENTER);
      
      // Draw step prefix with same size as combo text (not 50% larger like before)
      const comboFontSize = recipeCardFontSize;
      const prefixFontSize = comboFontSize; // Same size for step prefix
      
      // Draw the prefix first
      textSize(prefixFontSize);
      const stepPrefixWidth = textWidth(`${stepPrefix}`);
      
      // Draw the parallelogram highlight for partial combos (but not for completed ones)
      if (combo.isPartialCombo) {
        // Calculate the width of the main text (without number prefix)
        textSize(comboFontSize); // Temporarily set back to combo font size to measure text
        // Draw colored highlight behind completed combo text - support multi-line
        textSize(recipeCardFontSize); // Use combo font size for width calculations
        
        // IMPORTANT: Use the exact same color that the vessel will have when completed
        // This ensures perfect color matching between highlight and future vessel
        noStroke();
        
        // Call getNextCompletedVesselColor with the combo name to get the exact same color
        // that will be used when this vessel is created
        const highlightColor = getNextCompletedVesselColor(combo.name);
        fill(highlightColor);
        
        // Draw parallelogram highlight for each line of text
        const skew = 6; // Amount of skew for parallelogram
        const highlightHeight = lineHeight * 0.6; // Consistent height for both single and multi-line (middle ground)
        
        for (let lineIndex = 0; lineIndex < comboTextLines.length; lineIndex++) {
          const lineY = y + (lineIndex * lineSpacing);
          const lineText = comboTextLines[lineIndex];
          const lineTextWidth = textWidth(lineText);
          
          const highlightY = lineY - highlightHeight/2;
          
          beginShape();
          vertex(textLeftMargin + stepPrefixWidth, highlightY); // Top left
          vertex(textLeftMargin + stepPrefixWidth + lineTextWidth + skew, highlightY); // Top right
          vertex(textLeftMargin + stepPrefixWidth + lineTextWidth, highlightY + highlightHeight); // Bottom right
          vertex(textLeftMargin + stepPrefixWidth - skew, highlightY + highlightHeight); // Bottom left
          endShape(CLOSE);
        }
      }
      
      if (combo.isCompleted) {
        // For completed combos, show green checkmark to the left of text
        const checkmarkX = textLeftMargin - 15; // Position checkmark to the left of text
        
        // Draw green checkmark for completed combos
        stroke(COLORS.green);
        strokeWeight(Math.max(lineHeight * 0.1, 2)); // Relative stroke weight, min 2px
        line(checkmarkX - 5, y, checkmarkX, y + 5);
        line(checkmarkX, y + 5, checkmarkX + 8, y - 5);
        
        // Draw prefix in bold
        noStroke();
        textStyle(BOLD);
        fill('black');
        text(stepPrefix, textLeftMargin, y);
        
        // Switch to regular font size for the rest of the text
        textSize(comboFontSize);
        
        // Draw multi-line text if needed
        for (let lineIndex = 0; lineIndex < comboTextLines.length; lineIndex++) {
          const lineY = y + (lineIndex * lineSpacing);
          text(comboTextLines[lineIndex], textLeftMargin + stepPrefixWidth, lineY);
        }
      } else if (hintedCombos.includes(combo.name)) {
        // For hinted combos, use hint color (red) and bold text with potential animation
        noStroke();
        textStyle(BOLD);
        
        // Check if this combo should be animated
        const isAnimationTarget = combo.name === hintAnimationTarget && hintAnimationActive;
        // Check if this combo has completed animation
        const hasCompletedAnimation = completedAnimations.includes(combo.name);
        
        if (isAnimationTarget) {
          // If animation is active and this is the target combo, handle color transition
          if (hintAnimationProgress > hintAnimationTextRevealDuration) {
            // Calculate color blend from pink to black after text reveal is complete
            const colorTransitionProgress = (hintAnimationProgress - hintAnimationTextRevealDuration) / (1 - hintAnimationTextRevealDuration);
            // Pink color (#cf6d88) RGB values: 207, 109, 136
            const r = lerp(207, 0, colorTransitionProgress);  // Red from 207 to 0
            const g = lerp(109, 0, colorTransitionProgress);  // Green from 109 to 0
            const b = lerp(136, 0, colorTransitionProgress);  // Blue from 136 to 0
            
            // Create blended color
            fill(r, g, b);
          } else {
            // During text reveal, use pink hint button color instead of red
            fill(COLORS.secondary);
          }
        } else if (hasCompletedAnimation) {
          // For combos that have completed animation, use black
          fill(0);
        } else {
          // For non-animated hinted combos that haven't been through animation, use pink hint button color
          fill(COLORS.secondary);
        }
        
        // Draw prefix with same font
        textStyle(BOLD); // Make step prefix bold
        text(stepPrefix, textLeftMargin, y);
        
        // Draw the rest of the text
        textSize(comboFontSize);
        textStyle(NORMAL); // Reset to normal text style for combo text
        
        // Draw multi-line text if needed
        for (let lineIndex = 0; lineIndex < comboTextLines.length; lineIndex++) {
          const lineY = y + (lineIndex * lineSpacing);
          text(comboTextLines[lineIndex], textLeftMargin + stepPrefixWidth, lineY);
        }
      } else {
        // For incomplete combos, just show the question marks
        fill('#333333'); // Darker gray for incomplete
        noStroke();
        
        // Draw prefix in bold
        textStyle(BOLD);
        text(stepPrefix, textLeftMargin, y);
        
        // Draw the rest of the text (question marks) in normal style
        textStyle(NORMAL);
        
        // Draw multi-line text if needed - with special kerning for question marks
        for (let lineIndex = 0; lineIndex < comboTextLines.length; lineIndex++) {
          const lineY = y + (lineIndex * lineSpacing);
          const lineText = comboTextLines[lineIndex];
          
          // Check if this line contains question marks and plus signs (incomplete combo)
          if (lineText.includes('?') && lineText.includes('+') && !lineText.includes(' ')) {
            // Apply 25% kerning to question mark strings like "?+?+?"
            drawTextWithKerning(lineText, textLeftMargin + stepPrefixWidth, lineY, 0.25);
          } else {
            // Normal text rendering for everything else
            text(lineText, textLeftMargin + stepPrefixWidth, lineY);
          }
        }
              }
      }
    
    // Restore drawing context
    pop();
  }

  // Helper function to calculate text width based on different conditions
  function calculateTextWidth(text) {
    return textWidth(text);
  }

  // New separate function for drawing mistake counters - APlasker
  function drawMistakeCounters() {
    // Isolate drawing context for mistake counters
    push();
    
      // Position mistake counters based on layout type
  const counterY = playAreaY + playAreaHeight * getCurrentLayout().mistakeCounter;
    
    // Center of the play area for overall positioning
    const centerX = playAreaX + playAreaWidth / 2;
    
    // --- STAR COUNTER SECTION ---
    const totalStars = 5; // Show 5 stars (changed from 4)
    
    // Filter moveHistory to only include error markers (black or #333333)
    const mistakes = moveHistory.filter(move => 
      move === 'black' || move === '#333333').length;
    
    // Star sizing and spacing (adjust as needed)
    const starSize = Math.min(Math.max(width * 0.011, 10), 13); // Shrunk by 10%
    const starSpacing = starSize * 1.5; // Example spacing
    
    // Calculate the total width of all stars
    const totalStarWidth = (starSize * totalStars) + (starSpacing * (totalStars - 1));
    
    // Calculate starting position to center the stars
    const groupStartX = centerX - (totalStarWidth / 2);
    
    // --- RESET ALL TEXT PROPERTIES FOR CONSISTENCY - APlasker ---
    textFont(bodyFont); // Keep Helvetica for mistake counters (not part of recipe card)
    textStyle(NORMAL);
    
    // REMOVED "Mistakes:" label
    
    // Draw stars
    for (let i = 0; i < totalStars; i++) {
      // Position stars with consistent spacing
      const x = groupStartX + (i * (starSize + starSpacing)) + starSize / 2; // Centering each star
      const y = counterY;
      
      let starFillColor;
      // Stars turn grey if the mistake for their position has occurred
      if (i < mistakes) {
        starFillColor = STAR_GREY; // Defined in sketch.js
      } else {
        starFillColor = COLORS.vesselHint; // Changed to vessel/logo yellow
      }
      
      // Draw star using the drawStar function (expected to be in sketch.js or global)
      // Assuming drawStar takes: x, y, innerRadius, outerRadius, npoints, fillColor, outlineColor
      // Using starSize for outerRadius and starSize*0.475 for innerRadius for a typical star shape.
      drawStar(x, y, starSize * 0.475, starSize, 5, starFillColor, STAR_OUTLINE); // Inner radius adjusted to split the difference.
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
          drawFlower(x, y, petalSize, COLORS.peach); // Changed from tertiary (white) to peach/orange - APlasker
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
          drawFlower(x, y, petalSize, COLORS.peach); // Changed from tertiary to peach consistently
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
    // Position flowers using percentage of viewport height for better consistency across devices
    const topY = smallerPetalSize * 1.9; // Just enough space from the top edge
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
          drawFlower(x, topY, smallerPetalSize, COLORS.secondary); // Pink
        } else {
          drawFlower(x, topY, smallerPetalSize, COLORS.peach); // Changed from tertiary (white) to peach/orange - APlasker
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
          drawFlower(x, bottomY, smallerPetalSize, COLORS.peach); // Peach
        } else if (colorIndex === 1) {
          drawFlower(x, bottomY, smallerPetalSize, COLORS.primary); // Green
        } else {
          drawFlower(x, bottomY, smallerPetalSize, COLORS.secondary); // Pink
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
    
    // Draw center with 0% opacity (invisible) - APlasker
    fill(255, 255, 255, 0); // 0% opacity white (invisible)
    ellipse(x, y, petalSize, petalSize);
  }

  // Simple loading screen without wallpaper animation
  function drawSimpleLoadingScreen() {
    // Draw the COMPLETE start screen
    drawTitle();
    drawByline();
    drawRecipeStats();
    
    // Draw buttons
    if (typeof startButton !== 'undefined' && typeof tutorialButton !== 'undefined') {
      // Position buttons for start screen
      const cookButtonWidth = Math.max(playAreaWidth * 0.25, 120);
      const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
      const tutorialButtonWidth = cookButtonWidth * 0.5;
      
      startButton.x = playAreaX + playAreaWidth * 0.5;
      startButton.y = playAreaY + playAreaHeight * 0.88;
      startButton.w = cookButtonWidth;
      startButton.h = buttonHeight;
      startButton.customCornerRadius = 12;
      
      tutorialButton.x = startButton.x - (cookButtonWidth/2) - (tutorialButtonWidth/2) - 20;
      tutorialButton.y = startButton.y;
      tutorialButton.w = tutorialButtonWidth;
      tutorialButton.h = buttonHeight;
      tutorialButton.customCornerRadius = 12;
      tutorialButton.label = "First\nTime?";
      tutorialButton.textSizeMultiplier = 0.8;
      
      tutorialButton.draw();
      startButton.draw();
    }
    
    // Draw version text
    push();
    textAlign(CENTER, CENTER);
    const versionTextSize = Math.max(playAreaWidth * 0.016, 8);
    textSize(versionTextSize);
    const versionText = "v20250719.740PM.EDT - APlasker";
    const combinedText = versionText + " | Say hi!";
    
    fill(100); // Gray color for version text
    const versionWidth = textWidth(versionText);
    const pipeWidth = textWidth(" | ");
    const sayHiWidth = textWidth("Say hi!");
    const totalWidth = versionWidth + pipeWidth + sayHiWidth;
    const startX = playAreaX + playAreaWidth/2 - totalWidth/2;
    
    text(versionText, startX + versionWidth/2, playAreaY + playAreaHeight * 0.985);
    fill(COLORS.primary);
    text(" | Say hi!", startX + versionWidth + pipeWidth + sayHiWidth/2, playAreaY + playAreaHeight * 0.985);
    pop();

    // Show loading message if needed
    if (isLoadingRecipe) {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(18);
      text("Loading recipe...", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight/2 + 30);
    }
  }

  // New function to draw loading animation with wallpaper tiles - APlasker (now deprecated)
  function drawLoadingAnimation() {
  // Always draw the COMPLETE start screen first - it's behind the wallpaper wall
  drawTitle();
  drawByline();
  drawRecipeStats();
  
  // Draw buttons behind wallpaper
  if (typeof startButton !== 'undefined' && typeof tutorialButton !== 'undefined') {
    // Position buttons for start screen (same logic as drawStartScreen)
    const cookButtonWidth = Math.max(playAreaWidth * 0.25, 120);
    const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
    const tutorialButtonWidth = cookButtonWidth * 0.5;
    
    startButton.x = playAreaX + playAreaWidth * 0.5;
    startButton.y = playAreaY + playAreaHeight * 0.88;
    startButton.w = cookButtonWidth;
    startButton.h = buttonHeight;
    startButton.customCornerRadius = 12;
    
    tutorialButton.x = startButton.x - (cookButtonWidth/2) - (tutorialButtonWidth/2) - 20;
    tutorialButton.y = startButton.y;
    tutorialButton.w = tutorialButtonWidth;
    tutorialButton.h = buttonHeight;
    tutorialButton.customCornerRadius = 12;
    tutorialButton.label = "First\nTime?";
    tutorialButton.textSizeMultiplier = 0.8;
    
    // Draw buttons behind wallpaper (but don't check hover during animation)
    tutorialButton.draw();
    startButton.draw();
  }
  
  // Draw version text behind wallpaper
  push();
  textAlign(CENTER, CENTER);
  const versionTextSize = Math.max(playAreaWidth * 0.016, 8);
  textSize(versionTextSize);
  const versionText = "v20250719.740PM.EDT - APlasker";
  const combinedText = versionText + " | Say hi!";
  
  fill(100); // Gray color for version text
  const versionWidth = textWidth(versionText);
  const pipeWidth = textWidth(" | ");
  const sayHiWidth = textWidth("Say hi!");
  const totalWidth = versionWidth + pipeWidth + sayHiWidth;
  const startX = playAreaX + playAreaWidth/2 - totalWidth/2;
  
  text(versionText, startX + versionWidth/2, playAreaY + playAreaHeight * 0.985);
  fill(COLORS.primary);
  text(" | Say hi!", startX + versionWidth + pipeWidth + sayHiWidth/2, playAreaY + playAreaHeight * 0.985);
  pop();
  
  // Only show wallpaper wall if we have the high-res image ready
  if (wallpaperHighResImage && wallpaperImageReady) {
    if (!wallpaperAnimation) {
      wallpaperAnimation = new WallpaperAnimation();
      wallpaperAnimationActive = true; // Mark animation as active
    }
    
    wallpaperAnimation.update();
    if (loadingComplete && wallpaperAnimation.state === 'STATIC') {
      wallpaperAnimation.startSplitReveal();
    } else if (wallpaperAnimation.state === 'STATIC') {
      console.log(`⏳ Waiting for loading completion - loadingComplete: ${loadingComplete}, state: ${wallpaperAnimation.state}`);
    }
    
    // Draw the wallpaper wall (will be static, splitting, or complete)
    wallpaperAnimation.draw();
    
    if (wallpaperAnimation.state === 'READY_FOR_COOK') {
      console.log("🎯 Loading complete - wallpaper ready for cook transition");
      return false; // Stop drawing wallpaper, but keep animation active
    } else if (wallpaperAnimation.state === 'COMPLETE') {
      if (wallpaperAnimation.closeStartTime !== null) {
        // This should trigger the start screen display after wallpaper closes
      }
      wallpaperAnimationActive = false; // Mark animation as inactive
      console.log("🎉 Animation complete - ending wallpaper animation");
    }
  } else {
    // BUGFIX: Show loading message and continue if wallpaper fails
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Loading wallpaper...", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight/2 + 30);
    
    // BUGFIX: Add timeout fallback - if wallpaper hasn't loaded after reasonable time, continue anyway
    if (!wallpaperLoadingStartTime) {
      wallpaperLoadingStartTime = millis();
    } else if (millis() - wallpaperLoadingStartTime > 8000) { // 8 second timeout
      console.warn("⚠️ Wallpaper loading timeout reached - proceeding without animation");
      wallpaperImageReady = false;
      loadingComplete = true;
      wallpaperLoadingStartTime = null; // Reset for future attempts
    }
  }
}

function drawWallpaperAnimation() {
  // Continue wallpaper animation even after loading is complete
  if (wallpaperAnimationActive && wallpaperAnimation) {
    
    // Draw different content behind the wall based on animation state
    if (wallpaperAnimation.state === 'CLOSING') {
      // During CLOSING: show start screen (what we're closing over)
      drawTitle();
      drawByline();
      drawRecipeStats();
    } else if (wallpaperAnimation.state === 'OPENING') {
      // During OPENING: show game screen (what we're revealing)
      // Set background to game background
      background(COLORS.background);
      
      // Draw the actual game screen elements (game has already started)
      drawTitle(); // Game title
      drawByline(); // Game byline
      
      // Draw vessels if they exist and game is started
      if (typeof vessels !== 'undefined' && vessels.length > 0 && typeof gameStarted !== 'undefined' && gameStarted) {
        for (let vessel of vessels) {
          vessel.draw();
        }
        
        // Draw game counters and history
        drawGameCounters();
        drawMoveHistory();
        
        // Draw hint button
        if (typeof hintButton !== 'undefined') {
          hintButton.draw();
        }
        
        // Draw help icon
        if (typeof drawHelpIcon === 'function') {
          drawHelpIcon();
        }
        
        // Draw timer if active
        if (typeof gameTimer !== 'undefined' && typeof gameTimerActive !== 'undefined' && gameTimerActive && !gameWon) {
          push();
          textAlign(LEFT, TOP);
          textSize(Math.max(playAreaWidth * 0.022, 13));
          fill(0); // Black text for better visibility
          
          // Position opposite the help button - top left above title
          const timerX = playAreaX + 10; // 10px from left edge of play area
          const timerY = playAreaY + 10; // 10px from top edge of play area
          
          text(formatTime(gameTimer), timerX, timerY);
          pop();
        }
      }
    } else if (wallpaperAnimation.state === 'READY_FOR_COOK') {
      // READY_FOR_COOK: show normal start screen (wallpaper is invisible)
      drawTitle();
      drawByline();
      drawRecipeStats();
    } else {
      // Default: show start screen
      drawTitle();
      drawByline();
      drawRecipeStats();
    }
    
    // Draw buttons behind wallpaper only for start screen states (not during OPENING)
    if (wallpaperAnimation.state === 'CLOSING' || wallpaperAnimation.state === 'STATIC' || wallpaperAnimation.state === 'SPLITTING' || wallpaperAnimation.state === 'READY_FOR_COOK') {
      if (typeof startButton !== 'undefined' && typeof tutorialButton !== 'undefined') {
        // Position buttons for start screen (same logic as drawStartScreen)
        const cookButtonWidth = Math.max(playAreaWidth * 0.25, 120);
        const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
        const tutorialButtonWidth = cookButtonWidth * 0.5;
        
        startButton.x = playAreaX + playAreaWidth * 0.5;
        startButton.y = playAreaY + playAreaHeight * 0.88;
        startButton.w = cookButtonWidth;
        startButton.h = buttonHeight;
        startButton.customCornerRadius = 12;
        
        tutorialButton.x = startButton.x - (cookButtonWidth/2) - (tutorialButtonWidth/2) - 20;
        tutorialButton.y = startButton.y;
        tutorialButton.w = tutorialButtonWidth;
        tutorialButton.h = buttonHeight;
        tutorialButton.customCornerRadius = 12;
        tutorialButton.label = "First\nTime?";
        tutorialButton.textSizeMultiplier = 0.8;
        
        // Draw buttons behind wallpaper (but don't check hover during animation)
        tutorialButton.draw();
        startButton.draw();
      }
    }
    
    // Draw version text behind wallpaper only for start screen states (not during OPENING)
    if (wallpaperAnimation.state === 'CLOSING' || wallpaperAnimation.state === 'STATIC' || wallpaperAnimation.state === 'SPLITTING' || wallpaperAnimation.state === 'READY_FOR_COOK') {
      push();
      textAlign(CENTER, CENTER);
      const versionTextSize = Math.max(playAreaWidth * 0.016, 8);
      textSize(versionTextSize);
      const versionText = "v20250719.740PM.EDT - APlasker";
      const combinedText = versionText + " | Say hi!";
      
      fill(100); // Gray color for version text
      const versionWidth = textWidth(versionText);
      const pipeWidth = textWidth(" | ");
      const sayHiWidth = textWidth("Say hi!");
      const totalWidth = versionWidth + pipeWidth + sayHiWidth;
      const startX = playAreaX + playAreaWidth/2 - totalWidth/2;
      
      text(versionText, startX + versionWidth/2, playAreaY + playAreaHeight * 0.985);
      fill(COLORS.primary);
      text(" | Say hi!", startX + versionWidth + pipeWidth + sayHiWidth/2, playAreaY + playAreaHeight * 0.985);
      pop();
    }
    
    // Update animation state
    wallpaperAnimation.update();
    
    // Check if loading is complete and we should start the split reveal
    if (loadingComplete && wallpaperAnimation.state === 'STATIC') {
      console.log("🎬 Conditions met for split reveal - triggering animation!");
      wallpaperAnimation.startSplitReveal();
    }
    
    // Draw the wallpaper wall (will be static, splitting, or complete)
    wallpaperAnimation.draw();
    
    // Handle animation completion
    if (wallpaperAnimation.state === 'READY_FOR_COOK') {
      // Initial split reveal complete - keep animation active for cook transition
      console.log("🎯 Split reveal complete - keeping animation ready for cook transition");
      return false; // Stop drawing wallpaper, but keep animation active
    } else if (wallpaperAnimation.state === 'COMPLETE') {
      
      // Check if this was a cook transition (CLOSING -> OPENING -> COMPLETE)
      if (wallpaperAnimation.closeStartTime !== null) {
        console.log("🎮 Cook transition complete - game already started!");
        // Game was already started when OPENING began
      }
      
      cleanupWallpaperAnimation();
      wallpaperAnimationActive = false; // Mark animation as inactive
      console.log("🎉 Animation complete - ending wallpaper animation");
      return false; // Signal that animation is complete
    }
    
    return true; // Animation still running
  }
  
  return false; // No active animation
}
  
  // Function to clean up wallpaper animation when loading is complete - APlasker
  function cleanupWallpaperAnimation() {
    if (wallpaperAnimation) {
      console.log("🧹 Cleaning up wallpaper animation - loading complete");
      wallpaperAnimation.active = false;
      wallpaperAnimation = null;
    }
    wallpaperAnimationActive = false; // Clear the animation flag
  }

  function draw() {
    // Set background color
    background(COLORS.background);
    
    // Update and display timer if game is active - APlasker
    if (gameStarted && !gameWon && gameTimerActive) {
      gameTimer = Math.floor((Date.now() - startTime) / 1000);
      // Cap at 59:59
      gameTimer = Math.min(gameTimer, 3599);
      
      // Draw timer opposite the help button (top left above title) - APlasker
      push();
      textAlign(LEFT, TOP);
      textSize(Math.max(playAreaWidth * 0.022, 13)); // Increased from 2% to 2.2%, min 13px (up from 12px)
      fill(0); // Black text for better visibility
      
      // Position opposite the help button - top left above title
      const timerX = playAreaX + 10; // 10px from left edge of play area
      const timerY = playAreaY + 10; // 10px from top edge of play area
      
      text(formatTime(gameTimer), timerX, timerY);
      pop();
    }
    
    // Check if we're still loading recipe data (initial loading state only)
    if (isLoadingRecipe) {
      // Draw simple loading screen without wallpaper animation
      drawSimpleLoadingScreen();
      
      // Draw floral pattern border if there's space - moved here from outside
      drawFloralBorder();
      
      // Draw top and bottom flowers on narrow screens - moved here from outside
      drawTopBottomFlowers();
      
      return;
    }
    
    // Check if wallpaper animation is still running (even after loading complete)
    if (wallpaperAnimationActive) {
      // Draw floral pattern border FIRST so wallpaper appears on top
      drawFloralBorder();
      
      // Draw top and bottom flowers FIRST so wallpaper appears on top
      drawTopBottomFlowers();
      
      const animationStillRunning = drawWallpaperAnimation();
      
      if (animationStillRunning) {
        // NOTE: drawWallpaperAnimation draws the wallpaper on top of the flowers
        return; // Don't draw normal game elements while animation is running
      }
    }
    
    // Only draw decorative flowers after loading is complete
    // Draw floral pattern border if there's space
    drawFloralBorder();
    
    // Draw top and bottom flowers on narrow screens
    drawTopBottomFlowers();
    
    // Ensure no stroke for all text elements
    noStroke();
    
    // Check if there was an error loading recipe data
    if (loadingError) {
      // Only show error if we're not in a loading state and have actually tried to load
      if (!isLoadingRecipe && typeof loadRecipeRetryCount !== 'undefined' && window.loadRecipeRetryCount >= 3) {
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
      } else {
        // Reset error state if we're still loading or haven't exhausted retries
        loadingError = false;
      }
    }

    // Handle profile screen - APlasker
    if (window.profileActive) {
      // Handle profile screen - APlasker
      if (typeof drawProfileScreen === 'function') {
        drawProfileScreen();
      } else {
        // Fallback while profile screen is being implemented
        textAlign(CENTER, CENTER);
        textSize(Math.max(playAreaWidth * 0.05, 18));
        fill(COLORS.text);
        text("Profile Screen\\n(Under Development)", playAreaX + playAreaWidth / 2, playAreaY + playAreaHeight / 2);
      }
      return;
    }

    // Check if we need to initialize the game after loading data
    // Don't reinitialize if we're in a win state (vessels not needed for win screen)
    if (vessels.length === 0 && !gameWon && gameStarted) {
      console.log("No vessels initialized yet, calling initializeGame()");
      initializeGame();
      return;
    }
    
    // Update hint animation progress if active
    if (hintAnimationActive) {
      hintAnimationProgress += 1 / hintAnimationDuration;
      if (hintAnimationProgress >= 1) {
        hintAnimationProgress = 1;
        // When animation completes, add to completed animations list
        if (hintAnimationTarget && !completedAnimations.includes(hintAnimationTarget)) {
          completedAnimations.push(hintAnimationTarget);
        }
        hintAnimationActive = false; // Deactivate animation once complete
      }
    }
    
    // Add safety check for vessel initialization - APlasker
    try {
      // Verify vessel initialization is correct
      if (gameStarted && vessels.some(v => !v.isInside || typeof v.isInside !== 'function')) {
        console.log("Found improperly initialized vessels, resetting game");
        resetGame();
        return;
      }
    } catch (error) {
      console.error("Error checking vessel initialization:", error);
      resetGame();
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
            updateBylineWithTransition("Drop one ingredient on to another to combine!"); // Updated default byline - APlasker
          }
        }
        
        // Check for inactivity when not transitioning and not showing a temporary byline
        if (!isTransitioning && bylineTimer === 0) {
          // Calculate progressive inactivity threshold based on how many reminders have been shown
          // First reminder at 10s, then 20s, 30s, etc.
          const currentInactivityThreshold = baseInactivityThreshold * (inactivityReminderCount + 1);
          
          if (frameCount - lastAction > currentInactivityThreshold) {
            // For tutorial mode, use the tutorial-specific inactivity message
            if (isTutorialMode) {
              // Only show tutorial inactivity message once
              if (!tutorialMessagesShown.inactivityShown) {
                updateBylineWithTransition(tutorialBylines.inactivity, bylineHintDuration);
                tutorialMessagesShown.inactivityShown = true;
              }
            } 
            // Regular game mode - choose message based on whether this is the first inactivity message
            else if (!firstInactivityMessageShown) {
              updateBylineWithTransition("Need the rules? Tap the question mark!", bylineHintDuration);
              firstInactivityMessageShown = true;
            } else {
              updateBylineWithTransition("Stuck? Use a Hint!", bylineHintDuration);
            }
            // Update lastAction to prevent repeated triggers
            lastAction = frameCount;
            // Increment the reminder count for next time
            inactivityReminderCount++;
          }
        }
      }
    }
    
    if (!gameStarted) {
      // Only draw the start screen with stats if recipe data is loaded
      if (typeof recipeDataLoadedForStats !== 'undefined' && recipeDataLoadedForStats) {
        // Draw start screen with animated demo and recipe stats
        drawStartScreen();
      } else {
        // Just draw the title while waiting for recipe data - no animation
        // This ensures we don't have another loading animation phase
        drawTitle();
        
        // Help icon removed from title screen - APlasker
      }
      
      // Draw hamburger menu on title screen
      if (typeof hamburgerMenu !== 'undefined') {
        hamburgerMenu.draw();
      }
    } else if (gameWon) {
      // Draw win screen
      drawWinScreen();
      
      // Draw hamburger menu on win screen
      if (typeof hamburgerMenu !== 'undefined') {
        hamburgerMenu.draw();
      }
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
      
      // Draw mistake counters separately (at 75% from top)
      drawMistakeCounters();
      
      // Check if only the final combination remains and disable hint button if so
      let onlyFinalComboRemains = isOnlyFinalComboRemaining();
      
      // Update hint button disabled state based on hint availability
      hintButton.disabled = onlyFinalComboRemains || !areHintsAvailable();
      
      // Check for auto final combination sequence
      if (onlyFinalComboRemains && !autoFinalCombinationStarted && !finalAnimationInProgress) {
        // Only start the auto sequence if there are at least 2 vessels
        // (otherwise there's nothing to auto-combine)
        if (vessels.length >= 2) {
          console.log("STARTING AUTO FINAL COMBINATION SEQUENCE");
          autoFinalCombination = true;
          autoFinalCombinationStarted = true;
          autoFinalCombinationTimer = 30; // Wait 1 second before starting the sequence
          // Set the state machine to WAITING
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
        
        // Check for active combine animations (particle effects)
        const hasActiveCombineAnimation = animations.some(anim => 
          anim instanceof CombineAnimation && anim.active);
        
        // Only decrement the timer if there are no active animations that would affect timing
        if (autoFinalCombinationTimer > 0 && !hasActiveVerbAnimation && !hasActiveMovementAnimation && !hasActiveCombineAnimation) {
          autoFinalCombinationTimer--;
        } else if (autoFinalCombinationTimer <= 0 && !hasActiveVerbAnimation && !hasActiveMovementAnimation && !hasActiveCombineAnimation) {
          // Only trigger the next step in the sequence if there are no active animations
          processAutoFinalCombination();
        }
      }
      
      // Draw hint button (removed hint vessel code)
      hintButton.draw();
      
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
    if (!gameWon) {
      drawHelpIcon();
    }
    
    // Draw help modal if active
    if (helpModal && helpModal.active) {
      helpModal.draw();
    }
    
    // Draw auth modal on top of everything (unified design system)
    if (typeof drawAuthModal === 'function') {
      drawAuthModal();
    }
    
    // Draw Terms & Conditions modal on top of auth modal
      // Terms modal is now handled by HTML/CSS - no need to draw on canvas
    
    // Update auth modal animations
    if (typeof updateAuthModalAnimation === 'function') {
      updateAuthModalAnimation();
    }
    
    // Draw the dragged vessel at the very end to ensure it's on top of everything
    if (draggedVessel && gameStarted && !gameWon) {
      draggedVessel.draw();
    }
    
    // Draw hamburger menu on top of everything (including flowers and animations)
    if (typeof hamburgerMenu !== 'undefined') {
      hamburgerMenu.draw();
    }
  }
  
  function drawTitle() {
    // Set text properties
    textAlign(CENTER, CENTER);
    
    // Calculate title size relative to play area width
    // Increased by 15% from the original value
    const titleSize = gameStarted ? 
      Math.max(playAreaWidth * 0.063 * 0.75, 26) : // Game screen: 75% smaller, min 26px (reduced from 35)
      Math.max(playAreaWidth * 0.08, 45);          // Title screen: larger size (8% of play area, min 45px)
    textSize(titleSize);
    
    // Use Courier Bold font for titles
    textStyle(BOLD);
    textFont(titleFont);
    
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
    
    // Add kerning (0% increase in spacing)
    const kerningFactor = 0; // 0% extra space
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
    
      // Calculate title Y position based on game state and layout
  // For title screen: positioned at 32% of play area height
  // For game screen: position varies by layout type
  const titleY = gameStarted ? 
    playAreaY + (playAreaHeight * getCurrentLayout().titlePosition) : // Position based on layout
    playAreaY + (playAreaHeight * 0.32);   // Title screen position
    
    // Calculate outline sizes based on screen type
    const outerSize = gameStarted ? 3 : 6.5;   // Game screen: smaller outlines, Title screen: larger outlines
    const middleSize = gameStarted ? 2 : 4.5;  // Game screen: smaller outlines, Title screen: larger outlines
    const innerSize = gameStarted ? 0.5 : 1.5;     // Game screen: smaller outlines, Title screen: larger outlines
    
    // IMPROVED OUTLINE APPROACH - Draw outlines for each letter that connect smoothly
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
      textSize(titleSize);
      
      for (let i = 0; i < title.length; i++) {
        // Calculate letter position with bounce effect
        let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
        let letterX = currentX + letterWidths[i]/2;
        let letterY = titleY + offsetY;
        
        // Draw outline for this letter
        for (let angle = 0; angle < TWO_PI; angle += PI/16) {
          let outlineOffsetX = cos(angle) * layerSize;
          let outlineOffsetY = sin(angle) * layerSize;
          text(title[i], letterX + outlineOffsetX, letterY + outlineOffsetY);
        }
        
        // Move to next letter position
        currentX += letterWidths[i] * (1 + kerningFactor);
      }
      pop();
    }
    
    // Second pass: Draw colored letters on top
    for (let i = 0; i < title.length; i++) {
      // Choose color based on position (cycle through green, yellow, red)
      let letterColor;
      switch (i % 3) {
        case 0:
          letterColor = '#cfc23f'; // Changed from COLORS.primary (olive green) to mustard yellow
          break;
        case 1:
          letterColor = '#f7dc30'; // Changed from COLORS.peach to bright yellow
          break;
        case 2:
          letterColor = COLORS.secondary; // Pink
          break;
      }
      
      // Calculate letter position with bounce effect
      // Even and odd letters bounce in opposite directions for playful effect
      let offsetY = (i % 2 === 0) ? bounceAmount : -bounceAmount;
      let letterX = x + letterWidths[i]/2;
      let letterY = titleY + offsetY;
      
      // Draw the colored letter
      push();
      textAlign(CENTER, CENTER);
      textSize(titleSize);
      fill(letterColor);
      text(title[i], letterX, letterY);
      pop();
      
      // Move to the next letter position with kerning
      x += letterWidths[i] * (1 + kerningFactor);
    }
    
    // Reset text style
    textStyle(NORMAL);
    
    // Add placeholder text for title screen if game hasn't started
    if (!gameStarted) {
      // Calculate position below title - adjusted to 42% from the top (changed from 48%)
      const placeholderY = playAreaY + (playAreaHeight * 0.42); // Changed from 0.48 to 0.42
      
      // Calculate placeholder text size to match byline
      const placeholderSize = Math.max(playAreaWidth * 0.035, 14);
      
      // Format the placeholder text with same style as byline
      textAlign(CENTER, CENTER);
      textSize(placeholderSize);
      textStyle(ITALIC); // Changed from BOLD to ITALIC
      textFont(titleFont); // Use title font for placeholder text
      fill(51, 51, 51, 255); // #333 fully opaque
      
      // Draw the placeholder text with quotation marks
      text("\"A daily recipe-building puzzle game\"", playAreaX + playAreaWidth/2, placeholderY);
    }
    
    // Draw the byline (only during gameplay)
    if (gameStarted && !gameWon) {
      drawByline();
    }
  }
  
  // Function to draw the byline - APlasker
  function drawByline() {
    // Only draw byline on game screen (not tutorial or win screens)
    if (!gameStarted || gameWon) return;
    
      // Position byline based on layout type
  const bylineY = playAreaY + (playAreaHeight * getCurrentLayout().bylinePosition);
    
    // Calculate byline size based on play area dimensions - match tutorial text
    const bylineSize = Math.max(playAreaWidth * 0.035, 14); // Same as description size in tutorial
    
    // Style the byline text to match tutorial style
    textAlign(CENTER, CENTER);
    textSize(bylineSize);
    textStyle(BOLD); // Match the tutorial "Decode the dish..." text style
    textFont('Helvetica, Arial, sans-serif'); // Use Helvetica for dynamic byline
    
    // Apply appropriate opacity based on transition state
    fill(51, 51, 51, bylineOpacity); // #333 with alpha
    
    // Always draw the current message with current opacity
    text(currentByline, playAreaX + playAreaWidth/2, bylineY);
    
    // Reset text style
    textStyle(NORMAL);
  }
  
  // New function to draw recipe statistics on the title screen
  function drawRecipeStats() {
    // Position at 70% from top of play area, centered horizontally
    const statsY = playAreaY + (playAreaHeight * 0.70); // Changed from 0.75 to 0.70
    
    // Get recipe data from loaded recipe
    const recipeNumber = typeof recipe !== 'undefined' && recipe.day_number ? recipe.day_number : "###";
    const recipeDate = typeof recipe !== 'undefined' && recipe.date ? recipe.date : "###";
    
    // Format the date from YYYY-MM-DD to MM/DD/YYYY if possible
    let formattedDate = "###";
    if (recipeDate !== "###") {
      try {
        const dateParts = recipeDate.split('-');
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
        } else {
          formattedDate = recipeDate;
        }
      } catch (e) {
        formattedDate = recipeDate;
      }
    }
    
    const recipeAuthor = typeof recipe !== 'undefined' && recipe.author ? recipe.author : "###";
    
    // Count ingredients (base ingredients from the recipe)
    const ingredientCount = typeof base_ingredients !== 'undefined' ? base_ingredients.length : "###";
    
    // Count combos (intermediate combinations + final combination)
    const comboCount = typeof intermediate_combinations !== 'undefined' ? 
      intermediate_combinations.length + 1 : "###"; // +1 for final combo
    
    // Use styling that matches the "How to Play" button style
    push();
    textAlign(CENTER, CENTER);
    // Use a fixed size based on play area width instead of relying on helpIconSize
    const statsTextSize = Math.max(playAreaWidth * 0.03, 12); // 3% of play area width, min 12px
    textSize(statsTextSize);
    textFont('Helvetica, Arial, sans-serif');
    textStyle(NORMAL);
    
    // Use COLORS.primary (green) to match the help button color
    fill(COLORS.primary);
    
    // Center the text horizontally in the play area
    const statsX = playAreaX + playAreaWidth / 2;
    
    // Draw each line of stats
    let lineHeight = 22;
    text(`Recipe No.${recipeNumber} (${formattedDate})`, statsX, statsY);
    text(`Adapted from ${recipeAuthor}`, statsX, statsY + lineHeight);
    text(`Ingredients: ${ingredientCount}`, statsX, statsY + lineHeight * 2);
    text(`Combos: ${comboCount}`, statsX, statsY + lineHeight * 3);
    
    pop();
  }
  
  function drawStartScreen() {
    // Isolate drawing context for start screen
    push();
    
    // Define margin to match the same relative calculation used elsewhere
    const margin = Math.max(playAreaWidth * 0.0125, 3); // 1.25% of play area width, min 3px
    
    // Calculate button sizes relative to play area
    const cookButtonWidth = Math.max(playAreaWidth * 0.25, 120); // 25% of play area width
    const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
    
    // First Time button should be half the width of Cook button
    const tutorialButtonWidth = cookButtonWidth * 0.5;
    
    // Position Cook button in the center of the screen
    startButton.x = playAreaX + playAreaWidth * 0.5; // Center horizontally (50%)
    startButton.y = playAreaY + playAreaHeight * 0.88; // 88% down the play area
    startButton.w = cookButtonWidth;
    startButton.h = buttonHeight;
    
    // Set fixed corner radius of 12px
    startButton.customCornerRadius = 12;
    
    // Position First Time button to the left of the Cook button with appropriate spacing
    // Calculate position based on Cook button position and sizes
    tutorialButton.x = startButton.x - (cookButtonWidth/2) - (tutorialButtonWidth/2) - 20; // 20px gap between buttons
    tutorialButton.y = startButton.y; // Same vertical position
    tutorialButton.w = tutorialButtonWidth;
    tutorialButton.h = buttonHeight;
    
    // Set fixed corner radius of 12px
    tutorialButton.customCornerRadius = 12;
    
    // Ensure text is stacked for tutorial button
    tutorialButton.label = "First\nTime?";
    tutorialButton.textSizeMultiplier = 0.8; // Reduce text size for stacked text
    
    // Draw both buttons after positioning them
    tutorialButton.draw();
    tutorialButton.checkHover(mouseX, mouseY);
    
    startButton.draw();
    startButton.checkHover(mouseX, mouseY);
    
    // Draw recipe statistics
    drawRecipeStats();
    
    // Draw version at bottom
    textAlign(CENTER, CENTER);
    const versionTextSize = Math.max(playAreaWidth * 0.016, 8); // 1.6% of width, min 8px
    textSize(versionTextSize);

    // Update version to reflect complete UI element display
    const versionText = "v20250719.740PM.EDT - APlasker";

    // Combine version and "Say hi!" into one line with pipe separator
    const combinedText = versionText + " | Say hi!";
    
    // Draw the version part in gray
    fill(100); // Gray color for version text
    const versionWidth = textWidth(versionText);
    const pipeWidth = textWidth(" | ");
    const sayHiWidth = textWidth("Say hi!");
    const totalWidth = versionWidth + pipeWidth + sayHiWidth;
    
    // Calculate starting position to center the entire combined text
    const startX = playAreaX + playAreaWidth/2 - totalWidth/2;
    
    // Draw version text
    text(versionText, startX + versionWidth/2, playAreaY + playAreaHeight * 0.985);
    
    // Draw pipe separator in gray
    text(" | ", startX + versionWidth + pipeWidth/2, playAreaY + playAreaHeight * 0.985);
    
    // Draw "Say hi!" in green
    fill(COLORS.primary); // Green color for the link
    text("Say hi!", startX + versionWidth + pipeWidth + sayHiWidth/2, playAreaY + playAreaHeight * 0.985);
    
    // Store position and dimensions for hit detection (only for the "Say hi!" part)
    tutorialSayHiLinkX = startX + versionWidth + pipeWidth + sayHiWidth/2;
    tutorialSayHiLinkY = playAreaY + playAreaHeight * 0.985;
    tutorialSayHiLinkWidth = sayHiWidth * 1.2; // Add some padding
    tutorialSayHiLinkHeight = textAscent() + textDescent();
    
    // Check if mouse is over the Say hi link in tutorial screen
    isTutorialMouseOverSayHi = mouseX > tutorialSayHiLinkX - tutorialSayHiLinkWidth/2 && 
                       mouseX < tutorialSayHiLinkX + tutorialSayHiLinkWidth/2 && 
                       mouseY > tutorialSayHiLinkY - tutorialSayHiLinkHeight/2 && 
                       mouseY < tutorialSayHiLinkY + tutorialSayHiLinkHeight/2;
    
    // Change cursor to pointer if over the link
    if (isTutorialMouseOverSayHi) {
      cursor(HAND);
    }
    
    // Restore drawing context
    pop();
  }
  
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
  
  // Add a reset function to handle initialization issues - APlasker
  function resetGame() {
    console.log("Resetting game due to initialization issues");
    // Clear current state
    vessels = [];
    animations = [];
    draggedVessel = null;
    gameStarted = false;
    gameWon = false;
    
    // Reset game flags
    isLoadingRecipe = false;
    loadingError = false;
    
    // Force a delay before reinitializing
    setTimeout(() => {
      // Reinitialize
      console.log("Reinitializing game after reset");
      initializeGame();
    }, 100); // Short delay to ensure clean state
  }
  
  // Add a new class for the special final animation
  // CLASS FinalVerbAnimation (lines 2062-2268) WAS MOVED TO js/animation.js
  
  // Function to create a final verb animation and delay the win screen
  function createFinalVerbAnimation(verb) {
    // Default verb if none is provided
    const displayVerb = verb || "Complete!";
    
    // Find the final vessel
    const finalVessel = vessels.find(v => v.name === final_combination.name);
    
    // Create the special animation with vessel reference
    animations.push(new FinalVerbAnimation(displayVerb, finalVessel));
    
    // Create the persistent flower animation instead of adding to regular animations
    persistentFlowerAnimation = new FlowerBurstAnimation();
  }
  
  // Add a class for the celebratory flower burst animation
  class FlowerBurstAnimation {
    constructor() {
      this.active = true;
      this.duration = 90; // 3 seconds at 30fps (reduced from 180)
      this.progress = 0;
      this.flowers = [];
      this.delayFrames = 23; // Delay start by 0.75 seconds (23 frames at 30fps, reduced from 45)
      this.delayComplete = false;
      
      // Center of the screen
      this.centerX = playAreaX + playAreaWidth/2;
      this.centerY = playAreaY + playAreaHeight/2;
      
      // Create flowers that will burst outward
      const numberOfFlowers = 60; // Lots of flowers for a dense effect
      
      for (let i = 0; i < numberOfFlowers; i++) {
        // Random angle for outward trajectory
        const angle = random(TWO_PI);
        
        // Random distance from center (will be multiplied by progress)
        const maxRadius = max(width, height) * 1.5; // Much larger to ensure flowers leave screen
        const radius = random(maxRadius * 0.7, maxRadius);
        
        // Random size for variety
        const size = random(10, 25);
        
        // Random speed for varied expansion
        const speed = random(0.8, 1.2);
        
        // Random color from our palette (green, orange, yellow only)
        const colorOptions = [COLORS.primary, COLORS.secondary, COLORS.tertiary];
        const color = colorOptions[floor(random(colorOptions.length))];
        
        // Create the flower with simpler properties (no rotation or gravity)
        this.flowers.push({
          angle,
          radius,
          size,
          color,
          speed
        });
      }
      
      console.log("Created simplified flower burst animation with", numberOfFlowers, "flowers (delayed by 0.75s)");
    }
    
    update() {
      // Handle delay before starting animation
      if (!this.delayComplete) {
        this.delayFrames--;
        if (this.delayFrames <= 0) {
          this.delayComplete = true;
          console.log("Flower burst delay complete, starting animation");
        }
        return false; // Don't remove during delay
      }
      
      // Update progress once delay is complete
      this.progress += 1 / this.duration;
      
      // Animation complete when progress reaches 1
      if (this.progress >= 1) {
        this.active = false;
        return true;
      }
      
      return false;
    }
    
    draw() {
      // Don't draw anything during the delay period
      if (!this.delayComplete || !this.active) return;
      
      push();
      
      for (const flower of this.flowers) {
        // Calculate current radius - continuous expansion throughout the animation
        // Using easeOutQuad for natural feeling acceleration at the start
        const easeOutQuad = 1 - (1 - this.progress) * (1 - this.progress);
        const currentRadius = flower.radius * easeOutQuad * flower.speed;
        
        // Calculate position with straight outward movement (no rotation)
        const x = this.centerX + cos(flower.angle) * currentRadius;
        const y = this.centerY + sin(flower.angle) * currentRadius;
        
        // Only draw if on screen (performance optimization)
        if (x > -flower.size && x < width + flower.size && 
            y > -flower.size && y < height + flower.size) {
          // Draw the flower
          drawFlower(x, y, flower.size, flower.color);
        }
      }
      
      pop();
    }
  }
  
  // Function to actually show the win screen after animation completes
  
  
  // Add a new helper function for creating verb animations after vessel positioning
  function createVerbAnimationForVessel(vessel) {
    let verbFound = false;
    
    // First, check if this is the final combination
    const isFinalCombination = vessels.length === 1 && vessel.name === final_combination.name;
    
    if (isFinalCombination) {
      console.log("Final combination detected in createVerbAnimationForVessel - using FinalVerbAnimation");
      
      // For final combinations, find the verb but don't create regular animation
      if (final_combination.verb) {
        vessel.verb = final_combination.verb;
        verbFound = true;
        console.log(`Found verb "${vessel.verb}" for final vessel`);
      } else {
        // Fallback verb for final combination if none exists
        vessel.verb = "Complete!";
        verbFound = true;
        console.log("Using fallback verb 'Complete!' for final vessel");
      }
      
      // Create special final verb animation instead of regular one
      const finalVerb = vessel.verb;
      createFinalVerbAnimation(finalVerb);
      
      // Set verbDisplayTime to prevent duplicate animations
      vessel.verbDisplayTime = 119;
      
      return true;
    }
    
    // If not final combination, proceed with regular verb setting
    // Find and set the verb from intermediate combinations
    for (let combo of intermediate_combinations) {
      if (combo.name === vessel.name && combo.verb) {
        vessel.verb = combo.verb;
        verbFound = true;
        console.log(`Found verb "${vessel.verb}" for vessel: ${vessel.name}`);
        break;
      }
    }
    
    // Check final combination reference if no verb found yet (for non-final vessels that use final recipe)
    if (!verbFound && final_combination.name === vessel.name) {
      if (final_combination.verb) {
        vessel.verb = final_combination.verb;
        verbFound = true;
        console.log(`Found verb "${vessel.verb}" for vessel with final recipe name`);
      } else {
        // Fallback verb for final combination if none exists
        vessel.verb = "Prepare";
        verbFound = true;
        console.log("Using fallback verb for vessel with final recipe name");
      }
    }
    
    // If we still don't have a verb, use a default
    if (!verbFound && !vessel.verb) {
      vessel.verb = "Mix";
      console.log("No verb found, using default verb 'Mix'");
    }
    
    // Create the animation directly instead of waiting for displayVerb to be called
    console.log("Creating immediate verb animation for:", vessel.verb, "at position", vessel.x, vessel.y);
    animations.push(new VerbAnimation(vessel.verb, vessel.x, vessel.y, vessel));
    
    // Set verbDisplayTime to 119 to prevent duplicate animations from displayVerb()
    vessel.verbDisplayTime = 119;
    
    return true;
  }
  
  function drawTitleScreen() {
    // Draw title screen elements
    drawTitle();
    drawStartScreen();
    
    // Draw hamburger menu if it exists
    if (typeof hamburgerMenu !== 'undefined') {
      hamburgerMenu.draw();
    }
  }

  function drawWinScreen() {
    // ... existing win screen code ...
    
    // Draw hamburger menu if it exists
    if (typeof hamburgerMenu !== 'undefined') {
      hamburgerMenu.draw();
    }
  }

  // Helper function to draw text with custom kerning
  function drawTextWithKerning(textString, x, y, kerningFactor) {
    let currentX = x;
    
    for (let i = 0; i < textString.length; i++) {
      const char = textString[i];
      const charWidth = textWidth(char);
      
      // Draw the character using p5.js text function with string parameter
      push();
      textAlign(LEFT, CENTER); // Ensure consistent alignment for each character
      text(char, currentX, y);
      pop();
      
      // Move to next position with kerning applied
      if (i < textString.length - 1) { // Don't apply kerning after the last character
        currentX += charWidth * (1 + kerningFactor);
      }
    }
  }
  