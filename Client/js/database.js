class Database {
    constructor(firebase, auth){
        this.db = firebase.database();
        this.auth = auth;
    }

    ref(path){
        return this.db.ref(path);
    }
    saveToken(token){
        this.db.ref('users/' + this.auth.getUser().uid + '/gcm-ids/' + token).set(true);
    }
    
    sendEvent(did, event){
        if (!this.db) {
            throw Error('db is not initialised');
        }
        const eventId = new Date().getTime();
        this.db.ref('/doorbells/' + did + '/events/' + eventId).set(event);
    }
    
    async getDoorbells(){
        const snapshot = await this.db.ref(`/users/${this.auth.getUser().uid}/doorbells`).once('value');
        const value = snapshot.val();
        const doorbells = [];
        if (value) {
            doorbells.push(Object.keys(value))
        }
        
        return doorbells;
    }
}

export default Database;