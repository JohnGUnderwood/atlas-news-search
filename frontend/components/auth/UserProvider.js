import { UserContext, ApiContext } from './UserContext';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { useState, useEffect } from 'react';

export function UserProvider({ children }) {
  const api = axios.create({
    baseURL: 'api/',
  });

  const token = process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE ? process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE : context.req?.headers['x-kanopy-internal-authorization'];
  
  const decoded = token ? jwt.decode(token) : null;
  const user = decoded?.sub || null;
  const groups = decoded?.groups || null;
  if(user && groups){
    api.defaults.headers.common['User'] = user;
    api.defaults.headers.common['Groups'] = groups;
  }
  
  return (
    <UserContext.Provider value={{user,groups}}>
      <ApiContext.Provider value={api}>
        {children}
      </ApiContext.Provider>
    </UserContext.Provider>
  );
}