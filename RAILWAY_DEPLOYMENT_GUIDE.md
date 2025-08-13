# OfferForge Railway Deployment Guide

## Overview
OfferForge is a full-stack application with:
- **Backend**: FastAPI (Python) - Deploy to Railway
- **Frontend**: Expo React Native - Mobile app via Expo Go + Web build
- **Database**: MongoDB Atlas (recommended) or Railway PostgreSQL

## Railway Backend Deployment

### Step 1: Prepare Repository
```bash
# Ensure clean git state
git add .
git commit -m "Railway deployment configuration"
git push origin main
```

### Step 2: Create Railway Service
1. Go to [Railway.app](https://railway.app)
2. Create new project from GitHub repository
3. Select "Backend Only" deployment approach

### Step 3: Configure Environment Variables
Set these variables in Railway dashboard:

**Required API Keys:**
```
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=your_stripe_live_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_live_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**Database (Option A - MongoDB Atlas):**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/offerforge_db
```

**Database (Option B - Railway PostgreSQL):**
```
# Railway will auto-provide DATABASE_URL
# You'll need to modify server.py to use PostgreSQL instead of MongoDB
```

### Step 4: Configure Build Settings
Railway should automatically detect the configuration from:
- `railway.json` (primary config)
- `nixpacks.toml` (build config)
- `backend/Dockerfile` (container config)

### Step 5: Deploy Backend
1. Connect your GitHub repository
2. Railway will automatically build and deploy
3. Note the generated URL (e.g., `https://your-app-name.railway.app`)

### Step 6: Verify Backend Deployment
Test these endpoints:
- `https://your-app-name.railway.app/api/health` - Should return service status
- `https://your-app-name.railway.app/api/projects` - Should return project list

## Frontend Configuration

### Update Frontend Backend URL
After Railway backend is deployed, update the frontend:

1. Edit `frontend/.env`:
```env
EXPO_PUBLIC_BACKEND_URL=https://your-app-name.railway.app
```

2. Test frontend locally:
```bash
cd frontend
expo start
```

### Mobile App Access
- **Development**: Use Expo Go app with QR code
- **Production**: Build with EAS (`expo build` or `eas build`)

### Web App Access
- **Development**: `expo start --web`
- **Production**: `expo build:web` and deploy static files

## Troubleshooting

### Common Issues

**1. Build Fails - Dependencies**
```bash
# Check requirements.txt has all dependencies
cd backend
pip freeze > requirements.txt
```

**2. Port Configuration**
- Railway provides `$PORT` environment variable
- Server.py should bind to `0.0.0.0:$PORT`

**3. CORS Issues**
- Ensure FastAPI CORS middleware allows Railway domain
- Check `server.py` CORS configuration

**4. Database Connection**
```bash
# Test MongoDB connection
python -c "from pymongo import MongoClient; print(MongoClient('your_mongo_url').list_database_names())"
```

**5. Environment Variables Not Loading**
- Ensure `.env` file exists in backend/
- Use `python-dotenv` to load variables
- Check Railway dashboard for variable configuration

### Health Check Endpoint
Railway uses `/api/health` for monitoring:
```python
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}
```

### Log Access
- **Railway Logs**: Available in Railway dashboard
- **Application Logs**: Use Railway CLI `railway logs`

## Deployment Validation Checklist

- [ ] Backend deploys successfully on Railway
- [ ] Health check endpoint returns 200
- [ ] Database connection working
- [ ] API keys configured and working
- [ ] CORS configured for frontend domain
- [ ] Frontend can connect to Railway backend
- [ ] All AI generation features working
- [ ] Export functionality working
- [ ] Mobile app accessible via Expo Go

## Alternative Deployment Options

If Railway continues to have issues:

1. **Render.com**: Similar to Railway, better multi-service support
2. **Vercel**: Good for API + frontend
3. **Heroku**: Classic choice for Python apps
4. **DigitalOcean App Platform**: Full-stack deployment
5. **AWS Elastic Beanstalk**: Scalable option

## Support

For deployment issues:
1. Check Railway logs for error details
2. Verify all environment variables are set
3. Test API endpoints manually
4. Check MongoDB connection separately
5. Validate API key permissions (OpenAI, Stripe)

## Next Steps After Deployment

1. Configure custom domain (optional)
2. Set up monitoring and alerts
3. Configure SSL certificate
4. Set up CI/CD pipeline
5. Configure production database backups