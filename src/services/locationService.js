// src/services/locationService.js
import Geolocation from '@react-native-community/geolocation';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit } from './socket';
import API_URL from '../utiliti/config';

class LocationService {
  constructor() {
    this.watchId = null;
    this.lastLocation = null;
    this.updateInterval = null;
    this.isTracking = false;
  }

  async requestLocationPermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message: 'This app needs to access your location to show nearby friends',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled by Info.plist
        return true;
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  }

  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            console.log("My current location:", { latitude, longitude });
            
            this.lastLocation = { latitude, longitude };
            resolve({ latitude, longitude });
          },
          error => {
            console.error('Error getting location:', error);
            let errorMessage = 'Unable to get location';
            
            switch (error.code) {
              case 1:
                errorMessage = 'Location permission denied';
                break;
              case 2:
                errorMessage = 'Position unavailable';
                break;
              case 3:
                errorMessage = 'Location request timed out';
                break;
              default:
                errorMessage = 'Unknown location error';
            }
            
            reject(new Error(errorMessage));
          },
          { 
            enableHighAccuracy: true, 
            timeout: 20000, // Increased timeout
            maximumAge: 60000 // Accept last known location up to 1 minute old
          }
        );
      });
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
      throw error;
    }
  }

  async sendLocationToBackend(location) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      // Send via REST API
      const response = await fetch(`${API_URL}/api/nearby/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      const data = await response.json();
      console.log('Location updated successfully:', data);
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  }

  async startLocationTracking() {
    if (this.isTracking) {
      console.log('Location tracking already started');
      return;
    }

    this.isTracking = true;
    console.log('Starting location tracking');

    try {
      // Get initial location
      const location = await this.getCurrentLocation();
      await this.sendLocationToBackend(location);

      // Set up periodic updates (every 60 seconds)
      this.updateInterval = setInterval(async () => {
        try {
          const location = await this.getCurrentLocation();
          await this.sendLocationToBackend(location);
        } catch (error) {
          console.error('Error getting periodic location:', error);
        }
      }, 60000);

      // Set up location watching for movement detection
      this.watchId = Geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          
          // Check if user moved more than 100 meters
          if (this.lastLocation) {
            const distance = this.calculateDistance(
              this.lastLocation.latitude,
              this.lastLocation.longitude,
              latitude,
              longitude
            );
            
            if (distance > 100) {
              this.lastLocation = { latitude, longitude };
              this.sendLocationToBackend({ latitude, longitude });
            }
          } else {
            this.lastLocation = { latitude, longitude };
            this.sendLocationToBackend({ latitude, longitude });
          }
        },
        error => console.error('Error watching position:', error),
        { 
          enableHighAccuracy: true, 
          distanceFilter: 50, // Minimum distance (in meters) between updates
          interval: 30000 // Minimum time (in ms) between updates
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
    }
  }

  stopLocationTracking() {
    if (!this.isTracking) {
      console.log('Location tracking not active');
      return;
    }

    console.log('Stopping location tracking');
    this.isTracking = false;

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate distance between two points
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  isLocationTrackingActive() {
    return this.isTracking;
  }
}

export default new LocationService();