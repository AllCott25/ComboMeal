const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Replace the placeholder values with actual environment variables
htmlContent = htmlContent.replace(
  "window.SUPABASE_URL = 'undefined';",
  `window.SUPABASE_URL = '${process.env.SUPABASE_URL}';`
);

htmlContent = htmlContent.replace(
  "window.SUPABASE_ANON_KEY = 'undefined';",
  `window.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY}';`
);

// Write the updated content back to index.html
fs.writeFileSync(indexPath, htmlContent);

console.log('✅ Build complete! Environment variables have been injected into index.html');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}`);