const AWS = require('aws-sdk');
require('dotenv').config()

const imageUpload = async (base64, title) => {

    // Configure AWS with your access and secret key.
    const { ACCESS_KEY_ID, AWS_REGION, S3_BUCKET, SECRET_ACCESS_KEY } = process.env;
    //const SECRET_ACCESS_KEY = "nDSfyZTZHWt2pLn/Bw0aS95IFXZa62R/SboDeYLS"
    console.log("THIS IS MY ENV VARIABLES", ACCESS_KEY_ID, SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET)

    // Configure AWS to use promise
    AWS.config.setPromisesDependency(require('bluebird'));
    AWS.config.update({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY, region: AWS_REGION });

    // Create an s3 instance
    const s3 = new AWS.S3();

    const base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    // Getting the file type, ie: jpeg, png or gif
    const type = base64.split(';')[0].split('/')[1];

    // Generate a unique string to append to the title
    const timestamp = Date.now().toString();

    // With this setup, each time your user uploads an image, will be overwritten.
    // To prevent this, use a different Key each time.
    // This won't be needed if they're uploading their avatar, hence the filename, userAvatar.js.
    // Append the unique string to the title and set up the S3 upload parameters
    const params = {
        Bucket: S3_BUCKET,
        Key: title.trim() + '_' + timestamp, // type is not required
        Body: base64Data,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: 'image/jpeg' // required. Notice the back ticks
    }

    // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
    // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    let location = '';
    let key = '';
    try {
        const { Location, Key } = await s3.upload(params).promise();
        location = Location;
        key = Key;
    } catch (error) {
        // console.log(error)
    }

    // Save the Location (url) to your database and Key if needs be.
    // As good developers, we should return the url and let other function do the saving to database etc
    console.log(location, key);

    return location;
}

module.exports = imageUpload;