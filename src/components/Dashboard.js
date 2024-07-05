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

        console.log('Parsed Data:', parsedData.slice(0, 5)); // Log the first 5 parsed data rows

        // Check for NaN values in parsed data and replace them with zeros
        parsedData = parsedData.map(row => {
          Object.keys(row).forEach(key => {
            if (isNaN(row[key])) {
              row[key] = 0;
            }
          });
          return row;
        });

        console.log('Parsed Data after NaN check:', parsedData.slice(0, 5)); // Log the first 5 parsed data rows after NaN check

        // Convert the data to arrays
        console.log('Starting to convert parsed data to arrays');
        const dataArray = parsedData;

        // Extract features and labels
        console.log('Starting to extract features and labels');

        // Ensure mean and standard deviation calculations are valid
        const safeMean = (values) => {
          const mean = tf.mean(values, 0);
          return mean;
        };

        const safeStd = (values) => {
          const std = tf.moments(values, 0).variance.sqrt();
          const epsilon = tf.scalar(1e-8); // Small constant to prevent division by zero
          return std.add(epsilon);
        };

        // Convert the data to tensors
        const dataTensor = tf.tensor2d(dataArray.map(row => [
          row.Open,
          row.High,
          row.Low,
          row['Volume 1INCH'],
          row['Volume BTC'],
          row.tradecount,
          (row.High + row.Low) / 2, // Average of High and Low prices
          row.Open - row.Close, // Difference between Open and Close prices
          row.Unix / 1e9 // Scale Unix timestamp to a more suitable range
        ]));

        // Log the raw data before normalization
        const rawFeatures = dataTensor.arraySync();
        console.log('Raw Features:', rawFeatures.slice(0, 5)); // Log the first 5 raw feature sets

        // Calculate mean and standard deviation for each feature
        const meanTensor = safeMean(dataTensor);
        console.log('Mean Tensor:', meanTensor.arraySync());

        const stdTensor = safeStd(dataTensor);
        console.log('Standard Deviation Tensor:', stdTensor.arraySync());

        // Check for NaN values in mean and standard deviation tensors
        const hasNaNMeanTensor = tf.any(tf.isNaN(meanTensor)).dataSync()[0];
        const hasNaNStdTensor = tf.any(tf.isNaN(stdTensor)).dataSync()[0];
        if (hasNaNMeanTensor || hasNaNStdTensor) {
          throw new Error('Mean or Standard Deviation Tensor contains NaN values');
        }

        // Check for zero standard deviation values
        const hasZeroStdTensor = tf.any(tf.equal(stdTensor, 0)).dataSync()[0];
        if (hasZeroStdTensor) {
          throw new Error('Standard Deviation Tensor contains zero values');
        }

        // Normalize the data
        const normalizedTensor = dataTensor.sub(meanTensor).div(stdTensor);

        // Log the normalized features
        const normalizedFeatures = normalizedTensor.arraySync();
        console.log('Normalized Features:', normalizedFeatures.slice(0, 5)); // Log the first 5 normalized feature sets

        // Convert the normalized tensor back to an array
        const features = normalizedTensor.arraySync();

        console.log('Features:', features.slice(0, 5)); // Log the first 5 feature sets

        // Check for NaN values in features
        const cleanedFeatures = features.map(featureSet => featureSet.map(value => isNaN(value) ? 0 : value));
        const hasNaNFeatures = cleanedFeatures.some(featureSet => featureSet.some(value => isNaN(value)));
        if (hasNaNFeatures) {
          throw new Error('Cleaned features contain NaN values');
        }

        const labels = dataArray.map(row => row.Close);
        const cleanedLabels = labels.map(label => isNaN(label) ? 0 : label);
        const hasNaNLabels = cleanedLabels.some(label => isNaN(label));
        if (hasNaNLabels) {
          throw new Error('Cleaned labels contain NaN values');
        }

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
              console.log('Data before tensor creation:', data);
              console.log('Labels before tensor creation:', labels);
              inputTensor = tf.tensor2d(data, [data.length, data[0].length]);
              labelTensor = tf.tensor2d(labels, [labels.length, 1]);
              console.log('Input Tensor Shape:', inputTensor.shape);
              console.log('Label Tensor Shape:', labelTensor.shape);
              console.log('Input Tensor Data:', inputTensor.arraySync());
              console.log('Label Tensor Data:', labelTensor.arraySync());

              // Check for NaN or infinite values in tensors
              const hasNaN = (tensor) => tf.any(tf.isNaN(tensor)).dataSync()[0];
              const hasInf = (tensor) => tf.any(tf.isInf(tensor)).dataSync()[0];
              if (hasNaN(inputTensor) || hasNaN(labelTensor) || hasInf(inputTensor) || hasInf(labelTensor)) {
                console.error('Tensor contains NaN or infinite values');
                console.log('Input Tensor Data with NaN or Inf:', inputTensor.arraySync());
                console.log('Label Tensor Data with NaN or Inf:', labelTensor.arraySync());
                throw new Error('Tensor contains NaN or infinite values');
              }
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
            console.log('Train Tensors Input Data (before training):', trainTensors.inputs.arraySync());
            console.log('Train Tensors Label Data (before training):', trainTensors.labels.arraySync());
            const history = await trainModel(model, trainTensors.inputs, trainTensors.labels);
            console.log('After trainModel function call');
            console.log('Train Tensors Input Data (after training):', trainTensors.inputs.arraySync());
            console.log('Train Tensors Label Data (after training):', trainTensors.labels.arraySync());
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
