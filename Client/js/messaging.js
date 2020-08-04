class Messaging{
    constructor(firebase, db, auth){
        this.messaging = firebase.messaging();
        this.db = db;
        this.auth = auth;
        
<<<<<<< Updated upstream
        this.messaging.usePublicVapidKey("BLZ_vp3uxqZzGckZDsorXVV_aAKrGb6kF3nU1HbkoDfz8qt2vCv8b98mSuKRTJdgO5HLF5JTAYbAXupPoVVvCfg");
        // this.messaging.usePublicVapidKey("AAAAsbpWdGo:APA91bGOWr0mBoaVe18rPtyvrwnEnBAISJtwD4uNrvMaoqPBEA1tQk2FHYnwXyE_UXWs87TZfa0qgwhmz4z5rwls8j4WM7D0bEQ3VlZYpP-mY1V8ldtwTMWaUG2bQuBq2hVgAn5tPYI4");
=======
        // this.messaging.usePublicVapidKey("BLZ_vp3uxqZzGckZDsorXVV_aAKrGb6kF3nU1HbkoDfz8qt2vCv8b98mSuKRTJdgO5HLF5JTAYbAXupPoVVvCfg");
        this.messaging.usePublicVapidKey("BLwk4DMCPeD6C6Ax-zK1O8Xv85YbW7hJJb7zqS5Byqem1S_b4s7nkNpljBX4MsVCRW2TZrEIGkaOinl8Pk4PL94");
>>>>>>> Stashed changes
        this.messaging.onTokenRefresh(this.onTokenRefresh);
        this.messaging.onMessage(this.onMessage)
    }

    onLogin(user){
        // Get Instance ID token. Initially this makes a network call, once retrieved
        // subsequent calls to getToken will return from cache.
        this.messaging.getToken().then((currentToken) => {
            console.log('currentToken', currentToken);
            if (currentToken) {
                this.db.saveToken(currentToken);
            } else {
                console.log('No Instance ID token available. Request permission to generate one.');
            }
        }).catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
        });           
    }      
    
    onTokenRefresh(){
        this.messaging.getToken().then((refreshedToken) => {
            console.log('Token refreshed.', refreshedToken);
            this.db.saveToken(refreshedToken);
        }).catch((err) => {
            console.log('Unable to retrieve refreshed token ', err);
        });
    }

    onMessage(payload){
        console.log('Message received', payload);
        const notificationTitle = payload.notification.title;
        const notificationOptions = payload.notification;
        var notification = new Notification(notificationTitle, notificationOptions);
        notification.onclick = (event) =>{
            console.log(event);
        }
    }
}

export default Messaging;