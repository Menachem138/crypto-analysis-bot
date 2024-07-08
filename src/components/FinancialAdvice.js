import React, { useEffect } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const FinancialAdvice = (props) => {
  useEffect(() => {
    console.log('FinancialAdvice component mounted');
    console.log('FinancialAdvice component props:', props);
  }, [props]);

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
