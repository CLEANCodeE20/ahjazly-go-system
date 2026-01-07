// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase configuration
// Note: These values will be replaced during build
const firebaseConfig = {
    apiKey: "AIzaSyAm20EOqJkZUWD182vwWV7H3RRrReBCa5s",
    authDomain: "unified-adviser-408114.firebaseapp.com",
    projectId: "unified-adviser-408114",
    storageBucket: "unified-adviser-408114.firebasestorage.app",
    messagingSenderId: "496218595149",
    appId: "1:496218595149:android:143ca2adb8edf7b8ac2104"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'إشعار جديد';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: payload.data?.notification_id || 'notification',
        data: payload.data,
        requireInteraction: false,
        vibrate: [200, 100, 200],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
