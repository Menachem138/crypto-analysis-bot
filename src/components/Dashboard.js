import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import apiService from '../services/apiService';
import { createModel, trainModel, evaluateModel } from '../aiModel';
import * as tf from '@tensorflow/tfjs';

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log('Initial error state:', error);
  console.log('Initial loading state:', loading);
  const [trainingResult, setTrainingResult] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  console.log('Initial training result:', trainingResult);
  console.log('Initial evaluation result:', evaluationResult);

  useEffect(() => {
    const getMarketData = async () => {
      try {
        const response = await apiService.getMarketData();
        console.log('Market Data:', response.data); // Log the market data
        setMarketData(response.data);
      } catch (err) {
        setError(`Error: ${err.message}`);
        console.log('Full error object in getMarketData:', err);
        console.log('Error stack trace in getMarketData:', err.stack);
        console.log('Error name in getMarketData:', err.name);
        console.log('Error message in getMarketData:', err.message);
      } finally {
        setLoading(false);
      }
    };

    getMarketData();
  }, []);

  useEffect(() => {
    const loadAndTrainModel = async () => {
      try {
        // Clear any previous errors
        console.log('Clearing error state before starting loadAndTrainModel');
        setError(null);

        // Load and preprocess the historical data
        console.log('Starting to fetch CSV file');
        const response = await fetch('/Binance_1INCHBTC_d.csv');
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
        }
        console.log('CSV file fetched successfully');
        const csv = await response.text();
        console.log('CSV file content:', csv.slice(0, 100)); // Log the first 100 characters of the CSV content
        const parsedData = tf.data.csv(csv, {
          columnConfigs: {
            Close: {
              isLabel: true
            }
          }
        });
        console.log('CSV file parsed successfully');

        // Convert the data to arrays
        console.log('Starting to convert parsed data to arrays');
        const dataArray = [];
        await parsedData.forEachAsync(row => dataArray.push(row));
        console.log('Data array created successfully');

        // Extract features and labels
        console.log('Starting to extract features and labels');
        const features = dataArray.map(row => [
          row.Open_Close_diff,
          row.High_Low_diff,
          row.Average_Price,
          row.Price_Range,
          row.Volume_Change,
          row.Close_Change,
          row.Rolling_Mean_Close,
          row.Rolling_Std_Close,
          row.Exponential_Moving_Avg,
          row.Relative_Strength_Index
        ]);
        const labels = dataArray.map(row => row.Close);
        console.log('Features and labels extracted successfully');
        console.log('Features:', features.slice(0, 5)); // Log the first 5 feature sets
        console.log('Labels:', labels.slice(0, 5)); // Log the first 5 labels

        // Split the data into training and testing sets
        console.log('Starting to split data into training and testing sets');
        const trainSize = Math.floor(features.length * 0.8);
        const trainFeatures = features.slice(0, trainSize);
        const trainLabels = labels.slice(0, trainSize);
        const testFeatures = features.slice(trainSize);
        const testLabels = labels.slice(trainSize);
        console.log('Data split into training and testing sets');

        // Convert the data to tensors
        console.log('Starting to convert data to tensors');
        const convertToTensor = (data, labels) => {
          return tf.tidy(() => {
            tf.util.shuffle(data);

            const inputTensor = tf.tensor2d(data, [data.length, data[0].length]);
            const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

            console.log('Input Tensor Shape:', inputTensor.shape);
            console.log('Label Tensor Shape:', labelTensor.shape);
            console.log('Input Tensor Data:', inputTensor.arraySync());
            console.log('Label Tensor Data:', labelTensor.arraySync());

            return {
              inputs: inputTensor,
              labels: labelTensor
            };
          });
        };

        const trainTensors = convertToTensor(trainFeatures, trainLabels);
        console.log('Train Tensors:', trainTensors);

        const testTensors = convertToTensor(testFeatures, testLabels);
        console.log('Test Tensors:', testTensors);

        console.log('Data converted to tensors');

        // Create and train the model
        console.log('Starting to create the model');
        const model = createModel();
        console.log('Model created:', model);
        model.summary(); // Log the model summary

        console.log('Starting to train the model');
        const history = await trainModel(model, trainTensors.inputs, trainTensors.labels);
        console.log('Model trained successfully:', history);
        console.log('Training history:', history.history);
        setTrainingResult(history);

        // Evaluate the model
        console.log('Starting to evaluate the model');
        const evaluation = await evaluateModel(model, testTensors.inputs, testTensors.labels);
        console.log('Model evaluated successfully:', evaluation);
        console.log('Evaluation result:', evaluation);
        setEvaluationResult(evaluation);

        // Clear any previous errors after successful operations
        console.log('Clearing error state after successful operations');
        setError(null);
      } catch (err) {
        console.error('Error during fetch operation:', err);
        console.log('Setting error state with message:', err.message);
        setError(`Error: ${err.message}`);
        console.log('Full error object in loadAndTrainModel:', err);
        console.log('Error stack trace in loadAndTrainModel:', err.stack);
        console.log('Error name in loadAndTrainModel:', err.name);
        console.log('Error message in loadAndTrainModel:', err.message);
      } finally {
        setLoading(false);
        console.log('Loading state set to false');
      }
    };

    loadAndTrainModel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('Error state updated:', error);
  }, [error]);

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
          {marketData.market_cap && marketData.market_cap.usd !== undefined && (
            <Text>Market Cap: ${marketData.market_cap.usd}</Text>
          )}
          {marketData.total_volume && marketData.total_volume.usd !== undefined && (
            <Text>24h Volume: ${marketData.total_volume.usd}</Text>
          )}
          {marketData.market_cap_percentage && marketData.market_cap_percentage.btc !== undefined && (
            <Text>Bitcoin Dominance: {marketData.market_cap_percentage.btc}%</Text>
          )}
        </Box>
      )}
      {trainingResult && (
        <Box>
          <Heading as="h2" size="lg" mt={6}>
            Model Training Result
          </Heading>
          <Text>Training Loss: {trainingResult.history.loss[trainingResult.history.loss.length - 1]}</Text>
          <Text>Validation Loss: {trainingResult.history.val_loss[trainingResult.history.val_loss.length - 1]}</Text>
        </Box>
      )}
      {evaluationResult && (
        <Box>
          <Heading as="h2" size="lg" mt={6}>
            Model Evaluation Result
          </Heading>
          <Text>Test Loss: {evaluationResult[0]}</Text>
          <Text>Test MSE: {evaluationResult[1]}</Text>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
