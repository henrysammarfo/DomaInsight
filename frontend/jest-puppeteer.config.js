module.exports = {
  launch: {
    headless: process.env.CI === 'true',
    slowMo: 100,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  server: {
    command: 'npm start',
    port: 3001,
    launchTimeout: 60000,
    debug: true
  }
};
