/*
 * VesselSystem.js - Vessel Management Module
 * Extracted from sketch.js for better code organization
 * Contains: Vessel class, vessel-related helper functions
 */

// Vessel System Module - Wrapped in IIFE for safety
(function() {
  'use strict';
  
  // Make sure we have access to global variables we need
  if (typeof window === 'undefined') {
    console.error('VesselSystem: Window object not available');
    return;
  }

  // Vessel class definition - copied exactly from sketch.js
  class Vessel {
    constructor(ingredients, complete_combinations, name, color, x, y, w, h) {
      this.ingredients = ingredients;
      this.complete_combinations = complete_combinations;
      this.name = name;
      this.displayName = null; // Start with no displayed name
      
      // Map color string names to our color palette values
      if (color === 'white') {
        this.color = COLORS.vesselBase;
      } else if (color === 'yellow') {
        this.color = COLORS.vesselYellow;
      } else if (color === 'green') {
        this.color = COLORS.green;
      } else if (color === '#FF5252') {
        this.color = COLORS.vesselHint;
      } else {
        this.color = color; // Use provided color if it doesn't match any of our mappings
      }
      
      // Add an outline color property - get a random color from the COMPLETED_VESSEL_COLORS array - APlasker
      this.outlineColor = getRandomOutlineColor();
      
      this.x = x;
      this.y = y;
      this.w = w || 150; // Default width
      this.h = h || 50; // Default height
      
      // Initialize drag offset properties
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      
      // Legacy scale property - kept for backward compatibility
      this.scale = 1;
      this.targetScale = 1;
      
      // New separate scaling properties for body and text as mentioned in 20250413updates_final.txt
      this.bodyScale = 1;
      this.targetBodyScale = 1;
      this.textScale = 1;
      this.targetTextScale = 1;
      
      this.textMargin = 0.7; // Default text margin as percentage of vessel width - APlasker
      this.isAdvanced = false; // Default to basic vessel
      this.preferredRow = -1; // No preferred row by default
      this.verb = null; // Store the verb that describes this combination
      this.verbDisplayTime = 0; // Don't display verbs by default until explicitly triggered
      
      // ENHANCEMENT - APlasker - Position Persistence Properties
      this.positionStrength = 0;     // Strength of position preference (0-1)
      this.homeRow = -1;             // Established home row
      this.homeColumn = -1;          // Established home column
      this.positionHistory = 0;      // Turns spent in current position
      
      // Shake animation properties
      this.shaking = false;
      this.shakeTime = 0;
      this.shakeDuration = 15; // frames
      this.shakeAmount = 0;
      
      // Determine if this is an advanced vessel based on mapped color
      if (this.color === COLORS.vesselYellow || this.color === COLORS.green || 
          this.color === COLORS.vesselGreen || this.color === COLORS.primary ||
          this.color === COLORS.vesselHint || COMPLETED_VESSEL_COLORS.includes(this.color)) {
        this.isAdvanced = true;
      }
      
      this.isTutorial = false; // New property to identify tutorial vessels
    }
  
    getDisplayText() {
      // If displayName is set, use that (for animation control)
      if (this.displayName !== null) return this.displayName;
      // Otherwise fall back to regular name or ingredients logic
      if (this.name != null) return this.name;
      else if (this.ingredients.length > 0) return this.ingredients.join(" + ");
      else return this.complete_combinations.join(" + ");
    }
  
    isInside(x, y) {
      return x > this.x - this.w / 2 && x < this.x + this.w / 2 && y > this.y - this.h / 2 && y < this.y + this.h / 2;
    }
  
    snapBack() {
      this.x = this.originalX;
      this.y = this.originalY;
    }
    
    // Add shake method
    shake(intensity = 1) {
      this.shaking = true;
      this.shakeTime = 0;
      // Use intensity parameter to scale the shake effect
      this.shakeAmount = 5 * intensity; // Base amount scaled by intensity
      this.shakeDuration = 15 * intensity; // Base duration scaled by intensity
    }
    
    update() {
      try {
        if (this === draggedVessel) {
          // Update position to follow mouse/touch using stored offsets
          const currentX = touches.length > 0 ? touches[0].x : mouseX;
          const currentY = touches.length > 0 ? touches[0].y : mouseY;
          this.x = currentX - this.dragOffsetX;
          this.y = currentY - this.dragOffsetY;
        } else {
          // Calculate vertical margin based on vessel height and layout type
          const verticalMargin = this.h * 0.2 * getCurrentLayout().vesselMarginMultiplier;
          
          // Calculate starting Y position based on layout type
          const startY = playAreaY + (playAreaHeight * getCurrentLayout().vesselsStart);
          
          // Legacy scale animation - kept for backward compatibility
          this.scale = lerp(this.scale, this.targetScale, 0.2);
          
          // New separate scale animations for body and text
          this.bodyScale = lerp(this.bodyScale, this.targetBodyScale, 0.2);
          this.textScale = lerp(this.textScale, this.targetTextScale, 0.2);
          
          // Update text margin based on scale - APlasker
          // When vessel is being dragged or returning from being dragged,
          // ensure margin transitions smoothly
          if (this.targetTextScale === 1 && this.textMargin > 0.7) {
            // If we're returning to normal size, gradually reduce margin
            this.textMargin = lerp(this.textMargin, 0.7, 0.1);
          } else if (this.textMargin === 0.85) {
            // If margin was set to expanded (0.85) directly, maintain it during dragging
            this.textMargin = 0.85;
          } else {
            // Default transition based on text scale
            this.textMargin = map(this.textScale, 1, 1.1, 0.7, 0.85);
          }
        }
        
        // Update verb display time
        if (this.verbDisplayTime > 0) {
          this.verbDisplayTime--;
        }
        
        // Update shake animation
        if (this.shaking) {
          this.shakeTime++;
          if (this.shakeTime >= this.shakeDuration) {
            this.shaking = false;
            this.shakeTime = 0;
          }
        }
      } catch (error) {
        console.error('Error in Vessel.update():', error);
        // Reset to safe state
        this.shaking = false;
        this.shakeTime = 0;
      }
    }
    
    draw() {
      try {
        push();
        
        // Apply shake effect if shaking
        let shakeX = 0;
        let shakeY = 0;
        if (this.shaking) {
          // Calculate shake amount (decreases over time)
          this.shakeAmount = map(this.shakeTime, 0, this.shakeDuration, 5, 0);
          // Alternate direction based on frame count
          shakeX = sin(this.shakeTime * 1.5) * this.shakeAmount;
        }
        
        translate(this.x + shakeX, this.y + shakeY);
        
        // Use bodyScale for the vessel body
        scale(this.bodyScale);
        
        // Update color for base vessels to be pure white
        let vesselColor = this.color;
        if (vesselColor === COLORS.vesselBase) {
          vesselColor = 'white'; // Use pure white instead of cream for base vessels
        }
        
        // MODIFIED - Calculate stroke weights for the three-layer sandwich outline - APlasker
        // Calculate minimum dimensions based on screen height
        const thinBlackOutline = Math.max(windowHeight * 0.001, 1); // Very thin black line (0.1% of height, min 1px)
        const thickColoredOutline = Math.max(windowHeight * 0.005, 3); // Thicker colored line (0.5% of height, min 3px)
        const outerBlackOutline = Math.max(windowHeight * 0.005, 1.5); // Outer black line slightly thicker than inner (0.2% of height, min 1.5px) - APlasker
        
        // Draw vessel body with bodyScale
        if (this.isAdvanced) {
          // Advanced vessel (pot or pan based on color)
          
          if (this.color === COLORS.green || this.color === COLORS.vesselGreen || this.color === COLORS.primary) {
            // Green vessel now using two circular handles like yellow vessels - APlasker
            // Draw handles BEHIND the main shape
            fill('#888888');
            // Use the three-layer outline effect on handles - APlasker
            stroke(0); // Outer thin black line
            strokeWeight(outerBlackOutline); // Use thicker outer black line - APlasker
            
            // Position handles slightly lower and half-overlapping with the main shape
            // Move handles a bit past the edge of the pot
            const handleSize = this.h * 0.2;
            
            // First the outer thin black outlines of the handles
            circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 4);
            circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 4);
            
            // Then the colored middle layer
            stroke(this.outlineColor);
            strokeWeight(thickColoredOutline);
            circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 2);
            circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 2);
            
            // Then the inner thin black lines
            stroke(0);
            strokeWeight(thinBlackOutline);
            circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
            circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
            
          } else if (this.color === COLORS.vesselYellow || this.color === COLORS.vesselHint) {
            // Yellow or Red vessel (pot with two handles) - UNIFIED IMPLEMENTATION
            // Draw handles BEHIND the main shape
            fill('#888888');
            // Use the three-layer outline effect on handles - APlasker
            stroke(0); // Outer thin black line
            strokeWeight(outerBlackOutline); // Use thicker outer black line - APlasker
            
            // Position handles slightly lower and half-overlapping with the main shape
            // Move handles a bit past the edge of the pot
            const handleSize = this.h * 0.2;
            
            // First the outer thin black outlines of the handles
            circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 4);
            circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 4);
            
            // Then the colored middle layer
            stroke(this.outlineColor);
            strokeWeight(thickColoredOutline);
            circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 2);
            circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize + thinBlackOutline * 2);
            
            // Then the inner thin black lines
            stroke(0);
            strokeWeight(thinBlackOutline);
            circle(-this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
            circle(this.w * 0.4, -this.h * 0.15 - this.h * 0.1, handleSize);
          }
          
          // Draw vessel body with the three-layer outline - APlasker
          fill(vesselColor);
          
          // Calculate border radius to match basic vessels
          const topCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px for top corners
          const bottomCornerRadius = Math.max(this.h * 0.3, 15); // 30% of height, min 15px for bottom corners
          
          // Draw vessel body with rounded corners matching basic vessel style
          rectMode(CENTER);
          
          // First, draw the outer thin black outline
          stroke(0);
          strokeWeight(outerBlackOutline); // Use thicker outer black line - APlasker
          rect(0, -this.h * 0.1, this.w * 0.8 + thinBlackOutline * 4, this.h * 0.6 + thinBlackOutline * 4, 
               topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
          
          // Next, draw the middle thick colored outline
          stroke(this.outlineColor);
          strokeWeight(thickColoredOutline);
          rect(0, -this.h * 0.1, this.w * 0.8 + thinBlackOutline * 2, this.h * 0.6 + thinBlackOutline * 2, 
               topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
          
          // Finally, draw the inner thin black outline
          stroke(0);
          strokeWeight(thinBlackOutline);
          rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, 
               topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
          
        } else {
          // Basic ingredient vessel (rectangle with extremely rounded bottom corners)
          fill(vesselColor);
          
          // Calculate border radius relative to vessel height
          const topCornerRadius = Math.max(this.h * 0.05, 3); // 5% of height, min 3px
          const bottomCornerRadius = Math.max(this.h * 0.3, 15); // 30% of height, min 15px
          
          // Draw vessel body with the three-layer outline - APlasker
          rectMode(CENTER);
          
          // First, draw the outer thin black outline
          stroke(0);
          strokeWeight(outerBlackOutline); // Use thicker outer black line - APlasker
          rect(0, -this.h * 0.1, this.w * 0.8 + thinBlackOutline * 4, this.h * 0.6 + thinBlackOutline * 4, 
               topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
          
          // Next, draw the middle thick colored outline
          stroke(this.outlineColor);
          strokeWeight(thickColoredOutline);
          rect(0, -this.h * 0.1, this.w * 0.8 + thinBlackOutline * 2, this.h * 0.6 + thinBlackOutline * 2, 
               topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
          
          // Finally, draw the inner thin black outline
          stroke(0);
          strokeWeight(thinBlackOutline);
          rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, 
               topCornerRadius, topCornerRadius, bottomCornerRadius, bottomCornerRadius);
        }
        
        // Reset scale to apply textScale for text
        // This is done by scaling down by bodyScale and then scaling up by textScale
        scale(1/this.bodyScale * this.textScale);
        
        // Draw text inside the vessel
        fill('black');
        noStroke();
        textAlign(CENTER, CENTER);
        
        // Responsive font size based on vessel's DEFAULT size (not scaled)
        const defaultW = this.w; // Use original width, not scaled
        const defaultH = this.h;
        const textAreaW = defaultW * 0.75; // 75% of vessel width
        const maxLines = 3;
        
        // Start with a base font size
        let fontSize = Math.max(windowHeight * 0.017, 10); // Slightly smaller base size for better fit
        textSize(fontSize);
        textStyle(BOLD);
        let displayText = this.getDisplayText();

        // Use simpler line breaking logic for more consistent results
        let lines = this.splitTextSimple(displayText, textAreaW);
        
        // Limit to max lines
        if (lines.length > maxLines) {
          // If we have too many lines, try to fit text on fewer lines with smaller font
          fontSize = Math.max(fontSize * 0.85, 10);
          textSize(fontSize);
          lines = this.splitTextSimple(displayText, textAreaW);
          
          // If still too many lines, truncate
          if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            // Add ellipsis to last line if truncated - use middle ellipsis instead of end
            let lastLine = lines[maxLines - 1];
            lines[maxLines - 1] = this.fitTextWithMiddleEllipsis(lastLine, textAreaW, fontSize, 9);
          }
        }
        
        // Calculate text area height - more generous allocation
        const textAreaH = defaultH * 0.45; // 45% of vessel height for text area
        
        // Use consistent line height for better readability
        const lineHeight = fontSize * 1.0; // Tight but readable line spacing
        const totalHeight = lines.length * lineHeight;

        // Only reduce font size if absolutely necessary
        if (totalHeight > textAreaH) {
          const reductionFactor = textAreaH / totalHeight;
          fontSize = Math.max(fontSize * reductionFactor, 9); // Allow slightly smaller minimum
          textSize(fontSize);
          // Recalculate with new font size
          lines = this.splitTextSimple(displayText, textAreaW);
          if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
          }
        }

        // Vertically center the text block
        const finalLineHeight = fontSize * 1.0; // Consistent line height
        const finalTotalHeight = lines.length * finalLineHeight;
        let yOffsetStart = -defaultH * 0.1 - finalTotalHeight / 2 + finalLineHeight / 2;
        
        for (let i = 0; i < lines.length; i++) {
          let yOffset = yOffsetStart + i * finalLineHeight;
          text(lines[i], 0, yOffset);
        }
        textStyle(NORMAL);
        pop();
        
        // Display the verb above the vessel - AFTER pop() to use screen coordinates
        this.displayVerb();
      } catch (error) {
        console.error('Error in Vessel.draw():', error);
        pop(); // Ensure we restore the drawing state
      }
    }
    
    // Simple text splitting method for more consistent line breaks
    splitTextSimple(text, maxWidth) {
      try {
        let words = text.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
          let testLine = currentLine === '' ? words[i] : currentLine + ' ' + words[i];
          
          if (textWidth(testLine) <= maxWidth) {
            currentLine = testLine;
          } else {
            // If current line has content, push it and start new line
            if (currentLine !== '') {
              lines.push(currentLine);
              currentLine = words[i];
            } else {
              // Single word is too long - use it anyway but try to break it
              currentLine = words[i];
            }
          }
        }
        
        // Don't forget the last line
        if (currentLine !== '') {
          lines.push(currentLine);
        }
        
        return lines;
      } catch (error) {
        console.error('Error in splitTextSimple:', error);
        return [text]; // Return original text as single line
      }
    }
    
    // Truncate text with ellipsis in the middle if too long for a given width
    fitTextWithMiddleEllipsis(text, maxWidth, fontSize, minFontSize = 10) {
      try {
        textSize(fontSize);
        if (textWidth(text) <= maxWidth) return text;

        // Reduce font size if needed
        let currentFontSize = fontSize;
        while (textWidth(text) > maxWidth && currentFontSize > minFontSize) {
          currentFontSize -= 1;
          textSize(currentFontSize);
        }
        if (textWidth(text) <= maxWidth) return text;

        // If still too long at min font size, use ellipsis in the middle
        let left = 0;
        let right = text.length - 1;
        let result = text;
        // Always keep at least 2 chars on each side
        while (right - left > 4) {
          const leftPart = text.slice(0, Math.ceil((left + right) / 2 / 2));
          const rightPart = text.slice(text.length - Math.floor((right - left) / 2 / 2));
          result = leftPart + '...' + rightPart;
          if (textWidth(result) <= maxWidth) break;
          // Remove one more char from each side
          left++;
          right--;
        }
        return result;
      } catch (error) {
        console.error('Error in fitTextWithMiddleEllipsis:', error);
        return text; // Return original text
      }
    }
    
    pulse(duration = 150) {
      try {
        console.log(`Pulse method called for vessel: ${this.name || "unnamed"}`);
        
        // Update to use separate scaling for body and text as per 20250413updates_final.txt
        // Body scales to 120% while text only scales to 110%
        this.targetBodyScale = 1.2;
        this.targetTextScale = 1.1;
        
        // Keep legacy targetScale for backward compatibility
        this.targetScale = 1.2;
        
        // Reset all scales after duration
        setTimeout(() => { 
          this.targetBodyScale = 1;
          this.targetTextScale = 1;
          this.targetScale = 1;
        }, duration);
        
        // Log for debugging
        console.log(`Pulsing vessel ${this.name || "unnamed"} with bodyScale=${this.targetBodyScale}, textScale=${this.targetTextScale}, duration=${duration}ms`);
      } catch (error) {
        console.error('Error in Vessel.pulse():', error);
      }
    }
    
    // New method for double pulse animation - used for special completions
    doublePulse(firstDuration = 1000, secondDuration = 800, delay = 200) {
      try {
        console.log(`Double pulse animation started for vessel: ${this.name || "unnamed"}`);
        
        // First pulse uses standard scaling
        this.pulse(firstDuration);
        
        // Schedule second pulse after first one completes (plus a small delay)
        setTimeout(() => {
          // Only do second pulse if vessel still exists and isn't being dragged
          if (vessels.includes(this) && this !== draggedVessel) {
            console.log(`Second pulse for vessel: ${this.name || "unnamed"}`);
            
            // Use slightly larger scales for second pulse to make it distinct
            this.targetBodyScale = 1.25;
            this.targetTextScale = 1.15;
            this.targetScale = 1.25; // Legacy support
            
            // Reset scales after second duration
            setTimeout(() => {
              this.targetBodyScale = 1;
              this.targetTextScale = 1;
              this.targetScale = 1;
            }, secondDuration);
          } else {
            console.log(`Skipped second pulse for vessel: ${this.name || "unnamed"} - vessel no longer valid`);
          }
        }, firstDuration + delay);
      } catch (error) {
        console.error('Error in Vessel.doublePulse():', error);
      }
    }
    
    // New bounce pulse animation - creates a bouncing effect with diminishing pulses
    bouncePulse() {
      try {
        console.log(`Bounce pulse animation started for vessel: ${this.name || "unnamed"}`);
        
        // Initial bounce magnitudes and durations - 3 bounces total
        const bounces = [
          { bodyScale: 1.25, textScale: 1.15, duration: 600 },  // First bounce - largest
          { bodyScale: 1.15, textScale: 1.08, duration: 450 },  // Second bounce - medium
          { bodyScale: 1.08, textScale: 1.04, duration: 300 }   // Third bounce - small
        ];
        
        // Function to execute a single bounce with specified parameters
        const executeBounce = (index) => {
          // Skip if we've finished all bounces or vessel is no longer valid
          if (index >= bounces.length || !vessels.includes(this) || this === draggedVessel) {
            return;
          }
          
          const bounce = bounces[index];
          
          // Set target scales for this bounce
          this.targetBodyScale = bounce.bodyScale;
          this.targetTextScale = bounce.textScale;
          this.targetScale = bounce.bodyScale; // Legacy support
          
          console.log(`Bounce ${index+1} for vessel: ${this.name || "unnamed"} - magnitude: ${bounce.bodyScale.toFixed(2)}`);
          
          // Reset to normal size after duration
          setTimeout(() => {
            // Return to normal size
            this.targetBodyScale = 1;
            this.targetTextScale = 1;
            this.targetScale = 1;
            
            // Wait a brief moment before starting the next bounce
            setTimeout(() => {
              // Move to next bounce in sequence
              executeBounce(index + 1);
            }, 150); // 150ms gap between bounces
            
          }, bounce.duration);
        };
        
        // Start the bounce sequence
        executeBounce(0);
      } catch (error) {
        console.error('Error in Vessel.bouncePulse():', error);
      }
    }
    
    // Display the verb above the vessel
    displayVerb() {
      try {
        if (this.verb && this.verbDisplayTime > 0) {
          // Create a verb animation the first time
          if (this.verbDisplayTime === 120) { // If this is the first frame of the verb display
            // Debug log
            console.log("Displaying verb:", this.verb, "for vessel:", this.name);
            
            // Create a verb animation starting exactly at the vessel's center position
            animations.push(new VerbAnimation(this.verb, this.x, this.y, this));
          }
          
          // Decrement the display time
          this.verbDisplayTime--;
        }
      } catch (error) {
        console.error('Error in Vessel.displayVerb():', error);
      }
    }
  }

  // Helper function to split text into lines that fit within a width
  function splitTextIntoLines(text, maxWidth) {
    try {
      let words = text.split(' ');
      let lines = [];
      let currentLine = words[0];
      
      for (let i = 1; i < words.length; i++) {
        let testLine = currentLine + ' ' + words[i];
        let testWidth = textWidth(testLine);
        
        if (testWidth > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      
      lines.push(currentLine);
      return lines;
    } catch (error) {
      console.error('Error in splitTextIntoLines:', error);
      return [text]; // Return original text as single line
    }
  }

  // Export the Vessel class to global scope for compatibility
  if (typeof window !== 'undefined') {
    window.Vessel = Vessel;
    window.splitTextIntoLines = splitTextIntoLines;
    console.log('VesselSystem module loaded successfully');
  }

})(); 