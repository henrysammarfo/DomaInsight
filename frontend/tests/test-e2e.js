const puppeteer = require('puppeteer');

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_DOMAIN = 'johnify.io';
const TEST_INVALID_DOMAIN = 'invalid-domain-that-does-not-exist.eth';

// Test timeout
const TEST_TIMEOUT = 30000;

describe('DomaInsight End-to-End Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Launch browser with options
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true', // Run headless in CI
      slowMo: 100, // Slow down actions for visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Enable request interception for network testing
    await page.setRequestInterception(true);
    
    // Mock wallet connection
    await page.evaluateOnNewDocument(() => {
      // Mock Web3Modal and wallet connection
      window.ethereum = {
        isMetaMask: true,
        request: async (params) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'];
          }
          if (params.method === 'eth_accounts') {
            return ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'];
          }
          return null;
        },
        on: () => {},
        removeListener: () => {}
      };
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    // Navigate to the app before each test
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  describe('Application Loading', () => {
    test('should load the homepage successfully', async () => {
      const title = await page.title();
      expect(title).toContain('DomaInsight');
      
      // Check if main elements are present
      await expect(page.$('h1')).resolves.toBeTruthy();
      await expect(page.$('input[placeholder*="domain"]')).resolves.toBeTruthy();
      await expect(page.$('button:has-text("Score Domain")')).resolves.toBeTruthy();
    }, TEST_TIMEOUT);

    test('should display the header with correct information', async () => {
      const headerText = await page.$eval('h1', el => el.textContent);
      expect(headerText).toContain('DomaInsight');
      
      const subtitle = await page.$eval('p', el => el.textContent);
      expect(subtitle).toContain('AI-Driven Domain Scoring');
    }, TEST_TIMEOUT);
  });

  describe('Domain Scoring Flow', () => {
    test('should complete full user flow: search → score → recommendations → action', async () => {
      // Step 1: Search for a domain
      await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      
      // Wait for scoring to complete
      await page.waitForSelector('.text-4xl.font-bold', { timeout: 15000 });
      
      // Step 2: Verify score display
      const scoreElement = await page.$('.text-4xl.font-bold');
      expect(scoreElement).toBeTruthy();
      
      const score = await page.$eval('.text-4xl.font-bold', el => el.textContent);
      expect(score).toMatch(/^\d+$/); // Should be a number
      
      // Step 3: Check recommendations section
      await page.waitForSelector('[class*="recommendation"]', { timeout: 10000 });
      const recommendations = await page.$$('[class*="recommendation"]');
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Step 4: Test action button (if recommendations exist)
      const actionButtons = await page.$$('button:has-text("Act Now"), button:has-text("Tokenize"), button:has-text("Renew")');
      if (actionButtons.length > 0) {
        // Click first action button
        await actionButtons[0].click();
        
        // Wait for wallet connection or action response
        await page.waitForTimeout(2000);
        
        // Check for success message or wallet connection prompt
        const hasSuccessMessage = await page.$('text="Transaction hash"') !== null;
        const hasWalletPrompt = await page.$('text="Connect Wallet"') !== null;
        
        expect(hasSuccessMessage || hasWalletPrompt).toBeTruthy();
      }
    }, TEST_TIMEOUT);

    test('should handle invalid domain gracefully', async () => {
      // Enter invalid domain
      await page.type('input[placeholder*="domain"]', TEST_INVALID_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      
      // Wait for error message
      await page.waitForSelector('[class*="error"]', { timeout: 10000 });
      
      const errorMessage = await page.$eval('[class*="error"]', el => el.textContent);
      expect(errorMessage).toContain('not found');
    }, TEST_TIMEOUT);

    test('should show loading state during scoring', async () => {
      await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      
      // Check for loading state
      const loadingButton = await page.$('button:has-text("Scoring")');
      expect(loadingButton).toBeTruthy();
      
      // Wait for loading to complete
      await page.waitForSelector('button:has-text("Score Domain")', { timeout: 15000 });
    }, TEST_TIMEOUT);
  });

  describe('Filter Functionality', () => {
    test('should apply TLD filter and update results', async () => {
      // First, score a domain to get some data
      await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      await page.waitForSelector('.text-4xl.font-bold', { timeout: 15000 });
      
      // Apply TLD filter
      const tldFilter = await page.$('select');
      if (tldFilter) {
        await page.select('select', 'eth');
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Check if filter is applied (this would depend on your filter implementation)
        const filterValue = await page.$eval('select', el => el.value);
        expect(filterValue).toBe('eth');
      }
    }, TEST_TIMEOUT);

    test('should apply score range filter', async () => {
      // Look for score range filter buttons
      const scoreButtons = await page.$$('button:has-text("High"), button:has-text("Medium"), button:has-text("Low")');
      
      if (scoreButtons.length > 0) {
        // Click on High score filter
        await scoreButtons[0].click();
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Verify filter is active (check for active state styling)
        const activeButton = await page.$('button[class*="bg-blue"]');
        expect(activeButton).toBeTruthy();
      }
    }, TEST_TIMEOUT);

    test('should clear all filters', async () => {
      // Apply some filters first
      const clearButton = await page.$('button:has-text("Clear")');
      if (clearButton) {
        await clearButton.click();
        
        // Wait for filters to clear
        await page.waitForTimeout(1000);
        
        // Verify filters are reset
        const selectElements = await page.$$('select');
        for (const select of selectElements) {
          const value = await page.$eval(select, el => el.value);
          expect(value).toBe('all');
        }
      }
    }, TEST_TIMEOUT);
  });

  describe('Alerts Functionality', () => {
    test('should load and display domain alerts', async () => {
      // Wait for alerts section to load
      await page.waitForSelector('text="Domain Alerts"', { timeout: 10000 });
      
      // Check if alerts are present
      const alertsSection = await page.$('text="Domain Alerts"');
      expect(alertsSection).toBeTruthy();
      
      // Wait for alerts to load (they might be empty)
      await page.waitForTimeout(5000);
      
      // Check for either alerts or "no alerts" message
      const hasAlerts = await page.$('[class*="alert"]') !== null;
      const hasNoAlertsMessage = await page.$('text="No alerts found"') !== null;
      
      expect(hasAlerts || hasNoAlertsMessage).toBeTruthy();
    }, TEST_TIMEOUT);

    test('should apply alerts filters', async () => {
      // Wait for alerts section
      await page.waitForSelector('text="Domain Alerts"', { timeout: 10000 });
      
      // Look for filter dropdowns in alerts section
      const alertFilters = await page.$$('select');
      
      if (alertFilters.length > 0) {
        // Apply a filter
        await page.select('select', 'eth');
        
        // Wait for filter to apply
        await page.waitForTimeout(2000);
        
        // Verify filter is applied
        const filterValue = await page.$eval('select', el => el.value);
        expect(filterValue).toBe('eth');
      }
    }, TEST_TIMEOUT);

    test('should refresh alerts when refresh button is clicked', async () => {
      // Wait for alerts section
      await page.waitForSelector('text="Domain Alerts"', { timeout: 10000 });
      
      // Find refresh button
      const refreshButton = await page.$('button:has-text("Refresh")');
      if (refreshButton) {
        await refreshButton.click();
        
        // Wait for refresh to complete
        await page.waitForTimeout(3000);
        
        // Verify the section is still present (refresh didn't break anything)
        const alertsSection = await page.$('text="Domain Alerts"');
        expect(alertsSection).toBeTruthy();
      }
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Intercept network requests to simulate failure
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        if (request.url().includes('/score-domain')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // Try to score a domain
      await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      
      // Wait for error message
      await page.waitForSelector('[class*="error"]', { timeout: 10000 });
      
      const errorMessage = await page.$eval('[class*="error"]', el => el.textContent);
      expect(errorMessage).toContain('connection');
    }, TEST_TIMEOUT);

    test('should handle empty domain input', async () => {
      // Try to score without entering a domain
      await page.click('button:has-text("Score Domain")');
      
      // Wait for error message
      await page.waitForSelector('[class*="error"]', { timeout: 5000 });
      
      const errorMessage = await page.$eval('[class*="error"]', el => el.textContent);
      expect(errorMessage).toContain('enter a domain');
    }, TEST_TIMEOUT);
  });

  describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      
      // Reload page
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Check if main elements are still accessible
      await expect(page.$('input[placeholder*="domain"]')).resolves.toBeTruthy();
      await expect(page.$('button:has-text("Score Domain")')).resolves.toBeTruthy();
      
      // Test mobile interaction
      await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      
      // Wait for results
      await page.waitForSelector('.text-4xl.font-bold', { timeout: 15000 });
      
      const scoreElement = await page.$('.text-4xl.font-bold');
      expect(scoreElement).toBeTruthy();
    }, TEST_TIMEOUT);
  });

  describe('Performance and Loading', () => {
    test('should load within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    }, TEST_TIMEOUT);

    test('should handle multiple rapid requests', async () => {
      // Make multiple rapid domain searches
      for (let i = 0; i < 3; i++) {
        await page.type('input[placeholder*="domain"]', `test${i}.eth`);
        await page.click('button:has-text("Score Domain")');
        await page.waitForTimeout(1000);
        
        // Clear input for next iteration
        await page.$eval('input[placeholder*="domain"]', el => el.value = '');
      }
      
      // Verify the app is still responsive
      const inputElement = await page.$('input[placeholder*="domain"]');
      expect(inputElement).toBeTruthy();
    }, TEST_TIMEOUT);
  });

  describe('Accessibility', () => {
    test('should have proper focus management', async () => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = await page.$(':focus');
      expect(focusedElement).toBeTruthy();
    }, TEST_TIMEOUT);

    test('should support keyboard navigation', async () => {
      // Navigate using keyboard
      await page.focus('input[placeholder*="domain"]');
      await page.keyboard.type(TEST_DOMAIN);
      await page.keyboard.press('Enter');
      
      // Wait for scoring to complete
      await page.waitForSelector('.text-4xl.font-bold', { timeout: 15000 });
      
      const scoreElement = await page.$('.text-4xl.font-bold');
      expect(scoreElement).toBeTruthy();
    }, TEST_TIMEOUT);
  });

  describe('Cross-Browser Compatibility', () => {
    test('should work with different user agents', async () => {
      // Test with different user agents
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];
      
      for (const userAgent of userAgents) {
        await page.setUserAgent(userAgent);
        await page.reload({ waitUntil: 'networkidle0' });
        
        // Verify basic functionality
        await expect(page.$('h1')).resolves.toBeTruthy();
        await expect(page.$('input[placeholder*="domain"]')).resolves.toBeTruthy();
      }
    }, TEST_TIMEOUT);
  });
});

// Helper function to wait for element with text content
async function waitForElementWithText(page, selector, text, timeout = 10000) {
  await page.waitForFunction(
    (selector, text) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).some(el => el.textContent.includes(text));
    },
    { timeout },
    selector,
    text
  );
}

// Helper function to check if element exists
async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}
