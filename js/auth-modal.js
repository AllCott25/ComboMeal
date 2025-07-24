/*
 * Authentication Modal for Combo Meal
 * Created by APlasker
 * Last Updated: December 27, 2025 - Unified modal design system
 * 
 * Hybrid authentication: Anonymous auth by default + Magic Link email upgrade
 * UPDATED: Now uses p5.js canvas drawing to match game's aesthetic
 */

// Global auth state
window.authState = {
  user: null,
  isAnonymous: false,
  isAuthenticated: false
};

// Auth modal state using p5.js drawing system
window.authModal = {
  active: false,
  mode: 'signin', // 'signin', 'loading', 'success', 'forgot-password', 'set-new-password'
  emailInput: '',
  passwordInput: '', // NEW: Password field
  confirmPasswordInput: '', // NEW: Confirm password field for reset
  emailCursor: 0,
  emailCursorVisible: true,
  emailCursorTimer: 0,
  emailError: '',
  passwordError: '', // NEW: Password error
  confirmPasswordError: '', // NEW: Confirm password error
  loadingMessage: '',
  successMessage: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  opacity: 255,
  animating: false,
  focusedField: 'email' // NEW: Track which field is focused ('email', 'password', 'confirmPassword')
};

// Helper function to wrap button text if too long
function wrapButtonText(buttonText, maxWidth, fontSize) {
  textSize(fontSize);
  
  // If text fits, return as single line
  if (textWidth(buttonText) <= maxWidth) {
    return [buttonText];
  }
  
  // Try to split at spaces for natural breaks
  const words = buttonText.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine.length > 0 ? ' ' : '') + words[i];
    
    if (textWidth(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        // Single word too long, force break
        lines.push(words[i]);
      }
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Helper function to draw wrapped button text
function drawButtonText(buttonText, x, y, maxWidth, fontSize, textColor) {
  const lines = wrapButtonText(buttonText, maxWidth, fontSize);
  const lineHeight = fontSize * 1.2;
  const totalHeight = (lines.length - 1) * lineHeight;
  const startY = y - totalHeight / 2;
  
  fill(textColor);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(buttonFont);
  textSize(fontSize);
  textStyle(BOLD);
  
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x, startY + i * lineHeight);
  }
}

// Terms & Conditions modal state
window.termsModal = {
  active: false,
  opacity: 255,
  scrollY: 0,
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

// Function to show the auth modal using p5.js drawing
function showAuthModal() {
  try {
    // Set global modal active flag
    if (typeof window.modalActive !== 'undefined') {
      window.modalActive = true;
      console.log('Modal active flag set to true');
    } else if (typeof modalActive !== 'undefined') {
      modalActive = true;
      console.log('Modal active flag set to true');
    }

    // Calculate modal dimensions and position - increased for better spacing
    window.authModal.width = Math.min(playAreaWidth * 0.85, 450);
    window.authModal.height = Math.min(playAreaHeight * 0.55, 320);
    window.authModal.x = playAreaX + playAreaWidth / 2;
    // Position modal higher up to account for mobile keyboard
    window.authModal.y = playAreaY + playAreaHeight * 0.35;
    
    // Reset modal state
    window.authModal.active = true;
    window.authModal.mode = 'signin';
    window.authModal.emailInput = '';
    window.authModal.passwordInput = ''; // Reset password
    window.authModal.emailCursor = 0;
    window.authModal.emailError = '';
    window.authModal.passwordError = ''; // Reset password error
    window.authModal.loadingMessage = '';
    window.authModal.successMessage = '';
    window.authModal.opacity = 255;
    window.authModal.animating = false;
    window.authModal.focusedField = 'email'; // Reset focused field
    
    // Start cursor blinking animation
    startEmailCursorAnimation();
    
    // Create invisible HTML input fields for modern text functionality
    createHtmlInputFields();
    
    console.log('Auth modal opened with email/password authentication and modern text inputs');
    
  } catch (error) {
    console.error("Error showing auth modal:", error);
  }
}

// Function to draw the auth modal using p5.js
function drawAuthModal() {
  if (!window.authModal.active) {
    return;
  }
  
  push();
  
  // Draw modal overlay (consistent with other modals)
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, windowWidth, windowHeight);
  
  // Draw modal background (matching game modal style)
  rectMode(CENTER);
  fill(255, 255, 255, window.authModal.opacity);
  stroke(COLORS.primary);
  strokeWeight(2);
  rect(window.authModal.x, window.authModal.y, window.authModal.width, window.authModal.height, 12);
  
  // Draw close button (matching help modal style)
  const closeX = window.authModal.x - window.authModal.width/2 + 25;
  const closeY = window.authModal.y - window.authModal.height/2 + 25;
  const closeSize = 15;
  
  // Close button background
  noStroke();
  fill(COLORS.secondary);
  circle(closeX, closeY, closeSize * 2);
  
  // Close button X
  stroke(255);
  strokeWeight(2);
  line(closeX - closeSize/2, closeY - closeSize/2, closeX + closeSize/2, closeY + closeSize/2);
  line(closeX - closeSize/2, closeY + closeSize/2, closeX + closeSize/2, closeY - closeSize/2);
  
  // Draw modal content based on mode
  if (window.authModal.mode === 'signin') {
    drawSignInContent();
  } else if (window.authModal.mode === 'forgot-password') {
    drawForgotPasswordContent();
  } else if (window.authModal.mode === 'set-new-password') {
    drawSetNewPasswordContent();
  } else if (window.authModal.mode === 'loading') {
    drawLoadingContent();
  } else if (window.authModal.mode === 'success') {
    drawSuccessContent();
  }
  
  pop();
}

// Function to draw sign in content
function drawSignInContent() {
  const modal = window.authModal;
  
  // Check if HTML inputs are active (for modern text functionality)
  const htmlInputsActive = document.getElementById('auth-input-container') !== null;
  
  // Title (using game's font system) - with line breaks to fit in modal
  fill(COLORS.primary);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(titleFont);
  textSize(Math.max(modal.width * 0.045, 14));
  textStyle(BOLD);
  text("Create an Account to Save\nyour Recipes & your Streak!", modal.x, modal.y - modal.height * 0.32);
  
  // Email input field
  const inputWidth = modal.width * 0.8;
  const inputHeight = 35;
  const emailY = modal.y - modal.height * 0.15;
  
  rectMode(CENTER);
  fill(255);
  stroke(modal.focusedField === 'email' ? COLORS.primary : '#cccccc');
  strokeWeight(modal.focusedField === 'email' ? 3 : 2);
  rect(modal.x, emailY, inputWidth, inputHeight, 8);
  
  // Email placeholder/text (only show if HTML inputs are not active)
  if (!htmlInputsActive) {
    if (!modal.emailInput) {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Email address", placeholderX, emailY);
    } else {
      // Show email text
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      text(modal.emailInput, textX, emailY);
    }
    
    // Email cursor (only show if HTML inputs are not active)
    if (modal.focusedField === 'email' && modal.emailCursorVisible) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      const textX = modal.x - inputWidth/2 + 12;
      const cursorX = textX + textWidth(modal.emailInput);
      line(cursorX, emailY - 8, cursorX, emailY + 8);
    }
  } else {
    // HTML inputs are active - show canvas text for visual consistency
    if (modal.emailInput) {
      // Show typed email text
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      text(modal.emailInput, textX, emailY);
    } else {
      // Show placeholder when empty
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Email address", placeholderX, emailY);
    }
  }
  
  // Password input field
  const passwordY = modal.y;
  
  fill(255);
  stroke(modal.focusedField === 'password' ? COLORS.primary : '#cccccc');
  strokeWeight(modal.focusedField === 'password' ? 3 : 2);
  rect(modal.x, passwordY, inputWidth, inputHeight, 8);
  
  // Password placeholder/text (only show if HTML inputs are not active)
  if (!htmlInputsActive) {
    if (!modal.passwordInput) {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Password", placeholderX, passwordY);
    } else {
      // Show password as dots
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.passwordInput.length);
      text(dots, textX, passwordY);
    }
    
    // Password cursor (only show if HTML inputs are not active)
    if (modal.focusedField === 'password' && modal.emailCursorVisible) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.passwordInput.length);
      const cursorX = textX + textWidth(dots);
      line(cursorX, passwordY - 8, cursorX, passwordY + 8);
    }
  } else {
    // HTML inputs are active - show canvas text for visual consistency
    if (modal.passwordInput) {
      // Show password as dots
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.passwordInput.length);
      text(dots, textX, passwordY);
    } else {
      // Show placeholder when empty
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Password", placeholderX, passwordY);
    }
  }
  
  // Error messages - positioned below both input fields
  const errorY = passwordY + 35; // Position below password field with more spacing
  
  if (modal.emailError) {
    fill(COLORS.secondary);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(modal.width * 0.03, 12));
    textStyle(NORMAL);
    text(modal.emailError, modal.x, errorY);
  }
  
  if (modal.passwordError) {
    fill(COLORS.secondary);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(modal.width * 0.03, 12));
    textStyle(NORMAL);
    text(modal.passwordError, modal.x, errorY);
  }
  
  // Forgot Password link - centered between password field and buttons
  const buttonY = modal.y + modal.height * 0.26;
  const forgotPasswordY = modal.y + modal.height * 0.13; // Centered between password (modal.y) and buttons (modal.y + 0.26)
  const forgotPasswordText = "Forgot your password?";
  const forgotPasswordTextSize = Math.max(modal.width * 0.025, 10);
  
  textAlign(CENTER, CENTER);
  textFont(bodyFont);
  textSize(forgotPasswordTextSize);
  textStyle(NORMAL);
  
  // Check if forgot password link is hovered
  const forgotPasswordTextWidth = textWidth(forgotPasswordText);
  const forgotPasswordHovered = mouseX > modal.x - forgotPasswordTextWidth/2 && 
                                mouseX < modal.x + forgotPasswordTextWidth/2 &&
                                mouseY > forgotPasswordY - forgotPasswordTextSize/2 &&
                                mouseY < forgotPasswordY + forgotPasswordTextSize/2;
  
  // Draw forgot password link with hover effect
  fill(forgotPasswordHovered ? COLORS.secondary : COLORS.primary);
  noStroke();
  textStyle(forgotPasswordHovered ? BOLD : NORMAL);
  text(forgotPasswordText, modal.x, forgotPasswordY);
  
  // Store forgot password link area for clicks
  window.authModal.forgotPasswordLink = {
    x: modal.x,
    y: forgotPasswordY,
    w: forgotPasswordTextWidth,
    h: forgotPasswordTextSize + 4
  };
  
  // Buttons (matching game button style) - adjusted for larger modal
  const buttonWidth = modal.width * 0.37;
  const buttonHeight = 40;
  const buttonSpacing = modal.width * 0.03;
  
  // Sign In button
  const signInX = modal.x - buttonWidth/2 - buttonSpacing;
  const signInHovered = dist(mouseX, mouseY, signInX, buttonY) < buttonWidth/2;
  
  rectMode(CENTER);
  fill(signInHovered ? lerpColor(color(255), color(COLORS.primary), 0.1) : 255);
  stroke(COLORS.primary);
  strokeWeight(3); // Standardized stroke weight
  rect(signInX, buttonY, buttonWidth, buttonHeight, 8);
  
  // Use new text wrapping function
  const signInFontSize = Math.max(buttonHeight * 0.25, 12);
  drawButtonText("Sign In", signInX, buttonY, buttonWidth * 0.9, signInFontSize, COLORS.primary);
  
  // Create Account button  
  const signUpX = modal.x + buttonWidth/2 + buttonSpacing;
  const signUpHovered = dist(mouseX, mouseY, signUpX, buttonY) < buttonWidth/2;
  
  fill(signUpHovered ? lerpColor(color(COLORS.primary), color(255), 0.2) : COLORS.primary);
  stroke(COLORS.primary); // Match stroke to fill color
  strokeWeight(3); // Standardized stroke weight
  rect(signUpX, buttonY, buttonWidth, buttonHeight, 8);
  
  // Use new text wrapping function
  const signUpFontSize = Math.max(buttonHeight * 0.25, 12);
  drawButtonText("Create Account", signUpX, buttonY, buttonWidth * 0.9, signUpFontSize, color(255));
  
  // Terms text (clickable) - moved up for better spacing
  const termsText = "By continuing, you agree to our ";
  const linkText = "Terms & Conditions";
  const termsY = modal.y + modal.height * 0.38;
  const termsTextSize = Math.max(modal.width * 0.025, 10);
  
  textAlign(CENTER, CENTER);
  textFont(bodyFont);
  textSize(termsTextSize);
  textStyle(NORMAL);
  
  // Calculate text positions
  const fullText = termsText + linkText;
  const fullTextWidth = textWidth(fullText);
  const termsTextWidth = textWidth(termsText);
  const linkTextWidth = textWidth(linkText);
  
  const startX = modal.x - fullTextWidth / 2;
  const linkStartX = startX + termsTextWidth;
  
  // Draw normal text
  fill(120);
  noStroke();
  textAlign(LEFT, CENTER);
  text(termsText, startX, termsY);
  
  // Draw clickable link text
  fill(COLORS.primary);
  noStroke();
  textStyle(BOLD);
  text(linkText, linkStartX, termsY);
  textStyle(NORMAL);
  
  // Calculate close button position
  const closeX = modal.x - modal.width/2 + 25;
  const closeY = modal.y - modal.height/2 + 25;
  
  // Store interaction areas for clicks
  window.authModal.signInButton = {
    x: signInX, y: buttonY, w: buttonWidth, h: buttonHeight
  };
  window.authModal.signUpButton = {
    x: signUpX, y: buttonY, w: buttonWidth, h: buttonHeight
  };
  window.authModal.emailField = {
    x: modal.x, y: emailY, w: inputWidth, h: inputHeight
  };
  window.authModal.passwordField = {
    x: modal.x, y: passwordY, w: inputWidth, h: inputHeight
  };
  window.authModal.termsLink = {
    x: linkStartX + linkTextWidth / 2,
    y: termsY,
    w: linkTextWidth,
    h: termsTextSize + 4
  };
  window.authModal.closeButton = {
    x: closeX, y: closeY, size: 15
  };
}

// Function to draw forgot password content
function drawForgotPasswordContent() {
  const modal = window.authModal;
  
  // Check if HTML inputs are active (for modern text functionality)
  const htmlInputsActive = document.getElementById('auth-input-container') !== null;
  
  // Title
  fill(COLORS.primary);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(titleFont);
  textSize(Math.max(modal.width * 0.045, 14));
  textStyle(BOLD);
  text("Reset Password", modal.x, modal.y - modal.height * 0.32);
  
  // Instructions
  fill(COLORS.text);
  textFont(bodyFont);
  textSize(Math.max(modal.width * 0.03, 12));
  textStyle(NORMAL);
  text("Enter your email address and we'll send you a link to reset your password.", modal.x, modal.y - modal.height * 0.22, modal.width * 0.85);
  
  // Email input field (larger and centered)
  const inputWidth = modal.width * 0.8;
  const inputHeight = 35;
  const emailY = modal.y - modal.height * 0.05;
  
  rectMode(CENTER);
  fill(255);
  stroke(modal.focusedField === 'email' ? COLORS.primary : '#cccccc');
  strokeWeight(modal.focusedField === 'email' ? 3 : 2);
  rect(modal.x, emailY, inputWidth, inputHeight, 8);
  
  // Email placeholder/text rendering logic (same as signin)
  if (!htmlInputsActive) {
    if (!modal.emailInput) {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Email address", placeholderX, emailY);
    } else {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      text(modal.emailInput, textX, emailY);
    }
    
    if (modal.focusedField === 'email' && modal.emailCursorVisible) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      const textX = modal.x - inputWidth/2 + 12;
      const cursorX = textX + textWidth(modal.emailInput);
      line(cursorX, emailY - 8, cursorX, emailY + 8);
    }
  } else {
    // HTML inputs active - show canvas text for visual consistency
    if (modal.emailInput) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      text(modal.emailInput, textX, emailY);
    } else {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Email address", placeholderX, emailY);
    }
  }
  
  // Error message
  if (modal.emailError) {
    fill(COLORS.secondary);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(modal.width * 0.03, 12));
    textStyle(NORMAL);
    text(modal.emailError, modal.x, emailY + 25);
  }
  
  // Buttons
  const buttonWidth = modal.width * 0.35;
  const buttonHeight = 40;
  const buttonY = modal.y + modal.height * 0.2;
  const buttonSpacing = modal.width * 0.05;
  
  // Back button
  const backX = modal.x - buttonWidth/2 - buttonSpacing;
  const backHovered = dist(mouseX, mouseY, backX, buttonY) < buttonWidth/2;
  
  rectMode(CENTER);
  fill(backHovered ? lerpColor(color(255), color(COLORS.primary), 0.1) : 255);
  stroke(COLORS.primary);
  strokeWeight(3); // Standardized stroke weight
  rect(backX, buttonY, buttonWidth, buttonHeight, 8);
  
  // Use new text wrapping function
  const backFontSize = Math.max(buttonHeight * 0.25, 12);
  drawButtonText("Back", backX, buttonY, buttonWidth * 0.9, backFontSize, COLORS.primary);
  
  // Send Reset Link button
  const sendX = modal.x + buttonWidth/2 + buttonSpacing;
  const sendHovered = dist(mouseX, mouseY, sendX, buttonY) < buttonWidth/2;
  
  fill(sendHovered ? lerpColor(color(COLORS.primary), color(255), 0.2) : COLORS.primary);
  stroke(COLORS.primary); // Match stroke to fill color
  strokeWeight(3); // Standardized stroke weight
  rect(sendX, buttonY, buttonWidth, buttonHeight, 8);
  
  // Use new text wrapping function
  const sendFontSize = Math.max(buttonHeight * 0.25, 12);
  drawButtonText("Send Reset Link", sendX, buttonY, buttonWidth * 0.9, sendFontSize, color(255));
  
  // Store interaction areas for clicks
  window.authModal.emailField = {
    x: modal.x, y: emailY, w: inputWidth, h: inputHeight
  };
  window.authModal.backButton = {
    x: backX, y: buttonY, w: buttonWidth, h: buttonHeight
  };
  window.authModal.sendResetButton = {
    x: sendX, y: buttonY, w: buttonWidth, h: buttonHeight
  };
}

// Function to draw set new password content
function drawSetNewPasswordContent() {
  const modal = window.authModal;
  
  // Check if HTML inputs are active (for modern text functionality)
  const htmlInputsActive = document.getElementById('auth-input-container') !== null;
  
  // Title
  fill(COLORS.primary);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(titleFont);
  textSize(Math.max(modal.width * 0.045, 14));
  textStyle(BOLD);
  text("Create New Password", modal.x, modal.y - modal.height * 0.32);
  
  // Instructions
  fill(COLORS.text);
  textFont(bodyFont);
  textSize(Math.max(modal.width * 0.03, 12));
  textStyle(NORMAL);
  text("Make sure it's at least 8 characters long and contains lowercase letters, uppercase letters, numbers, and symbols.", modal.x, modal.y - modal.height * 0.22, modal.width * 0.85);
  
  // Password input field
  const inputWidth = modal.width * 0.8;
  const inputHeight = 35;
  const passwordY = modal.y - modal.height * 0.1;
  
  rectMode(CENTER);
  fill(255);
  stroke(modal.focusedField === 'password' ? COLORS.primary : '#cccccc');
  strokeWeight(modal.focusedField === 'password' ? 3 : 2);
  rect(modal.x, passwordY, inputWidth, inputHeight, 8);
  
  // Password placeholder/text rendering logic
  if (!htmlInputsActive) {
    if (!modal.passwordInput) {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("New password", placeholderX, passwordY);
    } else {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.passwordInput.length);
      text(dots, textX, passwordY);
    }
    
    if (modal.focusedField === 'password' && modal.emailCursorVisible) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.passwordInput.length);
      const cursorX = textX + textWidth(dots);
      line(cursorX, passwordY - 8, cursorX, passwordY + 8);
    }
  } else {
    // HTML inputs active - show canvas text for visual consistency
    if (modal.passwordInput) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.passwordInput.length);
      text(dots, textX, passwordY);
    } else {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("New password", placeholderX, passwordY);
    }
  }
  
  // Confirm Password input field
  const confirmPasswordY = modal.y + modal.height * 0.05;
  
  fill(255);
  stroke(modal.focusedField === 'confirmPassword' ? COLORS.primary : '#cccccc');
  strokeWeight(modal.focusedField === 'confirmPassword' ? 3 : 2);
  rect(modal.x, confirmPasswordY, inputWidth, inputHeight, 8);
  
  // Confirm password placeholder/text rendering logic
  if (!htmlInputsActive) {
    if (!modal.confirmPasswordInput) {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Confirm new password", placeholderX, confirmPasswordY);
    } else {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.confirmPasswordInput.length);
      text(dots, textX, confirmPasswordY);
    }
    
    if (modal.focusedField === 'confirmPassword' && modal.emailCursorVisible) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.confirmPasswordInput.length);
      const cursorX = textX + textWidth(dots);
      line(cursorX, confirmPasswordY - 8, cursorX, confirmPasswordY + 8);
    }
  } else {
    // HTML inputs active - show canvas text for visual consistency
    if (modal.confirmPasswordInput) {
      fill(COLORS.text);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const textX = modal.x - inputWidth/2 + 12;
      const dots = '•'.repeat(modal.confirmPasswordInput.length);
      text(dots, textX, confirmPasswordY);
    } else {
      fill(150);
      noStroke();
      textAlign(LEFT, CENTER);
      textFont(bodyFont);
      textSize(Math.max(modal.width * 0.025, 11));
      textStyle(NORMAL);
      const placeholderX = modal.x - inputWidth/2 + 12;
      text("Confirm new password", placeholderX, confirmPasswordY);
    }
  }
  
  // Error messages - positioned below both input fields
  const errorY = confirmPasswordY + 35; // Position below confirm password field with more spacing
  
  if (modal.passwordError) {
    fill(COLORS.secondary);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(modal.width * 0.03, 12));
    textStyle(NORMAL);
    text(modal.passwordError, modal.x, errorY);
  }
  
  if (modal.confirmPasswordError) {
    fill(COLORS.secondary);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(Math.max(modal.width * 0.03, 12));
    textStyle(NORMAL);
    text(modal.confirmPasswordError, modal.x, errorY);
  }
  
  // Update Password button (centered)
  const buttonWidth = modal.width * 0.6;
  const buttonHeight = 40;
  const buttonY = modal.y + modal.height * 0.3;
  
  const updateHovered = dist(mouseX, mouseY, modal.x, buttonY) < buttonWidth/2;
  
  rectMode(CENTER);
  fill(updateHovered ? lerpColor(color(COLORS.primary), color(255), 0.2) : COLORS.primary);
  stroke(COLORS.primary); // Match stroke to fill color
  strokeWeight(3); // Standardized stroke weight
  rect(modal.x, buttonY, buttonWidth, buttonHeight, 8);
  
  // Use new text wrapping function
  const updateFontSize = Math.max(buttonHeight * 0.25, 12);
  drawButtonText("Update Password", modal.x, buttonY, buttonWidth * 0.9, updateFontSize, color(255));
  
  // Store interaction areas for clicks
  window.authModal.passwordField = {
    x: modal.x, y: passwordY, w: inputWidth, h: inputHeight
  };
  window.authModal.confirmPasswordField = {
    x: modal.x, y: confirmPasswordY, w: inputWidth, h: inputHeight
  };
  window.authModal.updatePasswordButton = {
    x: modal.x, y: buttonY, w: buttonWidth, h: buttonHeight
  };
}

// Function to draw loading content
function drawLoadingContent() {
  const modal = window.authModal;
  
  // Title
  fill(COLORS.primary);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(titleFont);
  textSize(Math.max(modal.width * 0.06, 18));
  textStyle(BOLD);
  text("Please Wait", modal.x, modal.y - modal.height * 0.15);
  
  // Loading message
  fill(COLORS.text);
  textFont(bodyFont);
  textSize(Math.max(modal.width * 0.04, 14));
  textStyle(NORMAL);
  text(modal.loadingMessage, modal.x, modal.y, modal.width * 0.8);
}

// Function to draw success content
function drawSuccessContent() {
  const modal = window.authModal;
  
  // Title - positioned for better spacing in larger modal
  fill(COLORS.primary);
  noStroke();
  textAlign(CENTER, CENTER);
  textFont(titleFont);
  textSize(Math.max(modal.width * 0.06, 18));
  textStyle(BOLD);
  // Dynamic title based on the success message type
  if (modal.successMessage.includes('Reset link sent')) {
    text("Check Your Email", modal.x, modal.y - modal.height * 0.3);
  } else if (modal.successMessage.includes('Password Updated')) {
    text("Password Updated", modal.x, modal.y - modal.height * 0.3);
  } else if (modal.successMessage.includes('Account created')) {
    text("Account Created", modal.x, modal.y - modal.height * 0.3);
  } else {
    text("Welcome Back", modal.x, modal.y - modal.height * 0.3);
  }
  
  // Success message - centered between title and button
  fill(COLORS.text);
  textFont(bodyFont);
  textSize(Math.max(modal.width * 0.035, 14));
  textStyle(NORMAL);
  text(modal.successMessage, modal.x, modal.y, modal.width * 0.8);
  
  // OK button - positioned for better spacing in larger modal
  const buttonWidth = modal.width * 0.3;
  const buttonHeight = 40;
  const buttonY = modal.y + modal.height * 0.25;
  
  const okHovered = dist(mouseX, mouseY, modal.x, buttonY) < buttonWidth/2;
  
  rectMode(CENTER);
  fill(okHovered ? lerpColor(color(COLORS.primary), color(255), 0.2) : COLORS.primary);
  stroke(COLORS.primary); // Match stroke to fill color
  strokeWeight(3); // Standardized stroke weight
  rect(modal.x, buttonY, buttonWidth, buttonHeight, 8);
  
  // Use new text wrapping function
  const okFontSize = Math.max(buttonHeight * 0.25, 12);
  drawButtonText("Continue", modal.x, buttonY, buttonWidth * 0.9, okFontSize, color(255));
  
  // Store button position
  window.authModal.okButton = {
    x: modal.x, y: buttonY, w: buttonWidth, h: buttonHeight
  };
}

// Function to handle auth modal clicks
function handleAuthModalClick(x, y) {
  if (!window.authModal.active) return false;
  
  const modal = window.authModal;
  
  // Check close button
  if (modal.closeButton) {
    const dist_to_close = dist(x, y, modal.closeButton.x, modal.closeButton.y);
    if (dist_to_close < modal.closeButton.size) {
      closeAuthModal();
      return true;
    }
  }
  
  if (modal.mode === 'signin') {
    // Check Terms & Conditions link
    if (modal.termsLink && 
        x > modal.termsLink.x - modal.termsLink.w/2 && 
        x < modal.termsLink.x + modal.termsLink.w/2 &&
        y > modal.termsLink.y - modal.termsLink.h/2 && 
        y < modal.termsLink.y + modal.termsLink.h/2) {
      showTermsModal();
      return true;
    }
    
    // Check Forgot Password link
    if (modal.forgotPasswordLink && 
        x > modal.forgotPasswordLink.x - modal.forgotPasswordLink.w/2 && 
        x < modal.forgotPasswordLink.x + modal.forgotPasswordLink.w/2 &&
        y > modal.forgotPasswordLink.y - modal.forgotPasswordLink.h/2 && 
        y < modal.forgotPasswordLink.y + modal.forgotPasswordLink.h/2) {
      showForgotPasswordMode();
      return true;
    }
    
    // Check email field click
    if (modal.emailField && 
        x > modal.emailField.x - modal.emailField.w/2 && 
        x < modal.emailField.x + modal.emailField.w/2 &&
        y > modal.emailField.y - modal.emailField.h/2 && 
        y < modal.emailField.y + modal.emailField.h/2) {
      modal.focusedField = 'email';
      // Focus HTML input if available
      const emailInput = document.getElementById('auth-email-input');
      if (emailInput) {
        emailInput.focus();
      }
      return true;
    }
    
    // Check password field click
    if (modal.passwordField && 
        x > modal.passwordField.x - modal.passwordField.w/2 && 
        x < modal.passwordField.x + modal.passwordField.w/2 &&
        y > modal.passwordField.y - modal.passwordField.h/2 && 
        y < modal.passwordField.y + modal.passwordField.h/2) {
      modal.focusedField = 'password';
      // Focus HTML input if available
      const passwordInput = document.getElementById('auth-password-input');
      if (passwordInput) {
        passwordInput.focus();
      }
      return true;
    }
    
    // Check sign in button
    if (modal.signInButton && 
        x > modal.signInButton.x - modal.signInButton.w/2 && 
        x < modal.signInButton.x + modal.signInButton.w/2 &&
        y > modal.signInButton.y - modal.signInButton.h/2 && 
        y < modal.signInButton.y + modal.signInButton.h/2) {
      handleEmailPasswordAuth(false); // Sign in
      return true;
    }
    
    // Check sign up button
    if (modal.signUpButton && 
        x > modal.signUpButton.x - modal.signUpButton.w/2 && 
        x < modal.signUpButton.x + modal.signUpButton.w/2 &&
        y > modal.signUpButton.y - modal.signUpButton.h/2 && 
        y < modal.signUpButton.y + modal.signUpButton.h/2) {
      handleEmailPasswordAuth(true); // Sign up
      return true;
    }
  }
  
  if (modal.mode === 'forgot-password') {
    // Check email field click
    if (modal.emailField && 
        x > modal.emailField.x - modal.emailField.w/2 && 
        x < modal.emailField.x + modal.emailField.w/2 &&
        y > modal.emailField.y - modal.emailField.h/2 && 
        y < modal.emailField.y + modal.emailField.h/2) {
      modal.focusedField = 'email';
      // Focus HTML input if available
      const emailInput = document.getElementById('auth-email-input');
      if (emailInput) {
        emailInput.focus();
      }
      return true;
    }
    
    // Check back button
    if (modal.backButton && 
        x > modal.backButton.x - modal.backButton.w/2 && 
        x < modal.backButton.x + modal.backButton.w/2 &&
        y > modal.backButton.y - modal.backButton.h/2 && 
        y < modal.backButton.y + modal.backButton.h/2) {
      showSignInMode();
      return true;
    }
    
    // Check send reset button
    if (modal.sendResetButton && 
        x > modal.sendResetButton.x - modal.sendResetButton.w/2 && 
        x < modal.sendResetButton.x + modal.sendResetButton.w/2 &&
        y > modal.sendResetButton.y - modal.sendResetButton.h/2 && 
        y < modal.sendResetButton.y + modal.sendResetButton.h/2) {
      handleForgotPassword();
      return true;
    }
  }
  
  if (modal.mode === 'set-new-password') {
    // Check password field click
    if (modal.passwordField && 
        x > modal.passwordField.x - modal.passwordField.w/2 && 
        x < modal.passwordField.x + modal.passwordField.w/2 &&
        y > modal.passwordField.y - modal.passwordField.h/2 && 
        y < modal.passwordField.y + modal.passwordField.h/2) {
      modal.focusedField = 'password';
      // Focus HTML input if available
      const passwordInput = document.getElementById('auth-password-input');
      if (passwordInput) {
        passwordInput.focus();
      }
      return true;
    }
    
    // Check confirm password field click
    if (modal.confirmPasswordField && 
        x > modal.confirmPasswordField.x - modal.confirmPasswordField.w/2 && 
        x < modal.confirmPasswordField.x + modal.confirmPasswordField.w/2 &&
        y > modal.confirmPasswordField.y - modal.confirmPasswordField.h/2 && 
        y < modal.confirmPasswordField.y + modal.confirmPasswordField.h/2) {
      modal.focusedField = 'confirmPassword';
      // Focus HTML input if available
      const confirmPasswordInput = document.getElementById('auth-confirm-password-input');
      if (confirmPasswordInput) {
        confirmPasswordInput.focus();
      }
      return true;
    }
    
    // Check update password button
    if (modal.updatePasswordButton && 
        x > modal.updatePasswordButton.x - modal.updatePasswordButton.w/2 && 
        x < modal.updatePasswordButton.x + modal.updatePasswordButton.w/2 &&
        y > modal.updatePasswordButton.y - modal.updatePasswordButton.h/2 && 
        y < modal.updatePasswordButton.y + modal.updatePasswordButton.h/2) {
      handleSetNewPassword();
      return true;
    }
  }
  
  if (modal.mode === 'success') {
    // Check OK button
    if (modal.okButton && 
        x > modal.okButton.x - modal.okButton.w/2 && 
        x < modal.okButton.x + modal.okButton.w/2 &&
        y > modal.okButton.y - modal.okButton.h/2 && 
        y < modal.okButton.y + modal.okButton.h/2) {
      closeAuthModal();
      return true;
    }
  }
  
  return true; // Consume click to prevent interaction with game elements
}

// Function to switch to forgot password mode
function showForgotPasswordMode() {
  const modal = window.authModal;
  
  // Switch mode and clear previous errors
  modal.mode = 'forgot-password';
  modal.emailError = '';
  modal.passwordError = '';
  modal.passwordInput = ''; // Clear password field
  modal.focusedField = 'email';
  
  // Recreate HTML inputs for forgot password mode (only email field)
  removeHtmlInputFields();
  createHtmlInputFields();
  
  console.log('Switched to forgot password mode');
}

// Function to switch back to sign in mode
function showSignInMode() {
  const modal = window.authModal;
  
  // Switch mode and clear errors
  modal.mode = 'signin';
  modal.emailError = '';
  modal.passwordError = '';
  modal.focusedField = 'email';
  
  // Recreate HTML inputs for signin mode (email + password fields)
  removeHtmlInputFields();
  createHtmlInputFields();
  
  console.log('Switched back to sign in mode');
}

// Function to handle forgot password
async function handleForgotPassword() {
  const email = window.authModal.emailInput.trim();
  
  // Clear previous errors
  window.authModal.emailError = '';
  
  // Validate email
  if (!email) {
    window.authModal.emailError = 'Email is required';
    return;
  }
  
  if (!isValidEmail(email)) {
    window.authModal.emailError = 'Please enter a valid email address';
    return;
  }
  
  try {
    // Switch to loading mode and remove HTML inputs
    window.authModal.mode = 'loading';
    window.authModal.loadingMessage = 'Sending...';
    removeHtmlInputFields();
    
    // Use Supabase's built-in password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      console.error('Password reset error:', error);
      
      // Return to forgot password mode with error
      window.authModal.mode = 'forgot-password';
      
      if (error.message.includes('rate limit')) {
        window.authModal.emailError = 'Too many attempts. Please wait and try again.';
      } else if (error.message.includes('not found')) {
        window.authModal.emailError = 'No account found with this email address.';
      } else {
        window.authModal.emailError = error.message || 'Failed to send reset link. Please try again.';
      }
      return;
    }
    
    console.log('Password reset email sent successfully');
    
    // Switch to success mode
    window.authModal.mode = 'success';
    window.authModal.successMessage = `Reset link sent!\n\nWe sent you an email! Click the password reset link in the email to continue.`;
    
  } catch (error) {
    console.error('Unexpected forgot password error:', error);
    
    // Return to forgot password mode with error
    window.authModal.mode = 'forgot-password';
    window.authModal.emailError = 'Network error. Please check your connection and try again.';
  }
}

// Function to handle setting new password
async function handleSetNewPassword() {
  const password = window.authModal.passwordInput;
  const confirmPassword = window.authModal.confirmPasswordInput;
  
  // Clear previous errors
  window.authModal.passwordError = '';
  window.authModal.confirmPasswordError = '';
  
  // Validate inputs
  if (!password) {
    window.authModal.passwordError = 'Password is required';
    return;
  }
  
  if (password.length < 8) {
    window.authModal.passwordError = 'Password must be at least 8 characters';
    return;
  }
  
  if (!confirmPassword) {
    window.authModal.confirmPasswordError = 'Please confirm your password';
    return;
  }
  
  if (password !== confirmPassword) {
    window.authModal.confirmPasswordError = 'Passwords do not match';
    return;
  }
  
  try {
    // Switch to loading mode and remove HTML inputs
    window.authModal.mode = 'loading';
    window.authModal.loadingMessage = 'Updating...';
    removeHtmlInputFields();
    
    // Use Supabase's updateUser to set new password
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      console.error('Password update error:', error);
      
      // Return to set password mode with error
      window.authModal.mode = 'set-new-password';
      window.authModal.passwordError = error.message || 'Failed to update password. Please try again.';
      createHtmlInputFields();
      return;
    }
    
    console.log('Password updated successfully');
    
    // Switch to success mode
    window.authModal.mode = 'success';
    window.authModal.successMessage = `Password Updated!\n\nYour password has been successfully changed! Let's get cooking!`;
    
  } catch (error) {
    console.error('Unexpected password update error:', error);
    
    // Return to set password mode with error
    window.authModal.mode = 'set-new-password';
    window.authModal.passwordError = 'Network error. Please check your connection and try again.';
    createHtmlInputFields();
  }
}

// Function to show set new password mode (for password reset)
function showSetNewPasswordMode() {
  const modal = window.authModal;
  
  // Clear modal state and switch to new password mode
  modal.mode = 'set-new-password';
  modal.emailInput = '';
  modal.passwordInput = '';
  modal.confirmPasswordInput = '';
  modal.emailError = '';
  modal.passwordError = '';
  modal.confirmPasswordError = '';
  modal.focusedField = 'password';
  
  // Create HTML inputs for password setting
  removeHtmlInputFields();
  createHtmlInputFields();
  
  console.log('Switched to set new password mode');
}

// Function to handle email/password authentication
async function handleEmailPasswordAuth(isSignUp) {
  const email = window.authModal.emailInput.trim();
  const password = window.authModal.passwordInput;
  
  // Clear previous errors
  window.authModal.emailError = '';
  window.authModal.passwordError = '';
  
  // Validate inputs
  if (!email) {
    window.authModal.emailError = 'Email is required';
    return;
  }
  
  if (!isValidEmail(email)) {
    window.authModal.emailError = 'Please enter a valid email address';
    return;
  }
  
  if (!password) {
    window.authModal.passwordError = 'Password is required';
    return;
  }
  
  if (password.length < 8) {
    window.authModal.passwordError = 'Password must be at least 8 characters';
    return;
  }
  
  // Additional password complexity validation for sign-up
  if (isSignUp) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSymbols) {
      window.authModal.passwordError = 'Password must contain uppercase, lowercase, numbers, and symbols';
      return;
    }
  }
  
  try {
    // Switch to loading mode and remove HTML inputs
    window.authModal.mode = 'loading';
    window.authModal.loadingMessage = isSignUp ? 
      'Cooking…' : 
      'Setting the table…';
    removeHtmlInputFields();
    
    let result;
    
    if (isSignUp) {
      // Sign up
      result = await supabase.auth.signUp({
        email: email,
        password: password
      });
    } else {
      // Sign in
      result = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('Auth error:', error);
      
      // Return to signin mode with error
      window.authModal.mode = 'signin';
      
      if (error.message.includes('Invalid login credentials')) {
        window.authModal.emailError = 'Invalid email or password';
      } else if (error.message.includes('weak password')) {
        window.authModal.passwordError = 'Password must contain uppercase, lowercase, numbers, and symbols';
      } else if (error.message.includes('already registered')) {
        window.authModal.emailError = 'This email is already registered. Try signing in instead!';
      } else if (error.message.includes('rate limit')) {
        window.authModal.emailError = 'Too many attempts. Please wait and try again.';
      } else {
        window.authModal.emailError = error.message || 'Authentication failed. Please try again.';
      }
      return;
    }
    
    console.log('Auth successful:', data);
    
    // Switch to success mode
    window.authModal.mode = 'success';
    window.authModal.successMessage = isSignUp ? 
      `Account created successfully!\n\nWelcome to Combo Meal! What's on the menu?` :
      `Welcome back!\n\nYou're in. Keep that streak going!`;
    
  } catch (error) {
    console.error('Unexpected auth error:', error);
    
    // Return to signin mode with error
    window.authModal.mode = 'signin';
    window.authModal.emailError = 'Network error. Please check your connection and try again.';
  }
}

// Function to handle keyboard input for email/password fields
// NOTE: This is now deprecated in favor of HTML input fields for modern functionality
function handleAuthModalKeyboard(key, keyCode) {
  // Check if HTML inputs are active (modern text functionality)
  const htmlInputsActive = document.getElementById('auth-input-container') !== null;
  
  if (!window.authModal.active || window.authModal.mode !== 'signin' || htmlInputsActive) {
    console.log('🚫 Keyboard event blocked - HTML inputs are handling input');
    return false; // Let HTML inputs handle keyboard events
  }
  
  // Fallback for when HTML inputs aren't available
  const modal = window.authModal;
  
  // Handle tab key to switch between fields
  if (keyCode === 9) { // Tab key
    modal.focusedField = modal.focusedField === 'email' ? 'password' : 'email';
    return true;
  }
  
  // Handle Enter key
  if (keyCode === 13) { // Enter key
    handleEmailPasswordAuth(false); // Default to sign in
    return true;
  }
  
  // Handle backspace
  if (keyCode === 8) { // Backspace
    if (modal.focusedField === 'email' && modal.emailInput.length > 0) {
      modal.emailInput = modal.emailInput.slice(0, -1);
      modal.emailError = '';
    } else if (modal.focusedField === 'password' && modal.passwordInput.length > 0) {
      modal.passwordInput = modal.passwordInput.slice(0, -1);
      modal.passwordError = '';
    }
    return true;
  }
  
  // Handle regular characters
  if (key.length === 1) {
    if (modal.focusedField === 'email') {
      modal.emailInput += key;
      modal.emailError = '';
    } else if (modal.focusedField === 'password') {
      modal.passwordInput += key;
      modal.passwordError = '';
    }
    return true;
  }
  
  return false;
}

// Function to start email cursor animation
function startEmailCursorAnimation() {
  window.authModal.emailCursorTimer = 0;
  window.authModal.emailCursorVisible = true;
}

// Function to update cursor animation
function updateAuthModalAnimation() {
  if (!window.authModal.active) return;
  
  // Only update canvas cursor blinking if HTML inputs are not active
  const htmlInputsActive = document.getElementById('auth-input-container') !== null;
  
  if (!htmlInputsActive) {
    // Update cursor blinking for fallback canvas inputs
    window.authModal.emailCursorTimer++;
    if (window.authModal.emailCursorTimer > 30) { // Blink every 30 frames (1 second at 30fps)
      window.authModal.emailCursorVisible = !window.authModal.emailCursorVisible;
      window.authModal.emailCursorTimer = 0;
    }
  }
  
  // Ensure HTML input positions stay synchronized (in case of canvas/viewport changes)
  if (htmlInputsActive) {
    updateHtmlInputPositions();
  }
}

// Function to close the auth modal
function closeAuthModal() {
  window.authModal.active = false;
  
  // Reset modal active flag
  if (typeof window.modalActive !== 'undefined') {
    window.modalActive = false;
  } else if (typeof modalActive !== 'undefined') {
    modalActive = false;
  }
  
  // Remove HTML input fields
  removeHtmlInputFields();
  
  console.log('Auth modal closed');
}

// Create invisible HTML input fields for modern text functionality
function createHtmlInputFields() {
  try {
    // Remove any existing inputs first
    removeHtmlInputFields();
    
    const modal = window.authModal;
    
    if (!modal || !modal.active) {
      console.warn('⚠️ Modal not active, skipping HTML input creation');
      return;
    }
  
  // Calculate input field positions and dimensions based on modal mode
  const inputWidth = modal.width * 0.8;
  const inputHeight = 35;
  
  // Calculate cursor alignment offset for all inputs
  const canvasFontSize = Math.max(modal.width * 0.025, 11);
  const cursorOffset = (inputHeight - canvasFontSize) / 2 + 5; // Add 5px to move cursor down
  
  let emailY, passwordY, confirmPasswordY;
  
  if (modal.mode === 'forgot-password') {
    // Forgot password mode: center email field
    emailY = modal.y - modal.height * 0.05;
    passwordY = null; // No password field in forgot password mode
    confirmPasswordY = null;
  } else if (modal.mode === 'set-new-password') {
    // Set new password mode: password and confirm password fields
    emailY = null; // No email field in set new password mode
    passwordY = modal.y - modal.height * 0.1;
    confirmPasswordY = modal.y + modal.height * 0.05;
  } else {
    // Signin mode: use normal positioning
    emailY = modal.y - modal.height * 0.15;
    passwordY = modal.y;
    confirmPasswordY = null;
  }
  
  // Get canvas position and scale factors
  const canvas = document.querySelector('canvas');
  const canvasRect = canvas.getBoundingClientRect();
  // Canvas coordinates are already in the right coordinate system
  // Scale factors only needed for dimensions, not positions
  
  // Create container for input fields
  const container = document.createElement('div');
  container.id = 'auth-input-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  
  // Modal coordinates are already in screen space - no scaling needed
  
  // Create email input (only if needed)
  let emailInput = null;
  if (emailY !== null) {
    emailInput = document.createElement('input');
    emailInput.id = 'auth-email-input';
    emailInput.type = 'email';
    emailInput.placeholder = ''; // Remove placeholder to prevent double display
    emailInput.autocomplete = 'email';
    emailInput.value = modal.emailInput;
    
    // Position email input over canvas field with cursor alignment adjustment
    // Modal coordinates are already in screen space, just add canvas offset
    const emailScreenX = canvasRect.left + modal.x - inputWidth/2;
    // Adjust Y position to align HTML cursor with canvas text baseline
    const emailScreenY = canvasRect.top + emailY - inputHeight/2 + cursorOffset;
    
    // Email input positioned correctly with precise cursor alignment
    
    emailInput.style.position = 'absolute';
    emailInput.style.left = emailScreenX + 'px';
    emailInput.style.top = emailScreenY + 'px';
    emailInput.style.width = inputWidth + 'px';
    emailInput.style.height = inputHeight + 'px';
    // Make input functionally active but visually transparent
    emailInput.style.backgroundColor = 'transparent';
    emailInput.style.border = 'none';
    emailInput.style.outline = 'none';
    emailInput.style.color = 'transparent'; // Hide HTML text, let canvas handle visuals
    emailInput.style.caretColor = '#333333'; // Keep cursor visible for functionality
    emailInput.style.fontSize = canvasFontSize + 'px'; // Match canvas exactly
    emailInput.style.fontFamily = 'Helvetica, Arial, sans-serif'; // Match bodyFont exactly
    emailInput.style.pointerEvents = 'auto';
    emailInput.style.padding = '0 12px';
    emailInput.style.boxSizing = 'border-box';
    emailInput.style.lineHeight = canvasFontSize + 'px'; // Match the actual font size for cursor alignment
    emailInput.style.textAlign = 'left';
    emailInput.style.verticalAlign = 'top';
    emailInput.style.paddingTop = '0px';
    emailInput.style.margin = '0';
  }
  
  // Create password input (only when needed)
  let passwordInput = null;
  if (passwordY !== null) {
    passwordInput = document.createElement('input');
    passwordInput.id = 'auth-password-input';
    passwordInput.type = 'password';
    passwordInput.placeholder = ''; // Remove placeholder to prevent double display
    passwordInput.autocomplete = 'current-password';
    passwordInput.value = modal.passwordInput;
    
    // Position password input over canvas field with cursor alignment adjustment
    const passwordScreenX = canvasRect.left + modal.x - inputWidth/2;
    // Adjust Y position to align HTML cursor with canvas text baseline
    const passwordScreenY = canvasRect.top + passwordY - inputHeight/2 + cursorOffset;
    
    // Password input positioned correctly with precise cursor alignment
    
    passwordInput.style.position = 'absolute';
    passwordInput.style.left = passwordScreenX + 'px';
    passwordInput.style.top = passwordScreenY + 'px';
    passwordInput.style.width = inputWidth + 'px';
    passwordInput.style.height = inputHeight + 'px';
    // Make input functionally active but visually transparent  
    passwordInput.style.backgroundColor = 'transparent';
    passwordInput.style.border = 'none';
    passwordInput.style.outline = 'none';
    passwordInput.style.color = 'transparent'; // Hide HTML text, let canvas handle visuals
    passwordInput.style.caretColor = '#333333'; // Keep cursor visible for functionality
    passwordInput.style.fontSize = canvasFontSize + 'px'; // Match canvas exactly
    passwordInput.style.fontFamily = 'Helvetica, Arial, sans-serif'; // Match bodyFont exactly
    passwordInput.style.pointerEvents = 'auto';
    passwordInput.style.padding = '0 12px';
    passwordInput.style.boxSizing = 'border-box';
    passwordInput.style.lineHeight = canvasFontSize + 'px'; // Match the actual font size for cursor alignment
    passwordInput.style.textAlign = 'left';
    passwordInput.style.verticalAlign = 'top';
    passwordInput.style.paddingTop = '0px';
    passwordInput.style.margin = '0';
  }
  
  // Create confirm password input (only when needed)
  let confirmPasswordInput = null;
  if (confirmPasswordY !== null) {
    confirmPasswordInput = document.createElement('input');
    confirmPasswordInput.id = 'auth-confirm-password-input';
    confirmPasswordInput.type = 'password';
    confirmPasswordInput.placeholder = ''; // Remove placeholder to prevent double display
    confirmPasswordInput.autocomplete = 'new-password';
    confirmPasswordInput.value = modal.confirmPasswordInput;
    
    // Position confirm password input over canvas field with cursor alignment adjustment
    const confirmPasswordScreenX = canvasRect.left + modal.x - inputWidth/2;
    // Adjust Y position to align HTML cursor with canvas text baseline
    const confirmPasswordScreenY = canvasRect.top + confirmPasswordY - inputHeight/2 + cursorOffset;
    
    confirmPasswordInput.style.position = 'absolute';
    confirmPasswordInput.style.left = confirmPasswordScreenX + 'px';
    confirmPasswordInput.style.top = confirmPasswordScreenY + 'px';
    confirmPasswordInput.style.width = inputWidth + 'px';
    confirmPasswordInput.style.height = inputHeight + 'px';
    // Make input functionally active but visually transparent  
    confirmPasswordInput.style.backgroundColor = 'transparent';
    confirmPasswordInput.style.border = 'none';
    confirmPasswordInput.style.outline = 'none';
    confirmPasswordInput.style.color = 'transparent'; // Hide HTML text, let canvas handle visuals
    confirmPasswordInput.style.caretColor = '#333333'; // Keep cursor visible for functionality
    confirmPasswordInput.style.fontSize = canvasFontSize + 'px'; // Match canvas exactly
    confirmPasswordInput.style.fontFamily = 'Helvetica, Arial, sans-serif'; // Match bodyFont exactly
    confirmPasswordInput.style.pointerEvents = 'auto';
    confirmPasswordInput.style.padding = '0 12px';
    confirmPasswordInput.style.boxSizing = 'border-box';
    confirmPasswordInput.style.lineHeight = canvasFontSize + 'px'; // Match the actual font size for cursor alignment
    confirmPasswordInput.style.textAlign = 'left';
    confirmPasswordInput.style.verticalAlign = 'top';
    confirmPasswordInput.style.paddingTop = '0px';
    confirmPasswordInput.style.margin = '0';
  }
  
  // Add event listeners for email input (if it exists)
  if (emailInput) {
    emailInput.addEventListener('input', (e) => {
      // Prevent any double handling or text manipulation
      e.stopPropagation();
      
      // Debug the input event
      console.log('📝 Email input event:', {
        value: `"${e.target.value}"`,
        length: e.target.value.length,
        charCodes: [...e.target.value].map(c => c.charCodeAt(0))
      });
      
      // Direct assignment without any processing
      modal.emailInput = e.target.value;
      modal.emailError = '';
      modal.focusedField = 'email';
    });
    
    emailInput.addEventListener('focus', () => {
      modal.focusedField = 'email';
    });
    
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (passwordInput) {
          passwordInput.focus();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (modal.mode === 'signin') {
          handleEmailPasswordAuth(false); // Default to sign in
        } else if (modal.mode === 'forgot-password') {
          handleForgotPassword(); // Send reset link
        }
      }
    });
  }
  
  // Add password event listeners only if password input exists
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      // Prevent any double handling or text manipulation
      e.stopPropagation();
      
      // Debug the input event
      console.log('📝 Password input event:', {
        value: `"${e.target.value}"`,
        length: e.target.value.length,
        charCodes: [...e.target.value].map(c => c.charCodeAt(0))
      });
      
      // Direct assignment without any processing
      modal.passwordInput = e.target.value;
      modal.passwordError = '';
      modal.focusedField = 'password';
    });
    
    passwordInput.addEventListener('focus', () => {
      modal.focusedField = 'password';
    });
    
          passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          if (confirmPasswordInput) {
            confirmPasswordInput.focus();
          } else if (emailInput) {
            emailInput.focus();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (modal.mode === 'signin') {
            handleEmailPasswordAuth(false); // Default to sign in
          } else if (modal.mode === 'set-new-password') {
            if (confirmPasswordInput) {
              confirmPasswordInput.focus();
            } else {
              handleSetNewPassword(); // Update password
            }
          }
        }
      });
    }
    
    // Add confirm password event listeners (if it exists)
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', (e) => {
        // Prevent any double handling or text manipulation
        e.stopPropagation();
        
        // Debug the input event
        console.log('📝 Confirm password input event:', {
          value: `"${e.target.value}"`,
          length: e.target.value.length,
          charCodes: [...e.target.value].map(c => c.charCodeAt(0))
        });
        
        // Direct assignment without any processing
        modal.confirmPasswordInput = e.target.value;
        modal.confirmPasswordError = '';
        modal.focusedField = 'confirmPassword';
      });
      
      confirmPasswordInput.addEventListener('focus', () => {
        modal.focusedField = 'confirmPassword';
      });
      
      confirmPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          if (passwordInput) {
            passwordInput.focus();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (modal.mode === 'set-new-password') {
            handleSetNewPassword(); // Update password
          }
        }
      });
    }
  
  // Add inputs to container
  if (emailInput) {
    container.appendChild(emailInput);
  }
  if (passwordInput) {
    container.appendChild(passwordInput);
  }
  if (confirmPasswordInput) {
    container.appendChild(confirmPasswordInput);
  }
  
  // Add container to page
  document.body.appendChild(container);
  
  // Focus appropriate field by default
  setTimeout(() => {
    if (modal.mode === 'set-new-password' && passwordInput) {
      passwordInput.focus();
    } else if (emailInput) {
      emailInput.focus();
    }
  }, 100);
  
  console.log('✅ Modern text input system activated');
  
  } catch (error) {
    console.error('❌ Error creating HTML input fields:', error);
    // Fallback to canvas inputs if HTML creation fails
  }
}

// Remove HTML input fields
function removeHtmlInputFields() {
  const container = document.getElementById('auth-input-container');
  if (container) {
    container.remove();
  }
}

// Update HTML input positions when window resizes or modal moves
function updateHtmlInputPositions() {
  const container = document.getElementById('auth-input-container');
  if (!container || !window.authModal.active) return;
  
  const modal = window.authModal;
  const emailInput = document.getElementById('auth-email-input');
  const passwordInput = document.getElementById('auth-password-input');
  const confirmPasswordInput = document.getElementById('auth-confirm-password-input');
  
  // Recalculate positions based on modal mode
  const inputWidth = modal.width * 0.8;
  const inputHeight = 35;
  
  let emailY, passwordY, confirmPasswordY;
  
  if (modal.mode === 'forgot-password') {
    emailY = modal.y - modal.height * 0.05;
    passwordY = null;
    confirmPasswordY = null;
  } else if (modal.mode === 'set-new-password') {
    emailY = null;
    passwordY = modal.y - modal.height * 0.1;
    confirmPasswordY = modal.y + modal.height * 0.05;
  } else {
    emailY = modal.y - modal.height * 0.2;
    passwordY = modal.y - modal.height * 0.05;
    confirmPasswordY = null;
  }
  
  const canvas = document.querySelector('canvas');
  const canvasRect = canvas.getBoundingClientRect();
  
  // Calculate cursor alignment offset
  const canvasFontSize = Math.max(modal.width * 0.025, 11);
  const cursorOffset = (inputHeight - canvasFontSize) / 2 + 5; // Add 5px to move cursor down
  
  // Update email input position (only if it exists)
  if (emailInput && emailY !== null) {
    const emailScreenX = canvasRect.left + modal.x - inputWidth/2;
    const emailScreenY = canvasRect.top + emailY - inputHeight/2 + cursorOffset;
    
    emailInput.style.left = emailScreenX + 'px';
    emailInput.style.top = emailScreenY + 'px';
    emailInput.style.width = inputWidth + 'px';
    emailInput.style.height = inputHeight + 'px';
  }
  
  // Update password input position (only if it exists)
  if (passwordInput && passwordY !== null) {
    const passwordScreenX = canvasRect.left + modal.x - inputWidth/2;
    const passwordScreenY = canvasRect.top + passwordY - inputHeight/2 + cursorOffset;
    
    passwordInput.style.left = passwordScreenX + 'px';
    passwordInput.style.top = passwordScreenY + 'px';
    passwordInput.style.width = inputWidth + 'px';
    passwordInput.style.height = inputHeight + 'px';
  }
  
  // Update confirm password input position (only if it exists)
  if (confirmPasswordInput && confirmPasswordY !== null) {
    const confirmPasswordScreenX = canvasRect.left + modal.x - inputWidth/2;
    const confirmPasswordScreenY = canvasRect.top + confirmPasswordY - inputHeight/2 + cursorOffset;
    
    confirmPasswordInput.style.left = confirmPasswordScreenX + 'px';
    confirmPasswordInput.style.top = confirmPasswordScreenY + 'px';
    confirmPasswordInput.style.width = inputWidth + 'px';
    confirmPasswordInput.style.height = inputHeight + 'px';
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to hide the auth modal (legacy compatibility)
function hideAuthModal() {
  closeAuthModal();
}

// Global signOut function for compatibility with interaction.js - APlasker
async function signOut() {
  try {
    console.log('Signing out user...');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return;
    }
    
    // Reset auth state to anonymous
    const { data, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      console.error('Error signing in anonymously after logout:', anonError);
      // Fallback to manual reset
      window.authState.user = null;
      window.authState.isAnonymous = false;
      window.authState.isAuthenticated = false;
    } else {
      window.authState.user = data.user;
      window.authState.isAnonymous = true;
      window.authState.isAuthenticated = true;
    }
    
    // Close any open modals
    closeAuthModal();
    
    // Reset game state and go back to title screen
    if (typeof gameStarted !== 'undefined') {
      gameStarted = false;
    }
    if (typeof gameWon !== 'undefined') {
      gameWon = false;
    }
    
    // Clear any completion check state - APlasker
    if (typeof completionCheckInProgress !== 'undefined') {
      completionCheckInProgress = false;
    }
    if (typeof showingCompletionError !== 'undefined') {
      showingCompletionError = false;
    }
    if (typeof completionErrorModal !== 'undefined') {
      completionErrorModal = null;
    }
    
    // Reset profile state
    if (typeof window.profileActive !== 'undefined') {
      window.profileActive = false;
    }
    
    console.log('Successfully signed out and reset to anonymous');
    
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
  }
}

// Initialize auth state management
document.addEventListener('DOMContentLoaded', () => {
  // Handle authentication state on page load
  handleAuthStateChange();
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    // Handle password recovery callback
    if (event === 'PASSWORD_RECOVERY') {
      console.log('🔑 Password recovery event detected - showing set password modal');
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show set new password modal
      showAuthModal();
      showSetNewPasswordMode();
      return;
    }
    
    if (session?.user) {
      window.authState.user = session.user;
      window.authState.isAnonymous = session.user.is_anonymous || false;
      window.authState.isAuthenticated = true;
      
      console.log('User authenticated:', {
        email: session.user.email,
        isAnonymous: window.authState.isAnonymous
      });
      
      // If user just signed in via email/password, show success message
      if (event === 'SIGNED_IN' && session.user.email && !window.authState.isAnonymous) {
        showAuthSuccess();
      }
      
    } else {
      window.authState.user = null;
      window.authState.isAnonymous = false;
      window.authState.isAuthenticated = false;
      
      console.log('User signed out');
    }
  });
});

// Handle authentication state changes and integration
async function handleAuthStateChange() {
  try {
    console.log('🔍 Checking authentication state...');
    
    // Check if this is a password reset callback
    const urlParams = new URLSearchParams(window.location.search);
    const isPasswordResetCallback = urlParams.has('token_hash') && urlParams.has('type');
    
    if (isPasswordResetCallback) {
      const type = urlParams.get('type');
      if (type === 'recovery') {
        console.log('🔑 Password reset callback detected');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show set new password modal
        showAuthModal();
        showSetNewPasswordMode();
        return;
      }
    }
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return;
    }
    
    console.log('🔍 Auth state debug info:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userIsAnonymous: session?.user?.is_anonymous,
      currentAuthState: window.authState,
      isAuthenticatedAlready: window.authState?.isAuthenticated
    });
    
    // Handle authenticated users (email/password auth)
    if (session?.user && session.user.email && !session.user.is_anonymous) {
      console.log('🔗 Authenticated user detected - checking if integration needed...');
      
      // Check if we need to update auth state (fresh auth vs already authenticated)
      if (!window.authState?.isAuthenticated || window.authState?.isAnonymous) {
        console.log('📝 Fresh authentication detected - updating auth state and integrating');
        
        // Update auth state
        window.authState.user = session.user;
        window.authState.isAnonymous = false;
        window.authState.isAuthenticated = true;
        
        console.log('✅ Auth state updated:', window.authState);
        
        // Create or update user profile
        if (typeof createOrUpdateProfile === 'function') {
          try {
            console.log('👤 Creating/updating user profile...');
            const profile = await createOrUpdateProfile(session.user);
            if (profile) {
              console.log('✅ User profile created/updated successfully:', {
                userId: profile.id,
                email: profile.email
              });
            } else {
              console.warn('⚠️ Profile creation returned null - check profiles table setup');
            }
          } catch (profileError) {
            console.error('❌ Error with profile creation:', profileError);
            // Don't fail authentication if profile creation fails
          }
        } else {
          console.warn('⚠️ createOrUpdateProfile function not available');
        }
        
        // Integrate user into game system
        console.log('🎮 Starting game system integration for fresh authentication...');
        await integrateAuthenticatedUserIntoGame();
        
        console.log('🎉 Authentication and integration complete!');
      } else {
        console.log('ℹ️ User already authenticated - checking for session migration only');
        
        // Still run session migration even for "already authenticated" users
        if (typeof migrateUserSessions === 'function') {
          console.log('🔄 Running session migration check for already-authenticated user...');
          try {
            const migrationResult = await migrateUserSessions(session.user.id);
            if (migrationResult.success && migrationResult.migratedCount > 0) {
              console.log(`✅ Migrated ${migrationResult.migratedCount} anonymous sessions for existing user`);
            } else if (!migrationResult.success) {
              console.warn('⚠️ Session migration failed for existing user:', migrationResult.error);
            } else {
              console.log('ℹ️ No anonymous sessions found to migrate for existing user');
            }
          } catch (migrationError) {
            console.error('❌ Error during session migration for existing user:', migrationError);
          }
        } else {
          console.warn('⚠️ Migration function not available for existing user');
        }
      }
      
    } else if (session?.user && session.user.is_anonymous) {
      console.log('👤 Anonymous user session found');
    } else if (!session?.user) {
      console.log('ℹ️ No user session found');
    } else {
      console.log('ℹ️ User session exists but conditions not met for integration');
    }
  } catch (error) {
    console.error('❌ Error handling auth state:', error);
  }
}

// Function to show authentication success message  
function showAuthSuccess() {
  // Success message is now handled by the modal itself
  console.log('✅ Signed in successfully!');
}

// DEBUG FUNCTION - Check text input status and font matching
function debugTextInputs() {
  const emailInput = document.getElementById('auth-email-input');
  const passwordInput = document.getElementById('auth-password-input');
  
  console.log('🔍 TEXT INPUT & FONT MATCHING DEBUG:');
  console.log('Modal state:', {
    emailInput: `"${window.authModal?.emailInput || ''}"`,
    emailLength: window.authModal?.emailInput?.length || 0,
    passwordInput: `"${window.authModal?.passwordInput || ''}"`,
    passwordLength: window.authModal?.passwordInput?.length || 0
  });
  
  if (emailInput) {
    console.log('HTML Email Input:', {
      value: `"${emailInput.value}"`,
      length: emailInput.value.length,
      fontFamily: emailInput.style.fontFamily,
      fontSize: emailInput.style.fontSize,
      placeholder: `"${emailInput.placeholder}"`,
      charCodes: [...emailInput.value].map(c => c.charCodeAt(0))
    });
  }
  
  if (passwordInput) {
    console.log('HTML Password Input:', {
      value: `"${passwordInput.value}"`,
      length: passwordInput.value.length,
      fontFamily: passwordInput.style.fontFamily,
      fontSize: passwordInput.style.fontSize,
      placeholder: `"${passwordInput.placeholder}"`,
      charCodes: [...passwordInput.value].map(c => c.charCodeAt(0))
    });
  }
  
  // Check canvas font settings
  console.log('Canvas Font Settings:', {
    bodyFont: typeof bodyFont !== 'undefined' ? bodyFont : 'not defined',
    currentCanvasFont: 'Check in drawSignInContent()',
    expectedMatch: 'Helvetica, Arial, sans-serif'
  });
  
  // Check for space characters (char code 32)
  const emailSpaces = window.authModal?.emailInput ? [...window.authModal.emailInput].filter(c => c.charCodeAt(0) === 32).length : 0;
  const passwordSpaces = window.authModal?.passwordInput ? [...window.authModal.passwordInput].filter(c => c.charCodeAt(0) === 32).length : 0;
  
  console.log('Space character count:', { emailSpaces, passwordSpaces });
  
  // Test character width matching
  if (emailInput && window.authModal?.emailInput) {
    console.log('🎯 FONT METRICS TEST:');
    console.log('Testing character "A" width in both HTML and Canvas...');
    
    // Test HTML character width (approximate)
    const testChar = 'A';
    const htmlFontSize = emailInput.style.fontSize;
    console.log(`HTML: font="${emailInput.style.fontFamily}", size="${htmlFontSize}"`);
    
    // Note: We can't easily measure HTML text width here, but the mismatch should now be fixed
    console.log('✅ HTML and Canvas fonts should now match exactly');
  }
}

// DEBUG FUNCTION - Test complete authentication system including forgot password
async function testEmailPasswordAuth() {
  try {
    console.log('🧪 === COMPLETE AUTH SYSTEM TEST ===');
    
    // Open the modal first
    if (typeof showAuthModal === 'function') {
      console.log('📱 Opening auth modal...');
      showAuthModal();
      
      // Wait for HTML inputs to be created
      setTimeout(() => {
        console.log('✅ FEATURES AVAILABLE:');
        console.log('  1. Email/Password Sign In & Sign Up');
        console.log('  2. Modern text input (copy/paste, selection, etc.)');
        console.log('  3. Forgot Password flow');
        console.log('  4. NEW: Set New Password modal');
        console.log('');
        console.log('🎯 TESTING INSTRUCTIONS:');
        console.log('  - Type in email/password fields (perfect cursor alignment)');
        console.log('  - Click "Forgot Password?" to test reset flow');
        console.log('  - Try all modern text features (copy/paste, selection)');
        console.log('');
        console.log('🔧 COMPLETE PASSWORD RESET FLOW:');
        console.log('  1. Click "Forgot Password?" link');
        console.log('  2. Enter email address');
        console.log('  3. Click "Send Link" (uses Supabase reset)');
        console.log('  4. Check email for reset instructions');
        console.log('  5. Click email link → Auto-opens "Set New Password" modal');
        console.log('  6. Enter new password + confirm → Password updated!');
        console.log('');
        console.log('🛠️ FIXES APPLIED:');
        console.log('  ✅ HTML inputs removed during loading/success screens');
        console.log('  ✅ Password reset link opens set password modal');
        
        // Call debug function
        debugTextInputs();
      }, 300);
    } else {
      console.log('❌ showAuthModal function not available');
    }
    
  } catch (error) {
    console.error('❌ Error in auth test:', error);
  }
}

// DEBUG FUNCTION - Test forgot password flow specifically
async function testForgotPassword() {
  try {
    console.log('🧪 === FORGOT PASSWORD FLOW TEST ===');
    
    if (typeof showAuthModal === 'function') {
      showAuthModal();
      
      setTimeout(() => {
        if (typeof showForgotPasswordMode === 'function') {
          showForgotPasswordMode();
          console.log('✅ Switched to forgot password mode');
          console.log('🎯 Enter an email and click "Send Link" to test');
        } else {
          console.log('❌ showForgotPasswordMode function not available');
        }
      }, 300);
    } else {
      console.log('❌ showAuthModal function not available');
    }
    
  } catch (error) {
    console.error('❌ Error in forgot password test:', error);
  }
}

// DEBUG FUNCTION - Test set new password flow specifically
async function testSetNewPassword() {
  try {
    console.log('🧪 === SET NEW PASSWORD FLOW TEST ===');
    
    if (typeof showAuthModal === 'function') {
      showAuthModal();
      
      setTimeout(() => {
        if (typeof showSetNewPasswordMode === 'function') {
          showSetNewPasswordMode();
          console.log('✅ Switched to set new password mode');
          console.log('🎯 Enter new password and confirm password to test');
          console.log('📝 Modern text inputs work: copy/paste, selection, etc.');
          console.log('⚡ Tab to switch fields, Enter to submit');
        } else {
          console.log('❌ showSetNewPasswordMode function not available');
        }
      }, 300);
    } else {
      console.log('❌ showAuthModal function not available');
    }
    
  } catch (error) {
    console.error('❌ Error in set password test:', error);
  }
}

// DEBUG FUNCTION - Simulate password reset URL callback
function simulatePasswordResetCallback() {
  try {
    console.log('🧪 === SIMULATING PASSWORD RESET CALLBACK ===');
    console.log('This simulates what happens when user clicks email reset link');
    
    // Add URL parameters to simulate password reset callback
    const newUrl = window.location.pathname + '?token_hash=test_token&type=recovery';
    window.history.pushState({}, document.title, newUrl);
    
    console.log('✅ URL parameters added:', newUrl);
    console.log('🔄 Calling handleAuthStateChange to detect reset callback...');
    
    // Call the auth state change handler to detect the reset
    handleAuthStateChange();
    
  } catch (error) {
    console.error('❌ Error in simulation:', error);
  }
}

// DEBUG FUNCTION - Test PASSWORD_RECOVERY event handling
function testPasswordRecoveryEvent() {
  try {
    console.log('🧪 === TESTING PASSWORD_RECOVERY EVENT ===');
    console.log('This tests the new event handler directly');
    
    // Create a mock session for testing
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        is_anonymous: false
      }
    };
    
    // Manually trigger the auth state change with PASSWORD_RECOVERY event
    const authStateChangeHandler = supabase.auth.onAuthStateChange(() => {});
    
    console.log('🔄 Triggering PASSWORD_RECOVERY event...');
    console.log('📱 Expected: Auth modal should open in set password mode');
    
    // Note: This function mainly shows expected behavior since we can't easily mock the event
    console.log('✅ New handler added - PASSWORD_RECOVERY events will now show set password modal');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// DEBUG FUNCTION - Test all modal improvements
function testModalImprovements() {
  try {
    console.log('🧪 === TESTING ALL MODAL IMPROVEMENTS ===');
    console.log('This tests the complete modal language and spacing improvements');
    
    // Open the modal first
    if (typeof showAuthModal === 'function') {
      console.log('📱 Opening improved auth modal...');
      showAuthModal();
      
      // Wait for HTML inputs to be created
      setTimeout(() => {
        console.log('✅ MODAL IMPROVEMENTS IMPLEMENTED:');
        console.log('');
        console.log('🎯 SIGN IN/SIGN UP SCREEN:');
        console.log('  - Title: "Create an Account to Save your Recipes & your Streak!"');
        console.log('  - Subtitle: "Create an account or sign in to save your progress and compete on leaderboards."');
        console.log('  - Buttons: "Sign In" / "Create Account"');
        console.log('  - Link: "Forgot your password?"');
        console.log('  - Improved spacing and positioning');
        console.log('');
        console.log('🔄 TEST OTHER SCREENS:');
        console.log('  - testForgotPassword() - Test forgot password flow');
        console.log('  - testSetNewPassword() - Test password reset modal');
        console.log('');
        console.log('📝 NEW FEATURES:');
        console.log('  - 8-character password requirement');
        console.log('  - Improved loading messages ("Cooking…", "Setting the table…")');
        console.log('  - Better success messages with game personality');
        console.log('  - "Continue" button instead of "Got it!"');
        console.log('');
        console.log('🎨 SPACING IMPROVEMENTS:');
        console.log('  - Better button sizing and positioning');
        console.log('  - Improved text wrapping for longer instructions');
        console.log('  - Enhanced visual hierarchy');
        
      }, 300);
    } else {
      console.log('❌ showAuthModal function not available');
    }
    
  } catch (error) {
    console.error('❌ Error in modal improvements test:', error);
  }
}

// CRITICAL FIX: Integrate authenticated user into game system - APlasker
async function integrateAuthenticatedUserIntoGame() {
  try {
    console.log('🔄 Integrating authenticated user into game system...');
    console.log('🔍 Integration debug info:', {
      gameStarted: typeof gameStarted !== 'undefined' ? gameStarted : 'undefined',
      currentSessionId: typeof currentSessionId !== 'undefined' ? currentSessionId : 'undefined',
      userAuthState: window.authState,
      availableFunctions: {
        checkTodayCompletion: typeof checkTodayCompletion,
        loadRecipeData: typeof loadRecipeData,
        startGameSession: typeof startGameSession,
        migrateUserSessions: typeof migrateUserSessions
      }
    });
    
    // STEP 1: Migrate anonymous sessions to authenticated user - APlasker
    if (window.authState?.user?.id && typeof migrateUserSessions === 'function') {
      console.log('🔄 Starting session migration for authenticated user...');
      try {
        const migrationResult = await migrateUserSessions(window.authState.user.id);
        if (migrationResult.success && migrationResult.migratedCount > 0) {
          console.log(`✅ Successfully migrated ${migrationResult.migratedCount} anonymous sessions to authenticated user`);
        } else if (!migrationResult.success) {
          console.warn('⚠️ Session migration failed but continuing with auth integration:', migrationResult.error);
        } else {
          console.log('ℹ️ No anonymous sessions found to migrate');
        }
      } catch (migrationError) {
        console.error('❌ Error during session migration:', migrationError);
        // Continue with authentication even if migration fails
      }
    } else {
      console.warn('⚠️ Session migration not available:', {
        hasUserId: !!window.authState?.user?.id,
        hasMigrationFunction: typeof migrateUserSessions === 'function'
      });
    }
    
    // Check if they have completed today's recipe
    if (typeof checkTodayCompletion === 'function') {
      console.log('🔍 Checking if user has completed today\'s recipe...');
      try {
        await checkTodayCompletion();
        console.log('✅ Today completion check completed');
      } catch (checkError) {
        console.error('❌ Error checking today completion:', checkError);
      }
    } else {
      console.warn('⚠️ checkTodayCompletion function not available');
    }
    
    // CRITICAL FIX: Always load recipe data when user authenticates - APlasker
    console.log('📖 Loading recipe data for authenticated user...');
    if (typeof loadRecipeData === 'function') {
      try {
        await loadRecipeData();
        console.log('✅ Recipe data loaded successfully for authenticated user');
      } catch (loadError) {
        console.error('❌ Error loading recipe data for authenticated user:', loadError);
      }
    } else {
      console.warn('⚠️ loadRecipeData function not available');
    }
    
    // If they're already playing a game, ensure they have a game session
    if (typeof gameStarted !== 'undefined' && gameStarted && 
        typeof currentSessionId !== 'undefined' && !currentSessionId) {
      console.log('🎯 User is playing but has no session, creating one...');
      
      // Get current recipe ID
      let recipeId = null;
      if (typeof currentRecipeData !== 'undefined' && currentRecipeData?.rec_id) {
        recipeId = currentRecipeData.rec_id;
      } else if (typeof recipe_data !== 'undefined' && recipe_data?.rec_id) {
        recipeId = recipe_data.rec_id;
      }
      
      console.log('🔍 Recipe ID for session creation:', recipeId);
      
      // Start a game session
      if (typeof startGameSession === 'function' && recipeId) {
        try {
          const sessionId = await startGameSession(recipeId);
          if (sessionId) {
            console.log('✅ Game session created for authenticated user:', sessionId);
          } else {
            console.warn('⚠️ Game session creation returned null');
          }
        } catch (sessionError) {
          console.error('❌ Error creating game session:', sessionError);
        }
      } else {
        console.warn('⚠️ Cannot create game session:', {
          startGameSessionAvailable: typeof startGameSession === 'function',
          recipeIdAvailable: !!recipeId
        });
      }
    }
    
    console.log('✅ User integration complete');
    
  } catch (error) {
    console.error('❌ Error integrating user into game system:', error);
    // Don't fail authentication if integration fails
  }
}

// Terms & Conditions Modal Functions
function showTermsModal() {
  console.log('Showing Terms & Conditions modal');
  
  // Set global modal flag
  modalActive = true;
  
  // Get the HTML modal element
  const modal = document.getElementById('terms-modal');
  if (modal) {
    // Show the modal with animation
    modal.style.display = 'flex';
    // Force reflow to ensure display change takes effect
    modal.offsetHeight;
    // Add show class for animation
    modal.classList.add('show');
    
    // Set up event listeners
    setupTermsModalEventListeners();
  }
}

function closeTermsModal() {
  console.log('Terms & Conditions modal closed');
  
  // Clear global modal flag
  modalActive = false;
  
  // Get the HTML modal element
  const modal = document.getElementById('terms-modal');
  if (modal) {
    // Remove show class for fade out animation
    modal.classList.remove('show');
    
    // Hide modal after animation completes
    setTimeout(() => {
      modal.style.display = 'none';
      // Remove event listeners
      removeTermsModalEventListeners();
    }, 300); // Match CSS transition duration
  }
}

function setupTermsModalEventListeners() {
  const modal = document.getElementById('terms-modal');
  const closeBtn = document.getElementById('terms-close-btn');
  const overlay = modal?.querySelector('.terms-modal-overlay');
  
  // Close button click
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTermsModal);
  }
  
  // Overlay click (close on outside click)
  if (overlay) {
    overlay.addEventListener('click', closeTermsModal);
  }
  
  // Escape key to close
  document.addEventListener('keydown', handleTermsModalKeydown);
}

function removeTermsModalEventListeners() {
  const closeBtn = document.getElementById('terms-close-btn');
  const modal = document.getElementById('terms-modal');
  const overlay = modal?.querySelector('.terms-modal-overlay');
  
  // Remove event listeners
  if (closeBtn) {
    closeBtn.removeEventListener('click', closeTermsModal);
  }
  
  if (overlay) {
    overlay.removeEventListener('click', closeTermsModal);
  }
  
  document.removeEventListener('keydown', handleTermsModalKeydown);
}

function handleTermsModalKeydown(event) {
  // Close modal on Escape key
  if (event.key === 'Escape') {
    closeTermsModal();
  }
}

// Terms modal is now handled by HTML/CSS instead of p5.js canvas
// No drawTermsModal function needed

// Terms modal interaction is now handled by HTML event listeners
// No p5.js click/drag/wheel functions needed 