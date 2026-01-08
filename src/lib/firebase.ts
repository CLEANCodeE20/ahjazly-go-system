import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

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

// Initialize Firebase Cloud Messaging lazily
let messagingPromise: Promise<Messaging | null> | null = null;

const getMessagingSafe = async (): Promise<Messaging | null> => {
    if (messagingPromise) return messagingPromise;

    messagingPromise = (async () => {
        try {
            const supported = await isSupported();
            if (supported) {
                return getMessaging(app);
            }
            console.warn('Firebase Messaging is not supported in this browser environment.');
            return null;
        } catch (error) {
            console.error('Error checking Firebase Messaging support:', error);
            return null;
        }
    })();

    return messagingPromise;
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
    try {
        const messaging = await getMessagingSafe();
        if (!messaging) {
            console.warn('Firebase Messaging not supported');
            return null;
        }

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
export const setupForegroundMessageListener = async (
    callback: (payload: any) => void
): Promise<(() => void) | null> => {
    try {
        const messaging = await getMessagingSafe();
        if (!messaging) {
            console.warn('Firebase Messaging not supported');
            return null;
        }

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('📬 Foreground message received in firebase.ts:', payload);
            callback(payload);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up foreground message listener:', error);
        return null;
    }
};

/**
 * Check if notifications are supported
 */
export const areNotificationsSupported = async (): Promise<boolean> => {
    return 'Notification' in window &&
        'serviceWorker' in navigator &&
        await isSupported();
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
};
