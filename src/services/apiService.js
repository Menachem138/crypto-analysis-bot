import axios from 'axios';

const BASE_URL = 'https://api.coingecko.com/api/v3';

const apiService = {
  getPing: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/ping`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ping:', error);
      throw error;
    }
  },

  getSimplePrice: async (ids, vsCurrencies) => {
    try {
      const response = await axios.get(`${BASE_URL}/simple/price`, {
        params: {
          ids,
          vs_currencies: vsCurrencies,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching simple price:', error);
      throw error;
    }
  },

  getCoinsMarkets: async (vsCurrency, order = 'market_cap_desc', perPage = 100, page = 1, sparkline = false) => {
    try {
      const response = await axios.get(`${BASE_URL}/coins/markets`, {
        params: {
          vs_currency: vsCurrency,
          order,
          per_page: perPage,
          page,
          sparkline,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching coins markets:', error);
      throw error;
    }
  },

  getCoinById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/coins/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching coin data for ${id}:`, error);
      throw error;
    }
  },

  getCoinHistory: async (id, date) => {
    try {
      const response = await axios.get(`${BASE_URL}/coins/${id}/history`, {
        params: {
          date,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching coin history for ${id} on ${date}:`, error);
      throw error;
    }
  },

  getCoinMarketChart: async (id, vsCurrency, days) => {
    try {
      const response = await axios.get(`${BASE_URL}/coins/${id}/market_chart`, {
        params: {
          vs_currency: vsCurrency,
          days,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching market chart for ${id}:`, error);
      throw error;
    }
  },

  getExchangeRates: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/exchange_rates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  },

  getTrendingSearches: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/search/trending`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      throw error;
    }
  },

  getGlobalData: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/global`);
      return response.data;
    } catch (error) {
      console.error('Error fetching global data:', error);
      throw error;
    }
  },
};

export default apiService;
