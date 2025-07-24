/*
 * Design System for Culinary Logic Puzzle
 * Created: December 2024
 * 
 * Unified design tokens for consistent visual language across all UI elements
 */

// Typography Scale - Modular scale based on 1.25 ratio
const TYPOGRAPHY = {
  // Font families
  fonts: {
    title: 'Courier, "Courier New", monospace',
    body: 'Helvetica, Arial, sans-serif',
    button: 'Helvetica, Arial, sans-serif'
  },
  
  // Modular typography scale (1.25 ratio)
  scale: {
    xs: 10,    // Fine print, captions
    sm: 12,    // Body text, labels  
    base: 14,  // Default body text
    md: 16,    // Large body text
    lg: 20,    // Subheadings
    xl: 24,    // Headings
    xxl: 32,   // Large headings
    xxxl: 40   // Display text
  },
  
  // Line heights for better readability
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6
  },
  
  // Responsive font size calculation
  responsive: {
    // Base sizes as percentage of play area width
    title: 0.045,     // Modal titles
    body: 0.025,      // Body text
    label: 0.02,      // Form labels
    button: 0.03,     // Button text
    error: 0.025,     // Error messages
    
    // Minimum and maximum sizes
    min: {
      title: 16,
      body: 11,
      label: 10,
      button: 12,
      error: 11
    },
    max: {
      title: 24,
      body: 14,
      label: 12,
      button: 16,
      error: 14
    }
  }
};

// Spacing System - 8px base unit
const SPACING = {
  unit: 8,  // Base spacing unit
  
  // Semantic spacing values
  xs: 4,    // 0.5 units
  sm: 8,    // 1 unit
  md: 16,   // 2 units
  lg: 24,   // 3 units
  xl: 32,   // 4 units
  xxl: 48,  // 6 units
  xxxl: 64, // 8 units
  
  // Modal-specific spacing
  modal: {
    padding: 24,        // Internal modal padding
    elementGap: 16,     // Gap between form elements
    sectionGap: 24,     // Gap between sections
    buttonGap: 12,      // Gap between buttons
    errorMargin: 8      // Margin above error messages
  }
};

// Stroke Weight Hierarchy
const STROKES = {
  light: 1,      // Subtle borders, dividers
  standard: 2,   // Default UI elements, buttons, input fields
  emphasis: 3,   // Focus states, primary actions
  heavy: 4       // Strong emphasis, selected states
};

// Border Radius System
const RADIUS = {
  sm: 4,    // Small elements
  md: 8,    // Standard buttons, inputs
  lg: 12,   // Cards, larger elements
  xl: 16,   // Modal containers
  round: 50 // Circular elements (percentage)
};

// Enhanced Color System with semantic naming
const UI_COLORS = {
  // Base colors from existing COLORS object
  background: '#f8f5f2',
  primary: '#9a9832',
  secondary: '#cf6d88', 
  tertiary: '#FFFFFF',
  accent: '#7A9BB5',
  text: '#333333',
  
  // UI-specific colors
  border: {
    light: '#e5e5e5',    // Light borders
    medium: '#cccccc',   // Standard borders
    dark: '#999999',     // Dark borders
    focus: '#9a9832'     // Focus state borders (primary color)
  },
  
  // State colors
  error: '#cf6d88',      // Error states (secondary color)
  success: '#9a9832',    // Success states (primary color)
  warning: '#f7dc30',    // Warning states
  
  // Interactive states
  hover: {
    light: 'rgba(255, 255, 255, 0.1)',     // Light hover overlay
    medium: 'rgba(255, 255, 255, 0.2)',    // Medium hover overlay
    primary: 'rgba(154, 152, 50, 0.1)'     // Primary color hover overlay
  },
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.6)',          // Modal backdrop
  shadow: 'rgba(0, 0, 0, 0.1)'            // Drop shadow
};

// Modal sizing system
const MODAL_SIZES = {
  // Modal dimensions as percentage of play area
  auth: {
    width: 0.9,      // 90% of play area width
    height: 0.65,    // 65% of play area height (increased from 55%)
    maxWidth: 480,   // Maximum width in pixels
    maxHeight: 400   // Maximum height in pixels
  },
  
  help: {
    width: 0.85,
    height: 0.8,
    maxWidth: 600,
    maxHeight: 500
  },
  
  terms: {
    width: 0.9,
    height: 0.8,
    maxWidth: 500,
    maxHeight: 600
  }
};

// Button system
const BUTTON_STYLES = {
  // Button sizing
  height: {
    sm: 32,
    md: 40,
    lg: 48
  },
  
  // Button padding
  padding: {
    horizontal: 16,
    vertical: 8
  },
  
  // Minimum touch target
  minTouchTarget: 44
};

// Utility functions for responsive design
const DesignSystem = {
  // Calculate responsive font size
  getFontSize: function(type, playAreaWidth) {
    const responsive = TYPOGRAPHY.responsive[type];
    if (!responsive) return TYPOGRAPHY.scale.base;
    
    const calculated = playAreaWidth * responsive;
    const min = TYPOGRAPHY.responsive.min[type] || TYPOGRAPHY.scale.xs;
    const max = TYPOGRAPHY.responsive.max[type] || TYPOGRAPHY.scale.xxxl;
    
    return Math.max(min, Math.min(max, calculated));
  },
  
  // Get modal dimensions
  getModalSize: function(type, playAreaWidth, playAreaHeight) {
    const config = MODAL_SIZES[type];
    if (!config) return MODAL_SIZES.auth;
    
    return {
      width: Math.min(playAreaWidth * config.width, config.maxWidth),
      height: Math.min(playAreaHeight * config.height, config.maxHeight)
    };
  },
  
  // Apply consistent text styling
  applyTextStyle: function(type, playAreaWidth) {
    const fontSize = this.getFontSize(type, playAreaWidth);
    textSize(fontSize);
    
    switch(type) {
      case 'title':
        textFont(TYPOGRAPHY.fonts.title);
        textStyle(BOLD);
        break;
      case 'body':
      case 'label':
      case 'error':
        textFont(TYPOGRAPHY.fonts.body);
        textStyle(NORMAL);
        break;
      case 'button':
        textFont(TYPOGRAPHY.fonts.button);
        textStyle(BOLD);
        break;
    }
  },
  
  // Apply consistent stroke styling
  applyStroke: function(weight, color = UI_COLORS.border.medium) {
    stroke(color);
    strokeWeight(STROKES[weight] || STROKES.standard);
  },
  
  // Apply consistent fill with hover state
  applyFill: function(baseColor, isHovered = false, hoverType = 'light') {
    if (isHovered) {
      const hoverColor = UI_COLORS.hover[hoverType];
      fill(lerpColor(color(baseColor), color(hoverColor), 0.2));
    } else {
      fill(baseColor);
    }
  }
};

// Export for global use
if (typeof window !== 'undefined') {
  window.TYPOGRAPHY = TYPOGRAPHY;
  window.SPACING = SPACING;
  window.STROKES = STROKES;
  window.RADIUS = RADIUS;
  window.UI_COLORS = UI_COLORS;
  window.MODAL_SIZES = MODAL_SIZES;
  window.BUTTON_STYLES = BUTTON_STYLES;
  window.DesignSystem = DesignSystem;
}