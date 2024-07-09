import axios from 'axios';

console.log('Environment variable REACT_APP_COINGECKO_API_KEY:', process.env.REACT_APP_COINGECKO_API_KEY);

const instance = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  headers: {
    'Authorization': `Bearer ${process.env.REACT_APP_COINGECKO_API_KEY}` // Use environment variable for API key
  }
});

const getMarketData = async (symbol) => {
  try {
    const requestParams = {
      vs_currency: 'usd',
      ids: symbol
    };
    console.log('Making request to CoinGecko API with parameters:', requestParams);
    const response = await instance.get(`/coins/markets`, {
      params: requestParams
    });
    console.log('Full request URL:', response.config.url);
    console.log('Received response from CoinGecko API:', response);
    console.log('Response data:', response.data); // Add detailed logging of response data
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
      vs_currency: 'usd'
    };
    console.log('Making request to CoinGecko API with parameters:', requestParams);
    const response = await instance.get(`/coins/list`, {
      params: requestParams
    });
    console.log('Full request URL:', response.config.url);
    console.log('Received response from CoinGecko API:', response);
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
