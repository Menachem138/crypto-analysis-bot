import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, Button } from '@chakra-ui/react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../utils/api';

const Statistics = ({ userId }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await api.getVisualizations(userId);
      setData(response);
      console.log('Received visualization data:', response);
      setError(null);
    } catch (err) {
      console.error('Error fetching visualization data:', err);
      console.error('Detailed error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      let errorMessage = 'An error occurred while fetching data';
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Server error: ${err.response.status} ${err.response.statusText}`;
        console.error('Server response:', err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server. Please check your network connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message || 'Unknown error occurred';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const refreshData = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <Box>
      <Button onClick={refreshData} mb={4}>Refresh Data</Button>
      <VStack spacing={4}>
        <Box>
          <Text>Expense Distribution</Text>
          {data.expenseDistribution ? (
            <Bar data={data.expenseDistribution} />
          ) : (
            <Text>Error: Unable to load Expense Distribution chart</Text>
          )}
        </Box>
        <Box>
          <Text>Expense Trends</Text>
          {data.expenseTrends ? (
            <Line data={data.expenseTrends} />
          ) : (
            <Text>Error: Unable to load Expense Trends chart</Text>
          )}
        </Box>
        <Box>
          <Text>Expense Comparison</Text>
          {data.expenseComparison ? (
            <Bar data={data.expenseComparison} />
          ) : (
            <Text>Error: Unable to load Expense Comparison chart</Text>
          )}
        </Box>
        {data.dashboardSummary && (
          <Box>
            <Text>Dashboard Summary</Text>
            <Text>Total Expenses: ${data.dashboardSummary.totalExpenses}</Text>
            <Text>Average Expense: ${data.dashboardSummary.averageExpense}</Text>
            <Text>Highest Expense: ${data.dashboardSummary.highestExpense}</Text>
            <Text>Lowest Expense: ${data.dashboardSummary.lowestExpense}</Text>
            <Text>Expense Count: {data.dashboardSummary.expenseCount}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Statistics;