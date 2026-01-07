import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;

try {
    // Only initialize messaging if service worker is supported
    if ('serviceWorker' in navigator) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.error('Firebase messaging initialization error:', error);
}

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
    if (!messaging) {
        console.warn('Firebase messaging not initialized');
        return null;
    }

    try {
        // 1. Register Service Worker explicitly
        console.log('🔄 Registering Service Worker...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
        });
        console.log('✅ Service Worker registered:', registration);

        // 2. Request permission
        console.log('🔄 Requesting notification permission...');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Notification permission granted');

            // 3. Get FCM token with explicit registration
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
            return token;
        } else {
            console.warn('❌ Notification permission denied');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

/**
 * Setup foreground message listener
 */
export const setupForegroundMessageListener = (
    callback: (payload: any) => void
): (() => void) | null => {
    if (!messaging) {
        console.warn('Firebase messaging not initialized');
        return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📬 Foreground message received in firebase.ts:', payload);
        callback(payload);
    });

    return unsubscribe;
};

/**
 * Check if notifications are supported
 */
export const areNotificationsSupported = (): boolean => {
    return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
    return Notification.permission;
};

export { messaging };
