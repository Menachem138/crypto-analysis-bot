import React, { useState, useEffect, startTransition, useRef } from 'react';
import { getMarketData } from '../coinlayerService.js';

const hasNaN = (array) => array.some(row => Object.values(row).some(value => isNaN(value)));

// Updated fetchCSVData function
const fetchCSVData = async (signal) => {
  try {
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
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Fetch request was aborted');
      return null; // Return null if the fetch request was aborted
    } else {
      throw error;
    }
  }
};

// Main function to fetch, parse, clean, and preprocess data
const fetchDataAndPreprocess = async (signal, setMarketData, isMountedRef) => {
  try {
    const csvText = await fetchCSVData(signal);
    if (!csvText) {
      console.error('CSV fetch was aborted or failed');
      return;
    }
    console.log('CSV Text:', csvText);

    // Ensure proper handling of newline characters
    const formattedCSVText = csvText.replace(/\\n/g, '\n');
    console.log('Formatted CSV Text:', formattedCSVText);

    const processResponse = await fetch('http://127.0.0.1:5000/process_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ csvText: formattedCSVText }),
      signal,
    });
    console.log('Request to /process_data:', { csvText: formattedCSVText });

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
    const features = processedData.map(row => [
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
    if (isMountedRef.current) {
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
    if (isMountedRef.current) {
      setMarketData(prevData => ({
        ...prevData,
        error: error.message
      }));
    }
  }
};

// Define the Dashboard component
const Dashboard = () => {
  console.log('Dashboard component rendering');
  const [marketData, setMarketData] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('Component mounted');
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchMarketData = async () => {
      try {
        console.log('Starting fetchMarketData');
        const response = await getMarketData('BTC', { signal }); // Pass a default symbol for testing
        console.log('API response:', response);
        if (response && response.rates) {
          const newMarketData = {
            price: response.rates.BTC || 'N/A',
            volume: response.volume || 'N/A',
            marketCap: response.marketCap || 'N/A',
            change24h: response.change24h || 'N/A',
            change7d: response.change7d || 'N/A',
            change30d: response.change30d || 'N/A',
            change1y: response.change1y || 'N/A',
            ath: response.ath || 'N/A',
            atl: response.atl || 'N/A'
          };
          startTransition(() => {
            if (isMountedRef.current) {
              console.log('Setting marketData:', newMarketData);
              setMarketData(newMarketData);
              console.log('marketData state updated:', newMarketData);
            }
          });
        } else {
          console.warn('BTC market data is missing in the response:', response.rates);
          const newMarketData = {
            price: 'N/A',
            volume: 'N/A',
            marketCap: 'N/A',
            change24h: 'N/A',
            change7d: 'N/A',
            change30d: 'N/A',
            change1y: 'N/A',
            ath: 'N/A',
            atl: 'N/A'
          };
          startTransition(() => {
            if (isMountedRef.current) {
              console.log('Setting marketData to N/A');
              setMarketData(newMarketData);
              console.log('marketData state updated to N/A');
            }
          });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching market data:', err.message);
          const newMarketData = {
            price: 'N/A',
            volume: 'N/A',
            marketCap: 'N/A',
            change24h: 'N/A',
            change7d: 'N/A',
            change30d: 'N/A',
            change1y: 'N/A',
            ath: 'N/A',
            atl: 'N/A',
            error: err.message
          };
          if (isMountedRef.current) {
            console.log('Setting marketData to error state');
            setMarketData(newMarketData);
            console.log('marketData state updated to error state:', newMarketData);
          }
        } else {
          console.log('Fetch request was aborted');
        }
      } finally {
        console.log('Market data fetch completed');
      }
    };

    // Only call these functions when the component mounts for the first time
    if (!marketData) {
      console.log('Calling fetchMarketData and fetchDataAndPreprocess');
      fetchMarketData();
      fetchDataAndPreprocess(signal, setMarketData, isMountedRef);
    }

    // Cleanup function to cancel ongoing operations when the component unmounts
    return () => {
      console.log('Component unmounting, current marketData state:', marketData);
      console.log('State updates before unmounting:', {
        marketData,
        isMountedRef: isMountedRef.current
      });
      isMountedRef.current = false; // Set isMountedRef to false to cancel ongoing operations
      controller.abort(); // Abort any ongoing fetch requests to prevent memory leaks
      console.log('Fetch requests aborted');
      console.log('Component unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ensure the hook runs only once on mount

  // Updated JSX in Dashboard component
  return (
    <div>
      <h1>Crypto Analysis Dashboard</h1>
      {marketData ? (
        <div>
          <h2>Market Data</h2>
          <p>BTC Price: {marketData.price || 'N/A'}</p>
          <p>BTC Volume: {marketData.volume || 'N/A'}</p>
          <p>BTC Market Cap: {marketData.marketCap || 'N/A'}</p>
          <p>BTC 24h Change: {marketData.change24h !== undefined ? `${marketData.change24h}%` : 'N/A'}</p>
          <p>BTC 7d Change: {marketData.change7d !== undefined ? `${marketData.change7d}%` : 'N/A'}</p>
          <p>BTC 30d Change: {marketData.change30d !== undefined ? `${marketData.change30d}%` : 'N/A'}</p>
          <p>BTC 1y Change: {marketData.change1y !== undefined ? `${marketData.change1y}%` : 'N/A'}</p>
          <p>BTC All-Time High: {marketData.ath || 'N/A'}</p>
          <p>BTC All-Time Low: {marketData.atl || 'N/A'}</p>
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
