const FCM = require('fcm-node')
const apn = require('apn')
const fs = require('fs');
const path = require('path')

let apnProvider = new apn.Provider({
    token: {
        key: fs.readFileSync(path.resolve(__dirname + '/AuthKey_F9LR8J6A87.p8')),
        keyId: process.env.APPLE_KEY_ID,
        teamId: process.env.APPLE_TEAM_ID,
    },
    production: true
});
module.exports = {
    sendForAndroid: (notificationData) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(notificationData)
                let serverKey = process.env.ANDROID_SEVER_KEY;
                let fcm = new FCM(serverKey);
                console.log(notificationData.deviceToken)
                let messageToBeSent = {
                    registration_ids: notificationData.deviceToken,
                    collapse_key: 'collapse key',
                    data: notificationData
                };
                console.log(messageToBeSent)
                fcm.send(messageToBeSent, (error, response) => {
                    if (error) {
                        return resolve('Error while sending push notification:-', error);
                        // if (error.includes('NotRegistered') || error.includes('InvalidRegistration')) {
                        //     return reject(error);
                        // }
                        // else {
                        //     return reject(error);
                        // }
                    }
                    else {
                        console.log("Notification has been sent successfully:-", response)
                        return resolve(response);
                    }
                });
            } catch (error) {
                return reject(error);
            }
        })
    },

    sendForIOS: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let note = new apn.Notification();
                note.sound = "ping.aiff";
                note.alert = {
                    title: 'Trail Challenger',//data.name,
                    body: data.message
                };
                note.topic = process.env.APPLE_BUILD_ID;
                note.mutableContent = 1;
                note.payload = {
                    data: {
                        type: data.type,
                        data: data.data
                    }
                };
                note.aps['content-available'] = 1;
                apnProvider.send(note, data.deviceToken).then((success) => {
                    if (success) {
                        console.log("push has been sent successfully :-", success);
                        return resolve(success);
                    }
                });
            } catch (error) {
                console.log('error while sending Notification :-', error);
                return reject({ message: error, status: 0 });
            }
        })
    }
};
