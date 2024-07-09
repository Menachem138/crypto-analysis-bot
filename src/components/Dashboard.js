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

const loadAndPredictModel = async (setError, setMarketData, setLoading) => {
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

      console.log('Parsed data:', parsedData);

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

      // Additional check for NaN values before sending to the server
      if (hasNaN(cleanedDataArray)) {
        console.error('Final cleaned data contains NaN values:', cleanedDataArray);
        throw new Error('Final cleaned data contains NaN values');
      }

      // Log the data being sent to the server for predictions
      console.log('Data being sent to the server for predictions:', cleanedDataArray);

      // Log the first few rows of the data being sent to the server for predictions
      console.log('First few rows of data being sent to the server for predictions:', cleanedDataArray.slice(0, 5));

      // Additional logging to track NaN values in the data
      cleanedDataArray.forEach((row, index) => {
        if (hasNaN([row])) {
          console.error(`Row ${index} contains NaN values:`, row);
        }
      });

    } catch (error) {
      throw new Error(`CSV Parsing Error: ${error.message}`);
    }

    // Send data to the server for predictions
    const predictResponse = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: cleanedDataArray.map(row => [
          row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
        ]),
      }),
    });

    if (!predictResponse.ok) {
      throw new Error(`Server error: ${predictResponse.statusText}`);
    }

    const result = await predictResponse.json();
    console.log('Predictions received from the server:', result);

    // Update state with predictions
    startTransition(() => {
      setMarketData(prevData => ({
        ...prevData,
        predictions: result.predictions
      }));
    });

  } catch (err) {
    setError(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

const downloadModel = async (setError) => {
  try {
    // Clear any previous errors
    setError(null);

    // Send request to download the model
    const response = await fetch('http://127.0.0.1:5000/download_model', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    // Handle the file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved_model.h5';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    setError(`Error: ${err.message}`);
  }
};

// useEffect hook to fetch market data and load the model
useEffect(() => {
  const fetchMarketData = async () => {
    try {
      const response = await getMarketData('BTC'); // Pass a default symbol for testing
      console.log('API response:', response);
      if (response && response.data && response.data.rates && response.data.rates.BTC) {
        console.log('Valid market data received:', response.data.rates.BTC);
        startTransition(() => {
          setMarketData(response.data.rates.BTC);
        });
      } else {
        console.error('API response data is missing expected structure:', response.data);
        throw new Error('API response data is missing expected structure');
      }
    } catch (err) {
      console.error('Error fetching market data:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : null
      });
      console.log('Full error object:', err);
      console.log('Request config:', err.config);
      startTransition(() => {
        setError(`Error: ${err.message}`);
      });
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  };

  // Only call these functions when the component mounts for the first time
  if (!marketData) {
    fetchMarketData();
    loadAndPredictModel(setError, setMarketData, setLoading);
  }
}, [marketData]);

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
