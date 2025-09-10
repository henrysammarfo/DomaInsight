# DomaInsight - AI-Driven Domain Scoring & Predictive Analytics

![DomaInsight Logo](https://img.shields.io/badge/DomaInsight-AI%20Domain%20Scoring-blue)
![Doma Protocol](https://img.shields.io/badge/Doma-Protocol-green)
![Hackathon](https://img.shields.io/badge/Hackathon-Track%204-orange)

A full-stack dApp that provides AI-driven domain scoring and predictive analytics for the Doma Protocol ecosystem. Built for the Doma Protocol Hackathon Track 4 (Trait Scoring & Analytics).

## 🚀 Live Demo

**Production URLs:**
- **Frontend**: https://domainsight-frontend.vercel.app
- **Backend API**: https://domainsight-backend.fly.dev
- **Health Check**: https://domainsight-backend.fly.dev/health

**Local Development:**
- **Backend API**: `http://localhost:3000`  
- **Frontend**: `http://localhost:3001`

## 📋 Project Overview

DomaInsight addresses the lack of transparent domain valuation in DomainFi by providing:

- **Real-Time Trait Scoring**: AI model scores domains (0-100) based on traits like length, keywords, TLD rarity, and transaction history
- **Trend Analytics Dashboard**: Visualizes market trends and provides predictive insights from on-chain data
- **Actionable Recommendations**: Suggests actions like "Tokenize" or "List Auction" with one-click smart contract interactions
- **Multi-Chain Support**: Uses Doma state sync for real-time cross-chain data
- **Smart Alerts**: Monitors high-score expiring domains

## 🏗️ Architecture

```
DomaInsight/
├── backend/                 # Node.js/Express API server
│   ├── server.js           # Main server with AI scoring & trends
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── frontend/               # React application
│   ├── src/
│   │   ├── App.js         # Main React components
│   │   ├── App.css        # Custom styles
│   │   └── index.css      # Tailwind CSS imports
│   ├── package.json       # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend
- **Node.js/Express**: API server
- **ml-random-forest**: AI/ML scoring model
- **Axios**: HTTP client for subgraph queries
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: User interface
- **Apollo Client**: GraphQL client for Doma subgraph
- **Tailwind CSS**: Styling framework
- **Ethers.js**: Blockchain interactions
- **Recharts**: Data visualization

### Blockchain Integration
- **Doma Testnet**: `https://api-testnet.doma.xyz/graphql`
- **GraphQL Subgraph**: Real-time on-chain data
- **Smart Contracts**: One-click actions (tokenization, auctions)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Yarn or npm
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/DomaInsight-Hackathon.git
cd DomaInsight-Hackathon
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your testnet private key
npm start
```

The backend will start on `http://localhost:3001`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the `backend/` directory:

```env
PORT=3001
DOMA_SUBGRAPH_URL=https://api-testnet.doma.xyz/graphql
DOMA_TESTNET_RPC=https://rpc-testnet.doma.xyz
PRIVATE_KEY=your_testnet_private_key_here
WALLET_ADDRESS=your_wallet_address_here
```

### Doma Protocol Integration
- **Subgraph**: Queries real domain data from Doma testnet
- **APIs/SDKs**: Used for tokenization and auction actions
- **State Sync**: Real-time data synchronization across chains

## 📊 Features

### 1. AI Domain Scoring
- **Input**: Domain name (e.g., "crypto.eth")
- **Processing**: Queries Doma subgraph for traits
- **AI Model**: Random Forest regressor trained on 30+ real domains
- **Output**: Score (0-100) with feature breakdown

**Scoring Factors**:
- Domain length (shorter = higher score)
- Keyword presence (crypto, nft, defi, etc.)
- TLD rarity (crypto.eth > mydomain.eth)
- Transaction history (more activity = higher score)
- Expiry status (longer expiry = higher score)

### 2. Trend Analytics
- **Market Overview**: Total domains, activities, average scores
- **TLD Analysis**: Most popular TLDs with statistics
- **Score Distribution**: High/Medium/Low quality breakdown
- **Time Series**: Monthly activity trends

### 3. Actionable Recommendations
Based on domain score and traits:
- **High Score (80+)**: Tokenize, List Auction
- **Medium Score (60-79)**: Hold & Develop, Market for Sale
- **Low Score (<60)**: Monitor Trends
- **Expiring Soon**: Renew Domain

### 4. One-Click Actions
- **Tokenize**: Convert domain to tradeable token
- **Auction**: List domain for auction
- **Renew**: Extend domain registration
- **Monitor**: Set up alerts for value changes

## 🔗 API Endpoints

### Backend API (`http://localhost:3001`)

#### Score Domain
```http
POST /score-domain
Content-Type: application/json

{
  "domainName": "crypto.eth"
}
```

**Response**:
```json
{
  "domainName": "crypto.eth",
  "score": 95,
  "features": {
    "length": 6,
    "hasKeyword": true,
    "tldRarity": 0.9,
    "txnHistory": 15,
    "expiryDays": 95
  },
  "recommendations": [
    {
      "action": "tokenize",
      "title": "Tokenize Domain",
      "description": "High-value domain suitable for tokenization",
      "priority": "high"
    }
  ]
}
```

#### Get Trends
```http
GET /get-trends
```

**Response**:
```json
{
  "totalDomains": 1000,
  "tldStats": [
    {
      "tld": "eth",
      "count": 500,
      "avgActivity": 5.2,
      "avgScore": 65
    }
  ],
  "scoreDistribution": {
    "high": 150,
    "medium": 400,
    "low": 450
  },
  "insights": {
    "mostPopularTld": "eth",
    "totalActivity": 5200,
    "avgScore": 58
  }
}
```

#### Health Check
```http
GET /health
```

## 🎯 Hackathon Alignment

### Track 4: Trait Scoring & Analytics
- ✅ **Scores traits to inform trades**: AI model analyzes domain traits for investment decisions
- ✅ **Captures trends for DeFi opps**: Real-time trend analysis identifies opportunities
- ✅ **Drives txns via recs**: One-click actions trigger smart contract transactions

### Impact Goals
- **Boost transactions**: 5-10x increase through better domain valuation
- **Increase users**: Transparent scoring attracts more participants
- **Generate revenue**: Premium features and transaction fees

## 🔍 Doma Protocol Usage

### Subgraph Integration
```graphql
query GetDomain($name: String!) {
  name(name: $name) {
    name
    tld
    expiry
    owner
    activities {
      type
      timestamp
    }
  }
}
```

### Smart Contract Actions
- **Tokenization**: Convert domains to ERC-721 tokens
- **Auctions**: List domains on Doma auction platform
- **Renewals**: Extend domain registration periods

### State Synchronization
- Real-time data updates across multiple chains
- Cross-chain domain ownership tracking
- Unified analytics across all supported networks

## 🧪 Testing

### End-to-End Testing

**Local Testing:**
```bash
# Install test dependencies
npm install puppeteer axios

# Test API endpoints
node test-api.js

# Test full user flow with browser automation
node test-e2e.js
```

**Live Deployment Testing:**
```bash
# Test live deployment
node test-live.js

# Test with custom URLs
FRONTEND_URL=https://your-frontend.vercel.app BACKEND_URL=https://your-backend.fly.dev node test-live.js
```

### Manual Testing

**Backend API Testing:**
```bash
# Health check
curl https://domainsight-backend.fly.dev/health

# Domain scoring
curl -X POST https://domainsight-backend.fly.dev/score-domain \
  -H "Content-Type: application/json" \
  -d '{"domainName": "crypto.eth"}'

# Get trends
curl https://domainsight-backend.fly.dev/get-trends

# Get alerts
curl https://domainsight-backend.fly.dev/get-alerts
```

**Frontend Testing:**
1. Visit https://domainsight-frontend.vercel.app
2. Enter a domain name (e.g., "crypto.eth")
3. Click "Score Domain"
4. View results and recommendations
5. Check trend analytics dashboard
6. Test wallet connection
7. Try on-chain actions

### Test Coverage

- ✅ Domain scoring with real Doma testnet data
- ✅ Smart recommendations generation
- ✅ On-chain action execution
- ✅ Multi-chain data synchronization
- ✅ Real-time alerts and monitoring
- ✅ Market trends and analytics
- ✅ Error handling and graceful failures
- ✅ Wallet connection and Web3 integration
- ✅ Mobile responsiveness
- ✅ CORS configuration

## 🚀 Deployment

### Backend Deployment (Fly.io)

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Deploy Backend:**
   ```bash
   chmod +x deploy-backend.sh
   ./deploy-backend.sh
   ```

3. **Manual Deployment:**
   ```bash
   cd backend
   flyctl auth login
   flyctl apps create domainsight-backend --generate-name
   flyctl secrets set PRIVATE_KEY="your_testnet_private_key"
   flyctl secrets set NODE_ENV="production"
   flyctl deploy
   ```

### Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend:**
   ```bash
   chmod +x deploy-frontend.sh
   ./deploy-frontend.sh
   ```

3. **Manual Deployment:**
   ```bash
   cd frontend
   echo "REACT_APP_API_URL=https://your-backend-url.fly.dev" > .env.local
   npm run build
   vercel --prod
   ```

### Environment Variables

**Backend (Fly.io):**
- `PRIVATE_KEY` - Your testnet wallet private key
- `NODE_ENV` - Set to "production"
- `DOMA_SUBGRAPH_URL` - Doma testnet subgraph URL
- `DOMA_TESTNET_RPC` - Doma testnet RPC URL

**Frontend (Vercel):**
- `REACT_APP_API_URL` - Your deployed backend URL

### Testing Live Deployment

```bash
# Test the live deployment
node test-live.js

# Test with custom URLs
FRONTEND_URL=https://your-frontend.vercel.app BACKEND_URL=https://your-backend.fly.dev node test-live.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

**Project**: DomaInsight  
**Track**: 4 - Trait Scoring & Analytics  
**Team**: Solo Build  
**Submission Date**: September 12, 2025  

### Key Features Delivered
- ✅ Real-time AI domain scoring (0-100)
- ✅ Trend analytics dashboard
- ✅ Actionable recommendations
- ✅ One-click smart contract actions
- ✅ Multi-chain support via Doma state sync
- ✅ No mocks - all live data from Doma testnet

### Demo Instructions
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Visit `http://localhost:3000`
4. Try scoring domains like "crypto.eth", "nft.eth", "defi.eth"
5. View trend analytics and recommendations

## 📞 Support

- **Documentation**: [Doma Protocol Docs](https://docs.doma.xyz)
- **Testnet**: [Doma Testnet](https://start.doma.xyz)
- **Issues**: [GitHub Issues](https://github.com/yourusername/DomaInsight-Hackathon/issues)

---

**Built with ❤️ for the Doma Protocol Hackathon**