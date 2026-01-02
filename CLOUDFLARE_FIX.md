# 🔧 Fix for Cloudflare Pages Deployment

The error happens because you have set the **Build Command** to `npx wrangler deploy`.
For a static site like yours (HTML/CSS/JS), you do **not** need this command. Cloudflare Pages handles the deployment automatically.

## ✅ How to Fix It

1. Go to your **Cloudflare Dashboard**.
2. Click on **Workers & Pages** and select your `booknest` project.
3. Go to **Settings** -> **Builds & deployments**.
4. Click **"Edit settings"**.
5. Change the settings to exactly this:

| Setting | Value |
| :--- | :--- |
| **Framework preset** | `None` |
| **Build command** | *(Leave this completely empty)* |
| **Build output directory** | `.` |

*(Note: The `.` means "current directory". If Cloudflare complains about the dot, try leaving it empty or typing `/`)*.

6. Click **Save**.
7. Go to the **Deployments** tab and click **"Retry deployment"**.

---

### Why did this happen?
You likely entered `npx wrangler deploy` thinking it was needed to push the code. That command is for "Cloudflare Workers" (backend code), but your site is a "Static Site" (frontend code). By removing it, Cloudflare will simply take your HTML files and put them online.
