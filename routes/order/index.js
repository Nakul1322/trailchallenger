const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const orderController = require('../../controllers/order')

router.get('/filterListForeFilled',
orderController.filterListForeFilled);

router.get('/get-all-orders',
    //checkUserValidity,
    orderController.allOrders);

router.post('/',
    //checkUserValidity,
    requestValidator(schema.addOrder),
    orderController.addOrder);

router.get('/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    orderController.findOrder);

router.put('/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateOrder),
    orderController.updateOrder);

router.delete('/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    orderController.deleteOrder);

module.exports = router