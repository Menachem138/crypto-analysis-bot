const ta = require('ta-lib');

// Calculate Moving Average
const calculateMovingAverage = (data, period = 14) => {
  let movingAverage = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      movingAverage.push(0); // Moving Average is not defined for the first 'period' values
      continue;
    }

    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].Close;
    }

    const avg = sum / period;
    if (isNaN(avg) || !isFinite(avg)) {
      console.error('Invalid Moving Average value:', avg);
      throw new Error('Invalid Moving Average value');
    }

    movingAverage.push(avg);
  }

  // Log the moving average for verification
  console.log('Moving Average:', movingAverage);

  return movingAverage;
};

// Calculate Relative Strength Index (RSI)
const calculateRSI = (data, period = 14) => {
  let rsi = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(0); // RSI is not defined for the first 'period' values
      continue;
    }

    let gain = 0;
    let loss = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j].Close - data[j - 1].Close;
      if (change > 0) {
        gain += change;
      } else {
        loss -= change;
      }
    }

    const avgGain = gain / period;
    const avgLoss = loss / period;
    if (avgLoss === 0) {
      rsi.push(100); // If avgLoss is zero, RSI is 100
    } else {
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      if (isNaN(rsiValue) || !isFinite(rsiValue)) {
        console.error('Invalid RSI value:', rsiValue);
        throw new Error('Invalid RSI value');
      }
      rsi.push(rsiValue);
    }
  }

  // Log the RSI for verification
  console.log('RSI:', rsi);

  return rsi;
};

// Calculate Moving Average Convergence Divergence (MACD)
const calculateMACD = (data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
  const closePrices = data.map(row => row.Close);
  const macdResult = ta.MACD(closePrices, shortPeriod, longPeriod, signalPeriod);

  // Log the MACD for verification
  console.log('MACD:', macdResult.macd);

  // Check for NaN values in the MACD
  if (macdResult.macd.some(value => isNaN(value) || !isFinite(value))) {
    console.error('MACD contains invalid values:', macdResult.macd);
    throw new Error('MACD contains invalid values');
  }

  return macdResult.macd; // Return only the MACD array
};

module.exports = {
  calculateMovingAverage,
  calculateRSI,
  calculateMACD
};
