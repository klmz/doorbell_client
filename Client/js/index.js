import './components/index.js' //register components
import Authentication from './authentication.js';
import Messaging from './messaging.js';
import Database from './database.js';
import Doorbells from './doorbells.js';
import { generateId, clear, since, create } from './utils/index.js';

const $ = (selector) => document.getElementById(selector);
let storage;
const onLoad = () => {
    //Setup firebase
    try {
        let app = firebase.app();
    } catch (e) {
        console.error(e);
    }
    storage = firebase.storage();
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
const imageListItem = (payload, title) =>{
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(title));

    if (payload && payload.url) {
        
        const ref = storage.refFromURL(payload.url);
        ref.getDownloadURL().then( url =>{
            div.appendChild(getImageTag(url))
        })
    } else {
        const spinner = document.createElement('div');
        spinner.classList.add('loader');
        div.appendChild(spinner)
    }
    return div;
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
            return imageListItem(payload, 'Someone rang the bell.');
        case 'CAPTURE_IMAGE':
            return imageListItem(payload, 'Capture image');
        case 'SENSOR_TRIGGERED':
            return document.createTextNode(payload.message);
        default:
            return document.createTextNode(event.type);
    }
}
const imgMem = {};
const getImageTag = (src) => {
    if (imgMem[src]) {
        return imgMem[src];
    }

    const img = document.createElement('img');
    img.src = src;

    imgMem[src] = img
    return imgMem[src];
}
const createTimestamp = (event) => {
    const spnTimestamp = document.createElement("span");
    spnTimestamp.classList.add("timestamp");
    spnTimestamp.innerText = `${since(event.timestamp)}: `;
    setInterval(()=>{
        spnTimestamp.innerText = `${since(event.timestamp)}: `;
    }, 1000);
    return spnTimestamp;
}
const buildListItem = (event) => {
    const li = document.createElement("li");
    const p = document.createElement("p");
    const spnTimestamp = createTimestamp(event);
    
    const content = document.createElement("div");
    content.classList.add("content");
    content.appendChild(createLiContent(event));
    p.appendChild(spnTimestamp);
    p.appendChild(content);
    li.appendChild(p);

    return li;
}

const renderEvents = (events)=>{
    const ul = $('rings');
    clear(ul);
    if (events) {
        events
            .map((event) => buildListItem(event))
            .forEach((li) => ul.append(li));
    }
}
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

    //remove events with duplicate tags, but keeps the newest.
    const removeDuplicateTags = (events) =>{
        const indexTagMap = {};
        const removableIndices = [];
        events.forEach((event, i) =>{
            if(!event.payload.tag) return;
            if(typeof indexTagMap[event.payload.tag] != "undefined"){
                //replace the index, and schedule the existing value for deletion
                removableIndices.push(i);
            }
            indexTagMap[event.payload.tag] = i;
        })
        removableIndices.reverse().forEach((i) =>{
            console.log('remove', events[i].payload, events[i].timestamp);
            events.splice(i, 1);

        })
    }
    //Listen to events
    db.ref('/doorbells/' + did + '/events').orderByKey().limitToLast(20).on('value', (snapshot) => {
        const newEvents = snapshot.val();
        const keys = Object.keys(newEvents);
        const events = [];
        
        keys.forEach(key =>{
            
            events.unshift({
                ...newEvents[key],
                timestamp: key
            })
        })
        removeDuplicateTags(events);
        renderEvents(events);
    })

    //listen to state
    db.ref('/doorbells/' + did + '/state').once('value', (snapshot) => {
        doorbellState[did] = snapshot.val();
        renderState(did);
    });
    db.ref('/doorbells/' + did + '/state').on('child_changed', (snapshot) => {
        doorbellState[did][snapshot.key] = snapshot.val();
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


    $('btnSend').onclick = (event) => {
        db.sendEvent('voordeur', {
            type: 'TEST_TAG',
            payload: {
                tag: generateId(5),
                image: "and something else"
            }
        })

    }
    $('btnCapture').onclick = () => {
        const event = {
            type: 'CAPTURE_IMAGE',
            payload: {
                tag: generateId(10)
            }
        };
        db.sendEvent('voordeur', event)
    }
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
                uid: auth.getUser().uid
            });
        })

    }
}

document.addEventListener('DOMContentLoaded', onLoad);