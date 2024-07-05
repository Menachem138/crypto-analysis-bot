import axios from 'axios';

const API_KEY = process.env.COINMARKETCAP_API_KEY;

const instance = axios.create({
  baseURL: 'https://pro-api.coinmarketcap.com',
  headers: {'X-CMC_PRO_API_KEY': API_KEY}
});

const getMarketData = async (symbol) => {
  try {
    const response = await instance.get(`/v1/cryptocurrency/quotes/latest`, {
      params: {
        symbol: symbol
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

const getCopyTradingData = async () => {
  try {
    const response = await instance.get(`/v1/cryptocurrency/listings/latest`);
    return response.data;
  } catch (error) {
    console.error('Error fetching copy-trading data:', error);
    throw error;
  }
};

export {
  getMarketData,
  getCopyTradingData
};
