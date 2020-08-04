// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyD0GRgeKtnPEERNp8_69CEEXiMrr-1KLY4",
    authDomain: "doorbell-7c976.firebaseapp.com",
    databaseURL: "https://doorbell-7c976.firebaseio.com",
    projectId: "doorbell-7c976",
    storageBucket: "doorbell-7c976.appspot.com",
    messagingSenderId: "925356953936",
    appId: "1:925356953936:web:3d792e3a470c6b9c23dc55",
    measurementId: "G-M28R1SSRE3"
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