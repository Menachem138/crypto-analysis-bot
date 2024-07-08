import React, { useState, useEffect, startTransition } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import MarketChart from './MarketChart.js';
import CopyTrading from './CopyTrading.js';
import { getMarketData } from '../coinMarketCapService.js';
import { calculateRSI, calculateMovingAverage } from '../technicalAnalysis.js';
import NewsFeed from './NewsFeed.js';
import FinancialAdvice from './FinancialAdvice.js';
import { Widget } from '@typeform/embed-react';

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
          console.log('Fetched CSV Text (first few rows):', csvText.split('\n').slice(0, 5)); // Log the first 5 rows of the fetched CSV text
          const rows = csvText.split('\n').slice(2).filter(row => row.trim() !== '' && row.split(',').length === 10 && !isNaN(parseInt(row.split(',')[0], 10)));
          console.log('Filtered Rows (after skipping first two lines):', rows.slice(0, 5)); // Log the first 5 rows after filtering and skipping the first two lines
          parsedData = rows.map(row => {
            const values = row.split(',');
            if (values.length === 10) { // Ensure the row has the expected number of columns
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
              console.log('Skipping malformed row:', row); // Log and skip malformed rows
              return null;
            }
          }).filter(row => row !== null); // Filter out null values
          console.log('CSV file parsed successfully');
          console.log('Parsed Data:', parsedData.slice(0, 5)); // Log the first 5 parsed data rows
          // Additional logging to capture the state of the data immediately after parsing
          parsedData.forEach((row, index) => {
            console.log(`Row ${index} after parsing:`, row);
          });
        } catch (error) {
          console.error('Error during CSV parsing:', error);
          throw new Error(`CSV Parsing Error: ${error.message}`);
        }

        console.log('Parsed Data before NaN check:', parsedData.slice(0, 5)); // Log the first 5 parsed data rows before NaN check

        // Check for NaN values in parsed data and replace them with zeros
        parsedData = parsedData.map(row => {
          Object.keys(row).forEach(key => {
            if (isNaN(row[key]) || !isFinite(row[key])) {
              console.log(`Invalid value found in key: ${key}, value: ${row[key]}`); // Log the key and value if NaN or infinite is found
              row[key] = 0;
            }
          });
          return row;
        });

        console.log('Parsed Data after NaN check:', parsedData.slice(0, 5)); // Log the first 5 parsed data rows after NaN check

        // Additional logging to capture the state of the data at each step
        parsedData.forEach((row, index) => {
          console.log(`Row ${index} after NaN check:`, row);
        });

        // Convert the data to arrays
        console.log('Starting to convert parsed data to arrays');
        const dataArray = parsedData;

        // Extract features and labels
        console.log('Starting to extract features and labels');

        // Log the raw data array before tensor creation
        console.log('Raw data array before tensor creation:', dataArray.slice(0, 5)); // Log the first 5 raw data rows

        // Check for NaN values in raw data array and replace them with zeros
        const cleanedDataArray = dataArray.map(row => {
          Object.keys(row).forEach(key => {
            if (isNaN(row[key]) || !isFinite(row[key])) {
              console.log(`Invalid value found in key: ${key}, value: ${row[key]}`); // Log the key and value if NaN or infinite is found
              row[key] = 0;
            }
          });
          return row;
        });

        console.log('Cleaned raw data array before tensor creation:', cleanedDataArray.slice(0, 5)); // Log the first 5 cleaned raw data rows

        // Calculate RSI with the corrected rolling calculation
        const rsiValues = calculateRSI(cleanedDataArray);
        console.log('RSI Values before assignment:', rsiValues.slice(0, 5)); // Log the first 5 RSI values before assignment
        cleanedDataArray.forEach((row, index) => {
          row.Relative_Strength_Index = rsiValues[index];
        });
        console.log('RSI Values after assignment:', cleanedDataArray.slice(0, 5).map(row => row.Relative_Strength_Index)); // Log the first 5 RSI values after assignment

        // Check for NaN or infinite values in RSI
        rsiValues.forEach((value, index) => {
          if (isNaN(value) || !isFinite(value)) {
            console.error(`Invalid RSI value at index ${index}: ${value}`);
          }
        });

        // Calculate Moving Average
        const movingAverageValues = calculateMovingAverage(cleanedDataArray);
        console.log('Moving Average Values before assignment:', movingAverageValues.slice(0, 5)); // Log the first 5 Moving Average values before assignment
        cleanedDataArray.forEach((row, index) => {
          row.Moving_Average = movingAverageValues[index];
        });
        console.log('Moving Average Values after assignment:', cleanedDataArray.slice(0, 5).map(row => row.Moving_Average)); // Log the first 5 Moving Average values after assignment

        // Check for NaN or infinite values in Moving Average
        movingAverageValues.forEach((value, index) => {
          if (isNaN(value) || !isFinite(value)) {
            console.error(`Invalid Moving Average value at index ${index}: ${value}`);
          }
        });

      } catch (err) {
        setError(`Error: ${err.message}`);
        console.error('Error in loadAndTrainModel:', err);
      } finally {
        setLoading(false);
        console.log('Loading state set to false in loadAndTrainModel finally block');
      }
    };

    loadAndTrainModel();
  }, []);

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
        <MarketChart data={formattedMarketData} />
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
        </Box>
        <Widget id="449162832" style={{ width: '100%', height: '500px' }} className="my-form" />
      </Box>
    </ErrorBoundary>
  );
};

export default Dashboard;
