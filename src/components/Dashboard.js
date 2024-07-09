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
    console.log("Starting loadAndTrainModel function");
    // Clear any previous errors
    setError(null);

    // Load and preprocess the historical data
    console.log("Fetching CSV file");
    const response = await fetch('/Binance_1INCHBTC_d.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
    }
    console.log("CSV file fetched successfully");

    let parsedData;
    try {
      console.log("Parsing CSV file");
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
      console.log("CSV file parsed successfully");
    } catch (error) {
      throw new Error(`CSV Parsing Error: ${error.message}`);
    }

    // Check for NaN values in parsed data and replace them with zeros
    parsedData = parsedData.map(row => {
      Object.keys(row).forEach(key => {
        if (isNaN(row[key]) || !isFinite(row[key])) {
          row[key] = 0;
        }
      });
      return row;
    });
    console.log("Parsed data cleaned successfully");

    // Convert the data to arrays
    const dataArray = parsedData;

    // Extract features and labels
    const cleanedDataArray = dataArray.map(row => {
      Object.keys(row).forEach(key => {
        if (isNaN(row[key]) || !isFinite(row[key])) {
          row[key] = 0;
        }
      });
      return row;
    });
    console.log("Data converted to arrays successfully");

    // Calculate RSI with the corrected rolling calculation
    const rsiValues = calculateRSI(cleanedDataArray);
    cleanedDataArray.forEach((row, index) => {
      row.Relative_Strength_Index = isNaN(rsiValues[index]) || !isFinite(rsiValues[index]) ? 0 : rsiValues[index];
    });
    console.log("RSI calculated successfully");

    // Calculate Moving Average
    const movingAverageValues = calculateMovingAverage(cleanedDataArray);
    cleanedDataArray.forEach((row, index) => {
      row.Moving_Average = isNaN(movingAverageValues[index]) || !isFinite(movingAverageValues[index]) ? 0 : movingAverageValues[index];
    });
    console.log("Moving Average calculated successfully");

    // Calculate MACD
    const macdValues = calculateMACD(cleanedDataArray);
    cleanedDataArray.forEach((row, index) => {
      row.MACD = isNaN(macdValues[index]) || !isFinite(macdValues[index]) ? 0 : macdValues[index];
    });
    console.log("MACD calculated successfully");

    // Create the model
    const model = createModel();
    console.log("Model created:", model);

    // Convert cleanedDataArray to tensors
    const featureTensor = tf.tensor2d(cleanedDataArray.map(row => [
      row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
    ]));
    const labelTensor = tf.tensor2d(cleanedDataArray.map(row => [row.Close]));
    console.log("Feature tensor shape:", featureTensor.shape);
    console.log("Label tensor shape:", labelTensor.shape);
    console.log("First row of feature tensor:", cleanedDataArray[0]);
    console.log("First row of label tensor:", cleanedDataArray[0].Close);

    // Train the model
    await trainModel(model, featureTensor, labelTensor);
    console.log("Model trained");

    // Evaluate the model
    const evaluationResults = await evaluateModel(model, featureTensor);
    console.log("Model evaluation results:", evaluationResults);

    // Generate predictions
    const predictions = model.predict(featureTensor);
    console.log("Model predictions:", predictions);

    // Update state with predictions
    startTransition(() => {
      setMarketData(prevData => ({
        ...prevData,
        predictions: predictions
      }));
    });
  } catch (err) {
    console.log("Error in loadAndTrainModel function:", err);
    setError(`Error: ${err.message}`);
  } finally {
    console.log("loadAndTrainModel function completed");
    setLoading(false);
  }
};

const Dashboard = () => {
  console.log('Dashboard component is rendering');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log('Initial error state:', error);
  console.log('Initial loading state:', loading);

  // Add logging for state updates
  useEffect(() => {
    console.log('Updated marketData state:', marketData);
  }, [marketData]);

  useEffect(() => {
    console.log('Updated error state:', error);
  }, [error]);

  useEffect(() => {
    console.log('Updated loading state:', loading);
  }, [loading]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await getMarketData('BTC'); // Pass a default symbol for testing
        console.log('Market Data:', response.data); // Log the market data
        startTransition(() => {
          setMarketData(response.data);
        });
      } catch (err) {
        startTransition(() => {
          setError(`Error: ${err.message}`);
        });
        console.log('Full error object in fetchMarketData:', err);
        console.log('Error stack trace in fetchMarketData:', err.stack);
        console.log('Error name in fetchMarketData:', err.name);
        console.log('Error message in fetchMarketData:', err.message);
      } finally {
        startTransition(() => {
          setLoading(false);
        });
        console.log('Loading state set to false');
        console.log('Loading state set to false in fetchMarketData finally block');
      }
    };

    fetchMarketData();
    loadAndTrainModel(setError, setMarketData, setLoading);
    // <Widget id="449162832" style={{ width: '100%', height: '500px' }} className="my-form" />
  }, [loadAndTrainModel]);

  useEffect(() => {
    console.log('Error state updated:', error);
  }, [error]);

  if (loading) {
    console.log('Loading state is true, displaying loading spinner');
    return (
      <Box textAlign="center" py={10} px={6}>
        <Spinner size="xl" />
        <Text mt={4}>Loading market data...</Text>
      </Box>
    );
  }

  if (error) {
    console.log('Error state is true, displaying error message:', error);
    return (
      <Box textAlign="center" py={10} px={6}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  console.log('Rendering market data and charts');
  console.log('Market Data:', marketData);

  const formattedMarketData = marketData && typeof marketData === 'object' ? Object.keys(marketData).map(key => {
    const dataPoint = marketData[key];
    console.log('Data Point:', dataPoint); // Log each data point
    if (dataPoint && dataPoint.quote && dataPoint.quote.USD && dataPoint.quote.USD.price && dataPoint.quote.USD.last_updated) {
      const date = new Date(dataPoint.quote.USD.last_updated);
      console.log('Converted Date:', date); // Log the converted date
      return {
        date: date, // Convert last_updated to Date object
        price: dataPoint.quote.USD.price
      };
    } else {
      console.log('Invalid data point:', dataPoint); // Log invalid data points
      return null;
    }
  }).filter(dataPoint => dataPoint !== null) : [];

  console.log('Formatted Market Data:', formattedMarketData);

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
