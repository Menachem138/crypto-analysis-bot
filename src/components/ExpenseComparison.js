import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Text } from '@chakra-ui/react';

const ExpenseComparison = ({ data, isLoading, error }) => {
  if (isLoading) return <Text>Loading expense comparison...</Text>;
  if (error) return <Text>Error loading expense comparison: {error}</Text>;
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: 'Expense Comparison',
      data: data.datasets[0].data,
      backgroundColor: data.datasets[0].backgroundColor,
    }],
  };

  return (
    <Box>
      <Text fontSize="xl" mb={4}>Expense Comparison</Text>
      <Bar data={chartData} />
    </Box>
  );
};

export default ExpenseComparison;