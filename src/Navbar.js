import React from 'react';
import { Link, Button, useColorMode, Input } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <nav className="navbar">
      <div className="navbar-brand">Crypto Analysis</div>
      <div className="navbar-links">
        <Link href="#" className="navbar-link">Home</Link>
        <Link href="#" className="navbar-link">Market Analysis</Link>
        <Link href="#" className="navbar-link">Predictions</Link>
        <Link href="#" className="navbar-link">Copy Trading</Link>
        <Input placeholder="Search..." className="navbar-search" />
        <Button onClick={toggleColorMode} className="navbar-button">
          {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
