import { ChakraProvider, Grid, extendTheme } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
const theme = extendTheme({ components: { Button: { baseStyle: { _focus: { outline: 'none' } } } } })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Grid autoFlow='row dense'>
        <App />
      </Grid>
    </ChakraProvider>
  </React.StrictMode>
)
