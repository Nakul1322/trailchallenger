const express = require("express");
var bodyParser = require("body-parser");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
const cors = require("cors");
require("./helpers/database");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");
const path = require("path");
const https = require("https");
const fs = require("fs");

global.appRoot = path.join(__dirname);
const routes = require("./routes");
const { db } = require("./models/user");
const logger = require("./logger/wingston");

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// if (app.get('env') == 'production') {
//   app.use(morgan('common', { skip: function(req, res) { return res.statusCode < 400 }, stream: __dirname + '/../morgan.log' }));
// } else {
//   app.use(morgan('dev'));
// }
// app.use(morgan("dev"));
app.use(
  morgan(':remote-addr - [:date] :method :url :status - :response-time ms', {
    stream: logger.stream,
  })
);
app.use(express.json());
app.use(cors());
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    backend: {
      loadPath: "./locales/{{lng}}//translation.json",
    },
  });
app.use(middleware.handle(i18next));
app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(routes);

app.use(async (req, res, next) => {
  next(createError.NotFound("This route does not exist"));
});
// var options = {
//   key: fs.readFileSync('/etc/ssl/trail.key'),
//   cert: fs.readFileSync('/etc/ssl/trail.crt'),
// };

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`server running on port ${PORT}`);
  console.log(`server running on port ${PORT}`);
});

//https.createServer(options, app).listen(process.env.HTTPS_PORT, console.log(`Secure server running on port ${process.env.HTTPS_PORT}`));

// var MongoClient = require('mongodb').MongoClient

//Create a MongoDB client, open a connection to DocDB; as a replica set,
//  and specify the read preference as secondary preferred

// var client =  MongoClient.connect(
//     process.env.dbAWS,
//     {
//         tlsCAFile: path.resolve(__dirname, "./rds-combined-ca-bundle.pem") //Specify the DocDB; cert
//     },
//     function (err, client) {
//         if (err) {
//             console.error('connection error:', err)
//         }
//         else {
//             console.log('Database connected:',process.env.dbAWS)
//         }
//         //Specify the database to be used
//         db = client.db('trailChallenger');

//         col = db.collection('guestusers');
//         col2 = db.collection('users');
//         col3 = db.collection('tokens');
//         col4 = db.collection('myhikes');
//         col5 = db.collection('leaderboards');
//         const findGuestUser = db.collection("guestusers").findOne({ deviceId: req.body.deviceId })
//         console.log(findGuestUser);

//     //Insert a single document
//     col.insertOne({'Name':'Nakul', 'Phone number':'1234567890'}, function(err, result){
//       //Find the document that was previously written
//       col.findOne({'Name':'Nakul'}, function(err, result){
//         //Print the result to the screen
//         console.log(result);

//         client.close()
//     });
