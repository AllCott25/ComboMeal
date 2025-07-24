// Admin Authentication Module for COMBO MEAL
// Provides secure authentication and authorization for admin features

const AdminAuth = {
  // Check if user has admin role
  async checkAdminAccess() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.error('No authenticated user');
        return false;
      }

      // Check user metadata for admin role
      // This should be set server-side, not client-side
      const isAdmin = user.user_metadata?.role === 'admin' || 
                     user.app_metadata?.role === 'admin';
      
      if (!isAdmin) {
        console.error('User does not have admin role');
        return false;
      }

      // Additional check: verify admin status with a server-side function
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('verify_admin_access', { user_id: user.id });
      
      if (adminError || !adminCheck) {
        console.error('Admin verification failed:', adminError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  },

  // Secure admin login with additional verification
  async adminLogin(email, password) {
    try {
      // Validate inputs
      if (!SecurityUtils.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!password || password.length < 8) {
        throw new Error('Invalid password');
      }

      // Rate limiting check
      const rateLimitKey = `admin_login_${email}`;
      if (!this.loginRateLimiter(rateLimitKey)) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verify admin access
      const hasAdminAccess = await this.checkAdminAccess();
      if (!hasAdminAccess) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }

      // Log successful admin login
      await this.logAdminAction('admin_login', { email });

      return { success: true, user: data.user };
    } catch (error) {
      // Log failed login attempt
      await this.logAdminAction('failed_admin_login', { 
        email, 
        error: error.message 
      });
      
      throw error;
    }
  },

  // Initialize rate limiter for login attempts
  loginRateLimiter: SecurityUtils.createRateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes

  // Log admin actions for audit trail
  async logAdminAction(action, details) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('admin_logs').insert({
        user_id: user?.id || 'anonymous',
        action,
        details,
        ip_address: await this.getUserIP(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  },

  // Get user IP for logging (requires server-side implementation)
  async getUserIP() {
    try {
      const response = await fetch('/api/user-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  // Protect admin routes
  protectAdminRoute() {
    // Check authentication on page load
    window.addEventListener('DOMContentLoaded', async () => {
      const hasAccess = await this.checkAdminAccess();
      
      if (!hasAccess) {
        // Redirect to login or show unauthorized message
        const loginSection = document.getElementById('login-section');
        const adminPanel = document.getElementById('admin-panel');
        
        if (loginSection) loginSection.classList.remove('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
        
        // Clear any sensitive data from the page
        this.clearSensitiveData();
      }
    });

    // Monitor auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        this.clearSensitiveData();
        window.location.href = '/';
      } else if (event === 'SIGNED_IN') {
        const hasAccess = await this.checkAdminAccess();
        if (!hasAccess) {
          await supabase.auth.signOut();
          alert('Unauthorized access attempt detected');
        }
      }
    });
  },

  // Clear sensitive data from the page
  clearSensitiveData() {
    // Remove any cached data
    const sensitiveElements = document.querySelectorAll('[data-sensitive]');
    sensitiveElements.forEach(el => el.remove());
    
    // Clear any form data
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Clear localStorage items related to admin
    const adminKeys = Object.keys(localStorage).filter(key => key.includes('admin'));
    adminKeys.forEach(key => localStorage.removeItem(key));
  },

  // Validate admin session periodically
  startSessionValidation() {
    setInterval(async () => {
      const hasAccess = await this.checkAdminAccess();
      if (!hasAccess) {
        alert('Your admin session has expired. Please log in again.');
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
};

// Auto-initialize protection for admin pages
if (window.location.pathname.includes('admin')) {
  AdminAuth.protectAdminRoute();
  AdminAuth.startSessionValidation();
}