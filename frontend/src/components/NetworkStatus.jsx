import React, { useState, useEffect } from 'react';
import { FaWifi, FaWifiSlash } from 'react-icons/fa';

/**
 * NetworkStatus component monitors and displays the network connectivity status
 */
const NetworkStatus = ({ showNotification = true }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showReconnectedAlert, setShowReconnectedAlert] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [lastOnlineTime, setLastOnlineTime] = useState(
    navigator.onLine ? Date.now() : null
  );
  
  // Update online status when it changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
      
      if (!showNotification) return;
      
      // Show reconnected alert if we were previously offline
      if (!isOnline) {
        setShowReconnectedAlert(true);
        
        // Auto-hide the alert after 5 seconds
        setTimeout(() => {
          setShowReconnectedAlert(false);
        }, 5000);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      if (!showNotification) return;
      
      // Show offline alert
      setShowOfflineAlert(true);
      
      // Start reconnection attempts
      setReconnectionAttempts(1);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, showNotification]);
  
  // Periodically check connection when offline
  useEffect(() => {
    let intervalId;
    
    if (!isOnline) {
      // Try to reconnect every 5 seconds, with increasing intervals
      intervalId = setInterval(() => {
        // Ping the server to check connection
        fetch('/api/ping', { method: 'HEAD' })
          .then(() => {
            // If we get a response, we're online
            if (!navigator.onLine) {
              // Force update online status
              window.dispatchEvent(new Event('online'));
            }
          })
          .catch(() => {
            // Still offline, increment reconnection attempts
            setReconnectionAttempts(prev => prev + 1);
          });
      }, Math.min(5000 * Math.pow(1.5, reconnectionAttempts), 30000)); // Max 30 seconds between attempts
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOnline, reconnectionAttempts]);
  
  // Don't show anything if no notifications are needed
  if (!showNotification || (isOnline && !showReconnectedAlert)) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Offline notification */}
      {!isOnline && showOfflineAlert && (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center mb-2 animate-fadeIn">
          <FaWifiSlash className="mr-2 text-lg" />
          <div>
            <p className="font-medium">You are offline</p>
            <p className="text-sm">
              {reconnectionAttempts > 1 
                ? `Attempting to reconnect (${reconnectionAttempts} attempts)...` 
                : 'Attempting to reconnect...'}
            </p>
            {lastOnlineTime && (
              <p className="text-xs mt-1">
                Last online: {new Date(lastOnlineTime).toLocaleTimeString()}
              </p>
            )}
          </div>
          <button 
            onClick={() => setShowOfflineAlert(false)}
            className="ml-4 text-white hover:text-red-100"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Reconnected notification */}
      {isOnline && showReconnectedAlert && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center animate-fadeIn">
          <FaWifi className="mr-2 text-lg" />
          <div>
            <p className="font-medium">Connection restored</p>
            <p className="text-sm">You are back online</p>
          </div>
          <button 
            onClick={() => setShowReconnectedAlert(false)}
            className="ml-4 text-white hover:text-green-100"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus; 
