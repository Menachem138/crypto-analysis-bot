import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api'
});

const getMarketData = async (symbol) => {
  try {
    const requestParams = {
      symbol: symbol,
      convert: 'USD' // Ensure the response is in USD
    };
    console.log('Making request to CoinMarketCap API with parameters:', requestParams);
    const response = await instance.get(`/v1/cryptocurrency/quotes/latest`, {
      params: requestParams
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
    console.log('Full error object:', error);
    console.log('Request config:', error.config);
    throw error;
  }
};

const getCopyTradingData = async () => {
  try {
    const requestParams = {
      start: 1,
      limit: 10,
      convert: 'USD' // Ensure the response is in USD
    };
    console.log('Making request to CoinMarketCap API with parameters:', requestParams);
    const response = await instance.get(`/v1/cryptocurrency/listings/latest`, {
      params: requestParams
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
    console.log('Full error object:', error);
    console.log('Request config:', error.config);
    throw error;
  }
};

export {
  getMarketData,
  getCopyTradingData
};
