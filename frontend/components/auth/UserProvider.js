import { UserContext, ApiContext } from './UserContext';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export function UserProvider({ token, children }) {

  const api = axios.create({
    baseURL: '/api/',
  });

  const decoded = token ? jwt.decode(token) : null;
  const user = decoded?.sub || null;
  const groups = decoded?.groups || [];
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