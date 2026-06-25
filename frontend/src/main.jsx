import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Loader from './components/ui/Loader';
import './index.css';

function Root() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Show loader for at least 1.8s so the Three.js animation is visible,
    // then fade out once fonts + assets are loaded.
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const minDelay = new Promise(r => setTimeout(r, 1800));

    Promise.all([fonts, minDelay]).then(() => setAppReady(true));
  }, []);

  return (
    <>
      {!appReady && <Loader />}
      <div style={{ visibility: appReady ? 'visible' : 'hidden' }}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
