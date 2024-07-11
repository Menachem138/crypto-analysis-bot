import axios from 'axios';
import ccxt from 'ccxt';

console.log('Environment variable REACT_APP_COINLAYER_API_KEY:', process.env.REACT_APP_COINLAYER_API_KEY);

const coinGeckoInstance = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
});

const getMarketData = async (symbol) => {
  try {
    const response = await coinGeckoInstance.get(`/simple/price`, {
      params: {
        ids: symbol,
        vs_currencies: 'usd',
      },
    });
    console.log('Received response from CoinGecko API:', response);
    if (response.data && response.data[symbol]) {
      console.log('Valid market data received:', response.data[symbol]);
      return response.data[symbol];
    } else {
      console.error('API response data is missing expected structure:', response.data);
      throw new Error('API response data is missing expected structure');
    }
  } catch (error) {
    console.error('Error fetching market data:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
    });
    console.log('Full error object:', error);
    console.log('Request config:', error.config);
    throw error;
  }
};

const getCopyTradingData = async () => {
  try {
    const exchange = new ccxt.binance();
    const markets = await exchange.loadMarkets();
    console.log('Received response from CCXT library:', markets);
    return markets;
  } catch (error) {
    console.error('Error fetching copy-trading data:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
    });
    console.log('Full error object:', error);
    console.log('Request config:', error.config);
    throw error;
  }
};

export {
  getMarketData,
  getCopyTradingData,
};
