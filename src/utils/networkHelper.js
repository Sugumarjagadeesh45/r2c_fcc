import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a wrapper around fetch that handles common cases
export const safeFetch = async (url, options = {}) => {
  try {
    // Get auth token
    const token = await AsyncStorage.getItem('authToken');
    
    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Default headers
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Add auth token if available
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }
    
    // Merge with provided options
    const fetchOptions = {
      headers: { ...defaultHeaders, ...options.headers },
      signal: controller.signal,
      ...options,
    };
    
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // If unauthorized, clear tokens
      if (response.status === 401) {
        await AsyncStorage.multiRemove(['authToken', 'userInfo']);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};