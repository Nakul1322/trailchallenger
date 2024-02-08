const nodemailer = require("nodemailer");
require("dotenv").config();
const path = require("path");
const { renderFile } = require("ejs");
const logger = require('../logger/wingston');

const sendEmail = async (file, email, subject, link) => {
  try {
    // const SMTP_USER = "AKIAZJZKYDP4PEDO4U6A";
    // const SMTP_PASS = "BFbxMeXFf4BxoXio2BnnioSruXrn4qnz6hZ7DnEZRkF9O";
    console.log(file, email, subject, link);
    const transporter = nodemailer.createTransport({
      host: "email-smtp.ap-southeast-1.amazonaws.com",
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    renderFile(`${appRoot}/views/${file}`, { link }, (err, dataTemplate) => {
      if (err) {
        logger.error(`***EMAIL MODULE***ERROR WHILE RENDERING EMAIL TEMPLATE: ${err}`);
        console.log("Error in rendering template file",err);
      } else {
        const mailOptions = {
          from: "Trail Challenger <support@trailchallenger.com>",
          to: email,
          subject: subject,
          html: dataTemplate,
        }
        transporter.sendMail(mailOptions, (err, data) => {
          if (err) {
            logger.error(`***EMAIL MODULE***ERROR WHILE SENDING EMAIL: ${err}`);
            console.log("Error while sending email" + err);
          } else {
            logger.info(`***EMAIL MODULE***EMAIL SENT SUCCESSFULLY TO: ${email} WITH MESSAGE ID: ${data.messageId}`);
            console.log("Email sent successfully: %s", data.messageId);
          }
        });
      }
    });
  } catch (error) {
    console.log("Email not sent caught exception");
  }
};

module.exports = sendEmail;
