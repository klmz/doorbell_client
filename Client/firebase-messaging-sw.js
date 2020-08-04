// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBC4rIl6DAJW-ujyG5zTTM9rlGORgaW_tY",
  authDomain: "doorbell-cc841.firebaseapp.com",
  databaseURL: "https://doorbell-cc841.firebaseio.com",
  projectId: "doorbell-cc841",
  storageBucket: "doorbell-cc841.appspot.com",
  messagingSenderId: "270402270333",
  appId: "1:270402270333:web:a1adbf1e891daea90b6d14"
  });

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
      body: 'Background Message body.',
      icon: '/firebase-logo.png'
    };
  
    return self.registration.showNotification(notificationTitle,
      notificationOptions);
  });

  self.addEventListener('notificationclick', function(event) {
    console.log('Notificaiton click', event);
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event));
  });