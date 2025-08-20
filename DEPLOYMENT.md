# 🚀 Deployment Guide

## Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
# Ensure all dependencies are installed
npm install

# Build the project locally to test
npm run build
```

### 2. Deploy to Vercel
1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add the following variables:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
   NEXT_PUBLIC_FARCASTER_ENABLED=true
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   ```

3. **Deploy:**
   - Vercel will automatically detect Next.js
   - Click "Deploy"
   - Your app will be available at `https://your-app.vercel.app`

## Backend Deployment Options

### Option 1: Railway (Recommended)

#### 1. Prepare Backend
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Test locally
npm start
```

**Note:** The database configuration (`db.js`) has been merged into `server.js` for simpler deployment.

#### 2. Deploy to Railway
1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure Environment Variables:**
   - Go to Variables tab
   - Add the following variables:
   ```
   MONGODB_URI=mongodb+srv://bhadresh:Bhadresh984@stacks.wgww0iq.mongodb.net/
   PORT=3001
   NODE_ENV=production
   ```

3. **Deploy:**
   - Railway will automatically detect Node.js
   - The app will be deployed to `https://your-app.railway.app`
   - **Socket.IO server will be available at the same URL**

**Note:** If you hit Railway plan limits, see alternative options below.

### Option 2: Render (Free Alternative)

#### 1. Deploy to Render
1. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New Web Service"
   - Connect your GitHub repository

2. **Configure Service:**
   - **Name**: `andar-bahar-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

3. **Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://bhadresh:Bhadresh984@stacks.wgww0iq.mongodb.net/
   NODE_ENV=production
   PORT=10000
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Your app will be available at `https://your-app.onrender.com`

### Option 3: Fly.io (Free Alternative)

#### 1. Install Fly CLI
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login
```

#### 2. Deploy to Fly.io
```bash
# Deploy using the fly.toml configuration
fly deploy

# Your app will be available at https://andar-bahar-backend.fly.dev
```

## Environment Variables

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOCKET_URL` | Backend WebSocket URL | `https://your-backend-url.com` |
| `NEXT_PUBLIC_FARCASTER_ENABLED` | Enable Farcaster features | `true` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | `https://your-app.vercel.app` |

### Backend (All Platforms)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port (platform sets this) | `3001` |
| `NODE_ENV` | Environment | `production` |

## Post-Deployment

### 1. Update Frontend Socket URL
After backend deployment, update the frontend environment variable:
```
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
```

### 2. Test the Application
1. Visit your Vercel app URL
2. Test Farcaster Mini App integration
3. **Verify WebSocket connections work**
4. Test game functionality
5. Check real-time updates

### 3. Monitor Logs
- **Vercel:** Dashboard → Functions → View Logs
- **Railway:** Project → Deployments → View Logs
- **Render:** Service → Logs
- **Fly.io:** `fly logs`

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed:**
   - Check `NEXT_PUBLIC_SOCKET_URL` is correct
   - Verify backend app is running
   - Check CORS settings (already configured)
   - Ensure no firewall blocking WebSocket connections

2. **Socket.IO Connection Issues:**
   ```bash
   # Test Socket.IO endpoint
   curl -I https://your-backend-url.com/socket.io/
   ```
   - Should return 200 OK
   - Check platform logs for Socket.IO errors

3. **MongoDB Connection Failed:**
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas network access
   - Ensure database exists

4. **Build Failures:**
   - Check all dependencies are installed
   - Verify TypeScript compilation
   - Check environment variables

### Health Check
Test backend health:
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Socket.IO Testing
Test WebSocket connection:
```javascript
// In browser console
const socket = io('https://your-backend-url.com');
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});
socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});
```

## Platform Comparison

| Platform | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Railway** | $5 credit/month | Easy deployment, good docs | Limited free tier |
| **Render** | Free | Generous free tier, easy setup | Slower cold starts |
| **Fly.io** | Free | Fast, global, Docker-based | More complex setup |

## Security Notes

1. **Environment Variables:** Never commit sensitive data
2. **MongoDB:** Use strong passwords and IP restrictions
3. **CORS:** Configure allowed origins properly
4. **HTTPS:** All platforms provide SSL
5. **WebSocket Security:** Socket.IO runs over HTTPS in production

## Cost Optimization

### Vercel
- Free tier: 100GB bandwidth/month
- Pro: $20/month for unlimited

### Backend Platforms
- **Railway:** $5 credit/month (free tier)
- **Render:** Free tier available
- **Fly.io:** Free tier available
- **Socket.IO connections count towards usage**

## Support

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Fly.io Docs:** [fly.io/docs](https://fly.io/docs)
- **Socket.IO Docs:** [socket.io/docs](https://socket.io/docs)
- **MongoDB Atlas:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com) 