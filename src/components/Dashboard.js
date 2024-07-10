import React, { useState, useEffect, startTransition } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { getMarketData } from '../coinlayerService.js';
import { calculateRSI, calculateMovingAverage, calculateMACD } from '../technicalAnalysis.js';

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

    // Function to fetch CSV data
    const fetchCSVData = async () => {
      const response = await fetch('/Binance_1INCHBTC_d.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
      }
      const csvText = await response.text();
      console.log('Fetched CSV data:', csvText);
      return csvText;
    };

    // Function to parse CSV data
    const parseCSVData = (csvText) => {
      const rows = csvText.split('\n').slice(2).filter(row => row.trim() !== '' && row.split(',').length === 10 && !isNaN(parseInt(row.split(',')[0], 10)));
      const parsedData = rows.map(row => {
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
      }).filter(row => row !== null && !hasNaN([row]));
      console.log('Parsed CSV data:', parsedData);
      return parsedData;
    };

    // Function to clean parsed data
    const cleanParsedData = (parsedData) => {
      const cleanedData = parsedData.filter(row => {
        return Object.values(row).every(value => !isNaN(value) && isFinite(value));
      });
      console.log('Cleaned parsed data:', cleanedData);
      return cleanedData;
    };

    // Function to calculate technical indicators
    const calculateTechnicalIndicators = async (cleanedDataArray) => {
      const { calculateRSI } = await import('../technicalAnalysis.js');
      const rsiValues = calculateRSI(cleanedDataArray);
      cleanedDataArray.forEach((row, index) => {
        row.Relative_Strength_Index = rsiValues[index];
      });

      const { calculateMovingAverage } = await import('../technicalAnalysis.js');
      const movingAverageValues = calculateMovingAverage(cleanedDataArray);
      cleanedDataArray.forEach((row, index) => {
        row.Moving_Average = movingAverageValues[index];
      });

      const { calculateMACD } = await import('../technicalAnalysis.js');
      const macdValues = calculateMACD(cleanedDataArray);
      cleanedDataArray.forEach((row, index) => {
        row.MACD = macdValues[index];
      });

      console.log('Data with technical indicators:', cleanedDataArray);
      return cleanedDataArray;
    };

    // Main function to fetch, parse, clean, and preprocess data
    const fetchDataAndPreprocess = async () => {
      try {
        const csvText = await fetchCSVData();
        let parsedData = parseCSVData(csvText);
        console.log('Data after parsing:', parsedData);
        parsedData = cleanParsedData(parsedData);
        console.log('Data after cleaning:', parsedData);

        // Check if the data is already available and skip unnecessary processing
        if (parsedData.length > 0) {
          const cleanedDataArray = await calculateTechnicalIndicators(parsedData);
          console.log('Data after calculating technical indicators:', cleanedDataArray);

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
          startTransition(() => {
            setMarketData(prevData => ({
              ...prevData,
              predictions: result.predictions
            }));
          });
        }
      } catch (error) {
        throw new Error(`CSV Parsing Error: ${error.message}`);
      }
    };

    // Call the fetchDataAndPreprocess function after the component has mounted
    fetchDataAndPreprocess();

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

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect hook to fetch market data and load the model
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await getMarketData('BTC'); // Pass a default symbol for testing
        console.log('API response:', response);
        console.log('Full API response object:', response);
        if (response && response.data && response.data.rates) {
          console.log('Valid market data received:', response.data.rates);
          if (response.data.rates.BTC) {
            console.log('BTC market data:', response.data.rates.BTC);
            console.log('Setting marketData state with:', response.data.rates.BTC);
            startTransition(() => {
              setMarketData(response.data.rates.BTC);
              console.log('marketData state after setting:', response.data.rates.BTC);
            });
          } else {
            console.error('BTC market data is missing in the response:', response.data.rates);
            console.log('Full response data:', response.data);
            throw new Error('BTC market data is missing in the response');
          }
        } else {
          console.error('API response data is missing expected structure:', response.data);
          console.log('Full response data:', response.data);
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
          console.log('Loading state set to false in fetchMarketData finally block');
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
