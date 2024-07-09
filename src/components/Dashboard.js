import React, { useState, useEffect, startTransition } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { getMarketData } from '../coinlayerService.js';
import { calculateRSI, calculateMovingAverage, calculateMACD } from '../technicalAnalysis.js';
import { createModel, trainModel } from '../aiModel.js';
import * as tf from '@tensorflow/tfjs';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    console.log("Error details:", error);
    console.log("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={10} px={6}>
          <Heading as="h1" size="xl" mb={6}>
            Something went wrong.
          </Heading>
          <Text>Please try again later.</Text>
        </Box>
      );
    }

    return this.props.children;
  }
}

const hasNaN = (array) => array.some(row => Object.values(row).some(value => isNaN(value)));

const loadAndTrainModel = async (setError, setMarketData, setLoading) => {
  try {
    // Clear any previous errors
    setError(null);

    // Load and preprocess the historical data
    const response = await fetch('/Binance_1INCHBTC_d.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
    }

    // Parse and clean the CSV data
    let parsedData;
    let cleanedDataArray;
    try {
      const csvText = await response.text();
      const rows = csvText.split('\n').slice(2).filter(row => row.trim() !== '' && row.split(',').length === 10 && !isNaN(parseInt(row.split(',')[0], 10)));
      parsedData = rows.map(row => {
        const values = row.split(',');
        if (values.length === 10) {
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
        } else {
          return null;
        }
      }).filter(row => row !== null);

      parsedData = parsedData.filter(row => {
        return Object.values(row).every(value => !isNaN(value) && isFinite(value));
      });

      // Additional step to remove any rows with NaN values
      parsedData = parsedData.filter(row => {
        return !hasNaN([row]);
      });

      // Log the cleaned data for verification
      console.log('Cleaned parsed data after initial filtering:', parsedData);

      // Additional check for NaN values before converting to tensors
      if (hasNaN(parsedData)) {
        console.error('Parsed data contains NaN values after initial filtering:', parsedData);
        throw new Error('Parsed data contains NaN values after initial filtering');
      }

      // Convert the data to arrays
      const dataArray = parsedData;

      // Extract features and labels
      cleanedDataArray = dataArray.filter(row => {
        return Object.values(row).every(value => !isNaN(value) && isFinite(value));
      });

      // Log the cleaned data array for verification
      console.log('Cleaned data array after feature extraction:', cleanedDataArray);

      // Calculate RSI with the corrected rolling calculation
      console.log('Data before RSI calculation:', cleanedDataArray);
      const rsiValues = calculateRSI(cleanedDataArray);
      cleanedDataArray.forEach((row, index) => {
        row.Relative_Strength_Index = rsiValues[index];
      });

      // Log the data after RSI calculation
      console.log('Data after RSI calculation:', cleanedDataArray);

      // Additional check for NaN values after RSI calculation
      if (hasNaN(cleanedDataArray)) {
        console.error('Data contains NaN values after RSI calculation:', cleanedDataArray);
        throw new Error('Data contains NaN values after RSI calculation');
      }

      console.log('Data before Moving Average calculation:', cleanedDataArray);
      const movingAverageValues = calculateMovingAverage(cleanedDataArray);
      cleanedDataArray.forEach((row, index) => {
        row.Moving_Average = movingAverageValues[index];
      });

      // Log the data after Moving Average calculation
      console.log('Data after Moving Average calculation:', cleanedDataArray);

      // Additional check for NaN values after Moving Average calculation
      if (hasNaN(cleanedDataArray)) {
        console.error('Data contains NaN values after Moving Average calculation:', cleanedDataArray);
        throw new Error('Data contains NaN values after Moving Average calculation');
      }

      console.log('Data before MACD calculation:', cleanedDataArray);
      const macdValues = calculateMACD(cleanedDataArray);
      cleanedDataArray.forEach((row, index) => {
        row.MACD = macdValues[index];
      });

      // Log the data after MACD calculation
      console.log('Data after MACD calculation:', cleanedDataArray);

      // Additional check for NaN values after MACD calculation
      if (hasNaN(cleanedDataArray)) {
        console.error('Cleaned data contains NaN values after technical analysis calculations:', cleanedDataArray);
        throw new Error('Cleaned data contains NaN values after technical analysis calculations');
      }

      // Log the final cleaned data array for verification
      console.log('Final cleaned data array:', cleanedDataArray);

    } catch (error) {
      throw new Error(`CSV Parsing Error: ${error.message}`);
    }

    // Create the model
    const model = createModel();

    // Convert cleanedDataArray to tensors
    const featureTensor = tf.tensor2d(cleanedDataArray.map(row => [
      row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
    ]));
    const labelTensor = tf.tensor2d(cleanedDataArray.map(row => [row.Close]));

    // Log the tensors for verification
    console.log('Feature tensor:', featureTensor);
    console.log('Label tensor:', labelTensor);

    // Additional check for NaN values in tensors
    if (hasNaN(featureTensor) || hasNaN(labelTensor)) {
      console.error('Tensors contain NaN values:', { featureTensor: featureTensor.arraySync(), labelTensor: labelTensor.arraySync() });
      throw new Error('Tensors contain NaN values');
    }

    // Log memory usage before training
    console.log('Memory usage before training:', tf.memory());

    // Train the model
    await trainModel(model, featureTensor, labelTensor);

    // Log memory usage after training
    console.log('Memory usage after training:', tf.memory());

    // Generate predictions
    const predictions = model.predict(featureTensor);

    // Log memory usage after predictions
    console.log('Memory usage after predictions:', tf.memory());

    // Update state with predictions
    startTransition(() => {
      setMarketData(prevData => ({
        ...prevData,
        predictions: predictions
      }));
    });

    // Dispose of tensors to free up memory
    featureTensor.dispose();
    labelTensor.dispose();
    predictions.dispose(); // Dispose of predictions tensor

    // Log memory usage after tensor disposal
    console.log('Memory usage after tensor disposal:', tf.memory());
  } catch (err) {
    setError(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await getMarketData('BTC'); // Pass a default symbol for testing
        startTransition(() => {
          setMarketData(response.data);
        });
      } catch (err) {
        startTransition(() => {
          setError(`Error: ${err.message}`);
        });
      } finally {
        startTransition(() => {
          setLoading(false);
        });
      }
    };

    fetchMarketData();
    loadAndTrainModel(setError, setMarketData, setLoading);
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
    <ErrorBoundary>
      <Box textAlign="center" py={10} px={6}>
        <Heading as="h1" size="xl" mb={6}>
          Cryptocurrency Market Data
        </Heading>
        {marketData && (
          <Box>
            {marketData.market_cap && marketData.market_cap.usd !== undefined && (
              <Text>Market Cap: {marketData.market_cap.usd}</Text>
            )}
            {marketData.total_volume && marketData.total_volume.usd !== undefined && (
              <Text>24h Volume: {marketData.total_volume.usd}</Text>
            )}
            {marketData.market_cap_percentage && marketData.market_cap_percentage.btc !== undefined && (
              <Text>Bitcoin Dominance: {marketData.market_cap_percentage.btc}%</Text>
            )}
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default Dashboard;
