const { calculateMovingAverage } = require('./technicalAnalysis');

// Sample data for testing
const sampleData = [
  { Close: 100 },
  { Close: 105 },
  { Close: 110 },
  { Close: 115 },
  { Close: 120 },
  { Close: 125 },
  { Close: 130 },
  { Close: 135 },
  { Close: 140 },
  { Close: 145 },
];

// Test the calculateMovingAverage function
const period = 5;
const movingAverageValues = calculateMovingAverage(sampleData, period);

console.log('Sample Data:', sampleData);
console.log('Moving Average Values:', movingAverageValues);

// Check for NaN values in the result
if (movingAverageValues.some(value => isNaN(value))) {
  console.error('Moving Average calculation resulted in NaN values:', movingAverageValues);
} else {
  console.log('Moving Average calculation successful:', movingAverageValues);
}
