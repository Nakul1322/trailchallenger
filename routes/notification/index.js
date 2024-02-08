const express = require('express');
const router = express.Router();
const { requestValidator } = require('../../middleware');
const schema = require('./schema');
const notificationController = require('../../controllers/notification')

router.get('/get-all-notifications',
    notificationController.getAllNotification);

router.post('/',
    requestValidator(schema.addNotification),
    notificationController.addNotification);

router.get('/:id',
    requestValidator(schema.getById, 'params'),
    notificationController.findNotification);

router.put('/:id',
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateNotification),
    notificationController.updateNotification);

router.delete('/:id/:userId',
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.getByUserId, 'params'),
    notificationController.deleteNotification);

module.exports = router