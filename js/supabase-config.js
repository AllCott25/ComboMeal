// Supabase Configuration with validation
// This file ensures Supabase credentials are properly set

(function() {
    // Define the credentials
    const SUPABASE_URL = 'https://ovrvtfjejmhrflybslwi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ0Zmplam1ocmZseWJzbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDkxMDgsImV4cCI6MjA1NjYyNTEwOH0.V5_pJUQN9Xhd-OxVuWL5YeVrGBf7faBa_CwdvBcK5FE';
    
    // Set them globally
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    
    // Initialize Supabase client when library is ready
    function initializeSupabaseClient() {
        if (window.supabase && window.supabase.createClient) {
            try {
                // Create the client
                const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                // Set it globally in multiple ways for compatibility
                window.supabaseClient = client;
                window.supabase = client; // Override the library reference
                
                console.log('✅ Supabase client initialized successfully from config');
                
                // Dispatch event
                window.dispatchEvent(new Event('supabaseReady'));
                
                return true;
            } catch (error) {
                console.error('❌ Failed to create Supabase client:', error);
                return false;
            }
        }
        return false;
    }
    
    // Try to initialize immediately
    if (!initializeSupabaseClient()) {
        // If not ready, wait for the library
        const checkInterval = setInterval(() => {
            if (initializeSupabaseClient()) {
                clearInterval(checkInterval);
            }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Timeout waiting for Supabase library');
        }, 5000);
    }
})();