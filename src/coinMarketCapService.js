import axios from 'axios';

const API_KEY = process.env.REACT_APP_COINMARKETCAP_API_KEY;

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {'X-CMC_PRO_API_KEY': API_KEY}
});

const getMarketData = async (symbol) => {
  try {
    console.log('Making request to CoinMarketCap API with parameters:', {
      symbol: symbol,
      convert: 'USD'
    });
    const response = await instance.get(`/v1/cryptocurrency/quotes/latest`, {
      params: {
        symbol: symbol,
        convert: 'USD' // Ensure the response is in USD
      }
    });
    console.log('Received response from CoinMarketCap API:', response);
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
    console.log('Making request to CoinMarketCap API with parameters:', {
      start: 1,
      limit: 10,
      convert: 'USD'
    });
    const response = await instance.get(`/v1/cryptocurrency/listings/latest`, {
      params: {
        start: 1,
        limit: 10,
        convert: 'USD' // Ensure the response is in USD
      }
    });
    console.log('Received response from CoinMarketCap API:', response);
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
