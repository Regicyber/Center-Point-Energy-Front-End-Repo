# Render Deployment Guide

This guide covers deploying the CenterPoint Energy Chat Interface on Render.com.

## ✅ Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Repository** - Your code should be pushed to GitHub
3. **Lambda Function** - Must be deployed and working (with CORS headers)
4. **Environment Variables** - Know your `NEXT_PUBLIC_LAMBDA_URL`

## 🚀 Deployment Steps

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Select **"Build and deploy from a Git repository"**
4. Click **"Connect GitHub"** and authorize Render
5. Select **`Center-Point-Energy-Front-End-Repo`** repository
6. Click **"Connect"**

### Step 2: Configure Build Settings

In the deployment form, set:

| Field | Value |
|-------|-------|
| **Name** | `centerpoint-chat` (or your preferred name) |
| **Environment** | `Node` |
| **Region** | `Frankfurt (eu-central-1)` or closest to your Lambda region |
| **Branch** | `main` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | `18.17.0` (or latest LTS) |

### Step 3: Set Environment Variables

1. Scroll to **"Environment Variables"** section
2. Add the following variables:

```
NEXT_PUBLIC_LAMBDA_URL: https://grafqfo63yvndhsjgmi2f2cz2m0wewkz.lambda-url.eu-west-1.on.aws/
```

3. Click **"Create Web Service"**

Render will automatically start building and deploying your app.

## 📊 Understanding Render Build Process

Render will:

1. **Clone** your GitHub repository
2. **Install** dependencies with `npm ci`
3. **Build** the Next.js app with `npm run build`
4. **Start** the server using `npm start`
5. **Assign** a unique `*.onrender.com` domain (e.g., `centerpoint-chat.onrender.com`)

**Build time**: Usually 2-5 minutes for the initial build

## 🔐 Security Considerations

1. **CORS Headers** - Your Lambda must have proper CORS headers ✓ (already implemented)
2. **HTTPS Only** - Render automatically uses HTTPS ✓
3. **Environment Variables** - Keep `NEXT_PUBLIC_LAMBDA_URL` secret in Render dashboard ✓
4. **Never commit** `.env.local` to Git ✓

## 🔄 Auto-Deploy on Git Push

By default, Render auto-deploys when you push to the `main` branch.

To push updates:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Render will automatically build and deploy the changes.

## 📋 What You DON'T Need for Render

- ~~`amplify.yml`~~ - Only needed for AWS Amplify
- ~~AWS Lambda URL configuration~~ - Already set as environment variable
- ~~Build cache configuration~~ - Render handles this automatically

## ✅ Verification Checklist

After deployment, verify:

- [ ] Build completed successfully (check Deploy logs in Render dashboard)
- [ ] App is accessible at `https://<your-app-name>.onrender.com`
- [ ] Chat interface loads correctly
- [ ] Can send messages to Lambda
- [ ] Messages display with proper formatting
- [ ] Links in bot responses are clickable

## 🆘 Troubleshooting

### Build Fails with "npm: command not found"

**Solution**: Ensure Node Version is set in Render settings
1. Go to **Settings** → **Build & Deploy**
2. Set **Node Version** to `18.17.0` or higher

### "Cannot GET /" Error

**Solution**: The app isn't starting correctly
1. Check the Deploy logs for errors
2. Ensure **Start Command** is exactly: `npm start`
3. Check that `.env.local` or environment variables are set correctly

### Lambda Requests Fail

**Solution**: CORS or URL issues
1. Verify `NEXT_PUBLIC_LAMBDA_URL` in Render environment variables
2. Check that Lambda function is deployed and has CORS headers
3. Open browser console (F12) to see exact error messages
4. Test Lambda URL with cURL if needed

### App Shows "Failed to fetch"

**Solution**: Usually a CORS issue
1. Ensure Lambda returns proper CORS headers
2. Check that the Lambda URL in environment variables is correct
3. Look at browser Network tab (F12) to see response headers

## 📈 Monitoring & Logs

### View Logs in Render

1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Select **"Deploy"** or **"Runtime"** logs
4. Search for errors or warnings

### Enable Auto-Scroll

In the logs view, logs auto-scroll as they appear (during deployment).

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. Go to your service **Settings** → **Custom Domain**
2. Enter your domain (e.g., `chat.centerpointenergy.com`)
3. Add the CNAME record to your DNS provider pointing to Render's servers
4. Wait for DNS propagation (usually 5-30 minutes)

## 💰 Pricing

Render's free tier:
- **Web Services**: 750 hours/month (always running within free tier limits)
- **Limitations**: 0.5 GB RAM, shared CPU
- **Paid**: $7/month for better performance

For a chat app with occasional usage, free tier should work fine.

## 📝 Environment Variables (Production vs Development)

**Development** (`.env.local` - NOT pushed to Git):
```
NEXT_PUBLIC_LAMBDA_URL=https://grafqfo63yvndhsjgmi2f2cz2m0wewkz.lambda-url.eu-west-1.on.aws/
```

**Production** (Render Dashboard):
Same value, set via Render environment variables UI

## 🔄 Redeploying

To redeploy without code changes:

1. Go to your service in Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

This rebuilds and restarts the app.

## 🎯 Summary

| Aspect | Render Setup |
|--------|--------------|
| **Build** | `npm ci && npm run build` |
| **Start** | `npm start` |
| **Environment Variables** | Set in Render dashboard |
| **Domain** | `*.onrender.com` or custom domain |
| **HTTPS** | Automatic |
| **CI/CD** | Auto-deploy on Git push |
| **Monitoring** | Built-in logs and metrics |

---

**Next Steps**:
1. Connect your GitHub repo to Render
2. Set environment variables
3. Deploy
4. Test the live app
5. Share the Render URL with your team

For support: Check [Render docs](https://render.com/docs) or contact Render support.
