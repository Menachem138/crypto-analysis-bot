import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('REACT_APP_COINMARKETCAP_API_KEY:', process.env.REACT_APP_COINMARKETCAP_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Add CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

const logFilePath = path.join(__dirname, 'proxy-logs.txt');

// Ensure the log file is created if it does not exist
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '');
}

// Add logging for incoming requests
app.use((req, res, next) => {
  const logEntry = `Incoming request: ${req.method} ${req.url}\nHeaders: ${JSON.stringify(req.headers)}\n`;
  fs.appendFileSync(logFilePath, logEntry);
  console.log(logEntry); // Console log for debugging
  next();
});

app.use('/api', createProxyMiddleware({
  target: 'https://pro-api.coinmarketcap.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to the target
  },
  // Add the API key to the request headers
  onProxyReq: (proxyReq, req, res) => {
    console.log('onProxyReq function called'); // Log statement to confirm function execution
    const apiKey = process.env.REACT_APP_COINMARKETCAP_API_KEY; // Use the environment variable for the API key
    console.log(`API Key: ${apiKey}`); // Log the API key for debugging
    console.log('Environment Variables at onProxyReq:', process.env); // Log environment variables at this point
    console.log('Outgoing request headers before setting API key:', proxyReq.getHeaders()); // Log headers before setting API key
    try {
      proxyReq.setHeader('X-CMC_PRO_API_KEY', apiKey);
      console.log(`Set X-CMC_PRO_API_KEY header: ${proxyReq.getHeader('X-CMC_PRO_API_KEY')}`); // Log the actual header value
    } catch (error) {
      console.error('Error setting X-CMC_PRO_API_KEY header:', error);
    }
    console.log('Outgoing request headers after setting API key:', proxyReq.getHeaders()); // Log headers after setting API key
    console.log('Final outgoing request headers:', proxyReq.getHeaders()); // Log final headers before sending the request
    console.log('Final outgoing request headers before sending:', proxyReq.getHeaders()); // Log final headers before sending the request
    console.log('Full request object:', req); // Log the entire request object for debugging
    // Additional logging to confirm function execution
    console.log('onProxyReq function execution completed');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    // Log the response headers and status code
    const logEntry = `Response status: ${proxyRes.statusCode}\nResponse headers: ${JSON.stringify(proxyRes.headers)}\n`;
    fs.appendFileSync(logFilePath, logEntry);
    console.log(logEntry); // Console log for debugging

    // Log the response body
    let responseBody = '';
    proxyRes.on('data', (chunk) => {
      responseBody += chunk;
    });
    proxyRes.on('end', () => {
      const logEntry = `Response body: ${responseBody}\n`;
      fs.appendFileSync(logFilePath, logEntry);
      console.log(logEntry); // Console log for debugging
    });
  },
  onError: (err, req, res) => {
    // Log any errors that occur during the request forwarding process
    const logEntry = `Error during request forwarding: ${err.message}\n`;
    fs.appendFileSync(logFilePath, logEntry);
    console.log(logEntry); // Console log for debugging
    res.status(500).send('Proxy error');
  }
}));

// Log environment variables for debugging
console.log('Environment Variables:', process.env);

// Additional log entry to confirm server restart
console.log('Proxy server is starting...');

// Log statement to confirm file reload
console.log('Proxy server file reloaded with latest changes.');

// Unique log statement to confirm file reload
console.log('Unique log statement: Proxy server code is up to date.');

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
