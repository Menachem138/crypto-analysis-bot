import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import axios from 'axios';

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything?q=cryptocurrency&apiKey=YOUR_NEWS_API_KEY');
        setNews(response.data.articles);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Spinner size="xl" />
        <Text mt={4}>Loading news...</Text>
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
      <Heading as="h2" size="lg" mb={4}>
        Significant News
      </Heading>
      {news.map((article, index) => (
        <Box key={index} mb={4}>
          <Heading as="h3" size="md">
            {article.title}
          </Heading>
          <Text>{article.description}</Text>
          <Text fontSize="sm" color="gray.500">
            {new Date(article.publishedAt).toLocaleDateString()} - {article.source.name}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default NewsFeed;
