// In src/navigation/MainTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

import HomeScreen from '../homescreen';
import FriendsScreen from '../FriendsScreen';
import CreateScreen from '../CreateScreen';
import ChatScreen from '../ChatScreen';
import ProfileScreen from '../ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Friends') iconName = 'user-friends';
        else if (route.name === 'Create') iconName = 'plus-square';
        else if (route.name === 'Chat') iconName = 'comment';
        else if (route.name === 'Profile') iconName = 'user';

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FF0050',
      tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
      tabBarStyle: {
        backgroundColor: '#121212',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Friends" component={FriendsScreen} />
    <Tab.Screen name="Create" component={CreateScreen} />
    <Tab.Screen name="Chat" component={ChatScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default MainTabs;