# DomaInsight

AI-Driven Domain Scoring & Predictive Analytics dApp for the Doma Protocol Hackathon (Track 4: Trait Scoring & Analytics). Built for submission by Sept 12, 2025, using live Doma testnet data—no mocks. Solves the problem of opaque domain valuation in DomainFi by scoring traits (e.g., length, keywords, TLD rarity) with AI, capturing trends, and driving on-chain actions (e.g., tokenization) to boost txns/users/revenue by 5-10x.

## Project Overview
- **Track**: Trait Scoring & Analytics
- **Goal**: Build an MVP that scores domain rarity using on-chain data from Doma's subgraph, visualizes trends, and provides DeFi recommendations with one-click actions.
- **Features**:
  - Real-time trait scoring (AI model, 0-100 score based on length, keywords, TLD, txns).
  - Trend analytics dashboard (Recharts heatmaps, basic predictions).
  - Actionable recs (e.g., "Tokenize domain") with live testnet txns via Doma APIs.
  - Multi-chain state sync for real-time data.
  - Simple alert for expiring high-score domains.
- **Impact**: Increases trading volume, attracts users with free analytics, generates protocol fees.

## Doma Protocol Usage
- **Subgraph**: Queries live domain metadata (name, TLD, expiry, owner, txns).
- **APIs/SDKs**: Reseller API for tokenization; smart contracts for actions.
- **State Sync**: Multi-chain data for real-time accuracy.
- **Testnet**: All features tested on https://start.doma.xyz/, logging txns/users/revenue potential.

## Track Goals Addressed
- Scores domain traits/rarity with AI, outperforming web2 metrics.
- Captures market trends (e.g., TLD demand) for informed trades.
- Drives on-chain activity: txns via tokenization/auctions, user onboarding, fee generation.

## Setup Instructions
1. Clone: `git clone https://github.com/yourusername/DomaInsight-Hackathon.git`
2. Install: `cd DomaInsight-Hackathon && yarn install`
3. Backend: `cd backend && node server.js` (set `PRIVATE_KEY` env var for testnet wallet).
4. Frontend: `cd frontend && yarn start`
5. Deployed: [Frontend URL], [Backend URL] (added post-deployment).

## Links
- Doma Docs: https://docs.doma.xyz
- Testnet: https://start.doma.xyz/
- X: https://x.com/DomaInsightProj
- Demo Video: [TBD post-build]

Built by [henrysammarfo] for Doma Hackathon. Open-source contributions welcome!
