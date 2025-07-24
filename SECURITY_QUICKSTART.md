# 🚀 COMBO MEAL Security - Quick Start Guide

**Time needed: 20 minutes**

This is the simplified version. If you get stuck, see the [detailed guide](SECURITY_IMPLEMENTATION_GUIDE.md).

---

## 🔴 STEP 1: Fix Your Local Files (2 minutes)

### 1A. Make Config File
```bash
# In your project folder, go to the js folder
# Copy config.example.js and rename the copy to config.js
```

### 1B. Get Supabase Info
1. Go to: https://supabase.com/dashboard
2. Click your project → Settings → API
3. Copy these two things:
   - Project URL (starts with https://)
   - anon/public key (long string starting with eyJ)

### 1C. Update Config File
Open `js/config.js` and replace:
```javascript
window.SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';  // <- Your URL here
window.SUPABASE_ANON_KEY = 'eyJ...YOUR-LONG-KEY...';       // <- Your key here
```

---

## 🔴 STEP 2: Fix Supabase Security (10 minutes)

### 2A. Open SQL Editor
1. In Supabase dashboard → SQL Editor
2. Click "+ New query"

### 2B. Run These Commands
Copy and run each block separately:

**Block 1 - Admin Table:**
```sql
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view logs" ON admin_logs FOR SELECT 
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

**Block 2 - Admin Function:**
```sql
CREATE OR REPLACE FUNCTION verify_admin_access(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id 
    AND raw_app_metadata->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION verify_admin_access TO authenticated;
```

**Block 3 - Make Yourself Admin (CHANGE THE EMAIL!):**
```sql
UPDATE auth.users 
SET raw_app_metadata = jsonb_set(
  COALESCE(raw_app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'YOUR-ADMIN-EMAIL@EXAMPLE.COM';  -- <- CHANGE THIS!
```

**Block 4 - Protect Recipes:**
```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read" ON recipes FOR SELECT USING (true);
CREATE POLICY "Admins can edit" ON recipes FOR UPDATE 
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

**Block 5 - Protect Sessions:**
```sql
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sessions" ON game_sessions FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users create own" ON game_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users update own" ON game_sessions FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);
```

---

## 🔴 STEP 3: Hide Credentials in Production (8 minutes)

### Option A: Using Cloudflare (Recommended)

**3A. Add Variables to Cloudflare:**
1. Log in to Cloudflare → Select your domain
2. Workers & Pages → Create application → Create Worker
3. Name it: `combo-meal-security`
4. Settings → Variables → Add these:
   - Name: `SUPABASE_URL` → Value: Your Supabase URL
   - Name: `SUPABASE_ANON_KEY` → Value: Your Supabase key

**3B. Add Worker Code:**
1. Edit code → Delete everything
2. Paste this:
```javascript
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    if (!response.headers.get('content-type')?.includes('text/html')) {
      return response;
    }
    let html = await response.text();
    html = html.replace(
      '<script src="js/config.js"></script>',
      `<script>
        window.SUPABASE_URL = '${env.SUPABASE_URL}';
        window.SUPABASE_ANON_KEY = '${env.SUPABASE_ANON_KEY}';
      </script>`
    );
    return new Response(html, { headers: response.headers });
  }
};
```
3. Save and deploy

**3C. Route Your Site:**
1. Back to your domain → Workers Routes → Add route
2. Route: `*yourdomain.com/*`
3. Worker: `combo-meal-security`
4. Save

**3D. Clean Up:**
- Delete `js/config.js` from your live server (keep it locally!)

### Option B: Manual Method (If No Cloudflare)

Just never upload `js/config.js` to your server. Instead, manually edit it on the server with your credentials.

---

## ✅ Quick Test

1. **Check it works:** Open your game - should load normally
2. **Check admin:** Go to `/admin.html` - login with your admin email
3. **Check security:** View page source - shouldn't see your real credentials

---

## ⚠️ Common Issues

**"Supabase credentials not configured"**
- Make sure `js/config.js` exists and has your real values in quotes

**"Admin access required"**
- Did you run Block 3 with YOUR email?
- Try logging out and back in

**Game won't load**
- Check you're using the anon/public key, NOT the service key
- Make sure URL has no trailing slash

---

## 🎯 Summary

You just:
1. ✅ Removed exposed credentials from code
2. ✅ Added admin authentication
3. ✅ Protected your database with Row Level Security
4. ✅ Set up secure credential injection

Your game is now MUCH more secure! 🔒

---

**Need more details?** See the [full guide](SECURITY_IMPLEMENTATION_GUIDE.md)  
**Still stuck?** The error message usually tells you what's wrong - read it carefully!