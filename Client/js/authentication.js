class Authentication {
    constructor(firebase, onLoginListeners, onLogoutListeners){
        this.firebase = firebase;
        this.onLoginListeners = [];
        this.onLogoutListeners = [];

        firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    }

    getUser(){
        if(this.user === null){
            throw Error("The user is not logged in ");
        }
        return this.user;
    }
    addOnLoginListener(listener){
        this.onLoginListeners.push(listener);
        return this;
    }   
    addOnLogoutListener(listener){
        this.onLogoutListeners.push(listener);
        return this;
    }   

    onAuthStateChanged(user){
        if (user) {
            this.user = user;
            this.onLoginListeners.forEach((listener) => listener(user));
        } else {
            this.user = null;
            console.log('Logged out');
            //$('btnLoginLogout').innerHTML = 'Login';

            this.onLogoutListeners.forEach((listener) => listener());
        }
    }

    signIn(){
        var provider = new firebase.auth.GoogleAuthProvider();
        this.firebase.auth().signInWithPopup(provider).then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            this.googleToken = result.credential.accessToken;
            // The signed-in user info.
            this.user = result.user;
        }).catch(function (error) {
            console.error(error);
        });
    }
}

export default Authentication;