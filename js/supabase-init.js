// Supabase Initialization Script
// This ensures Supabase is properly initialized before other scripts use it

(function() {
    // Wait for the Supabase library to be available
    function waitForSupabase() {
        if (window.supabase && window.supabase.createClient) {
            // Check if we have credentials
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && 
                window.SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
                
                // Create the client
                try {
                    window.supabaseClient = window.supabase.createClient(
                        window.SUPABASE_URL, 
                        window.SUPABASE_ANON_KEY
                    );
                    console.log('✅ Supabase client initialized successfully');
                    
                    // Also set it as the global 'supabase' for backward compatibility
                    window.supabase = window.supabaseClient;
                    
                    // Dispatch event to notify other scripts
                    window.dispatchEvent(new Event('supabaseReady'));
                } catch (error) {
                    console.error('❌ Failed to initialize Supabase:', error);
                }
            } else {
                console.error('❌ Supabase credentials not found or invalid');
            }
        } else {
            // Try again in 50ms
            setTimeout(waitForSupabase, 50);
        }
    }
    
    // Start waiting
    waitForSupabase();
})();