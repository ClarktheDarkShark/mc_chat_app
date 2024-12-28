// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark'
    primary: {
      main: '#1976d2', // default MUI blue
    },
    secondary: {
      main: '#ff4081', // pink, for example
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif', // a modern Google Font
    h4: {
      fontWeight: 600,
    },
    // You can override more text styles if desired
  },
  shape: {
    borderRadius: 12, // rounded corners
  },
});

export default theme;
