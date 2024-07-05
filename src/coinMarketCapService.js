import axios from 'axios';

const API_KEY = process.env.REACT_APP_COINMARKETCAP_API_KEY;

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
    console.error('Error fetching market data:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
    throw error;
  }
};

const getCopyTradingData = async () => {
  try {
    const response = await instance.get(`/v1/cryptocurrency/listings/latest`);
    return response.data;
  } catch (error) {
    console.error('Error fetching copy-trading data:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
    throw error;
  }
};

export {
  getMarketData,
  getCopyTradingData
};
