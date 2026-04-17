import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const response = await apiClient.get('/users/me/');
        setUser(response.data);
      }
    } catch (error) {
      console.log('Auth check failed', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login/', { email, password });
    const { access, refresh } = response.data;
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    const userResponse = await apiClient.get('/users/me/');
    setUser(userResponse.data);
  };

  const register = async (email, username, password, passwordConfirm) => {
    await apiClient.post('/users/register/', {
      email,
      username,
      password,
      password_confirm: passwordConfirm,
    });
    await login(email, password);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
