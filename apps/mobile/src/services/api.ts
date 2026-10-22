import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Single source of truth for backend URL.
// Release traffic uses the production API over HTTPS.
const DEFAULT_DEV_URL = 'http://172.20.10.2:8080/api';
const DEFAULT_PROD_URL = 'https://185.207.250.210/api';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (__DEV__ ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
    }
    return Promise.reject(error);
  }
);

export default api;
