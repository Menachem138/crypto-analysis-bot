import React from "react";
import {
  ThemeProvider,
  CSSReset,
  Box
} from "@chakra-ui/react";
import { customTheme } from "./theme";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <CSSReset />
      <Box maxWidth="1200px" margin="auto" p={4}>
        <Dashboard />
      </Box>
    </ThemeProvider>
  );
}

export default App;