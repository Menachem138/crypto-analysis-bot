import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, List, ListItem, ListIcon, Button } from '@chakra-ui/react';
import { MdCheckCircle } from 'react-icons/md';
import api from '../utils/api';

const AIInsights = ({ userId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [userId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getInsights(userId);
      if (response.data.error === "Not enough data to generate insights.") {
        setError("Not enough data to generate insights. Please add more expenses.");
      } else {
        setInsights(response.data);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to fetch insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInsights();
  };

  if (loading) return <Text>Loading insights...</Text>;
  if (error) return (
    <Box>
      <Text color="red.500">{error}</Text>
      <Button onClick={handleRefresh} mt={4}>Refresh</Button>
    </Box>
  );

  return (
    <Box>
      <Heading size="md" mb={4}>AI Insights</Heading>
      {insights && (
        <VStack align="start" spacing={4}>
          <Box>
            <Heading size="sm" mb={2}>Top Spending Categories</Heading>
            <List spacing={2}>
              {insights.topSpendingCategories.map((category, index) => (
                <ListItem key={index}>
                  <ListIcon as={MdCheckCircle} color="green.500" />
                  {category.category}: ${category.amount}
                </ListItem>
              ))}
            </List>
          </Box>
          {insights.unusualExpenses.length > 0 && (
            <Box>
              <Heading size="sm" mb={2}>Unusual Expenses</Heading>
              <List spacing={2}>
                {insights.unusualExpenses.map((expense, index) => (
                  <ListItem key={index}>
                    <ListIcon as={MdCheckCircle} color="yellow.500" />
                    {expense}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          <Box>
            <Heading size="sm" mb={2}>Potential Savings</Heading>
            <Text>{insights.potentialSavings}</Text>
          </Box>
        </VStack>
      )}
      <Button onClick={handleRefresh} mt={4}>Refresh Insights</Button>
    </Box>
  );
};

export default AIInsights;