// pages/_app.js
import React from 'react';
import '../styles/globals.css'; // Import the global CSS file

function MyApp({ token, Component, pageProps }) {
  return (
      <Component {...pageProps} />
  );
}

export default MyApp;