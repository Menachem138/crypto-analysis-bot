import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import api from '../utils/api'; // Assuming we have an API utility

const AIInsights = ({ userId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [userId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/ai/insights', { userId });
      setInsights(response.data.insights);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to fetch insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text>Loading insights...</Text>;
  if (error) return <Text color="red.500">{error}</Text>;

  return (
    <Box>
      <Heading size="md" mb={4}>AI Insights</Heading>
      <VStack align="start" spacing={2}>
        {insights.map((insight, index) => (
          <Text key={index}>{insight}</Text>
        ))}
      </VStack>
    </Box>
  );
};

export default AIInsights;