import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  // Return null context instead of throwing error for graceful degradation
  return context || { socket: null, isConnected: false };
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let newSocket = null;
    
    const initializeSocket = async () => {
      try {
        // Get user info to connect socket
        const res = await api.get('/auth/me');
        const user = res.data?.user;

        if (user) {
          newSocket = io('http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
          });

          newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            
            // Notify server about user connection
            newSocket.emit('user:connect', {
              userId: user._id,
              userType: user.userType
            });
          });

          newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
          });

          newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
          });

          setSocket(newSocket);
        }
      } catch (error) {
        // User not logged in or API error - that's okay
        console.log('Socket not initialized:', error.message);
      }
    };

    initializeSocket();

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};  