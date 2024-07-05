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
        console.log('Starting to fetch CSV file from path: /Binance_1INCHBTC_d.csv');
        const response = await fetch('/Binance_1INCHBTC_d.csv');
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
        }
        console.log('CSV file fetched successfully from path: /Binance_1INCHBTC_d.csv');

        console.log('Starting to parse CSV file');
        let parsedData;
        try {
          const csvText = await response.text();
          const rows = csvText.split('\n').slice(1); // Remove header row
          parsedData = rows.map(row => {
            const values = row.split(',');
            return {
              Unix: parseInt(values[0], 10),
              Date: values[1],
              Symbol: values[2],
              Open: parseFloat(values[3]),
              High: parseFloat(values[4]),
              Low: parseFloat(values[5]),
              Close: parseFloat(values[6]),
              'Volume 1INCH': parseFloat(values[7]),
              'Volume BTC': parseFloat(values[8]),
              tradecount: parseInt(values[9], 10)
            };
          });
          console.log('CSV file parsed successfully');
        } catch (error) {
          console.error('Error during CSV parsing:', error);
          throw new Error(`CSV Parsing Error: ${error.message}`);
        }

        // Convert the data to arrays
        console.log('Starting to convert parsed data to arrays');
        const dataArray = parsedData;

        // Extract features and labels
        console.log('Starting to extract features and labels');
        const maxUnix = Math.max(...dataArray.map(row => row.Unix));
        const meanOpen = tf.mean(dataArray.map(row => row.Open));
        const stdOpen = tf.moments(dataArray.map(row => row.Open)).variance.sqrt();
        const meanHigh = tf.mean(dataArray.map(row => row.High));
        const stdHigh = tf.moments(dataArray.map(row => row.High)).variance.sqrt();
        const meanLow = tf.mean(dataArray.map(row => row.Low));
        const stdLow = tf.moments(dataArray.map(row => row.Low)).variance.sqrt();
        const meanVolume1INCH = tf.mean(dataArray.map(row => row['Volume 1INCH']));
        const stdVolume1INCH = tf.moments(dataArray.map(row => row['Volume 1INCH'])).variance.sqrt();
        const meanVolumeBTC = tf.mean(dataArray.map(row => row['Volume BTC']));
        const stdVolumeBTC = tf.moments(dataArray.map(row => row['Volume BTC'])).variance.sqrt();
        const meanTradecount = tf.mean(dataArray.map(row => row.tradecount));
        const stdTradecount = tf.moments(dataArray.map(row => row.tradecount)).variance.sqrt();
        const meanAvgHighLow = tf.mean(dataArray.map(row => (row.High + row.Low) / 2));
        const stdAvgHighLow = tf.moments(dataArray.map(row => (row.High + row.Low) / 2)).variance.sqrt();
        const meanOpenCloseDiff = tf.mean(dataArray.map(row => row.Open - row.Close));
        const stdOpenCloseDiff = tf.moments(dataArray.map(row => row.Open - row.Close)).variance.sqrt();

        const features = dataArray.map(row => [
          (row.Open - meanOpen) / stdOpen,
          (row.High - meanHigh) / stdHigh,
          (row.Low - meanLow) / stdLow,
          (row['Volume 1INCH'] - meanVolume1INCH) / stdVolume1INCH,
          (row['Volume BTC'] - meanVolumeBTC) / stdVolumeBTC,
          (row.tradecount - meanTradecount) / stdTradecount,
          ((row.High + row.Low) / 2 - meanAvgHighLow) / stdAvgHighLow, // Average of High and Low prices
          (row.Open - row.Close - meanOpenCloseDiff) / stdOpenCloseDiff, // Difference between Open and Close prices
          row.Unix / maxUnix, // Normalized Unix timestamp
          (row.tradecount - meanTradecount) / stdTradecount // tradecount as an additional feature
        ]);

        // Check for NaN values in features
        const cleanedFeatures = features.map(featureSet => featureSet.map(value => isNaN(value) ? 0 : value));

        const labels = dataArray.map(row => row.Close);

        // Replace NaN values in labels with zeros
        const cleanedLabels = labels.map(label => isNaN(label) ? 0 : label);

        console.log('Features and labels extracted successfully');
        console.log('Features:', cleanedFeatures.slice(0, 5)); // Log the first 5 feature sets
        console.log('Labels:', cleanedLabels.slice(0, 5)); // Log the first 5 labels

        // Split the data into training and testing sets
        console.log('Starting to split data into training and testing sets');
        const trainSize = Math.floor(features.length * 0.8);
        const trainFeatures = features.slice(0, trainSize);
        const trainLabels = cleanedLabels.slice(0, trainSize);
        const testFeatures = features.slice(trainSize);
        const testLabels = cleanedLabels.slice(trainSize);
        console.log('Data split into training and testing sets');

        // Convert the data to tensors
        console.log('Starting to convert data to tensors');
        const convertToTensor = (data, labels) => {
          return tf.tidy(() => {
            console.log('Data before shuffling:', data);
            console.log('Labels before shuffling:', labels);
            try {
              tf.util.shuffle(data);
              tf.util.shuffle(labels);
              console.log('Data after shuffling:', data);
              console.log('Labels after shuffling:', labels);
            } catch (error) {
              console.error('Error during data shuffling:', error);
              throw new Error(`Data Shuffling Error: ${error.message}`);
            }

            let inputTensor, labelTensor;
            try {
              inputTensor = tf.tensor2d(data, [data.length, data[0].length]);
              labelTensor = tf.tensor2d(labels, [labels.length, 1]);
              console.log('Input Tensor Shape:', inputTensor.shape);
              console.log('Label Tensor Shape:', labelTensor.shape);
              console.log('Input Tensor Data:', inputTensor.arraySync());
              console.log('Label Tensor Data:', labelTensor.arraySync());
            } catch (error) {
              console.error('Error during tensor creation:', error);
              throw new Error(`Tensor Creation Error: ${error.message}`);
            }

            console.log('Tensors created successfully');
            return {
              inputs: inputTensor,
              labels: labelTensor
            };
          });
        };

        try {
          console.log('Calling convertToTensor for training data');
          const trainTensors = convertToTensor(trainFeatures, trainLabels);
          console.log('Train Tensors:', trainTensors);
          console.log('Train Tensors Input Shape:', trainTensors.inputs.shape);
          console.log('Train Tensors Label Shape:', trainTensors.labels.shape);
          console.log('Train Tensors Input Data:', trainTensors.inputs.arraySync());
          console.log('Train Tensors Label Data:', trainTensors.labels.arraySync());

          console.log('Calling convertToTensor for testing data');
          const testTensors = convertToTensor(testFeatures, testLabels);
          console.log('Test Tensors:', testTensors);
          console.log('Test Tensors Input Shape:', testTensors.inputs.shape);
          console.log('Test Tensors Label Shape:', testTensors.labels.shape);
          console.log('Test Tensors Input Data:', testTensors.inputs.arraySync());
          console.log('Test Tensors Label Data:', testTensors.labels.arraySync());

          console.log('Data converted to tensors');
          console.log('Calling trainModel function');

          // Create and train the model
          console.log('Starting to create the model');
          const model = createModel();
          console.log('Model created:', model);
          model.summary(); // Log the model summary

          console.log('Calling trainModel function');
          console.log('Train Tensors Input Shape:', trainTensors.inputs.shape);
          console.log('Train Tensors Label Shape:', trainTensors.labels.shape);
          console.log('Train Tensors Input Data:', trainTensors.inputs.arraySync());
          console.log('Train Tensors Label Data:', trainTensors.labels.arraySync());
          try {
            console.log('Before trainModel function call');
            const history = await trainModel(model, trainTensors.inputs, trainTensors.labels);
            console.log('After trainModel function call');
            console.log('trainModel function completed');
            console.log('Model trained successfully:', history);
            console.log('Training history:', history.history);
            setTrainingResult(history);
          } catch (error) {
            console.error('Error during model training:', error);
            console.log('Error stack trace during model training:', error.stack);
            console.log('Error name during model training:', error.name);
            console.log('Error message during model training:', error.message);
            throw new Error(`Model Training Error: ${error.message}`);
          }

          // Evaluate the model
          console.log('Starting to evaluate the model');
          const evaluation = await evaluateModel(model, testTensors.inputs, testTensors.labels);
          console.log('Model evaluated successfully:', evaluation);
          console.log('Evaluation result:', evaluation);
          setEvaluationResult(evaluation);

          // Clear any previous errors after successful operations
          console.log('Clearing error state after successful operations');
          setError(null);
        } catch (error) {
          console.error('Error during tensor conversion or model training:', error);
          throw error;
        }
      } catch (err) {
        console.error('Error during loadAndTrainModel execution:', err);
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
