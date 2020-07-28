class Doorbells{

    constructor(db, auth){
        this.db = db;
        this.auth = auth;
        this.onDoorbellsReceivedListeners = [];
        this.doorbells = [];
    }

    addOnDoorbellsReceivedListener(listener){
        this.onDoorbellsReceivedListeners.push(listener);
    }

    onDoorbellsReceived(doorbells){
        this.onDoorbellsReceivedListeners.forEach(listener => listener(doorbells));
    }

   async loadDoorbells(){
        this.doorbells = await this.db.getDoorbells();
        this.onDoorbellsReceived(this.doorbells);   
    }
}

export default Doorbells;