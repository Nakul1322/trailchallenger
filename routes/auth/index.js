const express = require('express');
const router = express.Router();
const { requestValidator , checkUserValidity } = require('../../middleware');
const schema = require('./schema');
const authController = require('../../controllers/auth')
//i have not changed the routes "-" as they are already implemented in admin and user end as of now 
router.post('/register', requestValidator(schema.register), authController.register)

router.get('/verification-email/:id/:token', authController.verificationEmail);

router.get('/timestamp', authController.currentTime)

router.post('/login' , requestValidator(schema.login), authController.login)

router.post('/forgot-password', checkUserValidity , requestValidator(schema.forgotPassword), authController.forgotPassword)

router.post('/reset-password/:type/:userId/:token',  requestValidator(schema.resetPassword), authController.resetPassword)

router.post('/resend-email' , authController.resendVerificationEmail)

router.post('/checkVerifiedUser' , authController.checkVerifiedUser)

module.exports = router