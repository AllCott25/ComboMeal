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
      this.duration = 15; // 0.5 seconds at 30fps (reduced from 30)
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
  
  // Animation class for vessel movement during final combination
  class VesselMovementAnimation {
    constructor(vessel, targetX, targetY) {
      this.vessel = vessel;
      this.startX = vessel.x;
      this.startY = vessel.y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.progress = 0;
      this.duration = 20; // 0.67 seconds at 30fps (reduced from 30)
      this.active = true;
      this.completed = false;
      
      // Store original position for restoration if needed
      vessel.originalX = vessel.x;
      vessel.originalY = vessel.y;
      
      console.log(`Created vessel movement animation from (${this.startX}, ${this.startY}) to (${this.targetX}, ${this.targetY})`);
    }
    
    update() {
      if (this.completed) return true;
      
      this.progress += 1 / this.duration;
      
      // Prevent progress from exceeding 1
      this.progress = Math.min(this.progress, 1);
      
      // Use cubic easing for smooth movement
      const t = this.progress;
      const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Update vessel position
      this.vessel.x = lerp(this.startX, this.targetX, easedT);
      this.vessel.y = lerp(this.startY, this.targetY, easedT);
      
      // Check if animation is complete
      if (this.progress >= 1) {
        this.completed = true;
        this.active = false;
        console.log(`Vessel movement complete for ${this.vessel.name || "unnamed vessel"}`);
        
        // Ensure the vessel is exactly at the target position
        this.vessel.x = this.targetX;
        this.vessel.y = this.targetY;
        
        return true;
      }
      
      return false;
    }
    
    draw() {
      // No drawing needed - the vessel itself will be drawn separately
      // This animation only updates the vessel's position
    }
  }
  
  // Animation class for dramatic verb reveals
  class VerbAnimation {
    constructor(verb, x, y, vesselRef) {
      // Transform verb to uppercase and add exclamation mark
      this.verb = verb.toUpperCase() + "!";
      this.startX = x; // Starting position (over vessel)
      this.startY = y;
      
      // Calculate halfway point between vessel and center
      const centerX = playAreaX + playAreaWidth/2;
      const centerY = playAreaY + playAreaHeight/2;
      this.targetX = lerp(this.startX, centerX, 0.5); // Go halfway to center
      this.targetY = lerp(this.startY, centerY, 0.5); // Go halfway to center
      
      this.x = this.startX; // Current position
      this.y = this.startY;
      this.progress = 0;
      this.duration = 45; // 1.5 seconds at 30fps (reduced from 60)
      this.maxSize = playAreaWidth * 0.9; // 90% of play area width
      this.active = true;
      this.opacity = 255; // Track opacity separately 
      this.cloudPoints = [];
      this.vesselRef = vesselRef; // Reference to the vessel to update its text
      this.hasTriggeredTextReveal = false; // Flag to track if we've triggered the text reveal
      
      // Start at 75% of vessel size if we have a vessel reference
      this.initialSize = this.vesselRef ? Math.max(this.vesselRef.w, this.vesselRef.h) * 0.75 : 10;
      
      // Store the original vessel name and temporarily clear it
      if (this.vesselRef) {
        this.vesselName = this.vesselRef.name;
        this.vesselRef.displayName = null; // Add a displayName property that starts as null
      }
      
      // Debug log to confirm animation creation
      console.log("Creating VerbAnimation for verb:", this.verb, "for vessel:", this.vesselName);
      
      // Generate cloud edge points - increased number of points for smoother outline
      const numPoints = 36; // Increased from 20 for smoother outline
      for (let i = 0; i < numPoints; i++) {
        const angle = (TWO_PI / numPoints) * i;
        const noiseOffset = random(0, 100);
        this.cloudPoints.push({
          angle: angle,
          noiseOffset: noiseOffset,
          variationAmount: random(0.12, 0.18) // More consistent variation (was 0.1, 0.25)
        });
      }
    }
    
    update() {
      // Animation phases - adjust for speed
      const growPhase = 0.3; // First 30% of animation is growth
      const holdPhase = 0.7; // Hold until 70% of animation
      const peakRevealPoint = 0.5; // At 50% of animation, reveal the vessel name
      const fadeOutPoint = 0.8; // Start fading out at 80% 
      
      // Adjust progress speed: 25% faster during growth, 50% faster during fade
      let progressIncrement;
      if (this.progress < growPhase) {
        // 25% faster during growth
        progressIncrement = (1 / this.duration) * 1.25;
      } else if (this.progress > fadeOutPoint) {
        // 50% faster during fade out
        progressIncrement = (1 / this.duration) * 1.5;
      } else {
        // Normal speed during hold phase
        progressIncrement = 1 / this.duration;
      }
      
      // Update progress
      this.progress += progressIncrement;
      
      // Move position from start to center as the animation progresses during growth phase
      if (this.progress <= growPhase) {
        const moveT = this.progress / growPhase;
        const easedMoveT = moveT * moveT * (3 - 2 * moveT); // Cubic easing
        this.x = lerp(this.startX, this.targetX, easedMoveT);
        this.y = lerp(this.startY, this.targetY, easedMoveT);
      }
      
      // When we hit the peak, reveal the vessel name
      if (!this.hasTriggeredTextReveal && this.progress >= peakRevealPoint && this.vesselRef) {
        console.log("Revealing vessel name:", this.vesselName);
        this.vesselRef.displayName = this.vesselName;
        this.hasTriggeredTextReveal = true;
      }
      
      // Handle fade out 
      if (this.progress > fadeOutPoint) {
        // Quick fade out calculation - map from fadeOutPoint->1.0 to 255->0
        this.opacity = map(this.progress, fadeOutPoint, 1.0, 255, 0);
      }
      
      // Log progress at certain points for debugging
      if (this.progress === 0.1 || this.progress === 0.3 || this.progress === 0.5 || 
          this.progress === 0.7 || this.progress === 0.9) {
        console.log(`VerbAnimation at ${(this.progress * 100).toFixed(0)}%: ${this.verb}`);
      }
      
      // Return true when animation is complete to remove it
      if (this.progress >= 1) {
        console.log(`VerbAnimation complete: ${this.verb}`);
        // Ensure vessel name is revealed at the end
        if (this.vesselRef && !this.vesselRef.displayName) {
          this.vesselRef.displayName = this.vesselName;
        }
        this.active = false;
        return true;
      }
      
      return false;
    }
    
    draw() {
      if (!this.active) return;
      
      // Calculate animation phases
      const growPhase = 0.3; // First 30% of animation is growth
      const holdPhase = 0.7; // Hold until 70% of animation
      
      // Calculate size based on animation phase, but start at initialSize rather than 0
      let currentSize;
      if (this.progress < growPhase) {
        // Growing phase - ease in with cubic function, but start at initialSize
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
      
      // Begin shape
      push();
      
      // Draw cloud background
      noStroke();
      
      // Draw main cloud with higher opacity (255 → 255+20% = ~300, capped at 255)
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
        
        // Calculate font size (proportional to cloud size), with minimum size
        const fontSize = max(min(currentSize * 0.2, 70), 20);
        
        // Draw text
        textAlign(CENTER, CENTER);
        textSize(fontSize);
        textStyle(BOLD);
        
        // Draw text shadow for better visibility
        fill(0, 0, 0, textOpacity * 0.4);
        text(this.verb, this.x + 4, this.y + 4);
        
        // Draw main text with stronger color
        let secondaryColor = color(COLORS.secondary);
        secondaryColor.setAlpha(textOpacity);
        fill(secondaryColor);
        text(this.verb, this.x, this.y);
      }
      
      pop();
    }
  }

// Add a new class for the special final animation
class FinalVerbAnimation extends VerbAnimation {
    constructor(verb, vessel) {
      // Get vessel position if available, otherwise use center
      const startX = vessel ? vessel.x : playAreaX + playAreaWidth/2;
      const startY = vessel ? vessel.y : playAreaY + playAreaHeight/2;
      
      // Call parent constructor with vessel reference, only uppercase (exclamation point added in VerbAnimation)
      super(verb.toUpperCase(), startX, startY, vessel);
      
      // Override properties for more dramatic effect
      this.maxSize = playAreaWidth; // Limit to exact play area width (was playAreaWidth * 1.2)
      this.duration = 72; // 2.4 seconds at 30fps (reduced from 144)
      this.initialSize = this.vesselRef ? Math.max(this.vesselRef.w, this.vesselRef.h) * 0.75 : this.maxSize * 0.5;
      
      // Set flag to prevent game win until animation completes
      this.isFinalAnimation = true;
      
      // Stop the timer when final animation starts - APlasker
      if (typeof gameTimerActive !== 'undefined') {
        gameTimerActive = false;
        console.log("Timer stopped at final animation start. Final time:", formatTime(gameTimer));
      }
      
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
  
class RecipeBounceAnimation {
  constructor() {
    this.progress = 0;
    this.duration = 90; // 3 seconds at 30fps
    this.bounceOffset = 0;
    this.active = true;
    this.bounceHeight = 130; // Noticeable but not excessive bounce height
    this.bounceCount = 4; // Slightly more bounces for fun
    
    console.log("RecipeBounceAnimation created - first recipe will bounce!");
  }
  
  update() {
    this.progress += 1 / this.duration;
    
    if (this.progress >= 1) {
      this.bounceOffset = 0; // Ensure we end at rest position
      this.active = false;
      console.log("RecipeBounceAnimation completed");
      return true; // Animation complete
    }
    
    // Create a bouncing effect that dampens over time
    // Use sine wave for smooth bouncing with exponential decay
    const dampingFactor = 1 - this.progress; // Reduces bounce over time
    const frequency = this.bounceCount * Math.PI * 2; // Controls number of bounces
    this.bounceOffset = Math.sin(this.progress * frequency) * this.bounceHeight * dampingFactor;
    
    // Debug logging to see if animation is running
    if (Math.floor(this.progress * 30) % 15 === 0) { // Log every half second
      console.log("RecipeBounceAnimation progress:", this.progress.toFixed(2), "offset:", this.bounceOffset.toFixed(1));
    }
    
    return false; // Animation continuing
  }
  
  draw() {
    // This animation only calculates the bounce offset
    // The actual drawing is handled by the profile screen card rendering
  }
  
  getBounceOffset() {
    return this.bounceOffset;
  }
}

// Phase 2: Animated wallpaper tiling class with horizontal scrolling - APlasker
class WallpaperAnimation {
  constructor() {
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.tilesAcross = 0;
    this.tilesDown = 0;
    
    // Cache screen dimensions to detect resize
    this.lastScreenWidth = 0;
    this.lastScreenHeight = 0;
    this.dimensionsCalculated = false;
    
    // Animation states: STATIC, SPLITTING, READY_FOR_COOK, CLOSING, HOLDING, OPENING, COMPLETE
    // Start in READY_FOR_COOK to skip initial animation - only animate on Cook button
    this.state = 'READY_FOR_COOK';
    this.staticStartTime = null;
    this.splitStartTime = null;
    this.closeStartTime = null;
    this.holdStartTime = null;
    this.openStartTime = null;
    this.gameStartTriggered = false; // Flag to track if we've started the game
    this.minimumStaticDuration = 750; // 0.75 seconds in milliseconds
    this.splitDuration = 32; // 1.1 seconds at 30fps for the split animation (45% faster total)
    this.closeDuration = 22; // 0.7 seconds at 30fps for closing animation (45% faster total)
    this.openDuration = 32; // 1.1 seconds at 30fps for opening animation (45% faster total)
    this.holdDuration = 5; // 0.17 seconds to hold closed while game loads
    
    // Split animation properties
    this.topHalfOffsetY = 0;
    this.bottomHalfOffsetY = 0;
    this.splitProgress = 1; // Start at 1 since we're in READY_FOR_COOK state (fully split)
    this.progress = 1; // Initialize progress to 1 for READY_FOR_COOK state
    
    // Horizontal tiling properties
    this.wallStartX = 0; // Starting X position for the wall
    this.wallWidth = 0;  // Total width of the tiled wall
    
    console.log("🎭 WallpaperAnimation created - supports split reveal and cook transitions");
  }

  calculateTileDimensions() {
    // Use the new HTML5 Canvas loaded image
    const imageToUse = wallpaperHighResImage;
    
    if (!imageToUse || !wallpaperImageReady) {
      console.log("⏳ High-res wallpaper image not ready yet");
      return false;
    }
    
    // FIXED: Use exact 25:17 aspect ratio as specified
    const aspectRatio = 25 / 17; // = 1.470588235294118
    
    console.log(`📐 Using high-res image dimensions: ${imageToUse.width}x${imageToUse.height}`);
    console.log(`📏 FIXED aspect ratio: 25:17 = ${aspectRatio.toFixed(6)} (landscape)`);
    
    // Mobile optimization: use much fewer, larger tiles on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const imagesHigh = isMobile ? 1.2 : 2.8; // Smaller tiles on mobile to show more of the image
    
    // Target: 2.8 images high on desktop, 2.0 on mobile - use FULL screen height
    const fullScreenHeight = windowHeight || height; // Use full window height
    const targetHeight = Math.round(fullScreenHeight / imagesHigh);
    
    // Calculate width using EXACT 25:17 aspect ratio
    const exactWidth = targetHeight * aspectRatio;
    this.tileWidth = Math.round(exactWidth);
    this.tileHeight = targetHeight;
    
    // Verify aspect ratio is maintained
    const calculatedRatio = this.tileWidth / this.tileHeight;
    const ratioDifference = Math.abs(aspectRatio - calculatedRatio);
    
    console.log(`🔒 Aspect ratio locked: ${calculatedRatio.toFixed(6)} (diff: ${ratioDifference.toFixed(6)})`);
    
    if (ratioDifference > 0.01) {
      console.warn(`⚠️ Aspect ratio drift detected! Adjusting...`);
      // If rounding caused drift, adjust width to maintain perfect 25:17 ratio
      this.tileWidth = Math.round(this.tileHeight * aspectRatio);
    }
    
    // Calculate horizontal tiling to fill FULL screen width
    const fullScreenWidth = windowWidth || width;
    const extraTiles = isMobile ? 1 : 2; // Fewer extra tiles on mobile
    this.tilesAcross = Math.ceil(fullScreenWidth / this.tileWidth) + extraTiles;
    
    // Calculate how many rows we need to fill FULL screen height
    const actualImagesHigh = fullScreenHeight / this.tileHeight;
    this.tilesDown = Math.ceil(actualImagesHigh) + extraTiles;
    
    // Calculate wall positioning for horizontal centering - full screen
    this.wallWidth = this.tilesAcross * this.tileWidth;
    this.wallStartX = 0 - (this.wallWidth - fullScreenWidth) / 2;
    
    // Cache screen dimensions to detect resize - full screen
    this.lastScreenWidth = fullScreenWidth;
    this.lastScreenHeight = fullScreenHeight;
    this.dimensionsCalculated = true;
    
    console.log(`✅ 25:17 aspect-ratio tiles: ${this.tileWidth}x${this.tileHeight}`);
    console.log(`📊 Actual images high: ${actualImagesHigh.toFixed(2)} (target: ${imagesHigh})`);
    console.log(`🌐 Horizontal tiling: ${this.tilesAcross} across, ${this.tilesDown} down`);
    console.log(`🎯 Wall dimensions: ${this.wallWidth}px wide, starts at X: ${this.wallStartX}`);
    
    // Mobile performance log
    if (isMobile) {
      console.log(`📱 Mobile optimizations: Using ${imagesHigh} images high (vs 2.8 on desktop)`);
    }
    
    return true;
  }

  needsRecalculation() {
    const fullScreenWidth = windowWidth || width;
    const fullScreenHeight = windowHeight || height;
    return fullScreenWidth !== this.lastScreenWidth || fullScreenHeight !== this.lastScreenHeight;
  }

  startSplitReveal() {
    if (this.state === 'STATIC') {
      const now = Date.now();
      const timeInStatic = now - this.staticStartTime;
      
      if (timeInStatic >= this.minimumStaticDuration) {
        console.log("🎬 Starting wallpaper split reveal animation!");
        this.state = 'SPLITTING';
        this.splitStartTime = now;
        this.splitProgress = 0;
      }
    }
  }

  startCookTransition() {
    if (this.state === 'READY_FOR_COOK') {
      console.log("🍳 Starting COOK transition - close then open!");
      this.state = 'CLOSING';
      this.closeStartTime = Date.now();
      this.splitProgress = 1; // Start from fully open position (will close to 0, then open to 1)
      this.gameStartTriggered = false; // Reset flag for this transition
    } else {
      console.warn("⚠️ Cannot start cook transition - not in READY_FOR_COOK state:", this.state);
    }
  }

  update() {
    // Mobile-specific timing adjustments - removed speed penalty for wallpaper animation
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const mobileSpeedMultiplier = 1.0; // Same speed on mobile and desktop for wallpaper animation
    
    switch (this.state) {
      case 'STATIC':
        this.staticTimer--;
        if (this.staticTimer <= 0) {
          this.startSplitReveal();
        }
        break;
        
      case 'SPLITTING':
        this.splitProgress += (1 / this.splitDuration) * mobileSpeedMultiplier;
        if (this.splitProgress >= 1) {
          this.state = 'READY_FOR_COOK';
          this.splitProgress = 1;
        }
        break;
        
      case 'READY_FOR_COOK':
        // Stay in this state until cook transition is triggered
        break;
        
      case 'CLOSING':
        this.splitProgress -= (1 / this.closeDuration) * mobileSpeedMultiplier;
        if (this.splitProgress <= 0) {
          this.state = 'HOLDING';
          this.splitProgress = 0;
          this.holdStartTime = Date.now();
          
          // Start the game NOW while wallpaper is closed
          if (!this.gameStartTriggered) {
            console.log("🎮 Wallpaper fully closed - starting game behind the scenes!");
            if (typeof actuallyStartGame === 'function') {
              actuallyStartGame();
            }
            this.gameStartTriggered = true;
          }
        }
        break;
        
      case 'HOLDING':
        // Hold for a few frames to let game load behind closed wallpaper
        const holdTime = Date.now() - this.holdStartTime;
        if (holdTime >= (this.holdDuration * 1000 / 30)) { // Convert frames to milliseconds
          this.state = 'OPENING';
          this.openStartTime = Date.now();
          console.log("🎭 Hold complete - opening wallpaper to reveal game!");
        }
        break;
        
      case 'OPENING':
        this.splitProgress += (1 / this.openDuration) * mobileSpeedMultiplier;
        if (this.splitProgress >= 1) {
          this.state = 'COMPLETE';
          this.splitProgress = 1;
        }
        break;
        
      case 'COMPLETE':
        // Animation is complete
        break;
    }
    
    return this.state !== 'COMPLETE';
  }

  draw() {
    if (this.state === 'COMPLETE' || this.state === 'READY_FOR_COOK') {
      return; // Don't draw anything, screen is fully revealed
    }
    
    if (!this.dimensionsCalculated || this.needsRecalculation()) {
      if (!this.calculateTileDimensions()) {
        return;
      }
    }

    const imageToUse = wallpaperHighResImage;
    if (!imageToUse || !wallpaperImageReady) return;

    // Split screen in half - use full screen
    const fullScreenHeight = windowHeight || height;
    const screenMidY = fullScreenHeight / 2;
    
    // Calculate animation offsets based on split progress
    // When splitProgress = 1: fully split (halves moved apart)
    // When splitProgress = 0: fully closed (halves together)
    const maxOffset = screenMidY; // Maximum distance to move each half
    this.topHalfOffsetY = -this.splitProgress * maxOffset; // Move top half up
    this.bottomHalfOffsetY = this.splitProgress * maxOffset; // Move bottom half down
    
    // Draw top half
    this.drawHalf(imageToUse, 'top', screenMidY, this.topHalfOffsetY);
    
    // Draw bottom half  
    this.drawHalf(imageToUse, 'bottom', screenMidY, this.bottomHalfOffsetY);
    
    console.log(`🎨 Drawing split wallpaper wall - State: ${this.state}, Progress: ${this.splitProgress.toFixed(2)}`);
  }
  
  drawHalf(imageToUse, half, screenMidY, offsetY) {
    push();
    
    // Mobile optimization: disable image smoothing for better performance
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      drawingContext.imageSmoothingEnabled = false;
    }
    
    // Set up simple clipping region for this half
    drawingContext.save();
    drawingContext.beginPath();
    
    const fullScreenWidth = windowWidth || width;
    const fullScreenHeight = windowHeight || height;
    
    if (half === 'top') {
      // Clip to top half of screen, moved up by offsetY
      const clipY = 0 + offsetY;
      const clipHeight = screenMidY;
      drawingContext.rect(0, clipY, fullScreenWidth, clipHeight);
    } else {
      // Clip to bottom half of screen, moved down by offsetY  
      const clipY = screenMidY + offsetY;
      const clipHeight = fullScreenHeight - screenMidY;
      drawingContext.rect(0, clipY, fullScreenWidth, clipHeight);
    }
    
    drawingContext.clip();

    // Draw tiled wallpaper - simplified pattern on mobile
    for (let row = 0; row < this.tilesDown; row++) {
      for (let col = 0; col < this.tilesAcross; col++) {
        // Mobile optimization: disable running bond pattern for better performance
        const xOffset = isMobile ? 0 : ((row % 2 === 0) ? 0 : -this.tileWidth / 2);
        
        const x = this.wallStartX + col * this.tileWidth + xOffset;
        const y = 0 + row * this.tileHeight - this.tileHeight + offsetY;
        
        // Mobile optimization: basic visibility check to skip off-screen tiles
        if (isMobile) {
          if (x + this.tileWidth < -100 || x > fullScreenWidth + 100 ||
              y + this.tileHeight < -100 || y > fullScreenHeight + 100) {
            continue; // Skip tiles that are far off-screen
          }
        }
        
        // Draw tile - clipping will handle visibility
        image(imageToUse, x, y, this.tileWidth, this.tileHeight);
      }
    }
    
    // Restore clipping and image smoothing
    drawingContext.restore();
    if (isMobile) {
      drawingContext.imageSmoothingEnabled = true; // Re-enable for other drawing operations
    }
    pop();
  }
}
  