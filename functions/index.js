'use strict';
const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const getSettings = (tokenResponse) =>{
	return {
		allowedTypes: [],
		receiveNotifications: true,
		...tokenResponse.settings
	}
}

const getDeviceTokens = async (users, payload) =>{
	let tokenPromises = Object.keys(users.val()).map(async (uid) => {
		const tokenPromise = await admin.database()
			.ref(`/users/${uid}/gcm-ids`).once('value');
		const tokenResponse = tokenPromise.val()

		const notificationSettings = getSettings(tokenResponse)
		if(!notificationSettings.allowedTypes.includes(payload.notification.type)){
				console.log("This notification was not allowed to be send for this user", uid, payload.notification.type)
				return [];
		}
		if(notificationSettings.receiveNotifications){
			return Object.keys(tokenResponse).filter((item) => item !== "settings");
		}
		
		return [];	
	})
	let tokens = await Promise.all(tokenPromises);
	return tokens.reduce((acc, x) => acc.concat(x), []);
}

const sendNotification = async (doorbellId, payload) => {
	const users = await admin.database().ref(`/doorbells/${doorbellId}/users`).once('value');
	let tokens = await getDeviceTokens(users, payload);
	console.log("sending to:", tokens);
	
	// Send notifications to all tokens.
	if(tokens.length === 0) return;

	return await admin.messaging().sendToDevice(tokens, payload);
}


exports.eventListener = functions.database.ref('/doorbells/{did}/events/{timestamp}')
	.onWrite(async (change, context) => {
		const {did, timestamp} = context.params;
		const event = change.after.val()
;
		console.log("Received event: ", event.type, event);
		switch (event.type) {
			case 'RING':
				// The ring is handle on the doorbell side for now.
				// The cold start of this function is too slow for the required doorbell response
				// return await handleRing(did, timestamp, event);
				return;
			case 'ONLINE':
			case 'OFFLINE':
				return await handleOnlineOffline(did, timestamp, event);
			case 'TOGGLE_GONG':
				return await handleGong(did, timestamp, event);
			case "SENSOR_TRIGGERED":
				//This is handled on the doorbell side for now
				// return await handleSensorTriggered(did, timestamp, event);
				return;
		}
	})

	
const handleGong = async (did, timestamp, event) => {
	console.log("Setting gong:", event.payload.isGongOn);
	await admin.database().ref(`/doorbells/${did}/state/gong`).set(event.payload.isGongOn);
}
	
const handleSensorTriggered = async (did, timestamp, event) => await sendNotification(did, {
	notification: {
		title: 'Een sensor detecteerde iets',
		body: event.payload.message,
		type: 'SENSOR_TRIGGERED'
	}
});
const handleRing = async (did, timestamp, event) => await sendNotification(did, {
	notification: {
		title: 'Er belde iemand aan.',
		body: `Bij de deurbell ${did}.`,
		type: 'RING'
	}
});

const handleOnlineOffline = async (did, timestamp, event) => {
	let isOnline;
	let payload;

	switch (event.type) {
		case 'OFFLINE':
			isOnline = false;
			payload = {
				notification: {
					title: 'Je deurbel ging offline',
					body: `Het gaat om deurbell ${did}.`,
					type: 'OFFLINE'
				}
			};
			break;
		case 'ONLINE':
			isOnline = true;
			payload = {
				notification: {
					title: 'Je deurbel ging online',
					body: `Het gaat om deurbell ${did}.`,
					type: 'ONLINE'
				}
			};
			break;
			
		default:
			throw Error('Unknown event type in handleOnlineOffline', event.type);
	}

	await admin.database().ref(`/doorbells/${did}/state/online`).set(isOnline);
	await sendNotification(did, payload);
}
