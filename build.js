const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the config.js file
const configPath = path.join(__dirname, 'js', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the placeholder values with actual environment variables
configContent = configContent.replace(
  "window.SUPABASE_URL = 'undefined';",
  `window.SUPABASE_URL = '${process.env.SUPABASE_URL}';`
);

configContent = configContent.replace(
  "window.SUPABASE_ANON_KEY = 'undefined';",
  `window.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY}';`
);

// Write the updated content back to config.js
fs.writeFileSync(configPath, configContent);

console.log('✅ Build complete! Environment variables have been injected into js/config.js');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`);