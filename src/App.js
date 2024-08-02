import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar.js';
import Dashboard from './components/Dashboard.js';
import MarketAnalysis from './components/MarketAnalysis.js';
import Predictions from './components/Predictions.js';
import CopyTrading from './components/CopyTrading.js';
import './App.css';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route exact path="/" element={<Dashboard />} />
            <Route path="/market-analysis" element={<MarketAnalysis />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/copy-trading" element={<CopyTrading />} />
          </Routes>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
