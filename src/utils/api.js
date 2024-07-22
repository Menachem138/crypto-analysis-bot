import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:46735/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const api = {
  // User management
  register: (userData) => axiosInstance.post('/register', userData),
  login: (credentials) => axiosInstance.post('/login', credentials),

  // Subscription management
  getSubscriptions: (userId) => axiosInstance.get(`/subscriptions/${userId}`),
  addSubscription: (subscriptionData) => axiosInstance.post('/subscription', subscriptionData),
  updateSubscription: (subscriptionId, subscriptionData) => axiosInstance.put(`/subscription/${subscriptionId}`, subscriptionData),
  deleteSubscription: (subscriptionId) => axiosInstance.delete(`/subscription/${subscriptionId}`),

  // Categories
  getCategories: () => axiosInstance.get('/categories'),

  // Statistics and insights
  getStatistics: (userId) => axiosInstance.get(`/statistics/${userId}`),
  getInsights: (userId) => axiosInstance.get(`/insights/${userId}`),

  // Visualizations
  getVisualizations: async (userId) => {
    try {
      const response = await axiosInstance.get(`/visualizations/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching visualizations:', error);
      throw error;
    }
  },

  // Expenses
  addExpense: async (expenseData) => {
    try {
      const response = await axiosInstance.post('/expenses', expenseData);
      return response.data;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  getAllExpensesForUser: async (userId) => {
    try {
      const response = await axiosInstance.get(`/expenses/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },
};

export default api;