var MongoClient = require('mongodb').MongoClient
const fs = require('fs');
const path = require('path');

//Create a MongoDB client, open a connection to DocDB; as a replica set,
//  and specify the read preference as secondary preferred

var client = MongoClient.connect(
    //process.env.dbAWS,
    "mongodb://trailchallengerproddb:trailchallengerproddb@trailchallengerproddb.cluster-cq1o84i0aoyy.ap-southeast-1.docdb.amazonaws.com:27017/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false",
    //"mongodb://master:trailchalnger2022@trailchalanger-prod-db.cluster-cq1o84i0aoyy.ap-southeast-1.docdb.amazonaws.com:27017/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false",
    {
        // useNewUrlParser: true
        tlsCAFile: path.resolve(__dirname, "./rds-combined-ca-bundle.pem") //Specify the DocDB; cert
    },
    function (err, client) {
        if (err) {
            console.error('connection error:', err)
            // throw err;
        }
        else {
            console.log('Database connected:',"mongodb://trailchallengerproddb:trailchallengerproddb@trailchallengerproddb.cluster-cq1o84i0aoyy.ap-southeast-1.docdb.amazonaws.com:27017/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false")
        }
        //Specify the database to be used
        db = client.db('trailChallenger');
        client.close()
    });


//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&


// const Mongoose = require("mongoose");
// const fs = require("fs");
// const path = require("path");

// interface DBCertificate {
//     readonly importFile: string;
// }

// let dbCertificateObject:DBCertificate = {
//     importFile: path.resolve(__dirname, "./rds-combined-ca-bundle.pem")
// }
// class DataAccess {
//     static mongooseInstance: any;
//     static mongooseConnection: Mongoose.Connection;
//     static connect(callback): Mongoose.Connection {
//         if (this.mongooseInstance) return this.mongooseInstance;
//         this.mongooseConnection = Mongoose.connection;
//         const connect = () => {
//             this.mongooseInstance = Mongoose.connect('mongodb://trailchallengerproddb:<insertYourPassword>@trailchallengerproddb.cluster-cq1o84i0aoyy.ap-southeast-1.docdb.amazonaws.com:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false', {
//                 ssl: true,
//                 sslValidate: false,
//                 sslCA: caObj.importFile,
//                 useNewUrlParser: true,
//                 useUnifiedTopology: true
//             } as any);
//         }
//         this.mongooseConnection.on('connected', () => {
//             console.log("MongoDB Connection Successful");
//         });
//         connectWithRetry();
//     }
// }
// DataAccess.connect(() => { });
// export = DataAccess;

// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');
// require('dotenv').config()
// const data = {
//     useNewUrlParser: true,
//     ssl: true,
//     sslValidate: false,
//     sslCA: path.resolve(__dirname, "./rds-combined-ca-bundle.pem")
// }

// console.log("EHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHEHEHEHEHEHEHEHEHEHEH", data)
// mongoose.connect('mongodb://trailchallengerproddb:trailchallengerproddb@trailchallengerproddb.cluster-cq1o84i0aoyy.ap-southeast-1.docdb.amazonaws.com:27017/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     ssl: true,
//     sslValidate: false,
//     sslCA: path.resolve(__dirname, "./rds-combined-ca-bundle.pem")
// })
// const conSuccess = mongoose.connection
// conSuccess.once('open', res => {
//     console.log('Database connected:', process.env.db)
// })

// conSuccess.on('error', err => {
//     console.error('connection error:', err)
// })

// process.on('SIGINT', async () => {
//     await mongoose.connection.close();
//     process.exit(0)
// })