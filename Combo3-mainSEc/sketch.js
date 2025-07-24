// Define intermediate combinations
let intermediate_combinations = [
    { name: "Fried Chicken Cutlet", required: ["Chicken Cutlet", "Flour", "Eggs", "Panko Bread Crumbs"] },
    { name: "Tomato Sauce", required: ["Garlic", "Red Chile Flakes", "Plum Tomatoes", "Basil"] },
    { name: "Mixed Cheeses", required: ["Parmesan", "Mozzarella"] }
  ];
  
  // Define the final combination
  let final_combination = { name: "Chicken Parm", required: ["Fried Chicken Cutlet", "Tomato Sauce", "Mixed Cheeses"] };
  
  // Extract all individual ingredients
  let ingredients = [...new Set(intermediate_combinations.flatMap(c => c.required))];
  
  // Global variables
  let vessels = [];
  let draggedVessel = null;
  let offsetX, offsetY;
  let gameWon = false;
  let turnCounter = 0;
  let moveHistory = []; // Array to store move history with colors
  let animations = []; // Array to store active animations
  let titleFont;
  let recipeUrl = "https://www.bonappetit.com/recipe/chicken-parm";
  let hintButton;
  let hintVessel = null;
  let showingHint = false;
  let gameStarted = false; // New variable to track game state
  let startButton; // New button for start screen
  let hintButtonY;
  
  // Add these variables at the top with the other global variables
  let demoIngredients = [
    { name: "Bread", x: 0, y: 0, color: 'white', combined: false },
    { name: "Grapes", x: 0, y: 0, color: 'white', combined: false },
    { name: "Peanuts", x: 0, y: 0, color: 'white', combined: false },
    { name: "Sugar", x: 0, y: 0, color: 'white', combined: false },
    { name: "Salt", x: 0, y: 0, color: 'white', combined: false }
  ];
  
  let demoSteps = [
    { ingredients: ["Peanuts", "Salt"], result: "Peanut Butter", color: 'yellow', completed: false, timer: 0 },
    { ingredients: ["Grapes", "Sugar"], result: "Jelly", color: 'yellow', completed: false, timer: 0 },
    { ingredients: ["Bread", "Jelly"], result: "Bread & Jelly", color: 'yellow', completed: false, timer: 0 },
    { ingredients: ["Peanut Butter", "Bread & Jelly"], result: "PB&J", color: 'green', completed: false, timer: 0 }
  ];
  
  let demoAnimations = [];
  let currentDemoStep = 0;
  let demoStepDelay = 90; // Faster animation between demo steps
  let demoTimer = 0;
  
  // Animation class for combining ingredients
  class CombineAnimation {
    constructor(x, y, color, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.color = color;
      this.size = 30;
      this.alpha = 255;
      this.progress = 0;
      this.duration = 30; // frames
      this.sparkles = [];
      
      // Create sparkles
      for (let i = 0; i < 15; i++) {
        this.sparkles.push({
          x: random(-20, 20),
          y: random(-20, 20),
          size: random(3, 8),
          speed: random(0.5, 2),
          angle: random(TWO_PI)
        });
      }
    }
    
    update() {
      this.progress += 1 / this.duration;
      if (this.progress >= 1) {
        return true; // Animation complete
      }
      
      // Update sparkles
      for (let sparkle of this.sparkles) {
        sparkle.x += cos(sparkle.angle) * sparkle.speed;
        sparkle.y += sin(sparkle.angle) * sparkle.speed;
        sparkle.size *= 0.95;
      }
      
      return false;
    }
    
    draw() {
      // Easing function for smooth animation
      let t = this.progress;
      let easedT = t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
      
      // Calculate current position
      let currentX = lerp(this.x, this.targetX, easedT);
      let currentY = lerp(this.y, this.targetY, easedT);
      
      // Draw main particle
      noStroke();
      fill(this.color);
      ellipse(currentX, currentY, this.size * (1 - this.progress * 0.5));
      
      // Draw sparkles
      for (let sparkle of this.sparkles) {
        fill(this.color);
        ellipse(currentX + sparkle.x, currentY + sparkle.y, sparkle.size);
      }
    }
  }
  
  // Button class for UI elements
  class Button {
    constructor(x, y, w, h, label, action, color = '#4285F4', textColor = 'white') {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.label = label;
      this.action = action;
      this.color = color;
      this.textColor = textColor;
      this.hovered = false;
    }
    
    draw() {
      // Draw button
      rectMode(CENTER);
      if (this.hovered) {
        fill(lerpColor(color(this.color), color(255), 0.2));
      } else {
        fill(this.color);
      }
      stroke(0, 50);
      strokeWeight(3); // Increased line width for cartoony look
      rect(this.x, this.y, this.w, this.h, 8);
      
      // Draw label
      fill(this.textColor);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text(this.label, this.x, this.y);
    }
    
    isInside(x, y) {
      return x > this.x - this.w/2 && x < this.x + this.w/2 && 
             y > this.y - this.h/2 && y < this.y + this.h/2;
    }
    
    checkHover(x, y) {
      this.hovered = this.isInside(x, y);
    }
    
    handleClick() {
      if (this.hovered) {
        this.action();
        return true;
      }
      return false;
    }
  }
  
  // Hint Vessel class - extends Vessel with hint-specific functionality
  class HintVessel {
    constructor(combo) {
      this.combo = combo;
      this.name = combo.name;
      this.required = [...combo.required];
      this.collected = [];
      this.x = width / 2;
      this.y = hintButtonY; // Use the fixed Y position
      this.w = 200;
      this.h = 100;
      this.color = '#FF5252'; // Red color
      this.scale = 1;
      this.targetScale = 1;
    }
    
    update() {
      // Scale animation
      this.scale = lerp(this.scale, this.targetScale, 0.2);
    }
    
    draw() {
      push();
      translate(this.x, this.y);
      scale(this.scale);
      
      // Draw pot handles (small circles) BEHIND the main shape
      fill('#888888');
      stroke('black');
      strokeWeight(3);
      // Position handles slightly lower and half-overlapping with the main shape
      // Move handles a bit past the edge of the pot
      circle(-this.w * 0.4, -this.h * 0.15, this.h * 0.2);
      circle(this.w * 0.4, -this.h * 0.15, this.h * 0.2);
      
      // Draw vessel (pot body)
      fill(this.color);
      stroke('black');
      strokeWeight(3);
      
      // Draw pot body (3:2 rectangle with rounded corners ONLY at the bottom)
      rectMode(CENTER);
      rect(0, 0, this.w * 0.8, this.h * 0.6, 0, 0, 10, 10);
      
      // Draw combo name
      fill('white');
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text(this.name, 0, -this.h * 0.1);
      
      // Draw progress indicator
      textSize(16);
      text(`${this.collected.length}/${this.required.length}`, 0, this.h * 0.1);
      
      pop();
    }
    
    isInside(x, y) {
      return x > this.x - this.w / 2 && x < this.x + this.w / 2 && 
             y > this.y - this.h / 2 && y < this.y + this.h / 2;
    }
    
    addIngredient(ingredient) {
      if (this.required.includes(ingredient) && !this.collected.includes(ingredient)) {
        this.collected.push(ingredient);
        this.pulse();
        return true;
      }
      return false;
    }
    
    isComplete() {
      return this.collected.length === this.required.length && 
             this.required.every(ing => this.collected.includes(ing));
    }
    
    pulse() {
      this.targetScale = 1.2;
      setTimeout(() => { this.targetScale = 1; }, 300);
    }
    
    // Convert to a regular vessel when complete but keep it red
    toVessel() {
      let v = new Vessel([], [], this.name, '#FF5252', this.x, this.y, 200, 100);
      v.isAdvanced = true; // Mark as advanced for proper rendering
      v.pulse();
      return v;
    }
  }
  
  class Vessel {
    constructor(ingredients, complete_combinations, name, color, x, y, w, h) {
      this.ingredients = ingredients;
      this.complete_combinations = complete_combinations;
      this.name = name;
      this.color = color;
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.originalX = x;
      this.originalY = y;
      this.isAdvanced = color !== 'white'; // Yellow or green vessels are advanced
      this.scale = 1; // For animation
      this.targetScale = 1;
    }
  
    getDisplayText() {
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
    
    update() {
      // Scale animation only (removed floating animation)
      this.scale = lerp(this.scale, this.targetScale, 0.35);
    }
    
    draw() {
      push();
      translate(this.x, this.y);
      scale(this.scale);
      
      if (this.isAdvanced) {
        // Advanced vessel (pot or pan based on color)
        
        if (this.color === '#FF5252') {
          // Red vessel (pot with two handles)
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(3);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          circle(-this.w * 0.4, -this.h * 0.15, this.h * 0.2);
          circle(this.w * 0.4, -this.h * 0.15, this.h * 0.2);
        } else if (this.color === 'green') {
          // Green vessel (pan with long handle)
          // Draw handle BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(3);
          rectMode(CENTER);
          // Draw handle as thin horizontal rectangle
          rect(this.w * 0.6, 0, this.w * 0.5, this.h * 0.15, 5);
        } else if (this.color === 'yellow') {
          // Yellow vessel (pot with two handles like the red vessel)
          // Draw handles BEHIND the main shape
          fill('#888888');
          stroke('black');
          strokeWeight(3);
          // Position handles slightly lower and half-overlapping with the main shape
          // Move handles a bit past the edge of the pot
          circle(-this.w * 0.4, -this.h * 0.15, this.h * 0.2);
          circle(this.w * 0.4, -this.h * 0.15, this.h * 0.2);
        }
        
        // Draw vessel body
        fill(this.color);
        stroke('black');
        strokeWeight(3);
        
        // Draw vessel body (3:2 rectangle with rounded corners ONLY at the bottom)
        rectMode(CENTER);
        rect(0, 0, this.w * 0.8, this.h * 0.6, 0, 0, 10, 10);
        
      } else {
        // Basic ingredient vessel (rectangle with extremely rounded bottom corners)
        fill(this.color);
        stroke('black');
        strokeWeight(3);
        
        // Draw rounded rectangle
        rectMode(CENTER);
        rect(0, -this.h * 0.1, this.w * 0.8, this.h * 0.6, 5, 5, 30, 30);
      }
      
      // Draw text inside the vessel
      fill('black');
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      
      // Calculate text position to be inside the vessel
      let displayText = this.getDisplayText();
      let lines = splitTextIntoLines(displayText, this.w * 0.7);
      
      for (let i = 0; i < lines.length; i++) {
        let yOffset = (i - (lines.length - 1) / 2) * 15;
        // Position text slightly higher in the vessel
        text(lines[i], 0, yOffset - this.h * 0.1);
      }
      
      pop();
    }
    
    pulse() {
      this.targetScale = 1.2;
      setTimeout(() => { this.targetScale = 1; }, 300);
    }
  }
  
  // Helper function to split text into lines that fit within a width
  function splitTextIntoLines(text, maxWidth) {
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
  }
  
  function preload() {
    // Load fonts or other assets
    titleFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Bold.otf');
  }
  
  function setup() {
    // Note: createCanvas is called in initializePage()
    console.log("Setup function called");
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
  
  function draw() {
    background(245, 242, 235); // Cream background
    
    // Draw title
    drawTitle();
    
    if (!gameStarted) {
      // Draw start screen with animated demo
      drawStartScreen();
      updateDemo();
    } else if (gameWon) {
      // Draw win screen
      drawWinScreen();
    } else {
      // Draw game screen
      // Update all vessels
      vessels.forEach(v => {
        v.update();
      });
      
      // Sort vessels by type to ensure advanced vessels are drawn first (behind basic vessels)
      let sortedVessels = [...vessels].sort((a, b) => {
        if (a.isAdvanced && !b.isAdvanced) return -1;
        if (!a.isAdvanced && b.isAdvanced) return 1;
        return 0;
      });
      
      // Draw all vessels in sorted order
      sortedVessels.forEach(v => {
        v.draw();
      });
      
      // Draw hint button or hint vessel
      if (showingHint && hintVessel) {
        hintVessel.update();
        hintVessel.draw();
      } else {
        hintButton.draw();
      }
      
      // Draw animations
      for (let i = animations.length - 1; i >= 0; i--) {
        animations[i].draw();
        if (animations[i].update()) {
          animations.splice(i, 1);
        }
      }
      
      // Draw turn counter
      textAlign(LEFT, BOTTOM);
      textSize(16);
      fill('#333');
      text("Turns: " + turnCounter, 20, height - 20);
      
      // Draw move history
      drawMoveHistory();
    }
    
    // Update cursor if hovering over a vessel or button
    updateCursor();
  }
  
  function drawTitle() {
    // Draw game title
    textAlign(CENTER, CENTER);
    fill('#333');
    textSize(40);
    textFont(titleFont);
    text("COMBO MEAL", width/2, 60);
    
    // Draw byline
    textSize(18);
    textFont('Arial');
    fill('#666');
    text("Combine the ingredients to discover the dish!", width/2, 100);
  }
  
  function drawStartScreen() {
    // Draw demo ingredients and combinations
    drawDemoIngredients();
    
    // Draw demo animations
    for (let i = demoAnimations.length - 1; i >= 0; i--) {
      demoAnimations[i].draw();
      if (demoAnimations[i].update()) {
        demoAnimations.splice(i, 1);
      }
    }
    
    // Draw instructions
    textAlign(CENTER);
    textSize(18);
    fill('#333');
    text("Combine ingredients into culinary combos to discover the dish", width/2, height * 0.55);
    text("in the fewest turns. New recipe daily!", width/2, height * 0.55 + 30);
    
    // Draw start button
    startButton.draw();
    startButton.checkHover(mouseX, mouseY);
  }
  
  function arrangeDemoIngredients() {
    // Position the demo ingredients in a more compact layout
    const centerY = height * 0.35;
    const topRowY = centerY - 50;
    const bottomRowY = centerY;
    
    // First row: 3 ingredients
    demoIngredients[0].x = width * 0.25; // Bread
    demoIngredients[0].y = topRowY;
    
    demoIngredients[1].x = width * 0.5; // Grapes
    demoIngredients[1].y = topRowY;
    
    demoIngredients[2].x = width * 0.75; // Peanuts
    demoIngredients[2].y = topRowY;
    
    // Second row: 2 ingredients
    demoIngredients[3].x = width * 0.35; // Sugar
    demoIngredients[3].y = bottomRowY;
    
    demoIngredients[4].x = width * 0.65; // Salt
    demoIngredients[4].y = bottomRowY;
    
    // Position for intermediate results - keep everything more compact
    demoSteps[0].x = width * 0.75; // Peanut Butter (stays on right)
    demoSteps[0].y = centerY + 50;
    
    demoSteps[1].x = width * 0.4; // Jelly (stays on left)
    demoSteps[1].y = centerY + 50;
    
    demoSteps[2].x = width * 0.4; // Bread & Jelly (replaces Jelly position)
    demoSteps[2].y = centerY + 50;
    
    demoSteps[3].x = width * 0.5; // Final PB&J (centered)
    demoSteps[3].y = centerY + 80;
  }
  
  function drawDemoIngredients() {
    // Draw each demo ingredient
    for (let ing of demoIngredients) {
      if (!ing.combined) {
        drawDemoVessel(ing.x, ing.y, ing.name, ing.color, false);
      }
    }
    
    // Draw completed combinations
    for (let step of demoSteps) {
      if (step.completed) {
        drawDemoVessel(step.x, step.y, step.result, step.color, true);
      }
    }
  }
  
  function drawDemoVessel(x, y, name, vesselColor, isAdvanced) {
    push();
    translate(x, y);
    
    if (!isAdvanced) {
      // Basic ingredient vessel
      fill(vesselColor);
        stroke('black');
      strokeWeight(3);
      
      // Draw rounded rectangle
      rectMode(CENTER);
      rect(0, -10, 80, 50, 5, 5, 30, 30);
      
      // Draw text
        fill('black');
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12);
      text(name, 0, -10);
    } else {
      // Advanced vessel
      if (vesselColor === 'green') {
        // Green vessel (pan with long handle)
        fill('#888888');
        stroke('black');
        strokeWeight(3);
        rectMode(CENTER);
        rect(80, 0, 80, 15, 5);
        
        // Draw vessel body - make it larger for the final result
        fill(vesselColor);
        stroke('black');
        strokeWeight(3);
        
        // Draw rectangle with rounded corners ONLY at the bottom
        rectMode(CENTER);
        rect(0, 0, 140, 70, 0, 0, 10, 10);
      } else {
        // Yellow vessel (pot with two handles)
        fill('#888888');
        stroke('black');
        strokeWeight(3);
        circle(-60, -5, 20);
        circle(60, -5, 20);
        
        // Draw vessel body
        fill(vesselColor);
        stroke('black');
        strokeWeight(3);
        
        // Draw rectangle with rounded corners ONLY at the bottom
        rectMode(CENTER);
        rect(0, 0, 120, 60, 0, 0, 10, 10);
      }
      
      // Draw text
      fill('black');
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(14);
      text(name, 0, -10);
    }
    
    pop();
  }
  
  function updateDemo() {
    demoTimer++;
    
    // Process the current demo step
    if (currentDemoStep < demoSteps.length) {
      let step = demoSteps[currentDemoStep];
      
      if (!step.completed) {
        step.timer++;
        
        // When it's time to perform this step
        if (step.timer >= demoStepDelay) {
          // Special handling for the Bread & Jelly step
          if (step.result === "Bread & Jelly") {
            // Find Bread and animate it moving to Jelly
            let bread = demoIngredients.find(i => i.name === "Bread");
            let jellyStep = demoSteps.find(s => s.result === "Jelly");
            
            if (bread && !bread.combined && jellyStep && jellyStep.completed) {
              bread.combined = true;
              
              // Create animation from Bread to Jelly position
              createDemoAnimation(bread.x, bread.y, bread.color, jellyStep.x, jellyStep.y);
              
              // Mark this step as completed
              step.completed = true;
              
              // Move to the next step
              currentDemoStep++;
            }
          }
          // Special handling for the final PB&J step
          else if (step.result === "PB&J") {
            // Find Peanut Butter and animate it moving to Bread & Jelly
            let pbStep = demoSteps.find(s => s.result === "Peanut Butter");
            let bjStep = demoSteps.find(s => s.result === "Bread & Jelly");
            
            if (pbStep && pbStep.completed && bjStep && bjStep.completed) {
              // Create animation from Peanut Butter to Bread & Jelly position
              createDemoAnimation(pbStep.x, pbStep.y, pbStep.color, bjStep.x, bjStep.y);
              
              // Mark this step as completed
              step.completed = true;
              
              // Move to the next step
              currentDemoStep++;
              
              // If we've completed all steps, reset the demo after a delay
              if (currentDemoStep >= demoSteps.length) {
                setTimeout(resetDemo, 3000);
              }
            }
          }
          // Normal handling for other steps
          else {
            // Mark the ingredients as combined
            for (let ingName of step.ingredients) {
              // Check if it's a basic ingredient
              let basicIng = demoIngredients.find(i => i.name === ingName && !i.combined);
              if (basicIng) {
                basicIng.combined = true;
                
                // Create animation from this ingredient to the result position
                createDemoAnimation(basicIng.x, basicIng.y, basicIng.color, step.x, step.y);
              }
            }
            
            // Mark this step as completed
            step.completed = true;
            
            // Move to the next step
            currentDemoStep++;
          }
        }
      }
    }
  }
  
  function createDemoAnimation(startX, startY, color, targetX, targetY) {
    for (let i = 0; i < 5; i++) {
      demoAnimations.push(new CombineAnimation(startX, startY, color, targetX, targetY));
    }
  }
  
  function resetDemo() {
    // Reset all demo ingredients and steps
    for (let ing of demoIngredients) {
      ing.combined = false;
    }
    
    for (let step of demoSteps) {
      step.completed = false;
      step.timer = 0;
    }
    
    currentDemoStep = 0;
    demoTimer = 0;
    
    // Clear any remaining animations
    demoAnimations = [];
  }
  
  function drawWinScreen() {
    // Draw win message
    textAlign(CENTER, CENTER);
    textSize(40);
    textFont(titleFont);
    fill('#333');
    text("YOU MADE IT!", width/2, height/2 - 120);
    
    // Draw recipe name
    textSize(32);
    fill('#4CAF50');
    text(final_combination.name, width/2, height/2 - 60);
    
    // Draw turn count with larger, more prominent display
    textSize(28);
    fill('#666');
    text("Completed in", width/2, height/2);
    
    // Draw turn counter in a circle
    let turnCircleSize = 80;
    fill('#4285F4');
    stroke('#333');
    strokeWeight(3);
    circle(width/2, height/2 + 60, turnCircleSize);
    
    // Draw turn number
    fill('white');
    noStroke();
    textSize(36);
    text(turnCounter, width/2, height/2 + 60);
    textSize(18);
    text("turns", width/2, height/2 + 90);
    
    // Draw move history with larger circles
    drawWinMoveHistory();
    
    // Draw buttons
    shareButton.draw();
    recipeButton.draw();
    
    // Check button hover
    shareButton.checkHover(mouseX, mouseY);
    recipeButton.checkHover(mouseX, mouseY);
  }
  
  // Enhanced move history display for win screen
  function drawWinMoveHistory() {
    const circleSize = 25;
    const margin = 8;
    const maxPerRow = 15;
    const startX = width/2 - (Math.min(moveHistory.length, maxPerRow) * (circleSize + margin) - margin) / 2;
    const startY = height/2 + 140;
    
    for (let i = 0; i < moveHistory.length; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const x = startX + col * (circleSize + margin);
      const y = startY + row * (circleSize + margin);
      
      fill(moveHistory[i]);
      stroke('black');
      strokeWeight(2);
      circle(x, y, circleSize);
    }
  }
  
  // Keep the regular move history for during gameplay
  function drawMoveHistory() {
    const circleSize = 15;
    const margin = 5;
    const startX = 90;
    const startY = height - 20;
    
    for (let i = 0; i < moveHistory.length; i++) {
      fill(moveHistory[i]);
      stroke('black');
      strokeWeight(1);
      circle(startX + i * (circleSize + margin), startY - circleSize/2, circleSize);
    }
  }
  
  function updateCursor() {
    let overInteractive = false;
    
    if (!gameStarted) {
      // Check start button
      if (startButton.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
    } else if (gameWon) {
      // Check buttons
      if (shareButton.isInside(mouseX, mouseY) || recipeButton.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
    } else {
      // Check vessels
      for (let v of vessels) {
        if (v.isInside(mouseX, mouseY)) {
          overInteractive = true;
          break;
        }
      }
      
      // Check hint vessel
      if (showingHint && hintVessel && hintVessel.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
      
      // Check buttons
      if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
        overInteractive = true;
      }
    }
    
    // Set cursor
    cursor(overInteractive ? HAND : ARROW);
  }
  
  function mousePressed() {
    if (!gameStarted) {
      // Check if start button was clicked
      if (startButton.isInside(mouseX, mouseY)) {
        startButton.handleClick();
        return;
      }
    } else if (gameWon) {
      // Check if buttons were clicked
      if (shareButton.handleClick() || recipeButton.handleClick()) {
        return;
      }
    } else {
      // Check if hint button was clicked
      if (!showingHint && hintButton.isInside(mouseX, mouseY)) {
        hintButton.handleClick();
        return;
      }
      
      // Check if a vessel was clicked
      for (let v of vessels) {
        if (v.isInside(mouseX, mouseY)) {
          draggedVessel = v;
          offsetX = mouseX - v.x;
          offsetY = mouseY - v.y;
          v.targetScale = 1.1; // Slight scale up when dragging
          triggerHapticFeedback('success'); // Haptic feedback on successful drag
          break;
        }
      }
    }
  }
  
  function mouseDragged() {
    if (draggedVessel) {
      draggedVessel.x = mouseX - offsetX;
      draggedVessel.y = mouseY - offsetY;
    }
  }
  
  function mouseReleased() {
    if (draggedVessel) {
      draggedVessel.targetScale = 1; // Reset scale
      
      let overVessel = null;
      let overHintVessel = false;
      
      // Check if dragged over another vessel
      for (let v of vessels) {
        if (v !== draggedVessel && v.isInside(mouseX, mouseY)) {
          overVessel = v;
          break;
        }
      }
      
      // Check if dragged over hint vessel
      if (showingHint && hintVessel && hintVessel.isInside(mouseX, mouseY)) {
        overHintVessel = true;
      }
      
      if (overVessel) {
        // Regular vessel combination
        // Increment turn counter
        turnCounter++;
        
        let new_v = combineVessels(draggedVessel, overVessel);
        if (new_v) {
          // Create animation particles
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, new_v.x, new_v.y);
          createCombineAnimation(overVessel.x, overVessel.y, overVessel.color, new_v.x, new_v.y);
          
          // Remove old vessels and add new one
          vessels = vessels.filter(v => v !== draggedVessel && v !== overVessel);
          vessels.push(new_v);
          arrangeVessels(); // Re-center after combination
          
          // Pulse the new vessel
          new_v.pulse();
          
          // Store the current move history length to detect if checkForMatchingVessels adds moves
          let originalMoveHistoryLength = moveHistory.length;
          
          // Check if the new vessel matches the current hint
          if (showingHint && hintVessel) {
            // Check if this vessel matches the hint
            checkForMatchingVessels();
          }
          
          // Only add to move history if it wasn't already added by checkForMatchingVessels
          if (moveHistory.length === originalMoveHistoryLength) {
            // Add successful move to history with the color of the new vessel
            moveHistory.push(new_v.color);
          }
          
          if (vessels.length === 1 && vessels[0].name === final_combination.name) {
            gameWon = true;
            triggerHapticFeedback('completion'); // Haptic feedback on game completion
          }
        } else {
          draggedVessel.snapBack();
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
        }
      } else if (overHintVessel) {
        // Trying to add to the hint vessel
        turnCounter++;
        
        let canAddToHint = false;
        
        // Check if it's a single ingredient
        if (draggedVessel.ingredients.length === 1) {
          let ingredientName = draggedVessel.ingredients[0];
          canAddToHint = hintVessel.addIngredient(ingredientName);
        } 
        // Check if it's a partial combination that matches one of the required ingredients
        else if (draggedVessel.name && hintVessel.required.includes(draggedVessel.name)) {
          canAddToHint = hintVessel.addIngredient(draggedVessel.name);
        }
        // Check if it's a yellow vessel with multiple ingredients that are all part of the hint
        else if (draggedVessel.ingredients.length > 0 && draggedVessel.ingredients.every(ing => hintVessel.required.includes(ing))) {
          // Check if we can add all ingredients to the hint
          canAddToHint = true;
          for (let ing of draggedVessel.ingredients) {
            if (hintVessel.collected.includes(ing)) {
              canAddToHint = false;
              break;
            }
          }
          
          // If we can add all ingredients, do so
          if (canAddToHint) {
            for (let ing of draggedVessel.ingredients) {
              hintVessel.addIngredient(ing);
            }
          }
        }
        
        if (canAddToHint) {
          // Create animation
          createCombineAnimation(draggedVessel.x, draggedVessel.y, draggedVessel.color, hintVessel.x, hintVessel.y);
          
          // Remove the vessel
          vessels = vessels.filter(v => v !== draggedVessel);
          arrangeVessels();
          
          // Add red move to history (not the original vessel color)
          moveHistory.push('#FF5252');
          
          // Check if hint is complete
          if (hintVessel.isComplete()) {
            // Convert hint to regular vessel
            let newVessel = hintVessel.toVessel();
            vessels.push(newVessel);
            arrangeVessels();
            
            // Reset hint
            hintVessel = null;
            showingHint = false;
            
            // Check win condition
            if (vessels.length === 1 && vessels[0].name === final_combination.name) {
              gameWon = true;
              triggerHapticFeedback('completion'); // Haptic feedback on game completion
            }
          }
        } else {
          draggedVessel.snapBack();
          // Add unsuccessful move to history (black)
          moveHistory.push('black');
          triggerHapticFeedback('error'); // Haptic feedback on unsuccessful move
        }
      } else {
        draggedVessel.snapBack();
      }
      
      draggedVessel = null;
    }
  }
  
  function createCombineAnimation(startX, startY, color, targetX, targetY) {
    for (let i = 0; i < 5; i++) {
      animations.push(new CombineAnimation(startX, startY, color, targetX, targetY));
    }
  }
  
  function combineVessels(v1, v2) {
    // Check if hint is active before creating any new vessels
    let hintActive = showingHint && hintVessel;
    
    if (v1.ingredients.length > 0 && v2.ingredients.length > 0 && v1.complete_combinations.length === 0 && v2.complete_combinations.length === 0) {
      // DUPLICATE INGREDIENT FIX: Check if vessels represent the same ingredient instance
      // If both vessels have the same ingredient name, they shouldn't combine
      if (v1.ingredients[0] === v2.ingredients[0]) {
        console.log("Cannot combine two vessels with the same ingredient:", v1.ingredients[0]);
        // Check if there's an easter egg that specifically requires two of this ingredient
        if (typeof checkForEasterEgg === 'function' && easter_eggs && easter_eggs.length > 0) {
          const eggMatch = checkForEasterEgg([v1.ingredients[0], v2.ingredients[0]]);
          if (eggMatch) {
            console.log("Found Easter egg that allows same-ingredient combination:", eggMatch.name);
            // Allow the combination for easter eggs, but still return null to trigger easter egg display
            displayEasterEgg(eggMatch, v1, v2);
            moveHistory.push({type: 'easterEgg'});
            return null; // Still return null to prevent vessel creation
          }
        }
        return null; // Prevent same-ingredient combinations
      }
      
      let U = [...new Set([...v1.ingredients, ...v2.ingredients])];
      let C_candidates = intermediate_combinations.filter(C => U.every(ing => C.required.includes(ing)));
      
      if (C_candidates.length > 0) {
        let C = C_candidates[0];
        
        // If hint is active, check if these ingredients are part of the hint
        if (hintActive) {
          // Check if all ingredients are required for the hint
          let allIngredientsInHint = U.every(ing => hintVessel.required.includes(ing));
          
          // Check if any of these ingredients are already collected in the hint
          let anyAlreadyCollected = U.some(ing => hintVessel.collected.includes(ing));
          
          // If all ingredients are part of the hint and none are already collected,
          // we should add them to the hint vessel instead of creating a new vessel
          if (allIngredientsInHint && !anyAlreadyCollected) {
            // We'll handle this in mouseReleased by returning a yellow vessel
            // that will be detected by checkForMatchingVessels
            let new_v = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
            return new_v;
          }
        }
        
        // Create a new vessel (yellow or green)
        let new_v = new Vessel(U, [], null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        if (U.length === C.required.length && C.required.every(ing => U.includes(ing))) {
          // Only turn green if not part of an active hint
          if (!hintActive || !C.name === hintVessel.name) {
          new_v.name = C.name;
          new_v.color = 'green';
            new_v.ingredients = []; // Clear ingredients since this is now a complete combination
          }
        }
        return new_v;
      }
    } else if ((v1.name || v1.complete_combinations.length > 0) && (v2.name || v2.complete_combinations.length > 0)) {
      // Handle combining completed combinations (green vessels)
      let set1 = v1.complete_combinations.length > 0 ? v1.complete_combinations : (v1.name ? [v1.name] : []);
      let set2 = v2.complete_combinations.length > 0 ? v2.complete_combinations : (v2.name ? [v2.name] : []);
      let U = [...new Set([...set1, ...set2])];
      
      // Check if the combined set contains valid components for the final combination
      if (U.some(name => final_combination.required.includes(name))) {
        let new_v = new Vessel([], U, null, 'yellow', (v1.x + v2.x) / 2, (v1.y + v2.y) / 2, 200, 100);
        
        // Check if we have all required components for the final combination
        if (final_combination.required.every(name => U.includes(name))) {
          new_v.name = final_combination.name;
          new_v.color = 'green';
          new_v.complete_combinations = []; // Clear since this is the final combination
        }
        return new_v;
      }
    }
    return null;
  }
  
  function shareScore() {
    // Create share text
    let shareText = `I made ${final_combination.name} in ${turnCounter} turns in Combo Meal! Can you beat my score?`;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Combo Meal Score',
        text: shareText,
        url: window.location.href
      })
      .catch(error => console.log('Error sharing:', error));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
        .then(() => {
          alert('Score copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert(shareText);
        });
    }
  }
  
  function viewRecipe() {
    window.open(recipeUrl, '_blank');
  }
  
  function mouseMoved() {
    // Update button hover states
    if (!gameStarted) {
      startButton.checkHover(mouseX, mouseY);
    } else if (gameWon) {
      shareButton.checkHover(mouseX, mouseY);
      recipeButton.checkHover(mouseX, mouseY);
    } else if (!showingHint) {
      hintButton.checkHover(mouseX, mouseY);
    }
  }
  
  // Function to show a hint
  function showHint() {
    if (!showingHint && !gameWon) {
      // Find combinations that haven't been completed yet
      let completedCombos = vessels
        .filter(v => v.name !== null)
        .map(v => v.name);
      
      // Find partial combinations that exist in vessels
      let partialCombos = [];
      for (let v of vessels) {
        if (v.ingredients.length > 0 && v.name === null) {
          // This is a partial combination (yellow vessel without a name)
          for (let combo of intermediate_combinations) {
            // Check if this partial combination is working toward a specific combo
            if (v.ingredients.every(ing => combo.required.includes(ing))) {
              partialCombos.push(combo.name);
            }
          }
        }
      }
      
      // First check intermediate combinations that aren't partial or completed
      let availableCombos = intermediate_combinations.filter(combo => 
        !completedCombos.includes(combo.name) && !partialCombos.includes(combo.name));
      
      // If no non-partial combos are available, then allow partial combos
      if (availableCombos.length === 0) {
        availableCombos = intermediate_combinations.filter(combo => 
          !completedCombos.includes(combo.name));
      }
      
      // If all intermediate combinations are done, check final combination
      if (availableCombos.length === 0 && !completedCombos.includes(final_combination.name)) {
        availableCombos = [final_combination];
      }
      
      // If there are available combinations, show a hint
      if (availableCombos.length > 0) {
        // Choose a random combination to hint
        let combo = availableCombos[Math.floor(Math.random() * availableCombos.length)];
        hintVessel = new HintVessel(combo);
        showingHint = true;
        
        // Check if any existing yellow vessels match ingredients needed for this hint
        checkForMatchingVessels();
      }
    }
  }
  
  // Function to check if any yellow vessels match the current hint
  function checkForMatchingVessels() {
    if (!hintVessel) return;
    
    // Look for yellow vessels that match required ingredients for the hint
    for (let i = vessels.length - 1; i >= 0; i--) {
      let v = vessels[i];
      
      // Check if it's a yellow vessel with ingredients that match the hint
      if (v.color === 'yellow' && v.ingredients.length > 0) {
        let matchesHint = false;
        
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
            matchesHint = true;
            
            // Add all ingredients to the hint vessel
            for (let ing of v.ingredients) {
              hintVessel.addIngredient(ing);
            }
            
            // Create animation
            createCombineAnimation(v.x, v.y, v.color, hintVessel.x, hintVessel.y);
            
            // Remove the vessel
            vessels.splice(i, 1);
            
            // Add red moves to history - one for each ingredient (or at least two if it was a combination)
            // This ensures we count the proper number of turns when adding multiple ingredients at once
            let numIngredientsAdded = Math.max(2, v.ingredients.length);
            for (let j = 0; j < numIngredientsAdded; j++) {
              moveHistory.push('#FF5252');
            }
            
            // Increment turn counter - add one more turn since the first turn was already counted
            // when the vessel was created in mouseReleased
            turnCounter += (numIngredientsAdded - 1);
          }
        }
      }
    }
    
    // Re-arrange vessels after potential removals
    arrangeVessels();
    
    // Check if hint is complete
    if (hintVessel && hintVessel.isComplete()) {
      // Convert hint to regular vessel
      let newVessel = hintVessel.toVessel();
      vessels.push(newVessel);
      arrangeVessels();
      
      // Reset hint
      hintVessel = null;
      showingHint = false;
      
      // Check win condition
      if (vessels.length === 1 && vessels[0].name === final_combination.name) {
        gameWon = true;
        triggerHapticFeedback('completion'); // Haptic feedback on game completion
      }
    }
  }
  
  function startGame() {
    gameStarted = true;
  }
  
  function triggerHapticFeedback(type) {
    if (navigator.vibrate) {
      switch(type) {
        case 'success':
          navigator.vibrate([50, 30, 50]); // Short double vibration
          break;
        case 'error':
          navigator.vibrate(100); // Single short vibration
          break;
        case 'completion':
          navigator.vibrate([100, 50, 100, 50, 200]); // Celebratory pattern
          break;
      }
    }
  }
  