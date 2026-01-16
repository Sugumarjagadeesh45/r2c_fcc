// D:\r2c\src\services\socket.js - FIXED VERSION
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utiliti/config';

let socket = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Store event handlers
const eventHandlers = {
  receiveMessage: [],
  userStatus: [],
  typingStatus: [],
  messageStatusUpdate: [],
  pong: [],
  test_response: []
};

export const initSocket = async (location) => {
  try {
    console.log('[Socket] 🚀 initSocket called');
    
    // If already connected, return existing socket
    if (socket && socket.connected) {
      console.log('[Socket] ✅ Already connected, socket ID:', socket.id);
      return socket;
    }

    if (isConnecting) {
      console.log('[Socket] ⏳ Already connecting, waiting...');
      return socket;
    }

    isConnecting = true;
    
    const token = await AsyncStorage.getItem('authToken');
    console.log('[Socket] 🔑 Token exists:', !!token);
    
    if (!token) {
      console.log('[Socket] ❌ No token for socket connection');
      isConnecting = false;
      return null;
    }

    const query = { token };
    if (location) {
      query.location = JSON.stringify(location);
    }

    console.log('[Socket] 🌐 Connecting to:', API_URL);
    
    // Clean up previous socket if exists
    if (socket) {
      console.log('[Socket] 🧹 Cleaning up previous socket');
      socket.disconnect();
      socket.removeAllListeners();
      socket = null;
    }

    // Create new socket connection with debug logging
    socket = io(API_URL, {
      query,
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });

    // ==================== CORE EVENT LISTENERS ====================
    
    socket.on('connect', () => {
      console.log('\n[Socket] ==========================================');
      console.log('[Socket] ✅ CONNECTED SUCCESSFULLY!');
      console.log('[Socket] 📍 Socket ID:', socket.id);
      console.log('[Socket] 🔗 Connected to:', API_URL);
      console.log('[Socket] ==========================================\n');
      
      isConnecting = false;
      connectionAttempts = 0;
      
      // Send test ping to verify connection
      setTimeout(() => {
        socket.emit('ping', { message: 'Hello from client!' });
      }, 500);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] 🔴 DISCONNECTED. Reason:', reason);
      isConnecting = false;
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] ❌ CONNECTION ERROR:', error.message);
      isConnecting = false;
    });

    // ==================== MESSAGE EVENT HANDLERS ====================
    
    socket.on('receiveMessage', (data) => {
      console.log('\n[Socket] ==========================================');
      console.log('[Socket] 📨 RECEIVED MESSAGE EVENT (Frontend)');
      console.log('[Socket] 📝 From:', data.sender?.name || 'Unknown');
      console.log('[Socket] 📝 Message:', data.text || 'No text');
      console.log('[Socket] 📝 Message ID:', data._id);
      console.log('[Socket] ==========================================\n');
      
      // Call all registered handlers
      eventHandlers.receiveMessage.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[Socket] ❌ Error in receiveMessage handler:', error);
        }
      });
    });

    socket.on('messageStatusUpdate', (data) => {
      console.log('[Socket] ✅ Message status update:', data);
      eventHandlers.messageStatusUpdate.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[Socket] ❌ Error in messageStatusUpdate handler:', error);
        }
      });
    });

    socket.on('userStatus', (data) => {
      console.log('[Socket] 👤 User status update:', data);
      eventHandlers.userStatus.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[Socket] ❌ Error in userStatus handler:', error);
        }
      });
    });

    socket.on('typingStatus', (data) => {
      console.log('[Socket] ✍️ Typing status:', data);
      eventHandlers.typingStatus.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[Socket] ❌ Error in typingStatus handler:', error);
        }
      });
    });

    socket.on('pong', (data) => {
      console.log('[Socket] 🏓 Received pong from server:', data);
      eventHandlers.pong.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[Socket] ❌ Error in pong handler:', error);
        }
      });
    });

    socket.on('test_response', (data) => {
      console.log('[Socket] 🧪 Test response:', data);
      eventHandlers.test_response.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[Socket] ❌ Error in test_response handler:', error);
        }
      });
    });

    // Debug: Log all events
    socket.onAny((eventName, ...args) => {
      if (!['pong', 'ping'].includes(eventName)) {
        console.log(`[Socket] 📡 Event received: ${eventName}`, args.length > 0 ? args[0] : 'No data');
      }
    });

    console.log('[Socket] 🚀 Socket instance created, connecting...');
    return socket;
    
  } catch (error) {
    console.error('[Socket] ❌ Error initializing socket:', error);
    isConnecting = false;
    throw error;
  }
};


// In your frontend socket.js service, modify onReceiveMessage:
export const onReceiveMessage = (handler) => {
  console.log('[Socket] 📡 Registering receiveMessage handler');
  
  // Check if handler already exists
  const exists = eventHandlers.receiveMessage.find(h => h.toString() === handler.toString());
  if (exists) {
    console.log('[Socket] ⚠️ Handler already registered, skipping');
    return;
  }
  
  eventHandlers.receiveMessage.push(handler);
  
  if (socket) {
    socket.on('receiveMessage', handler);
  }
};

export const offReceiveMessage = (handler) => {
  console.log('[Socket] 📡 Removing receiveMessage handler');
  const index = eventHandlers.receiveMessage.indexOf(handler);
  if (index > -1) {
    eventHandlers.receiveMessage.splice(index, 1);
  }
  
  if (socket) {
    socket.off('receiveMessage', handler);
  }
};

export const onUserStatusUpdate = (handler) => {
  if (!eventHandlers.userStatus.includes(handler)) {
    eventHandlers.userStatus.push(handler);
  }
  
  if (socket) {
    socket.on('userStatus', handler);
  }
};

// Generic event handlers
export const on = (event, handler) => {
  console.log(`[Socket] 📡 Adding listener for event: ${event}`);
  if (socket) {
    socket.on(event, handler);
  }
};

export const off = (event, handler) => {
  console.log(`[Socket] 📡 Removing listener for event: ${event}`);
  if (socket) {
    socket.off(event, handler);
  }
};

export const emit = (event, data) => {
  console.log(`[Socket] 📤 Emitting event ${event}:`, data);
  if (socket) {
    socket.emit(event, data);
    return true;
  }
  console.error(`[Socket] ❌ Cannot emit ${event}: Socket not initialized`);
  return false;
};

// Send message with validation
export const sendMessage = (recipientId, text, attachment = null) => {
  if (!socket || !socket.connected) {
    console.error('[Socket] ❌ Cannot send: Socket not connected');
    return false;
  }
  
  console.log(`[Socket] 📤 Sending message to ${recipientId}:`, text?.substring(0, 50) || 'No text');
  socket.emit('sendMessage', { recipientId, text, attachment });
  return true;
};

export const getSocketStatus = () => {
  if (!socket) {
    return {
      status: 'not_initialized',
      connected: false,
      id: null
    };
  }
  
  return {
    status: socket.connected ? 'connected' : 'disconnected',
    connected: socket.connected,
    id: socket.id
  };
};

export const disconnectSocket = () => {
  console.log('[Socket] 🔌 Disconnecting socket');
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
  isConnecting = false;
  connectionAttempts = 0;
  
  // Clear all handlers
  Object.keys(eventHandlers).forEach(key => {
    eventHandlers[key] = [];
  });
};

export const checkConnection = () => {
  const status = getSocketStatus();
  console.log('[Socket] 🔍 Connection check:', status);
  return status.connected;
};

export const testConnection = () => {
  if (socket && socket.connected) {
    console.log('[Socket] 🧪 Testing connection...');
    socket.emit('test', { test: 'connection test', timestamp: Date.now() });
    return true;
  }
  console.error('[Socket] ❌ Cannot test: Socket not connected');
  return false;
};


// import io from 'socket.io-client';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import API_URL from '../utiliti/config';

// let socket;

// export const initSocket = async (location) => {
//   try {
//     const token = await AsyncStorage.getItem('authToken');
//     if (!token) {
//       console.log('No token for socket connection');
//       return;
//     }

//     const query = { token };
//     if (location) {
//       query.location = JSON.stringify(location);
//     }

//     // Connect to the server with the token
//     socket = io(API_URL, {
//       query,
//       transports: ['websocket'],
//     });

//     socket.on('connect', () => {
//       console.log('Socket connected successfully:', socket.id);
//     });

//     socket.on('disconnect', (reason) => {
//       console.log('Socket disconnected:', reason);
//     });

//     socket.on('connect_error', (error) => {
//       console.error('Socket connection error:', error);
//     });

//     return socket;
//   } catch (error) {
//     console.error('Error initializing socket:', error);
//   }
// };

// export const disconnectSocket = () => {
//   if (socket) {
//     socket.disconnect();
//   }
// };

// // --- FIX 1: Update sendMessage to accept attachments ---
// export const sendMessage = (recipientId, text, attachment = null) => {
//   if (socket) {
//     socket.emit('sendMessage', { recipientId, text, attachment });
//   }
// };

// // --- FIX 2: Add Generic 'on' listener export ---
// // This prevents the crash in MessageScreen useEffect
// export const on = (event, handler) => {
//   if (socket) {
//     socket.on(event, handler);
//   }
// };

// // --- FIX 3: Add Generic 'off' listener export ---
// // This allows you to clean up listeners and prevent memory leaks
// export const off = (event, handler) => {
//   if (socket) {
//     socket.off(event, handler);
//   }
// };

// // --- FIX 4: Add Generic 'emit' export ---
// // This fixes the crash when typing (socket.emit is not a function)
// export const emit = (event, data) => {
//   if (socket) {
//     socket.emit(event, data);
//   }
// };

// export const onReceiveMessage = (handler) => {
//   if (socket) {
//     socket.on('receiveMessage', handler);
//   }
// };

// export const onUserStatusUpdate = (handler) => {
//   if (socket) {
//     socket.on('userStatus', handler);
//   }
// };

