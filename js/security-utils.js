// Security Utilities for COMBO MEAL
// Provides input sanitization, validation, and security helpers

const SecurityUtils = {
  // HTML escape function to prevent XSS
  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\//g, "&#x2F;");
  },

  // Sanitize user input for display
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    // Remove any script tags and dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate recipe name
  isValidRecipeName(name) {
    if (!name || typeof name !== 'string') return false;
    // Allow letters, numbers, spaces, and common punctuation
    const nameRegex = /^[a-zA-Z0-9\s\-_',&]+$/;
    return nameRegex.test(name) && name.length <= 100;
  },

  // Validate ingredient name
  isValidIngredientName(name) {
    if (!name || typeof name !== 'string') return false;
    // Allow letters, numbers, spaces, and cooking-related punctuation
    const ingredientRegex = /^[a-zA-Z0-9\s\-_',&()]+$/;
    return ingredientRegex.test(name) && name.length <= 50;
  },

  // Validate description text
  isValidDescription(text) {
    if (!text || typeof text !== 'string') return false;
    // Basic length check and no script tags
    return text.length <= 500 && !/<script/i.test(text);
  },

  // Validate URL
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  // Validate date format (YYYY-MM-DD)
  isValidDate(date) {
    if (!date || typeof date !== 'string') return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  // Sanitize data before sending to database
  sanitizeForDatabase(data) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove any null bytes and trim whitespace
        sanitized[key] = value.replace(/\0/g, '').trim();
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  },

  // Generate secure random ID
  generateSecureId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Rate limiting helper
  createRateLimiter(maxRequests, windowMs) {
    const requests = new Map();
    
    return function(identifier) {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true; // Request allowed
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityUtils;
}