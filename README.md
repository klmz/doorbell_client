# doorbell

1. Make sure nodejs en firebase cli are installed.
2. Go to the `.firebaserc` file and change the default project id, to your own project id. You can find this in your firebase console.
3. Run `firebase init` in the root of this repo. 
3. Accept all the defaults, but make sure to always answer 'no' when it asks you to overwrite existing files.
3. Answer yes when it asks you to install npm packages.
3. For the public directory enter 'Client'
3. Again, don't overwrite existing files.
3. Update the config object in `Client/firebase-messaging-sw.js:10`. You can find your config object in the firebase console under settings, general, your apps. You might have to create an webapp to get this config object.
3. In `Client/js/messaging.js:7` you have to change the messaging public key, you can find that under settings -> cloud messaging. You want the server key (i'm not sure if this is the right key...)
1. Enable google sign in under authentication -> sign-in method, follow the steps to enable google sign in. Or any other authentication provider you want to use.
3. Run `firebase deploy`. That should deploy the firebase functions, create a database and the host the webapp.
3. If you had to create an app in the previous step you can now link that app to your hosting in the save place where the config object could be found.
If you want to deploy changes to a specific part you can also do `firebase deploy --only functions` and it only deploys functions.

