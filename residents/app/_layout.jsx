import { Slot, useRouter, useSegments } from "expo-router";
import './../style/globals.css';
import { useEffect, createContext, useState, useRef } from 'react';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '@/config/api';

import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(true); // 👈 hides all logs

if (__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  logout: () => {},
});

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  
  // Prevent multiple simultaneous logout calls
  const isLoggingOut = useRef(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Set up API interceptor for token expiry
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only handle 401 if we're not already logging out and not on auth pages
        if (error.response?.status === 401 && !isLoggingOut.current && segments[0] !== 'auth') {
          console.log('401 detected, initiating logout');
          await logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Clean up interceptor
      api.interceptors.response.eject(interceptor);
    };
  }, [segments]);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and trying to access protected routes
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated and on auth pages, redirect to home
      router.replace('/home');
    }
  }, [isAuthenticated, segments, isLoading]);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (token && userData) {
        // Set auth token in API config for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOut.current) {
      console.log('Logout already in progress, skipping...');
      return;
    }

    isLoggingOut.current = true;

    try {
      console.log('Starting logout process...');
      
      // Remove auth header first to prevent 401 loop
      const token = api.defaults.headers.common['Authorization'];
      delete api.defaults.headers.common['Authorization'];
      
      // Try to call logout API (optional, don't wait for it)
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout API timeout')), 3000)
        );
        
        // Race between API call and timeout
        await Promise.race([
          api.post('v1/resident/logout'),
          timeoutPromise
        ]);
        console.log('Logout API call successful');
      } catch (apiError) {
        console.log("Logout API call failed or timed out, continuing with local logout");
      }

      // Clear local storage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      // Update state
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('Logout complete, navigating to login...');
      
      // Small delay to ensure state updates before navigation
      setTimeout(() => {
        router.replace('/auth/login');
        isLoggingOut.current = false;
      }, 100);
      
    } catch (error) {
      console.error("Error during logout:", error);
      
      // Force logout even if there's an error
      await AsyncStorage.clear();
      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
      
      setTimeout(() => {
        router.replace('/auth/login');
        isLoggingOut.current = false;
      }, 100);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        setIsAuthenticated, 
        user, 
        setUser,
        logout 
      }}
    >
      <SafeAreaProvider>
        {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}> */}
          <Slot/>
        {/* </KeyboardAvoidingView> */}
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}