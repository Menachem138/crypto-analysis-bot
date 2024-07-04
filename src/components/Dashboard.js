import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { fetchMarketData } from '../services/apiService';

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getMarketData = async () => {
      try {
        const data = await fetchMarketData();
        setMarketData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getMarketData();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Spinner size="xl" />
        <Text mt={4}>Loading market data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box textAlign="center" py={10} px={6}>
      <Heading as="h1" size="xl" mb={6}>
        Cryptocurrency Market Data
      </Heading>
      {marketData && (
        <Box>
          <Text>Market Cap: ${marketData.market_cap}</Text>
          <Text>24h Volume: ${marketData.total_volume}</Text>
          <Text>Bitcoin Dominance: {marketData.market_cap_percentage.btc}%</Text>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
