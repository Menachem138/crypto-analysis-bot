import axios from 'axios';

console.log('Environment variable REACT_APP_COINLAYER_API_KEY:', process.env.REACT_APP_COINLAYER_API_KEY);

const instance = axios.create({
  baseURL: 'https://api.coinlayer.com',
  headers: {
    'access_key': process.env.REACT_APP_COINLAYER_API_KEY // Use environment variable for API key
  }
});

const getMarketData = async (symbol) => {
  try {
    const requestParams = {
      access_key: process.env.REACT_APP_COINLAYER_API_KEY, // Use environment variable for API key
      target: 'USD',
      symbols: symbol
    };
    console.log('Making request to Coinlayer API with parameters:', requestParams);
    const response = await instance.get(`/api/live`, {
      params: requestParams
    });
    console.log('Full request URL:', response.config.url);
    console.log('Received response from Coinlayer API:', response);
    console.log('Response data structure:', response.data);

    // Additional logging to capture the structure of the API response
    if (response.data && response.data.rates) {
      console.log('Valid market data received:', response.data.rates);
    } else {
      console.error('API response data is missing expected structure:', response.data);
    }

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
      access_key: process.env.REACT_APP_COINLAYER_API_KEY, // Use environment variable for API key
      target: 'USD'
    };
    console.log('Making request to Coinlayer API with parameters:', requestParams);
    const response = await instance.get(`/api/list`, {
      params: requestParams
    });
    console.log('Full request URL:', response.config.url);
    console.log('Received response from Coinlayer API:', response);
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
