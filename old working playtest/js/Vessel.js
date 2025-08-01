// Add shake method
shake() {
  this.shaking = true;
  this.shakeTime = 0;
  // Use more intense shake for emphasis
  this.shakeAmount = 8; // Increased from default (5)
  this.shakeDuration = 30; // 0.5 seconds at 60fps
} 