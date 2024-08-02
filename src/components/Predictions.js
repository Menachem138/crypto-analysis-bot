import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const Predictions = () => {
  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>
        Predictions
      </Heading>
      <Text>
        Here you will find predictions for various cryptocurrencies based on our AI models.
      </Text>
    </Box>
  );
};

export default Predictions;
