import ta from 'ta-lib';

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

    movingAverage.push(sum / period);
  }

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
    const rs = avgGain / (avgLoss + 1e-8); // Add small constant to prevent division by zero
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
};

// Calculate Moving Average Convergence Divergence (MACD)
const calculateMACD = (data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
  const closePrices = data.map(row => row.Close);
  const macdResult = ta.MACD(closePrices, shortPeriod, longPeriod, signalPeriod);
  return macdResult.macd; // Return only the MACD array
};

export {
  calculateMovingAverage,
  calculateRSI,
  calculateMACD
};
