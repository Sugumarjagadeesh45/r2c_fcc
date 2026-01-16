import getApiUrl from '../utiliti/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
const API_URL = getApiUrl;

class UserService {
  // Helper method to get token
  static async getToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No token found in storage');
        throw new Error('Authentication token not found');
      }
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }

  // Get user profile with automatic token
  static async getUserProfile() {
    try {
      const token = await this.getToken();
      return await this.getUserProfileWithToken(token);
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Get user profile with provided token
  static async getUserProfileWithToken(token) {
    try {
      console.log('Making request to:', `${API_URL}/api/user/profile`);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        console.log('Token expired or invalid');
        // Clear invalid token
        await AsyncStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data received');
      
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(profileData) {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }



  static async uploadProfilePicture(imageUri) {
  try {
    const token = await this.getToken();
    console.log('Uploading profile picture via FormData:', imageUri);
    
    // Create a proper FormData object
    const formData = new FormData();
    
    // Extract filename and determine MIME type
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Append the image with proper structure
    formData.append('profileImage', {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: filename,
      type: type,
    });
    
    console.log('📤 Sending upload request...');
    console.log('📤 FormData contents:', {
      field: 'profileImage',
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: filename,
      type: type,
    });
    
    // Add timeout and more detailed error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_URL}/api/user/profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // Content-Type is set automatically by fetch for FormData
      },
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📥 Upload response:', result);

    if (response.status === 401) {
      await AsyncStorage.removeItem('authToken');
      throw new Error('Authentication failed. Please login again.');
    }

    return result;
  } catch (error) {
    console.error('Upload profile picture error:', error);
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    
    throw error;
  }
}

  // Get user stats
  static async getUserStats() {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_URL}/api/user/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Validate token
  static async validateToken() {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Search users
  static async searchUsers(query) {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_URL}/api/user/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // New method: Get another user's profile by their ID
  static async getOtherUserProfileById(userId, token) {
    try {
      if (!token) {
        token = await this.getToken(); // Attempt to get token if not provided
      }
      if (!userId) {
        throw new Error('User ID is required to fetch profile');
      }

      console.log('Making request to:', `${API_URL}/api/user/profile/${userId}`);
      
      const response = await fetch(`${API_URL}/api/user/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for user ID: ${userId}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error getting user profile for ID ${userId}:`, error);
      throw error;
    }
  }
}

export default UserService;



// // D:\cddd\NEW_reals2chat_frontend-main\src\services\userService.js
// import getApiUrl from '../utiliti/config';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = getApiUrl;

// class UserService {
//   // Helper method to get token
//   static async getToken() {
//     try {
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         console.error('No token found in storage');
//         throw new Error('Authentication token not found');
//       }
//       return token;
//     } catch (error) {
//       console.error('Error getting token:', error);
//       throw error;
//     }
//   }

//   // Get user profile with automatic token
//   static async getUserProfile() {
//     try {
//       const token = await this.getToken();
//       return await this.getUserProfileWithToken(token);
//     } catch (error) {
//       console.error('Get user profile error:', error);
//       throw error;
//     }
//   }

//   // Get user profile with provided token
//   static async getUserProfileWithToken(token) {
//     try {
//       console.log('Making request to:', `${API_URL}/api/user/profile`);
//       console.log('Using token:', token ? 'Token exists' : 'No token');
      
//       const response = await fetch(`${API_URL}/api/user/profile`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       console.log('Response status:', response.status);
      
//       if (response.status === 401) {
//         console.log('Token expired or invalid');
//         // Clear invalid token
//         await AsyncStorage.removeItem('authToken');
//         throw new Error('Authentication failed. Please login again.');
//       }
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const data = await response.json();
//       console.log('Response data received');
      
//       return data;
//     } catch (error) {
//       console.error('Get user profile error:', error);
//       throw error;
//     }
//   }

//   // Update user profile
//   static async updateUserProfile(profileData) {
//     try {
//       const token = await this.getToken();
//       const response = await fetch(`${API_URL}/api/user/profile`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(profileData),
//       });

//       if (response.status === 401) {
//         await AsyncStorage.removeItem('authToken');
//         throw new Error('Authentication failed. Please login again.');
//       }

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Update user profile error:', error);
//       throw error;
//     }
//   }

//   // Upload profile picture
//   static async uploadProfilePicture(profilePicture) {
//     try {
//       const token = await this.getToken();
//       console.log('Uploading profile picture, base64 length:', profilePicture.length);
      
//       const response = await fetch(`${API_URL}/api/user/profile-picture`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ profilePicture }),
//       });

//       if (response.status === 401) {
//         await AsyncStorage.removeItem('authToken');
//         throw new Error('Authentication failed. Please login again.');
//       }

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Upload profile picture error:', error);
//       throw error;
//     }
//   }

//   // Get user stats
//   static async getUserStats() {
//     try {
//       const token = await this.getToken();
//       const response = await fetch(`${API_URL}/api/user/stats`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.status === 401) {
//         await AsyncStorage.removeItem('authToken');
//         throw new Error('Authentication failed. Please login again.');
//       }

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Get user stats error:', error);
//       throw error;
//     }
//   }

//   // Validate token
//   static async validateToken() {
//     try {
//       const token = await this.getToken();
//       const response = await fetch(`${API_URL}/api/user/profile`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       return response.ok;
//     } catch (error) {
//       console.error('Token validation error:', error);
//       return false;
//     }
//   }

//   // Search users
//   static async searchUsers(query) {
//     try {
//       const token = await this.getToken();
//       const response = await fetch(`${API_URL}/api/user/search?query=${encodeURIComponent(query)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.status === 401) {
//         await AsyncStorage.removeItem('authToken');
//         throw new Error('Authentication failed. Please login again.');
//       }

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Search users error:', error);
//       throw error;
//     }
//   }
// }

// export default UserService;
//   }

//   // Validate token
//   static async validateToken() {
//     try {
//       const token = await this.getToken();
//       const response = await fetch(`${API_URL}/api/user/profile`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       return response.ok;
//     } catch (error) {
//       console.error('Token validation error:', error);
//       return false;
//     }
//   }

//   // Search users
//   static async searchUsers(query) {
//     try {
//       const token = await this.getToken();
//       const response = await fetch(`${API_URL}/api/user/search?query=${encodeURIComponent(query)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.status === 401) {
//         await AsyncStorage.removeItem('authToken');
//         throw new Error('Authentication failed. Please login again.');
//       }

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Search users error:', error);
//       throw error;
//     }
//   }
// }

// export default UserService;