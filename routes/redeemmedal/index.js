const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const redeemMedalController = require('../../controllers/redeemmedal')

router.post('/',
    redeemMedalController.addRedeemMedal);

router.get('/redeemMedalList',
    redeemMedalController.redeemMedalList);

router.put('/:id',
    redeemMedalController.updateRedeemMedal);

router.get('/findRedeemMedal/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    redeemMedalController.findRedeemMedal);

// router.delete('/:id',
//     requestValidator(schema.getById, 'params'),
//     redeemMedalController.deleteRedeemCode);

module.exports = router