import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 5000;

app.use('/api', createProxyMiddleware({
  target: 'https://pro-api.coinmarketcap.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding to the target
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add the CoinMarketCap API key to the request headers
    proxyReq.setHeader('X-CMC_PRO_API_KEY', '155ec3b4-cd0a-485a-9e03-b5147fdf8e7f');
  },
}));

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
