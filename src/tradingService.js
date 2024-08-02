const ccxt = require('ccxt');

// Function to fetch trading data from a specific exchange
async function fetchTradingData(exchangeId, symbol) {
    try {
        const exchange = new ccxt[exchangeId]();
        const ticker = await exchange.fetchTicker(symbol);
        console.log(`Ticker data for ${symbol} on ${exchangeId}:`, ticker);
        return ticker;
    } catch (error) {
        console.error(`Error fetching trading data from ${exchangeId} for ${symbol}:`, error);
        throw error;
    }
}

// Function to execute a trade on a specific exchange
async function executeTrade(exchangeId, symbol, type, side, amount, price) {
    try {
        const exchange = new ccxt[exchangeId]();
        const order = await exchange.createOrder(symbol, type, side, amount, price);
        console.log(`Order executed on ${exchangeId} for ${symbol}:`, order);
        return order;
    } catch (error) {
        console.error(`Error executing trade on ${exchangeId} for ${symbol}:`, error);
        throw error;
    }
}

module.exports = {
    fetchTradingData,
    executeTrade
};
