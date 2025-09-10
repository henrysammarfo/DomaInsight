#!/bin/bash

echo "Starting DomaInsight Frontend"
echo "============================="
echo ""

echo "Installing dependencies..."
npm install

echo ""
echo "Starting React development server..."
echo "Frontend will be available at: http://localhost:3001"
echo "Backend proxy configured to: http://localhost:3000"
echo ""

npm start
