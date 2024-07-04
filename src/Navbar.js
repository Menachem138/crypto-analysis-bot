import React from 'react';
import { Box, Flex, Link, Button, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('gray.100', 'gray.900');
  const color = useColorModeValue('black', 'white');

  return (
    <Box bg={bg} px={4}>
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <Box>Crypto Analysis</Box>
        <Flex alignItems={'center'}>
          <Link href="#" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: useColorModeValue('gray.200', 'gray.700') }}>
            Home
          </Link>
          <Link href="#" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: useColorModeValue('gray.200', 'gray.700') }}>
            Market Analysis
          </Link>
          <Link href="#" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: useColorModeValue('gray.200', 'gray.700') }}>
            Predictions
          </Link>
          <Link href="#" px={2} py={1} rounded={'md'} _hover={{ textDecoration: 'none', bg: useColorModeValue('gray.200', 'gray.700') }}>
            Copy Trading
          </Link>
          <Button onClick={toggleColorMode} ml={4}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
