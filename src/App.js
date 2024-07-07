import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
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
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route path="/market-analysis" component={MarketAnalysis} />
            <Route path="/predictions" component={Predictions} />
            <Route path="/copy-trading" component={CopyTrading} />
          </Switch>
        </div>
      </Router>
    </ChakraProvider>
  );
}

export default App;
