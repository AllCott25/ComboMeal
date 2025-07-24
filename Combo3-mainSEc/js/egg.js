// Function to check if a combination matches any easter egg
  function checkForEasterEgg(ingredients) {
    if (!easter_eggs || easter_eggs.length === 0) return null;
    
    console.log("Checking for easter eggs with ingredients:", ingredients);
    
    // Check each easter egg
    for (let egg of easter_eggs) {
      // Check if all required ingredients for this easter egg are present
      // and if the number of ingredients matches exactly
      if (egg.required.length === ingredients.length && 
          egg.required.every(ing => ingredients.includes(ing))) {
        console.log("Found easter egg:", egg.name);
        return egg;
      }
    }
    
    return null;
  }
  
  // Function to display an easter egg
  function displayEasterEgg(egg, draggedVesselRef, targetVesselRef) {
    console.log("Displaying easter egg:", egg.name);
    
    // APlasker - Track Easter egg discovery in analytics
    if (typeof trackEasterEggFound === 'function') {
      trackEasterEggFound();
    }
    
    // Store references to the vessels that triggered the easter egg
    let draggedVesselCopy = null;
    let targetVesselCopy = null;
    
    if (draggedVesselRef) {
      // Store the original positions of the vessels
      draggedVesselCopy = {
        vessel: draggedVesselRef,
        originalX: draggedVesselRef.originalX || draggedVesselRef.x,
        originalY: draggedVesselRef.originalY || draggedVesselRef.y
      };
    }
    
    if (targetVesselRef) {
      targetVesselCopy = {
        vessel: targetVesselRef,
        originalX: targetVesselRef.originalX || targetVesselRef.x,
        originalY: targetVesselRef.originalY || targetVesselRef.y
      };
    }
    
    // Create a modal dialogue that stays until clicked
    let eggModal = {
      active: true,
      x: playAreaX + playAreaWidth / 2,
      y: playAreaY + playAreaHeight / 2,
      radius: min(playAreaWidth, playAreaHeight) * 0.2, // Half the previous size
      draggedVessel: draggedVesselCopy,
      targetVessel: targetVesselCopy,
      
      // Store vessel states for proper reset
      eggFound: true,
      
      // Animation properties for the splat effect
      animating: true,
      animationStartTime: millis(),
      animationDuration: 100, // 100ms for the animation (reduced from 300ms)
      
      draw: function() {
        if (!this.active) return;
        
        push();
        // Semi-transparent overlay for the entire canvas
        rectMode(CORNER);
        fill(0, 0, 0, 100);
        noStroke();
        rect(0, 0, width, height);
        
        // Calculate animation scale factor if animating
        let scaleFactor = 1.0;
        if (this.animating) {
          const elapsed = millis() - this.animationStartTime;
          const progress = min(elapsed / this.animationDuration, 1.0);
          // Start at 2.0 scale and shrink to 1.0
          scaleFactor = 2.0 - progress;
          
          // End animation when complete
          if (progress >= 1.0) {
            this.animating = false;
          }
        }
        
        // Move to center position for the entire egg (white and yolk)
        push();
        translate(this.x, this.y);
        
        // Apply scale for animation to EVERYTHING (egg white, yolk, and text)
        scale(scaleFactor);
        
        // Draw egg white with new structured design
        fill(255, 255, 255); // 100% opacity
        noStroke();
        
        // 1. Main circular base (300px circle under the yolk)
        const baseRadius = 150; // 300px diameter (increased from 200px)
        noStroke();
        fill(255, 255, 255);
        circle(0, 0, baseRadius * 2);
        
        // 2. Two 150w x 275h rectangles with 75px rounded corners that touch each other
        const rectWidth = 150;
        const rectHeight = 275;
        const cornerRadius = 75;
        
        // Left rectangle (slightly higher)
        rectMode(CENTER);
        rect(-rectWidth/2, -20, rectWidth, rectHeight, cornerRadius);
        
        // Right rectangle
        rect(rectWidth/2, 0, rectWidth, rectHeight, cornerRadius);
        
        // New rectangle in between the two existing rectangles, 50px lower and 25px to the left
        rect(-25, 50, rectWidth, rectHeight, cornerRadius);
        
        // 3. 400w x 200h rounded rectangle with 75px corners centered under the yolk
        // Moved up by 100px (from rectHeight/2 - 50 to rectHeight/2 - 150)
        const bottomRectWidth = 400;
        const bottomRectHeight = 200;
        rect(0, rectHeight/2 - 150, bottomRectWidth, bottomRectHeight, cornerRadius);
        
        // Draw yellow yolk (circular dialogue) - now inside the scale transformation
        // Add a subtle gradient to the yolk
        for (let i = 10; i >= 0; i--) {
          const yolkSize = this.radius * 2 * (1 - i * 0.03);
          const alpha = 255 - i * 10;
          fill(255, 204, 0, alpha); // Bright egg yolk yellow with gradient
          noStroke();
          circle(0, 0, yolkSize);
        }
        
        // Add highlight to the yolk
        fill(255, 255, 255, 100);
        noStroke();
        ellipse(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.7, this.radius * 0.5);
        
        // Add a thin outline to the yolk
        noFill();
        stroke(200, 150, 0, 100);
        strokeWeight(1);
        circle(0, 0, this.radius * 2);
        
        // X mark (without circle)
        stroke(0);
        strokeWeight(2);
        const xOffset = 8;
        const xPos = this.radius * 0.7;
        const yPos = -this.radius * 0.7;
        line(xPos - xOffset, yPos - xOffset, xPos + xOffset, yPos + xOffset);
        line(xPos - xOffset, yPos + xOffset, xPos + xOffset, yPos - xOffset);
        
        // "You found the egg!" text
        fill(0);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12); // Smaller text
        textStyle(NORMAL);
        text("You found the egg!", 0, -this.radius * 0.4);
        
        // Easter egg name
        textSize(20); // Smaller text
        textStyle(BOLD);
        text(egg.name, 0, 0);
        
        // "Keep going!" text
        textSize(12); // Smaller text
        textStyle(NORMAL);
        text("Keep going!", 0, this.radius * 0.4);
        
        pop(); // End of scaled drawing
        pop();
      },
      
      checkClick: function(x, y) {
        // Check if click is inside the modal or close button
        if (this.active) {
          // Clicking anywhere closes the modal
          this.active = false;
          
          // APlasker - Force immediate position reset of both vessels
          if (this.draggedVessel && this.draggedVessel.vessel) {
            // Instantly reposition the vessel to its original location
            this.draggedVessel.vessel.x = this.draggedVessel.originalX;
            this.draggedVessel.vessel.y = this.draggedVessel.originalY;
            
            // Cancel any shake or animation on the vessel
            if (typeof this.draggedVessel.vessel.shakeDuration !== 'undefined') {
              this.draggedVessel.vessel.shakeDuration = 0;
            }
          }
          
          if (this.targetVessel && this.targetVessel.vessel) {
            // Instantly reposition the vessel to its original location
            this.targetVessel.vessel.x = this.targetVessel.originalX;
            this.targetVessel.vessel.y = this.targetVessel.originalY;
            
            // Cancel any shake or animation on the vessel
            if (typeof this.targetVessel.vessel.shakeDuration !== 'undefined') {
              this.targetVessel.vessel.shakeDuration = 0;
            }
          }
          
          // APlasker - Flag to use in mouseReleased to prevent adding wrong counter
          eggFound = true;
          
          return true;
        }
        return false;
      }
    };
    
    // Add the modal to a global array
    eggModals.push(eggModal);
    
    // APlasker - Initialize eggFound global flag (if not already defined)
    if (typeof eggFound === 'undefined') {
      window.eggFound = true;
    } else {
      eggFound = true;
    }
    
    // Trigger haptic feedback
    triggerHapticFeedback('completion');
  }