#!/bin/bash

echo "🚀 Andar Bahar Deployment Script"
echo "================================"

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Git repository has uncommitted changes"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

echo "✅ Git repository is clean"

# Build frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build successful"

# Test backend locally
echo "🔧 Testing backend..."
cd server
npm install
cd ..

echo "✅ Backend dependencies installed"

# Test Socket.IO locally (if server is running)
echo "🔌 Testing Socket.IO connection..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend server is running locally"
    echo "   Testing Socket.IO connection..."
    node scripts/test-socket.js http://localhost:3001
else
    echo "⚠️  Backend server not running locally (this is OK for deployment)"
fi

echo ""
echo "🎯 Deployment Ready!"
echo "==================="
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo ""
echo "2. Deploy Backend to Railway:"
echo "   - Go to railway.app"
echo "   - Create new project from GitHub"
echo "   - Set environment variables:"
echo "     MONGODB_URI=mongodb+srv://bhadresh:Bhadresh984@stacks.wgww0iq.mongodb.net/"
echo "     PORT=3001"
echo "     NODE_ENV=production"
echo "   - Deploy and get the Railway URL"
echo ""
echo "3. Test Socket.IO on Railway:"
echo "   - Test health: curl https://your-railway-app.railway.app/health"
echo "   - Test Socket.IO: node scripts/test-socket.js https://your-railway-app.railway.app"
echo ""
echo "4. Deploy Frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Import GitHub repository"
echo "   - Set environment variables:"
echo "     NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.railway.app"
echo "     NEXT_PUBLIC_FARCASTER_ENABLED=true"
echo "     NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 