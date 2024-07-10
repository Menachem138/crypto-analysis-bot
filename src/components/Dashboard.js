import React, { useState, useEffect, startTransition, useRef } from 'react';
import { getMarketData } from '../coinlayerService.js';

const hasNaN = (array) => array.some(row => Object.values(row).some(value => isNaN(value)));

const loadAndPredictModel = async (setMarketData, signal, isMounted) => {
  try {
    // Function to fetch CSV data
    const fetchCSVData = async () => {
      const response = await fetch('/Binance_1INCHBTC_d.csv', { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${response.statusText}`);
      }
      const csvText = await response.text();
      console.log('Fetched CSV data:', csvText);
      if (csvText.includes('NaN')) {
        console.error('Fetched CSV data contains NaN values:', csvText);
      }
      return csvText;
    };

    // Main function to fetch, parse, clean, and preprocess data
    const fetchDataAndPreprocess = async () => {
      try {
        const csvText = await fetchCSVData();
        console.log('CSV Text:', csvText);
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
        console.log('Processed data:', processedData);
        if (hasNaN(processedData)) {
          console.error('Processed data contains NaN values:', processedData);
          throw new Error('Processed data contains NaN values');
        }

        const features = processedData.map(row => [
          row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
        ]);
        console.log('Features data:', features);
        if (hasNaN(features)) {
          console.error('Features data contains NaN values:', features);
          throw new Error('Features data contains NaN values');
        }

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
        console.log('Prediction result:', result);
        if (isMounted) {
          setMarketData(prevData => ({
            ...prevData,
            predictions: result.predictions
          }));
        }
      } catch (error) {
        console.error(`CSV Parsing Error: ${error.message}`);
        if (isMounted) {
          setMarketData(prevData => ({
            ...prevData,
            error: error.message
          }));
        }
      }
    };

    // Call the fetchDataAndPreprocess function after the component has mounted
    await fetchDataAndPreprocess();

  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (isMounted) {
      setMarketData(prevData => ({
        ...prevData,
        error: err.message
      }));
    }
  }
};

// Define the Dashboard component
const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchMarketData = async () => {
      try {
        const response = await getMarketData('BTC', { signal }); // Pass a default symbol for testing
        console.log('API response:', response);
        if (response && response.data && response.data.rates) {
          if (response.data.rates.BTC) {
            console.log('BTC market data:', response.data.rates.BTC);
            startTransition(() => {
              if (isMountedRef.current) {
                setMarketData(response.data.rates.BTC);
              }
            });
          } else {
            console.error('BTC market data is missing in the response:', response.data.rates);
            throw new Error('BTC market data is missing in the response');
          }
        } else {
          console.error('API response data is missing expected structure:', response);
          throw new Error('API response data is missing expected structure');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching market data:', err.message);
        }
      } finally {
        console.log('Market data fetch completed');
      }
    };

    // Only call these functions when the component mounts for the first time
    if (!marketData) {
      fetchMarketData();
      loadAndPredictModel(setMarketData, signal, isMountedRef.current);
    }

    // Cleanup function to cancel ongoing operations when the component unmounts
    return () => {
      isMountedRef.current = false; // Set isMountedRef to false to cancel ongoing operations
      controller.abort(); // Cancel ongoing fetch requests
    };
  }, [marketData]);

  return (
    <div>
      {/* Add your component JSX here */}
    </div>
  );
};

export default Dashboard;
