function combineVessels(v1, v2, mouseX = null, mouseY = null) {
    console.log("=== COMBINING VESSELS ===");
    console.log("Vessel 1:", v1.name || v1.ingredients.join("+") || "unnamed");
    console.log("Vessel 2:", v2.name || v2.ingredients.join("+") || "unnamed");
    
    // Use mouse position if provided, otherwise fall back to average position
    const newVesselX = mouseX !== null ? mouseX : (v1.x + v2.x) / 2;
    const newVesselY = mouseY !== null ? mouseY : (v1.y + v2.y) / 2;
    
    // Check if hint is active (simplified - now just checks the flag)
    let hintActive = showingHint;
    
    // UNIFIED LOGIC: Helper function to check if a combination of items matches a recipe
    const findMatchingRecipe = (items) => {
        console.log("Looking for recipe with items:", items);
        
        // Normalize items for comparison (trim whitespace, handle case)
        const normalizedItems = items.map(item => item.trim());
        
        // First check the final combination
        if (arraysMatchExact(normalizedItems, final_combination.required)) {
            console.log("✓ Matched: Final combination!");
            return final_combination;
        }
        
        // Then check all intermediate combinations
        for (const combo of intermediate_combinations) {
            if (arraysMatchExact(normalizedItems, combo.required)) {
                console.log(`✓ Matched: ${combo.name}`);
                return combo;
            }
        }
        
        // Check for partial matches (subset of required ingredients)
        for (const combo of intermediate_combinations.concat([final_combination])) {
            // Check if all items are part of the recipe (but recipe might need more)
            if (normalizedItems.every(item => combo.required.includes(item)) && 
                normalizedItems.length < combo.required.length) {
                console.log(`⚠ Partial match for: ${combo.name} (needs ${combo.required.length - normalizedItems.length} more items)`);
                console.log(`  Current items: [${normalizedItems.join(", ")}]`);
                console.log(`  Recipe needs: [${combo.required.join(", ")}]`);
                return { ...combo, isPartial: true };
            }
        }
        
        console.log("✗ No matching recipe found");
        console.log("  Items provided:", normalizedItems);
        console.log("  Available recipes:");
        intermediate_combinations.forEach(combo => {
            console.log(`    - ${combo.name}: [${combo.required.join(", ")}]`);
        });
        console.log(`    - ${final_combination.name}: [${final_combination.required.join(", ")}]`);
        
        return null;
    };
    
    // Helper function to create a vessel from a recipe match
    const createVesselFromRecipe = (recipe, items) => {
        const vesselWidth = Math.max(playAreaWidth * 0.25, 150);
        const vesselHeight = vesselWidth * 0.5;
        
        let new_v;
        
        if (recipe.isPartial) {
            // Create a yellow vessel for partial combination
            new_v = new Vessel(items.filter(item => !intermediate_combinations.some(c => c.name === item)), 
                              items.filter(item => intermediate_combinations.some(c => c.name === item)), 
                              null, 'yellow', newVesselX, newVesselY, vesselWidth, vesselHeight);
            
            // Track as active partial combination
            activePartialCombo = recipe.name;
            
            if (!partialCombinations.includes(recipe.name)) {
                partialCombinations.push(recipe.name);
                console.log(`Added ${recipe.name} to partialCombinations:`, partialCombinations);
            }
            
            if (!startedCombinations.includes(recipe.name)) {
                startedCombinations.push(recipe.name);
                console.log(`Added ${recipe.name} to startedCombinations:`, startedCombinations);
            }
            
            // Show partial combo message
            if (typeof Byline !== 'undefined' && Byline.showPartialComboMessage) {
                Byline.showPartialComboMessage();
            } else if (typeof window.Byline !== 'undefined' && window.Byline.showPartialComboMessage) {
                window.Byline.showPartialComboMessage();
            }
        } else {
            // Create a completed vessel
            new_v = new Vessel([], [], recipe.name, getNextCompletedVesselColor(recipe.name), 
                              newVesselX, newVesselY, vesselWidth, vesselHeight);
            
            new_v.verb = recipe.verb || "Mix";
            new_v.verbDisplayTime = 120;
            
            // Add to completedGreenVessels
            if (!completedGreenVessels.some(vessel => vessel.name === recipe.name)) {
                completedGreenVessels.push({name: recipe.name});
            }
            
            // Clear activePartialCombo since we completed the combination
            activePartialCombo = null;
            
            // Remove from partialCombinations array since it's now complete
            const index = partialCombinations.indexOf(recipe.name);
            if (index > -1) {
                partialCombinations.splice(index, 1);
                console.log(`Removed ${recipe.name} from partialCombinations:`, partialCombinations);
            }
            
            // Show success message
            if (typeof Byline !== 'undefined' && Byline.showSuccessMessage) {
                Byline.showSuccessMessage();
            } else if (typeof window.Byline !== 'undefined' && window.Byline.showSuccessMessage) {
                window.Byline.showSuccessMessage();
            }
            
            // Update collected ingredients tracking
            for (let combo of intermediate_combinations.concat([final_combination])) {
                if (combo.required.includes(new_v.name) && combo.collectedIngredients) {
                    combo.collectedIngredients.push(new_v.name);
                    console.log(`Added ${new_v.name} to ${combo.name}'s collected ingredients: ${combo.collectedIngredients.length}/${combo.required.length}`);
                }
            }
        }
        
        new_v.isAdvanced = true;
        return new_v;
    };
    
    // Get all items from both vessels
    const allItems = [...new Set([...getAllItemsFromVessel(v1), ...getAllItemsFromVessel(v2)])];
    console.log("All items from both vessels:", allItems);
    
    // Check for Easter eggs first
    if (typeof checkForEasterEgg === 'function' && easter_eggs && easter_eggs.length > 0) {
        const eggMatch = checkForEasterEgg(allItems);
        if (eggMatch) {
            console.log("Found Easter egg match:", eggMatch.name);
            displayEasterEgg(eggMatch, v1, v2);
            moveHistory.push({type: 'easterEgg'});
            return null;
        }
    }
    
    // Check if this is a duplicate ingredient combination (same ingredient twice)
    if (v1.ingredients.length === 1 && v2.ingredients.length === 1 && 
        v1.ingredients[0] === v2.ingredients[0]) {
        console.log("Cannot combine two vessels with the same ingredient:", v1.ingredients[0]);
        return null;
    }
    
    // Find matching recipe
    const matchingRecipe = findMatchingRecipe(allItems);
    
    if (matchingRecipe) {
        console.log("Creating vessel from matching recipe:", matchingRecipe.name);
        const new_v = createVesselFromRecipe(matchingRecipe, allItems);
        
        if (new_v) {
            console.log("New vessel created in combineVessels:", new_v.name || "unnamed");
        }
        
        return new_v;
    } else {
        console.log("No matching recipe found for items:", allItems);
        return null;
    }
}
  
  // Global variables for hinted combo animation
  let hintAnimationActive = false;
  let hintAnimationProgress = 0;
  let hintAnimationDuration = 30; // 30 frames = 1 second at 30fps
  let hintAnimationTextRevealDuration = 0.7; // Text reveal completes at 70% of animation
  let hintAnimationTarget = null; // Target combo for animation
  let completedAnimations = []; // Track combos that have completed their animation
  
  // Helper function to extract all items from a vessel (ingredients + combo names + complete combinations)
  function getAllItemsFromVessel(vessel) {
    const items = [];
    
    // Add base ingredients
    if (vessel.ingredients && vessel.ingredients.length > 0) {
      items.push(...vessel.ingredients);
    }
    
    // Add combo name if it exists (regardless of whether there are ingredients)
    if (vessel.name) {
      items.push(vessel.name);
    }
    
    // Add complete combinations
    if (vessel.complete_combinations && vessel.complete_combinations.length > 0) {
      items.push(...vessel.complete_combinations);
    }
    
    // Log what we extracted for debugging
    if (items.length === 0) {
      console.warn("WARNING: getAllItemsFromVessel returned empty array for vessel:", vessel);
    }
    
    return items;
  }
  
  // Helper function to expand combos into base ingredients when needed for final recipe
  function expandItemsForFinalRecipe(items) {
    const expanded = [];
    
    for (const item of items) {
      // Check if this item is an intermediate combo
      const combo = intermediate_combinations.find(c => c.name === item);
      
      if (combo) {
        // This is a combo - check if the final recipe wants the combo itself or its ingredients
        if (final_combination.required.includes(item)) {
          // Final recipe wants the combo itself
          expanded.push(item);
        } else {
          // Final recipe might want the ingredients - expand the combo
          // Recursively expand in case of nested combos
          expanded.push(...expandItemsForFinalRecipe(combo.required));
        }
      } else {
        // This is a base ingredient
        expanded.push(item);
      }
    }
    
    return expanded;
  }
  
  // CENTRALIZED: Helper function to check if two arrays have the same elements
  function arraysMatchExact(arr1, arr2) {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    
    // Normalize both arrays (trim whitespace, handle case)
    const normalize = (item) => String(item).trim();
    const sorted1 = arr1.map(normalize).sort();
    const sorted2 = arr2.map(normalize).sort();
    
    return sorted1.every((item, index) => item === sorted2[index]);
  }
  
  // DEBUG: Function to log detailed vessel state
  function logVesselState(vessel, prefix = "") {
    console.log(`${prefix}Vessel Debug Info:`);
    console.log(`${prefix}  - Name: ${vessel.name || "None"}`);
    console.log(`${prefix}  - Color: ${vessel.color}`);
    console.log(`${prefix}  - Ingredients: [${vessel.ingredients.join(", ")}]`);
    console.log(`${prefix}  - Complete Combinations: [${vessel.complete_combinations.join(", ")}]`);
    console.log(`${prefix}  - All Items: [${getAllItemsFromVessel(vessel).join(", ")}]`);
    console.log(`${prefix}  - Position: (${Math.round(vessel.x)}, ${Math.round(vessel.y)})`);
  }
  
  // Function to check if hints are available
  function areHintsAvailable() {
    // Don't show hints if game is over or only the final combination remains
    if (gameWon || isOnlyFinalComboRemaining()) {
      return false;
    }
    
    // Find combinations that have been completed or are part of partial combinations
    let completedCombos = vessels
      .filter(v => v.name !== null)
      .map(v => v.name);
    
    let partialCompletedCombos = [];
    vessels.forEach(v => {
      if (v.complete_combinations && v.complete_combinations.length > 0) {
        partialCompletedCombos.push(...v.complete_combinations);
      }
    });
    
    // All combinations that shouldn't be offered as hints
    let allCompletedCombos = [...new Set([...completedCombos, ...partialCompletedCombos])];
    
    // Check all intermediate combinations that aren't completed yet and haven't been hinted
    let availableCombos = intermediate_combinations.filter(combo => 
      !allCompletedCombos.includes(combo.name) && !hintedCombos.includes(combo.name));
    
    // Filter out combinations that require completed combinations as ingredients
    availableCombos = availableCombos.filter(combo => {
      return !combo.required.some(ingredient => completedCombos.includes(ingredient));
    });
    
    // If we have intermediate combinations available, hint is available
    if (availableCombos.length > 0) {
      return true;
    }
    
    // If there are no intermediate combinations available, don't consider the final combination
    // This will prevent hints on the final step as requested
    return false;
  }
  
  // Function to show a hint
  function showHint() {
    // First check if hints are available
    if (!areHintsAvailable()) {
      console.log("No hints available");
      return;
    }
    
    if (!showingHint && !gameWon) {
      // Reset inactivity reminder count when player uses hint
      inactivityReminderCount = 0;
      
      // Update last action time
      lastAction = frameCount;
      
      // Check if only the final combination remains - moved to areHintsAvailable
      if (isOnlyFinalComboRemaining()) {
        console.log("Only final combination remains, hint disabled");
        return; // Exit early
      }
      
      // hintCount increment moved lower, will only happen when a new hint is shown
      
      // Add a bright blue counter for creating a hint vessel
      moveHistory.push(COLORS.vesselHint); // Red color for hint creation (matching hint vessels)
      turnCounter++; // Increment turn counter for hint creation
      
      // Find combinations that have been completed
      let completedCombos = vessels
        .filter(v => v.name !== null)
        .map(v => v.name);
      
      // Also check for combinations that are part of partial combinations
      // These are combinations that are in the complete_combinations array of any vessel
      let partialCompletedCombos = [];
      vessels.forEach(v => {
        if (v.complete_combinations && v.complete_combinations.length > 0) {
          partialCompletedCombos.push(...v.complete_combinations);
        }
      });
      
      // Combine both lists to get all combinations that shouldn't be offered as hints
      let allCompletedCombos = [...new Set([...completedCombos, ...partialCompletedCombos])];
      
      console.log("All completed combinations (including partial):", allCompletedCombos);
      
      // Get all ingredients currently visible on the board
      let visibleIngredients = [];
      vessels.forEach(v => {
        visibleIngredients.push(...v.ingredients);
      });
      
      console.log("Visible ingredients on board:", visibleIngredients);
      console.log("Completed combinations:", completedCombos);
      
      // Calculate which combinations can be made with visible ingredients
      let possibleCombos = [];
      
      // Check all intermediate combinations that aren't completed yet and haven't been hinted
      let availableCombos = intermediate_combinations.filter(combo => 
        !allCompletedCombos.includes(combo.name) && !hintedCombos.includes(combo.name));
      
      // Filter out combinations that require completed combinations as ingredients
      availableCombos = availableCombos.filter(combo => {
        // Check if any of the required ingredients are completed combinations
        return !combo.required.some(ingredient => completedCombos.includes(ingredient));
      });
      
      console.log("Available combinations after filtering out those requiring completed combos:", 
        availableCombos.map(c => c.name));
      
      // We no longer check for final combination since areHintsAvailable will prevent
      // the hint button from being active when only the final combination is available
      
      // For each available combination, calculate what percentage of its ingredients are visible
      availableCombos.forEach(combo => {
        let requiredCount = combo.required.length;
        let availableCount = 0;
        
        // Count how many required ingredients are visible on the board
        combo.required.forEach(ing => {
          // For the final combination, completed combinations count as available
          if (combo === final_combination && completedCombos.includes(ing)) {
            availableCount++;
          } 
          // For other combinations, only count visible base ingredients
          else if (visibleIngredients.includes(ing)) {
            availableCount++;
          }
        });
        
        // Calculate percentage of available ingredients
        let percentage = availableCount / requiredCount;
        
        // Only consider combinations where at least one ingredient is available
        if (availableCount > 0) {
          possibleCombos.push({
            combo: combo,
            percentage: percentage,
            availableCount: availableCount
          });
        }
      });
      
      console.log("Possible combinations with percentages:", possibleCombos);
      
      // Sort by percentage (highest first), then by available count (highest first)
      possibleCombos.sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return b.availableCount - a.availableCount;
      });
      
      // If there are possible combinations, show a hint for the one with highest percentage
      if (possibleCombos.length > 0) {
        let selectedCombo = possibleCombos[0].combo;
        
        // Check if this combo is already hinted - if so, just add to list without animation
        if (!hintedCombos.includes(selectedCombo.name)) {
          // Increment hint counter only when a new hint is actually shown
          hintCount++; 
          
          // APlasker - Track hint usage in analytics
          if (typeof trackHintUsed === 'function') {
            trackHintUsed();
          }
          
          // Add the combo to the hinted combos list
          hintedCombos.push(selectedCombo.name);
          
          // Set the hinted combination for recipe card highlighting
          hintedCombo = selectedCombo.name;
          
          // Reset previous animations to completed state if active
          if (hintAnimationActive && hintAnimationTarget && !completedAnimations.includes(hintAnimationTarget)) {
            completedAnimations.push(hintAnimationTarget);
          }
          
          // Set the showingHint flag to false since we don't use hintVessel anymore
          showingHint = false;
          
          // Initialize animation variables for text reveal
          hintAnimationActive = true;
          hintAnimationProgress = 0;
          hintAnimationTarget = selectedCombo.name;
          
          // Initialize tracking for collected ingredients for this combo
          if (!selectedCombo.collectedIngredients) {
            selectedCombo.collectedIngredients = [];
            selectedCombo.hinted = true;
          }
          
          // ENHANCEMENT: Scan all existing vessels for ingredients that are already
          // part of the hinted combo's requirements
          console.log(`Scanning existing vessels for ingredients required by ${selectedCombo.name}`);
          
          // Create a Set to track unique ingredients
          const foundIngredients = new Set();
          
          // First, check all vessels for direct ingredients
          vessels.forEach(vessel => {
            // Check each ingredient in the vessel
            vessel.ingredients.forEach(ingredient => {
              // If this ingredient is required by the selected combo and not already counted
              if (selectedCombo.required.includes(ingredient) && 
                  !selectedCombo.collectedIngredients.includes(ingredient)) {
                // Add it to the collectedIngredients array
                selectedCombo.collectedIngredients.push(ingredient);
                foundIngredients.add(ingredient);
                console.log(`Found required ingredient ${ingredient} in vessel`);
              }
            });
          });
          
          // Next, check for partial combinations that might contain required ingredients
          vessels.forEach(vessel => {
            // For vessels that are part of partial combinations
            if (vessel.ingredients.length > 0 && partialCombinations.includes(activePartialCombo)) {
              // Find the matching recipe candidate for this vessel
              const matchingCandidates = intermediate_combinations.filter(combo => {
                // Get all ingredients in this vessel
                const vesselIngredients = vessel.ingredients;
                // Check if all ingredients in the vessel are part of the combo
                return vesselIngredients.every(ing => combo.required.includes(ing));
              });
              
              // If we found matching candidates, check if they contain ingredients for our hint
              if (matchingCandidates.length > 0) {
                // Sort by match precision (most specific first)
                matchingCandidates.sort((a, b) => 
                  (b.required.length - b.required.length));
                
                // Get the best matching candidate
                const bestMatch = matchingCandidates[0];
                
                // Check if any ingredients in this combo are needed for our hint
                bestMatch.required.forEach(ingredient => {
                  // If this ingredient is required by the selected combo and not already counted
                  if (selectedCombo.required.includes(ingredient) && 
                      !foundIngredients.has(ingredient) &&
                      !selectedCombo.collectedIngredients.includes(ingredient)) {
                    // Check if the ingredient is already in the vessel
                    if (vessel.ingredients.includes(ingredient)) {
                      selectedCombo.collectedIngredients.push(ingredient);
                      foundIngredients.add(ingredient);
                      console.log(`Found required ingredient ${ingredient} in partial combo vessel`);
                    }
                  }
                });
              }
            }
          });
          
          // Log the current state of collected ingredients
          console.log(`After scanning, ${selectedCombo.name} has collected ${selectedCombo.collectedIngredients.length}/${selectedCombo.required.length} ingredients:`, 
            selectedCombo.collectedIngredients);
          
          console.log(`Added hint for combo: ${selectedCombo.name}`);
          console.log("Required ingredients:", selectedCombo.required);
          console.log("Percentage of ingredients available:", possibleCombos[0].percentage * 100 + "%");
          
          // Provide feedback that hint was successful
          triggerHapticFeedback('medium');
        } else {
          console.log(`Combo ${selectedCombo.name} is already hinted, not triggering new animation`);
        }
      } else {
        console.log("No available combinations to hint");
      }
    }
  }
  
  function isOnlyFinalComboRemaining() {
    // Case 1: Only the final dish remains
    if (vessels.length === 1 && vessels[0].name === final_combination.name) {
      return true;
    }
    
    // Case 2: Check if all non-final-recipe intermediate combos have been completed
    // This is different from just checking if final combo ingredients are ready
    
    // Get all available items (combos AND ingredients)
    let availableItems = [];
    
    vessels.forEach(v => {
      availableItems.push(...getAllItemsFromVessel(v));
    });
    
    // Remove duplicates
    availableItems = [...new Set(availableItems)];
    
    // NEW LOGIC: Check if all intermediate combos have been completed
    // An intermediate combo should be completed if:
    // 1. It exists as a completed combo
    // 2. OR it's a required ingredient for the final combo (part of the final recipe)
    let allIntermediateCombosCompleted = intermediate_combinations.every(combo => {
      // If this combo is required for the final combination, it doesn't need to be completed yet
      if (final_combination.required.includes(combo.name)) {
        return true; // This is part of the final recipe, so it's OK if not completed
      }
      // Otherwise, it must be completed
      return availableItems.includes(combo.name);
    });
    
    if (!allIntermediateCombosCompleted) {
      return false; // Still have non-final-recipe combos to complete
    }
    
    // Now check if we have all the items needed for the final combo (including basic ingredients)
    let allFinalIngredientsPresent = final_combination.required.every(req => 
      availableItems.includes(req));
    
    // If we have all ingredients for final combo AND all other combos are done, return true
    return allFinalIngredientsPresent;
  }
  
  // Helper function to draw a star
  function star(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
  // Fisher-Yates shuffle algorithm to randomize vessel order
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Enhanced function to assign both preferred row and column based on drop position
  function assignPreferredRow(newVessel, dropY, dropX = mouseX) {
    // Calculate vessel sizes - must match the same calculations in arrangeVessels
    // Use relative margins exactly like in arrangeVessels
    const margin = Math.max(playAreaWidth * 0.0125, 3); // 1.25% of play area width, min 3px
    const vertical_margin = Math.max(playAreaHeight * 0.005, 2); // 0.5% of play area height, min 2px
    
    // Calculate basic vessel width and height using the exact same formula from arrangeVessels
    const basic_w = (playAreaWidth - (4 * margin)) / 3;
    const basic_h = basic_w * 0.8;
    
    // Calculate the row height using the same values as the actual arrangement
    const rowHeight = basic_h * 0.83 + vertical_margin; // Adjusted to use 83% of vessel height
    
    // Calculate the starting Y position - exactly matching arrangeVessels
    const startY = playAreaY + playAreaHeight * 0.2;
    
    // Calculate which row index the drop position corresponds to
    // Using Math.max to ensure we don't get negative values
    const relativeDropY = Math.max(0, dropY - startY);
    const dropRowIndex = Math.floor(relativeDropY / rowHeight);
    
    // Add detailed debugging for row calculation
    console.log("=== ROW CALCULATION DETAILS ===");
    console.log("startY =", startY);
    console.log("dropY =", dropY);
    console.log("relativeDropY =", relativeDropY);
    console.log("rowHeight =", rowHeight);
    console.log("calculated rowIndex =", dropRowIndex);
    console.log("vessel.isNewlyCombined =", !!newVessel.isNewlyCombined);
    
    // Set preferred row, clamping to a reasonable range
    // We estimate the maximum number of rows based on vessel count
    const maxRows = Math.ceil(vessels.length / 3); // At most 3 basic vessels per row
    
    // Use the calculated row index directly - no correction needed
    newVessel.preferredRow = Math.min(dropRowIndex, maxRows);
    
    console.log("final assigned row =", newVessel.preferredRow);
    
    // Determine preferred column based on drop X position
    // First calculate the potential column positions in a typical 3-column row
    const totalRowWidth = playAreaWidth - (2 * margin); // Width available for all vessels in a row
    const columnWidth = totalRowWidth / 3; // Width of each column
    
    // Calculate the starting X position for a standard row
    const startX = playAreaX + margin;
    
    // Calculate the relative drop X position
    const relativeDropX = dropX - startX;
    
    // Determine the column (0 = left, 1 = center, 2 = right)
    let preferredColumn = 0; // Default to left column
    
    if (relativeDropX >= 0 && relativeDropX <= totalRowWidth) {
      // Within the grid area
      preferredColumn = Math.floor(relativeDropX / columnWidth);
    } else if (relativeDropX > totalRowWidth) {
      // Beyond the right edge
      preferredColumn = 2; // Right column
    }
    
    // For advanced vessels, prevent them from being assigned to the center column (column 1)
    // This ensures they will span columns 0-1 or 1-2 instead of staying centered
    if (newVessel.isAdvanced && preferredColumn === 1) {
      // Calculate the center of the play area
      const centerX = playAreaX + playAreaWidth / 2;
      
      // Shift the vessel left or right based on which side of center it was dropped
      if (dropX < centerX) {
        // If dropped left of center, assign to column 0 (will span 0-1)
        newVessel.preferredColumn = 0;
        console.log("Advanced vessel shifted from center to left column (will span 0-1)");
      } else {
        // If dropped right of center, assign to column 2 (will span 1-2)
        newVessel.preferredColumn = 2;
        console.log("Advanced vessel shifted from center to right column (will span 1-2)");
      }
    } else {
      // For basic vessels or advanced vessels already in columns 0 or 2, keep the original column
      newVessel.preferredColumn = preferredColumn;
    }
    
    // Add column boundary information for better visualization
    const colBoundaries = [
      startX,                          // Left edge of left column
      startX + columnWidth,            // Left edge of center column
      startX + 2 * columnWidth,        // Left edge of right column
      startX + 3 * columnWidth         // Right edge of right column
    ];
    
    // Enhanced logging to verify function execution
    console.log("=== PREFERRED POSITION ASSIGNMENT ===");
    console.log(`Drop position: X=${dropX}, Y=${dropY}`);
    console.log(`Play area start: X=${startX}, Y=${startY}`);
    console.log(`Column width: ${columnWidth}, Row height: ${rowHeight}`);
    console.log(`Relative drop position: X=${relativeDropX}, Y=${relativeDropY}`);
    console.log(`Column boundaries: [${colBoundaries.join(', ')}]`);
    console.log(`Calculated position: Row=${dropRowIndex}, Column=${preferredColumn}`);
    console.log(`Assigned position: Row=${newVessel.preferredRow}, Column=${newVessel.preferredColumn}`);
    console.log(`New vessel properties:`, newVessel.name || "unnamed", newVessel.ingredients);
    console.log("====================================");
  }
  
  function arrangeVessels() {
    // Calculate vessel sizes based on play area width to ensure 3 base vessels per row
    // We need to fit 3 vessels plus margins in the play area width
    // Convert fixed margins to relative values based on play area dimensions
    let margin = playAreaWidth * 0.0125; // 1.25% of play area width (was 10px)
    let vertical_margin = playAreaHeight * 0.005; // 0.5% of play area height (reduced from 0.8%)
    
    // Ensure minimum values for very small screens
    margin = Math.max(margin, 3); // Minimum 3px margin
    vertical_margin = Math.max(vertical_margin, 2); // Minimum 2px vertical margin
    
    // Calculate basic vessel width to fit exactly 3 per row with margins
    let basic_w = (playAreaWidth - (4 * margin)) / 3; // 3 vessels with margin on both sides
    let basic_h = basic_w * 0.8; // Maintain aspect ratio
    
    // Advanced vessels are twice as wide but same height as basic vessels
    let advanced_w = basic_w * 2 + margin;
    let advanced_h = basic_h; // Updated by APlasker - match basic vessel height
    
    // Calculate column widths and positions for precise column preferences
    const columnWidth = (playAreaWidth - (4 * margin)) / 3;
    const columnPositions = [
      playAreaX + margin + columnWidth/2,                // Left column center
      playAreaX + margin + columnWidth + margin + columnWidth/2,  // Middle column center
      playAreaX + margin + 2 * (columnWidth + margin) + columnWidth/2 // Right column center
    ];

    // Calculate the starting Y position based on layout type
    let startY = playAreaY + playAreaHeight * getCurrentLayout().vesselsStart;
    
    // Define vessel area lower bound at 72% from top
    const vesselAreaLowerBound = playAreaY + playAreaHeight * 0.72;
    
    // ENHANCEMENT: First identify which vessels have preferred positions
    // Find vessels with preferredRow (vessels that have been positioned by user)
    const vesselsWithPreferredPosition = vessels.filter(v => 
      v.hasOwnProperty('preferredRow') || v.positionStrength > 0
    );
    
    // Find newly created vessel (most recently combined vessel that should have a preferred position)
    const newlyCreatedVessel = vessels.find(v => v.hasOwnProperty('isNewlyCombined'));
    if (newlyCreatedVessel) {
      console.log("Detected newly created vessel:", newlyCreatedVessel.name || "unnamed");
      // Clear the flag so it's only treated as newly created once
      delete newlyCreatedVessel.isNewlyCombined;
    }
    
    // Log info about vessels with position preferences
    console.log(`Found ${vesselsWithPreferredPosition.length} vessels with position preferences`);
    vesselsWithPreferredPosition.forEach(v => {
      console.log(`Vessel: ${v.name || "unnamed"}, Row: ${v.preferredRow}, Column: ${v.preferredColumn || 'not set'}, Strength: ${v.positionStrength}`);
    });
    
    // Sort vessels with preferred positions by their position strength (highest first)
    // This ensures the most "sticky" vessels get priority in placement
    const preferredVessels = vesselsWithPreferredPosition.sort((a, b) => b.positionStrength - a.positionStrength);
    
    // ENHANCEMENT: Store the original position of each vessel to determine if it moved
    // We'll use this to increase position strength for vessels that stay put
    vessels.forEach(v => {
      v.originalPositionForStrength = {
        row: v.preferredRow,
        column: v.preferredColumn
      };
    });
    
    // Find vessel with explicitly assigned preferredRow (from recent drag operation)
    // If multiple vessels have preferences, use the one with the highest position strength
    // or give preference to newly created vessels
    let preferredVessel = null;
    
    if (newlyCreatedVessel && newlyCreatedVessel.hasOwnProperty('preferredRow')) {
      // Prioritize newly created vessels with a preferred position
      preferredVessel = newlyCreatedVessel;
      console.log("Using newly created vessel as preferred vessel:", preferredVessel.name || "unnamed");
    } else if (preferredVessels.length > 0) {
      // Otherwise use the vessel with highest position strength
      preferredVessel = preferredVessels[0];
      console.log("Using vessel with highest position strength as preferred vessel:", preferredVessel.name || "unnamed");
    }
    
    // Log debugging information about the preferred vessel
    if (preferredVessel) {
      console.log("=== ARRANGE VESSELS ===");
      console.log("Found vessel with preferred position:", 
                  { row: preferredVessel.preferredRow, column: preferredVessel.preferredColumn || 'not set' });
      console.log("Vessel properties:", preferredVessel.name || "unnamed", preferredVessel.ingredients);
      console.log("Position strength:", preferredVessel.positionStrength);
      console.log("======================");
    }
    
    // ENHANCEMENT 1: Sort vessels by priority - colored vessels should move less than base vessels
    // Sort order: 1) Advanced (colored) vessels first, 2) Basic (white) vessels
    // This ensures we position colored vessels first and move basic vessels around them
    let advancedVessels = vessels
      .filter(v => v.isAdvanced && v !== preferredVessel)
      .sort((a, b) => {
        // First sort by position strength so more established vessels have priority
        if (a.positionStrength !== b.positionStrength) {
          return b.positionStrength - a.positionStrength;
        }
        // Then sort by complexity (number of ingredients) in descending order
        return b.ingredients.length - a.ingredients.length;
      });
      
    let basicVessels = vessels
      .filter(v => !v.isAdvanced && v !== preferredVessel)
      .sort((a, b) => {
        // First sort by position strength so more established vessels have priority
        if (a.positionStrength !== b.positionStrength) {
          return b.positionStrength - a.positionStrength;
        }
        // Then sort by complexity (number of ingredients) in descending order
        return b.ingredients.length - a.ingredients.length;
      });
    
    // Create an array to hold our row arrangements
    let rowArrangements = [];
    
    // Handle preferred vessel placement logic
    if (preferredVessel) {
      const preferredRow = preferredVessel.preferredRow;
      
      // Helper function to create a standard row
      const createStandardRow = () => {
        let row = [];
        if (advancedVessels.length > 0 && basicVessels.length > 0) {
          row.push(advancedVessels.shift());
          row.push(basicVessels.shift());
        } else if (advancedVessels.length > 0) {
          row.push(advancedVessels.shift());
        } else if (basicVessels.length > 0) {
          for (let i = 0; i < 3 && basicVessels.length > 0; i++) {
            row.push(basicVessels.shift());
          }
        }
        return row;
      };
      
      // Fill rows until we reach the preferred row
      while (rowArrangements.length < preferredRow && 
            (advancedVessels.length > 0 || basicVessels.length > 0)) {
        rowArrangements.push(createStandardRow());
      }
      
      // Create the preferred row with the preferred vessel
      let preferredRowArr = [];
      
      // ENHANCEMENT 2: Honor column preference when placing the vessel
      if (preferredVessel.hasOwnProperty('preferredColumn')) {
        // We need to create a row that places the vessel in the correct column
        const preferredColumn = preferredVessel.preferredColumn;
        
        // For a vessel in column 0, it should be the first vessel in the row
        // For a vessel in column 1, it should be the second vessel (or first if it's advanced)
        // For a vessel in column 2, it should be the third vessel (or second if there's an advanced first)
        
        console.log(`Creating row with vessel in preferred column ${preferredColumn}`);
        
        // Initialize the row with null placeholders
        preferredRowArr = [null, null, null];
        
        // Place the preferred vessel at its column position
        preferredRowArr[preferredColumn] = preferredVessel;
        
        // Now fill the remaining positions with the most appropriate vessels
        if (preferredVessel.isAdvanced) {
          // Advanced vessel takes 2 slots, so we can only add one more basic vessel
          // If it's in column 0, we can add a basic vessel in column 2
          // If it's in column 1, we can't add any more vessels
          // If it's in column 2, we can add a basic vessel in column 0
          if (preferredColumn === 0 && basicVessels.length > 0) {
            preferredRowArr[2] = basicVessels.shift();
          } else if (preferredColumn === 2 && basicVessels.length > 0) {
            preferredRowArr[0] = basicVessels.shift();
          }
        } else {
          // Basic vessel takes 1 slot, so we can add more vessels
          if (preferredColumn === 0) {
            // We can add an advanced vessel in column 1 or two basic vessels in column 1 and 2
            if (advancedVessels.length > 0) {
              preferredRowArr[1] = advancedVessels.shift();
            } else {
              if (basicVessels.length > 0) preferredRowArr[1] = basicVessels.shift();
              if (basicVessels.length > 0) preferredRowArr[2] = basicVessels.shift();
            }
          } else if (preferredColumn === 1) {
            // We can add one basic vessel in column 0 and one in column 2
            if (basicVessels.length > 0) preferredRowArr[0] = basicVessels.shift();
            if (basicVessels.length > 0) preferredRowArr[2] = basicVessels.shift();
          } else if (preferredColumn === 2) {
            // We can add an advanced vessel in column 0 or two basic vessels in column 0 and 1
            if (advancedVessels.length > 0) {
              preferredRowArr[0] = advancedVessels.shift();
            } else {
              if (basicVessels.length > 0) preferredRowArr[0] = basicVessels.shift();
              if (basicVessels.length > 0) preferredRowArr[1] = basicVessels.shift();
            }
          }
        }
        
        // Filter out null placeholders
        preferredRowArr = preferredRowArr.filter(v => v !== null);
      } else {
        // No column preference, just place the vessel at the start of the row
        preferredRowArr = [preferredVessel];
        
        // Determine how many more slots we can fill in this row
        let slotsAvailable = preferredVessel.isAdvanced ? 1 : 2; // Advanced takes 2 slots, basic takes 1
        
        // Fill remaining slots in the preferred row
        if (slotsAvailable > 0) {
          if (slotsAvailable === 1) {
            // We can fit one basic vessel
            if (basicVessels.length > 0) {
              preferredRowArr.push(basicVessels.shift());
            }
          } else if (slotsAvailable === 2) {
            // We can fit either one advanced or up to two basic vessels
            if (advancedVessels.length > 0) {
              preferredRowArr.push(advancedVessels.shift());
            } else {
              for (let i = 0; i < 2 && basicVessels.length > 0; i++) {
                preferredRowArr.push(basicVessels.shift());
              }
            }
          }
        }
      }
      
      rowArrangements.push(preferredRowArr);
    }
    
    // Continue with regular arrangement for remaining vessels
    while (advancedVessels.length > 0 || basicVessels.length > 0) {
      let currentRow = [];
      
      // Try to create rows with 1 advanced vessel and 1 basic vessel when possible
      if (advancedVessels.length > 0 && basicVessels.length > 0) {
        currentRow.push(advancedVessels.shift()); // Add 1 advanced vessel (takes 2 slots)
        currentRow.push(basicVessels.shift()); // Add 1 basic vessel (takes 1 slot)
        rowArrangements.push(currentRow);
      }
      // If we only have advanced vessels left, add 1 per row
      else if (advancedVessels.length > 0) {
        currentRow.push(advancedVessels.shift());
        rowArrangements.push(currentRow);
      }
      // If we only have basic vessels left, add 3 per row (or fewer if that's all we have)
      else if (basicVessels.length > 0) {
        // Add up to 3 basic vessels
        for (let i = 0; i < 3 && basicVessels.length > 0; i++) {
          currentRow.push(basicVessels.shift());
        }
        rowArrangements.push(currentRow);
      }
    }

    // Position all vessels based on row arrangements
    rowArrangements.forEach((row, rowIndex) => {
      // Calculate total width of this row
      let rowWidth = row.reduce((width, v) => {
        return width + (v.isAdvanced ? advanced_w : basic_w);
      }, 0) + (row.length - 1) * margin;

      // Calculate starting x position to center the row within the play area
      let startX = playAreaX + (playAreaWidth - rowWidth) / 2;
      let currentX = startX;

      // Position each vessel in the row
      row.forEach((v, columnIndex) => {
        // Update vessel dimensions
        if (v.isAdvanced) {
          v.w = advanced_w;
          v.h = advanced_h;
        } else {
          v.w = basic_w;
          v.h = basic_h;
        }

        // ENHANCEMENT 3: For vessels with preferred column, try to honor that position
        if (v.hasOwnProperty('preferredColumn') && v === preferredVessel) {
          // Calculate the x-coordinate based on the column preference
          const preferredColumn = v.preferredColumn;
          
          // Determine the position for the vessel based on its type and preferred column
          let preferredX;
          
          if (v.isAdvanced) {
            // Check if this vessel is the only one in its row - if so, center it
            if (row.length === 1) {
              // For a single advanced vessel in a row, center it in the middle of the play area
              preferredX = playAreaX + playAreaWidth / 2;
              console.log("Single advanced vessel in row - centering in play area");
            } else {
              // Advanced vessels should span two columns
              if (preferredColumn === 0) {
                // Left column drop: position between columns 0 and 1
                preferredX = playAreaX + margin + columnWidth + margin/2;
              } else if (preferredColumn === 2) {
                // Right column drop: position between columns 1 and 2
                preferredX = playAreaX + margin + columnWidth + margin + columnWidth + margin/2;
              } else if (preferredColumn === 1) {
                // Center column drop: deterministically choose column based on position in row
                // Use columnIndex to alternate between spanning 0-1 and 1-2
                // This ensures a more balanced and predictable grid layout
                if (columnIndex % 2 === 0) {
                  // For first vessel in row or even indexed vessels, span columns 0-1
                  preferredX = playAreaX + margin + columnWidth + margin/2;
                  console.log("Center vessel positioned to span columns 0-1");
                } else {
                  // For odd indexed vessels, span columns 1-2
                  preferredX = playAreaX + margin + columnWidth + margin + columnWidth + margin/2;
                  console.log("Center vessel positioned to span columns 1-2");
                }
              }
            }
          } else {
            // Basic vessels still use the column centers
            preferredX = columnPositions[preferredColumn];
          }
          
          // Log that we're positioning at the preferred column
          console.log(`Positioning vessel at preferred column ${preferredColumn} (x=${preferredX})`);
          console.log(`Vessel is ${v.isAdvanced ? 'advanced' : 'basic'} and spans ${v.isAdvanced ? '2 columns' : '1 column'}`);
          
          // Set vessel position
          v.x = preferredX;
          v.y = startY + rowIndex * (basic_h * 0.83 + vertical_margin);
          v.originalX = v.x;
          v.originalY = v.y;
          
          // Adjust currentX to account for this vessel's placement
          currentX = v.x + v.w/2 + margin;
        } else {
          // For vessels without a specific column preference, just place them sequentially
          // Set vessel position
          v.x = currentX + v.w / 2;
          v.y = startY + rowIndex * (basic_h * 0.83 + vertical_margin); // Adjusted to use 83% of vessel height
          v.originalX = v.x;
          v.originalY = v.y;
          
          // Move x position for next vessel
          currentX += v.w + margin;
        }
        
        // Store the assigned row and column for this vessel 
        // Only do this if the vessel doesn't already have preferred values
        if (!v.hasOwnProperty('preferredRow')) {
          v.preferredRow = rowIndex;
          
          // Determine which column this vessel ended up in
          const vesselColumnCenter = v.x;
          const relativeX = vesselColumnCenter - playAreaX;
          const totalWidth = playAreaWidth;
          const columnWidth = totalWidth / 3;
          
          if (relativeX < columnWidth) {
            v.preferredColumn = 0;
          } else if (relativeX < 2 * columnWidth) {
            v.preferredColumn = 1;
          } else {
            v.preferredColumn = 2;
          }
          
          console.log(`Assigned new preferred position: Row ${v.preferredRow}, Column ${v.preferredColumn} to vessel ${v.name || "unnamed"}`);
        }
      });
    });
    
    // Calculate the lowest vessel position for hint button placement
    let lowestY = startY;
    vessels.forEach(v => {
      lowestY = Math.max(lowestY, v.y + v.h/2);
    });
    
    // If initial hint button position is not set (first time), calculate it
    // Otherwise, use the stored position
    if (!initialHintButtonY) {
      // Set hint button at a fixed position from bottom of screen
      hintButtonY = height - 150; // 150px from bottom of screen
      
      // Store the initial hint button position
      initialHintButtonY = hintButtonY;
    } else {
      // Use the stored initial position
      hintButtonY = initialHintButtonY;
    }
    
    // Calculate button dimensions using relative values
    // Hint button - smaller action button
    let buttonWidth = playAreaWidth * 0.15; // 15% of play area width (was 120px)
    let buttonHeight = buttonWidth * 0.333; // Maintain aspect ratio
    // Ensure minimum sizes for usability
    buttonWidth = Math.max(buttonWidth, 80);
    buttonHeight = Math.max(buttonHeight, 30);
    
    // Start button - larger call to action
    let startButtonWidth = playAreaWidth * 0.2; // 20% of play area width (was 30%)
    let startButtonHeight = startButtonWidth * 0.4; // Maintain aspect ratio
    // Enforce minimum sizes
    startButtonWidth = Math.max(startButtonWidth, 100);
    startButtonHeight = Math.max(startButtonHeight, 40);
    
    // Create hint button with white background and grey outline
    hintButton = new Button(
      playAreaX + playAreaWidth * 0.5, // Center horizontally
      hintButtonY, 
      buttonWidth, 
      buttonHeight, 
      "Hint", 
      showHint, 
      'white', 
      '#FF5252'
    );
    
    // Create start button
    startButton = new Button(
      playAreaX + playAreaWidth * 0.5, // Center horizontally
      playAreaY + playAreaHeight * 0.85, // Position at 85% down the play area
      startButtonWidth, 
      startButtonHeight, 
      "Cook!", 
      startGame, 
      COLORS.secondary, 
      'white'
    );
    
    // After arrangement, update position strength for all vessels
    vessels.forEach(v => {
      // Initialize position strength if it doesn't exist
      if (typeof v.positionStrength === 'undefined') {
        v.positionStrength = 0;
      }
      
      // Update position history counter
      if (v.hasOwnProperty('originalPositionForStrength')) {
        const original = v.originalPositionForStrength;
        const current = { row: v.preferredRow, column: v.preferredColumn };
        
        // If position stayed the same, increase strength
        if (original.row === current.row && original.column === current.column) {
          if (v.isAdvanced) {
            // For advanced vessels: increase up to maximum of 0.9
            v.positionStrength = Math.min(0.9, v.positionStrength + 0.1);
          } else {
            // For base vessels: increase but cap at 0.5
            v.positionStrength = Math.min(0.5, v.positionStrength + 0.1);
          }
          
          if (v.positionStrength >= 0.5) {
            console.log(`Vessel ${v.name || "unnamed"} settled in position with strength ${v.positionStrength.toFixed(1)}`);
          }
        } else {
          // Position changed, reset strength partially (don't go all the way to zero)
          // This creates a "sticky" effect where vessels prefer their recent positions
          if (v.positionStrength > 0) {
            if (v.isAdvanced) {
              // For advanced vessels: never go below 0.6
              v.positionStrength = Math.max(0.6, v.positionStrength - 0.5);
            } else {
              // For base vessels: can go all the way to 0
              v.positionStrength = Math.max(0, v.positionStrength - 0.5);
            }
            console.log(`Vessel ${v.name || "unnamed"} moved - reducing strength to ${v.positionStrength.toFixed(1)}`);
          }
        }
        
        // Clean up the temporary property
        delete v.originalPositionForStrength;
      }
      
      // Ensure advanced vessels always have at least 0.6 position strength
      if (v.isAdvanced && v.positionStrength < 0.6) {
        v.positionStrength = 0.6;
        console.log(`Advanced vessel ${v.name || "unnamed"} position strength set to minimum 0.6`);
      }
      
      // Ensure base vessels never exceed 0.5 position strength
      if (!v.isAdvanced && v.positionStrength > 0.5) {
        v.positionStrength = 0.5;
        console.log(`Base vessel ${v.name || "unnamed"} position strength capped at 0.5`);
      }
    });
    
    // After arrangement, log the final position of the preferred vessel
    if (preferredVessel) {
      // Calculate the grid column based on position
      const minX = playAreaX;
      const maxX = playAreaX + playAreaWidth;
      const columnWidth = (maxX - minX) / 3;
      
      // Determine which grid column the vessel ended up in
      let vesselColumn;
      if (preferredVessel.x < minX + columnWidth) {
        vesselColumn = 0; // Left column
      } else if (preferredVessel.x < minX + 2 * columnWidth) {
        vesselColumn = 1; // Center column
      } else {
        vesselColumn = 2; // Right column
      }
      
      // Check if we successfully honored the vessel's preferred position
      const preferredColumnHonored = !preferredVessel.hasOwnProperty('preferredColumn') || 
                                   vesselColumn === preferredVessel.preferredColumn;
      const preferredRowHonored = Math.floor((preferredVessel.y - startY) / (basic_h + vertical_margin)) === preferredVessel.preferredRow;
      
      console.log("=== VESSEL POSITIONED ===");
      console.log("Final position of vessel with preferred position:", {x: preferredVessel.x, y: preferredVessel.y});
      console.log("Grid position:", 
                  {row: Math.floor((preferredVessel.y - startY) / (basic_h + vertical_margin)), 
                   column: vesselColumn});
      console.log("Preferred position was:", 
                  {row: preferredVessel.preferredRow, column: preferredVessel.preferredColumn || 'not set'});
      console.log("Position honored:", {row: preferredRowHonored, column: preferredColumnHonored});
      console.log("========================");
      
      // ENHANCEMENT: Do NOT clear the preferences - keep them for next time
      // This is the key change that makes positioning persistent
      // delete preferredVessel.preferredRow;
      // delete preferredVessel.preferredColumn;
    }
  }
  
  // Function to position a single vessel without rearranging all other vessels
  function positionSingleVessel(vessel, dropX, dropY) {
    // Calculate vessel sizes - must match the same calculations in arrangeVessels
    const margin = Math.max(playAreaWidth * 0.0125, 3); // 1.25% of play area width, min 3px
    const vertical_margin = Math.max(playAreaHeight * 0.005, 2); // 0.5% of play area height, min 2px
    
    // Calculate basic vessel width and height
    const basic_w = (playAreaWidth - (4 * margin)) / 3;
    const basic_h = basic_w * 0.8;
    
    // Advanced vessels are twice as wide
    const advanced_w = basic_w * 2 + margin;
    const advanced_h = basic_h;
    
    // Calculate the starting Y position based on layout type
    const startY = playAreaY + playAreaHeight * getCurrentLayout().vesselsStart;
    
    // Calculate the row height
    const rowHeight = basic_h * 0.83 + vertical_margin; // Adjusted to use 83% of vessel height
    
    // Calculate which row the vessel should be positioned in
    const relativeDropY = Math.max(0, dropY - startY);
    const dropRowIndex = Math.floor(relativeDropY / rowHeight);
    
    // Calculate the maximum number of rows based on existing vessels
    const maxRows = Math.ceil(vessels.length / 3);
    const targetRow = Math.min(dropRowIndex, maxRows);
    
    // Calculate column position
    const totalRowWidth = playAreaWidth - (2 * margin);
    const columnWidth = totalRowWidth / 3;
    const startX = playAreaX + margin;
    
    // Determine target column
    const relativeDropX = dropX - startX;
    let targetColumn = 0;
    
    if (relativeDropX >= 0 && relativeDropX <= totalRowWidth) {
      targetColumn = Math.floor(relativeDropX / columnWidth);
    } else if (relativeDropX > totalRowWidth) {
      targetColumn = 2;
    }
    
    // For advanced vessels, adjust column to prevent being in the center column
    if (vessel.isAdvanced && targetColumn === 1) {
      // Shift left or right based on drop position
      const centerX = playAreaX + playAreaWidth / 2;
      if (dropX < centerX) {
        targetColumn = 0; // Left-aligned (spans columns 0-1)
      } else {
        targetColumn = 2; // Right-aligned (spans columns 1-2)
      }
    }
    
    // Store the preferred position
    vessel.preferredRow = targetRow;
    vessel.preferredColumn = targetColumn;
    
    // Calculate the exact position based on the grid
    // For advanced vessels in columns 0 or 2
    if (vessel.isAdvanced) {
      // Width of the vessel
      vessel.w = advanced_w;
      vessel.h = advanced_h;
      
      if (targetColumn === 0) {
        // Left-aligned advanced vessel (spans columns 0-1)
        vessel.x = playAreaX + margin + columnWidth + margin/2;
      } else if (targetColumn === 2) {
        // Right-aligned advanced vessel (spans columns 1-2)
        vessel.x = playAreaX + margin + columnWidth + margin + columnWidth + margin/2;
      } else {
        // Center vessel - shouldn't normally happen because of adjustment above
        vessel.x = playAreaX + playAreaWidth / 2;
      }
    } else {
      // Basic vessel
      vessel.w = basic_w;
      vessel.h = basic_h;
      
      // Position at the center of the target column
      vessel.x = startX + (targetColumn * columnWidth) + columnWidth/2;
    }
    
    // Set Y position based on the target row
    vessel.y = startY + targetRow * rowHeight;
    
    // Update original position
    vessel.originalX = vessel.x;
    vessel.originalY = vessel.y;
    
    // Log the positioning
    console.log(`Positioned single vessel at Row: ${targetRow}, Column: ${targetColumn}`);
    console.log(`Position: (${vessel.x}, ${vessel.y})`);
    
    // Return the updated vessel for chaining
    return vessel;
  }
  
  // Function to process auto final combination with enhanced visuals
  function processAutoFinalCombination() {
    // Only proceed if auto mode is active
    if (!autoFinalCombination) return;
    
    // Check if there's any active verb animation - if so, check if it's in or past the middle phase
    const activeVerbAnimations = animations.filter(anim => 
      (anim instanceof VerbAnimation) && anim.active);
    
    // Check if we have a verb animation that's at least 50% through (middle of animation)
    const hasVerbAtMidpoint = activeVerbAnimations.some(anim => 
      anim.progress > 0.5); // Changed from 0.01 to 0.5 - wait for animation to be actually halfway
    
    // Check if there are active vessel movement animations
    const hasActiveMovementAnimation = animations.some(anim => 
      anim instanceof VesselMovementAnimation && anim.active);
    
    // Check if there are active combine animations (particles)
    const hasActiveCombineAnimation = animations.some(anim => 
      anim instanceof CombineAnimation && anim.active);
    
    // If we have movement animations or combine animations, wait for them to complete
    if (hasActiveMovementAnimation || hasActiveCombineAnimation) {
      console.log("Waiting for vessel movements or combine animations to complete before proceeding");
      return;
    }
    
    // Allow proceeding with animation if verb is at midpoint or later, or no verb animations exist
    const canProceedWithAnimation = !activeVerbAnimations.length || hasVerbAtMidpoint;
    
    // State machine for the auto combination process
    switch (autoFinalCombinationState) {
      case "WAITING":
        // Wait before starting the penultimate combination
        if (autoFinalCombinationTimer > 0) {
          // Timer handled in draw loop
        } else {
          autoFinalCombinationState = "PENULTIMATE";
          autoFinalCombinationTimer = 20; // Reduced from 30 - Add additional wait before starting penultimate state (0.67 second)
          console.log("TRANSITIONING TO PENULTIMATE STATE");
        }
        break;
        
      case "PENULTIMATE":
        // Process penultimate combinations until we have only the final ingredients left
        if (!canProceedWithAnimation) {
          // Wait for verb animations to reach midpoint or complete
          return;
        }
        
        console.log("AUTO COMBINATION STATE: PENULTIMATE");
        
        // Check if timer has expired
        if (autoFinalCombinationTimer > 0) {
          return;
        }
        
        // If we only have the exact vessels needed for the final combination, move to next state
        if (checkReadyForFinalCombination()) {
          console.log("Final combination is ready with vessels:", vessels.map(v => v.name));
          // Store the vessels for the final combination
          finalCombinationVessels = [...vessels];
          // Skip directly to the ANIMATE state (combined SHAKE+MOVE)
          autoFinalCombinationState = "ANIMATE";
          autoFinalCombinationTimer = 10; // Reduced from 15 - Small delay before animation
        } else if (vessels.length >= 2) {
          // First check if we can do the final combination with multiple vessels
          const finalVessels = findVesselsForFinalCombination();
          
          if (finalVessels && finalVessels.length > 2) {
            console.log(`Found ${finalVessels.length} vessels needed for final combination!`);
            // We have all vessels needed for final combination but it requires more than 2
            // Move directly to animate state with these vessels
            finalCombinationVessels = finalVessels;
            autoFinalCombinationState = "ANIMATE";
            autoFinalCombinationTimer = 10;
          } else if (vessels.length >= 2) {
            // Still need to make more combinations - identify the next vessels to combine
            const vesselPair = findBestVesselPair();
            
            if (!vesselPair) {
              console.error("No valid vessel combination found during auto sequence");
              autoFinalCombination = false;
              return;
            }
            
            let [v1, v2] = vesselPair;
            
            // Create animation to move vessels toward each other
            animations.push(new CombineAnimation(v1.x, v1.y, v1.color, (v1.x + v2.x) / 2, (v1.y + v2.y) / 2));
            animations.push(new CombineAnimation(v2.x, v2.y, v2.color, (v1.x + v2.x) / 2, (v1.y + v2.y) / 2));
            
            // Combine the vessels
            let new_v = combineVessels(v1, v2);
            
            if (new_v) {
              // Remove the original vessels
              vessels.splice(vessels.indexOf(v1), 1);
              vessels.splice(vessels.indexOf(v2), 1);
              
              // Add the new vessel
              vessels.push(new_v);
              
              console.log("Auto-combined intermediate vessels. New vessel:", new_v.name || "unnamed");
              
              // Pulse the new vessel (calmer animation than shake)
              if (typeof new_v.pulse === 'function') {
                console.log("Using pulse animation for auto-combined intermediate vessel");
                new_v.pulse(1000); // Increased from 500ms to 1000ms for calmer animation
              } else {
                console.log("Using regular pulse for auto-combined intermediate vessel");
                new_v.pulse(1000); // Increased from 500ms to 1000ms for calmer animation
              }
              
              // Create verb animation for intermediate step
              if (new_v.verb) {
                console.log("Creating verb animation for intermediate step:", new_v.verb);
                animations.push(new VerbAnimation(new_v.verb, new_v.x, new_v.y, new_v));
                // Reset verbDisplayTime to prevent duplicate animations
                new_v.verbDisplayTime = 0;
              }
              
              // Wait for the verb animation plus a little extra time before the next step
              // INCREASED TIMER: Changed from 45 to 90 frames (3 seconds at 30fps) for non-final combinations
              autoFinalCombinationTimer = 90; // 3 seconds at 30fps
              
              // Add an extra state check to ensure we don't process too quickly
              // This prevents the state machine from immediately processing again
              return;
            } else {
              // If combination failed (shouldn't happen), move to next state
              console.error("Auto combination failed during penultimate phase");
              autoFinalCombinationState = "ANIMATE";
              autoFinalCombinationTimer = 15; // Reduced from 20 - Wait before starting animation
            }
          }
        } else {
          // If we have fewer than 2 vessels and aren't ready, something went wrong
          console.error("Not enough vessels for final combination");
          autoFinalCombination = false;
        }
        break;
        
      case "ANIMATE":
        // Combined state for SHAKE and MOVE - do both simultaneously
        console.log("AUTO COMBINATION STATE: ANIMATE - Starting shake and move animations simultaneously");
        
        // Calculate the center point for all vessels to move toward
        let centerX = 0;
        let centerY = 0;
        
        vessels.forEach(vessel => {
          centerX += vessel.x;
          centerY += vessel.y;
        });
        
        centerX /= vessels.length;
        centerY /= vessels.length;
        
        // Store the center point for movement
        autoFinalCombinationCenter = {x: centerX, y: centerY};
        console.log(`Calculated center point: (${centerX}, ${centerY})`);
        
        // Apply shake AND movement animations to all vessels simultaneously
        vessels.forEach(vessel => {
          // Apply shake with higher intensity
          vessel.shake(2); // Double intensity for more dramatic effect
          
          // Create movement animation to center
          animations.push(new VesselMovementAnimation(
            vessel,
            autoFinalCombinationCenter.x,
            autoFinalCombinationCenter.y
          ));
          
          console.log(`Vessel ${vessel.name || "unnamed"} is shaking and moving to center`);
        });
        
        // Move to combining state - will wait for movement animations to complete
                  autoFinalCombinationState = "COMBINING";
          autoFinalCombinationTimer = 15; // Reduced from 20 - Small delay before combining
        break;
        
      case "COMBINING":
        console.log("AUTO COMBINATION STATE: COMBINING");
        
        // Ensure all vessels have reached the center
        const allVesselsAtCenter = vessels.every(vessel => 
          Math.abs(vessel.x - autoFinalCombinationCenter.x) < 5 &&
          Math.abs(vessel.y - autoFinalCombinationCenter.y) < 5
        );
        
        if (allVesselsAtCenter) {
          console.log("All vessels have reached the center, performing final combination");
          
          // Create the final combination from all vessels
          let finalVesselParams = {
            ingredients: [],
            complete_combinations: [],
            name: final_combination.name,
            color: COLORS.green,
            x: autoFinalCombinationCenter.x,
            y: autoFinalCombinationCenter.y,
            w: vessels[0].w * 1.2, // Slightly larger
            h: vessels[0].h * 1.2
          };
          
          // Remove all existing vessels
          vessels = [];
          
          // Create the final vessel
          let finalVessel = new Vessel(
            finalVesselParams.ingredients,
            finalVesselParams.complete_combinations,
            finalVesselParams.name,
            finalVesselParams.color,
            finalVesselParams.x,
            finalVesselParams.y,
            finalVesselParams.w,
            finalVesselParams.h
          );
          
          // ENHANCEMENT - APlasker - Mark final vessel as newly combined
          finalVessel.isNewlyCombined = true;
          
          // ENHANCEMENT - APlasker - Set maximum position strength
          finalVessel.positionStrength = 1.0;
          
          // Set the verb for the final vessel
          finalVessel.verb = final_combination.verb || "Complete!";
          
          // Add the final vessel to the vessels array
          vessels.push(finalVessel);
          
          // Create spectacular particle effects for the final combination
          // Create multiple bursts of particles
          for (let i = 0; i < 20; i++) {
            animations.push(new CombineAnimation(
              autoFinalCombinationCenter.x + random(-50, 50),
              autoFinalCombinationCenter.y + random(-50, 50),
              COLORS.green,
              autoFinalCombinationCenter.x,
              autoFinalCombinationCenter.y
            ));
          }
          
          // Create final verb animation immediately
          console.log("Creating final verb animation");
          const finalVerb = finalVessel.verb || final_combination.verb || "Complete!";
          createFinalVerbAnimation(finalVerb);
          
          // End auto mode
          autoFinalCombination = false;
          console.log("Auto final combination sequence complete");
        } else {
          console.log("Waiting for vessels to reach center");
          // Keep waiting
          autoFinalCombinationTimer = 10;
        }
        break;
        
      default:
        // Should never get here, but just in case
        console.error("Unknown auto combination state:", autoFinalCombinationState);
        autoFinalCombination = false;
        break;
    }
  }
  
  // Helper function to check if we have exactly the final combination ingredients ready
  function checkReadyForFinalCombination() {
    console.log("AUTO COMBINATION STATE: PENULTIMATE");
    
    // Get all available items from all vessels
    let allAvailableItems = [];
    vessels.forEach(v => {
      allAvailableItems.push(...getAllItemsFromVessel(v));
    });
    
    // Expand combos into their base ingredients if needed
    const expandedItems = expandItemsForFinalRecipe(allAvailableItems);
    
    // Count occurrences of each item (after expansion)
    let availableItemsMap = {};
    for (const item of expandedItems) {
      availableItemsMap[item] = (availableItemsMap[item] || 0) + 1;
    }
    
    // Count required components
    let requiredComponentsMap = {};
    for (const component of final_combination.required) {
      requiredComponentsMap[component] = (requiredComponentsMap[component] || 0) + 1;
    }
    
    // Check if we have exactly what we need for the final combination
    // First, check if all required components are available
    for (const component in requiredComponentsMap) {
      if (!availableItemsMap[component] || 
          availableItemsMap[component] < requiredComponentsMap[component]) {
        console.log(`Missing required component: ${component} (need ${requiredComponentsMap[component]}, have ${availableItemsMap[component] || 0})`);
        return false;
      }
    }
    
    // Check if we have extra items that aren't part of the final combination
    let totalRequiredItems = 0;
    let totalAvailableItems = 0;
    
    for (const component in requiredComponentsMap) {
      totalRequiredItems += requiredComponentsMap[component];
      totalAvailableItems += availableItemsMap[component] || 0;
    }
    
    // Count items that aren't part of the final recipe
    let extraItems = 0;
    let extraItemsList = [];
    for (const item in availableItemsMap) {
      if (!requiredComponentsMap[item]) {
        extraItems += availableItemsMap[item];
        extraItemsList.push(item);
      }
    }
    
    // FIXED: Check if extra items are base ingredients that should be included in final combination
    if (extraItems > 0) {
      console.log(`Have extra items not explicitly required for final combination: ${extraItems} extra items`);
      console.log(`Extra items: [${extraItemsList.join(", ")}]`);
      
      // Check if these extra items are base ingredients
      let allExtraAreBaseIngredients = true;
      for (const extraItem of extraItemsList) {
        // Check if this is a base ingredient
        const isBaseIngredient = base_ingredients && base_ingredients.includes(extraItem);
        
        // Also check if it's marked as a final base ingredient
        const isFinalBaseIngredient = recipe_data && recipe_data.finalBaseIngredients && 
                                      recipe_data.finalBaseIngredients.includes(extraItem);
        
        if (!isBaseIngredient && !isFinalBaseIngredient) {
          // This extra item is not a base ingredient
          allExtraAreBaseIngredients = false;
          console.log(`Extra item '${extraItem}' is NOT a base ingredient`);
        } else {
          console.log(`Extra item '${extraItem}' IS a base ingredient (base: ${isBaseIngredient}, finalBase: ${isFinalBaseIngredient})`);
        }
      }
      
      // If all extra items are base ingredients, we should proceed with the final combination
      if (!allExtraAreBaseIngredients) {
        console.log("Not all extra items are base ingredients - not ready for final combination");
        return false;
      } else {
        console.log("All extra items are base ingredients - proceeding with final combination");
      }
    }
    
    // Log success
    console.log("Final combination is ready!");
    console.log("Required:", requiredComponentsMap);
    console.log("Available (expanded):", availableItemsMap);
    
    return true;
  }

  function setupCombosAndRecipes() {
    // Initialize collectedIngredients array for each combo
    for (let combo of intermediate_combinations) {
      combo.collectedIngredients = [];
    }
    final_combination.collectedIngredients = [];
  }

  // NEW FUNCTION: Check for Parent Combination Opportunities - Solution 2
  // This function checks if any current vessels can be auto-combined into their parent combination
  function checkForParentCombinations() {
    console.log("Checking for parent combination opportunities...");
    
    // DISABLED: Auto-combination should only happen for final recipe
    // Non-final combos should require manual player action
    console.log("Auto-combination disabled for non-final combos");
    return null;
  }
  
  // Fisher-Yates shuffle algorithm to randomize vessel order
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // DUPLICATE INGREDIENT FIX: Helper function to check if we have enough of each required ingredient
  // This replaces the simple .includes() and .every() checks that couldn't handle duplicates
  function canFulfillRecipeRequirements(availableIngredients, requiredIngredients) {
    // Create a count map for required ingredients
    const requiredCounts = {};
    for (const ingredient of requiredIngredients) {
      requiredCounts[ingredient] = (requiredCounts[ingredient] || 0) + 1;
    }
    
    // Create a count map for available ingredients
    const availableCounts = {};
    for (const ingredient of availableIngredients) {
      availableCounts[ingredient] = (availableCounts[ingredient] || 0) + 1;
    }
    
    // Check if we have enough of each required ingredient
    for (const [ingredient, requiredCount] of Object.entries(requiredCounts)) {
      const availableCount = availableCounts[ingredient] || 0;
      if (availableCount < requiredCount) {
        return false;
      }
    }
    
    // Also ensure we don't have extra ingredients that aren't required
    for (const [ingredient, availableCount] of Object.entries(availableCounts)) {
      const requiredCount = requiredCounts[ingredient] || 0;
      if (availableCount > requiredCount) {
        return false;
      }
    }
    
    return true;
  }
  
  // DUPLICATE INGREDIENT FIX: Helper function to get missing ingredients for error messages
  function getMissingIngredients(availableIngredients, requiredIngredients) {
    // Create a count map for required ingredients
    const requiredCounts = {};
    for (const ingredient of requiredIngredients) {
      requiredCounts[ingredient] = (requiredCounts[ingredient] || 0) + 1;
    }
    
    // Create a count map for available ingredients
    const availableCounts = {};
    for (const ingredient of availableIngredients) {
      availableCounts[ingredient] = (availableCounts[ingredient] || 0) + 1;
    }
    
    // Find missing ingredients
    const missing = [];
    for (const [ingredient, requiredCount] of Object.entries(requiredCounts)) {
      const availableCount = availableCounts[ingredient] || 0;
      const missingCount = requiredCount - availableCount;
      if (missingCount > 0) {
        // Add the ingredient name the number of times it's missing
        for (let i = 0; i < missingCount; i++) {
          missing.push(ingredient);
        }
      }
    }
    
    return missing;
  }
  
  // Helper function to find the best pair of vessels to combine
  function findBestVesselPair() {
    console.log("=== FINDING BEST VESSEL PAIR ===");
    console.log("Current vessels:", vessels.map(v => v.name || v.ingredients.join("+")));
    console.log("Total vessels available:", vessels.length);
    
    // Define required variables
    const completedCombos = vessels
      .filter(v => v.name && v.ingredients.length === 0)
      .map(v => v.name);
    const partialCombinations = [];
    const startedCombinations = [];
    
    // Collect partial and started combinations
    vessels.forEach(v => {
      if (v.complete_combinations) {
        partialCombinations.push(...v.complete_combinations);
      }
      if (v.started_combinations) {
        startedCombinations.push(...v.started_combinations);
      }
    });
    
    // Log detailed state of each vessel
    vessels.forEach((v, index) => {
      logVesselState(v, `  [${index}] `);
    });
    
    // Special handling for final combination scenarios
    // Check if we have a partial final combination that needs one more ingredient
    for (let i = 0; i < vessels.length; i++) {
      const vessel = vessels[i];
      
      // Check if this vessel contains partial final combination items
      const vesselItems = getAllItemsFromVessel(vessel);
      
      // Count how many final recipe components this vessel has
      let finalComponentsInVessel = vesselItems.filter(item => 
        final_combination.required.includes(item)
      );
      
      // If this vessel has some (but not all) final components, look for the missing pieces
      if (finalComponentsInVessel.length > 0 && finalComponentsInVessel.length < final_combination.required.length) {
        console.log(`\nVessel ${i} has partial final components: [${finalComponentsInVessel.join(", ")}]`);
        
        // Check other vessels for the missing components
        for (let j = 0; j < vessels.length; j++) {
          if (i === j) continue;
          
          const otherVesselItems = getAllItemsFromVessel(vessels[j]);
          const combinedItems = [...new Set([...vesselItems, ...otherVesselItems])];
          
          // FIXED: Also get base ingredients that might be present
          const baseIngredientsInCombination = combinedItems.filter(item => 
            (base_ingredients && base_ingredients.includes(item)) ||
            (recipe_data && recipe_data.finalBaseIngredients && recipe_data.finalBaseIngredients.includes(item))
          );
          
          // Check if combining these would complete the final recipe
          if (arraysMatchExact(combinedItems, final_combination.required)) {
            console.log(`✓ Found pair that completes final combination!`);
            console.log(`  Vessel ${i}: [${vesselItems.join(", ")}]`);
            console.log(`  Vessel ${j}: [${otherVesselItems.join(", ")}]`);
            return [vessel, vessels[j]];
          }
          
          // FIXED: If we have all required items plus only base ingredients, that's also valid
          const hasAllRequired = final_combination.required.every(req => combinedItems.includes(req));
          const extraItems = combinedItems.filter(item => !final_combination.required.includes(item));
          const allExtrasAreBase = extraItems.every(item => 
            (base_ingredients && base_ingredients.includes(item)) ||
            (recipe_data && recipe_data.finalBaseIngredients && recipe_data.finalBaseIngredients.includes(item))
          );
          
          if (hasAllRequired && allExtrasAreBase) {
            console.log(`✓ Found pair that completes final combination (with base ingredients)!`);
            console.log(`  Vessel ${i}: [${vesselItems.join(", ")}]`);
            console.log(`  Vessel ${j}: [${otherVesselItems.join(", ")}]`);
            console.log(`  Base ingredients included: [${baseIngredientsInCombination.join(", ")}]`);
            return [vessel, vessels[j]];
          }
          
          // Also check with expanded items
          const expandedCombined = expandItemsForFinalRecipe(combinedItems);
          if (arraysMatchExact(expandedCombined, final_combination.required)) {
            console.log(`✓ Found pair that completes final combination (after expansion)!`);
            console.log(`  Vessel ${i}: [${vesselItems.join(", ")}]`);
            console.log(`  Vessel ${j}: [${otherVesselItems.join(", ")}]`);
            console.log(`  Expanded: [${expandedCombined.join(", ")}]`);
            return [vessel, vessels[j]];
          }
        }
      }
    }
    
    // Standard combination logic
    // Try to find a valid combination among current vessels
    for (let i = 0; i < vessels.length; i++) {
      for (let j = i + 1; j < vessels.length; j++) {
        const v1 = vessels[i];
        const v2 = vessels[j];
        
        // Get all items from both vessels
        const items1 = getAllItemsFromVessel(v1);
        const items2 = getAllItemsFromVessel(v2);
        const allItems = [...new Set([...items1, ...items2])];
        
        console.log(`\nTesting pair ${i} + ${j}:`);
        console.log(`  Vessel ${i}: [${items1.join(", ")}]`);
        console.log(`  Vessel ${j}: [${items2.join(", ")}]`);
        console.log(`  Combined: [${allItems.join(", ")}]`);
        
        // Check if this combination would result in a valid recipe
        // First check the final combination
        if (arraysMatchExact(allItems, final_combination.required)) {
          console.log("✓ Found valid pair for final combination!");
          return [v1, v2];
        }
        
        // Also check if expanding combos into ingredients would match final recipe
        const expandedItems = expandItemsForFinalRecipe(allItems);
        console.log(`  Expanded: [${expandedItems.join(", ")}]`);
        
        if (arraysMatchExact(expandedItems, final_combination.required)) {
          console.log("✓ Found valid pair for final combination (after expansion)!");
          return [v1, v2];
        }
        
        // Then check all intermediate combinations
        for (const combo of intermediate_combinations) {
          if (arraysMatchExact(allItems, combo.required)) {
            console.log(`✓ Found valid pair for ${combo.name}!`);
            return [v1, v2];
          }
        }
        
        // Also check for partial matches that would progress toward a recipe
        for (const combo of intermediate_combinations.concat([final_combination])) {
          if (allItems.every(item => combo.required.includes(item)) && 
              allItems.length < combo.required.length) {
            console.log(`✓ Found valid partial match for ${combo.name}`);
            return [v1, v2];
          }
        }
      }
    }
    
    // If no valid combination found, log what we have and what recipes expect
    console.log("\n✗ No valid vessel pair found!");
    console.log("\nDETAILED DIAGNOSTIC INFO:");
    console.log("========================");
    
    // Log current game state
    console.log("\nGame State:");
    console.log(`  - Game Won: ${gameWon}`);
    console.log(`  - Completed Combos: [${completedCombos.join(", ")}]`);
    console.log(`  - Partial Combos: [${partialCombinations.join(", ")}]`);
    console.log(`  - Started Combos: [${startedCombinations.join(", ")}]`);
    
    // Log all available items
    const allAvailableItems = [];
    vessels.forEach(v => {
      allAvailableItems.push(...getAllItemsFromVessel(v));
    });
    console.log(`\nAll available items in game: [${[...new Set(allAvailableItems)].join(", ")}]`);
    
    // Check which recipes could potentially be made
    console.log("\nRecipe Analysis:");
    const allCombos = [...intermediate_combinations, final_combination];
    allCombos.forEach(combo => {
      const required = combo.required;
      const available = required.filter(req => allAvailableItems.includes(req));
      const missing = required.filter(req => !allAvailableItems.includes(req));
      
      console.log(`\n  ${combo.name}:`);
      console.log(`    Required: [${required.join(", ")}]`);
      console.log(`    Available: [${available.join(", ")}] (${available.length}/${required.length})`);
      if (missing.length > 0) {
        console.log(`    Missing: [${missing.join(", ")}]`);
      }
    });
    
    return null;
  }

  // NEW: Helper function to find ALL vessels needed for final combination
  function findVesselsForFinalCombination() {
    console.log("=== FINDING VESSELS FOR FINAL COMBINATION ===");
    console.log("Current vessels:", vessels.map(v => v.name || v.ingredients.join("+")));
    console.log("Final recipe requires:", final_combination.required);
    
    // FIXED: Also check for base ingredients that should be included
    const finalBaseIngredients = (recipe_data && recipe_data.finalBaseIngredients) || [];
    if (finalBaseIngredients.length > 0) {
      console.log("Final base ingredients needed:", finalBaseIngredients);
    }
    
    // Get all available items from all vessels
    let allAvailableItems = [];
    let vesselItemsMap = new Map(); // Map to track which items come from which vessels
    
    vessels.forEach((vessel, index) => {
      const items = getAllItemsFromVessel(vessel);
      items.forEach(item => {
        allAvailableItems.push(item);
        if (!vesselItemsMap.has(item)) {
          vesselItemsMap.set(item, []);
        }
        vesselItemsMap.get(item).push(index);
      });
    });
    
    // Expand combos into their base ingredients if needed
    const expandedItems = expandItemsForFinalRecipe(allAvailableItems);
    
    // Check if we have all required items for final combination
    const hasAllRequired = final_combination.required.every(req => 
      expandedItems.includes(req)
    );
    
    if (!hasAllRequired) {
      console.log("Not all required items available for final combination");
      return null;
    }
    
    // Find the minimal set of vessels that contains all required items AND base ingredients
    let requiredVesselIndices = new Set();
    
    // For each required item, we need at least one vessel that contains it
    for (const reqItem of final_combination.required) {
      let found = false;
      
      // First check if any vessel has this item directly
      for (let i = 0; i < vessels.length; i++) {
        const vesselItems = getAllItemsFromVessel(vessels[i]);
        if (vesselItems.includes(reqItem)) {
          requiredVesselIndices.add(i);
          found = true;
          break;
        }
      }
      
      // If not found directly, check if any vessel has a combo that expands to include this item
      if (!found) {
        for (let i = 0; i < vessels.length; i++) {
          const vesselItems = getAllItemsFromVessel(vessels[i]);
          const expanded = expandItemsForFinalRecipe(vesselItems);
          if (expanded.includes(reqItem)) {
            requiredVesselIndices.add(i);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        console.log(`Required item ${reqItem} not found in any vessel`);
        return null;
      }
    }
    
    // FIXED: Also include vessels that contain final base ingredients
    for (let i = 0; i < vessels.length; i++) {
      const vesselItems = getAllItemsFromVessel(vessels[i]);
      
      // Check if this vessel contains any base ingredients
      const hasBaseIngredient = vesselItems.some(item => 
        base_ingredients && base_ingredients.includes(item)
      );
      
      // Check if this vessel contains any final base ingredients
      const hasFinalBaseIngredient = vesselItems.some(item => 
        finalBaseIngredients.includes(item)
      );
      
      if (hasBaseIngredient || hasFinalBaseIngredient) {
        console.log(`Vessel ${i} contains base ingredient(s): [${vesselItems.join(", ")}]`);
        requiredVesselIndices.add(i);
      }
    }
    
    // Get the vessels at these indices
    const selectedVessels = Array.from(requiredVesselIndices).map(i => vessels[i]);
    
    // Verify that the selected vessels contain what we need
    let selectedItems = [];
    selectedVessels.forEach(v => {
      selectedItems.push(...getAllItemsFromVessel(v));
    });
    
    const expandedSelectedItems = expandItemsForFinalRecipe(selectedItems);
    
    console.log(`✓ Found ${selectedVessels.length} vessels for final combination!`);
    selectedVessels.forEach((v, i) => {
      console.log(`  Vessel ${i}: [${getAllItemsFromVessel(v).join(", ")}]`);
    });
    
    // Return the selected vessels even if they have "extra" base ingredients
    return selectedVessels;
  }

  // NEW: Function to combine multiple vessels at once (for final combinations)
  function combineMultipleVessels(vesselsToMerge, centerX = null, centerY = null) {
    console.log("=== COMBINING MULTIPLE VESSELS ===");
    console.log(`Combining ${vesselsToMerge.length} vessels:`, vesselsToMerge.map(v => v.name || v.ingredients.join("+")));
    
    // Calculate center position if not provided
    if (centerX === null || centerY === null) {
      centerX = 0;
      centerY = 0;
      vesselsToMerge.forEach(v => {
        centerX += v.x;
        centerY += v.y;
      });
      centerX /= vesselsToMerge.length;
      centerY /= vesselsToMerge.length;
    }
    
    // Collect all items from all vessels
    let allItems = [];
    vesselsToMerge.forEach(v => {
      allItems.push(...getAllItemsFromVessel(v));
    });
    
    console.log("All items from vessels:", allItems);
    
    // Check for easter eggs
    checkForEasterEgg(allItems.filter(item => {
      return !intermediate_combinations.some(combo => combo.name === item) && 
             item !== final_combination.name;
    }));
    
    // Expand items for final recipe matching
    const expandedItems = expandItemsForFinalRecipe(allItems);
    console.log("Expanded items:", expandedItems);
    
    // FIXED: Check if we have all required items plus only base ingredients
    const hasAllRequired = final_combination.required.every(req => 
      expandedItems.includes(req) || allItems.includes(req)
    );
    
    const extraItems = allItems.filter(item => 
      !final_combination.required.includes(item)
    );
    
    const allExtrasAreBase = extraItems.length === 0 || extraItems.every(item => 
      (base_ingredients && base_ingredients.includes(item)) ||
      (recipe_data && recipe_data.finalBaseIngredients && recipe_data.finalBaseIngredients.includes(item))
    );
    
    // Check if this matches the final combination (either exactly or with base ingredients)
    if (arraysMatchExact(expandedItems, final_combination.required) || 
        (hasAllRequired && allExtrasAreBase)) {
      console.log("✓ Creating final combination vessel!");
      
      if (extraItems.length > 0) {
        console.log("  Including base ingredients:", extraItems);
      }
      
      // Create the final vessel
      let finalVessel = new Vessel(
        [], // No ingredients, it's complete
        [], // No partial combinations
        final_combination.name,
        COLORS.green,
        centerX,
        centerY,
        vesselsToMerge[0].w * 1.2, // Slightly larger
        vesselsToMerge[0].h * 1.2
      );
      
      // Set properties
      finalVessel.isNewlyCombined = true;
      finalVessel.positionStrength = 1.0;
      finalVessel.verb = final_combination.verb || "Complete!";
      
      // Remove all merged vessels from the game
      vesselsToMerge.forEach(v => {
        const index = vessels.indexOf(v);
        if (index > -1) {
          vessels.splice(index, 1);
        }
      });
      
      // Add the final vessel
      vessels.push(finalVessel);
      
      console.log("Final vessel created:", finalVessel.name);
      return finalVessel;
    } else {
      console.error("ERROR: Multiple vessel combination didn't match final recipe!");
      console.error("Expected:", final_combination.required);
      console.error("Got:", expandedItems);
      return null;
    }
  }

  function attemptCombination(v1, v2, mouseX = null, mouseY = null) {
    console.log("=== ATTEMPTING COMBINATION ===");
    console.log("Vessel 1:", v1.name || v1.ingredients.join("+") || "unnamed");
    console.log("Vessel 2:", v2.name || v2.ingredients.join("+") || "unnamed");
    
    // Use mouse position if provided, otherwise fall back to average position
    const newVesselX = mouseX !== null ? mouseX : (v1.x + v2.x) / 2;
    const newVesselY = mouseY !== null ? mouseY : (v1.y + v2.y) / 2;
    
    // Check if hint is active (simplified - now just checks the flag)
    let hintActive = showingHint;
    
    // UNIFIED LOGIC: Helper function to check if a combination of items matches a recipe
    const findMatchingRecipe = (items) => {
        console.log("Looking for recipe with items:", items);
        
        // Normalize items for comparison (trim whitespace, handle case)
        const normalizedItems = items.map(item => item.trim());
        
        // First check the final combination
        if (arraysMatchExact(normalizedItems, final_combination.required)) {
            console.log("✓ Matched: Final combination!");
            return final_combination;
        }
        
        // Then check all intermediate combinations
        for (const combo of intermediate_combinations) {
            if (arraysMatchExact(normalizedItems, combo.required)) {
                console.log(`✓ Matched: ${combo.name}`);
                return combo;
            }
        }
        
        // Check for partial matches (subset of required ingredients)
        for (const combo of intermediate_combinations.concat([final_combination])) {
            // Check if all items are part of the recipe (but recipe might need more)
            if (normalizedItems.every(item => combo.required.includes(item)) && 
                normalizedItems.length < combo.required.length) {
                console.log(`⚠ Partial match for: ${combo.name} (needs ${combo.required.length - normalizedItems.length} more items)`);
                console.log(`  Current items: [${normalizedItems.join(", ")}]`);
                console.log(`  Recipe needs: [${combo.required.join(", ")}]`);
                return { ...combo, isPartial: true };
            }
        }
        
        console.log("✗ No matching recipe found");
        console.log("  Items provided:", normalizedItems);
        console.log("  Available recipes:");
        intermediate_combinations.forEach(combo => {
            console.log(`    - ${combo.name}: [${combo.required.join(", ")}]`);
        });
        console.log(`    - ${final_combination.name}: [${final_combination.required.join(", ")}]`);
        
        return null;
    };
    
    // Helper function to create a vessel from a recipe match
    const createVesselFromRecipe = (recipe, items) => {
        const vesselWidth = Math.max(playAreaWidth * 0.25, 150);
        const vesselHeight = vesselWidth * 0.5;
        
        let new_v;
        
        if (recipe.isPartial) {
            // Create a yellow vessel for partial combination
            new_v = new Vessel(items.filter(item => !intermediate_combinations.some(c => c.name === item)), 
                              items.filter(item => intermediate_combinations.some(c => c.name === item)), 
                              null, 'yellow', newVesselX, newVesselY, vesselWidth, vesselHeight);
            
            // Track as active partial combination
            activePartialCombo = recipe.name;
            
            if (!partialCombinations.includes(recipe.name)) {
                partialCombinations.push(recipe.name);
                console.log(`Added ${recipe.name} to partialCombinations:`, partialCombinations);
            }
            
            if (!startedCombinations.includes(recipe.name)) {
                startedCombinations.push(recipe.name);
                console.log(`Added ${recipe.name} to startedCombinations:`, startedCombinations);
            }
            
            // Show partial combo message
            if (typeof Byline !== 'undefined' && Byline.showPartialComboMessage) {
                Byline.showPartialComboMessage();
            } else if (typeof window.Byline !== 'undefined' && window.Byline.showPartialComboMessage) {
                window.Byline.showPartialComboMessage();
            }
        } else {
            // Create a completed vessel
            new_v = new Vessel([], [], recipe.name, getNextCompletedVesselColor(recipe.name), 
                              newVesselX, newVesselY, vesselWidth, vesselHeight);
            
            new_v.verb = recipe.verb || "Mix";
            new_v.verbDisplayTime = 120;
            
            // Add to completedGreenVessels
            if (!completedGreenVessels.some(vessel => vessel.name === recipe.name)) {
                completedGreenVessels.push({name: recipe.name});
            }
            
            // Clear activePartialCombo since we completed the combination
            activePartialCombo = null;
            
            // Remove from partialCombinations array since it's now complete
            const index = partialCombinations.indexOf(recipe.name);
            if (index > -1) {
                partialCombinations.splice(index, 1);
                console.log(`Removed ${recipe.name} from partialCombinations:`, partialCombinations);
            }
            
            // Show success message
            if (typeof Byline !== 'undefined' && Byline.showSuccessMessage) {
                Byline.showSuccessMessage();
            } else if (typeof window.Byline !== 'undefined' && window.Byline.showSuccessMessage) {
                window.Byline.showSuccessMessage();
            }
            
            // Update collected ingredients tracking
            for (let combo of intermediate_combinations.concat([final_combination])) {
                if (combo.required.includes(new_v.name) && combo.collectedIngredients) {
                    combo.collectedIngredients.push(new_v.name);
                    console.log(`Added ${new_v.name} to ${combo.name}'s collected ingredients: ${combo.collectedIngredients.length}/${combo.required.length}`);
                }
            }
        }
        
        new_v.isAdvanced = true;
        return new_v;
    };
    
    // Get all items from both vessels
    const allItems = [...new Set([...getAllItemsFromVessel(v1), ...getAllItemsFromVessel(v2)])];
    console.log("All items from both vessels:", allItems);
    
    // Check for Easter eggs first
    if (typeof checkForEasterEgg === 'function' && easter_eggs && easter_eggs.length > 0) {
        const eggMatch = checkForEasterEgg(allItems);
        if (eggMatch) {
            console.log("Found Easter egg match:", eggMatch.name);
            displayEasterEgg(eggMatch, v1, v2);
            moveHistory.push({type: 'easterEgg'});
            return null;
        }
    }
    
    // Check if this is a duplicate ingredient combination (same ingredient twice)
    if (v1.ingredients.length === 1 && v2.ingredients.length === 1 && 
        v1.ingredients[0] === v2.ingredients[0]) {
        console.log("Cannot combine two vessels with the same ingredient:", v1.ingredients[0]);
        return null;
    }
    
    // Find matching recipe
    const matchingRecipe = findMatchingRecipe(allItems);
    
    if (matchingRecipe) {
        console.log("Creating vessel from matching recipe:", matchingRecipe.name);
        const new_v = createVesselFromRecipe(matchingRecipe, allItems);
        
        if (new_v) {
            console.log("New vessel created in combineVessels:", new_v.name || "unnamed");
        }
        
        return new_v;
    } else {
        console.log("No matching recipe found for items:", allItems);
        return null;
    }
}