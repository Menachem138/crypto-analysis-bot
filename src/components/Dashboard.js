import React, { useState, useEffect, startTransition } from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
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

const loadAndPredictModel = async (setError, setMarketData, setLoading, signal, isMounted) => {
  try {
    // Clear any previous errors
    setError(null);

    // Function to fetch CSV data
    const fetchCSVData = async () => {
      const response = await fetch('/Binance_1INCHBTC_d.csv', { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
      }
      const csvText = await response.text();
      console.log('Fetched CSV data:', csvText);
      return csvText;
    };

    // Main function to fetch, parse, clean, and preprocess data
    const fetchDataAndPreprocess = async () => {
      try {
        const csvText = await fetchCSVData();
        console.log('Data after fetching:', csvText);

        // Send raw CSV data to the server for processing
        const processResponse = await fetch('http://127.0.0.1:5000/process_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvText }),
          signal,
        });

        if (!processResponse.ok) {
          throw new Error(`Server error: ${processResponse.statusText}`);
        }

        const processedData = await processResponse.json();
        console.log('Processed data from server:', processedData);

        // Check for NaN values in the processed data
        if (hasNaN(processedData)) {
          throw new Error('Processed data contains NaN values');
        }

        // Check for NaN values before sending data to the /predict endpoint
        const features = processedData.map(row => [
          row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
        ]);
        if (hasNaN(features)) {
          throw new Error('Features data contains NaN values');
        }

        // Send processed data to the server for predictions
        const predictResponse = await fetch('http://127.0.0.1:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ features }),
          signal,
        });

        if (!predictResponse.ok) {
          throw new Error(`Server error: ${predictResponse.statusText}`);
        }

        const result = await predictResponse.json();
        if (isMounted) {
          setMarketData(prevData => ({
            ...prevData,
            predictions: result.predictions
          }));
        }
      } catch (error) {
        throw new Error(`CSV Parsing Error: ${error.message}`);
      }
    };

    // Call the fetchDataAndPreprocess function after the component has mounted
    await fetchDataAndPreprocess();

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
    const controller = new AbortController();
    const signal = controller.signal;
    let isMounted = true; // Track if the component is mounted

    const fetchMarketData = async () => {
      try {
        const response = await getMarketData('BTC', { signal }); // Pass a default symbol for testing
        console.log('API response:', response);
        console.log('Full API response object:', response);
        if (response && response.data && response.data.rates) {
          console.log('Valid market data received:', response.data.rates);
          if (response.data.rates.BTC) {
            console.log('BTC market data:', response.data.rates.BTC);
            console.log('Setting marketData state with:', response.data.rates.BTC);
            startTransition(() => {
              if (isMounted) {
                console.log('Before setting marketData:', response.data.rates.BTC);
                setMarketData(response.data.rates.BTC);
                console.log('After setting marketData:', response.data.rates.BTC);
              }
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
        if (err.name !== 'AbortError') {
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
          if (isMounted) {
            setError(`Error: ${err.message}`);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('Loading state set to false in fetchMarketData finally block');
        }
      }
    };

    // Only call these functions when the component mounts for the first time
    if (!marketData) {
      fetchMarketData();
      loadAndPredictModel(setError, setMarketData, setLoading, signal, isMounted);
    }

    // Cleanup function to cancel ongoing operations when the component unmounts
    return () => {
      isMounted = false; // Set isMounted to false to cancel ongoing operations
      controller.abort(); // Cancel ongoing fetch requests
      setLoading(false);
      setError(null);
    };
  }, [marketData]);

  return (
    <div>
      {/* Add your component JSX here */}
    </div>
  );
};

export default Dashboard;
