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
  
  // Add a global variable to store the calculated smallest font size
  let recipeCardFontSize = null; 
  
  // Combined function to draw combo counter only - APlasker
  function drawGameCounters() {
    // Isolate drawing context for game counters
    push();
    
    // Position counters at 89% from the top of the play area (updated from 87%)
    const counterY = playAreaY + playAreaHeight * 0.905; // Updated from 0.89 to 0.905 (1.5% lower)
    
    // Position card horizontally at the center of the screen
    const centerX = playAreaX + playAreaWidth / 2;
    
    // Get the total number of possible combinations (including final combination)
    const totalCombos = intermediate_combinations.length + 1;
    
    // --- CALCULATE RESPONSIVE SIZING BASED ON AVAILABLE SPACE - APlasker ---
    // Use playAreaWidth to calculate responsive sizes
    
    // Calculate card dimensions (updated height)
    const cardPadding = Math.max(playAreaWidth * 0.03, 15); // Padding inside card (3% of play area width, min 15px)
    const cardWidth = Math.max(playAreaWidth * 0.95, 200); // 95% of play area width, min 200px
    const cardHeight = playAreaHeight * 0.23; // 23% of play area height
    
    // Position card (centered horizontally and at 89% from top vertically)
    const cardX = centerX;
    const cardY = counterY;
    
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
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY - cardHeight/2 + cornerOffset, flowerSize, COLORS.secondary); // Top-right
    drawFlower(cardX - cardWidth/2 + cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.peach); // Bottom-left - Changed from tertiary to peach - APlasker
    drawFlower(cardX + cardWidth/2 - cornerOffset, cardY + cardHeight/2 - cornerOffset, flowerSize, COLORS.primary); // Bottom-right
    
    // Create an array of combo information objects with ingredient counts
    const comboInfo = [];
    
    // --- MOVE HINT BUTTON TO NEW POSITION ON TOP OF RECIPE CARD AND CHANGE TO CIRCLE ---
    if (hintButton) {
      // Calculate circular hint button size - 66% of the recipe card height
      const hintButtonDiameter = cardHeight * 0.66 * 0.8; // Reduced to 80% of original size
      
      // Position hint button on top of the recipe card
      // Positioned 55% from the top edge and 82% from the left edge of the card (moved 2% right)
      const newHintButtonX = cardX - cardWidth/2 + (cardWidth * 0.82); // 82% from the left edge of the card (moved from 80%)
      const newHintButtonY = cardY - cardHeight/2 + (cardHeight * 0.55); // 55% from the top edge of the card
      
      // Update hint button position
      hintButton.x = newHintButtonX;
      hintButton.y = newHintButtonY;
    
      // Update hint button size and shape
      hintButton.w = hintButtonDiameter;
      hintButton.h = hintButtonDiameter;
      // Set isCircular flag to true for circle shape
      hintButton.isCircular = true;
      
      // Change hint button color to match Cook! button (pink) and text to white
      hintButton.color = COLORS.secondary;
      hintButton.textColor = 'white';
      
      // Reduce hint text size to 50% of current size
      hintButton.textSizeMultiplier = 0.5;
      
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
        
        // Sort base-ingredients-only combos to the left (instead of right)
        if (a.isBaseIngredientsOnly && !b.isBaseIngredientsOnly) return -1;
        if (!a.isBaseIngredientsOnly && b.isBaseIngredientsOnly) return 1;
        
        // If they share the same parent, keep them together
        if (a.parent && b.parent && a.parent === b.parent) {
          // If they share a parent, sort alphabetically or by some other property
          return a.name.localeCompare(b.name);
        }
        
        // If a is a parent of b, put b first
        if (a.children.includes(b.name)) {
          return 1; // Parent comes after child
        }
        
        // If b is a parent of a, put a first
        if (b.children.includes(a.name)) {
          return -1; // Child comes before parent
        }
        
        // For base-ingredients-only combos, sort by ingredient count (highest count leftmost)
        if (a.isBaseIngredientsOnly && b.isBaseIngredientsOnly) {
          return b.requiredCount - a.requiredCount;
        }
        
        // For other combos, use the existing logic
        return a.baseIngredientPercentage - b.baseIngredientPercentage;
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
    // Calculate the vertical spacing within the card
    const verticalMargin = cardHeight * 0.02; // 2% top margin (reduced from 3% by 33%)
    const bottomMargin = cardHeight * 0.05; // 5% bottom margin (unchanged)
    const availableHeight = cardHeight - (verticalMargin + bottomMargin); // Available height after margins
    const totalLines = comboInfo.length + 1; // +1 for the "Recipe" header
    const lineHeight = Math.max(availableHeight / totalLines, 20); // Minimum line height of 20px
    
    // Default font size based on line height
    const defaultFontSize = Math.min(lineHeight * 0.4, 14);
    
    // --- CALCULATE SMALLEST NECESSARY FONT SIZE FOR ALL POSSIBLE COMBOS ---
    // Only calculate this once during the game session
    if (recipeCardFontSize === null) {
      console.log("Calculating smallest necessary font size for all possible combinations");
      
      // Start with the default font size
      let smallestFontSize = defaultFontSize;
      const maxTextWidth = cardWidth * 0.58; // Changed from 0.60 to 0.58
      
      // Check all possible combinations, but exclude the final combination
      // since it won't be revealed in the recipe card during gameplay
      const allPossibleCombos = [...intermediate_combinations];
      
      // First pass: Check all possible combinations with their maximum possible text length
      for (let combo of allPossibleCombos) {
        // Find the verb
        let verb = combo.verb || "Mix"; // Use combo's verb or default to "Mix"
        let name = combo.name;
        
        // Format with the longest possible text (verb + the + name + max progress)
        const capitalizedVerb = verb.charAt(0).toUpperCase() + verb.slice(1);
        
        // Create text in the format with the progress counter (largest possible format)
        const fullText = `${capitalizedVerb} the ${name} (${combo.required.length})`;
        
        // Set the font size for measurement
        textSize(defaultFontSize);
        
        // Check if this text would be too long with default font size
        if (textWidth(fullText) > maxTextWidth) {
          // First try 90% of default font size
          textSize(Math.max(defaultFontSize * 0.9, 8));
          // Check if text fits at 90% size
          if (textWidth(fullText) > maxTextWidth) {
            // If still too long, reduce to 80% of default
            const reducedFontSize = Math.max(defaultFontSize * 0.8, 8);
            
            // Update smallest font size if this is smaller
            if (reducedFontSize < smallestFontSize) {
              smallestFontSize = reducedFontSize;
            }
          } else {
            // 90% size is sufficient
            const reducedFontSize = Math.max(defaultFontSize * 0.9, 8);
            
            // Update smallest font size if this is smaller
            if (reducedFontSize < smallestFontSize) {
              smallestFontSize = reducedFontSize;
            }
          }
        }
      }
      
      // Store the calculated smallest font size for the entire game session
      recipeCardFontSize = smallestFontSize;
      console.log(`Smallest necessary font size for all combinations: ${recipeCardFontSize}px`);
    }
    
    // Calculate starting Y position (top margin + half line height for vertical centering)
    const startY = cardY - cardHeight/2 + verticalMargin + lineHeight/2;
    
    // Calculate left margin for text (6% from left edge of card)
    const textLeftMargin = cardX - cardWidth/2 + (cardWidth * 0.06); // Changed from 0.1 to 0.06
    
    // --- RESET ALL TEXT PROPERTIES FOR CONSISTENCY - APlasker ---
    textFont(bodyFont);
    textStyle(NORMAL);
    
    // --- DRAW HEADER ---
    // Draw "Recipe" label at the top line - centered
    fill('black');
    noStroke();
    textAlign(CENTER, CENTER); // Center alignment for title
    textSize(Math.min(lineHeight * 0.6, 18) - 2); // Text size scaled to line height, max 18px, reduced by 2px
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
      // Calculate y position for this combo (each on its own line)
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
        
        // Check if text is too long and needs truncation with the smallest font size
        const maxTextWidth = cardWidth * 0.58; // Changed from 0.60 to 0.58
        
        if (textWidth(comboText) > maxTextWidth) {
          // Text is too long, remove "the" instead of using ellipsis
          comboText = `${capitalizedVerb} ${name}`;
          
          // If it's still too long, then truncate the name
          if (textWidth(comboText) > maxTextWidth) {
            // Calculate how many characters we can fit
            let charIndex = 0;
            
            while (textWidth(`${capitalizedVerb} ${name.slice(0, charIndex)}`) < maxTextWidth && charIndex < name.length) {
              charIndex++;
            }
            
            // Go back one character to ensure we're under the limit
            charIndex = Math.max(0, charIndex - 1);
            comboText = `${capitalizedVerb} ${name.slice(0, charIndex)}`;
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
        
        // We already know the smallest font size, so just check for truncation
        const maxTextWidth = cardWidth * 0.58; // Changed from 0.60 to 0.58
        let truncatedText = fullText;
        
        if (textWidth(fullText) > maxTextWidth) {
          // First try removing "the" instead of using ellipsis
          truncatedText = `${capitalizedVerb} ${name} ${progressText}`;
          
          // If still too long, truncate the name
          if (textWidth(truncatedText) > maxTextWidth) {
            // Calculate how many characters of the name we can show
            let charIndex = 0;
            
            while (textWidth(`${capitalizedVerb} ${name.slice(0, charIndex)} ${progressText}`) < maxTextWidth && charIndex < name.length) {
              charIndex++;
            }
            
            // Go back one character to ensure we're under the limit
            charIndex = Math.max(0, charIndex - 1);
            truncatedText = `${capitalizedVerb} ${name.slice(0, charIndex)} ${progressText}`;
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
          
          // For other incomplete combos, replace "# ingredients" with "? ? ? ?"
          // Generate a string of question marks with spaces equal to the number of ingredients
          let questionMarks = Array(ingredientCount).fill("?").join(" ");
          comboText = questionMarks;
        }
        // No need to set font size here as we're using the global smallest font size
      }
      
      // Add step prefix
      const stepPrefix = stepPrefixes[i] || `Step ${i+1}: `; // Fallback to "Step N: " if we exceed available prefixes
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
        const mainTextWidth = textWidth(comboText);
        textSize(prefixFontSize); // Set back to prefix font size
        
        // IMPORTANT: Use the exact same color that the vessel will have when completed
        // This ensures perfect color matching between highlight and future vessel
        noStroke();
        
        // Call getNextCompletedVesselColor with the combo name to get the exact same color
        // that will be used when this vessel is created
        const highlightColor = getNextCompletedVesselColor(combo.name);
        fill(highlightColor);
        
        // Draw parallelogram shape - skewed to the right
        const skew = 6; // Amount of skew for parallelogram
        const highlightHeight = lineHeight * 0.8; // 80% of line height
        const highlightY = y - highlightHeight/2;
        
        beginShape();
        vertex(textLeftMargin + stepPrefixWidth, highlightY); // Top left
        vertex(textLeftMargin + stepPrefixWidth + mainTextWidth + skew, highlightY); // Top right
        vertex(textLeftMargin + stepPrefixWidth + mainTextWidth, highlightY + highlightHeight); // Bottom right
        vertex(textLeftMargin + stepPrefixWidth - skew, highlightY + highlightHeight); // Bottom left
        endShape(CLOSE);
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
        text(comboText, textLeftMargin + stepPrefixWidth, y);
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
            // Calculate color blend from red to black after text reveal is complete
            const colorTransitionProgress = (hintAnimationProgress - hintAnimationTextRevealDuration) / (1 - hintAnimationTextRevealDuration);
            const r = lerp(255, 0, colorTransitionProgress);  // Red from 255 to 0
            const g = lerp(82, 0, colorTransitionProgress);   // Green from 82 to 0
            const b = lerp(82, 0, colorTransitionProgress);   // Blue from 82 to 0
            
            // Create blended color
            fill(r, g, b);
          } else {
            // During text reveal, use hint color (red)
            fill(COLORS.vesselHint);
          }
        } else if (hasCompletedAnimation) {
          // For combos that have completed animation, use black
          fill(0);
        } else {
          // For non-animated hinted combos that haven't been through animation, use hint color (red)
          fill(COLORS.vesselHint);
        }
        
        // Draw prefix with same font
        textStyle(BOLD); // Make step prefix bold
        text(stepPrefix, textLeftMargin, y);
        
        // Draw the rest of the text
        textSize(comboFontSize);
        textStyle(NORMAL); // Reset to normal text style for combo text
        text(comboText, textLeftMargin + stepPrefixWidth, y);
      } else {
        // For incomplete combos, just show the question marks
        fill('#333333'); // Darker gray for incomplete
        noStroke();
        
        // Draw prefix in bold
        textStyle(BOLD);
        text(stepPrefix, textLeftMargin, y);
        
        // Draw the rest of the text (question marks) in normal style
        textStyle(NORMAL);
        text(comboText, textLeftMargin + stepPrefixWidth, y);
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
    
    // Position mistake counters at 75% from the top of the play area
    const counterY = playAreaY + playAreaHeight * 0.75;
    
    // Center of the play area for overall positioning
    const centerX = playAreaX + playAreaWidth / 2;
    
    // --- WRONGO COUNTER SECTION ---
    const totalErrorSlots = 4; // Show 4 slots for wrongos - APlasker
    
    // Filter moveHistory to only include error markers (black only) - APlasker
    const filteredMoveHistory = moveHistory.filter(move => 
      move === 'black' || move === '#333333');
    
    // Limit the number of counters to display
    const displayCount = Math.min(filteredMoveHistory.length, totalErrorSlots);
    
    // Update circle sizing parameters to match requested specs - APlasker
    // Reduced to 75% of original size
    // Original: Minimum size: 18px for small screens
    // Now: Minimum size: 13.5px for small screens
    const circleSize = Math.min(Math.max(width * 0.015, 13.5), 16.5); // 75% of original values
    
    // Update element spacing to match requested specs - APlasker
    // Reduced to 75% of original size
    const elementSpacing = Math.min(Math.max(width * 0.0075, 3.75), 7.5); // 75% of original values
    
    // Double the spacing between text and first counter
    const textToFirstCounterSpacing = elementSpacing * 2;
    
    // Calculate the total width of all elements with consistent spacing
    const totalWidth = (circleSize * totalErrorSlots) + (elementSpacing * (totalErrorSlots - 1)) + textToFirstCounterSpacing;
    
    // Calculate label width based on available space - fixed proportion
    const labelFontSize = Math.max(circleSize * 0.6, 10.5); // Text size for "Mistakes:" (75% of original)
    textFont(bodyFont);
    textStyle(BOLD);
    textSize(labelFontSize); // Set the font size before measuring text width
    const labelWidth = textWidth("Mistakes:") + textToFirstCounterSpacing; // Use the doubled spacing after colon
    
    // Calculate total width needed for the entire mistake counter group
    const groupWidth = labelWidth + (circleSize * totalErrorSlots) + (elementSpacing * (totalErrorSlots - 1));
    
    // Calculate starting position to center the entire group
    const groupStartX = centerX - (groupWidth / 2);
    
    // --- RESET ALL TEXT PROPERTIES FOR CONSISTENCY - APlasker ---
    textFont(bodyFont);
    textStyle(NORMAL);
    
    // Draw "Mistakes:" label
    textAlign(LEFT, CENTER); // Changed back to LEFT align for consistent spacing
    textSize(labelFontSize);
    textStyle(BOLD);
    fill('black');
    noStroke();
    text("Mistakes:", groupStartX, counterY);
    
    // Calculate starting position of first counter after label with doubled spacing
    const firstCounterX = groupStartX + textWidth("Mistakes:") + textToFirstCounterSpacing;
    
    // Draw error circles - both filled and empty placeholders
    for (let i = 0; i < totalErrorSlots; i++) {
      // Position circles with consistent spacing
      const x = firstCounterX + (i * (circleSize + elementSpacing));
      const y = counterY;
      
      if (i < displayCount) {
        // Filled error counter (black)
        fill('black');
        stroke(0, 50); // Use the same subtle border as buttons
        strokeWeight(1.5); // Reduced from 2px (75% of original)
        circle(x, y, circleSize);
        
        // If there are 5+ wrongos, add red X's to wrongo counters - APlasker
        if (filteredMoveHistory.length >= 5) {
          stroke(COLORS.vesselHint); // Changed to burnt orange hint color - APlasker
          strokeWeight(Math.max(circleSize * 0.1, 1.5)); // Relative stroke weight, min 1.5px (75% of original)
          // Draw X with the same vertical adjustment as the combo numbers
          const offsetY = circleSize * 0.05; // Reduced from 0.1 to 0.05 (split the difference)
          line(x - circleSize/3, y - circleSize/3 + offsetY, x + circleSize/3, y + circleSize/3 + offsetY);
          line(x + circleSize/3, y - circleSize/3 + offsetY, x - circleSize/3, y + circleSize/3 + offsetY);
        }
      } else {
        // Empty error placeholder - 25% opacity black (reduced from 50%) - APlasker
        fill('rgba(0, 0, 0, 0.25)');
        stroke(0, 50); // Use the same subtle border as buttons
        strokeWeight(1.5); // Reduced from 2px (75% of original)
        circle(x, y, circleSize);
      }
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
    
    // Draw center with a slightly different shade
    fill(255, 255, 255, 100); // Semi-transparent white for a highlight
    ellipse(x, y, petalSize, petalSize);
  }

  // New function to draw loading animation with color-changing flowers
  function drawLoadingAnimation() {
    // Calculate the center of the play area
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate responsive flower size based on screen dimensions
    const flowerSize = min(max(playAreaWidth * 0.02, 8), 12);
    
    // Define the circle of flowers parameters
    const numFlowers = 8; // Number of flowers in the circle
    const circleRadius = min(playAreaWidth * 0.15, 80); // Size of the circle
    
    // Array of colors to cycle through
    const colorArray = [
      COLORS.primary,   // Green
      COLORS.secondary, // Pink
      COLORS.peach      // Peach/orange
    ];
    
    // Draw flowers in a circle
    for (let i = 0; i < numFlowers; i++) {
      // Calculate position around the circle
      const angle = (TWO_PI / numFlowers) * i;
      const x = centerX + cos(angle) * circleRadius;
      const y = centerY + sin(angle) * circleRadius;
      
      // Determine flower color by shifting based on frameCount
      // This creates a cycling color effect with no fading
      const colorIndex = (i + floor(frameCount / 15)) % colorArray.length;
      const flowerColor = colorArray[colorIndex];
      
      // Draw the flower
      drawFlower(x, y, flowerSize, flowerColor);
    }
    
    // Center flower removed as requested
  }

  function draw() {
    // Set background color
    background(COLORS.background);
    
    // Check if we're still loading recipe data (initial loading state only)
    if (isLoadingRecipe) {
      // Draw loading animation only during initial loading
      drawLoadingAnimation();
      
      // Draw floral pattern border if there's space - moved here from outside
      drawFloralBorder();
      
      // Draw top and bottom flowers on narrow screens - moved here from outside
      drawTopBottomFlowers();
      
      return;
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
          autoFinalCombinationTimer = 12; // Wait 0.4 seconds before starting the sequence (reduced from 60)
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
    
    // Draw the dragged vessel at the very end to ensure it's on top of everything
    if (draggedVessel && gameStarted && !gameWon) {
      draggedVessel.draw();
    }
  }
  
  function drawTitle() {
    // Set text properties
    textAlign(CENTER, CENTER);
    
    // Calculate title size relative to play area width
    // Increased by 15% from the original value
    const titleSize = gameStarted ? 
      Math.max(playAreaWidth * 0.063 * 0.75, 26) : // Game screen: 75% smaller, min 26px (reduced from 35)
      Math.max(playAreaWidth * 0.063, 35);         // Title screen: original size
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
    
    // Calculate title Y position based on game state
    // For title screen: positioned at 35% of play area height (changed from 40%)
    // For game screen: positioned at 8% of play area height (increased from 6.5%)
    const titleY = gameStarted ? 
      playAreaY + (playAreaHeight * 0.05) : // Game screen position (reduced from 8% to 5%)
      playAreaY + (playAreaHeight * 0.32);   // Title screen position (reduced from 0.35 to 0.32)
    
    // Draw each letter with alternating colors
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
      
      // SOLID OUTLINE APPROACH - Create smooth solid outlines with multiple text copies
      push(); // Save drawing state
      
      // Set text properties for all layers
      textAlign(CENTER, CENTER);
      textSize(titleSize);
      
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
        text(title[i], letterX + offsetX, letterY + offsetY);
      }
      
      // 2. Draw middle peach layer using multiple offset copies
      fill(COLORS.peach);
      for (let angle = 0; angle < TWO_PI; angle += PI/8) {
        let offsetX = cos(angle) * middleSize;
        let offsetY = sin(angle) * middleSize;
        text(title[i], letterX + offsetX, letterY + offsetY);
      }
      
      // 3. Draw inner black layer using multiple offset copies
      fill('black');
      for (let angle = 0; angle < TWO_PI; angle += PI/8) {
        let offsetX = cos(angle) * innerSize;
        let offsetY = sin(angle) * innerSize;
        text(title[i], letterX + offsetX, letterY + offsetY);
      }
      
      // 4. Draw the final colored letter in the center
      fill(letterColor);
      text(title[i], letterX, letterY);
      
      pop(); // Restore drawing state
      
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
      textFont('Arial, Helvetica, sans-serif');
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
    
    // Position byline at 10% of play area height from the top (moved up by 3%)
    const bylineY = playAreaY + (playAreaHeight * 0.10); // Changed from 13% to 10% of play area height
    
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
    textFont('Arial, Helvetica, sans-serif');
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
    const buttonWidth = Math.max(playAreaWidth * 0.25, 120); // Reduced from 30% to 25% of play area width - APlasker
    const buttonHeight = Math.max(playAreaHeight * 0.08, 40);
    
    // Update button dimensions for both buttons
    startButton.w = buttonWidth;
    startButton.h = buttonHeight;
    
    // Position both buttons properly - APlasker
    tutorialButton.x = playAreaX + playAreaWidth * 0.3; // 30% of play area width
    tutorialButton.y = playAreaY + playAreaHeight * 0.88; // Lowered from 85% to 88% - APlasker
    tutorialButton.w = buttonWidth;
    tutorialButton.h = buttonHeight;
    
    startButton.x = playAreaX + playAreaWidth * 0.7; // 70% of play area width
    startButton.y = playAreaY + playAreaHeight * 0.88; // Lowered from 85% to 88% - APlasker
    
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
    fill(100); // Gray color for version text

    // ENHANCEMENT - APlasker - Update version to reflect recipe stats fix
    const versionText = "v20250516.0820 - APlasker";

    // Center the version text at the bottom of the play area
    text(versionText, playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.98);
    
    // Add "Say hi!" link below the version text
    textSize(min(max(playAreaWidth * 0.022, 9), 12)); // Slightly smaller than win screen
    fill(COLORS.primary); // Green color for the link
    text("Say hi!", playAreaX + playAreaWidth/2, playAreaY + playAreaHeight * 0.993); // Positioned even lower, near the bottom edge
    
    // Store position and dimensions for hit detection (in global variables)
    tutorialSayHiLinkX = playAreaX + playAreaWidth/2;
    tutorialSayHiLinkY = playAreaY + playAreaHeight * 0.993;
    tutorialSayHiLinkWidth = textWidth("Say hi!") * 1.2; // Add some padding
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
  class FinalVerbAnimation extends VerbAnimation {
    constructor(verb, vessel) {
      // Get vessel position if available, otherwise use center
      const startX = vessel ? vessel.x : playAreaX + playAreaWidth/2;
      const startY = vessel ? vessel.y : playAreaY + playAreaHeight/2;
      
      // Transform verb to uppercase and add exclamation mark before calling parent constructor
      const transformedVerb = verb.toUpperCase() + "!";
      
      // Call parent constructor with vessel reference
      super(transformedVerb, startX, startY, vessel);
      
      // Override properties for more dramatic effect
      this.maxSize = playAreaWidth; // Limit to exact play area width (was playAreaWidth * 1.2)
      this.duration = 72; // 2.4 seconds at 30fps (reduced from 144)
      this.initialSize = this.vesselRef ? Math.max(this.vesselRef.w, this.vesselRef.h) * 0.75 : this.maxSize * 0.5;
      
      // Set flag to prevent game win until animation completes
      this.isFinalAnimation = true;
      
      // Add transition circle properties
      this.transitionCircleSize = 0;
      this.transitionCircleOpacity = 255;
      // Use 110% of whichever dimension is larger (width or height)
      this.maxCircleSize = max(width, height) * 1.1; 
      
      console.log("Creating FINAL verb animation for:", verb, "at position:", startX, startY);
    }
    
    // Override update to signal when to proceed to win screen
    update() {
      const result = super.update();
      
      // Track frames explicitly for more precise timing
      const framesPassed = this.progress * this.duration;
      
      // Check if we've reached exactly 38 frames (1.25 seconds at 30fps)
      if (framesPassed >= 38) {
        console.log("Final verb animation at frame 38 - showing win screen with hard cut transition");
        showWinScreen();
        // Mark animation as complete
        this.active = false;
        return true;
      }
      
      return result;
    }
    
    // Override draw to make text larger and more dramatic
    draw() {
      if (!this.active) return;
      
      // Calculate animation phases
      const growPhase = 0.3; // First 30% of animation is growth
      const holdPhase = 0.7; // Hold until 70% of animation
      
      // Calculate size based on animation phase
      let currentSize;
      if (this.progress < growPhase) {
        // Growing phase - ease in with cubic function
        const t = this.progress / growPhase;
        const easedT = t * t * (3 - 2 * t); // Smooth step function
        // Start at initialSize and grow to maxSize
        currentSize = map(easedT, 0, 1, this.initialSize, this.maxSize);
      } else if (this.progress < holdPhase) {
        // Hold phase - maintain full size
        currentSize = this.maxSize;
      } else {
        // No shrinking, maintain size but fade out
        currentSize = this.maxSize;
      }
      
      push();
      
      // Draw transition circle before the cloud but after saving state
      // Circle should grow throughout animation but never fade
      if (this.progress < 0.5) {
        // Growing phase - from 0 to 110% of largest screen dimension
        this.transitionCircleSize = map(this.progress, 0, 0.5, 0, this.maxCircleSize);
      } else {
        // Maintain full size - no fading
        this.transitionCircleSize = this.maxCircleSize;
      }
      
      // Draw the tan circle with full opacity (no fade out)
      const tanColor = color(COLORS.background);
      tanColor.setAlpha(255); // Always full opacity
      
      // Ensure we're at screen center for the circle
      fill(tanColor);
      noStroke();
      // Center in screen, not at animation position
      ellipse(playAreaX + playAreaWidth/2, playAreaY + playAreaHeight/2, this.transitionCircleSize);
      
      // Draw cloud background
      noStroke();
      
      // Draw main cloud with higher opacity
      let cloudOpacity = min(255, this.opacity * 1.2); // Increase opacity by 20%
      fill(255, 255, 255, cloudOpacity);
      
      beginShape();
      for (let i = 0; i < this.cloudPoints.length; i++) {
        const point = this.cloudPoints[i];
        
        // Calculate variation using noise for organic cloud shape
        // Add angle-based phase to ensure more consistent wobbliness around the entire perimeter
        const phaseOffset = point.angle * 0.3; // Use angle as part of noise input for more consistent variation
        const noiseVal = noise(point.noiseOffset + frameCount * 0.01, phaseOffset);
        const variation = map(noiseVal, 0, 1, -point.variationAmount, point.variationAmount);
        
        // Calculate radius with variation
        const radius = (currentSize / 2) * (1 + variation);
        
        // Calculate point position
        const px = this.x + cos(point.angle) * radius;
        const py = this.y + sin(point.angle) * radius;
        
        curveVertex(px, py);
        
        // Add extra vertices at the beginning and end for smooth curves
        if (i === 0) {
          curveVertex(px, py);
        } else if (i === this.cloudPoints.length - 1) {
          curveVertex(px, py);
          curveVertex(this.x + cos(this.cloudPoints[0].angle) * radius, 
                    this.y + sin(this.cloudPoints[0].angle) * radius);
        }
      }
      endShape(CLOSE);
      
      // Always draw verb text when the cloud is visible (improved visibility)
      if (currentSize > this.maxSize * 0.1) { // As long as the cloud is at least 10% visible
        // Calculate text opacity based on progress
        let textOpacity = this.opacity; // Use the global opacity we're tracking
        
        // Calculate maximum allowed text width (80% of play area width)
        const maxTextWidth = playAreaWidth * 0.8;
        
        // Start with a smaller font size than before - 20% of cloud size instead of 25%
        // This helps avoid overflow on smaller screens while still being dramatic
        let fontSize = max(min(currentSize * 0.20, 80), 30);
        
        // Set text properties for measurement
        textAlign(CENTER, CENTER);
        textSize(fontSize);
        textStyle(BOLD);
        
        // Check if verb text fits within max width
        let verbWidth = textWidth(this.verb);
        
        // If text is too wide, either scale down font size or wrap text
        let textLines = [this.verb];
        
        // If text is still too wide even at minimum font size, use text wrapping
        if (verbWidth > maxTextWidth && fontSize <= 30) {
          textLines = splitTextIntoLines(this.verb, maxTextWidth);
        } 
        // Otherwise, reduce font size until text fits (but don't go below minimum)
        else if (verbWidth > maxTextWidth) {
          // Scale down font size until text fits (or until we hit the minimum size)
          while (verbWidth > maxTextWidth && fontSize > 30) {
            fontSize -= 2;
            textSize(fontSize);
            verbWidth = textWidth(this.verb);
          }
        }
        
        // Apply the final font size
        textSize(fontSize);
        
        // Draw the text (shadow first, then actual text)
        const lineHeight = fontSize * 1.2; // Line spacing for multi-line text
        const startY = this.y - ((textLines.length - 1) * lineHeight / 2);
        
        for (let i = 0; i < textLines.length; i++) {
          const lineY = startY + (i * lineHeight);
          
          // Draw text shadow for better visibility
          fill(0, 0, 0, textOpacity * 0.4);
          text(textLines[i], this.x + 4, lineY + 4);
          
          // Draw main text with stronger color and golden outline
          let primaryColor = color(COLORS.secondary);
          primaryColor.setAlpha(textOpacity);
          
          // Create an outline color with the same opacity
          let outlineColor = color(COLORS.tertiary); // Yellow/gold
          outlineColor.setAlpha(textOpacity);
          
          // Draw golden outline for dramatic effect
          stroke(outlineColor);
          strokeWeight(3);
          fill(primaryColor);
          text(textLines[i], this.x, lineY);
        }
      }
      
      pop();
    }
  }
  
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
  