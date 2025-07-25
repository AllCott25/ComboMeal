const fs = require('fs');
const path = require('path');

console.log('🔍 Checking your setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    
    // Load and check environment variables
    require('dotenv').config();
    
    if (process.env.SUPABASE_URL) {
        console.log('✅ SUPABASE_URL is set');
        console.log(`   URL: ${process.env.SUPABASE_URL}`);
    } else {
        console.log('❌ SUPABASE_URL is missing in .env file');
    }
    
    if (process.env.SUPABASE_ANON_KEY) {
        console.log('✅ SUPABASE_ANON_KEY is set');
        console.log(`   Key starts with: ${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...`);
    } else {
        console.log('❌ SUPABASE_ANON_KEY is missing in .env file');
    }
} else {
    console.log('❌ .env file not found!');
    console.log('   Please create a .env file with your Supabase credentials');
}

console.log('\n📝 Your .env file should look like this:');
console.log('SUPABASE_URL=https://your-project-id.supabase.co');
console.log('SUPABASE_ANON_KEY=eyJ...your-long-key-here...');