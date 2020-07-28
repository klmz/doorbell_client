import './components/index.js' //register components
import Authentication from './authentication.js';
import Messaging from './messaging.js';
import Database from './database.js';
import Doorbells from './doorbells.js';
import { generateId, clear, since, create} from './utils/index.js';

const $ = (selector) => document.getElementById(selector);

const onLoad = () => {
    //Setup firebase
    try {
        let app = firebase.app();
    } catch (e) {
        console.error(e);
    }

    //Setup auth
    const auth = new Authentication(firebase);
    auth.addOnLoginListener((user) => {
        $('btnLoginLogout').innerHTML = 'Logout';
        doorbells.loadDoorbells();
    });
    auth.addOnLogoutListener((user) => {
        $('btnLoginLogout').innerHTML = 'Login';
    });

    //Setup database
    let db = new Database(firebase, auth);

    //Setup messaging
    const messaging = new Messaging(firebase, db, auth);
    auth.addOnLoginListener((user) => messaging.onLogin(user))

    //Setup Doorbells
    const doorbells = new Doorbells(db, auth);
    doorbells.addOnDoorbellsReceivedListener((doorbells) => renderDoorbells(doorbells));

    //Setup UI
    setupUI(auth, db);
}


///Hierna zijn draken

let events = [];
let receiveNotifications = true;
let doorbellState = {
    'voordeur': {
        online: false,
        gong: false,
        loading: true
    }
}

const renderDoorbells = (doorbells) => {
    const buildOption = (doorbell) => {
        let did = doorbell;
        let option = create('option');
        option.append(document.createTextNode(did));
        option.value = did;
        return option;
    }
    const select = $('doorbells');
    clear(select);
    let options = doorbells.map((doorbell) => buildOption(doorbell));
    options.forEach((option) => select.append(option))

    if (doorbells.length === 1) {
        select.value = options[0].value;
        var event = new Event('change');
        select.dispatchEvent(event);
    }
}

//Event list component
const createLiContent = (event) => {
    const payload = event.payload;
    switch (event.type) {
        case 'TOGGLE_GONG':
            return document.createTextNode(`Toggled gong ${payload.isGongOn ? "on" : "off"}.`);
            break;
        case 'REMOTE_RING':
            return document.createTextNode(`Ringed doorbell ${payload.n} times with a ${payload.delay} ms interval.`)
        case 'RING':
            return document.createTextNode('Someone rang the bell.')
        case 'SENSOR_TRIGGERED':
            return document.createTextNode(payload.message);
        default:
            return document.createTextNode(event.type);
    }
}
const buildListItem = (event) => {
    const li = document.createElement("li");
    const p = document.createElement("p");
    const spnTimestamp = document.createElement("span");
    spnTimestamp.classList.add("timestamp");
    spnTimestamp.appendChild(document.createTextNode(since(event.timestamp) + ": "))
    const span = document.createElement("span");
    span.classList.add("content");
    span.appendChild(createLiContent(event));
    p.appendChild(spnTimestamp);
    p.appendChild(span);
    li.appendChild(p);
    return li;
}
setInterval(() => {
    const ul = $('rings');
    clear(ul);
    events
        .map((event) => buildListItem(event))
        .forEach((li) => ul.append(li));
}, 1000)
//eind even list component
const renderState = (did) => {
    if (!did) return;
    const state = doorbellState[did];
    $("state").innerHTML = `<b>${state.online ? 'Online' : 'Offline'}</b><br />`

    $("switchGong").checked = state.gong;
    $("switchNotifications").checked = receiveNotifications;
}

//When a doorbell is selected subscribe to the events
const subscribeToDoorbell = (db, did) => {
    //TODO FIX workarround for not having the user here
    const user = db.auth.getUser();
    $('btnRing').onclick = () => db.sendEvent(did, {
        'type': 'REMOTE_RING',
        'payload': {
            'n': 2,
            'delay': 500
        }
    })

    $('_switchNotifications').onchange = (e) => {
        const value = e.target.checked;
        e.target.checked = !value
        db.ref(`/users/${user.uid}/gcm-ids/settings/receiveNotifications`).set(value);
    }
    $("_switchGong").onchange = (e) => {
        const value = e.target.checked;
        e.target.checked = !value
        db.sendEvent(did, {
            'type': 'TOGGLE_GONG',
            'payload': {
                isGongOn: value
            }
        });
    }

    //Listen to events
    db.ref('/doorbells/' + did + '/events').orderByKey().limitToLast(20).on('child_added', (snapshot) => {
        const value = snapshot.val();
        value.timestamp = snapshot.key;
        events.unshift(value);
    })
    //listen to state
    db.ref('/doorbells/' + did + '/state').once('value', (snapshot) => {
        doorbellState[did] = snapshot.val();
        console.log('once', doorbellState[did]);
        renderState(did);
    });
    db.ref('/doorbells/' + did + '/state').on('child_changed', (snapshot) => {
        doorbellState[did][snapshot.key] = snapshot.val();
        console.log('once', doorbellState[did]);
        renderState(did);
    });

    db.ref(`/users/${user.uid}/gcm-ids/settings/receiveNotifications`).once('value', (snapshot) => {
        receiveNotifications = snapshot.val();
        renderState(did);
    });
    db.ref(`/users/${user.uid}/gcm-ids/settings/receiveNotifications`).on('value', (snapshot) => {
        receiveNotifications = snapshot.val();
        renderState(did);
    });
}

const setupUI = (auth, db) => {
    //Setup doorbell selections
    $('doorbells').onchange = (event) => {
        subscribeToDoorbell(db, $('doorbells').value);
    }
    $('btnLoginLogout').onclick = () => auth.signIn()

    $('btnConnect').onclick = () => {
        const secret = prompt('What is the doorbell\'s secret?');
        //send the secret
        db.ref(`/doorbells`).orderByChild('secret').equalTo(secret).once('value', (snapshot) => {
            const value = snapshot.val();
            if (!value) return;
            const did = Object.keys(value)[0];
            db.ref(`/doorbells/${did}/state/discoveryMode`).set({
                enabled: true,
                uid: user.uid
            });
        })

    }
}

document.addEventListener('DOMContentLoaded', onLoad);