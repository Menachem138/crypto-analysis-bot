import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Box, Text } from '@chakra-ui/react';

const ExpenseDistribution = ({ data, isLoading, error }) => {
  if (isLoading) return <Text>Loading expense distribution...</Text>;
  if (error) return <Text>Error loading expense distribution: {error}</Text>;
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: [{
      data: data.datasets[0].data,
      backgroundColor: data.datasets[0].backgroundColor,
    }],
  };

  return (
    <Box>
      <Text fontSize="xl" mb={4}>Expense Distribution</Text>
      <Pie data={chartData} />
    </Box>
  );
};

export default ExpenseDistribution;