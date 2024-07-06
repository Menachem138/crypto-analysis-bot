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

app.use('/api', createProxyMiddleware({
  target: 'https://pro-api.coinmarketcap.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to the target
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add the CoinMarketCap API key to the request headers
    proxyReq.setHeader('X-CMC_PRO_API_KEY', '155ec3b4-cd0a-485a-9e03-b5147fdf8e7f');
    // Log the outgoing request headers to a file
    const logEntry = `Outgoing request headers: ${JSON.stringify(proxyReq.getHeaders())}\n`;
    fs.appendFileSync(logFilePath, logEntry);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
  },
}));

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
