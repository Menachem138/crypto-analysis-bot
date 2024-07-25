import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Text } from '@chakra-ui/react';

const ExpenseTrends = ({ data, isLoading, error }) => {
  if (isLoading) return <Text>Loading expense trends...</Text>;
  if (error) return <Text>Error loading expense trends: {error}</Text>;
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: 'Expense Trend',
      data: data.datasets[0].data,
      borderColor: data.datasets[0].borderColor,
      fill: false,
    }],
  };

  return (
    <Box>
      <Text fontSize="xl" mb={4}>Expense Trends</Text>
      <Line data={chartData} />
    </Box>
  );
};

export default ExpenseTrends;