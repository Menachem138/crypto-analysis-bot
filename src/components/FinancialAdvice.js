import React, { useEffect } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const FinancialAdvice = () => {
  useEffect(() => {
    console.log('FinancialAdvice component mounted');
  }, []);

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>
        Personalized Financial Advice
      </Heading>
      <Text>
        Here you will receive personalized financial advice based on your cryptocurrency portfolio and market data.
      </Text>
    </Box>
  );
};

export default FinancialAdvice;
