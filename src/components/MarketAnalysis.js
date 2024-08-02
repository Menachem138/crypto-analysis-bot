import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const MarketAnalysis = () => {
  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>
        Market Analysis
      </Heading>
      <Text>
        Here you will find detailed market analysis of various cryptocurrencies.
      </Text>
    </Box>
  );
};

export default MarketAnalysis;
