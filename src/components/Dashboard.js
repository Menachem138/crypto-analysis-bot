import React, { useState, useEffect, startTransition, useRef } from 'react';
import { getMarketData } from '../coinlayerService.js';

const hasNaN = (array) => array.some(row => Object.values(row).some(value => isNaN(value)));

const loadAndPredictModel = async (setMarketData, signal, isMounted) => {
  let features = []; // Define features variable in the outer scope

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
        console.log('Request to /process_data:', { csvText });

        if (!processResponse.ok) {
          console.error('Error response from /process_data:', processResponse);
          throw new Error(`Server error: ${processResponse.statusText}`);
        }

        const processedData = await processResponse.json();
        console.log('Response from /process_data:', processedData);

        // Check for NaN values in the processed data and replace them using the mean of the column
        console.log('Processed data before replacing NaN values:', processedData);
        processedData.forEach(row => {
          Object.keys(row).forEach(key => {
            if (isNaN(row[key]) || row[key] === null || row[key] === undefined) {
              // Replace NaN, null, or undefined values with the mean of the non-NaN values in the same column
              const columnValues = processedData.map(row => row[key]).filter(value => !isNaN(value) && value !== null && value !== undefined);
              const meanValue = columnValues.length > 0 ? columnValues.reduce((sum, value) => sum + value, 0) / columnValues.length : 0;
              row[key] = columnValues.length > 0 ? meanValue : 0; // Set default value to 0 if column consists entirely of NaN values
            }
          });
        });
        console.log('Processed data after replacing NaN values:', processedData);

        // Additional check to ensure no NaN values remain in the processed data
        if (hasNaN(processedData)) {
          console.error('Processed data still contains NaN values after replacing with mean:', processedData);
          processedData.forEach(row => {
            Object.keys(row).forEach(key => {
              if (isNaN(row[key]) || row[key] === null || row[key] === undefined) {
                row[key] = 0; // Replace remaining NaN, null, or undefined values with 0
              }
            });
          });
          console.log('Processed data after replacing remaining NaN values with 0:', processedData);
        }

        // Final check to ensure no NaN values remain in the processed data
        if (hasNaN(processedData)) {
          console.error('Processed data still contains NaN values after all replacements:', processedData);
          throw new Error('Processed data still contains NaN values after all replacements');
        }

        // Log the state of the data before creating features
        console.log('Data before creating features:', processedData);

        // Create the features array from the processed data
        features = processedData.map(row => [
          row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
        ]);
        console.log('Features data:', features);

        // Create the labels array from the 'Close' prices
        const labels = processedData.map(row => row.Close);
        console.log('Labels data:', labels);

        // Check for NaN values in the features array and replace them with 0
        features.forEach(row => {
          row.forEach((value, index) => {
            if (isNaN(value)) {
              row[index] = 0;
            }
          });
        });
        console.log('Features data after replacing NaN values:', features);

        // Check for NaN values in the labels array and replace them with 0
        labels.forEach((value, index) => {
          if (isNaN(value)) {
            labels[index] = 0;
          }
        });
        console.log('Labels data after replacing NaN values:', labels);

        // Log the state of the data before sending it to the /predict endpoint
        console.log('Data before sending to /predict:', { features });

        const predictResponse = await fetch('http://127.0.0.1:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ features }),
          signal,
        });
        console.log('Request to /predict:', { features });

        if (!predictResponse.ok) {
          console.error('Error response from /predict:', predictResponse);
          throw new Error(`Server error: ${predictResponse.statusText}`);
        }

        const result = await predictResponse.json();
        console.log('Response from /predict:', result);
        if (isMounted) {
          setMarketData(prevData => ({
            ...prevData,
            predictions: result.predictions
          }));
        }

        // Log the state of the data before sending it to the /train endpoint
        console.log('Data before sending to /train:', { features, labels });
        const trainResponse = await fetch('http://127.0.0.1:5000/train', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ features, labels }), // Include both features and labels in the payload
          signal,
        });
        if (!trainResponse.ok) {
          console.error('Error response from /train:', trainResponse);
          throw new Error(`Server error: ${trainResponse.statusText}`);
        }
        const trainResult = await trainResponse.json();
        console.log('Model training process completed:', trainResult);

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
        if (response && response.rates) {
          if (response.rates.BTC) {
            console.log('BTC market data:', response.rates.BTC);
            startTransition(() => {
              if (isMountedRef.current) {
                setMarketData(response.rates.BTC);
              }
            });
          } else {
            console.error('BTC market data is missing in the response:', response.rates);
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
      <h1>Crypto Analysis Dashboard</h1>
      {marketData ? (
        <div>
          <h2>Market Data</h2>
          <p>BTC Price: {marketData}</p>
          {/* Add more market data details here */}
        </div>
      ) : (
        <p>Loading market data...</p>
      )}
      {/* Add more components and content here */}
    </div>
  );
};

export default Dashboard;
