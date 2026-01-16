// src/navigation/AuthNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useUser } from '../context/UserContext';
import LoginScreen from '../login';
import RegisterScreen from '../register';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const { user, loading } = useUser();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is authenticated - this will be handled by AppNavigator
        // This component will only show auth screens
        null
      ) : (
        // User is not authenticated, show auth screens
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              animationTypeForReplace: 'pop'
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              animation: 'slide_from_right'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigator;