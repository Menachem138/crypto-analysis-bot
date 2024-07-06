import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const apiKey = process.env.REACT_APP_COINMARKETCAP_API_KEY; // Use environment variable for API key
    console.log(`Environment API Key: ${apiKey}`); // Log the environment API key for debugging
    console.log('Outgoing request headers before setting API key:', proxyReq.getHeaders()); // Log headers before setting API key
    if (!apiKey) {
      console.error('API Key is missing! Stopping the server.'); // Log an error if the API key is not set
      process.exit(1); // Stop the server if the API key is missing
    } else {
      try {
        proxyReq.setHeader('X-CMC_PRO_API_KEY', apiKey);
        console.log(`Set X-CMC_PRO_API_KEY header: ${proxyReq.getHeader('X-CMC_PRO_API_KEY')}`); // Log the actual header value
      } catch (error) {
        console.error('Error setting X-CMC_PRO_API_KEY header:', error);
      }
    }
    console.log('Outgoing request headers after setting API key:', proxyReq.getHeaders()); // Log headers after setting API key
    console.log('Final outgoing request headers:', proxyReq.getHeaders()); // Log final headers before sending the request
    // Additional diagnostic logging
    console.log('Checking if X-CMC_PRO_API_KEY header is present:', proxyReq.getHeader('X-CMC_PRO_API_KEY') !== undefined);
    console.log('X-CMC_PRO_API_KEY header value:', proxyReq.getHeader('X-CMC_PRO_API_KEY')); // Log the header value for confirmation

    // Log the outgoing request headers to a file
    const logEntry = `Outgoing request headers after setting API key: ${JSON.stringify(proxyReq.getHeaders())}\n`;
    fs.appendFileSync(logFilePath, logEntry);
    console.log(logEntry); // Console log for debugging

    // Log the entire request object for debugging
    const fullRequestLog = `Full request object: ${JSON.stringify(proxyReq)}\n`;
    fs.appendFileSync(logFilePath, fullRequestLog);
    console.log(fullRequestLog); // Console log for debugging

    // Additional logging to confirm headers are set correctly
    const headersLog = `Headers after setting API key: ${JSON.stringify(proxyReq.getHeaders())}\n`;
    fs.appendFileSync(logFilePath, headersLog);
    console.log(headersLog); // Console log for debugging

    // Log the specific 'X-CMC_PRO_API_KEY' header value
    const apiKeyHeaderLog = `X-CMC_PRO_API_KEY header value: ${proxyReq.getHeader('X-CMC_PRO_API_KEY')}\n`;
    fs.appendFileSync(logFilePath, apiKeyHeaderLog);
    console.log(apiKeyHeaderLog); // Console log for debugging

    // Additional logging right before the request is sent
    const finalHeadersLog = `Final outgoing request headers: ${JSON.stringify(proxyReq.getHeaders())}\n`;
    fs.appendFileSync(logFilePath, finalHeadersLog);
    console.log(finalHeadersLog); // Console log for debugging

    // Log the outgoing request headers to the console
    console.log('Outgoing request headers:', proxyReq.getHeaders());
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

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
