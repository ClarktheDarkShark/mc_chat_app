// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
// Remove reportWebVitals if not used
// import reportWebVitals from './reportWebVitals';

if (process.env.NODE_ENV === "production") {
  console.log = (...args) => {
    const newArgs = ["[PROD LOG]", ...args];
    window.console.log.apply(this, newArgs);
  };
  console.error = (...args) => {
    const newArgs = ["[PROD ERROR]", ...args];
    window.console.error.apply(this, newArgs);
  };
  console.warn = (...args) => {
    const newArgs = ["[PROD WARN]", ...args];
    window.console.warn.apply(this, newArgs);
  };
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);