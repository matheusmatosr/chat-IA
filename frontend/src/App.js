import React from 'react';
import { CssBaseline, Container, Typography, ThemeProvider, createTheme } from '@mui/material';
import Chat from './components/Chat';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Chat com Qwen2.5:7b
        </Typography>
        <Chat />
      </Container>
    </ThemeProvider>
  );
}

export default App;