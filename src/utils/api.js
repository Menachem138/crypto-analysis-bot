import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:46735/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // Increase timeout to 60 seconds
});

const handleApiError = (error, operation) => {
  let errorMessage = `Error during ${operation}: `;
  if (error.response) {
    errorMessage += `Server responded with status ${error.response.status}. `;
    errorMessage += error.response.data.message || JSON.stringify(error.response.data);
  } else if (error.request) {
    errorMessage += 'No response received from server. Please check your internet connection.';
  } else {
    errorMessage += error.message;
  }
  console.error(errorMessage);
  console.error(`Detailed ${operation} error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
  return errorMessage;
};

const api = {
  retryApiCall: async (apiCall, retries = 3, initialDelay = 1000) => {
    try {
      return await apiCall();
    } catch (error) {
      if (retries > 0 && (error.message.includes('timeout') || error.response?.status >= 500)) {
        const delay = initialDelay * Math.pow(2, 3 - retries);
        console.log(`Retrying API call. Attempts left: ${retries}. Waiting for ${delay}ms.`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api.retryApiCall(apiCall, retries - 1, initialDelay);
      }
      throw error;
    }
  },

  // User management
  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/register', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'user registration');
    }
  },
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/login', credentials);
      return response.data;
    } catch (error) {
      handleApiError(error, 'user login');
    }
  },

  // Subscription management
  getSubscriptions: async (userId) => {
    try {
      const response = await axiosInstance.get(`/subscriptions/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'fetching subscriptions');
    }
  },
  addSubscription: async (subscriptionData) => {
    try {
      const response = await axiosInstance.post('/subscription', subscriptionData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'adding subscription');
    }
  },
  updateSubscription: async (subscriptionId, subscriptionData) => {
    try {
      const response = await axiosInstance.put(`/subscription/${subscriptionId}`, subscriptionData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'updating subscription');
    }
  },
  deleteSubscription: async (subscriptionId) => {
    try {
      const response = await axiosInstance.delete(`/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'deleting subscription');
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const response = await axiosInstance.get('/categories');
      return response.data;
    } catch (error) {
      handleApiError(error, 'fetching categories');
    }
  },

  // Statistics and insights
  getStatistics: async (userId) => {
    try {
      const response = await axiosInstance.get(`/statistics/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'fetching statistics');
    }
  },
  getInsights: async (userId) => {
    try {
      const response = await axiosInstance.get(`/insights/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'fetching insights');
    }
  },

  // Visualizations
  getVisualizations: async (userId) => {
    try {
      console.log('Fetching visualizations for user:', userId);
      return await api.retryApiCall(async () => {
        console.log('Attempting API call for visualizations');
        const response = await axiosInstance.get(`/visualizations/${userId}`);
        console.log('Visualization API response:', response);
        return response.data;
      });
    } catch (error) {
      const errorMessage = handleApiError(error, 'fetching visualizations');
      throw new Error(errorMessage);
    }
  },

  // Expenses
  addExpense: async (expenseData) => {
    try {
      const response = await axiosInstance.post('/expenses', expenseData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'adding expense');
    }
  },

  getAllExpensesForUser: async (userId) => {
    try {
      const response = await axiosInstance.get(`/expenses/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'fetching expenses');
    }
  },
};

export default api;