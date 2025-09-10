# DomaInsight End-to-End Tests

This directory contains end-to-end tests for the DomaInsight application using Puppeteer and Jest.

## Prerequisites

1. **Backend Server**: Ensure the DomaInsight backend is running on `http://localhost:3000`
2. **Frontend Server**: Ensure the React frontend is running on `http://localhost:3001`
3. **Dependencies**: Install test dependencies with `npm install`

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm run test:e2e:watch
```

### Run Tests in CI Mode
```bash
npm run test:e2e:ci
```

## Test Structure

### Test Categories

1. **Application Loading**
   - Homepage loading
   - Header display
   - Basic UI elements

2. **Domain Scoring Flow**
   - Full user journey: search → score → recommendations → action
   - Invalid domain handling
   - Loading states

3. **Filter Functionality**
   - TLD filtering
   - Score range filtering
   - Filter clearing

4. **Alerts Functionality**
   - Alert loading and display
   - Alert filtering
   - Refresh functionality

5. **Error Handling**
   - Network error simulation
   - Empty input validation
   - Graceful error recovery

6. **Mobile Responsiveness**
   - Mobile viewport testing
   - Touch interaction testing

7. **Performance and Loading**
   - Load time validation
   - Multiple request handling

8. **Accessibility**
   - Focus management
   - Keyboard navigation

9. **Cross-Browser Compatibility**
   - Different user agent testing

## Configuration

### Environment Variables

- `FRONTEND_URL`: Frontend application URL (default: http://localhost:3001)
- `BACKEND_URL`: Backend API URL (default: http://localhost:3000)
- `CI`: Set to 'true' for headless mode in CI environments

### Test Timeout

Tests are configured with a 30-second timeout to accommodate network requests and live data fetching.

## Mock Data

The tests use real Doma testnet data but include:
- Mock wallet connection for Web3 interactions
- Network error simulation for error handling tests
- Invalid domain testing for edge cases

## Debugging

### Visual Debugging
Set `headless: false` in the Puppeteer configuration to see the browser during tests.

### Console Logs
All test actions and results are logged to the console for debugging.

### Screenshots
Failed tests automatically capture screenshots for debugging.

## Best Practices

1. **Wait for Elements**: Always wait for elements to be present before interacting
2. **Handle Async Operations**: Use proper async/await patterns
3. **Clean State**: Reset state between tests
4. **Realistic Data**: Use real domain names for testing
5. **Error Scenarios**: Test both success and failure cases

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout or check if servers are running
2. **Element Not Found**: Ensure selectors match the current UI
3. **Network Errors**: Verify backend is accessible
4. **Browser Launch Issues**: Check Puppeteer installation and permissions

### Debug Commands

```bash
# Run single test with verbose output
npm run test:e2e -- --verbose

# Run tests with debug mode
DEBUG=puppeteer:* npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/test-e2e.js
```
