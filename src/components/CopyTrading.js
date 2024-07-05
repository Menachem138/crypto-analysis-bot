import React, { useEffect, useState } from 'react';
import { getCopyTradingData } from '../coinMarketCapService';
import { Box, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';

const CopyTrading = () => {
  const [copyTradingData, setCopyTradingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCopyTradingData = async () => {
      try {
        const data = await getCopyTradingData();
        setCopyTradingData(data);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCopyTradingData();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Spinner size="xl" />
        <Text mt={4}>Loading copy-trading data...</Text>
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
    <Box>
      <Text fontSize="xl" mb={4}>Copy-Trading Data</Text>
      {copyTradingData && copyTradingData.data && copyTradingData.data.map((entry, index) => (
        <Box key={index} mb={4}>
          <Text>Symbol: {entry.symbol}</Text>
          <Text>Price: ${entry.quote.USD.price.toFixed(2)}</Text>
          <Text>Volume (24h): ${entry.quote.USD.volume_24h.toFixed(2)}</Text>
          <Text>Market Cap: ${entry.quote.USD.market_cap.toFixed(2)}</Text>
        </Box>
      ))}
    </Box>
  );
};

export default CopyTrading;
