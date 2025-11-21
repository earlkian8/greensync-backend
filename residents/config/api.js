import axios from 'axios';

// Use your local IP, not 0.0.0.0 or localhost
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://greensync-6i8z6.ondigitalocean.app/api';
// export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.254.106:8000/api';
// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Note: Response interceptor is set up in _layout.jsx to handle 401 errors and logout
