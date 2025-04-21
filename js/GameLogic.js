function combineVessels(v1, v2) {
    console.log("combineVessels called for:", v1.name || "unnamed", "and", v2.name || "unnamed");
    
    // Check if hint is active before creating any new vessels
    let hintActive = showingHint && hintVessel;
    
    // Case 1: Both vessels are base ingredients (white vessels)
    if (v1.ingredients.length > 0 && v2.ingredients.length > 0 && v1.complete_combinations.length === 0 && v2.complete_combinations.length === 0) {
      let U = [...new Set([...v1.ingredients, ...v2.ingredients])];
      
      // Special handling for hint: If all ingredients are part of the hint
        if (hintActive) {
          // Check if all ingredients are required for the hint
          let allIngredientsInHint = U.every(ing => hintVessel.required.includes(ing));
          
          // Check if any of these ingredients are already collected in the hint
          let anyAlreadyCollected = U.some(ing => hintVessel.collected.includes(ing));
          
          // If all ingredients are part of the hint and none are already collected,
        // we should add them directly to the hint vessel instead of creating a new vessel
          if (allIngredientsInHint && !anyAlreadyCollected) {
          console.log(`Adding ingredients directly to hint: ${U.join(', ')}`);
          
          // Add all ingredients to the hint vessel
          for (let ing of U) {
            hintVessel.addIngredient(ing);
          }
          
          // Create animations directly from each original vessel to the hint vessel
          createCombineAnimation(v1.x, v1.y, COLORS.vesselHint, hintVessel.x, hintVessel.y);
          createCombineAnimation(v2.x, v2.y, COLORS.vesselHint, hintVessel.x, hintVessel.y);
          
          // Add red moves to history - one for each ingredient (or at least one if it was a combination)
          // This ensures we count the proper number of turns when adding multiple ingredients at once
          let numIngredientsAdded = Math.max(1, U.length);
          // Red counters have been removed
          // for (let j = 0; j < numIngredientsAdded; j++) {
          //   moveHistory.push('#FF5252');
          // }
          
          // Check if hint is complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
            
            // Return the new vessel
            if (newVessel) {
              console.log("New vessel created in combineVessels:", newVessel.name || "unnamed");
              // Note: pulse is NOT called here - may need to be added
            }
            return newVessel;
          }
          
          // Return null to indicate no new vessel should be created
          // The ingredients were added directly to the hint vessel
          return null;
        }
      }
      
      // APlasker - Easter Egg Check: Check if the combination of ingredients matches an Easter egg
      if (typeof checkForEasterEgg === 'function' && easter_eggs && easter_eggs.length > 0) {
        console.log("Checking for Easter egg with ingredients:", U);
        const eggMatch = checkForEasterEgg(U);
        if (eggMatch) {
          console.log("Found Easter egg match:", eggMatch.name);
          // Display the Easter egg
          displayEasterEgg(eggMatch, v1, v2);
          // Add to move history to track that an Easter egg was found
          moveHistory.push({type: 'easterEgg'});
          // Continue with normal combination (don't block regular gameplay)
        }
      }
      
      // Check if this combination matches or partially matches any recipe
      let C_candidates = intermediate_combinations.filter(C => {
        // Check if there's any overlap between the required ingredients and our combined set
        let overlap = C.required.filter(ing => U.includes(ing));
        // Only consider it a match if ALL ingredients in U are part of the recipe
        // AND there's at least one ingredient from the recipe in U
        return overlap.length > 0 && U.every(ing => C.required.includes(ing));
      });
      
      // Only create a new vessel if we have valid recipe candidates
      if (C_candidates.length > 0) {
        // Calculate appropriate vessel dimensions based on play area size
        const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
        const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
        
        // Create a new vessel (yellow or green) with relative dimensions
        let new_v = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
        // Explicitly set isAdvanced property for correct positioning
        new_v.isAdvanced = true;
        
        let C = C_candidates[0];
        
        // Check if we have all required ingredients for this combination
        // Modified: Only check if all required ingredients are present, not requiring exact length match
        if (C.required.every(ing => U.includes(ing))) {
          // Only turn green if not part of an active hint
          if (!hintActive || C.name !== hintVessel.name) {
          new_v.name = C.name;
          new_v.color = COLORS.green; // Use COLORS.green instead of string 'green'
            new_v.ingredients = []; // Clear ingredients since this is now a complete combination
            
            // Set the verb from the combination and display it
            for (let combo of intermediate_combinations) {
              if (combo.name === C.name && combo.verb) {
                new_v.verb = combo.verb;
                new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
                break;
              }
            }
            
            // Add to completedGreenVessels when creating a green vessel - APlasker
            if (!completedGreenVessels.some(vessel => vessel.name === C.name)) {
              completedGreenVessels.push({name: C.name});
            }
            
            // Clear activePartialCombo since we completed the combination
            activePartialCombo = null;
            
            // Remove from partialCombinations array since it's now complete
            const index = partialCombinations.indexOf(C.name);
            if (index > -1) {
              partialCombinations.splice(index, 1);
              console.log(`Removed ${C.name} from partialCombinations:`, partialCombinations);
            }
            
            console.log(`Created green vessel for ${C.name} with ingredients: ${U.join(', ')}`);
          }
        } else {
          console.log(`Created yellow vessel with ingredients: ${U.join(', ')}`);
          console.log(`Missing ingredients for ${C.name}: ${C.required.filter(ing => !U.includes(ing)).join(', ')}`);
          
          // Track this as the active partial combination
          activePartialCombo = C.name;
          
          // Add to partialCombinations array if not already in it
          if (!partialCombinations.includes(C.name)) {
            partialCombinations.push(C.name);
            console.log(`Added ${C.name} to partialCombinations:`, partialCombinations);
          }
          
          console.log(`Set activePartialCombo to: ${activePartialCombo}`);
        }
        
        if (new_v) {
          console.log("New vessel created in combineVessels:", new_v.name || "unnamed");
          // Note: pulse is NOT called here - may need to be added
        }
        return new_v;
      } else {
        // No matching recipe, don't create a vessel
        console.log(`Cannot combine unrelated ingredients: ${U.join(', ')}`);
        // Clear activePartialCombo since we don't have a valid partial match
        activePartialCombo = null;
        return null;
      }
    } 
    // Case 2: Both vessels are completed combinations (green vessels)
    else if ((v1.name || v1.complete_combinations.length > 0) && (v2.name || v2.complete_combinations.length > 0)) {
      // Handle combining completed combinations (green vessels)
      let set1 = v1.complete_combinations.length > 0 ? v1.complete_combinations : (v1.name ? [v1.name] : []);
      let set2 = v2.complete_combinations.length > 0 ? v2.complete_combinations : (v2.name ? [v2.name] : []);
      let U = [...new Set([...set1, ...set2])];
      
      console.log("Combining completed combinations:", U);
      
      // APlasker - Easter Egg Check for combining named vessels
      if (typeof checkForEasterEgg === 'function' && easter_eggs && easter_eggs.length > 0) {
        // Use vessel names for Easter egg check when combining completed combinations
        if (v1.name && v2.name) {
          const nameArray = [v1.name, v2.name];
          console.log("Checking for Easter egg with named vessels:", nameArray);
          const eggMatch = checkForEasterEgg(nameArray);
          if (eggMatch) {
            console.log("Found Easter egg match from named vessels:", eggMatch.name);
            // Display the Easter egg
            displayEasterEgg(eggMatch, v1, v2);
            // Add to move history to track that an Easter egg was found
            moveHistory.push({type: 'easterEgg'});
            // Continue with normal combination (don't block regular gameplay)
          }
        }
      }
      
      // Find the combinations in our intermediate_combinations array
      let combo1 = null;
      let combo2 = null;
      
      // Find the combination objects for the vessels being combined
      for (let name of set1) {
        const found = intermediate_combinations.find(c => c.name === name);
        if (found) {
          combo1 = found;
          break;
        }
      }
      
      for (let name of set2) {
        const found = intermediate_combinations.find(c => c.name === name);
        if (found) {
          combo2 = found;
          break;
        }
      }
      
      console.log("Combo 1:", combo1);
      console.log("Combo 2:", combo2);
      
      // Check if both combinations have the same parent_combo
      if (combo1 && combo2 && combo1.parent_combo && combo2.parent_combo && 
          combo1.parent_combo === combo2.parent_combo) {
        
        console.log("Both combinations have the same parent:", combo1.parent_combo);
        
        // Find the parent combination
        const parentCombo = intermediate_combinations.find(c => c.combo_id === combo1.parent_combo) || 
                           (final_combination.combo_id === combo1.parent_combo ? final_combination : null);
        
        if (parentCombo) {
          console.log("Found parent combination:", parentCombo.name);
          
          // Calculate appropriate vessel dimensions based on play area size
          const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
          const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
          
          // Create a new vessel for the parent combination with relative dimensions
          let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
          // Explicitly set isAdvanced property for correct positioning
          new_v.isAdvanced = true;
          
          // Check if we have all required components for the parent combination
          // Get all combinations that have this parent
          const requiredCombos = intermediate_combinations
            .filter(c => c.parent_combo === parentCombo.combo_id)
            .map(c => c.name);
            
          console.log("Required combinations for parent:", requiredCombos);
          
          // Check if we have all the required combinations
          const hasAllRequired = requiredCombos.every(name => U.includes(name));
          
          if (hasAllRequired) {
            new_v.name = parentCombo.name;
            new_v.color = COLORS.green; // Use our explicit green color
            new_v.complete_combinations = []; // Clear since this is now a complete combination
            
            // Set the verb from the parent combination and display it
            if (parentCombo.verb) {
              new_v.verb = parentCombo.verb;
              new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
            }
            
            // Add parent combo to completed vessels - APlasker
            if (!completedGreenVessels.some(vessel => vessel.name === parentCombo.name)) {
              completedGreenVessels.push({name: parentCombo.name});
            }
            
            console.log(`Created green vessel for ${parentCombo.name}`);
          } else {
            console.log(`Created yellow vessel with combinations: ${U.join(', ')}`);
            console.log(`Missing combinations for ${parentCombo.name}: ${requiredCombos.filter(name => !U.includes(name)).join(', ')}`);
          }
          
          if (new_v) {
            console.log("New vessel created in combineVessels:", new_v.name || "unnamed");
            // Note: pulse is NOT called here - may need to be added
          }
          return new_v;
        }
      }
      
      // If we don't have parent_combo information or they don't match, check if they're part of the final recipe
      // Only allow combinations if they're part of the final recipe's required combinations
      let finalRecipeComponents = final_combination.required || [];
      
      // Check if both vessels contain combinations that are part of the final recipe
      let v1ContainsFinalComponent = set1.some(name => finalRecipeComponents.includes(name));
      let v2ContainsFinalComponent = set2.some(name => finalRecipeComponents.includes(name));
      
      if (v1ContainsFinalComponent && v2ContainsFinalComponent) {
        console.log("Both vessels contain components of the final recipe");
        
        // Calculate appropriate vessel dimensions based on play area size
        const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
        const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
        
        // Create a new vessel for the combined components with relative dimensions
        let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
        // Explicitly set isAdvanced property for correct positioning
        new_v.isAdvanced = true;
        
        // Check if we have all required components for the final combination
        if (finalRecipeComponents.every(name => U.includes(name))) {
          new_v.name = final_combination.name;
          new_v.color = COLORS.green; // Use our explicit green color
          new_v.complete_combinations = []; // Clear since this is the final combination
          
          // Set the verb from the final combination and display it
          if (final_combination.verb) {
            new_v.verb = final_combination.verb;
            new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
            console.log("Setting verb for final combo:", new_v.verb);
          } else {
            // Add a fallback verb if none exists in the data
            new_v.verb = "Prepare";
            new_v.verbDisplayTime = 120;
            console.log("Using fallback verb for final combo");
          }
          
          // Add final combo to completedGreenVessels too - APlasker
          if (!completedGreenVessels.some(vessel => vessel.name === final_combination.name)) {
            completedGreenVessels.push({name: final_combination.name});
          }
          
          console.log(`Created green vessel for final combination ${final_combination.name}`);
        } else {
          console.log(`Created yellow vessel with combinations: ${U.join(', ')}`);
          console.log(`Missing combinations for ${final_combination.name}: ${finalRecipeComponents.filter(name => !U.includes(name)).join(', ')}`);
        }
        
        if (new_v) {
          console.log("New vessel created in combineVessels:", new_v.name || "unnamed");
          // Note: pulse is NOT called here - may need to be added
        }
        return new_v;
      } else {
        // If the combinations don't have the same parent and aren't both part of the final recipe,
        // don't allow them to be combined
        console.log("Invalid combination: Combinations don't share the same parent and aren't both part of the final recipe");
        return null;
      }
    }
    // Case 3: Mixing a base ingredient (white vessel) with a completed combination (green/yellow vessel)
    else if ((v1.ingredients.length > 0 && (v2.name || v2.complete_combinations.length > 0)) || 
             (v2.ingredients.length > 0 && (v1.name || v1.complete_combinations.length > 0))) {
      
      // Determine which vessel is the base ingredient and which is the combination
      let baseVessel = v1.ingredients.length > 0 ? v1 : v2;
      let comboVessel = v1.ingredients.length > 0 ? v2 : v1;
      
      // Get the base ingredient name(s)
      let baseIngredients = baseVessel.ingredients;
      
      // Get the completed combinations
      let completedCombos = comboVessel.complete_combinations.length > 0 ? 
                            comboVessel.complete_combinations : 
                            (comboVessel.name ? [comboVessel.name] : []);
      
      console.log(`Mixing base ingredients [${baseIngredients.join(', ')}] with combination [${completedCombos.join(', ')}]`);
      
      // APlasker - Easter Egg Check for mixing base ingredients with combinations
      if (typeof checkForEasterEgg === 'function' && easter_eggs && easter_eggs.length > 0) {
        // Check if combining a base ingredient with a named vessel creates an Easter egg
        if (baseIngredients.length > 0 && comboVessel.name) {
          // Create an array with the base ingredient and the combo vessel name
          const mixedArray = [...baseIngredients, comboVessel.name];
          console.log("Checking for Easter egg with mixed ingredients and vessel:", mixedArray);
          const eggMatch = checkForEasterEgg(mixedArray);
          if (eggMatch) {
            console.log("Found Easter egg match from mixed ingredients:", eggMatch.name);
            // Display the Easter egg
            displayEasterEgg(eggMatch, baseVessel, comboVessel);
            // Add to move history to track that an Easter egg was found
            moveHistory.push({type: 'easterEgg'});
            // Continue with normal combination (don't block regular gameplay)
          }
        }
      }
      
      // Check if this combination could create a recipe
      let validCombination = false;
      let targetRecipe = null;
      
      // First, check if this is a valid combination for the final recipe
      if (final_combination.required.some(req => completedCombos.includes(req))) {
        // This is a valid combination for the final recipe
        // Check if any of the base ingredients are also required for the final recipe
        if (baseIngredients.some(ing => final_combination.required.includes(ing))) {
          validCombination = true;
          targetRecipe = final_combination;
        }
      }
      
      // If not valid for the final recipe, check intermediate combinations
      if (!validCombination) {
        // Check each intermediate combination
        for (let combo of intermediate_combinations) {
          // ENHANCEMENT - APlasker - Check if the completed combination itself is directly listed 
          // as a required ingredient in the target recipe (addressing nested combinations like BBQ Chicken in Pizza Toppings)
          if (baseIngredients.every(ing => combo.required.includes(ing)) &&
              completedCombos.some(c => combo.required.includes(c))) {
            console.log(`Found direct match: ${completedCombos.join(', ')} is required in ${combo.name}`);
            validCombination = true;
            targetRecipe = combo;
            break;
          }
          
          // Original check (as fallback) - Check if all ingredients of the completed combination 
          // are part of the target recipe's required ingredients
          else if (baseIngredients.every(ing => combo.required.includes(ing)) &&
              completedCombos.some(c => {
                // Find the intermediate combination with this name
                let matchingCombo = intermediate_combinations.find(ic => ic.name === c);
                // Check if all ingredients of this combination are part of the target recipe
                let result = matchingCombo && matchingCombo.required.every(ing => combo.required.includes(ing));
                if (result) {
                  console.log(`Fallback match: All ingredients of ${c} are included in ${combo.name}`);
                }
                return result;
              })) {
            validCombination = true;
            targetRecipe = combo;
            break;
          }
        }
      }
      
      // Only proceed if this is a valid combination
      if (validCombination && targetRecipe) {
        // Create a combined set of all components
        let allComponents = [];
        
        // If we're building toward the final recipe, use the combination names
        if (targetRecipe === final_combination) {
          allComponents = [...baseIngredients, ...completedCombos];
        } else {
          // ENHANCEMENT - APlasker - Check if any completed combinations are directly listed
          // as required ingredients in the target recipe (for nested combinations like BBQ Chicken in Pizza Toppings)
          const directlyRequiredCombos = completedCombos.filter(c => targetRecipe.required.includes(c));
          
          if (directlyRequiredCombos.length > 0) {
            // If we have directly required combinations, preserve their names
            console.log(`Preserving named combinations in partial vessel: ${directlyRequiredCombos.join(', ')}`);
            allComponents = [...baseIngredients, ...directlyRequiredCombos];
          } else {
            // Original logic - For intermediate recipes, extract all ingredients
            let allIngredients = [...baseIngredients];
            
            // Add ingredients from completed combinations
            for (let combo of completedCombos) {
              let matchingCombo = intermediate_combinations.find(ic => ic.name === combo);
              if (matchingCombo) {
                allIngredients = [...allIngredients, ...matchingCombo.required];
              }
            }
            
            // Remove duplicates
            allIngredients = [...new Set(allIngredients)];
            
            // Only keep ingredients that are part of the target recipe
            allIngredients = allIngredients.filter(ing => targetRecipe.required.includes(ing));
            
            allComponents = allIngredients;
          }
        }
        
        // Create a yellow vessel for the partial combination
        let new_v;
        
        if (targetRecipe === final_combination) {
          // Calculate appropriate vessel dimensions based on play area size
          const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
          const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
          
          // For final recipe, store combination names with relative dimensions
          new_v = new Vessel([], allComponents, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
          // Explicitly set isAdvanced property for correct positioning
          new_v.isAdvanced = true;
        } else {
          // Calculate appropriate vessel dimensions based on play area size
          const vesselWidth = Math.max(playAreaWidth * 0.25, 150); // 25% of play area width, min 150px
          const vesselHeight = vesselWidth * 0.5; // Maintain aspect ratio
          
          // For intermediate recipes, store ingredients with relative dimensions
          new_v = new Vessel(allComponents, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, vesselWidth, vesselHeight);
          // Explicitly set isAdvanced property for correct positioning
          new_v.isAdvanced = true;
        }
        
        // Check if we have all required components for the target recipe
        let hasAllRequired = false;
        
        if (targetRecipe === final_combination) {
          // For final recipe, check if all required combinations are present
          hasAllRequired = targetRecipe.required.every(req => allComponents.includes(req));
        } else {
          // For intermediate recipes, check if all required ingredients are present
          hasAllRequired = targetRecipe.required.length === allComponents.length && 
                           targetRecipe.required.every(req => allComponents.includes(req));
        }
        
        if (hasAllRequired) {
          new_v.name = targetRecipe.name;
          new_v.color = COLORS.green; // Use our explicit green color
          
          if (targetRecipe === final_combination) {
            new_v.complete_combinations = []; // Clear since this is the final combination
            
            // Set the verb from the final combination and display it
            if (final_combination.verb) {
              new_v.verb = final_combination.verb;
              new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
            }
          } else {
            new_v.ingredients = []; // Clear ingredients since this is a complete intermediate combination
            
            // Set the verb from the intermediate combination and display it
            for (let combo of intermediate_combinations) {
              if (combo.name === targetRecipe.name && combo.verb) {
                new_v.verb = combo.verb;
                new_v.verbDisplayTime = 120; // Display for 120 frames (about 2 seconds)
                console.log("Setting verb for intermediate combo:", new_v.verb);
                break;
              }
            }
            
            // If no verb was found, use a fallback
            if (!new_v.verb) {
              new_v.verb = "Mix";
              new_v.verbDisplayTime = 120;
              console.log("Using fallback verb for intermediate combo");
            }
          }
          
          console.log(`Created green vessel for ${targetRecipe.name}`);
        } else {
          if (targetRecipe === final_combination) {
            console.log(`Created yellow vessel with combinations for final recipe`);
            console.log(`Missing combinations: ${targetRecipe.required.filter(req => !allComponents.includes(req)).join(', ')}`);
          } else {
            console.log(`Created yellow vessel with ingredients for ${targetRecipe.name}`);
            console.log(`Missing ingredients: ${targetRecipe.required.filter(req => !allComponents.includes(req)).join(', ')}`);
          }
        }
        
        if (new_v) {
          console.log("New vessel created in combineVessels:", new_v.name || "unnamed");
          // Note: pulse is NOT called here - may need to be added
        }
        return new_v;
      } else {
        console.log("Invalid combination of base ingredient and completed combination");
        return null;
      }
    }
    
    return null;
  }
  
  // Function to show a hint
  function showHint() {
    if (!showingHint && !gameWon) {
      // Reset inactivity reminder count when player uses hint
      inactivityReminderCount = 0;
      
      // Update last action time
      lastAction = frameCount;
      
      // Check if only the final combination remains
      if (isOnlyFinalComboRemaining()) {
        console.log("Only final combination remains, hint disabled");
        return; // Exit early
      }
      
      hintCount++; // Increment hint counter
      
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
      
      // Check all intermediate combinations that aren't completed yet
      let availableCombos = intermediate_combinations.filter(combo => 
        !allCompletedCombos.includes(combo.name));
      
      // Filter out combinations that require completed combinations as ingredients
      availableCombos = availableCombos.filter(combo => {
        // Check if any of the required ingredients are completed combinations
        return !combo.required.some(ingredient => completedCombos.includes(ingredient));
      });
      
      console.log("Available combinations after filtering out those requiring completed combos:", 
        availableCombos.map(c => c.name));
      
      // If all intermediate combinations are done, check final combination
      if (availableCombos.length === 0 && !completedCombos.includes(final_combination.name)) {
        // For the final combination, we actually want to use completed combinations
        // But only if not all required combinations are completed yet
        let finalComboRequiredCount = final_combination.required.length;
        let finalComboCompletedCount = final_combination.required.filter(req => 
          completedCombos.includes(req)).length;
        
        if (finalComboCompletedCount > 0 && finalComboCompletedCount < finalComboRequiredCount) {
          availableCombos = [final_combination];
        }
      }
      
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
        hintVessel = new HintVessel(selectedCombo);
        showingHint = true;
        
        // Set the hinted combination for counter highlighting
        hintedCombo = selectedCombo.name;
        console.log(`Set hintedCombo to: ${hintedCombo}`);
        
        console.log("Created hint vessel for:", selectedCombo.name);
        console.log("Required ingredients:", selectedCombo.required);
        console.log("Percentage of ingredients available:", possibleCombos[0].percentage * 100 + "%");
        
        // Find vessels that have ingredients needed for this hint
        let vesselsToAbsorb = [];
        
        // First pass: identify vessels with ingredients that match the hint
        for (let i = 0; i < vessels.length; i++) {
          let v = vessels[i];
          
          // ENHANCEMENT - APlasker - Check for both yellow vessels (partial combinations) 
          // AND named vessels that match a required combination
          
          // Case 1: Check if this is a yellow vessel with base ingredients needed for the hint
          if (v.color === COLORS.vesselYellow && v.ingredients.length > 0) {
            // Find which ingredients in this vessel are part of the hint
            let matchingIngredients = v.ingredients.filter(ing => 
              hintVessel.required.includes(ing) && !hintVessel.collected.includes(ing)
            );
            
            // Only consider vessels where ALL ingredients are part of the hint
            if (matchingIngredients.length > 0 && matchingIngredients.length === v.ingredients.length) {
              console.log(`Found partial combination with ${matchingIngredients.length} matching ingredients:`, matchingIngredients);
              vesselsToAbsorb.push({
                vessel: v,
                index: i,
                matchingIngredients: matchingIngredients,
                isCombo: false
              });
            }
          }
          
          // Case 2: Check if this is a vessel that represents a combination required by the hint
          if (v.name && hintVessel.comboRequired && hintVessel.comboRequired.includes(v.name) && !hintVessel.collected.includes(v.name)) {
            console.log(`Found vessel representing required combination: ${v.name}`);
            vesselsToAbsorb.push({
              vessel: v,
              index: i,
              matchingIngredients: [v.name], // The name of the combo is the "ingredient" to add
              isCombo: true
            });
          }
        }
        
        // Sort vessels by number of matching ingredients (descending)
        vesselsToAbsorb.sort((a, b) => b.matchingIngredients.length - a.matchingIngredients.length);
        
        console.log(`Found ${vesselsToAbsorb.length} vessels with matching ingredients or combinations`);
        
        // Now absorb the vessels
        let absorbedVessels = [];
        
        for (let i = 0; i < vesselsToAbsorb.length; i++) {
          let vesselInfo = vesselsToAbsorb[i];
          let v = vesselInfo.vessel;
          
          // Skip vessels that have already been absorbed
          if (absorbedVessels.includes(v)) continue;
          
          if (vesselInfo.isCombo) {
            console.log(`Absorbing vessel representing combination: ${v.name}`);
          } else {
            console.log("Absorbing partial combination with ingredients:", vesselInfo.matchingIngredients.join(', '));
          }
          
          // Add matching ingredients to the hint vessel
          let ingredientsAdded = 0;
          for (let ing of vesselInfo.matchingIngredients) {
            if (!hintVessel.collected.includes(ing)) {
              hintVessel.addIngredient(ing);
              ingredientsAdded++;
            }
          }
          
          if (ingredientsAdded > 0) {
            // Create animation from the vessel to the hint vessel
            createCombineAnimation(v.x, v.y, COLORS.vesselHint, hintVessel.x, hintVessel.y);
            
            // Add this vessel to the absorbed list
            absorbedVessels.push(v);
            
            // Mark for removal since all ingredients were absorbed
            v.markedForRemoval = true;
            
            // Increment turn counter for each absorbed ingredient
            turnCounter += ingredientsAdded;
          }
        }
        
        // Remove vessels marked for removal
        vessels = vessels.filter(v => !v.markedForRemoval);
        
        // Re-arrange vessels after potential removals
        arrangeVessels();
        
        // Check if hint is complete after absorbing vessels
        if (hintVessel && hintVessel.isComplete()) {
          // Convert hint to regular vessel
          let newVessel = hintVessel.toVessel();
          vessels.push(newVessel);
          
          // Debug log to verify flow before assigning preferred row
          console.log("SHOW HINT: About to assign preferred row to new vessel");
          
          // Assign the same row as the hint vessel was in
          assignPreferredRow(newVessel, hintVessel.y);
          
          arrangeVessels();
          
          // Explicitly create a verb animation for the completed vessel
          // Check if this is the final combination
          const isFinalCombination = vessels.length === 1 && newVessel.name === final_combination.name;
          
          if (newVessel.verb && !isFinalCombination) {
            console.log("Creating immediate verb animation for hint-completed vessel:", newVessel.verb);
            // Create verb animation starting exactly at the vessel's center
            animations.push(new VerbAnimation(newVessel.verb, newVessel.x, newVessel.y, newVessel));
            // Set verbDisplayTime to 119 to prevent duplicate animations
            newVessel.verbDisplayTime = 119;
          } else if (isFinalCombination && newVessel.verb) {
            // For final combination, use the special final verb animation
            console.log("Creating final verb animation for hint-completed final vessel:", newVessel.verb);
            createFinalVerbAnimation(newVessel.verb);
            // Set verbDisplayTime to prevent duplicate animations
            newVessel.verbDisplayTime = 119;
          }
          
          // Reset hint
          hintVessel = null;
          showingHint = false;
          
          // Clear the hinted combination reference
          hintedCombo = null;
          console.log("Cleared hintedCombo as hint is complete in checkForMatchingVessels");
        }
      } else {
        console.log("No possible combinations found with visible ingredients");
        
        // If no combinations can be made with visible ingredients, fall back to a random available combo
      if (availableCombos.length > 0) {
          let randomCombo = availableCombos[Math.floor(Math.random() * availableCombos.length)];
          hintVessel = new HintVessel(randomCombo);
        showingHint = true;
        
          console.log("Falling back to random hint for:", randomCombo.name);
        }
      }
    }
  }
  
  // Function to check if any yellow vessels match the current hint
  function checkForMatchingVessels() {
    if (!hintVessel) return;
    
    // Look for vessels that match required ingredients or combinations for the hint
    for (let i = vessels.length - 1; i >= 0; i--) {
      let v = vessels[i];
      
      // Case 1: Check for yellow vessels with base ingredients that match the hint
      if (v.color === COLORS.vesselYellow && v.ingredients.length > 0) {
        // Check if all ingredients in this vessel are required for the hint
        if (v.ingredients.every(ing => hintVessel.required.includes(ing))) {
          // Check if we can add all ingredients to the hint
          let canAddAll = true;
          for (let ing of v.ingredients) {
            if (hintVessel.collected.includes(ing)) {
              canAddAll = false;
              break;
            }
          }
          
          if (canAddAll) {
            console.log("Adding ingredients to hint: " + v.ingredients.join(', '));
            
            // Add all ingredients to the hint vessel
            for (let ing of v.ingredients) {
              hintVessel.addIngredient(ing);
            }
            
            // Create animation
            createCombineAnimation(v.x, v.y, COLORS.vesselHint, hintVessel.x, hintVessel.y);
            
            // Remove the vessel
            vessels.splice(i, 1);
            
            // Increment turn counter for each absorbed ingredient
            turnCounter += v.ingredients.length;
          }
        }
      }
      
      // Case 2: Check for vessels that represent combinations required by the hint
      else if (v.name && hintVessel.comboRequired && hintVessel.comboRequired.includes(v.name) && !hintVessel.collected.includes(v.name)) {
        console.log(`Found vessel representing required combination: ${v.name}`);
        
        // Add the combination to the hint vessel
        hintVessel.addIngredient(v.name);
        
        // Create animation
        createCombineAnimation(v.x, v.y, COLORS.vesselHint, hintVessel.x, hintVessel.y);
        
        // Remove the vessel
        vessels.splice(i, 1);
        
        // Increment turn counter
        turnCounter += 1;
      }
    }
    
    // Check if hint is complete
    if (hintVessel && hintVessel.isComplete()) {
      // Convert hint to regular vessel
      let newVessel = hintVessel.toVessel();
      vessels.push(newVessel);
      
      // Debug log to verify flow before assigning preferred row
      console.log("CHECK MATCHING: About to assign preferred row to new vessel");
      
      // Assign the same row as the hint vessel was in
      assignPreferredRow(newVessel, hintVessel.y);
      
      arrangeVessels();
      
      // Create verb animation for this vessel if it has one
      if (newVessel.verb) {
        console.log("Creating verb animation for completed hint vessel:", newVessel.verb);
        animations.push(new VerbAnimation(newVessel.verb, newVessel.x, newVessel.y, newVessel));
        
        // Set verbDisplayTime to prevent duplicate animations
        newVessel.verbDisplayTime = 119;
      }
      
      // Reset hint
      hintVessel = null;
      showingHint = false;
      
      // Clear the hinted combination reference
      hintedCombo = null;
      console.log("Cleared hintedCombo as hint is complete in checkForMatchingVessels");
    }
  }
  function isOnlyFinalComboRemaining() {
    // Case 1: Only the final dish remains
    if (vessels.length === 1 && vessels[0].name === final_combination.name) {
      return true;
    }
    
    // Case 2: All the required combinations for the final dish are present
    // Get all completed combinations
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
    
    // Combine both lists to get all completed combinations
    let allCompletedCombos = [...new Set([...completedCombos, ...partialCompletedCombos])];
    
    // Check if all required combinations for the final dish are present
    // either as standalone vessels or as part of partial combinations
    let allFinalIngredientsPresent = final_combination.required.every(req => 
      allCompletedCombos.includes(req));
    
    // Check if only the required combinations for the final dish are present
    // (plus possibly some base ingredients that can't be used)
    let onlyFinalIngredientsRemain = true;
    for (let combo of completedCombos) {
      // If this is not a required ingredient for the final dish
      if (!final_combination.required.includes(combo)) {
        // And it's not a base ingredient (it's an intermediate combination)
        if (intermediate_combinations.some(ic => ic.name === combo)) {
          onlyFinalIngredientsRemain = false;
          break;
        }
      }
    }
    
    return allFinalIngredientsPresent && onlyFinalIngredientsRemain;
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
    const vertical_margin = Math.max(playAreaHeight * 0.008, 2); // 0.8% of play area height, min 2px
    
    // Calculate basic vessel width and height using the exact same formula from arrangeVessels
    const basic_w = (playAreaWidth - (4 * margin)) / 3;
    const basic_h = basic_w * 0.8;
    
    // Calculate the row height using the same values as the actual arrangement
    const rowHeight = basic_h + vertical_margin;
    
    // Calculate the starting Y position - exactly matching arrangeVessels
    const startY = playAreaY + playAreaHeight * 0.2;
    
    // Calculate which row index the drop position corresponds to
    // Using Math.max to ensure we don't get negative values
    const relativeDropY = Math.max(0, dropY - startY);
    const dropRowIndex = Math.floor(relativeDropY / rowHeight);
    
    // Set preferred row, clamping to a reasonable range
    // We estimate the maximum number of rows based on vessel count
    const maxRows = Math.ceil(vessels.length / 3); // At most 3 basic vessels per row
    newVessel.preferredRow = Math.min(dropRowIndex, maxRows);
    
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
    let vertical_margin = playAreaHeight * 0.0001; // 0.8% of play area height (was 5px)
    
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

    // Calculate the starting Y position
    let startY = playAreaY + playAreaHeight * 0.2;
    
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
          v.y = startY + rowIndex * (basic_h + vertical_margin);
          v.originalX = v.x;
          v.originalY = v.y;
          
          // Adjust currentX to account for this vessel's placement
          currentX = v.x + v.w/2 + margin;
        } else {
          // For vessels without a specific column preference, just place them sequentially
          // Set vessel position
          v.x = currentX + v.w / 2;
          v.y = startY + rowIndex * (basic_h + vertical_margin); // Use basic_h for consistent spacing
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
    const vertical_margin = Math.max(playAreaHeight * 0.008, 2); // 0.8% of play area height, min 2px
    
    // Calculate basic vessel width and height
    const basic_w = (playAreaWidth - (4 * margin)) / 3;
    const basic_h = basic_w * 0.8;
    
    // Advanced vessels are twice as wide
    const advanced_w = basic_w * 2 + margin;
    const advanced_h = basic_h;
    
    // Calculate the starting Y position
    const startY = playAreaY + playAreaHeight * 0.2;
    
    // Calculate the row height
    const rowHeight = basic_h + vertical_margin;
    
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
      anim.progress > 0.01); // Start at 50% progress instead of 70%
    
    // Check if there are active vessel movement animations
    const hasActiveMovementAnimation = animations.some(anim => 
      anim instanceof VesselMovementAnimation && anim.active);
    
    // If we have movement animations, wait for them to complete
    if (hasActiveMovementAnimation) {
      console.log("Waiting for vessel movements to complete before proceeding");
      return;
    }
    
    // Allow proceeding with animation if verb is at midpoint or later, or no verb animations exist
    const canProceedWithAnimation = !activeVerbAnimations.length || hasVerbAtMidpoint;
    
    // State machine for the auto combination process
    switch (autoFinalCombinationState) {
      case "WAITING":
        // This is the initial state - wait for the animations to settle
        console.log("AUTO COMBINATION STATE: WAITING");
        autoFinalCombinationState = "PENULTIMATE";
        autoFinalCombinationTimer = 1; // Half second delay before starting
        break;
        
      case "PENULTIMATE":
        // Process penultimate combinations until we have only the final ingredients left
        if (!canProceedWithAnimation) {
          // Wait for verb animations to reach midpoint or complete
          return;
        }
        
        console.log("AUTO COMBINATION STATE: PENULTIMATE");
        
        // If we only have the exact vessels needed for the final combination, move to next state
        if (isFinalCombinationReady()) {
          console.log("Final combination is ready with vessels:", vessels.map(v => v.name));
          // Store the vessels for the final combination
          finalCombinationVessels = [...vessels];
          // Skip directly to the ANIMATE state (combined SHAKE+MOVE)
          autoFinalCombinationState = "ANIMATE";
          autoFinalCombinationTimer = 0; // Start animating immediately
        } else if (vessels.length >= 2) {
          // Still need to make more combinations - identify the next vessels to combine
          let v1 = vessels[0];
          let v2 = vessels[1];
          
          // Create animation to move vessels toward each other
          createCombineAnimation(v1.x, v1.y, v1.color, (v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
          createCombineAnimation(v2.x, v2.y, v2.color, (v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
          
          // Combine the vessels
          let new_v = combineVessels(v1, v2);
          
          if (new_v) {
            // ENHANCEMENT - APlasker - Mark as newly combined for position persistence
            new_v.isNewlyCombined = true;
            
            // Remove the original vessels
            vessels = vessels.filter(v => v !== v1 && v !== v2);
            
            // Add the new vessel
            vessels.push(new_v);
            
            // Arrange vessels for visual clarity
            arrangeVessels();
            
            // Use appropriate pulse animation based on vessel type
            if (new_v.color === COLORS.green || new_v.color === COLORS.vesselGreen || new_v.color === COLORS.primary) {
              console.log("Using bounce pulse for auto-combined green vessel");
              new_v.bouncePulse(); // Use new bounce pulse animation
            } else {
              // Use regular pulse for intermediate combinations
              console.log("Using regular pulse for auto-combined intermediate vessel");
              new_v.pulse(500); // Changed from 1500ms to 750ms (2x faster)
            }
            
            // Create verb animation for intermediate step
            if (new_v.verb) {
              console.log("Creating verb animation for intermediate step:", new_v.verb);
              animations.push(new VerbAnimation(new_v.verb, new_v.x, new_v.y, new_v));
              // Reset verbDisplayTime to prevent duplicate animations
              new_v.verbDisplayTime = 0;
            }
            
            // Wait for the verb animation plus a little extra time before the next step
            autoFinalCombinationTimer = 30; // 1 second at 30fps (reduced from 60)
          } else {
            // If combination failed (shouldn't happen), move to next state
            console.error("Auto combination failed during penultimate phase");
            autoFinalCombinationState = "ANIMATE";
            autoFinalCombinationTimer = 0; // Start immediately
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
        autoFinalCombinationTimer = 0; // No additional delay needed
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
            createCombineAnimation(
              autoFinalCombinationCenter.x + random(-50, 50),
              autoFinalCombinationCenter.y + random(-50, 50),
              COLORS.green,
              autoFinalCombinationCenter.x,
              autoFinalCombinationCenter.y
            );
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
  function isFinalCombinationReady() {
    // If we don't have any vessels, we're not ready
    if (vessels.length === 0) return false;
    
    // Get the required components for the final combination
    const requiredComponents = final_combination.required;
    
    // If we don't have the right number of vessels, we're not ready
    if (vessels.length !== requiredComponents.length) return false;
    
    // Check if each vessel corresponds to a required component
    const vesselNames = vessels.map(v => v.name);
    
    // For each required component, check if there's a matching vessel
    for (const component of requiredComponents) {
      if (!vesselNames.includes(component)) {
        return false;
      }
    }
    
    // If we've passed all checks, we're ready
    return true;
  }