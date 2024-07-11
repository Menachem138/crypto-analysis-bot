import React, { useEffect, useRef, useReducer } from 'react';
import { getMarketData } from '../coingeckoService.js';

const fetchCSVData = async (signal) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/Binance_1INCHBTC_d.csv', { signal });
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

const processCSVData = async (csvText, signal) => {
  try {
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
    return processedData;
  } catch (error) {
    console.error('Error processing CSV data:', error);
    return null;
  }
};

const extractFeatures = (processedData) => {
  return processedData.map(row => [
    row.Open, row.High, row.Low, row.Close, row['Volume 1INCH'], row['Volume BTC'], row.tradecount, row.Relative_Strength_Index, row.Moving_Average, row.MACD
  ]);
};

const extractLabels = (processedData) => {
  return processedData.map(row => row.Close);
};

const makePredictions = async (features, signal) => {
  try {
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
    return result.predictions;
  } catch (error) {
    console.error('Error making predictions:', error);
    return [];
  }
};

const trainModel = async (features, labels, signal) => {
  try {
    const trainResponse = await fetch('http://127.0.0.1:5000/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features, labels }),
      signal,
    });
    if (!trainResponse.ok) {
      throw new Error(`Server error: ${trainResponse.statusText}`);
    }
    const trainResult = await trainResponse.json();
    console.log('Model training process completed:', trainResult);
  } catch (error) {
    console.error('Error training model:', error);
  }
};

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

    const processedData = await processCSVData(formattedCSVText, signal);
    if (!processedData) {
      console.error('CSV processing failed');
      return;
    }
    console.log('Processed data:', processedData);

    const features = extractFeatures(processedData);
    const labels = extractLabels(processedData);
    console.log('Features data:', features);
    console.log('Labels data:', labels);

    const predictions = await makePredictions(features, signal);
    if (isMountedRef.current) {
      console.log('Previous marketData state:', marketData);
      console.log('Next marketData state with predictions:', {
        ...marketData,
        predictions
      });
      console.log('Component is still mounted, updating marketData with predictions');
      dispatch({ type: 'SET_MARKET_DATA', payload: { ...marketData, predictions } });
    } else {
      console.log('Component is unmounted, skipping marketData update');
    }

    await trainModel(features, labels, signal);
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
  const { marketData } = state;
  const isMountedRef = useRef(true);

  const shallowCompare = (obj1, obj2) => {
    console.log('shallowCompare called with:', obj1, obj2);
    if (!obj1 || !obj2) return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      console.log('shallowCompare result: false (different number of keys)');
      return false;
    }

    for (let key of keys1) {
      console.log(`Comparing key: ${key}, obj1 value: ${obj1[key]}, obj2 value: ${obj2[key]}`);
      if (obj1[key] !== obj2[key] && !(obj1[key] == null && obj2[key] == null)) {
        console.log(`shallowCompare result: false (different values for key: ${key})`);
        return false;
      }
    }

    console.log('shallowCompare result: true');
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

        // Log the response headers and body as text
        console.log('Response Headers:', response.headers);
        const responseBody = await response.clone().text();
        console.log('Response Body:', responseBody);

        // Check if the response is JSON
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response but received non-JSON response');
        }

        if (response && response.length > 0 && response[0].current_price) {
          const newMarketData = {
            price: response[0].current_price,
            volume: response[0].total_volume || 'N/A',
            marketCap: response[0].market_cap || 'N/A',
            change24h: response[0].price_change_percentage_24h || 'N/A',
            change7d: response[0].price_change_percentage_7d || 'N/A',
            change30d: response[0].price_change_percentage_30d || 'N/A',
            change1y: response[0].price_change_percentage_1y || 'N/A',
            ath: response[0].ath || 'N/A',
            atl: response[0].atl || 'N/A'
          };
          if (isMountedRef.current && !shallowCompare(state.marketData, newMarketData)) {
            console.log('Previous marketData state:', state.marketData);
            console.log('Next marketData state:', newMarketData);
            console.log('Setting marketData:', newMarketData);
            dispatch({ type: 'SET_MARKET_DATA', payload: newMarketData });
            console.log('marketData state updated:', newMarketData);
          } else {
            console.log('No change in marketData state detected by shallowCompare');
          }
        } else if (response.length === 0) {
          console.warn('API response is empty:', response);
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
            error: 'API response is empty'
          };
          if (isMountedRef.current) {
            console.log('Setting marketData to default state for empty response');
            dispatch({ type: 'SET_MARKET_DATA', payload: newMarketData });
            console.log('marketData state updated to default state for empty response:', newMarketData);
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
            atl: 'N/A',
            error: 'API response data is missing expected structure or contains an error'
          };
          if (isMountedRef.current) {
            console.log('Setting marketData to error state');
            dispatch({ type: 'SET_MARKET_DATA', payload: newMarketData });
            console.log('marketData state updated to error state:', newMarketData);
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
          if (isMountedRef.current) {
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
      await fetchDataAndPreprocess(signal, dispatch, isMountedRef, state.marketData);
    };

    fetchAndProcessData();

    // Cleanup function to cancel ongoing operations when the component unmounts
    return () => {
      console.log('Component unmounting, current marketData state:', state.marketData);
      console.log('State updates before unmounting:', {
        marketData: state.marketData,
        isMountedRef: isMountedRef.current
      });
      isMountedRef.current = false; // Set isMountedRef to false to cancel ongoing operations
      console.log('isMountedRef set to false');
      controller.abort(); // Abort any ongoing fetch requests to prevent memory leaks
      console.log('Fetch requests aborted');
      console.log('Component unmounted');
    };
  }, []); // Ensure the hook runs on mount only

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
