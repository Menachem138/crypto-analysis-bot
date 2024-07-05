import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import Navbar from './Navbar';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <ChakraProvider>
      <div className="App">
        <Navbar />
        <Dashboard />
      </div>
    </ChakraProvider>
  );
}

export default App;
