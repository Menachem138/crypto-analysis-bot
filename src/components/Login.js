import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, Link, useToast } from '@chakra-ui/react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData);
      toast({
        title: 'Login successful.',
        description: "You've been logged in.",
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Add logic for form submission to backend
    }
  };

  return (
    <Box maxWidth="400px" margin="auto" mt={8}>
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <Heading>Login</Heading>
        <FormControl isRequired isInvalid={errors.email}>
          <FormLabel>Email</FormLabel>
          <Input name="email" type="email" onChange={handleChange} />
          <Text color="red.500">{errors.email}</Text>
        </FormControl>
        <FormControl isRequired isInvalid={errors.password}>
          <FormLabel>Password</FormLabel>
          <Input name="password" type="password" onChange={handleChange} />
          <Text color="red.500">{errors.password}</Text>
        </FormControl>
        <Button type="submit" colorScheme="blue">Login</Button>
        <Text>Don't have an account? <Link color="blue.500" href="/register">Register</Link></Text>
      </VStack>
    </Box>
  );
};

export default Login;