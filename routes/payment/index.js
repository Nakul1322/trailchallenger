const express = require('express');
const router = express.Router();
const { requestValidator } = require('../../middleware');
// const schema = require('./schema');
const paymentController = require('../../controllers/payment')

router.post('/paymentSuccessful',
    // requestValidator(schema.paymentSuccess),
    paymentController.newPaymentSuccess);

router.post('/payment-sheet',
    // requestValidator(schema.paymentSheet),
    paymentController.paymentSheet);

router.post('/webhook',
    paymentController.webHook);

router.get('/paymentList',
    paymentController.paymentRecord);

module.exports = router