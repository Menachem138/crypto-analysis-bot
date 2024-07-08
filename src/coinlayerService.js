import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://api.coinlayer.com',
  headers: {
    'apikey': '11fea5cda29c95e1ec2945a380495a01'
  }
});

const getMarketData = async (symbol) => {
  try {
    const requestParams = {
      access_key: '11fea5cda29c95e1ec2945a380495a01',
      target: 'USD',
      symbols: symbol
    };
    console.log('Making request to Coinlayer API with parameters:', requestParams);
    const response = await instance.get(`/api/live`, {
      params: requestParams
    });
    console.log('Full request URL:', response.config.url);
    console.log('Received response from Coinlayer API:', response);
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
      access_key: '11fea5cda29c95e1ec2945a380495a01',
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