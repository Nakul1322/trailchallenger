const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const couponController = require('../../controllers/couponcode')

router.post('/',
    requestValidator(schema.addCouponCode),
    couponController.addCouponCode);

router.post('/get-all-coupon',
    couponController.getAllCouponCode);

router.post('/find-code',
    //checkUserValidity,
    couponController.findCouponCode);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    couponController.deleteCouponCode);

module.exports = router