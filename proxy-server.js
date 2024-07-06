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
    const apiKey = '155ec3b4-cd0a-485a-9e03-b5147fdf8e7f'; // Hard-coded API key for testing
    console.log(`Hard-coded API Key: ${apiKey}`); // Log the hard-coded API key for debugging
    proxyReq.setHeader('X-CMC_PRO_API_KEY', apiKey);
    console.log(`Set X-CMC_PRO_API_KEY header: ${proxyReq.getHeader('X-CMC_PRO_API_KEY')}`); // Log the actual header value

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
