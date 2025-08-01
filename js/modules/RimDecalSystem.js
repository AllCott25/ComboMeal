/*
 * RimDecalSystem.js - Rim Decal Management Module
 * Handles loading, assignment, and rendering of rim decals for vessels
 */

(function() {
  'use strict';
  
  // Rim Decal System configuration
  const RIM_DECAL_CONFIG = {
    // Available decal shapes (SVG filenames without extension)
    shapes: [
      'Pattern1_flower',
      'bubbles1', 
      'checker2',
      'flower2',
      'h-stripes2',
      'heart3'
    ],
    
    // Available colors for decals (matching Combo Meal colors)
    colors: {
      orange: '#da9356',      // Orange (existing peach color)
      lightPink: '#f3a9b2',   // Light pink
      darkPink: '#cf6d88',    // Dark pink
      yellow: '#f7dc30',      // Yellow
      lightGreen: '#9ed485',  // Light green (estimated)
      darkGreen: '#6b8e5a'    // Dark green (estimated)
    },
    
    // Decal sizing
    defaultSize: 32,         // Default SVG size
    heightPercentage: 0.15,  // 15% of vessel height
    minVisibleSize: 8        // Minimum size before skipping render
  };
  
  class RimDecalSystem {
    constructor() {
      this.decalImages = {};      // Store loaded SVG images
      this.ingredientDecals = {}; // Map ingredient names to decal assignments
      this.vesselIngredientMap = new WeakMap(); // Track ingredients for each vessel
      this.loadingComplete = false;
      this.loadingErrors = [];
    }
    
    // Initialize and load all decal SVGs
    async init() {
      console.log('RimDecalSystem: Initializing...');
      
      // Load all decal SVGs
      const loadPromises = [];
      
      for (const shape of RIM_DECAL_CONFIG.shapes) {
        const path = `assets/rimdecals/${shape}.svg`;
        const promise = new Promise((resolve, reject) => {
          loadImage(path, 
            (img) => {
              this.decalImages[shape] = img;
              console.log(`RimDecalSystem: Loaded ${shape}`);
              resolve();
            },
            (err) => {
              console.error(`RimDecalSystem: Failed to load ${shape}:`, err);
              this.loadingErrors.push(shape);
              resolve(); // Continue even if one fails
            }
          );
        });
        loadPromises.push(promise);
      }
      
      await Promise.all(loadPromises);
      this.loadingComplete = true;
      console.log('RimDecalSystem: Loading complete. Loaded:', Object.keys(this.decalImages).length, 'decals');
    }
    
    // Get or assign a decal for an ingredient
    getDecalForIngredient(ingredientName) {
      // Return existing assignment if available
      if (this.ingredientDecals[ingredientName]) {
        return this.ingredientDecals[ingredientName];
      }
      
      // Create new assignment
      const assignment = this.createRandomAssignment();
      this.ingredientDecals[ingredientName] = assignment;
      return assignment;
    }
    
    // Create a random decal assignment ensuring no duplicates
    createRandomAssignment() {
      const availableShapes = Object.keys(this.decalImages);
      const availableColors = Object.keys(RIM_DECAL_CONFIG.colors);
      
      // Get all existing combinations
      const usedCombinations = new Set();
      for (const assignment of Object.values(this.ingredientDecals)) {
        usedCombinations.add(`${assignment.shape}-${assignment.colorKey}`);
      }
      
      // Try to find an unused combination
      let attempts = 0;
      let shape, colorKey;
      
      do {
        shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        colorKey = availableColors[Math.floor(Math.random() * availableColors.length)];
        attempts++;
        
        // If we've tried too many times, just allow duplicates of either shape or color
        if (attempts > 50) {
          console.warn('RimDecalSystem: Could not find unique shape+color combination');
          break;
        }
      } while (usedCombinations.has(`${shape}-${colorKey}`));
      
      return {
        shape: shape,
        colorKey: colorKey,
        color: RIM_DECAL_CONFIG.colors[colorKey]
      };
    }
    
    // Render decals for a vessel
    renderDecals(vessel) {
      if (!this.loadingComplete || !vessel) return;
      
      // Calculate decal size based on vessel height
      const decalHeight = vessel.h * RIM_DECAL_CONFIG.heightPercentage;
      const scale = decalHeight / RIM_DECAL_CONFIG.defaultSize;
      const decalWidth = RIM_DECAL_CONFIG.defaultSize * scale;
      
      // Skip rendering if too small
      if (decalHeight < RIM_DECAL_CONFIG.minVisibleSize) {
        return;
      }
      
      // Get decals to render based on vessel type
      const decalsToRender = this.getDecalsForVessel(vessel);
      if (decalsToRender.length === 0) return;
      
      // Calculate vessel rim area (top 15%)
      const rimY = vessel.y - vessel.h/2 + decalHeight/2;
      const vesselWidth = vessel.w * 0.8; // Account for vessel body being 80% of total width
      
      // Calculate how many decals fit (including partial)
      const patternWidth = decalsToRender.length * decalWidth;
      const repetitions = Math.ceil(vesselWidth / patternWidth);
      const totalDecals = repetitions * decalsToRender.length;
      
      // Calculate starting position to center the pattern
      const totalWidth = (totalDecals * decalWidth);
      const startX = vessel.x - totalWidth / 2;
      
      // Set up clipping to vessel bounds
      push();
      
      // Create clipping mask using vessel shape
      drawingContext.save();
      drawingContext.beginPath();
      
      // Match the vessel body shape (rounded rectangle)
      const topCornerRadius = Math.max(vessel.h * 0.05, 3);
      const bottomCornerRadius = Math.max(vessel.h * 0.3, 15);
      const bodyX = vessel.x - vessel.w * 0.4;
      const bodyY = vessel.y - vessel.h * 0.4;
      const bodyW = vessel.w * 0.8;
      const bodyH = vessel.h * 0.6;
      
      // Draw rounded rectangle path for clipping
      drawingContext.moveTo(bodyX + topCornerRadius, bodyY);
      drawingContext.lineTo(bodyX + bodyW - topCornerRadius, bodyY);
      drawingContext.quadraticCurveTo(bodyX + bodyW, bodyY, bodyX + bodyW, bodyY + topCornerRadius);
      drawingContext.lineTo(bodyX + bodyW, bodyY + bodyH - bottomCornerRadius);
      drawingContext.quadraticCurveTo(bodyX + bodyW, bodyY + bodyH, bodyX + bodyW - bottomCornerRadius, bodyY + bodyH);
      drawingContext.lineTo(bodyX + bottomCornerRadius, bodyY + bodyH);
      drawingContext.quadraticCurveTo(bodyX, bodyY + bodyH, bodyX, bodyY + bodyH - bottomCornerRadius);
      drawingContext.lineTo(bodyX, bodyY + topCornerRadius);
      drawingContext.quadraticCurveTo(bodyX, bodyY, bodyX + topCornerRadius, bodyY);
      drawingContext.closePath();
      drawingContext.clip();
      
      // Render decals
      imageMode(CENTER);
      let decalIndex = 0;
      
      for (let i = 0; i < totalDecals; i++) {
        const decal = decalsToRender[decalIndex];
        const x = startX + (i * decalWidth) + decalWidth/2;
        
        // Apply color using tint
        if (vessel.complete_combinations.length > 0) {
          // White for completed combos
          tint(255, 255, 255);
        } else {
          // Apply decal color
          const c = color(decal.color);
          tint(c);
        }
        
        // Draw the decal
        image(this.decalImages[decal.shape], x, rimY, decalWidth, decalHeight);
        
        // Move to next decal in pattern
        decalIndex = (decalIndex + 1) % decalsToRender.length;
      }
      
      // Reset tint
      noTint();
      
      // Restore clipping
      drawingContext.restore();
      pop();
    }
    
    // Get decals to render for a vessel based on its type
    getDecalsForVessel(vessel) {
      const decals = [];
      
      // Check if we have cached ingredients for this vessel
      const cachedIngredients = this.vesselIngredientMap.get(vessel);
      
      // Single ingredient vessel
      if (vessel.ingredients.length === 1) {
        const decal = this.getDecalForIngredient(vessel.ingredients[0]);
        decals.push(decal);
        // Cache the ingredients
        this.vesselIngredientMap.set(vessel, [...vessel.ingredients]);
      }
      // Partial combo vessel (multiple ingredients)
      else if (vessel.ingredients.length > 1) {
        for (const ingredient of vessel.ingredients) {
          const decal = this.getDecalForIngredient(ingredient);
          decals.push(decal);
        }
        // Cache the ingredients
        this.vesselIngredientMap.set(vessel, [...vessel.ingredients]);
      }
      // Completed combo vessel
      else if (vessel.complete_combinations.length > 0) {
        // First check if we have cached ingredients
        if (cachedIngredients && cachedIngredients.length > 0) {
          for (const ingredient of cachedIngredients) {
            const decal = this.getDecalForIngredient(ingredient);
            if (decal) decals.push(decal);
          }
        } else {
          // Try to find ingredients from the vessel name or combination
          // This is a fallback for vessels created without going through normal combination
          const comboName = vessel.complete_combinations[0] || vessel.name || '';
          
          // Look for ingredient patterns in the combo name (e.g., "Tomato + Cheese")
          for (const ingredientName of Object.keys(this.ingredientDecals)) {
            if (comboName.includes(ingredientName)) {
              decals.push(this.ingredientDecals[ingredientName]);
            }
          }
          
          if (decals.length === 0) {
            console.warn('RimDecalSystem: Cannot determine ingredients for completed combo:', vessel.name);
          }
        }
      }
      
      return decals;
    }
    
    // Store ingredients for a vessel (call this when creating completed combos)
    storeVesselIngredients(vessel, ingredients) {
      if (vessel && ingredients && ingredients.length > 0) {
        this.vesselIngredientMap.set(vessel, [...ingredients]);
      }
    }
    
    // Reset all assignments (for new game)
    reset() {
      this.ingredientDecals = {};
      console.log('RimDecalSystem: Reset decal assignments');
    }
  }
  
  // Create and expose the singleton instance
  window.rimDecalSystem = new RimDecalSystem();
  
})();