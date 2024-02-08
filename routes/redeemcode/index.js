const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const redeemController = require('../../controllers/redeemcode')

router.get('/redeemChallengeList',
    redeemController.redeemChallengeList);

router.post('/',
    requestValidator(schema.addRedeemCode),
    redeemController.addRedeemCode);

router.post('/get-all-redeem',
    redeemController.getAllRedeemCode);

router.post('/find-code',
    //checkUserValidity,
    redeemController.findRedeemCode);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    redeemController.deleteRedeemCode);

module.exports = router