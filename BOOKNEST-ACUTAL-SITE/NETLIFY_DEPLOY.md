# 🚀 Deploy BookNest to Netlify

## Quick Deploy Steps

### Option 1: Drag & Drop (Easiest)

1. **Go to Netlify**: https://www.netlify.com/
2. **Sign Up/Login**: Use GitHub, GitLab, Bitbucket, or Email
3. **Drag & Drop Deploy**:
   - Go to https://app.netlify.com/drop
   - Drag the entire `BOOKNEST-ACUTAL-SITE` folder into the drop zone
   - Wait for deployment to complete (usually 1-2 minutes)
4. **Your site is live!** You'll get a URL like: `random-name-123456.netlify.app`

### Option 2: GitHub + Netlify (Recommended)

1. **Create GitHub Repository**:
   ```bash
   # Already initialized git! Now push to GitHub:
   git remote add origin https://github.com/YOUR-USERNAME/booknest.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your `booknest` repository
   - Build settings:
     - Build command: (leave empty)
     - Publish directory: `.` (current directory)
   - Click "Deploy site"

3. **Done!** Your site will auto-deploy on every git push

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## 📝 Post-Deployment

### Custom Domain (Optional)
1. Go to Site Settings → Domain management
2. Add custom domain
3. Update DNS records

### Site Name
1. Go to Site Settings → General → Site details
2. Click "Change site name"
3. Enter: `booknest-yourname` or any available name

### Environment Variables (If needed for email)
1. Go to Site Settings → Environment variables
2. Add:
   - `SENDER_EMAIL`: Your Gmail
   - `SENDER_PASSWORD`: Gmail App Password

## 🔗 Important URLs After Deploy

Your Netlify site will have these routes:

- **Main Shop**: `https://your-site.netlify.app/`
- **Buyer Login**: `https://your-site.netlify.app/pages/login.html`
- **Admin Login**: `https://your-site.netlify.app/pages/admin-login.html`
- **Admin Dashboard**: `https://your-site.netlify.app/pages/admin.html`

## ⚙️ Admin Credentials

- **Email**: jamesmaniquiz7@gmail.com
- **Default Password**: admin123
- **Change password**: Go to Profile after login

## 🐛 Troubleshooting

### Issue: 404 Page Not Found
**Solution**: The `netlify.toml` file is already configured with redirects

### Issue: LocalStorage Data Lost
**Note**: Each user's browser will have their own localStorage. Data doesn't sync between devices.

### Issue: Email Verification Not Working
**Solution**: 
- Email sending requires a backend server
- For now, codes are stored in sessionStorage as fallback
- To enable real emails, deploy `server.py` to a Python hosting service (Heroku, PythonAnywhere, etc.)

## 🎉 You're All Set!

Your BookNest site is now live on Netlify with:
- ✅ Fixed buyer login page
- ✅ Admin profile with password management
- ✅ Show/hide password toggles
- ✅ Ready for custom domain
- ✅ Auto-deploy on git push (if using GitHub)

## Next Steps

1. **Test the live site** - Try logging in as admin and buyer
2. **Add books** - Use admin panel to populate the store
3. **Share the link** - Give the URL to your customers
4. **Monitor** - Check Netlify dashboard for analytics

Happy selling! 📚✨
