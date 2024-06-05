import { useContext } from 'react';
import { ApiContext } from './auth/UserContext';

export function useApi() {
    const api = useContext(ApiContext);
  
    function get(url, params) {
      return api.get(url, { params });
    }
  
    function post(url, data, params) {
      return api.post(url, data, {params});
    }
  
    function del(url, data, params) {
      return api.delete(url, data, {params});
    }
  
    function setHeaders(headers) {
      api.defaults.headers = {
        ...api.defaults.headers,
        ...headers
      };
    }
    
    return { get, post, del, setHeaders };
}