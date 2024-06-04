// pages/_app.js
import React from 'react';
import { UserProvider } from '../components/auth/UserProvider';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;