import React, { useState, useEffect, startTransition } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import MarketChart from './MarketChart.js';
import CopyTrading from './CopyTrading.js';
import { getMarketData } from '../coinlayerService.js';
import { calculateRSI, calculateMovingAverage, calculateMACD } from '../technicalAnalysis.js';
import NewsFeed from './NewsFeed.js';
import FinancialAdvice from './FinancialAdvice.js';
import { Widget } from '@typeform/embed-react';
import { createModel, trainModel, evaluateModel } from '../aiModel.js';
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

      // Filter out rows with NaN or infinite values
      parsedData = parsedData.filter(row => {
        return Object.values(row).every(value => !isNaN(value) && isFinite(value));
      });
    } catch (error) {
      throw new Error(`CSV Parsing Error: ${error.message}`);
    }

    // Convert the data to arrays
    const dataArray = parsedData;

    // Extract features and labels
    const cleanedDataArray = dataArray.filter(row => {
      return Object.values(row).every(value => !isNaN(value) && isFinite(value));
    });

    // Calculate RSI with the corrected rolling calculation
    const rsiValues = calculateRSI(cleanedDataArray);
    cleanedDataArray.forEach((row, index) => {
      row.Relative_Strength_Index = rsiValues[index];
    });

    const movingAverageValues = calculateMovingAverage(cleanedDataArray);
    cleanedDataArray.forEach((row, index) => {
      row.Moving_Average = movingAverageValues[index];
    });

    const macdValues = calculateMACD(cleanedDataArray);
    cleanedDataArray.forEach((row, index) => {
      row.MACD = macdValues[index];
    });

    // Create the model
    const model = createModel();

    // Convert cleanedDataArray to tensors
    const featureTensor = tf.tensor2d(cleanedDataArray.map(row => [
      row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
    ]));
    const labelTensor = tf.tensor2d(cleanedDataArray.map(row => [row.Close]));

    // Train the model
    await trainModel(model, featureTensor, labelTensor);

    // Evaluate the model
    const evaluationResults = await evaluateModel(model, featureTensor);

    // Generate predictions
    const predictions = model.predict(featureTensor);

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
  }, [loadAndTrainModel]);


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

  const formattedMarketData = marketData && typeof marketData === 'object' ? Object.keys(marketData).map(key => {
    const dataPoint = marketData[key];
    if (dataPoint && dataPoint.quote && dataPoint.quote.USD && dataPoint.quote.USD.price && dataPoint.quote.USD.last_updated) {
      const date = new Date(dataPoint.quote.USD.last_updated);
      return {
        date: date, // Convert last_updated to Date object
        price: dataPoint.quote.USD.price
      };
    } else {
      return null;
    }
  }).filter(dataPoint => dataPoint !== null) : [];

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
        {/* <MarketChart data={formattedMarketData} />
        <CopyTrading />
        <Box mt={6}>
          <Heading as="h2" size="lg" mb={4}>
            Significant News
          </Heading>
          <NewsFeed />
        </Box>
        <Box mt={6}>
          <Heading as="h2" size="lg" mb={4}>
            Personalized Financial Advice
          </Heading>
          {console.log('Rendering FinancialAdvice component with props:', { marketData, loading, error })}
          <FinancialAdvice marketData={marketData} loading={loading} error={error} />
        </Box> */}
      </Box>
    </ErrorBoundary>
  );
};

export default Dashboard;
