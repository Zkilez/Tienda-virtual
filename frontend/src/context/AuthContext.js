import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/users/login/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        setUser(response.data.user);
      }).catch(err => {
        console.error('Error al verificar token:', err);
        setUser(null);
        setToken('');
        localStorage.removeItem('token');
      });
    }
  }, [token]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};