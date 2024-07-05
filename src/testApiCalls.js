import { getMarketData, getCopyTradingData } from './coinMarketCapService.js';

const testApiCalls = async () => {
  try {
    console.log('Testing getMarketData function...');
    const marketData = await getMarketData('BTC');
    console.log('Market Data:', marketData);

    console.log('Testing getCopyTradingData function...');
    const copyTradingData = await getCopyTradingData();
    console.log('Copy Trading Data:', copyTradingData);
  } catch (error) {
    console.error('Error during API call testing:', error);
  }
};

testApiCalls();
