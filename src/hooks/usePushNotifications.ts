import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  loading: boolean;
}

export const usePushNotifications = (userId: string | null) => {
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true
  });

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false, loading: false }));
        return;
      }

      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Push] Service worker registered:', registration.scope);
        
        // Check current permission
        const permission = Notification.permission;
        
        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        
        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission,
          loading: false
        });
      } catch (error) {
        console.error('[Push] Error checking support:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications."
        });
        return true;
      } else if (permission === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    }
  }, [state.isSupported, toast]);

  const subscribe = useCallback(async () => {
    if (!state.isSupported || !userId) return null;

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Request permission first if needed
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({ ...prev, loading: false }));
          return null;
        }
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Create subscription with VAPID public key (using a demo key for now)
      const vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      console.log('[Push] Subscribed:', subscription);

      setState(prev => ({ ...prev, isSubscribed: true, loading: false }));

      toast({
        title: "Push Notifications Enabled",
        description: "You'll receive real-time alerts for classes, achievements, and buddy requests."
      });

      return subscription;
    } catch (error: unknown) {
      console.error('[Push] Error subscribing:', error);
      setState(prev => ({ ...prev, loading: false }));
      
      const message = error instanceof Error ? error.message : "Could not enable push notifications.";
      toast({
        title: "Subscription Failed",
        description: message,
        variant: "destructive"
      });
      
      return null;
    }
  }, [state.isSupported, state.permission, userId, requestPermission, toast]);

  const unsubscribe = useCallback(async () => {
    if (!state.isSupported) return false;

    try {
      setState(prev => ({ ...prev, loading: true }));

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      setState(prev => ({ ...prev, isSubscribed: false, loading: false }));

      toast({
        title: "Push Notifications Disabled",
        description: "You won't receive push notifications anymore."
      });

      return true;
    } catch (error: unknown) {
      console.error('[Push] Error unsubscribing:', error);
      setState(prev => ({ ...prev, loading: false }));
      
      const message = error instanceof Error ? error.message : "Could not disable push notifications.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.isSupported, toast]);

  // Send a local test notification
  const sendTestNotification = useCallback(async () => {
    if (!state.isSupported || state.permission !== 'granted') {
      await requestPermission();
    }

    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      
      registration.showNotification('FitClub Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification'
      });

      toast({
        title: "Test Sent",
        description: "Check your notifications!"
      });
    }
  }, [state.isSupported, state.permission, requestPermission, toast]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
