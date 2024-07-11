import React, { useState, useEffect, useRef, useReducer } from 'react';
import { getMarketData } from '../coinlayerService.js';

const hasNaN = (array) => array.some(row => Object.values(row).some(value => isNaN(value)));

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

// Remove deepEqual function
// Simplify fetchDataAndPreprocess function
const fetchDataAndPreprocess = async (signal, dispatch, isMountedRef, marketData) => {
  if (!isMountedRef.current) {
    console.log('Component is unmounted, skipping fetchDataAndPreprocess');
    return;
  }
  try {
    console.log('fetchDataAndPreprocess started');
    const csvText = await fetchCSVData(signal);
    if (!csvText) {
      console.error('CSV fetch was aborted or failed');
      return;
    }
    console.log('CSV Text:', csvText);

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

    processedData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (isNaN(row[key]) || row[key] === null || row[key] === undefined) {
          const columnValues = processedData.map(row => row[key]).filter(value => !isNaN(value) && value !== null && value !== undefined);
          const meanValue = columnValues.length > 0 ? columnValues.reduce((sum, value) => sum + value, 0) / columnValues.length : 0;
          row[key] = columnValues.length > 0 ? meanValue : 0;
        }
      });
    });
    console.log('Processed data after replacing NaN values:', processedData);

    if (hasNaN(processedData)) {
      processedData.forEach(row => {
        Object.keys(row).forEach(key => {
          if (isNaN(row[key]) || row[key] === null || row[key] === undefined) {
            row[key] = 0;
          }
        });
      });
      console.log('Processed data after replacing remaining NaN values with 0:', processedData);
    }

    if (hasNaN(processedData)) {
      throw new Error('Processed data still contains NaN values after all replacements');
    }

    const features = processedData.map(row => [
      row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
    ]);
    console.log('Features data:', features);

    const labels = processedData.map(row => row.Close);
    console.log('Labels data:', labels);

    features.forEach(row => {
      row.forEach((value, index) => {
        if (isNaN(value)) {
          row[index] = 0;
        }
      });
    });
    console.log('Features data after replacing NaN values:', features);

    labels.forEach((value, index) => {
      if (isNaN(value)) {
        labels[index] = 0;
      }
    });

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
      console.log('Previous marketData state:', marketData);
      console.log('Next marketData state with predictions:', {
        ...marketData,
        predictions: result.predictions
      });
      console.log('Component is still mounted, updating marketData with predictions');
      dispatch({ type: 'SET_MARKET_DATA', payload: { ...marketData, predictions: result.predictions } });
    } else {
      console.log('Component is unmounted, skipping marketData update');
    }

    console.log('Data before sending to /train:', { features, labels });
    const trainResponse = await fetch('http://127.0.0.1:5000/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features, labels }),
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
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }
};

// Define the Dashboard component
const Dashboard = () => {
  console.log('Dashboard component rendering');

  const initialState = {
    marketData: null,
    error: null
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_MARKET_DATA':
        return { ...state, marketData: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const { marketData, error } = state;
  const isMountedRef = useRef(true);

  const shallowCompare = (obj1, obj2) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    console.log('Component mounted');
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchMarketData = async () => {
      try {
        console.log('Starting fetchMarketData');
        const response = await getMarketData('BTC', { signal });
        console.log('API response:', response);
        if (response && response.success && response.rates && response.rates.BTC) {
          const newMarketData = {
            price: response.rates.BTC,
            volume: response.volume || 'N/A',
            marketCap: response.marketCap || 'N/A',
            change24h: response.change24h || 'N/A',
            change7d: response.change7d || 'N/A',
            change30d: response.change30d || 'N/A',
            change1y: response.change1y || 'N/A',
            ath: response.ath || 'N/A',
            atl: response.atl || 'N/A'
          };
          if (isMountedRef.current && !shallowCompare(marketData, newMarketData)) {
            console.log('Previous marketData state:', marketData);
            console.log('Next marketData state:', newMarketData);
            console.log('Setting marketData:', newMarketData);
            dispatch({ type: 'SET_MARKET_DATA', payload: newMarketData });
            console.log('marketData state updated:', newMarketData);
          }
        } else {
          console.warn('API response data is missing expected structure or contains an error:', response);
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
          if (isMountedRef.current && !shallowCompare(marketData, newMarketData)) {
            console.log('Setting marketData to N/A');
            dispatch({ type: 'SET_MARKET_DATA', payload: newMarketData });
            console.log('marketData state updated to N/A');
          }
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
          if (isMountedRef.current && !shallowCompare(marketData, newMarketData)) {
            console.log('Setting marketData to error state');
            dispatch({ type: 'SET_MARKET_DATA', payload: newMarketData });
            console.log('marketData state updated to error state:', newMarketData);
          }
        } else {
          console.log('Fetch request was aborted');
        }
      } finally {
        console.log('Market data fetch completed');
      }
    };

    const fetchAndProcessData = async () => {
      console.log('Calling fetchMarketData and fetchDataAndPreprocess');
      await fetchMarketData();
      await fetchDataAndPreprocess(signal, dispatch, isMountedRef, marketData);
    };

    fetchAndProcessData();

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
