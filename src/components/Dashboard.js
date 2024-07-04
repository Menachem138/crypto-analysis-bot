import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import apiService from '../services/apiService';
import { createModel, trainModel, evaluateModel } from '../aiModel';
import * as tf from '@tensorflow/tfjs';

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainingResult, setTrainingResult] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    const getMarketData = async () => {
      try {
        const response = await apiService.getMarketData();
        console.log('Market Data:', response.data); // Log the market data
        setMarketData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getMarketData();
  }, []);

  useEffect(() => {
    const loadAndTrainModel = async () => {
      try {
        // Load and preprocess the historical data
        const response = await fetch('/Binance_1INCHBTC_d.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
        }
        const csv = await response.text();
        const parsedData = tf.data.csv(csv, {
          columnConfigs: {
            Close: {
              isLabel: true
            }
          }
        });

        // Convert the data to arrays
        const dataArray = [];
        await parsedData.forEachAsync(row => dataArray.push(row));

        // Split the data into training and testing sets
        const trainSize = Math.floor(dataArray.length * 0.8);
        const trainData = dataArray.slice(0, trainSize);
        const testData = dataArray.slice(trainSize);

        // Convert the data to tensors
        const convertToTensor = (data) => {
          return tf.tidy(() => {
            tf.util.shuffle(data);

            const inputs = data.map(d => Object.values(d.xs));
            const labels = data.map(d => Object.values(d.ys));

            const inputTensor = tf.tensor2d(inputs, [inputs.length, inputs[0].length]);
            const labelTensor = tf.tensor2d(labels, [labels.length, labels[0].length]);

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

        const trainTensors = convertToTensor(trainData);
        const testTensors = convertToTensor(testData);

        // Create and train the model
        const model = createModel();
        const history = await trainModel(model, trainTensors.inputs, trainTensors.labels);
        setTrainingResult(history);

        // Evaluate the model
        const evaluation = await evaluateModel(model, testTensors.inputs, testTensors.labels);
        setEvaluationResult(evaluation);
      } catch (err) {
        console.error('Error during fetch operation:', err);
        setError(err.message);
      }
    };

    loadAndTrainModel();
  }, []);

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
