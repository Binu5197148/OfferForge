# OfferForge v2.3.0

> **AI-Powered Offer Creation Platform**  
> Create compelling offers, VSL scripts, email sequences, and landing pages with advanced AI

![OfferForge](https://img.shields.io/badge/OfferForge-v2.3.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4-orange?style=for-the-badge)

## 🚀 What is OfferForge?

OfferForge is a complete mobile-first platform that transforms product briefs into compelling marketing offers using advanced AI. Perfect for creators, affiliates, and digital marketers who want to generate professional marketing materials quickly.

### ✨ Key Features

- **🤖 AI Content Generation**: OpenAI GPT-4 powered content creation
- **📱 Mobile-First Design**: Optimized for mobile devices with responsive UI
- **🌐 Landing Pages**: Professional mobile-first templates
- **📧 Email Sequences**: Automated 5-email nurturing campaigns
- **🎬 VSL Scripts**: 90-second video sales letter scripts
- **📱 Social Content**: Platform-optimized social media posts
- **📦 Complete Exports**: ZIP, PDF, HTML, JSON formats
- **🌍 Multi-Language**: Portuguese (pt-BR) and English (en-US)
- **💳 Stripe Integration**: Live payment processing and market analysis

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **FastAPI**: High-performance API framework
- **MongoDB**: Document database for flexible data storage
- **OpenAI GPT-4**: Advanced AI content generation
- **Stripe API**: Payment processing and pricing analysis
- **ReportLab**: Professional PDF generation

### Frontend (Expo React Native)
- **Expo React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **React Navigation**: File-based routing with deep linking
- **Mobile-First Design**: Optimized for iOS and Android

## 📱 Screenshots

### Homepage
- Real-time system status (AI, Stripe, Database)
- Project management with progress tracking
- Interactive demo system

### Complete Workflow
1. **Product Brief**: Configure niche, avatar, promise, target price
2. **Pain Research**: Manual input + CSV upload functionality
3. **AI Generation**: OpenAI creates compelling offers
4. **Materials Creation**: VSL, emails, social content, landing pages
5. **Export System**: Ready-to-deploy packages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB
- OpenAI API Key
- Stripe API Keys (optional for pricing features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/OfferForge.git
cd OfferForge
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your API keys
```

3. **Frontend Setup**
```bash
cd frontend
npm install
# or
yarn install
```

4. **Environment Configuration**
```bash
# Backend (.env)
OPENAI_API_KEY="your_openai_api_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"

# Frontend (.env)
EXPO_PUBLIC_BACKEND_URL="http://localhost:8001"
```

5. **Start Services**
```bash
# Start MongoDB (if local)
mongod

# Start Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Start Frontend
cd frontend
expo start
```

## 🔧 Configuration

### API Keys Required

#### OpenAI (Required for AI features)
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `backend/.env`: `OPENAI_API_KEY="sk-..."`

#### Stripe (Optional for pricing features)
1. Get keys from [Stripe Dashboard](https://dashboard.stripe.com/)
2. Add to `backend/.env`:
   - `STRIPE_SECRET_KEY="sk_live_..."`
   - `STRIPE_PUBLISHABLE_KEY="pk_live_..."`

### Environment Variables

**Backend (.env)**
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="offerforge_db"
OPENAI_API_KEY="your_openai_api_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
```

**Frontend (.env)**
```bash
EXPO_PUBLIC_BACKEND_URL="http://localhost:8001"
```

## 📊 API Documentation

The API is automatically documented with FastAPI's built-in documentation:
- **Interactive Docs**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

### Key Endpoints

- `GET /api/health` - System health check
- `POST /api/projects` - Create new project
- `POST /api/generate/offer/{project_id}` - AI offer generation
- `POST /api/generate/materials/{project_id}` - AI materials generation
- `POST /api/export/{project_id}` - Export project files

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/
```

### Frontend Testing
The project includes comprehensive mobile testing with Playwright automation.

## 🚀 Deployment

### Backend Deployment
1. Set up production MongoDB
2. Configure environment variables
3. Deploy to your preferred platform (Docker, Vercel, etc.)

### Frontend Deployment
```bash
# Build for production
expo build:web

# Deploy to Vercel, Netlify, or your preferred platform
```

## 📈 Features Overview

### 🤖 AI-Powered Content Generation
- **Headlines**: Compelling, curiosity-driven
- **Proof Elements**: Social proof and testimonials  
- **Bonuses**: Value-added offers
- **Guarantees**: Risk-reversal strategies
- **VSL Scripts**: Structured 90-second scripts
- **Email Sequences**: 5-email nurturing campaigns
- **Social Content**: Platform-optimized posts

### 📱 Mobile-First Experience
- **Touch-Friendly**: 44px+ touch targets
- **Responsive Design**: Works on all device sizes
- **Smooth Navigation**: Intuitive user flows
- **Progress Tracking**: Visual progress indicators

### 📦 Export System
- **ZIP Packages**: Complete project files
- **PDF Reports**: Professional documentation
- **HTML Packages**: Ready-to-deploy landing pages
- **JSON Format**: API-ready structured data

## 🌍 Multi-Language Support

- **Portuguese (pt-BR)**: Native Brazilian Portuguese
- **English (en-US)**: Native American English
- **Cultural Context**: AI generates culturally appropriate content

## 🔒 Security

- **API Key Management**: Secure environment variable handling
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error recovery
- **CORS Configuration**: Proper cross-origin setup

## 📋 Requirements Met

✅ **Mobile-first app called "OfferForge"**  
✅ **Complete workflows**: Brief → Pain Research → Offer Generation → Materials  
✅ **AI Integration**: Real OpenAI GPT-4 content generation  
✅ **Materials Generation**: Landing pages, VSL scripts, email sequences, social content  
✅ **Export System**: HTML, PDF, ZIP formats with webhook support  
✅ **Multi-language**: Portuguese (pt-BR) and English (en-US)  
✅ **Stripe Integration**: Live API with market analysis  
✅ **Professional UI**: Mobile-optimized with excellent UX  

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **API Docs**: Visit `http://localhost:8001/docs` when running locally

## 🎉 Acknowledgments

- **OpenAI**: For providing the GPT-4 API
- **Stripe**: For payment processing capabilities
- **Expo Team**: For the excellent React Native framework
- **FastAPI**: For the high-performance Python framework

---

**OfferForge v2.3.0** - Built with ❤️ for creators and digital marketers worldwide.