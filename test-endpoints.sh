#!/bin/bash

echo "Testing DomaInsight Backend API Endpoints"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001"

# Test health endpoint
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.' || echo "Health check failed"
echo ""

# Test domain scoring
echo "2. Testing Domain Scoring..."
curl -s -X POST "$BASE_URL/score-domain" \
  -H "Content-Type: application/json" \
  -d '{"domainName": "crypto.eth"}' | jq '.' || echo "Domain scoring failed"
echo ""

# Test smart recommendations
echo "3. Testing Smart Recommendations..."
curl -s -X POST "$BASE_URL/recommend-actions" \
  -H "Content-Type: application/json" \
  -d '{"domainName": "crypto.eth", "score": 85, "features": {"hasKeyword": true, "tldRarity": 0.9}}' | jq '.' || echo "Recommendations failed"
echo ""

# Test on-chain action (tokenize)
echo "4. Testing On-Chain Action (Tokenize)..."
curl -s -X POST "$BASE_URL/trigger-action" \
  -H "Content-Type: application/json" \
  -d '{"action": "tokenize", "domainName": "crypto.eth", "chain": "testnet"}' | jq '.' || echo "Tokenize action failed"
echo ""

# Test on-chain action (auction)
echo "5. Testing On-Chain Action (Auction)..."
curl -s -X POST "$BASE_URL/trigger-action" \
  -H "Content-Type: application/json" \
  -d '{"action": "auction", "domainName": "nft.eth", "chain": "testnet"}' | jq '.' || echo "Auction action failed"
echo ""

# Test alerts
echo "6. Testing Alerts..."
curl -s "$BASE_URL/get-alerts" | jq '.' || echo "Alerts failed"
echo ""

# Test trends
echo "7. Testing Trends..."
curl -s "$BASE_URL/get-trends" | jq '.' || echo "Trends failed"
echo ""

# Test multi-chain scoring
echo "8. Testing Multi-Chain Scoring..."
curl -s -X POST "$BASE_URL/score-domain-multi" \
  -H "Content-Type: application/json" \
  -d '{"domainName": "defi.eth", "chain": "testnet"}' | jq '.' || echo "Multi-chain scoring failed"
echo ""

# Test multi-chain trends
echo "9. Testing Multi-Chain Trends..."
curl -s "$BASE_URL/get-trends-multi" | jq '.' || echo "Multi-chain trends failed"
echo ""

# Test state sync status
echo "10. Testing State Sync Status..."
curl -s "$BASE_URL/state-sync-status" | jq '.' || echo "State sync status failed"
echo ""

echo "API Testing Complete!"
echo "====================="
