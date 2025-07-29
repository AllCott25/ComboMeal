# Animation Database for Combo Meal Game

## Overview
This document provides a comprehensive database of all animations in the Combo Meal game, including their locations in the code and timing parameters.

## Animation Types and Timings

### 1. **CombineAnimation** (Particle Effects)
- **Location**: `/workspace/js/animation.js` lines 3-64
- **Purpose**: Visual particle effects when combining ingredients
- **Duration**: 15 frames (0.5 seconds at 30fps)
- **Properties**:
  - Sparkles: 15 particles with random positions and sizes
  - Progress: Linear progression from 0 to 1
  - Easing: Cubic easing for smooth movement
  - Size reduction: Particles shrink by 50% over animation lifetime

### 2. **VesselMovementAnimation** (Auto-Combine Movement)
- **Location**: `/workspace/js/animation.js` lines 67-122
- **Purpose**: Moves vessels to center during auto-combination
- **Duration**: 20 frames (0.67 seconds at 30fps)
- **Properties**:
  - Easing: Cubic in-out easing
  - Stores original position for restoration
  - Updates vessel position directly

### 3. **VerbAnimation** (Combination Success)
- **Location**: `/workspace/js/animation.js` lines 125-327
- **Purpose**: Displays combination verb in dramatic cloud effect
- **Duration**: 45 frames (1.5 seconds at 30fps)
- **Phases**:
  - Growth phase (0-30%): 25% faster progression
  - Hold phase (30-70%): Normal speed
  - Fade phase (70-100%): 50% faster progression
- **Properties**:
  - Initial size: 75% of vessel size
  - Max size: 90% of play area width
  - Movement: From vessel position to halfway to center
  - Cloud effect: 36 points with organic noise variation
  - Text reveal: At 50% progress
  - Opacity fade: Starts at 80% progress

### 4. **FinalVerbAnimation** (Game Win Animation)
- **Location**: `/workspace/js/animation.js` lines 330-533
- **Purpose**: Dramatic final animation when completing the game
- **Duration**: 72 frames (2.4 seconds at 30fps)
- **Special Features**:
  - Transition circle that grows to 110% of screen size
  - Stops game timer immediately
  - Triggers win screen at frame 38 (1.25 seconds)
  - Max size: Full play area width
  - Enhanced text with golden outline

### 5. **RecipeBounceAnimation** (Profile Screen)
- **Location**: `/workspace/js/animation.js` lines 535-579
- **Purpose**: Bounces first recipe card on profile screen
- **Duration**: 90 frames (3 seconds at 30fps)
- **Properties**:
  - Bounce height: 130 pixels
  - Bounce count: 4 bounces
  - Damping: Exponential decay
  - Uses sine wave for smooth motion

### 6. **WallpaperAnimation** (Menu Background)
- **Location**: `/workspace/js/animation.js` lines 582-887
- **Purpose**: Animated wallpaper with split reveal effect
- **States & Timings**:
  - STATIC: 750ms minimum duration
  - SPLITTING: 32 frames (1.1 seconds)
  - CLOSING: 22 frames (0.7 seconds)
  - HOLDING: 5 frames (0.17 seconds)
  - OPENING: 32 frames (1.1 seconds)
- **Properties**:
  - Tile aspect ratio: 25:17 (fixed)
  - Mobile optimizations: Larger tiles, no running bond pattern

### 7. **Vessel Shake Animation** (Error Feedback)
- **Location**: `/workspace/js/modules/VesselSystem.js` lines 72-76, 107-113, 150-157, 170-178
- **Purpose**: Visual feedback for unsuccessful combinations
- **Duration**: 15 frames (0.5 seconds at 30fps)
- **Properties**:
  - Base shake amount: 5 pixels (scalable by intensity)
  - Alternating horizontal movement
  - Decreases linearly over duration
  - Uses sine function for smooth alternation

### 8. **Vessel Pulse Animation** (Success Feedback)
- **Location**: `/workspace/js/modules/VesselSystem.js` lines 469-490
- **Purpose**: Visual feedback for successful combinations
- **Default Duration**: 1000ms
- **Properties**:
  - Body scale: 1.0 → 1.2 → 1.0
  - Text scale: 1.0 → 1.1 → 1.0
  - Smooth interpolation over duration

### 9. **Vessel Double Pulse Animation** (Special Completions)
- **Location**: `/workspace/js/modules/VesselSystem.js` lines 492-520
- **Purpose**: Enhanced feedback for special combinations
- **Timings**:
  - First pulse: 1000ms
  - Delay: 200ms
  - Second pulse: 800ms
- **Properties**:
  - Second pulse uses larger scales (1.25 body, 1.15 text)

### 10. **Egg Splat Animation** (Easter Egg)
- **Location**: `/workspace/js/egg.js` lines 63-89
- **Purpose**: Dramatic reveal of easter egg
- **Duration**: 100ms
- **Properties**:
  - Initial scale: 2.0
  - Final scale: 1.0
  - Linear interpolation

### 11. **Byline Fade Transition**
- **Location**: `/workspace/js/byline.js` lines 28-30, 98-131
- **Purpose**: Smooth transitions between byline messages
- **Duration**: 15 frames per phase (0.5 seconds total)
- **Phases**:
  - Fade out: 0.25 seconds
  - Change text: Instant
  - Fade in: 0.25 seconds
- **Properties**:
  - Opacity: 255 → 0 → 255
  - Linear fade

### 12. **Auto Final Combination Sequence**
- **Location**: `/workspace/js/GameLogic.js` lines 1327-1594
- **Purpose**: Automated final recipe combination
- **State Machine Timings**:
  - WAITING: 30 frames (1 second)
  - PENULTIMATE → ANIMATE: 20 frames delay
  - ANIMATE → COMBINING: 15 frames delay
  - Intermediate combinations: 90 frames (3 seconds) between steps
- **Properties**:
  - Simultaneous shake and movement
  - Shake intensity: 2x normal
  - 20 particle bursts for final combination

## Animation Timing Summary

| Animation | Duration | FPS | Notes |
|-----------|----------|-----|-------|
| CombineAnimation | 0.5s | 30 | Particle effects |
| VesselMovementAnimation | 0.67s | 30 | Auto-combine movement |
| VerbAnimation | 1.5s | 30 | Variable speed phases |
| FinalVerbAnimation | 2.4s | 30 | Win screen at 1.25s |
| RecipeBounceAnimation | 3s | 30 | 4 dampened bounces |
| WallpaperAnimation | Variable | 30 | Multiple states |
| Vessel Shake | 0.5s | 30 | Error feedback |
| Vessel Pulse | 1s | - | Success feedback |
| Double Pulse | 2s total | - | Special completions |
| Egg Splat | 0.1s | - | Easter egg reveal |
| Byline Fade | 0.5s | 30 | Text transitions |
| Auto Final Combo | Variable | 30 | State-based sequence |

## CSS Transitions

### 1. **Button Hover** 
- **Location**: `/workspace/playtest.html` line 52
- **Duration**: 0.2s
- **Property**: background-color

### 2. **Landing Page Animations**
- **Location**: `/workspace/playsker-landing.html` lines 96, 115
- **Duration**: 0.3s
- **Properties**: transform (scale), background-color

### 3. **Auth Modal Transitions**
- **Location**: `/workspace/js/auth-modal.js` line 2561
- **Duration**: 0.3s (300ms)
- **Note**: Matches CSS transition duration

## Key Animation Interactions

1. **Partial Combination Success**:
   - CombineAnimation (particles) + VerbAnimation (cloud) + Vessel Pulse

2. **Complete Combination (Non-Final)**:
   - Same as partial + potential Double Pulse for special items

3. **Auto-Combine Sequence**:
   - Vessel Shake (2x intensity) + VesselMovementAnimation + CombineAnimation + VerbAnimation
   - 90 frame (3s) delay between intermediate steps

4. **Final Combination**:
   - All vessels shake + move simultaneously
   - 20x CombineAnimation particles
   - FinalVerbAnimation with transition circle
   - Game win triggered at 1.25s into animation

5. **Error Feedback**:
   - Vessel Shake on both dragged and target vessels
   - Synchronized with haptic feedback and black counter

## Performance Considerations

- Mobile optimizations reduce animation complexity
- Wallpaper animation uses larger tiles on mobile
- Image smoothing disabled on mobile for better performance
- Animations update at 30fps (except time-based animations)
- Multiple animations can run simultaneously
- State machines prevent animation conflicts in auto-combine sequence