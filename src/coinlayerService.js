import axios from 'axios';

console.log('Environment variable REACT_APP_COINLAYER_API_KEY:', process.env.REACT_APP_COINLAYER_API_KEY);

const instance = axios.create({
  baseURL: 'https://api.coinlayer.com', // Use HTTPS instead of HTTP
  headers: {
    'access_key': '11fea5cda29c95e1ec2945a380495a01' // Hardcode the API key for debugging purposes
  }
});

const getMarketData = async (symbol) => {
  try {
    const requestParams = {
      access_key: '11fea5cda29c95e1ec2945a380495a01', // Hardcode the API key for debugging purposes
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
      throw new Error('API response data is missing expected structure');
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
      access_key: '11fea5cda29c95e1ec2945a380495a01', // Hardcode the API key for debugging purposes
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
