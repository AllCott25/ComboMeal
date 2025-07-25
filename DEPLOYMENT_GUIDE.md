# Complete Deployment Guide for Combo Meal Game

This guide will walk you through deploying your Combo Meal game online using GitHub Pages, Cloudflare, and Supabase. We'll explain every step as if you've never coded before.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up GitHub](#step-1-set-up-github)
3. [Step 2: Upload Your Game to GitHub](#step-2-upload-your-game-to-github)
4. [Step 3: Configure GitHub Pages](#step-3-configure-github-pages)
5. [Step 4: Set Up Cloudflare](#step-4-set-up-cloudflare)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Final Testing](#step-6-final-testing)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance and Updates](#maintenance-and-updates)

---

## Prerequisites

Before we begin, make sure you have:
- ✅ Your game working locally (which you already do!)
- ✅ A Supabase account with your project set up
- ✅ Your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your .env file
- 📝 You'll need to create:
  - A GitHub account (free)
  - A Cloudflare account (free)
  - A domain name (optional, but recommended - costs ~$10-15/year)

---

## Step 1: Set Up GitHub

GitHub is where your game code will live online. Think of it as Google Drive for code.

### Create a GitHub Account
1. Go to [github.com](https://github.com)
2. Click "Sign up" in the top right
3. Choose:
   - Username: Something professional (e.g., `alecplasker`)
   - Email: Your email address
   - Password: Make it strong!
4. Verify your email address

### Create a New Repository
1. Once logged in, click the green "New" button or the "+" icon → "New repository"
2. Fill in:
   - **Repository name**: `combo-meal` (or any name you like)
   - **Description**: "Daily recipe puzzle game"
   - **Public/Private**: Choose "Public" (required for free GitHub Pages)
   - **Initialize with README**: Leave unchecked (we already have files)
3. Click "Create repository"
4. **IMPORTANT**: Keep this page open - you'll need the instructions shown!

---

## Step 2: Upload Your Game to GitHub

Now we'll upload your game files to GitHub.

### Method A: Using GitHub Desktop (Easier for Beginners)

1. **Download GitHub Desktop**
   - Go to [desktop.github.com](https://desktop.github.com)
   - Download and install for your operating system

2. **Sign in to GitHub Desktop**
   - Open GitHub Desktop
   - Sign in with your GitHub account

3. **Add Your Game Folder**
   - Click "Add" → "Add Existing Repository"
   - If it says "This directory does not appear to be a Git repository", click "Create a Repository" instead
   - Browse to your `ComboMeal-main` folder
   - Click "Add Repository" or "Create Repository"

4. **Connect to GitHub**
   - Click "Publish repository" in the top bar
   - Make sure "Keep this code private" is UNCHECKED
   - Repository name should match what you created on GitHub
   - Click "Publish Repository"

5. **Your files are now on GitHub!**

### Method B: Using Terminal (If you're comfortable with command line)

1. Open Terminal in your `ComboMeal-main` folder
2. Run these commands one by one:

```bash
# If you haven't initialized git yet
git init

# Add all your files
git add .

# Create your first commit
git commit -m "Initial commit of Combo Meal game"

# Connect to your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/combo-meal.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Configure GitHub Pages

GitHub Pages will host your game for free!

1. **Go to your repository on GitHub**
   - Navigate to `github.com/YOUR_USERNAME/combo-meal`

2. **Open Settings**
   - Click the "Settings" tab (it's in the repository navigation bar)

3. **Find GitHub Pages settings**
   - Scroll down to "Pages" in the left sidebar
   - Click on "Pages"

4. **Configure GitHub Pages**
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select "main" (or "master" if that's what you have)
   - **Folder**: Select "/ (root)"
   - Click "Save"

5. **Wait for deployment**
   - GitHub will show a message: "Your site is live at `https://YOUR_USERNAME.github.io/combo-meal/`"
   - This can take 5-10 minutes the first time
   - You'll see a green checkmark when it's ready

6. **Test your game**
   - Visit `https://YOUR_USERNAME.github.io/combo-meal/`
   - Your game should load, but might not work properly yet (we need to set up environment variables)

---

## Step 4: Set Up Cloudflare

Cloudflare will help us:
- Secure your environment variables
- Make your game faster
- Optionally use a custom domain

### Create a Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Click "Sign up"
3. Create your account with email and password
4. Verify your email

### Option A: Using Cloudflare Pages (Recommended)

1. **Create a new Cloudflare Pages project**
   - From your Cloudflare dashboard, go to "Workers & Pages"
   - Click "Create application" → "Pages" → "Connect to Git"

2. **Connect your GitHub account**
   - Click "Connect GitHub"
   - Authorize Cloudflare to access your repositories
   - Select your `combo-meal` repository

3. **Configure build settings**
   - **Project name**: `combo-meal` (or any name)
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `/` (just a forward slash)

4. **Add environment variables**
   - Before clicking "Save and Deploy", click "Environment variables"
   - Add these variables:
     - **Variable name**: `SUPABASE_URL`
     - **Value**: Your Supabase URL (from your .env file)
     - Click "Add variable"
     - **Variable name**: `SUPABASE_ANON_KEY`
     - **Value**: Your Supabase anon key (from your .env file)
     - Click "Add variable"

5. **Deploy your site**
   - Click "Save and Deploy"
   - Wait for the build to complete (2-5 minutes)
   - Your site will be available at `combo-meal.pages.dev`

### Option B: Using Your Own Domain (Optional)

If you have your own domain:

1. **Add your domain to Cloudflare**
   - From dashboard, click "Add a site"
   - Enter your domain name
   - Follow the instructions to update your nameservers

2. **Connect domain to your Pages project**
   - Go to your Pages project → "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `playsker.com`)
   - Follow the DNS configuration instructions

---

## Step 5: Configure Environment Variables

Since we're using Cloudflare Pages, your environment variables should already be set. But let's verify everything is working:

### Update Your Build Script

Make sure your `build.js` file is set up correctly to inject environment variables:

1. Your `build.js` should already handle this (based on your successful local build)
2. Cloudflare will run `npm run build` automatically when you push changes

### Security Check

1. **Never commit .env files to GitHub**
   - Check that `.env` is listed in your `.gitignore` file
   - If not, add it:
     ```
     .env
     .env.local
     ```

2. **Verify your repository**
   - Go to your GitHub repository
   - Make sure you don't see any `.env` file listed
   - If you do, you'll need to remove it from history

---

## Step 6: Final Testing

### Test Your Deployed Game

1. **Visit your Cloudflare Pages URL**
   - Go to `https://YOUR-PROJECT.pages.dev`
   - Or your custom domain if you set one up

2. **Test game functionality**
   - ✅ Can you drag and drop ingredients?
   - ✅ Do recipes combine correctly?
   - ✅ Can you create an account/sign in?
   - ✅ Does your progress save?

3. **Check browser console for errors**
   - Right-click → "Inspect" → "Console" tab
   - Look for any red error messages
   - Common issues are usually related to environment variables

### Mobile Testing

1. Open your game on your phone
2. Test:
   - Touch/drag functionality
   - Screen sizing
   - Performance

---

## Troubleshooting

### Common Issues and Solutions

#### "Supabase is not defined" or authentication errors
- **Cause**: Environment variables not set correctly
- **Solution**: 
  - Check Cloudflare Pages → Settings → Environment variables
  - Make sure both `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
  - Redeploy by pushing a small change to GitHub

#### Game loads but nothing works
- **Cause**: JavaScript errors
- **Solution**:
  - Check browser console for errors
  - Make sure all file paths are correct (case-sensitive!)
  - Verify all JavaScript files are loading

#### "404 Not Found" errors
- **Cause**: Incorrect file paths
- **Solution**:
  - Check that all paths in your HTML use forward slashes `/`
  - Ensure file names match exactly (including capitalization)

#### Changes not appearing
- **Cause**: Caching or deployment delay
- **Solution**:
  - Wait 2-5 minutes for Cloudflare to deploy
  - Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
  - Check Cloudflare Pages dashboard for build status

---

## Maintenance and Updates

### Making Changes to Your Game

1. **Edit files locally**
   - Make your changes in your local `ComboMeal-main` folder
   - Test locally with `npm run build` and opening `index.html`

2. **Push to GitHub**
   
   Using GitHub Desktop:
   - Open GitHub Desktop
   - You'll see your changes listed
   - Write a summary (e.g., "Fixed ingredient dragging bug")
   - Click "Commit to main"
   - Click "Push origin"

   Using Terminal:
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push
   ```

3. **Automatic deployment**
   - Cloudflare will automatically detect the change
   - Build and deploy within 2-5 minutes
   - Check the Cloudflare Pages dashboard for status

### Monitoring Your Game

1. **Cloudflare Analytics**
   - View visitor statistics
   - Monitor performance
   - Check for errors

2. **Supabase Dashboard**
   - Monitor database usage
   - View user signups
   - Check data storage

### Regular Maintenance Tasks

- **Weekly**: Check for user feedback and bug reports
- **Monthly**: Review analytics and performance
- **As needed**: Update game content, fix bugs, add features

---

## Next Steps

Congratulations! Your game is now live on the internet! Here are some optional next steps:

1. **Share your game**
   - Post on social media
   - Submit to game directories
   - Ask friends to playtest

2. **Set up custom domain** (if you haven't already)
   - Purchase a domain from Namecheap, GoDaddy, or similar
   - Connect it through Cloudflare

3. **Add analytics**
   - Google Analytics
   - Plausible Analytics
   - Or use Cloudflare's built-in analytics

4. **Improve SEO**
   - Your meta tags are already set up well
   - Consider starting a blog about your game
   - Submit to search engines

5. **Set up monitoring**
   - Use a service like UptimeRobot to monitor uptime
   - Set up error tracking with Sentry

---

## Getting Help

If you run into issues:

1. **Check error messages carefully** - they often tell you exactly what's wrong
2. **Google the error** - someone has probably had the same issue
3. **GitHub Issues** - create an issue in your repository
4. **Community forums**:
   - Cloudflare Community
   - GitHub Community Forum
   - Supabase Discord

Remember: Every developer started where you are now. Don't be afraid to ask questions!

---

## Summary Checklist

- [ ] Created GitHub account and repository
- [ ] Uploaded game files to GitHub
- [ ] Enabled GitHub Pages
- [ ] Created Cloudflare account
- [ ] Set up Cloudflare Pages
- [ ] Added environment variables in Cloudflare
- [ ] Tested deployed game
- [ ] Everything works! 🎉

Good luck with your game launch!