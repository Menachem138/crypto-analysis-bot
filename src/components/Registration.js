import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, Link, useToast } from '@chakra-ui/react';

const Registration = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData);
      toast({
        title: 'Account created.',
        description: "We've created your account for you.",
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
        <Heading>Registration</Heading>
        <FormControl isRequired isInvalid={errors.username}>
          <FormLabel>Username</FormLabel>
          <Input name="username" onChange={handleChange} />
          <Text color="red.500">{errors.username}</Text>
        </FormControl>
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
        <FormControl isRequired isInvalid={errors.confirmPassword}>
          <FormLabel>Confirm Password</FormLabel>
          <Input name="confirmPassword" type="password" onChange={handleChange} />
          <Text color="red.500">{errors.confirmPassword}</Text>
        </FormControl>
        <Button type="submit" colorScheme="blue">Register</Button>
        <Text>Already have an account? <Link color="blue.500" href="/login">Login</Link></Text>
      </VStack>
    </Box>
  );
};

export default Registration;