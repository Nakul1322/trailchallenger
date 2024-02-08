const express = require('express');
const router = express.Router();
const { requestValidator } = require('../../middleware');
const schema = require('./schema');
const pinController = require('../../controllers/pin')

router.post('/',
    //requestValidator(schema.addPin),
    pinController.addPin);

router.get('/get-all-pins',
    pinController.getAllPin);

router.get('/:id',
    requestValidator(schema.getById, 'params'),
    pinController.findPin);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    pinController.deletePin);

router.put('/:id',
    requestValidator(schema.getById, 'params'),
    //requestValidator(schema.updatePin),
    pinController.updatePin);

router.get('/pinMap',
    pinController.pinMap);

module.exports = router